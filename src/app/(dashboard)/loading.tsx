"use client";

import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function DashboardLoading() {
    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: "60vh",
            gap: "2rem",
            background: "transparent",
            position: "relative"
        }}>
            {/* Ambient background glow */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    position: "absolute",
                    width: "220px",
                    height: "220px",
                    borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(74, 154, 173, 0.2) 40%, transparent 70%)",
                    filter: "blur(40px)",
                    pointerEvents: "none"
                }}
            />

            {/* Lottie Animation */}
            <div
                style={{
                    width: "160px",
                    height: "160px",
                    position: "relative",
                    zIndex: 2,
                    filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.3))"
                }}
            >
                <DotLottieReact
                    src="https://lottie.host/464de909-3c81-4e0b-898e-b9a818e99d6c/NFic8Pif5n.lottie"
                    loop
                    autoplay
                    style={{ width: "100%", height: "100%" }}
                />
            </div>

            {/* Text Area */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                    position: "relative",
                    zIndex: 2
                }}
            >
                <h3 className="loading-shimmer-text" style={{
                    fontFamily: "var(--font-outfit), sans-serif",
                    fontSize: "1.45rem",
                    fontWeight: "700",
                    background: "linear-gradient(to right, #ffffff 20%, #a5b4fc 40%, #a5b4fc 60%, #ffffff 80%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    margin: 0,
                    letterSpacing: "-0.01em"
                }}>
                    Yuklanmoqda...
                </h3>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15))" }} />
                    <motion.p
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            color: "var(--text-secondary)",
                            fontSize: "0.8rem",
                            fontWeight: "500",
                            margin: 0,
                            textTransform: "uppercase",
                            letterSpacing: "0.12em"
                        }}>
                        Iltimos, kuting
                    </motion.p>
                    <div style={{ width: "40px", height: "1px", background: "linear-gradient(270deg, transparent, rgba(255,255,255,0.15))" }} />
                </div>
            </div>

            <style>{`
                .loading-shimmer-text {
                    animation: shimmer 2s linear infinite;
                }
                @keyframes shimmer {
                    to { background-position: 200% center; }
                }
            `}</style>
        </div>
    );
}
