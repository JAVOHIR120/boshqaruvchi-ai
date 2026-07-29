import { getCurrentUser } from "@/actions/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Clock, MapPin, ArrowLeft, Search, Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AttendanceLogsPage({ searchParams }: { searchParams: { date?: string } }) {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const dateParam = searchParams.date ? new Date(searchParams.date) : new Date();
    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
        where: {
            employee: { companyId: currentUser.companyId },
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            employee: {
                include: { user: true }
            }
        },
        orderBy: { checkIn: "asc" }
    });

    const formatTime = (date: Date | null | undefined) => {
        if (!date) return "--:--";
        return new Date(date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <a href="/employees" style={{ padding: "0.5rem", borderRadius: "50%", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", display: "flex", textDecoration: "none" }}>
                        <ArrowLeft size={20} />
                    </a>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">GPS Davomat Jurnali</h2>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Avtomatlashtirilgan lokatsiya va vaqt nazorati ({startOfDay.toLocaleDateString("uz-UZ")})</p>
                    </div>
                </div>
                
                <form style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                        <Calendar size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input 
                            type="date" 
                            name="date"
                            defaultValue={startOfDay.toISOString().split('T')[0]}
                            className="input-premium"
                            style={{ paddingLeft: "2.5rem" }}
                        />
                    </div>
                    <button type="submit" className="btn-primary">Filtrlash</button>
                </form>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                            <th style={{ padding: "1rem" }}>Xodim (Lavozim)</th>
                            <th style={{ padding: "1rem" }}>Holati</th>
                            <th style={{ padding: "1rem" }}>Kelgan vaqti</th>
                            <th style={{ padding: "1rem" }}>Ketgan vaqti</th>
                            <th style={{ padding: "1rem", textAlign: "right" }}>Lokatsiya</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendances.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Bu sanada hech qanday qayd topilmadi</td></tr>
                        ) : attendances.map((record) => (
                            <tr key={record.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <td style={{ padding: "1rem" }}>
                                    <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{record.employee.user.name}</div>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{record.employee.position}</div>
                                </td>
                                <td style={{ padding: "1rem" }}>
                                    <span style={{ 
                                        padding: "0.25rem 0.75rem", 
                                        borderRadius: "20px", 
                                        fontSize: "0.8rem", 
                                        fontWeight: "600",
                                        backgroundColor: record.status === "PRESENT" ? "rgba(16, 185, 129, 0.1)" : record.status === "LATE" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                        color: record.status === "PRESENT" ? "#10b981" : record.status === "LATE" ? "#f59e0b" : "#ef4444" 
                                    }}>
                                        {record.status === "PRESENT" ? "Kelgan" : record.status === "LATE" ? "Kechikkan" : "Kelmagan"}
                                    </span>
                                </td>
                                <td style={{ padding: "1rem", fontWeight: "600", color: record.status === "LATE" ? "#f59e0b" : "var(--text-primary)" }}>
                                    {formatTime(record.checkIn)}
                                </td>
                                <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                                    {formatTime(record.checkOut)}
                                </td>
                                <td style={{ padding: "1rem", textAlign: "right" }}>
                                    {record.checkInLat && record.checkInLng ? (
                                        <a 
                                            href={`https://maps.google.com/?q=${record.checkInLat},${record.checkInLng}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn-secondary" 
                                            style={{ display: "inline-flex", padding: "0.4rem 0.75rem", fontSize: "0.8rem", gap: "0.4rem", textDecoration: "none" }}
                                        >
                                            <MapPin size={14} /> Xaritada
                                        </a>
                                    ) : (
                                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>GPS yo'q</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
