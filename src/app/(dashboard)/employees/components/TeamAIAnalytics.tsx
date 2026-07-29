"use client";

import { useState } from "react";
import { Sparkles, X, Loader2 } from "lucide-react";

export default function TeamAIAnalytics() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState("");
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        setIsOpen(true);
        if (analysis) return; // Don't re-fetch if already have data unless explicitly requested

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/hr-analytics");
            const data = await res.json();

            if (data.success) {
                setAnalysis(data.analysis);
            } else {
                setError(data.error || "Noma'lum xatolik yuz berdi");
            }
        } catch (err: any) {
            setError(err.message || "Ulanishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    // Markdown-like matnni ozgina formatlash
    const formatAnalysis = (text: string) => {
        return text.split('\n').map((line, idx) => {
            if (line.trim().startsWith('- **') || line.trim().startsWith('* **')) {
                // Bullet point with bold text
                const content = line.replace(/^[\-\*]\s\*\*/, '').replace(/\*\*/, ':');
                return <li key={idx} style={{ marginBottom: "0.5rem", marginLeft: "1.5rem", listStyleType: "disc" }}>
                    <span dangerouslySetInnerHTML={{ __html: content.replace(/\*(.*?)\*/g, "<strong>$1</strong>") }} />
                </li>;
            } else if (line.trim().startsWith('**')) {
                // Bold text header
                return <h4 key={idx} style={{ marginTop: "1rem", marginBottom: "0.5rem", fontWeight: "600", color: "var(--text-primary)" }}>
                    {line.replace(/\*\*/g, '')}
                </h4>;
            } else if (line.trim().match(/^\d+\./)) {
                // Numbered list
                return <div key={idx} style={{ marginBottom: "0.5rem", marginLeft: "1rem" }}>
                    <strong>{line.split('.')[0]}.</strong> {line.substring(line.indexOf('.') + 1)}
                </div>;
            } else if (line.trim() === '') {
                return <br key={idx} />;
            }
            return <p key={idx} style={{ marginBottom: "0.5rem", lineHeight: "1.5" }}>{line}</p>;
        });
    };

    return (
        <>
            <button
                onClick={handleAnalyze}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    color: "#c4b5fd",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                    borderRadius: "var(--radius-md)",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    backdropFilter: "blur(4px)"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 0 15px rgba(139, 92, 246, 0.2)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                <Sparkles size={18} />
                AI HR Tahlil
            </button>

            {isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(11, 15, 25, 0.75)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    fontFamily: "var(--font-sans), sans-serif",
                    animation: "fadeIn 0.2s ease-out forwards"
                }}>
                    <div style={{
                        background: "linear-gradient(145deg, rgba(17, 24, 39, 0.95), rgba(11, 15, 25, 0.98))",
                        borderRadius: "var(--radius-lg)",
                        width: "100%",
                        maxWidth: "650px",
                        maxHeight: "85vh",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(139, 92, 246, 0.3)",
                        animation: "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                    }}>
                        <div style={{
                            padding: "1.5rem",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "linear-gradient(to right, rgba(139, 92, 246, 0.1), transparent)",
                            borderTopLeftRadius: "var(--radius-lg)",
                            borderTopRightRadius: "var(--radius-lg)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                <Sparkles size={24} color="#a78bfa" style={{ filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.6))" }} />
                                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)", fontWeight: "700", letterSpacing: "-0.01em" }}>Jamoaviy AI Analitikasi</h3>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ 
                                    background: "rgba(255,255,255,0.05)", 
                                    border: "1px solid rgba(255,255,255,0.1)", 
                                    color: "var(--text-secondary)", 
                                    cursor: "pointer", 
                                    padding: "0.4rem",
                                    borderRadius: "var(--radius-sm)",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "var(--text-primary)";
                                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: "1.75rem", overflowY: "auto", flex: 1, scrollbarWidth: "thin", scrollbarColor: "rgba(139, 92, 246, 0.3) transparent" }}>
                            {loading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 0", color: "var(--text-secondary)" }}>
                                    <Loader2 size={44} className="animate-spin" style={{ color: "#a78bfa", marginBottom: "1.25rem", filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))" }} />
                                    <p style={{ fontSize: "1.1rem", fontWeight: "500", color: "var(--text-primary)" }}>AI Jamoaviy ko'rsatkichlarni tahlil qilmoqda...</p>
                                    <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: "0.5rem" }}>Barcha xodimlarning KPI va davomati o'rganilmoqda</p>
                                </div>
                            ) : error ? (
                                <div style={{ padding: "1.25rem", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#fca5a5", borderRadius: "var(--radius-md)", border: "1px solid rgba(239, 68, 68, 0.2)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <strong style={{ color: "#ef4444" }}>Xatolik:</strong> {error}
                                </div>
                            ) : (
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                                    {formatAnalysis(analysis)}
                                </div>
                            )}
                        </div>

                        <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid rgba(255, 255, 255, 0.05)", display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.15)" }}>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    padding: "0.6rem 1.75rem",
                                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                                    color: "var(--text-primary)",
                                    border: "1px solid rgba(255, 255, 255, 0.1)",
                                    borderRadius: "var(--radius-md)",
                                    cursor: "pointer",
                                    fontWeight: "500",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)"}
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}} />
        </>
    );
}
