"use client";

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { taxEngine, BankTransaction } from '@/lib/tax/tax-engine';
import {
  FileUp, Calculator, FileText, CheckCircle2, AlertCircle, Info,
  ChevronRight, Building2, Database, Upload, TrendingUp, Wallet,
  Users, BarChart3, ArrowRight, ChevronDown, Shield, Zap, RefreshCw,
  Brain, Sparkles, X, FileSpreadsheet, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import styles from './TaxDashboard.module.css';

// Props — server komponentdan keladigan haqiqiy ma'lumotlar
interface TaxDashboardProps {
  serverData: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    totalSalaryFund: number;
    employeeCount: number;
    inventoryValue: number;
    transactionCount: number;
  };
}

type DataSource = 'database' | 'file';
type IndustryType = 'umumiy' | 'bank' | 'sement' | 'budjet_tashkilot' | 'it_park';

export default function TaxDashboard({ serverData }: TaxDashboardProps) {
  // Data source
  const [dataSource, setDataSource] = useState<DataSource>('database');
  const [fileTransactions, setFileTransactions] = useState<BankTransaction[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [aiSummary, setAiSummary] = useState<any>(null);

  // Tax settings
  const [taxRegime, setTaxRegime] = useState<'turnover' | 'vat_profit'>('turnover');
  const [industry, setIndustry] = useState<IndustryType>('umumiy');
  const [isExporter, setIsExporter] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Property & Land inputs
  const [propertyValue, setPropertyValue] = useState<number>(0);
  const [landArea, setLandArea] = useState<number>(0);
  const [waterUsage, setWaterUsage] = useState<number>(0);

  // Results
  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const industryOptions = [
    { value: 'umumiy', label: 'Umumiy (Standart soliqlar)', icon: '🏢' },
    { value: 'it_park', label: 'IT Park Rezidenti (Imtiyozli)', icon: '💻' },
    { value: 'bank', label: 'Tijorat Banki', icon: '🏦' },
    { value: 'sement', label: 'Sement ishlab chiqaruvchi', icon: '🏗️' },
    { value: 'budjet_tashkilot', label: 'Budjet tashkiloti', icon: '🏛️' }
  ];
  const selectedIndustryLabel = industryOptions.find(opt => opt.value === industry)?.label;
  const selectedIndustryIcon = industryOptions.find(opt => opt.value === industry)?.icon;

  // Haqiqiy database ma'lumotlariga asoslangan tranzaksiya ro'yxati
  const databaseTransactions: BankTransaction[] = useMemo(() => {
    const txs: BankTransaction[] = [];
    if (serverData.totalIncome > 0) {
      txs.push({
        id: 'db-income', date: new Date().toISOString().split('T')[0],
        amount: serverData.totalIncome, type: 'kredit',
        purpose: 'Tizimdagi jami tushum (daromad)', counterparty: 'Turli mijozlar', isCategorized: false,
      });
    }
    if (serverData.totalExpense > 0) {
      txs.push({
        id: 'db-expense', date: new Date().toISOString().split('T')[0],
        amount: serverData.totalExpense, type: 'debet',
        purpose: 'Tizimdagi jami xarajatlar', counterparty: 'Turli kontragentlar', isCategorized: false,
      });
    }
    if (serverData.totalSalaryFund > 0) {
      txs.push({
        id: 'db-payroll', date: new Date().toISOString().split('T')[0],
        amount: serverData.totalSalaryFund, type: 'debet',
        purpose: 'Xodimlarga oylik ish haqi (Zarplata)', counterparty: `${serverData.employeeCount} ta xodim`, isCategorized: false,
      });
    }
    return txs;
  }, [serverData]);

  // Auto-calculate on mount when we have database data
  useEffect(() => {
    if (databaseTransactions.length > 0 && dataSource === 'database') {
      performCalculation(databaseTransactions);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // === AI BILAN EXCEL TAHLIL ===
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisProgress('📄 Fayl o\'qilmoqda...');

    try {
      // 1-qadam: Faylni o'qish
      const rawRows = await readExcelFile(file);
      
      if (rawRows.length === 0) {
        setAnalysisError("Fayl bo'sh yoki formatni tushunib bo'lmadi");
        setIsAnalyzing(false);
        return;
      }

      setAnalysisProgress(`📊 ${rawRows.length} ta qator topildi. AI tahlil qilmoqda...`);

      // 2-qadam: AI ga jo'natish
      const response = await fetch('/api/tax-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawRows, fileName: file.name }),
      });

      const data = await response.json();

      if (!data.success) {
        setAnalysisError(data.error || "AI tahlil qilishda xatolik");
        setIsAnalyzing(false);
        return;
      }

      setAnalysisProgress(`✅ ${data.transactions.length} ta tranzaksiya tahlil qilindi!`);

      // 3-qadam: Tranzaksiyalarni saqlash
      const txs: BankTransaction[] = data.transactions.map((t: any) => ({
        id: t.id,
        date: t.date,
        amount: t.amount,
        type: t.type as 'debet' | 'kredit',
        purpose: t.purpose,
        counterparty: t.counterparty,
        isCategorized: true,
        category: t.category,
      }));

      setFileTransactions(txs);
      setAiSummary(data.summary);
      setDataSource('file');

      // 4-qadam: Darhol soliqlarni hisoblash
      setTimeout(() => {
        performCalculation(txs);
        setIsAnalyzing(false);
      }, 500);

    } catch (err: any) {
      console.error("File analysis error:", err);
      setAnalysisError(err.message || "Noma'lum xatolik");
      setIsAnalyzing(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          resolve(data);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const performCalculation = (txs: BankTransaction[]) => {
    setIsCalculating(true);
    const assets = {
      industry, isExporter, propertyValue, landArea,
      waterUsageM3: waterUsage, isExcisePayer: false, isSubsoilUser: false,
    };
    setTimeout(() => {
      const calcResults = taxEngine.calculateTaxes(txs, taxRegime, assets);
      const totalTax = calcResults.taxes.reduce((s: number, t: any) => s + t.calculatedTax, 0);
      const finalResults = { ...calcResults, summary: { ...calcResults.summary, totalTax } };
      setResults(finalResults);
      setIsCalculating(false);
    }, 300);
  };

  const handleCalculate = () => {
    const txs = dataSource === 'database' ? databaseTransactions : fileTransactions;
    if (txs.length === 0) return;
    performCalculation(txs);
  };

  const hasDbData = serverData.totalIncome > 0 || serverData.totalExpense > 0 || serverData.totalSalaryFund > 0;
  const hasFileData = fileTransactions.length > 0;
  const currentTxs = dataSource === 'database' ? databaseTransactions : fileTransactions;

  const formatSum = (n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + ' mlrd';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + ' mln';
    return n.toLocaleString();
  };

  return (
    <div className={styles.container}>

      {/* === HEADER === */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>
            <Calculator size={24} />
            Avtomatlashtirilgan Soliq Markazi
          </h2>
          <p className={styles.subtitle}>
            Tizim ma'lumotlari yoki yuklangan Excel faylni AI tahlil qilib soliqlarni avtomatik hisoblaydi.
          </p>
        </div>
        <div className={styles.headerBadges}>
          <div className={styles.badge}>
            <Brain size={14} />
            Gemini AI Tahlil
          </div>
          <div className={styles.badgeGreen}>
            <Shield size={14} />
            O'zR Soliq Kodeksi
          </div>
        </div>
      </div>

      {/* === DATA SOURCE SELECTOR === */}
      <div className={styles.dataSourceRow}>
        <button
          className={`${styles.dataSourceBtn} ${dataSource === 'database' ? styles.dataSourceBtnActive : ''}`}
          onClick={() => { setDataSource('database'); if (hasDbData) handleCalculate(); }}
        >
          <Database size={20} />
          <div>
            <span className={styles.dataSourceTitle}>Tizim ma'lumotlari</span>
            <span className={styles.dataSourceDesc}>
              {hasDbData ? `${serverData.transactionCount} ta tranzaksiya · ${serverData.employeeCount} ta xodim` : 'Ma\'lumot topilmadi'}
            </span>
          </div>
          {hasDbData && dataSource === 'database' && <CheckCircle2 size={16} className={styles.dataSourceCheck} />}
        </button>

        <button
          className={`${styles.dataSourceBtn} ${dataSource === 'file' ? styles.dataSourceBtnActive : ''}`}
          onClick={() => { if (hasFileData) setDataSource('file'); else fileInputRef.current?.click(); }}
        >
          <FileSpreadsheet size={20} />
          <div>
            <span className={styles.dataSourceTitle}>
              {isAnalyzing ? 'AI tahlil qilmoqda...' : 'Excel / CSV yuklash'}
            </span>
            <span className={styles.dataSourceDesc}>
              {isAnalyzing ? analysisProgress : (hasFileData ? `${fileName} · ${fileTransactions.length} ta tranzaksiya` : 'Bank vipiskasini AI tahlil qiladi')}
            </span>
          </div>
          {isAnalyzing ? (
            <Loader2 size={18} className={styles.spin} />
          ) : hasFileData && dataSource === 'file' ? (
            <CheckCircle2 size={16} className={styles.dataSourceCheck} />
          ) : (
            <Upload size={16} style={{ opacity: 0.4 }} />
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".csv,.xlsx,.xls"
          className={styles.hiddenInput}
        />
      </div>

      {/* AI Analysis Error */}
      {analysisError && (
        <div className={styles.errorBox}>
          <AlertCircle size={16} />
          <span>{analysisError}</span>
          <button className={styles.errorClose} onClick={() => setAnalysisError('')}><X size={14} /></button>
        </div>
      )}

      {/* AI Summary after file analysis */}
      {aiSummary && dataSource === 'file' && (
        <div className={styles.aiSummaryBox}>
          <div className={styles.aiSummaryHeader}>
            <Sparkles size={16} />
            <span>AI tahlili yakunlandi — {fileName}</span>
          </div>
          <div className={styles.aiSummaryStats}>
            <div><span>Jami qatorlar:</span> <b>{aiSummary.totalRows}</b></div>
            <div><span>Jami kirim:</span> <b className={styles.green}>{formatSum(aiSummary.totalIncome)} so'm</b></div>
            <div><span>Jami chiqim:</span> <b className={styles.orange}>{formatSum(aiSummary.totalExpense)} so'm</b></div>
          </div>
          <button className={styles.reuploadBtn} onClick={() => fileInputRef.current?.click()}>
            <RefreshCw size={14} /> Boshqa fayl yuklash
          </button>
        </div>
      )}

      {/* === MINI STATS FROM REAL DATA === */}
      {dataSource === 'database' && hasDbData && (
        <div className={styles.miniStatsGrid}>
          <div className={styles.miniStat}>
            <TrendingUp size={18} className={styles.miniStatIcon} />
            <div>
              <span className={styles.miniStatLabel}>Jami Daromad</span>
              <span className={styles.miniStatValue}>{formatSum(serverData.totalIncome)} so'm</span>
            </div>
          </div>
          <div className={styles.miniStat}>
            <Wallet size={18} className={styles.miniStatIconRed} />
            <div>
              <span className={styles.miniStatLabel}>Jami Xarajat</span>
              <span className={styles.miniStatValue}>{formatSum(serverData.totalExpense)} so'm</span>
            </div>
          </div>
          <div className={styles.miniStat}>
            <Users size={18} className={styles.miniStatIconYellow} />
            <div>
              <span className={styles.miniStatLabel}>Ish Haqi Fondi</span>
              <span className={styles.miniStatValue}>{formatSum(serverData.totalSalaryFund)} so'm</span>
            </div>
          </div>
          <div className={styles.miniStat}>
            <BarChart3 size={18} className={styles.miniStatIconGreen} />
            <div>
              <span className={styles.miniStatLabel}>Sof Foyda</span>
              <span className={styles.miniStatValue}>{formatSum(serverData.netProfit)} so'm</span>
            </div>
          </div>
        </div>
      )}

      {/* === MAIN GRID: Settings + Results === */}
      <div className={styles.grid}>

        {/* LEFT: Tax Settings */}
        <div className={styles.settingsColumn}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Zap size={18} /> Soliq Rejimi</h3>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioLabel} ${taxRegime === 'turnover' ? styles.radioLabelActive : ''}`}>
                <input type="radio" name="regime" checked={taxRegime === 'turnover'} onChange={() => setTaxRegime('turnover')} className={styles.radioInput} />
                <div className={styles.radioText}>
                  <span className={styles.radioTitle}>Aylanmadan olinadigan soliq</span>
                  <span className={styles.radioDesc}>Yillik aylanma 1 mlrd so'mgacha · 4%</span>
                </div>
              </label>
              <label className={`${styles.radioLabel} ${taxRegime === 'vat_profit' ? styles.radioLabelActive : ''}`}>
                <input type="radio" name="regime" checked={taxRegime === 'vat_profit'} onChange={() => setTaxRegime('vat_profit')} className={styles.radioInput} />
                <div className={styles.radioText}>
                  <span className={styles.radioTitle}>QQS + Foyda solig'i</span>
                  <span className={styles.radioDesc}>Umumbelgilangan soliqlar · QQS 12%, Foyda 15%</span>
                </div>
              </label>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}><Building2 size={18} /> Korxona Holati</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Faoliyat sohasi</label>
              <div className={styles.customSelectWrapper} ref={dropdownRef}>
                <div className={styles.customSelectHeader} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                  <span>{selectedIndustryIcon} {selectedIndustryLabel}</span>
                  <ChevronDown size={16} className={`${styles.customSelectIcon} ${isDropdownOpen ? styles.customSelectIconOpen : ''}`} />
                </div>
                {isDropdownOpen && (
                  <div className={styles.customSelectList}>
                    {industryOptions.map((opt) => (
                      <div key={opt.value} className={`${styles.customSelectItem} ${industry === opt.value ? styles.customSelectItemSelected : ''}`}
                        onClick={() => { setIndustry(opt.value as IndustryType); setIsDropdownOpen(false); }}>
                        {opt.icon} {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <label className={styles.checkboxLabel}>
              <input type="checkbox" checked={isExporter} onChange={(e) => setIsExporter(e.target.checked)} className={styles.checkbox} />
              <div className={styles.radioText}>
                <span className={styles.radioTitle}>Eksport qiluvchi</span>
                <span className={styles.radioDesc}>QQS 0% stavkada (260-modda)</span>
              </div>
            </label>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}><BarChart3 size={18} /> Qo'shimcha Aktivlar</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mol-mulk qiymati (so'm)</label>
              <input type="number" className={styles.textInput} placeholder="500 000 000"
                value={propertyValue || ''} onChange={e => setPropertyValue(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Yer maydoni (gektar)</label>
              <input type="number" className={styles.textInput} placeholder="0.5"
                value={landArea || ''} onChange={e => setLandArea(Number(e.target.value))} step="0.01" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Suv iste'moli (kub.m/oy)</label>
              <input type="number" className={styles.textInput} placeholder="1500"
                value={waterUsage || ''} onChange={e => setWaterUsage(Number(e.target.value))} />
            </div>
          </div>

          <button onClick={handleCalculate} disabled={currentTxs.length === 0 || isCalculating} className={styles.calcBtn}>
            {isCalculating ? (
              <><RefreshCw size={20} className={styles.spin} /> Hisoblanmoqda...</>
            ) : (
              <><Calculator size={20} /> Qayta Hisoblash</>
            )}
          </button>
        </div>

        {/* RIGHT: Results */}
        <div>
          {results ? (
            <div className={styles.resultsContainer}>
              <div className={styles.resultsHeader}>
                <div className={styles.resultsHeaderTop}>
                  <div>
                    <h3 className={styles.resultsTitle}>
                      <CheckCircle2 size={20} />
                      Soliq Hisoboti
                    </h3>
                    <p className={styles.resultsDesc}>
                      {dataSource === 'database' ? 'Tizim ma\'lumotlari' : `${fileName} (AI tahlili)`} asosida hisoblangan
                    </p>
                  </div>
                  <div className={styles.totalTaxBox}>
                    <span className={styles.totalTaxLabel}>Jami soliq:</span>
                    <span className={styles.totalTaxValue}>{results.summary.totalTax?.toLocaleString()} so'm</span>
                  </div>
                </div>
                <div className={styles.statsGrid}>
                  <div className={styles.statBox}>
                    <p className={styles.statLabel}>Jami Kirim</p>
                    <p className={styles.statValue}>{formatSum(results.summary.totalIncome)}</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statLabel}>Soliqqa tortiladigan</p>
                    <p className={`${styles.statValue} ${styles.green}`}>{formatSum(results.summary.taxableIncome)}</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statLabel}>Ish haqi fondi</p>
                    <p className={`${styles.statValue} ${styles.orange}`}>{formatSum(results.summary.totalPayroll)}</p>
                  </div>
                  <div className={styles.statBox}>
                    <p className={styles.statLabel}>Xarajatlar</p>
                    <p className={styles.statValue}>{formatSum(results.summary.deductibleExpenses)}</p>
                  </div>
                </div>
              </div>

              <div className={styles.taxListWrapper}>
                <div className={styles.taxListHeader}>
                  <AlertCircle size={18} color="#fbbf24" />
                  <h3>To'lanishi lozim bo'lgan soliqlar ({results.taxes.length})</h3>
                </div>
                <div className={styles.taxList}>
                  {results.taxes.map((tax: any, idx: number) => (
                    <div key={idx} className={styles.taxItem}>
                      <div className={styles.taxHeader}>
                        <div>
                          <h4 className={styles.taxName}>{tax.type}</h4>
                          <span className={styles.taxRef}>O'zR SK: {tax.reference}</span>
                        </div>
                        <div className={styles.taxAmountWrap}>
                          <p className={styles.taxAmountLabel}>Hisoblangan summa</p>
                          <p className={styles.taxAmount}>
                            {tax.calculatedTax.toLocaleString()} <span className={styles.taxCurrency}>so'm</span>
                          </p>
                        </div>
                      </div>
                      <div className={styles.taxDetails}>
                        <div>
                          <span className={styles.taxDetailLabel}>Bazasi:</span>
                          <span className={styles.taxDetailValue}>{typeof tax.baseAmount === 'number' ? tax.baseAmount.toLocaleString() : tax.baseAmount}</span>
                        </div>
                        <div className={styles.taxDivider}></div>
                        <div>
                          <span className={styles.taxDetailLabel}>Stavka:</span>
                          <span className={styles.taxRate}>{tax.rate}</span>
                        </div>
                      </div>
                      <div className={styles.taxAction}>
                        <ArrowRight size={14} />
                        <span><b>Soliq.uz:</b> {tax.action}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              {isCalculating ? (
                <>
                  <RefreshCw size={48} className={styles.spin} />
                  <p className={styles.emptyTitle}>Soliqlar hisoblanmoqda...</p>
                </>
              ) : isAnalyzing ? (
                <>
                  <Brain size={48} className={styles.pulseIcon} />
                  <p className={styles.emptyTitle}>AI fayl tahlil qilmoqda...</p>
                  <p className={styles.emptyDesc}>{analysisProgress}</p>
                </>
              ) : (
                <>
                  <Calculator size={48} />
                  <p className={styles.emptyTitle}>Natijalar shu yerda ko'rsatiladi</p>
                  <p className={styles.emptyDesc}>
                    {hasDbData
                      ? 'Tizimda ma\'lumotlar mavjud. "Qayta Hisoblash" tugmasini bosing.'
                      : 'Avval tranzaksiyalar kiriting yoki Excel fayl yuklang.'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
