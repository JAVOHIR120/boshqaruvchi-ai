"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addContract } from "@/actions";

export default function ContractsActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await addContract(formData);
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
                <Plus size={20} /> Yangi Shartnoma
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Shartnoma Qo'shish">
                <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Shartnoma Nomi</label>
                        <input name="title" required type="text" placeholder="Mahsulot yetkazib berish" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Hamkor (Kontragent)</label>
                            <input name="partyName" required type="text" placeholder="Eko-Trade MChJ" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Summa (so'm) (Ixtiyoriy)</label>
                            <input name="amount" type="number" step="0.01" min="0" placeholder="5000" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Holati</label>
                        <select name="status" required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }}>
                            <option value="ACTIVE">Faol</option>
                            <option value="COMPLETED">Tugallangan</option>
                            <option value="TERMINATED">Bekor qilingan</option>
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
