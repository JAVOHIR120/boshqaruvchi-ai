import { prisma } from "@/lib/prisma";
import TaskBoard from "./components/TaskBoard";
import AiTaskGenerator from "./components/AiTaskGenerator";
import BottleneckAlert from "./components/BottleneckAlert";
import AiStandupPanel from "./components/AiStandupPanel";
import styles from "./tasks.module.css";
import { CheckSquare } from "lucide-react";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const [tasks, employeesData] = await Promise.all([
        prisma.kanbanTask.findMany({
            where: { companyId: currentUser.companyId },
            orderBy: { createdAt: "desc" }
        }),
        prisma.employee.findMany({
            where: { companyId: currentUser.companyId },
            include: { user: true }
        })
    ]);

    const employeesList = employeesData.map(e => ({
        id: e.user?.name || "Noma'lum",
        name: e.user?.name || "Noma'lum"
    }));

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <CheckSquare size={28} color="var(--primary-color)" />
                        Vazifalar (Task Management)
                    </h1>
                    <p className={styles.subtitle}>
                        AI-quvvatli avtomatik ish taqsimoti va OKR nazorati
                    </p>
                </div>
                <div className={styles.headerActions}>
                    <AiStandupPanel />
                    <BottleneckAlert />
                    <AiTaskGenerator />
                </div>
            </div>

            <TaskBoard initialTasks={tasks} employees={employeesList} />
        </div>
    );
}
