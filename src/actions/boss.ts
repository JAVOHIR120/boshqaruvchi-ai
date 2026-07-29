"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import * as jose from "jose";

export async function sendMessageToEmployee(formData: FormData) {
    const content = formData.get("content") as string;
    const recipientId = formData.get("recipientId") as string;
    const type = (formData.get("type") as string) || "TEXT";
    const audioData = formData.get("audioData") as string | null;
    const fileData = formData.get("fileData") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileType = formData.get("fileType") as string | null;

    if ((!content && type === "TEXT") || !recipientId) {
        return { error: "Xabar va qabul qiluvchi bo'lishi shart" };
    }

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return { error: "Avtorizatsiyadan o'tilmagan" };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const { payload } = await jose.jwtVerify(token, secret);
        
        if (!payload.id) {
            return { error: "Foydalanuvchi aniqlanmadi" };
        }

        await prisma.message.create({
            data: {
                senderId: payload.id as string,
                recipientId: recipientId,
                content: content || (type === "VOICE" ? "🎤 Ovozli xabar" : type === "FILE" ? `📎 ${fileName || "Fayl"}` : ""),
                type,
                audioData: audioData || undefined,
                fileData: fileData || undefined,
                fileName: fileName || undefined,
                fileType: fileType || undefined,
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/messages");

        return { success: true };
    } catch (e) {
        console.error("Xodimga xabar yuborishda xato:", e);
        return { error: "Xatolik yuz berdi" };
    }
}
