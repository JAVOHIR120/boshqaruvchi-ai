/**
 * O'zbekiston Respublikasi Soliq Kodeksi (30.12.2019, 2024-yilgacha o'zgartirishlar bilan) asosida hisob-kitoblar motori.
 * 
 * Ushbu fayl ikki xil vazifani bajaradi:
 * 1. Umumiy soliq kalkulyatori (Aksiz, QQS, Foyda, Ijtimoiy, Aylanma, Yer va h.k.)
 * 2. Inventar amortizatsiyasi (306-308 moddalar)
 */

// --- 1. UMUMIY SOLIQ TURLARI VA INTERFEYSLAR ---

export type TaxType =
    | "QQS" | "FOYDA" | "DAROMAD" | "IJTIMOIY" | "MOL_MULK"
    | "YER" | "SUV" | "AKSIZ" | "RENTA" | "YER_QARI" | "AYLANMA";

export type EnterpriseType = "MCHJ_YIRIK" | "MCHJ_KICHIK" | "YATT" | "DXV";

export interface TaxBaseData {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    totalSalaryFund: number;
    employeeCount: number;
    inventoryValue: number;
}

export interface TaxToggleState {
    [key: string]: boolean;
}

export interface TaxSelectParams {
    foydaCategoryId?: string;
    molMulkCategoryId?: string;
    ijtimoiyCategoryId?: string;
    
    aksizItemId?: string;
    aksizQuantity?: number;
    
    suvItemId?: string;
    suvQuantity?: number;
    suvSource?: "yer_usti" | "yer_osti";
    
    yerItemId?: string;
    yerArea?: number; // In Hectares
    
    rentaItemId?: string;
    rentaRevenue?: number;
    
    yerQariItemId?: string;
    yerQariValue?: number;
    
    aylanmaCategoryId?: string;
    aylanmaRevenue?: number;
    aylanmaFixed?: "NONE" | "30_MLN" | "40_MLN";
}

export interface ComputedTaxModel {
    id: TaxType;
    label: string;
    amount: number;
    formula: string;
    color: string;
}

// --- 2. KONSTANTALAR ---

export const BHM = 375000; // Bazaviy hisoblash miqdori (2025 yil holatiga)

