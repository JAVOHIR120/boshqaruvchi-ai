import { redirect } from "next/navigation";
import { getCurrentUser } from "@/actions/auth";
import { getUnreadMessagesCount } from "@/actions/messages";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [user, unreadMessages] = await Promise.all([
        getCurrentUser().catch(() => null),
        getUnreadMessagesCount().catch(() => 0)
    ]);

    if (!user) {
        redirect("/login");
    }

    if (user.role === "XODIM") {
        redirect("/employee-portal");
    }

    return (
        <DashboardLayoutClient 
            user={user} 
            unreadMessages={unreadMessages}
            enabledModules={user.enabledModules || []}
        >
            {children}
        </DashboardLayoutClient>
    );
}
