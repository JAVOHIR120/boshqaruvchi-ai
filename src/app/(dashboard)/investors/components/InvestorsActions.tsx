"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addInvestor } from "@/actions";

export default function InvestorsActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        await addInvestor(formData);
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
                <Plus size={20} /> Yangi Investor Qo'shish
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Investor Qo'shish">
                <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Investor / Hamkor Nomi</label>
                        <input name="name" required type="text" placeholder="Venture Capital LLC" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Joriy Ulushi (%)</label>
                            <input name="currentStake" required type="text" placeholder="15%" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Jami Kiritgan Sarmoyasi (so'm)</label>
                            <input name="totalInvestment" required type="number" step="0.01" min="0" placeholder="150000" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Oxirgi Sarmoya Sanasi</label>
                        <input name="lastInvestment" required type="date" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)" }} />
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </form>
            </Modal>
        </>
    );
}
