"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import styles from "../app/page.module.css";

const TOTAL_FRAMES = 180;
const FRAME_PATH = "/sequence/";

// Pre-generate paths
const framePaths = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
    const num = String(i + 1).padStart(3, "0");
    return `${FRAME_PATH}ezgif-frame-${num}.jpg`;
});

export default function NickelHero() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [isReady, setIsReady] = useState(false);
    const rafRef = useRef<number>(0);
    const currentFrameRef = useRef(0);

    // Preload frames silently
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
            img.onerror = onLoad;
            images[i] = img;
        }
    }, []);

    // Draw frame function
    const drawFrame = (frameIndex: number) => {
        const canvas = canvasRef.current;
        if (!canvas || !isReady) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        const img = imagesRef.current[frameIndex];

        const dpr = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.fillStyle = "#dddddf";
        ctx.fillRect(0, 0, width, height);

        if (!img || !img.complete || !img.naturalWidth) return;

        const hRatio = width / img.naturalWidth;
        const vRatio = height / img.naturalHeight;
        const ratio = Math.max(hRatio, vRatio); // cover
        const rW = img.naturalWidth * ratio;
        const rH = img.naturalHeight * ratio;
        const cx = (width - rW) / 2;
        const cy = (height - rH) / 2;

        // Dark background fill since we are inverting it later via CSS,
        // wait, if we fill with black and invert, it becomes white. 
        // We will just fill with #dddddf (original background)
        ctx.fillStyle = "#dddddf";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, cx, cy, rW, rH);
    };

    // Auto-play Loop
    useEffect(() => {
        if (!isReady) return;

        let lastTime = performance.now();
        const fps = 30; // 30 frames per second
        const interval = 1000 / fps;

        const loop = (time: number) => {
            const deltaTime = time - lastTime;

            if (deltaTime >= interval) {
                currentFrameRef.current = (currentFrameRef.current + 1) % TOTAL_FRAMES;
                drawFrame(currentFrameRef.current);
                lastTime = time - (deltaTime % interval);
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);

        const handleResize = () => drawFrame(currentFrameRef.current);
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", handleResize);
        };
    }, [isReady]);

    return (
        <section className={styles.nickelHero}>
            {/* Header / Nav integrated into Hero layer */}
            <header className={styles.nickelHeader}>
                <div className={styles.nickelHeaderInner}>
                    <Link href="/" className={styles.nickelLogo}>
                        <img src="/logo.png" alt="Boshqaruvchi AI" />
                        <span>Boshqaruvchi AI</span>
                    </Link>

                    <nav className={styles.nickelNavLinks}>
                        <Link href="#products">Mahsulotlar</Link>
                        <Link href="#company">Kompaniya</Link>
                        <Link href="#pricing">Narxlar</Link>
                    </nav>

                    <div className={styles.nickelNavActions}>
                        <Link href="/login" className={styles.nickelBtnLogin}>Kirish</Link>
                        <Link href="/register" className={styles.nickelBtnStart}>Boshlash</Link>
                    </div>
                </div>
            </header>

            <div className={styles.nickelHeroInner}>

                {/* Left Side: Headlines & Buttons */}
                <div className={styles.nickelHeroLeft}>
                    <h1 className={styles.nickelTitle}>
                        Boshqaruvchi AI bilan<br />
                        biznesingizni o'stiring
                    </h1>
                    <p className={styles.nickelSubtitle}>
                        Soliq, kadrlar va moliyaviy hisobotlarni to'liq avtomatlashtiring.
                        Inson omilisiz xatosiz boshqaruv.
                    </p>
                    <div className={styles.nickelHeroButtons}>
                        <Link href="/register" className={styles.nickelBtnOrange}>
                            Bepul boshlash
                        </Link>
                        <Link href="#contact" className={styles.nickelBtnDark}>
                            Biz bilan bog'lanish
                        </Link>
                    </div>
                </div>

                {/* Right Side: Looping Animation Canvas */}
                <div className={styles.nickelHeroRight}>
                    <img
                        src={framePaths[0]}
                        alt=""
                        className={styles.nickelCanvasFallback}
                    />
                    <canvas
                        ref={canvasRef}
                        className={styles.nickelCanvas}
                    />
                </div>
            </div>
        </section>
    );
}
