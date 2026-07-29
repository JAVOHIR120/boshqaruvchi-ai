"use client";

import { useState } from "react";
import { Calculator, Percent, Clock, AlertTriangle, Wallet, Building } from "lucide-react";

export default function TaxCalculator() {
    const [activeTab, setActiveTab] = useState<"qqs" | "salary" | "penya">("qqs");

    // QQS
    const [revenue, setRevenue] = useState<number | "">("");
    const qqsRate = 0.12;
    const calcQQS = typeof revenue === "number" ? Math.round(revenue * qqsRate) : 0;
    const revenueWithQQS = typeof revenue === "number" ? revenue + calcQQS : 0;

    // Oylik
    const [salary, setSalary] = useState<number | "">("");
    const daromadRate = 0.12; // JShDS — 381-modda
    const ijtimoiyRate = 0.12; // Ijtimoiy soliq — 403-modda
    const inpsRate = 0.01; // Fuqarolarning nakopitel pensiya jamg'armasiga — 1%
    const calcDaromadSoliq = typeof salary === "number" ? Math.round(salary * daromadRate) : 0;
    const calcINPS = typeof salary === "number" ? Math.round(salary * inpsRate) : 0;
    const calcIjtimoiy = typeof salary === "number" ? Math.round(salary * ijtimoiyRate) : 0;
    const netSalary = typeof salary === "number" ? salary - calcDaromadSoliq - calcINPS : 0;
    const totalCompanyCost = typeof salary === "number" ? salary + calcIjtimoiy : 0;

    // Penya
    const [debtAmount, setDebtAmount] = useState<number | "">("");
    const [delayDays, setDelayDays] = useState<number | "">("");
    const penaltyRate = 0.00033; // 0.033% kuniga — 114-modda
    const calcPenalty = (typeof debtAmount === "number" && typeof delayDays === "number")
        ? Math.round(debtAmount * delayDays * penaltyRate) : 0;
    const totalWithPenalty = (typeof debtAmount === "number" ? debtAmount : 0) + calcPenalty;

    const tabs = [
        { key: "qqs" as const, label: "QQS", icon: <Percent size={16} />, color: "var(--primary-color)" },
        { key: "salary" as const, label: "Oylik", icon: <Wallet size={16} />, color: "#8b5cf6" },
        { key: "penya" as const, label: "Penya", icon: <AlertTriangle size={16} />, color: "var(--error-color)" },
    ];



    const resultRowStyle: React.CSSProperties = {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0.5rem 0", fontSize: "0.88rem",
    };

    return (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap", gap: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Calculator size={20} color="var(--accent-color)" />
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: 0 }}>Soliq Kalkulyator</h3>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", padding: "0.1rem 0.4rem", borderRadius: "4px", background: "rgba(255,255,255,0.04)" }}>Manual</span>
                </div>

                {/* Tabs */}
                <div style={{ display: "flex", gap: "0.35rem", overflowX: "auto", paddingBottom: "2px", maxWidth: "100%" }}>
                    {tabs.map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.3rem",
                                padding: "0.4rem 0.75rem", borderRadius: "8px",
                                border: activeTab === tab.key ? `1px solid ${tab.color}40` : "1px solid transparent",
                                background: activeTab === tab.key ? `${tab.color}15` : "transparent",
                                color: activeTab === tab.key ? tab.color : "var(--text-secondary)",
                                cursor: "pointer", fontSize: "0.75rem", fontWeight: "600",
                                transition: "all 0.2s",
                                whiteSpace: "nowrap"
                            }}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "1.5rem" }}>
                {/* ========= QQS TAB ========= */}
                {activeTab === "qqs" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "2rem", alignItems: "start" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>
                                Tushum summasi (so&apos;m)
                            </label>
                            <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value ? Number(e.target.value) : "")}
                                placeholder="Masalan: 50,000,000" className="input-premium" />
                            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.4rem", fontStyle: "italic" }}>
                                📜 258-modda: QQS stavkasi — 12%
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Tushum (soliqs iz):</span>
                                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{(typeof revenue === "number" ? revenue : 0).toLocaleString()}</span>
                            </div>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>QQS (12%):</span>
                                <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>+ {calcQQS.toLocaleString()}</span>
                            </div>
                            <div style={{ height: "1px", background: "var(--border-color)" }} />
                            <div style={{
                                ...resultRowStyle, padding: "0.75rem",
                                borderRadius: "10px", background: "rgba(59,130,246,0.08)",
                            }}>
                                <span style={{ fontWeight: "600", color: "var(--primary-color)" }}>QQS bilan jami:</span>
                                <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--primary-color)" }}>{revenueWithQQS.toLocaleString()} so&apos;m</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========= SALARY TAB ========= */}
                {activeTab === "salary" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "2rem", alignItems: "start" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>
                                Hisoblangan oylik (Gross) so&apos;m
                            </label>
                            <input type="number" value={salary} onChange={(e) => setSalary(e.target.value ? Number(e.target.value) : "")}
                                placeholder="Masalan: 5,000,000" className="input-premium" />
                            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.4rem", fontStyle: "italic" }}>
                                📜 381-modda (JShDS 12%) · 403-modda (Ijtimoiy 12%)
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "#8b5cf6", margin: "0 0 0.25rem" }}>Xodimdan ushlanadi:</p>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>JShDS (12%):</span>
                                <span style={{ fontWeight: "600", color: "var(--error-color)" }}>− {calcDaromadSoliq.toLocaleString()}</span>
                            </div>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>INPS (1%):</span>
                                <span style={{ fontWeight: "600", color: "var(--error-color)" }}>− {calcINPS.toLocaleString()}</span>
                            </div>
                            <div style={{
                                ...resultRowStyle, padding: "0.65rem",
                                borderRadius: "10px", background: "rgba(16,185,129,0.08)",
                            }}>
                                <span style={{ fontWeight: "600", color: "var(--success-color)" }}>Qo&apos;lga oladigan (Net):</span>
                                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--success-color)" }}>{netSalary.toLocaleString()}</span>
                            </div>

                            <div style={{ height: "1px", background: "var(--border-color)", margin: "0.3rem 0" }} />

                            <p style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--warning-color)", margin: "0 0 0.25rem" }}>Korxona to&apos;laydi:</p>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Ijtimoiy soliq (12%):</span>
                                <span style={{ fontWeight: "600", color: "var(--warning-color)" }}>+ {calcIjtimoiy.toLocaleString()}</span>
                            </div>
                            <div style={{
                                ...resultRowStyle, padding: "0.65rem",
                                borderRadius: "10px", background: "rgba(245,158,11,0.08)",
                            }}>
                                <span style={{ fontWeight: "600", color: "var(--warning-color)" }}>Jami xarajat:</span>
                                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--warning-color)" }}>{totalCompanyCost.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========= PENYA TAB ========= */}
                {activeTab === "penya" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "2rem", alignItems: "start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>
                                    Soliq qarzi summasi (so&apos;m)
                                </label>
                                <input type="number" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value ? Number(e.target.value) : "")}
                                    placeholder="Masalan: 10,000,000" className="input-premium" />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>
                                    Kechiktirilgan kunlar soni
                                </label>
                                <input type="number" value={delayDays} onChange={(e) => setDelayDays(e.target.value ? Number(e.target.value) : "")}
                                    placeholder="Masalan: 30" className="input-premium" />
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                📜 114-modda: Penya — har kuni 0.033% (markaziy bank stavkasiga asosan)
                            </p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Asosiy qarz:</span>
                                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{(typeof debtAmount === "number" ? debtAmount : 0).toLocaleString()}</span>
                            </div>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Kechikish:</span>
                                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{typeof delayDays === "number" ? delayDays : 0} kun</span>
                            </div>
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Penya stavkasi:</span>
                                <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>0.033% / kun</span>
                            </div>
                            <div style={{ height: "1px", background: "var(--border-color)" }} />
                            <div style={{ ...resultRowStyle, color: "var(--text-secondary)" }}>
                                <span>Hisoblangan penya:</span>
                                <span style={{ fontWeight: "700", color: "var(--error-color)" }}>+ {calcPenalty.toLocaleString()}</span>
                            </div>
                            <div style={{
                                ...resultRowStyle, padding: "0.75rem",
                                borderRadius: "10px", background: "rgba(239,68,68,0.08)",
                            }}>
                                <span style={{ fontWeight: "600", color: "var(--error-color)" }}>Jami to&apos;lov:</span>
                                <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--error-color)" }}>{totalWithPenalty.toLocaleString()} so&apos;m</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
