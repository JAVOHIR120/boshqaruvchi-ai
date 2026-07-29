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
            return NextResponse.json({ reply: "Hozircha CRM bazada yetarli mijozlar yo'q. Dastlab mijozlarni kiriting." }, { status: 200 });
        }

        const stats = {
            total: leads.length,
            won: leads.filter(l => l.status === "WON").reduce((a, b) => a + (b.estimatedValue || 0), 0),
            pipeline: leads.filter(l => l.status !== "WON" && l.status !== "LOST").reduce((a, b) => a + (b.estimatedValue || 0), 0),
            new: leads.filter(l => l.status === "NEW").length,
            contacted: leads.filter(l => l.status === "CONTACTED").length,
            qualified: leads.filter(l => l.status === "QUALIFIED").length,
        };

        const topLeads = leads
            .filter(l => l.status === "QUALIFIED" || l.status === "CONTACTED")
            .slice(0, 5)
            .map(l => `${l.name} (${l.companyName || 'Noma\'lum'}) - ${l.estimatedValue}$ [Holati: ${l.status}]`)
            .join("\n");

        const prompt = `Siz Boshqaruvchi AI tizimining Data Analyst va Sotuv bo'yicha Strategik Maslahatchisisiz.
Quyida korxonaning joriy sotuv qobiliyati va voronkasi (Sales Funnel) ko'rsatkichlari berilgan:

📊 UMUMIY HOLAT:
- Jami mijozlar: ${stats.total}
- Yopilgan (Sotilgan) summa: ${stats.won.toLocaleString()} $
- Kutilayotgan daromad (Pipeline): ${stats.pipeline.toLocaleString()} $

📈 VORONKA BOSQICHLARI:
- Yangi mijozlar: ${stats.new} ta
- Aloqaga chiqilganlar: ${stats.contacted} ta
- Layoqatli (Sotib olish ehtimoli yuqori): ${stats.qualified} ta

YOPILISHI KUTILAYOTGAN TOP-MIJOZLAR (O'ta muhim):
${topLeads}

Sizning vazifangiz:
Ushbu raqamlarga asoslanib, O'zbek tilida 1-2 daqiqada o'qiladigan, motivatsion va aniq strategik "AI Predictive Analytics" (Sotuv Bashorati) hisobotini tuzib berish.
Quyidagi bandlarni Markdown formatida yozing:
1. Joriy Oy Bashorati: (Layoqatli mijozlardan qancha % yopilishi mumkinligini hisoblab, aniq taxminiy summa yozing).
2. Tahlil va Maslahat: (Xodimlarga qaysi top-mijozlar bilan tezroq bog'lanish kerakligini tavsiya eting).
3. Ehtimoliy yo'qotishlar: (Aloqaga chiqilgan lekin Layoqatli bosqichiga o'tmagan mijozlar bo'yicha xavflarni ayting).

Faqat maslahat va hisobotni sirkalaydigan, shablonga o'xshamaydigan tirik va professional tilda, emojilardan me'yorida foydalanib yozing.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        const reply = response.text || "Uzr, tahlil qilishda nosozlik yuz berdi.";

        return NextResponse.json({ reply }, { status: 200 });
    } catch (error) {
        console.error("AI Analytics xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

