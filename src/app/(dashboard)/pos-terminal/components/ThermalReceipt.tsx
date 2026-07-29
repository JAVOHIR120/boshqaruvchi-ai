"use client";

import React, { forwardRef } from "react";

interface ReceiptProps {
  cart: any[];
  total: number;
  paidAmount: number;
  cashAmount: number;
  cardAmount: number;
  debtAmount: number;
  bonusUsed: number;
  discount: number;
  cashierName: string;
  companyName?: string;
  inn?: string;
  transactionId?: string;
  paymentMethod: string;
}

const formatNumber = (num: number) => num.toLocaleString("ru-RU");

const ThermalReceipt = forwardRef<HTMLDivElement, ReceiptProps>(({
  cart, total, paidAmount, cashAmount, cardAmount, debtAmount, bonusUsed, discount, cashierName, companyName, inn, transactionId, paymentMethod
}, ref) => {
  return (
    <div style={{ display: "none" }}>
      {/* 
        This div is hidden on screen but will be printed.
        We use ultra-simple standard HTML to ensure thermal printer compatibility.
        Width is fixed approx 80mm (around 300px).
      */}
      <div 
        ref={ref} 
        className="print-receipt" 
        style={{ width: "300px", padding: "10px", fontFamily: "monospace", fontSize: "12px", color: "#000", background: "#fff" }}
      >
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <h2 style={{ fontSize: "16px", margin: "0", fontWeight: "bold" }}>{companyName || "SUPERMARKET"}</h2>
          {inn && <p style={{ margin: "2px 0 5px 0" }}>STIR (INN): {inn}</p>}
          <p style={{ margin: "2px 0", borderBottom: "1px dashed #000", paddingBottom: "5px" }}>Savdo Cheki</p>
        </div>

        <div style={{ marginBottom: "10px", fontSize: "11px" }}>
          <p style={{ margin: "2px 0" }}>Kassir: {cashierName}</p>
          <p style={{ margin: "2px 0" }}>Sana: {new Date().toLocaleString("ru-RU")}</p>
          {transactionId && <p style={{ margin: "2px 0" }}>Chek raqami: {transactionId.slice(-6)}</p>}
        </div>

        <table style={{ width: "100%", marginBottom: "10px", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ borderBottom: "1px dashed #000", borderTop: "1px dashed #000" }}>
              <th style={{ textAlign: "left", padding: "2px" }}>Nomi</th>
              <th style={{ textAlign: "right", padding: "2px" }}>Miqdor</th>
              <th style={{ textAlign: "right", padding: "2px" }}>Summa</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan={3} style={{ padding: "4px 2px 0 2px", fontWeight: "bold" }}>{item.name}</td>
                </tr>
                <tr>
                  <td style={{ padding: "0 2px 4px 2px", color: "#444" }}>
                    {formatNumber(item.price)} x {item.cartQuantity} {item.unit}
                  </td>
                  <td style={{ textAlign: "right", padding: "0 2px 4px 2px" }}></td>
                  <td style={{ textAlign: "right", padding: "0 2px 4px 2px" }}>{formatNumber(item.cartTotal)}</td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div style={{ borderTop: "1px dashed #000", paddingTop: "5px", marginBottom: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0", fontSize: "14px", fontWeight: "bold" }}>
             <span>JAMI TO'LOV:</span>
             <span>{formatNumber(total)}</span>
          </div>
          {discount > 0 && (
             <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
               <span>Chegirma:</span>
               <span>-{formatNumber(discount)}</span>
             </div>
          )}
          
          <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0", marginTop: "10px" }}>
             <span>To'lov turi:</span>
             <span>
                {paymentMethod === "MIXED" ? "Aralash" : 
                 paymentMethod === "CARD" ? "Plastik" : 
                 paymentMethod === "DEBT" ? "Qarz" : "Naqd"}
             </span>
          </div>

          {(cashAmount > 0 || cardAmount > 0 || debtAmount > 0 || bonusUsed > 0) && paymentMethod === "MIXED" && (
            <div style={{ fontSize: "11px", marginTop: "4px" }}>
              {cashAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Naqd:</span><span>{formatNumber(cashAmount)}</span></div>}
              {cardAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plastik karta:</span><span>{formatNumber(cardAmount)}</span></div>}
              {debtAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Qarzga:</span><span>{formatNumber(debtAmount)}</span></div>}
              {bonusUsed > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Bonusdan:</span><span>{formatNumber(bonusUsed)}</span></div>}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0", marginTop: "5px", borderTop: "1px dashed #000", paddingTop: "5px" }}>
             <span>BERILDI (NAQD):</span>
             <span>{formatNumber(paidAmount)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", margin: "2px 0" }}>
             <span>QAYTIM:</span>
             <span>{formatNumber(Math.max(0, paidAmount - (paymentMethod === "MIXED" ? cashAmount : total)))}</span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: "20px" }}>
           <p style={{ margin: "2px 0" }}>XARIDINGIZ UCHUN RAHMAT!</p>
           {/* Placeholder for QR Code */}
           <div style={{ border: "1px solid #000", width: "100px", height: "100px", margin: "10px auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
               QR KOD
           </div>
        </div>

        {/* Global styles for printing specifically this ref */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            .print-receipt, .print-receipt * {
              visibility: visible;
            }
            .print-receipt {
              position: absolute;
              left: 0;
              top: 0;
              width: 80mm;
              margin: 0;
              padding: 0;
            }
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
        `}} />
      </div>
    </div>
  );
});

ThermalReceipt.displayName = "ThermalReceipt";
export default ThermalReceipt;
