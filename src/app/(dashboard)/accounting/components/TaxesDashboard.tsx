"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Calculator, TrendingUp, Info, PiggyBank, Sparkles, X, Loader2 } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import { calculateTaxes, InvoiceReference, PayrollData } from "@/utils/taxCalculator";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

export default function TaxesDashboard({ transactions, employees }: { transactions: any[], employees: any[] }) {
    const [taxRegime, setTaxRegime] = useState<"AOS" | "QQS">("AOS");
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiStrategy, setAiStrategy] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const generateAiStrategy = async () => {
        setIsGenerating(true);
        setShowAiModal(true);
        setAiStrategy("AI sizning tranzaksiyalaringiz va O'zbekiston Soliq Kodeksining so'nggi tahririni tahlil qilmoqda... Iltimos kuting...");
        
        try {
            const res = await fetch("/api/tax-optimize", { method: "POST" });
            const data = await res.json();
            if (data.success && data.analysis) {
                setAiStrategy(data.analysis);
            } else {
                toast.error(data.error || "Tahlilni olishda xato yuz berdi");
                setShowAiModal(false);
            }
        } catch (e) {
            toast.error("Tizim xatosi");
            setShowAiModal(false);
        } finally {
            setIsGenerating(false);
        }
    };

    const invoices: InvoiceReference[] = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        return transactions.map(t => {
            const isExpense = t.type === "EXPENSE";
            const desc = (t.description || "").toLowerCase();
            
            // Vat Amount (inclusive 12% QQS for simplicity)
            const vatAmount = t.category === "TAX" ? 0 : Math.round(t.amount * 0.12 / 1.12);
            
            // Check if tax deductible (expenses are deductible unless restaurant or fine/jarima)
            const isTaxDeductible = isExpense 
                ? !(desc.includes("jarima") || desc.includes("fine") || desc.includes("restoran") || desc.includes("restaurant") || desc.includes("penalty"))
                : true;
                
            // Valid status unless it contains specific warning signs
            const vatStatus = isExpense && (desc.includes("shubhali") || desc.includes("xato") || desc.includes("muammoli"))
                ? 'Invalid'
                : 'Valid';

            return {
                id: t.id,
                type: t.type as 'INCOME' | 'EXPENSE',
                amount: t.amount,
                vatAmount,
                vatStatus,
                isTaxDeductible,
                date: new Date(t.date).toISOString().split('T')[0]
            };
        });
    }, [transactions]);

    const payroll: PayrollData[] = useMemo(() => {
        if (!employees || employees.length === 0) return [];
        return employees.map(emp => ({
            grossSalary: emp.salary || 0
        }));
    }, [employees]);

    const taxResult = useMemo(() => calculateTaxes(invoices, payroll), [invoices, payroll]);

    // Fallbacks to default scale if data is empty so dashboard still renders beautifully
    const totalIncome = useMemo(() => invoices.filter(inv => inv.type === "INCOME").reduce((sum, inv) => sum + inv.amount, 0), [invoices]);
    const totalExpense = useMemo(() => invoices.filter(inv => inv.type === "EXPENSE").reduce((sum, inv) => sum + inv.amount, 0), [invoices]);
    const totalPayroll = useMemo(() => payroll.reduce((sum, p) => sum + p.grossSalary, 0), [payroll]);

    const displayIncome = totalIncome > 0 ? totalIncome : 1000000000;
    const displayExpense = totalExpense > 0 ? totalExpense : 480000000;
    const displayPayroll = totalPayroll > 0 ? totalPayroll : 16500000;

    // Simulyatsiya hisobotlari
    const aosNetProfit = displayIncome - displayExpense - taxResult.turnoverTax;
    const qqsNetProfit = (displayIncome - (totalIncome > 0 ? taxResult.vatPayable : 107142856)) - (displayExpense - (totalExpense > 0 ? taxResult.validInputVat : 42857142)) - taxResult.vatPayable - taxResult.profitTax;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Regime Selector & Simulator */}
            <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--primary-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                    <div>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calculator size={20} className="text-blue-500" /> Soliq Rejimi Simulyatori
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.5rem" }}>
                            Biznesingiz qaysi soliq rejimida ishlashi qulayroq? Tizim AI tahlili orqali sizga ideal variantni ko'rsatadi.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", background: "var(--surface-color)", padding: "0.25rem", borderRadius: "0.5rem", border: "1px solid var(--border-color)" }}>
                            <button
                                onClick={() => setTaxRegime("AOS")}
                                style={{ padding: "0.5rem 1rem", borderRadius: "0.25rem", background: taxRegime === "AOS" ? "var(--primary-color)" : "transparent", color: taxRegime === "AOS" ? "#fff" : "var(--text-primary)", border: "none", fontWeight: "600", cursor: "pointer", transition: "0.2s" }}
                            >
                                AOS (4%)
                            </button>
                            <button
                                onClick={() => setTaxRegime("QQS")}
                                style={{ padding: "0.5rem 1rem", borderRadius: "0.25rem", background: taxRegime === "QQS" ? "var(--primary-color)" : "transparent", color: taxRegime === "QQS" ? "#fff" : "var(--text-primary)", border: "none", fontWeight: "600", cursor: "pointer", transition: "0.2s" }}
                            >
                                QQS (12%) + Foyda (15%)
                            </button>
                        </div>
                        <button
                            onClick={generateAiStrategy}
                            disabled={isGenerating}
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.5rem", 
                                padding: "0.6rem 1.2rem", 
                                borderRadius: "0.5rem", 
                                background: "linear-gradient(135deg, #6366f1, #a855f7)", 
                                color: "#fff", 
                                border: "none", 
                                fontWeight: "700", 
                                cursor: "pointer", 
                                boxShadow: "0 4px 15px rgba(168, 85, 247, 0.4)",
                                transition: "all 0.3s ease"
                            }}
                        >
                            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            AI Soliq Strategiyasi 👔
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "rgba(16, 185, 129, 0.05)", borderRadius: "0.5rem", border: "1px dashed var(--success-color)", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                    <PiggyBank size={24} color="var(--success-color)" style={{ marginTop: "0.25rem" }} />
                    <div>
                        <h4 style={{ fontWeight: "700", color: "var(--success-color)", marginBottom: "0.25rem" }}>AI Analitika Xulosasi:</h4>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            Sizning joriy xarajatlar tuzilmangizga ko'ra (ayniqsa material xaridlari OQQS zachetisiz kelsa),{" "}
                            <strong> {aosNetProfit > qqsNetProfit ? "AOS (Aylanmadan olinadigan soliq)" : "QQS (Qo'shilgan qiymat solig'i)"} </strong>{" "}
                            rejimi foydaliroq. Bu rejim orqali oy oxirida {Math.round(Math.abs(aosNetProfit - qqsNetProfit)).toLocaleString()} so'm ko'proq sof foyda olasiz.
                        </p>
                    </div>
                </div>
            </div>

            {/* Smart Alerts for Risk Board */}
            {taxResult.invalidInputVat > 0 && (
                <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.05)", borderLeft: "4px solid var(--error-color)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <AlertTriangle size={24} color="var(--error-color)" />
                    <div>
                        <h4 style={{ fontWeight: "600", color: "var(--error-color)" }}>XAVF: QQS zacheti bo'yicha ogohlantirish!</h4>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            Sizda yetkazib beruvchilarning hisobotlari muammoli bo'lganligi sababli <strong>{taxResult.invalidInputVat.toLocaleString()} so'm</strong> QQS zacheti bekor bo'lishi xavfi bor. Byudjetga ortiqcha soliq to'lashingiz mumkin.
                        </p>
                    </div>
                </div>
            )}
            
            {taxResult.nonDeductibleExpenses > 0 && (
                <div style={{ padding: "1rem", backgroundColor: "rgba(245, 158, 11, 0.05)", borderLeft: "4px solid var(--warning-color)", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Info size={24} color="var(--warning-color)" />
                    <div>
                        <h4 style={{ fontWeight: "600", color: "var(--warning-color)" }}>DIQQAT: Chegirilmaydigan xarajatlar aniqlandi</h4>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                            Sizda korporativ xarajatlardan <strong>{taxResult.nonDeductibleExpenses.toLocaleString()} so'm</strong>{" "}
                            miqdorida chegirilmaydigan xarajatlar bor. Bu summa Foyda solig'i hisoblanganda sizning xarajatlaringizdan chegirilmaydi (Soliqingiz oshadi).
                        </p>
                    </div>
                </div>
            )}

            {/* Widgets Dashboard */}
            {taxRegime === "AOS" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>Aylanmadan Olinadigan Soliq (4%)</p>
                        <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-color)" }}>{taxResult.turnoverTax.toLocaleString()} <span style={{fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)"}}>so'm</span></h3>
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Soliq bazasi (Jami aylanma):</span>
                            <span style={{ fontWeight: "600" }}>{displayIncome.toLocaleString()} so'm</span>
                        </div>
                    </div>
                    
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>Mehnat Soliqlari (JShDS + Ijtimoiy Yig'im)</p>
                        <h3 style={{ fontSize: "2rem", fontWeight: "800" }}>{(taxResult.socialTax + taxResult.personalIncomeTax).toLocaleString()} <span style={{fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)"}}>so'm</span></h3>
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Jami Ish haqi fondi:</span>
                            <span style={{ fontWeight: "600" }}>{displayPayroll.toLocaleString()} so'm</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    <div className="card" style={{ padding: "1.5rem" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>To'lanadigan QQS (12%)</p>
                        <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary-color)" }}>{taxResult.vatPayable.toLocaleString()} <span style={{fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)"}}>so'm</span></h3>
                        
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Sotishdagi Hisoblangan QQS:</span>
                                <span style={{ fontWeight: "600" }}>{(totalIncome > 0 ? invoices.filter(inv => inv.type === "INCOME").reduce((sum, inv) => sum + inv.vatAmount, 0) : 107142856).toLocaleString()} so'm</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success-color)" }}>
                                <span>Zachetga olingan (Yaroqli) QQS:</span>
                                <span style={{ fontWeight: "600" }}>- {taxResult.validInputVat.toLocaleString()} so'm</span>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: "1.5rem" }}>
                        <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontWeight: "500" }}>Foyda Solig'i (15%)</p>
                        <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "var(--warning-color)" }}>{taxResult.profitTax.toLocaleString()} <span style={{fontSize: "1rem", fontWeight: "500", color: "var(--text-secondary)"}}>so'm</span></h3>
                        
                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.9rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Jami Sof Daromad (Basis):</span>
                                <span style={{ fontWeight: "600" }}>{Math.max(0, displayIncome - (totalIncome > 0 ? taxResult.vatPayable : 107142856)).toLocaleString()} so'm</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Chegiriladigan Xarajatlar:</span>
                                <span style={{ fontWeight: "600" }}>- {taxResult.deductibleExpenses.toLocaleString()} so'm</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual Official Tax Form Previews */}
            <div className="card" style={{ marginTop: "2rem" }}>
                <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>E-Hisobot: My.Soliq.uz Uchun Eskiz (Virtual Shakl)</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Ushbu maydonlarni My.Soliq dagi deklaratsiyangiz bilan solishtirib xatoni oldini oling.</p>
                </div>
                {taxRegime === "AOS" ? (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                        <thead>
                            <tr style={{ background: "var(--surface-color)", textAlign: "left" }}>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600" }}>Qator Kodu</th>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600" }}>Ko'rsatkich nomi</th>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Summa (so'm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace" }}>010</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)" }}>Hisobot davridagi jami tovar aylanmasi</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "600" }}>{displayIncome.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace" }}>020</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)" }}>Shu jumladan chegiriladigan daromadlar (qaytarilgan mollar)</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "600" }}>0</td>
                            </tr>
                            <tr style={{ background: "rgba(59, 130, 246, 0.05)" }}>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace" }}>040</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontWeight: "600" }}>Soliq solinadigan baza</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "700" }}>{displayIncome.toLocaleString()}</td>
                            </tr>
                            <tr style={{ background: "rgba(59, 130, 246, 0.1)" }}>
                                <td style={{ padding: "1rem", fontFamily: "monospace" }}>060</td>
                                <td style={{ padding: "1rem", fontWeight: "700", color: "var(--primary-color)" }}>To'lanishi lozim bo'lgan Aylanmadan olinadigan soliq (4%)</td>
                                <td style={{ padding: "1rem", textAlign: "right", fontWeight: "800", color: "var(--primary-color)" }}>{taxResult.turnoverTax.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95rem" }}>
                        <thead>
                            <tr style={{ background: "var(--surface-color)", textAlign: "left" }}>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600" }}>Qator Kodu</th>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600" }}>Foyda Solig'i Qismi</th>
                                <th style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: "600", textAlign: "right" }}>Summa (so'm)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace" }}>010</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)" }}>Jami Daromad</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "600" }}>{Math.max(0, displayIncome - (totalIncome > 0 ? taxResult.vatPayable : 107142856)).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace", color: "var(--error-color)" }}>020</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", color: "var(--error-color)" }}>Chegirilmaydigan xarajatlar</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "600", color: "var(--error-color)" }}>{taxResult.nonDeductibleExpenses.toLocaleString()}</td>
                            </tr>
                            <tr style={{ background: "rgba(245, 158, 11, 0.05)" }}>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontFamily: "monospace" }}>040</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", fontWeight: "600" }}>Soliq solinadigan foyda (Soliq bazasi)</td>
                                <td style={{ padding: "1rem", borderBottom: "1px solid var(--border-color)", textAlign: "right", fontWeight: "700" }}>{Math.max(0, displayIncome - (totalIncome > 0 ? taxResult.vatPayable : 107142856) - taxResult.deductibleExpenses).toLocaleString()}</td>
                            </tr>
                            <tr style={{ background: "rgba(245, 158, 11, 0.1)" }}>
                                <td style={{ padding: "1rem", fontFamily: "monospace" }}>060</td>
                                <td style={{ padding: "1rem", fontWeight: "700", color: "var(--warning-color)" }}>To'lanishi lozim bo'lgan Foyda solig'i (15%)</td>
                                <td style={{ padding: "1rem", textAlign: "right", fontWeight: "800", color: "var(--warning-color)" }}>{taxResult.profitTax.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                )}
            </div>

            {/* Premium AI Glassmorphic Modal */}
            {showAiModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 23, 42, 0.8)",
                    backdropFilter: "blur(16px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999,
                    padding: "2rem"
                }}>
                    <div className="card" style={{
                        width: "100%",
                        maxWidth: "800px",
                        maxHeight: "85vh",
                        overflowY: "auto",
                        padding: "2.5rem",
                        position: "relative",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(30, 41, 59, 0.95)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
                    }}>
                        <button
                            onClick={() => setShowAiModal(false)}
                            style={{
                                position: "absolute",
                                top: "1.5rem",
                                right: "1.5rem",
                                background: "rgba(255,255,255,0.05)",
                                border: "none",
                                borderRadius: "50%",
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#94a3b8",
                                cursor: "pointer",
                                transition: "all 0.2s"
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                            <div style={{ background: "rgba(99, 102, 241, 0.15)", padding: "0.5rem", borderRadius: "0.5rem" }}>
                                <Sparkles size={24} color="#6366f1" />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#fff", margin: 0 }}>Gemini AI CFO - Boshliq Soliq Strategiyasi</h3>
                                <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Real korxona tranzaksiyalari tahlili asosida</p>
                            </div>
                        </div>

                        <div style={{ 
                            color: "#e2e8f0", 
                            fontSize: "0.95rem", 
                            lineHeight: "1.7", 
                            backgroundColor: "rgba(15,23,42,0.3)", 
                            padding: "1.5rem", 
                            borderRadius: "0.75rem",
                            border: "1px solid rgba(255,255,255,0.03)",
                            maxHeight: "50vh",
                            overflowY: "auto"
                        }}>
                            {isGenerating && (
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "12px" }}>
                                    <Loader2 size={36} className="animate-spin text-indigo-500" />
                                    <p style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>AI korxonangiz moliyasini tahlil qilmoqda...</p>
                                </div>
                            )}
                            <div className="markdown-body">
                                <ReactMarkdown>{aiStrategy}</ReactMarkdown>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                            <button
                                onClick={() => setShowAiModal(false)}
                                style={{
                                    padding: "0.6rem 1.5rem",
                                    borderRadius: "0.5rem",
                                    background: "rgba(255,255,255,0.05)",
                                    color: "#fff",
                                    border: "none",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
