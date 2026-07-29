"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { motion } from "framer-motion";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import NickelHero from "@/components/NickelHero";
import { Bot, BarChart3, Clock, ShieldCheck, Zap, Globe, ArrowRight, Users, Target, Rocket, Award, CheckCircle, Star, Crown, Building2, TrendingUp, Sparkles } from "lucide-react";
import { FaTelegramPlane, FaInstagram, FaPhone, FaEnvelope } from "react-icons/fa";
import styles from "./page.module.css";

export default function Home() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const [cloudsEffect, setCloudsEffect] = useState<any>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (vantaEffect && typeof vantaEffect.resize === "function") {
        vantaEffect.resize();
      }
      if (cloudsEffect && typeof cloudsEffect.resize === "function") {
        cloudsEffect.resize();
      }
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      if (vantaEffect) vantaEffect.destroy();
      if (cloudsEffect) cloudsEffect.destroy();
    };
  }, [vantaEffect, cloudsEffect]);

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" 
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.halo.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (!vantaEffect && (window as any).VANTA) {
            setVantaEffect(
              (window as any).VANTA.HALO({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00
              })
            );
          }
        }}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.clouds.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (!cloudsEffect && (window as any).VANTA) {
            setCloudsEffect(
              (window as any).VANTA.CLOUDS({
                el: cloudsRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.00,
                minWidth: 200.00
              })
            );
          }
        }}
      />
      <main className={styles.landingPage} data-theme="dark">
      {/* ==========================================
          SECTION 1 — HERO
          Nickel-style dark hero with animation right
          ========================================== */}
      <NickelHero />

      {/* ==========================================
          SECTION 2 — SAAS INFO (Split layout)
          Dashboard card + headline + email CTA
          ========================================== */}
      <section className={styles.saasSection}>
        {/* Vanta Background Container */}
        <div 
          ref={vantaRef} 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0,
            opacity: 1,
            pointerEvents: "none"
          }} 
        />
        
        <div className={styles.saasInner} style={{ position: "relative", zIndex: 1 }}>
          {/* LEFT — Headline & CTA */}
          <motion.div
            className={styles.saasLeft}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <h2 className={styles.saasTitle}>
              Soliq va buxgalteryani{" "}
              <span className={styles.saasAccent}>avtomatlashtirib,</span>{" "}
              vaqtingizni tejang.
            </h2>
            <p className={styles.saasSubtitle}>
              Kichik va o'rta bizneslar uchun sun'iy intellektga asoslangan buxgalteriya, soliq hisobot va xodimlar boshqaruv platformasi.
            </p>
            <div className={styles.saasCta}>
              <input
                type="email"
                placeholder="Email manzilingiz"
                className={styles.saasInput}
              />
              <Link href="/register" className={styles.saasBtn}>
                Boshlash <ArrowRight size={16} />
              </Link>
            </div>
            {/* Trust row */}
            <div className={styles.trustRow}>
              <span className={styles.trustLabel}>Ishonch bilan:</span>
              <div className={styles.trustLogos}>
                <span className={styles.trustBadge}>
                  <ShieldCheck size={15} /> SSL Himoya
                </span>
                <span className={styles.trustBadge}>
                  <Zap size={15} /> 99.9% Uptime
                </span>
                <span className={styles.trustBadge}>
                  <Globe size={15} /> O'zbekiston
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Floating Dashboard Card */}
          <motion.div
            className={styles.saasRight}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          >
            <div className={styles.dashboardCard}>
              {/* Top bar mockup */}
              <div className={styles.cardTopBar}>
                <div className={styles.cardDots}>
                  <span></span><span></span><span></span>
                </div>
                <span className={styles.cardUrlBar}>Boshqaruvchi AI/dashboard</span>
              </div>
              {/* Stats row */}
              <div className={styles.cardStatsRow}>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatLabel}>Oylik daromad</span>
                  <span className={styles.cardStatValue}>284,500,000</span>
                  <span className={styles.cardStatUnit}>so'm</span>
                </div>
                <div className={styles.cardStat}>
                  <span className={styles.cardStatLabel}>Soliq to'lovi</span>
                  <span className={styles.cardStatValue}>8,535,000</span>
                  <span className={styles.cardStatBadge}>3% QQS</span>
                </div>
              </div>
              {/* Mini chart bars */}
              <div className={styles.cardChartArea}>
                <span className={styles.cardChartLabel}>Yillik ko'rsatkichlar</span>
                <div className={styles.miniChart}>
                  <div className={styles.miniBar} style={{ height: "40%" }}></div>
                  <div className={styles.miniBar} style={{ height: "55%" }}></div>
                  <div className={styles.miniBar} style={{ height: "45%" }}></div>
                  <div className={styles.miniBar} style={{ height: "70%" }}></div>
                  <div className={styles.miniBar} style={{ height: "60%" }}></div>
                  <div className={styles.miniBar} style={{ height: "85%" }}></div>
                  <div className={styles.miniBar} style={{ height: "75%" }}></div>
                  <div className={styles.miniBar} style={{ height: "90%" }}></div>
                </div>
              </div>
              {/* AI suggestion */}
              <div className={styles.cardAiRow}>
                <Bot size={16} />
                <span>Soliq muddati: <strong>15-mart</strong> — Hisob-faktura tayyor</span>
              </div>
            </div>
            {/* Floating pill */}
            <div className={styles.floatingPill}>
              <BarChart3 size={16} />
              <span>Xodimlar: <strong>24 ta</strong></span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==========================================
          SECTION 3 — FEATURES GRID
          ========================================== */}
      <div className={styles.featuresWrapper}>
        {/* Vanta Clouds Background */}
        <div 
          ref={cloudsRef} 
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 0
          }} 
        />
        
        {/* Ambient Glass Mesh Background Orbs */}
        <div className={styles.glassBlob1} />
        <div className={styles.glassBlob2} />
        <div className={styles.glassBlob3} />

        <motion.div
          className={styles.featuresHeader}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className={styles.featuresTitle}>
            Nega aynan <span className={styles.saasAccent}>Boshqaruvchi AI?</span>
          </h2>
          <p className={styles.featuresSubtitle}>
            Biznesni boshqarishning eng aqlli, avtomatlashgan va xavfsiz usuli.
          </p>
        </motion.div>
        <div className={styles.featuresGrid}>
          {[
            { icon: <Bot size={26} />, title: "AI Maslahatchi (Big 4)", desc: "Lex.uz va global moliya standartlariga asoslangan, xalqaro konsultant darajasida ishlovchi aqlli AI yordamchi.", color: "#3b82f6" },
            { icon: <BarChart3 size={26} />, title: "SaaS Buxgalteriya", desc: "Daromad, MRR, ARR, va korxona bahosini avtomatik hisoblash tizimi.", color: "#0284c7" },
            { icon: <Clock size={26} />, title: "HR va Davomat nazorati", desc: "Xodimlarning ish vaqti, oylik maoshlari va KPI ko'rsatkichlarini raqamlashtiring.", color: "#10b981" },
            { icon: <ShieldCheck size={26} />, title: "Yuridik Data Room", desc: "Shartnomalar, investor kelishuvlari va soliq hisobotlari xavfsiz bulutda saqlanadi.", color: "#f59e0b" },
            { icon: <Zap size={26} />, title: "Avto-Hisobot (Soliq)", desc: "Muddati kelayotgan soliq to'lovlari va penya miqdorini avtomatik kalkulyatsiyasi.", color: "#ef4444" },
            { icon: <Globe size={26} />, title: "Barcha qurilmalarda", desc: "Biznesni istalgan nuqtadan, istalgan qurilmadan tez va xavfsiz boshqaring.", color: "#8b5cf6" },
          ].map((f, i) => (
            <motion.div
              key={i}
              className={styles.featureCard}
              style={{
                '--card-accent': f.color
              } as React.CSSProperties}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            >
              <div className={styles.glassGlow} style={{ background: f.color }} />
              <div 
                className={styles.featureIcon} 
                style={{ 
                  backgroundColor: `${f.color}20`, 
                  borderColor: `${f.color}50`, 
                  color: f.color,
                  boxShadow: `0 8px 24px -4px ${f.color}45`
                }}
              >
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ==========================================
          SECTION 4 — KOMPANIYA (Company) - BENTO GRID
          ========================================== */}
      <section className={styles.companySection} id="company">
        {/* Animated Background Mesh & Grid */}
        <div className={styles.animatedBgContainer}>
          <div className={styles.bgGrid}></div>
          <div className={styles.bgOrb1}></div>
          <div className={styles.bgOrb2}></div>
          <div className={styles.bgOrb3}></div>
        </div>
        
        <motion.div
          className={styles.companyHeader}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className={styles.companySectionTag}>
            <Building2 size={14} /> Kompaniya haqida
          </span>
          <h2 className={styles.companyTitle}>
            Kelajak texnologiyalarini <span className={styles.saasAccent}>bugun</span> yaratamiz
          </h2>
          <p className={styles.companySubtitle}>
            Biz O'zbekistondagi kichik va o'rta bizneslarni raqamli transformatsiya qilish maqsadida tashkil etilgan texnologik kompaniyamiz.
          </p>
        </motion.div>

        {/* BENTO GRID */}
        <div className={styles.bentoGrid}>
          {/* Main Mission Card (Large) */}
          <motion.div
            className={`${styles.bentoCard} ${styles.bentoLarge}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className={styles.bentoGlow}></div>
            <div className={styles.bentoContent}>
              <div className={styles.bentoIconBox} style={{ background: "rgba(74, 154, 173, 0.15)", color: "#4a9aad" }}>
                <Target size={28} />
              </div>
              <h3 className={styles.bentoTitle}>Bizning maqsadimiz</h3>
              <p className={styles.bentoDesc}>
                Har bir tadbirkor va biznes egasiga zamonaviy sun'iy intellekt texnologiyalaridan foydalanish imkoniyatini berish. Biz murakkab jarayonlarni avtomatlashtiramiz.
              </p>
              <div className={styles.bentoChecklist}>
                <span><CheckCircle size={15} /> ISO 27001 xavfsizlik standarti</span>
                <span><CheckCircle size={15} /> O'zbekiston qonunchiligiga 100% mos</span>
                <span><CheckCircle size={15} /> Bulutli texnologiyalar (Cloud-native)</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards (Small) */}
          {[
            { value: "500+", label: "Faol korxonalar", icon: <Users size={22} />, color: "#3b82f6" },
            { value: "99.9%", label: "Uptime kafolati", icon: <TrendingUp size={22} />, color: "#10b981" },
            { value: "24/7", label: "AI & Support", icon: <Sparkles size={22} />, color: "#f59e0b" },
            { value: "50+", label: "Modullar", icon: <Zap size={22} />, color: "#8b5cf6" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className={`${styles.bentoCard} ${styles.bentoSmall}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
            >
              <div className={styles.bentoGlow}></div>
              <div className={styles.bentoContentCenter}>
                <div className={styles.bentoStatIcon} style={{ color: stat.color, background: `${stat.color}15` }}>{stat.icon}</div>
                <div className={styles.bentoStatValue}>{stat.value}</div>
                <div className={styles.bentoStatLabel}>{stat.label}</div>
              </div>
            </motion.div>
          ))}

          {/* Value Cards (Medium) */}
          {[
            { icon: <Rocket size={24} />, title: "Innovatsiya", desc: "Doimiy ravishda AI modellarni yangilash va biznesga tatbiq etish.", color: "#4a9aad" },
            { icon: <ShieldCheck size={24} />, title: "Xavfsizlik", desc: "Ma'lumotlaringiz AES-256 shifrlash va yopiq klasterlarda saqlanadi.", color: "#8b5cf6" },
          ].map((val, i) => (
            <motion.div
              key={i}
              className={`${styles.bentoCard} ${styles.bentoMedium}`}
              initial={{ opacity: 0, x: i === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), ease: "easeOut" }}
            >
              <div className={styles.bentoGlow}></div>
              <div className={styles.bentoContentRow}>
                <div className={styles.bentoIconBox} style={{ background: `${val.color}15`, color: val.color }}>
                  {val.icon}
                </div>
                <div>
                  <h4 className={styles.bentoTitleSmall}>{val.title}</h4>
                  <p className={styles.bentoDescSmall}>{val.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ==========================================
          SECTION 5 — NARXLAR (Pricing) - PREMIUM
          ========================================== */}
      <section className={styles.pricingSection} id="pricing">
        {/* Animated Background Mesh & Grid */}
        <div className={styles.animatedBgContainerPricing}>
          <div className={styles.pricingGridPattern}></div>
          <div className={styles.pricingOrb1}></div>
          <div className={styles.pricingOrb2}></div>
        </div>
        
        <motion.div
          className={styles.pricingHeader}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className={styles.pricingSectionTag}>
            <Star size={14} /> Narxlar
          </span>
          <h2 className={styles.pricingTitle}>
            Biznesingizga mos <span className={styles.saasAccent}>ta&apos;rif rejani</span> tanlang
          </h2>
          <p className={styles.pricingSubtitle}>
            Barcha rejalarda 14 kunlik bepul sinov davri mavjud. Kredit karta talab qilinmaydi.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className={styles.pricingToggleWrapper}>
            <span className={`${styles.toggleLabel} ${!isYearly ? styles.toggleActive : ""}`}>Oylik</span>
            <button 
              className={`${styles.toggleBtn} ${isYearly ? styles.toggleOn : ""}`}
              onClick={() => setIsYearly(!isYearly)}
              aria-label="Oylik va yillik o'rtasida almashtirish"
            >
              <div className={styles.toggleKnob}></div>
            </button>
            <span className={`${styles.toggleLabel} ${isYearly ? styles.toggleActive : ""}`}>
              Yillik <span className={styles.discountBadge}>-20%</span>
            </span>
          </div>
        </motion.div>

        <div className={styles.pricingGrid}>
          {/* Starter */}
          <motion.div
            className={styles.pricingCardPremium}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className={styles.pricingCardGlow}></div>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingIconWrap} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <Rocket size={24} />
              </div>
              <h3>Starter</h3>
              <p className={styles.pricingCardDesc}>Kichik do&apos;kon va startaplar uchun — 1C dan 2 baravar arzon</p>
            </div>
            <div className={styles.pricingPriceWrap}>
              <span className={styles.pricingAmount}>{isYearly ? "120,000" : "150,000"}</span>
              <span className={styles.pricingPeriod}>so&apos;m/oy</span>
            </div>
            {isYearly && <div style={{ textAlign: "center", fontSize: "0.82rem", color: "#10b981", marginTop: "-0.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>Yillik: 1,440,000 so&apos;m <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>1,800,000</span></div>}
            <ul className={styles.pricingFeatures}>
              <li><CheckCircle size={16} /> 1–5 xodim boshqaruvi</li>
              <li><CheckCircle size={16} /> Buxgalteriya (daromad/xarajat)</li>
              <li><CheckCircle size={16} /> Oylik soliq hisoboti</li>
              <li><CheckCircle size={16} /> AI maslahatchi (asosiy)</li>
              <li><CheckCircle size={16} /> Telegram bildirishnomalar</li>
              <li><CheckCircle size={16} /> POS Terminal (1 ta kassa)</li>
              <li><CheckCircle size={16} /> Email qo&apos;llab-quvvatlash</li>
            </ul>
            <Link href="/register" className={styles.pricingBtn}>
              14 kun bepul sinash <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Professional — Popular */}
          <motion.div
            className={`${styles.pricingCardPremium} ${styles.pricingCardPopular}`}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          >
            <div className={styles.animatedBorder}></div>
            <div className={styles.pricingCardGlow}></div>
            
            <div className={styles.pricingPopularBadge}>
              <Crown size={13} /> Eng mashhur
            </div>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingIconWrap} style={{ background: "rgba(74, 154, 173, 0.15)", color: "#4a9aad" }}>
                <Star size={24} />
              </div>
              <h3>Biznes</h3>
              <p className={styles.pricingCardDesc}>O&apos;rta bizneslar uchun — 1C + buxgalter narxidan 10x arzon</p>
            </div>
            <div className={styles.pricingPriceWrap}>
              <span className={styles.pricingAmount}>{isYearly ? "200,000" : "250,000"}</span>
              <span className={styles.pricingPeriod}>so&apos;m/oy</span>
            </div>
            {isYearly && <div style={{ textAlign: "center", fontSize: "0.82rem", color: "#10b981", marginTop: "-0.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>Yillik: 2,400,000 so&apos;m <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>3,000,000</span></div>}
            <ul className={styles.pricingFeatures}>
              <li><CheckCircle size={16} /> 5–20 xodim boshqaruvi</li>
              <li><CheckCircle size={16} /> To&apos;liq Buxgalteriya + HR</li>
              <li><CheckCircle size={16} /> AI CFO Maslahatchi (Gemini Pro)</li>
              <li><CheckCircle size={16} /> Avto soliq hisob-kitobi + QQS</li>
              <li><CheckCircle size={16} /> CRM (mijozlar bazasi)</li>
              <li><CheckCircle size={16} /> Ombor nazorati</li>
              <li><CheckCircle size={16} /> Shartnoma generatori</li>
              <li><CheckCircle size={16} /> POS Terminal (3 ta kassa)</li>
              <li><CheckCircle size={16} /> Face ID davomat tizimi</li>
              <li><CheckCircle size={16} /> Telegram + Ovozli hisobot</li>
            </ul>
            <Link href="/register" className={`${styles.pricingBtn} ${styles.pricingBtnPopular}`}>
              14 kun bepul sinash <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Enterprise */}
          <motion.div
            className={styles.pricingCardPremium}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            <div className={styles.pricingCardGlow}></div>
            <div className={styles.pricingCardHeader}>
              <div className={styles.pricingIconWrap} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                <Crown size={24} />
              </div>
              <h3>Premium</h3>
              <p className={styles.pricingCardDesc}>Yirik korxonalar uchun cheksiz imkoniyat va shaxsiy AI</p>
            </div>
            <div className={styles.pricingPriceWrap}>
              <span className={styles.pricingAmount}>{isYearly ? "360,000" : "450,000"}</span>
              <span className={styles.pricingPeriod}>so&apos;m/oy</span>
            </div>
            {isYearly && <div style={{ textAlign: "center", fontSize: "0.82rem", color: "#10b981", marginTop: "-0.5rem", marginBottom: "0.5rem", fontWeight: 600 }}>Yillik: 4,320,000 so&apos;m <span style={{ textDecoration: "line-through", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>5,400,000</span></div>}
            <ul className={styles.pricingFeatures}>
              <li><CheckCircle size={16} /> Cheksiz xodim boshqaruvi</li>
              <li><CheckCircle size={16} /> Barcha Biznes tarif imkoniyatlari</li>
              <li><CheckCircle size={16} /> Investor sahifasi (Data Room)</li>
              <li><CheckCircle size={16} /> AI Loss Prevention (audit)</li>
              <li><CheckCircle size={16} /> Maxsus o&apos;rgatilgan AI model</li>
              <li><CheckCircle size={16} /> Cheksiz POS terminallari</li>
              <li><CheckCircle size={16} /> 24/7 shaxsiy menejer</li>
              <li><CheckCircle size={16} /> API integratsiya</li>
            </ul>
            <Link href="/register" className={styles.pricingBtn}>
              Biz bilan bog&apos;laning <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>

        {/* 1C vs Boshqaruvchi AI Comparison */}
        <motion.div
          className={styles.pricingComparisonSection}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h3 className={styles.pricingComparisonTitle}>
            <TrendingUp size={22} /> Nega 1C emas, <span className={styles.saasAccent}>Boshqaruvchi AI?</span>
          </h3>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem", marginBottom: "2rem", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
            1C — faqat buxgalteriya. Boshqaruvchi AI — butun biznesingizni boshqarish.
          </p>
          <div className={styles.comparisonTableWrapper}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  <th>Imkoniyat</th>
                  <th className={styles.comparisonOld}>1C Buxgalteriya</th>
                  <th className={styles.comparisonNew}>Boshqaruvchi AI</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Yillik narxi", old: "3,000,000+ so'm", new: "1,440,000 dan", highlight: true },
                  { feature: "O'rnatish", old: "Kompyuter kerak", new: "Brauzerda ishlaydi", highlight: false },
                  { feature: "AI maslahatchi", old: "❌", new: "✅ Gemini Pro", highlight: false },
                  { feature: "CRM (mijozlar)", old: "❌", new: "✅", highlight: false },
                  { feature: "Ombor nazorati", old: "❌", new: "✅", highlight: false },
                  { feature: "Xodimlar boshqaruvi", old: "❌", new: "✅ + Face ID", highlight: false },
                  { feature: "POS Terminal", old: "❌", new: "✅", highlight: false },
                  { feature: "Telegram bildirishnoma", old: "❌", new: "✅ Real-time", highlight: false },
                  { feature: "Shartnoma generatori", old: "❌", new: "✅ AI bilan", highlight: false },
                  { feature: "Soliq optimizatsiya", old: "Qo'lda", new: "✅ Avtomatik AI", highlight: false },
                  { feature: "Mobil qurilmada", old: "❌", new: "✅ Istalgan qurilma", highlight: false },
                  { feature: "Mutaxassis yollash", old: "3-5 mln/oy", new: "Kerak emas", highlight: true },
                ].map((row, i) => (
                  <tr key={i} className={row.highlight ? styles.comparisonHighlight : ""}>
                    <td>{row.feature}</td>
                    <td className={styles.comparisonOldCell}>{row.old}</td>
                    <td className={styles.comparisonNewCell}>{row.new}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Guarantee badge */}
        <motion.div
          className={styles.pricingGuarantee}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        >
          <ShieldCheck size={20} />
          <span>14 kunlik bepul sinov + 30 kunlik to&apos;liq qaytarib berish kafolati. Hech qanday risk yo&apos;q.</span>
        </motion.div>
      </section>

      {/* ==========================================
          SECTION 6 — CTA
          ========================================== */}
      <section className={styles.ctaSection}>
        {/* Lottie Background Animation */}
        <div className={styles.ctaLottie}>
          <DotLottieReact
            src="https://lottie.host/e6f5c777-186c-442a-b1c2-5b0c214ef5f4/30BploIqVZ.lottie"
            loop
            autoplay
            style={{ width: "100%", height: "100%" }}
          />
        </div>
        <div className={styles.ctaOverlay}></div>
        <motion.div
          className={styles.ctaContent}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className={styles.ctaTitle}>
            Biznesingizni keyingi bosqichga olib chiqing
          </h2>
          <p className={styles.ctaSubtitle}>
            Boshqaruvchi AI orqali kompaniyangizni avtomatlashtiring, xarajatlarni qisqartiring va kelajak uchun mustahkam poydevor yarating.
          </p>
          <Link href="/register" className={styles.ctaBtn}>
            Bepul Boshlash <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ==========================================
          SECTION 5 — CONTACT US
          ========================================== */}
      <section className={styles.contactSection} id="contact">
        <motion.div
          className={styles.contactHeader}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className={styles.contactTitle}>
            Biz bilan <span className={styles.saasAccent}>bog'lanish</span>
          </h2>
          <p className={styles.contactSubtitle}>
            Savollaringiz bormi yoki biznesingiz uchun moslashtirilgan taklif kerakmi? Biz har doim aloqadamiz.
          </p>
        </motion.div>

        <div className={styles.contactLayout}>
          {/* Founder Profile */}
          <motion.div
            className={styles.founderBox}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.div 
              className={styles.founderImageWrapper}
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <img src="/founder.jpg" alt="Javohir Islomov - Boshqaruvchi AI Asoschisi" />
            </motion.div>
            <h3 className={styles.founderName}>Javohir Islomov</h3>
            <p className={styles.founderRole}>Boshqaruvchi AI Asoschisi</p>
          </motion.div>

          {/* Contact Cards Grid */}
          <div className={styles.contactGrid}>
            {[
              { 
                icon: <FaTelegramPlane />, 
                label: "Telegram", 
                value: "@Javohir_Islomov_07", 
                href: "https://t.me/Javohir_Islomov_07",
                iconClass: styles.iconTelegram 
              },
              { 
                icon: <FaInstagram />, 
                label: "Instagram", 
                value: "javohir_12021", 
                href: "https://instagram.com/javohir_12021",
                iconClass: styles.iconInstagram 
              },
              { 
                icon: <FaPhone />, 
                label: "Telefon", 
                value: "+998 93 107 88 16", 
                href: "tel:+998931078816",
                iconClass: styles.iconPhone 
              },
              { 
                icon: <FaEnvelope />, 
                label: "Email", 
                value: "islomovjavohir939@gmail.com", 
                href: "mailto:islomovjavohir939@gmail.com",
                iconClass: styles.iconEmail 
              }
            ].map((item, i) => (
              <motion.a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.contactCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              >
                <div className={`${styles.contactIconWrapper} ${item.iconClass}`}>
                  {item.icon}
                </div>
                <div>
                  <div className={styles.contactLabel}>{item.label}</div>
                  <div className={styles.contactValue}>{item.value}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerLinks}>
          <Link href="/privacy" className={styles.footerLink}>Maxfiylik siyosati</Link>
          <Link href="/terms" className={styles.footerLink}>Foydalanish shartlari</Link>
        </div>
        <p className={styles.footerCopy}>© 2024-2026 Boshqaruvchi AI. The Digital Executive.</p>
      </footer>
    </main>
    </>
  );
}
