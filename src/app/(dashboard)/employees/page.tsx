import { UserCheck, Clock, TrendingUp, Search, Mail, Map, Users, ShieldAlert, Scan } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import { prisma } from "@/lib/prisma";
import EmployeesActions from "./components/EmployeesActions";
import EmployeeRowActions from "./components/EmployeeRowActions";
import AttendanceFilter from "./components/AttendanceFilter";
import TeamAIAnalytics from "./components/TeamAIAnalytics";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import LiveAttendanceToasts from "./components/LiveAttendanceToasts";
import OfficeGeolocationPanel from "./components/OfficeGeolocationPanel";
import KpiBonusCalculator from "./components/KpiBonusCalculator";

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const employees = await prisma.employee.findMany({
        where: { companyId: currentUser.companyId },
        include: {
            user: true,
            attendances: true
        },
        orderBy: { startDate: "desc" }
    });

    const company = await prisma.company.findUnique({
        where: { id: currentUser.companyId }
    });

    const totalEmployees = employees.length;
    // Calculate avg performance if array is filled, else 0
    const avgPerformance = totalEmployees > 0
        ? Math.round(employees.reduce((sum, emp) => sum + emp.performance, 0) / totalEmployees)
        : 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentCount = employees.filter(emp =>
        emp.attendances.some(a => new Date(a.date) >= today && a.status === "PRESENT")
    ).length;
    const attendancePercentage = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

    return (
        <div style={{ paddingBottom: "2rem" }}>
            <LiveAttendanceToasts />
            
            <div style={{ 
                display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", 
                flexWrap: "wrap", gap: "1rem" 
            }}>
                <div>
                    <h2 className="text-3xl font-extrabold mb-2" style={{ 
                        background: "linear-gradient(to right, var(--text-primary), var(--text-secondary))", 
                        WebkitBackgroundClip: "text", 
                        WebkitTextFillColor: "transparent" 
                    }}>Xodimlar (HR) va Geolokatsiya</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "1rem", maxWidth: "600px" }}>
                        Korxonangizning inson resurslari, ofis geolokatsiyasi paneli hamda GPS davomat nazorati birlashtirilgan aqlli boshqaruv.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                    <a href="/employees/attendance" className="btn-secondary" style={{ backdropFilter: "blur(10px)", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderColor: "rgba(16, 185, 129, 0.2)" }}>
                        <UserCheck size={18} /> Davomat Jurnali
                    </a>
                    <a href="/attendance-logs" className="btn-secondary" style={{ backdropFilter: "blur(10px)" }}>
                        <Map size={18} /> GPS Jurnali
                    </a>
                    <TeamAIAnalytics />
                    <EmployeesActions />
                </div>
            </div>

            {/* Office Geolocation Panel (Premium Map + Auto Report) */}
            <OfficeGeolocationPanel initialCompany={company} />

            {/* AI Summary KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
                <div className="card hover-scale" style={{ 
                    display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.5rem",
                    background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.01) 100%)",
                    border: "1px solid rgba(59, 130, 246, 0.1)", cursor: "default"
                }}>
                    <EnhancedIcon icon={Users} size={28} color="var(--primary-color)" glowColor="rgba(59, 130, 246, 0.5)" hasBackground={true} />
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Faol Xodimlar</p>
                        <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>{totalEmployees} <span style={{ fontSize: "1rem", color: "var(--text-secondary)", fontWeight: "500" }}>ta</span></h3>
                    </div>
                </div>

                <div className="card hover-scale" style={{ 
                    display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.5rem",
                    background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.01) 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.1)", cursor: "default"
                }}>
                    <EnhancedIcon icon={Clock} size={28} color="var(--success-color)" glowColor="rgba(16, 185, 129, 0.5)" hasBackground={true} />
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Davomat (Bugun)</p>
                        <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>{attendancePercentage}<span style={{ fontSize: "1.25rem", color: "var(--success-color)", fontWeight: "500" }}>%</span></h3>
                    </div>
                </div>

                <div className="card hover-scale" style={{ 
                    display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.5rem",
                    background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)",
                    border: "1px solid rgba(139, 92, 246, 0.1)", cursor: "default"
                }}>
                    <EnhancedIcon icon={TrendingUp} size={28} color="#8b5cf6" glowColor="rgba(139, 92, 246, 0.5)" hasBackground={true} />
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.25rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Jamoaviy KPI</p>
                        <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)" }}>{avgPerformance}<span style={{ fontSize: "1.25rem", color: "#8b5cf6", fontWeight: "500" }}>%</span></h3>
                    </div>
                </div>
            </div>

            {/* Discretionary KPI & Fine calculator (Boss approved) */}
            <KpiBonusCalculator employees={employees as any} />

            <div className="card" style={{ 
                overflowX: "auto", 
                background: "var(--surface-color)",
                border: "1px solid var(--border-color)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" 
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Xodimlar Jurnali</h3>

                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap", flex: "1", justifyContent: "flex-end" }}>
                        <AttendanceFilter
                            employees={employees.map(e => ({
                                id: e.id,
                                name: e.user?.name || "Noma'lum",
                                position: e.position,
                                attendances: e.attendances
                            }))}
                        />
                        <div style={{ position: "relative", flex: "1", maxWidth: "300px", minWidth: "200px" }}>
                            <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                            <input
                                type="text"
                                placeholder="Qidirish..."
                                style={{ padding: "0.5rem 1rem 0.5rem 2.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", fontSize: "0.85rem", width: "100%", color: "var(--text-primary)" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="table-responsive">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                <th style={{ padding: "1rem" }}>Xodim (Ism / Email)</th>
                                <th style={{ padding: "1rem" }}>Lavozim</th>
                                <th style={{ padding: "1rem" }}>Kelgan Sanasi</th>
                                <th style={{ padding: "1rem" }}>Oylik Maosh</th>
                                <th style={{ padding: "1rem" }}>Login & Parol</th>
                                <th style={{ padding: "1rem" }}>Davomat (Keldi-Ketdi)</th>
                                <th style={{ padding: "1rem" }}>Samaradorlik (KPI)</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>Intizom / Amallar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Xodimlar kiritilmagan</td></tr>
                            ) : employees.map((emp) => (
                                <tr key={emp.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{emp.user?.name || "Noma'lum Xodim"}</div>
                                        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                                            <Mail size={12} /> {emp.user?.email}
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem", fontWeight: "500", color: "var(--text-secondary)" }}>{emp.position}</td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{new Date(emp.startDate).toLocaleDateString("uz-UZ")}</td>
                                    <td style={{ padding: "1rem", fontWeight: "600" }}>{emp.salary.toLocaleString()} so'm</td>
                                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                            <span style={{ color: "var(--text-primary)", fontWeight: "600", letterSpacing: "0.5px" }}>{emp.user?.email || "Login aniqlanmadi"}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Parol:</span>
                                                <span style={{ fontFamily: "monospace", color: "var(--primary-color)", fontWeight: "bold", background: "rgba(59, 130, 246, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                                                    {emp.plainPassword || "O'zgartirilgan"}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        {(() => {
                                            const todayAtt = emp.attendances.find(a => new Date(a.date).toDateString() === today.toDateString()) as any;
                                            if (!todayAtt) return <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Hali kelmagan</span>;
                                            
                                            const checkInTime = todayAtt.checkIn ? new Date(todayAtt.checkIn).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' }) : "--:--";
                                            const checkOutTime = todayAtt.checkOut ? new Date(todayAtt.checkOut).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' }) : "--:--";

                                            return (
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.75rem", color: "var(--success-color)", fontWeight: "600" }}>IN:</span>
                                                        <span style={{ fontWeight: "700", color: todayAtt.status === "LATE" ? "var(--warning-color)" : "var(--text-primary)" }}>{checkInTime}</span>
                                                        {todayAtt.status === "LATE" && <span style={{ fontSize: "0.65rem", padding: "1px 4px", background: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)", borderRadius: "4px" }}>KECH</span>}
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.75rem", color: "var(--error-color)", fontWeight: "600" }}>OUT:</span>
                                                        <span style={{ fontWeight: "600", color: "var(--text-secondary)" }}>{checkOutTime}</span>
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            gap: "0.5rem",
                                            padding: "0.75rem",
                                            background: "rgba(255, 255, 255, 0.02)",
                                            borderRadius: "12px",
                                            border: "1px solid rgba(255, 255, 255, 0.05)"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between" }}>
                                                <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Efficiency</span>
                                                <span style={{ fontSize: "0.9rem", fontWeight: "800", color: emp.performance >= 80 ? "#10b981" : emp.performance >= 50 ? "#f59e0b" : "#ef4444" }}>{emp.performance}%</span>
                                            </div>
                                            <div style={{ width: "100%", height: "8px", backgroundColor: "var(--border-color)", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                                                <div 
                                                    style={{ 
                                                        width: `${emp.performance}%`,
                                                        height: "100%", 
                                                        background: emp.performance >= 80 ? "linear-gradient(90deg, #059669, #10b981)" : emp.performance >= 50 ? "linear-gradient(90deg, #d97706, #f59e0b)" : "linear-gradient(90deg, #dc2626, #ef4444)",
                                                        boxShadow: emp.performance >= 80 ? "0 0 15px rgba(16, 185, 129, 0.4)" : "none",
                                                        borderRadius: "10px",
                                                        transition: "width 1s ease-out"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1.25rem 1rem", textAlign: "right", color: "var(--text-secondary)", verticalAlign: "middle" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1rem" }}>
                                            <div style={{ display: "flex", gap: "0.5rem", background: "var(--surface-color)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--warning-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                                                    <div style={{ width: "12px", height: "16px", background: "#f59e0b", borderRadius: "2px" }}></div> {emp.yellowCards}
                                                </div>
                                                <div style={{ width: "1px", background: "rgba(255,255,255,0.1)", margin: "0 0.25rem" }}></div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--error-color)", fontWeight: "600", fontSize: "0.9rem" }}>
                                                    <div style={{ width: "12px", height: "16px", background: "#ef4444", borderRadius: "2px" }}></div> {emp.redCards}
                                                </div>
                                            </div>
                                            <EmployeeRowActions
                                                employeeId={emp.id}
                                                currentPerformance={emp.performance}
                                                currentYellowCards={emp.yellowCards}
                                                currentRedCards={emp.redCards}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
