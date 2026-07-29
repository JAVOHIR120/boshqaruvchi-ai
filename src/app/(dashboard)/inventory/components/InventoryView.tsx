"use client";

import { useState } from "react";
import { Search, Archive, Calculator, AlertCircle, TrendingDown, TrendingUp, CheckCircle, Info } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import InventoryRowActions from "./InventoryRowActions";
import { calculateDepreciation } from "@/lib/taxEngine";

type Props = {
    items: any[];
    audits: any[];
    totalItems: number;
    totalValue: number;
    brokenItemsCount: number;
    totalShortage: number;
    totalSurplus: number;
    totalDepreciation: number;
    totalResidualValue: number;
    itParkResident: boolean;
};

// Amortizatsiyani hisoblash funksiyasi (O'zbekiston Soliq Kodeksi 306-308 modda asosida)
function calcDepreciation(item: any, isItParkResident: boolean = false) {
    const result = calculateDepreciation({
        price: item.price,
        quantity: item.quantity,
        purchaseDate: new Date(item.purchaseDate || item.createdAt),
        modernizationCosts: item.modernizationCosts,
        amortizationRate: item.amortizationRate,
        amortizationGroup: item.amortizationGroup ?? undefined,
        itParkResident: isItParkResident,
        category: item.category
    });

    return { 
        depreciation: result.totalDepreciation, 
        residual: result.residualValue,
        depPercent: result.baseValue > 0 ? Math.round((result.totalDepreciation / result.baseValue) * 100) : 0,
        monthly: result.monthlyDepreciation,
        base: result.baseValue
    };
}

