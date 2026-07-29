"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addTaxReport } from "@/actions";

export default function TaxesActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await addTaxReport(formData);
        setLoading(false);
        setIsOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
                <Plus size={20} /> Yangi Soliq Hisoboti
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Soliq Hisobotini Qo'shish">
                <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Soliq Turi / Nomi</label>
                        <input name="name" required type="text" placeholder="Masalan: QQS" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Davr</label>
                            <input name="period" required type="text" placeholder="2026 Iyul" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Summa (so'm)</label>
                            <input name="amount" required type="number" step="0.01" min="0" placeholder="1000" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Holati</label>
                            <select name="status" required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }}>
                                <option value="PENDING">Kutilmoqda</option>
                                <option value="PAID">To'langan</option>
                                <option value="OVERDUE">Muddati o'tgan</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>To'lov Muddati</label>
                            <input name="dueDate" required type="date" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </form>
            </Modal>
        </>
    );
}
