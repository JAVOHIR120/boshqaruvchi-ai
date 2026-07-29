"use client";

import { useState } from "react";
import { addInventoryItem } from "@/actions";
import Link from "next/link";
import { FileText, PlusCircle } from "lucide-react";

// O'RQ-741 (306-modda) bo'yicha amortizatsiya guruhlari
const AMORTIZATION_GROUPS = [
    { label: "I — Binolar (5%)", rate: 5 },
    { label: "I — Inshootlar (10%)", rate: 10 },
    { label: "II — Quvurlar, elektr liniyalari (15%)", rate: 15 },
    { label: "III — Mashinalar va uskunalar (20%)", rate: 20 },
    { label: "IV — Avto transport (20%)", rate: 20 },
    { label: "IV — Kema, samolyot, poyezd (10%)", rate: 10 },
    { label: "V — Kompyuterlar (40%)", rate: 40 },
    { label: "VI — Boshqa aktivlar (15%)", rate: 15 },
    { label: "307-modda — Nomoddiy aktivlar (10%)", rate: 10 },
];

const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.75rem", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.2)", color: "white",
};
const selectStyle: React.CSSProperties = {
    ...inputStyle, backgroundColor: "#1e293b",
};
const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.9rem", color: "#9ca3af", marginBottom: "0.5rem"
};

export default function InventoryActions() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedRate, setSelectedRate] = useState(0);

    const handleGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const group = AMORTIZATION_GROUPS.find(g => g.label === e.target.value);
        setSelectedRate(group ? group.rate : 0);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set("amortizationRate", String(selectedRate));
        await addInventoryItem(formData);
        setIsSubmitting(false);
        setIsModalOpen(false);
    };

    return (
        <>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                <Link href="/inventory/forms" style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.65rem 1.15rem", backgroundColor: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)", borderRadius: "100px", fontWeight: "600",
                    cursor: "pointer", transition: "all 0.2s ease", textDecoration: "none", fontSize: "0.85rem",
                    flex: "1", textAlign: "center", justifyContent: "center", minWidth: "150px"
                }}>
                    <FileText size={18} /> Shakllar
                </Link>

                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        padding: "0.65rem 1.15rem", backgroundColor: "var(--primary-color)",
                        color: "white", borderRadius: "100px", fontWeight: "600",
                        border: "none", cursor: "pointer", transition: "all 0.2s ease", fontSize: "0.85rem",
                        flex: "1", textAlign: "center", justifyContent: "center", minWidth: "150px"
                    }}
                >
                    <PlusCircle size={20} /> Qo&apos;shish
                </button>
            </div>

            {isModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.8)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
                    <div style={{ backgroundColor: "var(--background-color)", padding: "1.5rem", borderRadius: "1.25rem", width: "100%", maxWidth: "550px", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem", color: "var(--text-primary)", fontFamily: "var(--font-outfit), sans-serif" }}>Yangi Mulk Qo&apos;shish</h3>

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div>
                                <label style={labelStyle}>Mulk nomi</label>
                                <input required name="name" type="text" placeholder="Masalan: Kompyuter HP" style={inputStyle} />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={labelStyle}>Toifasi</label>
                                    <select required name="category" style={selectStyle}>
                                        <option value="Texnika">Texnika</option>
                                        <option value="Mebel">Mebel</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Bino-inshoot">Bino-inshoot</option>
                                        <option value="Nomoddiy aktiv">Nomoddiy aktiv (Dastur, Litsenziya)</option>
                                        <option value="Boshqa">Boshqa</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Miqdori (dona, kg)</label>
                                    <input required name="quantity" type="number" min="1" defaultValue="1" style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={labelStyle}>Birlik Narxi (so&apos;m)</label>
                                    <input required name="price" type="number" min="0" defaultValue="0" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Holati</label>
                                    <select required name="status" style={selectStyle}>
                                        <option value="YAROQLI">Yaroqli</option>
                                        <option value="TAMIRTALAB">Ta&apos;mirtalab</option>
                                        <option value="YAROQSIZ">Yaroqsiz</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Joylashuvi yoki Javobgar shaxs</label>
                                <input required name="location" type="text" placeholder="Masalan: Bosh ofis, 2-xona" style={inputStyle} />
                            </div>

                            {/* ===== AMORTIZATSIYA BO'LIMI (O'RQ-741) ===== */}
                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem", marginTop: "0.5rem" }}>
                                <p style={{ fontSize: "0.8rem", color: "#60a5fa", fontWeight: "600", marginBottom: "0.75rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>📉 Amortizatsiya (O&apos;RQ-741, 306-modda)</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                    <div>
                                        <label style={labelStyle}>Sotib olingan sana</label>
                                        <input name="purchaseDate" type="date" defaultValue={new Date().toISOString().split("T")[0]} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Amortizatsiya guruhi</label>
                                        <select name="amortizationGroup" onChange={handleGroupChange} style={selectStyle}>
                                            <option value="">— Tanlanmagan —</option>
                                            {AMORTIZATION_GROUPS.map(g => (
                                                <option key={g.label} value={g.label}>{g.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {selectedRate > 0 && (
                                    <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ fontSize: "1.5rem" }}>📊</span>
                                        <div>
                                            <p style={{ fontSize: "0.85rem", color: "#93c5fd" }}>Yillik amortizatsiya normasi</p>
                                            <p style={{ fontSize: "1.25rem", fontWeight: "700", color: "#60a5fa" }}>{selectedRate}%</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: "0.75rem 1.5rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "100px", backgroundColor: "transparent", color: "white", fontWeight: "600", cursor: "pointer", transition: "all 0.2s" }}>Bekor qilish</button>
                                <button type="submit" disabled={isSubmitting} style={{ padding: "0.75rem 1.5rem", borderRadius: "100px", backgroundColor: "var(--primary-color)", color: "white", fontWeight: "600", border: "none", cursor: "pointer", transition: "background 0.2s" }}>
                                    {isSubmitting ? "Qo'shilmoqda..." : "Saqlash"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
