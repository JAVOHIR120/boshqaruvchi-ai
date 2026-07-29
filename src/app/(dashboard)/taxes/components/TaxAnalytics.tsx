import React, { useMemo } from 'react';
import { PieChart, TrendingUp, DollarSign } from 'lucide-react';
import type { ComputedTaxModel } from '@/lib/taxEngine';

interface TaxAnalyticsProps {
    computedTaxes: ComputedTaxModel[];
    totalIncome: number;
}

export default function TaxAnalytics({ computedTaxes, totalIncome }: TaxAnalyticsProps) {
    const totalTax = useMemo(() => computedTaxes.reduce((sum, t) => sum + t.amount, 0), [computedTaxes]);
    
    // Sort and calculate percentages
    const chartData = useMemo(() => {
        return computedTaxes
            .filter(t => t.amount > 0)
            .sort((a, b) => b.amount - a.amount)
            .map(t => ({
                ...t,
                percentage: totalTax > 0 ? (t.amount / totalTax) * 100 : 0
            }));
    }, [computedTaxes, totalTax]);

    // Donut chart SVG config
    const size = 180;
    const strokeWidth = 24;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    let currentOffset = 0;

    return (
        <div style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%"
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                    <PieChart size={18} color="#14b8a6" />
                    Soliq Analitikasi 
                </h2>
            </div>
            
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                Soliq xarajatlarining umumiy aylanmaga va bir burchakli nisbatlarga ko'ra vizual taqsimoti. Qaysi yo'nalish eng zo'riqishli ekanini ko'rsatadi.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexGrow: 1, flexWrap: "wrap", justifyContent: "center" }}>
                {/* DONUT CHART */}
                {totalTax > 0 ? (
                    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
                            {chartData.map((slice) => {
                                const strokeDashoffset = circumference - (slice.percentage / 100) * circumference;
                                const groupTransform = `rotate(${(currentOffset / 100) * 360} ${size / 2} ${size / 2})`;
                                currentOffset += slice.percentage;

                                return (
                                    <circle
                                        key={slice.id}
                                        cx={size / 2} cy={size / 2} r={radius}
                                        fill="transparent" stroke={slice.color} strokeWidth={strokeWidth}
                                        strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                                        transform={groupTransform}
                                        style={{ transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                                    />
                                );
                            })}
                        </svg>
                        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "600", letterSpacing: "1px" }}>TUSHUMDAN</span>
                            <span style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
                                {totalIncome > 0 ? ((totalTax / totalIncome) * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ width: size, height: size, borderRadius: "50%", border: "8px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        Soliq yo'q
                    </div>
                )}

                {/* LEGEND */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1, minWidth: "150px" }}>
                    {chartData.slice(0, 5).map(slice => (
                        <div key={slice.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem", background: "rgba(255,255,255,0.03)", padding: "0.4rem 0.6rem", borderRadius: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: slice.color }} />
                                <span style={{ color: "var(--text-primary)", fontWeight: "500", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{slice.label}</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <span style={{ fontWeight: "800", color: "var(--text-primary)" }}>{slice.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                    ))}
                    {chartData.length > 5 && (
                 <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic", marginTop: "0.2rem" }}>
                            + Yana {chartData.length - 5} ta soliq
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto" }}>
                <div style={{ flex: 1, padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <TrendingUp size={16} color="#10b981" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.65rem", color: "#6ee7b7", fontWeight: "600", textTransform: "uppercase" }}>Jami Tushum</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#10b981" }}>{(totalIncome / 1000000).toFixed(1)} mln</span>
                    </div>
                </div>
                <div style={{ flex: 1, padding: "0.75rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    <DollarSign size={16} color="#ef4444" />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "0.65rem", color: "#fca5a5", fontWeight: "600", textTransform: "uppercase" }}>Jami Soliq</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#ef4444" }}>{(totalTax / 1000000).toFixed(1)} mln</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
