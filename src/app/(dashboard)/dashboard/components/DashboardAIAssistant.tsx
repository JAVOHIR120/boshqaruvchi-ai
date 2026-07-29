"use client";

import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import styles from "./../dashboard.module.css";

interface Props {
    totalIncome: number;
    totalExpense: number;
    employeesCount: number;
    activeContractsCount: number;
}

export default function DashboardAIAssistant({ totalIncome, totalExpense, employeesCount, activeContractsCount }: Props) {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getAnalysis = async () => {
        setIsLoading(true);
        try {
            const prompt = `Korxonamning hozirgi holati: Jami daromad: ${totalIncome} so'm, Jami xarajat: ${totalExpense} so'm, Faol xodimlar: ${employeesCount}, Faol shartnomalar: ${activeContractsCount}. Iltimos, ushbu raqamlarga asosan korxona moliyaviy holati haqida qisqacha, 3-4 gapdan iborat professional tahlil va bitta aniq tavsiya bering.`;

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Xatolik yuz berdi");

            setAnalysis(data.reply);
        } catch (error: any) {
            setAnalysis("Tahlilni olishda xatolik yuz berdi: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const formatText = (text: string) => {
        return text.split('\n').map((line, idx) => {
            if (line.trim().startsWith('- **') || line.trim().startsWith('* **')) {
                const content = line.replace(/^[\-\*]\s\*\*/, '').replace(/\*\*/, ':');
                return <li key={idx}><span dangerouslySetInnerHTML={{ __html: content.replace(/\*(.*?)\*/g, "<strong>$1</strong>") }} /></li>;
            } else if (line.trim().startsWith('**')) {
                return <strong key={idx} style={{ display: "block", marginTop: "1rem" }}>{line.replace(/\*\*/g, '')}</strong>;
            } else if (line.trim().match(/^\d+\./)) {
                return <div key={idx} style={{ marginLeft: "0.5rem" }}><strong>{line.split('.')[0]}.</strong> {line.substring(line.indexOf('.') + 1)}</div>;
            } else if (line.trim() === '') {
                return <br key={idx} />;
            }
            return <span key={idx} style={{ display: "block", marginBottom: "0.5rem" }}>{line}</span>;
        });
    };

    return (
        <div className={styles.aiAssistantCard}>
            <div className={styles.aiAssistantHeader}>
                <h3 className={styles.aiTitle}>
                    <Bot size={24} className={styles.aiTitleIcon} />
                    AI Moliyaviy Tahlilchi
                </h3>
                <button
                    onClick={getAnalysis}
                    disabled={isLoading}
                    className={styles.aiActionBtn}
                >
                    {isLoading ? (
                        <>
                            <svg className={styles.loaderIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            Tahlil qilinmoqda...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Tahlil qilish
                        </>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className={styles.aiLoadingState}>
                    <Sparkles size={32} className={styles.loaderIcon} />
                    <p>Moliyaviy ko'rsatkichlaringiz o'rganilmoqda...</p>
                </div>
            ) : analysis ? (
                <div className={styles.aiChatBox}>
                    <div className={styles.aiChatText}>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                            {formatText(analysis)}
                        </ul>
                    </div>
                </div>
            ) : (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontFamily: "var(--font-sans)", lineHeight: "1.6" }}>
                    Korxonangizning joriy moliyaviy ma'lumotlari bo'yicha sun'iy intellektdan qisqacha ekspert xulosasi va foydali tavsiyalarni oling.
                </p>
            )}
        </div>
    );
}
