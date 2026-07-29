"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, Download, Plus, Trash2, Save, Link2, ExternalLink, AlertCircle, CheckCircle2, RefreshCcw, FileSpreadsheet, Sheet, X, Eye, EyeOff } from "lucide-react";
import * as XLSX from "xlsx";

// ============================
// Types
// ============================
interface CellData {
    value: string;
    error?: string;
}

interface SpreadsheetRow {
    [col: string]: CellData;
}

const DEFAULT_COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const TEMPLATE_HEADERS: Record<string, string> = {
    A: "Sana (kun.oy.yil)",
    B: "Hujjat raqami",
    C: "Tavsif",
    D: "Kategoriya",
    E: "Tur (Kirim/Chiqim)",
    F: "Summa (so'm)",
    G: "Izoh",
    H: "Mas'ul shaxs",
};

const TYPE_OPTIONS = ["Kirim", "Chiqim"];
const CATEGORY_OPTIONS = [
    "Savdo (Sotish)", "Xizmat ko'rsatish", "Oylik maoshlar", "Soliqlar",
    "Kommunal to'lovlar", "Transport", "Ofis xarajatlari", "Marketing",
    "Uskunalar", "Boshqa"
];

function createEmptyRow(): SpreadsheetRow {
    const row: SpreadsheetRow = {};
    DEFAULT_COLS.forEach((col) => {
        row[col] = { value: "" };
    });
    return row;
}

function createTemplateRow(): SpreadsheetRow {
    const row: SpreadsheetRow = {};
    DEFAULT_COLS.forEach((col) => {
        row[col] = { value: TEMPLATE_HEADERS[col] || "" };
    });
    return row;
}

function validateCell(col: string, value: string): string | undefined {
    if (!value) return undefined;
    if (col === "E") {
        if (!TYPE_OPTIONS.includes(value)) return "Faqat 'Kirim' yoki 'Chiqim' bo'lishi mumkin";
    }
    if (col === "F") {
        const num = parseFloat(value.replace(/\s/g, ''));
        if (isNaN(num)) return "Summa faqat raqamlardan iborat bo'lishi kerak";
    }
    return undefined;
}

// ============================
// Google Sheets URL parser
// ============================
function parseGoogleSheetsUrl(url: string): string | null {
    try {
        // Format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        if (match) return match[1];
    } catch {}
    return null;
}

