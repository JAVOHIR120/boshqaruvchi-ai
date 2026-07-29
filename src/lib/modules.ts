// ============================================
// MODULE ACCESS CONTROL — Core Configuration
// ============================================

// Barcha mavjud modullar — har bir modulning ID si, nomi va sahifa yo'li
export const ALL_MODULES = [
    { id: "dashboard",       label: "Umumiy",                path: "/dashboard" },
    { id: "pos-terminal",    label: "POS Terminal",           path: "/pos-terminal" },
    { id: "crm",             label: "Sotuv va Mijozlar",      path: "/crm" },
    { id: "tasks",           label: "Vazifalar",              path: "/tasks" },
    { id: "investors",       label: "Hamkorlar va Investor",  path: "/investors" },
    { id: "contracts",       label: "Shartnomalar",           path: "/contracts" },
    { id: "taxes",           label: "Soliqlar",               path: "/taxes" },
    { id: "messages",        label: "Xabarlar",               path: "/messages" },
    { id: "employees",       label: "Xodimlar (HR)",          path: "/employees" },
    { id: "accounting",      label: "Buxgalteriya",           path: "/accounting" },
    { id: "inventory",       label: "Inventarizatsiya",       path: "/inventory" },
    { id: "ombor-nazorati",  label: "Ombor Nazorati",         path: "/ombor-nazorati" },
    { id: "ai-consultant",   label: "AI Maslahatchi",         path: "/ai-consultant" },
    { id: "leader-academy",  label: "Leader Academy",         path: "/leader-academy" },
    { id: "settings",        label: "Sozlamalar",             path: "/settings" },
] as const;

// Har doim yoqiq modullar — bu modullar o'chirib bo'lmaydi
export const ALWAYS_ENABLED_MODULES = ["dashboard", "settings"];

// Modul IDlarining barcha ro'yxati
export const ALL_MODULE_IDS: string[] = ALL_MODULES.map(m => m.id);

// Faqat OWNER tomonidan yoqish/o'chirish mumkin bo'lgan modullar
export const TOGGLEABLE_MODULES = ALL_MODULES.filter(
    m => !ALWAYS_ENABLED_MODULES.includes(m.id)
);

/**
 * Berilgan pathname (URL) ga mos modul ID sini aniqlash.
 * Masalan: "/crm" → "crm", "/inventory/forms/inv-1" → "inventory"
 */
export function getModuleIdFromPath(pathname: string): string | null {
    // Exact match
    const exact = ALL_MODULES.find(m => m.path === pathname);
    if (exact) return exact.id;

    // Prefix match (sub-routes)
    const prefixMatch = ALL_MODULES.find(m => 
        m.path !== "/dashboard" && pathname.startsWith(m.path + "/")
    );
    if (prefixMatch) return prefixMatch.id;

    return null;
}

/**
 * Berilgan modullarning ruxsatini tekshirish.
 * OWNER har doim barcha modullarga kirishga ega.
 */
export function isModuleEnabled(
    moduleId: string,
    enabledModules: string[],
    role: string
): boolean {
    // OWNER hamma joyga kira oladi
    if (role === "OWNER") return true;

    // Doimo yoqiq modullar
    if (ALWAYS_ENABLED_MODULES.includes(moduleId)) return true;

    // Kompaniyaning yoqilgan modullaridan tekshirish
    return enabledModules.includes(moduleId);
}
