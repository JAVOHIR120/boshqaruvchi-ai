import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Invalid request format" }, { status: 400 });
        }

        // 1. O'zbekiston Qonunchiligi (Lex.uz) ma'lumotlari
        const knowledgeDocs = await prisma.knowledgeDocument.findMany();

        // 2. Moliya va Biznes ma'lumotlarini chuqur yig'ish (Strategic Analysis)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [transactions, leads, employees] = await Promise.all([
            prisma.transaction.findMany({ where: { date: { gte: sixMonthsAgo } } }),
            prisma.lead.findMany(),
            prisma.employee.findMany({ include: { user: true } })
        ]);

        // Moliya Tahlili
        const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
        
        // Oylik daromad/xarajat trendi
        const monthlyData = transactions.reduce((acc: any, t) => {
            const month = t.date.toISOString().substring(0, 7);
            if (!acc[month]) acc[month] = { income: 0, expense: 0 };
            if (t.type === "INCOME") acc[month].income += t.amount;
            else acc[month].expense += t.amount;
            return acc;
        }, {});

        // CRM Tahlili
        const wonLeads = leads.filter(l => l.status === "WON").length;
        const pipelineValue = leads.filter(l => l.status !== "WON" && l.status !== "LOST").reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

        // Jamoa Tahlili (Efficiency Basics)
        const activeEmployees = employees.length;
        const avgPerformance = employees.reduce((sum, e) => sum + e.performance, 0) / (activeEmployees || 1);

        // 3. Strategic Prompt Creation
        let systemPrompt = `SIZ "Boshqaruvchi AI" TIZIMINING STRATEGIK BIZNES ANALITIGISIZ.
Sizning uslubingiz: Professional, tahliliy, ma'lumotlarga asoslangan va dadil (McKinsey/BCG darajasida).

MAJBURIY FORMAT (Har bir javobda):
1. **Holat Tahlili**: Joriy raqamlarning qisqa va londa xulosasi.
2. **Bashorat (Predictive Insight)**: Trendlarga asoslangan kelgusi 30-60 kunlik taxmin.
3. **Strategik Tavsiya**: Kamida bitta qat'iy va amaliy maslahat.
4. **Confidence Score**: Ma'lumotlar miqdoriga qarab (0-100%) aniqlik darajangiz.

KORXONA MA'LUMOTLARI:
- Moliya (So'nggi 6 oy): Jami Daromad: ${totalIncome.toLocaleString()} so'm, Xarajat: ${totalExpense.toLocaleString()} so'm.
- Oylik Trend: ${JSON.stringify(monthlyData)}
- CRM: Muvaffaqiyatli sotuvlar: ${wonLeads} ta. Voronka (Pipeline): ${pipelineValue.toLocaleString()} so'm.
- HR: Faol xodimlar: ${activeEmployees} ta. O'rtacha samaradorlik: ${avgPerformance.toFixed(1)}%.
- Bilimlar bazasi (Qonunchilik): ${knowledgeDocs.map(d => d.title).join(", ") || "Hozircha kiritilmagan"}.

Savollarga ushbu ma'lumotlar va O'zbekiston qonunchiligiga tayanib javob bering.`;

        // 4. Messages for Gemini
        const geminiMessages = messages.map((msg: any) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content || "" }],
        }));

        let response;
        try {
            response = await ai.models.generateContent({
                model: "gemini-2.5-flash-lite",
                contents: geminiMessages,
                config: {
                    systemInstruction: systemPrompt,
                    temperature: 0.2,
                }
            });
        } catch (aiError: any) {
            console.error("Gemini API Error:", aiError);
            if (aiError.message?.includes("503") || aiError.message?.includes("high demand")) {
                return NextResponse.json(
                    { error: "AI tizimi hozirda band. Iltimos, bir necha soniyadan so'ng qayta urinib ko'ring." },
                    { status: 503 }
                );
            }
            throw aiError;
        }

        const aiResponse = response.text || "Kechirasiz, tahlil tayyorlashda xatolik yuz berdi.";

        return NextResponse.json({ reply: aiResponse }, { status: 200 });
    } catch (error) {
        console.error("AI Strategic Analyst Error:", error);
        return NextResponse.json(
            { error: "Strategik tahlil tizimi vaqtincha ishlamayapti. Iltimos, birozdan so'ng urinib ko'ring." },
            { status: 500 }
        );
    }
}
