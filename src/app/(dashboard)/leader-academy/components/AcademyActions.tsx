"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { Plus } from "lucide-react";
import { addAcademyVideo, addAcademyBook } from "@/actions";

export default function AcademyActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [type, setType] = useState("VIDEO"); // "VIDEO" or "BOOK"

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        if (type === "VIDEO") {
            await addAcademyVideo(formData);
        } else {
            await addAcademyBook(formData);
        }
        setLoading(false);
        setIsOpen(false);
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="btn-primary"
                style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
                <Plus size={20} /> Yangi Resurs Qo'shish
            </button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Ta'lim Resursi Qo'shish">

                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                    <button
                        type="button"
                        onClick={() => setType("VIDEO")}
                        style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", backgroundColor: type === "VIDEO" ? "var(--primary-color)" : "transparent", color: type === "VIDEO" ? "#fff" : "var(--text-primary)", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}
                    >
                        Video Darsлик
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("BOOK")}
                        style={{ flex: 1, padding: "0.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", backgroundColor: type === "BOOK" ? "var(--primary-color)" : "transparent", color: type === "BOOK" ? "#fff" : "var(--text-primary)", fontWeight: "500", cursor: "pointer", transition: "all 0.2s" }}
                    >
                        Elektron Kitob
                    </button>
                </div>

                <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                    {type === "VIDEO" ? (
                        <>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Video Nomi</label>
                                <input name="title" required type="text" placeholder="Moliyaviy Savodxonlik" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Davomiyligi</label>
                                    <input name="duration" required type="text" placeholder="15:30" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Kategoriya</label>
                                    <input name="category" required type="text" placeholder="Moliya" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Spiker (Ustoz)</label>
                                    <input name="instructor" required type="text" placeholder="Ahmad Rahimov" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Video Link (URL)</label>
                                    <input name="videoUrl" type="text" placeholder="https://youtube.com/..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Rasm / Poster Linki (Thumbnail URL)</label>
                                <input name="thumbnail" type="text" placeholder="https://img.youtube.com/..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}>Qisqacha Izoh (Description)</label>
                                <textarea name="description" rows={2} placeholder="Sotuv va Marketing asoslari haqida umumiy tahlil..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "none" }}></textarea>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Kitob Nomi</label>
                                <input name="title" required type="text" placeholder="Good to Great" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Muallif</label>
                                    <input name="author" required type="text" placeholder="Jim Collins" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>O'qish vaqti</label>
                                    <input name="readTime" required type="text" placeholder="5 soat" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Kitob Muqovasi (Cover URL)</label>
                                <input name="coverUrl" type="text" placeholder="https://m.media-amazon.com/..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Qisqacha Izoh (Description)</label>
                                <textarea name="description" rows={2} placeholder="Menejment tizimi bo'yicha global bestseller..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "none" }}></textarea>
                            </div>
                        </>
                    )}

                    <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "1rem", padding: "0.8rem", backgroundColor: "var(--primary-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "600", fontSize: "1rem", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#2563eb" }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--primary-color)" }}>
                        {loading ? "Saqlanmoqda..." : "Saqlash"}
                    </button>
                </form>
            </Modal>
        </>
    );
}
