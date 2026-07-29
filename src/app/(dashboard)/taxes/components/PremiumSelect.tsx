"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectItem {
    id: string;
    label: React.ReactNode;
}

export interface SelectGroup {
    groupLabel: string;
    items: SelectItem[];
}

export type PremiumSelectOption = SelectItem | SelectGroup;

interface PremiumSelectProps {
    value: string;
    onChange: (val: string) => void;
    options: PremiumSelectOption[];
    placeholder: string;
}

export default function PremiumSelect({ value, onChange, options, placeholder }: PremiumSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Find the currently selected item label
    const getSelectedLabel = () => {
        if (!value) return placeholder;
        for (const opt of options) {
            if ('groupLabel' in opt) {
                const found = opt.items.find(i => i.id === value);
                if (found) return found.label;
            } else {
                if (opt.id === value) return opt.label;
            }
        }
        return placeholder;
    };

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", zIndex: isOpen ? 999 : 1 }}>
            {/* TRIGGER BUTTON */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px",
                    background: isOpen ? "var(--background-color)" : "var(--background-color)",
                    border: `1px solid ${isOpen ? "var(--primary-color)" : "var(--border-color)"}`,
                    color: value ? "var(--text-primary)" : "var(--text-secondary)",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", transition: "all 0.2s", fontSize: "0.85rem", textAlign: "left"
                }}
            >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {getSelectedLabel()}
                </span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} color="var(--text-secondary)" />
                </motion.div>
            </button>

            {/* DROPDOWN MENU */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: "absolute", top: "calc(100% + 4px)", left: 0, width: "100%",
                            maxHeight: "350px", overflowY: "auto",
                            background: "var(--surface-color)",
                            border: "1px solid var(--border-color)", borderRadius: "10px",
                            boxShadow: "0 15px 50px rgba(0,0,0,0.1)", padding: "0.4rem",
                            backdropFilter: "blur(16px)", zIndex: 9999
                        }}
                        className="custom-scrollbar"
                    >
                        {options.map((opt, idx) => {
                            if ('groupLabel' in opt) {
                                return (
                                    <div key={opt.groupLabel + idx}>
                                        <div style={{
                                            padding: "0.4rem 0.6rem", fontSize: "0.7rem", fontWeight: "700",
                                            color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px",
                                            marginTop: idx > 0 ? "0.4rem" : 0
                                        }}>
                                            {opt.groupLabel}
                                        </div>
                                        {opt.items.map(item => (
                                            <DropdownItem
                                                key={item.id}
                                                item={item}
                                                isSelected={value === item.id}
                                                onSelect={() => { onChange(item.id); setIsOpen(false); }}
                                            />
                                        ))}
                                    </div>
                                );
                            } else {
                                return (
                                    <DropdownItem
                                        key={opt.id}
                                        item={opt}
                                        isSelected={value === opt.id}
                                        onSelect={() => { onChange(opt.id); setIsOpen(false); }}
                                    />
                                );
                            }
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function DropdownItem({ item, isSelected, onSelect }: { item: SelectItem, isSelected: boolean, onSelect: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onSelect}
            style={{
                padding: "0.5rem 0.6rem", borderRadius: "6px", cursor: "pointer",
                background: isSelected ? "rgba(59, 130, 246, 0.15)" : isHovered ? "var(--border-color)" : "transparent",
                color: isSelected ? "#60a5fa" : "var(--text-primary)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                transition: "all 0.2s", fontSize: "0.8rem"
            }}
        >
            <span>{item.label}</span>
            {isSelected && <Check size={14} color="#60a5fa" />}
        </div>
    );
}
