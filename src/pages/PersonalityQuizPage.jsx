import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PersonalityQuiz from "../../components/PersonalityQuiz";

const PersonalityQuizPage = () => {
  const { user, completeQuiz } = useAuth();
  const navigate = useNavigate();

  const handleQuizComplete = useCallback(
    (updatedUser) => {
      completeQuiz(updatedUser);
      // Redirect to student dashboard after quiz completion
      navigate("/dashboard/user");
    },
    [completeQuiz, navigate]
  );

  const handleQuizClose = useCallback(() => {
    // If user closes the quiz, redirect to home
    navigate("/");
  }, [navigate]);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (user.role !== "student") {
    navigate("/");
    return null;
  }

  if (user.quizCompleted) {
    navigate("/dashboard/user");
    return null;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <PersonalityQuiz
        userId={user._id}
        onComplete={handleQuizComplete}
        onClose={handleQuizClose}
      />
    </div>
  );
};

export default PersonalityQuizPage;
