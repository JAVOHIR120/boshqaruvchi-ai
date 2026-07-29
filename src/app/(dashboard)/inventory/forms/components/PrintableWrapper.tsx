import React from "react";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";

export default function PrintableWrapper({ children, title, onPrint, orientation = "portrait" }: { children: React.ReactNode, title: string, onPrint: () => void, orientation?: "portrait" | "landscape" }) {
    return (
        <div style={{ paddingBottom: "3rem" }}>
            {/* NO PRINT TOP BAR */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem", background: "var(--background-color)", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <Link href="/inventory/forms" style={{ padding: "0.5rem", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ArrowLeft size={20} color="var(--text-secondary)" />
                    </Link>
                    <div>
                        <h2 style={{ fontSize: "1.125rem", fontWeight: "bold", color: "var(--text-primary)", margin: 0 }}>{title}</h2>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "0.25rem 0 0 0" }}>To&apos;ldirganingizdan so&apos;ng chop qiling</p>
                    </div>
                </div>
                <button
                    onClick={onPrint}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.625rem 1.25rem", background: "var(--primary-color)", color: "white", borderRadius: "8px", fontWeight: 600, fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 0 20px rgba(37, 99, 235, 0.35)", cursor: "pointer", whiteSpace: "nowrap" }}
                >
                    <Printer size={18} />
                    Hujjatni Chop Etish (PDF)
                </button>
            </div>

            {/* A4 PAPER AREA */}
            <div className="a4-wrapper">
                <div className="a4-paper">
                    {children}
                </div>
            </div>

            {/* CSS directly handling print logic & A4 representation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .a4-wrapper {
                    display: flex;
                    justify-content: center;
                    overflow-x: auto;
                    padding: 2rem;
                    background: radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, transparent 70%);
                }
                .a4-paper {
                    width: ${orientation === "landscape" ? "297mm" : "210mm"};
                    min-height: ${orientation === "landscape" ? "210mm" : "297mm"};
                    flex-shrink: 0;
                    margin: 0 auto;
                    background: #fff;
                    background-image: linear-gradient(to right, rgba(255,255,255,0) 90%, rgba(0,0,0,0.015) 100%), 
                                      linear-gradient(to bottom, rgba(255,255,255,0) 90%, rgba(0,0,0,0.015) 100%);
                    color: black;
                    padding: ${orientation === "landscape" ? "15mm" : "20mm"};
                    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.4);
                    font-family: 'Times New Roman', Times, serif;
                    font-size: ${orientation === "landscape" ? "10pt" : "12pt"};
                    line-height: 1.5;
                    position: relative;
                }
                .a4-paper::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    box-shadow: inset 0 0 10px rgba(0,0,0,0.03);
                    pointer-events: none;
                }
                .a4-paper input, .a4-paper textarea {
                    background: rgba(0, 0, 0, 0.02);
                    border: none;
                    border-bottom: 1px dotted rgba(0,0,0,0.4);
                    color: black;
                    font-family: inherit;
                    font-size: inherit;
                    padding: 2px 4px;
                    outline: none;
                    transition: all 0.2s;
                }
                .a4-paper input:hover, .a4-paper input:focus {
                    background: rgba(37, 99, 235, 0.08);
                    border-bottom: 1px solid rgba(0,0,0,0.8);
                }
                .a4-paper input[type="date"] {
                    font-family: sans-serif;
                }
                .a4-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .a4-table th, .a4-table td {
                    border: 1px solid rgba(0,0,0,0.8);
                    padding: 6px;
                    text-align: center;
                    font-size: ${orientation === "landscape" ? "9pt" : "10pt"};
                    vertical-align: middle;
                    word-break: break-word;
                }
                
                @media print {
                    /* O'rnashgan SaaS elementlarni yashirish */
                    body * {
                        visibility: hidden;
                    }
                    .a4-paper, .a4-paper * {
                        visibility: visible;
                    }
                    .a4-paper {
                        position: absolute;
                        left: 0;
                        top: 0;
                        margin: 0;
                        padding: 10mm;
                        box-shadow: none;
                        width: 100%;
                    }
                    .no-print {
                        display: none !important;
                    }
                    /* Remove exact borders specifically on print so it looks like raw typed lines */
                    .a4-paper input { border-bottom: none; }
                }
                `}} />
        </div>
    );
}
