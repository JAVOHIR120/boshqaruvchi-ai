"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "./auth";

export async function addTransaction(formData: FormData) {
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const type = formData.get("type") as string;
    const category = formData.get("category") as string;

    if (!description || isNaN(amount) || !type || !category) return { error: "Barcha maydonlarni to'ldiring!" };

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.transaction.create({
        data: { description, amount, type, category, companyId: user.companyId }
    });

    revalidatePath("/accounting");
    return { success: true };
}

export async function addTaxReport(formData: FormData) {
    const name = formData.get("name") as string;
    const period = formData.get("period") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const status = formData.get("status") as string;
    const dueDate = new Date(formData.get("dueDate") as string);

    if (!name || !period || isNaN(amount) || !dueDate) return { error: "Xato ma'lumot kiritildi" };

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.taxReport.create({
        data: { name, period, amount, status, dueDate, companyId: user.companyId }
    });

    revalidatePath("/taxes");
    return { success: true };
}

export async function addInvestor(formData: FormData) {
    const name = formData.get("name") as string;
    const currentStake = formData.get("currentStake") as string;
    const totalInvestment = parseFloat(formData.get("totalInvestment") as string);
    const lastInvestment = new Date(formData.get("lastInvestment") as string);

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.investor.create({
        data: { name, currentStake, totalInvestment, lastInvestment, companyId: user.companyId }
    });

    revalidatePath("/investors");
    return { success: true };
}

export async function addContract(formData: FormData) {
    const title = formData.get("title") as string;
    const partyName = formData.get("partyName") as string;
    const amount = parseFloat(formData.get("amount") as string) || null;
    const status = formData.get("status") as string;

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.contract.create({
        data: { title, partyName, amount, status, companyId: user.companyId }
    });

    revalidatePath("/contracts");
    return { success: true };
}

export async function addEmployee(formData: FormData) {
    const name = formData.get("name") as string;
    const email = (formData.get("email") as string).trim().toLowerCase();
    const position = formData.get("position") as string;
    const salary = parseFloat(formData.get("salary") as string);

    const rawPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return { error: "Muhit xatosi" };

    try {
        const user = await prisma.user.create({
            data: { name, email, password: hashedPassword, role: "XODIM", companyId: currentUser.companyId, isEmailVerified: true }
        });

        await prisma.employee.create({
            data: { userId: user.id, position, salary, plainPassword: rawPassword, companyId: currentUser.companyId }
        });
    } catch (e) {
        return { error: "Xato yuz berdi. E-mail band bo'lishi mumkin." };
    }

    revalidatePath("/employees");
    return { success: true, generatedEmail: email, generatedPassword: rawPassword };
}

export async function addAcademyVideo(formData: FormData) {
    const title = formData.get("title") as string;
    const duration = formData.get("duration") as string;
    const instructor = formData.get("instructor") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string || null;
    const videoUrl = formData.get("videoUrl") as string || null;
    const thumbnail = formData.get("thumbnail") as string || null;

    await prisma.academyVideo.create({
        data: { title, duration, instructor, category, description, videoUrl, thumbnail }
    });

    revalidatePath("/leader-academy");
    return { success: true };
}

export async function addAcademyBook(formData: FormData) {
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const readTime = formData.get("readTime") as string;
    const description = formData.get("description") as string || null;
    const coverUrl = formData.get("coverUrl") as string || null;

    await prisma.academyBook.create({
        data: { title, author, readTime, description, coverUrl }
    });

    revalidatePath("/leader-academy");
    return { success: true };
}

export async function updateUserRole(userId: string, newRole: string) {
    await prisma.user.update({
        where: { id: userId },
        data: { role: newRole }
    });
    revalidatePath("/admin");
    return { success: true };
}

export async function deleteUser(userId: string) {
    await prisma.user.delete({
        where: { id: userId }
    });
    revalidatePath("/admin");
    return { success: true };
}

export async function markAttendance(employeeId: string, status: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
        where: {
            employeeId,
            date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        }
    });

    if (existing) {
        await prisma.attendance.update({
            where: { id: existing.id },
            data: { status }
        });
    } else {
        await prisma.attendance.create({
            data: {
                employeeId,
                status,
                date: new Date()
            }
        });
    }

    revalidatePath("/employees");
    return { success: true };
}

export async function updateEmployeeStats(employeeId: string, performance: number, yellowCards: number, redCards: number) {
    await prisma.employee.update({
        where: { id: employeeId },
        data: { performance, yellowCards, redCards }
    });
    revalidatePath("/employees");
    return { success: true };
}

