"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ALL_MODULE_IDS, ALWAYS_ENABLED_MODULES } from "@/lib/modules";

// ============================================
// OWNER ROLE GUARD
// ============================================
async function requireOwner() {
    const user = await getCurrentUser();
    if (!user || user.role !== "OWNER") {
        throw new Error("Ruxsat berilmagan. Faqat tizim egasi uchun.");
    }
    return user;
}

// ============================================
// MODULE ACCESS CONTROL — Kompaniya modullarini boshqarish
// ============================================
export async function getCompaniesWithModules() {
    await requireOwner();
    const companies = await prisma.company.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            enabledModules: true,
            createdAt: true,
            users: {
                select: { id: true, name: true, email: true, role: true },
                orderBy: { role: "asc" }
            },
            _count: { select: { users: true } }
        }
    });
    return JSON.parse(JSON.stringify(companies));
}

export async function updateCompanyModules(companyId: string, modules: string[]) {
    await requireOwner();

    // Validation: "dashboard" va "settings" har doim bo'lishi shart
    const finalModules = [...new Set([...ALWAYS_ENABLED_MODULES, ...modules])];

    // Faqat mavjud modul IDlarinigina qabul qilish
    const validModules = finalModules.filter(m => ALL_MODULE_IDS.includes(m));

    await prisma.company.update({
        where: { id: companyId },
        data: { enabledModules: validModules }
    });

    revalidatePath("/owner");
    return { success: true, enabledModules: validModules };
}

// ============================================
// STATISTICS — Barcha tizim statistikasi
// ============================================
export async function getOwnerStats() {
    await requireOwner();

    const [
        totalUsers, ownerUsers, boshliqUsers, xodimUsers, buxgalterUsers,
        totalTransactions, totalContracts, activeContracts, totalTaxReports,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "OWNER" } }),
        prisma.user.count({ where: { role: "BOSHLIQ" } }),
        prisma.user.count({ where: { role: "XODIM" } }),
        prisma.user.count({ where: { role: "BUXGALTER" } }),
        prisma.transaction.count(),
        prisma.contract.count(),
        prisma.contract.count({ where: { status: "ACTIVE" } }),
        prisma.taxReport.count(),
    ]);

    const [
        pendingTaxes, overdueTaxes, totalInventory, totalLeads, wonLeads,
        totalTasks, doneTasks, totalInvestors, totalMessages,
    ] = await Promise.all([
        prisma.taxReport.count({ where: { status: "PENDING" } }),
        prisma.taxReport.count({ where: { status: "OVERDUE" } }),
        prisma.inventoryItem.count(),
        prisma.lead.count(),
        prisma.lead.count({ where: { status: "WON" } }),
        prisma.kanbanTask.count(),
        prisma.kanbanTask.count({ where: { status: "DONE" } }),
        prisma.investor.count(),
        prisma.message.count(),
    ]);

    const [
        unreadMessages, totalEmployees, totalAcademyVideos, totalAcademyBooks,
        incomeSum, expenseSum, investmentSum,
    ] = await Promise.all([
        prisma.message.count({ where: { isRead: false } }),
        prisma.employee.count(),
        prisma.academyVideo.count(),
        prisma.academyBook.count(),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "INCOME" } }),
        prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "EXPENSE" } }),
        prisma.investor.aggregate({ _sum: { totalInvestment: true } }),
    ]);

    return {
        users: { total: totalUsers, owner: ownerUsers, boshliq: boshliqUsers, xodim: xodimUsers, buxgalter: buxgalterUsers },
        transactions: { total: totalTransactions, income: incomeSum._sum.amount || 0, expense: expenseSum._sum.amount || 0 },
        contracts: { total: totalContracts, active: activeContracts },
        taxes: { total: totalTaxReports, pending: pendingTaxes, overdue: overdueTaxes },
        inventory: { total: totalInventory },
        leads: { total: totalLeads, won: wonLeads },
        tasks: { total: totalTasks, done: doneTasks },
        investors: { total: totalInvestors, totalInvestment: investmentSum._sum.totalInvestment || 0 },
        messages: { total: totalMessages, unread: unreadMessages },
        employees: { total: totalEmployees },
        academy: { videos: totalAcademyVideos, books: totalAcademyBooks },
    };
}

// ============================================
// USERS — Barcha foydalanuvchilar
// ============================================
export async function getAllUsersForOwner() {
    await requireOwner();
    return prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true, name: true, email: true, role: true,
            isEmailVerified: true, createdAt: true,
            employeeProfile: {
                select: { position: true, salary: true, performance: true, yellowCards: true, redCards: true }
            }
        }
    });
}

