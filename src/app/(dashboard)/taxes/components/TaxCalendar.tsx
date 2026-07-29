"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, CheckCircle, AlertTriangle, Shield, FileText, XCircle } from "lucide-react";

type TaxReport = {
    id: string;
    name: string;
    period: string;
    amount: number;
    status: string;
    dueDate: string;
};

type ComputedTaxes = {
    qqs: number;
    foydaSoliq: number;
    daromadSoliq: number;
    ijtimoiySoliq: number;
    molMulkSoliq: number;
    aylanmaSoliq: number;
};

// Soliq Kodeksi (30.12.2019) asosidagi to'lov muddatlari
const DEADLINES = [
    { soliq: "QQS", fullName: "Qo'shilgan qiymat solig'i", deadline: 20, modda: "275-modda", taxKey: "qqs" as const, freq: "Oylik" },
    { soliq: "Foyda solig'i", fullName: "Bo'nak to'lov", deadline: 10, modda: "344-modda", taxKey: "foydaSoliq" as const, freq: "Oylik" },
    { soliq: "JShDS", fullName: "Jismoniy shaxslar daromad solig'i", deadline: 15, modda: "387-modda", taxKey: "daromadSoliq" as const, freq: "Oylik" },
    { soliq: "Ijtimoiy soliq", fullName: "Ish beruvchi ijtimoiy to'lovi", deadline: 15, modda: "404-modda", taxKey: "ijtimoiySoliq" as const, freq: "Oylik" },
    { soliq: "Mol-mulk solig'i", fullName: "Yuridik shaxslar mol-mulk solig'i", deadline: 10, modda: "416-modda", taxKey: "molMulkSoliq" as const, freq: "Choraklik" },
];

const UZ_MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];

function getDeadlineInfo(day: number) {
    const now = new Date();
    const currentDay = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();

    let target: Date;
    if (currentDay <= day) {
        target = new Date(year, month, day, 23, 59, 59);
    } else {
        target = new Date(year, month + 1, day, 23, 59, 59);
    }

    const diffMs = target.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return { daysLeft, targetDate: target };
}

