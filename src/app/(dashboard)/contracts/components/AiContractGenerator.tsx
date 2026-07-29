"use client";

import { useState } from "react";
import { Sparkles, X, FileText, Globe, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function AiContractGenerator() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatedContract, setGeneratedContract] = useState<string | null>(null);

    // Form inputs
    const [type, setType] = useState("Sotib Olish va Sotish (Oldi-sotdi)");
    const [partyA, setPartyA] = useState("");
    const [partyB, setPartyB] = useState("");
    const [amount, setAmount] = useState("");
    const [jurisdiction, setJurisdiction] = useState("UZ");
    const [additionalTerms, setAdditionalTerms] = useState("");

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setGeneratedContract(null);

        try {
            const res = await fetch("/api/generate-contract", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, partyA, partyB, amount, jurisdiction, additionalTerms })
            });
            const data = await res.json();

            if (data.contractText) {
                setGeneratedContract(data.contractText);
                toast.success("Shartnoma muvaffaqiyatli yaratildi");
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
                className="btn-primary"
                style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    background: "linear-gradient(135deg, var(--primary-color) 0%, #2563eb 100%)",
                    border: "none", boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
                    color: "white", padding: "0.6rem 1.25rem", borderRadius: "0.5rem", fontWeight: "600",
                    transition: "all 0.2s"
                }}
            >
                <Sparkles size={18} />
                AI Shartnoma Tuzish
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Aqlli Shartnoma Yaratish (Smart Contract)">
                {!generatedContract ? (
                    <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                            AI yordamida O'zbekiston yoki Xalqaro qonunchilikka (Incoterms, CISG) mos shartnomalarni 10 soniyada ishonchli usulda avtomat yarating.
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                            {/* Type */}
                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Shartnoma Turi</label>
                                <select value={type} onChange={e => setType(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }}>
                                    <option value="Sotib Olish va Sotish (Oldi-sotdi)">Oldi-Sotdi (Xarid)</option>
                                    <option value="Xizmat Ko'rsatish">Xizmat Ko'rsatish (Consulting/IT)</option>
                                    <option value="Mehnat Shartnomasi">Mehnat Shartnomasi (Employment)</option>
                                    <option value="Sir saqlash (NDA)">Sir saqlash (NDA)</option>
                                    <option value="Ijara Shartnomasi">Ijara (Lease)</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>1-Tomon (Bizning Kompaniya)</label>
                                <input required value={partyA} onChange={e => setPartyA(e.target.value)} type="text" placeholder='"Boshqaruvchi OS" MCHJ' style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>2-Tomon (Mijoz / Hamkor)</label>
                                <input required value={partyB} onChange={e => setPartyB(e.target.value)} type="text" placeholder='"Uzum Market" MCHJ YOKI Jismoniy Shaxs' style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Summa yoki Baho</label>
                                <input value={amount} onChange={e => setAmount(e.target.value)} type="text" placeholder='Masalan: 15,000,000 yoki "Kelishuv"' style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Huquqiy Standart (Qonunchilik)</label>
                                <select value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }}>
                                    <option value="UZ">O'zbekiston Qonunchiligi (Fuqarolik)</option>
                                    <option value="INTL">Xalqaro Tijorat (International/Incoterms)</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Qo'shimcha maxsus shartlar (Ixtiyoriy)</label>
                                <textarea value={additionalTerms} onChange={e => setAdditionalTerms(e.target.value)} rows={2} placeholder="Sotuvchi tovardagi defektlarni 3 kun ichida to'g'irlab berishi shart" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "none" }}></textarea>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} style={{
                            width: "100%", marginTop: "1rem", padding: "0.85rem",
                            backgroundColor: "var(--primary-color)", color: "white",
                            border: "none", borderRadius: "var(--radius-md)", fontWeight: "600",
                            cursor: "pointer", opacity: loading ? 0.7 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem"
                        }}>
                            {loading ? <span className="animate-spin text-xl">⏳</span> : <FileText size={18} />}
                            {loading ? "AI Shartnoma yozmoqda..." : "Yuborish va Yaratish"}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", height: "60vh" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success-color)", marginBottom: "1rem", fontWeight: "600" }}>
                            <CheckCircle size={20} /> Shartnoma muvaffaqiyatli yaratildi!
                        </div>
                        <div style={{
                            flex: 1, overflowY: "auto", padding: "1.5rem",
                            backgroundColor: "rgba(255,255,255,0.03)",
                            borderRadius: "var(--radius-md)",
                            border: "1px solid rgba(255,255,255,0.05)",
                            fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text-primary)"
                        }}>
                            <ReactMarkdown>{generatedContract}</ReactMarkdown>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                            <button onClick={() => setGeneratedContract(null)} style={{ flex: 1, padding: "0.75rem", background: "none", border: "1px solid var(--border-color)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)" }}>
                                Qayta Yaratish
                            </button>
                            <button onClick={() => {
                                navigator.clipboard.writeText(generatedContract);
                                toast.success("Shartnoma nusxalandi! Endi Word'ga tashlashingiz mumkin.");
                            }} style={{ flex: 1, padding: "0.75rem", backgroundColor: "var(--primary-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "600" }}>
                                Nusxa Olish
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}
