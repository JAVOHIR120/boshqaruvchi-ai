import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/actions/auth";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.companyId) {
            return NextResponse.json({ success: false, error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
        }

        // 1. Fetching all necessary data
        const [transactions, employees] = await Promise.all([
            prisma.transaction.findMany({ where: { companyId: currentUser.companyId } }),
            prisma.employee.findMany({ where: { companyId: currentUser.companyId }, include: { user: true, attendances: true } })
        ]);

        // Totals
        const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;

        // Attendance stats for today
        const todayStr = new Date().toDateString();
        const absentStaff = employees.filter(emp => {
            const hasAttendedToday = emp.attendances.some(att => new Date(att.date).toDateString() === todayStr && att.status === "PRESENT");
            return !hasAttendedToday;
        });

        // 2. Generate a custom Boshliq Strategic Tip from Gemini AI
        let aiTip = "Biznesingiz moliya intizomini qat'iy nazorat qiling va xodimlar KPI ko'rsatkichlarini muntazam rag'batlantirib boring.";
        try {
            if (geminiApiKey) {
                const prompt = `Siz tadbirkorlar uchun eng kuchli biznes murabbiy (biznes-konsultant) sun'iy intellektisiz.
                Kompaniya bugungi holati:
                - Jami kirim: ${totalIncome.toLocaleString()} so'm
                - Jami chiqim: ${totalExpense.toLocaleString()} so'm
                - Sof qoldiq: ${balance.toLocaleString()} so'm
                - Faol bo'lmagan (kelmagan) xodimlar: ${absentStaff.length} nafar.

                Ushbu holatdan kelib chiqib, Boshliq (Rahbar) uchun bugungi kunga atab 2 ta qisqa jumlada (maksimum 150 ta belgi) amaliy, juda ruhlantiruvchi va foydali **Biznes/Moliya maslahatini** bering. O'zbek tilida (lotin yozuvida) yozing.`;
                const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
                const result = await model.generateContent(prompt);
                aiTip = (await result.response).text().trim();
            }
        } catch (e) {
            console.error("Gemini AI tip generation error:", e);
        }

        // 3. Compile Telegram Rich Message
        const telegramMessage = `👔 *BOSHLIQ AI - TEZKOR HISOBOT* 👔\n\n` +
            `💰 *Moliyaviy Holat (Real-time):*\n` +
            `• Jami Kirim: *${totalIncome.toLocaleString()} UZS*\n` +
            `• Jami Chiqim: *${totalExpense.toLocaleString()} UZS*\n` +
            `• Sof Qoldiq: *${balance.toLocaleString()} UZS*\n\n` +
            `👥 *HR va Davomat Nazorati (Bugun):*\n` +
            `• Jami Xodimlar: ${employees.length} nafar\n` +
            `• Bugun kelmaganlar: *${absentStaff.length} nafar*\n` +
            `${absentStaff.length > 0 ? `  _(${absentStaff.map(s => s.user.name).join(", ")})_\n` : ""}\n` +
            `💡 *AI Moliyaviy maslahat (Boshliq uchun):*\n` +
            `"${aiTip}"\n\n` +
            `_👔 Boshliq AI orqali real vaqtda jo'natildi._`;

        let sentStatus = "SIMULATED";
        let apiResponse = null;

        const targetChatId = currentUser.telegramChatId || TELEGRAM_CHAT_ID;

        if (TELEGRAM_BOT_TOKEN && targetChatId) {
            const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: targetChatId,
                    text: telegramMessage,
                    parse_mode: "Markdown"
                }),
            });
            apiResponse = await res.json();
            if (apiResponse.ok) {
                sentStatus = "SENT";
            } else {
                sentStatus = "FAILED";
            }
        }

        return NextResponse.json({
            success: true,
            status: sentStatus,
            message: sentStatus === "SENT" ? "Hisobot Telegramga yuborildi! 👔" : "Hisobot yuborish simulyatsiya qilindi (Telegram sozlamalari yo'q).",
            telegramMessage,
            apiResponse
        });

    } catch (error: any) {
        console.error("Telegram push error:", error);
        return NextResponse.json({ success: false, error: "Server xatoligi" }, { status: 500 });
    }
}
