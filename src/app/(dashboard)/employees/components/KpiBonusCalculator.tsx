"use client";

import { useState } from "react";
import { Award, ShieldAlert, Sparkles, Check, AlertCircle, Edit, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { applyEmployeeBonusOrFine } from "@/actions";

type EmployeeWithUser = {
    id: string;
    position: string;
    salary: number;
    performance: number;
    yellowCards: number;
    redCards: number;
    user: {
        name: string;
        email: string;
    };
};

type Props = {
    employees: EmployeeWithUser[];
};

export default function KpiBonusCalculator({ employees }: Props) {
    // We maintain a local state for editable bonus/fine amounts and descriptions
    const [editableStats, setEditableStats] = useState<Record<string, {
        bonusAmount: number;
        fineAmount: number;
        bonusDesc: string;
        fineDesc: string;
    }>>({});

    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

    // Helper to initialize or get values
    const getStats = (emp: EmployeeWithUser) => {
        if (editableStats[emp.id]) return editableStats[emp.id];

        // AI calculations (Recommendations only!)
        const recBonus = emp.performance >= 90 
            ? Math.round(emp.salary * 0.10) 
            : emp.performance >= 80 
                ? Math.round(emp.salary * 0.05) 
                : 0;

        const recFine = Math.round(emp.salary * (emp.redCards * 0.05 + emp.yellowCards * 0.02));

        const stats = {
            bonusAmount: recBonus,
            fineAmount: recFine,
            bonusDesc: `Faol samaradorlik (${emp.performance}%) uchun bonus`,
            fineDesc: `${emp.yellowCards} ta sariq, ${emp.redCards} ta qizil karta uchun jarima`
        };

        // Cache it in state
        setEditableStats(prev => ({ ...prev, [emp.id]: stats }));
        return stats;
    };

    const handleUpdateField = (empId: string, field: string, value: any) => {
        setEditableStats(prev => ({
            ...prev,
            [empId]: {
                ...prev[empId],
                [field]: value
            }
        }));
    };

    const handleApply = async (empId: string, type: "BONUS" | "FINE") => {
        const stats = editableStats[empId];
        if (!stats) return;

        const amount = type === "BONUS" ? stats.bonusAmount : stats.fineAmount;
        const description = type === "BONUS" ? stats.bonusDesc : stats.fineDesc;

        if (amount <= 0) {
            toast.error("Summa noldan katta bo'lishi kerak!");
            return;
        }

        const key = `${empId}-${type}`;
        setLoadingStates(prev => ({ ...prev, [key]: true }));

        try {
            const res = await applyEmployeeBonusOrFine(empId, amount, type, description);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(
                    type === "BONUS"
                        ? `Muvaffaqiyatli tasdiqlandi! Xodim uchun +${amount.toLocaleString()} UZS mukofot hisoblandi. 🏆`
                        : `Muvaffaqiyatli tasdiqlandi! Xodimdan -${amount.toLocaleString()} UZS jarima ushlab qolindi. 🟥`
                );
                
                // Clear state for this type
                handleUpdateField(empId, type === "BONUS" ? "bonusAmount" : "fineAmount", 0);
            }
        } catch (err: any) {
            toast.error("Xatolik yuz berdi: " + err.message);
        } finally {
            setLoadingStates(prev => ({ ...prev, [key]: false }));
        }
    };

    if (employees.length === 0) return null;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
            
            {/* Header info */}
            <div className="card glass-card-premium" style={{ 
                padding: "1.5rem", 
                borderLeft: "4px solid #8b5cf6",
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.01) 100%)"
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                    <Sparkles style={{ color: "#8b5cf6" }} size={20} />
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0 }}>
                        Tadbirkor Diskretsion KPI & Intizom Panel
                    </h3>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5", margin: 0 }}>
                    <strong>Boshliq DIQQATIGA:</strong> Xodimlarga bonus yoki jarima qo'shish mutlaqo sizning diskretsion huquqingizdir. 
                    Quyidagi mukofot va jarima summalari xodimning samaradorlik (% KPI) hamda sariq/qizil kartalariga asosan AI tomonidan **tavsiya sifatida** keltirilgan.
                    Siz ushbu summalarni istagancha o'zgartirishingiz, tahrirlashingiz yoki tasdiqlamasligingiz mumkin.
                </p>
            </div>

            {/* Grid of employees with their adjustable settings */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: "1.25rem" }}>
                {employees.map((emp) => {
                    const stats = getStats(emp);
                    const isBonusLoading = loadingStates[`${emp.id}-BONUS`];
                    const isFineLoading = loadingStates[`${emp.id}-FINE`];

                    return (
                        <div key={emp.id} className="card hover-scale" style={{ padding: "1.25rem", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            
                            {/* Employee header inside card */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <h4 style={{ fontWeight: "700", fontSize: "1rem", color: "var(--text-primary)", margin: "0 0 0.25rem 0" }}>
                                        {emp.user.name}
                                    </h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: "500" }}>
                                        {emp.position} • Base: {emp.salary.toLocaleString()} UZS
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.5rem", borderRadius: "8px", backgroundColor: "rgba(255,255,255,0.02)" }}>
                                    <span style={{ fontSize: "0.75rem", fontWeight: "700", color: emp.performance >= 80 ? "var(--success-color)" : "var(--warning-color)" }}>
                                        {emp.performance}% KPI
                                    </span>
                                </div>
                            </div>

                            <div style={{ width: "100%", height: "1px", backgroundColor: "var(--border-color)" }} />

                            {/* Section 1: Adjust & Confirm Bonus */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", color: "var(--success-color)" }}>
                                    <Award size={14} />
                                    <span>Tavsiya etilgan Mukofot (Bonus)</span>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <div style={{ position: "relative", flex: "1" }}>
                                        <input 
                                            type="number"
                                            value={stats.bonusAmount}
                                            onChange={(e) => handleUpdateField(emp.id, "bonusAmount", parseFloat(e.target.value) || 0)}
                                            style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 1.75rem", fontSize: "0.85rem", fontWeight: "700", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--text-primary)" }}
                                        />
                                        <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>$</span>
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Sabab/Tavsif"
                                        value={stats.bonusDesc}
                                        onChange={(e) => handleUpdateField(emp.id, "bonusDesc", e.target.value)}
                                        style={{ flex: "2", padding: "0.5rem", fontSize: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--text-primary)" }}
                                    />
                                    <button
                                        onClick={() => handleApply(emp.id, "BONUS")}
                                        disabled={stats.bonusAmount <= 0 || isBonusLoading}
                                        className="btn-primary"
                                        style={{ padding: "0.5rem", borderRadius: "8px", minWidth: "40px", backgroundColor: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}
                                        title="Bonusni tasdiqlash"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Section 2: Adjust & Confirm Fine */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", color: "var(--error-color)" }}>
                                    <ShieldAlert size={14} />
                                    <span>Tavsiya etilgan Jarima ({emp.yellowCards}🟨, {emp.redCards}🟥)</span>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <div style={{ position: "relative", flex: "1" }}>
                                        <input 
                                            type="number"
                                            value={stats.fineAmount}
                                            onChange={(e) => handleUpdateField(emp.id, "fineAmount", parseFloat(e.target.value) || 0)}
                                            style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 1.75rem", fontSize: "0.85rem", fontWeight: "700", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--text-primary)" }}
                                        />
                                        <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "var(--text-secondary)" }}>$</span>
                                    </div>
                                    <input 
                                        type="text"
                                        placeholder="Sabab/Tavsif"
                                        value={stats.fineDesc}
                                        onChange={(e) => handleUpdateField(emp.id, "fineDesc", e.target.value)}
                                        style={{ flex: "2", padding: "0.5rem", fontSize: "0.8rem", borderRadius: "8px", border: "1px solid var(--border-color)", backgroundColor: "rgba(255,255,255,0.02)", color: "var(--text-primary)" }}
                                    />
                                    <button
                                        onClick={() => handleApply(emp.id, "FINE")}
                                        disabled={stats.fineAmount <= 0 || isFineLoading}
                                        className="btn-primary"
                                        style={{ padding: "0.5rem", borderRadius: "8px", minWidth: "40px", backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}
                                        title="Jarimani tasdiqlash"
                                    >
                                        <Check size={16} />
                                    </button>
                                </div>
                            </div>

                        </div>
                    );
                })}
            </div>

        </div>
    );
}
