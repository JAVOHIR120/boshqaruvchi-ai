"use client";

import { useState } from "react";
import { BarChart3, X, Loader2, Trophy, Clock, AlertTriangle, CheckCircle, ListTodo } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StandupData {
    summary: string;
    stats: {
        total: number;
        done: number;
        todayDone: number;
        todo: number;
        inProgress: number;
        overdue: number;
    };
    topPerformer: { name: string; count: number } | null;
    overdueList: Array<{ title: string; assignedTo: string | null; dueDate: string }>;
}

export default function AiStandupPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<StandupData | null>(null);

    const handleOpen = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            const res = await fetch("/api/task-standup");
            const result = await res.json();
            setData(result);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const statCards = data ? [
        { label: "Tugatildi", value: data.stats.done, icon: CheckCircle, color: "#10b981", bg: "rgba(16,185,129,0.1)" },
        { label: "Jarayonda", value: data.stats.inProgress, icon: Clock, color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
        { label: "Kutilmoqda", value: data.stats.todo, icon: ListTodo, color: "#94a3b8", bg: "rgba(148,163,184,0.08)" },
        { label: "Muddati O'tgan", value: data.stats.overdue, icon: AlertTriangle, color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
    ] : [];

    return (
        <>
            <button onClick={handleOpen} className="su-trigger">
                <BarChart3 size={18} />
                AI Stand-up
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="su-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="su-panel"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                            transition={{ type: "spring", damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="su-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <BarChart3 size={20} color="#6366f1" />
                                    <div>
                                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>AI Kundalik Hisobot</h3>
                                        <p style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date().toLocaleDateString("uz-Latn-UZ", { weekday: "long", day: "numeric", month: "long" })}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="su-body">
                                {loading ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0" }}>
                                        <Loader2 size={28} className="su-spinner" style={{ color: "#6366f1" }} />
                                        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1rem" }}>Hisobot tayyorlanmoqda...</p>
                                    </div>
                                ) : data ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                                        {/* Stats Grid */}
                                        <div className="su-stats">
                                            {statCards.map((s, i) => (
                                                <motion.div
                                                    key={s.label}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="su-stat-card"
                                                    style={{ background: s.bg }}
                                                >
                                                    <s.icon size={18} color={s.color} />
                                                    <span style={{ fontSize: "1.5rem", fontWeight: 800, color: s.color }}>{s.value}</span>
                                                    <span style={{ fontSize: "0.7rem", color: "#94a3b8", textAlign: "center" }}>{s.label}</span>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* Top Performer */}
                                        {data.topPerformer && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.4 }}
                                                className="su-performer"
                                            >
                                                <Trophy size={20} color="#fbbf24" />
                                                <div>
                                                    <p style={{ fontSize: "0.82rem", color: "#fbbf24", fontWeight: 600 }}>Eng Samarali Xodim</p>
                                                    <p style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
                                                        {data.topPerformer.name}
                                                        <span style={{ fontSize: "0.8rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                                                            ({data.topPerformer.count} ta vazifa tugatgan)
                                                        </span>
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* AI Summary */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 }}
                                            className="su-ai-report"
                                        >
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                                                <div style={{
                                                    width: 24, height: 24, borderRadius: 6,
                                                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                                    display: "flex", alignItems: "center", justifyContent: "center"
                                                }}>
                                                    <BarChart3 size={14} color="white" />
                                                </div>
                                                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#a5b4fc" }}>AI Tahlil Hisoboti</span>
                                            </div>
                                            <p style={{ color: "#cbd5e1", fontSize: "0.88rem", lineHeight: 1.7, whiteSpace: "pre-line" }}>
                                                {data.summary}
                                            </p>
                                        </motion.div>

                                        {/* Overdue List */}
                                        {data.overdueList.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.8 }}
                                            >
                                                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.5rem" }}>
                                                    ⚠️ Muddati o&apos;tgan vazifalar:
                                                </p>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                                    {data.overdueList.slice(0, 5).map((t, i) => (
                                                        <div key={i} style={{
                                                            display: "flex", justifyContent: "space-between",
                                                            padding: "0.5rem 0.7rem",
                                                            background: "rgba(239,68,68,0.06)",
                                                            border: "1px solid rgba(239,68,68,0.12)",
                                                            borderRadius: "6px", fontSize: "0.8rem"
                                                        }}>
                                                            <span style={{ color: "#fca5a5" }}>{t.title.substring(0, 35)}{t.title.length > 35 ? "..." : ""}</span>
                                                            <span style={{ color: "#64748b" }}>{t.assignedTo || "-"}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ) : (
                                    <p style={{ color: "#64748b", textAlign: "center", padding: "2rem" }}>Ma&apos;lumot yuklanmadi</p>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .su-trigger {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 0.65rem 1.4rem;
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(79, 70, 229, 0.25) 100%);
                    color: #a5b4fc; border-radius: 9999px; font-weight: 600;
                    font-size: 0.9rem; cursor: pointer;
                    border: 1px solid rgba(99, 102, 241, 0.3);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .su-trigger:hover { 
                    transform: translateY(-2px) scale(1.02); 
                    background: linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(79, 70, 229, 0.4) 100%);
                    border-color: rgba(99, 102, 241, 0.6);
                    color: #fff;
                    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3), inset 0 1px 1px rgba(255,255,255,0.2);
                }
                .su-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    z-index: 100; display: flex; justify-content: flex-end;
                }
                .su-panel {
                    width: 100%; max-width: 440px; height: 100%;
                    background: linear-gradient(180deg, #0f172a, #1e293b);
                    border-left: 1px solid rgba(99,102,241,0.2);
                    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                    display: flex; flex-direction: column; overflow: hidden;
                }
                .su-header {
                    padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    background: rgba(99,102,241,0.04);
                }
                .su-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
                .su-stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
                .su-stat-card {
                    display: flex; flex-direction: column; align-items: center; gap: 0.3rem;
                    padding: 1rem; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px;
                }
                .su-performer {
                    display: flex; align-items: center; gap: 0.75rem;
                    padding: 1rem; background: rgba(251,191,36,0.06);
                    border: 1px solid rgba(251,191,36,0.15); border-radius: 12px;
                }
                .su-ai-report {
                    padding: 1.25rem; background: rgba(15,23,42,0.8);
                    border: 1px solid rgba(99,102,241,0.15); border-radius: 12px;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .su-spinner { animation: spin 1s linear infinite; }
            `}</style>
        </>
    );
}
