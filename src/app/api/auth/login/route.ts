import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/jwt";
import { sendVerificationEmail } from "@/lib/email";
import { ALL_MODULE_IDS } from "@/lib/modules";

export async function POST(req: Request) {
    try {
        let { email, password } = await req.json();
        
        if (email) email = email.trim().toLowerCase();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email va parolni kiriting!" },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { company: { select: { enabledModules: true } } }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Email yoki parol noto'g'ri!" },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: "Email yoki parol noto'g'ri!" },
                { status: 401 }
            );
        }

        // Modullarni aniqlash
        const enabledModules = user.role === "OWNER"
            ? ALL_MODULE_IDS
            : (user.company?.enabledModules?.length ? user.company.enabledModules : ALL_MODULE_IDS);

        // --- SMART EMAIL VERIFICATION ---
        // Barcha foydalanuvchilar (Owner, Boshliq, Xodim) uchun avtorizatsiyaga ruxsat
        if (["OWNER", "BOSHLIQ", "XODIM"].includes(user.role) || user.isEmailVerified) {
            const token = signToken({
                id: user.id,
                email: user.email,
                role: user.role,
                companyId: user.companyId,
                enabledModules,
            });

            // OWNER emailini avtomatik tasdiqlaymiz
            if (user.role === "OWNER" && !user.isEmailVerified) {
                await prisma.user.update({
                    where: { email },
                    data: { isEmailVerified: true }
                });
            }

            const response = NextResponse.json(
                { message: "Muvaffaqiyatli kirdingiz!", role: user.role },
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
        }

        // Tasdiqlanmagan foydalanuvchilar uchun email kod yuboriladi
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
            {
                message: "Tasdiqlash kodi pochtangizga yuborildi.",
                requireVerification: true,
                email: user.email
            },
            { status: 403 }
        );
    } catch (error) {
        console.error("Login xatoligi:", error);
        return NextResponse.json(
            { error: "Tizim xatoligi yuz berdi" },
            { status: 500 }
        );
    }
}
