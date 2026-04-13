import { useEffect, useState } from "react";
import { getSimilarStudents } from "../../api/recommendation.api";
import { toast } from "react-toastify";

const SimilarStudents = () => {
  const [students, setStudents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        setLoading(true);
        const res = await getSimilarStudents();
        setStudents(res.data.similarStudents || []);
        setCurrentUser(res.data.currentUser || null);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load similar students";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSimilar();
  }, []);

  const getScoreGradient = (score) => {
    if (score >= 70) return { bg: "#ecfdf5", text: "#065f46", border: "#a7f3d0", bar: "linear-gradient(135deg, #10b981, #059669)" };
    if (score >= 55) return { bg: "#ede9fe", text: "#5b21b6", border: "#c4b5fd", bar: "linear-gradient(135deg, #8b5cf6, #6d28d9)" };
    if (score >= 40) return { bg: "#fffbeb", text: "#78350f", border: "#fde68a", bar: "linear-gradient(135deg, #f59e0b, #d97706)" };
    return { bg: "#fef2f2", text: "#991b1b", border: "#fecaca", bar: "linear-gradient(135deg, #f97316, #ea580c)" };
  };

  const avatarColors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
    "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#3b82f6", "#a855f7"
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div className="spinner-border" style={{ color: "#8b5cf6", width: "3rem", height: "3rem" }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <h5 style={{ marginTop: "16px", color: "#334155", fontWeight: 600 }}>Finding similar students...</h5>
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>Comparing personality vectors across all students</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0" }}>
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>👥</div>
        <h4 style={{ color: "#334155", fontWeight: 700 }}>No Similar Students Found</h4>
        <p style={{ color: "#94a3b8", maxWidth: "400px", margin: "0 auto" }}>
          More students need to complete their personality quiz before we can find your matches.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)",
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
            <i className="bi bi-people-fill me-2"></i>Similar Students
          </h4>
          <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "14px" }}>
            Potential roommate compatibility • {students.length} found
          </p>
        </div>
        {currentUser && (
          <div style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "12px 20px",
            textAlign: "center",
            backdropFilter: "blur(10px)"
          }}>
            <div style={{ fontSize: "24px", fontWeight: 800 }}>{currentUser.personalityScore}</div>
            <div style={{ fontSize: "11px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" }}>Your Score</div>
          </div>
        )}
      </div>

      {/* Student Cards */}
      <div className="row g-4">
        {students.map((item, idx) => {
          const colors = getScoreGradient(item.similarityScore);
          const avatarColor = avatarColors[idx % avatarColors.length];

          return (
            <div key={item.student._id} className="col-md-6 col-lg-4">
              <div
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "24px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  transition: "all 0.3s ease",
                  border: "1px solid #f1f5f9",
                  position: "relative"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.12)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.06)";
                }}
              >
                {/* Rank */}
                <div style={{
                  position: "absolute", top: "12px", right: "12px",
                  background: "#f8fafc", color: "#94a3b8",
                  borderRadius: "8px", padding: "2px 8px", fontSize: "12px", fontWeight: 700
                }}>
                  #{idx + 1}
                </div>

                {/* Avatar + Name */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                  <div style={{
                    width: "56px", height: "56px", borderRadius: "16px",
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}cc)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontSize: "22px", fontWeight: 800, flexShrink: 0
                  }}>
                    {item.student.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <h6 style={{ margin: 0, fontWeight: 700, color: "#1e293b" }}>{item.student.name}</h6>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        Score: {item.student.personalityScore}
                      </span>
                      {item.matchLabel && (
                        <span style={{
                          fontSize: "10px", fontWeight: 700,
                          background: colors.bg, color: colors.text,
                          padding: "2px 6px", borderRadius: "4px",
                          border: `1px solid ${colors.border}`
                        }}>
                          {item.matchLabel.emoji} {item.matchLabel.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Similarity Score with Progress Ring */}
                <div style={{
                  background: colors.bg, border: `1.5px solid ${colors.border}`,
                  borderRadius: "12px", padding: "16px", marginBottom: "16px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: "32px", fontWeight: 800, color: colors.text }}>
                        {item.similarityScore}%
                      </div>
                      <div style={{ fontSize: "12px", color: colors.text, fontWeight: 600, opacity: 0.8 }}>
                        Compatibility
                      </div>
                    </div>
                    {/* Mini bar chart for top matches */}
                    {item.topMatches && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        {item.topMatches.map((tm) => (
                          <div key={tm.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "9px", color: colors.text, width: "52px", textAlign: "right", fontWeight: 600 }}>{tm.label}</span>
                            <div style={{ width: "50px", height: "4px", background: `${colors.border}50`, borderRadius: "2px" }}>
                              <div style={{ width: `${tm.score}%`, height: "100%", background: colors.bar, borderRadius: "2px" }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Shared Traits */}
                {item.sharedTraits?.length > 0 && (
                  <div>
                    <div style={{
                      fontSize: "10px", color: "#94a3b8", fontWeight: 700,
                      marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px"
                    }}>
                      <i className="bi bi-heart-fill me-1" style={{ color: "#ec4899", fontSize: "9px" }}></i>
                      Strong Matches ({item.sharedTraits.length})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                      {item.sharedTraits.map((trait) => (
                        <span key={trait} style={{
                          background: "linear-gradient(135deg, #f0f0ff, #faf5ff)",
                          color: "#6d28d9", padding: "4px 10px", borderRadius: "8px",
                          fontSize: "11px", fontWeight: 600, border: "1px solid #ede9fe"
                        }}>
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SimilarStudents;
