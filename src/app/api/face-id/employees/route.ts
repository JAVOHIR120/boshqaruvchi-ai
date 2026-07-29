import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const allEmployees = await prisma.employee.findMany({
      include: { user: true },
    });

    // Faqat face descriptor mavjud va to'g'ri formatdagi xodimlarni qaytarish
    const employees = allEmployees
      .filter((emp) => {
        if (!emp.faceDescriptor) return false;
        // faceDescriptor array bo'lishi va 128 ta elementdan iborat bo'lishi kerak
        const desc = emp.faceDescriptor as any;
        return Array.isArray(desc) && desc.length === 128;
      })
      .map((emp) => ({
        id: emp.id,
        userId: emp.userId,
        name: emp.user.name,
        faceDescriptor: emp.faceDescriptor,
      }));

    return NextResponse.json({ success: true, employees });
  } catch (error: any) {
    console.error("[FACE-ID EMPLOYEES ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Xodimlarni yuklashda xatolik yuz berdi" },
      { status: 500 }
    );
  }
}
