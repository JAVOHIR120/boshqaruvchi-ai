import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { contractText, jurisdiction } = await req.json();

        if (!contractText || contractText.length < 50) {
            return NextResponse.json({ error: "Shartnoma matni juda qisqa yoki bo'sh." }, { status: 400 });
        }

        const prompt = `Siz malakali xalqaro va O'zbekiston yuristisiz. 
Men sizga bitta shartnomani beraman. Sizning vazifangiz shartnomani o'qib chiqib, yashirin xavflarni (risklarni) va ehtimoliy moliyaviy zararlarni aniqlash. 
Qoidalarni asosan ${jurisdiction === "UZ" ? "O'zbekiston Respublikasi (Fuqarolik va Soliq Kodeksi)" : "Xalqaro tijorat standartlari (Incoterms)"} bo'yicha tahlil qiling.

Shartnoma matni:
"""${contractText}"""

Quyidagi formatda O'zbek tilida (Markdown) aniq va lo'nda tahlil bering:
1. 🛡️ **Umumiy Baho (Risk darajasi)**: (Past / O'rta / Yuqori) va nima uchun?
2. ⚠️ **Yashirin Xatarlar (Qizil bayroqlar)**: Faqat faktik xatolar yoki shubhali/xavfli bandlarni ko'rsating (jarimalar, for-major).
3. 💼 **Yuridik Tavsiya**: Shartnomani "Imzolash", "Tahrirlash orqali imzolash" yoki "Rad etish" maslahatini hamda sababini bitta gapda bering.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                temperature: 0.1, // Highly precise and deductive
            }
        });

        const analysis = response.text || "Tahlil qilib bo'lmadi.";

        return NextResponse.json({ analysis }, { status: 200 });
    } catch (error) {
        console.error("AI Contract Analyzer xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