export async function addInventoryItem(formData: FormData) {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const price = parseFloat(formData.get("price") as string);
    const location = formData.get("location") as string;
    const status = formData.get("status") as string;

    // Amortizatsiya maydonlari
    const purchaseDateStr = formData.get("purchaseDate") as string;
    const amortizationGroup = formData.get("amortizationGroup") as string || null;
    const amortizationRate = parseFloat(formData.get("amortizationRate") as string) || 0;

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.inventoryItem.create({
        data: {
            name, category, quantity, price, location, status,
            purchaseDate: purchaseDateStr ? new Date(purchaseDateStr) : new Date(),
            amortizationGroup,
            amortizationRate,
            companyId: user.companyId
        }
    });

    revalidatePath("/inventory");
    return { success: true };
}

export async function updateInventoryItem(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const quantity = parseInt(formData.get("quantity") as string);
    const price = parseFloat(formData.get("price") as string);
    const location = formData.get("location") as string;
    const status = formData.get("status") as string;

    await prisma.inventoryItem.update({
        where: { id },
        data: { name, category, quantity, price, location, status, lastChecked: new Date() }
    });

    revalidatePath("/inventory");
    return { success: true };
}

export async function deleteInventoryItem(id: string) {
    await prisma.inventoryItem.delete({
        where: { id }
    });
    revalidatePath("/inventory");
    return { success: true };
}

export async function addInventoryAudit(formData: FormData) {
    const inventoryItemId = formData.get("inventoryItemId") as string;
    const actualQuantity = parseInt(formData.get("actualQuantity") as string);
    const auditedBy = formData.get("auditedBy") as string;
    const notes = formData.get("notes") as string || "";

    const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId }
    });

    if (!item) return { error: "Mulk topilmadi" };

    const expectedQuantity = item.quantity;
    const difference = actualQuantity - expectedQuantity;

    await prisma.inventoryAudit.create({
        data: {
            inventoryItemId,
            expectedQuantity,
            actualQuantity,
            difference,
            auditedBy,
            notes,
            date: new Date()
        }
    });

    await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { lastChecked: new Date() }
    });

    revalidatePath("/inventory");
    return { success: true };
}

export async function addModernization(inventoryItemId: string, amount: number) {
    if (isNaN(amount) || amount <= 0) return { error: "Noto'g'ri summa" };

    const item = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId }
    });

    if (!item) return { error: "Mulk topilmadi" };

    await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: {
            modernizationCosts: {
                increment: amount
            },
            lastChecked: new Date()
        }
    });

    revalidatePath("/inventory");
    return { success: true };
}

export async function addInvestorDocument(investorId: string, formData: FormData) {
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const url = formData.get("url") as string;

    await prisma.investorDocument.create({
        data: { investorId, title, type, url }
    });

    revalidatePath("/investors");
    return { success: true };
}

export async function deleteInvestorDocument(id: string) {
    await prisma.investorDocument.delete({
        where: { id }
    });
    revalidatePath("/investors");
    return { success: true };
}

// CRM Actions
export async function addLead(formData: FormData) {
    const name = formData.get("name") as string;
    const company = formData.get("company") as string || null;
    const phone = formData.get("phone") as string || null;
    const estimatedValue = parseFloat(formData.get("estimatedValue") as string) || 0;

    let aiLabel = null;
    try {
        if (process.env.GEMINI_API_KEY) {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const prompt = `Yangi mijoz kiritildi. Mijoz ma'lumotlari: Ismi/Kompaniyasi: ${name} ${company ? `(${company})` : ''}, Kutilayotgan daromad: ${estimatedValue}$. Ushbu mijoz byudjeti va ahamiyatiga ko'ra qaysi klassga mansubligini aniqlang (A-Klass, B-Klass yoki C-Klass). Katta pullik va obro'li korxonalar odatda A, o'rtacha B, noma'lum/kam byudjetlilar C. Faqatgina bitta qisqa so'zni (masalan: "A-Klass" yoki "B-Klass" yoki "C-Klass") qaytaring. Boshqa hech narsa yozmang.`;
            const response = await ai.models.generateContent({ model: "gemini-2.0-flash", contents: prompt, config: { temperature: 0.1 } });
            aiLabel = response.text ? response.text.trim() : null;
        }
    } catch (e) {
        console.error("AI Lead Scoring xatosi:", e);
    }

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.lead.create({
        data: { name, companyName: company, phone, estimatedValue, status: "NEW", aiLabel, companyId: user.companyId }
    });

    revalidatePath("/crm");
    return { success: true };
}