export const TAX_DEFINITIONS = [
    {
        id: "QQS" as TaxType,
        label: "QQS (12%)",
        fullName: "Qo'shilgan qiymat solig'i",
        color: "#3b82f6",
        icon: "TrendingUp",
        rateDisplay: "12%",
        modda: "258-modda",
        description: "Tovar va xizmatlar realizatsiyasidan olinadigan soliq.",
        inputType: "none"
    },
    {
        id: "FOYDA" as TaxType,
        label: "Foyda solig'i",
        fullName: "Yuridik shaxslardan olinadigan foyda solig'i",
        color: "#10b981",
        icon: "Landmark",
        rateDisplay: "Maxsus / 15%",
        modda: "337-modda",
        description: "Sof foydadan tabaqalashtirilgan stavkada olinadigan soliq.",
        inputType: "select_rate"
    },
    {
        id: "DAROMAD" as TaxType,
        label: "Daromad (12%)",
        fullName: "Jismoniy shaxslardan olinadigan daromad solig'i",
        color: "#8b5cf6",
        icon: "Users",
        rateDisplay: "12%",
        modda: "381-modda",
        description: "Xodimlar ish haqidan ushlab qolinadigan soliq.",
        inputType: "none"
    },
    {
        id: "IJTIMOIY" as TaxType,
        label: "Ijtimoiy soliq",
        fullName: "Ijtimoiy soliq",
        color: "#f59e0b",
        icon: "Briefcase",
        rateDisplay: "Maxsus / 12%",
        modda: "405-modda",
        description: "Mehnat fondiga nisbatan korxona xarajati.",
        inputType: "select_rate"
    },
    {
        id: "MOL_MULK" as TaxType,
        label: "Mol-mulk",
        fullName: "Yuridik shaxslarning mol-mulkiga solinadigan soliq",
        color: "#6366f1",
        icon: "Building2",
        rateDisplay: "Maxsus / 1.5%",
        modda: "415-modda",
        description: "Obyekt qiymatidan foizda undiriladigan yillik soliq.",
        inputType: "select_rate"
    },
    {
        id: "YER" as TaxType,
        label: "Yer solig'i",
        fullName: "Yuridik shaxslardan olinadigan yer solig'i",
        color: "#06b6d4",
        icon: "MapPin",
        rateDisplay: "Zonaga qarab",
        modda: "429-modda",
        description: "Maydon hajmiga qat'iy belgilangan qiymat.",
        inputType: "select_rate"
    },
    {
        id: "SUV" as TaxType,
        label: "Suv solig'i",
        fullName: "Suv resurslaridan foydalanganlik uchun soliq",
        color: "#0ea5e9",
        icon: "Droplets",
        rateDisplay: "Hajmga qarab",
        modda: "445-modda",
        description: "Iste'mol qilingan suv hajmidan hisoblanadi (m³).",
        inputType: "select_rate"
    },
    {
        id: "AKSIZ" as TaxType,
        label: "Aksiz solig'i",
        fullName: "Aksiz solig'i",
        color: "#ec4899",
        icon: "Wine",
        rateDisplay: "Turiga qarab",
        modda: "289-modda",
        description: "Maxsus tovarlar ishlab chiqarish yoki import qilishda.",
        inputType: "select_rate"
    },
    {
        id: "YER_QARI" as TaxType,
        label: "Yer qa'ri",
        fullName: "Yer qa'ridan foydalanganlik uchun soliq",
        color: "#14b8a6",
        icon: "Mountain",
        rateDisplay: "Stavka %",
        modda: "452-modda",
        description: "Foydali qazilmalarni qazib olganlik uchun soliq.",
        inputType: "select_rate"
    },
    {
        id: "RENTA" as TaxType,
        label: "Renta solig'i",
        fullName: "Maxsus renta solig'i",
        color: "#f43f5e",
        icon: "Coins",
        rateDisplay: "Renta daromadidan",
        modda: "4541-modda",
        description: "Qazib olingan metall/uglevodorod renta daromadidan.",
        inputType: "select_rate"
    },
    {
        id: "AYLANMA" as TaxType,
        label: "Aylanma soliq",
        fullName: "Aylanmadan olinadigan soliq",
        color: "#ca8a04",
        icon: "PieChart",
        rateDisplay: "Maxsus / 4%",
        modda: "467-modda",
        description: "Umumiy tushumdan (xarajatlarni chegirilmasdan) olinadi.",
        inputType: "select_rate"
    }
];

export const ENTERPRISE_TYPES = [
    { id: "MCHJ_YIRIK" as EnterpriseType, label: "Yirik Korxona", description: "Umumbelgilangan soliq to'lovchi" },
    { id: "MCHJ_KICHIK" as EnterpriseType, label: "Kichik Biznes", description: "Aylanmadan soliq to'lovchi" },
    { id: "YATT" as EnterpriseType, label: "YaTT", description: "Yakka tartibdagi tadbirkor" },
    { id: "DXV" as EnterpriseType, label: "DXV", description: "Dehqon xo'jaligi" }
];

export const ENTERPRISE_TAX_MAP: Record<EnterpriseType, TaxType[]> = {
    MCHJ_YIRIK: ["QQS", "FOYDA", "DAROMAD", "IJTIMOIY", "MOL_MULK", "YER", "SUV", "AKSIZ", "YER_QARI", "RENTA"],
    MCHJ_KICHIK: ["AYLANMA", "DAROMAD", "IJTIMOIY", "MOL_MULK", "YER", "SUV"],
    YATT: ["DAROMAD", "IJTIMOIY"],
    DXV: ["YER", "SUV"]
};

