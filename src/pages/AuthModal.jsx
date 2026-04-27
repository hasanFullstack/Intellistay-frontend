import { useEffect, useState } from "react";
import { registerApi, loginApi } from "../api/auth.api";
import { useAuth } from "../auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import "./style/auth.css";
import { getErrorMessage } from "../utils/getErrorMessage";
import { getOwnerOnboardingProgress } from "../utils/ownerOnboarding";
import { Eye, EyeOff } from "lucide-react";

const AuthModal = ({ isOpen, onClose, returnToPath = "/" }) => {
  const location = useLocation();
  const initialAuthMode = location.state?.authMode === "register" ? false : true;
  const initialRole = location.state?.role === "owner" ? "owner" : "student";
  const [isLogin, setIsLogin] = useState(initialAuthMode);
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: initialRole,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [authMessage, setAuthMessage] = useState({ type: "", text: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const nextIsLogin = location.state?.authMode === "register" ? false : true;
    const nextRole = location.state?.role === "owner" ? "owner" : "student";
    setIsLogin(nextIsLogin);
    setForm((prev) => ({ ...prev, role: nextRole }));
    setFieldErrors({});
    setAuthMessage({ type: "", text: "" });
    setShowPassword(false);
    setIsCapsLockOn(false);
  }, [location.state]);

  if (!isOpen) return null;

  const setInlineError = (text) => {
    setAuthMessage({ type: "error", text });
  };

  const validateForm = () => {
    const nextErrors = {};
    const email = String(form.email || "").trim();
    const password = String(form.password || "");
    const name = String(form.name || "").trim();
    const role = String(form.role || "").trim();

    if (!email) {
      nextErrors.email = "Email is required.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    } else if (!isLogin && password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    if (!isLogin && !name) {
      nextErrors.name = "Name is required.";
    }

    if (!isLogin && !role) {
      nextErrors.role = "Role is required.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getDashboardPath = async (user) => {
    if (user.role === "student" && !user.quizCompleted) {
      return "/personality-quiz";
    }
    if (user.role === "student") return "/dashboard/user";
    if (user.role === "owner") {
      try {
        const progress = await getOwnerOnboardingProgress();
        return progress.isComplete ? "/dashboard/owner" : "/become-owner";
      } catch {
        return "/become-owner";
      }
    }
    return "/";
  };

  const submit = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: "", text: "" });

    if (!validateForm()) {
      setInlineError("Please fix the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const res = await loginApi(form);
        login(res.data);
        setAuthMessage({ type: "success", text: "Login successful. Redirecting..." });
        onClose?.();

        // Return user to the page where login was initiated.
        // If login started from homepage, go to role dashboard instead.
        const user = res.data.user;
        const fromState = location.state?.from;
        const target = fromState || returnToPath || "/";
        const resolvedPath = await getDashboardPath(user);

        if (user.role === "owner") {
          navigate(resolvedPath, { replace: true });
        } else if (target === "/") {
          navigate(resolvedPath);
        } else {
          navigate(target, { replace: true });
        }
      } else {
        await registerApi(form);
        setAuthMessage({
          type: "success",
          text: "Registration successful. Please login with your new account.",
        });
        setIsLogin(true);
        setFieldErrors({});
        setForm((prev) => ({
          ...prev,
          password: "",
          name: "",
        }));
      }
    } catch (err) {
      if (isLogin) {
        const status = err?.response?.status;
        const message = String(
          err?.response?.data?.message || err?.response?.data?.msg || "",
        ).toLowerCase();

        if (
          status === 400 ||
          status === 401 ||
          status === 404 ||
          message.includes("invalid") ||
          message.includes("not found") ||
          message.includes("user not found") ||
          message.includes("password") ||
          message.includes("credential")
        ) {
          setInlineError("Invalid credentials. Please try again.");
          return;
        }
      }
      setInlineError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    if (authMessage.text) {
      setAuthMessage({ type: "", text: "" });
    }
  };

  const handlePasswordKeyEvent = (e) => {
    setIsCapsLockOn(Boolean(e.getModifierState?.("CapsLock")));
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <h2>{isLogin ? "Login to Your Account" : "Create Account"}</h2>
        <p className="auth-helper-text">
          {isLogin
            ? "Enter your email and password to continue."
            : "Create your account to get started."}
        </p>

        <form onSubmit={submit}>

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
          {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
          {/* Password */}
          <div className="auth-password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={form.password}
              onChange={(e) => handleFieldChange("password", e.target.value)}
              onKeyDown={handlePasswordKeyEvent}
              onKeyUp={handlePasswordKeyEvent}
              onBlur={() => setIsCapsLockOn(false)}
              className="auth-password-input"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
          {isCapsLockOn && (
            <p className="auth-caps-warning">Caps Lock is ON</p>
          )}

          {/* Role select only for registration */}
          {!isLogin && (
            <>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
              {fieldErrors.name && <p className="auth-field-error">{fieldErrors.name}</p>}
              <select
                value={form.role}
                onChange={(e) => handleFieldChange("role", e.target.value)}
              >
                <option value="student">Student</option>
                <option value="owner">Owner</option>
              </select>
              {fieldErrors.role && <p className="auth-field-error">{fieldErrors.role}</p>}
            </>
          )}

          {authMessage.text && (
            <p
              className={`auth-inline-message ${
                authMessage.type === "success"
                  ? "auth-inline-success"
                  : authMessage.type === "info"
                    ? "auth-inline-info"
                    : "auth-inline-error"
              }`}
            >
              {authMessage.text}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isLogin
                ? "Logging in..."
                : "Creating account..."
              : isLogin
                ? "Login"
                : "Register"}
          </button>
        </form>

        <div
          className="switch-text"
          role="button"
          tabIndex={0}
          onClick={() => {
            setIsLogin(!isLogin);
            setFieldErrors({});
            setAuthMessage({ type: "", text: "" });
            setShowPassword(false);
            setIsCapsLockOn(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsLogin(!isLogin);
              setFieldErrors({});
              setAuthMessage({ type: "", text: "" });
              setShowPassword(false);
              setIsCapsLockOn(false);
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
