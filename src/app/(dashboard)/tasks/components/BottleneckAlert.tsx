"use client";

import { useState } from "react";
import { ShieldAlert, X, Loader2, AlertTriangle, AlertCircle, Info, ChevronRight, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Alert {
    type: string;
    severity: "critical" | "warning" | "info";
    message: string;
    assignee?: string;
}

interface AnalysisData {
    alerts: Alert[];
    stats: {
        total: number;
        todo: number;
        inProgress: number;
        done: number;
        overdue: number;
        highPriority: number;
    };
    aiRecommendation: string;
    idleEmployees: string[];
}

export default function BottleneckAlert() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AnalysisData | null>(null);

    const handleAnalyze = async () => {
        setIsOpen(true);
        setLoading(true);
        try {
            const res = await fetch("/api/task-analysis");
            const result = await res.json();
            setData(result);
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const criticalCount = data?.alerts.filter(a => a.severity === "critical").length || 0;

    const severityIcon = (severity: string) => {
        switch (severity) {
            case "critical": return <AlertTriangle size={16} color="#ef4444" />;
            case "warning": return <AlertCircle size={16} color="#f59e0b" />;
            default: return <Info size={16} color="#3b82f6" />;
        }
    };

    const severityStyle = (severity: string) => {
        switch (severity) {
            case "critical": return { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", color: "#fca5a5" };
            case "warning": return { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", color: "#fcd34d" };
            default: return { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", color: "#93c5fd" };
        }
    };

    return (
        <>
            <button onClick={handleAnalyze} className="bn-trigger" style={{ position: "relative" }}>
                <ShieldAlert size={18} />
                Xavf Tahlili
                {criticalCount > 0 && (
                    <span className="bn-badge-pulse">{criticalCount}</span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="bn-overlay"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            className="bn-panel"
                            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                            transition={{ type: "spring", damping: 25 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bn-panel-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <ShieldAlert size={20} color="#ef4444" />
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>Xavf Signallari</h3>
                                </div>
                                <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="bn-panel-body">
                                {loading ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "3rem 0" }}>
                                        <Loader2 size={28} className="ai-gen-spinner" style={{ color: "#ef4444" }} />
                                        <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "1rem" }}>Tahlil qilinmoqda...</p>
                                    </div>
                                ) : data ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                        {/* Alerts */}
                                        {data.alerts.length === 0 ? (
                                            <div style={{ textAlign: "center", padding: "2rem 0" }}>
                                                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                                                <p style={{ color: "#6ee7b7", fontWeight: 600 }}>Hamma narsa yaxshi!</p>
                                                <p style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "0.3rem" }}>Hech qanday xavf topilmadi</p>
                                            </div>
                                        ) : (
                                            data.alerts.map((alert, i) => {
                                                const style = severityStyle(alert.severity);
                                                return (
                                                    <motion.div
                                                        key={i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        style={{
                                                            padding: "0.75rem 0.9rem",
                                                            background: style.bg,
                                                            border: `1px solid ${style.border}`,
                                                            borderRadius: "10px",
                                                            display: "flex", alignItems: "flex-start", gap: "0.6rem"
                                                        }}
                                                    >
                                                        {severityIcon(alert.severity)}
                                                        <div>
                                                            <p style={{ color: style.color, fontSize: "0.88rem", fontWeight: 500 }}>{alert.message}</p>
                                                            {alert.assignee && (
                                                                <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>
                                                                    <ChevronRight size={12} style={{ display: "inline" }} /> {alert.assignee}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}

                                        {/* AI Recommendation */}
                                        {data.aiRecommendation && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.5 }}
                                                style={{
                                                    padding: "1rem",
                                                    background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
                                                    border: "1px solid rgba(99,102,241,0.2)",
                                                    borderRadius: "10px", marginTop: "0.5rem"
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                                                    <Brain size={16} color="#a5b4fc" />
                                                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#a5b4fc" }}>AI Tavsiyasi</span>
                                                </div>
                                                <p style={{ color: "#cbd5e1", fontSize: "0.85rem", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                                                    {data.aiRecommendation}
                                                </p>
                                            </motion.div>
                                        )}

                                        {/* Quick Stats */}
                                        <div className="bn-stats-grid">
                                            <div className="bn-stat-box">
                                                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#ef4444" }}>{data.stats.overdue}</span>
                                                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Muddati O&apos;tgan</span>
                                            </div>
                                            <div className="bn-stat-box">
                                                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#f59e0b" }}>{data.stats.highPriority}</span>
                                                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Yuqori Ustuvorlik</span>
                                            </div>
                                            <div className="bn-stat-box">
                                                <span style={{ fontSize: "1.4rem", fontWeight: 700, color: "#3b82f6" }}>{data.idleEmployees.length}</span>
                                                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Bo&apos;sh Xodim</span>
                                            </div>
                                        </div>
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
                .bn-trigger {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 0.65rem 1.4rem;
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.25) 100%);
                    color: #fca5a5; border-radius: 9999px; font-weight: 600;
                    font-size: 0.9rem; cursor: pointer;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .bn-trigger:hover { 
                    transform: translateY(-2px) scale(1.02); 
                    background: linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.4) 100%);
                    border-color: rgba(239, 68, 68, 0.6);
                    color: #fff;
                    box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255,255,255,0.2);
                }
                .bn-badge-pulse {
                    position: absolute; top: -6px; right: -6px;
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    color: white; font-size: 0.65rem;
                    width: 20px; height: 20px; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; border: 2px solid #0f172a;
                    animation: pulseBadge 2s ease-in-out infinite;
                }
                @keyframes pulseBadge { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0); } }
                .bn-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                    z-index: 100; display: flex; justify-content: flex-end;
                }
                .bn-panel {
                    width: 100%; max-width: 420px; height: 100%;
                    background: linear-gradient(180deg, #0f172a, #1e293b);
                    border-left: 1px solid rgba(239,68,68,0.2);
                    box-shadow: -10px 0 30px rgba(0,0,0,0.5);
                    display: flex; flex-direction: column; overflow: hidden;
                }
                .bn-panel-header {
                    padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    background: rgba(239,68,68,0.04);
                }
                .bn-panel-body { padding: 1.5rem; flex: 1; overflow-y: auto; }
                .bn-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-top: 0.5rem; }
                .bn-stat-box {
                    display: flex; flex-direction: column; align-items: center; gap: 0.2rem;
                    padding: 0.75rem; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
                }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .ai-gen-spinner { animation: spin 1s linear infinite; }
            `}</style>
        </>
    );
}
