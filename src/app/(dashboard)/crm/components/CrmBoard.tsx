"use client";

import { useState } from "react";
import { updateLeadStatus, deleteLead, addLead } from "@/actions";
import { Plus, Trash2, Phone, Briefcase, TrendingUp } from "lucide-react";
import styles from "../crm.module.css";
import Modal from "@/components/ui/Modal";

type Lead = {
    id: string;
    name: string;
    companyName: string | null;
    phone: string | null;
    status: string;
    estimatedValue: number;
};

interface CrmBoardProps {
    initialLeads: Lead[];
}

const COLUMNS = [
    { id: "NEW", title: "Yangi Mijoz", color: "var(--primary-color)" },
    { id: "CONTACTED", title: "Aloqaga Chiqildi", color: "var(--warning-color)" },
    { id: "QUALIFIED", title: "Layoqatli", color: "#8b5cf6" },
    { id: "WON", title: "Sotildi", color: "var(--success-color)" },
    { id: "LOST", title: "Rad Etildi", color: "var(--error-color)" }
];

export default function CrmBoard({ initialLeads }: CrmBoardProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        setDraggedLeadId(leadId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        if (!draggedLeadId) return;

        const lead = leads.find(l => l.id === draggedLeadId);
        if (lead && lead.status !== statusId) {
            setLeads(prev => prev.map(l => l.id === draggedLeadId ? { ...l, status: statusId } : l));
            await updateLeadStatus(draggedLeadId, statusId);
        }
        setDraggedLeadId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bu mijozni o'chirishni xohlaysizmi?")) {
            setLeads(prev => prev.filter(l => l.id !== id));
            await deleteLead(id);
        }
    };

    const handleAddSubmit = async (formData: FormData) => {
        setLoading(true);
        await addLead(formData);
        setAddModalOpen(false);
        setLoading(false);
    };

    return (
        <div className={`${styles.kanbanBoard} animate-slide-up`}>
            {COLUMNS.map(col => {
                const columnLeads = leads.filter(l => l.status === col.id);

                return (
                    <div
                        key={col.id}
                        className={styles.column}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className={styles.columnHeader}>
                            <div className={styles.columnTitle}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: col.color, boxShadow: `0 0 10px ${col.color}` }} />
                                {col.title}
                            </div>
                            <span className={styles.columnBadge} style={{ color: col.color, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                {columnLeads.length}
                            </span>
                        </div>

                        <div className={styles.columnBody}>
                            {columnLeads.map(lead => {
                                const isNeglected = (lead.status === "CONTACTED" || lead.status === "QUALIFIED") &&
                                    (lead as any).updatedAt &&
                                    (new Date().getTime() - new Date((lead as any).updatedAt).getTime() > 3 * 24 * 60 * 60 * 1000);

                                return (
                                    <div
                                        key={lead.id}
                                        className={styles.leadCard}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, lead.id)}
                                        style={{
                                            // @ts-ignore for custom property
                                            "--currentColor": col.color,
                                            borderLeft: isNeglected ? "3px solid var(--error-color)" : "",
                                            backgroundColor: isNeglected ? "rgba(239, 68, 68, 0.05)" : ""
                                        }}
                                    >
                                        <h4 className={styles.leadName}>
                                            {lead.name}
                                            {isNeglected && <span title="3 kundan oshdi. Mijoz esdan chiqmasin!" style={{ marginLeft: '0.5rem', color: 'var(--error-color)', fontSize: '0.8rem' }}>⚠️</span>}
                                        </h4>

                                        {/* Display AI Label if available */}
                                        {(lead as any).aiLabel && (
                                            <div style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "9999px", backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#fde047", fontSize: "0.75rem", fontWeight: "600", marginBottom: "0.75rem", border: "1px solid rgba(234, 179, 8, 0.2)" }}>
                                                {(lead as any).aiLabel}
                                            </div>
                                        )}

                                        {lead.companyName && (
                                            <div className={styles.leadCompany}>
                                                <Briefcase size={14} /> {lead.companyName}
                                            </div>
                                        )}

                                        {lead.phone && (
                                            <div className={styles.leadCompany}>
                                                <Phone size={14} /> {lead.phone}
                                            </div>
                                        )}

                                        {lead.estimatedValue > 0 && (
                                            <div className={styles.leadValue}>
                                                <TrendingUp size={14} strokeWidth={2.5} /> {lead.estimatedValue.toLocaleString()} $
                                            </div>
                                        )}

                                        <div className={styles.leadActions}>
                                            <button onClick={() => handleDelete(lead.id)} className={styles.actionBtn}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {col.id === "NEW" && (
                                <button className={styles.addBtn} onClick={() => setAddModalOpen(true)}>
                                    <Plus size={18} /> Yangi Qo'shish
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add Lead Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Yangi Mijoz Qo'shish">
                <form action={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontFamily: "var(--font-sans)", fontWeight: "500" }}>Mijoz Ismi</label>
                        <input name="name" required type="text" placeholder="Masalan: Sardor Aliyev" className="input-premium" />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontFamily: "var(--font-sans)", fontWeight: "500" }}>Kompaniya nomi</label>
                        <input name="companyName" type="text" placeholder="Masalan: MCHJ 'TuronTech'" className="input-premium" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontFamily: "var(--font-sans)", fontWeight: "500" }}>Telefon Raxami</label>
                            <input name="phone" type="text" placeholder="+998 90 123 45 67" className="input-premium" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.4rem", fontFamily: "var(--font-sans)", fontWeight: "500" }}>Kutilayotgan Daromad ($)</label>
                            <input name="estimatedValue" type="number" min="0" placeholder="5000" className="input-premium" />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: "0.5rem", width: "100%", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Qo'shilmoqda..." : "Saqlash"}
                    </button>
                </form>
            </Modal>
        </div>
    );
}
