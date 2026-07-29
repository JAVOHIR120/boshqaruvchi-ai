"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, AlertCircle, RefreshCw, Trash2, ArrowUpRight, ArrowDownRight, Sparkles } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { parseExcelTransactionsWithAI, saveImportedTransactions } from "@/actions";

type ParsedTransaction = {
    date: string;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: "SALES" | "SALARY" | "TAX" | "RENT" | "OTHER";
    selected?: boolean;
};

export default function AiBankImport() {
    const [dragActive, setDragActive] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [parsedData, setParsedData] = useState<ParsedTransaction[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (file: File) => {
        const allowedExtensions = [".xlsx", ".xls", ".csv", ".txt"];
        const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
        if (!allowedExtensions.includes(ext)) {
            toast.error("Faqat Excel (.xlsx, .xls) yoki CSV/Matn fayllarini yuklashingiz mumkin!");
            return;
        }

        setFileName(file.name);
        setIsLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                if (rawJson.length === 0) {
                    toast.error("Faylda hech qanday ma'lumot topilmadi!");
                    setIsLoading(false);
                    return;
                }

                // AI parser server actionni chaqirish
                const res = await parseExcelTransactionsWithAI(rawJson);

                if (res.error) {
                    toast.error(res.error);
                } else if (res.transactions && Array.isArray(res.transactions)) {
                    const mapped = res.transactions.map((t: any) => ({
                        date: t.date || new Date().toISOString().split("T")[0],
                        description: t.description || "Tavsifsiz tranzaksiya",
                        amount: parseFloat(t.amount) || 0,
                        type: (t.type === "EXPENSE" ? "EXPENSE" : "INCOME") as "INCOME" | "EXPENSE",
                        category: (["SALES", "SALARY", "TAX", "RENT", "OTHER"].includes(t.category) ? t.category : "OTHER") as "SALES" | "SALARY" | "TAX" | "RENT" | "OTHER",
                        selected: true,
                    }));
                    setParsedData(mapped);
                    toast.success("Hujjat muvaffaqiyatli tahlil qilindi! 🚀");
                }
            } catch (err: any) {
                console.error("File reading / AI parsing err:", err);
                toast.error("Faylni o'qishda xatolik yuz berdi: " + err.message);
            } finally {
                setIsLoading(false);
            }
        };

        reader.readAsArrayBuffer(file);
    };

    const toggleSelect = (index: number) => {
        setParsedData(prev => prev.map((item, idx) => idx === index ? { ...item, selected: !item.selected } : item));
    };

    const toggleSelectAll = (checked: boolean) => {
        setParsedData(prev => prev.map(item => ({ ...item, selected: checked })));
    };

    const handleFieldChange = (index: number, field: keyof ParsedTransaction, value: any) => {
        setParsedData(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
    };

    const deleteRow = (index: number) => {
        setParsedData(prev => prev.filter((_, idx) => idx !== index));
    };

    const handleImport = async () => {
        const toImport = parsedData.filter(item => item.selected);
        if (toImport.length === 0) {
            toast.error("Kamida bitta tranzaksiyani tanlang!");
            return;
        }

        setIsSaving(true);
        try {
            const res = await saveImportedTransactions(toImport);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Muvaffaqiyatli yakunlandi! ${res.count} ta tranzaksiya tizimga saqlandi. ✅`);
                setParsedData([]);
                setFileName(null);
            }
        } catch (err: any) {
            toast.error("Saqlashda xatolik yuz berdi: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const totalIncome = parsedData.filter(t => t.selected && t.type === "INCOME").reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = parsedData.filter(t => t.selected && t.type === "EXPENSE").reduce((sum, t) => sum + t.amount, 0);
    const selectedCount = parsedData.filter(t => t.selected).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Main Header card */}
            <div className="card glass-card-premium" style={{ padding: "1.75rem", borderTop: "4px solid var(--primary-color)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: "0", right: "0", opacity: 0.05, transform: "scale(1.5)" }}>
                    <Sparkles size={120} className="fill-current text-indigo-400" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                    <Sparkles style={{ color: "var(--primary-color)" }} />
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0 }}>AI Bank-Klient & Soliq Tahlilchisi</h3>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: "1.5", maxWidth: "800px" }}>
                    Ushbu bo'lim orqali O'zbekistondagi har qanday bank ko'chirmalari (Excel/CSV/PDF) yoki Soliq.uz schyot-fakturalarini tizimga import qilishingiz mumkin.
                    Boshqaruvchi AI fayl tuzilishini, to'lov maqsadi, summa, sana va turini avtomat ravishda tahlil qilib, to'g'ri toifalarga ajratib beradi.
                </p>
            </div>

            {/* Drag & Drop Zone */}
            {parsedData.length === 0 && (
                <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: dragActive ? "2px dashed var(--primary-color)" : "2px dashed var(--border-color)",
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: dragActive ? "rgba(99, 102, 241, 0.05)" : "rgba(255, 255, 255, 0.02)",
                        padding: "4rem 2rem",
                        textAlign: "center",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "1rem"
                    }}
                >
                    <input 
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        accept=".xlsx,.xls,.csv,.txt"
                    />
                    
                    {isLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                            <RefreshCw className="animate-spin" size={44} style={{ color: "var(--primary-color)" }} />
                            <h4 style={{ fontSize: "1.1rem", fontWeight: "600" }}>Boshqaruvchi AI faylni tahlil qilmoqda...</h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                Tranzaksiyalar, to'lov maqsadlari va toifalar saralanmoqda. Bu taxminan 5-10 soniya vaqt oladi.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(99, 102, 241, 0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "var(--primary-color)",
                                marginBottom: "0.5rem"
                            }}>
                                <Upload size={32} />
                            </div>
                            <h4 style={{ fontSize: "1.1rem", fontWeight: "600", margin: 0 }}>
                                Bank ko'chirmasi yoki schyot-fakturani shu yerga yuklang
                            </h4>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", margin: 0 }}>
                                Drag & Drop formatda sudrab tashlang yoki bu yerga bosing
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>Excel (.xlsx, .xls)</span>
                                <span style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", borderRadius: "4px", backgroundColor: "rgba(255,255,255,0.05)", color: "var(--text-secondary)" }}>CSV / TXT</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Interactive Preview Table */}
            {parsedData.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    
                    {/* Metrics Bar */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem" }}>
                        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--success-color)" }}>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Jami Kirimlar (INCOME)</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--success-color)" }}>
                                <ArrowUpRight size={20} />
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>+{totalIncome.toLocaleString()} <span style={{ fontSize: "0.8rem", fontWeight: "400" }}>so'm</span></h3>
                            </div>
                        </div>

                        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--error-color)" }}>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Jami Chiqimlar (EXPENSE)</p>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--error-color)" }}>
                                <ArrowDownRight size={20} />
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>-{totalExpense.toLocaleString()} <span style={{ fontSize: "0.8rem", fontWeight: "400" }}>so'm</span></h3>
                            </div>
                        </div>

                        <div className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--primary-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>Tanlangan tranzaksiyalar</p>
                                <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>{selectedCount} / {parsedData.length} ta</h3>
                            </div>
                            <button 
                                onClick={() => setParsedData([])} 
                                className="btn-secondary" 
                                style={{ padding: "0.5rem 0.75rem", display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.85rem", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171" }}
                            >
                                <Trash2 size={16} /> Tozalash
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="card" style={{ padding: "0", overflow: "hidden", border: "1px solid var(--border-color)" }}>
                        <div style={{ padding: "1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", margin: 0 }}>Tahlil qilingan ma'lumotlarni tekshirish</h4>
                            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                                <input 
                                    type="checkbox" 
                                    id="selectAll"
                                    checked={parsedData.length > 0 && parsedData.every(t => t.selected)} 
                                    onChange={(e) => toggleSelectAll(e.target.checked)}
                                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                />
                                <label htmlFor="selectAll" style={{ fontSize: "0.88rem", fontWeight: "500", cursor: "pointer" }}>Barchasini tanlash</label>
                            </div>
                        </div>

                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border-color)" }}>
                                        <th style={{ padding: "1rem", width: "40px" }}></th>
                                        <th style={{ padding: "1rem", minWidth: "120px" }}>Sana</th>
                                        <th style={{ padding: "1rem", minWidth: "220px" }}>Tavsif (AI tahlili bo'yicha)</th>
                                        <th style={{ padding: "1rem", minWidth: "130px" }}>Summa (so'm)</th>
                                        <th style={{ padding: "1rem", minWidth: "110px" }}>Turi</th>
                                        <th style={{ padding: "1rem", minWidth: "120px" }}>Kategoriya</th>
                                        <th style={{ padding: "1rem", width: "60px" }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.map((item, index) => {
                                        const isIncome = item.type === "INCOME";
                                        return (
                                            <tr 
                                                key={index} 
                                                style={{ 
                                                    borderBottom: "1px solid var(--border-color)", 
                                                    backgroundColor: item.selected ? (isIncome ? "rgba(16, 185, 129, 0.02)" : "rgba(239, 68, 68, 0.02)") : "transparent",
                                                    opacity: item.selected ? 1 : 0.6,
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={item.selected} 
                                                        onChange={() => toggleSelect(index)}
                                                        style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                                    />
                                                </td>
                                                
                                                {/* Date */}
                                                <td style={{ padding: "0.85rem 1rem" }}>
                                                    <input 
                                                        type="date" 
                                                        value={item.date} 
                                                        onChange={(e) => handleFieldChange(index, "date", e.target.value)}
                                                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem 0.5rem", borderRadius: "var(--radius-sm)", width: "130px" }}
                                                    />
                                                </td>

                                                {/* Description */}
                                                <td style={{ padding: "0.85rem 1rem" }}>
                                                    <input 
                                                        type="text" 
                                                        value={item.description} 
                                                        onChange={(e) => handleFieldChange(index, "description", e.target.value)}
                                                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem 0.5rem", borderRadius: "var(--radius-sm)", width: "100%" }}
                                                    />
                                                </td>

                                                {/* Amount */}
                                                <td style={{ padding: "0.85rem 1rem" }}>
                                                    <input 
                                                        type="number" 
                                                        value={item.amount} 
                                                        onChange={(e) => handleFieldChange(index, "amount", parseFloat(e.target.value) || 0)}
                                                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem 0.5rem", borderRadius: "var(--radius-sm)", width: "120px", fontWeight: "600" }}
                                                    />
                                                </td>

                                                {/* Type selection */}
                                                <td style={{ padding: "0.85rem 1rem" }}>
                                                    <select 
                                                        value={item.type} 
                                                        onChange={(e) => handleFieldChange(index, "type", e.target.value)}
                                                        style={{ 
                                                            backgroundColor: isIncome ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                                                            border: "1px solid transparent", 
                                                            color: isIncome ? "#34d399" : "#f87171", 
                                                            padding: "0.4rem", 
                                                            borderRadius: "var(--radius-sm)", 
                                                            fontWeight: "600",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        <option value="INCOME" style={{ backgroundColor: "#1e1b4b", color: "#34d399" }}>Kirim</option>
                                                        <option value="EXPENSE" style={{ backgroundColor: "#1e1b4b", color: "#f87171" }}>Chiqim</option>
                                                    </select>
                                                </td>

                                                {/* Category selection */}
                                                <td style={{ padding: "0.85rem 1rem" }}>
                                                    <select 
                                                        value={item.category} 
                                                        onChange={(e) => handleFieldChange(index, "category", e.target.value)}
                                                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "0.4rem", borderRadius: "var(--radius-sm)", width: "110px", cursor: "pointer" }}
                                                    >
                                                        <option value="SALES">Savdo</option>
                                                        <option value="SALARY">Oylik</option>
                                                        <option value="TAX">Soliq</option>
                                                        <option value="RENT">Ijara</option>
                                                        <option value="OTHER">Boshqa</option>
                                                    </select>
                                                </td>

                                                {/* Actions */}
                                                <td style={{ padding: "0.85rem 1rem", textAlign: "center" }}>
                                                    <button 
                                                        onClick={() => deleteRow(index)}
                                                        style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", padding: "0.25rem", borderRadius: "4px" }}
                                                        title="Qatorni o'chirish"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1rem" }}>
                        <button 
                            onClick={() => {
                                setParsedData([]);
                                setFileName(null);
                            }}
                            className="btn-secondary"
                            disabled={isSaving}
                        >
                            Bekor qilish
                        </button>
                        <button 
                            onClick={handleImport}
                            className="btn-primary"
                            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="animate-spin" size={18} />
                                    Tizimga saqlanmoqda...
                                </>
                            ) : (
                                <>
                                    <Check size={18} />
                                    {selectedCount} ta Tranzaksiyani Saqlash
                                </>
                            )}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
}
