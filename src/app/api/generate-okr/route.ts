import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || !user.companyId) {
            return NextResponse.json({ error: "Avtorizatsiya xatosi" }, { status: 401 });
        }

        const { objective } = await req.json();

        if (!objective) {
            return NextResponse.json({ error: "Maqsad kiritilmadi" }, { status: 400 });
        }

        // Xodimlar ro'yxatini olish (real ismlar bilan aqlli taqsimlash uchun)
        const employees = await prisma.employee.findMany({
            where: { companyId: user.companyId },
            include: { user: true }
        });

        const employeeNames = employees.map(e => e.user?.name || "Noma'lum");
        const employeeList = employeeNames.length > 0
            ? employeeNames.join(", ")
            : "Jamoa a'zolari (hozircha ism kiritilmagan)";

        // Mavjud vazifalarni olish (yuklama taqsimoti uchun)
        const existingTasks = await prisma.kanbanTask.findMany({
            where: { companyId: user.companyId, status: { not: "DONE" } },
            select: { assignedTo: true }
        });

        const workloadMap: Record<string, number> = {};
        existingTasks.forEach(t => {
            if (t.assignedTo) {
                workloadMap[t.assignedTo] = (workloadMap[t.assignedTo] || 0) + 1;
            }
        });

        const workloadInfo = Object.entries(workloadMap)
            .map(([name, count]) => `${name}: ${count} ta faol vazifa`)
            .join("; ") || "Hamma bo'sh";

        const prompt = `Siz "Boshqaruvchi AI" tizimining oliy darajali biznes strategisiz. O'zbekiston korxonasi rahbari quyidagi GLOBAL MAQSADNI kiritdi:

"${objective}"

Kompaniya xodimlari: ${employeeList}
Hozirgi ish yuklama: ${workloadInfo}

HAQIQIY TALABLAR:
1. Ushbu maqsadga erishish uchun 4-7 ta ANIQ, O'LCHANADIGAN, HARAKATGA UNDOVCHI vazifa (Key Result) yarating.
2. Har bir vazifani YUQORIDAGI RO'YXATDAGI aniq xodimga biriktiring — ish yuklamasi bo'yicha TENG taqsimlang.
3. Har bir vazifaga ustuvorlik (priority) belgilang: "HIGH", "MEDIUM" yoki "LOW".
4. Har bir vazifaga AI maslahati (aiNotes) yozing — qanday qilib muvaffaqiyatli bajarish bo'yicha 1 qatorli maslahat.
5. Har bir vazifaga daysOffset (bugundan necha kun muddat) belgilang (7-90 kun oralig'ida).

Javobingiz FAQAT quyidagi JSON massiv formatida bo'lsin (boshqa text YO'Q, markdown YO'Q):
[
  {
    "title": "[AI] Vazifa nomi",
    "description": "Batafsil tavsif va bajarish mezonlari",
    "assignedTo": "Xodim ismi",
    "priority": "HIGH",
    "aiNotes": "Qisqa maslahat",
    "daysOffset": 14
  }
]

FAQAT O'zbek tilida yozing. Har bir vazifa nomi "[AI]" prefiksi bilan boshlansin.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                temperature: 0.2,
            }
        });

        const reply = response.text || "[]";

        let tasks = [];
        try {
            const jsonStr = reply.replace(/```json/gi, "").replace(/```/g, "").trim();
            tasks = JSON.parse(jsonStr);
        } catch {
            console.error("AI notog'ri JSON qaytardi:", reply);
            return NextResponse.json({ error: "AI tasdiqlanmagan formatda javob qaytardi. Iltimos yana urinib ko'ring." }, { status: 500 });
        }

        if (!Array.isArray(tasks) || tasks.length === 0) {
            return NextResponse.json({ error: "AI kutilgan ro'yxatni bermadi." }, { status: 500 });
        }

        // Barcha vazifalarni Kanban doskaga yozish
        const createdTasks = await Promise.all(
            tasks.map(async (t: any) => {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + (t.daysOffset || 30));

                // Xodim ismining haqiqiyligini tekshirish
                const validAssignee = employeeNames.includes(t.assignedTo) ? t.assignedTo : (employeeNames[0] || "Jamoa");

                return prisma.kanbanTask.create({
                    data: {
                        title: t.title || "[AI] Yangi Vazifa",
                        description: t.description || "Tavsifi yo'q",
                        assignedTo: validAssignee,
                        priority: ["HIGH", "MEDIUM", "LOW"].includes(t.priority) ? t.priority : "MEDIUM",
                        aiNotes: t.aiNotes || null,
                        status: "TODO",
                        dueDate: dueDate,
                        companyId: user.companyId
                    }
                });
            })
        );

        return NextResponse.json({
            success: true,
            count: createdTasks.length,
            tasks: createdTasks.map(t => ({
                id: t.id,
                title: t.title,
                assignedTo: t.assignedTo,
                priority: t.priority,
                aiNotes: t.aiNotes
            }))
        }, { status: 200 });
    } catch (error) {
        console.error("AI OKR xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

