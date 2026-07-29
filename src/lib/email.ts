import nodemailer from "nodemailer";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.boshqaruvchiai.uz";
const LOGO_URL = `${APP_URL}/icon-192x192.png`;
const CONTACT_EMAIL = "islomovjavohir939@gmail.com";

// Vercel serverless muhitda har safar yangi transporter yaratamiz
function createTransporter() {
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
}

export async function sendVerificationEmail(toEmail: string, verificationCode: string) {
    try {
        const transporter = createTransporter();

        const subject = "Tasdiqlash kodi — Boshqaruvchi AI";
        const year = new Date().getFullYear();

        const html = `
<!DOCTYPE html>
<html lang="uz" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>Tasdiqlash Kodi</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
    <!-- Wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Card -->
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; border: 1px solid rgba(148,163,184,0.1); overflow: hidden;">
                    
                    <!-- Gradient Top Bar -->
                    <tr>
                        <td style="height: 4px; background: linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa, #6366f1); background-size: 200% 100%;"></td>
                    </tr>

                    <!-- Logo Section -->
                    <tr>
                        <td align="center" style="padding: 36px 40px 20px 40px;">
                            <a href="${APP_URL}" style="text-decoration: none; display: inline-block;">
                                <table role="presentation" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td style="vertical-align: middle; padding-right: 12px;">
                                            <img src="${LOGO_URL}" alt="Logo" width="44" height="44" style="border-radius: 12px; display: block;" />
                                        </td>
                                        <td style="vertical-align: middle;">
                                            <span style="font-size: 22px; font-weight: 700; color: #f1f5f9; letter-spacing: -0.5px;">Boshqaruvchi AI</span>
                                        </td>
                                    </tr>
                                </table>
                            </a>
                        </td>
                    </tr>

                    <!-- Shield Icon -->
                    <tr>
                        <td align="center" style="padding: 8px 40px 4px 40px;">
                            <div style="width: 64px; height: 64px; border-radius: 18px; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08)); border: 1px solid rgba(99,102,241,0.2); display: inline-flex; align-items: center; justify-content: center;">
                                <img src="https://cdn-icons-png.flaticon.com/512/6195/6195699.png" alt="Shield" width="32" height="32" style="display: block; opacity: 0.9;" />
                            </div>
                        </td>
                    </tr>

                    <!-- Title -->
                    <tr>
                        <td align="center" style="padding: 20px 40px 8px 40px;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #f8fafc; letter-spacing: -0.5px;">Elektron Pochtani Tasdiqlash</h1>
                        </td>
                    </tr>

                    <!-- Description -->
                    <tr>
                        <td align="center" style="padding: 0 40px 28px 40px;">
                            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: #94a3b8;">
                                Hurmatli foydalanuvchi, <strong style="color: #cbd5e1;">Boshqaruvchi AI</strong> tizimiga xush kelibsiz! Hisobingizni faollashtirish uchun quyidagi tasdiqlash kodini kiriting:
                            </p>
                        </td>
                    </tr>

                    <!-- OTP Code Box -->
                    <tr>
                        <td align="center" style="padding: 0 40px 12px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04)); border: 1.5px solid rgba(99,102,241,0.2); border-radius: 16px; width: 100%;">
                                <tr>
                                    <td align="center" style="padding: 24px 20px;">
                                        <div style="font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #a5b4fc; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; text-indent: 12px;">${verificationCode}</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Timer Info -->
                    <tr>
                        <td align="center" style="padding: 4px 40px 28px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 6px;">
                                        <img src="https://cdn-icons-png.flaticon.com/512/2088/2088617.png" alt="Clock" width="14" height="14" style="display: block; opacity: 0.5;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <span style="font-size: 13px; color: #64748b;">Bu kod 10 daqiqa ichida amal qiladi</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(148,163,184,0.15), transparent);"></div>
                        </td>
                    </tr>

                    <!-- Security Tips Section -->
                    <tr>
                        <td style="padding: 24px 40px 8px 40px;">
                            <p style="margin: 0 0 16px 0; font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Xavfsizlik eslatmalari</p>
                        </td>
                    </tr>

                    <!-- Tip 1 -->
                    <tr>
                        <td style="padding: 0 40px 10px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="28" style="vertical-align: top; padding-top: 2px;">
                                        <div style="width: 20px; height: 20px; border-radius: 6px; background: rgba(34,197,94,0.12); text-align: center; line-height: 20px; font-size: 11px;">✓</div>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <span style="font-size: 13.5px; color: #94a3b8; line-height: 1.5;">Kodni hech kimga bermang — Boshqaruvchi AI xodimlari sizdan hech qachon kodni so'ramaydi</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Tip 2 -->
                    <tr>
                        <td style="padding: 0 40px 10px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="28" style="vertical-align: top; padding-top: 2px;">
                                        <div style="width: 20px; height: 20px; border-radius: 6px; background: rgba(251,191,36,0.12); text-align: center; line-height: 20px; font-size: 11px;">⚠</div>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <span style="font-size: 13.5px; color: #94a3b8; line-height: 1.5;">Agar bu so'rovni siz yubormagan bo'lsangiz, shunchaki xatni e'tiborsiz qoldiring</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Tip 3 -->
                    <tr>
                        <td style="padding: 0 40px 28px 40px;">
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td width="28" style="vertical-align: top; padding-top: 2px;">
                                        <div style="width: 20px; height: 20px; border-radius: 6px; background: rgba(99,102,241,0.12); text-align: center; line-height: 20px; font-size: 11px;">🔒</div>
                                    </td>
                                    <td style="vertical-align: top;">
                                        <span style="font-size: 13.5px; color: #94a3b8; line-height: 1.5;">Barcha ma'lumotlaringiz 256-bit SSL shifrlash bilan himoyalangan</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, rgba(148,163,184,0.1), transparent);"></div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 24px 40px 16px 40px;">
                            <!-- Social / Links -->
                            <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 16px;">
                                        <a href="${APP_URL}" style="display: inline-block; padding: 8px 20px; background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2); border-radius: 8px; color: #a5b4fc; font-size: 13px; font-weight: 500; text-decoration: none;">🌐 Saytga o'tish</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Contact Info -->
                    <tr>
                        <td align="center" style="padding: 0 40px 12px 40px;">
                            <p style="margin: 0; font-size: 12.5px; color: #64748b; line-height: 1.6;">
                                Savollaringiz bormi? Bizga yozing:<br/>
                                <a href="mailto:${CONTACT_EMAIL}" style="color: #818cf8; text-decoration: none; font-weight: 500;">${CONTACT_EMAIL}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Copyright -->
                    <tr>
                        <td align="center" style="padding: 12px 40px 28px 40px;">
                            <p style="margin: 0; font-size: 11.5px; color: #475569;">
                                &copy; ${year} Boshqaruvchi AI. Barcha huquqlar himoyalangan.
                            </p>
                            <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155;">
                                O'zbekiston 🇺🇿
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- /Main Card -->
            </td>
        </tr>
    </table>
</body>
</html>
        `;

        const info = await transporter.sendMail({
            from: `"Boshqaruvchi AI" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: html,
        });

        console.log("Xat yuborildi: %s", info.messageId);
        return { success: true };
    } catch (error) {
        console.error("Email yuborishda xatolik:", error);
        return { success: false, error: "Email yuborishda xatolik yuz berdi" };
    }
}
