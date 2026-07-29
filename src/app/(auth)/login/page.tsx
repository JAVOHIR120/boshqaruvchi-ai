"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Calculator, Users, Bot, Calendar, LogIn, AlertCircle, CheckCircle, Clock } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import styles from "./../auth.module.css";

// ==========================================
// LOGIN SAHIFASI - BARCHA FUNKSIYALAR
// ==========================================

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ===== STATE-LAR =====
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimer, setBlockTimer] = useState(0);

    // ===== 3. GOOGLE XATOLIKLARINI BOSHQARISH =====
    const handleGoogleError = useCallback(() => {
        const googleError = searchParams.get("error");
        if (googleError) {
            const errorMessages: Record<string, string> = {
                "Google_ruxsati_olinmadi": "Google ruxsatnomasi olinmadi. Qaytadan urinib ko'ring.",
                "Token_xatoligi": "Google autentifikatsiyasida xatolik yuz berdi.",
                "Email_topilmadi": "Google hisobingizda email topilmadi.",
            };

            const decodedError = decodeURIComponent(googleError);
            const matchedError = Object.entries(errorMessages).find(([key]) =>
                decodedError.startsWith(key)
            );

            setError(matchedError ? matchedError[1] : `Google xatoligi: ${decodedError}`);

            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete("error");
            window.history.replaceState({}, "", newUrl.toString());
        }
    }, [searchParams]);

    // ===== 1. SAHIFA YUKLANGANDA - INIT FUNKSIYASI =====
    useEffect(() => {
        const savedEmail = localStorage.getItem("boshqaruvchi_saved_email");
        if (savedEmail) {
            setEmail(savedEmail);
            setRememberMe(true);
        }

        const attempts = localStorage.getItem("boshqaruvchi_login_attempts");
        const blockUntil = localStorage.getItem("boshqaruvchi_block_until");

        if (attempts) {
            setLoginAttempts(parseInt(attempts));
        }

        if (blockUntil) {
            const blockTime = parseInt(blockUntil);
            if (Date.now() < blockTime) {
                setIsBlocked(true);
                setBlockTimer(Math.ceil((blockTime - Date.now()) / 1000));
            } else {
                localStorage.removeItem("boshqaruvchi_block_until");
                localStorage.removeItem("boshqaruvchi_login_attempts");
            }
        }

        handleGoogleError();
    }, [handleGoogleError]);

    // ===== 2. BLOKIROVKA TAYMERI =====
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isBlocked && blockTimer > 0) {
            interval = setInterval(() => {
                setBlockTimer((prev) => {
                    if (prev <= 1) {
                        setIsBlocked(false);
                        localStorage.removeItem("boshqaruvchi_block_until");
                        localStorage.removeItem("boshqaruvchi_login_attempts");
                        setLoginAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isBlocked, blockTimer]);

    // ===== 2. BLOKIROVKA TAYMERI =====

    // ===== 4-6. VALIDATSIYA =====
    const validateEmail = (value: string): boolean => {
        if (!value) { setEmailError("Email kiritish majburiy"); return false; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) { setEmailError("Email formati noto'g'ri (masalan: user@mail.com)"); return false; }
        setEmailError(""); return true;
    };

    const validatePassword = (value: string): boolean => {
        if (!value) { setPasswordError("Parol kiritish majburiy"); return false; }
        if (value.length < 6) { setPasswordError("Parol kamida 6 ta belgidan iborat bo'lishi kerak"); return false; }
        setPasswordError(""); return true;
    };

    const validateForm = (): boolean => {
        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);
        return isEmailValid && isPasswordValid;
    };

    // ===== 7-8. LOGIN URINISHLARI =====
    const handleFailedAttempt = () => {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        localStorage.setItem("boshqaruvchi_login_attempts", newAttempts.toString());
        if (newAttempts >= 5) {
            const blockDuration = 60 * 1000;
            const blockUntil = Date.now() + blockDuration;
            localStorage.setItem("boshqaruvchi_block_until", blockUntil.toString());
            setIsBlocked(true);
            setBlockTimer(60);
            setError("Juda ko'p noto'g'ri urinishlar! 60 soniyadan keyin qaytadan urinib ko'ring.");
        }
    };

    const handleSuccessfulAuth = () => {
        localStorage.removeItem("boshqaruvchi_login_attempts");
        localStorage.removeItem("boshqaruvchi_block_until");
        setLoginAttempts(0);
        if (rememberMe) {
            localStorage.setItem("boshqaruvchi_saved_email", email);
        } else {
            localStorage.removeItem("boshqaruvchi_saved_email");
        }
    };

    // ===== 9. ASOSIY LOGIN FUNKSIYASI =====
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isBlocked) { setError(`Iltimos, ${blockTimer} soniya kutib turing.`); return; }
        if (!validateForm()) return;

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });

            const data = await res.json();

            if (res.status === 403 && data.requireVerification) {
                handleSuccessfulAuth();
                setSuccess("Tasdiqlash kodi pochtangizga yuborildi! Yo'naltirilmoqda...");
                setTimeout(() => { router.push(`/verify?email=${encodeURIComponent(email)}`); }, 1500);
                return;
            }

            if (res.ok) {
                handleSuccessfulAuth();
                if (data.role === "XODIM") {
                    setSuccess("Muvaffaqiyatli kirildi! Xodim portaliga yo'naltirilmoqda...");
                    setTimeout(() => { router.push("/employee-portal"); }, 1000);
                } else {
                    setSuccess("Muvaffaqiyatli kirildi! Dashboard'ga yo'naltirilmoqda...");
                    setTimeout(() => { router.push("/dashboard"); }, 1000);
                }
                return;
            }

            handleFailedAttempt();
            toast.error(data.error || "Login amalga oshmadi");
            setLoading(false);
        } catch (err: any) {
            toast.error(err.message || "Server bilan ulanishda xatolik yuz berdi");
            setLoading(false);
        }
    };

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);
        if (emailError) validateEmail(value);
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        if (passwordError) validatePassword(value);
    };

    const resetForm = () => {
        setEmail(""); setPassword(""); setError(""); setSuccess("");
        setEmailError(""); setPasswordError(""); setShowPassword(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !loading && !isBlocked) handleLogin(e as any);
    };

    const formatBlockTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return mins > 0 ? `${mins} daqiqa ${secs} soniya` : `${secs} soniya`;
    };

    // ===== RENDER =====
    return (
        <div className={styles.authContainer} data-theme="dark">
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
                        <h1 className={styles.title}>Tizimga kirish</h1>
                        <p className={styles.subtitle}>Boshqaruv paneliga xush kelibsiz</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className={`${styles.alertBox} ${styles.alertError}`}>
                            <AlertCircle size={17} />
                            {error}
                        </div>
                    )}

                    {/* Success Alert */}
                    {success && (
                        <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                            <CheckCircle size={17} />
                            {success}
                        </div>
                    )}

                    {/* Block Timer */}
                    {isBlocked && (
                        <div className={`${styles.alertBox} ${styles.alertWarning}`}>
                            <Clock size={17} />
                            Kutish vaqti: {formatBlockTime(blockTimer)}
                        </div>
                    )}

                    <form onSubmit={handleLogin} onKeyDown={handleKeyDown}>
                        {/* Email */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email manzil</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="login-email"
                                    type="email"
                                    className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                                    placeholder="admin@korxona.uz"
                                    value={email}
                                    onChange={handleEmailChange}
                                    onBlur={() => validateEmail(email)}
                                    required
                                    autoComplete="email"
                                    disabled={isBlocked}
                                />
                                <span className={styles.inputIcon}>
                                    <Mail size={17} />
                                </span>
                            </div>
                            {emailError && <span className={styles.fieldError}>{emailError}</span>}
                        </div>

                        {/* Password */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Parol</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    className={`${styles.input} ${passwordError ? styles.inputError : ''}`}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    onBlur={() => validatePassword(password)}
                                    required
                                    autoComplete="current-password"
                                    disabled={isBlocked}
                                    style={{ paddingRight: "2.6rem" }}
                                />
                                <span className={styles.inputIcon}>
                                    <Lock size={17} />
                                </span>
                                <button type="button" onClick={togglePasswordVisibility} className={styles.passwordToggle} aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"} tabIndex={-1}>
                                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                </button>
                            </div>
                            {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
                        </div>

                        {/* Remember Me Row */}
                        <div className={styles.rememberRow}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                Eslab qolish
                            </label>
                            <button type="button" onClick={resetForm} className={styles.resetBtn}>
                                Formani tozalash
                            </button>
                        </div>

                        {/* Submit */}
                        <button type="submit" className={styles.submitBtn} disabled={loading || isBlocked}>
                            {loading ? (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                                    Kutilmoqda...
                                </>
                            ) : isBlocked ? (
                                <>
                                    <Clock size={17} />
                                    Bloklangan ({formatBlockTime(blockTimer)})
                                </>
                            ) : (
                                <>
                                    Kirish
                                    <LogIn size={17} />
                                </>
                            )}
                        </button>

                        {/* Attempts hint */}
                        {loginAttempts > 0 && loginAttempts < 5 && !isBlocked && (
                            <p className={styles.attemptsHint}>
                                Noto'g'ri urinishlar: {loginAttempts}/5
                            </p>
                        )}

                        {/* Divider */}
                        <div className={styles.dividerRow}>
                            <hr className={styles.dividerLine} />
                            <span>yoki</span>
                            <hr className={styles.dividerLine} />
                        </div>

                        {/* Google Login */}
                        <a href="/api/auth/google" className={styles.googleBtn}>
                            <svg viewBox="0 0 24 24" width="19" height="19" xmlns="http://www.w3.org/2000/svg">
                                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                    <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                    <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                    <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                    <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                </g>
                            </svg>
                            Google orqali kirish
                        </a>
                        
                        {/* E-imzo Login (Tez orada) */}
                        <button 
                            type="button" 
                            className={styles.googleBtn} 
                            style={{ marginTop: "12px", opacity: 0.8, cursor: "not-allowed", backgroundColor: "var(--surface-color)", border: "1px dashed var(--border-color)", padding: "0.8rem", color: "var(--text-secondary)" }} 
                            disabled
                        >
                            <img src="/e-imzo.png" alt="E-imzo" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                            <span>E-imzo orqali kirish <span style={{ fontSize: "0.75rem", background: "rgba(59,130,246,0.1)", color: "#3b82f6", padding: "2px 6px", borderRadius: "10px", marginLeft: "6px" }}>Tez orada</span></span>
                        </button>
                    </form>

                    <div className={styles.authFooter}>
                        Hisobingiz yo'qmi? <Link href="/register" className={styles.link}>Ro'yxatdan o'tish</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== ASOSIY EXPORT =====
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                width: "100vw",
                backgroundColor: "var(--bg-color)"
            }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color, #6366f1)" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
