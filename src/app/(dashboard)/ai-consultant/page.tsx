"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles, Mic, MicOff, Paperclip, X, File as FileIcon, History, Info, ChevronRight, Zap } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import styles from "./ai.module.css";

type Message = {
    role: "user" | "assistant";
    content: string;
    inlineData?: {
        data: string; // base64 string
        mimeType: string;
    };
    fileName?: string; // faqat UI uchun
    timestamp: Date;
};

export default function AIConsultantPage() {
    const [messages, setMessages] = useState<Message[]>([
        { 
            role: "assistant", 
            content: "Assalomu alaykum! Men sizning **Boshqaruvchi AI** strategik maslahatchingizman. Korxonani boshqarish, soliq hisobotlari yoki biznes strategiyasi bo'yicha qanday savollaringiz bor?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [selectedFile, setSelectedFile] = useState<{ file: File, base64: string, mimeType: string } | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error("Fayl hajmi 20MB dan oshmasligi kerak.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            setSelectedFile({
                file,
                base64,
                mimeType: file.type || "application/octet-stream"
            });
        };
        reader.readAsDataURL(file);
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error("Brauzeringiz ovozli yozishni qo'llab-quvvatlamaydi.");
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = 'uz-UZ';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => prev + (prev.length > 0 ? " " : "") + transcript);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const sendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !selectedFile) || isLoading) return;

        const userMsg: Message = {
            role: "user",
            content: input.trim(),
            timestamp: new Date()
        };

        if (selectedFile) {
            userMsg.inlineData = {
                data: selectedFile.base64,
                mimeType: selectedFile.mimeType
            };
            userMsg.fileName = selectedFile.file.name;
        }

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const chatHistory = [...messages, userMsg].map((m) => {
                const mapped: any = { role: m.role, content: m.content };
                if (m.inlineData) mapped.inlineData = m.inlineData;
                return mapped;
            });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: chatHistory }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Xatolik yuz berdi");

            setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
        } catch (error: any) {
            toast.error("Xabarni yuborishda xatolik yuz berdi");
            setMessages(prev => [...prev, { 
                role: "assistant", 
                content: `Kechirasiz, server bilan aloqada uzilish bo'ldi. Iltimos, bir ozdan so'ng qaytadan urinib ko'ring.`,
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const quickActions = [
        { label: "💰 Moliya Tahlili", prompt: "Korxonamning umumiy moliyaviy holatini qanday baholaysiz?" },
        { label: "📝 Shartnoma Namunasi", prompt: "Yangi xodim uchun namunaviy mehnat shartnomasi yozib bering." },
        { label: "⚖️ Soliq Riski", prompt: "Buxgalteriya va qonunchilik bo'yicha joriy soliq risklarini aniqlang." },
        { label: "🚀 Strategik Reja", prompt: "Kelgusi 3 oy uchun biznesni rivojlantirish strategiyasini taklif qiling." }
    ];

    return (
        <div className={styles.pageContainer}>
            
            {/* Background Effects */}
            <div className="mesh-bg" />

            {/* Header Section */}
            <header className={styles.header}>
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className={styles.headerTitle}>
                        AI Maslahatchi 
                        <span className={styles.sparkleBox}>
                            <Sparkles className={styles.sparkleIcon} />
                        </span>
                    </h1>
                    <div className={styles.headerSubtitle}>
                        <span className={styles.statusDot} />
                        <p className={styles.subtitleText}>Boshqaruvchi AI Strategik Analitika • Online</p>
                    </div>
                </motion.div>

                <div className={styles.headerActions}>
                    <button 
                        onClick={() => setShowHistory(!showHistory)}
                        className={styles.iconButton}
                        title="Tarix"
                    >
                        <History size={20} />
                    </button>
                    <button className={styles.iconButton}>
                        <Info size={20} />
                    </button>
                </div>
            </header>

            <div className={styles.mainArea}>
                
                {/* Main Chat Container */}
                <main className={`glass-card-premium ${styles.chatContainer}`}>
                    
                    {/* Chat Messages */}
                    <div className={styles.messagesList}>
                        <AnimatePresence initial={false}>
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={msg.role === "user" ? styles.messageRowReverse : styles.messageRow}
                                >
                                    <div className={`${styles.avatar} ${msg.role === "user" ? styles.avatarUser : styles.avatarAi}`}>
                                        {msg.role === "user" ? <User size={20} /> : <Zap size={20} className="fill-current" />}
                                    </div>

                                    <div className={`${styles.messageContent} ${msg.role === "user" ? `bubble-user ${styles.messageUser}` : `bubble-ai ${styles.messageAi}`}`}>
                                        {msg.fileName && (
                                            <div className={styles.fileAttachment}>
                                                <div className={styles.fileIconBox}>
                                                    <FileIcon size={16} className={styles.fileIcon} />
                                                </div>
                                                <div className={styles.fileInfo}>
                                                    <span className={styles.fileName}>{msg.fileName}</span>
                                                    <span className={styles.fileLabel}>Hujjat biriktirilgan</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="prose-ai">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                        <div className={`${styles.timestamp} ${msg.role === "user" ? styles.timestampRight : styles.timestampLeft}`}>
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {isLoading && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={styles.messageRow}
                            >
                                <div className={`${styles.avatar} ${styles.avatarAi}`}>
                                    <Zap size={20} className="fill-current" style={{ animation: "pulse 2s infinite" }} />
                                </div>
                                <div className={`bubble-ai ${styles.messageAi} ${styles.messageContent}`} style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "1.25rem" }}>
                                    <div className={styles.loadingDots}>
                                        <span className={styles.dot}></span>
                                        <span className={styles.dot}></span>
                                        <span className={styles.dot}></span>
                                    </div>
                                    <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "rgba(52, 211, 153, 0.8)", marginLeft: "0.5rem" }}>Tahlil qilinmoqda...</span>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} style={{ height: "1rem" }} />
                    </div>

                    {/* Quick Actions Bar */}
                    <div className={styles.quickActionsContainer}>
                        <div className={styles.quickActionsList}>
                            {quickActions.map((action, i) => (
                                <motion.button
                                    key={i}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setInput(action.prompt)}
                                    className={styles.quickActionBtn}
                                >
                                    {action.label}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Premium Input Section */}
                    <div className={styles.inputSection}>
                        <div className={styles.inputWrapper}>
                            {selectedFile && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={styles.selectedFileBar}
                                >
                                    <FileIcon size={16} style={{ color: "#818cf8" }} />
                                    <span className={styles.selectedFileName}>{selectedFile.file.name}</span>
                                    <button onClick={() => setSelectedFile(null)} className={styles.removeFileBtn}>
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}
                            
                            <form onSubmit={sendMessage} className={styles.inputForm}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className={styles.fileInputHidden}
                                    onChange={handleFileChange}
                                    accept="image/*,application/pdf,text/plain,.doc,.docx"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`${styles.actionBtn} ${selectedFile ? "" : ""}`}
                                    style={{ color: selectedFile ? "#818cf8" : "#9ca3af" }}
                                    disabled={isLoading}
                                >
                                    <Paperclip size={22} />
                                </button>

                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Savolingizni yozing..."
                                    className={styles.textInput}
                                    disabled={isLoading}
                                />

                                <div className={styles.rightActions}>
                                    <button
                                        type="button"
                                        onClick={startListening}
                                        className={`${styles.actionBtn} ${isListening ? styles.micBtnActive : ''}`}
                                        style={{ color: isListening ? "" : "#9ca3af" }}
                                        disabled={isLoading}
                                    >
                                        {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                                    </button>

                                    <motion.button
                                        type="submit"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        disabled={isLoading || (!input.trim() && !selectedFile)}
                                        className={styles.sendBtn}
                                    >
                                        <Send size={20} className="fill-current" />
                                        <span className={styles.sendText}>Analiz</span>
                                    </motion.button>
                                </div>
                            </form>
                        </div>
                        <p className={styles.footerDisclaimer}>
                            Boshqaruvchi AI strategik tahlil o'tkazish uchun o'zining shaxsiy sun'iy intellektidan foydalanadi
                        </p>
                    </div>
                </main>

                {/* Desktop History Sidebar (Conditional) */}
                <AnimatePresence>
                    {showHistory && (
                        <motion.aside
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className={`glass-card-premium ${styles.historySidebar}`}
                        >
                            <div className={styles.historyHeader}>
                                <h3 className={styles.historyTitle}>
                                    <History style={{ color: "#818cf8", width: "20px", height: "20px" }} />
                                    Muloqot Tarixi
                                </h3>
                            </div>
                            <div className={styles.historyContent}>
                                <div className={styles.historyItem}>
                                    <p className={styles.historyItemTitle}>Yillik soliq tahlili</p>
                                    <p className={styles.historyItemTime}>Bugun, 10:45</p>
                                </div>
                                <div className={`${styles.historyItem} ${styles.historyItemActive}`}>
                                    <p className={styles.historyItemTitle}>Joriy muloqot</p>
                                    <p className={styles.historyItemTime}>Aktiv</p>
                                </div>
                                <div className={`${styles.historyItem} ${styles.historyItemEmpty}`}>
                                    <p className={styles.historyItemEmptyTitle}>Oldingi tarix mavjud emas</p>
                                </div>
                            </div>
                            <div className={styles.historyFooter}>
                                <button className={styles.clearHistoryBtn}>
                                    Tarixni Tozalash
                                </button>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>
            
            <style jsx global>{`
                /* Hide scrollbar for quick actions but allow scroll */
                .${styles.quickActionsList}::-webkit-scrollbar {
                    display: none;
                }
                .${styles.quickActionsList} {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                /* Thin scrollbar for messages */
                .${styles.messagesList}::-webkit-scrollbar {
                    width: 4px;
                }
                .${styles.messagesList}::-webkit-scrollbar-track {
                    background: transparent;
                }
                .${styles.messagesList}::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 20px;
                }
                .${styles.messagesList}::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
}
