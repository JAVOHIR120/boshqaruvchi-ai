"use server";

import { cookies } from "next/headers";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import { ALL_MODULE_IDS } from "@/lib/modules";
import { saveBase64Image } from "@/utils/storage";

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) return null;

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const { payload } = await jose.jwtVerify(token, secret);

        if (!payload.id) return null;

        const user = await prisma.user.findUnique({
            where: { id: payload.id as string },
            select: { 
                id: true, name: true, email: true, role: true, 
                avatarBase64: true, companyId: true, password: true,
                telegramChatId: true,
                employeeProfile: { select: { plainPassword: true } },
                company: { select: { enabledModules: true } }
            }
        });

        if (!user) return null;

        // Return passwordLength + plainPassword (if employee), but NEVER the hash
        const hasPassword = !!user.password && user.password.length > 0;
        const plainPw = user.employeeProfile?.plainPassword || null;

        // OWNER har doim barcha modullarga ega
        // Agar kompaniyada enabledModules bo'sh yoki null bo'lsa — default barcha modullar
        const enabledModules = user.role === "OWNER" 
            ? ALL_MODULE_IDS 
            : (user.company?.enabledModules?.length ? user.company.enabledModules : ALL_MODULE_IDS);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarBase64: user.avatarBase64,
            companyId: user.companyId,
            telegramChatId: user.telegramChatId || "",
            passwordLength: hasPassword ? (plainPw ? plainPw.length : 8) : 0,
            plainPassword: plainPw,
            provider: hasPassword ? "credentials" : "google",
            enabledModules,
        };
    } catch (error) {
        console.error("Foydalanuvchini olishda xatolik:", error);
        return null;
    }
}

export async function updateProfilePicture(base64: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return { error: "Avtorizatsiyadan o'tilmagan" };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const { payload } = await jose.jwtVerify(token, secret);
        if (!payload.id) return { error: "Yaroqsiz token" };

        // Save the image on disk to prevent database bloat and speed up page load
        const savedUrl = await saveBase64Image(base64, "avatar");

        await prisma.user.update({
            where: { id: payload.id as string },
            data: { avatarBase64: savedUrl }
        });

        return { success: true };
    } catch (error) {
        console.error("Rasmni saqlashda xatolik:", error);
        return { error: "Xatolik yuz berdi" };
    }
}

export async function updateTelegramChatId(chatId: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return { error: "Avtorizatsiyadan o'tilmagan" };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const { payload } = await jose.jwtVerify(token, secret);
        if (!payload.id) return { error: "Yaroqsiz token" };

        await prisma.user.update({
            where: { id: payload.id as string },
            data: { telegramChatId: chatId || null }
        });

        return { success: true };
    } catch (error) {
        console.error("Telegram Chat IDni saqlashda xatolik:", error);
        return { error: "Xatolik yuz berdi" };
    }
}
