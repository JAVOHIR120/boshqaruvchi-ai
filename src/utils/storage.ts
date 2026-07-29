import fs from "fs";
import path from "path";

/**
 * Base64 formatidagi rasmni serverning `public/uploads` jildiga fayl sifatida saqlaydi
 * va qisqa URL (masalan: `/uploads/prefix-timestamp.jpg`) qaytaradi.
 * 
 * @param base64Str - Base64 formatidagi rasm matni
 * @param prefix - Fayl nomi uchun prefiks (masalan: "avatar", "check-in")
 * @returns Faylning brauzer orqali yuklanuvchi qisqa yo'li
 */
export async function saveBase64Image(base64Str: string, prefix: string): Promise<string> {
  if (!base64Str) return "";

  // Agar allaqachon URL manzil bo'lsa, qayta saqlamasdan o'zini qaytaramiz
  if (base64Str.startsWith("/uploads/") || base64Str.startsWith("http")) {
    return base64Str;
  }

  try {
    let mimeType = "image/jpeg";
    let base64Data = base64Str;

    // Data URI formatidan haqiqiy base64 qismini ajratib olish (data:image/png;base64,iVBOR...)
    if (base64Str.includes(";base64,")) {
      const parts = base64Str.split(";base64,");
      mimeType = parts[0].replace("data:", "");
      base64Data = parts[1];
    }

    // Fayl kengaytmasini aniqlash
    let ext = "jpg";
    if (mimeType.includes("png")) ext = "png";
    else if (mimeType.includes("webp")) ext = "webp";
    else if (mimeType.includes("gif")) ext = "gif";

    const buffer = Buffer.from(base64Data, "base64");
    const filename = `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}.${ext}`;
    
    // public/uploads jildini tekshirish va yaratish
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, buffer);

    return `/uploads/${filename}`;
  } catch (error) {
    console.error("Base64 rasmni saqlashda xatolik:", error);
    return base64Str; // Xatolik yuz bersa, bazada saqlanib qolishi uchun o'zini qaytaramiz (fallback)
  }
}