// --- REAL RATES (Soliq Kodeksi asosida, 2024 yangilash) ---

export const FOYDA_CATEGORIES = [
    { id: "STANDARD", name: "Standart (Qolgan to'lovchilar) - 15%", rate: 0.15 },
    { id: "BANK", name: "Banklar - 20%", rate: 0.20 },
    { id: "SEMENT_MOBIL", name: "Sement va Mobil aloqa xizmatlari - 20%", rate: 0.20 },
    { id: "QISHLOQ", name: "O'z qishloq xo'jaligi mahs. realizatsiyasi - 0%", rate: 0.00 },
    { id: "BUDJET", name: "Ijtimoiy soha va Budjet - 0%", rate: 0.00 },
    { id: "DIVIDEND", name: "Dividend tarzidagi daromad - 5%", rate: 0.05 }
];

export const MOL_MULK_CATEGORIES = [
    { id: "STANDARD", name: "Standart (Tadbirkorlik obyektlari) - 1.5%", rate: 0.015 },
    { id: "TUGALLANMAGAN", name: "Qurilishi tugallanmagan obyektlar - 3%", rate: 0.03 },
    { id: "MAXSUS", name: "Temir yo'l, aloqa/elektr liniyalari - 0.7%", rate: 0.007 }
];

export const IJTIMOIY_CATEGORIES = [
    { id: "STANDARD", name: "Standart (Umumiy) - 12%", rate: 0.12 },
    { id: "BUDJET", name: "Budjet tashkilotlari - 25%", rate: 0.25 },
    { id: "SOS", name: "SOS Bolalar mahallalari - 7%", rate: 0.07 },
    { id: "NOGIRONLAR", name: "Nogironlar ishlovchi maxsus sexlar - 4.7%", rate: 0.047 }
];

export const AYLANMA_RATES = [
    { id: "SHAHR", name: "Aholisi 100k+ shaharlar - 4%", rate: 0.04, modda: "467-modda" },
    { id: "BOSHQA", name: "Boshqa aholi punktlari - 2%", rate: 0.02, modda: "467-modda" },
    { id: "TOGLI", name: "Borish qiyin/Tog'li - 1%", rate: 0.01, modda: "467-modda" }
];

export const FIX_AYLANMA = [
    { id: "NONE", name: "Foizli (Tushumdan) to'lash", value: 0 },
    { id: "30_MLN", name: "Qat'iy - 30 mln (Tushum < 500 mln)", value: 30000000 },
    { id: "40_MLN", name: "Qat'iy - 40 mln (Tushum > 500 mln)", value: 40000000 }
];

export const AKSIZ_RATES = [
    // Tamaki (Tobacco) 289.1
    { id: "SIGARET", category: "Tamaki", name: "Sigaretalar (1000 dona)", rate: 340000, unit: "1000 dona", modda: "2891-modda" },
    { id: "SIGARA", category: "Tamaki", name: "Sigara (1 dona)", rate: 20000, unit: "dona", modda: "2891-modda" },
    { id: "CHILIM", category: "Tamaki", name: "Chilim / O'rama tamaki (1 kg)", rate: 600000, unit: "kg", modda: "2891-modda" },
    { id: "VAPE", category: "Tamaki", name: "Nikotinli suyuqlik (1 ml)", rate: 2000, unit: "ml", modda: "2891-modda" },
    // Alkogol (Alcohol) 289.2
    { id: "SPIRT", category: "Alkogol", name: "Etil spirti (1L)", rate: 15000, unit: "litr", modda: "2892-modda" },
    { id: "AROQ", category: "Alkogol", name: "Aroq / Konyak (1L)", rate: 44000, unit: "litr", modda: "2892-modda" },
    { id: "VINO", category: "Alkogol", name: "Tabiiy vino (1L)", rate: 5000, unit: "litr", modda: "2892-modda" },
    { id: "PIVO", category: "Alkogol", name: "Pivo (1L)", rate: 2000, unit: "litr", modda: "2892-modda" },
    // Yoqilg'i (Fuel) 289.3
    { id: "AI80", category: "Yoqilg'i", name: "AI-80 Benzin (1 t)", rate: 375000, unit: "tonna", modda: "2893-modda" },
    { id: "AI91", category: "Yoqilg'i", name: "AI-91 Benzin (1 t)", rate: 335000, unit: "tonna", modda: "2893-modda" },
    { id: "DIZEL", category: "Yoqilg'i", name: "Dizel (1 t)", rate: 360000, unit: "tonna", modda: "2893-modda" },
    // Ichimliklar 289.3
    { id: "SHAKARLI", category: "Ichimliklar", name: "Shakarli ichimliklar (1L)", rate: 500, unit: "litr", modda: "2893-modda" },
    { id: "ENERGETIK", category: "Ichimliklar", name: "Energetik (1L)", rate: 2000, unit: "litr", modda: "2893-modda" }
];

