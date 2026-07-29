"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Loader2, Sparkles, Volume2 } from "lucide-react";
import { generateDailyBriefing } from "@/actions/briefing";
import { motion, AnimatePresence } from "framer-motion";

interface ExecutiveBriefingProps {
    companyId: string;
}

export default function ExecutiveBriefing({ companyId }: ExecutiveBriefingProps) {
    const [status, setStatus] = useState<"idle" | "generating" | "showing" | "error">("idle");
    const [briefingText, setBriefingText] = useState<string>("");
    const [errorMsg, setErrorMsg] = useState<string>("");

    const startBriefing = async () => {
        try {
            setStatus("generating");
            setBriefingText("");
            setErrorMsg("");
            
            const briefing = await generateDailyBriefing(companyId);
            if (!briefing.success || !briefing.text) {
                throw new Error(briefing.error || "Briefing generation failed");
            }

            setBriefingText(briefing.text);
            setStatus("showing");

        } catch (error: any) {
            console.error("Briefing error:", error);
            setErrorMsg(error?.message || "Noma'lum xatolik");
            setStatus("error");
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card" 
            style={{ 
                display: "flex", 
                flexDirection: "column",
                gap: "1.5rem", 
                padding: "1.25rem 2rem", 
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(139, 92, 246, 0.2)",
                borderRadius: "var(--radius-lg)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 10px 40px -10px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.05)",
                width: "100%"
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", width: "100%" }}>
                {/* Icon Section */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <motion.div 
                        animate={status === "generating" ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            background: status === "error" ? "rgba(239, 68, 68, 0.1)" : "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: status === "error" ? "#f87171" : "#a78bfa",
                            border: "1px solid rgba(139, 92, 246, 0.2)",
                            boxShadow: status === "showing" ? "0 0 30px rgba(139, 92, 246, 0.3)" : "none",
                    }}>
                        {status === "generating" ? <Loader2 className="animate-spin" size={28} /> : 
                         status === "showing" ? <Sparkles size={28} /> :
                         <Sparkles size={28} />}
                    </motion.div>
                </div>

                <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                        Executive Briefing
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)", opacity: 0.8 }}>
                        {status === "generating" ? "AI korxona ko'rsatkichlarini sintez qilmoqda..." : 
                         status === "showing" ? "Bugungi strategik hisobot tayyor" :
                         status === "error" ? (errorMsg || "Tizimda vaqtincha uzilish yuz berdi") : "Bugungi muhim ma'lumotlarni AI tahlili bilan ko'ring"}
                    </p>
                </div>

                {status !== "showing" && (
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startBriefing}
                        disabled={status === "generating"}
                        style={{
                            backgroundColor: status === "error" ? "rgba(239, 68, 68, 0.8)" : "var(--primary-color)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            padding: "0.75rem 1.5rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            fontSize: "0.9rem",
                            fontWeight: "700",
                            position: "relative",
                            zIndex: 1,
                            boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.3)"
                        }}
                    >
                        {status === "generating" ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                        {status === "generating" ? "Tayyorlanmoqda..." : status === "error" ? "Qayta urinish" : "Hisobotni ko'rish"}
                    </motion.button>
                )}

                {status === "showing" && (
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setStatus("idle")}
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            color: "var(--text-primary)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            padding: "0.75rem 1.5rem",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            fontWeight: "700",
                        }}
                    >
                        Yopish
                    </motion.button>
                )}
            </div>

            {/* Text Briefing Content Area */}
            <AnimatePresence>
                {status === "showing" && briefingText && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: "hidden", width: "100%" }}
                    >
                        <div style={{ 
                            padding: "1.5rem", 
                            background: "var(--surface-color)", 
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            whiteSpace: "pre-wrap",
                            fontSize: "0.95rem",
                            lineHeight: "1.6",
                            color: "var(--text-primary)",
                            maxHeight: "400px",
                            overflowY: "auto",
                            fontFamily: "var(--font-mono, monospace)"
                        }}>
                            {briefingText}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
