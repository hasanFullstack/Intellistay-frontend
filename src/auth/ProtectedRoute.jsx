import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoute = ({ role, requiresQuiz = true, children }) => {
  const { user } = useAuth();

  // Not logged in
  if (!user) return <Navigate to="/login" />;

  // Role mismatch
  if (role && user.role?.toLowerCase() !== role.toLowerCase())
    return <Navigate to="/" />;

  // Student accessing dashboard without completing quiz (if requiresQuiz is true)
  if (requiresQuiz && user.role === "student" && !user.quizCompleted) {
    return <Navigate to="/personality-quiz" />;
  }

  return children;
};

export default ProtectedRoute;