function getUrgency(daysLeft: number) {
    if (daysLeft <= 0) return { label: "Muddati o'tdi", color: "var(--error-color)", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", icon: <XCircle size={14} /> };
    if (daysLeft <= 3) return { label: `${daysLeft} kun`, color: "var(--error-color)", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: <AlertTriangle size={14} /> };
    if (daysLeft <= 7) return { label: `${daysLeft} kun`, color: "var(--warning-color)", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.15)", icon: <Clock size={14} /> };
    return { label: `${daysLeft} kun`, color: "var(--success-color)", bg: "rgba(16,185,129,0.05)", border: "rgba(16,185,129,0.12)", icon: <CheckCircle size={14} /> };
}

export default function TaxCalendar({ taxReports, computedTaxes }: { taxReports: TaxReport[]; computedTaxes: ComputedTaxes }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const currentMonth = `${UZ_MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    const sorted = [...DEADLINES].sort((a, b) => getDeadlineInfo(a.deadline).daysLeft - getDeadlineInfo(b.deadline).daysLeft);

    const paidCount = taxReports.filter(r => r.status === 'PAID').length;
    const overdueCount = taxReports.filter(r => r.status === 'OVERDUE').length;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Header */}
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Calendar size={18} color="var(--primary-color)" />
                    <span style={{ fontWeight: "700", fontSize: "0.95rem" }}>Soliq Taqvimi</span>
                </div>
                <span style={{
                    fontSize: "0.75rem", padding: "0.2rem 0.6rem", borderRadius: "6px",
                    background: "rgba(59,130,246,0.1)", color: "#60a5fa", fontWeight: "600",
                }}>
                    {currentMonth}
                </span>
            </div>

            <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {/* Mini stats */}
                {(paidCount > 0 || overdueCount > 0) && (
                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        {paidCount > 0 && (
                            <div style={{
                                flex: 1, padding: "0.5rem", borderRadius: "8px",
                                background: "rgba(16,185,129,0.08)", textAlign: "center",
                            }}>
                                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--success-color)" }}>{paidCount}</span>
                                <p style={{ fontSize: "0.65rem", color: "var(--success-color)", margin: 0 }}>To&apos;langan</p>
                            </div>
                        )}
                        {overdueCount > 0 && (
                            <div style={{
                                flex: 1, padding: "0.5rem", borderRadius: "8px",
                                background: "rgba(239,68,68,0.08)", textAlign: "center",
                            }}>
                                <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--error-color)" }}>{overdueCount}</span>
                                <p style={{ fontSize: "0.65rem", color: "var(--error-color)", margin: 0 }}>Muddati o&apos;tgan</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Deadlines */}
                {sorted.map((item, idx) => {
                    const { daysLeft } = getDeadlineInfo(item.deadline);
                    const urgency = getUrgency(daysLeft);
                    const amount = computedTaxes[item.taxKey];
                    const progressPct = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100));

                    return (
                        <div key={idx} style={{
                            padding: "0.85rem 1rem", borderRadius: "12px",
                            background: urgency.bg,
                            border: `1px solid ${urgency.border}`,
                            position: "relative", overflow: "hidden",
                        }}>
                            {/* Progress bar at bottom */}
                            <div style={{
                                position: "absolute", bottom: 0, left: 0, height: "2px",
                                width: `${progressPct}%`, background: urgency.color,
                                borderRadius: "0 0 12px 12px", opacity: 0.5,
                            }} />

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                                        <Shield size={14} color={urgency.color} />
                                        <span style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-primary)" }}>{item.soliq}</span>
                                        <span style={{
                                            fontSize: "0.6rem", padding: "0.1rem 0.3rem", borderRadius: "4px",
                                            background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)",
                                        }}>
                                            {item.freq}
                                        </span>
                                    </div>
                                    <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0 }}>
                                        {item.modda} · Har oy {item.deadline}-sanagacha
                                    </p>
                                    {amount > 0 && (
                                        <p style={{ fontSize: "0.82rem", fontWeight: "700", color: urgency.color, margin: "0.2rem 0 0" }}>
                                            {amount.toLocaleString()} so&apos;m
                                        </p>
                                    )}
                                </div>

                                {/* Countdown badge */}
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "0.2rem",
                                    padding: "0.25rem 0.55rem", borderRadius: "100px",
                                    background: `${urgency.color}18`, border: `1px solid ${urgency.color}30`,
                                    color: urgency.color, fontSize: "0.72rem", fontWeight: "700",
                                    whiteSpace: "nowrap",
                                }}>
                                    {urgency.icon}
                                    {urgency.label}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* DB Reports */}
                {taxReports.length > 0 && (
                    <div style={{ marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                            <FileText size={14} color="var(--text-secondary)" />
                            <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-secondary)" }}>Soliq hisobotlari</span>
                        </div>
                        {taxReports.slice(0, 4).map((r) => {
                            const isPaid = r.status === "PAID";
                            const isOverdue = r.status === "OVERDUE";
                            const statusColor = isPaid ? "var(--success-color)" : isOverdue ? "var(--error-color)" : "var(--warning-color)";
                            return (
                                <div key={r.id} style={{
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                    padding: "0.45rem 0.7rem", borderRadius: "8px", marginBottom: "0.3rem",
                                    background: `${statusColor}06`, border: `1px solid ${statusColor}12`,
                                }}>
                                    <div>
                                        <p style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>{r.name}</p>
                                        <p style={{ fontSize: "0.65rem", color: "var(--text-secondary)", margin: 0 }}>{r.period}</p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>{r.amount.toLocaleString()}</p>
                                        <span style={{
                                            fontSize: "0.6rem", fontWeight: "600", color: statusColor,
                                            padding: "0.05rem 0.3rem", borderRadius: "4px", background: `${statusColor}12`,
                                        }}>
                                            {isPaid ? "✓ To'langan" : isOverdue ? "✕ Muddati o'tgan" : "◷ Kutilmoqda"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
