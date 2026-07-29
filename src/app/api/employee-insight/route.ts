import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

export async function POST(req: Request) {
    try {
        const { employeeId } = await req.json();

        if (!employeeId) {
            return NextResponse.json({ success: false, error: "employeeId is required" }, { status: 400 });
        }

        // Fetch employee data
        const employee = await prisma.employee.findUnique({
            where: { id: employeeId },
            include: {
                user: true,
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 30 // Last 30 days
                }
            }
        });

        if (!employee) {
            return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }

        // Prepare context for AI
        const presentCount = employee.attendances.filter(a => a.status === 'PRESENT').length;
        const absentCount = employee.attendances.filter(a => a.status === 'ABSENT').length;
        const totalDays = employee.attendances.length;
        const attendanceRate = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

        const employeeContext = `
        Xodimning ismi: ${employee.user.name}
        Lavozimi: ${employee.position}
        Ishga kirgan sanasi: ${new Date(employee.startDate).toLocaleDateString("uz-UZ")}
        Oyligi: ${employee.salary} so'm
        Samaradorlik (KPI): ${employee.performance}%
        Jazo kartochkalari: ${employee.yellowCards} ta sariq, ${employee.redCards} ta qizil
        So'nggi 30 kunlik davomat: ${totalDays} kun ichida ${presentCount} kun kelgan, ${absentCount} kun sababsiz kelmagan. (Davomat: ${attendanceRate}%)
        `;

        if (!geminiApiKey) {
            console.warn("GEMINI_API_KEY is not set. Generating a mock response.");
            return NextResponse.json({
                success: true,
                analysis: `⚠️ **[SIMULYATSIYA REJIMI: GEMINI_API_KEY o'rnatilmagan]**\n\n**Xodim samaradorligi tahlili:**\n* **KPI va Samaradorlik:** Xodim **${employee.user.name}** joriy KPI ko'rsatkichi **${employee.performance}%** ni tashkil etadi.\n* **Davomat va Intizom:** So'nggi 30 kunlik davomat ko'rsatkichi **${attendanceRate}%**. Tizimda uning ${employee.yellowCards} ta sariq va ${employee.redCards} ta qizil kartochkasi qayd etilgan.\n* **Rahbariyat uchun tavsiya:** Xodimning ko'rsatkichlari asosida uni rag'batlantirish yoki intizomiy choralarni muhokama qilish uchun u bilan suhbat o'tkazish tavsiya qilinadi.`
            });
        }

        // Call Gemini AI
        const prompt = `Siz Boshqaruvchi AI tizimining yetakchi HR bo'yicha sun'iy intellekt maslahatchisisiz.
        Sizga bitta xodimning (o'zbekistonlik biznes muhitida ishlaydigan) ma'lumotlari berilmoqda. 

        Quyidagi ma'lumotlarga asoslanib xodimning ishidagi ijobiy va salbiy tomonlarni qisqa tahlil qilib, boshqaruvchi (rahbar) uchun amaliy "harakatlar rejasi" (tavsiyalar) bering. 
        Javobni o'zbek tilida (lotin yozuvida), toza va professional tilda yozing. Matn hajmi 4-5 ta qisqa xat boshidan (paragraf) iborat bo'lsin.
        Agar sariq/qizil kartochkalar bo'lsa yoki davomat past bo'lsa, xodimni jarimaga tortish yoki gaplashib olishni maslahat bering. 
        Agar KPI baland bo'lsa mukofotlashni tavsiya qiling.

        Xodim ma'lumotlari:
        ${employeeContext}
        `;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error("AI individual insight error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

