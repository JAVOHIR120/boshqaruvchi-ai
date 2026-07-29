"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { User, Mail, Lock, Eye, EyeOff, Calculator, Users, Bot, Calendar, UserPlus, AlertCircle } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import styles from "./../auth.module.css";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Xatolik yuz berdi");
                setLoading(false);
                return;
            }

            if (data.requireVerification) {
                router.push(`/verify?email=${encodeURIComponent(email)}`);
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            toast.error(err.message || "Tizimga ulanishda xatolik yuz berdi");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <AnimatedBackground />

            {/* ====== BRAND PANEL (LEFT) ====== */}
            <div className={styles.brandPanel}>
                <div className={styles.brandContent}>
                    <Link href="/" className={styles.brandLogo}>
                        <img src="/logo.png" alt="Boshqaruvchi AI" />
                        Boshqaruvchi AI
                    </Link>
                    <h2 className={styles.brandTitle}>
                        Biznesingizni{" "}
                        <span className={styles.brandTitleAccent}>sun'iy intellekt</span>{" "}
                        bilan boshqaring
                    </h2>
                    <p className={styles.brandDescription}>
                        Buxgalteriya, soliq hisobotlari va xodimlar boshqaruvini avtomatlashtiring.
                        Vaqtingizni tejang, xatolarni kamaytiring.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>
                                <Calculator size={18} />
                            </span>
                            Avtomatik soliq hisob-kitoblari
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>
                                <Users size={18} />
                            </span>
                            Xodimlar boshqaruv paneli
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>
                                <Bot size={18} />
                            </span>
                            AI yordamchi — real-vaqt maslahat
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureIcon}>
                                <Calendar size={18} />
                            </span>
                            Soliq taqvimi va eslatmalar
                        </div>
                    </div>
                </div>
            </div>

            {/* ====== FORM PANEL (RIGHT) ====== */}
            <div className={styles.formPanel}>
                <div className={styles.authCard}>
                    {/* Mobile logo */}
                    <Link href="/" className={styles.mobileLogo}>
                        <img src="/logo.png" alt="Boshqaruvchi AI" />
                        Boshqaruvchi AI
                    </Link>

                    <div className={styles.authHeader}>
                        <h1 className={styles.title}>Ro'yxatdan o'tish</h1>
                        <p className={styles.subtitle}>Yangi hisob yaratish</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className={`${styles.alertBox} ${styles.alertError}`}>
                            <AlertCircle size={17} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
                        {/* Name */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>To'liq ismingiz</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="Ahmad Rahimov"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoComplete="name"
                                />
                                <span className={styles.inputIcon}>
                                    <User size={17} />
                                </span>
                            </div>
                        </div>

                        {/* Email */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email manzil</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type="email"
                                    className={styles.input}
                                    placeholder="ahmad@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                                <span className={styles.inputIcon}>
                                    <Mail size={17} />
                                </span>
                            </div>
                        </div>

                        {/* Password */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Parol</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className={styles.input}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete="new-password"
                                    style={{ paddingRight: "2.6rem" }}
                                />
                                <span className={styles.inputIcon}>
                                    <Lock size={17} />
                                </span>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.passwordToggle} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                    Kutilmoqda...
                                </>
                            ) : (
                                <>
                                    Ro'yxatdan o'tish
                                    <UserPlus size={17} />
                                </>
                            )}
                        </button>

                        {/* Divider */}
                        <div className={styles.dividerRow}>
                            <hr className={styles.dividerLine} />
                            <span>yoki</span>
                            <hr className={styles.dividerLine} />
                        </div>

                        {/* Google Register */}
                        <a href="/api/auth/google" className={styles.googleBtn}>
                            <svg viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                </g>
                            </svg>
                            Google orqali ro'yxatdan o'tish
                        </a>
                    </form>

                    <div className={styles.authFooter}>
                        Allaqachon hisobingiz bormi? <Link href="/login" className={styles.link}>Kirish</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
