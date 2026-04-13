import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{
      minHeight: "70vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      padding: "40px 20px"
    }}>
      <div style={{ fontSize: "120px", fontWeight: 900, color: "#e2e8f0", lineHeight: 1 }}>404</div>
      <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1e293b", margin: "16px 0 8px" }}>
        Page Not Found
      </h2>
      <p style={{ color: "#64748b", fontSize: "16px", maxWidth: "400px", marginBottom: "32px" }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        style={{
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "white",
          padding: "12px 32px",
          borderRadius: "12px",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "15px",
          boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
          transition: "all 0.2s ease"
        }}
      >
        <i className="bi bi-house me-2"></i>
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
