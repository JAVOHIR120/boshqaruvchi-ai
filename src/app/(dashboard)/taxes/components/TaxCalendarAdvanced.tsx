"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, AlertCircle, CheckCircle2, Clock, ChevronRight, Calculator } from "lucide-react";
import type { ComputedTaxModel } from "@/lib/taxEngine";

// --- Soliq Kodeksi Deadlines (qoidalari) ---
// Boshlang'ich qoidalar (soddalashtirilgan, lekin aniq mashiq uchun)
// QQS: Keyingi oyning 20-sanasigacha (258-modda)
// Aylanma soliq: Keyingi oyning 15-sanasigacha
// Foyda solig'i: Har chorakdan keyingi oyning 20-sanasigacha (avanslar har oyning 10-sanasi)
// Daromad va Ijtimoiy soliq: Keyingi oyning 15-sanasigacha
// Mol-mulk / Yer: Har oyning 10-sanasigacha (avans)

interface TaxDeadlineDef {
    id: string;
    dayOfMonth: number;
    frequency: "monthly" | "quarterly" | "yearly";
    description: string;
}

const DEADLINE_RULES: Record<string, TaxDeadlineDef> = {
    "QQS": { id: "QQS", dayOfMonth: 20, frequency: "monthly", description: "Hisobot oyidan keyingi oyning 20-sanasigacha" },
    "FOYDA": { id: "FOYDA", dayOfMonth: 20, frequency: "monthly", description: "Avans to'lovi qoidasi qo'llanilganda (har oyning 20-sanasi)" }, // Sodda qilingan
    "DAROMAD": { id: "DAROMAD", dayOfMonth: 15, frequency: "monthly", description: "Daromad to'langan oydan keyingi oyning 15-sanasigacha" },
    "IJTIMOIY": { id: "IJTIMOIY", dayOfMonth: 15, frequency: "monthly", description: "Hisobot oyidan keyingi oyning 15-sanasigacha" },
    "MOL_MULK": { id: "MOL_MULK", dayOfMonth: 10, frequency: "monthly", description: "Har oyning 10-sanasigacha (avans to'lovlari)" },
    "YER": { id: "YER", dayOfMonth: 10, frequency: "monthly", description: "Har oyning 10-sanasigacha" },
    "SUV": { id: "SUV", dayOfMonth: 20, frequency: "monthly", description: "Kichik korxonalar uchun har chorakda qilinadi (shartli oyning 20-si)" },
    "AKSIZ": { id: "AKSIZ", dayOfMonth: 10, frequency: "monthly", description: "Umumiy tartibda 10-sana" },
    "YER_QARI": { id: "YER_QARI", dayOfMonth: 20, frequency: "monthly", description: "Har oyning 20-sanasigacha" },
    "RENTA": { id: "RENTA", dayOfMonth: 20, frequency: "monthly", description: "Har oyning 20-sanasigacha" },
    "AYLANMA": { id: "AYLANMA", dayOfMonth: 15, frequency: "monthly", description: "Hisobot oyidan keyingi oyning 15-sanasigacha" },
};

