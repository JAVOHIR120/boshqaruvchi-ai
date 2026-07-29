const { calculateDepreciation } = require('./src/lib/taxEngine');

// Setup mock dates
const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

// Scenario 1: Asset purchased THIS month
// Expected: monthsElapsed = 0 (Starts next month)
const purchaseDateThisMonth = new Date(currentYear, currentMonth, 15);
const res1 = calculateDepreciation({
    price: 1000000,
    quantity: 1,
    purchaseDate: purchaseDateThisMonth,
    amortizationRate: 12, // 1% per month
});
console.log("Scenario 1 (Purchased this month):", res1.monthsElapsed === 0 ? "PASS" : "FAIL", "(Months:", res1.monthsElapsed, ")");

// Scenario 2: Asset purchased LAST month
// Expected: monthsElapsed = 1 (Started on 1st of THIS month)
const purchaseDateLastMonth = new Date(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, 15);
const res2 = calculateDepreciation({
    price: 1000000,
    quantity: 1,
    purchaseDate: purchaseDateLastMonth,
    amortizationRate: 12,
});
console.log("Scenario 2 (Purchased last month):", res2.monthsElapsed === 1 ? "PASS" : "FAIL", "(Months:", res2.monthsElapsed, ")");

// Scenario 3: IT Park Resident (2x Acceleration)
// Rate 20% -> 40%
const res3 = calculateDepreciation({
    price: 1000000,
    quantity: 1,
    purchaseDate: new Date(currentYear - 1, currentMonth, 1),
    amortizationRate: 20,
    itParkResident: true
});
console.log("Scenario 3 (IT Park 2x Rate):", res3.effectiveRate === 40 ? "PASS" : "FAIL", "(Rate:", res3.effectiveRate, "%)");

// Scenario 4: Modernization Costs
const res4 = calculateDepreciation({
    price: 1000000,
    quantity: 1,
    purchaseDate: new Date(currentYear - 2, currentMonth, 1),
    amortizationRate: 20,
    modernizationCosts: 500000
});
console.log("Scenario 4 (Modernization):", res4.baseValue === 1500000 ? "PASS" : "FAIL", "(Base:", res4.baseValue, ")");
