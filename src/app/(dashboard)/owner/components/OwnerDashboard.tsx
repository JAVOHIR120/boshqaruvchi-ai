"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Shield, Users, Database, Settings, BarChart3, DollarSign, FileText,
    Package, Target, CheckSquare, Building2, MessageSquare, Trash2,
    Edit2, Plus, X, AlertTriangle, Crown, Search, UserPlus,
    TrendingUp, TrendingDown, Activity, Lock, Unlock, BookOpen, Video,
    Briefcase, Mail, Calendar, Loader2, Zap, AlertCircle,
    GraduationCap, Link2, UploadCloud, FileDown, Book, Eye, Sparkles,
    Puzzle, ToggleLeft, ToggleRight, Save, ShoppingBag, Calculator,
    Archive, Factory, Bot, Scale
} from "lucide-react";
import toast from "react-hot-toast";
import styles from "../owner.module.css";
import {
    ownerUpdateRole, ownerDeleteUser, ownerCreateUser,
    getTransactionsForOwner, getContractsForOwner, getTaxReportsForOwner,
    getInventoryForOwner, getLeadsForOwner, getTasksForOwner,
    getInvestorsForOwner, getMessagesForOwner, getEmployeesForOwner,
    ownerDeleteTransaction, ownerDeleteContract, ownerDeleteTaxReport,
    ownerDeleteInventoryItem, ownerDeleteLead, ownerDeleteTask, ownerDeleteInvestor,
    ownerPurgeAllTransactions, ownerPurgeAllTaxReports, ownerPurgeAllLeads,
    ownerPurgeAllTasks, ownerPurgeAllMessages,
    getAIPredictions, ownerCreateAcademyVideo, ownerCreateAcademyBook,
    aiAnalyzeYouTubeVideo, aiAnalyzeBookContent,
    getCompaniesWithModules, updateCompanyModules
} from "@/actions/owner";
import { TOGGLEABLE_MODULES, ALWAYS_ENABLED_MODULES, ALL_MODULE_IDS } from "@/lib/modules";
import { supabaseClient } from "@/lib/supabase-client";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell
} from 'recharts';

type Stats = {
    users: { total: number; owner: number; boshliq: number; xodim: number; buxgalter: number };
    transactions: { total: number; income: number; expense: number };
    contracts: { total: number; active: number };
    taxes: { total: number; pending: number; overdue: number };
    inventory: { total: number };
    leads: { total: number; won: number };
    tasks: { total: number; done: number };
    investors: { total: number; totalInvestment: number };
    messages: { total: number; unread: number };
    employees: { total: number };
    academy: { videos: number; books: number };
};

type UserRecord = {
    id: string;
    name: string;
    email: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
};

type EnvStatus = Record<string, boolean>;

type Props = {
    stats: Stats;
    users: UserRecord[];
    envStatus: EnvStatus;
};

const TABS = [
    { id: "overview", label: "Missiya Markazi", icon: Crown },
    { id: "modules", label: "Modul Boshqaruvi", icon: Puzzle },
    { id: "users", label: "Foydalanuvchilar", icon: Users },
    { id: "data", label: "Tizim Ma'lumotlari", icon: Database },
    { id: "academy", label: "Leader Academy", icon: GraduationCap },
    { id: "danger", label: "Xavfli Zona", icon: AlertTriangle },
] as const;

// Modul ikonkalari
const MODULE_ICONS: Record<string, any> = {
    "pos-terminal": ShoppingBag,
    "crm": Target,
    "tasks": CheckSquare,
    "investors": Building2,
    "contracts": FileText,
    "taxes": Scale,
    "messages": MessageSquare,
    "employees": Users,
    "accounting": Calculator,
    "inventory": Archive,
    "ombor-nazorati": Factory,
    "ai-consultant": Bot,
    "leader-academy": GraduationCap,
};

const DATA_SUBTABS = [
    { id: "transactions", label: "Tranzaksiyalar", icon: DollarSign },
    { id: "contracts", label: "Shartnomalar", icon: FileText },
    { id: "taxes", label: "Soliqlar", icon: BarChart3 },
    { id: "inventory", label: "Inventar", icon: Package },
    { id: "leads", label: "Leadlar (CRM)", icon: Target },
    { id: "tasks", label: "Vazifalar", icon: CheckSquare },
    { id: "investors", label: "Investorlar", icon: Building2 },
    { id: "messages", label: "Xabarlar", icon: MessageSquare },
    { id: "employees", label: "Xodimlar", icon: Users },
] as const;

function formatMoney(amount: number): string {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(amount || 0)) + " so'm";
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("uz-UZ", { year: "numeric", month: "short", day: "numeric" });
}

