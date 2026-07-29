"use client";

import { useState } from "react";
import { Target, X, RefreshCw, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AiOkrButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [objective, setObjective] = useState("");
    const [resultMsg, setResultMsg] = useState("");
    const router = useRouter();

    const handleGenerateOKR = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective.trim()) return;

        setLoading(true);
        setResultMsg("");

        try {
            const res = await fetch("/api/generate-okr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objective })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setResultMsg(`🎉 Zo'r! AI "${objective}" maqsadiga yetish uchun ${data.count} ta maxsus vazifa (Key Result) yaratib, Kanban doskaga qo'shdi.`);
                // Refresh the page to show new tasks
                setTimeout(() => {
                    setIsOpen(false);
                    router.refresh();
                }, 3000);
            } else {
                setResultMsg("Xatolik: " + (data.error || "Ulanishda muammo."));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            setResultMsg("Tarmoq xatosi yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => { setIsOpen(true); setResultMsg(""); setObjective(""); }}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.5rem",
                    background: "linear-gradient(135deg, var(--success-color) 0%, #059669 100%)",
                    color: "white",
                    borderRadius: "9999px",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    border: "none",
                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.6)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 14px rgba(16, 185, 129, 0.4)";
                }}
            >
                <Sparkles size={18} />
                AI Auto-OKR
            </button>

            {isOpen && (
                <div style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    zIndex: 100,
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <div style={{
                        width: "100%", maxWidth: "500px",
                        backgroundColor: "var(--background-color)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--primary-color)",
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.8)",
                        overflow: "hidden",
                        display: "flex", flexDirection: "column",
                        animation: "fadeIn 0.2s ease",
                        margin: "1rem"
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: "1.25rem 1.5rem",
                            borderBottom: "1px solid rgba(255,255,255,0.08)",
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            background: "linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)"
                        }}>
                            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "#f8fafc", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Target size={22} color="var(--success-color)" />
                                AI OKR Yaratuvchi
                            </h2>
                            <button onClick={() => setIsOpen(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "1.5rem" }}>
                            <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem", lineHeight: "1.5" }}>
                                Jamoangiz uchun bitta **Katta Maqsad (Objective)** kiriting. Bizning AI uni erishish mumkin bo'lgan kichik, o'lchanadigan oylik vazifalarga (Key Results) bo'lib tashlaydi va o'zi avtomatik tarzda doskaga qo'shadi.
                            </p>

                            <form onSubmit={handleGenerateOKR}>
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <label style={{ display: "block", color: "#cbd5e1", fontSize: "0.9rem", fontWeight: "500", marginBottom: "0.5rem" }}>
                                        Yillik yoki Chorak Maqsadi (Objective):
                                    </label>
                                    <textarea
                                        value={objective}
                                        onChange={(e) => setObjective(e.target.value)}
                                        placeholder="Masalan: Yil oxirigacha O'rta Osiyo bozorida sotuvlarni 2 baravar oshirish"
                                        style={{
                                            width: "100%", padding: "0.875rem",
                                            backgroundColor: "rgba(255,255,255,0.05)",
                                            border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: "0.5rem", color: "#f8fafc",
                                            fontSize: "0.95rem", minHeight: "100px", resize: "vertical", outline: "none"
                                        }}
                                        disabled={loading}
                                    />
                                </div>

                                {resultMsg && (
                                    <div style={{
                                        marginBottom: "1.5rem", padding: "1rem", borderRadius: "0.5rem",
                                        backgroundColor: resultMsg.includes("Xatolik") ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                                        border: resultMsg.includes("Xatolik") ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                        color: resultMsg.includes("Xatolik") ? "#fca5a5" : "#6ee7b7",
                                        fontSize: "0.9rem", lineHeight: "1.5"
                                    }}>
                                        {resultMsg}
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsOpen(false)}
                                        style={{ padding: "0.6rem 1.2rem", background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "500" }}
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !objective.trim()}
                                        style={{
                                            padding: "0.6rem 1.5rem", display: "flex", alignItems: "center", gap: "0.5rem",
                                            background: "var(--primary-color)", color: "white",
                                            border: "none", borderRadius: "0.5rem", cursor: loading ? "not-allowed" : "pointer",
                                            fontWeight: "600", opacity: loading || !objective.trim() ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? <RefreshCw size={18} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} /> : <Send size={18} />}
                                        {loading ? "O'ylamoqda..." : "Yaratish"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
        </>
    );
}
