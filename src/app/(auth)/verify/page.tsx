"use client";

import { useState, useRef, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedBackground from "../components/AnimatedBackground";
import styles from "../auth.module.css";
import { Mail, ArrowRight, ShieldCheck, Loader2, RefreshCw, CheckCircle2, Clock, Sparkles } from "lucide-react";

function VerifyForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const emailFromQuery = searchParams.get("email") || "";

    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState(emailFromQuery);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [resendMessage, setResendMessage] = useState<string | null>(null);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    // Auto-focus first input on mount
    useEffect(() => {
        if (emailFromQuery) {
            setTimeout(() => inputRefs[0].current?.focus(), 300);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [emailFromQuery]);

    const handleChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError(null);

        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (pasted.length === 0) return;

        const newCode = [...code];
        for (let i = 0; i < 6; i++) {
            newCode[i] = pasted[i] || "";
        }
        setCode(newCode);

        const focusIdx = Math.min(pasted.length, 5);
        inputRefs[focusIdx].current?.focus();
    }, [code]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const fullCode = code.join("");

        if (!email) {
            setError("Email manzilingizni kiriting!");
            return;
        }

        if (fullCode.length !== 6) {
            setError("Iltimos, 6 xonali kodni to'liq kiriting.");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, code: fullCode }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Xatolik yuz berdi");
                setIsLoading(false);
                // Shake animation on error
                setCode(["", "", "", "", "", ""]);
                setTimeout(() => inputRefs[0].current?.focus(), 100);
                return;
            }

            setIsSuccess(true);
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (err) {
            setError("Server bilan ulanishda xatolik yuz berdi.");
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email || countdown > 0) return;

        setIsResending(true);
        setError(null);
        setResendMessage(null);

        try {
            const res = await fetch("/api/auth/resend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Xatolik yuz berdi");
            } else {
                setResendMessage("Yangi kod pochtangizga yuborildi!");
                setCountdown(60);
                setCode(["", "", "", "", "", ""]);
                setTimeout(() => {
                    inputRefs[0].current?.focus();
                    setResendMessage(null);
                }, 4000);
            }
        } catch (err) {
            setError("Server bilan ulanishda xatolik yuz berdi.");
        } finally {
            setIsResending(false);
        }
    };

    const maskedEmail = email
        ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + "•".repeat(Math.min(b.length, 5)) + c)
        : "";

    const allFilled = code.every((d) => d !== "");

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
                        Xavfsizligingiz —{" "}
                        <span className={styles.brandTitleAccent}>bizning ustuvorligimiz</span>
                    </h2>
                    <p className={styles.brandDescription}>
                        Elektron pochtangizni tasdiqlash orqali hisobingizni himoya ostiga oling.
                        Bu jarayon bir necha soniya vaqt oladi.
                    </p>

                    {/* Security features */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "1rem",
                        marginTop: "0.5rem"
                    }}>
                        {[
                            { icon: <ShieldCheck size={18} />, text: "256-bit shifrlangan ulanish" },
                            { icon: <Clock size={18} />, text: "Kod 10 daqiqa ichida amal qiladi" },
                            { icon: <Sparkles size={18} />, text: "Avtomatik hisob faollashtirish" },
                        ].map((item, i) => (
                            <div key={i} className={styles.featureItem}>
                                <span className={styles.featureIcon}>{item.icon}</span>
                                {item.text}
                            </div>
                        ))}
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

                    {/* Header with icon */}
                    <div className={styles.authHeader}>
                        <div style={{
                            display: "inline-flex",
                            justifyContent: "center",
                            alignItems: "center",
                            width: "72px",
                            height: "72px",
                            borderRadius: "20px",
                            marginBottom: "1.25rem",
                            position: "relative",
                            background: isSuccess
                                ? "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(16,185,129,0.08) 100%)"
                                : "linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(79,70,229,0.08) 100%)",
                            border: isSuccess
                                ? "1px solid rgba(34,197,94,0.2)"
                                : "1px solid rgba(99,102,241,0.2)",
                            transition: "all 0.5s ease",
                        }}>
                            {isSuccess ? (
                                <CheckCircle2 size={34} color="#22c55e" style={{ animation: "scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1)" }} />
                            ) : (
                                <ShieldCheck size={34} color="#818cf8" />
                            )}
                            {/* Subtle glow */}
                            <div style={{
                                position: "absolute",
                                inset: "-8px",
                                borderRadius: "26px",
                                background: isSuccess
                                    ? "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)"
                                    : "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
                                pointerEvents: "none",
                                transition: "all 0.5s ease",
                            }} />
                        </div>

                        <h1 className={styles.title}>
                            {isSuccess ? "Pochta tasdiqlandi!" : "Pochtani tasdiqlang"}
                        </h1>
                        <p className={styles.subtitle}>
                            {isSuccess
                                ? "Tizimga yo'naltirilmoqdasiz..."
                                : email
                                    ? <>Biz <strong style={{ color: "#c7d2fe" }}>{maskedEmail}</strong> ga 6 xonali maxfiy kod yubordik</>
                                    : "Email manzilingizga yuborilgan kodni kiriting"
                            }
                        </p>
                    </div>

                    {/* Success state */}
                    {isSuccess ? (
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "1rem",
                            padding: "1.5rem 0",
                        }}>
                            <div style={{
                                width: "100%",
                                height: "4px",
                                borderRadius: "2px",
                                overflow: "hidden",
                                background: "rgba(255,255,255,0.06)",
                            }}>
                                <div style={{
                                    height: "100%",
                                    borderRadius: "2px",
                                    background: "linear-gradient(90deg, #22c55e, #10b981)",
                                    animation: "progressBar 1.5s ease forwards",
                                }} />
                            </div>
                            <p style={{ color: "#94a3b8", fontSize: "0.88rem" }}>Dashboard&apos;ga o&apos;tish...</p>
                        </div>
                    ) : (
                        <>
                            {/* Error Alert */}
                            {error && (
                                <div className={`${styles.alertBox} ${styles.alertError}`} style={{ animation: "shake 0.4s ease" }}>
                                    {error}
                                </div>
                            )}

                            {/* Success Alert */}
                            {resendMessage && (
                                <div className={`${styles.alertBox} ${styles.alertSuccess}`}>
                                    <CheckCircle2 size={17} />
                                    {resendMessage}
                                </div>
                            )}

                            <form onSubmit={handleVerify}>
                                {/* Email input if not from query */}
                                {!emailFromQuery && (
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Elektron Pochta</label>
                                        <div className={styles.inputWrapper}>
                                            <input
                                                type="email"
                                                className={styles.input}
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                            />
                                            <span className={styles.inputIcon}>
                                                <Mail size={17} />
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* OTP Code Inputs */}
                                <div style={{ marginBottom: "1.75rem" }}>
                                    <label className={styles.label} style={{ marginBottom: "0.75rem" }}>
                                        Tasdiqlash kodi
                                    </label>
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        gap: "0.625rem",
                                    }}>
                                        {code.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={inputRefs[index]}
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="one-time-code"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleChange(index, e.target.value)}
                                                onKeyDown={(e) => handleKeyDown(index, e)}
                                                onPaste={index === 0 ? handlePaste : undefined}
                                                onFocus={() => setFocusedIndex(index)}
                                                onBlur={() => setFocusedIndex(null)}
                                                style={{
                                                    width: "52px",
                                                    height: "62px",
                                                    fontSize: "1.5rem",
                                                    fontWeight: 700,
                                                    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                                                    textAlign: "center",
                                                    borderRadius: "14px",
                                                    border: focusedIndex === index
                                                        ? "2px solid rgba(99,102,241,0.7)"
                                                        : digit
                                                            ? "1.5px solid rgba(99,102,241,0.3)"
                                                            : "1.5px solid rgba(255,255,255,0.1)",
                                                    backgroundColor: focusedIndex === index
                                                        ? "rgba(99,102,241,0.08)"
                                                        : digit
                                                            ? "rgba(99,102,241,0.04)"
                                                            : "rgba(0,0,0,0.25)",
                                                    color: digit ? "#e0e7ff" : "rgba(255,255,255,0.3)",
                                                    outline: "none",
                                                    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                                                    boxShadow: focusedIndex === index
                                                        ? "0 0 0 4px rgba(99,102,241,0.1), 0 4px 12px rgba(0,0,0,0.2)"
                                                        : digit
                                                            ? "0 2px 8px rgba(0,0,0,0.15)"
                                                            : "inset 0 1px 2px rgba(0,0,0,0.15)",
                                                    caretColor: "#818cf8",
                                                    transform: focusedIndex === index ? "translateY(-2px)" : "none",
                                                }}
                                                aria-label={`Kod raqami ${index + 1}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Paste hint */}
                                    <p style={{
                                        textAlign: "center",
                                        fontSize: "0.78rem",
                                        color: "rgba(148,163,184,0.6)",
                                        marginTop: "0.75rem",
                                        letterSpacing: "0.01em"
                                    }}>
                                        Kodni nusxalab, birinchi katakchaga joylashtiring
                                    </p>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={isLoading || !allFilled}
                                    style={{
                                        opacity: allFilled ? 1 : 0.6,
                                    }}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                                            Tasdiqlanmoqda...
                                        </>
                                    ) : (
                                        <>
                                            Tasdiqlash
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                {/* Resend Section */}
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "0.5rem",
                                    marginTop: "1.5rem",
                                    paddingTop: "1.25rem",
                                    borderTop: "1px solid rgba(255,255,255,0.06)",
                                }}>
                                    <span style={{ color: "#64748b", fontSize: "0.88rem" }}>
                                        Kod kelmadimi?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleResend}
                                        disabled={isResending || !email || countdown > 0}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: countdown > 0 ? "#475569" : "#818cf8",
                                            cursor: (isResending || !email || countdown > 0) ? "not-allowed" : "pointer",
                                            fontSize: "0.88rem",
                                            fontWeight: 500,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.35rem",
                                            padding: "0.25rem 0.5rem",
                                            borderRadius: "6px",
                                            transition: "all 0.2s",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        {isResending ? (
                                            <>
                                                <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                                                Yuborilmoqda...
                                            </>
                                        ) : countdown > 0 ? (
                                            <>
                                                <Clock size={14} />
                                                {countdown}s kutish
                                            </>
                                        ) : (
                                            <>
                                                <RefreshCw size={14} />
                                                Qayta yuborish
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Footer */}
                    <div className={styles.authFooter}>
                        <Link href="/login" className={styles.link}>Tizimga kirish</Link>
                        <span style={{ margin: "0 0.5rem", color: "#334155" }}>•</span>
                        <Link href="/register" className={styles.link}>Ro&apos;yxatdan o&apos;tish</Link>
                    </div>
                </div>
            </div>

            {/* Injected keyframe styles */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes spin { 100% { transform: rotate(360deg); } }
                @keyframes scaleIn { 0% { transform: scale(0.3); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes shake { 0%, 100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
                @keyframes progressBar { 0% { width: 0; } 100% { width: 100%; } }
            `}} />
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
            }}>
                <Loader2 size={32} color="#818cf8" style={{ animation: "spin 1s linear infinite" }} />
                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
            </div>
        }>
            <VerifyForm />
        </Suspense>
    );
}
