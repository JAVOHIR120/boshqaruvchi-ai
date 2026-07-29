import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

// Modul yo'llari — middleware da import qilib bo'lmaydi (edge runtime)
// shuning uchun bu yerda to'g'ridan-to'g'ri yozamiz
const MODULE_PATHS = [
    "/dashboard", "/pos-terminal", "/crm", "/tasks", "/investors",
    "/contracts", "/taxes", "/messages", "/employees", "/accounting",
    "/inventory", "/ombor-nazorati", "/ai-consultant", "/leader-academy", "/settings"
];

const ALWAYS_ENABLED = ["/dashboard", "/settings"];

function getModulePathFromPathname(pathname: string): string | null {
    // Exact match
    const exact = MODULE_PATHS.find(p => p === pathname);
    if (exact) return exact;
    // Prefix match (sub-routes like /inventory/forms/inv-1)
    const prefix = MODULE_PATHS.find(p => p !== "/dashboard" && pathname.startsWith(p + "/"));
    if (prefix) return prefix;
    return null;
}

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    const publicRoutes = ["/", "/login", "/register", "/verify", "/api/auth/login", "/api/auth/register", "/api/auth/verify"];

    const isPublicAsset = pathname.match(/\.(png|jpg|jpeg|svg|mp4|webm|ico|js|json|webmanifest)$/) !== null;

    if (publicRoutes.includes(pathname) || pathname.startsWith("/sequence") || pathname.startsWith("/api/auth/google") || pathname.startsWith("/api/test-env") || pathname.startsWith("/api/telegram") || pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/sw.js" || pathname === "/manifest.webmanifest" || isPublicAsset) {
        return NextResponse.next();
    }

    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        // Edge runtime uchun jose kutubxonasidan foydalanish
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback_secret_for_development");
        const { payload } = await jose.jwtVerify(token, secret);
        const role = payload.role as string;
        const enabledModules = (payload.enabledModules as string[]) || [];

        // OWNER — tizim egasi, hamma joyga kira oladi
        if (role === "OWNER") {
            return NextResponse.next();
        }

        // /owner sahifasiga faqat OWNER kira oladi
        if (pathname.startsWith("/owner")) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        // Xodim marshrutini tekshirish
        if (role === "XODIM") {
            if (!pathname.startsWith("/employee-portal") && !pathname.startsWith("/settings") && !pathname.startsWith("/api")) {
                return NextResponse.redirect(new URL("/employee-portal", request.url));
            }
        } else if (role === "BOSHLIQ" || role === "BUXGALTER") {
            if (pathname.startsWith("/employee-portal")) {
                return NextResponse.redirect(new URL("/dashboard", request.url));
            }

            // ============================================
            // MODULE ACCESS CONTROL — Edge Runtime himoyasi
            // ============================================
            const modulePath = getModulePathFromPathname(pathname);
            if (modulePath && !ALWAYS_ENABLED.includes(modulePath)) {
                // Agar modul kompaniya plani tarkibida bo'lmasa — dashboard ga qaytarish
                if (enabledModules.length > 0 && !enabledModules.includes(modulePath.replace("/", ""))) {
                    return NextResponse.redirect(new URL("/dashboard", request.url));
                }
            }
        }

        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
