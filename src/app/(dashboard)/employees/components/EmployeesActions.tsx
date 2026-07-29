"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addEmployee } from "@/actions";

export default function EmployeesActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [newCredentials, setNewCredentials] = useState<{ email: string; pass: string } | null>(null);

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        const res = await addEmployee(formData);
        setLoading(false);

        if (res.error) {
            setError(res.error);
        } else if (res.generatedEmail && res.generatedPassword) {
            setNewCredentials({ email: res.generatedEmail, pass: res.generatedPassword });
        } else {
            setIsOpen(false);
        }
    }

    const resetModal = () => {
        setIsOpen(false);
        setNewCredentials(null);
        setError("");
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
                <Plus size={20} /> Yangi Xodim Qo'shish
            </button>

            <Modal isOpen={isOpen} onClose={resetModal} title={newCredentials ? "Muvaffaqiyatli!" : "Xodim Qabul Qilish"}>
                {newCredentials ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center", textAlign: "center", padding: "1rem 0" }}>
                        <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "var(--success-color)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <h3 style={{ color: "var(--text-primary)", fontSize: "1.25rem", margin: 0 }}>Xodim tizimga qo'shildi</h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0 }}>Quyidagi logn va parolni xodimga bering:</p>

                        <div style={{ backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "1rem", width: "100%", marginTop: "0.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Login (Email):</span>
                                <strong style={{ color: "var(--text-primary)" }}>{newCredentials.email}</strong>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Parol:</span>
                                <strong style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: "1.1rem" }}>{newCredentials.pass}</strong>
                            </div>
                        </div>

                        <button onClick={resetModal} className="btn-primary" style={{ width: "100%", marginTop: "1rem" }}>
                            Yopish
                        </button>
                    </div>
                ) : (
                    <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {error && <div style={{ color: "var(--error-color)", fontSize: "0.9rem" }}>{error}</div>}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Ism-Familiya</label>
                                <input name="name" required type="text" placeholder="Alijon Valiyev" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>E-mail (Avtorizatsiya uchun)</label>
                                <input name="email" required type="email" placeholder="ali@boshqaruvchi.uz" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Lavozimi</label>
                                <input name="position" required type="text" placeholder="Sotuv Menedjeri" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Oylik Maosh (so'm)</label>
                                <input name="salary" required type="number" step="10" min="0" placeholder="500" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)" }} />
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary" style={{ width: "100%", marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Saqlanmoqda..." : "Saqlash"}
                        </button>
                    </form>
                )}
            </Modal>
        </>
    );
}
