"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

// =====================================
// WAREHOUSE (OMBORLAR)
// =====================================
export async function getWarehouses() {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "Unauthorized" };

  try {
    const warehouses = await prisma.inventoryWarehouse.findMany({
      where: { companyId: user.companyId },
      orderBy: { createdAt: "asc" },
    });
    return { success: true, warehouses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createWarehouse(data: { name: string; type: string; address?: string }) {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "Unauthorized" };

  try {
    const warehouse = await prisma.inventoryWarehouse.create({
      data: { ...data, companyId: user.companyId },
    });
    return { success: true, warehouse };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =====================================
// INVENTORY DOCUMENTS (PRIHOD, TRANSFER, etc)
// =====================================
export async function createInventoryDocument(data: {
  type: string;
  documentNumber: string;
  notes?: string;
  originId?: string;
  destId?: string;
  supplierId?: string;
  items: { productId: string; quantityChange: number; costPrice?: number; notes?: string }[];
}) {
  const user = await getCurrentUser();
  if (!user?.id || !user.companyId) return { success: false, error: "Unauthorized" };

  try {
    // Transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Document
      const totalAmount = data.items.reduce((sum, item) => sum + (Math.abs(item.quantityChange) * (item.costPrice || 0)), 0);

      const doc = await tx.inventoryDocument.create({
        data: {
          type: data.type,
          documentNumber: data.documentNumber,
          notes: data.notes,
          originId: data.originId,
          destId: data.destId,
          supplierId: data.supplierId,
          totalAmount,
          companyId: user.companyId!,
          createdBy: user.id,
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantityChange: item.quantityChange,
              costPrice: item.costPrice || 0,
              totalPrice: Math.abs(item.quantityChange) * (item.costPrice || 0),
              notes: item.notes,
            }))
          }
        },
      });

      // 2. Process Document based on Type if it's considered DRAFT no change, if COMPLETED process immediately
      // But for Regos logic, Prihod is instant COMPLETED typically, or we can use a separate process func.
      // Let's assume this creates it as DRAFT.
      return doc;
    });

    return { success: true, document: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Complete the document (Applying state to products)
export async function completeDocument(documentId: string) {
  const user = await getCurrentUser();
  if (!user?.id || !user.companyId) return { success: false, error: "Unauthorized" };

  try {
    const doc = await prisma.inventoryDocument.findUnique({
      where: { id: documentId, companyId: user.companyId },
      include: { items: true }
    });

    if (!doc || doc.status !== "DRAFT") throw new Error("Yaroqsiz xujjat");

    await prisma.$transaction(async (tx) => {
      // PRIHOD LOGIC - AVCO calculation
      if (doc.type === "PRIHOD") {
        for (const item of doc.items) {
           const product = await tx.product.findUnique({ where: { id: item.productId } });
           if (!product) continue;
           
           const currentTotalValue = product.quantity * product.avgCostPrice;
           const newIncomingValue = item.quantityChange * item.costPrice;
           const newTotalQuantity = product.quantity + item.quantityChange;
           const newAvgCostPrice = newTotalQuantity > 0 ? (currentTotalValue + newIncomingValue) / newTotalQuantity : item.costPrice;

           await tx.product.update({
             where: { id: item.productId },
             data: {
                quantity: newTotalQuantity,
                costPrice: item.costPrice,
                avgCostPrice: newAvgCostPrice,
             }
           });
        }
      } 
      // SPISANIYE LOGIC
      else if (doc.type === "SPISANIYE") {
         for (const item of doc.items) {
           // item.quantityChange should be NEGATIVE
           await tx.product.update({
             where: { id: item.productId },
             data: { quantity: { increment: item.quantityChange } } // decrement since it's already negative
           });
         }
      }

      await tx.inventoryDocument.update({
        where: { id: documentId },
        data: { status: "COMPLETED" }
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventoryDocuments(type?: string) {
  const user = await getCurrentUser();
  if (!user?.companyId) return { success: false, error: "Unauthorized" };

  try {
    const docs = await prisma.inventoryDocument.findMany({
      where: { 
        companyId: user.companyId,
        ...(type ? { type } : {})
      },
      include: { supplier: true, originWarehouse: true, destWarehouse: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, documents: docs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
