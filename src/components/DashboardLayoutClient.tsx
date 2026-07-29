"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "@/app/(dashboard)/dashboard.module.css";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    FileText,
    Calculator,
    Building2,
    GraduationCap,
    Bot,
    Settings,
    Archive,
    Target,
    CheckSquare,
    MessageSquare,
    Scale,
    ShoppingBag,
    Menu,
    X,
    LogOut,
    ChevronDown,
    UserCircle,
    Shield,
    Factory,
} from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import ThemeToggle from "@/components/ThemeToggle";
import WelcomeAnimation from "@/components/WelcomeAnimation";
import CommandCenter from "@/components/CommandCenter";

const NAV_ITEMS = [
    { path: "/dashboard", label: "Umumiy", icon: LayoutDashboard, moduleId: "dashboard", category: "Boshqaruv" },
    { path: "/ai-consultant", label: "AI Maslahatchi", icon: Bot, moduleId: "ai-consultant", category: "Boshqaruv" },
    { path: "/leader-academy", label: "Leader Academy", icon: GraduationCap, moduleId: "leader-academy", category: "Boshqaruv" },
    
    { path: "/pos-terminal", label: "POS Terminal", icon: ShoppingBag, moduleId: "pos-terminal", category: "Moliya & Savdo" },
    { path: "/crm", label: "Sotuv va Mijozlar", icon: Target, moduleId: "crm", category: "Moliya & Savdo" },
    { path: "/accounting", label: "Buxgalteriya", icon: Calculator, moduleId: "accounting", category: "Moliya & Savdo" },
    { path: "/taxes", label: "Soliqlar", icon: Scale, moduleId: "taxes", category: "Moliya & Savdo" },
    
    { path: "/tasks", label: "Vazifalar", icon: CheckSquare, moduleId: "tasks", category: "Operatsiyalar" },
    { path: "/contracts", label: "Shartnomalar", icon: FileText, moduleId: "contracts", category: "Operatsiyalar" },
    { path: "/inventory", label: "Inventarizatsiya", icon: Archive, moduleId: "inventory", category: "Operatsiyalar" },
    { path: "/ombor-nazorati", label: "Ombor Nazorati", icon: Factory, moduleId: "ombor-nazorati", category: "Operatsiyalar" },
    { path: "/investors", label: "Hamkorlar va Investor", icon: Building2, moduleId: "investors", category: "Operatsiyalar" },
    
    { path: "/messages", label: "Xabarlar", icon: MessageSquare, moduleId: "messages", category: "Tizim" },
    { path: "/employees", label: "Xodimlar (HR)", icon: Users, moduleId: "employees", category: "Tizim" },
    { path: "/settings", label: "Sozlamalar", icon: Settings, moduleId: "settings", category: "Tizim" },
];

interface DashboardLayoutClientProps {
    children: React.ReactNode;
    user: any;
    unreadMessages: number;
    enabledModules: string[];
}

