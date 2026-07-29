"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addTransaction } from "@/actions";

export default function AccountingActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await addTransaction(formData);
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
                <Plus size={20} /> Tranzaksiya qo'shish
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Yangi Tranzaksiya Qo'shish">
                <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Tavsif (Nima uchun?)</label>
                        <input name="description" required type="text" placeholder="Masalan: Ofis ijarasi" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Summa (so'm)</label>
                            <input name="amount" required type="number" step="0.01" min="0" placeholder="1500" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Tur</label>
                            <select name="type" required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }}>
                                <option value="INCOME">Kirim (Daromad)</option>
                                <option value="EXPENSE">Chiqim (Xarajat)</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Kategoriya</label>
                        <select name="category" required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }}>
                            <option value="SALES">Savdo tushumi</option>
                            <option value="SALARY">Oylik maosh</option>
                            <option value="TAX">Soliqlar</option>
                            <option value="RENT">Ijara</option>
                            <option value="OTHER">Boshqa</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </form>
            </Modal>
        </>
    );
}
