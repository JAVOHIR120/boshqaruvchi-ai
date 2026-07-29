import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBase64Image } from "@/utils/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { employeeId, type, photoUrl } = body;

    if (!employeeId || typeof employeeId !== "string") {
      return NextResponse.json({ success: false, error: "employeeId noto'g'ri" }, { status: 400 });
    }
    if (!type || !["CHECK_IN", "CHECK_OUT", "AUTO"].includes(type)) {
      return NextResponse.json({ success: false, error: "type noto'g'ri" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) {
      return NextResponse.json({ success: false, error: "Xodim topilmadi" }, { status: 404 });
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    let attendance = await prisma.attendance.findFirst({
      where: { employeeId, date: { gte: startOfDay, lte: endOfDay } },
    });

    // AUTO rejim: server o'zi CHECK_IN yoki CHECK_OUT ekanini aniqlaydi
    let effectiveType = type;
    if (type === "AUTO") {
      if (!attendance) {
        effectiveType = "CHECK_IN";
      } else if (!attendance.checkOut) {
        effectiveType = "CHECK_OUT";
      } else {
        return NextResponse.json({ success: false, error: "Siz bugun allaqachon kelgansiz va ketgansiz" }, { status: 400 });
      }
    }

    if (effectiveType === "CHECK_IN") {
      if (attendance) {
        return NextResponse.json({ success: false, error: "Siz bugun allaqachon kelgansiz" }, { status: 400 });
      }

      let status = "PRESENT";
      if (employee.companyId) {
        const company = await prisma.company.findUnique({ where: { id: employee.companyId } });
        if (company?.workStartTime) {
          const [h, m] = company.workStartTime.split(":").map(Number);
          const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
          if (now > workStart) status = "LATE";
        }
      }

      const savedPhotoUrl = photoUrl ? await saveBase64Image(photoUrl, `checkin-${employeeId}`) : null;

      attendance = await prisma.attendance.create({
        data: { employeeId, date: now, checkIn: now, checkInPhotoUrl: savedPhotoUrl, status },
      });

      // MUKAMMAL KPI AVTOMATIZATSIYASI
      const { processDisciplineEvent } = await import("@/lib/kpi-engine");
      let minutesLate = 0;
      if (status === "LATE" && employee.companyId) {
        const company = await prisma.company.findUnique({ where: { id: employee.companyId } });
        if (company?.workStartTime) {
          const [h, m] = company.workStartTime.split(":").map(Number);
          const workStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
          minutesLate = Math.max(0, Math.floor((now.getTime() - workStart.getTime()) / 60000));
        }
      }

      await processDisciplineEvent({
        employeeId: employeeId,
        type: status === "LATE" ? "LATE_ATTENDANCE" : "ON_TIME_ATTENDANCE",
        description: status === "LATE" ? "Siz ishga belgilangan vaqtdan kech qolib keldingiz." : "Siz ishga o'z vaqtida, intizomli keldingiz.",
        metadata: { minutesLate }
      });

      return NextResponse.json({
        success: true,
        message: status === "LATE" ? "Ishga keldi (Kechikish bilan)" : "Ishga keldi ✓",
        attendance,
      });
    }

    if (effectiveType === "CHECK_OUT") {
      if (!attendance) {
        return NextResponse.json({ success: false, error: "Avval ishga kelganingizni qayd eting" }, { status: 400 });
      }
      if (attendance.checkOut) {
        return NextResponse.json({ success: false, error: "Allaqachon ketgansiz" }, { status: 400 });
      }

      const savedPhotoUrl = photoUrl ? await saveBase64Image(photoUrl, `checkout-${employeeId}`) : null;

      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: { checkOut: now, checkOutPhotoUrl: savedPhotoUrl },
      });
      return NextResponse.json({ success: true, message: "Ishdan ketdi ✓", attendance });
    }

    return NextResponse.json({ success: false, error: "Noto'g'ri so'rov" }, { status: 400 });
  } catch (error: any) {
    console.error("[FACE-ID CHECK ERROR]", error);
    return NextResponse.json({ success: false, error: "Server xatoligi" }, { status: 500 });
  }
}
