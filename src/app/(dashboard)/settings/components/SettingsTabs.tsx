"use client";

import { useState, useRef } from "react";
import { Copy, CheckCircle, Save, Camera, Upload, Shield, Bell, Building, UserCircle, RefreshCcw, MapPin, Lock, Eye, EyeOff, Monitor, Moon, Sun } from "lucide-react";
import { updateProfilePicture, updateTelegramChatId } from "@/actions/auth";
import { updateCompanyDetails } from "@/actions/settings";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import ChangePasswordForm from "./ChangePasswordForm";
import toast from "react-hot-toast";
import { useTheme } from "@/components/ThemeProvider";

function PasswordDisplay({ user }: { user: any }) {
    const [showPw, setShowPw] = useState(false);
    const hasPw = user?.provider !== "google";
    const plainPw = user?.plainPassword;
    const pwLength = user?.passwordLength || 8;

    return (
        <div style={{ 
            padding: "1.25rem", 
            background: "rgba(139, 92, 246, 0.05)", 
            border: "1px solid rgba(139, 92, 246, 0.15)", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "1.5rem",
            maxWidth: "450px"
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: hasPw ? "0.75rem" : 0 }}>
                <div style={{ 
                    width: 36, height: 36, borderRadius: "10px", 
                    background: "rgba(139, 92, 246, 0.15)", 
                    display: "flex", alignItems: "center", justifyContent: "center" 
                }}>
                    <Shield size={18} color="#8b5cf6" />
                </div>
                <div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Joriy parolingiz</h4>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: 0 }}>
                        {hasPw ? "Parol o'rnatilgan va faol" : "Google orqali kirish — parol o'rnatilmagan"}
                    </p>
                </div>
            </div>
            {hasPw && (
                <div style={{ 
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    padding: "0.6rem 1rem", 
                    background: "rgba(255,255,255,0.03)", 
                    borderRadius: "var(--radius-sm)", 
                    border: "1px solid rgba(255,255,255,0.06)" 
                }}>
                    <Lock size={14} color="#8b5cf6" />
                    <span style={{ 
                        letterSpacing: showPw && plainPw ? "1px" : "3px", 
                        fontSize: showPw && plainPw ? "0.95rem" : "1.1rem", 
                        color: showPw && plainPw ? "#e2e8f0" : "#a78bfa", 
                        fontWeight: 700,
                        fontFamily: showPw && plainPw ? "monospace" : "inherit",
                    }}>
                        {showPw && plainPw ? plainPw : "•".repeat(pwLength)}
                    </span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {pwLength} belgi
                        </span>
                        {plainPw && (
                            <button 
                                type="button" 
                                onClick={() => setShowPw(!showPw)} 
                                style={{ background: "none", border: "none", color: "#8b5cf6", cursor: "pointer", display: "flex", padding: "2px" }}
                                title={showPw ? "Yashirish" : "Ko'rsatish"}
                            >
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function SettingsTabs({ user, initialCompany }: { user: any, initialCompany: any }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("general");
    const [copied, setCopied] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [avatar, setAvatar] = useState<string | null>(user?.avatarBase64 || null);
    const [telegramChatId, setTelegramChatId] = useState(user?.telegramChatId || "");
    const [companyData, setCompanyData] = useState({
        name: initialCompany?.name || "",
        inn: initialCompany?.inn || "",
        mfo: initialCompany?.mfo || "",
        account: initialCompany?.account || "",
        address: initialCompany?.address || "",
        director: initialCompany?.director || "",
        bankName: initialCompany?.bankName || "",
        isVatPayer: initialCompany?.isVatPayer ?? true,
        emailNotifications: initialCompany?.emailNotifications ?? true,
        itParkResident: initialCompany?.itParkResident ?? false,
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
                setAvatar(dataUrl);

                const result = await updateProfilePicture(dataUrl);
                setIsUploading(false);

                if (result.success) {
                    toast.success("Rasm muvaffaqiyatli yuklandi");
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    toast.error(result.error || "Rasm yuklashda xatolik yuz berdi");
                }
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setCompanyData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveGeneral = async () => {
        setIsSaving(true);
        try {
            const [companyRes, telegramRes] = await Promise.all([
                updateCompanyDetails(companyData),
                updateTelegramChatId(telegramChatId)
            ]);

            const errors: string[] = [];
            if (!companyRes.success) errors.push(companyRes.error || "Korxona ma'lumotlarini saqlashda xatolik");
            if (!telegramRes.success) errors.push(telegramRes.error || "Telegram sozlamasini saqlashda xatolik");

            if (errors.length === 0) {
                toast.success("Ma'lumotlar muvaffaqiyatli saqlandi!");
            } else if (errors.length < 2) {
                // One succeeded, one failed
                toast.success("Qisman saqlandi!");
                errors.forEach(err => toast.error(err));
            } else {
                errors.forEach(err => toast.error(err));
            }
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Kutilmagan xatolik yuz berdi");
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{ display: "flex", gap: "2rem", flexDirection: "column" }}>
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h2 className="text-2xl font-bold mb-2">Korxona Rekvizitlari va Sozlamalar</h2>
                    <p className="text-gray-500">Korxonangizning yuridik manzili, hisob raqamlari va tizim xavfsizlik sozlamalari.</p>
                </div>
                {activeTab !== 'security' && (
                    <button onClick={handleSaveGeneral} disabled={isSaving} className="btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        {isSaving ? <RefreshCcw size={20} className="animate-spin" /> : <Save size={20} />} O'zgarishlarni Saqlash
                    </button>
                )}
            </div>

            <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", overflowX: "auto" }}>
                <button onClick={() => setActiveTab("general")} style={{ background: "none", border: "none", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem", fontWeight: activeTab === "general" ? "600" : "500", color: activeTab === "general" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "general" ? "2px solid var(--primary-color)" : "2px solid transparent", marginBottom: "-17px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <UserCircle size={18} /> Umumiy Profil
                </button>
                <button onClick={() => setActiveTab("financial")} style={{ background: "none", border: "none", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem", fontWeight: activeTab === "financial" ? "600" : "500", color: activeTab === "financial" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "financial" ? "2px solid var(--primary-color)" : "2px solid transparent", marginBottom: "-17px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Building size={18} /> Moliyaviy va Rekvizitlar
                </button>
                <button onClick={() => setActiveTab("notifications")} style={{ background: "none", border: "none", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem", fontWeight: activeTab === "notifications" ? "600" : "500", color: activeTab === "notifications" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "notifications" ? "2px solid var(--primary-color)" : "2px solid transparent", marginBottom: "-17px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Bell size={18} /> Bildirishnomalar
                </button>
                <button onClick={() => setActiveTab("security")} style={{ background: "none", border: "none", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "1rem", fontWeight: activeTab === "security" ? "600" : "500", color: activeTab === "security" ? "var(--primary-color)" : "var(--text-secondary)", borderBottom: activeTab === "security" ? "2px solid var(--primary-color)" : "2px solid transparent", marginBottom: "-17px", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Shield size={18} /> Xavfsizlik
                </button>
            </div>

            <div style={{ marginTop: "1rem" }}>
                {activeTab === "general" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        <div className="card" style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                            <div style={{ position: "relative" }}>
                                <div style={{ width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "var(--surface-color)", border: "2px solid var(--border-color)", display: "flex", justifyContent: "center", alignItems: "center", overflow: "hidden", fontSize: "2.5rem", fontWeight: "bold", color: "var(--text-secondary)" }}>
                                    {avatar ? <img src={avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user?.name ? user.name.charAt(0).toUpperCase() : "B")}
                                </div>
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} style={{ position: "absolute", bottom: "0", right: "0", background: "none", border: "none", padding: 0, cursor: isUploading ? "not-allowed" : "pointer", }} className="animate-pulse-slow">
                                    <EnhancedIcon icon={Camera} size={28} color="white" glowColor="rgba(59, 130, 246, 0.8)" hasBackground={true} />
                                </button>
                                <input type="file" accept="image/jpeg, image/png, image/webp" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Shaxsiy Rasm</h3>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>{isUploading ? "Rasm yuklanmoqda... Kuting" : "Formatlar: JPG, PNG. Optimal o'lcham 400x400"}</p>
                                <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="btn-secondary">
                                    <Upload size={16} /> Yangi rasm yuklash
                                </button>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Mening Profilim</h3>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1.25rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>To'liq ismim</label>
                                    <input type="text" value={user?.name || ""} disabled className="input-premium" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Elektron manzil (Email)</label>
                                    <input type="text" value={user?.email || ""} disabled className="input-premium" style={{ opacity: 0.7, cursor: "not-allowed" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Tizimdagi rol</label>
                                    <input type="text" value={user?.role || "XODIM"} disabled className="input-premium" style={{ opacity: 0.7, cursor: "not-allowed", fontWeight: "bold", color: "var(--primary-color)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Telegram Chat ID (Tezkor hisobotlar uchun)</label>
                                    <input 
                                        type="text" 
                                        value={telegramChatId} 
                                        onChange={(e) => setTelegramChatId(e.target.value)} 
                                        className="input-premium" 
                                        placeholder="Masalan: 12345678" 
                                    />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                                <button onClick={handleSaveGeneral} disabled={isSaving} className="btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.6rem 1.5rem" }}>
                                    {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />} Saqlash
                                </button>
                            </div>
                        </div>

                        {/* UI Theme Customization */}
                        <div className="card">
                            <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>Tashqi Ko'rinish (Mavzu va Fon)</h3>
                            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Tizimning umumiy ranglar sxemasi va fon rasmini tanlang. O'zgarish darhol qo'llaniladi.</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                                
                                {/* Dark Theme */}
                                <button 
                                    onClick={() => setTheme("dark")} 
                                    style={{ 
                                        padding: "1.25rem", borderRadius: "var(--radius-lg)", 
                                        background: "linear-gradient(145deg, #0b0f19, #111827)", 
                                        border: theme === "dark" ? "2px solid var(--primary-color)" : "1px solid rgba(255,255,255,0.08)", 
                                        color: "white", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", position: "relative",
                                        boxShadow: theme === "dark" ? "0 0 20px rgba(99, 102, 241, 0.2)" : "none"
                                    }}
                                >
                                    <div style={{ width: "100%", height: "50px", background: "linear-gradient(135deg, #111827, #1f2937)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Moon size={20} color="#6366f1" />
                                    </div>
                                    <span style={{ fontWeight: "600", fontSize: "0.85rem" }}>Premium Qora</span>
                                    <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Standart rejim</span>
                                    {theme === "dark" && <CheckCircle size={18} color="#6366f1" style={{ position: "absolute", top: "8px", right: "8px" }} />}
                                </button>

                                {/* Light Glass Theme */}
                                <button 
                                    onClick={() => setTheme("light-glass")} 
                                    style={{ 
                                        padding: "1.25rem", borderRadius: "var(--radius-lg)", 
                                        background: "linear-gradient(145deg, #f1f5f9, #e2e8f0)", backgroundImage: "url('/bg-light.png')", backgroundSize: "cover", 
                                        border: theme === "light-glass" ? "2px solid var(--primary-color)" : "1px solid rgba(0,0,0,0.08)", 
                                        color: "#0f172a", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", position: "relative",
                                        boxShadow: theme === "light-glass" ? "0 0 20px rgba(99, 102, 241, 0.15)" : "none"
                                    }}
                                >
                                    <div style={{ width: "100%", height: "50px", background: "rgba(255,255,255,0.55)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Sun size={20} color="#f59e0b" />
                                    </div>
                                    <span style={{ fontWeight: "600", fontSize: "0.85rem", color: "#1e293b" }}>Ochiq Glassmorphism</span>
                                    <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Oq fon</span>
                                    {theme === "light-glass" && <CheckCircle size={18} color="#6366f1" style={{ position: "absolute", top: "8px", right: "8px" }} />}
                                </button>

                                {/* System Auto Theme */}
                                <button 
                                    onClick={() => setTheme("system")} 
                                    style={{ 
                                        padding: "1.25rem", borderRadius: "var(--radius-lg)", 
                                        background: "linear-gradient(145deg, #0b0f19 50%, #f1f5f9 50%)", 
                                        border: theme === "system" ? "2px solid var(--primary-color)" : "1px solid rgba(128,128,128,0.2)", 
                                        color: "white", cursor: "pointer", display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center", position: "relative",
                                        boxShadow: theme === "system" ? "0 0 20px rgba(99, 102, 241, 0.2)" : "none"
                                    }}
                                >
                                    <div style={{ width: "100%", height: "50px", background: "linear-gradient(135deg, #1f2937 50%, rgba(255,255,255,0.6) 50%)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(128,128,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <Monitor size={20} color="#8b5cf6" />
                                    </div>
                                    <span style={{ fontWeight: "600", fontSize: "0.85rem", background: "linear-gradient(90deg, white 40%, #1e293b 60%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Avtomatik</span>
                                    <span style={{ fontSize: "0.72rem", color: "rgba(148,163,184,0.8)" }}>Tizim sozlamasi</span>
                                    {theme === "system" && <CheckCircle size={18} color="#6366f1" style={{ position: "absolute", top: "8px", right: "8px" }} />}
                                </button>

                            </div>
                        </div>

                    </div>
                )}

                {activeTab === "financial" && (
                    <div className="card">
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Korxona Rekvizitlari</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Korxona to'liq nomi</label>
                                <input type="text" name="name" value={companyData.name} onChange={handleCompanyChange} className="input-premium" placeholder="Masalan: MChJ Boshqaruvchi AI" />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>STIR (INN)</label>
                                    <input type="text" name="inn" value={companyData.inn} onChange={handleCompanyChange} className="input-premium" placeholder="9 xonali raqam" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>MFO</label>
                                    <input type="text" name="mfo" value={companyData.mfo} onChange={handleCompanyChange} className="input-premium" placeholder="5 bank kodi" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Bank Hisob raqami (H/R)</label>
                                <div style={{ position: "relative" }}>
                                    <input type="text" name="account" value={companyData.account} onChange={handleCompanyChange} className="input-premium" placeholder="20 xonali raqam" />
                                    <button onClick={() => copyToClipboard(companyData.account)} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                                        {copied ? <CheckCircle size={18} color="var(--success-color)" /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Bank Nomi</label>
                                    <input type="text" name="bankName" value={companyData.bankName} onChange={handleCompanyChange} className="input-premium" placeholder="Bank nomi va filiali" />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Yuridik Manzil</label>
                                    <input type="text" name="address" value={companyData.address} onChange={handleCompanyChange} className="input-premium" placeholder="Korxona yuridik manzili" />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Direktor (Rahbar)</label>
                                <input type="text" name="director" value={companyData.director} onChange={handleCompanyChange} className="input-premium" placeholder="F.I.O" />
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                            <button onClick={handleSaveGeneral} disabled={isSaving} className="btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.6rem 1.5rem" }}>
                                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />} Saqlash
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="card">
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Bildirishnomalar va Soliq Sozlamalar</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
                                <div>
                                    <h4 style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>QQS to'lovchisi</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "500px" }}>Korxona 12% lik Qo'shilgan Qiymat Solig'ini to'laydimi? Ushbu sozlama avtomatik soliq hisoblash funksiyasiga ta'sir qiladi.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" name="isVatPayer" checked={companyData.isVatPayer} onChange={handleCompanyChange} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem" }}>
                                <div>
                                    <h4 style={{ fontWeight: "600", color: "var(--text-primary)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>Oylik elektron xabarnomalar</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "500px" }}>E-mail manzilimga har oylik moliya, soliqlar va qarzlar holati haqida qisqacha xisobot yuborilsin.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" name="emailNotifications" checked={companyData.emailNotifications} onChange={handleCompanyChange} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
                                <div>
                                    <h4 style={{ fontWeight: "600", color: "var(--primary-color)", fontSize: "1.05rem", marginBottom: "0.25rem" }}>⚡ IT Park Rezidenti</h4>
                                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", maxWidth: "500px" }}>IT Park rezidentlari uchun 306-modda bo&apos;yicha tezlashtirilgan amortizatsiya (2 baravar) qo&apos;llash imkoniyati yoqiladi.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" name="itParkResident" checked={companyData.itParkResident} onChange={handleCompanyChange} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
                            <button onClick={handleSaveGeneral} disabled={isSaving} className="btn-primary" style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.6rem 1.5rem" }}>
                                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />} Saqlash
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === "security" && (
                    <div className="card">
                        <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem" }}>Tizim Xavfsizligi</h3>
                        
                        {/* Current Password Status */}
                        <PasswordDisplay user={user} />

                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: "400px" }}>
                            <ChangePasswordForm />
                            
                            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "0.5rem 0" }} />

                            <button className="btn-primary" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "var(--error-color)", border: "1px solid rgba(239, 68, 68, 0.3)", width: "100%", padding: "0.75rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
                                Barcha qurilmalardan chiqish
                            </button>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textAlign: "center" }}>Agar akkauntingiz xavfsizligidan shubhalansangiz, barcha sessiyalarni yakunlang.</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .switch { position: relative; display: inline-block; width: 50px; height: 28px; }
                .switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--surface-color); border: 1px solid var(--border-color); transition: .4s; }
                .slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background-color: var(--text-secondary); transition: .4s; }
                input:checked + .slider { background-color: rgba(99, 102, 241, 0.2); border-color: var(--primary-color); }
                input:checked + .slider:before { transform: translateX(22px); background-color: var(--primary-color); }
                .slider.round { border-radius: 34px; }
                .slider.round:before { border-radius: 50%; }
            `}</style>
        </div>
    );
}
