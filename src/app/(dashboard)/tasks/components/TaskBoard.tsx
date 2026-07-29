"use client";

import { useState, useEffect } from "react";
import { updateTaskStatus, deleteTask, addTask, updateTaskDetails } from "@/actions";
import { Plus, Trash2, User, Calendar, Clock, Sparkles, AlertTriangle, ListTodo, Zap, CheckCircle2 } from "lucide-react";
import styles from "../tasks.module.css";
import Modal from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";

type Task = {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignedTo: string | null;
    dueDate: Date | null;
    aiNotes: string | null;
};

interface TaskBoardProps {
    initialTasks: Task[];
    employees: { id: string, name: string }[];
}

const COLUMNS = [
    { id: "TODO", title: "Qilinishi Kerak", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.03)", borderRGB: "148, 163, 184", icon: ListTodo },
    { id: "IN_PROGRESS", title: "Jarayonda", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.03)", borderRGB: "96, 165, 250", icon: Zap },
    { id: "DONE", title: "Tugatildi", color: "#34d399", bg: "rgba(52, 211, 153, 0.03)", borderRGB: "52, 211, 153", icon: CheckCircle2 }
];

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string; glow: string }> = {
    HIGH: { label: "Yuqori", color: "#ef4444", bg: "rgba(239,68,68,0.12)", glow: "0 0 8px rgba(239,68,68,0.3)" },
    MEDIUM: { label: "O'rta", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", glow: "0 0 6px rgba(245,158,11,0.2)" },
    LOW: { label: "Past", color: "#22c55e", bg: "rgba(34,197,94,0.1)", glow: "0 0 6px rgba(34,197,94,0.2)" }
};

function getDeadlineInfo(dueDate: Date | null): { text: string; color: string; urgent: boolean } | null {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} kun o'tdi ⚠️`, color: "#ef4444", urgent: true };
    if (diffDays === 0) return { text: "Bugun!", color: "#f59e0b", urgent: true };
    if (diffDays <= 3) return { text: `${diffDays} kun qoldi`, color: "#f59e0b", urgent: false };
    return { text: `${diffDays} kun`, color: "#64748b", urgent: false };
}