export async function updateLeadStatus(id: string, newStatus: string) {
    const existingLead = await prisma.lead.findUnique({ where: { id } });

    await prisma.lead.update({
        where: { id },
        data: { status: newStatus }
    });

    // Option 3: Auto-create Contract on WON
    if (newStatus === "WON" && existingLead && existingLead.status !== "WON") {
        await prisma.contract.create({
            data: {
                title: `${existingLead.companyName || existingLead.name} bilan shartnoma (Avto)`,
                partyName: existingLead.companyName || existingLead.name,
                amount: existingLead.estimatedValue,
                status: "ACTIVE"
            }
        });
        revalidatePath("/contracts");
    }

    revalidatePath("/crm");
    return { success: true };
}

export async function deleteLead(id: string) {
    await prisma.lead.delete({
        where: { id }
    });
    revalidatePath("/crm");
    return { success: true };
}

// CRM Task Actions
export async function addTask(formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || null;
    const assignedTo = formData.get("assignedTo") as string || null;
    let dueDate = null;
    if (formData.get("dueDate")) {
        dueDate = new Date(formData.get("dueDate") as string);
    }

    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    await prisma.kanbanTask.create({
        data: { title, description, assignedTo, dueDate, status: "TODO", companyId: user.companyId }
    });

    revalidatePath("/crm");
    return { success: true };
}

export async function updateTaskStatus(id: string, newStatus: string) {
    const existingTask = await prisma.kanbanTask.findUnique({ where: { id } });

    await prisma.kanbanTask.update({
        where: { id },
        data: { status: newStatus }
    });

    // AUTO-UPDATE KPI based on task completion
    if (newStatus === "DONE" && existingTask && existingTask.status !== "DONE" && existingTask.assignedTo) {
        const userToUpdate = await prisma.user.findFirst({ where: { name: existingTask.assignedTo }});
        if (userToUpdate) {
            const employee = await prisma.employee.findUnique({ where: { userId: userToUpdate.id } });
            if (employee) {
                const now = new Date();
                const isLate = existingTask.dueDate && now > existingTask.dueDate;
                
                const { processDisciplineEvent } = await import("@/lib/kpi-engine");
                await processDisciplineEvent({
                    employeeId: employee.id,
                    type: isLate ? "TASK_LATE" : "TASK_COMPLETED",
                    description: `Vazifa nomi: ${existingTask.title}`,
                    metadata: { taskTitle: existingTask.title }
                });
            }
        }
    }

    revalidatePath("/crm");
    return { success: true };
}

export async function deleteTask(id: string) {
    await prisma.kanbanTask.delete({
        where: { id }
    });
    revalidatePath("/crm");
    return { success: true };
}

export async function updateTaskDetails(id: string, formData: FormData) {
    const title = formData.get("title") as string;
    const description = formData.get("description") as string || null;
    const assignedTo = formData.get("assignedTo") as string || null;
    let dueDate = null;
    if (formData.get("dueDate")) {
        dueDate = new Date(formData.get("dueDate") as string);
    }

    await prisma.kanbanTask.update({
        where: { id },
        data: { title, description, assignedTo, dueDate }
    });

    revalidatePath("/crm");
    return { success: true };
}

