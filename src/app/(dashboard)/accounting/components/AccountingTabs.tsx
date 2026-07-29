"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownRight, RefreshCcw, PieChart, BarChart3, FileText, FileSpreadsheet } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import ExportButtons from "./ExportButtons";
import AccountingActions from "./AccountingActions";
import AccountingTable from "./AccountingTable";
import ExcelSpreadsheet from "./ExcelSpreadsheet";
import TaxesDashboard from "./TaxesDashboard";
import { Calculator, Sparkles } from "lucide-react";
import AiBankImport from "./AiBankImport";

type Props = {
    transactions: any[];
    employees: any[];
    balanceData: {
        assets: number;
        inventoryValue: number;
        cashBalance: number;
        liabilities: number;
        equity: number;
        totalInvestment: number;
        retainedEarnings: number;
    };
    pnlData: {
        totalIncome: number;
        totalExpense: number;
        netProfit: number;
        grossProfit: number; // Assuming same for now
        taxExpenses: number;
    }
};

export default function AccountingTabs({ transactions, employees, balanceData, pnlData }: Props) {
    const [activeTab, setActiveTab] = useState<"transactions" | "balance" | "pnl" | "taxes" | "excel" | "ai-import">("transactions");

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Buxgalteriya va Moliya</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>BHMS va Xalqaro standartlar asosidagi moliyaviy hisobotlar.</p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <ExportButtons transactions={transactions} />
                    <AccountingActions />
                </div>
            </div>

            {/* Tabs Navigation */}
            <div style={{ 
                display: "flex", 
                gap: "0.5rem", 
                borderBottom: "1px solid var(--border-color)", 
                marginBottom: "2rem",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                paddingBottom: "1px",
                maxWidth: "100%"
            }}>
                <button
                    onClick={() => setActiveTab("transactions")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "transactions" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "transactions" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={RefreshCcw} size={18} isActive={activeTab === "transactions"} /> Kesh-Flou
                </button>
                <button
                    onClick={() => setActiveTab("balance")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "balance" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "balance" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={PieChart} size={18} isActive={activeTab === "balance"} /> 1-shakl: Balans
                </button>
                <button
                    onClick={() => setActiveTab("pnl")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "pnl" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "pnl" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={BarChart3} size={18} isActive={activeTab === "pnl"} /> 2-shakl: P&L
                </button>
                <button
                    onClick={() => setActiveTab("taxes")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "taxes" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "taxes" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={Calculator} size={18} isActive={activeTab === "taxes"} /> Soliq va Deklaratsiya
                </button>
                <button
                    onClick={() => setActiveTab("excel")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "excel" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "excel" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={FileSpreadsheet} size={18} isActive={activeTab === "excel"} /> Excel
                </button>
                <button
                    onClick={() => setActiveTab("ai-import")}
                    style={{ padding: "0.75rem 1rem", border: "none", background: "transparent", borderBottom: activeTab === "ai-import" ? "2px solid var(--primary-color)" : "2px solid transparent", color: activeTab === "ai-import" ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}
                >
                    <EnhancedIcon icon={Sparkles} size={18} isActive={activeTab === "ai-import"} /> AI Bank Import
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === "transactions" && (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                        <div className="card" style={{ padding: "1.25rem" }}>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Joriy Balans</p>
                            <h3 style={{ fontSize: "1.75rem", fontWeight: "700", color: balanceData.cashBalance >= 0 ? "var(--success-color)" : "var(--error-color)" }}>
                                {balanceData.cashBalance.toLocaleString()} <span style={{ fontSize: "0.8rem", fontWeight: "400" }}>so'm</span>
                            </h3>
                        </div>
                        <div className="card" style={{ padding: "1.25rem" }}>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Jami Kirimlar</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success-color)" }}>
                                <EnhancedIcon icon={ArrowUpRight} size={24} color="var(--success-color)" />
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{pnlData.totalIncome.toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="card" style={{ padding: "1.25rem" }}>
                            <p style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.9rem" }}>Jami Chiqimlar</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--error-color)" }}>
                                <EnhancedIcon icon={ArrowDownRight} size={24} color="var(--error-color)" />
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{pnlData.totalExpense.toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                    <AccountingTable initialTransactions={transactions} />
                </div>
            )}

            {activeTab === "balance" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "2rem" }}>
                    <div className="card" style={{ borderTop: "4px solid var(--primary-color)" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem", color: "var(--primary-color)" }}>AKTIVLAR (Assets)</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Uzoq muddatli aktivlar (Asosiy vositalar)</span>
                                <span style={{ fontWeight: "600" }}>{balanceData.inventoryValue.toLocaleString()} so'm</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                                <span style={{ color: "var(--text-secondary)" }}>Joriy aktivlar (Pul mablag'lari)</span>
                                <span style={{ fontWeight: "600" }}>{balanceData.cashBalance.toLocaleString()} so'm</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "2px solid var(--border-color)" }}>
                                <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>JAMI AKTIVLAR</span>
                                <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--primary-color)" }}>{balanceData.assets.toLocaleString()} so'm</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="card" style={{ borderTop: "4px solid var(--warning-color)" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem", color: "var(--warning-color)" }}>XUSUSIY KAPITAL (Equity)</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>Ustav kapitali (Investorlar sarmoyasi)</span>
                                    <span style={{ fontWeight: "600" }}>{balanceData.totalInvestment.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>Taqsimlanmagan foyda (Retained Earnings)</span>
                                    <span style={{ fontWeight: "600" }}>{balanceData.retainedEarnings.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "2px solid var(--border-color)" }}>
                                    <span style={{ fontWeight: "700" }}>Jami Kapital</span>
                                    <span style={{ fontWeight: "700", color: "var(--warning-color)" }}>{balanceData.equity.toLocaleString()} so'm</span>
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ borderTop: "4px solid var(--error-color)" }}>
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "700", marginBottom: "1.5rem", color: "var(--error-color)" }}>MAJBURIYATLAR (Liabilities)</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed var(--border-color)" }}>
                                    <span style={{ color: "var(--text-secondary)" }}>Joriy majburiyatlar (Xodimlar oyligi, soliqlar)</span>
                                    <span style={{ fontWeight: "600" }}>{balanceData.liabilities.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "2px solid var(--border-color)" }}>
                                    <span style={{ fontWeight: "700" }}>Jami Majburiyatlar</span>
                                    <span style={{ fontWeight: "700", color: "var(--error-color)" }}>{balanceData.liabilities.toLocaleString()} so'm</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: "1.5rem", backgroundColor: "var(--surface-color)", borderRadius: "var(--radius-lg)", border: "2px dashed var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: "700", fontSize: "1.1rem" }}>KAPITAL VA MAJBURIYATLAR</span>
                            <span style={{ fontWeight: "700", fontSize: "1.1rem", color: "var(--primary-color)" }}>{(balanceData.equity + balanceData.liabilities).toLocaleString()} so'm</span>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "pnl" && (
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                    <div className="card">
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Moliyaviy Natijalar To'g'risida Hisobot (2-shakl)</h3>
                            <p style={{ color: "var(--text-secondary)" }}>Joriy davr uchun (Daromad va Xarajatlar)</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {/* Daromadlar */}
                            <div>
                                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--success-color)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Daromadlar (Kirimlar)</h4>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "var(--text-secondary)" }}>
                                    <span>Asosiy faoliyatdan sof tushum (Sotishdan tushum)</span>
                                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{pnlData.totalIncome.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderTop: "1px solid var(--border-color)", fontWeight: "700" }}>
                                    <span>YALPI FOYDA (Gross Profit)</span>
                                    <span>{pnlData.grossProfit.toLocaleString()} so'm</span>
                                </div>
                            </div>

                            {/* Xarajatlar */}
                            <div>
                                <h4 style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--error-color)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Davr Xarajatlari</h4>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "var(--text-secondary)" }}>
                                    <span>Ma'muriy va operatsion xarajatlar</span>
                                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{(pnlData.totalExpense - pnlData.taxExpenses).toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", color: "var(--text-secondary)" }}>
                                    <span>Soliq xarajatlari (Ijtimoiy, daromad va h.k)</span>
                                    <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>{pnlData.taxExpenses.toLocaleString()} so'm</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "1rem 0", borderTop: "1px solid var(--border-color)", fontWeight: "700" }}>
                                    <span>JAMI XARAJATLAR</span>
                                    <span>{pnlData.totalExpense.toLocaleString()} so'm</span>
                                </div>
                            </div>

                            {/* Sof Foyda */}
                            <div style={{ backgroundColor: pnlData.netProfit >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", padding: "1.5rem", borderRadius: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                                <span style={{ fontSize: "1.25rem", fontWeight: "700", color: pnlData.netProfit >= 0 ? "var(--success-color)" : "var(--error-color)" }}>
                                    {pnlData.netProfit >= 0 ? "SOF FOYDA (Net Profit)" : "SOF ZARAR (Net Loss)"}
                                </span>
                                <span style={{ fontSize: "1.5rem", fontWeight: "800", color: pnlData.netProfit >= 0 ? "var(--success-color)" : "var(--error-color)" }}>
                                    {pnlData.netProfit.toLocaleString()} so'm
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "taxes" && (
                <TaxesDashboard transactions={transactions} employees={employees} />
            )}

            {activeTab === "excel" && (
                <ExcelSpreadsheet transactions={transactions} />
            )}

            {activeTab === "ai-import" && (
                <AiBankImport />
            )}
        </div>
    );
}
