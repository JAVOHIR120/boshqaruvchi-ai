"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardCheck } from "lucide-react";
import toast from "react-hot-toast";
import { addInventoryAudit } from "@/actions";

type Props = {
    item: {
        id: string;
        name: string;
        quantity: number;
    };
    isOpen: boolean;
    onClose: () => void;
};

export default function AuditModal({ item, isOpen, onClose }: Props) {
    const [actualQuantity, setActualQuantity] = useState<number>(item.quantity);
    const [auditedBy, setAuditedBy] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const difference = actualQuantity - item.quantity;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("inventoryItemId", item.id);
            formData.append("actualQuantity", String(actualQuantity));
            formData.append("auditedBy", auditedBy);
            formData.append("notes", notes);

            const res = await addInventoryAudit(formData);

            if (res.success) {
                toast.success("Dalolatnoma muvaffaqiyatli saqlandi");
                onClose();
            } else {
                toast.error(res.error || "Xatolik yuz berdi");
            }
        } catch (error) {
            console.error(error);
            toast.error("Ulanish xatosi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ backgroundColor: "var(--background-color)", padding: "2rem", borderRadius: "1.25rem", width: "100%", maxWidth: "500px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.1)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ClipboardCheck size={24} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>Inventarizatsiya Aktdalolatnomasi</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>Mulk: <strong>{item.name}</strong></p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "0.8rem", border: "1px solid var(--border-color)" }}>
                        <div>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>Buxgalteriya qoldig'i</span>
                            <strong style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>{item.quantity} ta</strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "block" }}>Kutilayotgan farq</span>
                            {difference === 0 ? (
                                <strong style={{ fontSize: "1.2rem", color: "var(--success-color)" }}>Muvofiq</strong>
                            ) : difference < 0 ? (
                                <strong style={{ fontSize: "1.2rem", color: "var(--error-color)" }}>Kamomad: {Math.abs(difference)}</strong>
                            ) : (
                                <strong style={{ fontSize: "1.2rem", color: "var(--primary-color)" }}>Ortiqcha: {difference}</strong>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Haqiqiy qoldiq</label>
                        <input required type="number" min="0" value={actualQuantity} onChange={(e) => setActualQuantity(Number(e.target.value))} style={{ width: "100%", padding: "0.85rem", borderRadius: "0.8rem", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", fontSize: "1rem", fontWeight: "bold", color: "var(--text-primary)" }} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Tekshiruvchi ismi</label>
                        <input required type="text" value={auditedBy} onChange={(e) => setAuditedBy(e.target.value)} placeholder="F.I.Sh" style={{ width: "100%", padding: "0.75rem", borderRadius: "0.8rem", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }} />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.95rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "0.5rem" }}>Izoh</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: "0.75rem", borderRadius: "0.8rem", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)", resize: "none" }} />
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                        <button type="button" onClick={onClose} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", border: "1px solid var(--border-color)", background: "transparent", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer" }}>Bekor qilish</button>
                        <button type="submit" disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", background: "var(--primary-color)", color: "white", fontWeight: "600", border: "none", cursor: "pointer", opacity: isSubmitting ? 0.7 : 1 }}>
                            {isSubmitting ? "Saqlanmoqda..." : "Tasdiqlash"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
        , document.body);
}
