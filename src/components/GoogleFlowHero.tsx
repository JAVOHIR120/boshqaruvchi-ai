"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Bot, Calculator, Users } from "lucide-react";

export default function GoogleFlowHero() {
  return (
    <section style={{
      position: "relative",
      width: "100%",
      minHeight: "88vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "6rem 1.5rem 4rem",
      overflow: "hidden",
      textAlign: "center"
    }}>
      {/* Radial Background Orbs */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 80%)",
        filter: "blur(100px)",
        pointerEvents: "none"
      }} />

      {/* Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "0.5rem 1.25rem",
          borderRadius: "99px",
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(0, 242, 254, 0.3)",
          boxShadow: "0 0 20px rgba(0, 242, 254, 0.15)",
          marginBottom: "1.75rem",
          backdropFilter: "blur(12px)"
        }}
      >
        <Sparkles size={16} style={{ color: "#00f2fe" }} />
        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff", letterSpacing: "0.5px" }}>
          GOOGLE FLOW & STITCH AI PLATFORM 2026
        </span>
      </motion.div>

      {/* Main Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        style={{
          fontSize: "3.75rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          lineHeight: 1.15,
          maxWidth: "960px",
          margin: "0 0 1.5rem",
          background: "linear-gradient(135deg, #ffffff 40%, rgba(0, 242, 254, 0.9) 70%, rgba(168, 85, 247, 0.9) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}
      >
        Biznes Boshqaruvida Intellektual Va Moliya Avtomatizatsiyasi
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        style={{
          fontSize: "1.2rem",
          color: "rgba(255, 255, 255, 0.7)",
          maxWidth: "680px",
          margin: "0 0 2.5rem",
          lineHeight: 1.6
        }}
      >
        Soliq hisobotlari, buxgalteriya balansi, HR FaceID va Big 4 AI maslahatchisini yagona Google Stitch tugunlariga birlashtiring.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        style={{
          display: "flex",
          gap: "1.25rem",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <Link href="/register" style={{
          padding: "1rem 2.25rem",
          borderRadius: "99px",
          backgroundColor: "#00f2fe",
          color: "#050608",
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          boxShadow: "0 0 30px rgba(0, 242, 254, 0.4)",
          transition: "all 0.3s ease"
        }}>
          Bepul Boshlash <ArrowRight size={18} />
        </Link>

        <Link href="/login" style={{
          padding: "1rem 2.25rem",
          borderRadius: "99px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          color: "#fff",
          fontWeight: 600,
          fontSize: "1rem",
          textDecoration: "none",
          backdropFilter: "blur(12px)",
          transition: "all 0.3s ease"
        }}>
          Tizimga Kirish
        </Link>
      </motion.div>

      {/* Node Badges Preview Row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          display: "flex",
          gap: "1.5rem",
          marginTop: "4rem",
          justifyContent: "center",
          flexWrap: "wrap"
        }}
      >
        {[
          { icon: Calculator, label: "Moliya & Balans", color: "#00f2fe" },
          { icon: Users, label: "FaceID Davomat", color: "#10b981" },
          { icon: ShieldCheck, label: "Soliq Avtomat", color: "#a855f7" },
          { icon: Bot, label: "Big 4 AI Advisor", color: "#3b82f6" }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.65rem 1.2rem",
              borderRadius: "1rem",
              backgroundColor: "rgba(15, 17, 26, 0.8)",
              border: `1px solid ${item.color}40`,
              backdropFilter: "blur(16px)",
              boxShadow: `0 8px 20px -6px ${item.color}30`
            }}>
              <Icon size={18} style={{ color: item.color }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#fff" }}>{item.label}</span>
            </div>
          );
        })}
      </motion.div>
    </section>
  );
}
