import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import { ALL_MODULE_IDS } from '@/lib/modules';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/login?error=Google_ruxsati_olinmadi`);
    }

    try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: code,
                client_id: process.env.GOOGLE_CLIENT_ID?.trim()!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET?.trim()!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Google Token Error:", tokenData);
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/login?error=Token_xatoligi:${tokenData.error_description || tokenData.error}`);
        }

        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const googleUser = await userResponse.json();

        if (!googleUser.email) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/login?error=Email_topilmadi`);
        }

        let user = await prisma.user.findUnique({
            where: { email: googleUser.email },
            include: { company: { select: { enabledModules: true } } }
        });

        let companyModules: string[] = ALL_MODULE_IDS;

        if (!user) {
            // Standart parol beramiz, shunda ular email va parol orqali ham kira olishadi.
            const defaultPassword = "12345678";
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            const company = await prisma.company.create({
                data: { name: `${googleUser.name || "Foydalanuvchi"}ning Kompaniyasi` }
            });

            user = await prisma.user.create({
                data: {
                    name: googleUser.name || "Foydalanuvchi",
                    email: googleUser.email,
                    password: hashedPassword,
                    role: "BOSHLIQ", // Avtomatik BOSHLIQ roliga tayinlanadi
                    companyId: company.id
                },
                include: { company: { select: { enabledModules: true } } }
            }) as any;
        } else if (!user.companyId) {
            // Multitenancy qo'shilgunga qadar ro'yxatdan o'tgan eski foydalanuvchilar
            const company = await prisma.company.create({
                data: { name: `${user.name || "Foydalanuvchi"}ning Kompaniyasi` }
            });

            user = await prisma.user.update({
                where: { id: user.id },
                data: { companyId: company.id },
                include: { company: { select: { enabledModules: true } } }
            }) as any;
        }

        // Google orqali kirgan foydalanuvchining emailini avtomatik tasdiqlaymiz
        if (user && !user.isEmailVerified) {
            await prisma.user.update({
                where: { id: user.id },
                data: { isEmailVerified: true }
            });
        }

        if (!user) {
            return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/login?error=Foydalanuvchi_yaratilmadi`);
        }

        // Modullarni aniqlash
        companyModules = user.role === "OWNER"
            ? ALL_MODULE_IDS
            : ((user as any).company?.enabledModules?.length ? (user as any).company.enabledModules : ALL_MODULE_IDS);

        const token = signToken({
            id: user.id,
            email: user.email,
            role: user.role,
            companyId: user.companyId,
            enabledModules: companyModules,
        });

        // OWNER foydalanuvchilarni /owner sahifasiga yo'naltiramiz
        const redirectPath = user.role === "OWNER" ? "/owner" : "/dashboard";
        const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}${redirectPath}`);

        response.cookies.set({
            name: "token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 7 * 24 * 60 * 60,
        });

        return response;

    } catch (error: any) {
        console.error("Google Auth xatoligi:", error);
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "")}/login?error=Tizim_xatosi_${encodeURIComponent(error.message)}`);
    }
}
