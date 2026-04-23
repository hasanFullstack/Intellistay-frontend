import api from "./axios";

export const getProfile = () => api.get(`/auth/profile`);
export const updateProfile = (payload) => api.put(`/auth/profile`, payload);

export default { getProfile, updateProfile };
