// src/components/ui/Modal.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(4px)" }}>
            <div
                ref={modalRef}
                style={{ backgroundColor: "var(--surface-color)", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "500px", padding: "1.5rem", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-color)", maxHeight: "90vh", overflowY: "auto", position: "relative" }}
                className="animate-fade-in"
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-primary)" }}>{title}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
                        <X size={24} />
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
