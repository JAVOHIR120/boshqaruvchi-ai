"use client";

import { useState, useEffect } from "react";
import { Plus, Search, CheckCircle2, X, PackageCheck, ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";
import { getPosProducts } from "../../pos-terminal/actions";
import { createInventoryDocument, completeDocument } from "../actions";
import styles from "../ombor-nazorati.module.css";

export default function TransferView({ warehouses }: { warehouses: any[] }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [docNumber, setDocNumber] = useState(`TR-${Date.now()}`);
  const [originId, setOriginId] = useState(warehouses[0]?.id || "");
  const [destId, setDestId] = useState(warehouses[1]?.id || warehouses[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getPosProducts().then(res => { if (res.success) setProducts(res.products || []); });
  }, []);

  const addToDocument = (product: any) => {
    if (product.quantity <= 0) {
      toast.error("Ushbu mahsulot omborda mavjud emas!");
      return;
    }
    if (cart.find(c => c.id === product.id)) {
      toast.error("Bu mahsulot allaqachon qo'shilgan. Miqdorini o'zgartiring.");
      return;
    }
    setCart([...cart, { ...product, quantityChange: 1 }]);
  };

  const updateCart = (id: string, value: number) => {
    const product = products.find(p => p.id === id);
    if (product && value > product.quantity) {
      toast.error(`Omborda faqat ${product.quantity} ta mahsulot bor!`);
      value = product.quantity;
    }
    if (value < 1) value = 1;
    setCart(cart.map(c => c.id === id ? { ...c, quantityChange: value } : c));
  };

  const removeFromCart = (id: string) => setCart(cart.filter(c => c.id !== id));

  const totalTransferItems = cart.reduce((sum, item) => sum + item.quantityChange, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return toast.error("Ko'chirish uchun mahsulot qo'shing!");
    if (originId === destId) return toast.error("Chiquvchi va kiruvchi omborlar bir xil bo'lishi mumkin emas!");
    
    setIsSubmitting(true);

    const res = await createInventoryDocument({
      type: "TRANSFER",
      documentNumber: docNumber,
      originId,
      destId,
      items: cart.map(c => ({ 
        productId: c.id, 
        quantityChange: c.quantityChange, 
        costPrice: c.avgCostPrice || c.costPrice || 0 
      }))
    });

    if (res.success && res.document) {
      const completeRes = await completeDocument(res.document.id);
      if (completeRes.success) {
         toast.success("Ko'chirish muvaffaqiyatli yakunlandi! Tovar yangi omborga ko'chirildi.");
         setCart([]);
         setDocNumber(`TR-${Date.now()}`);
         // Refresh list
         getPosProducts().then(r => setProducts(r.products || []));
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
                   <ArrowRightLeft className={styles.docTitleIcon} size={28}/> Ko'chirish Hujjati (Peremesheniya)
                 </h2>
                 <p className={styles.docDesc}>Filiallararo yoki omborlararo tovarlarni xavfsiz ko'chirish</p>
               </div>
               <div style={{ 
                 background: 'rgba(59, 130, 246, 0.1)', 
                 border: '1px solid rgba(59, 130, 246, 0.3)', 
                 color: '#3b82f6', 
                 padding: '8px 16px', 
                 borderRadius: '12px', 
                 fontSize: '0.8rem', 
                 fontWeight: 800, 
                 boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)' 
               }}>
                 STATUS: TRANZIT
               </div>
             </div>
         </div>

         {/* Document Header Fields */}
         <div className={styles.docMetaGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Xujjat Raqami (Transfer №)</label>
              <input 
                 type="text" 
                 value={docNumber} 
                 onChange={e=>setDocNumber(e.target.value)} 
                 className={styles.inputField} 
                 style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Chiquvchi Ombor (Origin)</label>
              <select 
                 value={originId} 
                 onChange={e=>setOriginId(e.target.value)} 
                 className={styles.inputField}
              >
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Kiruvchi Ombor (Destination)</label>
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
                      <th style={{ width: '50%' }}>Maxsulot nomi</th>
                      <th style={{ textAlign: 'center' }}>Joriy Qoldiq</th>
                      <th className={styles.highlight} style={{ textAlign: 'center', width: '150px' }}>Ko'chirish Soni</th>
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
                        <td style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'rgba(148,163,184,0.7)', fontSize: '0.85rem' }}>
                           {c.quantity} {c.unit}
                        </td>
                        <td>
                          <input 
                             type="number" 
                             value={c.quantityChange} 
                             onChange={e => updateCart(c.id, parseFloat(e.target.value))} 
                             className={styles.cartInput}
                          />
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
                     <p className={styles.emptyText}>O'ng paneldan ko'chiriladigan maxsulotni tanlang</p>
                  </div>
                )}
            </div>
         </div>

         {/* Footer Checkout */}
         <div className={styles.checkoutFooter}>
            <div>
               <p className={styles.totalSummaryLabel}>Jami Ko'chirilayotgan tovarlar</p>
               <h1 className={styles.totalSummaryValue}>
                 {totalTransferItems.toLocaleString()} <span className={styles.totalSummaryUnit}>birlik</span>
               </h1>
            </div>
            <button 
               onClick={handleSubmit} 
               disabled={isSubmitting || cart.length === 0} 
               className={styles.submitBtn}
            >
               KO'CHIRISHNI YAKUNLASH <CheckCircle2 size={24}/>
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
                      <span className={styles.itemPrice}>Qoldiq: {product.quantity} {product.unit}</span>
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
