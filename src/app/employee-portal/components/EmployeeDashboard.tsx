"use client";

import { useState } from "react";
import { sendMessage } from "@/actions/employee";
import styles from "../employee.module.css";
import { CheckSquare, Calendar, Target, MessageSquare, Clock, MapPin, Search, Shield } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import MessagesClient from "@/app/(dashboard)/messages/components/MessagesClient";
import FaceIdEnrollCard from "./FaceIdEnrollCard";
import FaceIdCheckCard from "./FaceIdCheckCard";

const AttendanceMap = dynamic(() => import("./AttendanceMap"), {
    ssr: false,
    loading: () => <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.05)", borderRadius: "var(--radius-lg)" }}>Xarita yuklanmoqda...</div>
});

export default function EmployeeDashboard({ user, tasks, attendance, allMessages, bossUsers }: any) {
    const [activeTab, setActiveTab] = useState("overview");
    const [messageLoading, setMessageLoading] = useState(false);
    const [messageSuccess, setMessageSuccess] = useState(false);
    const [isGeoLoading, setIsGeoLoading] = useState(false);
    const [empLocation, setEmpLocation] = useState<{lat: number, lng: number} | null>(null);

    // Xarita uchun darhol lokatsiyani olish
    useState(() => {
        if (typeof window !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setEmpLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => console.warn("GPS ruxsati berilmadi"),
                { enableHighAccuracy: true }
            );
            
            // Doimiy kuzatish
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setEmpLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => {},
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    });

    const handleGeoAttendance = async (type: "CHECK_IN" | "CHECK_OUT") => {
        setIsGeoLoading(true);
        if (!navigator.geolocation) {
            toast.error("Brauzeringiz GPS-ni qo'llab-quvvatlamaydi!");
            setIsGeoLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { processGeolocationAttendance } = await import("@/actions/attendance");
                    const res = await processGeolocationAttendance(pos.coords.latitude, pos.coords.longitude, type, navigator.userAgent);
                    if (res.error) {
                        toast.error(res.error);
                    } else {
                        if (res.status === "LATE") {
                            toast.error(`Kech qoldingiz! Tasdiqlash vaqti tugagan. (Masofa: ${res.distance}m)`, { duration: 4000, style: { background: "rgba(239, 68, 68, 0.9)", color: "white" } });
                        } else {
                            toast.success(`Muvaffaqiyatli saqlandi! (Masofangiz: ${res.distance}m)`);
                        }
                        setTimeout(() => window.location.reload(), 2000);
                    }
                } catch (e) {
                    toast.error("Tizimda xatolik yuz berdi");
                }
                setIsGeoLoading(false);
            },
            () => {
                toast.error("GPS ruxsatini bermadingiz!");
                setIsGeoLoading(false);
            },
            { enableHighAccuracy: true }
        );
    };

    const todayRecord = attendance?.find((a: any) => {
        const d = new Date(a.date);
        const today = new Date();
        return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    const hasCheckedIn = todayRecord && todayRecord.checkIn;
    const hasCheckedOut = todayRecord && todayRecord.checkOut;



    const handleAcceptTask = async (taskId: string, title: string) => {
        const formData = new FormData();
        formData.append("taskId", taskId);
        formData.append("title", title);
        await sendMessage(user.id, formData, true); // True flag = isTaskAcceptNotification
        window.location.reload();
    };

    return (
        <div className="animate-slide-up">
            {/* Tabs */}
            <div className={styles.tabsContainer}>
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`${styles.tabButton} ${activeTab === "overview" ? styles.active : ""}`}
                >
                    Asosiy Ko'rsatkichlar
                </button>
                <button
                    onClick={() => setActiveTab("tasks")}
                    className={`${styles.tabButton} ${activeTab === "tasks" ? styles.active : ""}`}
                >
                    Mening Vazifalarim
                    {tasks.filter((t: any) => t.status === "TODO").length > 0 && (
                        <span style={{ marginLeft: "8px", background: "var(--primary-color)", color: "white", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem" }}>
                            {tasks.filter((t: any) => t.status === "TODO").length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab("faceid")}
                    className={`${styles.tabButton} ${activeTab === "faceid" ? styles.active : ""}`}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Shield size={16} />
                        Face ID
                        {!user.employeeProfile?.faceDescriptor && (
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                        )}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("message")}
                    className={`${styles.tabButton} ${activeTab === "message" ? styles.active : ""}`}
                >
                    Boshliqqa Xabar
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
                <div>
                    <div className={styles.grid}>
                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <div style={{ padding: "8px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", color: "#3b82f6" }}>
                                    <Target size={20} />
                                </div>
                                Oylik Maosh
                            </h3>
                            <div className={styles.statValue}>{user.employeeProfile.salary.toLocaleString()} <span style={{ fontSize: "1rem", color: "var(--text-secondary)" }}>so'm</span></div>
                            <div className={styles.statLabel}>Tasdiqlangan barqaror oylik maosh</div>
                        </div>

                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <div style={{ padding: "8px", background: "rgba(16, 185, 129, 0.1)", borderRadius: "8px", color: "var(--success-color)" }}>
                                    <CheckSquare size={20} />
                                </div>
                                KPI Foizi
                            </h3>
                            <div className={styles.statValue} style={{ color: user.employeeProfile.performance >= 80 ? "var(--success-color)" : "var(--warning-color)" }}>
                                {user.employeeProfile.performance}%
                            </div>
                            <div className={styles.statLabel}>Joriy oydagi ko'rsatkichlar samaradorligi</div>
                        </div>

                        <div className={styles.card}>
                            <h3 className={styles.cardTitle}>
                                <div style={{ padding: "8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", color: "var(--error-color)" }}>
                                    <Calendar size={20} />
                                </div>
                                Intizom (Kartochkalar)
                            </h3>
                            <div style={{ display: "flex", gap: "2rem", marginTop: "0.5rem" }}>
                                <div>
                                    <div className={styles.statValue} style={{ color: "var(--warning-color)", fontSize: "1.75rem" }}>{user.employeeProfile.yellowCards}</div>
                                    <div className={styles.statLabel}>Sariq kartochka</div>
                                </div>
                                <div style={{ width: "1px", background: "var(--border-subtle)" }}></div>
                                <div>
                                    <div className={styles.statValue} style={{ color: "var(--error-color)", fontSize: "1.75rem" }}>{user.employeeProfile.redCards}</div>
                                    <div className={styles.statLabel}>Qizil kartochka</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Face ID Attendance Card */}
                    <FaceIdCheckCard user={user} todayRecord={todayRecord} />

                    {/* Geo Attendance Card */}
                    <div className={styles.card} style={{ marginTop: "1.5rem", marginBottom: "1.5rem", background: "linear-gradient(145deg, rgba(59, 130, 246, 0.05) 0%, rgba(99, 102, 241, 0.05) 100%)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                            <div>
                                <h3 className={styles.cardTitle} style={{ marginBottom: "0.5rem" }}>
                                    <MapPin size={22} color="#3b82f6" />
                                    Avtomatlashtirilgan Davomat (GPS)
                                </h3>
                                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "500px", lineHeight: "1.5" }}>
                                    Ofis hududiga kelganingizda va ketishingizda quyidagi tugmalarni bosib, kuningizni avtomatik hisoblang.
                                </p>
                                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                                    <Clock size={16} color="var(--primary-color)" />
                                    <span style={{ color: "var(--text-secondary)" }}>Check-in muddati:</span>
                                    <strong style={{ color: "var(--primary-color)" }}>{user.company?.workStartTime || "09:00"}</strong>
                                    {(() => {
                                        const now = new Date();
                                        const [h, m] = (user.company?.workStartTime || "09:00").split(":").map(Number);
                                        const deadline = new Date();
                                        deadline.setHours(h, m, 0, 0);
                                        if (now > deadline && !hasCheckedIn) {
                                            return <span style={{ marginLeft: "0.5rem", color: "var(--error-color)", background: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: "4px", fontSize: "0.8rem", fontWeight: "600" }}>KECH QOLDINGIZ!</span>;
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                            
                            <div style={{ width: "100%", marginTop: "1rem", marginBottom: "1.5rem" }}>
                                {user.company?.officeLat && user.company?.officeLng ? (
                                    <AttendanceMap 
                                        officeLat={user.company.officeLat} 
                                        officeLng={user.company.officeLng} 
                                        officeRadius={user.company.officeRadius || 50} 
                                        employeeLat={empLocation?.lat} 
                                        employeeLng={empLocation?.lng} 
                                    />
                                ) : (
                                    <div style={{ padding: "2rem", textAlign: "center", background: "rgba(239, 68, 68, 0.1)", color: "var(--error-color)", borderRadius: "var(--radius-lg)" }}>
                                        Boshliq tomonidan ofis GPS koordinatalari kiritilmagan. Davomat ishlamaydi.
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", width: "100%", justifyContent: "flex-end" }}>
                                <button 
                                    onClick={() => handleGeoAttendance("CHECK_IN")}
                                    disabled={isGeoLoading || hasCheckedIn}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "var(--radius-md)",
                                        border: "none",
                                        fontWeight: "600",
                                        fontSize: "0.95rem",
                                        cursor: isGeoLoading || hasCheckedIn ? "not-allowed" : "pointer",
                                        background: hasCheckedIn ? "rgba(255,255,255,0.05)" : "var(--primary-color)",
                                        color: hasCheckedIn ? "var(--text-muted)" : "white",
                                        boxShadow: hasCheckedIn ? "none" : "0 4px 15px rgba(59, 130, 246, 0.4)",
                                        transition: "all 0.3s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}
                                >
                                    {isGeoLoading ? "Kuting..." : hasCheckedIn ? "Kelgan (Check-In qilingan)" : "Ishga Keldim (Check In)"}
                                </button>
                                
                                <button 
                                    onClick={() => handleGeoAttendance("CHECK_OUT")}
                                    disabled={isGeoLoading || !hasCheckedIn || hasCheckedOut}
                                    style={{
                                        padding: "0.75rem 1.5rem",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid",
                                        borderColor: (!hasCheckedIn || hasCheckedOut) ? "rgba(255,255,255,0.05)" : "rgba(239, 68, 68, 0.5)",
                                        fontWeight: "600",
                                        fontSize: "0.95rem",
                                        cursor: isGeoLoading || !hasCheckedIn || hasCheckedOut ? "not-allowed" : "pointer",
                                        background: (!hasCheckedIn || hasCheckedOut) ? "rgba(255,255,255,0.02)" : "rgba(239, 68, 68, 0.1)",
                                        color: (!hasCheckedIn || hasCheckedOut) ? "var(--text-muted)" : "var(--error-color)",
                                        transition: "all 0.3s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.5rem"
                                    }}
                                >
                                    {isGeoLoading ? "Kuting..." : hasCheckedOut ? "Ketgan (Check-Out qilingan)" : "Ishdan Ketdim (Check Out)"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Face ID Enrollment Card — Overview ichida ham ko'rsatish */}
                    <FaceIdEnrollCard
                        userId={user.id}
                        hasExistingFaceId={!!user.employeeProfile?.faceDescriptor}
                        currentAvatar={user.employeeProfile?.avatarUrl || null}
                    />

                    <div className={styles.card}>
                        <h3 className={styles.cardTitle}>
                            <Clock size={20} color="var(--text-muted)" />
                            Oxirgi Davomat Tarixi
                        </h3>
                        {attendance.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-secondary)" }}>
                                <Search size={40} style={{ opacity: 0.2, marginBottom: "1rem" }} />
                                <p>Davomat tarixi mavjud emas.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)" }}>
                                <table className={styles.attendanceTable}>
                                    <thead>
                                        <tr>
                                            <th>Sana</th>
                                            <th>Vaqt</th>
                                            <th>Holat</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map((record: any) => (
                                            <tr key={record.id}>
                                                <td>
                                                    <strong style={{ color: "var(--text-primary)" }}>
                                                        {new Date(record.date).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </strong>
                                                </td>
                                                <td style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                                    9:00 - 18:00
                                                </td>
                                                <td>
                                                    {record.status === "PRESENT" && <span style={{ color: "var(--success-color)", background: "rgba(16, 185, 129, 0.1)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>Kelgan</span>}
                                                    {record.status === "ABSENT" && <span style={{ color: "var(--error-color)", background: "rgba(239, 68, 68, 0.1)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>Kelmagan</span>}
                                                    {record.status === "LATE" && <span style={{ color: "var(--warning-color)", background: "rgba(245, 158, 11, 0.1)", padding: "4px 10px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" }}>Kechikkan</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "tasks" && (
                <div className={styles.card}>
                    <h3 className={styles.cardTitle}>
                        <CheckSquare size={20} color="var(--primary-color)" />
                        Menga biriktirilgan vazifalar
                    </h3>

                    <div className={styles.taskList} style={{ marginTop: "1.5rem" }}>
                        {tasks.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--text-secondary)", background: "rgba(0,0,0,0.1)", borderRadius: "var(--radius-lg)" }}>
                                <Target size={48} style={{ opacity: 0.2, margin: "0 auto 1.5rem auto", display: "block" }} />
                                <p style={{ fontSize: "1.1rem" }}>Hozircha sizga biriktirilgan vazifalar yo'q.</p>
                                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", opacity: 0.8 }}>Yangi vazifalar paydo bo'lganda shu yerda ko'rinadi.</p>
                            </div>
                        ) : (
                            tasks.map((task: any) => (
                                <div key={task.id} className={`${styles.taskItem} ${styles[task.status.toLowerCase()]}`}>
                                    <div style={{ flex: 1, paddingRight: "1rem" }}>
                                        <div className={styles.taskTitle}>{task.title}</div>
                                        {task.description && <div className={styles.taskDesc}>{task.description}</div>}
                                        {task.dueDate && (
                                            <div className={styles.taskMeta}>
                                                <Calendar size={14} />
                                                <span>Muddat: <strong style={{ color: "var(--text-primary)" }}>{new Date(task.dueDate).toLocaleDateString("uz-UZ", { day: 'numeric', month: 'short' })}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end", minWidth: "120px" }}>
                                        <div className={styles.taskStatus} style={{
                                            color: task.status === "TODO" ? "var(--primary-color)" : task.status === "IN_PROGRESS" ? "var(--warning-color)" : "var(--success-color)",
                                            borderColor: task.status === "TODO" ? "rgba(99, 102, 241, 0.3)" : task.status === "IN_PROGRESS" ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"
                                        }}>
                                            {task.status === "TODO" && "Bajarilishi kerak"}
                                            {task.status === "IN_PROGRESS" && "Jarayonda"}
                                            {task.status === "DONE" && "Yakunlangan"}
                                        </div>
                                        {task.status === "TODO" && (
                                            <button
                                                onClick={() => handleAcceptTask(task.id, task.title)}
                                                className={styles.taskBtn}
                                            >
                                                Qabul Qildim
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === "faceid" && (
                <div>
                    <div className={styles.card} style={{ marginBottom: "1.5rem", background: "linear-gradient(145deg, rgba(16,185,129,0.04), rgba(16,185,129,0.01))" }}>
                        <h3 className={styles.cardTitle}>
                            <div style={{ padding: "8px", background: "rgba(16,185,129,0.1)", borderRadius: "8px", color: "#10b981" }}>
                                <Shield size={20} />
                            </div>
                            Face ID Sozlamalari
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.7", maxWidth: "700px" }}>
                            Face ID — bu sizning biometrik profilingiz. Uni bir marta sozlab qo'ysangiz, har kuni ishga kelganingizda kiosk kamerasi sizni avtomatik taniydi va davomatingizni yuritadi. Yuzingiz tizimga xavfsiz tarzda saqlanadi va faqat tanish uchun ishlatiladi.
                        </p>
                    </div>
                    <FaceIdEnrollCard
                        userId={user.id}
                        hasExistingFaceId={!!user.employeeProfile?.faceDescriptor}
                        currentAvatar={user.employeeProfile?.avatarUrl || null}
                    />
                </div>
            )}

            {activeTab === "message" && (
                <div style={{ margin: "0 auto", maxWidth: "100%" }}>
                    <MessagesClient
                        initialMessages={allMessages || []}
                        users={bossUsers || []}
                        currentUserId={user.id}
                        mode="employee"
                    />
                </div>
            )}
        </div>
    );
}
