import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        if (!text || typeof text !== "string") {
            return NextResponse.json({ error: "Malumotlar yetarli emas." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("TTS Error: GEMINI_API_KEY is missing");
            return NextResponse.json({ error: "API Key sozlanmagan." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey });
        const modelName = "gemini-2.5-flash-lite";

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text }] }],
            config: {
                temperature: 0.4,
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Aoede"
                        }
                    }
                }
            }
        });

        const candidate = response.candidates?.[0];
        const part = candidate?.content?.parts?.[0];

        // inlineData.data might be a base64 string or a Buffer/Uint8Array depending on SDK version
        let audioData: any = null;
        let mimeType = "audio/wav";

        if (part?.inlineData) {
            audioData = part.inlineData.data;
            mimeType = part.inlineData.mimeType || "audio/wav";
        }

        if (!audioData) {
            throw new Error("Gemini TTS audio datasini qaytarmadi.");
        }

        // Convert whatever we got (base64 string or Uint8Array) to a Node Buffer
        const buffer = Buffer.isBuffer(audioData)
            ? audioData
            : typeof audioData === "string"
                ? Buffer.from(audioData, "base64")
                : Buffer.from(audioData);

        return new NextResponse(buffer as unknown as BodyInit, {
            status: 200,
            headers: {
                "Content-Type": mimeType,
                "Content-Length": buffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error("Gemini TTS Error:", error);
        return NextResponse.json(
            { error: error.message || "Gemini TTS serverida xatolik yuz berdi." },
            { status: 500 }
        );
    }
}

