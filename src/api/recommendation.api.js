import API from "./axios";

export const getRecommendations = () => API.get("/students/recommendations");

export const getSimilarStudents = () => API.get("/students/similar");
