import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Barcha maydonlarni to'ldirish majburiy!" },
                { status: 400 }
            );
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Agar mavjud bo'lsa lekin hali tasdiqlanmagan bo'lsa kodni qayta yuborish imkoni
            if (!existingUser.isEmailVerified) {
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
                    { message: "Tasdiqlash kodi elektron pochtangizga qayta yuborildi.", requireVerification: true, email },
                    { status: 200 }
                );
            }

            return NextResponse.json(
                { error: "Bu email bilan foydalanuvchi mavjud!" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = "BOSHLIQ";
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const company = await prisma.company.create({
            data: { name: `${name}ning Kompaniyasi` }
        });

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                verificationCode,
                isEmailVerified: false,
                companyId: company.id
            },
        });

        // Emailni fon rejimida yuboramiz — foydalanuvchi kutmaydi
        after(async () => {
            await sendVerificationEmail(email, verificationCode);
        });

        return NextResponse.json(
            { message: "Tasdiqlash kodi elektron pochtangizga yuborildi!", requireVerification: true, email },
            { status: 201 }
        );
    } catch (error) {
        console.error("Ro'yxatdan o'tish xatosi:", error);
        return NextResponse.json(
            { error: "Server xatosi yuz berdi" },
            { status: 500 }
        );
    }
}
