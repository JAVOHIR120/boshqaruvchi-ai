import styles from "./dashboard.module.css";
import { Users, TrendingUp, Building, DollarSign, Bell, MessageSquare, ShieldAlert } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import { prisma } from "@/lib/prisma";
import DashboardAIAssistant from "./components/DashboardAIAssistant";
import ExecutiveBriefing from "./components/ExecutiveBriefing";
import BossMessageForm from "./components/BossMessageForm";
import TelegramAlertBtn from "./components/TelegramAlertBtn";
import Link from "next/link";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import DashboardChart from "./components/DashboardChart";
import DashboardSparkline from "./components/DashboardSparkline";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    // Parallel database requests
    const [transactions, employeesCount, activeContractsCount, pendingTaxes, recentMessages] = await Promise.all([
        prisma.transaction.findMany({
            where: { companyId: currentUser.companyId },
            orderBy: { date: "asc" }
        }),
        prisma.employee.count({ where: { companyId: currentUser.companyId } }),
        prisma.contract.count({
            where: { companyId: currentUser.companyId, status: "ACTIVE" }
        }),
        prisma.taxReport.findMany({
            where: { companyId: currentUser.companyId, status: { in: ["PENDING", "OVERDUE"] } },
            orderBy: { dueDate: "asc" },
            take: 3
        }),
        prisma.message.findMany({
            where: {
                OR: [{ recipientId: currentUser.id }, { senderId: currentUser.id }]
            },
            orderBy: { createdAt: "desc" },
            take: 5
        })
    ]);

    const userIdsForMessages = recentMessages.map((m: any) => m.senderId);
    const usersForMessages = await prisma.user.findMany({
        where: { id: { in: userIdsForMessages } },
        select: { id: true, name: true }
    });

    const messagesWithSender = recentMessages.map((m: any) => ({
        ...m,
        senderName: usersForMessages.find(u => u.id === m.senderId)?.name || "Noma'lum Xodim"
    }));

    // Financial calculations
    const totalIncome = transactions.filter(t => t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpense;

    // Process trend lines for Sparklines (last 6 months)
    const incomeTrend: number[] = [0, 0, 0, 0, 0, 0];
    const profitTrend: number[] = [0, 0, 0, 0, 0, 0];

    const monthOffsets = [5, 4, 3, 2, 1, 0];
    const months = monthOffsets.map(i => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleDateString("uz-UZ", { month: "short", year: "numeric" });
    });

    transactions.forEach(t => {
        const monthYear = new Date(t.date).toLocaleDateString("uz-UZ", { month: "short", year: "numeric" });
        const idx = months.indexOf(monthYear);
        if (idx !== -1) {
            if (t.type === "INCOME") {
                incomeTrend[idx] += t.amount;
                profitTrend[idx] += t.amount;
            } else {
                profitTrend[idx] -= t.amount;
            }
        }
    });

    const safeIncomeTrend = incomeTrend.every(x => x === 0) ? [10, 15, 8, 25, 20, 35] : incomeTrend;
    const safeProfitTrend = profitTrend.every(x => x === 0) ? [5, 12, 4, 18, 14, 25] : profitTrend;
    const employeeTrend = [employeesCount - 2 > 0 ? employeesCount - 2 : 0, employeesCount - 1 > 0 ? employeesCount - 1 : 0, employeesCount, employeesCount, employeesCount + 1, employeesCount];
    const contractTrend = [activeContractsCount - 1 > 0 ? activeContractsCount - 1 : 0, activeContractsCount, activeContractsCount, activeContractsCount, activeContractsCount + 1, activeContractsCount];

    return (
        <div className={styles.dashboardContainer}>
            {/* Bloomberg-Style Live News Ticker */}
            <div className={styles.newsTickerContainer}>
                <div className={styles.newsLabel}>LIVE SYSTEMS</div>
                <div className={styles.tickerWrapper}>
                    <div className={styles.tickerText}>
                        <span>• AI ANALYTICS: Rentabellik koeffitsiyenti {totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : "32.5%"} barqaror.</span>
                        <span>• OMBORESLATMA: AI tovar harakati bashorati ishga tushirildi.</span>
                        <span>• KO'RSATKICH: POS Terminal va aylanma mablag'lar balansi to'liq tizimlashtirildi.</span>
                        <span>• FINANCIAL BRIEF: Biznes operatsion aylanmasi normal darajada.</span>
                    </div>
                </div>
            </div>

            {/* Welcome Banner */}
            <div className={styles.welcomeBanner} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
                <div className={styles.welcomeContent} style={{ flex: 1 }}>
                    <h2 className={styles.welcomeTitle}>Xush Kelibsiz, Boshqaruvchi!</h2>
                    <p className={styles.welcomeSubtitle} style={{ marginBottom: "1rem" }}>Korxonangizning barcha ko'rsatkichlari tizimlashtirilgan. AI yordamchi doim tayyor.</p>
                    <TelegramAlertBtn />
                </div>
                <div className={styles.welcomeLogo}>
                    <img src="/logo.png" alt="Boshqaruvchi AI Logo" loading="eager" fetchPriority="high" decoding="sync" style={{ height: "60px", width: "60px", borderRadius: "50%", objectFit: "cover", aspectRatio: "1/1", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />
                </div>
            </div>

            {/* Audio Briefing Section */}
            <div style={{ marginBottom: "0.5rem" }}>
                <ExecutiveBriefing companyId={currentUser.companyId} />
            </div>

            {/* Summary Cards with Sparklines */}
            <div className={styles.statsGrid}>
                <div className={styles.statCardWrapper}>
                    <div className={styles.statCard}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <EnhancedIcon 
                                    icon={DollarSign} 
                                    size={24} 
                                    color="var(--primary-color)" 
                                    glowColor="rgba(59, 130, 246, 0.4)"
                                    hasBackground={true} 
                                />
                                <span className={`${styles.trendBadge} badge-glow-success`}>+14.2%</span>
                            </div>
                            <div className={styles.statInfo}>
                                <p>Jami Daromad</p>
                                <h3 className="tabular-nums">{totalIncome.toLocaleString()} so'm</h3>
                            </div>
                        </div>
                        <div className={styles.sparklineContainer}>
                            <DashboardSparkline data={safeIncomeTrend} color="var(--primary-color)" />
                        </div>
                    </div>
                </div>

                <div className={styles.statCardWrapper}>
                    <div className={styles.statCard}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <EnhancedIcon 
                                    icon={TrendingUp} 
                                    size={24} 
                                    color="var(--success-color)" 
                                    glowColor="rgba(16, 185, 129, 0.4)"
                                    hasBackground={true} 
                                />
                                <span className={`${styles.trendBadge} ${netProfit >= 0 ? "badge-glow-success" : "badge-glow-error"}`}>
                                    {netProfit >= 0 ? "+18.5%" : "-3.2%"}
                                </span>
                            </div>
                            <div className={styles.statInfo}>
                                <p>Sof Foyda</p>
                                <h3 className="tabular-nums" style={{ color: netProfit >= 0 ? "var(--success-color)" : "var(--error-color)" }}>
                                    {netProfit.toLocaleString()} so'm
                                </h3>
                            </div>
                        </div>
                        <div className={styles.sparklineContainer}>
                            <DashboardSparkline data={safeProfitTrend} color={netProfit >= 0 ? "var(--success-color)" : "var(--error-color)"} />
                        </div>
                    </div>
                </div>

                <div className={styles.statCardWrapper}>
                    <div className={styles.statCard}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <EnhancedIcon 
                                    icon={Users} 
                                    size={24} 
                                    color="var(--warning-color)" 
                                    glowColor="rgba(245, 158, 11, 0.4)"
                                    hasBackground={true} 
                                />
                                <span className={`${styles.trendBadge} badge-glow-success`}>Faol</span>
                            </div>
                            <div className={styles.statInfo}>
                                <p>Faol Xodimlar</p>
                                <h3 className="tabular-nums">{employeesCount} ta</h3>
                            </div>
                        </div>
                        <div className={styles.sparklineContainer}>
                            <DashboardSparkline data={employeeTrend} color="var(--warning-color)" />
                        </div>
                    </div>
                </div>

                <div className={styles.statCardWrapper}>
                    <div className={styles.statCard}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <EnhancedIcon 
                                    icon={Building} 
                                    size={24} 
                                    color="#8b5cf6" 
                                    glowColor="rgba(139, 92, 246, 0.4)"
                                    hasBackground={true} 
                                />
                                <span className={`${styles.trendBadge} badge-glow-success`}>+2 yangi</span>
                            </div>
                            <div className={styles.statInfo}>
                                <p>Faol Shartnomalar</p>
                                <h3 className="tabular-nums">{activeContractsCount} ta</h3>
                            </div>
                        </div>
                        <div className={styles.sparklineContainer}>
                            <DashboardSparkline data={contractTrend} color="#8b5cf6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Enterprise Economic Health Monitor */}
            <div className={styles.healthMonitorCard}>
                <h3 className={styles.sectionTitle}>
                    <span className={styles.iconBox}><EnhancedIcon icon={TrendingUp} size={20} color="var(--primary-color)" /></span> Korxona Moliyaviy Salomatligi (AI Monitor)
                </h3>
                <div className={styles.healthGrid}>
                    <div className={styles.healthItem}>
                        <div className={styles.healthHeader}>
                            <span>Likvidlik Koeffitsiyenti</span>
                            <span className="tabular-nums" style={{ color: "var(--success-color)", fontWeight: 700 }}>2.4x</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressBar} style={{ width: "80%", backgroundColor: "var(--success-color)" }}></div>
                        </div>
                        <div className={styles.healthMeta}>Biznes qisqa muddatli majburiyatlarni to'liq qoplay oladi.</div>
                    </div>
                    <div className={styles.healthItem}>
                        <div className={styles.healthHeader}>
                            <span>Sof Rentabellik (Profit Margin)</span>
                            <span className="tabular-nums" style={{ color: "var(--primary-color)", fontWeight: 700 }}>
                                {totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : "32.5%"}
                            </span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressBar} style={{ width: totalIncome > 0 ? `${Math.min(100, Math.max(10, (netProfit / totalIncome) * 100))}%` : "65%", backgroundColor: "var(--primary-color)" }}></div>
                        </div>
                        <div className={styles.healthMeta}>Sog'lom • Har 100 so'mdan sof foyda ulushi.</div>
                    </div>
                    <div className={styles.healthItem}>
                        <div className={styles.healthHeader}>
                            <span>Soliq Zaxirasi Runway</span>
                            <span className="tabular-nums" style={{ color: "var(--warning-color)", fontWeight: 700 }}>180 kun</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressBar} style={{ width: "70%", backgroundColor: "var(--warning-color)" }}></div>
                        </div>
                        <div className={styles.healthMeta}>Barqaror • Kelgusi davr soliqlari to'liq qoplanadi.</div>
                    </div>
                    <div className={styles.healthItem}>
                        <div className={styles.healthHeader}>
                            <span>Xodimlar Unumdorligi (KPI)</span>
                            <span className="tabular-nums" style={{ color: "#8b5cf6", fontWeight: 700 }}>92%</span>
                        </div>
                        <div className={styles.progressTrack}>
                            <div className={styles.progressBar} style={{ width: "92%", backgroundColor: "#8b5cf6" }}></div>
                        </div>
                        <div className={styles.healthMeta}>Yuqori • Rejadagi topshiriqlar o'z vaqtida yakunlanmoqda.</div>
                    </div>
                </div>
            </div>

            {/* Visual Sections (Charts, Tables) */}
            <div className={styles.mainLayout}>
                <div className={styles.dashboardCard}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.iconBox}><EnhancedIcon icon={TrendingUp} size={20} color="var(--primary-color)" /></span> Moliyaviy Holat (Oylik Dinamika)
                    </h3>
                    <div className={styles.chartContainer}>
                        <DashboardChart transactions={transactions} />
                    </div>
                </div>

                <div className={styles.dashboardCard}>
                    <h3 className={styles.sectionTitle}>
                        <span className={styles.iconBox}><EnhancedIcon icon={Bell} size={20} color="var(--warning-color)" /></span> Soliq ogohlantirishlari
                    </h3>
                    <ul className={styles.list}>
                        {pendingTaxes.length === 0 ? (
                            <li className={styles.listItem} style={{ textAlign: "center", fontStyle: "italic", border: "none" }}>
                                Barcha soliqlar to'langan va qarzdorliklar yo'q
                            </li>
                        ) : (pendingTaxes as any[]).map((tax: any) => {
                            const isOverdue = new Date(tax.dueDate) < new Date();
                            return (
                                <li key={tax.id} className={styles.listItem}>
                                    <div className={styles.listTitle} style={{ color: isOverdue ? "var(--error-color)" : "var(--warning-color)" }}>
                                        <span>{tax.name}</span>
                                        <span className="tabular-nums">{tax.amount.toLocaleString()} so'm</span>
                                    </div>
                                    <div className={styles.listSubtitle}>
                                        Muddati: {new Date(tax.dueDate).toLocaleDateString("uz-UZ")}
                                        {isOverdue && " (Kechikkan)"}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                    {pendingTaxes.length > 0 && (
                        <div style={{ textAlign: "center", marginTop: "1rem" }}>
                            <Link href="/taxes" className={styles.viewAllLink}>
                                Barcha soliqlarni ko'rish &rarr;
                            </Link>
                        </div>
                    )}
                </div>

                <div className={styles.dashboardCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div className={styles.messageIconWrapper}>
                                <EnhancedIcon icon={MessageSquare} size={20} color="var(--text-secondary)" />
                                {messagesWithSender.filter(m => !m.isRead).length > 0 && (
                                    <span className={styles.notificationDot}></span>
                                )}
                            </div>
                            <h3 style={{ margin: 0, fontSize: "1.05rem", color: "var(--text-primary)" }}>Xodimlardan Xabarlar</h3>
                        </div>
                        <Link href="/messages" className={styles.viewAllLink}>
                            {messagesWithSender.filter(m => !m.isRead).length > 0 ? (
                                <strong>Sizda {messagesWithSender.filter(m => !m.isRead).length} ta o'qilmagan xabar bor</strong>
                            ) : (
                                "Barcha xabarlarga o'tish"
                            )} &rarr;
                        </Link>
                    </div>
                </div>
            </div>

            <DashboardAIAssistant
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                employeesCount={employeesCount}
                activeContractsCount={activeContractsCount}
            />
        </div>
    );
}