function buildEmbedUrl(spreadsheetId: string): string {
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing&embedded=true`;
}

// ============================
// Main Component
// ============================
export default function ExcelSpreadsheet({ transactions }: { transactions: any[] }) {
    // View mode: "sheets" or "local"
    const [viewMode, setViewMode] = useState<"sheets" | "local">("sheets");

    // Standard default Google sheet for Boshqaruvchi AI accounts (from user's screenshot)
    const DEFAULT_SHEET_URL = "https://docs.google.com/spreadsheets/d/1XmgO_sOc_3_wZicCYIGXxJqKHDxFKX3Ak3Hu9BRaYOQ/edit";

    // Google Sheets state
    const [sheetsUrl, setSheetsUrl] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("boshliq_google_sheets_url") || DEFAULT_SHEET_URL;
        }
        return DEFAULT_SHEET_URL;
    });
    
    // Default the input to the same URL
    const [sheetsInput, setSheetsInput] = useState(DEFAULT_SHEET_URL);
    
    // As it loads, it should instantly be connected
    const [sheetsConnected, setSheetsConnected] = useState(true);
    const [sheetsId, setSheetsId] = useState<string | null>(parseGoogleSheetsUrl(DEFAULT_SHEET_URL));
    const [sheetsError, setSheetsError] = useState<string | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Local spreadsheet state (fallback / Excel mode)
    const [rows, setRows] = useState<SpreadsheetRow[]>(() => {
        const headerRow = createTemplateRow();
        const dataRows: SpreadsheetRow[] = transactions.map((t) => {
            const row = createEmptyRow();
            row["A"] = { value: new Date(t.date).toLocaleDateString("uz-UZ") };
            row["B"] = { value: t.id.substring(0, 8) };
            row["C"] = { value: t.description };
            row["D"] = { value: t.category };
            row["E"] = { value: t.type === "INCOME" ? "Kirim" : "Chiqim" };
            row["F"] = { value: t.amount.toString() };
            row["G"] = { value: "" };
            row["H"] = { value: "" };
            return row;
        });
        if (dataRows.length === 0) {
            return [headerRow, ...Array.from({ length: 10 }).map(() => createEmptyRow())];
        }
        return [headerRow, ...dataRows, createEmptyRow(), createEmptyRow()];
    });

    const [selectedCells, setSelectedCells] = useState<{ start: { r: number; c: number } | null; end: { r: number; c: number } | null }>({ start: null, end: null });
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; row: number } | null>(null);
    const [importStatus, setImportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const editInputRef = useRef<HTMLInputElement>(null);
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Init Google Sheets from saved URL
    useEffect(() => {
        if (sheetsUrl) {
            const id = parseGoogleSheetsUrl(sheetsUrl);
            if (id) {
                setSheetsId(id);
                setSheetsConnected(true);
                setSheetsInput(sheetsUrl);
            }
        }
    }, [sheetsUrl]);

    // Context menu dismiss
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (editingCell && editInputRef.current) {
            editInputRef.current.focus();
            if (editInputRef.current.tagName === 'INPUT') editInputRef.current.select();
        }
    }, [editingCell]);

    useEffect(() => {
        if (importStatus && importStatus.type === "success") {
            const timer = setTimeout(() => setImportStatus(null), 4000);
            return () => clearTimeout(timer);
        }
    }, [importStatus]);

    // Escape fullscreen
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isFullScreen) setIsFullScreen(false);
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isFullScreen]);

    // ============================
    // Google Sheets Handlers
    // ============================
    const handleConnectSheets = useCallback(() => {
        setSheetsError(null);
        const id = parseGoogleSheetsUrl(sheetsInput);
        if (!id) {
            setSheetsError("Noto'g'ri Google Sheets URL. Iltimos, to'g'ri havolani kiriting.");
            return;
        }
        setSheetsId(id);
        setSheetsConnected(true);
        setSheetsUrl(sheetsInput);
        localStorage.setItem("boshliq_google_sheets_url", sheetsInput);
        setImportStatus({ type: "success", message: "Google Sheets muvaffaqiyatli ulandi!" });
    }, [sheetsInput]);

    const handleDisconnectSheets = useCallback(() => {
        setSheetsId(null);
        setSheetsConnected(false);
        setSheetsUrl("");
        setSheetsInput("");
        localStorage.removeItem("boshliq_google_sheets_url");
    }, []);

    // ============================
    // Local Spreadsheet Handlers
    // ============================
    const updateCell = useCallback((rowIndex: number, col: string, value: string) => {
        setRows((prev) => {
            const newRows = [...prev];
            const error = validateCell(col, value);
            newRows[rowIndex] = { ...newRows[rowIndex], [col]: { value, error } };
            if (rowIndex === prev.length - 1 && value !== "") newRows.push(createEmptyRow());
            return newRows;
        });
    }, []);

    const addRow = useCallback((index?: number) => {
        setRows((prev) => {
            const newRows = [...prev];
            if (typeof index === 'number') newRows.splice(index, 0, createEmptyRow());
            else newRows.push(createEmptyRow());
            return newRows;
        });
        setContextMenu(null);
    }, []);

    const deleteRow = useCallback((rowIndex: number) => {
        if (rowIndex === 0) return;
        setRows((prev) => prev.filter((_, i) => i !== rowIndex));
        setContextMenu(null);
    }, []);

    const duplicateRow = useCallback((rowIndex: number) => {
        if (rowIndex === 0) return;
        setRows((prev) => {
            const newRows = [...prev];
            newRows.splice(rowIndex + 1, 0, { ...prev[rowIndex] });
            return newRows;
        });
        setContextMenu(null);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (editingCell) return;
        if (!selectedCells.start) return;
        const { r: row, c: colIdx } = selectedCells.start;
        const col = DEFAULT_COLS[colIdx];

        if (e.key === "ArrowUp") { e.preventDefault(); if (row > 1) setSelectedCells({ start: { r: row - 1, c: colIdx }, end: { r: row - 1, c: colIdx } }); }
        else if (e.key === "ArrowDown") { e.preventDefault(); if (row < rows.length - 1) setSelectedCells({ start: { r: row + 1, c: colIdx }, end: { r: row + 1, c: colIdx } }); }
        else if (e.key === "ArrowLeft") { e.preventDefault(); if (colIdx > 0) setSelectedCells({ start: { r: row, c: colIdx - 1 }, end: { r: row, c: colIdx - 1 } }); }
        else if (e.key === "ArrowRight") { e.preventDefault(); if (colIdx < DEFAULT_COLS.length - 1) setSelectedCells({ start: { r: row, c: colIdx + 1 }, end: { r: row, c: colIdx + 1 } }); }
        else if (e.key === "Enter") { e.preventDefault(); setEditingCell({ row, col }); }
        else if (e.key === "Tab") { e.preventDefault(); const nc = e.shiftKey ? colIdx - 1 : colIdx + 1; if (nc >= 0 && nc < DEFAULT_COLS.length) setSelectedCells({ start: { r: row, c: nc }, end: { r: row, c: nc } }); }
        else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); updateCell(row, col, ""); }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) setEditingCell({ row, col });

        if ((e.ctrlKey || e.metaKey) && e.key === "c") {
            e.preventDefault();
            if (selectedCells.start) navigator.clipboard.writeText(rows[selectedCells.start.r][DEFAULT_COLS[selectedCells.start.c]].value);
        }
    }, [editingCell, selectedCells, rows, updateCell]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
        if (editingCell) return;
        e.preventDefault();
        const clipboardData = e.clipboardData.getData("Text");
        if (!clipboardData || !selectedCells.start) return;
        const pasteRows = clipboardData.split(/\r?\n/).filter(r => r.trim() !== '');
        setRows(prev => {
            const newRows = [...prev];
            const startR = selectedCells.start!.r;
            const startC = selectedCells.start!.c;
            pasteRows.forEach((pasteRow, i) => {
                const rowIdx = startR + i;
                const cells = pasteRow.split('\t');
                if (rowIdx >= newRows.length) newRows.push(createEmptyRow());
                cells.forEach((cellVal, j) => {
                    const colIdx = startC + j;
                    if (colIdx < DEFAULT_COLS.length) {
                        const col = DEFAULT_COLS[colIdx];
                        const cleanVal = cellVal.replace(/"/g, "").trim();
                        newRows[rowIdx] = { ...newRows[rowIdx], [col]: { value: cleanVal, error: validateCell(col, cleanVal) } };
                    }
                });
            });
            if (newRows.length - (startR + pasteRows.length) < 2) { newRows.push(createEmptyRow()); newRows.push(createEmptyRow()); }
            return newRows;
        });
    }, [editingCell, selectedCells]);

    const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: string[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (jsonData.length === 0) { setImportStatus({ type: "error", message: "Fayl bo'sh!" }); return; }
                const importedRows: SpreadsheetRow[] = [createTemplateRow()];
                const startIndex = jsonData.length > 1 && isNaN(parseFloat(jsonData[1][5] || 'a')) ? 1 : 0;
                for (let i = startIndex; i < jsonData.length; i++) {
                    const rowData = jsonData[i];
                    const row = createEmptyRow();
                    DEFAULT_COLS.forEach((col, ci) => { if (ci < rowData.length) { const val = String(rowData[ci] ?? "").trim(); row[col] = { value: val, error: validateCell(col, val) }; } });
                    if (DEFAULT_COLS.some(col => row[col].value !== "")) importedRows.push(row);
                }
                while (importedRows.length < 10) importedRows.push(createEmptyRow());
                setRows(importedRows);
                setImportStatus({ type: "success", message: `${importedRows.length - 1} qator muvaffaqiyatli yuklandi!` });
            } catch { setImportStatus({ type: "error", message: "Faylni o'qishda xatolik!" }); }
        };
        reader.readAsArrayBuffer(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleExport = useCallback(() => {
        const wsData = rows.map((row) => DEFAULT_COLS.map((col) => row[col]?.value || ""));
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws["!cols"] = DEFAULT_COLS.map(() => ({ wch: 18 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Buxgalteriya");
        XLSX.writeFile(wb, `Buxgalteriya_${new Date().toISOString().split("T")[0]}.xlsx`);
    }, [rows]);

    const handleSaveAsTransactions = useCallback(async () => {
        setIsSaving(true);
        setImportStatus(null);
        try {
            const validRows = rows.slice(1).filter((row) => {
                const desc = row["C"]?.value?.trim();
                const amt = row["F"]?.value?.trim();
                return desc && amt && DEFAULT_COLS.every(col => !row[col].error);
            });
            if (validRows.length === 0) { setImportStatus({ type: "error", message: "Saqlash uchun to'g'ri ma'lumot topilmadi!" }); setIsSaving(false); return; }
            const txns = validRows.map((row) => ({
                description: row["C"]?.value || "",
                amount: parseFloat(row["F"]?.value?.replace(/\s/g, '') || "0"),
                type: (row["E"]?.value || "").toLowerCase().includes("kirim") ? "INCOME" : "EXPENSE",
                category: row["D"]?.value || "OTHER",
            }));
            const res = await fetch("/api/accounting/import-excel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transactions: txns }) });
            if (res.ok) { const result = await res.json(); setImportStatus({ type: "success", message: `${result.count} ta tranzaksiya saqlandi!` }); }
            else { const err = await res.json(); setImportStatus({ type: "error", message: err.error || "Xatolik!" }); }
        } catch { setImportStatus({ type: "error", message: "Server bilan aloqa o'rnatilmadi!" }); }
        setIsSaving(false);
    }, [rows]);

    const totalIncome = rows.slice(1).reduce((sum, row) => { const v = parseFloat(row["F"]?.value?.replace(/\s/g, '') || "0"); return (row["E"]?.value || "").toLowerCase().includes("kirim") && !isNaN(v) ? sum + v : sum; }, 0);
    const totalExpense = rows.slice(1).reduce((sum, row) => { const v = parseFloat(row["F"]?.value?.replace(/\s/g, '') || "0"); return (row["E"]?.value || "").toLowerCase().includes("chiqim") && !isNaN(v) ? sum + v : sum; }, 0);

    // ============================
    // STYLES
    // ============================
    const tabStyle = (active: boolean): React.CSSProperties => ({
        padding: "0.65rem 1.25rem",
        borderRadius: "var(--radius-md)",
        border: active ? "2px solid var(--primary-color)" : "1px solid var(--border-color)",
        backgroundColor: active ? "rgba(59, 130, 246, 0.12)" : "var(--surface-color)",
        color: active ? "var(--primary-color)" : "var(--text-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontWeight: 600,
        fontSize: "0.85rem",
        transition: "all 0.2s",
    });

    const btnStyle: React.CSSProperties = {
        padding: "0.6rem 1rem",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--background-color)",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        fontWeight: 600,
        fontSize: "0.85rem",
        transition: "all 0.2s",
    };

    const contextMenuStyle: React.CSSProperties = {
        display: "flex", alignItems: "center", gap: "0.5rem", width: "100%", padding: "0.5rem 0.75rem",
        border: "none", background: "none", cursor: "pointer", fontSize: "0.85rem", textAlign: "left",
        borderRadius: "var(--radius-sm)", color: "var(--text-primary)", transition: "background 0.1s"
    };

    // ============================
    // RENDER
    // ============================
    return (
        <div style={{ animation: "fadeIn 0.5s ease" }}>
            {/* Status bar */}
            {importStatus && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem",
                    marginBottom: "1.5rem", borderRadius: "var(--radius-lg)",
                    backgroundColor: importStatus.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${importStatus.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                    color: importStatus.type === "success" ? "var(--success-color)" : "var(--error-color)",
                }}>
                    {importStatus.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span style={{ fontWeight: 500 }}>{importStatus.message}</span>
                </div>
            )}

            {/* View Mode Tabs */}
            <div style={{
                display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap",
                padding: "1rem", backgroundColor: "var(--surface-color)",
                border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)",
            }}>
                <button onClick={() => setViewMode("sheets")} style={tabStyle(viewMode === "sheets")}>
                    <Sheet size={18} /> Google Sheets
                </button>
                <button onClick={() => setViewMode("local")} style={tabStyle(viewMode === "local")}>
                    <FileSpreadsheet size={18} /> Lokal Excel
                </button>
            </div>

            {/* ==============================
                GOOGLE SHEETS VIEW
            ================================ */}
            {viewMode === "sheets" && (
                <div>
                    {!sheetsConnected ? (
                        /* Connection Form */
                        <div style={{
                            padding: "2.5rem",
                            borderRadius: "var(--radius-lg)",
                            border: "2px dashed var(--border-color)",
                            backgroundColor: "var(--surface-color)",
                            textAlign: "center",
                        }}>
                            <div style={{
                                width: 70, height: 70, borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(52,168,83,0.15), rgba(66,133,244,0.15))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 1.5rem",
                            }}>
                                <Sheet size={32} style={{ color: "#34a853" }} />
                            </div>
                            <h3 style={{ margin: "0 0 0.5rem", color: "var(--text-primary)", fontSize: "1.25rem" }}>
                                Google Sheets ulash
                            </h3>
                            <p style={{ color: "var(--text-secondary)", margin: "0 0 2rem", maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                                Google Sheets jadvalingizni platformaga ulang. Jadval ichida tahrirlash, formulalar ishlatish va jamoangiz bilan hamkorlik qilish imkoniyatiga ega bo&apos;lasiz.
                            </p>

                            {/* Steps */}
                            <div style={{
                                display: "flex", gap: "1.5rem", justifyContent: "center",
                                marginBottom: "2rem", flexWrap: "wrap",
                            }}>
                                {[
                                    { step: "1", text: 'Google Sheets\'da yangi jadval oching' },
                                    { step: "2", text: '"Ulashish" → "Havolaga ega har kim" tanlang' },
                                    { step: "3", text: "Havolani pastga joylashtiring" },
                                ].map((item) => (
                                    <div key={item.step} style={{
                                        display: "flex", alignItems: "center", gap: "0.75rem",
                                        padding: "0.75rem 1rem", borderRadius: "var(--radius-md)",
                                        backgroundColor: "var(--background-color)", border: "1px solid var(--border-color)",
                                    }}>
                                        <span style={{
                                            width: 28, height: 28, borderRadius: "50%",
                                            backgroundColor: "var(--primary-color)", color: "#fff",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontWeight: 700, fontSize: "0.8rem",
                                        }}>{item.step}</span>
                                        <span style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{item.text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* URL Input */}
                            <div style={{
                                display: "flex", gap: "0.75rem", maxWidth: 600,
                                margin: "0 auto", flexWrap: "wrap", justifyContent: "center",
                            }}>
                                <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
                                    <Link2 size={18} style={{
                                        position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                                        color: "var(--text-secondary)",
                                    }} />
                                    <input
                                        type="url"
                                        value={sheetsInput}
                                        onChange={(e) => { setSheetsInput(e.target.value); setSheetsError(null); }}
                                        placeholder="https://docs.google.com/spreadsheets/d/..."
                                        onKeyDown={(e) => { if (e.key === "Enter") handleConnectSheets(); }}
                                        style={{
                                            width: "100%", padding: "0.8rem 1rem 0.8rem 2.5rem",
                                            borderRadius: "var(--radius-md)",
                                            border: sheetsError ? "2px solid var(--error-color)" : "1px solid var(--border-color)",
                                            backgroundColor: "var(--background-color)",
                                            color: "var(--text-primary)",
                                            fontSize: "0.9rem", outline: "none",
                                            transition: "border-color 0.2s",
                                        }}
                                    />
                                </div>
                                <button onClick={handleConnectSheets} style={{
                                    padding: "0.8rem 1.5rem", borderRadius: "var(--radius-md)",
                                    border: "none", backgroundColor: "#34a853", color: "#fff",
                                    cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                                    display: "flex", alignItems: "center", gap: "0.5rem",
                                    boxShadow: "0 2px 10px rgba(52, 168, 83, 0.3)",
                                    transition: "all 0.2s",
                                }}>
                                    <Link2 size={18} /> Ulash
                                </button>
                            </div>
                            {sheetsError && (
                                <p style={{ color: "var(--error-color)", marginTop: "0.75rem", fontSize: "0.85rem" }}>
                                    <AlertCircle size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                                    {sheetsError}
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Connected — Embedded Sheets */
                        <div>
                            {/* Sheets Toolbar */}
                            <div style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "0.75rem 1rem", marginBottom: "1rem",
                                backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-lg)", flexWrap: "wrap", gap: "0.75rem",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                    <div style={{
                                        width: 10, height: 10, borderRadius: "50%", backgroundColor: "#34a853",
                                        boxShadow: "0 0 6px rgba(52,168,83,0.5)",
                                    }} />
                                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                        Google Sheets ulangan
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <button
                                        onClick={() => setIsFullScreen(!isFullScreen)}
                                        style={btnStyle}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                                    >
                                        {isFullScreen ? <EyeOff size={16} /> : <Eye size={16} />}
                                        {isFullScreen ? "Kichraytirish" : "Kattalashtirish"}
                                    </button>
                                    <a
                                        href={sheetsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ ...btnStyle, textDecoration: "none" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                                    >
                                        <ExternalLink size={16} /> Sheets&apos;da ochish
                                    </a>
                                    <button
                                        onClick={handleDisconnectSheets}
                                        style={{ ...btnStyle, color: "var(--error-color)", borderColor: "rgba(239,68,68,0.3)" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                        onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
                                    >
                                        <X size={16} /> Uzish
                                    </button>
                                </div>
                            </div>

                            {/* Iframe */}
                            <div style={{
                                borderRadius: "var(--radius-lg)",
                                overflow: "hidden",
                                border: "1px solid var(--border-color)",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                                transition: "all 0.3s ease",
                                ...(isFullScreen ? {
                                    position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0,
                                    zIndex: 9999, borderRadius: 0, border: "none",
                                } : {}),
                            }}>
                                {isFullScreen && (
                                    <div style={{
                                        padding: "0.5rem 1rem", backgroundColor: "var(--surface-color)",
                                        borderBottom: "1px solid var(--border-color)",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                    }}>
                                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <Sheet size={16} /> Google Sheets — To&apos;liq ekran
                                        </span>
                                        <button onClick={() => setIsFullScreen(false)} style={{
                                            padding: "0.4rem 0.75rem", borderRadius: "var(--radius-sm)",
                                            border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)",
                                            color: "var(--text-primary)", cursor: "pointer", fontSize: "0.8rem",
                                        }}>
                                            ESC — Yopish
                                        </button>
                                    </div>
                                )}
                                <iframe
                                    src={sheetsId ? buildEmbedUrl(sheetsId) : ""}
                                    style={{
                                        width: "100%",
                                        height: isFullScreen ? "calc(100vh - 44px)" : "650px",
                                        border: "none",
                                        backgroundColor: "#fff",
                                    }}
                                    title="Google Sheets"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==============================
                LOCAL EXCEL VIEW
            ================================ */}
            {viewMode === "local" && (
                <div>
                    {/* Toolbar */}
                    <div style={{
                        display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap",
                        alignItems: "center", justifyContent: "space-between", padding: "1rem",
                        backgroundColor: "var(--surface-color)", border: "2px solid var(--border-color)",
                        borderRadius: "var(--radius-lg)", boxShadow: "4px 4px 0px var(--border-color)",
                    }}>
                        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                            <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display: "none" }} />
                            <button onClick={() => fileInputRef.current?.click()} style={btnStyle}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
                                <Upload size={16} /> Excel&apos;dan Yuklash
                            </button>
                            <button onClick={handleExport} style={btnStyle}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}>
                                <Download size={16} /> Excel&apos;ga Eksport
                            </button>
                            <button onClick={() => addRow()}
                                style={{ ...btnStyle, border: "1px dashed var(--primary-color)", backgroundColor: "rgba(59,130,246,0.05)", color: "var(--primary-color)" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.1)")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(59,130,246,0.05)")}>
                                <Plus size={16} /> Qator qo&apos;shish
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.85rem', color: "var(--text-secondary)", display: "flex", gap: "1rem" }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success-color)' }}></span> To&apos;g&apos;ri
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--error-color)' }}></span> Xato
                                </span>
                            </div>
                            <button onClick={handleSaveAsTransactions} disabled={isSaving} style={{
                                padding: "0.6rem 1.25rem", borderRadius: "var(--radius-md)", border: "none",
                                backgroundColor: "var(--primary-color)", color: "#fff",
                                cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center",
                                gap: "0.5rem", fontWeight: 600, fontSize: "0.85rem", opacity: isSaving ? 0.7 : 1,
                                boxShadow: "0 2px 8px rgba(59,130,246,0.3)", transition: "all 0.2s",
                            }}
                                onMouseEnter={(e) => !isSaving && (e.currentTarget.style.transform = "translateY(-2px)")}
                                onMouseLeave={(e) => !isSaving && (e.currentTarget.style.transform = "none")}>
                                {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Save size={16} />}
                                {isSaving ? "Saqlanmoqda..." : "Bazaga Saqlash"}
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div ref={containerRef} tabIndex={0} onKeyDown={handleKeyDown} onPaste={handlePaste}
                        style={{
                            border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)",
                            overflow: "hidden", backgroundColor: "var(--surface-color)",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.05)", outline: "none", position: "relative"
                        }}>
                        <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "600px", position: "relative" }}>
                            <table style={{
                                width: "100%", borderCollapse: "collapse", fontFamily: "'Space Mono', monospace",
                                fontSize: "0.85rem", minWidth: "1200px", tableLayout: "fixed"
                            }}>
                                <thead>
                                    <tr>
                                        <th style={{
                                            width: "50px", padding: "0.75rem", backgroundColor: "var(--background-color)",
                                            borderBottom: "2px solid var(--border-color)", borderRight: "1px solid var(--border-color)",
                                            color: "var(--text-secondary)", position: "sticky", top: 0, left: 0, zIndex: 3
                                        }}>#</th>
                                        {DEFAULT_COLS.map((col) => (
                                            <th key={col} style={{
                                                padding: "0.75rem", backgroundColor: "var(--background-color)",
                                                borderBottom: "2px solid var(--border-color)", borderRight: "1px solid var(--border-color)",
                                                color: "var(--text-secondary)", position: "sticky", top: 0, zIndex: 2,
                                                fontWeight: 600, textAlign: "left"
                                            }}>{col}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, rowIndex) => (
                                        <tr key={rowIndex} style={{
                                            backgroundColor: rowIndex === 0 ? "rgba(59,130,246,0.05)" : "transparent",
                                            transition: "background-color 0.1s"
                                        }}>
                                            <td onContextMenu={(e) => { e.preventDefault(); if (rowIndex > 0) setContextMenu({ x: e.clientX, y: e.clientY, row: rowIndex }); }}
                                                style={{
                                                    padding: "0", borderBottom: "1px solid var(--border-color)",
                                                    borderRight: "1px solid var(--border-color)", backgroundColor: "var(--background-color)",
                                                    color: "var(--text-secondary)", textAlign: "center", fontWeight: 600,
                                                    userSelect: "none", position: "sticky", left: 0, zIndex: 1,
                                                    cursor: rowIndex > 0 ? "context-menu" : "default"
                                                }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: "36px" }}>
                                                    {rowIndex === 0 ? "▼" : rowIndex}
                                                </div>
                                            </td>
                                            {DEFAULT_COLS.map((col, colIdx) => {
                                                const cellData = row[col];
                                                const isSelected = selectedCells.start?.r === rowIndex && selectedCells.start?.c === colIdx;
                                                const isEditing = editingCell?.row === rowIndex && editingCell?.col === col;
                                                const hasError = rowIndex > 0 && cellData.error;
                                                return (
                                                    <td key={col}
                                                        onClick={() => { if (rowIndex > 0) { setSelectedCells({ start: { r: rowIndex, c: colIdx }, end: { r: rowIndex, c: colIdx } }); setEditingCell(null); } }}
                                                        onDoubleClick={() => { if (rowIndex > 0) setEditingCell({ row: rowIndex, col }); }}
                                                        style={{
                                                            padding: 0, borderBottom: "1px solid var(--border-color)",
                                                            borderRight: "1px solid var(--border-color)", position: "relative",
                                                            cursor: rowIndex > 0 ? "cell" : "default",
                                                            backgroundColor: isSelected ? "rgba(59,130,246,0.1)" : (hasError ? "rgba(239,68,68,0.05)" : "transparent"),
                                                        }}
                                                        title={hasError ? cellData.error : undefined}>
                                                        {isSelected && <div style={{ position: "absolute", top: -1, left: -1, right: -1, bottom: -1, border: "2px solid var(--primary-color)", zIndex: 1, pointerEvents: "none" }} />}
                                                        {isEditing ? (
                                                            col === "E" ? (
                                                                <select ref={editInputRef as any} defaultValue={cellData.value}
                                                                    onBlur={(e) => { updateCell(rowIndex, col, e.target.value); setEditingCell(null); containerRef.current?.focus(); }}
                                                                    style={{ width: "100%", height: "100%", padding: "0.5rem", border: "none", outline: "none", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.85rem" }}>
                                                                    <option value="">Tanlang...</option>
                                                                    {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : col === "D" ? (
                                                                <select ref={editInputRef as any} defaultValue={cellData.value}
                                                                    onBlur={(e) => { updateCell(rowIndex, col, e.target.value); setEditingCell(null); containerRef.current?.focus(); }}
                                                                    style={{ width: "100%", height: "100%", padding: "0.5rem", border: "none", outline: "none", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.85rem" }}>
                                                                    <option value="">Tanlang...</option>
                                                                    {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                </select>
                                                            ) : (
                                                                <input ref={editInputRef} type="text" defaultValue={cellData.value}
                                                                    onBlur={(e) => { updateCell(rowIndex, col, e.target.value); setEditingCell(null); containerRef.current?.focus(); }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter") { updateCell(rowIndex, col, e.currentTarget.value); setEditingCell(null); if (rowIndex < rows.length - 1) setSelectedCells({ start: { r: rowIndex + 1, c: colIdx }, end: { r: rowIndex + 1, c: colIdx } }); containerRef.current?.focus(); }
                                                                        if (e.key === "Escape") { setEditingCell(null); containerRef.current?.focus(); }
                                                                    }}
                                                                    style={{ width: "100%", height: "100%", padding: "0.5rem", border: "none", outline: "none", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "0.85rem" }} />
                                                            )
                                                        ) : (
                                                            <div style={{
                                                                padding: "0.5rem", minHeight: "36px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                                                                fontWeight: rowIndex === 0 ? 700 : 400,
                                                                color: rowIndex === 0 ? "var(--primary-color)" : (hasError ? "var(--error-color)" : "var(--text-primary)"),
                                                                display: "flex", alignItems: "center", justifyContent: "space-between"
                                                            }}>
                                                                <span>{cellData.value}</span>
                                                                {hasError && <AlertCircle size={14} color="var(--error-color)" />}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "1rem", borderTop: "2px solid var(--border-color)",
                            backgroundColor: "var(--background-color)", fontSize: "0.9rem", flexWrap: "wrap", gap: "1rem"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", color: "var(--text-secondary)" }}>
                                <span>Jami qatorlar: <strong>{rows.length - 1}</strong></span>
                            </div>
                            <div style={{ display: "flex", gap: "2rem" }}>
                                <span style={{ color: "var(--success-color)", fontWeight: 600 }}>Kirim: +{totalIncome.toLocaleString()}</span>
                                <span style={{ color: "var(--error-color)", fontWeight: 600 }}>Chiqim: -{totalExpense.toLocaleString()}</span>
                                <span style={{ color: "var(--primary-color)", fontWeight: 800 }}>Sof: {(totalIncome - totalExpense) > 0 ? "+" : ""}{(totalIncome - totalExpense).toLocaleString()} so&apos;m</span>
                            </div>
                        </div>

                        {/* Context Menu */}
                        {contextMenu && (
                            <div ref={contextMenuRef} style={{
                                position: "fixed", top: contextMenu.y, left: contextMenu.x, zIndex: 100,
                                backgroundColor: "var(--surface-color)", border: "1px solid var(--border-color)",
                                borderRadius: "var(--radius-md)", boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                                padding: "0.5rem", minWidth: "180px", animation: "scaleIn 0.15s ease"
                            }}>
                                <button onClick={() => addRow(contextMenu.row)} style={contextMenuStyle}><Plus size={14} /> Tepaga qator qo&apos;shish</button>
                                <button onClick={() => addRow(contextMenu.row + 1)} style={contextMenuStyle}><Plus size={14} /> Pastga qator qo&apos;shish</button>
                                <hr style={{ margin: "0.25rem 0", borderColor: "var(--border-color)", opacity: 0.5 }} />
                                <button onClick={() => duplicateRow(contextMenu.row)} style={contextMenuStyle}><Download size={14} /> Qatorni nusxalash</button>
                                <button onClick={() => deleteRow(contextMenu.row)} style={{ ...contextMenuStyle, color: "var(--error-color)" }}><Trash2 size={14} /> Qatorni o&apos;chirish</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
