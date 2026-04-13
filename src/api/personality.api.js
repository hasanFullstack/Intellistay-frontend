import api from "./axios";

// Submit personality quiz (uses req.user from token, no userId in body)
export const submitPersonalityQuiz = async (responses) => {
  return api.post("/personality/submit", { responses });
};

// Get personality quiz for a user
export const getPersonalityQuiz = async (userId) => {
  return api.get(`/personality/${userId}`);
};

// Check if user has completed personality quiz
export const checkQuizCompletion = async (userId) => {
  return api.get(`/personality/check/${userId}`);
};

// Get all personality quizzes (admin only)
export const getAllPersonalityQuizzes = async () => {
  return api.get("/personality");
};

// Get current user profile
export const getProfile = async () => {
  return api.get("/auth/profile");
};
