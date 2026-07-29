"use client";

import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface TaxArticle {
    id: number;
    qism: string | null;
    bolim: string | null;
    bob: string | null;
    title: string;
    content: string[];
}

export default function TaxCodeViewer() {
    const [articles, setArticles] = useState<TaxArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedArticles, setExpandedArticles] = useState<Set<number>>(new Set());

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setPage(1); // Reset page on new search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            try {
                // Fetch from our local Next.js API route we just created
                const res = await fetch(`/api/taxes?q=${encodeURIComponent(debouncedQuery)}&page=${page}&limit=20`);
                if (res.ok) {
                    const data = await res.json();
                    setArticles(data.data);
                    setTotalPages(data.totalPages);
                } else {
                    console.error("Failed to fetch tax data");
                }
            } catch (error) {
                console.error("Error fetching tax code:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchArticles();
    }, [debouncedQuery, page]);

    const toggleArticle = (id: number) => {
        setExpandedArticles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Search Bar */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={18}
                        style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
                    />
                    <input
                        type="text"
                        placeholder="Kodeksdan qidirish (Masalan: soliq stavkasi)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.5rem',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            border: '1px solid var(--border-color)',
                            color: 'var(--text-primary)',
                            fontFamily: 'var(--font-sans), sans-serif',
                            borderRadius: '4px',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                        <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                            <BookOpen size={24} color="var(--accent-color)" />
                        </div>
                        <p>Qidirilmoqda...</p>
                    </div>
                ) : articles.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                        <BookOpen size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                        <p>Hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {articles.map((article) => {
                            const isExpanded = expandedArticles.has(article.id);
                            return (
                                <div key={article.id} style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '4px',
                                    backgroundColor: isExpanded ? 'rgba(var(--accent-rgb), 0.05)' : 'transparent',
                                    transition: 'all 0.2s',
                                    overflow: 'hidden'
                                }}>
                                    {/* Article Header (Clickable) */}
                                    <div
                                        onClick={() => toggleArticle(article.id)}
                                        style={{
                                            padding: '1rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginBottom: '0.3rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {article.qism && <span>{article.qism}</span>}
                                                {article.bolim && <span>• {article.bolim}</span>}
                                                {article.bob && <span>• {article.bob}</span>}
                                            </div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{article.title}</h3>
                                        </div>
                                        <div>
                                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                        </div>
                                    </div>

                                    {/* Article Content */}
                                    {isExpanded && (
                                        <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                            {article.content.map((paragraph, idx) => (
                                                <p key={idx} style={{
                                                    marginBottom: idx === article.content.length - 1 ? 0 : '1rem',
                                                    color: 'var(--text-primary)',
                                                    lineHeight: 1.6,
                                                    fontSize: '0.95rem',
                                                    textAlign: 'justify'
                                                }}>
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Pagination Setup */}
            {!loading && totalPages > 1 && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="btn-outline"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Oldingi
                    </button>
                    <span style={{ fontFamily: 'var(--font-sans)', color: 'var(--text-secondary)' }}>
                        Sahifa {page} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="btn-outline"
                        style={{ padding: '0.5rem 1rem' }}
                    >
                        Keyingi
                    </button>
                </div>
            )}
        </div>
    );
}
