import fs from 'fs';
import path from 'path';

// Korxona holati va aktivlari (Soliq kodeksidagi istisnolar uchun)
export interface CompanyAssets {
  industry: 'umumiy' | 'bank' | 'sement' | 'budjet_tashkilot' | 'it_park'; // Soha
  propertyValue: number; 
  landArea: number; 
  waterUsageM3: number; 
  isExcisePayer: boolean; 
  isSubsoilUser: boolean; 
  isExporter: boolean; // Eksport qiluvchilar uchun QQS 0% (260-modda)
}

export interface BankTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'debet' | 'kredit'; 
  purpose: string;
  counterparty: string;
  isCategorized: boolean;
  category?: TransactionCategory;
  taxCodeReference?: string;
}

export enum TransactionCategory {
  INCOME_TAXABLE = 'INCOME_TAXABLE',
  INCOME_NON_TAXABLE = 'INCOME_NON_TAXABLE',
  EXPENSE_PAYROLL = 'EXPENSE_PAYROLL',
  EXPENSE_DEDUCTIBLE = 'EXPENSE_DEDUCTIBLE',
  EXPENSE_NON_DEDUCTIBLE = 'EXPENSE_NON_DEDUCTIBLE',
  TAX_PAYMENT = 'TAX_PAYMENT',
  DIVIDEND_PAYMENT = 'DIVIDEND_PAYMENT',
  UNKNOWN = 'UNKNOWN',
}

// BARCHA SOLIQ STAVKALARI VA ISTISNOLAR (Soliq Kodeksi tahlili asosida)
export const getTaxRates = (assets?: CompanyAssets) => {
  const isBankOrCement = assets?.industry === 'bank' || assets?.industry === 'sement';
  const isBudget = assets?.industry === 'budjet_tashkilot';
  const isItPark = assets?.industry === 'it_park';

  return {
    // 1. QQS (258, 260-moddalar)
    VAT: assets?.isExporter ? 0 : 0.12, // Eksport uchun 0%, qolganlarga 12%
    
    // 2. Aksiz solig'i (289-modda)
    EXCISE_TAX: 0.20, 
    
    // 3. Foyda solig'i (337-modda)
    // Banklar va sement zavodlari uchun 20%, qolganlarga 15%. IT Park uchun 0%.
    PROFIT_TAX: isItPark ? 0 : (isBankOrCement ? 0.20 : 0.15),
    
    // 4. JSHDS va Dividendlar (381-modda)
    INCOME_TAX_INDIVIDUAL: isItPark ? 0.075 : 0.12, // IT Park xodimlari uchun JSHDS 7.5%
    DIVIDEND_TAX: isItPark ? 0 : 0.05, // IT Park uchun dividend solig'i 0%
    
    // 5. Yer qa'ridan foydalanganlik
    SUBSOIL_TAX: 0.10, 
    
    // 6. Suv resurslaridan foydalanganlik
    WATER_TAX_PER_M3: 160, 
    
    // 7. Mol-mulk solig'i (414-modda)
    PROPERTY_TAX: 0.015, 
    
    // 8. Yer solig'i (429-modda)
    LAND_TAX_PER_HA: 25000000, 
    
    // 9. Ijtimoiy soliq (405-modda)
    // Budjet tashkilotlari uchun 25%, qolganlarga 12%
    SOCIAL_TAX: isBudget ? 0.25 : 0.12, 
    
    // 10. Aylanmadan olinadigan soliq (467-modda)
    TURNOVER_TAX: 0.04, 
  };
};

export const TAX_CODE_REFERENCES = {
  GENERAL_TAXES: "17-modda. Soliqlarning va yig'imlarning turlari",
  VAT: "258-modda va 260-modda. QQS stavkalari",
  EXCISE: "289-modda. Aksiz solig'i stavkalari",
  PROFIT_TAX: "337-modda. Foyda solig'i stavkalari (Umumiy, Banklar va Sement zavodlar)",
  INCOME_TAX_INDIVIDUAL: "381-modda. JSHDS stavkasi (IT Park imtiyozlari bilan)",
  SUBSOIL: "452-modda. Yer qa'ridan foydalanganlik solig'i stavkalari",
  WATER: "445-modda. Suv resurslaridan foydalanganlik solig'i stavkalari",
  PROPERTY: "414-modda. Yuridik shaxslarning mol-mulkiga solinadigan soliq stavkalari",
  LAND: "429-modda. Yuridik shaxslardan olinadigan yer solig'ining tayanch stavkalari",
  SOCIAL_TAX: "405-modda. Ijtimoiy soliq stavkalari",
  TURNOVER_TAX: "467-modda. Aylanmadan olinadigan soliq stavkalari",
  NON_TAXABLE_INCOME: "304-modda. Hisobga olinmaydigan daromadlar",
};

export class TaxAutomationEngine {
  
