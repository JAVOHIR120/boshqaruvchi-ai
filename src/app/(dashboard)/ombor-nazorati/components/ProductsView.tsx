"use client";

import { useState, useEffect } from "react";
import { Package, Search, Barcode, AlertTriangle, ArrowUpRight, Printer } from "lucide-react";
import { getPosProducts } from "../../pos-terminal/actions";
import styles from "../ombor-nazorati.module.css";

export default function ProductsView({ warehouses }: { warehouses: any[] }) {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getPosProducts().then(res => { if (res.success) setProducts(res.products || []); });
  }, []);

  const totalValue = products.reduce((acc, p) => acc + (p.quantity * (p.avgCostPrice || p.costPrice || 0)), 0);
  const totalItems = products.reduce((acc, p) => acc + p.quantity, 0);
  const lowStockProducts = products.filter(p => p.quantity <= (p.minQuantity || 5));

  return (
    <div className={styles.viewContainer}>
      
      {/* Top Dashboards */}
      <div className={styles.statsRow}>
          <div className={`${styles.statCard} ${styles.statCardPrimary}`}>
              <div className={styles.statInfo}>
                 <p className={styles.statLabel}>Jami Ombor Qoldig'i (Tan narxda)</p>
                 <h2 className={styles.statValue}>
                   {totalValue.toLocaleString()} <span className={styles.statUnit}>UZS</span>
                 </h2>
              </div>
              <div className={`${styles.statIconBox} ${styles.statIconPrimary}`}>
                 <Package size={28} />
              </div>
          </div>
          
          <div className={`${styles.statCard} ${styles.statCardSuccess}`}>
              <div className={styles.statInfo}>
                 <p className={styles.statLabel}>Umumiy Tovarlar Soni</p>
                 <h2 className={styles.statValue}>
                   {totalItems.toLocaleString()} <span className={styles.statUnit}>birlik</span>
                 </h2>
              </div>
              <div className={`${styles.statIconBox} ${styles.statIconSuccess}`}>
                 <ArrowUpRight size={28} />
              </div>
          </div>

          <div className={`${styles.statCard} ${styles.statCardDanger}`}>
              <div className={styles.statInfo}>
                 <p className={styles.statLabel}>Tugab Boryotgan Tovarlar</p>
                 <h2 className={`${styles.statValue} ${styles.statValueDanger}`}>
                   {lowStockProducts.length} <span className={styles.statUnit}>turkum</span>
                 </h2>
              </div>
              <div className={`${styles.statIconBox} ${styles.statIconDanger}`}>
                 <AlertTriangle size={28} />
              </div>
          </div>
      </div>

      <div className={styles.toolbar}>
          <div className={styles.searchBox}>
             <Search className={styles.searchIcon} size={18} />
             <input 
               type="text" 
               value={search} 
               onChange={e=>setSearch(e.target.value)} 
               placeholder="Nomi, KODI yoki Shtrix Kodi orqali qidirish..." 
               className={styles.searchInput} 
             />
          </div>
          <button className={styles.actionBtn}>
             <Printer size={18} /> Shtrix-kodlarni chop etish
          </button>
      </div>

      <div className={styles.tableContainer}>
          <div className={styles.tableWrapper}>
            <table className={styles.dataTable}>
               <thead>
                  <tr>
                     <th>Maxsulot Nomi / SKU</th>
                     <th>Kategoriya</th>
                     <th style={{ textAlign: 'right' }}>O'rtacha Tannarx</th>
                     <th style={{ textAlign: 'right' }}>Sotuv Narxi</th>
                     <th style={{ textAlign: 'center' }}>Foyda (%)</th>
                     <th style={{ textAlign: 'center' }}>Qoldiq</th>
                  </tr>
               </thead>
               <tbody>
                  {products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || p.sku?.includes(search)).map((p) => {
                     const cost = p.avgCostPrice || p.costPrice || 0;
                     const margin = cost > 0 ? ((p.price - cost) / cost * 100).toFixed(1) : 0;
                     const isLow = p.quantity <= (p.minQuantity || 5);
                     
                     return (
                       <tr key={p.id} className={isLow ? styles.rowDanger : ''}>
                         <td>
                             <div className={styles.productCell}>
                               <span className={styles.productName}>{p.name}</span>
                               <div className={styles.productMeta}>
                                 <Barcode size={12} className={styles.metaIcon}/> 
                                 <span>{p.barcode || "SHTRIX YUQ"} • {p.sku || "KOD YUQ"}</span>
                               </div>
                             </div>
                         </td>
                         <td>
                             <span className={styles.categoryBadge}>{p.category}</span>
                         </td>
                         <td style={{ textAlign: 'right' }}>
                             <span className={styles.costPrice}>{cost.toLocaleString()}</span>
                         </td>
                         <td style={{ textAlign: 'right' }}>
                             <span className={styles.sellPrice}>{p.price.toLocaleString()}</span>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                             <span className={`${styles.marginBadge} ${Number(margin) > 0 ? styles.marginPositive : styles.marginNegative}`}>
                                {Number(margin) > 0 ? '+' : ''}{margin}%
                             </span>
                         </td>
                         <td style={{ textAlign: 'center' }}>
                             <span className={`${styles.stockBadge} ${isLow ? styles.stockBadgeDanger : ''}`}>
                                {p.quantity} <span className={styles.stockUnit}>{p.unit}</span>
                             </span>
                         </td>
                       </tr>
                     )
                  })}
               </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