export const SUV_RATES = [
    { id: "SANOAT", name: "Sanoat / Tadbirkorlik", rateYerUsti: 74, rateYerOsti: 91, modda: "445-modda" },
    { id: "ELEKTR", name: "Elektr stansiyalari / Kommunal", rateYerUsti: 118, rateYerOsti: 144, modda: "445-modda" },
    { id: "QISHLOQ", name: "Qishloq xo'jaligi (Sug'orish / Baliq)", rateYerUsti: 107, rateYerOsti: 107, modda: "445-modda" },
    { id: "MOYKA", name: "Avtotransport yuvish", rateYerUsti: 16050, rateYerOsti: 16050, modda: "445-modda" },
    { id: "ICHIMLIK", name: "Alkogolsiz ichimlik ishlab chiqarish", rateYerUsti: 40660, rateYerOsti: 40660, modda: "445-modda" }
];

export const YER_RATES = [
    { id: "TOSHKENT_Z1", name: "Toshkent (1-zona)", rate: 319.0, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "TOSHKENT_Z2", name: "Toshkent (2-zona)", rate: 254.2, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "TOSHKENT_Z3", name: "Toshkent (3-zona)", rate: 196.6, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "TOSHKENT_Z4", name: "Toshkent (4-zona)", rate: 130.6, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "TOSHKENT_Z5", name: "Toshkent (5-zona)", rate: 65.9, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "QORAQALPOGISTON", name: "Qoraqalpog'iston Respublikasi", rate: 41.2, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "ANDIJON", name: "Andijon viloyati", rate: 51.8, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "BUXORO", name: "Buxoro viloyati", rate: 42.4, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "SAMARQAND", name: "Samarqand viloyati", rate: 51.8, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "TOSHKENT_V", name: "Toshkent viloyati", rate: 43.5, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "FARGONA", name: "Farg'ona viloyati", rate: 43.5, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "XORAZM", name: "Xorazm viloyati", rate: 42.4, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "NAVOIY", name: "Navoiy viloyati", rate: 42.4, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "QASHQADARYO", name: "Qashqadaryo viloyati", rate: 42.4, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "SIRDARYO", name: "Sirdaryo viloyati", rate: 31.8, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "SURXONDARYO", name: "Surxondaryo viloyati", rate: 37.7, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "JIZZAX", name: "Jizzax viloyati", rate: 42.4, unitLabel: "mln UZS / ga", modda: "429-modda" },
    { id: "NAMANGAN", name: "Namangan viloyati", rate: 51.8, unitLabel: "mln UZS / ga", modda: "429-modda" }
];

