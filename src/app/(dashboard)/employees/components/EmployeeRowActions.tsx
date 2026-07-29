"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Clock, Edit2, Sparkles, X, Loader2 } from "lucide-react";
import { markAttendance, updateEmployeeStats } from "@/actions";

type Props = {
    employeeId: string;
    currentPerformance: number;
    currentYellowCards: number;
    currentRedCards: number;
};

export default function EmployeeRowActions({ employeeId, currentPerformance, currentYellowCards, currentRedCards }: Props) {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [performance, setPerformance] = useState(currentPerformance.toString());
    const [yellowCards, setYellowCards] = useState(currentYellowCards.toString());
    const [redCards, setRedCards] = useState(currentRedCards.toString());

    // AI Insight states
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState("");
    const [aiError, setAiError] = useState("");

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const handleAttendance = async (status: string) => {
        setIsUpdating(true);
        await markAttendance(employeeId, status);
        setIsUpdating(false);
    };

    const handleSaveStats = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        await updateEmployeeStats(employeeId, Number(performance), Number(yellowCards), Number(redCards));
        setIsUpdating(false);
        setIsModalOpen(false);
    };

    const handleGetAiInsight = async () => {
        setIsAiModalOpen(true);
        if (aiAnalysis) return; // cache

        setIsLoadingAi(true);
        setAiError("");

        try {
            const res = await fetch("/api/employee-insight", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ employeeId })
            });
            const data = await res.json();

            if (data.success) {
                setAiAnalysis(data.analysis);
            } else {
                setAiError(data.error || "Xatolik yuz berdi");
            }
        } catch (error: any) {
            setAiError("Ulanishda xatolik yuz berdi");
        } finally {
            setIsLoadingAi(false);
        }
    };

    const formatAnalysis = (text: string) => {
        return text.split('\n').map((line, idx) => {
            if (line.trim().startsWith('- **') || line.trim().startsWith('* **')) {
                const content = line.replace(/^[\-\*]\s\*\*/, '').replace(/\*\*/, ':');
                return <li key={idx} style={{ marginBottom: "0.25rem", marginLeft: "1.5rem", listStyleType: "disc", fontSize: "0.9rem" }}>
                    <span dangerouslySetInnerHTML={{ __html: content.replace(/\*(.*?)\*/g, "<strong>$1</strong>") }} />
                </li>;
            } else if (line.trim().startsWith('**')) {
                return <strong key={idx} style={{ display: "block", marginTop: "0.75rem", marginBottom: "0.25rem", color: "var(--text-primary)" }}>
                    {line.replace(/\*\*/g, '')}
                </strong>;
            } else if (line.trim() === '') {
                return <br key={idx} />;
            }
            return <p key={idx} style={{ marginBottom: "0.5rem", lineHeight: "1.4", fontSize: "0.9rem" }}>{line}</p>;
        });
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", gap: "0.25rem", marginRight: "1rem", backgroundColor: "var(--background-color)", padding: "0.25rem", borderRadius: "var(--radius-md)" }}>
                <button
                    disabled={isUpdating}
                    onClick={() => handleAttendance("PRESENT")}
                    title="Keldi"
                    style={{ padding: "0.25rem", color: "var(--success-color)", borderRadius: "0.25rem", background: "none", border: "none", cursor: "pointer" }}
                >
                    <CheckCircle size={18} />
                </button>
                <button
                    disabled={isUpdating}
                    onClick={() => handleAttendance("ABSENT")}
                    title="Kelmadi"
                    style={{ padding: "0.25rem", color: "var(--error-color)", borderRadius: "0.25rem", background: "none", border: "none", cursor: "pointer" }}
                >
                    <XCircle size={18} />
                </button>
                <button
                    disabled={isUpdating}
                    onClick={() => handleAttendance("LATE")}
                    title="Kech qoldi"
                    style={{ padding: "0.25rem", color: "var(--warning-color)", borderRadius: "0.25rem", background: "none", border: "none", cursor: "pointer" }}
                >
                    <Clock size={18} />
                </button>
            </div>

            <button
                onClick={() => setIsModalOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", cursor: "pointer" }}
                title="Tahrirlash"
            >
                <Edit2 size={16} />
            </button>

            <button
                onClick={handleGetAiInsight}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "var(--radius-md)", backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", cursor: "pointer", transition: "all 0.2s" }}
                title="AI Xulosa (Gemini)"
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.1)"}
            >
                <Sparkles size={16} />
            </button>

            {isModalOpen && mounted && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 50, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "400px" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>KPI va Kartalarni O'zgartirish</h3>
                        <form onSubmit={handleSaveStats} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Samaradorlik (KPI %)</label>
                                <input required type="number" min="0" max="100" value={performance} onChange={e => setPerformance(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Sariq kartalar (🟨)</label>
                                    <input required type="number" min="0" value={yellowCards} onChange={e => setYellowCards(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Qizil kartalar (🟥)</label>
                                    <input required type="number" min="0" value={redCards} onChange={e => setRedCards(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.75rem 1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", backgroundColor: "transparent", color: "var(--text-primary)", cursor: "pointer" }}>Bekor qilish</button>
                                <button type="submit" disabled={isUpdating} style={{ padding: "0.75rem 1.5rem", borderRadius: "var(--radius-md)", backgroundColor: "var(--primary-color)", color: "#fff", fontWeight: "600", border: "none", cursor: "pointer" }}>{isUpdating ? "Saqlanmoqda..." : "Saqlash"}</button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body)}

            {isAiModalOpen && mounted && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 60, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
                    <div style={{ backgroundColor: "var(--background-color)", padding: "1.5rem", borderRadius: "var(--radius-md)", width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", maxHeight: "80vh", border: "1px solid var(--border-color)", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.9)" }}>
                        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to right, rgba(139, 92, 246, 0.05), transparent)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#8b5cf6" }}>
                                <Sparkles size={20} />
                                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-primary)" }}>Xodim uchun AI Xulosa</h3>
                            </div>
                            <button onClick={() => setIsAiModalOpen(false)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0" }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1, color: "var(--text-secondary)" }}>
                            {isLoadingAi ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 0" }}>
                                    <Loader2 size={32} className="animate-spin" style={{ color: "#8b5cf6", marginBottom: "1rem" }} />
                                    <p style={{ fontSize: "0.9rem" }}>AI xodimning ko'rsatkichlarini tahlil qilmoqda...</p>
                                </div>
                            ) : aiError ? (
                                <div style={{ color: "var(--error-color)", padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)" }}>
                                    {aiError}
                                </div>
                            ) : (
                                <div>
                                    {formatAnalysis(aiAnalysis)}
                                </div>
                            )}
                        </div>

                        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setIsAiModalOpen(false)} style={{ padding: "0.5rem 1.5rem", borderRadius: "100px", backgroundColor: "#8b5cf6", color: "white", border: "none", cursor: "pointer", fontWeight: "500" }}>
                                Tushunarli
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