export default function InventoryView({ items, audits, totalItems, totalValue, brokenItemsCount, totalShortage, totalSurplus, totalDepreciation, totalResidualValue, itParkResident }: Props) {
    const [activeTab, setActiveTab] = useState<"ITEMS" | "AUDITS">("ITEMS");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAudits = audits.filter(audit =>
        audit.inventoryItem?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.auditedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Stats Overview */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={Archive} 
                            size={24} 
                            color="var(--primary-color)" 
                            glowColor="rgba(59, 130, 246, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Jami Mulklar</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{totalItems}</h3>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={Calculator} 
                            size={24} 
                            color="var(--success-color)" 
                            glowColor="rgba(16, 185, 129, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Boshl. Qiymat</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700" }}>{totalValue.toLocaleString()} <span style={{ fontSize: "0.75rem", fontWeight: "400" }}>UZS</span></h3>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={TrendingDown} 
                            size={24} 
                            color="var(--warning-color)" 
                            glowColor="rgba(245, 158, 11, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>📉 Jami Eskirish</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--warning-color)" }}>−{totalDepreciation.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={Calculator} 
                            size={24} 
                            color="#60a5fa" 
                            glowColor="rgba(59, 130, 246, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Qoldiq Qiymat</p>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#60a5fa" }}>{totalResidualValue.toLocaleString()}</h3>
                    </div>
                </div>

                <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem" }}>
                    <div>
                        <EnhancedIcon 
                            icon={AlertCircle} 
                            size={24} 
                            color="var(--error-color)" 
                            glowColor="rgba(239, 68, 68, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "0.25rem" }}>Kamomad / Ortiqcha</p>
                        <h3 style={{ fontSize: "1rem", fontWeight: "700" }}>
                            <span style={{ color: "var(--error-color)" }}>−{totalShortage}</span> / <span style={{ color: "var(--success-color)" }}>+{totalSurplus}</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Main Tabs Container */}
            <div className="card" style={{ overflowX: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1.25rem" }}>

                    {/* Tabs Navigation */}
                    <div style={{ display: "flex", gap: "0.35rem", background: "rgba(var(--bg-rgb), 0.5)", padding: "0.25rem", borderRadius: "100px", maxWidth: "100%", overflowX: "auto" }}>
                        <button
                            onClick={() => setActiveTab("ITEMS")}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "100px",
                                border: "none",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                background: activeTab === "ITEMS" ? "var(--surface-color)" : "transparent",
                                color: activeTab === "ITEMS" ? "var(--text-primary)" : "var(--text-secondary)",
                                boxShadow: activeTab === "ITEMS" ? "0 4px 10px rgba(0,0,0,0.1)" : "none",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Asosiy ro&apos;yxat
                        </button>
                        <button
                            onClick={() => setActiveTab("AUDITS")}
                            style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "100px",
                                border: "none",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                background: activeTab === "AUDITS" ? "var(--surface-color)" : "transparent",
                                color: activeTab === "AUDITS" ? "var(--text-primary)" : "var(--text-secondary)",
                                boxShadow: activeTab === "AUDITS" ? "0 4px 10px rgba(0,0,0,0.1)" : "none",
                                fontSize: "0.85rem",
                                whiteSpace: "nowrap"
                            }}
                        >
                            Tekshiruvlar
                        </button>
                    </div>

                    {/* Search Field */}
                    <div style={{ position: "relative", flex: "1", minWidth: "280px" }}>
                        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                        <input
                            type="text"
                            placeholder={activeTab === "ITEMS" ? "Qidirish..." : "Tekshiruv qidirish..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ padding: "0.6rem 1rem 0.6rem 2.5rem", borderRadius: "100px", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", fontSize: "0.85rem", width: "100%", color: "var(--text-primary)" }}
                        />
                    </div>
                </div>

                {activeTab === "ITEMS" ? (
                    <div className="table-responsive">
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                    <th style={{ padding: "1rem" }}>Mulk Nomi</th>
                                    <th style={{ padding: "1rem" }}>Toifa / Javobgar</th>
                                    <th style={{ padding: "1rem" }}>Joylashuv</th>
                                    <th style={{ padding: "1rem" }}>Miqdori / Narxi</th>
                                    <th style={{ padding: "1rem" }}>Umumiy Summa</th>
                                    <th style={{ padding: "1rem" }}>📉 Amortizatsiya</th>
                                    <th style={{ padding: "1rem", textAlign: "right" }}>Holati & Amallar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.length === 0 ? (
                                    <tr><td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Inventar ro&apos;yxati bo&apos;sh</td></tr>
                                ) : filteredItems.map((item: any) => {
                                    const { depreciation, residual, depPercent } = calcDepreciation(item, itParkResident);
                                    return (
                                        <tr key={item.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s ease" }}>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.name}</div>
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>ID: {item.id.slice(0, 8)}...</div>
                                            </td>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ color: "var(--text-secondary)", marginBottom: "0.25rem" }}>{item.category}</div>
                                                {item.responsible ? (
                                                    <div style={{ fontSize: "0.85rem", display: "inline-flex", background: "rgba(var(--secondary-rgb), 0.1)", color: "var(--primary-color)", padding: "0.2rem 0.5rem", borderRadius: "100px", fontWeight: "500" }}>
                                                        👤 {item.responsible.user.name}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: "0.85rem", display: "inline-flex", background: "rgba(var(--text-secondary-rgb), 0.1)", color: "var(--text-secondary)", padding: "0.2rem 0.5rem", borderRadius: "100px" }}>
                                                        Biriktirilmagan
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{item.location}</td>
                                            <td style={{ padding: "1rem" }}>
                                                <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{item.quantity} ta</div>
                                                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{item.price.toLocaleString()} so&apos;m dan</div>
                                            </td>
                                            <td style={{ padding: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
                                                {(item.quantity * item.price).toLocaleString()} so&apos;m
                                            </td>
                                            <td style={{ padding: "1rem" }}>
                                                {item.amortizationRate > 0 || item.amortizationGroup ? (
                                                    <div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                                            {item.amortizationGroup || `${item.amortizationRate}%`}
                                                        </div>
                                                        <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", marginBottom: "0.35rem", overflow: "hidden" }}>
                                                            <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(depPercent || 0, 100)}%`, background: (depPercent || 0) >= 80 ? "var(--error-color)" : (depPercent || 0) >= 50 ? "var(--warning-color)" : "var(--primary-color)", transition: "width 0.5s ease" }} />
                                                        </div>
                                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                                                            <span style={{ color: "var(--warning-color)" }}>−{depreciation.toLocaleString()}</span>
                                                            <span style={{ color: "#60a5fa", fontWeight: "600" }}>{residual.toLocaleString()}</span>
                                                        </div>
                                                        {itParkResident && (
                                                            <div style={{ fontSize: "0.7rem", color: "var(--primary-color)", marginTop: "0.25rem", fontWeight: "500" }}>
                                                                ⚡ IT Park (Tezlashtirilgan)
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "1rem", textAlign: "right" }}>
                                                <span style={{
                                                    padding: "0.35rem 0.75rem",
                                                    borderRadius: "2rem",
                                                    fontSize: "0.85rem",
                                                    fontWeight: "600",
                                                    backgroundColor: item.status === "YAROQLI" ? "rgba(16, 185, 129, 0.1)" : item.status === "TAMIRTALAB" ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                                    color: item.status === "YAROQLI" ? "var(--success-color)" : item.status === "TAMIRTALAB" ? "var(--warning-color)" : "var(--error-color)"
                                                }}>
                                                    {item.status}
                                                </span>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                                                    So&apos;nggi audit: {new Date(item.lastChecked).toLocaleDateString("uz-UZ")}
                                                </div>
                                                <div style={{ marginTop: "0.75rem" }}>
                                                    <InventoryRowActions item={item} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                    <th style={{ padding: "1rem" }}>Sana</th>
                                    <th style={{ padding: "1rem" }}>Mulk Nomi</th>
                                    <th style={{ padding: "1rem" }}>Buxgalteriya qoldig&apos;i</th>
                                    <th style={{ padding: "1rem" }}>Haqiqiy qoldiq</th>
                                    <th style={{ padding: "1rem" }}>Farq (Kamomad/Ortiqcha)</th>
                                    <th style={{ padding: "1rem" }}>Komissiya a&apos;zosi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAudits.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-secondary)" }}>Dalolatnomalar (Audit) qaydlari topilmadi. Inventarizatsiya qilishni boshlang.</td></tr>
                                ) : filteredAudits.map((audit: any) => (
                                    <tr key={audit.id} style={{ borderBottom: "1px solid var(--border-color)", transition: "background 0.2s ease" }}>
                                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                                            {new Date(audit.date).toLocaleString("uz-UZ", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td style={{ padding: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
                                            {audit.inventoryItem?.name || "O'chirilgan mulk"}
                                        </td>
                                        <td style={{ padding: "1rem", color: "var(--text-primary)" }}>{audit.expectedQuantity} ta</td>
                                        <td style={{ padding: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>{audit.actualQuantity} ta</td>
                                        <td style={{ padding: "1rem" }}>
                                            {audit.difference === 0 ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--success-color)", background: "rgba(16, 185, 129, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600" }}>
                                                    <CheckCircle size={14} /> To&apos;g&apos;ri chiqdi
                                                </span>
                                            ) : audit.difference < 0 ? (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--error-color)", background: "rgba(239, 68, 68, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600" }}>
                                                    <TrendingDown size={14} /> Kamomad: {Math.abs(audit.difference)} ta
                                                </span>
                                            ) : (
                                                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--primary-color)", background: "rgba(59, 130, 246, 0.1)", padding: "0.25rem 0.75rem", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600" }}>
                                                    <TrendingUp size={14} /> Ortiqcha: {audit.difference} ta
                                                </span>
                                            )}
                                            {audit.notes && (
                                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.5rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={audit.notes}>
                                                    &quot;{audit.notes}&quot;
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>{audit.auditedBy}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
