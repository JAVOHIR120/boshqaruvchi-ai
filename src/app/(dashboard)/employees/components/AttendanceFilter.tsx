"use client";

import { useState } from "react";
import { Download, Calendar, Filter } from "lucide-react";
import * as XLSX from "xlsx";

type EmployeeData = {
    id: string;
    name: string;
    position: string;
    attendances: { date: Date; status: string }[];
};

export default function AttendanceFilter({ employees }: { employees: EmployeeData[] }) {
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);

    // Month support can be built in to selectedDate by mapping UI differently, 
    // for now we'll support daily viewing/exporting. 

    const handleExport = () => {
        const targetDateStr = selectedDate;

        const dataForExport = employees.map(emp => {
            // Find logic
            const record = emp.attendances.find(a => new Date(a.date).toISOString().split("T")[0] === targetDateStr);
            let statusText = "Kiritilmagan";
            if (record) {
                if (record.status === "PRESENT") statusText = "Keldi";
                else if (record.status === "ABSENT") statusText = "Kelmadi";
                else if (record.status === "LATE") statusText = "Kech qoldi";
            }

            return {
                "Xodim Ism-sharifi": emp.name,
                "Lavozim": emp.position,
                "Sana": targetDateStr,
                "Davomat": statusText
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataForExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Davomat");

        XLSX.writeFile(wb, `Davomat_${targetDateStr}.xlsx`);
    };

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", background: "var(--surface-color)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <Calendar size={18} style={{ color: "var(--text-secondary)", marginRight: "0.5rem" }} />
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    style={{ background: "transparent", border: "none", color: "var(--text-primary)", outline: "none", colorScheme: "dark" }}
                    title="Sanani tanlang"
                />
            </div>

            <button
                onClick={handleExport}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "var(--primary-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "500", cursor: "pointer" }}
            >
                <Download size={18} /> Excel (Davomat)
            </button>
        </div>
    );
}
