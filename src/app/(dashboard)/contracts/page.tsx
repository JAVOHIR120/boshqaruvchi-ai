import { FileText, Download, CheckCircle, AlertCircle, Search } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import { prisma } from "@/lib/prisma";
import ContractsActions from "./components/ContractsActions";
import AiContractGenerator from "./components/AiContractGenerator";
import AiContractAnalyzer from "./components/AiContractAnalyzer";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ContractsPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const contracts = await prisma.contract.findMany({
        where: { companyId: currentUser.companyId },
        orderBy: { signedDate: "desc" }
    });

    const activeContractsCount = contracts.filter(c => c.status === "ACTIVE").length;

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 className="text-2xl font-bold mb-1">Shartnomalar va Fayllar</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Hamkorlar va xodimlar bilan tuzilgan shartnomalar bazasi.</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <ContractsActions />
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={FileText} 
                            size={24} 
                            color="var(--primary-color)" 
                            glowColor="rgba(59, 130, 246, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Jami Shartnomalar</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{contracts.length} ta</h3>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={CheckCircle} 
                            size={24} 
                            color="var(--success-color)" 
                            glowColor="rgba(16, 185, 129, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Faol Shartnomalar</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--success-color)" }}>{activeContractsCount} ta</h3>
                    </div>
                </div>
            </div>

            {/* AI Smart Contracts Section */}
            <div className="card" style={{ marginBottom: "2rem", background: "var(--surface-color)", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                    <div style={{ flex: 1, minWidth: "300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                            <span style={{ padding: "0.25rem 0.5rem", background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "1px" }}>Yangi Funksiya</span>
                            <h3 style={{ fontSize: "1.3rem", fontWeight: "600", color: "white" }}>Aqlli Shartnomalar (AI Legal)</h3>
                        </div>
                        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.5", marginBottom: "1.5rem", maxWidth: "600px" }}>
                            10 soniya ichida O'zbekiston yoki xalqaro qonunchilik asosida xatosiz shartnomalar yarating, yoki hamkorlar yuborgan shartnomalardagi yashirin risklarni AI yordamida tahlil qiling.
                        </p>
                        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                            <AiContractGenerator />
                            <AiContractAnalyzer />
                        </div>
                    </div>
                </div>
            </div>

            <div className="card" style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Fayllar Bazasi</h3>
                    <div style={{ position: "relative", flex: "1", maxWidth: "350px", minWidth: "250px" }}>
                        <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input
                            type="text"
                            placeholder="Qidirish..."
                            style={{ padding: "0.5rem 1rem 0.5rem 2.25rem", borderRadius: "100px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", fontSize: "0.85rem", width: "100%", color: "var(--text-primary)" }}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                <th style={{ padding: "1rem" }}>Shartnoma Nomi</th>
                                <th style={{ padding: "1rem" }}>Hamkor (Kontragent)</th>
                                <th style={{ padding: "1rem" }}>Summa (Ixtiyoriy)</th>
                                <th style={{ padding: "1rem" }}>Sana</th>
                                <th style={{ padding: "1rem" }}>Holati</th>
                                <th style={{ padding: "1rem", textAlign: "right" }}>Fayl</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contracts.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Shartnomalar topilmadi.</td></tr>
                            ) : contracts.map((c) => (
                                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "1rem", fontWeight: "500", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <FileText size={16} color="var(--text-secondary)" /> {c.title}
                                    </td>
                                    <td style={{ padding: "1rem" }}>{c.partyName}</td>
                                    <td style={{ padding: "1rem" }}>{c.amount ? `${c.amount.toLocaleString()} so'm` : "N/A"}</td>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{new Date(c.signedDate).toLocaleDateString("uz-UZ")}</td>
                                    <td style={{ padding: "1rem" }}>
                                        {c.status === "ACTIVE" && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--success-color)", fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "1rem", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                                                <CheckCircle size={14} /> Faol
                                            </span>
                                        )}
                                        {c.status === "COMPLETED" && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "#6b7280", fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "1rem", backgroundColor: "rgba(107, 114, 128, 0.1)" }}>
                                                Tugallangan
                                            </span>
                                        )}
                                        {c.status === "TERMINATED" && (
                                            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--error-color)", fontSize: "0.85rem", padding: "0.25rem 0.5rem", borderRadius: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                                                <AlertCircle size={14} /> Bekor Qilingan
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right" }}>
                                        <button style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontWeight: "500" }}>
                                            <Download size={16} /> {/* Yuklash */}
                                        </button>
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
