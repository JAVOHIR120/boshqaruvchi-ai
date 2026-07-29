"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { PlusCircle } from "lucide-react";
import { addInvestorDocument } from "@/actions";

type Props = {
    investorId: string;
};

export default function InvestorRowActions({ investorId }: Props) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await addInvestorDocument(investorId, formData);
        setIsSubmitting(false);
        setIsUploadOpen(false);
    };

    return (
        <div>
            <button
                onClick={() => setIsUploadOpen(true)}
                style={{
                    padding: "0.25rem 0.5rem", border: "1px solid var(--border-color)",
                    borderRadius: "100px", backgroundColor: "var(--background-color)",
                    color: "var(--text-primary)", fontSize: "0.8rem", fontWeight: "500",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem"
                }}
            >
                <PlusCircle size={14} /> Hujjat qo'shish
            </button>

            {/* Upload Document Modal */}
            {isUploadOpen && mounted && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "450px" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Hujjat biriktirish (Data Room)</h3>

                        <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Hujjat Nomi</label>
                                <input required name="title" type="text" placeholder="Masalan: 2024-yil Yillik Hisobot" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Hujjat Turi</label>
                                <select required name="type" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }}>
                                    <option value="SAFE">SAFE Shartnoma</option>
                                    <option value="SHA">Aksiyadorlik Kelishuvi (SHA)</option>
                                    <option value="REPORT">Moliyaviy Hisobot</option>
                                    <option value="OTHER">Boshqa Hujjat</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Hujjat Havolasi (URL)</label>
                                <input required name="url" type="url" placeholder="https://docs.google.com/..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
                                <button type="button" onClick={() => setIsUploadOpen(false)} style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "100px", backgroundColor: "transparent", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer" }}>Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", backgroundColor: "var(--primary-color)", color: "white", fontWeight: "600", border: "none", cursor: "pointer" }}>
                                    {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
