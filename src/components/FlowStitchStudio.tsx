"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Calculator, Users, ShieldCheck, Sparkles, ArrowRight, CheckCircle2, Cpu, Activity, Layers, FileCode2 } from "lucide-react";

interface NodeItem {
  id: string;
  name: string;
  tag: string;
  icon: any;
  color: string;
  glow: string;
  stats: { label: string; value: string }[];
  description: string;
  stitchCodeSnippet: string;
}

const NODES: NodeItem[] = [
  {
    id: "accounting",
    name: "Buxgalteriya va Moliya",
    tag: "Finance Node v2.4",
    icon: Calculator,
    color: "#00f2fe",
    glow: "rgba(0, 242, 254, 0.35)",
    stats: [
      { label: "Oylik Aylanma", value: "340M+ so'm" },
      { label: "Hisob-fakturalar", value: "Avtomatik" },
      { label: "Aniqlik Darajasi", value: "99.9%" }
    ],
    description: "Kirim va chiqimlar, daromadlar va korxona moliya balansini real vaqt rejimida avtomatik hisoblash.",
    stitchCodeSnippet: `// Stitch AI Generated Code
const FinanceNode = ({ data }) => {
  return <SpreadsheetEngine currency="UZS" sync={true} />;
};`
  },
  {
    id: "hr",
    name: "HR va FaceID Davomat",
    tag: "HR Node v1.8",
    icon: Users,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
    stats: [
      { label: "Xodimlar Sig'imi", value: "Cheksiz" },
      { label: "Kamera Aniqlash", value: "FaceID AI" },
      { label: "Tabel Shakllanishi", value: "1 sekund" }
    ],
    description: "Xodimlarning keldi-ketdisi, FaceID orqali verifikatsiya va oylik maosh jadvalini bir zumda shakllantirish.",
    stitchCodeSnippet: `// Stitch AI Generated Code
const HRNode = ({ employees }) => {
  return <FaceIdVerification camera="active" autoAttendance={true} />;
};`
  },
  {
    id: "tax",
    name: "Soliq va Hisobotlar",
    tag: "Tax Engine v3.0",
    icon: ShieldCheck,
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
    stats: [
      { label: "Soliq Turlari", value: "QQS, YST, Inson" },
      { label: "Ogohlantirish", value: "Telegram AI Bot" },
      { label: "Xavfsizlik", value: "256-bit AES" }
    ],
    description: "Soliq to'lovlarini oldindan bashorat qilish, soliq yukini maqbullashtirish va Soliq.uz bilan sinxronizatsiya.",
    stitchCodeSnippet: `// Stitch AI Generated Code
const TaxNode = ({ companyId }) => {
  return <TaxOptimizer autoCalculate={true} alertTelegram={true} />;
};`
  },
  {
    id: "ai",
    name: "Big 4 AI Maslahatchi",
    tag: "Gemini AI Core",
    icon: Bot,
    color: "#3b82f6",
    glow: "rgba(59, 130, 246, 0.35)",
    stats: [
      { label: "Standardlar", value: "Lex.uz + IFRS" },
      { label: "Javob Berish", value: "< 0.5 sec" },
      { label: "Mantiqiy Tahlil", value: "Deep Reasoning" }
    ],
    description: "Kompaniyaning moliyaviy va huquqiy holatini Lex.uz qonunchiligi asosida 24/7 tahlil qiluvchi AI agent.",
    stitchCodeSnippet: `// Stitch AI Generated Code
const AIAgentNode = ({ prompt }) => {
  return <GoogleGenAI model="gemini-3.6" reasoning="advanced" />;
};`
  }
];

