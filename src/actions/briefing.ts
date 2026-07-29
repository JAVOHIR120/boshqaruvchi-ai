"use server";

import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateDailyBriefing(companyId: string) {
    console.log("Starting generateDailyBriefing for companyId:", companyId);
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables.");
        return { success: false, error: "Tizim sozlamalarida xatolik (API Key topilmadi)." };
    }

    const ai = new GoogleGenerativeAI(apiKey);

    try {
        if (!companyId) {
            throw new Error("companyId is required but was not provided.");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        console.log("Fetching database statistics...");
        const [taxes, contracts, tasks, employees] = await Promise.all([
            prisma.taxReport.findMany({
                where: { companyId, status: { in: ["PENDING", "OVERDUE"] }, dueDate: { lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) } }
            }),
            prisma.contract.findMany({
                where: { companyId, status: "ACTIVE" },
                take: 5
            }),
            prisma.kanbanTask.findMany({
                where: { companyId, status: "TODO" },
                orderBy: { createdAt: "desc" },
                take: 3
            }),
            prisma.employee.count({ where: { companyId } })
        ]).catch(err => {
            console.error("Prisma query failed in generateDailyBriefing:", err);
            throw new Error("Ma'lumotlar bazasidan ma'lumot olishda xatolik yuz berdi.");
        });

        console.log(`Fetched data: taxes=${taxes.length}, contracts=${contracts.length}, tasks=${tasks.length}, employees=${employees}`);

        const prompt = `SIZ "Boshqaruvchi AI" TIZIMINING OLIY DARAJALI STRATEGIK ASISTENTISIZ.
Rahbar uchun bugungi kunlik hisobotni tayyorlang. Hisobot professional, tushunarli va motivatsion ruhda bo'lishi kerak.

MA'LUMOTLAR:
- Soliqlar: ${taxes.length} ta muddati yaqinlashayotgan soliq bor.
- Shartnomalar: ${contracts.length} ta faol shartnoma.
- Yangi vazifalar: ${tasks.map(t => t.title).join(", ") || "Yangi vazifalar yo'q"}.
- Jami xodimlar: ${employees} ta.

KO'RSATMA:
1. Hisobotni chiroyli strukturaga keltiring (emojilardan foydalaning).
2. Quyidagi bo'limlarni kiriting:
   - 🌅 Kirish (Xayrli tong bilan).
   - 📊 Bugungi ustuvor vazifalar (Top 3).
   - 📋 Shartnomalar va Rejalar.
   - 💡 Strategik maslahat (biznesni rivojlantirish uchun).
3. Ohang: Professional, motivatsion va jiddiy.
4. O'zbek tilida yozing. Matnni qisqa va mazmunli qiling.
`;

        console.log("Calling Gemini API for briefing text generation...");
        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt).catch(err => {
            console.error("Gemini API call failed in generateDailyBriefing:", err);
            throw new Error(`AI orqali hisobot tayyorlashda uzilish yuz berdi: ${err.message || 'Nomaʼlum xatolik'}`);
        });

        const briefingText = result.response.text().trim();
        console.log("Briefing text generated successfully.");

        return { success: true, text: briefingText };
    } catch (error: any) {
        console.error("CRITICAL: generateDailyBriefing failed:", error);
        return { success: false, error: error.message || "Hisobot tayyorlashda xatolik yuz berdi." };
    }
}

