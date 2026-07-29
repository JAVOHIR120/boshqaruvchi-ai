"use client";

import React, { useEffect, useRef, useState } from "react";

export default function WelcomeAnimation() {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const [animationStarted, setAnimationStarted] = useState(false);
    const [showText, setShowText] = useState(false);
    const [isRendered, setIsRendered] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const hasSeenAnimation = sessionStorage.getItem("boshliq-welcome-shown");
        if (!hasSeenAnimation) {
            setIsRendered(true);
            setAnimationStarted(true);
        }
    }, []);

    useEffect(() => {
        if (!isRendered || !videoRef.current) return;

        const video = videoRef.current;

        const handleTimeUpdate = () => {
            // Trigger cinematic text reveal gracefully around 1.7s mark out of 3.8s total
            if (video.currentTime >= 1.7 && !showText) {
                setShowText(true);
            }
        };

        const handleEnded = () => {
            setIsFadingOut(true);
            setTimeout(() => {
                setIsRendered(false);
                sessionStorage.setItem("boshliq-welcome-shown", "true");
            }, 1000);
        };

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("ended", handleEnded);

        // Attempt autoplay explicitly to handle varying browser policies
        video.play().catch(e => {
            console.warn("Auto-play prevented, forcing finish", e);
            handleEnded();
        });

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("ended", handleEnded);
        };
    }, [isRendered, showText]);

    if (!isRendered) return null;

    return (
        <div ref={containerRef} style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9999, backgroundColor: "#dddddf", overflow: "hidden",
            transition: "opacity 1s ease-in-out",
            opacity: isFadingOut ? 0 : 1
        }}>

            <video
                ref={videoRef}
                src="/welcome-video.mp4"
                playsInline
                muted // Muted is mandatory for auto-play without interactions
                preload="auto"
                style={{
                    width: "100%", height: "100%",
                    objectFit: "cover", // Maintains the "Awwwards" full-bleed aesthetic mapping perfectly
                    opacity: animationStarted ? 1 : 0, transition: "opacity 0.4s ease"
                }}
            />

            {/* High-End Cinematic Text Reveal */}
            <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                pointerEvents: "none",
                opacity: showText ? 1 : 0,
                transform: showText ? "scale(1)" : "scale(0.97)",
                transition: "opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.5s cubic-bezier(0.22, 1, 0.36, 1)"
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: "clamp(3rem, 7vw, 6.5rem)",
                    fontWeight: 900,
                    color: "white",
                    textShadow: "0 10px 30px rgba(0,0,0,0.8), 0 4px 10px rgba(0,0,0,0.5)",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    textAlign: "center"
                }}>
                    Boshqaruvchi AI
                </h2>
                <div style={{
                    marginTop: "1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    opacity: showText ? 1 : 0,
                    transform: showText ? "translateY(0)" : "translateY(15px)",
                    transition: "all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.3s"
                }}>
                    <span style={{ width: "60px", height: "1px", backgroundColor: "rgba(255, 255, 255, 0.5)", boxShadow: "0 2px 4px rgba(0,0,0,0.5)" }}></span>
                    <p style={{
                        margin: 0,
                        fontSize: "1.1rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.4em",
                        color: "#60a5fa", // Bright blue for pop
                        fontWeight: 800,
                        textShadow: "0 2px 8px rgba(0,0,0,0.8)"
                    }}>
                        Muvaffaqiyatli kirildi
                    </p>
                    <span style={{ width: "60px", height: "1px", backgroundColor: "rgba(255, 255, 255, 0.5)", boxShadow: "0 2px 4px rgba(0,0,0,0.5)" }}></span>
                </div>
            </div>
        </div>
    );
}
