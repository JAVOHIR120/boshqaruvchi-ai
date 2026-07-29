import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json({ error: "Avtorizatsiya talab qilinadi" }, { status: 401 });
        }

        const payload = verifyToken(token);
        if (!payload || !payload.companyId) {
            return NextResponse.json({ error: "Kompaniya topilmadi" }, { status: 403 });
        }

        const { transactions } = await req.json();

        if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
            return NextResponse.json({ error: "Ma'lumotlar topilmadi" }, { status: 400 });
        }

        // Validate and create transactions
        const validTransactions = transactions
            .filter((t: any) => t.description && !isNaN(t.amount) && t.amount > 0)
            .map((t: any) => ({
                description: String(t.description).substring(0, 255),
                amount: parseFloat(t.amount),
                type: t.type === "INCOME" ? "INCOME" : "EXPENSE",
                category: String(t.category || "OTHER").substring(0, 50),
                companyId: payload.companyId as string,
            }));

        if (validTransactions.length === 0) {
            return NextResponse.json({ error: "To'g'ri formatdagi ma'lumotlar topilmadi" }, { status: 400 });
        }

        const result = await prisma.transaction.createMany({
            data: validTransactions,
        });

        return NextResponse.json({ success: true, count: result.count }, { status: 200 });
    } catch (error: any) {
        console.error("Excel import xatosi:", error);
        return NextResponse.json({ error: "Server xatosi: " + error.message }, { status: 500 });
    }
}
