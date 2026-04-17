import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../src/auth/AuthContext";
import { toast } from "react-toastify";
import { useState } from "react";
import Banner from "./Banner";
import { FiMenu, FiX } from "react-icons/fi";
import ConfirmActionModal from "./ConfirmActionModal";

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
    <header className="relative border-b-[1px] border-gray-300 z-[80] bg-white">
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

      <ConfirmActionModal
        open={showLogoutConfirm}
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        icon="👋"
        title="Logout?"
        message="Are you sure you want to log out?"
        cancelText="Cancel"
        confirmText="Yes, Logout"
      />
    </header>
  );
};

export default Navbar;
