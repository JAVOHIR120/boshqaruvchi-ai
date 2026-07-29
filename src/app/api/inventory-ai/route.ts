import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        // Hamma mahsulotlarni olish
        const products = await prisma.product.findMany({
            orderBy: { quantity: "desc" }
        });

        if (!products || products.length === 0) {
            return NextResponse.json({ reply: "Hozircha omborda mahsulotlar kiritilmagan. Ma'lumot yo'q." }, { status: 200 });
        }

        const totalStockValue = products.reduce((sum, p) => sum + (p.quantity * (p.costPrice || 0)), 0);
        const totalRetailValue = products.reduce((sum, p) => sum + (p.quantity * p.price), 0);
        const totalItems = products.length;
        
        // Defitsit tovarlar (qoldig'i 0 yoki manfiy, yoxud judayam kam)
        const lowStockProducts = products.filter(p => p.quantity <= 5).map(p => `${p.name} - Qoldiq: ${p.quantity} (Tannarxi: ${p.costPrice} UZS)`).join("\n");
        
        // O'lik kapital / Ko'p qoldiq (eng ko'p qoldiqqa ega tovarlar)
        const overstockedProducts = products.filter(p => p.quantity > 50).map(p => `${p.name} - Qoldiq: ${p.quantity} (Jami muzlatilgan sarmoya: ${(p.quantity * (p.costPrice || 0)).toLocaleString()} UZS)`).join("\n");

        const prompt = `Siz Boshqaruvchi AI (Enterprise-Grade AI) tizimining "Katta Ombor va Logistika Bo'yicha Strategik Tahlilchisi"siz.
Sizning maqsadingiz korxona rahbariga va ombor mudiriga zaxiralarni optimallashtirish, defitsitni oldini olish va "qotib qolgan sarmoya"ni (dead stock) harakatga keltirish bo'yicha professional, keskin va foydali maslahat berish.

📊 OMBORNING JORIY HOLATI (DATA):
- Jami xil tovarlar soni: ${totalItems} ta
- Ombordagi tovarlarning jami tannarxi (Muzlatilgan kapital): ${totalStockValue.toLocaleString()} UZS
- Potensial sotuv qiymati: ${totalRetailValue.toLocaleString()} UZS
- Potensial foyda (Marja): ${(totalRetailValue - totalStockValue).toLocaleString()} UZS

⚠️ KRITIK DEFITSIT (Qoldig'i xavfli darajada kam yoki tugagan tovarlar - max 5 ta):
${lowStockProducts || "Hozircha xavfli darajada kamaygan tovarlar yo'q."}

📦 QOTIB QOLGAN SARMOYA (Qoldig'i juda ko'p bo'lgan tovarlar - max 5 ta):
${overstockedProducts || "Hozircha me'yordan ortiq tovarlar yo'q."}

Sizning vazifangiz O'zbek tilida, qat'iy va professional (rahbarbop) uslubda quyidagi hisobotni Markdown formatida taqdim etish:

1. **Joriy Ombor Holati:** Qisqacha xulosa. Qotib qolgan kapital va kutilayotgan foyda miqdori bo'yicha baxo bering.
2. **Defitsit Xavfi (Zudlik bilan xarid qilinishi kerak):** Qaysi tovarlar tugayotganini va ularni olib kelmaslik qanday zarar keltirishini tushuntiring.
3. **Qotib Qolgan Sarmoyani Harakatga Keltirish (Dead Stock Optimization):** Qaysi tovarlarda juda ko'p kapital yotibdi? Ularni tezroq pullash uchun qanday marketing/chegirma/yoki uchinchi tomon yechimlarini qo'llash mumkinligini maslahat bering.
4. **Anomaliya va Xavfsizlik bo'yicha maslahat:** Tizimdagi g'alati holatlar (agar manfiy qoldiq bo'lsa) haqida qattiq ogohlantirish bering, inventarizatsiya (Sleplaya audit) o'tkazishni maslahat bering.

Matn uzun bo'lmasin, o'qilishi oson va vizual chiroyli (emojilardan rasmiy me'yorda foydalaning) bo'lishi shart.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                temperature: 0.3, // Professional va aniq bo'lishi uchun pastroq harorat
            }
        });

        const reply = response.text || "Uzr, tahlil qilishda nosozlik yuz berdi.";

        return NextResponse.json({ reply }, { status: 200 });
    } catch (error) {
        console.error("Inventory AI xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}
