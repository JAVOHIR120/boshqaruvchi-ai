"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { MapPin, Save, RefreshCcw, Navigation, Clock, CheckCircle, AlertCircle, Users } from "lucide-react";
import toast from "react-hot-toast";
import { getDailyAttendanceReport } from "@/actions/attendance";

const MapComponent = dynamic(() => import("./MapComponent"), { ssr: false });

export default function OfficeGeolocationPanel({ initialCompany }: { initialCompany: any }) {
    const [officeLat, setOfficeLat] = useState<string>(initialCompany?.officeLat?.toString() || "");
    const [officeLng, setOfficeLng] = useState<string>(initialCompany?.officeLng?.toString() || "");
    const [officeRadius, setOfficeRadius] = useState<string>(initialCompany?.officeRadius?.toString() || "50");
    const [workStartTime, setWorkStartTime] = useState<string>(initialCompany?.workStartTime || "09:00");
    
    const [isSaving, setIsSaving] = useState(false);
    const [report, setReport] = useState<any>(null);
    const [isLoadingReport, setIsLoadingReport] = useState(true);

    const latNum = parseFloat(officeLat) || 41.311081;
    const lngNum = parseFloat(officeLng) || 69.240562;
    const radiusNum = parseInt(officeRadius) || 50;

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        setIsLoadingReport(true);
        try {
            const res = await getDailyAttendanceReport();
            if (res.success) {
                setReport(res.report);
            }
        } catch (error) {
            console.error("Failed to load report", error);
        }
        setIsLoadingReport(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { updateOfficeLocation } = await import("@/actions/attendance");
            const res = await updateOfficeLocation(latNum, lngNum, radiusNum, workStartTime);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Ofis GPS koordinatalari muvaffaqiyatli saqlandi");
                loadReport(); // O'zgarishlardan keyin hisobotni yangilash
            }
        } catch(e) { 
            toast.error("Xatolik yuz berdi"); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleGetLocation = () => {
        if (navigator.geolocation) {
            toast.loading("Joylashuvingiz aniqlanmoqda...", { id: 'gps-loading' });
            navigator.geolocation.getCurrentPosition((pos) => {
                setOfficeLat(pos.coords.latitude.toFixed(6));
                setOfficeLng(pos.coords.longitude.toFixed(6));
                toast.success("Joriy joylashuv aniqlandi, endi saqlastni bosing!", { id: 'gps-loading' });
            }, (err) => {
                toast.error("GPSni yoqish so'roviga ruxsat bermadingiz", { id: 'gps-loading' });
            }, { enableHighAccuracy: true });
        } else {
            toast.error("Brauzeringiz GPS-ni qo'llab-quvvatlamaydi");
        }
    };

    // Calculate report percentages gracefully
    const total = report?.total || 0;
    const onTimePerc = total > 0 ? Math.round((report.onTime / total) * 100) : 0;
    const latePerc = total > 0 ? Math.round((report.late / total) * 100) : 0;
    const notArrivedPerc = total > 0 ? Math.round((report.notArrived / total) * 100) : 0;

    return (
        <div className="mb-8 p-1 rounded-2xl" style={{ 
            background: "var(--surface-color)",
            border: "1px solid var(--border-color)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)"
        }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0", minHeight: "500px" }} className="responsive-map-grid">
                
                {/* Left Side: Controls & Report */}
                <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                            <div style={{ padding: "0.5rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "10px" }}>
                                <Navigation size={24} color="var(--primary-color)" />
                            </div>
                            <h3 style={{ fontSize: "1.5rem", fontWeight: "700" }}>Ofis Geolokatsiyasi</h3>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                            Xodimlar faqat belgilangan ofis radiusida o'z davomatlarini (Kelish/Ketish) qayd etishlari mumkin. 
                            Belgilangan vaqtdan o'tib kelganlarga nisbatan avtomatik jazo choralari (Kech statusi) qo'llaniladi.
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: "600" }}>Kenglik (Latitude)</label>
                            <input type="number" step="any" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} className="input-premium" style={{ border: "1px solid var(--border-color)", background: "var(--background-color)" }} placeholder="41.311081" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: "600" }}>Uzunlik (Longitude)</label>
                            <input type="number" step="any" value={officeLng} onChange={(e) => setOfficeLng(e.target.value)} className="input-premium" style={{ border: "1px solid var(--border-color)", background: "var(--background-color)" }} placeholder="69.240562" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontWeight: "600" }}>Radius (metr)</label>
                            <input type="number" value={officeRadius} onChange={(e) => setOfficeRadius(e.target.value)} className="input-premium" style={{ border: "1px solid var(--border-color)", background: "var(--background-color)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--primary-color)", marginBottom: "0.4rem", fontWeight: "600" }}>Dedlayn (Kelish vaqti)</label>
                            <div style={{ position: "relative" }}>
                                <Clock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--primary-color)" }} />
                                <input type="time" value={workStartTime} onChange={(e) => setWorkStartTime(e.target.value)} className="input-premium" style={{ paddingLeft: "2.5rem", border: "1px solid rgba(59, 130, 246, 0.3)", background: "rgba(59, 130, 246, 0.05)", fontWeight: "bold" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                        <button onClick={handleSave} disabled={isSaving} className="btn-primary" style={{ flex: 1, display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center", padding: "0.8rem" }}>
                            {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} />} Saqlash
                        </button>
                        <button onClick={handleGetLocation} className="btn-secondary">
                            <MapPin size={18} /> Joylashuvimni olish
                        </button>
                    </div>

                    {/* Automatic Report Section */}
                    <div style={{ marginTop: "auto", background: "var(--surface-color)", borderRadius: "14px", padding: "1.25rem", border: "1px solid var(--border-color)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Users size={16} color="var(--text-secondary)" />
                                <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>Bugungi Avtomatik Hisobot</h4>
                            </div>
                            <span style={{ fontSize: "0.75rem", background: "rgba(59, 130, 246, 0.15)", color: "var(--primary-color)", padding: "4px 8px", borderRadius: "6px", fontWeight: "600" }}>
                                Dedlayn: {workStartTime}
                            </span>
                        </div>
                        
                        {isLoadingReport ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
                                <RefreshCcw size={20} className="animate-spin" color="var(--text-secondary)" />
                            </div>
                        ) : report ? (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                                <div style={{ background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)", borderRadius: "10px", padding: "0.75rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}><CheckCircle size={18} color="var(--success-color)" /></div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--success-color)" }}>{report.onTime}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>Vaqtida keldi</div>
                                    <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.1)", marginTop: "8px", borderRadius: "2px" }}>
                                        <div style={{ width: `${onTimePerc}%`, height: "100%", background: "var(--success-color)", borderRadius: "2px" }} />
                                    </div>
                                </div>
                                
                                <div style={{ background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.1)", borderRadius: "10px", padding: "0.75rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}><AlertCircle size={18} color="var(--warning-color)" /></div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--warning-color)" }}>{report.late}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>Kech qoldi</div>
                                    <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.1)", marginTop: "8px", borderRadius: "2px" }}>
                                        <div style={{ width: `${latePerc}%`, height: "100%", background: "var(--warning-color)", borderRadius: "2px" }} />
                                    </div>
                                </div>

                                <div style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "10px", padding: "0.75rem", textAlign: "center" }}>
                                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.25rem" }}><Clock size={18} color="var(--error-color)" /></div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--error-color)" }}>{report.notArrived}</div>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>Kelmaganlar</div>
                                    <div style={{ width: "100%", height: "2px", background: "rgba(255,255,255,0.1)", marginTop: "8px", borderRadius: "2px" }}>
                                        <div style={{ width: `${notArrivedPerc}%`, height: "100%", background: "var(--error-color)", borderRadius: "2px" }} />
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>

                </div>

                {/* Right Side: Ultra Realistic Map */}
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column" }}>
                    <div style={{ 
                        flex: 1, 
                        borderRadius: "16px", 
                        overflow: "hidden", 
                        position: "relative",
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
                    }}>
                        <div style={{ position: "absolute", top: "1rem", right: "1rem", zIndex: 10, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", padding: "0.5rem 1rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--success-color)", boxShadow: "0 0 10px var(--success-color)", animation: "pulse 2s infinite" }}></div>
                            <span style={{ fontSize: "0.75rem", fontWeight: "600", letterSpacing: "0.05em" }}>LIVE RADAR</span>
                        </div>
                        <MapComponent lat={latNum} lng={lngNum} radius={radiusNum} />
                    </div>
                </div>

            </div>

            <style>{`
                @media (max-width: 900px) {
                    .responsive-map-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