export async function ownerUpdateRole(userId: string, newRole: string) {
    await requireOwner();
    const validRoles = ["OWNER", "BOSHLIQ", "XODIM", "BUXGALTER", "INVESTOR"];
    if (!validRoles.includes(newRole)) throw new Error("Noto'g'ri rol");
    await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
    revalidatePath("/owner");
}

export async function ownerDeleteUser(userId: string) {
    const owner = await requireOwner();
    if (userId === owner.id) throw new Error("O'zingizni o'chira olmaysiz!");
    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/owner");
}

export async function ownerCreateUser(formData: FormData) {
    await requireOwner();
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    if (!name || !email || !password || !role) throw new Error("Barcha maydonlar to'ldirilishi shart");
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error("Bu email allaqachon ro'yxatdan o'tgan");
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
        data: { name, email, password: hashedPassword, role, isEmailVerified: true }
    });
    revalidatePath("/owner");
}

// ============================================
// TRANSACTIONS
// ============================================
export async function getTransactionsForOwner() {
    await requireOwner();
    return prisma.transaction.findMany({ orderBy: { date: "desc" }, take: 200 });
}
export async function ownerDeleteTransaction(id: string) {
    await requireOwner();
    await prisma.transaction.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// CONTRACTS
// ============================================
export async function getContractsForOwner() {
    await requireOwner();
    return prisma.contract.findMany({ orderBy: { signedDate: "desc" }, take: 200 });
}
export async function ownerDeleteContract(id: string) {
    await requireOwner();
    await prisma.contract.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// TAX REPORTS
// ============================================
export async function getTaxReportsForOwner() {
    await requireOwner();
    return prisma.taxReport.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
export async function ownerDeleteTaxReport(id: string) {
    await requireOwner();
    await prisma.taxReport.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// INVENTORY
// ============================================
export async function getInventoryForOwner() {
    await requireOwner();
    return prisma.inventoryItem.findMany({
        orderBy: { createdAt: "desc" }, take: 200,
        include: { responsible: { include: { user: { select: { name: true } } } } }
    });
}
export async function ownerDeleteInventoryItem(id: string) {
    await requireOwner();
    await prisma.inventoryItem.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// LEADS (CRM)
// ============================================
export async function getLeadsForOwner() {
    await requireOwner();
    return prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
export async function ownerDeleteLead(id: string) {
    await requireOwner();
    await prisma.lead.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// KANBAN TASKS
// ============================================
export async function getTasksForOwner() {
    await requireOwner();
    return prisma.kanbanTask.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
}
export async function ownerDeleteTask(id: string) {
    await requireOwner();
    await prisma.kanbanTask.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// INVESTORS
// ============================================
export async function getInvestorsForOwner() {
    await requireOwner();
    return prisma.investor.findMany({ orderBy: { createdAt: "desc" }, include: { documents: true } });
}
export async function ownerDeleteInvestor(id: string) {
    await requireOwner();
    await prisma.investor.delete({ where: { id } });
    revalidatePath("/owner");
}

// ============================================
// MESSAGES
// ============================================
export async function getMessagesForOwner() {
    await requireOwner();
    return prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
}

// ============================================
// EMPLOYEES — for Owner Dashboard
// ============================================
export async function getEmployeesForOwner() {
    await requireOwner();
    return prisma.employee.findMany({
        orderBy: { startDate: "desc" },
        include: { user: { select: { name: true, email: true, role: true } } }
    });
}

// ============================================
// DANGER ZONE — Mass operations
// ============================================
export async function ownerPurgeAllTransactions() {
    await requireOwner();
    await prisma.transaction.deleteMany({});
    revalidatePath("/owner");
}
export async function ownerPurgeAllTaxReports() {
    await requireOwner();
    await prisma.taxReport.deleteMany({});
    revalidatePath("/owner");
}
export async function ownerPurgeAllLeads() {
    await requireOwner();
    await prisma.lead.deleteMany({});
    revalidatePath("/owner");
}
export async function ownerPurgeAllTasks() {
    await requireOwner();
    await prisma.kanbanTask.deleteMany({});
    revalidatePath("/owner");
}
export async function ownerPurgeAllMessages() {
    await requireOwner();
    await prisma.message.deleteMany({});
    revalidatePath("/owner");
}

// ============================================
// LEADER ACADEMY MANAGEMENT (Owner Only)
// ============================================
export async function ownerCreateAcademyVideo(formData: FormData) {
    await requireOwner();
    const title = formData.get("title") as string;
    const duration = formData.get("duration") as string;
    const instructor = formData.get("instructor") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const videoUrl = formData.get("videoUrl") as string;
    const thumbnail = formData.get("thumbnail") as string;
    if (!title || !videoUrl) throw new Error("Sarlavha va Video URL majburiy!");
    await prisma.academyVideo.create({
        data: { title, duration, instructor, category, description, videoUrl, thumbnail }
    });
    revalidatePath("/owner");
    revalidatePath("/leader-academy");
}

export async function ownerCreateAcademyBook(formData: FormData) {
    await requireOwner();
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const readTime = formData.get("readTime") as string;
    const description = formData.get("description") as string;
    const coverUrl = formData.get("coverUrl") as string | null;
    const pdfUrl = formData.get("pdfUrl") as string | null;
    
    if (!title || !pdfUrl) throw new Error("Sarlavha va PDF manzili majburiy!");

    await prisma.academyBook.create({ data: { title, author, readTime, description, coverUrl, pdfUrl } as any });
    revalidatePath("/owner");
    revalidatePath("/leader-academy");
}

export async function ownerDeleteAcademyVideo(id: string) {
    await requireOwner();
    await prisma.academyVideo.delete({ where: { id } });
    revalidatePath("/owner");
    revalidatePath("/leader-academy");
}

export async function ownerDeleteAcademyBook(id: string) {
    await requireOwner();
    const book = await prisma.academyBook.findUnique({ where: { id } }) as any;
    if (book) {
        if (book.pdfUrl) {
            const p = path.join(process.cwd(), "public", book.pdfUrl);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        if (book.coverUrl) {
            const p = path.join(process.cwd(), "public", book.coverUrl);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
    }
    await prisma.academyBook.delete({ where: { id } });
    revalidatePath("/owner");
    revalidatePath("/leader-academy");
}

// ============================================
// AI PREDICTIVE ANALYSIS (Working SDK — @google/genai)
// ============================================
export async function getAIPredictions(statsStr: string) {
    await requireOwner();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { riskScore: 0, financialHealth: "AI xizmati mavjud emas (API kalit topilmadi).", anomalies: [], recommendations: ["GEMINI_API_KEY ni .env fayliga qo'shing."] };

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Siz yuqori darajadagi moliyaviy va tizim muhandis-tahlilchisisiz (Superadmin AI yordamchisi).
Sizga korxonaning quyidagi statistik ma'lumotlari berilgan:
${statsStr}

Ushbu ma'lumotlarga asoslanib, ehtimoliy anomaliyalarni, xavflarni (moliyaviy, inson resurslari, tizim limitlari) 
bashorat qiling va "Tizim Egasi" (Owner) uchun qisqa, tushunarli, aniq maslahatlar bering. 
Quyidagi JSON formatda qaytaring, boshqa hech narsa qo'shmang (Markdown formatini ishlatmang, sof JSON bo'lsin): 
{
    "riskScore": 0-100 oralig'ida raqam (0 bu a'lo, 100 o'ta xavfli),
    "financialHealth": "Moliyaviy salomatlik haqida qisqacha xulosa (O'zbek tilida)",
    "anomalies": ["Agar bor bo'lsa anomaliyalar ro'yxati yoki bo'm-bo'sh massiv"],
    "recommendations": ["Owner uchun 2-3 ta asosiy qadam (O'zbek tilida)"]
}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: { temperature: 0.2 }
        });

        let responseText = response.text || "";
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(responseText);
    } catch (e: any) {
        console.error("AI Prediction Error:", e);
        return {
            riskScore: 0,
            financialHealth: "Tahlil vaqtida xato yuz berdi: " + (e.message || "").substring(0, 100),
            anomalies: [],
            recommendations: ["Qayta urinib ko'ring yoki AI xizmatini tekshiring."]
        };
    }
}

// ============================================
// AI YOUTUBE VIDEO ANALYZER
// ============================================
export async function aiAnalyzeYouTubeVideo(videoUrl: string) {
    await requireOwner();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY mavjud emas!");

    // 1. YouTube oEmbed orqali metadata olish
    let oembedData: any = null;
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
        const res = await fetch(oembedUrl, { next: { revalidate: 0 } });
        if (res.ok) oembedData = await res.json();
    } catch { /* oEmbed ishlamasa davom etamiz */ }

    // 2. YouTube video ID ni olish (thumbnail uchun)
    let videoId = "";
    const ytMatch = videoUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) videoId = ytMatch[1];
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

    // 3. Gemini AI bilan tahlil
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Siz YouTube video tahlilchisisiz. Quyidagi YouTube video ma'lumotlarini tahlil qiling va Leader Academy ta'lim platformasi uchun to'liq metadata yarating.

YouTube URL: ${videoUrl}
${oembedData ? `Video Sarlavhasi: ${oembedData.title}` : ""}
${oembedData ? `Kanal Nomi: ${oembedData.author_name}` : ""}
Thumbnail: ${thumbnail}

Quyidagi JSON formatda qaytaring (sof JSON, Markdown ishlatmang):
{
    "title": "O'zbek tilida professional sarlavha (agar original o'zbek tilida bo'lsa shu holicha, aks holda tarjima qiling)",
    "instructor": "Video spikeri yoki kanal nomi",
    "category": "Eng mos kategoriyalardan biri: Biznes, Marketing, Moliya, Liderlik, Texnologiya, Shaxsiy Rivojlanish, Boshqaruv, Savdo, Kommunikatsiya, Boshqa",
    "duration": "Taxminiy davomiylik (masalan: '15:00')",
    "description": "3-4 jumlada video mazmuni haqida O'zbek tilida professional ta'rif. Bu ta'rif foydalanuvchilarga videoning qiymatini tushuntirsin."
}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.3 }
    });

    let responseText = response.text || "";
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(responseText);
        return {
            title: parsed.title || oembedData?.title || "",
            instructor: parsed.instructor || oembedData?.author_name || "",
            category: parsed.category || "Biznes",
            duration: parsed.duration || "",
            description: parsed.description || "",
            thumbnail: thumbnail,
            videoUrl: videoUrl,
        };
    } catch {
        return {
            title: oembedData?.title || "Video",
            instructor: oembedData?.author_name || "",
            category: "Biznes",
            duration: "",
            description: "",
            thumbnail: thumbnail,
            videoUrl: videoUrl,
        };
    }
}

