import { Suspense } from 'react';
import styles from './page.module.css';
import TaxCodeViewer from './components/TaxCodeViewer';
import AiTaxConsultant from './components/AiTaxConsultant';
import TaxAutoCalculator from './components/TaxAutoCalculator';
import TaxCalculator from './components/TaxCalculator';
import TaxDashboard from './components/TaxDashboard';
import { Scale } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function TaxesPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const [transactions, employees, taxReports, inventoryItems] = await Promise.all([
        prisma.transaction.findMany({ where: { companyId: currentUser.companyId }, orderBy: { date: 'desc' } }),
        prisma.employee.findMany({ where: { companyId: currentUser.companyId }, include: { user: true } }),
        prisma.taxReport.findMany({ where: { companyId: currentUser.companyId }, orderBy: { dueDate: 'asc' } }),
        prisma.inventoryItem.findMany({ where: { companyId: currentUser.companyId } }),
    ]);

    // 1. Daromad va xarajatlar
    const totalIncome = transactions
        .filter((t: any) => t.type === 'INCOME')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

    // 2. Oylik fond (jami xodimlar oyligi)
    const totalSalaryFund = employees.reduce((sum: number, e: any) => sum + e.salary, 0);

    // 3. Inventar qiymati
    const inventoryValue = inventoryItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // 4. Sof foyda (profit)
    const netProfit = Math.max(0, totalIncome - totalExpense);

    // 5. TaxBaseData — barcha hisoblash taxEngine.ts da bajariladi
    const taxData = {
        totalIncome,
        totalExpense,
        netProfit,
        totalSalaryFund,
        employeeCount: employees.length,
        inventoryValue,
    };

    // Taqvim uchun oddiy computed (faqat asosiy 4 ta)
    const computedTaxes = {
        qqs: Math.round(totalIncome * 0.12),
        foydaSoliq: Math.round(netProfit * 0.15),
        daromadSoliq: Math.round(totalSalaryFund * 0.12),
        ijtimoiySoliq: Math.round(totalSalaryFund * 0.12),
        molMulkSoliq: Math.round(inventoryValue * 0.015 / 12),
        aylanmaSoliq: Math.round(totalIncome * 0.04),
    };

    const taxReportsSerialized = taxReports.map((r: any) => ({
        id: r.id,
        name: r.name,
        period: r.period,
        amount: r.amount,
        status: r.status,
        dueDate: r.dueDate.toISOString(),
    }));

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <Scale className={styles.titleIcon} />
                        Soliq Boshqaruvi
                    </h1>
                    <p className={styles.subtitle}>
                        O&apos;zbekiston Respublikasi Soliq Kodeksi (30.12.2019) · Avtomatik Hisoblash · Taqvim · AI Maslahatchi
                    </p>
                </div>
            </div>

            {/* Avtomatlashtirilgan Soliq Markazi — Haqiqiy tizim ma'lumotlari asosida */}
            <TaxDashboard serverData={{
                totalIncome,
                totalExpense,
                netProfit,
                totalSalaryFund,
                employeeCount: employees.length,
                inventoryValue,
                transactionCount: transactions.length,
            }} />

            {/* Avtomatik soliq hisoblash bloki */}
            <TaxAutoCalculator data={taxData} />

            {/* Soliq Kalkulyator (Manual) */}
            <TaxCalculator />

            <div className={styles.gridContainer}>
                {/* Chap — Soliq Kodeksi */}
                <div className={styles.mainColumn}>
                    <div className={`${styles.responsiveCard} card`}>
                        <div className="card-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                <Scale size={18} color="var(--accent-color)" />
                                Soliq Kodeksi — Qonun Matni
                            </h2>
                        </div>
                        <Suspense fallback={<div className="p-4" style={{ color: 'var(--text-secondary)' }}>Kodeks yuklanmoqda...</div>}>
                            <div className={styles.scrollableContent}>
                                <TaxCodeViewer />
                            </div>
                        </Suspense>
                    </div>
                </div>

                {/* O'ng — AI Maslahatchi */}
                <div className={styles.sideColumn}>
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                        <AiTaxConsultant />
                    </div>
                </div>
            </div>
        </div>
    );
}
