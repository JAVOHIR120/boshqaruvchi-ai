import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { calculateDepreciation } from "@/lib/taxEngine";
import { redirect } from "next/navigation";
import InventoryView from "./components/InventoryView";
import InventoryActions from "./components/InventoryActions";

export const metadata = {
    title: "Inventarizatsiya | Boshqaruvchi AI",
    description: "Asosiy vositalar hisobi, amortizatsiya hisoblash va audit",
};

export default async function InventoryPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const company = user.companyId
        ? await prisma.company.findUnique({ where: { id: user.companyId } })
        : null;

    const items = await prisma.inventoryItem.findMany({
        where: { companyId: user.companyId ?? undefined },
        include: {
            responsible: { include: { user: { select: { name: true } } } },
            audits: { orderBy: { date: "desc" }, take: 1 }
        },
        orderBy: { createdAt: "desc" }
    });

    const audits = await prisma.inventoryAudit.findMany({
        where: { inventoryItem: { companyId: user.companyId ?? undefined } },
        include: { inventoryItem: true },
        orderBy: { date: "desc" },
        take: 50
    });

    const totalItems = items.length;
    const totalValue = items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const brokenItemsCount = items.filter(i => i.status === "TAMIRTALAB" || i.status === "YAROQSIZ").length;

    const totalShortage = audits.filter(a => a.difference < 0).reduce((sum, a) => sum + Math.abs(a.difference), 0);
    const totalSurplus = audits.filter(a => a.difference > 0).reduce((sum, a) => sum + a.difference, 0);

    let totalDepreciation = 0;
    let totalResidualValue = 0;

    items.forEach(item => {
        const result = calculateDepreciation({
            price: item.price,
            quantity: item.quantity,
            purchaseDate: new Date(item.purchaseDate || item.createdAt),
            modernizationCosts: item.modernizationCosts,
            amortizationRate: item.amortizationRate,
            amortizationGroup: item.amortizationGroup ?? undefined,
            itParkResident: company?.itParkResident ?? false,
            category: item.category
        });
        totalDepreciation += result.totalDepreciation;
        totalResidualValue += result.residualValue;
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Inventarizatsiya</h2>
                <InventoryActions />
            </div>
            <InventoryView
                items={JSON.parse(JSON.stringify(items))}
                audits={JSON.parse(JSON.stringify(audits))}
                totalItems={totalItems}
                totalValue={totalValue}
                brokenItemsCount={brokenItemsCount}
                totalShortage={totalShortage}
                totalSurplus={totalSurplus}
                totalDepreciation={totalDepreciation}
                totalResidualValue={totalResidualValue}
                itParkResident={company?.itParkResident ?? false}
            />
        </div>
    );
}
