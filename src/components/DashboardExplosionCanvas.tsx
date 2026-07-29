"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

const TOTAL_FRAMES = 180;
const FRAME_PATH = "/sequence/";

// Pre-generate all image paths matching actual filenames: ezgif-frame-001.jpg to ezgif-frame-180.jpg
const framePaths = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    const num = String(i + 1).padStart(3, "0");
    return `${FRAME_PATH}ezgif-frame-${num}.jpg`;
});

export default function DashboardExplosionCanvas() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [isReady, setIsReady] = useState(false);
    const currentFrameRef = useRef(0);
    const rafRef = useRef(0);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Silently preload ALL frames in background — no loading UI shown
    useEffect(() => {
        let loadedCount = 0;
        const images: HTMLImageElement[] = new Array(TOTAL_FRAMES);

        const onLoad = () => {
            loadedCount++;
            if (loadedCount === TOTAL_FRAMES) {
                imagesRef.current = images;
                setIsReady(true);
            }
        };

        for (let i = 0; i < TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = framePaths[i];
            img.onload = onLoad;
            img.onerror = onLoad; // Don't block on errors
            images[i] = img;
        }
    }, []);

    // Canvas draw function
    const drawFrame = useCallback((frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isReady) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const img = imagesRef.current[frameIndex];
        if (!img || !img.complete || !img.naturalWidth) return;

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        // Only resize if needed
        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        // objectFit: contain
        const hRatio = width / img.naturalWidth;
        const vRatio = height / img.naturalHeight;
        const ratio = Math.min(hRatio, vRatio);
        const rW = img.naturalWidth * ratio;
        const rH = img.naturalHeight * ratio;
        const cx = (width - rW) / 2;
        const cy = (height - rH) / 2;

        ctx.fillStyle = "#dddddf";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, cx, cy, rW, rH);
    }, [isReady]);

    // Subscribe to scroll progress for canvas rendering
    useEffect(() => {
        if (!isReady) return;

        // Draw first frame immediately when ready
        drawFrame(0);

        const unsubscribe = scrollYProgress.on("change", (latest) => {
            const frameIndex = Math.min(
                TOTAL_FRAMES - 1,
                Math.max(0, Math.floor(latest * (TOTAL_FRAMES - 1)))
            );
            if (frameIndex !== currentFrameRef.current) {
                currentFrameRef.current = frameIndex;
                if (rafRef.current) cancelAnimationFrame(rafRef.current);
                rafRef.current = requestAnimationFrame(() => drawFrame(frameIndex));
            }
        });

        const handleResize = () => drawFrame(currentFrameRef.current);
        window.addEventListener("resize", handleResize);

        return () => {
            unsubscribe();
            window.removeEventListener("resize", handleResize);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isReady, scrollYProgress, drawFrame]);

    return (
        <div ref={containerRef} style={{ position: "relative", width: "100%", height: "400vh", backgroundColor: "#dddddf", fontFamily: "var(--font-sans), sans-serif" }}>
            <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", overflow: "hidden" }}>

                {/* 
                    INSTANT FIRST FRAME: This <img> tag loads the very first frame 
                    with maximum browser priority — it appears INSTANTLY, no spinner, 
                    no "loading" text, nothing. Pure content from millisecond zero.
                    Once all 180 frames are cached, the Canvas takes over seamlessly.
                */}
                <img
                    src={framePaths[0]}
                    alt=""
                    loading="eager"
                    fetchPriority="high"
                    decoding="sync"
                    style={{
                        position: "absolute", top: 0, left: 0,
                        width: "100%", height: "100%",
                        objectFit: "contain",
                        opacity: isReady ? 0 : 1,
                        transition: "opacity 0.3s ease",
                        pointerEvents: "none",
                        backgroundColor: "#dddddf"
                    }}
                />

                {/* High-performance Canvas that activates once all frames are cached */}
                <canvas
                    ref={canvasRef}
                    style={{
                        width: "100%", height: "100%",
                        pointerEvents: "none",
                        transform: "translateZ(0)",
                        opacity: isReady ? 1 : 0,
                        transition: "opacity 0.3s ease"
                    }}
                />

                <ScrollIndicator progress={scrollYProgress} />

                {/* Beat A: 0-20% */}
                <ScrollytellingBeat
                    progress={scrollYProgress}
                    start={0} end={0.2}
                    yStart={20} yEnd={-20}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 1rem" }}
                >
                    <div style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1.25rem, 5vw, 4rem)", backgroundColor: "rgba(221,221,223,0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "clamp(16px, 3vw, 24px)", border: "1px solid rgba(255,255,255,0.5)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)", maxWidth: "90vw" }}>
                        <h1 style={{ fontSize: "clamp(3rem, 8vw, 6rem)", fontWeight: 800, letterSpacing: "-0.02em", color: "#0f172a", marginBottom: "1.5rem" }}>
                            BOSHQARUVCHI AI
                        </h1>
                        <p style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)", color: "#1e293b", maxWidth: "48rem", fontWeight: 600, lineHeight: 1.6 }}>
                            Korxonangizning raqamli ijrochi direktori. Barcha jarayonlar bitta aqlli ekranda.
                        </p>
                    </div>
                </ScrollytellingBeat>

                {/* Beat B: 25-45% */}
                <ScrollytellingBeat
                    progress={scrollYProgress}
                    start={0.25} end={0.45}
                    yStart={20} yEnd={-20}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(2rem, 8vw, 6rem)", textAlign: "left" }}
                >
                    <div style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1.25rem, 5vw, 4rem)", backgroundColor: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: "clamp(16px, 3vw, 24px)", border: "1px solid rgba(255,255,255,0.8)", boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)", display: "inline-block", maxWidth: "min(48rem, 90vw)" }}>
                        <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "#0f172a", marginBottom: "1rem", lineHeight: 1.1 }}>
                            SMART MOLIYA<br />VA SOLIQ
                        </h2>
                        <p style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)", color: "#334155", fontWeight: 600, lineHeight: 1.6 }}>
                            Xarajatlarni va soliqlarni inson omilisiz, xatosiz nazorat qiling. Sun'iy intellekt sizni barcha xatarlardan ogohlantiradi.
                        </p>
                    </div>
                </ScrollytellingBeat>

                {/* Beat C: 50-70% */}
                <ScrollytellingBeat
                    progress={scrollYProgress}
                    start={0.5} end={0.7}
                    yStart={20} yEnd={-20}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end", padding: "0 clamp(2rem, 8vw, 6rem)", textAlign: "right" }}
                >
                    <div style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1.25rem, 5vw, 4rem)", backgroundColor: "rgba(255,255,255,0.8)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: "clamp(16px, 3vw, 24px)", border: "2px solid rgba(16,185,129,0.2)", boxShadow: "0 25px 50px -12px rgba(16,185,129,0.15)", display: "inline-block", maxWidth: "min(48rem, 90vw)" }}>
                        <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, color: "#047857", marginBottom: "1rem", lineHeight: 1.1 }}>
                            HR VA KADRLAR<br />ANALITIKASI
                        </h2>
                        <p style={{ fontSize: "clamp(1.125rem, 2vw, 1.25rem)", color: "#1e293b", fontWeight: 600, lineHeight: 1.6 }}>
                            Xodimlar samaradorligini avtomatik baholang. Intizom va unumdorlik endi raqamli nazoratda.
                        </p>
                    </div>
                </ScrollytellingBeat>

                {/* Beat D: 75-95% */}
                <ScrollytellingBeat
                    progress={scrollYProgress}
                    start={0.75} end={0.98}
                    yStart={20} yEnd={-20}
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 1rem" }}
                >
                    <div style={{ padding: "clamp(2rem, 5vw, 4rem)", backgroundColor: "rgba(221,221,223,0.85)", backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)", borderRadius: "clamp(20px, 4vw, 32px)", border: "1px solid rgba(255,255,255,0.6)", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.2)", maxWidth: "90vw" }}>
                        <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 900, color: "#0f172a", marginBottom: "1.5rem", maxWidth: "56rem", lineHeight: 1.1 }}>
                            BIZNESINGIZNI AVTOMATLASHTIRING
                        </h2>
                        <p style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)", color: "#334155", maxWidth: "42rem", fontWeight: 600, marginBottom: "3rem", margin: "0 auto 3rem auto" }}>
                            Eksklyuziv pilot dasturiga qo'shiling va raqobatchilardan bir qadam oldinda bo'ling.
                        </p>
                        <button style={{ padding: "clamp(0.8rem, 2vw, 1.2rem) clamp(1.5rem, 4vw, 3rem)", backgroundColor: "var(--primary-color)", color: "white", borderRadius: "9999px", fontWeight: 700, fontSize: "clamp(1rem, 2.5vw, 1.25rem)", transition: "all 0.3s", cursor: "pointer", border: "none", boxShadow: "0 10px 25px rgba(59,130,246,0.4)", width: "auto", maxWidth: "100%" }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 15px 35px rgba(59,130,246,0.5)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 10px 25px rgba(59,130,246,0.4)"; }}
                        >
                            Eksklyuziv Dasturga Qo'shilish
                        </button>
                    </div>
                </ScrollytellingBeat>

            </div>
        </div>
    );
}