export async function parseExcelTransactionsWithAI(rows: any[]) {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    if (!rows || rows.length === 0) return { error: "Fayl bo'sh yoki o'qib bo'lmadi" };

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return { error: "Gemini API kaliti topilmadi" };

        const ai = new GoogleGenAI({ apiKey });
        
        // Biz faqat dastlabki 150 ta qatorni tahlilga yuboramiz (token cheklovlari va tezlik uchun)
        const sampleRows = rows.slice(0, 150);

        const prompt = `Siz Boshqaruvchi AI tizimining oqil bank ko'chirmalari va soliq schyot-fakturalari tahlilchisiz.
Quyida foydalanuvchi yuklagan Excel bank ko'chirmasidagi qatorlar (raw data) keltirilgan. Iltimos, ularni tahlil qilib, bizning tizimga mos keladigan standard tranzaksiyalar ro'yxatiga o'tkazing.

QATORLAR MA'LUMOTI:
${JSON.stringify(sampleRows, null, 2)}

Sizdan talab qilinadigan format:
Har bir aniqlangan tranzaksiya quyidagi maydonlarga ega bo'lgan ob'ekt bo'lishi kerak:
1. "date" (Sana): YYYY-MM-DD formatida. Agar aniq sana topilmasa, joriy sanani yozing.
2. "description" (Tavsif): To'lov maqsadi va kontragent nomi (Masalan: "Davron MChJ - Qurilish mollari uchun" yoki "Ish haqi - Avgust").
3. "amount" (Summa): Faqatgina musbat son (raqam). Hech qanday so'm, dollar yoki tin belgilarini yozmang, faqat son.
4. "type" (Tur): Bank hisobiga pul kirgan bo'lsa "INCOME", chiqim bo'lgan bo'lsa "EXPENSE".
5. "category" (Kategoriya): Quyidagi beshta toifadan bittasini tanlang:
   - "SALES" (Savdo tushumi, xizmat ko'rsatish kirimi)
   - "SALARY" (Xodimlarga oylik, bonuslar)
   - "TAX" (Soliq to'lovlari, jarimalar)
   - "RENT" (Ofis, ombor ijarasi)
   - "OTHER" (Kategoriya aniq bo'lmasa yoki boshqa xarajat/kirim bo'lsa)

Javobni FAQAT valid JSON array shaklida qaytaring, hech qanday tushuntirish, so'z yoki markdown codeblock belgilari (masalan \`\`\`json) bo'lmasin. Faqatgina sof massiv bo'lsin.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                temperature: 0.1,
            }
        });

        const rawText = response.text || "[]";
        // Clean markdown code blocks if AI wrapped them
        const cleanedText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        try {
            const parsedTransactions = JSON.parse(cleanedText);
            return { success: true, transactions: parsedTransactions };
        } catch (jsonErr) {
            console.error("JSON parsing error on Gemini response:", cleanedText, jsonErr);
            return { error: "AI tahlil natijasini to'g'ri o'qib bo'lmadi. Iltimos, qaytadan urinib ko'ring." };
        }
    } catch (err: any) {
        console.error("AI parse error:", err);
        return { error: "AI bilan aloqa o'rnatishda xatolik: " + err.message };
    }
}

export async function saveImportedTransactions(transactions: any[]) {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    if (!transactions || transactions.length === 0) return { error: "Saqlash uchun tranzaksiyalar mavjud emas" };

    try {
        const created = await prisma.$transaction(
            transactions.map(t => prisma.transaction.create({
                data: {
                    description: t.description || "Import qilingan tranzaksiya",
                    amount: parseFloat(t.amount) || 0,
                    type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
                    category: ["SALES", "SALARY", "TAX", "RENT", "OTHER"].includes(t.category) ? t.category : "OTHER",
                    date: t.date ? new Date(t.date) : new Date(),
                    companyId: user.companyId!
                }
            }))
        );

        revalidatePath("/accounting");
        return { success: true, count: created.length };
    } catch (err: any) {
        console.error("Save imported transactions error:", err);
        return { error: "Tranzaksiyalarni saqlashda xatolik yuz berdi: " + err.message };
    }
}

export async function applyEmployeeBonusOrFine(employeeId: string, amount: number, type: "BONUS" | "FINE", description: string) {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Muhit xatosi" };

    if (amount <= 0) return { error: "Kiritilgan summa noldan katta bo'lishi kerak!" };

    try {
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: { user: true }
        });

        if (!employee) return { error: "Xodim topilmadi!" };

        // Create transaction in company ledger
        await prisma.transaction.create({
            data: {
                description: `${type === "BONUS" ? "KPI Bonus" : "Intizomiy Jarima"} - ${employee.user.name}: ${description}`,
                amount: amount,
                type: type === "BONUS" ? "EXPENSE" : "INCOME", // Fines are received back into company as incomes, bonuses are expenses
                category: type === "BONUS" ? "SALARY" : "OTHER",
                companyId: user.companyId
            }
        });

        // Optionally reduce yellow/red cards if Boss applies fine, or reset them
        if (type === "FINE") {
            await prisma.employee.update({
                where: { id: employeeId },
                data: {
                    yellowCards: 0, // Reset cards on fine settlement, as they've been paid
                    redCards: 0
                }
            });
        }

        revalidatePath("/employees");
        revalidatePath("/accounting");
        return { success: true };
    } catch (err: any) {
        console.error("Apply bonus or fine error:", err);
        return { error: "Tranzaksiyani saqlashda xatolik yuz berdi: " + err.message };
    }
}