export const YER_QARI_RATES = [
    { id: "NEFT", name: "Neft, Tabiiy gaz, Gaz kondensati", rate: 10, unit: "%", modda: "452-modda" },
    { id: "KOOMIR", name: "Ko'mir, Yonuvchi slanslar", rate: 4, unit: "%", modda: "452-modda" },
    { id: "OLTIN", name: "Oltin, Kumush, Platina, Palladiy", rate: 7, unit: "%", modda: "452-modda" },
    { id: "MIS", name: "Mis, Qo'rg'oshin, Rux, Kobalt", rate: 7, unit: "%", modda: "452-modda" },
    { id: "URAN", name: "Uran, Toriy, Radiy", rate: 8, unit: "%", modda: "452-modda" },
    { id: "TEMIR", name: "Temir", rate: 2, unit: "%", modda: "452-modda" },
    { id: "SEMENT", name: "Sement xomashyosi", rate: 5, unit: "%", modda: "452-modda" },
    { id: "SEMENT_OHAK", name: "Sement ohaktoshi (1 t)", rate: 7062, unit: "UZS", modda: "452-modda" },
    { id: "MARMAR", name: "Marmar (1 m³ min)", rate: 21400, unit: "UZS", modda: "452-modda" }
];

export const RENTA_RATES = [
    { id: "METALL", group: "Renta", name: "Qimmatbaho metallar", rate: 10, modda: "4541-modda" },
    { id: "UGLEVODOROD", group: "Renta", name: "Uglevodorodlar", rate: 10, modda: "4541-modda" }
];

// --- 3. HISOBLASH FUNKSIYALARI ---