// ============================================
// AI BOOK ANALYZER
// ============================================
export async function aiAnalyzeBookContent(extractedText: string, totalPages: number) {
    await requireOwner();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY mavjud emas!");

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Siz malakali kutubxonachi va ma'lumotlar tahlilchisisiz. Quyida PDF kitobning dastlabki bir nechtas sahifalaridan olingan matn keltirilgan.
Shu matndan foydalanib kitobning nomi (title), muallifi (author), va qisqacha mazmunini (description) o'zbek tilida yarating. 
Bundan tashqari bizga "cover generation" yasash uchun 3-4 so'zdan iborat vizual ingliz tilida "coverPrompt" ham qaytaring.

Matn parchasi:
"""
${extractedText.substring(0, 15000)}
"""

Umumiy varaqlar soni: ${totalPages}

Quyidagi JSON formatda qaytaring (sof JSON, Markdown ishlatmang, kod blokisiz (\`\`\`) qaytaring):
{
    "title": "Kitobning to'liq o'zbekcha sarlavhasi (yoki asl nomi)",
    "author": "Asosiy muallifning ismi (topilmasa: 'Noma\\'lum')",
    "description": "Kitob haqida 3-4 gapdan iborat juda professional va jozibador qisqacha xulosa (O'zbek tilida)",
    "coverPrompt": "minimalistic highly detailed professional book cover for [Kitob mavzusi inglizcha], pure empty background, centered design"
}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: { temperature: 0.2 }
    });

    let responseText = response.text || "";
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const parsed = JSON.parse(responseText);
        
        // Hisoblash: O'qish vaqti (Har bir sahifa taxminan 2 daqiqa)
        const totalMinutes = totalPages * 2;
        let readTime = "";
        if (totalMinutes < 60) {
            readTime = `${totalMinutes} daqiqa`;
        } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            readTime = minutes > 0 ? `${hours} soat, ${minutes} daqiqa` : `${hours} soat`;
        }

        // Generate Cover URL with Pollinations AI
        const safePrompt = encodeURIComponent(parsed.coverPrompt || "modern professional book cover design minimalistic");
        const coverImageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=1200&nologo=true`;

        return {
            title: parsed.title || "",
            author: parsed.author || "",
            description: parsed.description || "",
            readTime: totalPages ? readTime : "Ma'lum emas",
            coverImageUrl: coverImageUrl
        };
    } catch (e: any) {
        throw new Error("AI javobini pars qilishda xatolik: " + e.message);
    }
}
