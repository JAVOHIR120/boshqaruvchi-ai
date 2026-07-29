import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { actualQuantity, auditedBy, notes } = await req.json();

        if (actualQuantity === undefined || !auditedBy) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const item = await prisma.inventoryItem.findUnique({
            where: { id }
        });

        if (!item) {
            return NextResponse.json({ error: "Item not found" }, { status: 404 });
        }

        const difference = Number(actualQuantity) - item.quantity;

        let newStatus = item.status;
        if (Number(actualQuantity) === 0 && difference < 0) {
            // If item is completely missing, it might be marked as YAROQSIZ or need special attention
            // We'll keep the current status unless explicitly changed elsewhere, but auditing just updates quantities.
        }

        const [audit, updatedItem] = await prisma.$transaction([
            prisma.inventoryAudit.create({
                data: {
                    inventoryItemId: id,
                    expectedQuantity: item.quantity,
                    actualQuantity: Number(actualQuantity),
                    difference,
                    auditedBy,
                    notes
                }
            }),
            prisma.inventoryItem.update({
                where: { id },
                data: {
                    quantity: Number(actualQuantity),
                    lastChecked: new Date()
                }
            })
        ]);

        return NextResponse.json({ audit, updatedItem });

    } catch (error) {
        console.error("[INVENTORY_AUDIT_POST]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
