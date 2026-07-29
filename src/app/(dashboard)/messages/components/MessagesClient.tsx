"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, MessageCircle, MoreVertical, Smile, Check, CheckCheck, Mic, X, Play, Pause, Trash2, FileText, Image, Download, Paperclip } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// === STICKER DATA ===
const STICKER_CATEGORIES = [
    { name: "Salom", emojis: ["👋", "🤝", "😊", "🙏", "✌️", "🫡", "🎉", "💪"] },
    { name: "Ish", emojis: ["💼", "📊", "📈", "✅", "⏰", "📝", "🎯", "🏆"] },
    { name: "Holat", emojis: ["👍", "👎", "❤️", "🔥", "⭐", "💯", "🤔", "😅"] },
    { name: "Javob", emojis: ["✅", "❌", "⚠️", "🔔", "📌", "🚀", "💡", "🎊"] },
    { name: "Kayfiyat", emojis: ["😀", "😂", "🥳", "😎", "🤩", "😤", "😢", "🫠"] },
];

interface MessagesClientProps {
    initialMessages: any[];
    users: any[];
    currentUserId: string;
    mode?: "boss" | "employee";
}

export default function MessagesClient({ initialMessages, users, currentUserId, mode = "boss" }: MessagesClientProps) {
    const [messages, setMessages] = useState<any[]>(initialMessages || []);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sticker state
    const [showStickers, setShowStickers] = useState(false);
    const [activeCategory, setActiveCategory] = useState(0);

    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Audio playback
    const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Menu state
    const [showMenu, setShowMenu] = useState(false);

    // File upload ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Group messages by conversation
    const groups = new Map<string, any[]>();
    (messages || []).forEach((msg: any) => {
        const otherId = msg.senderId === currentUserId ? msg.recipientId : msg.senderId;
        if (!otherId) return;
        if (!groups.has(otherId)) groups.set(otherId, []);
        groups.get(otherId)!.push(msg);
    });

    const conversations = Array.from(groups.entries()).map(([userId, msgs]) => {
        const user = (users || []).find((u: any) => u.id === userId) || { name: "Xodim", role: "Xodim" };
        let displayName = user.name || "Noma'lum";
        
        if (mode === "employee" && ["BOSHLIQ", "OWNER", "SUPERADMIN"].includes(user.role)) {
            displayName = "Boshliq";
        } else if (mode === "boss" && user.employeeProfile?.position) {
            displayName = `${user.employeeProfile.position} - ${user.name}`;
        } else if (mode === "boss" && user.role === "XODIM") {
            displayName = `Xodim - ${user.name}`;
        }

        return {
            userId,
            name: displayName,
            role: user.role || "Xodim",
            messages: msgs,
            latestMessage: msgs[msgs.length - 1],
            unreadCount: msgs.filter((m: any) => m.senderId !== currentUserId && m.recipientId === currentUserId && !m.isRead).length
                + msgs.filter((m: any) => m.senderId !== currentUserId && m.recipientId === null && !m.isRead).length
        };
    }).filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        const dateA = a.latestMessage?.createdAt ? new Date(a.latestMessage.createdAt).getTime() : 0;
        const dateB = b.latestMessage?.createdAt ? new Date(b.latestMessage.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    const activeConversation = selectedUserId
        ? conversations.find(c => c.userId === selectedUserId) || null
        : null;

    useEffect(() => {
        if (!activeConversation || activeConversation.unreadCount <= 0) return;
        let isMounted = true;
        import("@/actions/messages").then(mod => {
            mod.markMessagesAsRead(activeConversation.userId).then((res: any) => {
                if (res.success && isMounted) {
                    setMessages(prev =>
                        prev.map(m =>
                            m.senderId === activeConversation.userId &&
                            (m.recipientId === currentUserId || m.recipientId === null) &&
                            !m.isRead
                                ? { ...m, isRead: true }
                                : m
                        )
                    );
                }
            });
        });
        return () => { isMounted = false; };
    }, [activeConversation?.userId, activeConversation?.unreadCount, currentUserId]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [selectedUserId, messages.length]);

    // === VOICE RECORDING ===
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } catch { /* silently fail */ }
    }, []);

    const stopRecording = useCallback(async (): Promise<string | null> => {
        return new Promise((resolve) => {
            const mr = mediaRecorderRef.current;
            if (!mr || mr.state === "inactive") { resolve(null); return; }
            mr.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
                mr.stream.getTracks().forEach(t => t.stop());
            };
            mr.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
        });
    }, []);

    const cancelRecording = useCallback(() => {
        const mr = mediaRecorderRef.current;
        if (mr && mr.state !== "inactive") { mr.stop(); mr.stream.getTracks().forEach(t => t.stop()); }
        setIsRecording(false); setRecordingDuration(0); audioChunksRef.current = [];
        if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    }, []);

    // === SEND HELPERS ===
    const sendAction = mode === "boss"
        ? async (fd: FormData) => { const { sendMessageToEmployee } = await import("@/actions/boss"); return sendMessageToEmployee(fd); }
        : async (fd: FormData) => { const { sendMessage } = await import("@/actions/employee"); return sendMessage(currentUserId, fd); };

    const sendVoiceMessage = useCallback(async () => {
        if (!selectedUserId || isSending) return;
        setIsSending(true);
        try {
            const audioB64 = await stopRecording();
            if (!audioB64) { setIsSending(false); return; }
            const fd = new FormData();
            fd.append("content", "🎤 Ovozli xabar");
            if (mode === "boss") fd.append("recipientId", selectedUserId);
            fd.append("type", "VOICE");
            fd.append("audioData", audioB64);
            const res = await sendAction(fd);
            if (res.success) {
                setMessages(prev => [...prev, { id: `t-${Date.now()}`, senderId: currentUserId, recipientId: selectedUserId, content: "🎤 Ovozli xabar", type: "VOICE", audioData: audioB64, createdAt: new Date().toISOString(), isRead: false }]);
            }
        } catch { /* */ } finally { setIsSending(false); setRecordingDuration(0); }
    }, [selectedUserId, isSending, currentUserId, stopRecording, sendAction, mode]);

    const sendSticker = useCallback(async (emoji: string) => {
        if (!selectedUserId || isSending) return;
        setIsSending(true); setShowStickers(false);
        try {
            const fd = new FormData();
            fd.append("content", emoji);
            if (mode === "boss") fd.append("recipientId", selectedUserId);
            fd.append("type", "STICKER");
            const res = await sendAction(fd);
            if (res.success) {
                setMessages(prev => [...prev, { id: `t-${Date.now()}`, senderId: currentUserId, recipientId: selectedUserId, content: emoji, type: "STICKER", createdAt: new Date().toISOString(), isRead: false }]);
            }
        } catch { /* */ } finally { setIsSending(false); }
    }, [selectedUserId, isSending, currentUserId, sendAction, mode]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = replyContent.trim();
        if (!content || !selectedUserId || isSending) return;
        setIsSending(true);
        try {
            const fd = new FormData();
            fd.append("content", content);
            if (mode === "boss") fd.append("recipientId", selectedUserId);
            fd.append("type", "TEXT");
            const res = await sendAction(fd);
            if (res.success) {
                setMessages(prev => [...prev, { id: `t-${Date.now()}`, senderId: currentUserId, recipientId: selectedUserId, content, type: "TEXT", createdAt: new Date().toISOString(), isRead: false }]);
                setReplyContent("");
            }
        } catch { /* */ } finally { setIsSending(false); }
    };

    // === FILE UPLOAD ===
    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedUserId || isSending) return;
        if (file.size > 5 * 1024 * 1024) { alert("Fayl hajmi 5MB dan oshmasligi kerak!"); return; }
        setIsSending(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const fd = new FormData();
                fd.append("content", `📎 ${file.name}`);
                if (mode === "boss") fd.append("recipientId", selectedUserId);
                fd.append("type", "FILE");
                fd.append("fileData", base64);
                fd.append("fileName", file.name);
                fd.append("fileType", file.type);
                const res = await sendAction(fd);
                if (res.success) {
                    setMessages(prev => [...prev, { id: `t-${Date.now()}`, senderId: currentUserId, recipientId: selectedUserId, content: `📎 ${file.name}`, type: "FILE", fileData: base64, fileName: file.name, fileType: file.type, createdAt: new Date().toISOString(), isRead: false }]);
                }
                setIsSending(false);
            };
            reader.readAsDataURL(file);
        } catch { setIsSending(false); }
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [selectedUserId, isSending, currentUserId, sendAction, mode]);

    // === CLEAR CHAT ===
    const handleClearChat = useCallback(async () => {
        if (!selectedUserId) return;
        if (!confirm("Barcha xabarlar butunlay o'chiriladi. Davom ettirilsinmi?")) return;
        try {
            const { clearChat } = await import("@/actions/messages");
            const res = await clearChat(selectedUserId);
            if (res.success) {
                setMessages(prev => prev.filter(m => {
                    const isConv = (m.senderId === currentUserId && m.recipientId === selectedUserId) ||
                        (m.senderId === selectedUserId && (m.recipientId === currentUserId || m.recipientId === null));
                    return !isConv;
                }));
                setShowMenu(false);
            }
        } catch { /* */ }
    }, [selectedUserId, currentUserId]);

    // === AUDIO PLAYBACK ===
    const toggleAudio = (msgId: string, audioData: string) => {
        if (playingAudioId === msgId) { audioRef.current?.pause(); setPlayingAudioId(null); return; }
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(audioData);
        audioRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
        setPlayingAudioId(msgId);
    };

    const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, "0")}`;

    const getPreviewText = (msg: any) => {
        if (!msg) return "Hali xabar yo'q";
        if (msg.type === "VOICE") return "🎤 Ovozli xabar";
        if (msg.type === "STICKER") return msg.content;
        if (msg.type === "FILE") return `📎 ${msg.fileName || "Fayl"}`;
        return msg.content;
    };

    // === FILE DOWNLOAD ===
    const downloadFile = (fileData: string, fileName: string) => {
        const a = document.createElement("a");
        a.href = fileData;
        a.download = fileName;
        a.click();
    };

    // Date grouping helper
    const getDateLabel = (dateStr: string) => {
        const d = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return "Bugun";
        if (d.toDateString() === yesterday.toDateString()) return "Kecha";
        return d.toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
    };

    return (
        <div style={{
            display: "flex",
            height: "calc(100vh - 200px)",
            borderRadius: "24px",
            overflow: "hidden",
            backgroundColor: "var(--surface-color)",
            backdropFilter: "blur(20px)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
            position: "relative"
        }}>
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleFileUpload} />

            {/* Sidebar */}
            <div style={{
                width: "350px", borderRight: "1px solid var(--border-color)",
                display: "flex", flexDirection: "column", zIndex: 10, background: "var(--surface-color)"
            }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem", letterSpacing: "-0.02em" }}>Xabarlar</h2>
                    <div style={{ position: "relative" }}>
                        <Search size={18} style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input type="text" placeholder="Qidiruv..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: "100%", padding: "0.8rem 1rem 0.8rem 3rem", borderRadius: "16px", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)", fontSize: "0.9rem", outline: "none" }} />
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem" }}>
                    <AnimatePresence mode="popLayout">
                        {conversations.length === 0 ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "4rem 1rem", color: "rgba(255, 255, 255, 0.3)" }}>
                                <MessageCircle size={48} style={{ margin: "0 auto 1rem" }} />
                                <p>Xabarlar topilmadi</p>
                            </motion.div>
                        ) : (
                            conversations.map(conv => (
                                <motion.div key={conv.userId} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                    whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    onClick={() => { setSelectedUserId(conv.userId); setShowMenu(false); setShowStickers(false); }}
                                    style={{
                                        padding: "1rem", borderRadius: "16px", cursor: "pointer", marginBottom: "0.5rem",
                                        display: "flex", alignItems: "center", gap: "1rem",
                                        backgroundColor: selectedUserId === conv.userId ? "rgba(99, 102, 241, 0.15)" : "transparent",
                                        border: selectedUserId === conv.userId ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid transparent",
                                    }}>
                                    <div style={{ width: 48, height: 48, minWidth: 48, borderRadius: "14px", background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.1rem", boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)", position: "relative" }}>
                                        {(conv.name || "U").charAt(0).toUpperCase()}
                                        {conv.unreadCount > 0 && (
                                            <div style={{ position: "absolute", top: -4, right: -4, width: 20, height: 20, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color: "#fff", boxShadow: "0 0 10px rgba(239, 68, 68, 0.4)", border: "2px solid rgba(15, 23, 42, 0.8)" }}>
                                                {conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{conv.name}</h4>
                                            <span style={{ fontSize: "0.7rem", color: "rgba(255, 255, 255, 0.4)" }}>
                                                {conv.latestMessage?.createdAt ? new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: "0.85rem", color: conv.unreadCount > 0 ? "#fff" : "rgba(255, 255, 255, 0.5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: conv.unreadCount > 0 ? 600 : 400, marginTop: "0.2rem" }}>
                                            {conv.latestMessage?.senderId === currentUserId ? "Siz: " : ""}
                                            {getPreviewText(conv.latestMessage)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Chat Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255, 255, 255, 0.01)" }}>
                {!activeConversation ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255, 255, 255, 0.2)", padding: "2rem", textAlign: "center" }}>
                        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                            <MessageCircle size={80} style={{ opacity: 0.1, marginBottom: "2rem" }} />
                        </motion.div>
                        <h3 style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgba(255, 255, 255, 0.8)", marginBottom: "0.5rem" }}>Xush kelibsiz!</h3>
                        <p style={{ fontSize: "1rem", maxWidth: 320 }}>Muloqotni boshlash uchun chap tomondan foydalanuvchini tanlang.</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div style={{ padding: "1rem 2rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "var(--surface-color)", backdropFilter: "blur(20px)", boxShadow: "0 4px 20px -10px rgba(0,0,0,0.15)", zIndex: 10, position: "relative" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{ width: 44, height: 44, borderRadius: "14px", background: "linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "1.15rem", boxShadow: "0 4px 15px rgba(236, 72, 153, 0.3)" }}>
                                    {(activeConversation.name || "U").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{activeConversation.name}</h3>
                                    <div style={{ fontSize: "0.75rem", color: "#34d399", display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.15rem" }}>
                                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#34d399", boxShadow: "0 0 8px #34d399" }} />
                                        Hozir tarmoqda
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "0.5rem", position: "relative" }}>
                                <button onClick={() => setShowMenu(!showMenu)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255, 255, 255, 0.7)", cursor: "pointer", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <MoreVertical size={16} />
                                </button>
                                {/* Dropdown Menu */}
                                <AnimatePresence>
                                    {showMenu && (
                                        <motion.div initial={{ opacity: 0, scale: 0.9, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                            style={{ position: "absolute", top: 44, right: 0, background: "var(--background-color)", backdropFilter: "blur(20px)", borderRadius: "14px", border: "1px solid var(--border-color)", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", zIndex: 100, minWidth: 200, overflow: "hidden" }}>
                                            <button onClick={handleClearChat} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.85rem 1.25rem", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.9rem", fontWeight: 500, textAlign: "left", transition: "background 0.2s" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "none"}>
                                                <Trash2 size={16} /> Chatni tozalash
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "0.5rem", background: "radial-gradient(circle at center, rgba(99, 102, 241, 0.03) 0%, transparent 70%)" }}
                            onClick={() => { if (showMenu) setShowMenu(false); }}>
                            {activeConversation.messages.map((msg: any, i: number) => {
                                const isMe = msg.senderId === currentUserId;
                                const msgType = msg.type || "TEXT";
                                const prevMsg = activeConversation.messages[i - 1];
                                const showDate = !prevMsg || getDateLabel(msg.createdAt) !== getDateLabel(prevMsg.createdAt);

                                return (
                                    <div key={msg.id || i}>
                                        {/* Date Separator */}
                                        {showDate && (
                                            <div style={{ textAlign: "center", margin: "1rem 0" }}>
                                                <span style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)", padding: "0.3rem 1rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 600 }}>
                                                    {getDateLabel(msg.createdAt)}
                                                </span>
                                            </div>
                                        )}

                                        {/* STICKER */}
                                        {msgType === "STICKER" ? (
                                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                                <div style={{ textAlign: isMe ? "right" : "left" }}>
                                                    <div style={{ fontSize: "3.5rem", lineHeight: 1.1, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))" }}>{msg.content}</div>
                                                    <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginTop: "0.2rem", display: "flex", alignItems: "center", justifyContent: isMe ? "flex-end" : "flex-start", gap: "0.3rem" }}>
                                                        {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                                        {isMe && (msg.isRead ? <CheckCheck size={12} color="#34d399" /> : <Check size={12} color="rgba(255,255,255,0.5)" />)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : msgType === "VOICE" && msg.audioData ? (
                                            /* VOICE */
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                                <div onClick={() => toggleAudio(msg.id, msg.audioData)} style={{
                                                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.7rem 1rem", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                    background: isMe ? "linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))" : "rgba(255, 255, 255, 0.08)",
                                                    cursor: "pointer", border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.05)", minWidth: 180, maxWidth: "65%",
                                                    boxShadow: isMe ? "0 4px 12px rgba(99,102,241,0.3)" : "0 2px 8px rgba(0,0,0,0.1)"
                                                }}>
                                                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: isMe ? "rgba(255,255,255,0.2)" : "rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                        {playingAudioId === msg.id ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 2, height: 20 }}>
                                                            {Array.from({ length: 18 }).map((_, j) => (<div key={j} style={{ width: 2.5, borderRadius: 2, height: `${Math.max(3, Math.sin(j * 0.7) * 10 + Math.random() * 6)}px`, background: playingAudioId === msg.id ? (isMe ? "rgba(255,255,255,0.9)" : "#6366f1") : (isMe ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.25)") }} />))}
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                                                            <span style={{ fontSize: "0.65rem", color: isMe ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)" }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                                            {isMe && (msg.isRead ? <CheckCheck size={11} color={isMe ? "#fff" : "#34d399"} /> : <Check size={11} color="rgba(255,255,255,0.5)" />)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : msgType === "FILE" ? (
                                            /* FILE */
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                                <div style={{
                                                    maxWidth: "65%", padding: "0.75rem 1rem", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                    backgroundColor: isMe ? "rgba(99, 102, 241, 0.9)" : "rgba(255, 255, 255, 0.08)", color: "#fff",
                                                    boxShadow: isMe ? "0 4px 12px rgba(99,102,241,0.3)" : "0 2px 8px rgba(0,0,0,0.1)",
                                                    border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                                                }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: "12px", background: isMe ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            {msg.fileType?.startsWith("image/") ? <Image size={20} color={isMe ? "#fff" : "#6366f1"} /> : <FileText size={20} color={isMe ? "#fff" : "#6366f1"} />}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: "0.9rem", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{msg.fileName || "Fayl"}</div>
                                                            <div style={{ fontSize: "0.7rem", color: isMe ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)", marginTop: 2 }}>{msg.fileType || ""}</div>
                                                        </div>
                                                        {msg.fileData && (
                                                            <button onClick={(e) => { e.stopPropagation(); downloadFile(msg.fileData, msg.fileName || "file"); }}
                                                                style={{ background: isMe ? "rgba(255,255,255,0.15)" : "rgba(99,102,241,0.2)", border: "none", borderRadius: "10px", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", flexShrink: 0 }}>
                                                                <Download size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {msg.fileType?.startsWith("image/") && msg.fileData && (
                                                        <img src={msg.fileData} alt={msg.fileName} style={{ marginTop: "0.75rem", borderRadius: "10px", maxWidth: "100%", maxHeight: 200, objectFit: "cover" }} />
                                                    )}
                                                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.3rem", marginTop: "0.4rem", opacity: 0.7 }}>
                                                        <span style={{ fontSize: "0.65rem" }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                                        {isMe && (msg.isRead ? <CheckCheck size={11} color="#fff" /> : <Check size={11} />)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ) : (
                                            /* TEXT */
                                            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                                                <div style={{
                                                    maxWidth: "70%", padding: "0.75rem 1.1rem", borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                                    backgroundColor: isMe ? "rgba(99, 102, 241, 0.9)" : "rgba(255, 255, 255, 0.08)", color: "#fff",
                                                    boxShadow: isMe ? "0 3px 12px rgba(99,102,241,0.3)" : "0 2px 8px rgba(0,0,0,0.08)",
                                                    border: isMe ? "none" : "1px solid rgba(255, 255, 255, 0.05)"
                                                }}>
                                                    <div style={{ fontSize: "0.93rem", lineHeight: "1.55", wordBreak: "break-word" }}>{msg.content}</div>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.3rem", marginTop: "0.35rem", opacity: 0.65 }}>
                                                        <span style={{ fontSize: "0.65rem", fontWeight: 500 }}>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                                                        {isMe && (msg.isRead ? <CheckCheck size={12} color="#fff" /> : <Check size={12} />)}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Sticker Picker */}
                        <AnimatePresence>
                            {showStickers && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                    style={{ background: "var(--surface-color)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border-color)", padding: "1rem", maxHeight: 260 }}>
                                    <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                                        {STICKER_CATEGORIES.map((cat, idx) => (
                                            <button key={cat.name} onClick={() => setActiveCategory(idx)}
                                                style={{ padding: "0.35rem 0.9rem", borderRadius: "10px", border: "1px solid", borderColor: activeCategory === idx ? "rgba(99, 102, 241, 0.5)" : "rgba(255,255,255,0.1)", background: activeCategory === idx ? "rgba(99, 102, 241, 0.2)" : "rgba(255,255,255,0.03)", color: activeCategory === idx ? "#a5b4fc" : "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "0.4rem" }}>
                                        {STICKER_CATEGORIES[activeCategory].emojis.map((emoji, idx) => (
                                            <motion.button key={idx} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.9 }} onClick={() => sendSticker(emoji)}
                                                style={{ fontSize: "1.8rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "10px", padding: "0.4rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                {emoji}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Area */}
                        <div style={{ padding: "1rem 2rem", background: "var(--surface-color)", borderTop: "1px solid var(--border-color)" }}>
                            {isRecording ? (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "16px" }}>
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 12px rgba(239, 68, 68, 0.6)" }} />
                                    <span style={{ color: "#fca5a5", fontSize: "0.9rem", fontWeight: 600, flex: 1 }}>Yozib olinmoqda... {formatDuration(recordingDuration)}</span>
                                    <button onClick={cancelRecording} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fca5a5" }}><X size={16} /></button>
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={sendVoiceMessage} style={{ background: "#6366f1", border: "none", borderRadius: "12px", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", boxShadow: "0 4px 10px rgba(99,102,241,0.3)" }}><Send size={16} /></motion.button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSend} style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "0.2rem 0.5rem 0.2rem 0.75rem" }}>
                                        <motion.button type="button" whileHover={{ scale: 1.1 }} onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0.2rem", display: "flex" }}><Paperclip size={20} /></motion.button>
                                        <input type="text" value={replyContent} onChange={e => setReplyContent(e.target.value)} placeholder="Xabar yozing..."
                                            style={{ flex: 1, padding: "0.7rem 0", background: "none", border: "none", color: "var(--text-primary)", fontSize: "0.95rem", outline: "none" }} />
                                        <motion.button type="button" whileHover={{ scale: 1.1 }} onClick={() => setShowStickers(!showStickers)}
                                            style={{ background: showStickers ? "rgba(99,102,241,0.2)" : "none", border: "none", color: showStickers ? "#a5b4fc" : "rgba(255,255,255,0.4)", cursor: "pointer", padding: "0.2rem", borderRadius: "6px", display: "flex" }}><Smile size={20} /></motion.button>
                                        {replyContent.trim() ? (
                                            <motion.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} disabled={isSending}
                                                style={{ width: 38, height: 38, minWidth: 38, borderRadius: "12px", backgroundColor: "#6366f1", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", boxShadow: "0 4px 10px rgba(99,102,241,0.3)" }}><Send size={16} /></motion.button>
                                        ) : (
                                            <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={startRecording}
                                                style={{ width: 38, height: 38, minWidth: 38, borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #ec4899)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", cursor: "pointer", boxShadow: "0 4px 10px rgba(236,72,153,0.25)" }}><Mic size={16} /></motion.button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
