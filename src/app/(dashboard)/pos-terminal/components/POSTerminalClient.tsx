"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  ShoppingBag, Search, Plus, Minus, Trash2, CreditCard,
  Banknote, Wallet, X, Printer, Users, PauseCircle,
  PlayCircle, ArrowDownCircle, ArrowUpCircle, Lock,
  Zap, Package, Clock, Hash, BarChart3, Keyboard, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  getPosProducts, openPosShift, getActiveShift,
  closePosShift, createTransaction, addCashOperation
} from "../actions";
import ThermalReceipt from "./ThermalReceipt";
import styles from "../pos-terminal.module.css";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
  category: string;
  price: number;
  quantity: number;
  unit: string;
}

interface CartItem extends Product {
  cartQuantity: number;
  cartTotal: number;
}

interface OrderTab {
  id: string;
  name: string;
  cart: CartItem[];
}

export default function POSTerminalClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderTab[]>([{ id: "main", name: "Chek 1", cart: [] }]);
  const [activeTabId, setActiveTabId] = useState("main");

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Barchasi");
  const [shift, setShift] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isCashOpModalOpen, setIsCashOpModalOpen] = useState(false);

  // Shift
  const [startingCash, setStartingCash] = useState("");

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashAmount, setCashAmount] = useState<string>("");
  const [cardAmount, setCardAmount] = useState<string>("");
  const [debtAmount, setDebtAmount] = useState<string>("");
  const [bonusUsed, setBonusUsed] = useState<string>("");

  // Cash Operation
  const [cashOpType, setCashOpType] = useState<"IN" | "OUT">("IN");
  const [cashOpAmount, setCashOpAmount] = useState("");

  // Close Shift
  const [expectedCash, setExpectedCash] = useState("");

  const searchInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeTabId) || orders[0],
    [orders, activeTabId]
  );
  const cart = activeOrder.cart;
  const cartTotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.cartTotal, 0),
    [cart]
  );
  const cartItemsCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.cartQuantity, 0),
    [cart]
  );

  const aiRecommendations = useMemo(() => {
    if (products.length === 0) return [];
    
    if (cart.length === 0) {
      // If cart is empty, suggest the first 3 products as defaults
      return products.slice(0, 3);
    }
    
    const cartNamesLower = cart.map(item => item.name.toLowerCase());
    const cartCategoriesLower = cart.map(item => item.category.toLowerCase());
    const cartIds = cart.map(item => item.id);
    
    let suggested: Product[] = [];
    
    // Check if cart has beverages/drinks
    const hasBeverage = cartCategoriesLower.some(c => c.includes("ichimlik") || c.includes("beverage")) || 
                        cartNamesLower.some(n => n.includes("cola") || n.includes("suv") || n.includes("choy") || n.includes("kofe") || n.includes("fanta"));
    
    // Check if cart has food/meals/bakery
    const hasFood = cartCategoriesLower.some(c => c.includes("ovqat") || c.includes("fast") || c.includes("shirin") || c.includes("bakery") || c.includes("tovar")) || 
                    cartNamesLower.some(n => n.includes("burger") || n.includes("lavash") || n.includes("somsa") || n.includes("kruassan") || n.includes("tort") || n.includes("shokolad"));

    if (hasBeverage && !hasFood) {
      // Suggest food / snacks
      suggested = products.filter(p => {
        const cat = p.category.toLowerCase();
        const name = p.name.toLowerCase();
        return (cat.includes("shirin") || cat.includes("yegulik") || cat.includes("bakery") || cat.includes("snack") || 
                name.includes("kruassan") || name.includes("shokolad") || name.includes("pechenye") || name.includes("bulochka")) && !cartIds.includes(p.id);
      });
    } else if (hasFood && !hasBeverage) {
      // Suggest drinks / beverages
      suggested = products.filter(p => {
        const cat = p.category.toLowerCase();
        const name = p.name.toLowerCase();
        return (cat.includes("ichimlik") || cat.includes("beverage") || name.includes("cola") || name.includes("suv") || name.includes("fanta") || name.includes("choy")) && !cartIds.includes(p.id);
      });
    }
    
    // Fallback if we don't have enough suggestions
    if (suggested.length < 3) {
      const remaining = products.filter(p => !cartIds.includes(p.id) && !suggested.map(s => s.id).includes(p.id));
      suggested = [...suggested, ...remaining];
    }
    
    return suggested.slice(0, 3);
  }, [cart, products]);

  const categories = useMemo(
    () => ["Barchasi", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          (activeCategory === "Barchasi" || p.category === activeCategory) &&
          (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (p.sku || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
           (p.barcode || "").toLowerCase().includes(searchQuery.toLowerCase()))
      ),
    [products, activeCategory, searchQuery]
  );

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    const [productsRes, shiftRes] = await Promise.all([
      getPosProducts(),
      getActiveShift(),
    ]);
    if (productsRes.success) setProducts(productsRes.products || []);
    if (shiftRes.success && shiftRes.shift) {
      setShift(shiftRes.shift);
    } else {
      setIsShiftModalOpen(true);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // HOTKEYS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        if (cart.length > 0) openPaymentModal();
      }
      if (e.key === "F8") {
        e.preventDefault();
        clearCart();
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (shift) setIsCloseShiftModalOpen(true);
      }
      if (e.key === "Insert") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, shift]);

  // BARCODE PARSER
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;

    let barcode = searchQuery.trim();
    let parsedWeight = 1;

    if (
      barcode.length === 13 &&
      (barcode.startsWith("20") || barcode.startsWith("22"))
    ) {
      const itemCode = barcode.substring(2, 7);
      const weightGram = parseInt(barcode.substring(7, 12), 10);
      parsedWeight = weightGram / 1000;
      barcode = itemCode;
    }

    const foundProduct = products.find(
      (p) =>
        p.barcode === barcode ||
        p.sku === barcode ||
        p.barcode === searchQuery
    );

    if (foundProduct) {
      addToCart(foundProduct, parsedWeight);
      setSearchQuery("");
    } else {
      toast.error("Tovar topilmadi!");
    }
  };

  const updateActiveCart = (newCart: CartItem[]) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeTabId ? { ...o, cart: newCart } : o
      )
    );
  };

  const addToCart = (product: Product, weightQty = 1) => {
    const currentCart = [...cart];
    const existing = currentCart.find((item) => item.id === product.id);
    if (existing) {
      updateActiveCart(
        currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                cartQuantity: item.cartQuantity + weightQty,
                cartTotal: (item.cartQuantity + weightQty) * item.price,
              }
            : item
        )
      );
    } else {
      updateActiveCart([
        ...currentCart,
        {
          ...product,
          cartQuantity: weightQty,
          cartTotal: product.price * weightQty,
        },
      ]);
    }
  };

  const updateCartQuantity = (id: string, delta: number) => {
    updateActiveCart(
      cart
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, item.cartQuantity + delta);
            if (newQty === 0) return null;
            return {
              ...item,
              cartQuantity: newQty,
              cartTotal: newQty * item.price,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) =>
    updateActiveCart(cart.filter((item) => item.id !== id));

  const clearCart = () => updateActiveCart([]);

  const addNewTab = () => {
    const newId = Date.now().toString();
    setOrders([
      ...orders,
      { id: newId, name: `Chek ${orders.length + 1}`, cart: [] },
    ]);
    setActiveTabId(newId);
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (orders.length === 1) {
      clearCart();
      return;
    }
    const newOrders = orders.filter((o) => o.id !== id);
    setOrders(newOrders);
    if (activeTabId === id) setActiveTabId(newOrders[0].id);
  };

  const openPaymentModal = () => {
    if (!shift) {
      toast.error("Smenani oching!");
      setIsShiftModalOpen(true);
      return;
    }
    setPaymentMethod("CASH");
    setCashAmount(cartTotal.toString());
    setCardAmount("");
    setDebtAmount("");
    setBonusUsed("");
    setIsPaymentModalOpen(true);
  };

  const handleOpenShift = async () => {
    const cash = Number(startingCash) || 0;
    const res = await openPosShift(cash);
    if (res.success) {
      setShift(res.shift);
      setIsShiftModalOpen(false);
      setStartingCash("");
      toast.success("Smena ochildi!");
    } else {
      toast.error(res.error || "Xatolik yuz berdi");
    }
  };

  const handleCloseShift = async () => {
    const cash = Number(expectedCash) || 0;
    const res = await closePosShift(cash);
    if (res.success) {
      setShift(null);
      setIsCloseShiftModalOpen(false);
      setExpectedCash("");
      toast.success("Smena yopildi!");
      setIsShiftModalOpen(true);
    } else {
      toast.error(res.error || "Xatolik yuz berdi");
    }
  };

  const handleCashOperation = async () => {
    if (!shift) return;
    const amount = Number(cashOpAmount) || 0;
    if (amount <= 0) {
      toast.error("Summa kiriting!");
      return;
    }
    const res = await addCashOperation(shift.id, cashOpType, amount);
    if (res.success) {
      toast.success(
        cashOpType === "IN"
          ? `${amount.toLocaleString()} UZS kirim qilindi`
          : `${amount.toLocaleString()} UZS chiqim qilindi`
      );
      setIsCashOpModalOpen(false);
      setCashOpAmount("");
    } else {
      toast.error(res.error || "Xatolik");
    }
  };

  const executePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleCheckout = async () => {
    const cash = Number(cashAmount) || 0;
    const card = Number(cardAmount) || 0;
    const debt = Number(debtAmount) || 0;
    const bonus = Number(bonusUsed) || 0;
    const totalPaid = cash + card + debt + bonus;

    if (
      totalPaid < cartTotal &&
      paymentMethod !== "DEBT" &&
      paymentMethod !== "MIXED"
    ) {
      toast.error("Summa to'lanmadi!");
      return;
    }
    if (paymentMethod === "MIXED" && totalPaid < cartTotal) {
      toast.error("Aralash to'lov summasi yetarli emas!");
      return;
    }

    const res = await createTransaction({
      shiftId: shift.id,
      type: "COMPLETED",
      paymentMethod,
      totalAmount: cartTotal,
      paidAmount:
        cashAmount === ""
          ? cardAmount === ""
            ? cartTotal
            : card
          : cash,
      cashAmount: cash,
      cardAmount: card,
      debtAmount: debt,
      bonusUsed: bonus,
      discount: 0,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.cartQuantity,
        price: item.price,
        total: item.cartTotal,
      })),
    });

    if (res.success) {
      toast.success("Chek muvaffaqiyatli yopildi!");
      executePrint();
      clearCart();
      setIsPaymentModalOpen(false);
    } else {
      toast.error(res.error || "Xatolik yuz berdi");
    }
  };

  const handleNumpad = (key: string) => {
    if (key === "C") {
      setCashAmount("");
    } else if (key === "⌫") {
      setCashAmount((prev) => prev.slice(0, -1));
    } else {
      setCashAmount((prev) => prev + key);
    }
  };

  const getStockClass = (qty: number) => {
    if (qty <= 0) return styles.productStockOut;
    if (qty <= 5) return styles.productStockLow;
    return "";
  };

  // ═══════════════════════════════════════════════
  // LOADING
  // ═══════════════════════════════════════════════
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <span className={styles.loadingText}>
          POS Terminal yuklanmoqda...
        </span>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════
  return (
    <div className={styles.posLayout}>
      {/* ══════════════════════════════════════════
          LEFT PANEL — CART
          ══════════════════════════════════════════ */}
      <div className={styles.leftPanel}>
        {/* Order Tabs */}
        <div className={styles.tabsBar}>
          {orders.map((o) => (
            <div
              key={o.id}
              onClick={() => setActiveTabId(o.id)}
              className={`${styles.tab} ${activeTabId === o.id ? styles.tabActive : ""}`}
            >
              <span>{o.name}</span>
              <span className={styles.tabBadge}>{o.cart.length}</span>
              <button
                onClick={(e) => closeTab(e, o.id)}
                className={styles.tabClose}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          <button onClick={addNewTab} className={styles.addTabBtn}>
            <Plus size={18} />
          </button>
        </div>

        {/* Cart Header */}
        <div className={styles.cartHeader}>
          <div
            className={`${styles.shiftBadge} ${shift?.status === "OPEN" ? styles.shiftOpen : styles.shiftClosed}`}
          >
            <span className={styles.shiftDot} />
            {shift?.status === "OPEN" ? (
              <>
                <PlayCircle size={14} /> Smena Ochiq
              </>
            ) : (
              <>
                <PauseCircle size={14} /> Tanaffus
              </>
            )}
          </div>
          <div className={styles.cartActions}>
            <button
              className={styles.cartActionBtn}
              title="Kassaga kirim/chiqim"
              onClick={() => setIsCashOpModalOpen(true)}
            >
              <Wallet size={17} />
            </button>
            <button
              className={styles.cartActionBtn}
              title="Smenani yopish (F9)"
              onClick={() => shift && setIsCloseShiftModalOpen(true)}
            >
              <Lock size={17} />
            </button>
            <button
              className={`${styles.cartActionBtn} ${styles.cartActionBtnDanger}`}
              title="Tozalash (F8)"
              onClick={clearCart}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className={styles.cartBody}>
          <AnimatePresence mode="popLayout">
            {cart.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={styles.cartItem}
              >
                <span className={styles.cartItemIndex}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <div className={styles.cartItemInfo}>
                  <div className={styles.cartItemName}>{item.name}</div>
                  <div className={styles.cartItemMeta}>
                    <span>{item.price.toLocaleString()} UZS</span>
                    <span className={styles.cartItemUnit}>{item.unit}</span>
                  </div>
                </div>
                <div className={styles.cartItemRight}>
                  <span className={styles.cartItemTotal}>
                    {item.cartTotal.toLocaleString()}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div className={styles.qtyControls}>
                      <button
                        onClick={() => updateCartQuantity(item.id, -1)}
                        className={styles.qtyBtn}
                      >
                        <Minus size={12} />
                      </button>
                      <span className={styles.qtyValue}>
                        {item.cartQuantity.toFixed(
                          item.unit === "kg" ? 3 : 0
                        )}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.id, 1)}
                        className={styles.qtyBtn}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className={styles.cartItemDelete}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {cart.length === 0 && (
            <div className={styles.emptyCart}>
              <div className={styles.emptyCartIcon}>
                <ShoppingBag size={32} />
              </div>
              <p className={styles.emptyCartText}>
                Tovar skanerlang yoki tanlang
              </p>
              <div className={styles.emptyCartHint}>
                <span className={styles.kbdKey}>Insert</span>
                <span>— Qidiruv</span>
                <span className={styles.kbdKey}>F2</span>
                <span>— To'lov</span>
              </div>
            </div>
          )}
        </div>

        {/* Cart Footer / Checkout */}
        <div className={styles.cartFooter}>
          {/* AI Up-sell recommendation widget */}
          {aiRecommendations.length > 0 && (
            <div className={styles.aiUpsellSection}>
              <div className={styles.aiUpsellHeader}>
                <Sparkles size={14} className="animate-pulse" />
                <span>AI Aqlli Tavsiya (Up-sell)</span>
              </div>
              <div className={styles.aiUpsellList}>
                {aiRecommendations.map((prod) => (
                  <div 
                    key={prod.id} 
                    onClick={() => addToCart(prod)}
                    className={styles.aiUpsellChip}
                    title="Savatga qo'shish uchun bosing"
                  >
                    <div className={styles.aiUpsellInfo}>
                      <span className={styles.aiUpsellName}>{prod.name}</span>
                      <span className={styles.aiUpsellPrice}>{prod.price.toLocaleString()} UZS</span>
                    </div>
                    <button className={styles.aiUpsellAddBtn}>
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.cartSummary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Tovarlar</span>
              <span className={styles.summaryValue}>{cart.length} ta ({cartItemsCount} birlik)</span>
            </div>
            <div className={styles.summaryDivider} />
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Jami summa</span>
              <span className={styles.summaryTotal}>
                {cartTotal.toLocaleString()}
                <span className={styles.summaryCurrency}>UZS</span>
              </span>
            </div>
          </div>
          <button
            onClick={openPaymentModal}
            disabled={cart.length === 0}
            className={styles.checkoutBtn}
          >
            <Banknote size={22} />
            TO'LOV
            <span className={styles.checkoutShortcut}>F2</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          RIGHT PANEL — PRODUCTS
          ══════════════════════════════════════════ */}
      <div className={styles.rightPanel}>
        {/* Search & Filter */}
        <div className={styles.searchBar}>
          <form onSubmit={handleBarcodeSubmit} className={styles.searchForm}>
            <Search className={styles.searchIcon} size={18} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nomi, shtrix-kod yoki SKU qidirish..."
              className={styles.searchInput}
              autoFocus
            />
          </form>
          <div className={styles.categoriesBar}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ""}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className={styles.productsGrid}>
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => addToCart(product)}
              className={styles.productCard}
            >
              <div>
                <span className={styles.productCategory}>
                  {product.category}
                </span>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productSku}>
                  {product.sku || product.barcode || "—"}
                </p>
              </div>
              <div className={styles.productBottom}>
                <span className={styles.productPrice}>
                  {product.price.toLocaleString()}
                </span>
                <span
                  className={`${styles.productStock} ${getStockClass(product.quantity)}`}
                >
                  {product.quantity} {product.unit}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusLeft}>
            <div className={styles.statusItem}>
              <span className={styles.statusDot} />
              <span>Online</span>
            </div>
            <div className={styles.statusItem}>
              <Package size={12} />
              <span>{products.length} tovar</span>
            </div>
            <div className={styles.statusItem}>
              <BarChart3 size={12} />
              <span>{filteredProducts.length} ko'rsatilmoqda</span>
            </div>
          </div>
          <div className={styles.statusRight}>
            <div className={styles.statusItem}>
              <Keyboard size={12} />
              <span>F2 To'lov · F8 Tozalash · F9 Smena</span>
            </div>
            <div className={styles.statusItem}>
              <Clock size={12} />
              <span>
                {new Date().toLocaleTimeString("uz-UZ", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PAYMENT SIDE PANEL
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className={styles.paymentOverlay}>
            <div
              className={styles.paymentBackdrop}
              onClick={() => setIsPaymentModalOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 200 }}
              className={styles.paymentPanel}
            >
              {/* Payment Header */}
              <div className={styles.paymentHeader}>
                <h2 className={styles.paymentTitle}>To'lovni Qabul Qilish</h2>
                <button
                  onClick={() => setIsPaymentModalOpen(false)}
                  className={styles.modalCloseBtn}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Payment Body */}
              <div className={styles.paymentBody}>
                {/* Total Card */}
                <div className={styles.totalCard}>
                  <div>
                    <p className={styles.totalLabel}>Jami Hisoblangan</p>
                    <h1 className={styles.totalAmount}>
                      {cartTotal.toLocaleString()}
                    </h1>
                  </div>
                  <Banknote size={64} className={styles.totalIcon} />
                </div>

                {/* Payment Method Selector */}
                <div className={styles.paymentMethodGrid}>
                  {[
                    { id: "CASH", label: "Naqd", icon: Banknote },
                    { id: "CARD", label: "Plastik", icon: CreditCard },
                    { id: "MIXED", label: "Aralash", icon: Wallet },
                    { id: "DEBT", label: "Qarz", icon: Users },
                  ].map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setPaymentMethod(type.id);
                        if (type.id !== "MIXED") {
                          setCashAmount(cartTotal.toString());
                          setCardAmount("");
                          setDebtAmount("");
                        } else {
                          setCashAmount("");
                        }
                      }}
                      className={`${styles.paymentMethodBtn} ${paymentMethod === type.id ? styles.paymentMethodActive : ""}`}
                    >
                      <type.icon size={22} />
                      {type.label}
                    </button>
                  ))}
                </div>

                {/* Mixed Payment Inputs */}
                {paymentMethod === "MIXED" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.mixedSection}
                  >
                    <h4 className={styles.mixedSectionTitle}>
                      Aralash to'lov tafsilotlari
                    </h4>
                    <div className={styles.mixedInputRow}>
                      <div className={styles.mixedInputGroup}>
                        <label className={styles.mixedInputLabel}>
                          Naqd pul
                        </label>
                        <input
                          type="number"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          className={styles.mixedInput}
                          placeholder="0"
                        />
                      </div>
                      <div className={styles.mixedInputGroup}>
                        <label className={styles.mixedInputLabel}>
                          Plastik karta
                        </label>
                        <input
                          type="number"
                          value={cardAmount}
                          onChange={(e) => setCardAmount(e.target.value)}
                          className={styles.mixedInput}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className={styles.mixedInputGroup}>
                      <label
                        className={`${styles.mixedInputLabel} ${styles.mixedInputLabelDanger}`}
                      >
                        Qarzga beriladigan qism
                      </label>
                      <input
                        type="number"
                        value={debtAmount}
                        onChange={(e) => setDebtAmount(e.target.value)}
                        className={`${styles.mixedInput} ${styles.mixedInputDanger}`}
                        placeholder="0"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Cash Info & Numpad */}
                {(paymentMethod === "CASH" || paymentMethod === "CARD") && (
                  <div>
                    {/* Quick Cash Presets */}
                    {paymentMethod === "CASH" && (
                      <div className={styles.quickCashRow}>
                        {[1000, 5000, 10000, 50000, 100000].map((val) => (
                          <button
                            key={val}
                            onClick={() => setCashAmount(val.toString())}
                            className={styles.quickCashBtn}
                          >
                            {val.toLocaleString()}
                          </button>
                        ))}
                        <button
                          onClick={() => setCashAmount(cartTotal.toString())}
                          className={styles.quickCashBtn}
                        >
                          Aynan
                        </button>
                      </div>
                    )}

                    {/* Numpad */}
                    {paymentMethod === "CASH" && (
                      <div className={styles.numpad}>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"].map(
                          (key) => (
                            <button
                              key={key}
                              onClick={() => handleNumpad(key)}
                              className={`${styles.numpadBtn} ${key === "C" ? styles.numpadBtnClear : key === "⌫" ? styles.numpadBtnAction : ""}`}
                            >
                              {key}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Cash Summary */}
                {(paymentMethod === "CASH" || paymentMethod === "MIXED") && (
                  <div className={styles.cashSummaryCard}>
                    <div
                      className={`${styles.cashSummaryRow} ${styles.cashReceivedRow}`}
                    >
                      <span className={styles.cashReceivedLabel}>
                        Olingan pul
                      </span>
                      <span className={styles.cashReceivedValue}>
                        {Number(cashAmount || 0).toLocaleString()} UZS
                      </span>
                    </div>
                    <div
                      className={`${styles.cashSummaryRow} ${styles.changeRow}`}
                    >
                      <span className={styles.changeLabel}>Qaytim</span>
                      <span className={styles.changeValue}>
                        {Math.max(
                          0,
                          Number(cashAmount || 0) -
                            (paymentMethod === "MIXED" ? 0 : cartTotal)
                        ).toLocaleString()}{" "}
                        UZS
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Footer */}
              <div className={styles.paymentFooter}>
                <button onClick={handleCheckout} className={styles.payBtn}>
                  To'lovni Yakunlash
                  <Printer size={22} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          SHIFT OPEN MODAL
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isShiftModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className={styles.modalContainer}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Smenani Ochish</h2>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.shiftModalIcon}>
                  <Zap size={32} />
                </div>
                <p className={styles.shiftModalDesc}>
                  Savdo boshlash uchun smenani oching. Boshlang'ich kassa
                  qoldig'ini kiriting.
                </p>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Boshlang'ich naqd pul (UZS)
                  </label>
                  <input
                    type="number"
                    value={startingCash}
                    onChange={(e) => setStartingCash(e.target.value)}
                    className={styles.formInput}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={handleOpenShift}
                  className={styles.modalBtnPrimary}
                >
                  <PlayCircle size={18} />
                  Smenani Ochish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          CLOSE SHIFT MODAL
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isCloseShiftModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className={styles.modalContainer}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Smenani Yopish</h2>
                <button
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className={styles.modalCloseBtn}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.shiftStatsGrid}>
                  <div className={styles.shiftStatCard}>
                    <div className={styles.shiftStatLabel}>Boshlang'ich</div>
                    <div className={styles.shiftStatValue}>
                      {(shift?.startingCash || 0).toLocaleString()} UZS
                    </div>
                  </div>
                  <div className={styles.shiftStatCard}>
                    <div className={styles.shiftStatLabel}>Jami savdo</div>
                    <div className={styles.shiftStatValue}>
                      {(shift?.totalSales || 0).toLocaleString()} UZS
                    </div>
                  </div>
                  <div className={styles.shiftStatCard}>
                    <div className={styles.shiftStatLabel}>Kirim</div>
                    <div className={styles.shiftStatValue}>
                      +{(shift?.cashIn || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className={styles.shiftStatCard}>
                    <div className={styles.shiftStatLabel}>Chiqim</div>
                    <div className={styles.shiftStatValue}>
                      −{(shift?.cashOut || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Kassadagi haqiqiy naqd pul (UZS)
                  </label>
                  <input
                    type="number"
                    value={expectedCash}
                    onChange={(e) => setExpectedCash(e.target.value)}
                    className={styles.formInput}
                    placeholder="Haqiqiy summani kiriting"
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setIsCloseShiftModalOpen(false)}
                  className={styles.modalBtnSecondary}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCloseShift}
                  className={styles.modalBtnDanger}
                >
                  <Lock size={16} />
                  Smenani Yopish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          CASH OPERATION MODAL
          ══════════════════════════════════════════ */}
      <AnimatePresence>
        {isCashOpModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.modalOverlay}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className={styles.modalContainer}
            >
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Kassa Operatsiyasi</h2>
                <button
                  onClick={() => setIsCashOpModalOpen(false)}
                  className={styles.modalCloseBtn}
                >
                  <X size={18} />
                </button>
              </div>
              <div className={styles.modalBody}>
                {/* IN/OUT Tabs */}
                <div className={styles.cashOpTabs}>
                  <button
                    onClick={() => setCashOpType("IN")}
                    className={`${styles.cashOpTab} ${cashOpType === "IN" ? styles.cashOpTabIn : ""}`}
                  >
                    <ArrowDownCircle
                      size={16}
                      style={{ display: "inline", marginRight: 6 }}
                    />
                    Kirim
                  </button>
                  <button
                    onClick={() => setCashOpType("OUT")}
                    className={`${styles.cashOpTab} ${cashOpType === "OUT" ? styles.cashOpTabOut : ""}`}
                  >
                    <ArrowUpCircle
                      size={16}
                      style={{ display: "inline", marginRight: 6 }}
                    />
                    Chiqim
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Summa (UZS)</label>
                  <input
                    type="number"
                    value={cashOpAmount}
                    onChange={(e) => setCashOpAmount(e.target.value)}
                    className={styles.formInput}
                    placeholder="0"
                    autoFocus
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  onClick={() => setIsCashOpModalOpen(false)}
                  className={styles.modalBtnSecondary}
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleCashOperation}
                  className={styles.modalBtnPrimary}
                >
                  {cashOpType === "IN" ? (
                    <>
                      <ArrowDownCircle size={16} /> Kirim Qilish
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle size={16} /> Chiqim Qilish
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* THERMAL RECEIPT (Hidden — for printing) */}
      <ThermalReceipt
        ref={printRef}
        cart={cart}
        total={cartTotal}
        paidAmount={
          paymentMethod === "MIXED"
            ? Number(cashAmount || 0)
            : paymentMethod === "CASH"
              ? Number(cashAmount || cartTotal)
              : cartTotal
        }
        cashAmount={Number(cashAmount || 0)}
        cardAmount={Number(cardAmount || 0)}
        debtAmount={Number(debtAmount || 0)}
        bonusUsed={Number(bonusUsed || 0)}
        discount={0}
        cashierName="Boshqaruvchi AI"
        paymentMethod={paymentMethod}
        transactionId={Date.now().toString()}
      />
    </div>
  );
}
