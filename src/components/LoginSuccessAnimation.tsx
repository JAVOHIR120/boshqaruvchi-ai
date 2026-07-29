"use client";

import React, { useEffect, useRef, useState } from "react";

const TOTAL_FRAMES = 210;
const ANIMATION_DURATION_MS = 3500; // 3.5 seconds for 210 frames is 60fps

function getFramePath(index: number) {
    const idx = String(index).padStart(3, '0');
    return `/success-sequence/ezgif-frame-${idx}.jpg`;
}

export default function LoginSuccessAnimation({ onComplete }: { onComplete?: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const [animationStarted, setAnimationStarted] = useState(false);
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        const images: HTMLImageElement[] = [];

        // Concurrent loading like the dashboard canvas
        for (let i = 1; i <= TOTAL_FRAMES; i++) {
            const img = new Image();
            img.src = getFramePath(i);

            // Start the sequence as soon as the first frame is ready
            if (i === 1) {
                img.onload = () => {
                    setAnimationStarted(true);
                }
            }
            images.push(img);
        }

        imagesRef.current = images;

        return () => {
            imagesRef.current = [];
        };
    }, []);

    useEffect(() => {
        if (!animationStarted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let animationFrameId: number;
        let startTime: number | null = null;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const width = window.innerWidth;
            const height = window.innerHeight;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        };

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const renderLoop = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            // Calculate progress 0 to 1 based on duration
            let progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);

            // Show text after the animation is 50% done
            if (progress >= 0.5 && !showText) {
                setShowText(true);
            }

            const frameIndex = Math.min(
                TOTAL_FRAMES - 1,
                Math.max(0, Math.floor(progress * (TOTAL_FRAMES - 1)))
            );

            let img = imagesRef.current[frameIndex];

            // Fallback strategy if frame isn't loaded yet
            if (!img || !img.complete) {
                let found = false;
                for (let i = frameIndex - 1; i >= 0; i--) {
                    if (imagesRef.current[i] && imagesRef.current[i].complete) {
                        img = imagesRef.current[i];
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    for (let i = frameIndex + 1; i < imagesRef.current.length; i++) {
                        if (imagesRef.current[i] && imagesRef.current[i].complete) {
                            img = imagesRef.current[i];
                            break;
                        }
                    }
                }
            }

            if (img && img.complete) {
                const width = window.innerWidth;
                const height = window.innerHeight;

                // Match the required dddddf color
                ctx.fillStyle = "#dddddf";
                ctx.fillRect(0, 0, width, height);

                const hRatio = width / img.width;
                const vRatio = height / img.height;
                const ratio = Math.min(hRatio, vRatio);

                const renderWidth = img.width * ratio;
                const renderHeight = img.height * ratio;
                const centerShift_x = (width - renderWidth) / 2;
                const centerShift_y = (height - renderHeight) / 2;

                ctx.drawImage(
                    img,
                    0, 0, img.width, img.height,
                    centerShift_x, centerShift_y, renderWidth, renderHeight
                );
            }

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(renderLoop);
            } else {
                // Animation complete, notify parent
                if (onComplete) {
                    setTimeout(onComplete, 500); // 500ms breather before redirecting
                }
            }
        };

        animationFrameId = requestAnimationFrame(renderLoop);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            cancelAnimationFrame(animationFrameId);
        };
    }, [animationStarted, showText, onComplete]);

    return (
        <div ref={containerRef} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: "#dddddf", overflow: "hidden" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100%", objectFit: "contain", transform: "translateZ(0)" }} />

            <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                opacity: showText ? 1 : 0,
                transition: "opacity 0.8s ease-in-out",
                pointerEvents: "none",
                textAlign: "center"
            }}>
                <div style={{
                    padding: "2rem 4rem",
                    backgroundColor: "rgba(255, 255, 255, 0.75)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    borderRadius: "24px",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15)",
                }}>
                    <h2 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, color: "#1e293b", margin: 0, letterSpacing: "-0.02em" }}>
                        TIZIMGA XUSH KELIBSIZ!
                    </h2>
                </div>
            </div>
        </div>
    );
}
