"use client";

import { useState } from "react";
import { Star, X, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function AiClientScoringButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);

    const handleGenerateAnalysis = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/client-scoring", {
                method: "POST"
            });
            const data = await res.json();
            if (data.reply) {
                setReport(data.reply);
            } else {
                setReport("Xatolik yuz berdi. Iltimos qayta urining.");
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setReport("Tarmoq xatosi. AI serveriga ulanib bo'lmadi.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (!report) {
            handleGenerateAnalysis();
        }
    };

    return (
        <>
            <button
                onClick={handleOpen}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.6rem 1.25rem",
                    backgroundColor: "rgba(234, 179, 8, 0.15)",
                    border: "1px solid rgba(234, 179, 8, 0.4)",
                    color: "#fde047",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(234, 179, 8, 0.25)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(234, 179, 8, 0.3)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(234, 179, 8, 0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                <Star size={18} fill="currentColor" />
                A-Klass Mijozlar (AI)
            </button>

            {isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    zIndex: 100,
                    display: "flex",
                    justifyContent: "flex-end",
                    overflow: "hidden"
                }}>
                    <div style={{
                        width: "100%",
                        maxWidth: "550px", // A bit wider for detailed text
                        backgroundColor: "var(--background-color)",
                        borderLeft: "1px solid var(--primary-color)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        animation: "slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
                        boxShadow: "-10px 0 25px rgba(0,0,0,0.8)"
                    }}>
                        <style>{`
                            @keyframes slideInRight {
                                from { transform: translateX(100%); }
                                to { transform: translateX(0); }
                            }
                            .ai-markdown-content h1, .ai-markdown-content h2, .ai-markdown-content h3 {
                                margin-top: 1.5rem;
                                margin-bottom: 0.75rem;
                                color: #f8fafc;
                            }
                            .ai-markdown-content p {
                                margin-bottom: 1rem;
                                line-height: 1.6;
                                color: #cbd5e1;
                            }
                            .ai-markdown-content ul, .ai-markdown-content ol {
                                padding-left: 1.5rem;
                                margin-bottom: 1rem;
                                color: #cbd5e1;
                            }
                            .ai-markdown-content li {
                                margin-bottom: 0.5rem;
                            }
                            .ai-markdown-content strong {
                                color: #f1f5f9;
                                font-weight: 600;
                            }
                        `}</style>

                        {/* Header */}
                        <div style={{
                            padding: "1.5rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            backgroundColor: "rgba(255,255,255,0.02)"
                        }}>
                            <div>
                                <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <Star size={22} color="#eab308" fill="#eab308" />
                                    AI Mijozlar Tahlili
                                </h2>
                                <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.25rem" }}>A-Klass VIP mijozlarni aniqlash</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} style={{
                                width: "32px",
                                height: "32px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                border: "none",
                                color: "#94a3b8",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }} onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "var(--error-color)"; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "#94a3b8"; }}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div style={{ padding: "1.5rem", flex: 1, overflowY: "auto" }} className="ai-markdown-content">
                            {loading ? (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.7 }}>
                                    <RefreshCw size={40} className="animate-spin" color="#eab308" style={{ animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
                                    <p style={{ color: "#cbd5e1" }}>AI mijozlar bazangizni saralamoqda...</p>
                                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                                </div>
                            ) : report ? (
                                <div style={{ animation: "fadeIn 0.5s ease forwards" }}>
                                    <ReactMarkdown>{report}</ReactMarkdown>
                                </div>
                            ) : null}
                        </div>

                        {/* Footer */}
                        {!loading && report && (
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                                <button onClick={handleGenerateAnalysis} style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    backgroundColor: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: "0.5rem",
                                    color: "#f8fafc",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    cursor: "pointer",
                                    transition: "background 0.2s"
                                }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}>
                                    <RefreshCw size={16} /> Qayta Yaratish
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
