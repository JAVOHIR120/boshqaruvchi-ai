import { prisma } from "@/lib/prisma";
import { Shield, Users, Mail, Clock } from "lucide-react";
import AdminUserActions from "./components/AdminUserActions";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminPanel() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const users = await prisma.user.findMany({
        where: { companyId: currentUser.companyId },
        orderBy: { createdAt: "desc" },
    });

    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === "BOSHLIQ").length;
    const employeeUsers = users.filter(u => u.role === "XODIM").length;

    // Platform Stats
    const totalTransactions = await prisma.transaction.count({ where: { companyId: currentUser.companyId } });
    const totalContracts = await prisma.contract.count({ where: { companyId: currentUser.companyId } });
    const totalTaxes = await prisma.taxReport.count({ where: { companyId: currentUser.companyId } });

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 className="text-2xl font-bold mb-1">Admin Panel</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Platformadagi foydalanuvchilar va tizim nazorati.</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div style={{ padding: "0.75rem", borderRadius: "1rem", backgroundColor: "rgba(59, 130, 246, 0.1)", color: "var(--primary-color)" }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Foydalanuvchilar</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>{totalUsers} ta</h3>
                    </div>
                </div>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div style={{ padding: "0.75rem", borderRadius: "1rem", backgroundColor: "rgba(245, 158, 11, 0.1)", color: "var(--warning-color)" }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Boshliqlar</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)" }}>{adminUsers} ta</h3>
                    </div>
                </div>
            </div>

            <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--text-primary)" }}>Platforma Statistikasi</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
                <div className="card" style={{ textAlign: "center", padding: "1.25rem" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Tranzaksiyalar</p>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--primary-color)" }}>{totalTransactions}</h3>
                </div>
                <div className="card" style={{ textAlign: "center", padding: "1.25rem" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Shartnomalar</p>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--success-color)" }}>{totalContracts}</h3>
                </div>
                <div className="card" style={{ textAlign: "center", padding: "1.25rem" }}>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.5rem" }}>Hisobotlar</p>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--error-color)" }}>{totalTaxes}</h3>
                </div>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Tizimga Kiritilgan Foydalanuvchilar</h3>
                <div className="table-responsive">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                <th style={{ padding: "1rem" }}>Ism-Familiya</th>
                                <th style={{ padding: "1rem" }}>Email Manzil</th>
                                <th style={{ padding: "1rem" }}>Rol</th>
                                <th style={{ padding: "1rem" }}>Yaratilgan Sana</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>Sozlamalar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Foydalanuvchilar yo'q.</td></tr>
                            ) : users.map((u) => (
                                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>{u.name}</td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Mail size={16} /> {u.email}
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{
                                            padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", fontWeight: "600",
                                            backgroundColor: u.role === "BOSHLIQ" ? "rgba(245, 158, 11, 0.1)" : "var(--background-color)",
                                            color: u.role === "BOSHLIQ" ? "var(--warning-color)" : "var(--text-secondary)"
                                        }}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Clock size={16} /> {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right", color: "var(--text-secondary)" }}>
                                        <AdminUserActions user={{ id: u.id, name: u.name, role: u.role }} />
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
