"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";

export async function getPosProducts() {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "Unauthorized" };

  try {
    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });
    return { success: true, products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function openPosShift(startingCash: number) {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "Unauthorized" };

  try {
    const activeShift = await prisma.posShift.findFirst({
      where: { cashierId: user.id, status: "OPEN" },
    });
    
    if (activeShift) {
      return { success: false, error: "Smena allaqachon ochiq!" };
    }

    const shift = await prisma.posShift.create({
      data: {
        cashierId: user.id,
        startingCash: startingCash,
        status: "OPEN",
      },
    });

    return { success: true, shift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getActiveShift() {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "Unauthorized" };

  try {
    const shift = await prisma.posShift.findFirst({
      where: { cashierId: user.id, status: "OPEN" },
    });
    return { success: true, shift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function closePosShift(expectedCash: number) {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "Unauthorized" };

  try {
    const activeShift = await prisma.posShift.findFirst({
      where: { cashierId: user.id, status: "OPEN" },
      include: { transactions: true },
    });

    if (!activeShift) {
      return { success: false, error: "Ochiq smena topilmadi." };
    }

    const totalSales = activeShift.transactions.reduce((acc: number, tx: any) => acc + tx.paidAmount, 0);

    const closedShift = await prisma.posShift.update({
      where: { id: activeShift.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        closingCash: expectedCash,
        totalSales: totalSales,
      },
    });

    return { success: true, shift: closedShift };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTransaction(data: {
  shiftId: string;
  type: string;
  paymentMethod: string;
  totalAmount: number;
  paidAmount: number;
  cashAmount: number;
  cardAmount: number;
  debtAmount: number;
  bonusUsed: number;
  discount: number;
  clientId?: string;
  items: { productId: string; quantity: number; price: number; total: number }[];
}) {
  const user = await getCurrentUser();
  if (!user?.id) return { success: false, error: "Unauthorized" };

  try {
    const transaction = await prisma.posTransaction.create({
      data: {
        shiftId: data.shiftId,
        type: data.type,
        paymentMethod: data.paymentMethod,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        cashAmount: data.cashAmount,
        cardAmount: data.cardAmount,
        debtAmount: data.debtAmount,
        bonusUsed: data.bonusUsed,
        discount: data.discount,
        clientId: data.clientId,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
    });

    if (data.type === "SALE" || data.type === "COMPLETED") {
      for (const item of data.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }
    
    // CRM: Qarz va bonus hisob-kitobi
    if (data.clientId) {
        if (data.debtAmount > 0) {
            await prisma.lead.update({
                where: { id: data.clientId },
                data: { totalDebt: { increment: data.debtAmount } }
            });
        }
        if (data.bonusUsed > 0) {
            await prisma.lead.update({
                where: { id: data.clientId },
                data: { bonusBalance: { decrement: data.bonusUsed } }
            });
        }
    }

    return { success: true, transaction };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Qarzni qisman to'lash yoki kassa operatsiyalari uchun action
export async function addCashOperation(shiftId: string, type: "IN" | "OUT", amount: number) {
  try {
     const updateData = type === "IN" ? { cashIn: { increment: amount } } : { cashOut: { increment: amount } };
     await prisma.posShift.update({
         where: { id: shiftId },
         data: updateData
     });
     return { success: true };
  } catch(e: any) {
     return { success: false, error: e.message };
  }
}
