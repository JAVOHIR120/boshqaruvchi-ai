"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DashboardChartProps {
    transactions: {
        amount: number;
        type: string;
        date: Date;
    }[];
}

export default function DashboardChart({ transactions }: DashboardChartProps) {
    // Process transactions into monthly data
    const dataMap = new Map<string, { name: string; income: number; expense: number }>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthYear = d.toLocaleDateString("uz-UZ", { month: "short", year: "numeric" });
        dataMap.set(monthYear, { name: monthYear, income: 0, expense: 0 });
    }

    transactions.forEach(t => {
        const monthYear = new Date(t.date).toLocaleDateString("uz-UZ", { month: "short", year: "numeric" });
        if (dataMap.has(monthYear)) {
            const current = dataMap.get(monthYear)!;
            if (t.type === "INCOME") current.income += t.amount;
            if (t.type === "EXPENSE") current.expense += t.amount;
            dataMap.set(monthYear, current);
        }
    });

    const chartData = Array.from(dataMap.values());

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--success-color)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--success-color)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--error-color)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--error-color)" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-muted)", fontFamily: "var(--font-mono), monospace" }} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                <Tooltip 
                    cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }} 
                    contentStyle={{ 
                        borderRadius: "12px", 
                        border: "1px solid rgba(255, 255, 255, 0.08)", 
                        backgroundColor: "rgba(11, 15, 25, 0.9)", 
                        backdropFilter: "blur(12px)",
                        color: "var(--text-primary)", 
                        fontFamily: "var(--font-sans), sans-serif",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
                    }} 
                    itemStyle={{ color: "var(--text-primary)", fontSize: "0.85rem" }} 
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontFamily: "var(--font-sans), sans-serif", color: "var(--text-primary)", fontSize: "0.85rem" }} />
                <Area type="monotone" dataKey="income" name="Daromad" stroke="var(--success-color)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" name="Xarajat" stroke="var(--error-color)" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}
