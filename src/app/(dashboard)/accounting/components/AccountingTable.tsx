"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, FileText, Filter } from "lucide-react";

interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: string;
    category: string;
    date: Date;
}

export default function AccountingTable({ initialTransactions }: { initialTransactions: Transaction[] }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [filterType, setFilterType] = useState("ALL"); // ALL, INCOME, EXPENSE

    const filteredTransactions = initialTransactions.filter((t) => {
        let match = true;
        const tDate = new Date(t.date);

        if (filterType !== "ALL" && t.type !== filterType) match = false;

        if (startDate) {
            const sDate = new Date(startDate);
            if (tDate < sDate) match = false;
        }

        if (endDate) {
            const eDate = new Date(endDate);
            // End date usually includes the whole day
            eDate.setHours(23, 59, 59, 999);
            if (tDate > eDate) match = false;
        }

        return match;
    });

    return (
        <div className="card" style={{ overflowX: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1.25rem" }}>
                <div style={{ flex: "1", minWidth: "100%", md: { minWidth: "auto" } } as any}>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.75rem" }}>Buxgalteriya Jurnali</h3>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--surface-color)", padding: "0.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", flex: "1", minWidth: "200px" }}>
                            <Filter size={16} color="var(--text-secondary)" style={{ marginLeft: "0.5rem" }} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                style={{ border: "none", background: "none", padding: "0.5rem", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem", width: "100%" }}
                            >
                                <option value="ALL">Barcha turlar</option>
                                <option value="INCOME">Faqat Kirim</option>
                                <option value="EXPENSE">Faqat Chiqim</option>
                            </select>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", flex: "1", minWidth: "280px" }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", fontSize: "0.85rem", flex: "1" }}
                            />
                            <span style={{ color: "var(--text-secondary)" }}>-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", fontSize: "0.85rem", flex: "1" }}
                            />
                        </div>
                    </div>
                </div>

                <button style={{ color: "var(--primary-color)", fontWeight: "600", background: "rgba(59, 130, 246, 0.1)", border: "none", display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.6rem 1rem", borderRadius: "100px", fontSize: "0.85rem" }}>
                    <FileText size={16} /> Hisobot
                </button>
            </div>

            <div className="table-responsive">
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                            <th style={{ padding: "1rem" }}>Sana</th>
                            <th style={{ padding: "1rem" }}>Tavsif / Nomi</th>
                            <th style={{ padding: "1rem" }}>Kategoriya</th>
                            <th style={{ padding: "1rem" }}>Tur</th>
                            <th style={{ padding: "1rem", textAlign: "right" }}>Summa</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: "3rem", textAlign: "center", color: "var(--text-secondary)" }}>
                                    Tanlangan mezonlar bo'yicha tranzaksiya topilmadi.
                                </td>
                            </tr>
                        ) : (
                            filteredTransactions.map((t) => (
                                <tr key={t.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                                        {new Date(t.date).toLocaleDateString("uz-UZ")}
                                    </td>
                                    <td style={{ padding: "1rem", fontWeight: "500" }}>{t.description}</td>
                                    <td style={{ padding: "1rem" }}>
                                        <span style={{ padding: "0.25rem 0.5rem", borderRadius: "1rem", backgroundColor: "var(--background-color)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                            {t.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        {t.type === "INCOME" ? (
                                            <span style={{ color: "var(--success-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem" }}><ArrowUpRight size={16} /> Kirim</span>
                                        ) : (
                                            <span style={{ color: "var(--error-color)", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem" }}><ArrowDownRight size={16} /> Chiqim</span>
                                        )}
                                    </td>
                                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: "600", color: t.type === "INCOME" ? "var(--success-color)" : "var(--error-color)" }}>
                                        {t.type === "INCOME" ? "+" : "-"}{t.amount.toLocaleString()} so'm
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
