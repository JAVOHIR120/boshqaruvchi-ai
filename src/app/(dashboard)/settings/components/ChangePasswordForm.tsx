"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Lock, KeyRound, Eye, EyeOff, Loader2, Check } from "lucide-react";
import { changePassword } from "@/actions/settings";

export default function ChangePasswordForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    // Validation States
    const [validations, setValidations] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
        match: false,
    });

    const [strength, setStrength] = useState(0);

    // Run validation on changes
    useEffect(() => {
        const length = newPassword.length >= 8;
        const uppercase = /[A-Z]/.test(newPassword);
        const lowercase = /[a-z]/.test(newPassword);
        const number = /[0-9]/.test(newPassword);
        const special = /[^A-Za-z0-9]/.test(newPassword);
        const match = newPassword !== "" && newPassword === confirmPassword;

        setValidations({ length, uppercase, lowercase, number, special, match });

        // Calculate strength (0 to 5)
        let newStrength = 0;
        if (length) newStrength += 1;
        if (uppercase && lowercase) newStrength += 1;
        if (number) newStrength += 1;
        if (special) newStrength += 1;
        if (length && uppercase && lowercase && number && special) newStrength += 1; // Bonus for full complexity
        
        setStrength(newStrength);
    }, [newPassword, confirmPassword]);

    const isFormValid = Object.values(validations).every(Boolean) && currentPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid) {
            setStatus("error");
            setErrorMessage("Iltimos, barcha xavfsizlik talablarini bajaring.");
            return;
        }

        setStatus("loading");
        
        try {
            const result = await changePassword(currentPassword, newPassword);
            
            if (result.success) {
                setStatus("success");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErrorMessage(result.error || "Xatolik yuz berdi");
            }
        } catch (err) {
            setStatus("error");
            setErrorMessage("Kutilmagan xatolik yuz berdi");
        }
    };

    const strengthColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e", "#16a34a"];
    const strengthLabels = ["Juda zaif", "Zaif", "Yaxshi", "Kuchli", "Juda kuchli", "A'lo"];

    const currentStrengthColor = newPassword.length === 0 ? "var(--border-color)" : strengthColors[strength];
    const currentStrengthWidth = newPassword.length === 0 ? "0%" : `${(strength / 5) * 100}%`;

    const RequirementItem = ({ fulfilled, text }: { fulfilled: boolean, text: string }) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: fulfilled ? "var(--success-color)" : "var(--text-secondary)", transition: "color 0.3s ease" }}>
            <motion.div
                initial={false}
                animate={{ scale: fulfilled ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.3 }}
                style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: fulfilled ? "rgba(34, 197, 94, 0.2)" : "rgba(255, 255, 255, 0.05)" }}
            >
                {fulfilled && <Check size={10} strokeWidth={3} />}
            </motion.div>
            <span style={{ textDecoration: fulfilled ? "line-through" : "none", opacity: fulfilled ? 0.7 : 1 }}>{text}</span>
        </div>
    );

    return (
        <div style={{ maxWidth: "450px", marginTop: "1rem" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                        Joriy parol
                    </label>
                    <div style={{ position: "relative" }}>
                        <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                            <Lock size={18} />
                        </div>
                        <input 
                            type={showCurrent ? "text" : "password"} 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                            className="input-premium"
                            style={{ paddingLeft: "40px", paddingRight: "40px", width: "100%" }}
                            placeholder="Joriy parolingizni kiriting"
                        />
                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                            Yangi parol
                        </label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}>
                                <KeyRound size={18} />
                            </div>
                            <input 
                                type={showNew ? "text" : "password"} 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                className="input-premium"
                                style={{ paddingLeft: "40px", paddingRight: "40px", width: "100%", borderColor: newPassword.length > 0 && validations.match ? "var(--success-color)" : "var(--border-color)" }}
                                placeholder="Yangi parol (min. 8 harf)"
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}>
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>
                            Parolni tasdiqlash
                        </label>
                        <div style={{ position: "relative" }}>
                            <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: validations.match ? "var(--success-color)" : "var(--text-secondary)", transition: "color 0.3s ease" }}>
                                <CheckCircle2 size={18} />
                            </div>
                            <input 
                                type={showNew ? "text" : "password"} 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="input-premium"
                                style={{ paddingLeft: "40px", width: "100%", borderColor: confirmPassword.length > 0 && validations.match ? "var(--success-color)" : "var(--border-color)" }}
                                placeholder="Yangi parolni takrorlang"
                            />
                        </div>
                    </div>
                </div>

                {/* Password Strength Meter */}
                <div style={{ marginTop: "0.25rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.25rem", color: "var(--text-secondary)" }}>
                        <span>Parol xavfsizligi</span>
                        <span style={{ color: currentStrengthColor, fontWeight: "600", transition: "color 0.3s ease" }}>
                            {newPassword.length > 0 ? strengthLabels[strength] : ""}
                        </span>
                    </div>
                    <div style={{ height: "4px", backgroundColor: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
                        <motion.div 
                            initial={false}
                            animate={{ width: currentStrengthWidth, backgroundColor: currentStrengthColor }}
                            transition={{ duration: 0.3 }}
                            style={{ height: "100%" }}
                        />
                    </div>
                </div>

                {/* Validation Checklist */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem", padding: "1rem", backgroundColor: "var(--surface-color)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                    <RequirementItem fulfilled={validations.length} text="Kamida 8 ta belgi" />
                    <RequirementItem fulfilled={validations.uppercase} text="Kamida bitta katta harf" />
                    <RequirementItem fulfilled={validations.lowercase} text="Kamida bitta kichik harf" />
                    <RequirementItem fulfilled={validations.number} text="Kamida bitta raqam" />
                    <RequirementItem fulfilled={validations.special} text="Maxsus belgi (!@#$%^&*)" />
                    <RequirementItem fulfilled={validations.match} text="Parollar mos keladi" />
                </div>

                <AnimatePresence mode="wait">
                    {status === "error" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            style={{ padding: "0.75rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "var(--radius-md)", color: "var(--error-color)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
                        >
                            <AlertCircle size={16} />
                            {errorMessage}
                        </motion.div>
                    )}
                    
                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            style={{ padding: "0.75rem", backgroundColor: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "var(--radius-md)", color: "var(--success-color)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}
                        >
                            <CheckCircle2 size={16} />
                            Parolingiz muvaffaqiyatli o'zgartirildi!
                        </motion.div>
                    )}
                </AnimatePresence>

                <button 
                    type="submit" 
                    disabled={status === "loading" || !isFormValid}
                    className="btn-primary" 
                    style={{ 
                        marginTop: "0.5rem", 
                        display: "flex", 
                        justifyContent: "center", 
                        alignItems: "center", 
                        gap: "0.5rem",
                        opacity: isFormValid ? 1 : 0.5,
                        cursor: isFormValid ? "pointer" : "not-allowed",
                        transition: "all 0.3s ease"
                    }}
                >
                    {status === "loading" ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saqlanmoqda...
                        </>
                    ) : (
                        <>
                            <Lock size={18} />
                            Parolni Saqlash
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
