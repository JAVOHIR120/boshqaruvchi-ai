"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { revalidatePath } from "next/cache";

export async function getUnreadMessagesCount() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return 0;

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const jwt = await jose.jwtVerify(token, secret);
        const payload = jwt.payload as any;

        const user = await prisma.user.findUnique({
            where: { id: payload.id },
            select: { companyId: true }
        });

        if (!user) return 0;

        let count = 0;

        if (payload.role === "BOSHLIQ" || payload.role === "OWNER" || payload.role === "SUPERADMIN") {
            const companyUsers = await prisma.user.findMany({
                where: { companyId: user.companyId },
                select: { id: true }
            });
            const companyUserIds = companyUsers.map((u: any) => u.id).filter((id: string) => id !== payload.id);

            count = await prisma.message.count({
                where: {
                    senderId: { in: companyUserIds },
                    OR: [
                        { recipientId: payload.id },
                        { recipientId: null }
                    ],
                    isRead: false
                }
            });
        } else {
            count = await prisma.message.count({
                where: {
                    recipientId: payload.id,
                    senderId: { not: payload.id },
                    isRead: false
                }
            });
        }

        return count;
    } catch (error) {
        console.error("Error fetching unread count:", error);
        return 0;
    }
}

export async function markMessagesAsRead(senderId: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return { success: false };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const jwt = await jose.jwtVerify(token, secret);
        const payload = jwt.payload as any;

        if (payload.role === "BOSHLIQ" || payload.role === "OWNER" || payload.role === "SUPERADMIN") {
            await prisma.message.updateMany({
                where: {
                    senderId: senderId,
                    OR: [
                        { recipientId: payload.id },
                        { recipientId: null }
                    ],
                    isRead: false
                },
                data: { isRead: true }
            });
        } else {
            await prisma.message.updateMany({
                where: {
                    senderId: senderId,
                    recipientId: payload.id,
                    isRead: false
                },
                data: { isRead: true }
            });
        }

        revalidatePath("/dashboard");
        revalidatePath("/messages");
        revalidatePath("/employee-portal");

        return { success: true };
    } catch (error) {
        console.error("Error marking messages as read:", error);
        return { success: false };
    }
}

export async function clearChat(otherUserId: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;
        if (!token) return { success: false };

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const jwt = await jose.jwtVerify(token, secret);
        const payload = jwt.payload as any;

        await prisma.message.deleteMany({
            where: {
                OR: [
                    { senderId: payload.id, recipientId: otherUserId },
                    { senderId: otherUserId, recipientId: payload.id },
                    { senderId: otherUserId, recipientId: null },
                ]
            }
        });

        return { success: true };
    } catch (error) {
        console.error("Error clearing chat:", error);
        return { success: false };
    }
}
