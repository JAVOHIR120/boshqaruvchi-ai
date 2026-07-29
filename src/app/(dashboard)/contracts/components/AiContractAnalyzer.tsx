"use client";

import { useState } from "react";
import { ShieldAlert, X, FileSearch, CheckCircle, AlertTriangle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function AiContractAnalyzer() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    // Form inputs
    const [contractText, setContractText] = useState("");
    const [jurisdiction, setJurisdiction] = useState("UZ");

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (contractText.length < 50) {
            toast.error("Iltimos shartnomaning yetarli qismini kiriting (Kamida 50 ta harf).");
            return;
        }

        setLoading(true);
        setAnalysisResult(null);

        try {
            const res = await fetch("/api/analyze-contract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contractText, jurisdiction })
            });
            const data = await res.json();

            if (data.analysis) {
                setAnalysisResult(data.analysis);
                toast.success("Tahlil yakunlandi");
            } else {
                toast.error("Xatolik: " + (data.error || "Ulanishda muammo"));
            }
        } catch (error) {
            console.error("Fetch xatosi:", error);
            toast.error("Serverga ulanishda xatolik.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    color: "#fca5a5", padding: "0.6rem 1.25rem", borderRadius: "0.5rem", fontWeight: "600",
                    transition: "all 0.2s", cursor: "pointer"
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.25)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(239, 68, 68, 0.3)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                    e.currentTarget.style.boxShadow = "none";
                }}
            >
                <ShieldAlert size={18} />
                Risk Tahlili (AI)
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Shartnoma Riski Tahlili (AI Legal)">
                {!analysisResult ? (
                    <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                            Sizga e-mail yoki qog'ozda yuborilgan shartnoma matnini (yoki shubhali bandini) bu yerga tashlang. AI advokat yashirin jarimalar, risklar va qonunga zid joylarini aniqlab beradi.
                        </p>

                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Shartnomani tekshirish standarti</label>
                            <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }}>
                                <option value="UZ">O'zbekiston Respublikasi (O'zR FK)</option>
                                <option value="INTL">Xalqaro Savdo (Incoterms, CISG)</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem", display: "flex", justifyContent: "space-between" }}>
                                <span>Shartnoma Matni (Word, PDF dan nusxa oling)</span>
                                <span style={{ color: contractText.length < 50 ? "var(--error-color)" : "var(--success-color)" }}>{contractText.length} ta belgi</span>
                            </label>
                            <textarea
                                required
                                value={contractText}
                                onChange={e => setContractText(e.target.value)}
                                rows={8}
                                placeholder="Shartnoma moddalari, tomonlar majburiyatlari, penya, fors-major punktlari..."
                                style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "vertical" }}
                            ></textarea>
                        </div>

                        <button type="submit" disabled={loading || contractText.length < 50} style={{
                            width: "100%", marginTop: "1rem", padding: "0.85rem",
                            backgroundColor: "rgba(239, 68, 68, 0.8)", color: "white",
                            border: "none", borderRadius: "var(--radius-md)", fontWeight: "600",
                            cursor: "pointer", opacity: loading || contractText.length < 50 ? 0.5 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem"
                        }}>
                            {loading ? <span className="animate-spin text-xl">🔍</span> : <FileSearch size={18} />}
                            {loading ? "AI Shartnomani skaner qilmoqda..." : "Shartnomani Tahlil Qilish"}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", minHeight: "50vh", maxHeight: "70vh" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--warning-color)", marginBottom: "1rem", fontWeight: "600", fontSize: "1.1rem" }}>
                            <AlertTriangle size={20} /> AI Tahlili Natijasi
                        </div>
                        <div style={{
                            flex: 1, overflowY: "auto", padding: "1.5rem",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            fontSize: "0.95rem", color: "#cbd5e1",
                            lineHeight: "1.6"
                        }}>
                            <style>{`
                                .markdown-analysis h1, .markdown-analysis h2, .markdown-analysis h3 { 
                                    color: #f8fafc; margin-top: 1rem; margin-bottom: 0.5rem; 
                                }
                                .markdown-analysis strong { color: #f1f5f9; }
                                .markdown-analysis ul, .markdown-analysis ol { padding-left: 1.5rem; margin-bottom: 1rem; }
                                .markdown-analysis li { margin-bottom: 0.5rem; }
                            `}</style>
                            <div className="markdown-analysis" style={{ animation: "fadeIn 0.5s" }}>
                                <ReactMarkdown>{analysisResult}</ReactMarkdown>
                            </div>
                        </div>
                        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
                            <button onClick={() => setAnalysisResult(null)} style={{ padding: "0.75rem 1.5rem", backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: "500" }} onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"} onMouseLeave={e => e.currentTarget.style.backgroundColor = "var(--surface-color)"}>
                                Boshqa shartnomani tekshirish
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
