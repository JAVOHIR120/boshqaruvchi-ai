import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getCurrentUser } from "@/actions/auth";

const geminiApiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenerativeAI(geminiApiKey || "");

export async function POST(req: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.companyId) {
            return NextResponse.json({ success: false, error: "Avtorizatsiyadan o'tilmagan" }, { status: 401 });
        }

        const body = await req.json();
        const { adjustments } = body;

        if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
            return NextResponse.json({ success: false, error: "Audit ma'lumotlari kiritilmagan" }, { status: 400 });
        }

        // Fetch detailed product info and their responsibles
        const itemsWithDetails = await Promise.all(
            adjustments.map(async (adj: any) => {
                const prod = await prisma.product.findUnique({
                    where: { id: adj.productId },
                    include: { warehouse: true }
                });
                return {
                    name: prod?.name || "Noma'lum mahsulot",
                    sku: prod?.sku || "SKU_NO",
                    barcode: prod?.barcode || "BARCODE_NO",
                    expectedQty: adj.expectedQty,
                    countedQty: adj.countedQty,
                    diff: adj.quantityChange,
                    price: prod?.price || 0,
                    costPrice: prod?.costPrice || 0,
                    lossAmount: Math.abs(adj.quantityChange) * (prod?.costPrice || 0)
                };
            })
        );

        // Aggregate stats
        const shortages = itemsWithDetails.filter(item => item.diff < 0);
        const excesses = itemsWithDetails.filter(item => item.diff > 0);
        const totalShortageVal = shortages.reduce((sum, item) => sum + item.lossAmount, 0);
        const totalExcessVal = excesses.reduce((sum, item) => sum + item.lossAmount, 0);

        // Fetch list of active employees for company to see who might be responsible
        const employees = await prisma.employee.findMany({
            where: { companyId: currentUser.companyId },
            include: { user: true }
        });
        const employeeListStr = employees.map(emp => `${emp.user.name} (${emp.position}, KPI: ${emp.performance}%)`).join(", ");

        const auditContext = `
        Tizimdagi jami kamomad qiymati (Tan narxda): ${totalShortageVal.toLocaleString()} so'm
        Tizimdagi jami ortiqcha tovarlar qiymati: ${totalExcessVal.toLocaleString()} so'm
        
        KAMOMAD BO'LGAN MAHSULOTLAR DETALLARI:
        ${shortages.map(s => `- ${s.name} (SKU: ${s.sku}): Kutildi - ${s.expectedQty}, Sanaldi - ${s.countedQty}, Farq - ${s.diff}, Keltirilgan zarar - ${s.lossAmount.toLocaleString()} so'm`).join("\n")}
        
        ORTIQCHA BO'LGAN MAHSULOTLAR DETALLARI:
        ${excesses.map(e => `- ${e.name} (SKU: ${e.sku}): Kutildi - ${e.expectedQty}, Sanaldi - ${e.countedQty}, Farq - +${e.diff}`).join("\n")}
        
        OMBOR UCHUN JAVOBGAR/FAOL XODIMLAR:
        ${employeeListStr}
        `;

        if (!geminiApiKey) {
            return NextResponse.json({
                success: true,
                analysis: `⚠️ **[SIMULYATSIYA REJIMI: GEMINI_API_KEY o'rnatilmagan]**\n\n**Boshliq AI - Ombor Auditining Operatsion Tahlili:**\n\n1. **Zarar miqdori:** Audit natijasida **${totalShortageVal.toLocaleString()} so'm** miqdorida jami kamomad (zarar) aniqlandi. Ortiqcha chiqqan tovarlar esa rasmiylashtirilmagan kirimlarga ishora qilmoqda.\n\n2. **O'g'rilik va Yo'qotish Xavfi:** \n   * Kamomad chiqqan tovarlar orasida yuqori qiymatga ega mahsulotlar borligi o'g'rilik yoki hisob-kitobdagi jiddiy xatolikdan darak beradi.\n   * Ortiqchaliklar esa xaridorga berilmagan cheklar yoki tovar qabuli vaqtidagi mas'uliyatsizlikdan kelib chiqadi.\n\n3. **Mas'ul xodimlar tahlili:** Ombor uchun faol bo'lgan xodimlarning oxirgi navbatchilik jurnallarini va ularning KPI ko'rsatkichlarini solishtirish talab etiladi. Tizimdagi kamomad summasi ombor mudiri yoki mas'ul xodimlardan (masalan, kassa a'zolari) qonuniy ushlab qolinishi tavsiya etiladi.`
            });
        }

        const prompt = `Siz yirik savdo va ombor tizimlarida o'g'riliklarni fosh qilish, kamomadlarni tahlil qilish va moliyaviy yo'qotishlarning oldini olish (Loss Prevention) bo'yicha eng kuchli Sun'iy Intellekt maslahatchisisiz.
        Sizga yaqinda o'tkazilgan "Blind Audit" inventarizatsiyasining natijalari taqdim etilmoqda.

        VAZIFANGIZ:
        Ushbu ma'lumotlar asosida Boshliq (Rahbar) uchun **Tafsilotli Operatsion Tahliliy Hisobot** tayyorlang.

        HISOBOTDA QUYIDAGILАR YORITILSIN:
        1. **Kamomad va Zarar Miqyosi:** Jami zarar (${totalShortageVal.toLocaleString()} so'm) ning korxona moliyasiga ta'siri. Qaysi tovarlar eng ko'p yo'qotilgan va ular qanchalik qimmatli?
        2. **Farqlar Kelib Chiqish Sababi (AI Diagnostic):**
           - Kamomadlar (o'g'rilik, tovar buzilishi, kirim qilinmagan nuqsonlar).
           - Ortiqchaliklar (mijozga tovar bermaslik, cheksiz savdo qilish yoki xato prihod).
        3. **Xavf Zonalari va Xodimlar Tahlili:** Ro'yxatdagi xodimlarning KPI va mavqeini solishtirib, qaysi javobgar shaxslardan gaplashib olish yoki jarimaga tortish kerakligini ayting.
        4. **Rahbar uchun Amaliy Chora-Tadbirlar (Loss Prevention Actions):** Bunday kamomadlarning oldini olish bo'yicha 3 ta qat'iy va tezkor chora (masalan, videokamerani tekshirish, kutilmagan qayta audit, kassa nazorati).

        Javobni o'zbek tilida (lotin yozuvida), toza va juda ta'sirli Markdown formatida yozing. Bo'limlarni chiroyli emoji va ogohlantiruvchi belgilar bilan to'ldiring.

        AUDIT MA'LUMOTLARI:
        ${auditContext}
        `;

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysis = response.text();

        return NextResponse.json({ success: true, analysis });

    } catch (error: any) {
        console.error("AI Audit Analysis Error:", error);
        return NextResponse.json({ success: false, error: "Server xatoligi" }, { status: 500 });
    }
}