export default function DashboardLayoutClient({ children, user, unreadMessages: initialUnread, enabledModules }: DashboardLayoutClientProps) {
    // OWNER har doim barcha modullarni ko'radi
    const visibleNavItems = NAV_ITEMS.filter(item =>
        user.role === "OWNER" || enabledModules.includes(item.moduleId)
    );
    const pathname = usePathname();
    const router = useRouter();
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isProfileOpen, setProfileOpen] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(initialUnread);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setUnreadMessages(initialUnread);
    }, [initialUnread]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push("/login");
    };

    const activeItem = NAV_ITEMS.find(i => pathname === i.path || pathname.startsWith(`${i.path}/`));

    return (
        <div className={styles.layout}>
            <CommandCenter />
            <WelcomeAnimation />
            
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`${styles.sidebarOverlay} ${styles.sidebarOverlayOpen}`}
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>
            
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/dashboard" className={styles.logo} onClick={() => setSidebarOpen(false)}>
                        <motion.img 
                            whileHover={{ rotate: 15 }}
                            src="/logo.png" 
                            alt="Logo" 
                            style={{ height: "36px", width: "36px", borderRadius: "50%", objectFit: "cover" }} 
                        />
                        Boshqaruvchi AI
                    </Link>
                    {isSidebarOpen && (
                        <button onClick={() => setSidebarOpen(false)} className={styles.hamburgerBtn}>
                            <X size={20} />
                        </button>
                    )}
                </div>
                
                <nav className={styles.nav}>
                    {["Boshqaruv", "Moliya & Savdo", "Operatsiyalar", "Tizim"].map((category) => {
                        const categoryItems = visibleNavItems.filter((item: any) => item.category === category);
                        if (categoryItems.length === 0) return null;
                        return (
                            <div key={category} className={styles.navGroup} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", marginBottom: "1rem" }}>
                                <div className={styles.navGroupHeader} style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", paddingLeft: "1rem", marginBottom: "0.4rem" }}>
                                    {category}
                                </div>
                                <div className={styles.navGroupList} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                    {categoryItems.map((item: any) => {
                                        const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                                        return (
                                            <Link
                                                key={item.path}
                                                href={item.path}
                                                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                                                onClick={() => setSidebarOpen(false)}
                                            >
                                                <EnhancedIcon 
                                                    icon={item.icon} 
                                                    size={20} 
                                                    isActive={isActive}
                                                    color="var(--text-secondary)"
                                                    className={styles.navIcon}
                                                />
                                                <span style={{ flex: 1, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--primary-color)" : "inherit" }}>
                                                    {item.label}
                                                </span>
                                                {item.path === "/messages" && unreadMessages > 0 && (
                                                    <motion.span 
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        style={{
                                                            backgroundColor: "var(--primary-color)",
                                                            color: "white",
                                                            fontSize: "0.75em",
                                                            padding: "0.15rem 0.5rem",
                                                            borderRadius: "100px",
                                                            marginLeft: "auto",
                                                            fontWeight: 600
                                                        }}>
                                                        {unreadMessages}
                                                    </motion.span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>
                
                <div className={styles.sidebarFooter}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "8px", padding: "8px 12px", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="pulsate-dot-green" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--success-color)", display: "inline-block" }}></span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>AI Barqaror</span>
                        </div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", padding: "1px 4px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.05)" }}>⌘K</span>
                    </div>
                    <button onClick={handleLogout} className={styles.dropdownItemDanger} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", background: "none", border: "none", cursor: "pointer", padding: "10px" }}>
                        <EnhancedIcon icon={LogOut} size={20} color="var(--danger-color)" />
                        Chiqish
                    </button>
                </div>
            </aside>

            <div className={styles.mainContent}>
                <header className={styles.topbar}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <button className={styles.hamburgerBtn} onClick={() => setSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h1 className={styles.pageTitle}>{activeItem?.label || "Boshqaruv"}</h1>
                    </div>

                    <div className={styles.userActions} ref={dropdownRef}>
                        <ThemeToggle />
                        <button onClick={() => setProfileOpen(!isProfileOpen)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer" }}>
                            <div className={styles.avatar}>
                                {user?.avatarBase64 ? (
                                    <img src={user.avatarBase64} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                                ) : (
                                    user?.name ? user.name.charAt(0).toUpperCase() : "B"
                                )}
                            </div>
                            <ChevronDown size={16} strokeWidth={2.5} color="var(--text-secondary)" />
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className={styles.profileDropdown}
                                >
                                    <div style={{ padding: "10px", borderBottom: "1px solid var(--border-subtle)" }}>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{user?.name}</p>
                                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{user?.email}</p>
                                    </div>
                                    <Link href="/settings" onClick={() => setProfileOpen(false)} className={styles.dropdownItem}>
                                        <UserCircle size={16} /> Profilim
                                    </Link>
                                    {(user?.role === "BOSHLIQ" || user?.role === "OWNER" || user?.role === "SUPERADMIN") && (
                                        <Link href="/admin" onClick={() => setProfileOpen(false)} className={styles.dropdownItem}>
                                            <Shield size={16} /> Admin Panel
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className={styles.dropdownItemDanger}>
                                        <LogOut size={16} /> Chiqish
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </header>

                <main className={styles.contentWrapper}>
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}
