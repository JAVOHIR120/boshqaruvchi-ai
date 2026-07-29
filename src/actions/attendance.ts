"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "./auth";

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

export async function updateOfficeLocation(lat: number, lng: number, radius: number, workStartTime?: string) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "BOSHLIQ")) {
        return { error: "Ruxsat etilmagan" };
    }
    
    if (!user.companyId) return { error: "Kompaniya mavjud emas" };

    await prisma.company.update({
        where: { id: user.companyId },
        data: {
            officeLat: lat,
            officeLng: lng,
            officeRadius: radius,
            ...(workStartTime && { workStartTime })
        } as any
    });

    revalidatePath("/settings");
    return { success: true };
}

export async function processGeolocationAttendance(lat: number, lng: number, actionType: "CHECK_IN" | "CHECK_OUT", deviceInfo: string = "") {
    const user = await getCurrentUser();
    if (!user) return { error: "Avtorizatsiyadan o'tilmagan" };

    const employee = await prisma.employee.findUnique({
        where: { userId: user.id }
    });

    if (!employee) return { error: "Sizda xodim profili mavjud emas!" };

    const company = await prisma.company.findUnique({
        where: { id: user.companyId || "" }
    });

    if (!company) return { error: "Kompaniya topilmadi" };
    
    if (!company.officeLat || !company.officeLng) {
        return { error: "Kompaniya joylashuvi belgilanmagan. Iltimos, Boshliqqa murojaat qiling." };
    }

    const distance = getDistanceInMeters(lat, lng, (company as any).officeLat, (company as any).officeLng);
    if (distance > ((company as any).officeRadius || 50)) {
        return { error: `Siz ofis hududida emassiz! (Masofangiz: ${Math.round(distance)} metr. Ruxsat etilgan: ${(company as any).officeRadius || 50}m)` };
    }

    const employeeId = employee.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findFirst({
        where: {
            employeeId,
            date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        }
    });

    const now = new Date();
    let status = "PRESENT";
    
    if (actionType === "CHECK_IN") {
        const [hours, minutes] = ((company as any).workStartTime || "09:00").split(":");
        const deadline = new Date();
        deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        if (now > deadline) {
            status = "LATE";
        }
    }

    if (existing) {
        const dataToUpdate: any = {
            deviceInfo: deviceInfo || existing.deviceInfo
        };
        
        if (actionType === "CHECK_IN") {
             dataToUpdate.checkIn = now;
             dataToUpdate.checkInLat = lat;
             dataToUpdate.checkInLng = lng;
             // LATE statusini PRESENT ga qayta o'zgartirmaymiz
             if (existing.status !== "LATE") dataToUpdate.status = status;
        } else {
             dataToUpdate.checkOut = now;
             dataToUpdate.checkOutLat = lat;
             dataToUpdate.checkOutLng = lng;
        }

        await prisma.attendance.update({
            where: { id: existing.id },
            data: dataToUpdate
        });
    } else {
        if (actionType === "CHECK_OUT") {
             return { error: "Siz bugun ishga kelganingizni hali qayd etmagansiz (Check In qilinmagan)!" };
        }
        await prisma.attendance.create({
            data: {
                employeeId,
                status,
                date: now,
                checkIn: now,
                checkInLat: lat,
                checkInLng: lng,
                deviceInfo
            } as any
        });

        if (actionType === "CHECK_IN") {
            const { processDisciplineEvent } = await import("@/lib/kpi-engine");
            let minutesLate = 0;
            if (status === "LATE") {
                const [h, m] = ((company as any).workStartTime || "09:00").split(":");
                const deadline = new Date();
                deadline.setHours(parseInt(h), parseInt(m), 0, 0);
                minutesLate = Math.max(0, Math.floor((now.getTime() - deadline.getTime()) / 60000));
            }

            await processDisciplineEvent({
                employeeId: employeeId,
                type: status === "LATE" ? "LATE_ATTENDANCE" : "ON_TIME_ATTENDANCE",
                description: status === "LATE" ? "Siz ofisga kechikib keldingiz (GPS orqali)." : "Siz ofisga o'z vaqtida keldingiz (GPS).",
                metadata: { minutesLate }
            });
        }
    }

    revalidatePath("/employee-portal");
    revalidatePath("/employees");
    return { success: true, status, distance: Math.round(distance) };
}

export async function getDailyAttendanceReport() {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Ruxsat etilmagan" };

    const company = await prisma.company.findUnique({
        where: { id: user.companyId }
    });
    
    if (!company) return { error: "Kompaniya topilmadi" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const employees = await prisma.employee.findMany({
        where: { companyId: user.companyId },
        include: {
            attendances: {
                where: { date: { gte: today } }
            }
        }
    });

    const [hours, minutes] = (company.workStartTime || "09:00").split(":");
    const deadline = new Date();
    deadline.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    let onTime = 0;
    let late = 0;
    let notArrived = 0;

    employees.forEach(emp => {
        if (emp.attendances.length === 0) {
            notArrived++;
        } else {
            const att = emp.attendances[0];
            if (att.status === "LATE") late++;
            else onTime++;
        }
    });

    return {
        success: true,
        report: {
            total: employees.length,
            onTime,
            late,
            notArrived,
            deadline: company.workStartTime
        }
    };
}

export async function getTodayCompanyAttendance() {
    const user = await getCurrentUser();
    if (!user || !user.companyId) return { error: "Ruxsat etilmagan" };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendances = await prisma.attendance.findMany({
        where: {
            date: {
                gte: today
            },
            employee: {
                companyId: user.companyId
            }
        },
        include: {
            employee: {
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            }
        },
        orderBy: {
            checkIn: 'desc'
        } as any
    });

    return { success: true, attendances };
}


