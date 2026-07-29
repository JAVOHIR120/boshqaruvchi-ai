import Link from "next/link";
import { FileText, ArrowLeft, Printer } from "lucide-react";

export default function InventoryForms() {
    const forms = [
        {
            id: "buyruq",
            title: "Inventarizatsiya Buyrug'i",
            ilova: "1-ILOVA",
            desc: "Inventarizatsiya o'tkazish uchun komissiya tayinlash buyrug'i (19-sonli BHMS)",
        },
        {
            id: "qaydnoma",
            title: "Natijalar Qaydnomasi",
            ilova: "3-ILOVA",
            desc: "Inventarizatsiyada aniqlangan natijalar qaydnomasi shakli. Ortiqcha yoki kamomadni qayd etish.",
        },
        {
            id: "inv-1",
            title: "INV-1 Shakli",
            ilova: "4-ILOVA",
            desc: "Asosiy vositalarni inventarizatsiyadan o'tkazish ro'yxati va dalolatnomasi.",
        },
        {
            id: "inv-3",
            title: "INV-3 Shakli",
            ilova: "6-ILOVA",
            desc: "Tovar-moddiy zaxiralarni inventarizatsiyadan o'tkazish ro'yxati (ombor xisoboti).",
        },
        {
            id: "inv-16",
            title: "INV-16 Shakli",
            ilova: "13-ILOVA",
            desc: "Qimmatli qog'ozlar va qat'iy hisobot blankalarini inventarizatsiyadan o'tkazish dalolatnomasi.",
        }
    ];

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "3rem" }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                .back-btn {
                    padding: 0.75rem;
                    border-radius: 50%;
                    background-color: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .back-btn:hover {
                    background-color: rgba(255,255,255,0.1);
                }
                .forms-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 1.5rem;
                }
                .form-card {
                    height: 100%;
                    background: linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 1.5rem;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    flex-direction: column;
                    text-decoration: none;
                }
                .form-card:hover {
                    transform: translateY(-5px);
                    border-color: var(--primary-color);
                    background: linear-gradient(145deg, rgba(37, 99, 235, 0.05) 0%, rgba(255,255,255,0.02) 100%);
                    box-shadow: 0 20px 40px -10px rgba(0,0,0,0.8), 0 0 15px rgba(59, 130, 246, 0.2);
                }
                .form-card::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    width: 150px;
                    height: 150px;
                    background: radial-gradient(circle, var(--primary-color) 0%, transparent 70%);
                    opacity: 0.05;
                    border-radius: 0 0 0 100%;
                    transition: transform 0.5s ease;
                }
                .form-card:hover::after {
                    transform: scale(1.2);
                    opacity: 0.1;
                }
                .form-icon-box {
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    color: var(--primary-color);
                    display: inline-flex;
                    transition: background 0.3s, color 0.3s;
                }
                .form-card:hover .form-icon-box {
                    background: var(--primary-color);
                    color: white;
                }
                .form-badge {
                    padding: 0.25rem 0.75rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 100px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: var(--text-secondary);
                    border: 1px solid rgba(255,255,255,0.1);
                    transition: color 0.3s, border-color 0.3s;
                }
                .form-card:hover .form-badge {
                    color: white;
                    border-color: rgba(255,255,255,0.3);
                }
                .form-title {
                    font-size: 1.125rem;
                    font-weight: 700;
                    color: white;
                    margin: 1.25rem 0 0.5rem 0;
                    transition: color 0.3s;
                }
                .form-card:hover .form-title {
                    color: var(--primary-color);
                }
                .form-desc {
                    font-size: 0.875rem;
                    color: var(--text-secondary);
                    line-height: 1.6;
                    margin-bottom: 1.5rem;
                    flex: 1;
                }
                .form-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: var(--primary-color);
                    font-weight: 600;
                    margin-top: auto;
                    transition: transform 0.3s;
                }
                .form-card:hover .form-footer {
                    transform: translateX(5px);
                }
            `}} />

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "3rem" }}>
                <Link href="/inventory" className="back-btn">
                    <ArrowLeft size={24} color="var(--text-primary)" />
                </Link>
                <div>
                    <h2 style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>Inventarizatsiyaning Rasmiy Shakllari</h2>
                    <p style={{ color: "var(--text-secondary)", margin: "0.5rem 0 0 0", fontSize: "0.95rem" }}>Oʻzbekiston Respublikasi buxgalteriya hisobining milliy standarti (19-sonli BHMS)</p>
                </div>
            </div>

            <div className="forms-grid">
                {forms.map(form => (
                    <Link key={form.id} href={`/inventory/forms/${form.id}`} className="form-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1, width: "100%" }}>
                            <div className="form-icon-box">
                                <FileText size={24} />
                            </div>
                            <span className="form-badge">
                                {form.ilova}
                            </span>
                        </div>

                        <h3 className="form-title" style={{ position: "relative", zIndex: 1 }}>{form.title}</h3>
                        <p className="form-desc" style={{ position: "relative", zIndex: 1 }}>{form.desc}</p>

                        <div className="form-footer" style={{ position: "relative", zIndex: 1 }}>
                            <Printer size={16} />
                            Hujjatni to'ldirish va chop etish
                        </div>
                    </Link>
                ))}
            </div>
        </div >
    );
}
