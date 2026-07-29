import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/actions/auth";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.companyId) {
            return NextResponse.json({ success: false, error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
        }

        // Fetch real data
        const [transactions, employees] = await Promise.all([
            prisma.transaction.findMany({ where: { companyId: currentUser.companyId } }),
            prisma.employee.findMany({ where: { companyId: currentUser.companyId } })
        ]);

        const totalIncome = transactions
            .filter((t) => t.type === "INCOME")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter((t) => t.type === "EXPENSE")
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSalaryFund = employees.reduce((sum, e) => sum + e.salary, 0);

        // Analyze specific transaction risks (e.g. non-deductible expenses like Restaurant/Fine)
        const nonDeductibleTransactions = transactions.filter(t => {
            const desc = (t.description || "").toLowerCase();
            return t.type === "EXPENSE" && (desc.includes("jarima") || desc.includes("fine") || desc.includes("restoran") || desc.includes("restaurant") || desc.includes("penalty"));
        });
        const totalNonDeductible = nonDeductibleTransactions.reduce((sum, t) => sum + t.amount, 0);

        // Prepare context for Gemini
        const companyContext = `
        Kompaniya ID: ${currentUser.companyId}
        Jami Daromad (Sotuv): ${totalIncome.toLocaleString()} so'm
        Jami Xarajatlar: ${totalExpense.toLocaleString()} so'm
        Ish haqi fondi (Payroll): ${totalSalaryFund.toLocaleString()} so'm
        Xodimlar soni: ${employees.length} nafar
        Chegirilmaydigan xarajatlar (Jarima/Restoranlar): ${totalNonDeductible.toLocaleString()} so'm (${nonDeductibleTransactions.length} ta tranzaksiya)
        `;

        if (!geminiApiKey) {
            return NextResponse.json({
                success: true,
                analysis: `⚠️ **[SIMULYATSIYA REJIMI: GEMINI_API_KEY o'rnatilmagan]**\n\n**Boshliq AI - Virtual CFO Soliq Strategiyasi Xulosasi:**\n\n1. **Soliq Rejimi Tahlili:** Kompaniyangizning joriy aylanmasi **${totalIncome.toLocaleString()} so'm**. Agar siz aylanmadan olinadigan soliq (AOS - 4%) rejimida ishlasangiz, yiliga **${Math.round(totalIncome * 0.04).toLocaleString()} so'm** soliq to'laysiz.\n\n2. **QQS (12%) va Foyda solig'iga o'tish tavsiyasi:** Agar material xaridlarining ko'p qismi rasmiy QQS zacheti bilan ta'minlansa, QQS rejimiga o'tish maqsadga muvofiq. Bu orqali siz to'lanadigan QQS summasini sezilarli darajada kamaytira olasiz.\n\n3. **Xarajatlar nazorati (Risklar):** Tizimda **${totalNonDeductible.toLocaleString()} so'm** miqdorida chegirilmaydigan xarajatlar (jarimalar yoki shaxsiy xarajatlar) aniqlandi. Ushbu xarajatlar foyda solig'i bazasidan chegirilmaydi va soliq yukingizni oshiradi. Kelgusida bunday to'lovlarni korporativ hisobdan amalga oshirmaslik tavsiya etiladi.`
            });
        }

        const prompt = `Siz O'zbekiston soliq tizimi (O'zbekiston Respublikasi Soliq Kodeksi) bo'yicha eng tajribali Moliyaviy Direktor (CFO) va Soliq Advokatisiz.
        Sizga korxonaning real moliyaviy ma'lumotlari taqdim etilmoqda. 

        VAZIFANGIZ:
        Taqdim etilgan moliyaviy ma'lumotlarga asoslanib, rahbar (Boshliq) uchun shaxsiy **Soliq yukini qonuniy kamaytirish va moliyani optimallashtirish rejasi**ni ishlab chiqing.

        MATN TARKIBI QUYIDAGILARDAN IBORAT BO'LSIN:
        1. **Joriy Soliq Yukining Umumiy Tahlili:** AOS (4%) va QQS (12%) + Foyda solig'i (15%) rejimlari bo'yicha kompaniya uchun qaysi biri maqbulroq ekanini aniq sonlar bilan solishtiring.
        2. **Xarajatlar tahlili va Soliq Risklarini aniqlash:** Tizimda chegirilmaydigan xarajatlar (${totalNonDeductible.toLocaleString()} so'm) borligini ko'rsatib, nima uchun ular korxona foyda solig'ini oshirayotganini tushuntiring.
        3. **Ish haqi soliqlari (JShDS 12% va Ijtimoiy soliq 12%):** Ish haqi fondi (${totalSalaryFund.toLocaleString()} so'm) bo'yicha optimallashtirish (masalan, IT-Park rezidentligi imtiyozlari yordamida oylik solig'ini 7.5% ga tushirish) bo'yicha tavsiya bering.
        4. **Amaliy Boshqaruvchi Choralar (CFO Action Items):** Rahbar darhol amalga oshirishi kerak bo'lgan 3 ta qonuniy qadamni belgilang.

        Javobni o'zbek tilida (lotin yozuvida), juda toza, professional va o'qishli Markdown formatida yozing. Har bir bo'lim chiroyli emoji va ko'rinishga ega bo'lsin.

        KORXONA MA'LUMOTLARI:
        ${companyContext}
        `;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error("AI Tax Optimization Error:", error);
        return NextResponse.json({ success: false, error: "Server xatoligi" }, { status: 500 });
    }
}
