"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, BookOpen, Clock, Star, GraduationCap, Video, Book, X, Play, Pause, Volume2, VolumeX } from "lucide-react";
import styles from "../leader-academy.module.css";
import dynamic from 'next/dynamic';

const BookViewer = dynamic(() => import('./BookViewer'), { ssr: false });

type VideoFile = any;
type BookFile = any;

type Props = {
    videos: VideoFile[];
    books: BookFile[];
};

/** Detect if URL is YouTube or Vimeo so we can embed via iframe */
function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    return null;
}

export default function LeaderAcademyClient({ videos, books }: Props) {
    const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [muted, setMuted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Book state
    const [selectedBook, setSelectedBook] = useState<BookFile | null>(null);
    const [bookOpened, setBookOpened] = useState(false);

    // Sync play/pause with the video element
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) v.play().catch(() => {});
        else v.pause();
    }, [playing]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = volume;
        v.muted = muted;
    }, [volume, muted]);

    const handleOpenVideo = useCallback((vid: VideoFile) => {
        setSelectedVideo(vid);
        setPlaying(true);
    }, []);

    const handleCloseVideo = useCallback(() => {
        setSelectedVideo(null);
        setPlaying(false);
    }, []);

    return (
        <div className={styles.academyContainer}>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
                <div className={styles.welcomeContent}>
                    <h2 className={styles.welcomeTitle}>
                        <GraduationCap size={36} className={styles.logoIcon} /> Leader Academy
                    </h2>
                    <p className={styles.welcomeSubtitle}>
                        Kelajak liderlarini yetishtirish uchun masterklass darajasidagi maxsus video darslar, kitoblar va strategik maslahatlar to&apos;plami.
                    </p>
                </div>
                <div className={styles.bannerActions}>
                    {/* Add resource action moved to owner panel */}
                </div>
            </div>

            {/* Video Darslar */}
            <div>
                <h3 className={styles.sectionTitle}>
                    <Video className={styles.sectionIcon} /> Maxsus Video Darslar
                </h3>

                {videos.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Video size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                        <p>Hozircha video darslar yuklanmagan.</p>
                    </div>
                ) : (
                    <div className={styles.courseGrid}>
                        {videos.map((vid: VideoFile) => (
                            <div key={vid.id} className={styles.courseCard} onClick={() => handleOpenVideo(vid)} style={{ cursor: "pointer" }}>
                                <div className={styles.thumbnailContainer}>
                                    {vid.thumbnail && (
                                        <img src={vid.thumbnail} alt={vid.title} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />
                                    )}
                                    <div style={{ position: "absolute", zIndex: 1, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0, 0, 0, 0.3)" }}>
                                        <PlayCircle size={64} className={styles.playIcon} />
                                    </div>
                                    <div className={styles.durationBadge}>{vid.duration || "N/A"}</div>
                                </div>
                                <div className={styles.courseContent}>
                                    <span className={styles.categoryTag}>{vid.category}</span>
                                    <h4 className={styles.courseTitle}>{vid.title}</h4>
                                    {vid.description && (
                                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem", lineHeight: "1.5" }}>
                                            {vid.description}
                                        </p>
                                    )}
                                    <div className={styles.instructorInfo}>
                                        <Star size={16} className={styles.instructorIcon} /> Spiker: {vid.instructor}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Elektron Kitoblar */}
            <div style={{ marginTop: "1rem" }}>
                <h3 className={styles.sectionTitle}>
                    <Book className={styles.sectionIcon} color="var(--accent-color)" /> Tavsiya etilgan Kitoblar
                </h3>

                {books.length === 0 ? (
                    <div className={styles.emptyState}>
                        <Book size={48} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
                        <p>Hozircha kitoblar kiritilmagan.</p>
                    </div>
                ) : (
                    <div className={styles.bookGrid}>
                        {books.map((book: BookFile) => (
                            <div key={book.id} className={styles.bookCard} onClick={() => { setSelectedBook(book); setBookOpened(true); }} style={{ cursor: "pointer" }}>
                                {/* Large Cover Image */}
                                <div className={styles.bookCover}>
                                    {book.coverUrl ? (
                                        <img src={book.coverUrl} alt={book.title} className={styles.bookCoverImg} />
                                    ) : (
                                        <div className={styles.bookCoverPlaceholder}>
                                            <BookOpen size={40} />
                                            <span>{book.title?.substring(0, 2)?.toUpperCase()}</span>
                                        </div>
                                    )}
                                    {/* Hover Overlay */}
                                    <div className={styles.bookCoverOverlay}>
                                        <span className={styles.bookReadBtn}>📖 O'qish</span>
                                    </div>
                                </div>
                                {/* Info Section */}
                                <div className={styles.bookContent}>
                                    <h4 className={styles.bookTitle}>{book.title}</h4>
                                    <p className={styles.bookAuthor}>{book.author}</p>
                                    {book.description && (
                                        <p className={styles.bookDesc}>{book.description}</p>
                                    )}
                                    <span className={styles.readTime}>
                                        <Clock size={13} /> {book.readTime || "N/A"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* PREMIUM CUSTOM VIDEO PLAYER MODAL            */}
            {/* ============================================ */}
            <AnimatePresence>
                {selectedVideo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={styles.videoModalOverlay}
                    >
                        <button className={styles.closeModalBtn} onClick={handleCloseVideo}>
                            <X size={28} />
                        </button>

                        <div className={styles.videoPlayerContainer}>
                            {(() => {
                                const embedUrl = getEmbedUrl(selectedVideo.videoUrl);
                                if (embedUrl) {
                                    // YouTube / Vimeo — use iframe
                                    return (
                                        <iframe
                                            src={embedUrl}
                                            allow="autoplay; fullscreen; encrypted-media"
                                            allowFullScreen
                                            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                        />
                                    );
                                }
                                // Direct video file — HTML5 <video>
                                return (
                                    <video
                                        ref={videoRef}
                                        src={selectedVideo.videoUrl}
                                        autoPlay
                                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }}
                                    />
                                );
                            })()}

                            {/* Premium Custom Player Controls (visible on hover) */}
                            <div className={styles.customVideoControls}>
                                <div className={styles.videoTitleBar}>
                                    <h3>{selectedVideo.title}</h3>
                                    <span>{selectedVideo.instructor}</span>
                                </div>

                                <div className={styles.controlsBar}>
                                    <button onClick={() => setPlaying(p => !p)} className={styles.controlBtn}>
                                        {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                                    </button>

                                    <div className={styles.volumeControl}>
                                        <button onClick={() => setMuted(m => !m)} className={styles.controlBtn}>
                                            {muted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                        </button>
                                        <input
                                            type="range"
                                            min={0} max={1} step="any"
                                            value={muted ? 0 : volume}
                                            onChange={(e) => { setVolume(parseFloat(e.target.value)); setMuted(false); }}
                                            className={styles.volumeSlider}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ============================================ */}
            {/* 3D INTERACTIVE BOOK FLIP MODAL               */}
            {/* ============================================ */}
            <AnimatePresence>
                {selectedBook && selectedBook.pdfUrl && (
                    <BookViewer 
                        pdfUrl={selectedBook.pdfUrl} 
                        title={selectedBook.title}
                        onClose={() => { setBookOpened(false); setTimeout(() => setSelectedBook(null), 100); }} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

