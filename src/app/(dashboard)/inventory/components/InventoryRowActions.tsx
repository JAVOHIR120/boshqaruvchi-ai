"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Edit2, Trash2, ClipboardCheck, TrendingUp } from "lucide-react";
import { updateInventoryItem, deleteInventoryItem, addModernization } from "@/actions";
import AuditModal from "./AuditModal";

type Props = {
    item: {
        id: string;
        name: string;
        category: string;
        quantity: number;
        price: number;
        location: string;
        status: string;
        amortizationRate: number;
        amortizationGroup: string | null;
        modernizationCosts: number;
    }
};

export default function InventoryRowActions({ item }: Props) {
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isModernizeOpen, setIsModernizeOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modernizeAmount, setModernizeAmount] = useState<string>("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        await updateInventoryItem(item.id, formData);
        setIsSubmitting(false);
        setIsEditOpen(false);
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        await deleteInventoryItem(item.id);
        setIsSubmitting(false);
        setIsDeleteOpen(false);
    };

    const handleModernize = async () => {
        const amount = parseFloat(modernizeAmount);
        if (isNaN(amount) || amount <= 0) return;
        setIsSubmitting(true);
        await addModernization(item.id, amount);
        setIsSubmitting(false);
        setIsModernizeOpen(false);
        setModernizeAmount("");
    };

    return (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
                onClick={() => setIsAuditOpen(true)}
                style={{
                    padding: "0.5rem", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", backgroundColor: "rgba(16, 185, 129, 0.1)",
                    color: "var(--success-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Tekshirish (Inventarizatsiya)"
            >
                <ClipboardCheck size={16} />
            </button>
            <button
                onClick={() => setIsModernizeOpen(true)}
                style={{
                    padding: "0.5rem", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", backgroundColor: "rgba(59, 130, 246, 0.1)",
                    color: "var(--primary-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Modernizatsiya (Kapital ta'mir)"
            >
                <TrendingUp size={16} />
            </button>
            <button
                onClick={() => setIsEditOpen(true)}
                style={{
                    padding: "0.5rem", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", backgroundColor: "var(--surface-color)",
                    color: "var(--text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="Tahrirlash"
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={() => setIsDeleteOpen(true)}
                style={{
                    padding: "0.5rem", border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)", backgroundColor: "rgba(239, 68, 68, 0.1)",
                    color: "var(--error-color)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center"
                }}
                title="O'chirish"
            >
                <Trash2 size={16} />
            </button>

            {/* Audit Modal */}
            <AuditModal
                isOpen={isAuditOpen}
                onClose={() => setIsAuditOpen(false)}
                item={{ id: item.id, name: item.name, quantity: item.quantity }}
            />

            {/* Edit Modal */}
            {isEditOpen && mounted && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Mulkni Tahrirlash</h3>

                        <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Mulk nomi</label>
                                <input required name="name" type="text" defaultValue={item.name} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Toifasi</label>
                                    <select required name="category" defaultValue={item.category} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }}>
                                        <option value="Texnika">Texnika</option>
                                        <option value="Mebel">Mebel</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Bino-inshoot">Bino-inshoot</option>
                                        <option value="Boshqa">Boshqa</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Miqdori</label>
                                    <input required name="quantity" type="number" min="1" defaultValue={item.quantity} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Birlik Narxi (so'm)</label>
                                    <input required name="price" type="number" min="0" defaultValue={item.price} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Holati</label>
                                    <select required name="status" defaultValue={item.status} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }}>
                                        <option value="YAROQLI">Yaroqli</option>
                                        <option value="TAMIRTALAB">Ta'mirtalab</option>
                                        <option value="YAROQSIZ">Yaroqsiz</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Joylashuvi / Javobgar</label>
                                <input required name="location" type="text" defaultValue={item.location} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                                <button type="button" onClick={() => setIsEditOpen(false)} style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "100px", backgroundColor: "transparent", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer" }}>Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", backgroundColor: "var(--primary-color)", color: "white", fontWeight: "600", border: "none", cursor: "pointer" }}>
                                    {isSubmitting ? "Saqlanmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                , document.body)}

            {/* Delete Modal */}
            {isDeleteOpen && mounted && createPortal(
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 100, display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <div style={{ backgroundColor: "var(--surface-color)", padding: "2rem", borderRadius: "var(--radius-lg)", width: "100%", maxWidth: "400px", textAlign: "center" }}>
                        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--error-color)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                            <Trash2 size={32} />
                        </div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>O'chirishni tasdiqlaysizmi?</h3>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "2rem" }}>
                            Bu mulk (<b>{item.name}</b>) ro'yxatdan butunlay o'chib ketadi. Bu amalni ortga qaytarib bo'lmaydi.
                        </p>

                        <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
                            <button type="button" onClick={() => setIsDeleteOpen(false)} style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "100px", backgroundColor: "transparent", color: "var(--text-primary)", fontWeight: "600", cursor: "pointer" }}>Bekor qilish</button>
                            <button type="button" onClick={handleDelete} disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", backgroundColor: "var(--error-color)", color: "white", fontWeight: "600", border: "none", cursor: "pointer" }}>
                                {isSubmitting ? "O'chirilmoqda..." : "O'chirish"}
                            </button>
                        </div>
                    </div>
                </div>
                , document.body)}
        </div>
    );
}
