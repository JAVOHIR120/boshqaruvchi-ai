"use client";

import { motion } from "framer-motion";
import { Bot, Zap, ShieldCheck, BarChart3, Clock, Sparkles, Database, FileSpreadsheet, Lock, ArrowUpRight } from "lucide-react";

export default function StitchBentoGrid() {
  return (
    <section style={{
      width: "100%",
      maxWidth: "1240px",
      margin: "0 auto",
      padding: "4rem 1.5rem",
      color: "#fff"
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h2 style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          margin: "0 0 1rem",
          background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Stitch Modulli Tizim Imkoniyatlari
        </h2>
        <p style={{ fontSize: "1.1rem", color: "rgba(255, 255, 255, 0.6)", maxWidth: "580px", margin: "0 auto" }}>
          Google Stitch UI standarti asosida ishlovchi aqlli avtomatlashtirish modullari.
        </p>
      </div>

      {/* Bento Grid Container */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: "1.5rem"
      }}>
        {/* Card 1: Big 4 AI Advisor (Large 8 cols) */}
        <motion.div
          whileHover={{ y: -4 }}
          style={{
            gridColumn: "span 8",
            borderRadius: "1.75rem",
            padding: "2.25rem",
            backgroundColor: "rgba(15, 17, 26, 0.75)",
            border: "1px solid rgba(0, 242, 254, 0.25)",
            boxShadow: "0 20px 40px -15px rgba(0, 242, 254, 0.15)",
            backdropFilter: "blur(20px)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, rgba(0,242,254,0.15) 0%, transparent 70%)",
            pointerEvents: "none"
          }} />

          <div>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "rgba(0, 242, 254, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00f2fe",
              marginBottom: "1.5rem"
            }}>
              <Bot size={26} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#00f2fe", textTransform: "uppercase", letterSpacing: "1px" }}>
              STITCH AI ENGINE
            </span>
            <h3 style={{ fontSize: "1.75rem", fontWeight: 700, margin: "0.5rem 0 1rem" }}>
              Big 4 Standardlaridagi AI Moliya Maslahatchisi
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6, maxWidth: "540px" }}>
              Lex.uz qonunchilik bazasi hamda Xalqaro Moliya Standartlari (IFRS) asosida kompaniyangiz moliya ko'rsatkichlarini chuqur tahlil qiladi va optimallash variantlarini beradi.
            </p>
          </div>

          <div style={{
            display: "flex",
            gap: "1rem",
            marginTop: "2rem",
            flexWrap: "wrap"
          }}>
            {["Lex.uz Integatsiyasi", "24/7 AI Tahlil", "Soliq Tejami", "Hisobot Avtomatizatsiyasi"].map((tag, i) => (
              <span key={i} style={{
                fontSize: "0.8rem",
                padding: "0.4rem 0.9rem",
                borderRadius: "99px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "rgba(255, 255, 255, 0.85)"
              }}>
                ✓ {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Card 2: Realtime Analytics (4 cols) */}
        <motion.div
          whileHover={{ y: -4 }}
          style={{
            gridColumn: "span 4",
            borderRadius: "1.75rem",
            padding: "2.25rem",
            backgroundColor: "rgba(15, 17, 26, 0.75)",
            border: "1px solid rgba(168, 85, 247, 0.25)",
            boxShadow: "0 20px 40px -15px rgba(168, 85, 247, 0.15)",
            backdropFilter: "blur(20px)",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "rgba(168, 85, 247, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a855f7",
              marginBottom: "1.5rem"
            }}>
              <BarChart3 size={26} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#a855f7", textTransform: "uppercase", letterSpacing: "1px" }}>
              ANALYTICS MODULE
            </span>
            <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0.5rem 0 0.75rem" }}>
              Avtomatik P&L va Balans
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.95rem", lineHeight: 1.5 }}>
              Har bir operatsiyadan so'ng Daromad-Xarajat va Balans (Shakl 1, Shakl 2) jadvalini avtomatik tuzadi.
            </p>
          </div>

          <div style={{
            marginTop: "1.5rem",
            padding: "1rem",
            borderRadius: "1rem",
            backgroundColor: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.06)"
          }}>
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>Oylik Net Foyda</span>
            <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#10b981", marginTop: "2px" }}>
              +42.8% <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)" }}>o'sish</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: FaceID & HR (4 cols) */}
        <motion.div
          whileHover={{ y: -4 }}
          style={{
            gridColumn: "span 4",
            borderRadius: "1.75rem",
            padding: "2.25rem",
            backgroundColor: "rgba(15, 17, 26, 0.75)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            boxShadow: "0 20px 40px -15px rgba(16, 185, 129, 0.15)",
            backdropFilter: "blur(20px)"
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#10b981",
            marginBottom: "1.5rem"
          }}>
            <Clock size={26} />
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#10b981", textTransform: "uppercase", letterSpacing: "1px" }}>
            HR & ATTENDANCE
          </span>
          <h3 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0.5rem 0 0.75rem" }}>
            FaceID AI Davomat Nazorati
          </h3>
          <p style={{ color: "rgba(255, 255, 255, 0.65)", fontSize: "0.95rem", lineHeight: 1.5 }}>
            Kamera orqali yuzni tanish va xodimlarning aniq ish soatlarini hisoblab, oylik maosh jadvaliga o'tkazish.
          </p>
        </motion.div>

        {/* Card 4: Google Sheets & Excel Integration (8 cols) */}
        <motion.div
          whileHover={{ y: -4 }}
          style={{
            gridColumn: "span 8",
            borderRadius: "1.75rem",
            padding: "2.25rem",
            backgroundColor: "rgba(15, 17, 26, 0.75)",
            border: "1px solid rgba(59, 130, 246, 0.25)",
            boxShadow: "0 20px 40px -15px rgba(59, 130, 246, 0.15)",
            backdropFilter: "blur(20px)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              marginBottom: "1.5rem"
            }}>
              <FileSpreadsheet size={26} />
            </div>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#3b82f6", textTransform: "uppercase", letterSpacing: "1px" }}>
              INTEGRATION STITCH
            </span>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0.5rem 0 0.75rem" }}>
              Google Sheets va Excel Bilan To'liq Integratsiya
            </h3>
            <p style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.6 }}>
              O'zingizning Google Sheets va Excel fayllaringizni 1 bosishda platformaga ulang, jonli tahrirlang hamda ma'lumotlar sync qiling.
            </p>
          </div>

          <div style={{
            padding: "1.5rem",
            borderRadius: "1.25rem",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            minWidth: "220px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#34a853" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#34a853" }} /> Google Sheets Live
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#107c41" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#107c41" }} /> XLSX / CSV Export
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "#3b82f6" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#3b82f6" }} /> Realtime Cloud Sync
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
