import api from "./axios";

export const getOwnerKpis = async () => {
  return api.get("/owners/kpis");
};

export default {
  getOwnerKpis,
};
