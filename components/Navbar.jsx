import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../src/auth/AuthContext";
import { toast } from "react-toastify";
import { useState } from "react";
import Banner from "./Banner";
import { FiMenu, FiX } from "react-icons/fi";

const Navbar = ({ openAuth }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
    setShowLogoutConfirm(false);
    setMenuOpen(false);
  };

  return (
    <header className="relative border-b-[1px] border-gray-300 z-50 bg-white">
      <Banner />
      <div className="container mx-auto py-2">
        <div className="flex items-center justify-between">
          <Link to="/" className="navbar__logo">
            <img
              src="/logo.png"
              alt="INTELLISTAY Logo"
              className="navbar__logo-img"
            />
          </Link>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg border border-gray-200"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>

          <div className="hidden md:flex items-center gap-4">
            <nav className="flex items-center gap-2">
              <NavLink to="/" end className="navlink" onClick={() => setMenuOpen(false)}>
                Home
              </NavLink>
              <NavLink to="/hostels" className="navlink" onClick={() => setMenuOpen(false)}>
                Hostels
              </NavLink>
              <NavLink to="/rooms" className="navlink" onClick={() => setMenuOpen(false)}>
                Rooms
              </NavLink>
              <NavLink to="/contact" className="navlink" onClick={() => setMenuOpen(false)}>
                Contact
              </NavLink>
            </nav>

            {!user && (
              <button className="btn btn--ghost" onClick={openAuth}>
                Login
              </button>
            )}

            {user && (
              <div className="navbar__user-menu">
                {user?.role === "student" && (
                  <Link to="/dashboard/user" className="btn btn--ghost">
                    Dashboard
                  </Link>
                )}
                {user?.role === "owner" && (
                  <Link to="/dashboard/owner" className="btn btn--ghost">
                    Dashboard
                  </Link>
                )}
                <button
                  className="btn btn--outline"
                  onClick={() => setShowLogoutConfirm(true)}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-2 border-t border-gray-200 pt-3 pb-2">
            <nav className="flex flex-col gap-1">
              <NavLink to="/" end className="navlink">
                Home
              </NavLink>
              <NavLink to="/hostels" className="navlink">
                Hostels
              </NavLink>
              <NavLink to="/rooms" className="navlink">
                Rooms
              </NavLink>
              <NavLink to="/contact" className="navlink">
                Contact
              </NavLink>
            </nav>

            <div className="mt-3 flex flex-col gap-2">
              {!user && (
                <button className="btn" onClick={openAuth}>
                  Login
                </button>
              )}

              {user && (
                <>
                  {user?.role === "student" && (
                    <Link to="/dashboard/user" className="btn btn--ghost">
                      Dashboard
                    </Link>
                  )}
                  {user?.role === "owner" && (
                    <Link to="/dashboard/owner" className="btn btn--ghost">
                      Dashboard
                    </Link>
                  )}
                  <button
                    className="btn btn--outline"
                    onClick={() => setShowLogoutConfirm(true)}
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirm Overlay */}
      {showLogoutConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
          <div style={{
            background: "white", borderRadius: "16px", padding: "32px",
            maxWidth: "360px", width: "90%", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👋</div>
            <h5 style={{ fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>Logout?</h5>
            <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "24px" }}>
              Are you sure you want to log out?
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "1px solid #e2e8f0",
                  background: "white", color: "#64748b", fontWeight: 600, cursor: "pointer"
                }}
              >Cancel</button>
              <button
                onClick={handleLogout}
                style={{
                  padding: "10px 24px", borderRadius: "10px", border: "none",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "white",
                  fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 12px rgba(239,68,68,0.3)"
                }}
              >Yes, Logout</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
