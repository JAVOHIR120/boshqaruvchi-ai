import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { LogOut, Calendar, CheckSquare, Target, MessageSquare } from "lucide-react";
import styles from "./employee.module.css";
import EmployeeDashboard from "./components/EmployeeDashboard";

export default async function EmployeePortalPage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
        redirect("/login");
    }

    let payload;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const jwt = await jose.jwtVerify(token, secret);
        payload = jwt.payload;
    } catch (e) {
        redirect("/login");
    }

    if (payload.role !== "XODIM") {
        redirect("/dashboard");
    }

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        include: { employeeProfile: true, company: true }
    });

    if (!user || !user.employeeProfile) {
        return <div>Xodim profili topilmadi!</div>;
    }

    // Fetch tasks
    const tasks = await prisma.kanbanTask.findMany({
        where: { assignedTo: user.name }
    });

    // Fetch attendance
    const attendance = await prisma.attendance.findMany({
        where: { employeeId: user.employeeProfile.id },
        orderBy: { date: 'desc' },
        take: 30
    });

    // Fetch all messages for this employee (sent + received)
    const allMessages = await prisma.message.findMany({
        where: {
            OR: [
                { senderId: user.id },
                { recipientId: user.id },
                // Broadcast messages from bosses in same company
                { recipientId: null, senderId: { in: (await prisma.user.findMany({ where: { companyId: user.companyId!, role: { in: ["BOSHLIQ", "OWNER", "SUPERADMIN"] } }, select: { id: true } })).map(u => u.id) } }
            ]
        },
        orderBy: { createdAt: "asc" }
    });

    // Fetch boss users in same company
    const bossUsers = await prisma.user.findMany({
        where: { companyId: user.companyId!, role: { in: ["BOSHLIQ", "OWNER", "SUPERADMIN"] } },
        select: { id: true, name: true, role: true }
    });

    return (
        <div className={styles.portalContainer}>
            <header className={styles.header}>
                <div className={styles.logo}>
                    <img src="/logo.png" alt="Logo" width="32" height="32" loading="eager" fetchPriority="high" decoding="sync" style={{ borderRadius: "50%", objectFit: "cover", aspectRatio: "1/1" }} />
                    Boshqaruvchi AI - Xodimlar Portali
                </div>
                <div className={styles.userInfo}>
                    <span>{user.name}</span>
                    <span className={styles.badge}>{user.employeeProfile.position}</span>
                    <Link href="/login" className={styles.logoutBtn}>
                        <LogOut size={16} /> Chiqish
                    </Link>
                </div>
            </header>

            <main className={styles.mainContent}>
                <EmployeeDashboard user={JSON.parse(JSON.stringify(user))} tasks={JSON.parse(JSON.stringify(tasks))} attendance={JSON.parse(JSON.stringify(attendance))} allMessages={JSON.parse(JSON.stringify(allMessages))} bossUsers={JSON.parse(JSON.stringify(bossUsers))} />
            </main>
        </div>
    );
}
