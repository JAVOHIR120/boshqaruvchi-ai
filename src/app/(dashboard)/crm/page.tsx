import { prisma } from "@/lib/prisma";
import CrmBoard from "./components/CrmBoard";
import AiPredictiveButton from "./components/AiPredictiveButton";
import AiClientScoringButton from "./components/AiClientScoringButton";
import styles from "./crm.module.css";
import { Target, TrendingUp, Users } from "lucide-react";
import { EnhancedIcon } from "@/components/ui/EnhancedIcon";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";

// Optional: Force dynamic rendering if caching issues occur
export const dynamic = 'force-dynamic';

export default async function CRMPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.companyId) return redirect("/login");

    const leads = await prisma.lead.findMany({
        where: { companyId: currentUser.companyId },
        orderBy: { createdAt: "desc" }
    });

    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.status === "WON").length;

    // Calculate expected revenue from pipelines
    const pipelineValue = leads
        .filter(l => l.status !== "LOST" && l.status !== "WON")
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    const closedValue = leads
        .filter(l => l.status === "WON")
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        <Target size={28} color="var(--primary-color)" />
                        Sotuv va Mijozlar (CRM)
                    </h1>
                    <p className={styles.subtitle}>
                        Mijozlar bazasini boshqarish va sotuv voronkasi (Sales Funnel)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <AiClientScoringButton />
                    <AiPredictiveButton />
                </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div>
                        <EnhancedIcon 
                            icon={Users} 
                            size={24} 
                            color="var(--primary-color)" 
                            glowColor="rgba(59, 130, 246, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>Jami Mijozlar</h3>
                        <p>{totalLeads} ta</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div>
                        <EnhancedIcon 
                            icon={TrendingUp} 
                            size={24} 
                            color="#8b5cf6" 
                            glowColor="rgba(139, 92, 246, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>Kutilayotgan Daromad</h3>
                        <p>{pipelineValue.toLocaleString()} $</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div>
                        <EnhancedIcon 
                            icon={Target} 
                            size={24} 
                            color="var(--success-color)" 
                            glowColor="rgba(16, 185, 129, 0.4)"
                            hasBackground={true} 
                        />
                    </div>
                    <div className={styles.statInfo}>
                        <h3>Muvaffaqiyatli Sotuvlar</h3>
                        <p>{wonLeads} ta ({closedValue.toLocaleString()} $)</p>
                    </div>
                </div>
            </div>

            {/* Interactive Kanban Board */}
            <CrmBoard initialLeads={leads} />
        </div>
    );
}
