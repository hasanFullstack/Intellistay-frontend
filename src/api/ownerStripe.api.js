import api from "./axios";

export const getStripeKeys = () => api.get("/owners/stripe");
export const saveStripeKeys = (data) => api.post("/owners/stripe", data);
export const deleteStripeKeys = () => api.delete("/owners/stripe");

export default { getStripeKeys, saveStripeKeys, deleteStripeKeys };
