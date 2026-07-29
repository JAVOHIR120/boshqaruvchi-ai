"use client";

import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { getTodayCompanyAttendance } from "@/actions/attendance";

export default function LiveAttendanceToasts() {
    const [lastKnownCount, setLastKnownCount] = useState<number | null>(null);
    const isFirstRun = useRef(true);

    useEffect(() => {
        const checkUpdates = async () => {
            try {
                const res = await getTodayCompanyAttendance();
                if (res.success && res.attendances) {
                    const currentCount = res.attendances.length;
                    
                    if (!isFirstRun.current && lastKnownCount !== null && currentCount > lastKnownCount) {
                        // New check-ins found
                        const newOnes = res.attendances.slice(0, currentCount - lastKnownCount);
                        newOnes.forEach((att: any) => {
                            const name = att.employee?.user?.name || "Xodim";
                            const time = att.checkIn ? new Date(att.checkIn).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' }) : "";
                            
                            toast.success(`${name} ishga keldi! (Vaqti: ${time})`, {
                                duration: 5000,
                                position: "top-right",
                                style: {
                                    background: "var(--surface-color)",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--primary-color)",
                                    boxShadow: "0 10px 40px rgba(99, 102, 241, 0.2)"
                                },
                                icon: '👋'
                            });
                        });
                    }
                    
                    setLastKnownCount(currentCount);
                    isFirstRun.current = false;
                }
            } catch (error) {
                console.error("Attendance polling error:", error);
            }
        };

        // Initial check immediately
        checkUpdates();

        // Check every 30 seconds
        const interval = setInterval(checkUpdates, 30000);
        return () => clearInterval(interval);
    }, [lastKnownCount]);

    return null; // This component doesn't render anything visually, just handles logic
}