export default function TaxCalendarAdvanced({ computedTaxes }: { computedTaxes: ComputedTaxModel[] }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 60000); // Har daqiqada yangilanadi
        return () => clearInterval(timer);
    }, []);

    const enrichedTaxes = useMemo(() => {
        const currentDate = now;
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const currentDay = currentDate.getDate();

        return computedTaxes.map(tax => {
            const rule = DEADLINE_RULES[tax.id] || { dayOfMonth: 20, frequency: "monthly", description: "Standart muddat" };
            
            // Muddati hisoblash: 
            // Agar joriy oyning shu sanasi o'tgan bo'lsa, keyingi oy
            let targetYear = currentYear;
            let targetMonth = currentMonth;
            
            if (currentDay > rule.dayOfMonth) {
                targetMonth++;
                if (targetMonth > 11) {
                    targetMonth = 0;
                    targetYear++;
                }
            }

            const dueDate = new Date(targetYear, targetMonth, rule.dayOfMonth, 23, 59, 59);
            const totalCycleDays = new Date(targetYear, targetMonth, 0).getDate(); // shu oydagi kunlar soni
            const msDiff = dueDate.getTime() - currentDate.getTime();
            const daysRemaining = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
            
            const state: "safe" | "warning" | "danger" = 
                daysRemaining <= 3 ? "danger" : 
                daysRemaining <= 7 ? "warning" : "safe";

            const progressPct = Math.max(0, Math.min(100, 100 - (daysRemaining / totalCycleDays) * 100));

            return {
                ...tax,
                dueDate,
                daysRemaining,
                state,
                progressPct,
                description: rule.description,
            };
        }).sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [computedTaxes, now]);

    if (enrichedTaxes.length === 0) {
        return (
            <div style={{
                padding: "2rem", borderRadius: "16px",
                background: "var(--surface-color)", border: "1px solid var(--border-color)",
                textAlign: "center"
            }}>
                <CalendarClock size={32} color="var(--text-secondary)" style={{ opacity: 0.5, marginBottom: "1rem" }} />
                <h3 style={{ fontSize: "1.1rem", color: "var(--text-primary)", fontWeight: "600" }}>Hech qanday aktiv soliq yo'q</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Chap tomondan soliqlarni yoqing</p>
            </div>
        );
    }

    return (
        <div style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
            border: "1px solid var(--border-color)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                    <CalendarClock size={20} color="#8b5cf6" />
                    Aqlli Soliq Taqvimi
                </h2>
                <div style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.3rem", background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", padding: "0.3rem 0.6rem", borderRadius: "8px", fontWeight: "600" }}>
                    {now.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
            </div>
            
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Soliq kodeksida belgilangan qat'iy muddatlar asosida to'lov kunlarini o'tkazib yubormaslik uchun chuqur avtomatlashtirilgan taqvim.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexGrow: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
                <AnimatePresence>
                    {enrichedTaxes.map((tax, index) => {
                        const isDanger = tax.state === "danger";
                        const isWarn = tax.state === "warning";
                        const accentColor = isDanger ? "#ef4444" : isWarn ? "#f59e0b" : "#10b981";
                        const bgFade = isDanger ? "rgba(239, 68, 68, 0.08)" : isWarn ? "rgba(245, 158, 11, 0.08)" : "rgba(16, 185, 129, 0.05)";

                        return (
                            <motion.div
                                key={tax.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                style={{
                                    padding: "1rem", borderRadius: "12px",
                                    background: bgFade, border: `1px solid ${accentColor}30`,
                                    display: "flex", flexDirection: "column", gap: "0.75rem",
                                    position: "relative", overflow: "hidden"
                                }}
                            >
                                {/* Puldagi yon tomon chiziq */}
                                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: accentColor }} />

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                            {tax.label}
                                            {isDanger && (
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                                                    <AlertCircle size={14} color={accentColor} />
                                                </motion.div>
                                            )}
                                        </h4>
                                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                            {tax.description}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "0.95rem", fontWeight: "800", color: accentColor }}>
                                            {tax.amount.toLocaleString()} <span style={{ fontSize: "0.7rem", fontWeight: "400" }}>UZS</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${tax.progressPct}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                            style={{ height: "100%", background: accentColor, borderRadius: "3px" }}
                                        />
                                    </div>
                                    <div style={{ fontSize: "0.8rem", fontWeight: "700", color: accentColor, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                        <Clock size={12} />
                                        {tax.daysRemaining} kun
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
            
            <button style={{
                width: "100%", padding: "0.8rem", borderRadius: "10px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "var(--text-primary)", fontWeight: "600", fontSize: "0.85rem",
                display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem",
                cursor: "pointer", transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
                Barcha soliqlarni to'lash <ChevronRight size={16} />
            </button>
        </div>
    );
}
