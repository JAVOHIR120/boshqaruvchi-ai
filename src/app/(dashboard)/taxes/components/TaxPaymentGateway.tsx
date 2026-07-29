"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Building, FileText, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import type { ComputedTaxModel } from '@/lib/taxEngine';

export default function TaxPaymentGateway({ computedTaxes }: { computedTaxes: ComputedTaxModel[] }) {
    const [selectedMethod, setSelectedMethod] = useState<"BANK" | "PAYME" | "UZUM">("BANK");
    const [isPaying, setIsPaying] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const totalTax = computedTaxes.reduce((sum, t) => sum + t.amount, 0);
    const activeTaxesCount = computedTaxes.filter(t => t.amount > 0).length;

    const handlePay = () => {
        setIsPaying(true);
        setTimeout(() => {
            setIsPaying(false);
            setIsSuccess(true);
            setTimeout(() => setIsSuccess(false), 5000);
        }, 2000);
    };

    if (totalTax === 0) {
        return (
            <div style={{
                background: "var(--surface-color)", border: "1px solid var(--border-color)",
                borderRadius: "20px", padding: "1.5rem", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", height: "100%", gap: "1rem"
            }}>
                <CheckCircle2 size={40} color="var(--success-color)" style={{ opacity: 0.5 }} />
                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Barcha soliqlar to'langan yoki hali hisoblanmagan</span>
            </div>
        );
    }

    return (
        <div style={{
            background: "linear-gradient(145deg, rgba(20,20,30,0.9) 0%, rgba(30,35,45,0.95) 100%)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%",
            position: "relative", overflow: "hidden"
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                    <CreditCard size={18} color="#3b82f6" />
                    Soliq Tolov Shlyuzi (Avto-To'lov)
                </h2>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Hisoblangan <strong>{activeTaxesCount} ta</strong> soliq turlari bo'yicha to'lov topshiriqnomasini yaratish yoki to'g'ridan to'g'ri to'lash.
            </p>

            <div style={{ 
                background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.15)",
                padding: "1rem", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
                <div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600", letterSpacing: "1px", marginBottom: "0.2rem" }}>Jami To'lanuvchi Summa</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60a5fa" }}>{totalTax.toLocaleString()} UZS</div>
                </div>
                <FileText size={24} color="#3b82f6" opacity={0.5} />
            </div>

            {/* Payment Methods */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                {/* BANK */}
                <button
                    onClick={() => setSelectedMethod("BANK")}
                    style={{
                        padding: "0.75rem", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                        background: selectedMethod === "BANK" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedMethod === "BANK" ? "#fff" : "rgba(255,255,255,0.05)"}`,
                        cursor: "pointer", transition: "all 0.2s"
                    }}
                >
                    <Building size={20} color="var(--text-primary)" />
                    <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-primary)" }}>Bank Hisobdan</span>
                </button>

                {/* UZUM BUSINESS */}
                <button
                    onClick={() => setSelectedMethod("UZUM")}
                    style={{
                        padding: "0.75rem", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                        background: selectedMethod === "UZUM" ? "rgba(112, 0, 255, 0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedMethod === "UZUM" ? "#7000FF" : "rgba(255,255,255,0.05)"}`,
                        cursor: "pointer", transition: "all 0.2s"
                    }}
                >
                    <img src="/images/uzum.png" alt="Uzum" style={{ height: "22px", objectFit: "contain", filter: selectedMethod !== "UZUM" ? "grayscale(100%) opacity(0.5)" : "none" }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-primary)" }}>Uzum Business</span>
                </button>

                {/* PAYME BUSINESS */}
                <button
                    onClick={() => setSelectedMethod("PAYME")}
                    style={{
                        padding: "0.75rem", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                        background: selectedMethod === "PAYME" ? "rgba(20, 185, 172, 0.15)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${selectedMethod === "PAYME" ? "#14B9AC" : "rgba(255,255,255,0.05)"}`,
                        cursor: "pointer", transition: "all 0.2s"
                    }}
                >
                    <img src="/images/payme.png" alt="Payme" style={{ height: "22px", objectFit: "contain", filter: selectedMethod !== "PAYME" ? "grayscale(100%) opacity(0.5)" : "none" }} />
                    <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-primary)" }}>Business</span>
                </button>
                
                {/* XALQ BANKI / SOLIQ */}
                <button
                    onClick={() => setSelectedMethod("BANK")}
                    style={{
                        padding: "0.75rem", borderRadius: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.05)",
                        cursor: "not-allowed", opacity: 0.5
                    }}
                >
                    {/* Fake Soliq.uz logo via SVG */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#1e3a8a" }}>
                       <ShieldCheck size={18} color="#3b82f6" />
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "var(--text-primary)" }}>Soliq App (Kelmoqda)</span>
                </button>
            </div>

            {/* Pay Button / Status */}
            <div style={{ marginTop: "auto" }}>
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.button
                            key="pay-btn"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handlePay}
                            disabled={isPaying}
                            style={{
                                width: "100%", padding: "1rem", borderRadius: "12px",
                                background: selectedMethod === "BANK" ? "var(--primary-color)" : selectedMethod === "PAYME" ? "#14B9AC" : "#7000FF",
                                color: "#fff", border: "none", cursor: isPaying ? "not-allowed" : "pointer",
                                fontSize: "0.95rem", fontWeight: "700", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem",
                                boxShadow: `0 4px 15px ${selectedMethod === "BANK" ? "rgba(59,130,246,0.3)" : selectedMethod === "PAYME" ? "rgba(20,185,172,0.3)" : "rgba(112,0,255,0.3)"}`,
                                transition: "background 0.3s"
                            }}
                        >
                            {isPaying ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" /> To'lanmoqda / Yaratilmoqda...
                                </>
                            ) : (
                                <>
                                    {selectedMethod === "BANK" ? "To'lov topshirig'i yaratish" : "To'lash"} <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    ) : (
                        <motion.div
                            key="success-box"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{
                                width: "100%", padding: "0.85rem", borderRadius: "12px",
                                background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#10b981"
                            }}
                        >
                            <CheckCircle2 size={20} />
                            <span style={{ fontSize: "0.9rem", fontWeight: "700" }}>
                                {selectedMethod === "BANK" ? "Topshiriqnoma jo'natildi!" : "To'lov muvaffaqiyatli!"}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

// Inline component usage for Soliq badge fallback inside this file context, importing ShieldCheck above was forgotten, adding it here.
import { ShieldCheck } from 'lucide-react';