  public categorizeTransactions(transactions: BankTransaction[]): BankTransaction[] {
    return transactions.map((t) => {
      let category = TransactionCategory.UNKNOWN;
      let reference = '';
      const purpose = t.purpose.toLowerCase();

      if (t.type === 'kredit') {
        if (purpose.includes('qarz') || purpose.includes('zaym') || purpose.includes('ustav') || purpose.includes('vozvrat') || purpose.includes('kredit')) {
          category = TransactionCategory.INCOME_NON_TAXABLE;
          reference = TAX_CODE_REFERENCES.NON_TAXABLE_INCOME;
        } else {
          category = TransactionCategory.INCOME_TAXABLE;
        }
      } else if (t.type === 'debet') {
        if (purpose.includes('oylik') || purpose.includes('zarplata') || purpose.includes('ish haqi') || purpose.includes('avans') || purpose.includes('mukofot')) {
          category = TransactionCategory.EXPENSE_PAYROLL;
        } else if (purpose.includes('dividend')) {
          category = TransactionCategory.DIVIDEND_PAYMENT;
        } else if (purpose.includes('soliq') || purpose.includes('nalog') || purpose.includes('bojxona') || purpose.includes('g\'azna')) {
          category = TransactionCategory.TAX_PAYMENT;
        } else if (purpose.includes('jarima') || purpose.includes('penya')) {
          category = TransactionCategory.EXPENSE_NON_DEDUCTIBLE;
        } else {
          category = TransactionCategory.EXPENSE_DEDUCTIBLE;
        }
      }

      return {
        ...t,
        isCategorized: true,
        category,
        taxCodeReference: reference,
      };
    });
  }

