"use client";

import { useState } from "react";
import { sendMessageToEmployee } from "@/actions/boss";

interface BossMessageFormProps {
    employeeUserId: string;
    employeeName: string;
}

export default function BossMessageForm({ employeeUserId, employeeName }: BossMessageFormProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);

        const formData = new FormData();
        formData.append("content", content);
        formData.append("recipientId", employeeUserId);

        const res = await sendMessageToEmployee(formData);

        setLoading(false);
        if (res.success) {
            setSuccess(true);
            setContent("");
            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
            }, 2000);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    marginTop: "0.5rem",
                    padding: "0.25rem 0.5rem",
                    fontSize: "0.8rem",
                    backgroundColor: "transparent",
                    color: "var(--primary-color)",
                    border: "1px solid var(--primary-color)",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    display: "inline-block"
                }}
            >
                Javob yozish
            </button>
        );
    }

    return (
        <form onSubmit={handleSubmit} style={{ marginTop: "0.75rem", padding: "1rem", backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", width: "100%" }}>
            <div style={{ fontSize: "0.85rem", marginBottom: "0.75rem", color: "var(--text-secondary)", fontFamily: "var(--font-sans), sans-serif" }}>
                Javob yozish: <strong style={{ color: "var(--primary-color)" }}>{employeeName}</strong>
            </div>
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                placeholder="Xabaringizni yozing..."
                style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--background-color)",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    fontFamily: "var(--font-sans), sans-serif",
                    marginBottom: "0.5rem",
                    resize: "vertical",
                    minHeight: "60px",
                    outline: "none"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary-color)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border-color)"}
            />
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", background: "none", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", color: "var(--text-secondary)", cursor: "pointer" }}
                >
                    Bekor qilish
                </button>
                <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem", backgroundColor: "var(--primary-color)", border: "none", borderRadius: "var(--radius-sm)", color: "white", cursor: "pointer", opacity: (loading || !content.trim()) ? 0.6 : 1 }}
                >
                    {loading ? "Yuborilmoqda..." : "Yuborish"}
                </button>
            </div>
            {success && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "var(--success-color)" }}>
                    Xabar yuborildi!
                </div>
            )}
        </form>
    );
}
