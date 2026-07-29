"use client";

import React from "react";
import PrintableWrapper from "../components/PrintableWrapper";

export default function Inv16Form() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <PrintableWrapper title="INV-16 Shakl (13-ILOVA)" onPrint={handlePrint} orientation="landscape">
            <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "1rem" }}>
                <p>Oʻzbekiston Respublikasi buxgalteriya hisobining milliy standarti (19-sonli BHMS)<br />
                    &quot;Inventarizatsiyani tashkil etish va oʻtkazish&quot;ga<br />
                    <b>13-ILOVA</b></p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "baseline" }}>
                        <span>Tashkilot</span>
                        <input type="text" style={{ flex: 1, marginLeft: "10px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", marginTop: "10px" }}>
                        <span>Tarkibiy boʻlinma</span>
                        <input type="text" style={{ flex: 1, marginLeft: "10px" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", marginTop: "10px" }}>
                        <span>Inventarizatsiyani oʻtkazish uchun asos:</span>
                        <input type="text" placeholder="(buyruq, qaror, farmoyish)" style={{ flex: 1, marginLeft: "10px" }} />
                    </div>
                </div>
                <div style={{ width: "250px", marginLeft: "20px" }}>
                    <table className="a4-table" style={{ margin: 0, fontSize: "9pt" }}>
                        <tbody>
                            <tr>
                                <td style={{ textAlign: "right" }}>Kodlar</td>
                                <td><input type="text" style={{ width: "100px" }} /></td>
                            </tr>
                            <tr>
                                <td style={{ textAlign: "right" }}>INV-16-son shakl BHUT boʻyicha</td>
                                <td><input type="text" style={{ width: "100px" }} /></td>
                            </tr>
                            <tr>
                                <td style={{ textAlign: "right" }}>Sana (yil, kun, oy)</td>
                                <td><input type="date" style={{ width: "100px" }} /></td>
                            </tr>
                            <tr>
                                <td style={{ textAlign: "right" }}>KTUT boʻyicha</td>
                                <td><input type="text" style={{ width: "100px" }} /></td>
                            </tr>
                            <tr>
                                <td style={{ textAlign: "right" }}>IFUT boʻyicha</td>
                                <td><input type="text" style={{ width: "100px" }} /></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
                <h3 style={{ fontSize: "14pt", fontWeight: "bold" }}>Qimmatli qog&apos;ozlar va qat&apos;iy hisobot blankalarini inventarizatsiyadan oʻtkazish<br />DALOLATNOMASI</h3>
            </div>

            <div style={{ marginBottom: "2rem" }}>
                <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: "0.5rem" }}>TILXAT</p>
                <p style={{ textIndent: "40px", textAlign: "justify" }}>
                    Inventarizatsiya oʻtkazish boshlanishiga qatʼiy hisobot blanklariga tegishli hamma chiqim va kirim hujjatlari buxgalteriya xizmatiga topshirildi va mening (bizning) javobgarligimga (javobgarligimizga) kelib tushgan qimmatli qogʻozlar va qatʼiy hisobot blanklari kirim qilingan, chiqib ketganlari chiqim qilingan.
                </p>
                <p style={{ marginTop: "1rem" }}>Moddiy javobgar shaxs (shaxslar):</p>
                <div style={{ display: "flex", width: "100%", alignItems: "flex-end", marginTop: "1rem", gap: "20px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <input type="text" style={{ width: "100%" }} />
                        <span style={{ fontSize: "8pt", textAlign: "center" }}>(lavozimi)</span>
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <input type="text" style={{ width: "100%" }} />
                        <span style={{ fontSize: "8pt", textAlign: "center" }}>(imzosi)</span>
                    </div>
                    <div style={{ flex: 2, display: "flex", flexDirection: "column" }}>
                        <input type="text" style={{ width: "100%" }} />
                        <span style={{ fontSize: "8pt", textAlign: "center" }}>(F.I.O.)</span>
                    </div>
                </div>
            </div>

            <table className="a4-table" style={{ width: "100%" }}>
                <thead>
                    <tr>
                        <th rowSpan={2}>T/r</th>
                        <th colSpan={2}>Qimmatli qogʻozlar, qatʼiy hisobot blanklari</th>
                        <th colSpan={2}>Oʻlchov birligi</th>
                        <th colSpan={5}>Haqiqatda mavjudligi</th>
                    </tr>
                    <tr>
                        <th>nomi</th>
                        <th>Kodi</th>
                        <th>nomi</th>
                        <th>kodi</th>
                        <th>raqami</th>
                        <th>seriyasi</th>
                        <th>nominal, soʻm</th>
                        <th>soni</th>
                        <th>summa, soʻm</th>
                    </tr>
                    <tr>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <td key={num} style={{ fontWeight: "bold", backgroundColor: "#eee" }}>{num}</td>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                        <tr key={row}>
                            <td>{row}</td>
                            <td><input type="text" style={{ width: "100%", textAlign: "left" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="text" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="number" style={{ width: "100%", textAlign: "right" }} /></td>
                            <td><input type="number" style={{ width: "100%", textAlign: "center" }} /></td>
                            <td><input type="number" style={{ width: "100%", textAlign: "right" }} /></td>
                        </tr>
                    ))}
                    <tr>
                        <td colSpan={8} style={{ textAlign: "right", fontWeight: "bold" }}>Jami:</td>
                        <td><input type="text" style={{ width: "100%", textAlign: "center", fontWeight: "bold" }} /></td>
                        <td><input type="text" style={{ width: "100%", textAlign: "right", fontWeight: "bold" }} /></td>
                    </tr>
                </tbody>
            </table>

            <div style={{ marginTop: "2rem", lineHeight: "2" }}>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>Roʻyxat boʻyicha jami: tartib raqamlar soni</span>
                    <input type="text" style={{ flex: 1 }} placeholder="(so'z bilan)" />
                </div>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>Haqiqatdagi birliklarning umumiy soni</span>
                    <input type="text" style={{ flex: 1 }} placeholder="(so'z bilan)" />
                </div>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>summaga, soʻm., haqiqatda</span>
                    <input type="text" style={{ flex: 1 }} placeholder="(so'z bilan)" />
                </div>
            </div>

            <div style={{ marginTop: "3rem" }}>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginBottom: "1rem" }}>
                    <span style={{ width: "150px" }}>Komissiya raisi:</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>

                <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginBottom: "1rem" }}>
                    <span style={{ width: "150px" }}>Komissiya aʼzolari:</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>
            </div>
            <div style={{ marginTop: "3rem" }}>
                <p style={{ textIndent: "40px", textAlign: "justify" }}>
                    Ushbu inventarizatsiya roʻyxatida ko&apos;rsatilgan barcha qimmatliklar mening (bizning) ishtirokimda (ishtirokimizda) komissiya tomonidan haqiqatda tekshirib chiqildi va roʻyxatga kiritildi. Bu borada inventarizatsiya komissiyasiga daʼvoim (daʼvoimiz) yoʻq. Roʻyxatda sanab oʻtilgan qimmatli qogʻozlar va qatʼiy hisobot blankalari mening (bizning) javobgarligimda (javobgarligimizda) saqlanmoqda.
                </p>

                <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "1rem" }}>
                    <span style={{ width: "150px" }}>Moddiy javobgar shaxs:</span>
                    <input type="text" style={{ width: "200px", textAlign: "center" }} placeholder="(lavozimi)" />
                    <input type="text" style={{ width: "150px", marginLeft: "20px", textAlign: "center" }} placeholder="(imzosi)" />
                    <input type="text" style={{ flex: 1, marginLeft: "20px", textAlign: "center" }} placeholder="(F.I.O.)" />
                </div>
            </div>
        </PrintableWrapper>
    );
}
