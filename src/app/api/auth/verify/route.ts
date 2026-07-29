import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import { ALL_MODULE_IDS } from "@/lib/modules";

export async function POST(req: Request) {
    try {
        const { email, code } = await req.json();

        if (!email || !code) {
            return NextResponse.json(
                { error: "Email va kod kiritilishi shart" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: { select: { enabledModules: true } } }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Foydalanuvchi topilmadi" },
                { status: 404 }
            );
        }

        if (user.verificationCode !== code) {
            return NextResponse.json(
                { error: "Tasdiqlash kodi noto'g'ri" },
                { status: 400 }
            );
        }

        // Tasdiqlandi
        await prisma.user.update({
            where: { email },
            data: {
                isEmailVerified: true,
                verificationCode: null, // Xavfsizlik uchun kodni tozalaymiz
            }
        });

        // Modullarni aniqlash
        const enabledModules = user.role === "OWNER"
            ? ALL_MODULE_IDS
            : (user.company?.enabledModules?.length ? user.company.enabledModules : ALL_MODULE_IDS);

        // Token berilib avtorizatsiya qilish jarayoni
        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            enabledModules,
        });

        const response = NextResponse.json(
            { message: "Pochta muvaffaqiyatli tasdiqlandi!", role: user.role },
            { status: 200 }
        );

        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: 7 * 24 * 60 * 60, // 7 kun
        });

        return response;

    } catch (error) {
        console.error("Kodni tasdiqlashda xatolik:", error);
        return NextResponse.json(
            { error: "Server xatosi yuz berdi" },
            { status: 500 }
        );
    }
}
