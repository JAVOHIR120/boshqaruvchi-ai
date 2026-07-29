"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Calculator, TrendingUp, Users, Building2, Briefcase, Landmark,
    PieChart, ArrowUpRight, ArrowDownRight, ChevronDown, Wine,
    Mountain, Gem, Droplets, MapPin, Settings2, Coins
} from "lucide-react";
import {
    TAX_DEFINITIONS, ENTERPRISE_TYPES, ENTERPRISE_TAX_MAP,
    AKSIZ_RATES, SUV_RATES, YER_RATES, RENTA_RATES, YER_QARI_RATES,
    AYLANMA_RATES, BHM, FIX_AYLANMA,
    computeTaxes, totalTaxAmount,
    type TaxType, type EnterpriseType, type TaxBaseData, type TaxToggleState, type TaxSelectParams
} from "@/lib/taxEngine";
import TaxAdvisor from "./TaxAdvisor";
import TaxCalendarAdvanced from "./TaxCalendarAdvanced";
import TaxAnalytics from "./TaxAnalytics";
import TaxPaymentGateway from "./TaxPaymentGateway";
import TaxEImzoManager from "./TaxEImzoManager";
import PremiumSelect, { type PremiumSelectOption } from "./PremiumSelect";
import styles from "../page.module.css";

const ICON_MAP: Record<string, React.ReactNode> = {
    Landmark: <Landmark size={18} />,
    Wine: <Wine size={18} />,
    TrendingUp: <TrendingUp size={18} />,
    Users: <Users size={18} />,
    Mountain: <Mountain size={18} />,
    Gem: <Gem size={18} />,
    Droplets: <Droplets size={18} />,
    Building2: <Building2 size={18} />,
    MapPin: <MapPin size={18} />,
    Briefcase: <Briefcase size={18} />,
    Coins: <Coins size={18} />,
    PieChart: <PieChart size={18} />
};

const LS_KEY = "boshqaruvchi_tax_state";

function loadState() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function saveState(state: object) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* */ }
}

const selectStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.8rem", borderRadius: "10px",
    border: "1px solid var(--border-color)", background: "var(--background-color)",
    color: "var(--text-primary)", fontSize: "0.85rem", outline: "none",
    cursor: "pointer", fontWeight: "500",
    transition: "all 0.2s",
};

const numInputStyle: React.CSSProperties = {
    flex: 1, padding: "0.6rem 0.8rem", borderRadius: "10px",
    border: "1px solid var(--border-color)", background: "var(--background-color)",
    color: "var(--text-primary)", fontSize: "0.85rem", fontWeight: "600",
    outline: "none", minWidth: "70px",
    transition: "all 0.2s",
};

const optionStyle: React.CSSProperties = {
    background: "#1a1a2e", color: "var(--text-primary)", padding: "8px",
    fontSize: "0.8rem",
};

