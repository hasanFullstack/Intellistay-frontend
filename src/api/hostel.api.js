import api from "./axios";

export const getAllHostels = (filter) =>
  filter
    ? api.get(`/hostels?filter=${encodeURIComponent(filter)}`)
    : api.get("/hostels");
export const getHostelById = (id) => api.get(`/hostels/${id}`);
export const addHostel = (data) => api.post("/hostels", data);
export const getMyHostels = () => api.get("/hostels/my");
export const updateHostel = (id, data) => api.put(`/hostels/${id}`, data);
export const deleteHostel = (id) => api.delete(`/hostels/${id}`);
