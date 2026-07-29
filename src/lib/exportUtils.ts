import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface ExportData {
    headers: string[];
    rows: (string | number)[][];
    title: string;
    filename: string;
}

export const downloadPDF = (data: ExportData) => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text(data.title, 14, 22);

    // Date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Sanasi: ${new Date().toLocaleDateString("uz-UZ")}`, 14, 30);

    // Table
    (doc as any).autoTable({
        startY: 35,
        head: [data.headers],
        body: data.rows,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246] }, // Tailwind blue-500
    });

    doc.save(`${data.filename}.pdf`);
};

export const downloadExcel = (data: ExportData) => {
    // Convert headers and rows into worksheet data
    const wsData = [data.headers, ...data.rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Create workbook and append sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hisobot");

    // Download
    XLSX.writeFile(wb, `${data.filename}.xlsx`);
};
