/**
 * Moliya va Soliq hisob-kitoblari yadrosi (O'zbekiston Respublikasi Soliq Kodeksi - 2024 yilstavkalari asosida)
 * 
 * Ushbu modul O'zbekiston Qonunchiligiga mos ravishda Soliq stavkalarini (QQS, AOS, Foyda, Ijtimoiy, JShDS) hisoblaydi.
 * Diqqat: Tizim Kesh va Hisoblash usulini inobatga olishi hamda chegirilmaydigan xarajatlar va QQS zachetini 
 * boshqarishi uchun mo'ljallangan parametrlarni qabul qiladi.
 */

// 2024 yil holatiga amaldagi soliq stavkalari
export const TAX_RATES_2024 = {
  VAT: 0.12, // Qo'shilgan qiymat solig'i (QQS - 12%)
  PROFIT_TAX: 0.15, // Foyda solig'i (15%)
  TURNOVER_TAX: 0.04, // Aylanmadan olinadigan soliq (AOS - 4%)
  SOCIAL_TAX: 0.12, // Ijtimoiy soliq (12%)
  PIT: 0.12, // Jismoniy shaxslardan olinadigan daromad solig'i (JShDS - 12%)
  DIVIDEND_TAX: 0.05, // Dividend solig'i (5%)
};

export type InvoiceReference = {
  id: string;
  amount: number;         // Jami summa
  vatAmount: number;      // Shu summadagi QQS miqdori
  vatStatus: 'Valid' | 'Pending' | 'Invalid'; // QQS Zachetga olinish statusi
  isTaxDeductible: boolean; // Foyda solig'idan chegiriladigan xarajatmi?
  type: 'INCOME' | 'EXPENSE'; 
  date: string;
};

export type PayrollData = {
  grossSalary: number; // Oylik hisoblangan ish haqi (Gross)
};

export interface TaxCalculationResult {
  turnoverTax: number;
  vatPayable: number;
  profitTax: number;
  socialTax: number;
  personalIncomeTax: number;
  totalTaxBurden: number;
  
  // Analytics
  deductibleExpenses: number;
  nonDeductibleExpenses: number;
  validInputVat: number;
  invalidInputVat: number;
}

/**
 * Soliqlarni chuqur tahlil asosida hisoblash
 * 
 * @param invoices - Tasdiqlangan hisob-fakturalar yoki cheklar ro'yxati
 * @param payroll - Ish haqi ma'lumotlari ro'yxati (JShDS va Ijtimoiy soliq uchun)
 * @returns Soliqlarning barcha turlari bo'yicha to'lanishi lozim bo'lgan summalar
 */
export function calculateTaxes(
  invoices: InvoiceReference[],
  payroll: PayrollData[] = []
): TaxCalculationResult {
  
  let totalIncomeAmount = 0;
  let totalOutputVat = 0;
  
  let deductibleExpenses = 0;
  let nonDeductibleExpenses = 0;
  let validInputVat = 0;
  let invalidInputVat = 0;

  invoices.forEach(inv => {
    if (inv.type === 'INCOME') {
      // Tushumlardan QQS ajratib olinadi (Agar QQS to'lovchi bo'lsa)
      totalIncomeAmount += (inv.amount - inv.vatAmount);
      totalOutputVat += inv.vatAmount;
    } else if (inv.type === 'EXPENSE') {
      // Xarajatlarni chegiriladigan va chegirilmaydiganlarga ajratish
      const expenseWithoutVat = inv.amount - inv.vatAmount;
      
      if (inv.isTaxDeductible) {
        deductibleExpenses += expenseWithoutVat;
      } else {
        nonDeductibleExpenses += expenseWithoutVat;
      }

      // QQS Zachet masalasi (Input VAT)
      if (inv.vatStatus === 'Valid') {
        validInputVat += inv.vatAmount;
      } else {
        invalidInputVat += inv.vatAmount;
      }
    }
  });

  // 1. Aylanmadan olinadigan soliq (AOS - 4%)
  // Eslatma: Odatda AOS to'lovchilar QQS to'lamaydi, shuning uchun jami summadan hisoblanadi.
  const totalTurnover = totalIncomeAmount + totalOutputVat; // QQSsiz va QQSli summa yig'indisi AOS reyimi uchun
  const turnoverTax = totalTurnover * TAX_RATES_2024.TURNOVER_TAX;

  // 2. QQS (VAT - 12%) hisob-kitobi
  // QQS majburiyati = Sotishdagi QQS - Xaridlardagi Tasdiqlangan (Valid) QQS
  const vatPayable = Math.max(0, totalOutputVat - validInputVat);

  // 3. Foyda solig'i (Profit Tax - 15%)
  // Sof foyda = Jami daromad - faqat CHEGIRILADIGAN xarajatlar
  // Eslatma: Non-deductible xarajatlar foydani kamaytirmaydi, demak soliq bazasini baland ushlab turadi.
  const taxableProfit = Math.max(0, totalIncomeAmount - deductibleExpenses);
  const profitTax = taxableProfit * TAX_RATES_2024.PROFIT_TAX;

  // 4. Ish haqi soliqlari (Payroll Taxes)
  let socialTax = 0;
  let personalIncomeTax = 0;

  payroll.forEach(p => {
    socialTax += p.grossSalary * TAX_RATES_2024.SOCIAL_TAX;
    personalIncomeTax += p.grossSalary * TAX_RATES_2024.PIT;
  });

  return {
    turnoverTax,
    vatPayable,
    profitTax,
    socialTax,
    personalIncomeTax,
    totalTaxBurden: vatPayable + profitTax + socialTax + personalIncomeTax, // AOS kiritilmaydi, chunki AOS va Foyda/QQS rejimi birga bo'lmaydi
    deductibleExpenses,
    nonDeductibleExpenses,
    validInputVat,
    invalidInputVat
  };
}
