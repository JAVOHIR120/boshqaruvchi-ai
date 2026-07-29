import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/actions/auth";
import { redirect } from "next/navigation";
import { UserCheck, Clock, Users, XCircle, ArrowLeft, Search, Camera } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.companyId) return redirect("/login");

  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];
  const startOfDay = new Date(selectedDate + "T00:00:00");
  const endOfDay = new Date(selectedDate + "T23:59:59.999");

  const attendances = await prisma.attendance.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      employee: { companyId: currentUser.companyId },
    },
    include: {
      employee: { include: { user: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  const totalEmployees = await prisma.employee.count({
    where: { companyId: currentUser.companyId },
  });
  const presentCount = attendances.length;
  const absentCount = totalEmployees - presentCount;

  const formatTime = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Link href="/employees" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)", transition: "all 0.15s" }}>
              <ArrowLeft size={18} />
            </Link>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "700", background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Xodim Davomati — Face ID
            </h2>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "500px" }}>
            Real vaqtda xodimlarning ishga kelish va ketishini Face ID orqali nazorat qilish jurnali.
          </p>
        </div>

        {/* Date Filter */}
        <form style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(17, 24, 39, 0.5)", backdropFilter: "blur(12px)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label htmlFor="date" style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>Sana:</label>
          <input
            type="date"
            name="date"
            id="date"
            defaultValue={selectedDate}
            style={{ background: "rgba(0,0,0,0.3)", color: "var(--text-primary)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-sm)", padding: "0.4rem 0.75rem", fontSize: "0.85rem", outline: "none", colorScheme: "dark" }}
          />
          <button type="submit" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.45rem 1rem", background: "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))", color: "#fff", borderRadius: "var(--radius-sm)", fontWeight: "600", fontSize: "0.82rem", border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
            <Search size={14} /> Ko'rish
          </button>
        </form>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        {/* Jami */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", cursor: "default", background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(59,130,246,0.02) 100%)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(59,130,246,0.15)", color: "#3b82f6", boxShadow: "0 0 15px rgba(59,130,246,0.2)" }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Jami Xodimlar</p>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{totalEmployees}</h3>
          </div>
        </div>
        {/* Kelganlar */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", cursor: "default", background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)", border: "1px solid rgba(16,185,129,0.15)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(16,185,129,0.15)", color: "#10b981", boxShadow: "0 0 15px rgba(16,185,129,0.2)" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Bugun Kelganlar</p>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981", letterSpacing: "-0.02em" }}>{presentCount}</h3>
          </div>
        </div>
        {/* Kelmaganlar */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem", cursor: "default", background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)", border: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.15)", color: "#ef4444", boxShadow: "0 0 15px rgba(239,68,68,0.2)" }}>
            <XCircle size={24} />
          </div>
          <div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Kelmaganlar</p>
            <h3 style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ef4444", letterSpacing: "-0.02em" }}>{absentCount}</h3>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ overflow: "hidden", padding: 0 }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ background: "rgba(16,185,129,0.1)", padding: "0.35rem", borderRadius: "var(--radius-sm)", display: "flex", color: "#10b981" }}>
              <Camera size={18} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", letterSpacing: "-0.01em" }}>Davomat Jurnali</h3>
          </div>
          <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "rgba(255,255,255,0.05)", padding: "0.3rem 0.75rem", borderRadius: "var(--radius-full)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {selectedDate}
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Xodim</th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Lavozimi</th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Kelgan vaqti</th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Ketgan vaqti</th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Holat</th>
                <th style={{ padding: "0.85rem 1rem", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>Face ID Isboti</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length > 0 ? (
                attendances.map((att) => (
                  <tr key={att.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s" }}>
                    {/* Xodim */}
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-full)", overflow: "hidden", background: "rgba(255,255,255,0.05)", border: "2px solid rgba(16,185,129,0.3)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {att.employee.avatarUrl ? (
                            <img src={att.employee.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <span style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                              {att.employee.user.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "0.92rem", color: "var(--text-primary)" }}>{att.employee.user.name}</div>
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{att.employee.user.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Lavozimi */}
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: "500" }}>
                      {att.employee.position}
                    </td>
                    {/* Kelgan vaqti */}
                    <td style={{ padding: "1rem" }}>
                      {formatTime(att.checkIn) ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.75rem", borderRadius: "var(--radius-full)", background: "rgba(16,185,129,0.1)", color: "#10b981", fontSize: "0.82rem", fontWeight: "600", border: "1px solid rgba(16,185,129,0.2)" }}>
                          <Clock size={13} /> {formatTime(att.checkIn)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                    {/* Ketgan vaqti */}
                    <td style={{ padding: "1rem" }}>
                      {formatTime(att.checkOut) ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.75rem", borderRadius: "var(--radius-full)", background: "rgba(239,68,68,0.08)", color: "#f87171", fontSize: "0.82rem", fontWeight: "600", border: "1px solid rgba(239,68,68,0.15)" }}>
                          <Clock size={13} /> {formatTime(att.checkOut)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                    {/* Holat */}
                    <td style={{ padding: "1rem" }}>
                      <span style={{ padding: "0.3rem 0.85rem", borderRadius: "var(--radius-full)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.04em", background: att.status === "LATE" ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)", color: att.status === "LATE" ? "#f59e0b" : "#10b981", border: `1px solid ${att.status === "LATE" ? "rgba(245,158,11,0.2)" : "rgba(16,185,129,0.2)"}` }}>
                        {att.status === "LATE" ? "Kechikdi" : "Keldi"}
                      </span>
                    </td>
                    {/* Face ID Isboti */}
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
                        {att.checkInPhotoUrl && (
                          <div style={{ position: "relative", width: "44px", height: "44px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "2px solid rgba(16,185,129,0.3)", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}>
                            <img src={att.checkInPhotoUrl} alt="Kirish" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(16,185,129,0.85)", color: "#fff", fontSize: "0.55rem", fontWeight: "800", textAlign: "center", padding: "1px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kirish</div>
                          </div>
                        )}
                        {att.checkOutPhotoUrl && (
                          <div style={{ position: "relative", width: "44px", height: "44px", borderRadius: "var(--radius-sm)", overflow: "hidden", border: "2px solid rgba(239,68,68,0.3)", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}>
                            <img src={att.checkOutPhotoUrl} alt="Chiqish" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(239,68,68,0.85)", color: "#fff", fontSize: "0.55rem", fontWeight: "800", textAlign: "center", padding: "1px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chiqish</div>
                          </div>
                        )}
                        {!att.checkInPhotoUrl && !att.checkOutPhotoUrl && (
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ width: "56px", height: "56px", borderRadius: "var(--radius-full)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <UserCheck size={24} style={{ color: "var(--text-muted)" }} />
                      </div>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Ushbu sanada hech qanday davomat qayd etilmagan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
