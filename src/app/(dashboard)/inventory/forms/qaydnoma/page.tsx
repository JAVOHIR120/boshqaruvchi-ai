"use client";

import React from "react";
import PrintableWrapper from "../components/PrintableWrapper";

export default function QaydnomaForm() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <PrintableWrapper title="Natijalar Qaydnomasi (3-ILOVA)" onPrint={handlePrint} orientation="landscape">
            <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "2rem" }}>
                <p>Oʻzbekiston Respublikasi buxgalteriya hisobining milliy standarti (19-sonli BHMS)<br />
                    &quot;Inventarizatsiyani tashkil etish va oʻtkazish&quot;ga<br />
                    <b>3-ILOVA</b></p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "14pt", fontWeight: "bold" }}>Inventarizatsiyada aniqlangan natijalar<br />QAYDNOMASI</h3>
            </div>

            <table className="a4-table" style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th rowSpan={3}>Hisobvaraq nomi</th>
                        <th rowSpan={3}>Hisobvaraq raqami</th>
                        <th colSpan={3}>Inventarizatsiyada aniqlangan natija</th>
                        <th colSpan={4}>Mulkning buzilishidan kamomad va yo&apos;qolishlarning umumiy summasidan</th>
                    </tr>
                    <tr>
                        <th>kamomad</th>
                        <th>ortiqcha</th>
                        <th rowSpan={2}>Mulkning buzilishi aniqlandi<br />summa</th>
                        <th rowSpan={2}>qayta navlash hisobiga kiritildi</th>
                        <th rowSpan={2}>kamayish me&apos;yori chegarasida hisobdan chiqarildi</th>
                        <th rowSpan={2}>aybdor shaxslar zimmasiga yuklandi</th>
                        <th rowSpan={2}>Kamayish me&apos;yoridan ortig&apos;i ishlab chiqarish va davr xarajatlariga hisobdan chiqarildi</th>
                    </tr>
                    <tr>
                        <th>summa</th>
                        <th>summa</th>
                    </tr>
                    <tr>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <td key={num} style={{ fontWeight: "bold", backgroundColor: "#f9f9f9" }}>{num}</td>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {/* Render empty rows for immediate filling */}
                    {[1, 2, 3, 4, 5].map((row) => (
                        <tr key={row}>
                            <td><input type="text" style={{ width: "100%", textAlign: "left" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "right" }} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ marginTop: "4rem", lineHeight: "2.5" }}>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginBottom: "1rem" }}>
                    <span style={{ width: "150px" }}>Rahbar</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>

                <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginBottom: "1rem" }}>
                    <span style={{ width: "150px" }}>Bosh buxgalter</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>

                <div style={{ display: "flex", width: "100%", alignItems: "baseline" }}>
                    <span style={{ width: "150px" }}>Inventarizatsiya komissiyasi raisi:</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>
            </div>
        </PrintableWrapper>
    );
}