export default function FlowStitchStudio() {
  const [activeNodeId, setActiveNodeId] = useState<string>("accounting");
  const activeNode = NODES.find((n) => n.id === activeNodeId) || NODES[0];

  return (
    <div style={{
      position: "relative",
      width: "100%",
      maxWidth: "1240px",
      margin: "0 auto",
      padding: "4rem 1.5rem",
      color: "#fff"
    }}>
      {/* Section Header */}
      <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.4rem 1rem",
          borderRadius: "99px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          marginBottom: "1rem"
        }}>
          <Sparkles size={16} style={{ color: "#00f2fe" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "0.5px", color: "rgba(255, 255, 255, 0.9)" }}>
            GOOGLE STITCH & FLOW NODE ENGINE
          </span>
        </div>
        <h2 style={{
          fontSize: "2.75rem",
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
          margin: "0 0 1rem",
          background: "linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.65) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          Modulli AI Ekotizimi bilan Tanishing
        </h2>
        <p style={{
          fontSize: "1.1rem",
          color: "rgba(255, 255, 255, 0.65)",
          maxWidth: "640px",
          margin: "0 auto",
          lineHeight: 1.6
        }}>
          Boshqaruvchi AI algoritmlari moliya, kadrlar va soliq ma'lumotlarini tugunlar (Nodes) orqali avtomatik ulab, bitta boshqaruv paneliga birlashtiradi.
        </p>
      </div>

      {/* Main Studio Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gap: "1.75rem",
        alignItems: "stretch"
      }}>
        {/* Left Side: Interactive Node Buttons */}
        <div style={{
          gridColumn: "span 5",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}>
          {NODES.map((node) => {
            const Icon = node.icon;
            const isActive = node.id === activeNodeId;
            return (
              <motion.button
                key={node.id}
                onClick={() => setActiveNodeId(node.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem 1.5rem",
                  borderRadius: "1.25rem",
                  border: isActive
                    ? `1.5px solid ${node.color}`
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  backgroundColor: isActive
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(255, 255, 255, 0.015)",
                  boxShadow: isActive ? `0 0 25px ${node.glow}` : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  backdropFilter: "blur(12px)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {/* Accent glow bar */}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    backgroundColor: node.color,
                    boxShadow: `0 0 12px ${node.color}`
                  }} />
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "12px",
                    backgroundColor: isActive ? `${node.color}20` : "rgba(255, 255, 255, 0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isActive ? node.color : "rgba(255, 255, 255, 0.6)"
                  }}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <span style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: isActive ? node.color : "rgba(255, 255, 255, 0.4)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px"
                    }}>
                      {node.tag}
                    </span>
                    <span style={{
                      display: "block",
                      fontSize: "1.1rem",
                      fontWeight: 600,
                      color: "#fff",
                      marginTop: "2px"
                    }}>
                      {node.name}
                    </span>
                  </div>
                </div>
                <ArrowRight size={18} style={{
                  color: isActive ? node.color : "rgba(255, 255, 255, 0.3)",
                  transform: isActive ? "translateX(4px)" : "none",
                  transition: "transform 0.2s"
                }} />
              </motion.button>
            );
          })}
        </div>

        {/* Right Side: Active Node Canvas & Live Preview */}
        <div style={{ gridColumn: "span 7" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeNode.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              style={{
                height: "100%",
                borderRadius: "1.5rem",
                border: `1px solid ${activeNode.color}40`,
                backgroundColor: "rgba(13, 14, 20, 0.85)",
                boxShadow: `0 16px 48px -12px ${activeNode.glow}`,
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backdropFilter: "blur(20px)",
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Radial background blur */}
              <div style={{
                position: "absolute",
                top: "-20%",
                right: "-20%",
                width: "250px",
                height: "250px",
                borderRadius: "50%",
                backgroundColor: activeNode.color,
                opacity: 0.12,
                filter: "blur(80px)",
                pointerEvents: "none"
              }} />

              {/* Node Header */}
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: activeNode.color,
                      boxShadow: `0 0 10px ${activeNode.color}`
                    }} />
                    <span style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.85rem",
                      color: activeNode.color,
                      fontWeight: 600
                    }}>
                      STITCH NODE CONNECTED
                    </span>
                  </div>
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "99px",
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem"
                  }}>
                    <Activity size={12} style={{ color: activeNode.color }} /> Realtime Sync
                  </span>
                </div>

                <h3 style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  margin: "0 0 0.75rem",
                  color: "#fff"
                }}>
                  {activeNode.name}
                </h3>
                <p style={{
                  fontSize: "1rem",
                  color: "rgba(255, 255, 255, 0.7)",
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  {activeNode.description}
                </p>
              </div>

              {/* Node Stats Row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
                margin: "2rem 0"
              }}>
                {activeNode.stats.map((st, i) => (
                  <div key={i} style={{
                    padding: "1rem",
                    borderRadius: "1rem",
                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.06)"
                  }}>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.5)", marginBottom: "0.25rem" }}>
                      {st.label}
                    </span>
                    <span style={{ display: "block", fontSize: "1.1rem", fontWeight: 700, color: activeNode.color }}>
                      {st.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stitch Code Snippet Box */}
              <div style={{
                borderRadius: "0.85rem",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                padding: "1rem 1.25rem",
                fontFamily: "monospace",
                fontSize: "0.82rem",
                color: "#a5f3fc"
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "0.5rem",
                  paddingBottom: "0.4rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.75rem"
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <FileCode2 size={13} /> STITCH UI GENERATION
                  </span>
                  <span>React / Next.js</span>
                </div>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  <code>{activeNode.stitchCodeSnippet}</code>
                </pre>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