export default function TaskBoard({ initialTasks, employees }: TaskBoardProps) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks);

    // Server refresh dan keyin initialTasks yangilanganida local state ni ham yangilash
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(false);
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, colId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setHoveredColumn(colId);
    };

    const handleDragLeave = () => {
        setHoveredColumn(null);
    };

    const handleDrop = async (e: React.DragEvent, statusId: string) => {
        e.preventDefault();
        setHoveredColumn(null);
        if (!draggedTaskId) return;

        const task = tasks.find(t => t.id === draggedTaskId);
        if (task && task.status !== statusId) {
            setTasks(prev => prev.map(t => t.id === draggedTaskId ? { ...t, status: statusId } : t));
            await updateTaskStatus(draggedTaskId, statusId);
        }
        setDraggedTaskId(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Ushbu vazifani o'chirishni xohlaysizmi?")) {
            setTasks(prev => prev.filter(t => t.id !== id));
            await deleteTask(id);
        }
    };

    const handleAddSubmit = async (formData: FormData) => {
        setLoading(true);
        await addTask(formData);
        setAddModalOpen(false);
        setLoading(false);
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (formData: FormData) => {
        if (!selectedTask) return;
        setLoading(true);
        await updateTaskDetails(selectedTask.id, formData);

        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const assignedTo = formData.get("assignedTo") as string;
        const dueDate = formData.get("dueDate") ? new Date(formData.get("dueDate") as string) : null;

        setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, title, description, assignedTo, dueDate } : t));

        setEditModalOpen(false);
        setSelectedTask(null);
        setLoading(false);
    };

    return (
        <div className={styles.kanbanBoard}>
            {COLUMNS.map(col => {
                const columnTasks = tasks.filter(t => t.status === col.id);
                const isDropTarget = hoveredColumn === col.id;

                return (
                    <div
                        key={col.id}
                        className={`${styles.column} ${isDropTarget ? styles.columnDropTarget : ""}`}
                        style={{ 
                            background: col.bg, 
                            borderColor: isDropTarget ? col.color : `rgba(${col.borderRGB}, 0.15)`,
                            boxShadow: isDropTarget ? `0 0 20px rgba(${col.borderRGB}, 0.15), 0 4px 10px rgba(0,0,0,0.2)` : `0 4px 15px rgba(0,0,0,0.2)`
                        }}
                        onDragOver={(e) => handleDragOver(e, col.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, col.id)}
                    >
                        <div className={styles.columnHeader} style={{
                            background: `linear-gradient(180deg, rgba(${col.borderRGB}, 0.12) 0%, rgba(15, 23, 42, 0) 100%)`,
                            borderBottom: `1px solid rgba(${col.borderRGB}, 0.2)`
                        }}>
                            <div className={styles.columnTitle} style={{ color: "#f8fafc", textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    width: '28px', height: '28px', borderRadius: '8px',
                                    background: `rgba(${col.borderRGB}, 0.15)`,
                                    border: `1px solid rgba(${col.borderRGB}, 0.3)`,
                                    boxShadow: `0 0 10px rgba(${col.borderRGB}, 0.2)`
                                }}>
                                    <col.icon size={16} color={col.color} style={{ filter: `drop-shadow(0 0 6px rgba(${col.borderRGB}, 0.8))` }} />
                                </div>
                                {col.title}
                            </div>
                            <span className={styles.columnBadge} style={{
                                background: `rgba(${col.borderRGB}, 0.15)`,
                                color: col.color,
                                border: `1px solid rgba(${col.borderRGB}, 0.3)`,
                                boxShadow: `0 0 10px rgba(${col.borderRGB}, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)`
                            }}>
                                {columnTasks.length}
                            </span>
                            
                            {/* Top glowing edge line */}
                            <div style={{
                                position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                                background: `linear-gradient(90deg, transparent, ${col.color}, transparent)`,
                                opacity: 0.8
                            }} />
                        </div>

                        <div className={styles.columnBody}>
                            <AnimatePresence mode="popLayout">
                                {columnTasks.map(task => {
                                    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
                                    const deadline = getDeadlineInfo(task.dueDate);

                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                                            transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                            className={styles.taskCard}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task.id)}
                                            onClick={() => handleTaskClick(task)}
                                            style={{ cursor: "pointer" }}
                                        >
                                            {/* Priority Badge + Title */}
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
                                                <span className={styles.priorityBadge} style={{
                                                    background: priority.bg,
                                                    color: priority.color,
                                                    boxShadow: priority.glow,
                                                    border: `1px solid ${priority.color}20`
                                                }}>
                                                    {priority.label}
                                                </span>
                                                <h4 className={styles.taskTitle} style={{ margin: 0 }}>{task.title}</h4>
                                            </div>

                                            {task.description && (
                                                <p className={styles.taskDesc}>
                                                    {task.description.length > 60 ? task.description.substring(0, 60) + '...' : task.description}
                                                </p>
                                            )}

                                            {/* AI Notes */}
                                            {task.aiNotes && (
                                                <div className={styles.aiNotesBar}>
                                                    <Sparkles size={12} />
                                                    <span>{task.aiNotes.length > 50 ? task.aiNotes.substring(0, 50) + "..." : task.aiNotes}</span>
                                                </div>
                                            )}

                                            <div className={styles.taskMeta}>
                                                {task.assignedTo ? (
                                                    <div className={styles.taskAssignee}>
                                                        <User size={14} /> {task.assignedTo}
                                                    </div>
                                                ) : <div />}

                                                {deadline && (
                                                    <div className={styles.taskDeadline} style={{
                                                        color: deadline.color,
                                                        background: `${deadline.color}15`,
                                                    }}>
                                                        {deadline.urgent ? <AlertTriangle size={12} /> : <Clock size={12} />}
                                                        {deadline.text}
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.taskActions}>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }} className={styles.actionBtn}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>

                            {col.id === "TODO" && (
                                <button className={styles.addBtn} onClick={() => setAddModalOpen(true)}>
                                    <Plus size={18} /> Yangi Vazifa
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Add Task Modal */}
            <Modal isOpen={isAddModalOpen} onClose={() => setAddModalOpen(false)} title="Yangi Vazifa (Task)">
                <form action={handleAddSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Vazifa Nomi</label>
                        <input name="title" required type="text" placeholder="Masalan: Yangi dastur dizaynini chizish" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Batafsil Izoh</label>
                        <textarea name="description" rows={5} placeholder="Qisqacha ta'rif..." style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "none" }}></textarea>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Biriktirilgan Xodim</label>
                            <select name="assignedTo" required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }}>
                                <option value="" disabled selected>Xodimni tanlang</option>
                                {employees.map(emp => (
                                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Muddat (Due Date)</label>
                            <input name="dueDate" type="date" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                        </div>
                    </div>
                    <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "0.5rem", padding: "0.8rem", backgroundColor: "var(--primary-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "600", fontSize: "1rem", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#4f46e5" }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--primary-color)" }}>
                        {loading ? "Saqlanmoqda..." : "Yuborish"}
                    </button>
                </form>
            </Modal>

            {/* Edit Task Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => { setEditModalOpen(false); setSelectedTask(null); }} title="Vazifani Tahrirlash / Ko'rish">
                {selectedTask && (
                    <form action={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Vazifa Nomi</label>
                            <input name="title" defaultValue={selectedTask.title} required type="text" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Batafsil Izoh</label>
                            <textarea name="description" defaultValue={selectedTask.description || ""} rows={6} style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)", resize: "none" }}></textarea>
                        </div>

                        {/* AI Notes Display */}
                        {selectedTask.aiNotes && (
                            <div style={{
                                padding: "0.75rem 1rem",
                                background: "rgba(139,92,246,0.08)",
                                border: "1px solid rgba(139,92,246,0.2)",
                                borderRadius: "var(--radius-md)",
                                display: "flex", alignItems: "flex-start", gap: "0.5rem"
                            }}>
                                <Sparkles size={16} color="#a78bfa" style={{ flexShrink: 0, marginTop: "2px" }} />
                                <div>
                                    <p style={{ fontSize: "0.75rem", color: "#a78bfa", fontWeight: 600, marginBottom: "0.2rem" }}>AI Maslahati</p>
                                    <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.5 }}>{selectedTask.aiNotes}</p>
                                </div>
                            </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Biriktirilgan Xodim</label>
                                <select name="assignedTo" defaultValue={selectedTask.assignedTo || ""} required style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }}>
                                    <option value="" disabled>Xodimni tanlang</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "0.3rem" }}>Muddat (Due Date)</label>
                                <input name="dueDate" defaultValue={selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : ""} type="date" style={{ width: "100%", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", backgroundColor: "var(--surface-color)", color: "var(--text-primary)" }} />
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                            <button type="button" onClick={() => { setEditModalOpen(false); setSelectedTask(null); }} style={{ flex: 1, padding: "0.8rem", backgroundColor: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}>
                                Bekor qilish
                            </button>
                            <button type="submit" disabled={loading} style={{ flex: 1, padding: "0.8rem", backgroundColor: "var(--primary-color)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer", opacity: loading ? 0.7 : 1, transition: "background 0.2s" }} onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "#4f46e5" }} onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = "var(--primary-color)" }}>
                                {loading ? "Saqlanmoqda..." : "Saqlash"}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
