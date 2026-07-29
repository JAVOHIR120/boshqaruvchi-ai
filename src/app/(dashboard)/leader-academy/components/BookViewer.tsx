"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import HTMLFlipBook from "react-pageflip";
import { X, Volume2, VolumeX, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2 } from "lucide-react";

// @ts-ignore
const FlipBook = HTMLFlipBook as any;

interface BookViewerProps {
    pdfUrl: string;
    title: string;
    onClose: () => void;
}

/* ========== Programmatic Page-Flip Audio (Web Audio API) ========== */
function createPageFlipSound(audioCtx: AudioContext) {
    const duration = 0.35;
    const sampleRate = audioCtx.sampleRate;
    const bufferSize = Math.floor(duration * sampleRate);
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        // White noise burst that fades out — mimics paper rustle
        const noise = (Math.random() * 2 - 1);
        const envelope = Math.exp(-t * 12) * 0.6; // fast decay
        // Add a subtle low-frequency "thump" for the page landing
        const thump = Math.sin(2 * Math.PI * 80 * t) * Math.exp(-t * 20) * 0.3;
        data[i] = (noise * envelope + thump) * 0.5;
    }
    return buffer;
}

function playFlipSound(audioCtx: AudioContext, buffer: AudioBuffer) {
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    // Band-pass filter for more realistic paper sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 3000;
    filter.Q.value = 0.7;
    source.connect(filter);
    filter.connect(audioCtx.destination);
    source.start();
}

/* ========== Individual Page Component ========== */
const Page = React.forwardRef<HTMLDivElement, { number: number; pdfDoc: any; currentPage: number; renderScale: number }>(
    ({ number, pdfDoc, currentPage, renderScale }, ref) => {
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [isRendered, setIsRendered] = useState(false);
        const [isRendering, setIsRendering] = useState(false);
        const renderedScaleRef = useRef<number>(0);

        useEffect(() => {
            const renderPage = async () => {
                if (!pdfDoc || !canvasRef.current || isRendering) return;
                // Re-render if scale changed or not yet rendered, and within range
                if (isRendered && renderedScaleRef.current === renderScale) return;
                if (Math.abs(number - currentPage) > 4) return;

                setIsRendering(true);
                try {
                    const page = await pdfDoc.getPage(number);
                    const viewport = page.getViewport({ scale: renderScale });
                    const canvas = canvasRef.current;
                    const context = canvas.getContext("2d");

                    if (context) {
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        await page.render({ canvasContext: context, viewport }).promise;
                        renderedScaleRef.current = renderScale;
                        setIsRendered(true);
                    }
                } catch (error) {
                    console.error("Page render error:", error);
                } finally {
                    setIsRendering(false);
                }
            };
            renderPage();
        }, [pdfDoc, number, currentPage, renderScale, isRendered, isRendering]);

        return (
            <div ref={ref} className="page" style={{ background: '#fffdf8', overflow: 'hidden', position: 'relative' }}>
                {!isRendered && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f6f0', color: '#a3a3a3' }}>
                        <Loader2 className="animate-spin" size={28} />
                    </div>
                )}
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: isRendered ? 'block' : 'none'
                    }}
                />
                {/* Page number */}
                {isRendered && (
                    <div style={{ position: 'absolute', bottom: '8px', width: '100%', textAlign: 'center', fontSize: '9px', color: '#999', fontFamily: 'serif' }}>
                        — {number} —
                    </div>
                )}
                {/* Inner shadow for realism */}
                <div style={{
                    position: 'absolute', top: 0, bottom: 0, pointerEvents: 'none',
                    ...(number % 2 === 0
                        ? { right: 0, width: '20px', background: 'linear-gradient(to left, rgba(0,0,0,0.08), transparent)' }
                        : { left: 0, width: '20px', background: 'linear-gradient(to right, rgba(0,0,0,0.08), transparent)' }
                    )
                }} />
            </div>
        );
    }
);
Page.displayName = "Page";

