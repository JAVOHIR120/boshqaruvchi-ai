"use client";

import { useState, useEffect } from "react";
import { Package, PlusCircle, ArrowRightLeft, Target, RefreshCw, AlertTriangle, Factory } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PrihodView from "./PrihodView";
import StocktakeView from "./StocktakeView";
import ProductsView from "./ProductsView";
import InventoryAIView from "./InventoryAIView";
import TransferView from "./TransferView";
import { getWarehouses, createWarehouse } from "../actions";
import styles from "../ombor-nazorati.module.css";
import { Sparkles } from "lucide-react";

export default function OmborNazoratClient() {
  const [activeTab, setActiveTab] = useState("PRODUCTS");
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await getWarehouses();
      if (res.success && res.warehouses && res.warehouses.length > 0) {
        setWarehouses(res.warehouses);
      } else {
         const defRes = await createWarehouse({ name: "Asosiy Ombor (MARKAZ)", type: "MAIN" });
         if (defRes.success) setWarehouses([defRes.warehouse]);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  const tabs = [
    { id: "PRODUCTS", label: "Tovar va Qoldiqlar", icon: Package, desc: "Asosiy katalog va aktual qoldiq miqdorlari" },
    { id: "PRIHOD", label: "Qabul qilish (Prihod)", icon: PlusCircle, desc: "Yangi partiya kirimi va tannarx kalkulyatsiyasi" },
    { id: "TRANSFER", label: "Qatnov (O'tkazma)", icon: ArrowRightLeft, desc: "Do'konlararo va filiallararo ko'chirishlar" },
    { id: "STOCKTAKE", label: "Inventarizatsiya", icon: Target, desc: "Qoldiqlarni ko'r-ko'rona taftish qilish va to'g'irlash" },
    { id: "AI_ANALYTICS", label: "AI Tahlil", icon: Sparkles, desc: "Ombor bo'yicha strategik qarorlar maslahatchisi" },
  ];

  if (isLoading) {
     return (
       <div className={styles.layout} style={{ justifyContent: 'center', alignItems: 'center' }}>
         <RefreshCw size={32} className="animate-spin text-indigo-500" />
       </div>
     );
  }

  return (
    <div className={styles.layout}>
      
      {/* SIDEBAR TABS */}
      <div className={styles.sidebar}>
         <div className={styles.sidebarHeader}>
            <h1 className={styles.sidebarTitle}>
               <Factory size={28} className={styles.sidebarTitleIcon} /> 
               OMBOR NAZORATI
            </h1>
            <p className={styles.sidebarSubtitle}>Enterprise-Grade Nazorat</p>
         </div>

         <div className={styles.tabsContainer}>
           {tabs.map(tab => {
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
               >
                 <tab.icon size={24} className={styles.tabIcon} />
                 <div className={styles.tabInfo}>
                   <span className={styles.tabLabel}>{tab.label}</span>
                   <span className={styles.tabDesc}>{tab.desc}</span>
                 </div>
               </button>
             );
           })}
         </div>

         <div className={styles.sidebarFooter}>
             <div className={styles.alertBox}>
                <AlertTriangle size={18} className={styles.alertIcon} />
                <p className={styles.alertText}>
                   Barcha ombor jarayonlari Nakladnoy hujjatlarisiz amalga oshirilmaydi.
                </p>
             </div>
         </div>
      </div>

      {/* DYNAMIC CONTENT AREA */}
      <div className={styles.contentArea}>
         <AnimatePresence mode="wait">
            <motion.div
               key={activeTab}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.3, ease: "easeOut" }}
               className={styles.viewContainer}
            >
               {activeTab === "PRODUCTS" && <ProductsView warehouses={warehouses} />}
               {activeTab === "PRIHOD" && <PrihodView warehouses={warehouses} />}
               {activeTab === "STOCKTAKE" && <StocktakeView warehouses={warehouses} />}
               {activeTab === "AI_ANALYTICS" && <InventoryAIView />}
               {activeTab === "TRANSFER" && <TransferView warehouses={warehouses} />}
            </motion.div>
         </AnimatePresence>
      </div>
    </div>
  );
}