function ScrollytellingBeat({ progress, start, end, yStart, yEnd, children, style }: { progress: MotionValue<number>, start: number, end: number, yStart: number, yEnd: number, children: React.ReactNode, style: React.CSSProperties }) {
    const buffer = (end - start) * 0.15;
    const opacity = useTransform(
        progress,
        [start, start + buffer, end - buffer, end],
        [0, 1, 1, 0]
    );

    const y = useTransform(
        progress,
        [start, start + buffer, end - buffer, end],
        [yStart, 0, 0, yEnd]
    );

    const pointerEvents = useTransform(
        progress,
        (v: number) => (v > start && v < end) ? "auto" : "none"
    );

    return (
        <motion.div style={{ ...style, opacity, y, pointerEvents: pointerEvents as any }}>
            {children}
        </motion.div>
    );
}

function ScrollIndicator({ progress }: { progress: MotionValue<number> }) {
    const opacity = useTransform(progress, [0, 0.05], [1, 0]);
    return (
        <motion.div style={{ opacity, position: "absolute", bottom: "2.5rem", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", color: "rgba(0,0,0,0.5)", pointerEvents: "none" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>Pastga Skroll Qiling</span>
            <div style={{ width: "2px", height: "3rem", background: "linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)" }}></div>
        </motion.div>
    );
}
