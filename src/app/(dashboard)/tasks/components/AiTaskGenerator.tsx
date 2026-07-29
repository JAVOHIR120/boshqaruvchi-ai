"use client";

import { useState } from "react";
import { Sparkles, X, Loader2, Send, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface GeneratedTask {
    id: string;
    title: string;
    assignedTo: string;
    priority: string;
    aiNotes: string | null;
}

export default function AiTaskGenerator() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [objective, setObjective] = useState("");
    const [phase, setPhase] = useState<"input" | "generating" | "success" | "error">("input");
    const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!objective.trim()) return;

        setLoading(true);
        setPhase("generating");
        setGeneratedTasks([]);
        setErrorMsg("");

        try {
            const res = await fetch("/api/generate-okr", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objective })
            });
            const data = await res.json();

            if (res.ok && data.success) {
                setGeneratedTasks(data.tasks || []);
                setPhase("success");
                // Darhol serverdan yangi ma'lumot olish
                router.refresh();
            } else {
                setErrorMsg(data.error || "Noma'lum xatolik");
                setPhase("error");
            }
        } catch {
            setErrorMsg("Tarmoq xatosi yuz berdi");
            setPhase("error");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        // Agar vazifalar yaratilgan bo'lsa, yopilganda yana refresh qilish
        if (phase === "success") {
            router.refresh();
        }
        setIsOpen(false);
        setPhase("input");
        setObjective("");
        setGeneratedTasks([]);
        setErrorMsg("");
    };

    const priorityColors: Record<string, string> = {
        HIGH: "#ef4444",
        MEDIUM: "#f59e0b",
        LOW: "#22c55e"
    };

    return (
        <>
            <button onClick={() => setIsOpen(true)} className="ai-gen-trigger">
                <Sparkles size={18} />
                AI Vazifa Yaratish
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="ai-gen-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                    >
                        <motion.div
                            className="ai-gen-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="ai-gen-header">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                                    <div className="ai-gen-icon-wrap">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc" }}>AI Vazifa Yaratuvchi</h2>
                                        <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>Maqsadni yozing — AI jamoaga taqsimlaydi</p>
                                    </div>
                                </div>
                                <button onClick={handleClose} className="ai-gen-close">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="ai-gen-body">
                                <AnimatePresence mode="wait">
                                    {phase === "input" && (
                                        <motion.form
                                            key="input"
                                            onSubmit={handleGenerate}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
                                        >
                                            <div>
                                                <label className="ai-gen-label">Kompaniya Maqsadi</label>
                                                <textarea
                                                    value={objective}
                                                    onChange={(e) => setObjective(e.target.value)}
                                                    placeholder="Masalan: Keyingi chorakda onlayn sotuvlarni 3 baravar oshirish va mijozlar sonini 500 taga yetkazish"
                                                    className="ai-gen-textarea"
                                                    rows={4}
                                                />
                                            </div>
                                            <div className="ai-gen-hint">
                                                <Zap size={14} />
                                                AI xodimlaringizning band/bo&apos;sh ekanligini o&apos;zi aniqlaydi va ish yukini teng taqsimlaydi
                                            </div>
                                            <button type="submit" disabled={!objective.trim()} className="ai-gen-submit">
                                                <Send size={18} />
                                                Yaratishni boshlash
                                            </button>
                                        </motion.form>
                                    )}

                                    {phase === "generating" && (
                                        <motion.div
                                            key="generating"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="ai-gen-loading"
                                        >
                                            <div className="ai-gen-pulse-ring">
                                                <Loader2 size={32} className="ai-gen-spinner" />
                                            </div>
                                            <h3 style={{ color: "var(--text-primary)", fontSize: "1.1rem", fontWeight: 600, marginTop: "1.5rem" }}>
                                                AI o&apos;ylamoqda...
                                            </h3>
                                            <p style={{ color: "#64748b", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                                Xodimlar bandligini tahlil qilib, vazifalarni taqsimlamoqda
                                            </p>
                                            <div className="ai-gen-progress-bar">
                                                <motion.div
                                                    className="ai-gen-progress-fill"
                                                    initial={{ width: "0%" }}
                                                    animate={{ width: "85%" }}
                                                    transition={{ duration: 8, ease: "easeOut" }}
                                                />
                                            </div>
                                        </motion.div>
                                    )}

                                    {phase === "success" && (
                                        <motion.div
                                            key="success"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
                                        >
                                            <div className="ai-gen-success-banner">
                                                <CheckCircle2 size={20} />
                                                <span>{generatedTasks.length} ta vazifa muvaffaqiyatli yaratildi!</span>
                                            </div>
                                            <div className="ai-gen-tasks-list">
                                                {generatedTasks.map((task, i) => (
                                                    <motion.div
                                                        key={task.id}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.15 }}
                                                        className="ai-gen-task-item"
                                                    >
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                                                            <div style={{
                                                                width: 8, height: 8, borderRadius: "50%",
                                                                backgroundColor: priorityColors[task.priority] || "#f59e0b",
                                                                boxShadow: `0 0 6px ${priorityColors[task.priority] || "#f59e0b"}`
                                                            }} />
                                                            <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>{task.title}</span>
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>→ {task.assignedTo}</span>
                                                            {task.aiNotes && (
                                                                <span style={{ fontSize: "0.72rem", color: "#a78bfa", fontStyle: "italic" }}>💡 {task.aiNotes.substring(0, 40)}...</span>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                            <p style={{ fontSize: "0.8rem", color: "#64748b", textAlign: "center" }}>Doska avtomatik yangilandi ✅</p>
                                        </motion.div>
                                    )}

                                    {phase === "error" && (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="ai-gen-error"
                                        >
                                            <AlertCircle size={28} color="#ef4444" />
                                            <p style={{ color: "#fca5a5", fontSize: "0.9rem", marginTop: "0.75rem" }}>{errorMsg}</p>
                                            <button onClick={() => setPhase("input")} className="ai-gen-retry">
                                                Qayta urinish
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .ai-gen-trigger {
                    display: flex; align-items: center; gap: 0.5rem;
                    padding: 0.65rem 1.4rem;
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%);
                    color: #6ee7b7; border-radius: 9999px; font-weight: 600;
                    font-size: 0.9rem; cursor: pointer;
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2), inset 0 1px 1px rgba(255,255,255,0.1);
                    backdrop-filter: blur(12px);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ai-gen-trigger:hover { 
                    transform: translateY(-2px) scale(1.02); 
                    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.4) 100%);
                    border-color: rgba(16, 185, 129, 0.6);
                    color: #fff;
                    box-shadow: 0 8px 25px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255,255,255,0.2);
                }
                .ai-gen-overlay {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.85);
                    z-index: 100; display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(4px);
                }
                .ai-gen-modal {
                    width: 100%; max-width: 520px; margin: 1rem;
                    background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
                    border-radius: var(--radius-lg); border: 1px solid rgba(99, 102, 241, 0.3);
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 30px rgba(99,102,241,0.15);
                    overflow: hidden;
                }
                .ai-gen-header {
                    padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                    background: linear-gradient(to right, rgba(99,102,241,0.08), transparent);
                }
                .ai-gen-icon-wrap {
                    width: 38px; height: 38px; border-radius: 10px;
                    background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3));
                    display: flex; align-items: center; justify-content: center; color: #a5b4fc;
                }
                .ai-gen-close { background: none; border: none; color: #475569; cursor: pointer; padding: 4px; border-radius: 6px; }
                .ai-gen-close:hover { color: #94a3b8; background: rgba(255,255,255,0.05); }
                .ai-gen-body { padding: 1.5rem; }
                .ai-gen-label { display: block; font-size: 0.82rem; color: #94a3b8; font-weight: 500; margin-bottom: 0.4rem; }
                .ai-gen-textarea {
                    width: 100%; padding: 0.85rem; background: rgba(0,0,0,0.3);
                    border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
                    color: #f1f5f9; font-size: 0.92rem; resize: none; outline: none;
                    transition: border-color 0.2s;
                }
                .ai-gen-textarea:focus { border-color: rgba(99,102,241,0.5); }
                .ai-gen-hint {
                    display: flex; align-items: center; gap: 0.4rem;
                    font-size: 0.78rem; color: #a78bfa; padding: 0.6rem 0.8rem;
                    background: rgba(139,92,246,0.08); border-radius: 8px;
                    border: 1px solid rgba(139,92,246,0.15);
                }
                .ai-gen-submit {
                    width: 100%; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
                    border: none; border-radius: 10px; font-weight: 600; font-size: 0.95rem; cursor: pointer;
                    transition: all 0.2s;
                }
                .ai-gen-submit:hover { filter: brightness(1.1); transform: translateY(-1px); }
                .ai-gen-submit:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
                .ai-gen-loading { display: flex; flex-direction: column; align-items: center; padding: 2rem 0; }
                .ai-gen-pulse-ring {
                    width: 70px; height: 70px; border-radius: 50%;
                    background: rgba(99,102,241,0.1); display: flex; align-items: center; justify-content: center;
                    animation: pulseRing 2s ease-in-out infinite;
                }
                @keyframes pulseRing { 0%,100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.3); } 50% { box-shadow: 0 0 0 15px rgba(99,102,241,0); } }
                .ai-gen-spinner { color: #a5b4fc; animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .ai-gen-progress-bar {
                    width: 100%; max-width: 250px; height: 3px; background: rgba(255,255,255,0.06);
                    border-radius: 99px; margin-top: 1.5rem; overflow: hidden;
                }
                .ai-gen-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a78bfa); border-radius: 99px; }
                .ai-gen-success-banner {
                    display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem;
                    background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25);
                    border-radius: 10px; color: #6ee7b7; font-size: 0.9rem; font-weight: 600;
                }
                .ai-gen-tasks-list { display: flex; flex-direction: column; gap: 0.6rem; max-height: 280px; overflow-y: auto; }
                .ai-gen-task-item {
                    padding: 0.75rem 0.9rem; background: rgba(0,0,0,0.25);
                    border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
                }
                .ai-gen-error { display: flex; flex-direction: column; align-items: center; padding: 2rem 0; }
                .ai-gen-retry {
                    margin-top: 1rem; padding: 0.6rem 1.5rem; background: rgba(239,68,68,0.15);
                    border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; border-radius: 8px;
                    cursor: pointer; font-weight: 500;
                }
            `}</style>
        </>
    );
}
