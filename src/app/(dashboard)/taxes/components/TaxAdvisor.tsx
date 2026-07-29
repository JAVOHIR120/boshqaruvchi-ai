import React, { useMemo } from 'react';
import { ShieldAlert, ShieldCheck, Shield, TrendingDown, Lightbulb, ArrowUpRight, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import type { TaxBaseData, ComputedTaxModel } from '@/lib/taxEngine';

interface TaxAdvisorProps {
    data: TaxBaseData;
    computedTaxes: ComputedTaxModel[];
    enterpriseType: string;
}

export default function TaxAdvisor({ data, computedTaxes, enterpriseType }: TaxAdvisorProps) {
    const analysis = useMemo(() => {
        const { totalIncome, totalExpense, netProfit, totalSalaryFund } = data;
        
        const income = totalIncome || 1; // Prevent div by 0
        const profitMargin = netProfit / income;
        const expenseRatio = totalExpense / income;
        
        let riskScore = 0;
        let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
        const riskFactors: string[] = [];
        
        // 1. Profit Margin Check
        if (profitMargin < 0.03) {
            riskScore += 45;
            riskFactors.push("Sof foyda marjasi o'ta past (< 3%). Soliq auditida shubhali hisoblanadi.");
        } else if (profitMargin < 0.08) {
            riskScore += 25;
            riskFactors.push("Foyda marjasi past (< 8%). Sohadagi o'rtacha ko'rsatkichlar bilan solishtiring.");
        }

        // 2. Expense Ratio Check
        if (expenseRatio > 0.95) {
            riskScore += 40;
            riskFactors.push("Xarajatlar tushumga nisbatan juda yuqori (> 95%). Sun'iy xarajatlar tahlil qilinishi mumkin.");
        } else if (expenseRatio > 0.85) {
            riskScore += 20;
            riskFactors.push("Katta xarajatlar yuklamasi (> 85%). Barcha invoyslaringiz haqiqiyligini tekshiring.");
        }

        if (riskScore >= 70) riskLevel = "HIGH";
        else if (riskScore >= 40) riskLevel = "MEDIUM";
        else riskLevel = "LOW";

        // Optimizations
        const optimizations: { id: string; title: string; saved: number; desc: string }[] = [];

        // Opt 1: IT Park
        if (totalSalaryFund > 10000000) { // If salary fund is > 10M
            const standardTax = totalSalaryFund * 0.24; // 12% income + 12% social
            const itParkTax = totalSalaryFund * 0.075; // 7.5% income + 0% social
            const saved = standardTax - itParkTax;
            optimizations.push({
                id: "IT_PARK",
                title: "IT Park Rezidentligi",
                saved,
                desc: "Agar kompaniya IT sohasi bilan shug'ullansa, rezident bo'lish orqali daromad va ijtimoiy siyosatdan yirik tejash mumkin (12% emas, 7.5% va 0% ijtimoiy)."
            });
        }

        // Opt 2: Aylanma Fixed vs Percentage
        const aylanmaTax = computedTaxes.find(t => t.id === "AYLANMA");
        if (aylanmaTax && enterpriseType === "MCHJ_KICHIK") {
            const currentAylanmaAmount = aylanmaTax.amount;
            const fixedMonthly = 30000000 / 12; // 2.5 mln
            if (currentAylanmaAmount > fixedMonthly * 1.1) {
                // They pay > 10% more than fixed
                const saved = currentAylanmaAmount - fixedMonthly;
                optimizations.push({
                    id: "AYLANMA_FIXED",
                    title: "Qat'iy Belgilangan Soliq",
                    saved,
                    desc: `Siz hozir aylanmadan 4% to'layapsiz. Agar yiliga 30 mln so'mlik qat'iy soliqqa o'tsangiz, sezilarli tejaysiz.`
                });
            }
            
            // Limit check 1 mlrd (let's assume totalIncome is monthly, so yearly projection)
            const projectedYearly = totalIncome * 12;
            if (projectedYearly > 800000000 && projectedYearly < 1000000000) {
                 optimizations.push({
                    id: "VAT_WARN",
                    title: "QQS ga o'tish yaqin",
                    saved: 0,
                    desc: `Yillik aylanmangiz 1 mlrd so'mga yaqinlashmoqda. QQS to'lovchisiga aylanishga va xarajatlarni "Zachyot" qilishga tayyorlaning.`
                });
            }
        }

        return { riskScore: Math.min(riskScore, 100), riskLevel, riskFactors, optimizations };
    }, [data, computedTaxes, enterpriseType]);

    const { riskScore, riskLevel, riskFactors, optimizations } = analysis;

    const riskColor = riskLevel === "HIGH" ? "#ef4444" : riskLevel === "MEDIUM" ? "#f59e0b" : "#10b981";
    const RiskIcon = riskLevel === "HIGH" ? ShieldAlert : riskLevel === "MEDIUM" ? AlertTriangle : ShieldCheck;

    return (
        <div style={{
            background: "linear-gradient(145deg, rgba(20,20,30,0.8) 0%, rgba(30,30,45,0.9) 100%)",
            border: "1px solid var(--border-color)", borderRadius: "20px", padding: "1.5rem",
            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
            display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%",
            position: "relative", overflow: "hidden"
        }}>
            {/* Background Glow */}
            <div style={{
                position: "absolute", top: "-50%", right: "-20%", width: "200px", height: "200px",
                background: riskColor, filter: "blur(100px)", opacity: 0.15, borderRadius: "50%", zIndex: 0,
                pointerEvents: "none"
            }} />

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
                <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-primary)" }}>
                    <Shield size={20} color={riskColor} />
                    Soliq xavfi va AI Tahlil
                </h2>
            </div>

            {/* RISK METER */}
            <div style={{
                background: "var(--surface-color)", borderRadius: "16px", padding: "1.25rem",
                border: "1px solid rgba(255,255,255,0.05)", zIndex: 1,
                display: "flex", alignItems: "center", gap: "1.5rem"
            }}>
                <div style={{ position: "relative", width: "80px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="80" height="80" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke={riskColor} strokeWidth="8"
                            strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * riskScore) / 100}
                            style={{ transition: "stroke-dashoffset 1s ease-out" }}
                        />
                    </svg>
                    <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <span style={{ fontSize: "1.5rem", fontWeight: "800", color: riskColor, lineHeight: 1 }}>{riskScore}</span>
                        <span style={{ fontSize: "0.6rem", color: "var(--text-secondary)", fontWeight: "600" }}>XAVF %</span>
                    </div>
                </div>
                
                <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {riskLevel === "HIGH" ? "Yuqori Xavf (Audit ehtimoli)" : riskLevel === "MEDIUM" ? "O'rtacha Xavf" : "Xavfsiz Hudud"}
                        <RiskIcon size={16} color={riskColor} />
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.4 }}>
                        {riskFactors.length > 0 
                            ? "Moliyaviy ko'rsatkichlaringiz soliq organlari bazasida shubhali deb topilishi mumkin." 
                            : "Barcha moliyaviy nisbatlar me'yorda. Soliq audit xavfi minimal darajada."}
                    </p>
                </div>
            </div>

            {/* RISK FACTORS LIST */}
            {riskFactors.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", zIndex: 1 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px" }}>Shubhali Omillar</span>
                    {riskFactors.map((factor, idx) => (
                        <div key={idx} style={{ 
                            display: "flex", alignItems: "flex-start", gap: "0.5rem",
                            background: "rgba(239, 68, 68, 0.08)", padding: "0.75rem", borderRadius: "8px", borderLeft: "2px solid #ef4444"
                        }}>
                            <AlertTriangle size={14} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.75rem", color: "#fca5a5", lineHeight: 1.4 }}>{factor}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* AI OPTIMIZATIONS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", zIndex: 1, marginTop: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <Lightbulb size={16} color="#3b82f6" />
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#60a5fa" }}>AI Maqbullashtirish (Soliqni tejash)</span>
                </div>
                
                {optimizations.length === 0 ? (
                    <div style={{ padding: "1rem", background: "var(--surface-color)", borderRadius: "10px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.1)" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Hozirgi soliq rejimingiz eng optimal holatda.</span>
                    </div>
                ) : (
                    optimizations.map(opt => (
                        <div key={opt.id} style={{
                            background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.2)",
                            borderRadius: "12px", padding: "1rem", position: "relative", overflow: "hidden"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                <h4 style={{ margin: 0, fontSize: "0.9rem", fontWeight: "700", color: "#93c5fd", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Zap size={14} fill="#60a5fa" color="#60a5fa" />
                                    {opt.title}
                                </h4>
                                {opt.saved > 0 && (
                                    <div style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "0.2rem 0.6rem", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                                        <TrendingDown size={12} />
                                        {opt.saved.toLocaleString()} uZS
                                    </div>
                                )}
                            </div>
                            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                                {opt.desc}
                            </p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
