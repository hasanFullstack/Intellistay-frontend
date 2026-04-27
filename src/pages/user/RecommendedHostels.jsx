import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendations } from "../../api/recommendation.api";
import { toast } from "react-toastify";
import { Heart } from "lucide-react";
import { useFavorites } from "../../hooks/useFavorites";
import AppLoader from "../../components/ui/AppLoader";
import EmptyState from "../../components/ui/EmptyState";
import { getErrorMessage } from "../../utils/getErrorMessage";
import { formatHostelAddress } from "../../../utils/formatHostelAddress";
import "../Hostels.css";

const RecommendedHostels = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();

  const ENV_MAPS = {
    socialEnvironment: {
      very_social:    { text: "Very Social Vibe",    icon: "bi-people-fill",        bg: "#e0f2fe", color: "#0369a1" },
      somewhat_social:{ text: "Friendly Atmosphere", icon: "bi-person-hearts",       bg: "#dbeafe", color: "#1d4ed8" },
      quiet:          { text: "Calm & Reserved",     icon: "bi-person-fill",         bg: "#f1f5f9", color: "#475569" },
      very_quiet:     { text: "Very Private",        icon: "bi-shield-fill",         bg: "#e2e8f0", color: "#334155" },
    },
    cleanlinessStandard: {
      very_strict: { text: "Spotlessly Clean",  icon: "bi-stars",          bg: "#f0fdf4", color: "#166534" },
      strict:      { text: "Strictly Clean",    icon: "bi-check2-circle",  bg: "#dcfce7", color: "#15803d" },
      moderate:    { text: "Reasonably Tidy",   icon: "bi-house-check",    bg: "#fef9c3", color: "#854d0e" },
      relaxed:     { text: "Relaxed Tidiness",  icon: "bi-house",          bg: "#fef3c7", color: "#92400e" },
    },
    noiseLevelNight: {
      very_quiet: { text: "Silent Nights",     icon: "bi-moon-stars-fill", bg: "#ede9fe", color: "#6d28d9" },
      quiet:      { text: "Quiet After Hours", icon: "bi-moon-fill",       bg: "#f5f3ff", color: "#7c3aed" },
      moderate:   { text: "Moderate Nights",   icon: "bi-volume-down-fill",bg: "#fff7ed", color: "#9a3412" },
      party_zone: { text: "Lively Nights",     icon: "bi-music-note-beamed",bg:"#fee2e2", color: "#991b1b" },
    },
    budgetTier: {
      luxury:    { text: "Luxury Tier",   icon: "bi-gem",       bg: "#fdf4ff", color: "#7e22ce" },
      premium:   { text: "Premium Range", icon: "bi-star-fill", bg: "#fefce8", color: "#713f12" },
      mid_range: { text: "Mid Range",     icon: "bi-wallet2",   bg: "#f0fdf4", color: "#166534" },
      budget:    { text: "Budget Friendly",icon: "bi-piggy-bank",bg: "#eff6ff", color: "#1e40af" },
    },
  };

  const getEnvSummary = (ep) => {
    if (!ep) return null;
    const badges = [];
    ["socialEnvironment", "cleanlinessStandard", "noiseLevelNight", "budgetTier"].forEach((key) => {
      const val = ep[key];
      const map = ENV_MAPS[key]?.[val];
      if (map) badges.push(map);
    });
    if (ep.studyEnvironment === true || ep.studyEnvironment === "true") {
      badges.push({ text: "Study Friendly", icon: "bi-book-fill", bg: "#faf5ff", color: "#6b21a8" });
    }
    return badges.length ? badges : null;
  };

  const getFeatureImage = (hostel) => {
    const fallback =
      "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800";
    const raw = hostel?.images?.[0];

    if (!raw || typeof raw !== "string") return fallback;
    if (/^https?:\/\//i.test(raw)) return raw;

    const apiBase = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
    const origin = apiBase ? apiBase.replace(/\/api$/i, "") : window.location.origin;
    return `${origin}/${raw.replace(/^\/+/, "")}`;
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await getRecommendations();
        setRecommendations(res.data.recommendations || []);
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to load recommendations");
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const getScoreGradient = (score) => {
    if (score >= 70) return "linear-gradient(135deg, #1f7a5a, #0f5f44)";
    if (score >= 55) return "linear-gradient(135deg, #235784, #1a3f57)";
    if (score >= 40) return "linear-gradient(135deg, #d08700, #a76400)";
    return "linear-gradient(135deg, #b45309, #92400e)";
  };

  const getTierBadge = (matchLabel) => {
    if (!matchLabel) return null;
    const tierColors = {
      S: { bg: "#fef3c7", text: "#92400e", border: "#fcd34d" },
      A: { bg: "#ede9fe", text: "#5b21b6", border: "#a78bfa" },
      B: { bg: "#dbeafe", text: "#1e40af", border: "#60a5fa" },
      C: { bg: "#d1fae5", text: "#065f46", border: "#34d399" },
      D: { bg: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
      E: { bg: "#f1f5f9", text: "#64748b", border: "#cbd5e1" },
    };
    const c = tierColors[matchLabel.tier] || tierColors.E;
    return (
      <span style={{
        background: c.bg, color: c.text, border: `1.5px solid ${c.border}`,
        borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: 800,
        marginLeft: "8px"
      }}>
        {matchLabel.emoji} {matchLabel.text}
      </span>
    );
  };

  const getDimensionIcon = (label = "") => {
    const key = String(label).toLowerCase();
    if (key.includes("sleep")) return "bi-moon-stars-fill";
    if (key.includes("comfort")) return "bi-emoji-smile-fill";
    if (key.includes("room")) return "bi-door-open-fill";
    if (key.includes("social")) return "bi-people-fill";
    if (key.includes("noise")) return "bi-volume-up-fill";
    if (key.includes("budget")) return "bi-wallet2";
    return "bi-stars";
  };

  if (loading) {
    return <AppLoader message="Analyzing personality compatibility..." className="py-20" />;
  }

  if (recommendations.length === 0) {
    return (
      <EmptyState
        title="No Recommendations Yet"
        description="Hostel owners need to complete their environment profiles before we can match you."
        className="py-20"
        icon={<div style={{ fontSize: "56px" }}>🏠</div>}
      />
    );
  }

  return (
    <div>
      {/* Recommendation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((rec, idx) => (
            <article
              key={rec.hostel._id}
              className="w-full overflow-hidden rounded-xl border transition-all duration-300"
              style={{
                background: "#ffffff",
                borderColor: "rgba(196, 198, 211, 0.35)",
                boxShadow: "0 24px 32px rgba(0, 49, 122, 0.06)",
              }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={getFeatureImage(rec.hostel)}
                  alt={rec.hostel.name}
                  className="h-full w-full object-cover"
                />

                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {idx < 3 && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold text-white"
                      style={{ background: "#001d4f", boxShadow: "0 10px 18px rgba(0,0,0,0.18)" }}
                    >
                      <i className="bi bi-award-fill mr-1 text-[12px]"></i>
                      Top #{idx + 1}
                    </span>
                  )}
                  {rec.matchLabel && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold"
                      style={{
                        background: "#96f592",
                        color: "#0a7320",
                        boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
                      }}
                    >
                      {rec.matchLabel.emoji} {rec.matchLabel.text}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(rec.hostel._id);
                  }}
                  className="absolute top-3 right-3 p-1.5 text-white transition-all duration-200"
                  style={{
                    borderRadius: "0.375rem",
                    backgroundColor: "rgba(30, 33, 40, 0.28)",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  <Heart
                    size={18}
                    fill={isFavorited(rec.hostel._id) ? "#ef4444" : "none"}
                    color={isFavorited(rec.hostel._id) ? "#ef4444" : "white"}
                  />
                </button>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3">
                  <h3 className="text-white text-base font-bold leading-tight">{rec.hostel.name}</h3>
                  <div className="mt-0.5 flex items-center gap-1 text-xs text-white/90">
                    <i className="bi bi-geo-alt-fill"></i>
                    <span>{formatHostelAddress(rec.hostel)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4" style={{ background: "#ffffff" }}>
                <section className="space-y-2">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "#747782" }}>
                        Compatibility
                      </p>
                      <h4 className="text-[22px] leading-none font-extrabold" style={{ color: "#001d4f" }}>
                        {Math.round(Number(rec.compatibilityScore || 0))}%
                      </h4>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "#001d4f" }}>
                      {Math.round(Number(rec.breakdown?.personalityMatch || 0))}% compatible
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#e6e8eb" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(rec.compatibilityScore || 0)))}%`,
                        background: "#001d4f",
                      }}
                    />
                  </div>
                </section>

                {rec.breakdown?.topDimensions?.length > 0 && (
                  <section className="grid grid-cols-1 gap-1.5">
                    {rec.breakdown.topDimensions.slice(0, 3).map((dim) => (
                      <div
                        key={dim.label}
                        className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
                        style={{ background: "#f2f4f7" }}
                      >
                        <div className="flex items-center gap-2">
                          <i className={`bi ${getDimensionIcon(dim.label)} text-[13px]`} style={{ color: "#001d4f" }}></i>
                          <span className="text-xs font-semibold" style={{ color: "#191c1e" }}>{dim.label}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color: "#001d4f" }}>
                          {Math.round(Number(dim.score || 0))}%
                        </span>
                      </div>
                    ))}
                  </section>
                )}

                <section
                  className="flex items-start gap-2 rounded-xl border p-3"
                  style={{ borderColor: "rgba(196, 198, 211, 0.4)", background: "#f7f9fc" }}
                >
                  <i className="bi bi-shield-check text-[13px] mt-0.5" style={{ color: "#747782" }}></i>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.14em] font-bold mb-1.5" style={{ color: "#747782" }}>
                      Environment Notes
                    </p>
                    {getEnvSummary(rec.environmentProfile) ? (
                      <div className="flex flex-wrap gap-1">
                        {getEnvSummary(rec.environmentProfile).map((item) => (
                          <span
                            key={item.text}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-semibold"
                            style={{ background: item.bg, color: item.color }}
                          >
                            <i className={`bi ${item.icon} text-[9px]`}></i>
                            {item.text}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic" style={{ color: "#94a3b8" }}>No environment profile set</p>
                    )}
                  </div>
                </section>

                {rec.breakdown?.budgetAligned && (
                  <div
                    className="inline-flex items-center gap-2 text-[11px] font-semibold px-2.5 py-1 rounded-md border"
                    style={{
                      background: "#96f592",
                      color: "#0a7320",
                      borderColor: "#7edb7b",
                    }}
                  >
                    <i className="bi bi-check-circle-fill"></i>
                    Budget Aligned (+{Number(rec.breakdown?.budgetMatch || 0)}%)
                  </div>
                )}

                {rec.breakdown?.strongMatches?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#747782" }}>
                      Strong Match Areas
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rec.breakdown.strongMatches.slice(0, 5).map((trait) => (
                        <span
                          key={trait}
                          className="rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                          style={{ background: "#003b44", color: "#76a5b0" }}
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {rec.breakdown?.weakMatches?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "#747782" }}>
                      Possible Mismatches
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {rec.breakdown.weakMatches.slice(0, 3).map((trait) => (
                        <span
                          key={trait}
                          className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-semibold"
                          style={{
                            background: "#ffdad6",
                            color: "#93000a",
                            borderColor: "#f5b8b2",
                          }}
                        >
                          <i className="bi bi-exclamation-triangle-fill text-[11px]"></i>
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <button
                  className="w-full rounded-lg py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all"
                  style={{
                    background: "#001d4f",
                    boxShadow: "0 8px 14px rgba(0,29,79,0.18)",
                  }}
                  onClick={() => navigate(`/hostels/${rec.hostel._id}/rooms`)}
                >
                  Available Rooms
                </button>
              </div>

            </article>
          ))}
      </div>

      {/* Pagination */}
      {recommendations.length > itemsPerPage && (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: "1px solid #f1f5f9"
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: currentPage === 1 ? "1px solid #e2e8f0" : "1px solid #235784",
              background: currentPage === 1 ? "#f8fafc" : "white",
              color: currentPage === 1 ? "#94a3b8" : "#235784",
              cursor: currentPage === 1 ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px"
            }}
          >
            ← Previous
          </button>

          {Array.from({ length: Math.ceil(recommendations.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                border: currentPage === page ? "1px solid #235784" : "1px solid #e2e8f0",
                background: currentPage === page ? "#235784" : "white",
                color: currentPage === page ? "white" : "#64748b",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "14px",
                transition: "all 0.2s"
              }}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(recommendations.length / itemsPerPage)))}
            disabled={currentPage === Math.ceil(recommendations.length / itemsPerPage)}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: currentPage === Math.ceil(recommendations.length / itemsPerPage) ? "1px solid #e2e8f0" : "1px solid #235784",
              background: currentPage === Math.ceil(recommendations.length / itemsPerPage) ? "#f8fafc" : "white",
              color: currentPage === Math.ceil(recommendations.length / itemsPerPage) ? "#94a3b8" : "#235784",
              cursor: currentPage === Math.ceil(recommendations.length / itemsPerPage) ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "14px"
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecommendedHostels;
