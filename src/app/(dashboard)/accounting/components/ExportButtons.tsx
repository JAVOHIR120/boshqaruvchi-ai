"use client";

import { Download, FileText } from "lucide-react";
import { downloadPDF, downloadExcel } from "@/lib/exportUtils";

interface ExportButtonsProps {
    transactions: any[];
}

export default function ExportButtons({ transactions }: ExportButtonsProps) {

    const generateData = () => {
        const headers = ["Sana", "Tavsif", "Kategoriya", "Tur", "Summa (so'm)"];
        const rows = transactions.map(t => [
            new Date(t.date).toLocaleDateString("uz-UZ"),
            t.description,
            t.category,
            t.type === "INCOME" ? "Kirim" : "Chiqim",
            t.type === "INCOME" ? `+${t.amount}` : `-${t.amount}`
        ]);

        return {
            title: "Korxona Buxgalteriya Hisoboti",
            filename: `Buxgalteriya_Hisoboti_${new Date().getTime()}`,
            headers,
            rows
        };
    };

    return (
        <div style={{ display: "flex", gap: "1rem" }}>
            <button
                onClick={() => downloadExcel(generateData())}
                className="btn-primary"
                style={{ backgroundColor: "transparent", border: "1px solid var(--border-color)", color: "var(--text-primary)", display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
                <Download size={20} /> Excel Yuklash
            </button>

            <button
                onClick={() => downloadPDF(generateData())}
                className="btn-primary"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
                <FileText size={20} /> PDF Yuklash
            </button>
        </div>
    );
}
