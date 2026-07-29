"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as faceapi from "face-api.js";
import { toast } from "react-hot-toast";

const MODEL_URL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights";
const REQUIRED_SAMPLES = 5;

type FaceIdStep = "idle" | "loading" | "ready" | "scanning" | "success" | "error";

export default function FaceIdClient({ userId }: { userId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<FaceIdStep>("idle");
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null);
  const [sampleCount, setSampleCount] = useState(0);

  const loadModels = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if ((step === "ready" || step === "scanning") && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      videoRef.current.play().catch(() => {});
    }
  }, [step]);

  useEffect(() => {
    loadModels();
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); };
  }, [loadModels]);

  const handleRegister = async () => {
    if (!videoRef.current) return;
    setStep("scanning"); setSampleCount(0);
    try {
      const descriptors: Float32Array[] = [];
      let bestAvatar = ""; let bestConf = 0;

      for (let i = 0; i < REQUIRED_SAMPLES; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 500));

        let det: any = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          const dp = faceapi.detectSingleFace(videoRef.current!, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })).withFaceLandmarks().withFaceDescriptor();
          det = await Promise.race([dp, new Promise<null>(r => setTimeout(() => r(null), 8000))]);
          if (det) break;
          await new Promise(r => setTimeout(r, 300));
        }

        if (!det) { toast.error(`${i+1}-sample: Yuz aniqlanmadi.`); setStep("ready"); setSampleCount(0); return; }
        descriptors.push(det.descriptor);
        setSampleCount(i + 1);
        if (det.detection.score > bestConf) {
          bestConf = det.detection.score;
          const c = document.createElement("canvas");
          c.width = videoRef.current!.videoWidth; c.height = videoRef.current!.videoHeight;
          c.getContext("2d")!.drawImage(videoRef.current!, 0, 0);
          bestAvatar = c.toDataURL("image/jpeg", 0.85);
        }
      }

      const avg = new Float32Array(128);
      for (let j = 0; j < 128; j++) { let s = 0; for (const d of descriptors) s += d[j]; avg[j] = s / descriptors.length; }

      for (const d of descriptors) {
        if (faceapi.euclideanDistance(d, avg) > 0.3) {
          toast.error("Har xil yuzlar aniqlandi. Faqat bitta odam tursin."); setStep("ready"); setSampleCount(0); return;
        }
      }

      const res = await fetch("/api/face-id/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, faceDescriptor: Array.from(avg), avatarBase64: bestAvatar }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Server xatosi");

      setSavedAvatar(bestAvatar); setStep("success");
      toast.success("Face ID yuqori aniqlikda saqlandi!");
    } catch (error: any) {
      toast.error(error.message || "Xatolik"); setStep("ready"); setSampleCount(0);
    }
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "700", marginBottom: "0.5rem", background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Face ID O'rnatish (5 nuqtali aniqlik)</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "600px", lineHeight: "1.6" }}>Yuzingiz 5 ta burchakdan skanerlanib, o'rtacha biometrik profil yaratiladi.</p>
      </div>
      <div className="card" style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
        {step === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", padding: "2rem 0" }}>
            <div style={{ width: "56px", height: "56px", border: "4px solid rgba(16,185,129,0.2)", borderTop: "4px solid #10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <p style={{ fontWeight: "600" }}>AI modellari yuklanmoqda...</p>
            <div style={{ width: "100%", maxWidth: "320px" }}>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: "var(--radius-full)", transition: "width 0.5s" }} />
              </div>
            </div>
          </div>
        )}
        {step === "error" && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ color: "#ef4444", fontWeight: "600", marginBottom: "1rem" }}>{errorMsg}</p>
            <button onClick={() => { setStep("idle"); loadModels(); }} style={{ padding: "0.6rem 1.5rem", background: "rgba(255,255,255,0.08)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}>Qayta urinish</button>
          </div>
        )}
        {(step === "ready" || step === "scanning") && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
            <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", border: "3px solid rgba(16,185,129,0.25)", boxShadow: "0 0 40px -12px rgba(16,185,129,0.2)", marginBottom: "1.5rem", width: "100%", maxWidth: "500px" }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "auto", display: "block", transform: "scaleX(-1)" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <div style={{ position: "absolute", top: "12%", left: "15%", right: "15%", bottom: "12%", border: "2px dashed rgba(16,185,129,0.4)", borderRadius: "50%", animation: step === "scanning" ? "pulse 1.5s ease-in-out infinite" : "none" }} />
              </div>
              {step === "scanning" && (
                <>
                  <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", right: "0.75rem" }}>
                    <div style={{ height: "4px", background: "rgba(0,0,0,0.5)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                      <div style={{ width: `${(sampleCount/REQUIRED_SAMPLES)*100}%`, height: "100%", background: "#10b981", transition: "width 0.3s" }} />
                    </div>
                  </div>
                  <div style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.7)", padding: "0.4rem 1rem", borderRadius: "var(--radius-full)", fontSize: "0.8rem", fontWeight: "700", color: "#10b981" }}>
                    {sampleCount}/{REQUIRED_SAMPLES} sample
                  </div>
                </>
              )}
            </div>
            <button onClick={handleRegister} disabled={step === "scanning"} style={{ padding: "0.85rem 2.5rem", background: step === "scanning" ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))", color: step === "scanning" ? "var(--text-muted)" : "#fff", borderRadius: "var(--radius-md)", fontWeight: "700", fontSize: "0.95rem", border: step === "scanning" ? "1px solid rgba(255,255,255,0.08)" : "none", cursor: step === "scanning" ? "not-allowed" : "pointer", boxShadow: step === "scanning" ? "none" : "0 4px 16px rgba(16,185,129,0.35)" }}>
              {step === "scanning" ? "Skanerlanmoqda..." : "📷 Boshlash (5 sample)"}
            </button>
          </div>
        )}
        {step === "success" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "2rem 0", textAlign: "center" }}>
            {savedAvatar && <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", border: "4px solid rgba(16,185,129,0.4)", boxShadow: "0 0 30px rgba(16,185,129,0.2)" }}><img src={savedAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
            <div><span style={{ fontSize: "1.5rem" }}>✅</span><h3 style={{ fontWeight: "700", fontSize: "1.2rem", color: "#10b981", display: "inline", marginLeft: "0.5rem" }}>Face ID Saqlandi!</h3></div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", maxWidth: "380px" }}>5 ta sample dan o'rtacha biometrik profil yaratildi.</p>
            <button onClick={() => { setSavedAvatar(null); setStep("ready"); setSampleCount(0); }} style={{ padding: "0.6rem 1.5rem", background: "rgba(255,255,255,0.08)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "var(--radius-md)", fontWeight: "600", cursor: "pointer" }}>Qayta o'rnatish</button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