export function computeTaxes(data: TaxBaseData, toggles: TaxToggleState, params: TaxSelectParams): ComputedTaxModel[] {
    const results: ComputedTaxModel[] = [];

    // 1. QQS (12% Art 258)
    if (toggles["QQS"]) {
        results.push({
            id: "QQS",
            label: "QQS (12%)",
            amount: Math.round(data.totalIncome * 0.12), // Assumes standard realization
            formula: "Tushum × 12%",
            color: "#3b82f6"
        });
    }

    // 2. FOYDA (Art 337)
    if (toggles["FOYDA"]) {
        const item = FOYDA_CATEGORIES.find(r => r.id === (params.foydaCategoryId || "STANDARD"))!;
        results.push({
            id: "FOYDA",
            label: `Foyda solig'i (${item.rate * 100}%)`,
            amount: Math.round(data.netProfit * item.rate),
            formula: `Sof foyda × ${item.rate * 100}%`,
            color: "#10b981"
        });
    }

    // 3. DAROMAD (JShDS) (Art 381)
    if (toggles["DAROMAD"]) {
        results.push({
            id: "DAROMAD",
            label: "Daromad solig'i (12%)",
            amount: Math.round(data.totalSalaryFund * 0.12),
            formula: "Ish haqi fondi × 12%",
            color: "#8b5cf6"
        });
    }

    // 4. IJTIMOIY (Art 405)
    if (toggles["IJTIMOIY"]) {
        const item = IJTIMOIY_CATEGORIES.find(r => r.id === (params.ijtimoiyCategoryId || "STANDARD"))!;
        results.push({
            id: "IJTIMOIY",
            label: `Ijtimoiy soliq (${item.rate * 100}%)`,
            amount: Math.round(data.totalSalaryFund * item.rate),
            formula: `Ish haqi fondi × ${item.rate * 100}%`,
            color: "#f59e0b"
        });
    }

    // 5. MOL-MULK (Art 415)
    if (toggles["MOL_MULK"]) {
        const item = MOL_MULK_CATEGORIES.find(r => r.id === (params.molMulkCategoryId || "STANDARD"))!;
        // Assumes monthly calculation if inventoryValue is fixed, standardizing it to yearly for calc
        results.push({
            id: "MOL_MULK",
            label: `Mol-mulk solig'i (${item.rate * 100}%)`,
            amount: Math.round(data.inventoryValue * item.rate / 12),
            formula: `Inventar qiymati × ${item.rate * 100}% / 12 (oylik)`,
            color: "#6366f1"
        });
    }

    // 6. SUV SOLIG'I (Art 445)
    if (toggles["SUV"] && params.suvItemId && params.suvQuantity) {
        const item = SUV_RATES.find(r => r.id === params.suvItemId);
        if (item) {
            const rate = params.suvSource === "yer_osti" ? item.rateYerOsti : item.rateYerUsti;
            results.push({
                id: "SUV",
                label: "Suv solig'i",
                amount: params.suvQuantity * rate,
                formula: `${params.suvQuantity} m³ × ${rate} UZS/m³`,
                color: "#0ea5e9"
            });
        }
    }

    // 7. YER SOLIG'I (Art 429)
    if (toggles["YER"] && params.yerItemId && params.yerArea) {
        const item = YER_RATES.find(r => r.id === params.yerItemId);
        if (item) {
            const rateInMln = item.rate;
            const amount = Math.round((params.yerArea * rateInMln * 1000000) / 12);
            results.push({
                id: "YER",
                label: "Yer solig'i (Oylik)",
                amount: amount,
                formula: `${params.yerArea} ga × ${rateInMln} mln / 12`,
                color: "#06b6d4"
            });
        }
    }

    // 8. AKSIZ SOLIG'I (Art 289)
    if (toggles["AKSIZ"] && params.aksizItemId && params.aksizQuantity) {
        const item = AKSIZ_RATES.find(r => r.id === params.aksizItemId);
        if (item) {
            results.push({
                id: "AKSIZ",
                label: "Aksiz solig'i",
                amount: params.aksizQuantity * item.rate,
                formula: `${params.aksizQuantity} ${item.unit} × ${item.rate} UZS`,
                color: "#ec4899"
            });
        }
    }

    // 9. YER QA'RI SOLIG'I (Art 452)
    if (toggles["YER_QARI"] && params.yerQariItemId && params.yerQariValue) {
        const item = YER_QARI_RATES.find(r => r.id === params.yerQariItemId);
        if (item) {
            const isPercent = item.unit === "%";
            const amount = isPercent ? (params.yerQariValue * item.rate / 100) : (params.yerQariValue * item.rate);
            results.push({
                id: "YER_QARI",
                label: "Yer qa'ri solig'i",
                amount: Math.round(amount),
                formula: isPercent ? `${params.yerQariValue.toLocaleString()} x ${item.rate}%` : `${params.yerQariValue} x ${item.rate} UZS`,
                color: "#14b8a6"
            });
        }
    }

    // 10. RENTA SOLIG'I (Art 454-1)
    if (toggles["RENTA"] && params.rentaRevenue) {
        const amount = Math.round(params.rentaRevenue * 0.10); // taxminiy 10%
        results.push({
            id: "RENTA",
            label: "Renta solig'i",
            amount: amount,
            formula: `Renta daromadi × 10%`,
            color: "#f43f5e"
        });
    }
    
    // 11. AYLANMA SOLIQ (Art 467)
    if (toggles["AYLANMA"]) {
        const rev = params.aylanmaRevenue || data.totalIncome;
        if (params.aylanmaFixed && params.aylanmaFixed !== "NONE") {
            const fixData = FIX_AYLANMA.find(f => f.id === params.aylanmaFixed)!;
            results.push({
                id: "AYLANMA",
                label: `Aylanma soliq (${fixData.name})`,
                amount: Math.round(fixData.value / 12), // monthly display
                formula: `Qat'iy stavka yillik / 12 (Oylik)`,
                color: "#ca8a04"
            });
        } else {
            const item = AYLANMA_RATES.find(r => r.id === (params.aylanmaCategoryId || "SHAHR"))!;
            results.push({
                id: "AYLANMA",
                label: `Aylanma soliq (${item.rate * 100}%)`,
                amount: Math.round(rev * item.rate),
                formula: `Umumiy Tushum × ${item.rate * 100}%`,
                color: "#ca8a04"
            });
        }
    }

    return results;
}

