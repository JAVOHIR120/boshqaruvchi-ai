import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const { type, partyA, partyB, amount, jurisdiction, additionalTerms } = await req.json();

        if (!type || !partyA || !partyB) {
            return NextResponse.json({ error: "Barcha kerakli maydonlar (turi, tomonlar) kiritilmagan." }, { status: 400 });
        }

        const prompt = `Siz Boshqaruvchi AI tizimining Bosh Huquqshunosi (Katta Yurist)siz. 
Sizning vazifangiz berilgan qisqacha ma'lumotlarga asosan to'liq, professional va yuridik jihatdan kuchga ega bo'lgan shartnoma matnini yaratish.

SHARTNOMA MA'LUMOTLARI:
- Shartnoma turi: ${type}
- 1-Tomon (Buyurtmachi/Sotuvchi): ${partyA}
- 2-Tomon (Ijrochi/Xaridor): ${partyB}
- Summa: ${amount ? amount + " so'm" : "Kelishuv asosida"}
- Qonunchilik standarti: ${jurisdiction === "UZ" ? "O'zbekiston Respublikasi Fuqarolik Kodeksi" : "Xalqaro tijorat huquqi (SISC/Incoterms)"}
- Qo'shimcha shartlar: ${additionalTerms || "Yo'q"}

Talablar:
1. Shartnoma qat'iy yuridik tilda yozilsin (O'zbek tilida).
2. Quyidagi bo'limlar bo'lishi shart: Umumiy qoidalar, Tomonlarning huquq va majburiyatlari, To'lov tartibi, Fors-major, Nizolarni hal qilish tartibi, Yakuniy qoidalar, Tomonlarning rekvizitlari.
3. Agar O'zbekiston qonunchiligi tanlangan bo'lsa, ma'suliyat va penya (0.4% gacha) kabi standart bandlarni qo'shing. Agar xalqaro bo'lsa, xalqaro arbitrajni eslatib o'ting.
4. Javobingiz faqat shartnomaning toza matni (Markdown) bo'lishi kerak. Hech qanday boshqa salomlashish so'zlari qo'shmang.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                temperature: 0.2, // Low temp for formal legal text
            }
        });

        const contractText = response.text || "Uzr, shartnoma yaratishda nosozlik yuz berdi.";

        return NextResponse.json({ contractText }, { status: 200 });
    } catch (error) {
        console.error("AI Contract Gen xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