export default function TaxAutoCalculator({ data }: { data: TaxBaseData }) {
    const [enterpriseType, setEnterpriseType] = useState<EnterpriseType>("MCHJ_YIRIK");
    const [toggles, setToggles] = useState<TaxToggleState>({});
    const [params, setParams] = useState<TaxSelectParams>({});
    const [showDropdown, setShowDropdown] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Load
    useEffect(() => {
        const saved = loadState();
        if (saved) {
            if (saved.enterpriseType) setEnterpriseType(saved.enterpriseType);
            if (saved.toggles) setToggles(saved.toggles);
            if (saved.params) setParams(saved.params);
        } else {
            // Default: MCHJ_YIRIK
            const newToggles: TaxToggleState = {};
            TAX_DEFINITIONS.forEach(d => {
                newToggles[d.id] = ENTERPRISE_TAX_MAP["MCHJ_YIRIK"].includes(d.id);
            });
            setToggles(newToggles);
        }
        setMounted(true);
    }, []);

    // Save
    useEffect(() => {
        if (!mounted) return;
        saveState({ enterpriseType, toggles, params });
    }, [enterpriseType, toggles, params, mounted]);

    const handleEnterpriseChange = useCallback((ent: EnterpriseType) => {
        setEnterpriseType(ent);
        const newToggles: TaxToggleState = {};
        TAX_DEFINITIONS.forEach(d => {
            newToggles[d.id] = ENTERPRISE_TAX_MAP[ent].includes(d.id);
        });
        setToggles(newToggles);
        setShowDropdown(false);
    }, []);

    const handleToggle = useCallback((taxId: TaxType) => {
        setToggles(prev => ({ ...prev, [taxId]: !prev[taxId] }));
    }, []);

    const updateParam = useCallback((key: keyof TaxSelectParams, value: string | number) => {
        setParams(prev => ({ ...prev, [key]: value }));
    }, []);

    // Compute
    const computed = useMemo(
        () => computeTaxes(data, toggles, params),
        [data, toggles, params]
    );
    const total = useMemo(() => totalTaxAmount(computed), [computed]);

    const isKichikBiznes = enterpriseType === "MCHJ_KICHIK";
    const grandTotal = total;
    const taxBurdenPct = data.totalIncome > 0 ? ((grandTotal / data.totalIncome) * 100).toFixed(1) : "0.0";
    const enabledCount = Object.values(toggles).filter(Boolean).length;
    const maxAmount = Math.max(...computed.map(c => c.amount), 1);
    const selectedEnterprise = ENTERPRISE_TYPES.find(e => e.id === enterpriseType);

    if (!mounted) return null;

    // ─── Render select_rate input panel per tax type ───
    const renderSelectPanel = (taxId: TaxType) => {
        switch (taxId) {
            case "AKSIZ": {
                const groups = [...new Set(AKSIZ_RATES.map(a => a.category))];
                const options: PremiumSelectOption[] = groups.map(g => ({
                    groupLabel: g,
                    items: AKSIZ_RATES.filter(a => a.category === g).map(a => ({
                        id: a.id,
                        label: `${a.name} — ${a.rate.toLocaleString()} so'm/${a.unit}`
                    }))
                }));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <PremiumSelect
                            value={params.aksizItemId || ""}
                            onChange={v => updateParam("aksizItemId", v)}
                            options={options}
                            placeholder="Tovar turini tanlang"
                        />
                        {params.aksizItemId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <input
                                    type="number"
                                    value={params.aksizQuantity || ""}
                                    onChange={e => updateParam("aksizQuantity", Number(e.target.value) || 0)}
                                    placeholder={`Miqdor (${AKSIZ_RATES.find(a => a.id === params.aksizItemId)?.unit || ''})`}
                                    style={numInputStyle}
                                />
                                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                    {AKSIZ_RATES.find(a => a.id === params.aksizItemId)?.unit}
                                </span>
                            </div>
                        )}
                    </div>
                );
            }

            case "SUV": {
                const options: PremiumSelectOption[] = SUV_RATES.map(s => ({
                    id: s.id,
                    label: `${s.name} — ${s.rateYerUsti}/${s.rateYerOsti} so'm/m³`
                }));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <PremiumSelect
                            value={params.suvItemId || ""}
                            onChange={v => updateParam("suvItemId", v)}
                            options={options}
                            placeholder="Foydalanish turini tanlang"
                        />
                        {params.suvItemId && (
                            <>
                                <div style={{ display: "flex", gap: "0.4rem" }}>
                                    {(["yer_usti", "yer_osti"] as const).map(src => (
                                        <button
                                            key={src}
                                            onClick={() => updateParam("suvSource", src)}
                                            style={{
                                                flex: 1, padding: "0.35rem 0.5rem", borderRadius: "6px",
                                                border: "1px solid var(--border-color)",
                                                background: params.suvSource === src ? "rgba(6,182,212,0.2)" : "rgba(0,0,0,0.15)",
                                                color: params.suvSource === src ? "#06b6d4" : "var(--text-secondary)",
                                                cursor: "pointer", fontSize: "0.8rem", fontWeight: "600",
                                            }}
                                        >
                                            {src === "yer_usti" ? "Yer usti" : "Yer osti"}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <input
                                        type="number"
                                        value={params.suvQuantity || ""}
                                        onChange={e => updateParam("suvQuantity", Number(e.target.value) || 0)}
                                        placeholder="Hajm"
                                        style={numInputStyle}
                                    />
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>m³</span>
                                </div>
                            </>
                        )}
                    </div>
                );
            }

            case "YER": {
                const options: PremiumSelectOption[] = YER_RATES.map(y => ({
                    id: y.id,
                    label: `${y.name} — ${y.rate} mln so'm/ga`
                }));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <PremiumSelect
                            value={params.yerItemId || ""}
                            onChange={v => updateParam("yerItemId", v)}
                            options={options}
                            placeholder="Hududni tanlang"
                        />
                        {params.yerItemId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <input
                                    type="number"
                                    value={params.yerArea || ""}
                                    onChange={e => updateParam("yerArea", Number(e.target.value) || 0)}
                                    placeholder="Maydon"
                                    step="0.01"
                                    style={numInputStyle}
                                />
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>gektar</span>
                            </div>
                        )}
                    </div>
                );
            }

            case "RENTA": {
                const groups = [...new Set(RENTA_RATES.map(r => r.group))];
                const options: PremiumSelectOption[] = groups.map(g => ({
                    groupLabel: g,
                    items: RENTA_RATES.filter(r => r.group === g).map(r => ({
                        id: r.id,
                        label: `${r.name} — ${r.rate}%`
                    }))
                }));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <PremiumSelect
                            value={params.rentaItemId || ""}
                            onChange={v => updateParam("rentaItemId", v)}
                            options={options}
                            placeholder="Qazilma turini tanlang"
                        />
                        {params.rentaItemId && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <input
                                    type="number"
                                    value={params.rentaRevenue || ""}
                                    onChange={e => updateParam("rentaRevenue", Number(e.target.value) || 0)}
                                    placeholder="Realizatsiya tushumi"
                                    style={numInputStyle}
                                />
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>so&apos;m</span>
                            </div>
                        )}
                    </div>
                );
            }

            case "YER_QARI": {
                const options: PremiumSelectOption[] = YER_QARI_RATES.map(y => ({
                    id: y.id,
                    label: `${y.name} — ${y.rate} ${y.unit}`
                }));
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                        <PremiumSelect
                            value={params.yerQariItemId || ""}
                            onChange={v => updateParam("yerQariItemId", v)}
                            options={options}
                            placeholder="Foydalanish turini tanlang"
                        />
                        {params.yerQariItemId && (() => {
                            const item = YER_QARI_RATES.find(y => y.id === params.yerQariItemId);
                            if (!item) return null;
                            if (item.unit === "BHM") return (
                                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", padding: "0.4rem 0.6rem", borderRadius: "6px", background: "rgba(120,113,108,0.1)" }}>
                                    {item.rate} BHM × {BHM.toLocaleString()} so&apos;m = <strong style={{ color: "var(--text-primary)" }}>{(item.rate * BHM).toLocaleString()} so&apos;m</strong>
                                </div>
                            );
                            return (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <input
                                        type="number"
                                        value={params.yerQariValue || ""}
                                        onChange={e => updateParam("yerQariValue", Number(e.target.value) || 0)}
                                        placeholder="Realizatsiya tushumi"
                                        style={numInputStyle}
                                    />
                                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>so&apos;m</span>
                                </div>
                            );
                        })()}
                    </div>
                );
            }

            default:
                return null;
        }
    };

    return (
        <div style={{ marginBottom: "1.5rem" }}>
            {/* ═══ TOP STATS BANNER ═══ */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem",
                marginBottom: "1.25rem",
            }}>
                {/* Jami soliq */}
                <div style={{
                    padding: "1.5rem", borderRadius: "16px",
                    background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.08) 100%)",
                    border: "1px solid rgba(59,130,246,0.2)",
                    display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <Calculator size={18} color="var(--primary-color)" />
                        <span style={{ fontSize: "0.8rem", color: "#93c5fd", fontWeight: "500" }}>Jami oylik soliq yuki</span>
                    </div>
                    <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", fontWeight: "800", color: "var(--text-primary)", margin: 0, lineHeight: 1.1 }}>
                        {grandTotal.toLocaleString()}
                        <span style={{ fontSize: "0.8rem", fontWeight: "400", color: "var(--text-secondary)", marginLeft: "0.35rem" }}>so&apos;m</span>
                    </h2>
                    <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.5rem" }}>
                        {enabledCount} ta soliq yoqilgan · SK (30.12.2019)
                    </p>
                </div>

                {/* Daromad vs Xarajat */}
                <div style={{
                    padding: "1.5rem", borderRadius: "16px",
                    border: "1px solid var(--border-color)", background: "var(--surface-color)",
                    display: "flex", flexDirection: "column", justifyContent: "space-between",
                    gap: "0.75rem"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Daromad</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--success-color)" }}>
                            <ArrowUpRight size={14} />
                            <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{data.totalIncome.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Xarajat</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--error-color)" }}>
                            <ArrowDownRight size={14} />
                            <span style={{ fontSize: "0.75rem", fontWeight: "600" }}>{data.totalExpense.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{
                        padding: "0.5rem 0.75rem", borderRadius: "8px",
                        background: data.netProfit > 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        display: "flex", justifyContent: "space-between",
                    }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-primary)" }}>Sof foyda</span>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: data.netProfit > 0 ? "var(--success-color)" : "var(--error-color)" }}>
                            {data.netProfit.toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Soliq yuki % */}
                <div style={{
                    padding: "1.5rem", borderRadius: "16px",
                    border: "1px solid var(--border-color)", background: "var(--surface-color)",
                    display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                }}>
                    <PieChart size={28} color="#8b5cf6" style={{ marginBottom: "0.5rem" }} />
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>Soliq yuki</span>
                    <h3 style={{ fontSize: "2rem", fontWeight: "800", color: "#8b5cf6", margin: 0 }}>{taxBurdenPct}%</h3>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>Tushumga nisbatan</span>
                </div>
            </div>

            {/* ═══ ENTERPRISE TYPE SELECTOR ═══ */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: "1", minWidth: "250px" }}>
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        style={{
                            width: "100%", padding: "0.75rem 1rem", borderRadius: "12px",
                            border: "1px solid var(--border-color)", background: "var(--surface-color)",
                            color: "var(--text-primary)", cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "space-between",
                            fontSize: "0.9rem", fontWeight: "600", transition: "all 0.2s",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Settings2 size={16} color="var(--primary-color)" />
                            <span>{selectedEnterprise?.label}</span>
                            <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: "400" }}>— {selectedEnterprise?.description}</span>
                        </div>
                        <ChevronDown size={16} style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }} />
                    </button>
                    {showDropdown && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                            borderRadius: "12px", border: "1px solid var(--border-color)",
                            background: "var(--surface-color)", zIndex: 50,
                            boxShadow: "0 12px 40px rgba(0,0,0,0.35)", overflow: "hidden",
                        }}>
                            {ENTERPRISE_TYPES.map(e => (
                                <button
                                    key={e.id}
                                    onClick={() => handleEnterpriseChange(e.id)}
                                    style={{
                                        width: "100%", padding: "0.7rem 1rem",
                                        background: e.id === enterpriseType ? "rgba(59,130,246,0.1)" : "transparent",
                                        border: "none", cursor: "pointer", display: "flex",
                                        flexDirection: "column", gap: "0.15rem", textAlign: "left",
                                        color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={ev => ev.currentTarget.style.background = "rgba(59,130,246,0.08)"}
                                    onMouseLeave={ev => ev.currentTarget.style.background = e.id === enterpriseType ? "rgba(59,130,246,0.1)" : "transparent"}
                                >
                                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{e.id === enterpriseType ? "✓ " : ""}{e.label}</span>
                                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{e.description}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ TAX CARDS GRID ═══ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 280px), 1fr))", gap: "0.75rem" }}>
                {TAX_DEFINITIONS.map(def => {
                    const isEnabled = !!toggles[def.id];
                    const computedItem = computed.find(c => c.id === def.id);
                    const amount = computedItem?.amount || 0;
                    const pct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                    const hasSelectPanel = def.inputType === "select_rate" && isEnabled;

                    return (
                        <div key={def.id} 
                            className={`${styles.taxCard} ${isEnabled ? styles.taxCardActive : ""}`}
                            style={{
                                opacity: isEnabled ? 1 : 0.55,
                        }}>
                            {/* Accent bar */}
                            <div style={{
                                position: "absolute", top: 0, left: 0, right: 0, height: "3px",
                                background: isEnabled ? `linear-gradient(90deg, ${def.color}, ${def.color}40)` : "var(--border-color)",
                                transition: "all 0.3s",
                            }} />

                            {/* Header: Icon + Name + Toggle */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flex: 1 }}>
                                    <div style={{
                                        width: "36px", height: "36px", borderRadius: "10px",
                                        backgroundColor: `${def.color}15`, color: def.color,
                                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                    }}>
                                        {ICON_MAP[def.icon]}
                                    </div>
                                    <div style={{ minWidth: 0, flex: 1 }}>
                                        <p style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)", margin: 0, marginBottom: "0.2rem" }}>{def.label}</p>
                                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.3 }}>{def.fullName}</p>
                                    </div>
                                </div>
                                {/* Toggle */}
                                <button
                                    onClick={() => handleToggle(def.id)}
                                    style={{
                                        width: "42px", height: "22px", borderRadius: "11px",
                                        background: isEnabled ? def.color : "var(--border-color)",
                                        border: "none", cursor: "pointer", position: "relative",
                                        transition: "background 0.3s", flexShrink: 0, padding: 0,
                                    }}
                                    title={isEnabled ? "O'chirish" : "Yoqish"}
                                >
                                    <div style={{
                                        width: "18px", height: "18px", borderRadius: "50%", background: "white",
                                        position: "absolute", top: "2px", left: isEnabled ? "22px" : "2px",
                                        transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                    }} />
                                </button>
                            </div>

                            {/* Rate badge + Modda */}
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <span style={{
                                    fontSize: "0.75rem", fontWeight: "700", color: def.color,
                                    padding: "0.12rem 0.4rem", borderRadius: "6px", background: `${def.color}15`,
                                }}>{def.rateDisplay}</span>
                                <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontStyle: "italic" }}>📜 {def.modda}</span>
                            </div>

                            {/* SELECT PANEL — dropdown + measurement input */}
                            {hasSelectPanel && (
                                <div style={{
                                    padding: "0.5rem", borderRadius: "8px",
                                    background: `${def.color}06`, border: `1px solid ${def.color}15`,
                                }}>
                                    {renderSelectPanel(def.id)}
                                </div>
                            )}

                            {/* Amount + Progress + Formula */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                        <p style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--text-primary)", margin: 0 }}>
                                            {amount.toLocaleString()}
                                            <span style={{ fontSize: "0.75rem", fontWeight: "400", color: "var(--text-secondary)", marginLeft: "0.3rem" }}>so&apos;m</span>
                                        </p>
                                        <div style={{ height: "4px", borderRadius: "4px", background: "var(--border-color)", overflow: "hidden" }}>
                                            <div style={{
                                                height: "100%", borderRadius: "4px", width: `${pct}%`,
                                                background: def.color, transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                                            }} />
                                        </div>
                                        {computedItem?.formula && (
                                            <div style={{
                                                fontSize: "0.7rem", color: "var(--text-secondary)",
                                                padding: "0.4rem", borderRadius: "8px",
                                                background: `${def.color}10`, borderLeft: `3px solid ${def.color}`,
                                                fontFamily: "monospace", letterSpacing: "-0.02em", marginTop: "auto"
                                            }}>
                                                {computedItem.formula}
                                            </div>
                                        )}
                                    </div>
                        </div>
                    );
                })}
            </div>

            {/* ═══ ADVANCED AI & MULTI-WIDGET ROW ═══ */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))",
                gap: "1.25rem", marginTop: "1.5rem"
            }}>
                {/* AI TAX ADVISOR */}
                <TaxAdvisor data={data} computedTaxes={computed} enterpriseType={enterpriseType} />

                {/* SMART TAX CALENDAR */}
                <TaxCalendarAdvanced computedTaxes={computed} />
            </div>

            {/* ═══ EXTRA PREMIUM SAAS FEATURES (ANALYTICS, PAY, E-IMZO) ═══ */}
            <div style={{ 
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 350px), 1fr))", 
                gap: "1.25rem", marginTop: "1.25rem" 
            }}>
                <TaxAnalytics computedTaxes={computed} totalIncome={data.totalIncome} />
                <TaxPaymentGateway computedTaxes={computed} />
                <TaxEImzoManager computedTaxes={computed} />
            </div>
        </div>
    );
}
