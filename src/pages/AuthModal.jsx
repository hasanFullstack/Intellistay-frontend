import { useEffect, useState } from "react";
import { registerApi, loginApi } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import "./style/auth.css";
import { toast } from "react-toastify";
import { getErrorMessage } from "../utils/getErrorMessage";

const AuthModal = ({ isOpen, onClose, returnToPath = "/" }) => {
  const location = useLocation();
  const initialAuthMode = location.state?.authMode === "register" ? false : true;
  const initialRole = location.state?.role === "owner" ? "owner" : "student";
  const [isLogin, setIsLogin] = useState(initialAuthMode);
  const [form, setForm] = useState({ role: initialRole });

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const nextIsLogin = location.state?.authMode === "register" ? false : true;
    const nextRole = location.state?.role === "owner" ? "owner" : "student";
    setIsLogin(nextIsLogin);
    setForm((prev) => ({ ...prev, role: nextRole }));
  }, [location.state]);

  if (!isOpen) return null;

  const getDashboardPath = (user) => {
    if (user.role === "student" && !user.quizCompleted) {
      return "/personality-quiz";
    }
    if (user.role === "student") return "/dashboard/user";
    if (user.role === "owner") return "/dashboard/owner";
    return "/";
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await loginApi(form);
        login(res.data);
        onClose?.();

        // Return user to the page where login was initiated.
        // If login started from homepage, go to role dashboard instead.
        const user = res.data.user;
        const fromState = location.state?.from;
        const target = fromState || returnToPath || "/";

        if (target === "/") {
          navigate(getDashboardPath(user));
        } else {
          navigate(target, { replace: true });
        }
      } else {
        await registerApi(form);
        toast.success("Registered successfully. Please login now.");
        setIsLogin(true);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{isLogin ? "Login to Your Account" : "Create Account"}</h2>

        <form onSubmit={submit}>

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {/* Role select only for registration */}
          {!isLogin && (
            <>
              <input
                placeholder="Name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="student">Student</option>
                <option value="owner">Owner</option>
              </select>
            </>
          )}

          <button type="submit">{isLogin ? "Login" : "Register"}</button>
        </form>

        <div
          className="switch-text"
          role="button"
          tabIndex={0}
          onClick={() => setIsLogin(!isLogin)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLogin(!isLogin);
            }
          }}
        >
          {isLogin
            ? "New here? Create an account"
            : "Already have an account? Login"}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
