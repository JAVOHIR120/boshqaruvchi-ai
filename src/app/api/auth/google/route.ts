import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const redirectUri = `${appUrl}/api/auth/google/callback`;

    if (!clientId) {
        return NextResponse.json({ error: "Server error: GOOGLE_CLIENT_ID not found." }, { status: 500 });
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline&` +
        `prompt=consent`;

    return NextResponse.redirect(authUrl);
}
