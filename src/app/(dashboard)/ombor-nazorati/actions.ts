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
  items: { productId: string; quantityChange: number; costPrice?: number; countedQty?: number; expectedQty?: number; notes?: string }[];
}) {
  const user = await getCurrentUser();
  if (!user?.id || !user.companyId) return { success: false, error: "Unauthorized" };

  try {
    const result = await prisma.$transaction(async (tx) => {
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
              countedQty: item.countedQty !== undefined ? item.countedQty : null,
              expectedQty: item.expectedQty !== undefined ? item.expectedQty : null,
              notes: item.notes,
            }))
          }
        },
      });

      return doc;
    });

    return { success: true, document: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

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
      else if (doc.type === "SPISANIYE") {
         for (const item of doc.items) {
           await tx.product.update({
             where: { id: item.productId },
             data: { quantity: { increment: item.quantityChange } }
           });
         }
      }
      else if (doc.type === "INVENTARIZASIYA") {
         for (const item of doc.items) {
           if (item.countedQty !== null) {
             await tx.product.update({
               where: { id: item.productId },
               data: { quantity: item.countedQty }
             });
           }
         }
      }
      else if (doc.type === "TRANSFER") {
         if (doc.destId) {
           for (const item of doc.items) {
             await tx.product.update({
               where: { id: item.productId },
               data: { warehouseId: doc.destId }
             });
           }
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