  // Barcha soliqlarni to'liq hisoblash
  public calculateTaxes(
    transactions: BankTransaction[], 
    taxRegime: 'turnover' | 'vat_profit' = 'turnover',
    assets?: CompanyAssets
  ) {
    const categorized = this.categorizeTransactions(transactions);
    const rates = getTaxRates(assets);
    
    let totalIncome = 0;
    let taxableIncome = 0;
    let totalPayroll = 0;
    let dividendPayments = 0;
    let deductibleExpenses = 0;

    categorized.forEach(t => {
      if (t.type === 'kredit') {
        totalIncome += t.amount;
        if (t.category === TransactionCategory.INCOME_TAXABLE) {
          taxableIncome += t.amount;
        }
      } else if (t.type === 'debet') {
        if (t.category === TransactionCategory.EXPENSE_PAYROLL) {
          totalPayroll += t.amount;
        } else if (t.category === TransactionCategory.DIVIDEND_PAYMENT) {
          dividendPayments += t.amount;
        } else if (t.category === TransactionCategory.EXPENSE_DEDUCTIBLE) {
          deductibleExpenses += t.amount;
        }
      }
    });

    const results = {
      summary: { totalIncome, taxableIncome, totalPayroll, deductibleExpenses },
      taxes: [] as any[]
    };

    // 1. Ish haqi soliqlari (JSHDS va Ijtimoiy soliq)
    if (totalPayroll > 0) {
      const grossPayroll = totalPayroll / 0.87; 
      results.taxes.push({
        id: 'jshds',
        type: 'Jismoniy shaxslardan olinadigan daromad solig\'i (JSHDS)',
        baseAmount: grossPayroll,
        rate: `${(rates.INCOME_TAX_INDIVIDUAL * 100).toFixed(1)}%`,
        calculatedTax: Math.round(grossPayroll * rates.INCOME_TAX_INDIVIDUAL),
        reference: TAX_CODE_REFERENCES.INCOME_TAX_INDIVIDUAL,
        action: 'Daromad solig\'i hisobotiga kiritiladi'
      });
      results.taxes.push({
        id: 'social',
        type: 'Ijtimoiy Soliq',
        baseAmount: grossPayroll,
        rate: `${(rates.SOCIAL_TAX * 100).toFixed(1)}%`,
        calculatedTax: Math.round(grossPayroll * rates.SOCIAL_TAX),
        reference: TAX_CODE_REFERENCES.SOCIAL_TAX,
        action: 'Ijtimoiy soliq hisobotiga kiritiladi'
      });
    }

    // 2. Dividendlar uchun soliq
    if (dividendPayments > 0) {
      const grossDividend = dividendPayments / 0.95;
      results.taxes.push({
        id: 'dividend',
        type: 'Dividendlar bo\'yicha daromad solig\'i',
        baseAmount: grossDividend,
        rate: `${(rates.DIVIDEND_TAX * 100).toFixed(1)}%`,
        calculatedTax: Math.round(grossDividend * rates.DIVIDEND_TAX),
        reference: TAX_CODE_REFERENCES.INCOME_TAX_INDIVIDUAL,
        action: 'Daromad solig\'i hisoboti, dividendlar qismi'
      });
    }

    // 3. Aylanma YOKI QQS+Foyda
    if (taxRegime === 'turnover') {
      results.taxes.push({
        id: 'turnover',
        type: 'Aylanmadan olinadigan soliq',
        baseAmount: taxableIncome,
        rate: `${(rates.TURNOVER_TAX * 100).toFixed(1)}%`,
        calculatedTax: Math.round(taxableIncome * rates.TURNOVER_TAX),
        reference: TAX_CODE_REFERENCES.TURNOVER_TAX,
        action: 'Aylanma soliq hisoboti 010-satr'
      });
    } else {
      const vatPayable = taxableIncome * (rates.VAT / (1 + rates.VAT)); 
      const vatDeductible = deductibleExpenses * (rates.VAT / (1 + rates.VAT)); 
      const netVat = Math.max(0, vatPayable - vatDeductible);

      results.taxes.push({
        id: 'vat',
        type: 'Qo\'shilgan qiymat solig\'i (QQS)',
        baseAmount: taxableIncome,
        rate: `${(rates.VAT * 100).toFixed(1)}%`,
        calculatedTax: Math.round(netVat),
        reference: TAX_CODE_REFERENCES.VAT,
        action: 'QQS hisoboti, 1-ilova'
      });

      const profit = (taxableIncome - vatPayable) - (deductibleExpenses - vatDeductible) - totalPayroll;
      if (profit > 0) {
        results.taxes.push({
          id: 'profit',
          type: 'Foyda solig\'i',
          baseAmount: profit,
          rate: `${(rates.PROFIT_TAX * 100).toFixed(1)}%`,
          calculatedTax: Math.round(profit * rates.PROFIT_TAX),
          reference: TAX_CODE_REFERENCES.PROFIT_TAX,
          action: 'Foyda solig\'i hisoboti'
        });
      }
    }

    // 4. Qo'shimcha (Aktiv) soliqlar
    if (assets) {
      if (assets.propertyValue > 0) {
        const monthlyPropertyTax = (assets.propertyValue * rates.PROPERTY_TAX) / 12;
        results.taxes.push({
          id: 'property',
          type: 'Mol-mulk solig\'i (oylik avans)',
          baseAmount: assets.propertyValue,
          rate: `${(rates.PROPERTY_TAX * 100).toFixed(1)}% (Yillik)`,
          calculatedTax: Math.round(monthlyPropertyTax),
          reference: TAX_CODE_REFERENCES.PROPERTY,
          action: 'Mol-mulk solig\'i bo\'yicha bo\'nak to\'lovlari formasi'
        });
      }

      if (assets.landArea > 0) {
        const monthlyLandTax = (assets.landArea * rates.LAND_TAX_PER_HA) / 12;
        results.taxes.push({
          id: 'land',
          type: 'Yer solig\'i (oylik avans)',
          baseAmount: assets.landArea + ' Ga',
          rate: `${rates.LAND_TAX_PER_HA.toLocaleString()} so'm/Ga (Yillik)`,
          calculatedTax: Math.round(monthlyLandTax),
          reference: TAX_CODE_REFERENCES.LAND,
          action: 'Yer solig\'i bo\'yicha bo\'nak to\'lovlari formasi'
        });
      }

      if (assets.waterUsageM3 > 0) {
        results.taxes.push({
          id: 'water',
          type: 'Suv resurslaridan foydalanganlik solig\'i',
          baseAmount: assets.waterUsageM3 + ' kub.m',
          rate: `${rates.WATER_TAX_PER_M3} so'm/kub.m`,
          calculatedTax: Math.round(assets.waterUsageM3 * rates.WATER_TAX_PER_M3),
          reference: TAX_CODE_REFERENCES.WATER,
          action: 'Suv solig\'i hisoboti'
        });
      }

      if (assets.isExcisePayer && taxableIncome > 0) {
        results.taxes.push({
          id: 'excise',
          type: 'Aksiz solig\'i (Maxsus tovarlar bo\'yicha)',
          baseAmount: taxableIncome,
          rate: `O'rtacha ${(rates.EXCISE_TAX * 100).toFixed(1)}%`,
          calculatedTax: Math.round(taxableIncome * rates.EXCISE_TAX),
          reference: TAX_CODE_REFERENCES.EXCISE,
          action: 'Aksiz solig\'i hisobot formasi'
        });
      }

      if (assets.isSubsoilUser && taxableIncome > 0) {
        results.taxes.push({
          id: 'subsoil',
          type: 'Yer qa\'ridan foydalanganlik uchun soliq',
          baseAmount: taxableIncome,
          rate: `O'rtacha ${(rates.SUBSOIL_TAX * 100).toFixed(1)}%`,
          calculatedTax: Math.round(taxableIncome * rates.SUBSOIL_TAX),
          reference: TAX_CODE_REFERENCES.SUBSOIL,
          action: 'Yer qa\'ri solig\'i hisobot formasi'
        });
      }
    }

    return results;
  }
}

export const taxEngine = new TaxAutomationEngine();
