import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendations } from "../../api/recommendation.api";
import { toast } from "react-toastify";

const RecommendedHostels = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await getRecommendations();
        setRecommendations(res.data.recommendations || []);
        setUserProfile(res.data.userProfile || null);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load recommendations";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const getScoreGradient = (score) => {
    if (score >= 70) return "linear-gradient(135deg, #10b981, #059669)";
    if (score >= 55) return "linear-gradient(135deg, #6366f1, #4f46e5)";
    if (score >= 40) return "linear-gradient(135deg, #f59e0b, #d97706)";
    return "linear-gradient(135deg, #f97316, #ea580c)";
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

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="spinner-border" style={{ color: "#6366f1", width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 style={{ marginTop: "16px", color: "#334155", fontWeight: 600 }}>Analyzing personality compatibility...</h5>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Running weighted multi-factor matching algorithm</p>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏠</div>
        <h4 style={{ color: "#334155", fontWeight: 700 }}>No Recommendations Yet</h4>
        <p style={{ color: "#94a3b8", maxWidth: "400px", margin: "0 auto" }}>
          Hostel owners need to complete their environment profiles before we can match you.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        borderRadius: "16px",
        padding: "24px 32px",
        marginBottom: "24px",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 700 }}>
            <i className="bi bi-stars me-2"></i>AI-Powered Recommendations
          </h4>
          <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "14px" }}>
            Weighted multi-factor matching • {recommendations.length} matches found
          </p>
        </div>
        {userProfile && (
          <div style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "12px 20px",
            textAlign: "center",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>{userProfile.personalityScore}</div>
            <div style={{ fontSize: "11px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" }}>Your Score</div>
          </div>
        )}
      </div>

      {/* Recommendation Cards */}
      <div className="row g-4">
        {recommendations.map((rec, idx) => (
          <div key={rec.hostel._id} className="col-md-6 col-lg-4">
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                border: idx === 0 ? "2px solid #6366f1" : "1px solid #f1f5f9",
                position: "relative"
              }}
              onClick={() => navigate(`/hostels`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
              }}
            >
              {/* Rank Badge */}
              {idx < 3 && (
                <div style={{
                  position: "absolute", top: "12px", left: "12px",
                  background: idx === 0 ? "#fbbf24" : idx === 1 ? "#94a3b8" : "#cd7c2e",
                  color: idx === 0 ? "#78350f" : "white",
                  borderRadius: "8px", padding: "4px 10px", fontSize: "12px",
                  fontWeight: 800, zIndex: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }}>
                  #{idx + 1}
                </div>
              )}

              {/* Score Badge */}
              <div style={{
                position: "absolute", top: "12px", right: "12px",
                background: getScoreGradient(rec.compatibilityScore),
                color: "white", borderRadius: "12px", padding: "8px 14px",
                fontSize: "14px", fontWeight: 800, zIndex: 2,
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                {rec.compatibilityScore}% Match
              </div>

              {/* Image */}
              <div style={{
                height: "160px",
                background: "linear-gradient(135deg, #e0e7ff, #c7d2fe)",
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {rec.hostel.images && rec.hostel.images.length > 0 ? (
                  <img src={rec.hostel.images[0]} alt={rec.hostel.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <i className="bi bi-building" style={{ fontSize: "48px", color: "#818cf8", opacity: 0.5 }}></i>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                  <h5 style={{ fontWeight: 700, color: "#1e293b", margin: 0 }}>
                    {rec.hostel.name}
                  </h5>
                  {rec.matchLabel && getTierBadge(rec.matchLabel)}
                </div>
                <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "4px" }}>
                  <i className="bi bi-geo-alt-fill" style={{ color: "#6366f1" }}></i>
                  {rec.hostel.city && rec.hostel.addressLine1
                    ? `${rec.hostel.addressLine1}, ${rec.hostel.city}`
                    : "Address not set"}
                </p>

                {/* Personality Match Progress */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Personality Match</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b" }}>{rec.breakdown.personalityMatch}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{
                      width: `${rec.breakdown.personalityMatch}%`, height: "100%",
                      background: getScoreGradient(rec.breakdown.personalityMatch),
                      borderRadius: "4px", transition: "width 0.8s ease"
                    }}></div>
                  </div>
                </div>

                {/* Budget Alignment */}
                {rec.breakdown.budgetAligned && (
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    background: "#ecfdf5", color: "#065f46",
                    padding: "4px 10px", borderRadius: "6px", fontSize: "11px",
                    fontWeight: 600, marginBottom: "10px", border: "1px solid #a7f3d0"
                  }}>
                    <i className="bi bi-check-circle-fill"></i>
                    Budget Aligned (+{rec.breakdown.budgetMatch}%)
                  </div>
                )}

                {/* Top Matching Dimensions */}
                {rec.breakdown.topDimensions?.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Top Matching Areas
                    </div>
                    {rec.breakdown.topDimensions.map((dim) => (
                      <div key={dim.label} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <div style={{ width: "60px", fontSize: "10px", color: "#64748b", fontWeight: 600 }}>{dim.label}</div>
                        <div style={{ flex: 1, height: "4px", background: "#f1f5f9", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${dim.score}%`, height: "100%", background: getScoreGradient(dim.score), borderRadius: "2px" }}></div>
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "#334155", width: "28px", textAlign: "right" }}>{dim.score}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Strong Matches */}
                {rec.breakdown.strongMatches?.length > 0 && (
                  <div>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ✨ Strong Matches
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {rec.breakdown.strongMatches.slice(0, 5).map((trait) => (
                        <span key={trait} style={{
                          background: "#f0f0ff", color: "#4f46e5",
                          padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600
                        }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weak Matches Warning */}
                {rec.breakdown.weakMatches?.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      ⚠️ Potential Mismatches
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {rec.breakdown.weakMatches.slice(0, 3).map((trait) => (
                        <span key={trait} style={{
                          background: "#fef2f2", color: "#991b1b",
                          padding: "3px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: 600
                        }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedHostels;
