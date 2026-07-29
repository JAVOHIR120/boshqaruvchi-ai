"use server";

import { prisma } from "@/lib/prisma";

export async function getEmployeeEfficiency(companyId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [employees, tasks] = await Promise.all([
        prisma.employee.findMany({
            where: { companyId },
            include: {
                user: { select: { name: true } },
                attendances: {
                    where: { date: { gte: thirtyDaysAgo } },
                    select: { status: true }
                }
            }
        }),
        prisma.kanbanTask.findMany({
            where: { 
                companyId,
                status: "DONE", 
                updatedAt: { gte: thirtyDaysAgo } 
            }
        })
    ]);

    return employees.map(emp => {
        const presentDays = emp.attendances.filter(a => a.status === "PRESENT").length;
        const completedTasks = tasks.filter(t => t.assignedTo === emp.user.name || t.assignedTo === emp.id).length;
        
        // Weighted Logic: Attendance (40%), Task Completion (40%), Manual KPI (20%)
        // Normalized to 100
        const attendanceScore = Math.min((presentDays / 20) * 100, 100); // 20 days = 100%
        const taskScore = Math.min(completedTasks * 20, 100); // 5 tasks = 100%
        
        const rawScore = (attendanceScore * 0.4) + (taskScore * 0.4) + (emp.performance * 0.2);
        const efficiencyScore = Math.max(0, Math.round(rawScore - (emp.yellowCards * 5) - (emp.redCards * 20)));

        return {
            id: emp.id,
            name: emp.user.name,
            position: emp.position,
            efficiencyScore,
            completedTasks,
            presentDays,
            yellowCards: emp.yellowCards,
            redCards: emp.redCards
        };
    }).sort((a, b) => b.efficiencyScore - a.efficiencyScore);
}
