"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import toast from "react-hot-toast";
import styles from "../employee.module.css";
import { Camera, CheckCircle, RefreshCw, AlertTriangle, Scan, Sun, MapPin, Clock } from "lucide-react";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";

type Step = "idle" | "loading" | "ready" | "scanning" | "success" | "error";
type LiveStatus = "no_face" | "too_small" | "too_many" | "ready" | "scanning";

export default function FaceIdCheckCard({ user, todayRecord }: { user: any, todayRecord: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<Step>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("no_face");
  const [isDark, setIsDark] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const hasCheckedIn = todayRecord && todayRecord.checkIn;
  const hasCheckedOut = todayRecord && todayRecord.checkOut;

  const LIVE_MESSAGES: Record<LiveStatus, { text: string; color: string; icon: string }> = {
    no_face: { text: "Yuz aniqlanmadi — kameraga qarang", color: "#ef4444", icon: "❌" },
    too_small: { text: "Juda uzoqsiz — yaqinroq keling", color: "#f59e0b", icon: "↗️" },
    too_many: { text: "Faqat siz turishingiz kerak", color: "#f59e0b", icon: "👥" },
    ready: { text: "Yuz aniqlandi — Tasdiqlanmoqda...", color: "#10b981", icon: "✅" },
    scanning: { text: "Skanerlanmoqda...", color: "#3b82f6", icon: "🔄" },
  };

  const loadModels = useCallback(async () => {
    if (!user?.employeeProfile?.faceDescriptor) {
      toast.error("Face ID o'rnatilmagan! Avval sozlamalardan o'rnating.");
      return;
    }

    setStep("loading"); setProgress(10);
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); setProgress(40);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL); setProgress(70);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL); setProgress(90);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" } });
      streamRef.current = stream;
      setProgress(100); setStep("ready");
    } catch (err: any) {
      setStep("error");
      setErrorMsg(err.name === "NotAllowedError" ? "Kameraga ruxsat berilmadi." : "AI modellarini yuklashda xatolik.");
    }
  }, [user]);

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

  const stopCamera = () => {
    if (liveIntervalRef.current) { clearInterval(liveIntervalRef.current); liveIntervalRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

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

      // Brightness
      try {
        const bC = document.createElement("canvas"); bC.width = 80; bC.height = 60;
        bC.getContext("2d")!.drawImage(video, 0, 0, 80, 60);
        const px = bC.getContext("2d")!.getImageData(0, 0, 80, 60).data;
        let t = 0; for (let i = 0; i < px.length; i += 16) t += px[i]*0.299 + px[i+1]*0.587 + px[i+2]*0.114;
        setIsDark(t / (px.length / 16) < 60);
      } catch {}

      try {
        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks()
          .withFaceDescriptors();

        if (detections.length === 0) { setLiveStatus("no_face"); return; }
        if (detections.length > 1) { setLiveStatus("too_many"); return; }

        const det = detections[0];
        const box = det.detection.box;
        const ratio = (box.width * box.height) / (video.videoWidth * video.videoHeight);
        setConfidence(Math.round(det.detection.score * 100));

        ctx.strokeStyle = "#10b981"; ctx.lineWidth = 3;
        ctx.strokeRect(box.x, box.y, box.width, box.height);

        if (ratio < 0.04) { setLiveStatus("too_small"); return; }
        
        setLiveStatus("ready");

        // MATCHING
        const savedDescriptor = new Float32Array(JSON.parse(user.employeeProfile.faceDescriptor));
        const distance = faceapi.euclideanDistance(det.descriptor, savedDescriptor);

        if (distance <= 0.38) { // 38% threshold for exact match
            setStep("scanning");
            clearInterval(liveIntervalRef.current!);
            
            // Capture photo
            const c = document.createElement("canvas");
            c.width = video.videoWidth; c.height = video.videoHeight;
            c.getContext("2d")!.drawImage(video, 0, 0);
            const photoUrl = c.toDataURL("image/jpeg", 0.85);

            // API ga jo'natish (AUTO)
            try {
              const res = await fetch("/api/face-id/check", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ employeeId: user.employeeProfile.id, type: "AUTO", photoUrl })
              });
              const data = await res.json();
              if (data.success) {
                  stopCamera();
                  toast.success(data.message || "Davomat muvaffaqiyatli saqlandi!");
                  setTimeout(() => window.location.reload(), 1500);
              } else {
                  toast.error(data.error || "Xatolik");
                  setStep("ready"); startLiveDetection();
              }
            } catch {
              toast.error("Tarmoq xatosi");
              setStep("ready"); startLiveDetection();
            }
        } else {
            ctx.strokeStyle = "#ef4444";
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            toast.error("Yuz mos kelmadi! Sizning profilingiz emas.", { id: "nomatch" });
        }

      } catch { /* skip */ }
    }, 600);
  }, [step, user]);

  const handleVideoPlay = useCallback(() => { startLiveDetection(); }, [startLiveDetection]);

  const liveMsg = LIVE_MESSAGES[liveStatus];

  return (
    <div className={styles.card} style={{ marginTop: "1.5rem", marginBottom: "1.5rem", background: "linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
            <h3 className={styles.cardTitle} style={{ marginBottom: "0.5rem" }}>
                <Scan size={22} color="#10b981" />
                Face ID orqali Davomat
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "500px", lineHeight: "1.5" }}>
                Ishga kelganingizda yoki ketayotganingizda yuzingizni skanerlab davomatni qayd eting.
            </p>
        </div>
      </div>

      {step === "idle" && (
        <div style={{ marginTop: "1.5rem" }}>
            {hasCheckedIn && hasCheckedOut ? (
                <div style={{ padding: "1rem", background: "rgba(16,185,129,0.1)", color: "#10b981", borderRadius: "var(--radius-md)", fontWeight: "600", display: "inline-block" }}>
                    ✅ Bugungi ish kunini yakunladingiz.
                </div>
            ) : (
                <button onClick={loadModels} style={{ padding: "0.8rem 2rem", background: "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))", color: "white", borderRadius: "var(--radius-md)", fontWeight: "700", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(16,185,129,0.3)" }}>
                    {hasCheckedIn ? "🏃‍♂️ Ishdan ketish (Face ID)" : "👋 Ishga kelish (Face ID)"}
                </button>
            )}
        </div>
      )}

      {step === "loading" && (
        <div style={{ marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "30px", height: "30px", border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <span style={{ fontWeight: "600" }}>Kamera ishga tushmoqda... {progress}%</span>
        </div>
      )}

      {(step === "ready" || step === "scanning") && (
        <div style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {isDark && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(255,255,255,0.92)", pointerEvents: "none", animation: "fid-screenlight 3s ease-in-out infinite alternate" }} />
            )}
            
            <div style={{ width: "100%", maxWidth: "500px", marginBottom: "0.75rem", padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", background: `${liveMsg.color}15`, border: `1px solid ${liveMsg.color}30`, display: "flex", alignItems: "center", gap: "0.5rem", position: "relative", zIndex: isDark ? 9999 : "auto" }}>
                <span style={{ fontSize: "1.1rem" }}>{liveMsg.icon}</span>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: liveMsg.color, flex: 1 }}>{liveMsg.text}</span>
            </div>

            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: `3px solid ${isDark ? "#fff" : "rgba(16,185,129,0.4)"}`, boxShadow: isDark ? "0 0 120px 60px rgba(255,255,255,0.5)" : "0 0 40px -10px rgba(16,185,129,0.25)", width: "100%", maxWidth: "500px", zIndex: isDark ? 9999 : "auto" }}>
                <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} style={{ width: "100%", height: "auto", display: "block", transform: "scaleX(-1)", filter: isDark ? "brightness(2.0) contrast(1.1)" : "none" }} />
                <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", transform: "scaleX(-1)" }} />
                
                {step === "scanning" && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
                        <div style={{ background: "rgba(0,0,0,0.8)", padding: "1rem 2rem", borderRadius: "var(--radius-full)", color: "#10b981", fontWeight: "700", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981", animation: "pulse 1s infinite" }} />
                            Tasdiqlanmoqda...
                        </div>
                    </div>
                )}
            </div>
            
            <button onClick={() => { stopCamera(); setStep("idle"); }} style={{ marginTop: "1rem", padding: "0.6rem 1.5rem", background: "rgba(255,255,255,0.05)", color: "var(--text-secondary)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer", zIndex: isDark ? 9999 : "auto", position: "relative" }}>
                Bekor qilish
            </button>
        </div>
      )}
    </div>
  );
}
