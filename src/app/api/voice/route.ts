import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt || typeof prompt !== "string") {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        let systemPrompt = `Siz "Boshqaruvchi AI" platformasining ovozli maslahatchisisiz. Xuddi J.A.R.V.I.S kabi ovozli tarzda javob berasiz.
        
MAJBURIY QOIDALAR:
1. Juda qisqa va lo'nda javob bering, chunki javobingiz ovozga (Text-to-Speech) o'giriladi.
2. Hech qanday markdown belgilari ishlatmang (* yoki # yoki -), chunki ularni robot o'qiy olmaydi.
3. Raqamlarni va so'zlarni faqat harflar va sodda so'zlar bilan bering (masalan: un ikki emas o'n ikki).
4. Ohangingiz aniq, malakali, jiddiy, lekin yordamga tayyor biznes hamkoridek (McKinsey usuli). 
Javobingiz 1-2 gapdan iborat bo'lsin.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.6,
                maxOutputTokens: 800 // Give enough space so it doesn't artificially cut off
            }
        });

        const reply = response.text || "Kechirasiz, meni tushunishda xatolik ketdi.";

        return NextResponse.json({ reply }, { status: 200 });

    } catch (error) {
        console.error("Voice AI Error:", error);
        return NextResponse.json(
            { error: "Ovozli maslahatchi xizmati vaqtincha ishlamayapti." },
            { status: 500 }
        );
    }
}

