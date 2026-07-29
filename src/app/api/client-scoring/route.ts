import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
    try {
        const leads = await prisma.lead.findMany({
            orderBy: { estimatedValue: "desc" }
        });

        if (!leads || leads.length === 0) {
            return NextResponse.json({ reply: "Hozircha CRM bazada yetarli mijozlar yo'q. Avval mijoz qo'shing." }, { status: 200 });
        }

        const leadData = leads.map(l => `- ${l.name} (${l.companyName || 'Jismoniy shaxs'}) | Kutilyotgan/Tushgan daromad: ${l.estimatedValue}$ | Holati: ${l.status}`).join("\n");

        const prompt = `Siz Boshqaruvchi AI tizimining Bosh Sotuv Tahlilchisisiz (CRM AI).
Sizning vazifangiz korxonaning mijozlar bazasini tahlil qilib, ularni daromad keltirish potensialiga va holatiga qarab toifalarga (A-Class, B-Class, C-Class) ajratish.

Mana mijozlar ro'yxati:
${leadData}

Iltimos, O'zbek tilida quyidagi hisobotni tayyorlang (Markdown formatida):
1. 🌟 **A-Klass Mijozlar (VIP)**: Ro'yxatdagi eng ko'p pul keltiradigan (yoki keltirishi aniq kutilayotgan) top mijozlarni ajratib ko'rsating va nima uchun ular A-klass ekanligini izohlang. Ular bilan aloqani qanday davom ettirish kerak?
2. 📈 **B-Klass Mijozlar (Potensial)**: O'rta darajadagi mijozlar, kelajakda A-klassga o'tish ehtimoli bo'lganlar (masalan: Yangi yoki Uchrashuv belgilangan o'rta byudjetlilar). Ular bilan qanday ishlash kerak?
3. ❄️ **C-Klass Mijozlar (Risk / Quyi)**: Rad etilgan yoki juda kam pul keltiruvchi mijozlar. Ularga kamroq vaqt sarflash yoki avtomatizatsiyadan foydalanish bo'yicha maslahat.
4. 💡 **Sotuv Menejeri uchun Qisqacha Xulosa**: Faqat bitta aniq, foydali, amaliy ("Actionable") qadam ayting.

Faqat professional biznes tilida, tushunarli va ravon matn yozing. Bo'g'ma va murakkab jumlalar ishlatmang.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        const reply = response.text || "Uzr, mijozlarni tahlil qilishda nosozlik yuz berdi.";

        return NextResponse.json({ reply }, { status: 200 });
    } catch (error) {
        console.error("AI Client Scoring xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

