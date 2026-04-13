import api from "./axios";

// Submit hostel environment profile
export const submitHostelEnvironment = async (
  hostelId,
  ownerId,
  environmentProfile,
) => {
  return api.post("/hostel-environment/submit", {
    hostelId,
    ownerId,
    environmentProfile,
  });
};

// Get hostel environment profile
export const getHostelEnvironment = async (hostelId) => {
  return api.get(`/hostel-environment/${hostelId}`);
};

// Check if hostel environment profile is completed
export const checkEnvironmentCompletion = async (hostelId) => {
  return api.get(`/hostel-environment/check/${hostelId}`);
};

// Get all hostel environment profiles (admin only)
export const getAllHostelEnvironments = async () => {
  return api.get("/hostel-environment");
};

// Get recommended hostels for a student
export const getRecommendedHostels = async (studentPersonalityScore) => {
  return api.post("/hostel-environment/recommend", {
    studentPersonalityScore,
  });
};
