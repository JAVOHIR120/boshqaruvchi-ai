"use client";

import { useState } from "react";
import { Edit2, Trash2, Shield, UserX } from "lucide-react";
import { updateUserRole, deleteUser } from "@/actions";

export default function AdminUserActions({ user }: { user: { id: string, name: string, role: string } }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [role, setRole] = useState(user.role);

    const handleUpdate = async () => {
        setLoading(true);
        await updateUserRole(user.id, role);
        setLoading(false);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (confirm(`Rostdan ham ${user.name} ni tizimdan o'chirmoqchimisiz?`)) {
            setLoading(true);
            await deleteUser(user.id);
            setLoading(false);
        }
    };

    if (isEditing) {
        return (
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)", backgroundColor: "var(--background-color)", color: "var(--text-primary)", fontSize: "0.85rem" }}
                >
                    <option value="BOSHLIQ">Boshliq</option>
                    <option value="XODIM">Xodim</option>
                    <option value="BUXGALTER">Buxgalter</option>
                </select>
                <button
                    onClick={handleUpdate}
                    disabled={loading}
                    style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--success-color)", color: "white", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", cursor: "pointer", border: "none" }}
                >
                    Saqlash
                </button>
                <button
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    style={{ padding: "0.25rem 0.5rem", backgroundColor: "var(--background-color)", color: "var(--text-secondary)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", cursor: "pointer", border: "1px solid var(--border-color)" }}
                >
                    Bekor
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button
                onClick={() => setIsEditing(true)}
                title="Rolni o'zgartirish"
                style={{ background: "none", border: "none", color: "var(--primary-color)", cursor: "pointer", padding: "0.25rem" }}
            >
                <Edit2 size={16} />
            </button>
            <button
                onClick={handleDelete}
                disabled={loading}
                title="O'chirish"
                style={{ background: "none", border: "none", color: "var(--error-color)", cursor: loading ? "not-allowed" : "pointer", padding: "0.25rem", opacity: loading ? 0.5 : 1 }}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
}
