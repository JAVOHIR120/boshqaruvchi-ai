"use client";

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    role: 'ai' | 'user';
    text: string;
}

export default function AiTaxConsultant() {
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'ai', text: 'Assalomu alaykum. Men soliq bo\'yicha sun\'iy intellekt maslahatchisiman. Sizga QQS, Foyda solig\'i yoki O\'zbekiston Respublikasi Soliq Kodeksiga (30.12.2019) oid qanday savollar bo\'yicha yordam bera olaman?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || isLoading) return;

        const newMessages = [...messages, { role: 'user', text: query } as Message];
        setMessages(newMessages);
        setQuery('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/tax-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: newMessages })
            });

            if (!res.ok) throw new Error("Tarmoq xatosi");

            const data = await res.json();
            setMessages([...newMessages, { role: 'ai', text: data.reply }]);
        } catch (error) {
            console.error("Chat xatosi:", error);
            setMessages([...newMessages, { role: 'ai', text: "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            background: 'var(--surface-color)',
            borderRadius: '20px', border: '1px solid var(--border-color)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)', overflow: 'hidden',
            backdropFilter: 'blur(16px)', position: 'relative'
        }}>
            {/* Ambient Background Glow */}
            <div style={{
                position: 'absolute', top: '-10%', left: '-10%', width: '150px', height: '150px',
                background: 'rgba(99, 102, 241, 0.15)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', right: '-10%', width: '150px', height: '150px',
                background: 'rgba(59, 130, 246, 0.15)', filter: 'blur(80px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0
            }} />

            {/* HEADER */}
            <div style={{
                padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)', zIndex: 1
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '38px', height: '38px', borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(59,130,246,0.2))',
                        border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Scale size={20} color="#818cf8" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            Soliq AI Maslahatchisi
                            <Sparkles size={14} color="#f59e0b" />
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, marginTop: '2px' }}>
                            O'zR Soliq Kodeksi (30.12.2019) asosida ishlaydi
                        </p>
                    </div>
                </div>
            </div>

            {/* MESSAGES AREA */}
            <div className="custom-scrollbar" style={{
                flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', zIndex: 1
            }}>
                <AnimatePresence initial={false}>
                    {messages.map((msg, idx) => {
                        const isAi = msg.role === 'ai';
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: isAi ? 'row' : 'row-reverse',
                                    gap: '0.85rem',
                                    alignItems: 'flex-start'
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: isAi ? 'linear-gradient(135deg, #4f46e5, #3b82f6)' : 'var(--surface-color)',
                                    border: `1px solid ${isAi ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                                    boxShadow: isAi ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                                }}>
                                    {isAi ? <Bot size={18} color="#fff" /> : <User size={18} color="var(--text-secondary)" />}
                                </div>

                                {/* Bubble */}
                                <div style={{
                                    maxWidth: '85%', padding: '0.85rem 1.15rem',
                                    borderRadius: isAi ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                    background: isAi ? 'var(--surface-color)' : 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.25))',
                                    border: `1px solid ${isAi ? 'var(--border-color)' : 'rgba(99,102,241,0.3)'}`,
                                    color: 'var(--text-primary)',
                                    fontSize: '0.92rem', lineHeight: 1.6,
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                }}>
                                    {msg.text.split('\\n').map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            {i !== msg.text.split('\\n').length - 1 && <br />}
                                        </span>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                    
                    {/* Loading Indicator */}
                    {isLoading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            style={{ display: 'flex', flexDirection: 'row', gap: '0.85rem', alignItems: 'center' }}
                        >
                            <div style={{
                                width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
                                boxShadow: '0 0 15px rgba(99,102,241,0.4)'
                            }}>
                                <Bot size={18} color="#fff" />
                            </div>
                            <div style={{
                                padding: '1rem 1.25rem', borderRadius: '4px 16px 16px 16px',
                                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex', gap: '4px', alignItems: 'center'
                            }}>
                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} style={{ width: 6, height: 6, borderRadius: '50%', background: '#818cf8' }} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT AREA */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-color)', borderTop: '1px solid var(--border-color)', zIndex: 1 }}>
                <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Soliq haqida savol bering..."
                        disabled={isLoading}
                        style={{
                            width: '100%', padding: '1rem 3.5rem 1rem 1.25rem',
                            background: 'var(--background-color)', border: '1px solid var(--border-color)',
                            borderRadius: '99px', color: 'var(--text-primary)', fontSize: '0.95rem',
                            outline: 'none', transition: 'all 0.2s',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'rgba(99,102,241,0.5)'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !query.trim()}
                        style={{
                            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                            width: '40px', height: '40px', borderRadius: '50%',
                            background: (!isLoading && query.trim()) ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.1)',
                            border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: (!isLoading && query.trim()) ? '#fff' : 'rgba(255,255,255,0.3)',
                            cursor: (!isLoading && query.trim()) ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            boxShadow: (!isLoading && query.trim()) ? '0 4px 12px rgba(99,102,241,0.4)' : 'none'
                        }}
                    >
                        <Send size={18} style={{ transform: 'translateX(-1px)' }} />
                    </button>
                </form>
            </div>
        </div>
    );
}
