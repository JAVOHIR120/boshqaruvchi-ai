import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Bu Webhook Telegram'dan keladigan xabarlarni qabul qiladi
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body?.message || body?.edited_message;

        if (!message || !message.text) {
            return NextResponse.json({ ok: true });
        }

        const chatId = message.chat.id;
        const text = message.text.trim();

        if (text === "/start") {
            await sendMessage(chatId, `👔 *Boshqaruvchi AI* tizimining rasmiy botiga xush kelibsiz!\n\n` +
                `Sizning Telegram Chat ID: \`${chatId}\`\n\n` +
                `Tizimdan keladigan tezkor hisobotlarni ushbu Telegram akkauntga yo'naltirish uchun yuqoridagi Chat IDni nusxalab, Boshliq AI tizimidagi **Sozlamalar -> Mening Profilim** bo'limiga kiriting.\n\n` +
                `Tizim holati va umumiy hisobotlarni ko'rish uchun /report buyrug'ini yuboring.`);
            return NextResponse.json({ ok: true });
        }

        if (text === "/report") {
            // Moliyaviy Holat
            const transactions = await prisma.transaction.findMany();
            const income = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
            const expense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
            const balance = income - expense;

            // Sotuv Voronkasi
            const leads = await prisma.lead.findMany();
            const wonLeads = leads.filter(l => l.status === "WON").reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
            const pipeline = leads.filter(l => l.status !== "WON" && l.status !== "LOST").reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

            // Vazifalar
            const tasks = await prisma.kanbanTask.count({ where: { status: "TODO" } });

            const reportText = `📊 *KUNLIK HISOBOT* 📊\n\n` +
                `💰 *Moliya:*\n• Umumiy Kirim: ${income.toLocaleString()} $\n• Umumiy Chiqim: ${expense.toLocaleString()} $\n• Sof Qoldiq: *${balance.toLocaleString()} $*\n\n` +
                `🎯 *Sotuvlar (CRM):*\n• Yopilgan: ${wonLeads.toLocaleString()} $\n• Kutilayotgan: ${pipeline.toLocaleString()} $\n\n` +
                `📌 *Vazifalar:*\n• Bajarilishi kutilyotgan ishlar: ${tasks} ta.\n\n_Boshqaruvchi AI tomonidan avtomatik generatsiya qilindi._`;

            await sendMessage(chatId, reportText);
            return NextResponse.json({ ok: true });
        }

        // Boshqa xabarlar uchun AI maslahatchiga ham ulash mumkin kelajakda
        await sendMessage(chatId, "Noma'lum buyruq. Hisobot uchun /report ni bosing.");

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Telegram API xatosi:", error);
        return NextResponse.json({ error: "Xatolik" }, { status: 500 });
    }
}

// Telegramga javob qaytarish funksiyasi
async function sendMessage(chatId: number, text: string) {
    if (!TELEGRAM_BOT_TOKEN) return;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "Markdown"
        }),
    });
}
