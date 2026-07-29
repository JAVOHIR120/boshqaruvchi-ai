"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";
import styles from "../employee.module.css";
import { Camera, CheckCircle, RefreshCw, AlertTriangle, Shield, Scan, Sun } from "lucide-react";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const REQUIRED_SAMPLES = 5;

type Step = "idle" | "loading" | "ready" | "scanning" | "success" | "error";
type LiveStatus = "no_face" | "too_small" | "too_many" | "low_confidence" | "ready" | "scanning";

export default function FaceIdEnrollCard({ userId, hasExistingFaceId, currentAvatar }: { userId: string; hasExistingFaceId: boolean; currentAvatar: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedAvatar, setSavedAvatar] = useState<string | null>(currentAvatar);
  const [isEnrolled, setIsEnrolled] = useState(hasExistingFaceId);
  const [sampleCount, setSampleCount] = useState(0);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("no_face");
  const [confidence, setConfidence] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [brightness, setBrightness] = useState(100);

  const LIVE_MESSAGES: Record<LiveStatus, { text: string; color: string; icon: string }> = {
    no_face: { text: "Yuz aniqlanmadi — kameraga to'g'ri qarang", color: "#ef4444", icon: "❌" },
    too_small: { text: "Juda uzoqsiz — kameraga yaqinroq keling", color: "#f59e0b", icon: "↗️" },
    too_many: { text: "Bir nechta yuz aniqlandi — faqat siz turishing kerak", color: "#f59e0b", icon: "👥" },
    low_confidence: { text: "Yorug'likni yaxshilang yoki burchakni to'g'rilang", color: "#f59e0b", icon: "💡" },
    ready: { text: "Yuz aniqlandi — Tasdiqlash tugmasini bosing", color: "#10b981", icon: "✅" },
    scanning: { text: "Skanerlanmoqda — qimirlamang...", color: "#3b82f6", icon: "🔄" },
  };

  const loadModels = useCallback(async () => {
    setStep("loading"); setProgress(10);
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); setProgress(40);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); setProgress(70);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); setProgress(90);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } });
      streamRef.current = stream;
      // Video element "loading" holatida yo'q — "ready" ga o'tgandan keyin useEffect ulanadi
      setProgress(100); setStep("ready");
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.name === "NotAllowedError" ? "Kameraga ruxsat berilmadi. Brauzerdagi kamera sozlamalarini tekshiring." : err.name === "NotFoundError" ? "Kamera topilmadi." : "AI modellarini yuklashda xatolik. Internetni tekshiring.");
    }
  }, []);

  // Stream ni video elementga ulash — step "ready" ga o'tganda
  useEffect(() => {
    if ((step === "ready" || step === "scanning") && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

  // === LIVE FACE DETECTION — real-time yuz kuzatuvi ===
  const startLiveDetection = useCallback(() => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

    liveIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || step === "scanning") return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // === BRIGHTNESS DETECTION ===
      try {
        const bCtx = document.createElement("canvas").getContext("2d")!;
        const sw = 80, sh = 60; // Kichik o'lchamda tezkor hisoblash
        bCtx.canvas.width = sw; bCtx.canvas.height = sh;
        bCtx.drawImage(video, 0, 0, sw, sh);
        const imgData = bCtx.getImageData(0, 0, sw, sh).data;
        let totalB = 0;
        for (let px = 0; px < imgData.length; px += 16) { // Har 4-pikselni tekshirish
          totalB += (imgData[px] * 0.299 + imgData[px+1] * 0.587 + imgData[px+2] * 0.114);
        }
        const avgB = totalB / (imgData.length / 16);
        setBrightness(Math.round(avgB));
        setIsDark(avgB < 60); // 60 dan past = qorong'u
      } catch {}

      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }));

        if (detections.length === 0) {
          setLiveStatus("no_face"); setConfidence(0); return;
        }
        if (detections.length > 1) {
          // Barcha yuzlarni qizil ramkada ko'rsatish
          detections.forEach(d => {
            const b = d.box;
            ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 3;
            ctx.strokeRect(b.x, b.y, b.width, b.height);
          });
          setLiveStatus("too_many"); return;
        }

        const det = detections[0];
        const box = det.box;
        const ratio = (box.width * box.height) / (video.videoWidth * video.videoHeight);
        const conf = Math.round(det.score * 100);
        setConfidence(conf);

        // Yuz ramkasini chizish
        const isGood = ratio >= 0.04 && conf >= 75;
        ctx.strokeStyle = isGood ? "#10b981" : "#f59e0b";
        ctx.lineWidth = 3;
        ctx.setLineDash(isGood ? [] : [8, 4]);
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.setLineDash([]);

        // Confidence badge
        ctx.fillStyle = isGood ? "rgba(16,185,129,0.85)" : "rgba(245,158,11,0.85)";
        const badgeW = 70, badgeH = 22;
        ctx.fillRect(box.x, box.y - badgeH - 4, badgeW, badgeH);
        ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif";
        ctx.fillText(`${conf}%`, box.x + 6, box.y - 9);

        // Landmarks (yuz nuqtalari)
        if (isGood) {
          const landmarks = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.7 })).withFaceLandmarks();
          if (landmarks) {
            const pts = landmarks.landmarks.positions;
            ctx.fillStyle = "rgba(16,185,129,0.6)";
            pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill(); });
          }
        }

        if (ratio < 0.04) { setLiveStatus("too_small"); }
        else if (conf < 75) { setLiveStatus("low_confidence"); }
        else { setLiveStatus("ready"); }
      } catch { /* skip */ }
    }, 500);
  }, [step]);

  // Video play bolganda live detection boshlash
  const handleVideoPlay = useCallback(() => { startLiveDetection(); }, [startLiveDetection]);

  const stopCamera = () => {
    if (liveIntervalRef.current) { clearInterval(liveIntervalRef.current); liveIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  // === 5-SAMPLE ENROLLMENT ===
  const handleRegister = async () => {
    if (!videoRef.current || liveStatus !== "ready") {
      toast.error("Yuzingiz to'g'ri aniqlangunicha kutib turing.");
      return;
    }
    setStep("scanning"); setSampleCount(0);
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);

    const SAMPLE_TIMEOUT = 8000; // Har bir sample uchun 8 soniya
    const MAX_RETRIES = 3;       // Har sample uchun 3 urinish

    try {
      const descriptors: Float32Array[] = [];
      let bestAvatar = ""; let bestConf = 0;

      for (let i = 0; i < REQUIRED_SAMPLES; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500));

        let det: any = null;
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          // Timeout bilan detect qilish
          const detectPromise = faceapi.detectSingleFace(
            videoRef.current!, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
          ).withFaceLandmarks().withFaceDescriptor();

          const timeoutPromise = new Promise<null>(r => setTimeout(() => r(null), SAMPLE_TIMEOUT));
          det = await Promise.race([detectPromise, timeoutPromise]);

          if (det) break;
          // Agar topilmasa, 300ms kutib qayta urinish
          await new Promise(r => setTimeout(r, 300));
        }

        if (!det) {
          toast.error(`${i+1}-sample: Yuz aniqlanmadi (3 urinishdan keyin). Yuzingiz kameraga to'g'ri qarasin.`);
          setStep("ready"); setSampleCount(0); startLiveDetection();
          return;
        }

        descriptors.push(det.descriptor);
        setSampleCount(i + 1);

        if (det.detection.score > bestConf) {
          bestConf = det.detection.score;
          const c = document.createElement("canvas");
          c.width = videoRef.current!.videoWidth;
          c.height = videoRef.current!.videoHeight;
          c.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
          bestAvatar = c.toDataURL("image/jpeg", 0.85);
        }
      }

      // O'rtacha descriptor
      const avg = new Float32Array(128);
      for (let j = 0; j < 128; j++) { let s = 0; for (const d of descriptors) s += d[j]; avg[j] = s / descriptors.length; }

      // Descriptorlar konsistentligini tekshirish
      for (const d of descriptors) {
        if (faceapi.euclideanDistance(d, avg) > 0.3) {
          toast.error("Samplelar orasida har xil yuzlar aniqlandi. Qayta urinib ko'ring."); setStep("ready"); setSampleCount(0); startLiveDetection(); return;
        }
      }

      const res = await fetch("/api/face-id/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, faceDescriptor: Array.from(avg), avatarBase64: bestAvatar }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Server xatosi");

      stopCamera(); setSavedAvatar(bestAvatar); setIsEnrolled(true); setStep("success");
      toast.success("Face ID yuqori aniqlikda saqlandi!");
    } catch (error: any) {
      toast.error(error.message || "Xatolik"); setStep("ready"); setSampleCount(0); startLiveDetection();
    }
  };

  // ================= RENDER =================
  const liveMsg = LIVE_MESSAGES[liveStatus];

  if (step === "idle") {
    return (
      <div className={styles.card} style={{ marginTop: "1.5rem", background: "linear-gradient(145deg, rgba(16,185,129,0.05), rgba(16,185,129,0.02))", border: "1px solid rgba(16,185,129,0.2)" }}>
        <h3 className={styles.cardTitle} style={{ marginBottom: "1rem" }}>
          <div style={{ padding: "8px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", color: "#10b981" }}><Shield size={20} /></div>
          Face ID — Biometrik Tasdiq
        </h3>
        {isEnrolled ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(16,185,129,0.4)", boxShadow: "0 0 20px rgba(16,185,129,0.15)", flexShrink: 0, background: "rgba(0,0,0,0.2)" }}>
              {savedAvatar ? <img src={savedAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>👤</div>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}><CheckCircle size={18} color="#10b981" /><span style={{ fontWeight: "700", color: "#10b981" }}>Face ID Tasdiqlangan</span></div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>Yuzingiz 5 ta burchakdan skanerlanib, biometrik profil yaratilgan.</p>
            </div>
            <button onClick={loadModels} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}><RefreshCw size={15} /> Qayta o'rnatish</button>
          </div>
        ) : (
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "1.25rem" }}>Tizim yuzingizni 5 ta burchakdan skanerlab, yuqori aniqlikdagi biometrik profil yaratadi.</p>
            <button onClick={loadModels} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.75rem 1.75rem", background: "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))", color: "#fff", borderRadius: "var(--radius-md)", fontWeight: "700", fontSize: "0.95rem", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(16,185,129,0.35)" }}><Camera size={18} /> Face ID O'rnatish</button>
          </div>
        )}
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className={styles.card} style={{ marginTop: "1.5rem", border: "1px solid rgba(16,185,129,0.2)" }}>
        <h3 className={styles.cardTitle}><div style={{ padding: "8px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", color: "#10b981" }}><Shield size={20} /></div>AI Modellari Yuklanmoqda</h3>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2.5rem 0" }}>
          <div style={{ width: "52px", height: "52px", border: "4px solid rgba(16,185,129,0.2)", borderTop: "4px solid #10b981", borderRadius: "50%", animation: "fid-spin 1s linear infinite" }} />
          <p style={{ fontWeight: "600", color: "var(--text-primary)" }}>AI modellari va kamera tayyorlanmoqda...</p>
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "99px", transition: "width 0.4s" }} />
            </div>
            <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>{progress}%</p>
          </div>
        </div>
        <style>{`@keyframes fid-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className={styles.card} style={{ marginTop: "1.5rem", border: "1px solid rgba(239,68,68,0.2)" }}>
        <h3 className={styles.cardTitle}><div style={{ padding: "8px", background: "rgba(239,68,68,0.1)", borderRadius: "8px", color: "#ef4444" }}><AlertTriangle size={20} /></div>Xatolik</h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: "1.6" }}>{errorMsg}</p>
        <button onClick={() => setStep("idle")} style={{ padding: "0.6rem 1.5rem", background: "rgba(255,255,255,0.08)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}>Ortga</button>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className={styles.card} style={{ marginTop: "1.5rem", border: "1px solid rgba(16,185,129,0.25)", background: "linear-gradient(145deg, rgba(16,185,129,0.06), rgba(16,185,129,0.02))" }}>
        <h3 className={styles.cardTitle}><div style={{ padding: "8px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", color: "#10b981" }}><Shield size={20} /></div>Face ID Saqlandi!</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
          {savedAvatar && <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(16,185,129,0.4)", boxShadow: "0 0 30px rgba(16,185,129,0.2)", flexShrink: 0 }}><img src={savedAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}><CheckCircle size={20} color="#10b981" /><span style={{ fontWeight: "700", color: "#10b981", fontSize: "1.1rem" }}>Muvaffaqiyatli!</span></div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: "1.6" }}>5 ta sample dan o'rtacha biometrik profil yaratildi. Kioskda avtomatik tanilasiz.</p>
          </div>
        </div>
        <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem" }}>
          <button onClick={() => setStep("idle")} style={{ padding: "0.6rem 1.25rem", background: "rgba(255,255,255,0.08)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}>Yopish</button>
          <button onClick={() => { setIsEnrolled(false); loadModels(); }} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem 1.25rem", background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}><RefreshCw size={14} /> Qayta</button>
        </div>
      </div>
    );
  }

  // ======= READY / SCANNING — LIVE CAMERA =======
  return (
    <>
    {/* === FULL-SCREEN LIGHT OVERLAY === */}
    {isDark && (
      <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(255,255,255,0.92)", pointerEvents: "none", animation: "fid-screenlight 3s ease-in-out infinite alternate" }} />
    )}
    <div className={styles.card} style={{ marginTop: "1.5rem", border: "1px solid rgba(16,185,129,0.2)", padding: "1.5rem", position: "relative", zIndex: isDark ? 9999 : "auto" }}>
      <h3 className={styles.cardTitle} style={{ marginBottom: "1rem" }}>
        <div style={{ padding: "8px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", color: "#10b981" }}><Scan size={20} /></div>
        Face ID — Live Kamera {step === "scanning" && `(${sampleCount}/${REQUIRED_SAMPLES})`}
      </h3>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* === LIVE STATUS BAR === */}
        <div style={{ width: "100%", maxWidth: "560px", marginBottom: "0.75rem", padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", background: `${liveMsg.color}15`, border: `1px solid ${liveMsg.color}30`, display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.3s" }}>
          <span style={{ fontSize: "1.1rem" }}>{liveMsg.icon}</span>
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: liveMsg.color, flex: 1 }}>{liveMsg.text}</span>
          {confidence > 0 && liveStatus !== "no_face" && (
            <span style={{ fontSize: "0.78rem", fontWeight: "700", color: liveMsg.color, background: `${liveMsg.color}20`, padding: "2px 10px", borderRadius: "99px" }}>{confidence}%</span>
          )}
        </div>

        {/* === BRIGHT LIGHT PANELS (Kuchli yorug'lik) === */}
        {isDark && (
          <div style={{ background: "#ffffff", padding: "3.5rem 2rem", borderRadius: "var(--radius-lg)", marginBottom: "0.5rem", width: "100%", maxWidth: "700px", display: "flex", justifyContent: "center", alignItems: "center", boxShadow: "0 0 150px 80px rgba(255,255,255,0.7), 0 0 300px 150px rgba(255,255,255,0.3)", animation: "fid-glow 2s ease-in-out infinite alternate" }}>
            <span style={{ color: "#78716c", fontSize: "0.85rem", fontWeight: "600" }}>☀️ Yorug'lik rejimi — yuzingizni yoritmoqda</span>
          </div>
        )}

        {/* === VIDEO + CANVAS OVERLAY === */}
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: `3px solid ${isDark ? "#fff" : (liveStatus === "ready" ? "rgba(16,185,129,0.4)" : liveStatus === "no_face" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)")}`, boxShadow: isDark ? "0 0 120px 60px rgba(255,255,255,0.5)" : (liveStatus === "ready" ? "0 0 40px -10px rgba(16,185,129,0.25)" : "none"), marginBottom: "1rem", width: "100%", maxWidth: "560px", transition: "border-color 0.3s, box-shadow 0.5s" }}>
          <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} style={{ width: "100%", height: "auto", display: "block", transform: "scaleX(-1)", minHeight: "300px", background: "#0b0f19", filter: isDark ? "brightness(2.0) contrast(1.1)" : "none" }} />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", transform: "scaleX(-1)" }} />

          {/* Brightness indicator */}
          <div style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "0.25rem 0.6rem", borderRadius: "99px", display: "flex", alignItems: "center", gap: "0.3rem", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.1)"}` }}>
            <Sun size={12} color={isDark ? "#f59e0b" : "#94a3b8"} />
            <span style={{ fontSize: "0.65rem", fontWeight: "600", color: isDark ? "#f59e0b" : "#94a3b8" }}>{brightness}</span>
          </div>

          {/* Scanning overlay */}
          {step === "scanning" && (
            <>
              <div style={{ position: "absolute", top: "0.5rem", left: "0.5rem", right: "0.5rem" }}>
                <div style={{ height: "4px", background: "rgba(0,0,0,0.5)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ width: `${(sampleCount/REQUIRED_SAMPLES)*100}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", transition: "width 0.3s", borderRadius: "99px" }} />
                </div>
              </div>
              <div style={{ position: "absolute", bottom: "0.75rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", padding: "0.4rem 1.25rem", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "700", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", animation: "fid-pulse 1s ease-in-out infinite" }} />
                Skanerlanmoqda {sampleCount}/{REQUIRED_SAMPLES}
              </div>
            </>
          )}
        </div>

        {/* === TUGMALAR === */}
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button onClick={() => { stopCamera(); setStep("idle"); setSampleCount(0); }} style={{ padding: "0.7rem 1.5rem", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer", fontSize: "0.9rem" }}>Bekor qilish</button>
          <button onClick={handleRegister} disabled={step === "scanning" || liveStatus !== "ready"} style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.7rem 2rem",
            background: (step === "scanning" || liveStatus !== "ready") ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))",
            color: (step === "scanning" || liveStatus !== "ready") ? "var(--text-muted)" : "#fff",
            borderRadius: "var(--radius-md)", fontWeight: "700", fontSize: "0.92rem",
            border: (step === "scanning" || liveStatus !== "ready") ? "1px solid rgba(255,255,255,0.08)" : "none",
            cursor: (step === "scanning" || liveStatus !== "ready") ? "not-allowed" : "pointer",
            boxShadow: (step === "scanning" || liveStatus !== "ready") ? "none" : "0 4px 16px rgba(16,185,129,0.35)",
          }}>
            {step === "scanning" ? `Skanerlanmoqda... (${sampleCount}/${REQUIRED_SAMPLES})` : liveStatus !== "ready" ? "Yuz aniqlanishini kuting..." : "📷 Tasdiqlash (5 sample)"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fid-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        @keyframes fid-pulse{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes fid-glow{0%{box-shadow:0 0 150px 80px rgba(255,255,255,0.7), 0 0 300px 150px rgba(255,255,255,0.3)}100%{box-shadow:0 0 200px 100px rgba(255,255,255,0.8), 0 0 400px 200px rgba(255,255,255,0.4)}}
        @keyframes fid-screenlight{0%{background:rgba(255,255,255,0.88)}100%{background:rgba(255,255,255,0.95)}}
      `}</style>
    </div>
    </>
  );
}
