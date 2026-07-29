import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveBase64Image } from "@/utils/storage";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, faceDescriptor, avatarBase64 } = body;

    // Validatsiya
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ success: false, error: "userId noto'g'ri" }, { status: 400 });
    }
    if (!faceDescriptor || !Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return NextResponse.json({ success: false, error: "Face descriptor noto'g'ri yoki to'liq emas (128 ta qiymat kutilgan)" }, { status: 400 });
    }
    if (!avatarBase64 || typeof avatarBase64 !== "string") {
      return NextResponse.json({ success: false, error: "Avatar rasmi topilmadi" }, { status: 400 });
    }

    // Employee ni qidiramiz
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Xodim profili topilmadi. Avval Xodimlar bo'limidan ro'yxatga oling." }, { status: 404 });
    }

    const savedAvatarUrl = await saveBase64Image(avatarBase64, `avatar-${userId}`);

    // Employee ga face descriptor va avatar saqlaymiz
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        faceDescriptor: faceDescriptor,
        avatarUrl: savedAvatarUrl,
      },
    });

    // User profiliga ham avatar qo'yamiz (tizim bo'ylab ko'rinishi uchun)
    await prisma.user.update({
      where: { id: userId },
      data: { avatarBase64: savedAvatarUrl },
    });

    return NextResponse.json({ success: true, message: "Face ID muvaffaqiyatli saqlandi" });
  } catch (error: any) {
    console.error("[FACE-ID REGISTER ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Server xatoligi yuz berdi. Keyinroq qayta urinib ko'ring." },
      { status: 500 }
    );
  }
}
