import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

export async function POST(req: Request) {
    try {
        if (!geminiApiKey) {
            return NextResponse.json(
                { success: false, error: "GEMINI_API_KEY sozlanmagan" },
                { status: 500 }
            );
        }

        const body = await req.json();
        const { rawRows, fileName } = body;

        if (!rawRows || !Array.isArray(rawRows) || rawRows.length === 0) {
            return NextResponse.json(
                { success: false, error: "Fayl bo'sh yoki noto'g'ri format" },
                { status: 400 }
            );
        }

        // Faqat birinchi 200 ta qatorni jo'natamiz (token limiti uchun)
        const sampleRows = rawRows.slice(0, 200);
        const allColumns = Object.keys(sampleRows[0] || {});

        const prompt = `SIZ PROFESSIONAL BANK TRANZAKSIYA TAHLILCHISISIZ.

Sizga O'zbekiston banklaridan olingan bank vipiskasining (Excel/CSV) ma'lumotlari berilmoqda.
Fayl nomi: "${fileName}"

MAVJUD USTUNLAR: ${JSON.stringify(allColumns)}

BIRINCHI 5 TA QATOR NAMUNASI:
${JSON.stringify(sampleRows.slice(0, 5), null, 2)}

JAMI QATORLAR SONI: ${sampleRows.length}

BARCHA QATORLAR:
${JSON.stringify(sampleRows)}

VAZIFANGIZ:
Har bir qatorni tahlil qilib, quyidagi JSON formatda javob bering. Faqat JSON qaytaring, boshqa hech narsa yozmang.

QOIDALAR:
1. Har bir tranzaksiya uchun "type" ni aniqlang:
   - "kredit" = korxonaga pul kirishi (tushum, sotuv, qaytim, kirim)  
   - "debet" = korxonadan pul chiqishi (to'lov, xarid, ish haqi, ijara, soliq)

2. "category" ni aniqlang:
   - "INCOME_TAXABLE" = Soliqqa tortiladigan daromad (tovar/xizmat sotuvi, komissiya)
   - "INCOME_NON_TAXABLE" = Soliqqa tortilmaydigan (qarz qaytimi, ustav kapitali, ichki o'tkazma)
   - "EXPENSE_PAYROLL" = Ish haqi, zarplata, avans, mukofot, premiya
   - "EXPENSE_DEDUCTIBLE" = Chegirib olinadigan xarajat (ijara, xarid, kommunal, xizmatlar)
   - "EXPENSE_NON_DEDUCTIBLE" = Chegirilmaydigan (jarima, penya, shaxsiy xarajatlar)
   - "TAX_PAYMENT" = Soliq to'lovlari (g'aznaga, budjetga, INPS, QQS, foyda solig'i)
   - "DIVIDEND_PAYMENT" = Dividend to'lovlari
   - "TRANSFER" = Ichki o'tkazma (bir hisobdan boshqasiga)

3. Summa "amount" har doim MUSBAT raqam bo'lsin
4. "purpose" — original matndagi to'lov maqsadi
5. "counterparty" — kontragent nomi
6. "date" — sana (YYYY-MM-DD formatda)

JAVOB FORMATI (faqat JSON array):
[
  {
    "date": "2026-01-15",
    "amount": 50000000,
    "type": "kredit",
    "purpose": "Tovarlar uchun to'lov",
    "counterparty": "MCHJ Savdo Olami",
    "category": "INCOME_TAXABLE"
  }
]

DIQQAT:
- Faqat toza JSON array qaytaring, hech qanday izoh yoki markdown yozmang!
- Agar summa ustunini aniqlay olmasangiz, amount: 0 qo'ying
- Agar sana topilmasa, bugungi sanani ishlating
- O'zbek, rus yoki ingliz tilidagi ustunlarni tushunishga harakat qiling
- "Сумма", "Дебет", "Кредит", "Назначение", "Получатель", "Дата" — rus tilidagi ustunlarni ham tushunishing kerak`;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        let aiResponse = result.response.text();

        // JSON ni tozalash — ba'zi holatlarda AI markdown code block ichida qaytaradi
        aiResponse = aiResponse.trim();
        if (aiResponse.startsWith("```json")) {
            aiResponse = aiResponse.replace(/^```json\s*/, "").replace(/```\s*$/, "");
        } else if (aiResponse.startsWith("```")) {
            aiResponse = aiResponse.replace(/^```\s*/, "").replace(/```\s*$/, "");
        }

        let parsedTransactions;
        try {
            parsedTransactions = JSON.parse(aiResponse);
        } catch {
            // Agar JSON parse qilib bo'lmasa, matnni bo'laklarga bo'lib qayta urinish
            const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                parsedTransactions = JSON.parse(jsonMatch[0]);
            } else {
                return NextResponse.json(
                    { success: false, error: "AI javobini o'qib bo'lmadi. Iltimos qayta urinib ko'ring.", rawResponse: aiResponse.substring(0, 500) },
                    { status: 422 }
                );
            }
        }

        if (!Array.isArray(parsedTransactions)) {
            return NextResponse.json(
                { success: false, error: "AI noto'g'ri format qaytardi" },
                { status: 422 }
            );
        }

        // Ma'lumotlarni tozalash va validatsiya qilish
        const cleanedTransactions = parsedTransactions.map((tx: any, idx: number) => ({
            id: `ai-tx-${idx}`,
            date: tx.date || new Date().toISOString().split('T')[0],
            amount: Math.abs(Number(tx.amount) || 0),
            type: tx.type === 'kredit' ? 'kredit' : 'debet',
            purpose: String(tx.purpose || ''),
            counterparty: String(tx.counterparty || ''),
            isCategorized: true,
            category: tx.category || 'UNKNOWN',
        })).filter((tx: any) => tx.amount > 0);

        // Umumiy statistika
        const summary = {
            totalRows: cleanedTransactions.length,
            totalIncome: cleanedTransactions.filter((t: any) => t.type === 'kredit').reduce((s: number, t: any) => s + t.amount, 0),
            totalExpense: cleanedTransactions.filter((t: any) => t.type === 'debet').reduce((s: number, t: any) => s + t.amount, 0),
            categories: {} as Record<string, number>,
        };

        cleanedTransactions.forEach((t: any) => {
            summary.categories[t.category] = (summary.categories[t.category] || 0) + 1;
        });

        return NextResponse.json({
            success: true,
            transactions: cleanedTransactions,
            summary,
            aiModel: "gemini-2.5-flash-lite",
        });

    } catch (error: any) {
        console.error("AI Tax Analysis Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Ichki xatolik yuz berdi" },
            { status: 500 }
        );
    }
}
