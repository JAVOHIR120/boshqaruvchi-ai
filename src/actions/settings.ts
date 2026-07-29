"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function getCompanyDetails() {
    const user = await getCurrentUser();
    
    if (!user || !user.companyId) {
        return { success: false, error: "Foydalanuvchi tizimga kirmagan yoki korxonasi yo'q" };
    }

    try {
        const company = await prisma.company.findUnique({
            where: { id: user.companyId }
        });

        if (!company) {
            return { success: false, error: "Korxona topilmadi" };
        }

        return { success: true, data: company };
    } catch (error) {
        console.error("Error fetching company details:", error);
        return { success: false, error: "Ma'lumotlarni olishda xatolik yuz berdi" };
    }
}

export async function updateCompanyDetails(data: {
    name?: string;
    inn?: string;
    mfo?: string;
    account?: string;
    address?: string;
    director?: string;
    bankName?: string;
    isVatPayer?: boolean;
    emailNotifications?: boolean;
    itParkResident?: boolean;
}) {
    const user = await getCurrentUser();

    if (!user || !user.companyId) {
        return { success: false, error: "Foydalanuvchi tizimga kirmagan" };
    }

    // Faqat boshliq va superadminlar korxona sozlamalarini o'zgartirishi mumkin
    if (user.role !== "BOSHLIQ" && user.role !== "OWNER" && user.role !== "SUPERADMIN") {
        return { success: false, error: "Sizda korxona sozlamalarini o'zgaritirish huquqi yo'q" };
    }

    try {
        const updatedCompany = await prisma.company.update({
            where: { id: user.companyId },
            data: {
                name: data.name,
                inn: data.inn,
                mfo: data.mfo,
                account: data.account,
                address: data.address,
                director: data.director,
                bankName: data.bankName,
                isVatPayer: data.isVatPayer,
                emailNotifications: data.emailNotifications,
                itParkResident: data.itParkResident
            }
        });

        revalidatePath("/(dashboard)/settings", "page");

        return { success: true, data: updatedCompany };
    } catch (error) {
        console.error("Error updating company details:", error);
        return { success: false, error: "Sozlamalarni saqlashda xatolik yuz berdi" };
    }
}

export async function changePassword(currentPassword: string, newPassword: string) {
    const user = await getCurrentUser();

    if (!user) {
        return { success: false, error: "Tizimga kirmagansiz" };
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser || !dbUser.password) {
            return { success: false, error: "Foydalanuvchi topilmadi" };
        }

        const isValid = await bcrypt.compare(currentPassword, dbUser.password);
        if (!isValid) {
            return { success: false, error: "Joriy parol noto'g'ri" };
        }

        if (newPassword.length < 8) {
            return { success: false, error: "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak" };
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return { success: true };
    } catch (error) {
        console.error("Error changing password:", error);
        return { success: false, error: "Parolni o'zgartirishda xatolik yuz berdi" };
    }
}
