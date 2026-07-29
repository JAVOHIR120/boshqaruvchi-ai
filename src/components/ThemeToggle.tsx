"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "@/app/page.module.css";

export default function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from local storage or default to dark
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("boshqaruvchi-theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.setAttribute("data-theme", savedTheme);
        } else {
            // Default is dark mode per our design system
            setTheme("dark");
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("boshqaruvchi-theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <button className={styles.themeToggleBtn} aria-label="Yuklanmoqda...">
                <div style={{ width: 18, height: 18 }} />
            </button>
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={styles.themeToggleBtn}
            aria-label={theme === "dark" ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
            title={theme === "dark" ? "Kunduzgi rejimga o'tish" : "Tungi rejimga o'tish"}
        >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}
