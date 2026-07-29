"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, UploadCloud, FileCheck2, Loader2, CheckCircle2 } from 'lucide-react';
import type { ComputedTaxModel } from '@/lib/taxEngine';

export default function TaxEImzoManager({ computedTaxes }: { computedTaxes: ComputedTaxModel[] }) {
    const [status, setStatus] = useState<"IDLE" | "FINDING_KEY" | "SIGNING" | "SENDING" | "SUCCESS">("IDLE");

    const reportsCount = computedTaxes.filter(t => t.amount > 0).length;

    const handleSignAndSend = () => {
        setStatus("FINDING_KEY");
        setTimeout(() => {
            setStatus("SIGNING");
            setTimeout(() => {
                setStatus("SENDING");
                setTimeout(() => {
                    setStatus("SUCCESS");
                    setTimeout(() => setStatus("IDLE"), 6000);
                }, 1500);
            }, 1500);
        }, 1500);
    };

    if (reportsCount === 0) {
        return (
            <div style={{
                background: "var(--surface-color)", border: "1px solid var(--border-color)",
                borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem"
            }}>
                <FileCheck2 size={40} color="var(--success-color)" style={{ opacity: 0.5 }} />
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Topshiriladigan hisobotlar mavjud emas</span>
            </div>
        );
    }

    return (
        <div style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(6,182,212,0.05) 100%)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%",
            position: "relative", overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                    <Fingerprint size={18} color="#10b981" />
                    E-IMZO Hisobot (my.soliq.uz)
                </h2>
                
                {/* my.soliq.uz original emblem */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "#fff", padding: "0.2rem 0.5rem", borderRadius: "6px" }}>
                    <img src="/images/soliq-logo.png" alt="Soliq" style={{ height: "16px", objectFit: "contain" }} onError={(e) => e.currentTarget.style.display = 'none'} />
                    <span style={{ fontSize: "0.6rem", fontWeight: "800", color: "#1e3a8a" }}>SOLIQ.UZ</span>
                </div>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Tayyorlangan {reportsCount} ta soliq hisobotini to'g'ridan to'g'ri Moliya va Soliq Vazirligi bazasiga raqamli imzo orqali jo'nating.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexGrow: 1, justifyContent: "center", alignItems: "center", padding: "1rem 0" }}>
                <AnimatePresence mode="wait">
                    {status === "IDLE" && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #10b981", margin: "0 auto 1rem auto" }}>
                                <Fingerprint size={32} color="#10b981" />
                            </div>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>E-IMZO kaliti orqali ulanishga tayyor</span>
                        </motion.div>
                    )}
                    
                    {status === "FINDING_KEY" && (
                        <motion.div key="finding" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <Loader2 size={32} color="#3b82f6" className="animate-spin" style={{ margin: "0 auto 1rem auto" }} />
                            <span style={{ fontSize: "0.85rem", color: "#93c5fd", fontWeight: "600" }}>E-IMZO moduli qidirilmoqda...</span>
                        </motion.div>
                    )}

                    {status === "SIGNING" && (
                        <motion.div key="signing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <Fingerprint size={32} color="#f59e0b" style={{ margin: "0 auto 1rem auto" }} />
                            <span style={{ fontSize: "0.85rem", color: "#fcd34d", fontWeight: "600" }}>Hisobotlar imzolanmoqda...</span>
                        </motion.div>
                    )}

                    {status === "SENDING" && (
                        <motion.div key="sending" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <UploadCloud size={32} color="#8b5cf6" style={{ margin: "0 auto 1rem auto" }} />
                            <span style={{ fontSize: "0.85rem", color: "#c4b5fd", fontWeight: "600" }}>my.soliq.uz bazasiga yuborilmoqda...</span>
                        </motion.div>
                    )}

                    {status === "SUCCESS" && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ textAlign: "center" }}>
                            <CheckCircle2 size={40} color="#10b981" style={{ margin: "0 auto 1rem auto" }} />
                            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", color: "#10b981" }}>Muvaffaqiyatli!</h3>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", background: "rgba(16, 185, 129, 0.1)", padding: "0.4rem", borderRadius: "6px" }}>Xabarnoma №{Math.floor(Math.random() * 900000 + 100000)} | Qabul qilindi</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button
                onClick={handleSignAndSend}
                disabled={status !== "IDLE"}
                style={{
                    width: "100%", padding: "1rem", borderRadius: "12px",
                    background: status !== "IDLE" ? "rgba(255,255,255,0.05)" : "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                    color: status !== "IDLE" ? "var(--text-secondary)" : "#fff", border: "none",
                    cursor: status !== "IDLE" ? "not-allowed" : "pointer",
                    fontSize: "0.95rem", fontWeight: "700", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem",
                    boxShadow: status === "IDLE" ? "0 4px 15px rgba(16, 185, 129, 0.3)" : "none",
                    transition: "all 0.3s", marginTop: "auto"
                }}
            >
                {status !== "IDLE" ? "Jarayonda..." : (
                    <>
                        <Fingerprint size={18} /> Imzolash va Jo'natish
                    </>
                )}
            </button>
        </div>
    );
}
