import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email manzili ko'rsatilmagan" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Foydalanuvchi topilmadi" },
                { status: 404 }
            );
        }

        if (user.isEmailVerified) {
            return NextResponse.json(
                { error: "Bu email allaqachon tasdiqlangan" },
                { status: 400 }
            );
        }

        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        await prisma.user.update({
            where: { email },
            data: { verificationCode: newCode }
        });

        // Emailni fon rejimida yuboramiz — javob darhol qaytadi
        after(async () => {
            await sendVerificationEmail(email, newCode);
        });

        return NextResponse.json(
            { message: "Tasdiqlash kodi elektron pochtangizga qayta yuborildi." },
            { status: 200 }
        );

    } catch (error) {
        console.error("Kodni qayta yuborish xatosi:", error);
        return NextResponse.json(
            { error: "Server xatosi yuz berdi" },
            { status: 500 }
        );
    }
}
