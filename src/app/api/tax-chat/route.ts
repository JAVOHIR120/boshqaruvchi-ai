import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "AIzaSyBk69bHah9EWBBb1SNGB4ezBUBRkhNzNqE",
});

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "Xabarlar formati noto'g'ri." }, { status: 400 });
        }

        // --- FETCH DATABASE CONTEXT ---
        const taxes = await prisma.taxReport.findMany({
            orderBy: { dueDate: 'asc' },
            take: 10
        });

        const incomeResult = await prisma.transaction.aggregate({
            where: { type: 'INCOME' },
            _sum: { amount: true }
        });
        const income = incomeResult._sum.amount || 0;

        const expenseResult = await prisma.transaction.aggregate({
            where: { type: 'EXPENSE' },
            _sum: { amount: true }
        });
        const expense = expenseResult._sum.amount || 0;

        const dbContext = `
[KORXONANING JORIY HOLATI BAZADAN OLINDI]
1) Mavjud va kutilayotgan soliq hisobotlari:
${taxes.length > 0 ? taxes.map((t: any) => `- ${t.name}: Miqdori ${t.amount} so'm, Holati: ${t.status}, Muddat: ${t.dueDate.toISOString().split('T')[0]}, Davr: ${t.period}`).join('\n') : "Hozircha soliq hisobotlari yo'q."}

2) Umumiy Moliyaviy Holat:
- Jami Tushumlar (Daromad): ${income} so'm
- Jami Xarajatlar: ${expense} so'm
- Sof Qoldiq: ${income - expense} so'm
`;

        const systemInstruction = `Siz Boshqaruvchi AI tizimidagi 'Soliq AI Maslahatchisi' va 'Biznes Rahbar'siz.
Qoidalaringiz:
1. Siz foydalanuvchiga soliq, moliya, biznes strategiyasi va O'zbekiston Respublikasi Soliq Kodeksi bo'yicha maslahat berasiz.
2. Javoblaringiz qisqa, aniq, lo'nda va professionallik bilan yozilishi kerak. Xuddi yetuk biznes maslahatchi kabi muomalada bo'ling.
3. Foydalanuvchi "salom" yoki oddiy gap yozganda ham unga mos professional javob qaytaring, darhol qonunlarni tiqishtirmang. Diqqat bilan uni eshitib, muammosiga yechim taklif qiling.
4. Foydalanuvchi korxona holati yoki soliqlari haqida so'rasa, faqat quyidagi BAZADAGI MA'LUMOTLAR dan foydalaning. O'zingizdan umuman raqam yoki soliq miqdorlarini to'qimang. Tizimdagi raqamlarni O'zbekiston soliq kodeksiga solib tahlil qiling.

${dbContext}`;

        // The Gemini API strictly requires the conversation history to start with a "user" block.
        // We filter out the initial static greeting from the AI if it's the first message.
        let chatHistory = messages;
        if (chatHistory.length > 0 && chatHistory[0].role === "ai") {
            chatHistory = chatHistory.slice(1);
        }

        // Format messages for Gemini API
        const formattedContents = chatHistory.map((msg: any) => ({
            role: msg.role === "ai" ? "model" : "user",
            parts: [{ text: msg.text }]
        }));

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: formattedContents,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        const reply = response.text || "Kechirasiz, hozir tarmoqda uzilish bor. Iltimos qayta urinib ko'ring.";

        return NextResponse.json({ reply }, { status: 200 });

    } catch (error) {
        console.error("Tax AI Error:", error);
        return NextResponse.json(
            { error: "Soliq AI xizmati vaqtincha ishlamayapti." },
            { status: 500 }
        );
    }
}

