"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function TelegramAlertBtn() {
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    const myToast = toast.loading("Hisobot to'planmoqda va Telegramga yuborilmoqda...");

    try {
      const res = await fetch("/api/telegram/send-alert", { method: "POST" });
      const data = await res.json();
      toast.dismiss(myToast);

      if (data.success) {
        if (data.status === "SENT") {
          toast.success("Hisobot Telegram botingizga muvaffaqiyatli yuborildi! 👔");
        } else {
          toast.success("Hisobot yuborish simulyatsiya qilindi! (Local loglarda chop etildi)");
        }
      } else {
        toast.error(data.error || "Xatolik yuz berdi");
      }
    } catch {
      toast.dismiss(myToast);
      toast.error("Tizim bilan ulanishda xatolik");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleSend}
      disabled={isSending}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.50rem",
        padding: "0.75rem 1.5rem",
        borderRadius: "12px",
        background: "linear-gradient(135deg, #0088cc, #00a2ed)",
        color: "#fff",
        border: "none",
        fontWeight: "700",
        fontSize: "0.9rem",
        cursor: "pointer",
        boxShadow: "0 4px 15px rgba(0, 136, 204, 0.4)",
        transition: "all 0.3s ease",
        transform: isSending ? "scale(0.98)" : "scale(1)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 136, 204, 0.6)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 15px rgba(0, 136, 204, 0.4)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={16} />}
      Tezkor Telegram Hisoboti 👔
    </button>
  );
}
