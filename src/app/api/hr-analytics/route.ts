import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

export async function GET(req: Request) {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch employees with attendance and tasks for efficiency scoring
        const employees = await prisma.employee.findMany({
            include: {
                user: { select: { name: true, role: true } },
                attendances: {
                    where: { date: { gte: thirtyDaysAgo } },
                    select: { status: true, date: true }
                },
                inventoryItems: { select: { id: true } } // Responsibility factor
            }
        });

        // Current open tasks to correlate with employees (if assigned)
        const tasks = await prisma.kanbanTask.findMany({
            where: { status: "DONE", updatedAt: { gte: thirtyDaysAgo } }
        });

        if (!employees || employees.length === 0) {
            return NextResponse.json({ success: false, error: "Tizimda xodimlar mavjud emas" }, { status: 404 });
        }

        let teamDataString = "";
        
        const analyzedEmployees = employees.map(emp => {
            const presentDays = emp.attendances.filter(a => a.status === "PRESENT").length;
            const lateDays = emp.attendances.filter(a => a.status === "LATE").length;
            const completedTasks = tasks.filter(t => t.assignedTo === emp.user.name || t.assignedTo === emp.id).length;
            
            // Professional Efficiency Logic (Weighted Score)
            // Attendance: 40%, Tasks: 40%, Existing KPI: 20%
            const attendanceScore = (presentDays / 22) * 100; // Assuming 22 work days
            const taskScore = Math.min(completedTasks * 20, 100); // 5 tasks = 100%
            const efficiencyScore = Math.round((attendanceScore * 0.4) + (taskScore * 0.4) + (emp.performance * 0.2) - (emp.yellowCards * 5) - (emp.redCards * 20));

            teamDataString += `
            - **${emp.user.name}** (${emp.position}): 
              Samaradorlik: ${efficiencyScore}%, KPI: ${emp.performance}%, 
              Davomat: ${presentDays} kun, Kechikishlar: ${lateDays}, 
              Yopilgan vazifalar: ${completedTasks}. 
              Jazolar: ${emp.yellowCards}🟨, ${emp.redCards}🟥.`;

            return { ...emp, efficiencyScore };
        });

        if (!geminiApiKey) {
            return NextResponse.json({
                success: true,
                analysis: "GEMINI_API_KEY sozlanmagan. Tizim mantiqiy hisob-kitoblarni yakunladi."
            });
        }

        const prompt = `SIZ "Boshqaruvchi AI" TIZIMINING OLIY DARAJALI HR ANALITIGISIZ.
Sizga korxona xodimlarining so'nggi 30 kunlik matematik tahlillari berilmoqda. 

VAZIFANGIZ:
1. **Executive Summary**: Jamoaning umumiy unumdorligiga (Efficiency Score asosida) professional baho bering.
2. **Top Performers**: Eng yuqori koeffitsiyentga ega 2 ta xodimni va ularning muvaffaqiyat omilini ko'rsating.
3. **Risk Analysis**: Samaradorligi tushib ketgan yoki intizomi sust xodimlar bo'yicha "Executive Decision" (rahbar uchun qaror variantlari) bering.
4. **Strategic Roadmap**: Kelgusi oy uchun jamoa unumdorligini 15% ga oshirish uchun 3 ta aniq choralarni taklif qiling.

MUHIM: O'zbek tilida, juda jiddiy va tahliliy ohangda yozing. "O'yin" yoki "Gamifikatsiya" elementlaridan foydalanmang!

STATISTIKA:
${teamDataString}
`;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        return NextResponse.json({ success: true, analysis, employeeScores: analyzedEmployees.map(e => ({ id: e.id, score: e.efficiencyScore })) });

    } catch (error: any) {
        console.error("AI team analytics error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

