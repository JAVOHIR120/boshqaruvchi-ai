import { prisma } from "@/lib/prisma";
import AccountingTabs from "./components/AccountingTabs";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AccountingPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    // 1. Fetching all necessary data - Parallel
    const [transactions, inventoryItems, investors, employees] = await Promise.all([
        prisma.transaction.findMany({
            where: { companyId: currentUser.companyId },
            orderBy: { date: "desc" },
        }),
        prisma.inventoryItem.findMany({ where: { companyId: currentUser.companyId } }),
        prisma.investor.findMany({ where: { companyId: currentUser.companyId } }),
        prisma.employee.findMany({ where: { companyId: currentUser.companyId } })
    ]);

    // 2. Calculating P&L (Daromad va Xarajat) - Shakl 2
    const totalIncome = transactions
        .filter((t) => t.type === "INCOME")
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter((t) => t.type === "EXPENSE")
        .reduce((sum, t) => sum + t.amount, 0);

    const taxExpenses = transactions
        .filter((t) => t.type === "EXPENSE" && (t.description.toLowerCase().includes("soliq") || t.description.toLowerCase().includes("tax")))
        .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = totalIncome; // Typically Revenue - COGS. Here using Total Income.
    const netProfit = totalIncome - totalExpense;

    // 3. Calculating Balance Sheet (Balans) - Shakl 1
    const cashBalance = totalIncome - totalExpense; // Bank/Cash in Hand

    const inventoryValue = inventoryItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0); // Asosiy Vositalar
    const totalAssets = cashBalance + inventoryValue; // Jami aktivlar

    const totalInvestment = investors.reduce((sum: number, inv: any) => sum + inv.totalInvestment, 0); // Ustav kapitali
    const retainedEarnings = netProfit; // Taqsimlanmagan foyda
    const totalEquity = totalInvestment + retainedEarnings; // Jami xususiy kapital

    const totalLiabilities = totalAssets - totalEquity; // Balans tenglamasi (Assets = Liabilities + Equity) asosida majburiyatlarni keltirib chiqarish

    return (
        <AccountingTabs
            transactions={transactions}
            employees={employees}
            balanceData={{
                assets: totalAssets,
                inventoryValue: inventoryValue,
                cashBalance: cashBalance,
                liabilities: totalLiabilities > 0 ? totalLiabilities : 0,
                equity: totalEquity,
                totalInvestment: totalInvestment,
                retainedEarnings: retainedEarnings
            }}
            pnlData={{
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                netProfit: netProfit,
                grossProfit: grossProfit,
                taxExpenses: taxExpenses
            }}
        />
    );
}
