"use client";

import { useState } from "react";
import { Sparkles, BrainCircuit, Loader2, AlertTriangle, ChevronRight } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import toast from "react-hot-toast";
import styles from "../ombor-nazorati.module.css";

export default function InventoryAIView() {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const generateAnalysis = async () => {
        setIsLoading(true);
        setAnalysis(null);
        try {
            const res = await fetch("/api/inventory-ai", {
                method: "POST"
            });
            const data = await res.json();
            
            if (res.ok) {
                setAnalysis(data.reply);
                toast.success("AI tahlil yakunlandi!");
            } else {
                toast.error(data.error || "Tahlil qilishda xatolik");
            }
        } catch (error) {
            toast.error("Tarmoq xatosi");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Header Info */}
            <div className="p-8 border-b border-white/10 flex justify-between items-center glass-card-premium rounded-none bg-black/10 backdrop-blur-xl relative z-20">
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800 dark:text-white drop-shadow-sm">
                        <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                            <BrainCircuit className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" size={28} />
                        </div>
                        Boshqaruvchi AI — Tahlil
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 max-w-2xl font-medium">
                        Sun'iy intellekt ombordagi barcha xarakatlarni, defitsit xavfini va "qotib qolgan sarmoya" ni o'rganib chiqib, sizga aniq strategik maslahatlar beradi. 
                    </p>
                </div>
                
                <div>
                    <button 
                        onClick={generateAnalysis} 
                        disabled={isLoading}
                        className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-bold flex items-center gap-3 shadow-[0_5px_15px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(99,102,241,0.7)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 relative overflow-hidden group"
                    >
                        {isLoading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                        )}
                        <span className="relative z-10">{isLoading ? "Tahlil qilinmoqda..." : "Generatsiya Qilish"}</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-8 relative z-10 bg-black/5">
                {!analysis && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-3xl" />
                        <BrainCircuit size={100} className="opacity-10 mb-8 drop-shadow-lg" />
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-200 drop-shadow-sm mb-3">
                            AI Maslahatchi kutilmoqda
                        </h3>
                        <p className="max-w-md text-center font-medium leading-relaxed">
                            Yuqoridagi tugmani bosish orqali butun ombor bazasini Gemini 2.5 Pro yordamida chuqur tahlil qildiring.
                        </p>
                    </div>
                )}

                {isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-indigo-400">
                        <div className="relative">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                            <Loader2 size={64} className="animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </div>
                        <p className="mt-8 font-bold animate-pulse text-lg tracking-widest uppercase">
                            Neyron tarmoq ishlamoqda...
                        </p>
                        <p className="mt-2 text-sm text-slate-500 font-mono">
                            Defitsit va qoldiqlar tekshirilmoqda
                        </p>
                    </div>
                )}

                {analysis && !isLoading && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl p-8 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.15)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
                            
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
                                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                                    <Sparkles className="text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white tracking-tight">Strategik Hisobot</h3>
                                    <p className="text-xs text-slate-500 font-mono mt-1">Generated by Boshqaruvchi AI (Gemini 2.5 Pro)</p>
                                </div>
                            </div>

                            <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-xl prose-h2:text-indigo-300 prose-p:leading-relaxed prose-p:text-slate-300 prose-strong:text-white prose-li:text-slate-300">
                                <ReactMarkdown>{analysis}</ReactMarkdown>
                            </div>
                            
                            <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-amber-500/80 bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20">
                                    <AlertTriangle size={16} />
                                    <span className="font-medium">AI maslahatlari xulosa xarakteriga ega</span>
                                </div>
                                <button onClick={generateAnalysis} className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors">
                                    Qayta tahlil qilish <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