export function totalTaxAmount(computed: ComputedTaxModel[]): number {
    return computed.reduce((sum, item) => sum + item.amount, 0);
}


// --- 4. INVENTAR VA AMORTIZATSIYA (306-308 moddalar - 2024 yangilash) ---

export interface AmortizationResult {
    baseValue: number;
    totalDepreciation: number;
    residualValue: number;
    monthlyDepreciation: number;
    monthsElapsed: number;
    effectiveRate: number;
    startDate: Date;
    isFullyDepreciated: boolean;
}

export const TAX_AMORTIZATION_GROUPS = [
    { id: "I", label: "Binolar, imoratlar, qurilmalar", rate: 5, modda: "306-modda" },
    { id: "II", label: "Elektron-hisoblash texnikasi (shu jumladan ehtiyot qismlari)", rate: 20, modda: "306-modda" },
    { id: "III", label: "Avtotransport vositalari va boshqa kon texnikalari", rate: 10, modda: "306-modda" },
    { id: "IV", label: "Boshqa mashina va uskunalar, hisoblash asboblari, mebel", rate: 15, modda: "306-modda" },
    { id: "V", label: "1-4 guruhga kiritilmagan boshqa amortizatsiyalanadigan aktivlar", rate: 10, modda: "306-modda" },
    { id: "VI", label: "Nomoddiy aktivlar (Art 307 - Intellektual mulk h.k.)", rate: 10, modda: "307-modda" }
];

export function calculateDepreciation(params: {
    price: number;
    quantity: number;
    purchaseDate: Date;
    modernizationCosts?: number;
    amortizationRate?: number;
    amortizationGroup?: string;
    itParkResident?: boolean;
    category?: string;
}): AmortizationResult {
    const { price, quantity, purchaseDate, modernizationCosts = 0, amortizationRate, amortizationGroup, itParkResident = false, category } = params;

    // 1. Aktiv qiymati (Boshlang'ich + Modernizatsiya)
    const initialValue = price * quantity;
    const baseValue = initialValue + modernizationCosts;

    // 2. Stavkani aniqlash
    let effectiveRate = amortizationRate || 10; // Default 10%
    if (amortizationGroup) {
        const group = TAX_AMORTIZATION_GROUPS.find(g => g.id === amortizationGroup);
        if (group) effectiveRate = group.rate;
    }

    // Art 307: Nomoddiy aktivlar (Intangible assets amortized over useful life, if not specified -> 10 years / 10%)
    if (category === "Nomoddiy aktiv" || amortizationGroup === "VI") {
        effectiveRate = effectiveRate || 10; 
    }

    // 3. IT Park rezidenti yoki Maxsus soliq tartibi (Accelerated depreciation)
    if (itParkResident) {
        effectiveRate = effectiveRate * 2;
    }

    // 4. "Keyingi oy" qoidasi (Soliq Kodeksi 306-modda: Sotib olingan oydan keyingi oyning 1-sanasidan)
    const now = new Date();
    const startDate = new Date(purchaseDate.getFullYear(), purchaseDate.getMonth() + 1, 1);
    
    let monthsElapsed = 0;
    if (now >= startDate) {
        monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1;
    }

    // 5. Hisoblash (Chiziqli usul / Straight-line method - Art 306-308)
    const monthlyRateDec = (effectiveRate / 100) / 12;
    const monthlyDep = baseValue * monthlyRateDec;
    let totalDep = monthlyDep * monthsElapsed;

    if (totalDep > baseValue) totalDep = baseValue;
    const residual = baseValue - totalDep;

    return {
        baseValue,
        totalDepreciation: Math.round(totalDep),
        residualValue: Math.round(residual),
        monthlyDepreciation: Math.round(monthlyDep),
        monthsElapsed,
        effectiveRate,
        startDate,
        isFullyDepreciated: residual <= 0
    };
}
