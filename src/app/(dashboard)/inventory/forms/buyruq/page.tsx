"use client";

import React from "react";
import PrintableWrapper from "../components/PrintableWrapper";

export default function BuyruqForm() {
    const handlePrint = () => {
        window.print();
    };

    return (
        <PrintableWrapper title="Inventarizatsiya Buyrug'i (1-ILOVA)" onPrint={handlePrint}>
            <div style={{ textAlign: "right", fontSize: "10pt", marginBottom: "2rem" }}>
                <p>Oʻzbekiston Respublikasi buxgalteriya hisobining milliy standarti (19-sonli BHMS)<br />
                    &quot;Inventarizatsiyani tashkil etish va oʻtkazish&quot;ga<br />
                    <b>1-ILOVA</b></p>
            </div>

            <div style={{ textAlign: "center", marginBottom: "2rem", marginTop: "40px" }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: "5px" }}>
                    <input type="text" style={{ width: "300px", textAlign: "center", fontWeight: "bold" }} placeholder="(tashkilotning nomi)" />
                    <span>bo&apos;yicha</span>
                </div>
                <div style={{ fontSize: "8pt", color: "#555", marginTop: "2px" }}>(tashkilotning nomi)</div>

                <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center", alignItems: "baseline", gap: "10px" }}>
                    <span>20</span>
                    <input type="text" style={{ width: "30px", textAlign: "center" }} maxLength={2} placeholder="yy" />
                    <span>yil &quot;</span>
                    <input type="text" style={{ width: "30px", textAlign: "center" }} maxLength={2} placeholder="dd" />
                    <span>&quot;</span>
                    <input type="text" style={{ width: "150px", textAlign: "center" }} placeholder="oy nomi" />
                    <span>dagi</span>
                </div>

                <div style={{ marginTop: "1.5rem", fontSize: "12pt", fontWeight: "bold" }}>
                    <input type="text" style={{ width: "60px", textAlign: "center" }} />
                    -sonli BUYRUQ (qaror, farmoyish)
                </div>
            </div>

            <div style={{ lineHeight: "2" }}>
                <div style={{ display: "flex", width: "100%", alignItems: "baseline" }}>
                    <input type="text" style={{ flex: 1 }} />
                    <span>-da inventarizatsiya oʻtkazish uchun quyidagi tarkibdagi</span>
                </div>
                <p>inventarizatsiya komissiyasi (doimiy harakatdagi, ishchi) tayinlanadi:</p>

                <div style={{ marginTop: "1rem" }}>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline" }}>
                        <span style={{ width: "30px" }}>1. Rais</span>
                        <input type="text" style={{ flex: 1 }} placeholder="(lavozimi, F.I.O.)" />
                    </div>
                </div>

                <div style={{ marginTop: "1rem" }}>
                    <span style={{ width: "150px" }}>2. Komissiya aʼzolari</span>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "5px" }}>
                        <input type="text" style={{ flex: 1 }} placeholder="(lavozimi, F.I.O.)" />
                    </div>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "10px" }}>
                        <input type="text" style={{ flex: 1 }} placeholder="(lavozimi, F.I.O.)" />
                    </div>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "10px" }}>
                        <input type="text" style={{ flex: 1 }} placeholder="(lavozimi, F.I.O.)" />
                    </div>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "10px" }}>
                        <input type="text" style={{ flex: 1 }} placeholder="(lavozimi, F.I.O.)" />
                    </div>
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>Inventarizatsiyadan oʻtkazish kerak</span>
                    <input type="text" style={{ flex: 1 }} placeholder="(mol-mulk va moliyaviy majburiyatlar)" />
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>Inventarizatsiyadan oʻtkazishga kirishilsin</span>
                    <input type="text" style={{ width: "200px" }} placeholder="(sana)" />
                </div>

                <div style={{ marginTop: "0.5rem", display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>va tugatilsin</span>
                    <input type="text" style={{ width: "200px" }} placeholder="(sana)" />
                </div>

                <div style={{ marginTop: "1.5rem" }}>
                    <span>Inventarizatsiyadan oʻtkazishga sabab:</span>
                    <div style={{ display: "flex", width: "100%", alignItems: "baseline", marginTop: "5px" }}>
                        <input type="text" style={{ flex: 1 }} placeholder="(nazorat tekshiruvi, moddiy javobgar shaxsning o'zgarishi, qayta baholash va h.k.)" />
                    </div>
                </div>

                <div style={{ marginTop: "1.5rem", display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>Inventarizatsiyadan oʻtkazish boʻyicha maʼlumotlar</span>
                    <input type="text" style={{ width: "150px" }} placeholder="(sana)" />
                    <span>-dan </span>
                </div>
                <div style={{ marginTop: "0.5rem", display: "flex", width: "100%", alignItems: "baseline", gap: "10px" }}>
                    <span>kechiktirmay</span>
                    <input type="text" style={{ flex: 1 }} />
                    <span>buxgalteriya xizmatiga topshirilsin.</span>
                </div>

                <div style={{ marginTop: "4rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span>Rahbar</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "200px" }}>
                        <input type="text" style={{ width: "100%" }} />
                        <span style={{ fontSize: "8pt", color: "#666" }}>(imzo)</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "200px" }}>
                        <input type="text" style={{ width: "100%" }} />
                        <span style={{ fontSize: "8pt", color: "#666" }}>(sana)</span>
                    </div>
                </div>
            </div>
        </PrintableWrapper>
    );
}
