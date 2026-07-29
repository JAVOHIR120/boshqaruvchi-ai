"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function sendMessage(senderId: string, formData: FormData, isTaskAccept: boolean = false) {
    const content = formData.get("content") as string;
    const taskId = formData.get("taskId") as string;
    const taskTitle = formData.get("title") as string;
    const type = (formData.get("type") as string) || "TEXT";
    const audioData = formData.get("audioData") as string | null;
    const fileData = formData.get("fileData") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const fileType = formData.get("fileType") as string | null;

    let messageContent = content;

    if (isTaskAccept && taskId && taskTitle) {
        messageContent = `Men quyidagi vazifani qabul qildim va bajarishni boshladim: "${taskTitle}"`;

        await prisma.kanbanTask.update({
            where: { id: taskId },
            data: { status: "IN_PROGRESS" }
        });
    }

    if (!messageContent && type === "TEXT") {
        return { error: "Xabar bo'sh bo'lishi mumkin emas" };
    }

    try {
        await prisma.message.create({
            data: {
                senderId,
                content: messageContent || (type === "VOICE" ? "🎤 Ovozli xabar" : type === "FILE" ? `📎 ${fileName || "Fayl"}` : ""),
                type,
                audioData: audioData || undefined,
                fileData: fileData || undefined,
                fileName: fileName || undefined,
                fileType: fileType || undefined,
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/employee-portal");

        return { success: true };
    } catch (e) {
        console.error("Xabar yuborishda xato:", e);
        return { error: "Xatolik yuz berdi" };
    }
}