/* ========== Main BookViewer ========== */
export default function BookViewer({ pdfUrl, title, onClose }: BookViewerProps) {
    const [numPages, setNumPages] = useState(0);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [renderScale, setRenderScale] = useState(2.0);
    const [dimensions, setDimensions] = useState({ w: 450, h: 600 });
    const flipBookRef = useRef<any>(null);

    const audioCtxRef = useRef<AudioContext | null>(null);
    const flipBufferRef = useRef<AudioBuffer | null>(null);

    // Calculate proper FlipBook dimensions based on viewport
    useEffect(() => {
        const calcDimensions = () => {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const isMob = vw < 768;
            const headerH = isMob ? 48 : 52;
            const footerH = isMob ? 0 : 32; // No footer on mobile
            const padding = isMob ? 16 : 40;
            const availH = vh - headerH - footerH - padding;
            const availW = vw - (isMob ? 20 : 120); // Account for nav buttons on desktop

            // Standard book ratio ~0.7 (width/height)
            let bookH = Math.min(availH, isMob ? 700 : 800);
            let bookW = Math.floor(bookH * 0.7);

            // If too wide for viewport, constrain by width
            if (isMob) {
                bookW = Math.min(bookW, availW - 10);
                bookH = Math.floor(bookW / 0.7);
            } else {
                // Double page on desktop — each page is bookW wide
                if (bookW * 2 > availW) {
                    bookW = Math.floor(availW / 2);
                    bookH = Math.floor(bookW / 0.7);
                }
            }

            setDimensions({ w: bookW, h: bookH });
        };

        calcDimensions();
        window.addEventListener('resize', calcDimensions);
        return () => window.removeEventListener('resize', calcDimensions);
    }, []);

    useEffect(() => {
        const initPdf = async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
                const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
                setPdfDoc(pdf);
                setNumPages(pdf.numPages);
            } catch (error) {
                console.error("PDF loading failed:", error);
            } finally {
                setLoading(false);
            }
        };
        initPdf();
    }, [pdfUrl]);

    const ensureAudio = useCallback(() => {
        if (!audioCtxRef.current) {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioCtxRef.current = ctx;
            flipBufferRef.current = createPageFlipSound(ctx);
        }
    }, []);

    const handleFlip = useCallback((e: any) => {
        setCurrentPage(e.data + 1);
        ensureAudio();
        if (!isMuted && audioCtxRef.current && flipBufferRef.current) {
            playFlipSound(audioCtxRef.current, flipBufferRef.current);
        }
    }, [isMuted, ensureAudio]);

    const zoomIn = () => setRenderScale(s => Math.min(s + 0.5, 4.0));
    const zoomOut = () => setRenderScale(s => Math.max(s - 0.5, 1.0));
    const goNext = () => flipBookRef.current?.pageFlip()?.flipNext();
    const goPrev = () => flipBookRef.current?.pageFlip()?.flipPrev();

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (loading) {
        return (
            <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(10,15,30,0.97)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)" }}>
                <Loader2 className="animate-spin" size={48} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>Kitob yuklanmoqda...</h3>
            </div>
        );
    }

    const tbBtn: React.CSSProperties = {
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "var(--text-primary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isMobile ? 34 : 36,
        height: isMobile ? 34 : 36,
        borderRadius: "10px",
        transition: "all 0.2s",
        padding: 0,
        flexShrink: 0,
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#0a0f1e", display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ========== HEADER TOOLBAR ========== */}
            <div style={{
                height: isMobile ? 48 : 52,
                padding: isMobile ? "0 0.5rem" : "0 1rem",
                background: "rgba(15,23,42,0.95)",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                zIndex: 10, gap: "0.4rem",
            }}>
                {/* Left: Brand + Sahifa */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: "0 1 auto" }}>
                    <span style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800, fontSize: isMobile ? "0.8rem" : "0.9rem", flexShrink: 0 }}>
                        {isMobile ? "Flipbook" : "Boshliq Flipbook"}
                    </span>
                    {!isMobile && (
                        <>
                            <span style={{ width: 1, height: 18, background: "rgba(255,255,255,0.12)", flexShrink: 0 }} />
                            <span style={{ fontSize: "0.8rem", color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 }}>{title}</span>
                        </>
                    )}
                </div>

                {/* Center: Page counter */}
                <div style={{ color: "#94a3b8", fontSize: isMobile ? "0.75rem" : "0.8rem", fontWeight: 600, flexShrink: 0, fontFamily: "monospace" }}>
                    {currentPage}<span style={{ color: "#475569" }}>/</span>{numPages}
                </div>

                {/* Right: Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.3rem" : "0.4rem", flexShrink: 0 }}>
                    <button onClick={zoomOut} style={tbBtn} title="Kichiklashtirish"><ZoomOut size={isMobile ? 14 : 16} /></button>
                    <button onClick={zoomIn} style={tbBtn} title="Kattalashtirish"><ZoomIn size={isMobile ? 14 : 16} /></button>

                    <button onClick={() => { ensureAudio(); setIsMuted(!isMuted); }} style={{ ...tbBtn, ...(isMuted ? { color: "#f87171" } : {}) }} title={isMuted ? "Ovozni yoqish" : "Ovozni o'chirish"}>
                        {isMuted ? <VolumeX size={isMobile ? 14 : 16} /> : <Volume2 size={isMobile ? 14 : 16} />}
                    </button>

                    <button onClick={onClose} style={{ ...tbBtn, background: "rgba(239,68,68,0.15)", borderColor: "rgba(239,68,68,0.25)", color: "#f87171" }} title="Yopish">
                        <X size={isMobile ? 16 : 18} />
                    </button>
                </div>
            </div>

            {/* ========== BOOK CONTAINER ========== */}
            <div style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "radial-gradient(ellipse at center, #1a1f35 0%, #0a0f1e 70%)",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Prev Button */}
                {!isMobile && (
                    <button onClick={goPrev} style={{ ...tbBtn, position: "absolute", left: 12, zIndex: 5, width: 42, height: 42, borderRadius: "50%" }}>
                        <ChevronLeft size={20} />
                    </button>
                )}

                {numPages > 0 && (
                    <FlipBook
                        ref={flipBookRef}
                        width={dimensions.w}
                        height={dimensions.h}
                        size="fixed"
                        maxShadowOpacity={0.5}
                        showCover={true}
                        mobileScrollSupport={true}
                        onFlip={handleFlip}
                        usePortrait={isMobile}
                        className="flip-book"
                        style={{ boxShadow: "0 20px 50px -10px rgba(0,0,0,0.5)" }}
                    >
                        {Array.from(new Array(numPages), (_, index) => (
                            <Page key={index} number={index + 1} pdfDoc={pdfDoc} currentPage={currentPage} renderScale={renderScale} />
                        ))}
                    </FlipBook>
                )}

                {/* Next Button */}
                {!isMobile && (
                    <button onClick={goNext} style={{ ...tbBtn, position: "absolute", right: 12, zIndex: 5, width: 42, height: 42, borderRadius: "50%" }}>
                        <ChevronRight size={20} />
                    </button>
                )}
            </div>

            {/* ========== BOTTOM BAR (desktop only) ========== */}
            {!isMobile && (
                <div style={{
                    height: 32, padding: "0 1.5rem",
                    background: "rgba(15,23,42,0.9)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem",
                    color: "#475569", fontSize: "0.72rem",
                }}>
                    <span>📖 Varaqlarni sichqoncha bilan o'giring</span>
                    <span style={{ color: "#334155" }}>|</span>
                    <span>Zoom: {Math.round(renderScale * 50)}%</span>
                    <span style={{ color: "#334155" }}>|</span>
                    <span>{isMuted ? "🔇 O'chirilgan" : "🔊 Yoqilgan"}</span>
                </div>
            )}

            <style dangerouslySetInnerHTML={{__html: `
                .stf__wrapper { border-radius: 4px; }
                .flip-book { margin: 0 auto; }
            `}} />
        </div>
    );
}
