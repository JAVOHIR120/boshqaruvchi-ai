import { getOwnerStats, getAllUsersForOwner } from "@/actions/owner";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import OwnerDashboard from "./components/OwnerDashboard";

export const dynamic = 'force-dynamic';

export default async function OwnerPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== "OWNER") {
        redirect("/dashboard");
    }

    let stats: any;
    let users: any[] = [];

    try {
        stats = await getOwnerStats();
    } catch (e) {
        console.error("Owner stats error:", e);
        stats = {
            users: { total: 0, owner: 0, boshliq: 0, xodim: 0, buxgalter: 0 },
            transactions: { total: 0, income: 0, expense: 0 },
            contracts: { total: 0, active: 0 },
            taxes: { total: 0, pending: 0, overdue: 0 },
            inventory: { total: 0 },
            leads: { total: 0, won: 0 },
            tasks: { total: 0, done: 0 },
            investors: { total: 0, totalInvestment: 0 },
            messages: { total: 0, unread: 0 },
            employees: { total: 0 },
            academy: { videos: 0, books: 0 },
        };
    }

    try {
        users = await getAllUsersForOwner();
    } catch (e) {
        console.error("Owner users error:", e);
        users = [];
    }

    // Check environment variables availability (only names, never values)
    const envStatus = {
        DATABASE_URL: !!process.env.DATABASE_URL,
        JWT_SECRET: !!process.env.JWT_SECRET,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY,
        GROQ_API_KEY: !!process.env.GROQ_API_KEY,
        EMAIL_USER: !!process.env.EMAIL_USER,
        EMAIL_PASS: !!process.env.EMAIL_PASS,
    };

    return (
        <OwnerDashboard
            stats={stats}
            users={JSON.parse(JSON.stringify(users))}
            envStatus={envStatus}
        />
    );
}