export default function OwnerDashboard({ stats, users: initialUsers, envStatus }: Props) {
    const [activeTab, setActiveTab] = useState<string>("overview");
    const [activeSubTab, setActiveSubTab] = useState<string>("transactions");

    // Users tab
    const [users, setUsers] = useState(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editRole, setEditRole] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // AI Predictions state
    const [aiData, setAiData] = useState<any>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // AI Video Analyzer
    const [aiVideoPreview, setAiVideoPreview] = useState<any>(null);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);

    // AI Book Analyzer
    const [aiAnalyzingBook, setAiAnalyzingBook] = useState(false);
    const [aiBookPreview, setAiBookPreview] = useState<any>(null);

    // Data tab
    const [dataCache, setDataCache] = useState<Record<string, any[]>>({});
    const [dataLoading, setDataLoading] = useState(false);

    // Module management state
    const [companies, setCompanies] = useState<any[]>([]);
    const [companiesLoading, setCompaniesLoading] = useState(false);
    const [savingCompanyId, setSavingCompanyId] = useState<string | null>(null);
    const [companyModules, setCompanyModules] = useState<Record<string, string[]>>({});

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchRole = roleFilter === "ALL" || u.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [users, searchQuery, roleFilter]);

    // Load AI Analysis on Mount
    useEffect(() => {
        const fetchAI = async () => {
            setAiLoading(true);
            try {
                const statsString = JSON.stringify(stats, null, 2);
                const result = await getAIPredictions(statsString);
                setAiData(result);
            } catch (e) {
                console.error(e);
            }
            setAiLoading(false);
        };
        fetchAI();
    }, [stats]);    

    // Load subtab data
    useEffect(() => {
        if (activeTab !== "data") return;
        if (dataCache[activeSubTab]) return;

        const loaders: Record<string, () => Promise<any[]>> = {
            transactions: getTransactionsForOwner,
            contracts: getContractsForOwner,
            taxes: getTaxReportsForOwner,
            inventory: getInventoryForOwner,
            leads: getLeadsForOwner,
            tasks: getTasksForOwner,
            investors: getInvestorsForOwner,
            messages: getMessagesForOwner,
            employees: getEmployeesForOwner,
        };

        const loader = loaders[activeSubTab];
        if (!loader) return;

        setDataLoading(true);
        loader()
            .then(data => setDataCache(prev => ({ ...prev, [activeSubTab]: JSON.parse(JSON.stringify(data)) })))
            .catch(console.error)
            .finally(() => setDataLoading(false));
    }, [activeTab, activeSubTab, dataCache]);

    const handleUpdateRole = async (userId: string) => {
        setActionLoading(userId);
        try {
            await ownerUpdateRole(userId, editRole);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: editRole } : u));
            setEditingUserId(null);
            toast.success("Rol muvaffaqiyatli saqlandi");
        } catch (e: any) { toast.error(e.message || "Xatolik"); }
        setActionLoading(null);
    };

    const handleDeleteData = async (type: string, id: string) => {
        if (!confirm("Ma'lumot o'chiriladi. Davom etasizmi?")) return;
        setActionLoading(id);
        const deleters: Record<string, (id: string) => Promise<void>> = {
            transactions: ownerDeleteTransaction,
            contracts: ownerDeleteContract,
            taxes: ownerDeleteTaxReport,
            leads: ownerDeleteLead,
            tasks: ownerDeleteTask,
        };
        try {
            await deleters[type]?.(id);
            setDataCache(prev => ({
                ...prev,
                [type]: (prev[type] || []).filter((item: any) => item.id !== id)
            }));
            toast.success("O'chirildi");
        } catch (e: any) { toast.error(e.message || "Xatolik"); }
        setActionLoading(null);
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.ownerHeader}>
                <div className={styles.ownerBadge}>
                    <Crown size={14} /> TIZIM EGASI (SUPERADMIN)
                </div>
                <h1 className={styles.ownerTitle}>Boshqaruv Markazi</h1>
                <p className={styles.ownerSubtitle}>
                    Proaktiv muammolarni aniqlash, moliyaviy barqarorlikni avtomatik baholash va barcha modullar ustidan to'liq nazorat paneli.
                </p>
            </div>

            {/* Navigation */}
            <div className={styles.tabNav}>
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Contents */}
            {activeTab === "overview" && renderOverview()}
            {activeTab === "modules" && renderModules()}
            {activeTab === "users" && renderUsers()}
            {activeTab === "data" && renderData()}
            {activeTab === "academy" && renderAcademy()}
            {activeTab === "danger" && renderDangerZone()}

        </div>
    );

    // ==========================================
    // OVERVIEW & AI PREDICTIONS
    // ==========================================
    function renderOverview() {
        // Prepare chart data objects based on existing stats
        const cashFlowData = [
            { name: "Kirim", amount: stats.transactions.income, fill: "#10b981" },
            { name: "Chiqim", amount: stats.transactions.expense, fill: "#ef4444" }
        ];

        const userDistData = [
            { name: "Owner", value: stats.users.owner },
            { name: "Boshliq", value: stats.users.boshliq },
            { name: "Xodim", value: stats.users.xodim },
            { name: "Buxgalter", value: stats.users.buxgalter }
        ];
        const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

        return (
            <div>
                {/* AI Predictive Block */}
                <div className={styles.aiSection}>
                    <div className={styles.aiHeader}>
                        <h2 className={styles.aiTitle}>
                            <Zap size={24} /> AI Tizim Tahlili va Bashoratlar
                        </h2>
                        {aiLoading && <div className={styles.spinner}><Loader2 size={24} color="#c084fc"/></div>}
                    </div>

                    {!aiLoading && aiData ? (
                        <div className={styles.aiGrid}>
                            {/* Risk Score */}
                            <div className={styles.riskScoreCircle} style={{ 
                                borderColor: aiData.riskScore > 60 ? "rgba(239, 68, 68, 0.4)" : aiData.riskScore > 30 ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)",
                                boxShadow: aiData.riskScore > 60 ? "0 0 40px rgba(239,68,68,0.2) inset" : "none"
                            }}>
                                <div className={styles.scoreValue} style={{
                                    color: aiData.riskScore > 60 ? "#ef4444" : aiData.riskScore > 30 ? "#f59e0b" : "#10b981"
                                }}>
                                    {aiData.riskScore}
                                </div>
                                <div className={styles.scoreLabel}>Xavf Darajasi</div>
                            </div>
                            
                            {/* Recommendations & Anomalies */}
                            <div className={styles.aiContent}>
                                <div className={styles.aiBlock}>
                                    <div className={styles.aiBlockTitle} style={{ color: "#38bdf8" }}>
                                        <Activity size={16}/> Moliyaviy Salomatlik Xulosasi
                                    </div>
                                    <p style={{ fontSize: "0.95rem", color: "var(--text-primary)", lineHeight: "1.5" }}>
                                        {aiData.financialHealth}
                                    </p>
                                </div>

                                {aiData.anomalies && aiData.anomalies.length > 0 && (
                                    <div className={styles.aiBlock} style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)' }}>
                                        <div className={styles.aiBlockTitle} style={{ color: "#f87171" }}>
                                            <AlertTriangle size={16}/> Aniqlangan Anomaliyalar
                                        </div>
                                        <ul className={styles.aiList}>
                                            {aiData.anomalies.map((an: string, idx: number) => <li key={idx}>{an}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div className={styles.aiBlock}>
                                    <div className={styles.aiBlockTitle} style={{ color: "#c084fc" }}>
                                        <Target size={16}/> Egasi uchun Tavsiyalar
                                    </div>
                                    <ul className={styles.aiList}>
                                        {aiData.recommendations?.map((rec: string, idx: number) => <li key={idx}>{rec}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        !aiLoading && <p style={{ color: "#94a3b8" }}>Ulanish yaratilmadi yoki ma'lumot yo'q.</p>
                    )}
                </div>

                {/* Core Stats Overview */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                            <TrendingUp size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Sof Kirim</p>
                            <p className={styles.statValue} style={{ color: "#34d399" }}>{formatMoney(stats.transactions.income)}</p>
                            <p className={styles.statMeta}>Kompaniya umumiy tushumi</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
                            <TrendingDown size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Umumiy Xarajat</p>
                            <p className={styles.statValue} style={{ color: "#f87171" }}>{formatMoney(stats.transactions.expense)}</p>
                            <p className={styles.statMeta}>Xodimlar, soliqlar va xaridlar</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3b82f6" }}>
                            <FileText size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Aktiv Shartnomalar</p>
                            <p className={styles.statValue}>{stats.contracts.active}</p>
                            <p className={styles.statMeta}>Jami {stats.contracts.total} ta shartnomadan</p>
                        </div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a855f7" }}>
                            <Users size={24} />
                        </div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Platforma Foydalanuvchilari</p>
                            <p className={styles.statValue}>{stats.users.total}</p>
                            <p className={styles.statMeta}>{stats.employees.total} nafar rasmiy xodimlar</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}><DollarSign size={20}/> Pul Oqimi (Cash Flow)</h3>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cashFlowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" tickFormatter={(val: number) => `${val/1000000}M`} />
                                    <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className={styles.sectionCard}>
                        <h3 className={styles.sectionTitle}><Users size={20}/> Foydalanuvchilar Taqsimoti</h3>
                        <div className={styles.chartWrapper}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={userDistData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" stroke="none">
                                        {userDistData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip contentStyle={{ background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Additional Stats Row */}
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}><Package size={24} /></div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Inventar Buyumlari</p>
                            <p className={styles.statValue}>{stats.inventory.total}</p>
                            <p className={styles.statMeta}>Omborxonadagi tovarlar</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}><AlertTriangle size={24} /></div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Soliq Holati</p>
                            <p className={styles.statValue}>{stats.taxes.overdue} <span style={{fontSize:"0.7rem",color:"#f87171"}}>muddati o&apos;tgan</span></p>
                            <p className={styles.statMeta}>{stats.taxes.pending} kutilmoqda / {stats.taxes.total} jami</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(6, 182, 212, 0.15)", color: "#06b6d4" }}><Building2 size={24} /></div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Investitsiyalar</p>
                            <p className={styles.statValue} style={{color:"#22d3ee"}}>{formatMoney(stats.investors.totalInvestment)}</p>
                            <p className={styles.statMeta}>{stats.investors.total} ta investor</p>
                        </div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}><GraduationCap size={24} /></div>
                        <div className={styles.statInfo}>
                            <p className={styles.statLabel}>Leader Academy</p>
                            <p className={styles.statValue}>{stats.academy.videos + stats.academy.books}</p>
                            <p className={styles.statMeta}>{stats.academy.videos} video, {stats.academy.books} kitob</p>
                        </div>
                    </div>
                </div>

                {/* Environment & Security Status */}
                <div className={styles.sectionCard} style={{ marginBottom: "2rem" }}>
                    <h3 className={styles.sectionTitle}><Shield size={20}/> Tizim Xavfsizlik & Muhit Holati</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                        {Object.entries(envStatus).map(([key, ok]) => (
                            <div key={key} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: ok ? "rgba(16,185,129,0.05)" : "rgba(239,68,68,0.08)", border: `1px solid ${ok ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.25)"}`, borderRadius: "0.5rem" }}>
                                {ok ? <Unlock size={16} color="#10b981"/> : <Lock size={16} color="#ef4444"/>}
                                <span style={{ fontSize: "0.8rem", color: ok ? "#6ee7b7" : "#fca5a5", fontWeight: 600 }}>{key}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Summary Mini-Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "0.75rem" }}>
                    {[
                        { label: "CRM Leadlar", val: stats.leads.total, sub: `${stats.leads.won} yutuq`, color: "#3b82f6" },
                        { label: "Vazifalar", val: stats.tasks.total, sub: `${stats.tasks.done} bajarilgan`, color: "#10b981" },
                        { label: "Xabarlar", val: stats.messages.total, sub: `${stats.messages.unread} o'qilmagan`, color: "#f59e0b" },
                        { label: "Tranzaksiyalar", val: stats.transactions.total, sub: "jami operatsiya", color: "#8b5cf6" },
                    ].map(c => (
                        <div key={c.label} style={{ padding: "1rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.75rem", textAlign: "center" }}>
                            <p style={{ fontSize: "1.5rem", fontWeight: 800, color: c.color }}>{c.val}</p>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600 }}>{c.label}</p>
                            <p style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{c.sub}</p>
                        </div>
                    ))}
                </div>

            </div>
        );
    }

    // ==========================================
    // USERS MANAGEMENT
    // ==========================================
    function renderUsers() {
        return (
            <div>
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 className={styles.sectionTitle}><Users size={20} /> Foydalanuvchilar Boshqaruvi ({filteredUsers.length})</h3>
                        <button className={styles.actionBtn} style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", padding: "0.5rem 1rem", borderRadius: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }} onClick={() => setShowCreateModal(true)}>
                            <UserPlus size={16}/> Yangi Foydalanuvchi
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <input type="text" placeholder="Ism yoki email qidirish..." style={{ padding: '0.6rem 1rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none', flex: 1 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <select style={{ padding: '0.6rem 1rem', background: 'var(--background-color)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', color: 'var(--text-primary)', outline: 'none' }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                            <option value="ALL">Barchasi</option>
                            <option value="OWNER">Owner</option>
                            <option value="BOSHLIQ">Boshliq</option>
                            <option value="XODIM">Xodim</option>
                            <option value="BUXGALTER">Buxgalter</option>
                            <option value="INVESTOR">Investor</option>
                        </select>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.dataTable}>
                            <thead><tr><th>Ism & Email</th><th>Roli</th><th>Tasdiq</th><th>Sana</th><th>Sozlamalar</th></tr></thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</div>
                                        </td>
                                        <td>
                                            {editingUserId === u.id ? (
                                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                                                    <select value={editRole} onChange={e => setEditRole(e.target.value)} style={{ padding: "0.3rem", background: "var(--background-color)", border: "1px solid var(--border-color)", borderRadius: "4px", color: "var(--text-primary)", fontSize: "0.8rem" }}>
                                                        {["OWNER","BOSHLIQ","XODIM","BUXGALTER","INVESTOR"].map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                    <button style={{ background: "rgba(16,185,129,0.2)", border: "none", color: "#10b981", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }} onClick={() => handleUpdateRole(u.id)}>✓</button>
                                                    <button style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#ef4444", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }} onClick={() => setEditingUserId(null)}>✕</button>
                                                </div>
                                            ) : (
                                                <span className={styles.statusBadge} style={{ background: u.role === 'OWNER' ? 'rgba(239,68,68,0.15)' : u.role === 'BOSHLIQ' ? 'rgba(168,85,247,0.15)' : 'rgba(59,130,246,0.15)', color: u.role === 'OWNER' ? '#ef4444' : u.role === 'BOSHLIQ' ? '#a855f7' : '#60a5fa', cursor: "pointer" }} onClick={() => { setEditingUserId(u.id); setEditRole(u.role); }}>{u.role} <Edit2 size={10} style={{ marginLeft: 4 }}/></span>
                                            )}
                                        </td>
                                        <td>{u.isEmailVerified ? <Unlock size={16} color="#10b981"/> : <Lock size={16} color="#ef4444"/>}</td>
                                        <td style={{ color: "#94a3b8" }}>{formatDate(u.createdAt)}</td>
                                        <td>
                                            <button className={styles.actionBtn} title="O'chirish" disabled={actionLoading === u.id} onClick={async () => {
                                                if (!confirm(`"${u.name}" ni o'chirishni xohlaysizmi?`)) return;
                                                setActionLoading(u.id);
                                                try { await ownerDeleteUser(u.id); setUsers(prev => prev.filter(x => x.id !== u.id)); toast.success("Foydalanuvchi o'chirildi"); } catch(e: any) { toast.error(e.message); }
                                                setActionLoading(null);
                                            }}><Trash2 size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
                    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCreateModal(false)}>
                        <div style={{ background: "var(--background-color)", border: "1px solid var(--border-color)", borderRadius: "1rem", padding: "2rem", width: "420px", maxWidth: "90vw", boxShadow: "0 25px 50px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><UserPlus size={20} color="#10b981"/> Yangi Foydalanuvchi</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const fd = new FormData(e.currentTarget);
                                try { await ownerCreateUser(fd); toast.success("Foydalanuvchi yaratildi!"); setShowCreateModal(false); window.location.reload(); } catch(err: any) { toast.error(err.message); }
                            }}>
                                {[{ n: "name", l: "Ism", t: "text" }, { n: "email", l: "Email", t: "email" }, { n: "password", l: "Parol", t: "password" }].map(f => (
                                    <div key={f.n} style={{ marginBottom: "1rem" }}>
                                        <label style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.3rem", display: "block" }}>{f.l}</label>
                                        <input name={f.n} type={f.t} required style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none" }} />
                                    </div>
                                ))}
                                <div style={{ marginBottom: "1.5rem" }}>
                                    <label style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "0.3rem", display: "block" }}>Rol</label>
                                    <select name="role" required style={{ width: "100%", padding: "0.6rem 0.8rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.5rem", color: "var(--text-primary)", outline: "none" }}>
                                        {["BOSHLIQ","XODIM","BUXGALTER","INVESTOR"].map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                    <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: "0.6rem 1.2rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "#94a3b8", cursor: "pointer" }}>Bekor</button>
                                    <button type="submit" style={{ padding: "0.6rem 1.5rem", background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: "0.5rem", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Yaratish</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // ==========================================
    // SYSTEM DATA MANAGER
    // ==========================================
    function renderData() {
        const currentData = dataCache[activeSubTab] || [];
        return (
            <div>
                <div className={styles.tabNav} style={{ marginBottom: "1rem" }}>
                    {DATA_SUBTABS.map(sub => {
                        const Icon = sub.icon;
                        return (
                            <button
                                key={sub.id}
                                className={`${styles.tabBtn} ${activeSubTab === sub.id ? styles.tabBtnActive : ""}`}
                                onClick={() => setActiveSubTab(sub.id)}
                            >
                                <Icon size={14} />
                                <span>{sub.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className={styles.sectionCard}>
                    {dataLoading ? (
                        <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
                            <Loader2 className={styles.spinner} size={32} style={{ margin: "0 auto 1rem" }}/>
                            <p>Yuklanmoqda...</p>
                        </div>
                    ) : currentData.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>Ma'lumot topilmadi.</div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Nomi / Tavsif</th>
                                        {activeSubTab === "transactions" && <><th>Turi</th><th>Miqdor</th></>}
                                        {activeSubTab === "contracts" && <><th>Status</th><th>Taraf</th></>}
                                        {activeSubTab === "taxes" && <><th>Status</th><th>Miqdor</th></>}
                                        {activeSubTab === "inventory" && <><th>Miqdor</th><th>Narx</th></>}
                                        {activeSubTab === "leads" && <><th>Status</th><th>Qiymat</th></>}
                                        {activeSubTab === "tasks" && <><th>Status</th><th>Ustunlik</th></>}
                                        {activeSubTab === "investors" && <><th>Investitsiya</th><th>Ulush</th></>}
                                        {activeSubTab === "messages" && <><th>Kimdan</th><th>O&apos;qilgan</th></>}
                                        {activeSubTab === "employees" && <><th>Lavozim</th><th>Maosh</th></>}
                                        <th>Sana</th>
                                        <th>Amal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentData.map((item: any) => (
                                        <tr key={item.id}>
                                            <td style={{ fontWeight: 600, maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {item.description || item.title || item.name || item.subject || item.user?.name || "—"}
                                            </td>

                                            {activeSubTab === "transactions" && <>
                                                <td><span className={styles.statusBadge} style={{ background: item.type === "INCOME" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)", color: item.type === "INCOME" ? "#10b981" : "#ef4444" }}>{item.type}</span></td>
                                                <td style={{ color: item.type === "INCOME" ? "#34d399" : "#f87171" }}>{formatMoney(item.amount)}</td>
                                            </>}
                                            {activeSubTab === "contracts" && <>
                                                <td><span className={styles.statusBadge} style={{ background: item.status === "ACTIVE" ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)", color: item.status === "ACTIVE" ? "#10b981" : "#f59e0b" }}>{item.status}</span></td>
                                                <td style={{ color: "#94a3b8" }}>{item.partyName || "—"}</td>
                                            </>}
                                            {activeSubTab === "taxes" && <>
                                                <td><span className={styles.statusBadge} style={{ background: item.status === "OVERDUE" ? "rgba(239,68,68,0.15)" : item.status === "PENDING" ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.15)", color: item.status === "OVERDUE" ? "#ef4444" : item.status === "PENDING" ? "#f59e0b" : "#10b981" }}>{item.status}</span></td>
                                                <td>{formatMoney(item.amount)}</td>
                                            </>}
                                            {activeSubTab === "inventory" && <>
                                                <td>{item.quantity} {item.unit || "dona"}</td>
                                                <td>{formatMoney(item.price || 0)}</td>
                                            </>}
                                            {activeSubTab === "leads" && <>
                                                <td><span className={styles.statusBadge} style={{ background: item.status === "WON" ? "rgba(16,185,129,0.15)" : item.status === "LOST" ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)", color: item.status === "WON" ? "#10b981" : item.status === "LOST" ? "#ef4444" : "#60a5fa" }}>{item.status}</span></td>
                                                <td>{formatMoney(item.estimatedValue || 0)}</td>
                                            </>}
                                            {activeSubTab === "tasks" && <>
                                                <td><span className={styles.statusBadge} style={{ background: item.status === "DONE" ? "rgba(16,185,129,0.15)" : "rgba(59,130,246,0.15)", color: item.status === "DONE" ? "#10b981" : "#60a5fa" }}>{item.status}</span></td>
                                                <td style={{ color: "#94a3b8" }}>{item.priority || "—"}</td>
                                            </>}
                                            {activeSubTab === "investors" && <>
                                                <td style={{ color: "#34d399" }}>{formatMoney(item.totalInvestment || 0)}</td>
                                                <td>{item.ownershipPercentage || 0}%</td>
                                            </>}
                                            {activeSubTab === "messages" && <>
                                                <td style={{ color: "#94a3b8" }}>{item.senderName || "Tizim"}</td>
                                                <td>{item.isRead ? "✅" : "🔴"}</td>
                                            </>}
                                            {activeSubTab === "employees" && <>
                                                <td style={{ color: "#94a3b8" }}>{item.position || "—"}</td>
                                                <td>{formatMoney(item.salary || 0)}</td>
                                            </>}

                                            <td style={{ color: "#94a3b8", whiteSpace: "nowrap" }}>{formatDate(item.date || item.createdAt || item.signedDate || item.startDate || new Date().toISOString())}</td>
                                            <td>
                                                <button className={styles.actionBtn} onClick={() => handleDeleteData(activeSubTab, item.id)} disabled={actionLoading === item.id}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
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

    // ==========================================
    // ACADEMY RESOURCES
    // ==========================================
    function renderAcademy() {
        const handleAiAnalyze = async () => {
            const urlInput = (document.getElementById("ai-video-url") as HTMLInputElement)?.value;
            if (!urlInput) { toast.error("YouTube linkini kiriting!"); return; }
            setAiAnalyzing(true);
            setAiVideoPreview(null);
            try {
                const result = await aiAnalyzeYouTubeVideo(urlInput);
                setAiVideoPreview(result);
                toast.success("AI tahlil yakunlandi! Preview tekshiring.");
            } catch (err: any) {
                toast.error(err.message || "AI tahlilida xatolik");
            } finally {
                setAiAnalyzing(false);
            }
        };

        const handleConfirmAdd = async () => {
            if (!aiVideoPreview) return;
            setActionLoading("add-video");
            try {
                const fd = new FormData();
                fd.set("title", aiVideoPreview.title);
                fd.set("duration", aiVideoPreview.duration);
                fd.set("instructor", aiVideoPreview.instructor);
                fd.set("category", aiVideoPreview.category);
                fd.set("description", aiVideoPreview.description);
                fd.set("videoUrl", aiVideoPreview.videoUrl);
                fd.set("thumbnail", aiVideoPreview.thumbnail);
                await ownerCreateAcademyVideo(fd);
                toast.success("Video Leader Academy'ga qo'shildi!");
                setAiVideoPreview(null);
                (document.getElementById("ai-video-url") as HTMLInputElement).value = "";
            } catch (err: any) {
                toast.error(err.message || "Xatolik yuz berdi");
            } finally {
                setActionLoading(null);
            }
        };

        const handleAiAnalyzeBook = async () => {
            const fileInput = document.querySelector('input[name="pdfFile"]') as HTMLInputElement;
            const file = fileInput?.files?.[0];
            if (!file) { toast.error("Iltimos oldin PDF faylini tanlang!"); return; }

            setAiAnalyzingBook(true);
            try {
                // Dynamic import defined worker
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const totalPages = pdf.numPages;

                // Extract max first 10 pages
                let extractedText = "";
                const pagesToExtract = Math.min(10, totalPages);
                
                for (let i = 1; i <= pagesToExtract; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    extractedText += pageText + "\\n";
                }

                const result = await aiAnalyzeBookContent(extractedText, totalPages);
                setAiBookPreview(result);
                toast.success("AI kitobni tahlil qilib tugatdi!");
            } catch (err: any) {
                toast.error("Kitob tahlili davomida xatolik: " + err.message);
                console.error(err);
            } finally {
                setAiAnalyzingBook(false);
            }
        };

        const handleAddBook = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setActionLoading("add-book");
            let toastId = null;
            try {
                const fd = new FormData(e.currentTarget);
                const pdfFile = fd.get("pdfFile") as File;
                const coverFile = fd.get("coverFile") as File;
                
                if (!pdfFile || pdfFile.size === 0) throw new Error("Iltimos PDF faylini tanlang!");
                
                toastId = toast.loading("Ulkan fayllar Cloud Storage ga yuklanmoqda... (Kutib turing)");
                
                const pdfExt = pdfFile.name.split('.').pop();
                const pdfName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${pdfExt}`;
                const { data: pdfData, error: pdfError } = await supabaseClient.storage.from("boshliq-academy").upload(pdfName, pdfFile, { cacheControl: '3600', upsert: false });
                if (pdfError) throw new Error("PDF yuklashda xatolik: " + pdfError.message);
                
                const { data: { publicUrl: pdfPubUrl } } = supabaseClient.storage.from("boshliq-academy").getPublicUrl(pdfData.path);
                
                let coverPubUrl = null;
                if (coverFile && coverFile.size > 0) {
                    const coverExt = coverFile.name.split('.').pop();
                    const coverName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${coverExt}`;
                    const { data: covData, error: covErr } = await supabaseClient.storage.from("boshliq-academy").upload(coverName, coverFile, { cacheControl: '3600', upsert: false });
                    if (covErr) throw new Error("Muqova yuklashda xatolik: " + covErr.message);
                    const { data: { publicUrl } } = supabaseClient.storage.from("boshliq-academy").getPublicUrl(covData.path);
                    coverPubUrl = publicUrl;
                } else if (aiBookPreview?.coverImageUrl) {
                    coverPubUrl = aiBookPreview.coverImageUrl;
                }

                toast.loading("Ma'lumotlar ro'yxatdan o'tkazilmoqda...", { id: toastId });
                
                const finalFd = new FormData();
                finalFd.set("title", fd.get("title") as string);
                finalFd.set("author", fd.get("author") as string);
                finalFd.set("readTime", fd.get("readTime") as string);
                finalFd.set("description", fd.get("description") as string);
                finalFd.set("pdfUrl", pdfPubUrl);
                if (coverPubUrl) finalFd.set("coverUrl", coverPubUrl);
                
                await ownerCreateAcademyBook(finalFd);
                toast.success("Kitob mukammal tarzda yuklandi!", { id: toastId });
                (e.target as HTMLFormElement).reset();
                setAiBookPreview(null);
            } catch(err: any) {
                toast.error(err.message || "Xatolik yuz berdi", { id: toastId || undefined });
            } finally {
                setActionLoading(null);
            }
        };

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {/* AI VIDEO ANALYZER */}
                <div className={styles.sectionCard} style={{ borderColor: "rgba(59,130,246,0.2)" }}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}><Sparkles size={20} color="#f59e0b"/> AI Video Tahlilchi</h3>
                        <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                            YouTube linkini kiriting — AI avtomatik sarlavha, tavsif, kategoriya, spiker va muqova rasmini aniqlaydi.
                        </p>
                    </div>

                    {/* URL Input */}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", alignItems: "center" }}>
                        <div style={{ position: "relative", flex: 1 }}>
                            <Link2 size={16} color="#94a3b8" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }} />
                            <input id="ai-video-url" type="url" placeholder="https://www.youtube.com/watch?v=..." style={{ width: "100%", padding: "0.8rem 0.8rem 0.8rem 2.5rem", background: "var(--background-color)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.6rem", color: "var(--text-primary)", outline: "none", fontSize: "0.95rem" }} />
                        </div>
                        <button onClick={handleAiAnalyze} disabled={aiAnalyzing} style={{ padding: "0.8rem 1.5rem", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: "0.6rem", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", whiteSpace: "nowrap" }}>
                            {aiAnalyzing ? <Loader2 className={styles.spinner} size={18}/> : <Sparkles size={18}/>}
                            {aiAnalyzing ? "Tahlil qilmoqda..." : "AI Tahlil"}
                        </button>
                    </div>

                    {/* AI PREVIEW CARD */}
                    {aiVideoPreview && (
                        <div style={{ marginTop: "1.5rem", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "1rem", overflow: "hidden" }}>
                            {/* Preview Header */}
                            <div style={{ padding: "1rem 1.5rem", background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(59,130,246,0.05))", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Eye size={18} color="#f59e0b"/>
                                <span style={{ fontWeight: 700, color: "#fbbf24" }}>Preview — Qo&apos;shishdan oldin tekshiring</span>
                            </div>

                            <div style={{ padding: "1.5rem", display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.5rem" }}>
                                {/* Thumbnail */}
                                <div style={{ borderRadius: "0.75rem", overflow: "hidden", aspectRatio: "16/9", background: "#0f172a" }}>
                                    {aiVideoPreview.thumbnail ? (
                                        <img src={aiVideoPreview.thumbnail} alt="Video thumbnail" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Video size={48}/></div>
                                    )}
                                </div>

                                {/* Editable Fields */}
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sarlavha</label>
                                        <input value={aiVideoPreview.title} onChange={e => setAiVideoPreview({...aiVideoPreview, title: e.target.value})} style={{ width: "100%", padding: "0.5rem 0.6rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none", fontSize: "1rem", fontWeight: 600 }} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                                        <div>
                                            <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Spiker</label>
                                            <input value={aiVideoPreview.instructor} onChange={e => setAiVideoPreview({...aiVideoPreview, instructor: e.target.value})} style={{ width: "100%", padding: "0.4rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Kategoriya</label>
                                            <input value={aiVideoPreview.category} onChange={e => setAiVideoPreview({...aiVideoPreview, category: e.target.value})} style={{ width: "100%", padding: "0.4rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem" }} />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Davomiylik</label>
                                            <input value={aiVideoPreview.duration} onChange={e => setAiVideoPreview({...aiVideoPreview, duration: e.target.value})} style={{ width: "100%", padding: "0.4rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem" }} />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: "0.7rem", color: "#94a3b8", textTransform: "uppercase" }}>Tavsif</label>
                                        <textarea value={aiVideoPreview.description} onChange={e => setAiVideoPreview({...aiVideoPreview, description: e.target.value})} rows={3} style={{ width: "100%", padding: "0.5rem", background: "var(--surface-color)", border: "1px solid var(--border-color)", borderRadius: "0.4rem", color: "var(--text-primary)", outline: "none", fontSize: "0.85rem", resize: "vertical" }} />
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                                <button onClick={() => setAiVideoPreview(null)} style={{ padding: "0.6rem 1.2rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.5rem", color: "#94a3b8", cursor: "pointer" }}>
                                    <X size={14} style={{ marginRight: 6 }}/> Bekor qilish
                                </button>
                                <button onClick={handleConfirmAdd} disabled={actionLoading === "add-video"} style={{ padding: "0.6rem 1.5rem", background: "linear-gradient(135deg, #10b981, #059669)", border: "none", borderRadius: "0.5rem", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    {actionLoading === "add-video" ? <Loader2 className={styles.spinner} size={16}/> : <Plus size={16}/>}
                                    Academy&apos;ga Qo&apos;shish
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* KITOB QO'SHISH */}
                <div className={styles.sectionCard} style={{ borderColor: "rgba(139,92,246,0.2)" }}>
                    <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                            <h3 className={styles.sectionTitle}><Book size={20} color="#8b5cf6"/> Yangi PDF Kitob Qo'shish</h3>
                            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "0.5rem" }}>PDF fayl yuklang so'ngra AI orqali ma'lumotlarni to'ldiring.</p>
                        </div>
                        <button type="button" onClick={handleAiAnalyzeBook} disabled={aiAnalyzingBook} style={{ padding: "0.6rem 1.2rem", background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: "0.6rem", color: "#c4b5fd", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {aiAnalyzingBook ? <Loader2 className={styles.spinner} size={16}/> : <Sparkles size={16}/>}
                            {aiAnalyzingBook ? "Kitob tahlil qilinmoqda..." : "AI Orqali To'ldirish"}
                        </button>
                    </div>
                    
                    <form onSubmit={handleAddBook} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1.5rem" }}>
                        {/* File Uploads */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                <div style={{ border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "0.5rem", padding: "1.5rem", textAlign: "center", background: "rgba(0,0,0,0.2)" }}>
                                    <FileDown size={28} color="#f87171" style={{ margin: "0 auto 0.5rem" }}/>
                                    <p style={{ fontSize: "0.9rem", color: "#e2e8f0", marginBottom: "0.5rem" }}>PDF Fayli *</p>
                                    <input type="file" name="pdfFile" accept="application/pdf" required style={{ width: "100%", fontSize: "0.8rem", color: "#fff" }} />
                                </div>
                                <div style={{ border: "1px dashed rgba(255,255,255,0.2)", borderRadius: "0.5rem", padding: "1.5rem", textAlign: "center", background: aiBookPreview?.coverImageUrl ? `url(${aiBookPreview.coverImageUrl}) center/cover no-repeat` : "rgba(0,0,0,0.2)", position: "relative" }}>
                                    {aiBookPreview?.coverImageUrl && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", borderRadius: "0.5rem" }}></div>}
                                    <div style={{ position: "relative", zIndex: 1 }}>
                                        {aiBookPreview?.coverImageUrl ? (
                                            <Sparkles size={28} color="#fbbf24" style={{ margin: "0 auto 0.5rem" }}/>
                                        ) : (
                                            <UploadCloud size={28} color="#a855f7" style={{ margin: "0 auto 0.5rem" }}/>
                                        )}
                                        <p style={{ fontSize: "0.9rem", color: "#fff", marginBottom: "0.5rem" }}>
                                            {aiBookPreview?.coverImageUrl ? "AI Muqova Yaratdi" : "Muqova Rasmi (Majburiy emas)"}
                                        </p>
                                        <input type="file" name="coverFile" accept="image/*" style={{ width: "100%", fontSize: "0.8rem", color: "#fff" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>Kitob Nomi *</label>
                            <input name="title" required placeholder="To'liq nomi" value={aiBookPreview?.title ?? ''} onChange={e => setAiBookPreview((prev: any) => prev ? {...prev, title: e.target.value} : {title: e.target.value})} style={{ padding: '0.6rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <label style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>Muallif</label>
                            <input name="author" placeholder="Muallif ismi" value={aiBookPreview?.author ?? ''} onChange={e => setAiBookPreview((prev: any) => prev ? {...prev, author: e.target.value} : {author: e.target.value})} style={{ padding: '0.6rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>O'qish vaqti (Taxminiy)</label>
                            <input name="readTime" placeholder="2 soat, 10 daqiqa..." value={aiBookPreview?.readTime ?? ''} onChange={e => setAiBookPreview((prev: any) => prev ? {...prev, readTime: e.target.value} : {readTime: e.target.value})} style={{ padding: '0.6rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                            <label style={{ fontSize: "0.8rem", color: "#e2e8f0" }}>Kitob haqida xulosa</label>
                            <textarea name="description" rows={3} placeholder="Qisqacha ta'rif..." value={aiBookPreview?.description ?? ''} onChange={e => setAiBookPreview((prev: any) => prev ? {...prev, description: e.target.value} : {description: e.target.value})} style={{ padding: '0.6rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '0.4rem', color: 'var(--text-primary)', outline: 'none' }}></textarea>
                        </div>

                        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                            <button type="submit" disabled={actionLoading === "add-book"} style={{ padding: "0.8rem 2rem", background: "linear-gradient(135deg, #8b5cf6, #7c3aed)", color: "#fff", border: "none", borderRadius: "0.5rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                {actionLoading === "add-book" ? <Loader2 className={styles.spinner} size={18}/> : <Plus size={18}/>} Kuttubxonaga Qo'shish
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ==========================================
    // DANGER ZONE
    // ==========================================
    function renderDangerZone() {
        const purgeActions = [
            { label: "Barcha Tranzaksiyalar", fn: ownerPurgeAllTransactions, color: "#ef4444" },
            { label: "Barcha Soliq Hisobotlari", fn: ownerPurgeAllTaxReports, color: "#f97316" },
            { label: "Barcha CRM Leadlari", fn: ownerPurgeAllLeads, color: "#eab308" },
            { label: "Barcha Kanban Vazifalari", fn: ownerPurgeAllTasks, color: "#f59e0b" },
            { label: "Barcha Xabarlar", fn: ownerPurgeAllMessages, color: "#dc2626" },
        ];

        return (
            <div className={styles.sectionCard} style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                <h3 className={styles.sectionTitle} style={{ color: "#ef4444" }}>
                    <AlertTriangle size={20}/> Xavfli Zona — Ma&apos;lumotlarni Tozalash
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                    Ushbu amallar qaytarib bo&apos;lmaydi. Barcha tanlangan kategoriya ma&apos;lumotlari butunlay o&apos;chiriladi!
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {purgeActions.map(p => (
                        <button key={p.label} className={styles.actionBtn}
                            style={{ padding: "1rem 1.5rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.75rem", color: p.color, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", textAlign: "left" }}
                            onClick={async () => {
                                if (!confirm(`"${p.label}" — hamma ma'lumotlarni o'chirishni xohlaysizmi?`)) return;
                                if (!confirm("Bu qaytarib bo'lmaydigan amal! Ishonchingiz komilmi?")) return;
                                try { await p.fn(); toast.success(`${p.label} tozalandi!`); window.location.reload(); } catch(e: any) { toast.error(e.message); }
                            }}
                        >
                            <Trash2 size={18} /> {p.label}ni O&apos;chirish
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ==========================================
    // MODULE MANAGEMENT
    // ==========================================
    function renderModules() {
        // Load companies on first render
        if (companies.length === 0 && !companiesLoading) {
            setCompaniesLoading(true);
            getCompaniesWithModules()
                .then(data => {
                    setCompanies(data);
                    const initialModules: Record<string, string[]> = {};
                    data.forEach((c: any) => {
                        initialModules[c.id] = c.enabledModules?.length ? [...c.enabledModules] : [...ALL_MODULE_IDS];
                    });
                    setCompanyModules(initialModules);
                })
                .catch(console.error)
                .finally(() => setCompaniesLoading(false));
        }

        const toggleModule = (companyId: string, moduleId: string) => {
            setCompanyModules(prev => {
                const current = prev[companyId] || [];
                const isEnabled = current.includes(moduleId);
                return {
                    ...prev,
                    [companyId]: isEnabled
                        ? current.filter(m => m !== moduleId)
                        : [...current, moduleId]
                };
            });
        };

        const toggleAll = (companyId: string, enable: boolean) => {
            setCompanyModules(prev => ({
                ...prev,
                [companyId]: enable ? [...ALL_MODULE_IDS] : [...ALWAYS_ENABLED_MODULES]
            }));
        };

        const handleSave = async (companyId: string) => {
            setSavingCompanyId(companyId);
            try {
                const result = await updateCompanyModules(companyId, companyModules[companyId] || []);
                setCompanyModules(prev => ({ ...prev, [companyId]: result.enabledModules }));
                toast.success("Modullar muvaffaqiyatli saqlandi!");
            } catch (e: any) {
                toast.error(e.message || "Xatolik yuz berdi");
            }
            setSavingCompanyId(null);
        };

        const hasChanges = (companyId: string) => {
            const original = companies.find((c: any) => c.id === companyId);
            if (!original) return false;
            const originalModules = original.enabledModules?.length ? original.enabledModules : ALL_MODULE_IDS;
            const current = companyModules[companyId] || [];
            return JSON.stringify([...originalModules].sort()) !== JSON.stringify([...current].sort());
        };

        return (
            <div>
                <div className={styles.sectionCard} style={{ marginBottom: "1.5rem" }}>
                    <h3 className={styles.sectionTitle}>
                        <Puzzle size={20} /> Kompaniya Modullarini Boshqarish
                    </h3>
                    <p style={{ color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                        Har bir kompaniya uchun qaysi modullar ochiq yoki yopiq ekanini sozlang. 
                        <span style={{ color: "#a78bfa" }}> "Umumiy"</span> va <span style={{ color: "#a78bfa" }}>"Sozlamalar"</span> har doim yoqiq bo&apos;lib qoladi.
                    </p>
                </div>

                {companiesLoading ? (
                    <div style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
                        <Loader2 className={styles.spinner} size={32} style={{ margin: "0 auto 1rem" }}/>
                        <p>Kompaniyalar yuklanmoqda...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className={styles.sectionCard} style={{ textAlign: "center", padding: "4rem", color: "#64748b" }}>
                        Hech qanday kompaniya topilmadi.
                    </div>
                ) : (
                    companies.map((company: any) => {
                        const currentModules = companyModules[company.id] || [];
                        const enabledCount = currentModules.filter((m: string) => !ALWAYS_ENABLED_MODULES.includes(m)).length;
                        const changed = hasChanges(company.id);

                        return (
                            <div key={company.id} className={styles.sectionCard} style={{ marginBottom: "1.5rem", border: changed ? "1px solid rgba(167, 139, 250, 0.4)" : undefined }}>
                                {/* Company Header */}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,130,246,0.2))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <Building2 size={22} color="#a78bfa" />
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>{company.name}</h4>
                                            <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>
                                                {company._count?.users || 0} foydalanuvchi • {enabledCount} / {TOGGLEABLE_MODULES.length} modul yoqiq
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                        <button
                                            onClick={() => toggleAll(company.id, true)}
                                            style={{ padding: "0.4rem 0.8rem", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, color: "#10b981", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                        >Hammasini Yoqish</button>
                                        <button
                                            onClick={() => toggleAll(company.id, false)}
                                            style={{ padding: "0.4rem 0.8rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, color: "#ef4444", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}
                                        >Hammasini O&apos;chirish</button>
                                    </div>
                                </div>

                                {/* Company Users */}
                                {company.users && company.users.length > 0 && (
                                    <div style={{ marginBottom: "1.25rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: 10 }}>
                                        <p style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            <Mail size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                                            Foydalanuvchilar
                                        </p>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                                            {company.users.map((u: any) => (
                                                <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.85rem" }}>
                                                    <span style={{
                                                        padding: "2px 8px",
                                                        borderRadius: 6,
                                                        fontSize: "0.65rem",
                                                        fontWeight: 700,
                                                        background: u.role === "OWNER" ? "rgba(239,68,68,0.12)" : u.role === "BOSHLIQ" ? "rgba(168,85,247,0.12)" : "rgba(59,130,246,0.12)",
                                                        color: u.role === "OWNER" ? "#ef4444" : u.role === "BOSHLIQ" ? "#a855f7" : "#60a5fa",
                                                        minWidth: 60,
                                                        textAlign: "center" as const
                                                    }}>
                                                        {u.role}
                                                    </span>
                                                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</span>
                                                    <span style={{ color: "#64748b" }}>—</span>
                                                    <span style={{ color: "#94a3b8" }}>{u.email}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Users List */}
                                {company.users && company.users.length > 0 && (
                                    <div style={{ marginBottom: "1.25rem", background: "rgba(0,0,0,0.15)", borderRadius: "0.75rem", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                                        <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <Users size={16} color="#a78bfa" />
                                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                Foydalanuvchilar ({company.users.length})
                                            </span>
                                        </div>
                                        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                                            {company.users.map((u: any) => {
                                                const roleColors: Record<string, { bg: string; text: string }> = {
                                                    OWNER: { bg: "rgba(239,68,68,0.15)", text: "#ef4444" },
                                                    BOSHLIQ: { bg: "rgba(168,85,247,0.15)", text: "#a855f7" },
                                                    XODIM: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa" },
                                                    BUXGALTER: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b" },
                                                    INVESTOR: { bg: "rgba(6,182,212,0.15)", text: "#22d3ee" },
                                                };
                                                const rc = roleColors[u.role] || { bg: "rgba(148,163,184,0.15)", text: "#94a3b8" };
                                                return (
                                                    <div key={u.id} style={{
                                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                                        padding: "0.6rem 1rem",
                                                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                                                        transition: "background 0.15s",
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                    >
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                                                            background: `linear-gradient(135deg, ${rc.bg}, rgba(255,255,255,0.03))`,
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: rc.text, fontWeight: 700, fontSize: "0.75rem",
                                                        }}>
                                                            {(u.name || "?").charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {u.name}
                                                            </div>
                                                            <div style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                                                <Mail size={11} />
                                                                {u.email}
                                                            </div>
                                                        </div>
                                                        <span style={{
                                                            padding: "0.15rem 0.5rem", borderRadius: "999px",
                                                            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.05em",
                                                            textTransform: "uppercase",
                                                            background: rc.bg, color: rc.text,
                                                            flexShrink: 0,
                                                        }}>
                                                            {u.role}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Module Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
                                    {TOGGLEABLE_MODULES.map(mod => {
                                        const isEnabled = currentModules.includes(mod.id);
                                        const IconComp = MODULE_ICONS[mod.id] || Package;
                                        return (
                                            <button
                                                key={mod.id}
                                                onClick={() => toggleModule(company.id, mod.id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    padding: "0.85rem 1rem",
                                                    background: isEnabled ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.04)",
                                                    border: `1px solid ${isEnabled ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.15)"}`,
                                                    borderRadius: 12,
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease",
                                                    width: "100%",
                                                    textAlign: "left",
                                                    color: "inherit",
                                                }}
                                            >
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 10,
                                                    background: isEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.03)",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    transition: "all 0.2s",
                                                    color: isEnabled ? "#10b981" : "#64748b",
                                                    flexShrink: 0,
                                                }}>
                                                    <IconComp size={18} />
                                                </div>
                                                <span style={{ flex: 1, fontSize: "0.88rem", fontWeight: 600, color: isEnabled ? "var(--text-primary)" : "#64748b" }}>
                                                    {mod.label}
                                                </span>
                                                {isEnabled ? (
                                                    <ToggleRight size={24} color="#10b981" />
                                                ) : (
                                                    <ToggleLeft size={24} color="#475569" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Save Button */}
                                {changed && (
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => handleSave(company.id)}
                                            disabled={savingCompanyId === company.id}
                                            style={{
                                                padding: "0.65rem 2rem",
                                                background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
                                                border: "none",
                                                borderRadius: 10,
                                                color: "#fff",
                                                fontWeight: 700,
                                                fontSize: "0.9rem",
                                                cursor: savingCompanyId === company.id ? "wait" : "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "0.5rem",
                                                opacity: savingCompanyId === company.id ? 0.7 : 1,
                                                boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                                                transition: "all 0.2s",
                                            }}
                                        >
                                            {savingCompanyId === company.id ? (
                                                <><Loader2 size={16} className={styles.spinner} /> Saqlanmoqda...</>
                                            ) : (
                                                <><Save size={16} /> O&apos;zgarishlarni Saqlash</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        );
    }
}
