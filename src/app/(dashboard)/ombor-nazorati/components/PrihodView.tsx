"use client";

import { useState, useEffect } from "react";
import { Plus, Search, CheckCircle2, X, PackageCheck, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { getPosProducts } from "../../pos-terminal/actions";
import { createInventoryDocument, completeDocument } from "../actions";
import styles from "../ombor-nazorati.module.css";

export default function PrihodView({ warehouses }: { warehouses: any[] }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [docNumber, setDocNumber] = useState(`PR-${Date.now()}`);
  const [destId, setDestId] = useState(warehouses[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPosProducts().then(res => { if (res.success) setProducts(res.products || []); });
  }, []);

  const addToDocument = (product: any) => {
    if (cart.find(c => c.id === product.id)) {
      toast.error("Bu mahsulot allaqachon qo'shilgan. Miqdorini o'zgartiring.");
      return;
    }
    setCart([...cart, { ...product, quantityChange: 1, incomingCostPrice: product.costPrice || 0 }]);
  };

  const updateCart = (id: string, field: string, value: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));

  const totalIncomingValue = cart.reduce((sum, item) => sum + (item.quantityChange * item.incomingCostPrice), 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error("Maxsulot qoshing!");
    setIsSubmitting(true);

    const res = await createInventoryDocument({
      type: "PRIHOD",
      documentNumber: docNumber,
      destId,
      items: cart.map(c => ({ productId: c.id, quantityChange: c.quantityChange, costPrice: c.incomingCostPrice }))
    });

    if (res.success && res.document) {
      const completeRes = await completeDocument(res.document.id);
      if (completeRes.success) {
         toast.success("Prihod muvaffaqiyatli saqlandi va ombor qoldig'i oshti!");
         setCart([]);
         setDocNumber(`PR-${Date.now()}`);
      } else {
         toast.error(completeRes.error);
      }
    } else {
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className={styles.prihodLayout}>
      {/* 1. DOCUMENT DETAILS & CART */}
      <div className={styles.prihodMain}>
         <div className={styles.docHeader}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div>
                 <h2 className={styles.docTitle}>
                   <Truck className={styles.docTitleIcon} size={28}/> Kirim Xujjati (Nakladnoy)
                 </h2>
                 <p className={styles.docDesc}>Yetkazib beruvchidan maxsulot qabul qilish jarayoni</p>
               </div>
               <div style={{ 
                 background: 'rgba(245, 158, 11, 0.1)', 
                 border: '1px solid rgba(245, 158, 11, 0.3)', 
                 color: '#f59e0b', 
                 padding: '8px 16px', 
                 borderRadius: '12px', 
                 fontSize: '0.8rem', 
                 fontWeight: 800, 
                 boxShadow: '0 0 15px rgba(245, 158, 11, 0.15)' 
               }}>
                 STATUS: QORALAMA
               </div>
             </div>
         </div>

         {/* Document Header Fields */}
         <div className={styles.docMetaGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Xujjat Raqami (Invoice №)</label>
              <input 
                 type="text" 
                 value={docNumber} 
                 onChange={e=>setDocNumber(e.target.value)} 
                 className={styles.inputField} 
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Qabul qiluvchi Ombor</label>
              <select 
                 value={destId} 
                 onChange={e=>setDestId(e.target.value)} 
                 className={styles.inputField}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
         </div>

         {/* Document Cart */}
         <div className={styles.cartContainer}>
            <div className={styles.cartTableWrapper}>
                <table className={styles.cartTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Maxsulot nomi</th>
                      <th style={{ textAlign: 'right' }}>Eski Tannarx</th>
                      <th className={styles.highlight} style={{ textAlign: 'center', width: '120px' }}>Yangi Tannarx</th>
                      <th className={styles.highlight} style={{ textAlign: 'center', width: '100px' }}>Kirim Soni</th>
                      <th style={{ textAlign: 'right' }}>Summa</th>
                      <th style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((c) => (
                      <tr key={c.id}>
                        <td>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                             <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#e2e8f0' }}>{c.name}</span>
                             <span style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.5)' }}>{c.barcode || c.sku}</span>
                           </div>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.7)', fontSize: '0.85rem' }}>
                           {c.avgCostPrice?.toLocaleString()}
                        </td>
                        <td>
                          <input 
                             type="number" 
                             value={c.incomingCostPrice} 
                             onChange={e => updateCart(c.id, "incomingCostPrice", parseFloat(e.target.value))} 
                             className={`${styles.cartInput} ${styles.cartInputPrice}`}
                          />
                        </td>
                        <td>
                          <input 
                             type="number" 
                             value={c.quantityChange} 
                             onChange={e => updateCart(c.id, "quantityChange", parseFloat(e.target.value))} 
                             className={styles.cartInput}
                          />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                           <span className={styles.cartRowTotal}>{(c.quantityChange * c.incomingCostPrice).toLocaleString()}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                           <button onClick={()=>removeFromCart(c.id)} className={styles.delBtn}>
                              <X size={18}/>
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {cart.length === 0 && (
                  <div className={styles.emptyCart}>
                     <PackageCheck size={56} className={styles.emptyIcon} />
                     <p className={styles.emptyText}>O'ng paneldan maxsulot izlab qo'shing</p>
                  </div>
                )}
            </div>
         </div>

         {/* Footer Checkout */}
         <div className={styles.checkoutFooter}>
            <div>
               <p className={styles.totalSummaryLabel}>Jami Nakladnoy Summasi</p>
               <h1 className={styles.totalSummaryValue}>
                 {totalIncomingValue.toLocaleString()} <span className={styles.totalSummaryUnit}>UZS</span>
               </h1>
            </div>
            <button 
               onClick={handleSubmit} 
               disabled={isSubmitting || cart.length === 0} 
               className={styles.submitBtn}
            >
               XUJJATNI O'TKAZISH (TASDIQLASH) <CheckCircle2 size={24}/>
            </button>
         </div>
      </div>

      {/* 2. CATALOG BROWSER */}
      <div className={styles.prihodSidebar}>
         <div className={styles.browserSearch}>
            <Search className={styles.searchIcon} style={{ left: '40px' }} size={18} />
            <input 
               type="text" 
               placeholder="Maxsulot qidirish..." 
               value={search} 
               onChange={e=>setSearch(e.target.value)} 
               className={styles.searchInput} 
            />
         </div>
         <div className={styles.browserList}>
            {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search)).map(product => (
              <div 
                 key={product.id} 
                 className={styles.browserItem}
                 onClick={() => addToDocument(product)}
              >
                 <div className={styles.itemInfo}>
                   <h3 className={styles.itemName}>{product.name}</h3>
                   <div className={styles.itemTags}>
                      <span className={styles.itemTag}>{product.category}</span>
                      <span className={styles.itemPrice}>{product.avgCostPrice?.toLocaleString()} UZS (Tan)</span>
                   </div>
                 </div>
                 <Plus className={styles.addIcon} size={20} />
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
