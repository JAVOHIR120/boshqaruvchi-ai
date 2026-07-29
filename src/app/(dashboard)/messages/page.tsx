import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import * as jose from "jose";
import { redirect } from "next/navigation";
import MessagesClient from "./components/MessagesClient";

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    let payload: { id: string, role: string, companyId: string };
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const jwt = await jose.jwtVerify(token, secret);
        payload = jwt.payload as any;
    } catch (e) {
        redirect("/login");
        return null;
    }

    if (payload.role !== "BOSHLIQ" && payload.role !== "SUPERADMIN" && payload.role !== "OWNER") {
        redirect("/employee-portal");
        return null;
    }

    let serializedMessages: any[] = [];
    let serializedUsers: any[] = [];
    
    try {
        // Avval joriy kompaniyadagi barcha foydalanuvchilar IDlarini olamiz
        const companyUsers = await prisma.user.findMany({
            where: { companyId: payload.companyId },
            select: { id: true, name: true, role: true, employeeProfile: { select: { position: true } } }
        });
        const companyUserIds = companyUsers.map((u: any) => u.id);

        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { recipientId: payload.id },
                    { senderId: payload.id },
                    // Boshliq bo'lsa, xodimlar tomonidan null qilib yuborilgan umumiy murojaatlarni ham oladi
                    { recipientId: null, senderId: { in: companyUserIds } }
                ]
            },
            orderBy: { createdAt: "asc" }
        });

        const users = companyUsers;

        serializedMessages = JSON.parse(JSON.stringify(messages));
        serializedUsers = JSON.parse(JSON.stringify(users));
    } catch (error) {
        console.error("Messages page data fetch error:", error);
    }

    return (
        <div style={{ minHeight: "calc(100vh - 140px)", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>
                Xabarlar (Inbox)
            </h2>
            <MessagesClient
                initialMessages={serializedMessages}
                users={serializedUsers}
                currentUserId={payload.id}
            />
        </div>
    );
}
