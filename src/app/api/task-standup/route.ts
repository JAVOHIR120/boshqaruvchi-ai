import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || !user.companyId) {
            return NextResponse.json({ error: "Avtorizatsiya xatosi" }, { status: 401 });
        }

        // Barcha vazifalar
        const tasks = await prisma.kanbanTask.findMany({
            where: { companyId: user.companyId },
        });

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Statistika
        const todoTasks = tasks.filter(t => t.status === "TODO");
        const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
        const doneTasks = tasks.filter(t => t.status === "DONE");
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE");

        // Bugun tugatilgan vazifalar
        const todayDone = doneTasks.filter(t => new Date(t.updatedAt) >= todayStart);

        // Eng ko'p ishlagan xodim (DONE tasklar bo'yicha)
        const performanceMap: Record<string, number> = {};
        doneTasks.forEach(t => {
            if (t.assignedTo) {
                performanceMap[t.assignedTo] = (performanceMap[t.assignedTo] || 0) + 1;
            }
        });

        const topPerformer = Object.entries(performanceMap)
            .sort(([, a], [, b]) => b - a)[0];

        // AI Kundalik hisobot
        let aiSummary = "";
        if (tasks.length === 0) {
            aiSummary = "📋 Hozircha kompaniyada hech qanday vazifa yo'q.\n\n💡 Boshlash uchun \"AI Vazifa Yaratish\" tugmasini bosing va bitta katta maqsad kiriting — AI jamoangizga vazifalarni avtomatik taqsimlab beradi.";
        } else {
            try {
                const prompt = `Siz professional biznes boshqaruv AI tizimisiz. Kompaniya rahbariga bugungi kunning QISQA HULOSA hisobotini yozing.

Ma'lumotlar:
- Jami vazifalar: ${tasks.length}
- Tugatildi: ${doneTasks.length} (bugun: ${todayDone.length})
- Jarayonda: ${inProgressTasks.length}
- Kutilmoqda: ${todoTasks.length}
- Muddati o'tganlar: ${overdueTasks.length}
- Eng samarali xodim: ${topPerformer ? `${topPerformer[0]} (${topPerformer[1]} ta vazifa tugatgan)` : "hali aniqlanmagan"}

5-6 qatorlik PROFESSIONAL va QISQA hisobot yozing. Statistikani sonlar bilan keltiring. Yaxshi va yomon tomonlarni birdaniga baholang. O'zbek tilida, oddiy tushunarli tilda. Emoji ishlatishing mumkin ✅❌⚡📊.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-lite",
                    contents: prompt,
                    config: { temperature: 0.4 }
                });
                aiSummary = response.text?.trim() || "Hisobot yaratib bo'lmadi.";
            } catch (err) {
                console.error("AI Stand-up summary xatosi:", err);
                aiSummary = `📊 Bugungi holat:\n✅ Tugatildi: ${doneTasks.length} | ⚡ Jarayonda: ${inProgressTasks.length} | 📋 Kutilmoqda: ${todoTasks.length}\n${overdueTasks.length > 0 ? `⚠️ Muddati o'tgan: ${overdueTasks.length} ta vazifa` : "✅ Barcha vazifalar muddatida"}`;
            }
        }

        return NextResponse.json({
            summary: aiSummary,
            stats: {
                total: tasks.length,
                done: doneTasks.length,
                todayDone: todayDone.length,
                todo: todoTasks.length,
                inProgress: inProgressTasks.length,
                overdue: overdueTasks.length
            },
            topPerformer: topPerformer ? { name: topPerformer[0], count: topPerformer[1] } : null,
            overdueList: overdueTasks.map(t => ({
                title: t.title,
                assignedTo: t.assignedTo,
                dueDate: t.dueDate
            }))
        });

    } catch (error) {
        console.error("Stand-up xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

