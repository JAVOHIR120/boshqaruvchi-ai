import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || !user.companyId) {
            return NextResponse.json({ error: "Avtorizatsiya xatosi" }, { status: 401 });
        }

        // Barcha faol vazifalarni olish
        const tasks = await prisma.kanbanTask.findMany({
            where: { companyId: user.companyId },
        });

        const now = new Date();

        // Statistika hisoblash
        const todoTasks = tasks.filter(t => t.status === "TODO");
        const inProgressTasks = tasks.filter(t => t.status === "IN_PROGRESS");
        const doneTasks = tasks.filter(t => t.status === "DONE");
        const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE");
        const highPriorityPending = tasks.filter(t => t.priority === "HIGH" && t.status !== "DONE");

        // Har bir xodimning ish yuklamasini hisoblash
        const workloadMap: Record<string, { total: number; overdue: number; high: number }> = {};
        tasks.filter(t => t.status !== "DONE").forEach(t => {
            const name = t.assignedTo || "Biriktirilmagan";
            if (!workloadMap[name]) workloadMap[name] = { total: 0, overdue: 0, high: 0 };
            workloadMap[name].total++;
            if (t.dueDate && new Date(t.dueDate) < now) workloadMap[name].overdue++;
            if (t.priority === "HIGH") workloadMap[name].high++;
        });

        // Xavfli holatlarni aniqlash
        const alerts: Array<{ type: string; severity: "critical" | "warning" | "info"; message: string; assignee?: string }> = [];

        // Overdue alert
        if (overdueTasks.length > 0) {
            alerts.push({
                type: "OVERDUE",
                severity: "critical",
                message: `${overdueTasks.length} ta vazifaning muddati o'tib ketgan!`
            });
        }

        // Overloaded employees
        Object.entries(workloadMap).forEach(([name, data]) => {
            if (data.total >= 5) {
                alerts.push({
                    type: "OVERLOAD",
                    severity: "critical",
                    message: `${name} da ${data.total} ta faol vazifa yig'ilib qolgan`,
                    assignee: name
                });
            } else if (data.total >= 3) {
                alerts.push({
                    type: "BUSY",
                    severity: "warning",
                    message: `${name} sezilarli band (${data.total} ta vazifa)`,
                    assignee: name
                });
            }
        });

        // High priority pending
        if (highPriorityPending.length > 2) {
            alerts.push({
                type: "HIGH_PRIORITY",
                severity: "warning",
                message: `${highPriorityPending.length} ta yuqori ustuvorlikdagi vazifa hali bajarilmagan`
            });
        }

        // Idle employees (hech qanday vazifasi yo'q)
        const employees = await prisma.employee.findMany({
            where: { companyId: user.companyId },
            include: { user: true }
        });

        const idleEmployees = employees.filter(e => {
            const name = e.user?.name || "";
            return !workloadMap[name] || workloadMap[name].total === 0;
        });

        if (idleEmployees.length > 0) {
            alerts.push({
                type: "IDLE",
                severity: "info",
                message: `${idleEmployees.map(e => e.user?.name).join(", ")} xodimlarga vazifa biriktirilmagan`
            });
        }

        // AI tavsiya olish (agar xavflar bo'lsa)
        let aiRecommendation = "";
        if (alerts.length > 0) {
            try {
                const alertSummary = alerts.map(a => `[${a.severity}] ${a.message}`).join("\n");
                const prompt = `Siz professional biznes boshqaruv sistemasining AI maslahatchiisiz.

Quyidagi vazifa holatlariga qarang:
- Jami vazifalar: ${tasks.length} (TODO: ${todoTasks.length}, Jarayonda: ${inProgressTasks.length}, Tugatildi: ${doneTasks.length})
- Muddati o'tganlar: ${overdueTasks.length}
- Xavf signallari:
${alertSummary}

Bo'sh xodimlar: ${idleEmployees.map(e => e.user?.name).join(", ") || "yo'q"}

2-3 qatorlik ANIQ va HARAKATGA UNDOVCHI maslahat yozing. O'zbek tilida. Oddiy so'zlar bilan, boshliqqa gapirganday.`;

                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash-lite",
                    contents: prompt,
                    config: { temperature: 0.3 }
                });
                aiRecommendation = response.text?.trim() || "";
            } catch (err) {
                console.error("AI tavsiya xatosi:", err);
                aiRecommendation = "";
            }
        }

        return NextResponse.json({
            alerts,
            stats: {
                total: tasks.length,
                todo: todoTasks.length,
                inProgress: inProgressTasks.length,
                done: doneTasks.length,
                overdue: overdueTasks.length,
                highPriority: highPriorityPending.length
            },
            workload: workloadMap,
            aiRecommendation,
            idleEmployees: idleEmployees.map(e => e.user?.name || "")
        });

    } catch (error) {
        console.error("Task analysis xatosi:", error);
        return NextResponse.json({ error: "Xatolik yuz berdi" }, { status: 500 });
    }
}

