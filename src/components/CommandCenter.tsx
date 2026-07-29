"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Command, ArrowRight, User, Briefcase, FileText, Settings, LayoutDashboard, Target, CheckSquare, MessageSquare, Scale, Archive, GraduationCap, Bot } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const ACTIONS = [
    { id: "dash", title: "Umumiy", subtitle: "Boshqaruv paneli", icon: LayoutDashboard, path: "/dashboard", tags: ["home", "bosh"] },
    { id: "crm", title: "Sotuv va Mijozlar", subtitle: "CRM boshqaruvi", icon: Target, path: "/crm", tags: ["sales", "leads"] },
    { id: "tasks", title: "Vazifalar", subtitle: "Ishlar ro'yxati", icon: CheckSquare, path: "/tasks", tags: ["to do", "vazifa"] },
    { id: "emp", title: "Xodimlar (HR)", subtitle: "Jamoa boshqaruvi", icon: User, path: "/employees", tags: ["staff", "hr", "users"] },
    { id: "fin", title: "Buxgalteriya", subtitle: "Moliya va hisob", icon: Scale, path: "/accounting", tags: ["money", "daromad", "xarajat"] },
    { id: "inv", title: "Inventar", subtitle: "Omborxona tahlili", icon: Archive, path: "/inventory", tags: ["stock", "ombor"] },
    { id: "ai", title: "AI Maslahatchi", subtitle: "Strategik yordamchi", icon: Bot, path: "/ai-consultant", tags: ["consultant", "strategy"] },
    { id: "academy", title: "Leader Academy", subtitle: "O'quv materiallari", icon: GraduationCap, path: "/leader-academy", tags: ["learn", "academy"] },
    { id: "set", title: "Sozlamalar", subtitle: "Tizim sozlamalari", icon: Settings, path: "/settings", tags: ["config", "profile"] },
];

export default function CommandCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    const filteredActions = ACTIONS.filter(action => 
        action.title.toLowerCase().includes(query.toLowerCase()) ||
        action.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        action.tags.some(tag => tag.includes(query.toLowerCase()))
    );

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") closeModal();
            
            if (isOpen) {
                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredActions.length));
                }
                if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setSelectedIndex(prev => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
                }
                if (e.key === "Enter" && filteredActions[selectedIndex]) {
                    e.preventDefault();
                    router.push(filteredActions[selectedIndex].path);
                    closeModal();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredActions, selectedIndex, router, closeModal]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: "fixed",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        backdropFilter: "blur(12px)",
                        zIndex: 9999,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        paddingTop: "15vh"
                    }} 
                    onClick={closeModal}
                >
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        style={{
                            width: "90%",
                            maxWidth: "650px",
                            background: "rgba(17, 24, 39, 0.9)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "24px",
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.2)",
                            overflow: "hidden",
                        }} 
                        onClick={e => e.stopPropagation()}
                    >
                        
                        {/* Search Input */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "1.5rem 1.75rem",
                            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                            background: "rgba(255, 255, 255, 0.02)"
                        }}>
                            <Search size={22} color="#a78bfa" style={{ filter: "drop-shadow(0 0 5px rgba(167, 139, 250, 0.5))" }} />
                            <input 
                                autoFocus
                                placeholder="Xizmat yoki sahifa nomi..." 
                                value={query}
                                onChange={e => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                style={{
                                    flex: 1,
                                    background: "transparent",
                                    border: "none",
                                    outline: "none",
                                    color: "var(--text-primary)",
                                    fontSize: "1.2rem",
                                    fontWeight: "500",
                                    marginLeft: "1rem",
                                    fontFamily: "var(--font-sans), sans-serif"
                                }}
                            />
                            <div style={{
                                padding: "0.4rem 0.6rem",
                                background: "rgba(255, 255, 255, 0.05)",
                                borderRadius: "8px",
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                fontWeight: "bold"
                            }}>ESC</div>
                        </div>

                        {/* Results */}
                        <div style={{ maxHeight: "450px", overflowY: "auto", padding: "0.75rem" }}>
                            {filteredActions.length === 0 ? (
                                <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                    Hech narsa topilmadi...
                                </div>
                            ) : (
                                filteredActions.map((action, idx) => (
                                    <motion.div 
                                        key={action.id}
                                        onClick={() => {
                                            router.push(action.path);
                                            closeModal();
                                        }}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1.25rem",
                                            padding: "1rem 1.25rem",
                                            borderRadius: "16px",
                                            cursor: "pointer",
                                            background: idx === selectedIndex ? "rgba(139, 92, 246, 0.1)" : "transparent",
                                            border: idx === selectedIndex ? "1px solid rgba(139, 92, 246, 0.2)" : "1px solid transparent",
                                            transition: "all 0.15s ease",
                                            marginBottom: "4px"
                                        }}
                                    >
                                        <div style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            background: idx === selectedIndex ? "rgba(139, 92, 246, 0.2)" : "rgba(255, 255, 255, 0.03)",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: idx === selectedIndex ? "#a78bfa" : "var(--text-secondary)",
                                            transition: "all 0.2s"
                                        }}>
                                            <action.icon size={22} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: "1rem", fontWeight: "700", color: idx === selectedIndex ? "var(--text-primary)" : "var(--text-secondary)", opacity: idx === selectedIndex ? 1 : 0.8 }}>
                                                {action.title}
                                            </div>
                                            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", opacity: 0.6 }}>
                                                {action.subtitle}
                                            </div>
                                        </div>
                                        {idx === selectedIndex && (
                                            <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
                                                <ArrowRight size={18} color="#a78bfa" />
                                            </motion.div>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: "1rem 1.75rem",
                            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                            background: "rgba(0, 0, 0, 0.2)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.8rem",
                            color: "var(--text-secondary)",
                            fontWeight: "500"
                        }}>
                            <div style={{ display: "flex", gap: "1.5rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", border: "1px solid rgba(255,255,255,0.1)" }}>↵</kbd> Tanlash
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.7rem", border: "1px solid rgba(255,255,255,0.1)" }}>↑↓</kbd> Navigatsiya
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <Command size={14} /> K
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
