import { useState, useEffect } from "react";
import { Search, Target, PlayCircle, StopCircle, PackageCheck, FileSignature, AlertOctagon, Sparkles, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { getPosProducts } from "../../pos-terminal/actions";
import { createInventoryDocument, completeDocument } from "../actions";
import ReactMarkdown from "react-markdown";
import styles from "../ombor-nazorati.module.css";

export default function StocktakeView({ warehouses }: { warehouses: any[] }) {
  const [products, setProducts] = useState<any[]>([]);
  const [activeWarehouse, setActiveWarehouse] = useState(warehouses[0]?.id || "");
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Array of parsed products with an extra "countedQty" field.
  const [auditList, setAuditList] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  // AI Modal States
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiReport, setAiReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    getPosProducts().then(res => { 
        if (res.success) {
            setProducts(res.products || []);
        }
    });
  }, []);

  const startAudit = () => {
     setIsAuditing(true);
     setAuditList(products.map(p => ({
         id: p.id,
         name: p.name,
         sku: p.sku,
         category: p.category,
         expectedQty: p.quantity,
         countedQty: "" // Empty so cashier must actually count
     })));
  };

  const updateCount = (id: string, qty: string) => {
      setAuditList(auditList.map(a => a.id === id ? { ...a, countedQty: qty } : a));
  };

  const submitAudit = async () => {
       const missingCounts = auditList.filter(a => a.countedQty === "");
       if (missingCounts.length > 0) {
           return toast.error(`${missingCounts.length} ta Tovar sanalmadi. Iltimos barchasini kiriting (yo'q bo'lsa 0)`);
       }

       const adjustments = auditList.map(a => {
           const counted = parseFloat(a.countedQty);
           const diff = counted - a.expectedQty;
           return {
               productId: a.id,
               expectedQty: a.expectedQty,
               countedQty: counted,
               quantityChange: diff, // The adjustment needed
           };
       });

       toast.loading("Audit natijalari tahlil qilinmoqda...");

       const res = await createInventoryDocument({
           type: "INVENTARIZASIYA",
           documentNumber: `AUDIT-${Date.now()}`,
           destId: activeWarehouse,
           items: adjustments
       });

       toast.dismiss();

       if (res.success && res.document) {
           const completion = await completeDocument(res.document.id);
           if (completion.success) {
               toast.success("Inventarizatsiya muvaffaqiyatli yakunlandi! Qoldiqlar to'g'irlandi.");
               
               // Trigger Gemini Audit Analysis
               setIsGenerating(true);
               setShowAiModal(true);
               setAiReport("Gemini AI ombordagi kamomad va yo'qotishlarni korxona xodimlari ko'rsatkichlari bilan solishtirib tahlil qilmoqda... Iltimos kuting...");
               
               try {
                   const aiRes = await fetch("/api/audit-analyze", {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ adjustments })
                   });
                   const aiData = await aiRes.json();
                   if (aiData.success && aiData.analysis) {
                       setAiReport(aiData.analysis);
                   } else {
                       setAiReport("AI tahlil hisobotini olishda muammo yuz berdi.");
                   }
               } catch (e) {
                   setAiReport("Tizimda tahlil olishda xatolik yuz berdi.");
               } finally {
                   setIsGenerating(false);
               }
           } else {
               toast.error("Audit DB ga tushdi, lekin tasdiqlanmadi (Spisaniya/Prihod jarayonida xato)");
           }
           setIsAuditing(false);
           getPosProducts().then(r => setProducts(r.products || [])); // refresh
       } else {
           toast.error(res.error);
       }
  };

  return (
    <div className={styles.stocktakeLayout}>
      {/* Header Info */}
      <div className={styles.stockHeader}>
          <div className={styles.stockTitleBox}>
              <h2 className={styles.docTitle}>
                 <Target className={styles.docTitleIcon} size={28} /> Inventarizatsiya (Sleplaya - Ko'r-ko'rona)
              </h2>
              <p className={styles.docDesc}>
                  Ombor qoldiqlarini aniq sanash. Jarayon boshlanganda tizimdagi raqamlar xodimlardan yashiriladi.
                  Yakunlangach, barcha "ortiqcha" yoki "kamomad"lar avtomatik hujjatlashtiriladi.
              </p>
          </div>
          
          <div className={styles.stockActions}>
              <select 
                 disabled={isAuditing} 
                 value={activeWarehouse} 
                 onChange={e=>setActiveWarehouse(e.target.value)} 
                 className={styles.stockSelect}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {!isAuditing ? (
                  <button onClick={startAudit} className={styles.btnStart}>
                      <PlayCircle size={20} /> Auditni Boshlash
                  </button>
              ) : (
                  <button onClick={()=>setIsAuditing(false)} className={styles.btnStop}>
                      <StopCircle size={20} /> To'xtatish
                  </button>
              )}
          </div>
      </div>

      {/* Main Area */}
      {!isAuditing ? (
          <div className={styles.stockEmpty}>
              <FileSignature size={80} className={styles.stockEmptyIcon} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e2e8f0' }}>Audit boshlanmadi</h3>
              <p style={{ marginTop: '12px', maxWidth: '400px', textAlign: 'center' }}>Boshqaruv elementidan omborni tanlab, 'Auditni Boshlash' tugmasini bosing. Jarayon vaqtida mahsulotlarning tizimdagi miqdori maxfiy tutiladi.</p>
          </div>
      ) : (
          <div className={styles.stockActiveArea}>
              <div className={styles.alertBanner}>
                  <AlertOctagon size={20} style={{ flexShrink: 0 }} />
                  <p>Diqqat: "Blind Audit" (Sleplaya) faollashdi. Qatorlarga haqiqiy ko'zingiz bilan sanagan raqamni aniq kiriting.</p>
                  
                  <div className={styles.alertBannerSearch}>
                      <Search size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}/>
                      <input 
                         type="text" 
                         placeholder="Ro'yxatdan qidirish..." 
                         value={search} 
                         onChange={e=>setSearch(e.target.value)} 
                         className={styles.alertSearchInput}
                      />
                  </div>
              </div>

              <div className={styles.gridContainer}>
                  {auditList.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.sku?.includes(search)).map((item) => (
                      <div key={item.id} className={`${styles.auditCard} ${item.countedQty !== "" ? styles.auditCardCounted : ''}`}>
                          <h4 className={styles.auditTitle}>{item.name}</h4>
                          <p className={styles.auditMeta}>{item.sku || "KOD YUQ"} | {item.category}</p>
                          
                          <div className={styles.auditInputBox}>
                              <label className={styles.auditInputLabel}>Haqiqiy Qoldiq (Sanalgan)</label>
                              <input 
                                 type="number" 
                                 value={item.countedQty} 
                                 onChange={e => updateCount(item.id, e.target.value)}
                                 placeholder="0"
                                 className={`${styles.auditInput} ${item.countedQty !== "" ? styles.auditInputCounted : ''}`}
                              />
                          </div>
                      </div>
                  ))}
              </div>

              <div className={styles.stockFooter}>
                  <div className={styles.progressText}>
                      Sanalgan Progress: 
                      <span className={styles.progressCount}>{auditList.filter(a=>a.countedQty !== "").length}</span> 
                      <span className={styles.progressTotal}>/ {auditList.length}</span>
                  </div>
                  <button onClick={submitAudit} className={styles.submitBtn}>
                       NATIJALARNI TIZIMGA KIRITISH <PackageCheck size={24} />
                  </button>
              </div>
          </div>
      )}

       {/* Premium AI Glassmorphic Modal */}
       {showAiModal && (
           <div style={{
               position: "fixed",
               top: 0,
               left: 0,
               right: 0,
               bottom: 0,
               background: "rgba(15, 23, 42, 0.8)",
               backdropFilter: "blur(16px)",
               display: "flex",
               alignItems: "center",
               justifyContent: "center",
               zIndex: 9999,
               padding: "2rem"
           }}>
               <div className="card" style={{
                   width: "100%",
                   maxWidth: "800px",
                   maxHeight: "85vh",
                   overflowY: "auto",
                   padding: "2.5rem",
                   position: "relative",
                   border: "1px solid rgba(255,255,255,0.08)",
                   background: "rgba(30, 41, 59, 0.95)",
                   boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
               }}>
                   <button
                       onClick={() => setShowAiModal(false)}
                       style={{
                           position: "absolute",
                           top: "1.5rem",
                           right: "1.5rem",
                           background: "rgba(255,255,255,0.05)",
                           border: "none",
                           borderRadius: "50%",
                           width: "36px",
                           height: "36px",
                           display: "flex",
                           alignItems: "center",
                           justifyContent: "center",
                           color: "#94a3b8",
                           cursor: "pointer",
                           transition: "all 0.2s"
                       }}
                   >
                       <X size={18} />
                   </button>

                   <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1rem" }}>
                       <div style={{ background: "rgba(239, 68, 68, 0.15)", padding: "0.5rem", borderRadius: "0.5rem" }}>
                           <Sparkles size={24} color="#ef4444" />
                       </div>
                       <div>
                           <h3 style={{ fontSize: "1.5rem", fontWeight: "800", color: "#fff", margin: 0 }}>Gemini AI Loss Prevention - Audit Tahlili 🚨</h3>
                           <p style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>Ombor kamomadlari va o'g'rilik xavflari diagnostikasi</p>
                       </div>
                   </div>

                   <div style={{ 
                       color: "#e2e8f0", 
                       fontSize: "0.95rem", 
                       lineHeight: "1.7", 
                       backgroundColor: "rgba(15,23,42,0.3)", 
                       padding: "1.5rem", 
                       borderRadius: "0.75rem",
                       border: "1px solid rgba(255,255,255,0.03)",
                       maxHeight: "50vh",
                       overflowY: "auto"
                   }}>
                       {isGenerating && (
                           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px", gap: "12px" }}>
                               <Loader2 size={36} className="animate-spin text-red-500" />
                               <p style={{ color: "#94a3b8", fontWeight: "600", fontSize: "0.9rem" }}>AI yo'qotishlar va kamomadlarni hisoblab fosh qilmoqda...</p>
                           </div>
                       )}
                       <div className="markdown-body">
                           <ReactMarkdown>{aiReport}</ReactMarkdown>
                       </div>
                   </div>

                   <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                       <button
                           onClick={() => setShowAiModal(false)}
                           style={{
                               padding: "0.6rem 1.5rem",
                               borderRadius: "0.5rem",
                               background: "rgba(255,255,255,0.05)",
                               color: "#fff",
                               border: "none",
                               fontWeight: "600",
                               cursor: "pointer"
                           }}
                       >
                           Tushundim, Yopish
                       </button>
                   </div>
               </div>
           </div>
       )}
    </div>
  );
}
