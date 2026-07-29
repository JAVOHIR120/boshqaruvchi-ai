"use client";

import { motion } from "framer-motion";

interface DashboardSparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}

export default function DashboardSparkline({ 
    data, 
    color = "var(--primary-color)", 
    width = 120, 
    height = 40 
}: DashboardSparklineProps) {
    if (data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data.map((val, index) => {
        const x = (index / (data.length - 1)) * width;
        // Invert Y axis because SVG (0,0) is top-left
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(" ");

    // Generate smooth cubic bezier control points for the line
    const pathData = data.reduce((acc, val, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * (height - 4) - 2; // small padding
        if (index === 0) {
            return `M ${x} ${y}`;
        }
        return `${acc} L ${x} ${y}`;
    }, "");

    return (
        <div style={{ position: "relative", width, height }}>
            <svg width={width} height={height} style={{ overflow: "visible" }}>
                <defs>
                    <linearGradient id={`gradient-${color.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                
                {/* Area under the line */}
                {pathData && (
                    <motion.path
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        d={`${pathData} L ${width} ${height} L 0 ${height} Z`}
                        fill={`url(#gradient-${color.replace(/\s+/g, '')})`}
                    />
                )}

                {/* The trend line */}
                {pathData && (
                    <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        d={pathData}
                        fill="none"
                        stroke={color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}
            </svg>
        </div>
    );
}
