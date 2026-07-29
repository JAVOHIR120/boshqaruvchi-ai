"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function EnhancedIconClient({
  children,
  className = "",
  glowColor = "rgba(74, 154, 173, 0.2)",
  hasBackground = false,
  isActive = false,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  hasBackground?: boolean;
  isActive?: boolean;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.1, translateY: -2 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: "pointer",
        ...(hasBackground ? {
          padding: "0.5rem",
          borderRadius: "12px",
          backgroundColor: isActive
            ? "rgba(74, 154, 173, 0.15)"
            : "rgba(255, 255, 255, 0.03)",
          border: isActive ? "1px solid rgba(74, 154, 173, 0.3)" : "1px solid transparent",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          transition: "background-color 0.3s ease, border-color 0.3s ease",
        } : {})
      }}
    >
      {isActive && (
        <motion.div
          layoutId="glow"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "16px",
            background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
            zIndex: -1,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
