import api from "./axios";

// Add hostel to favorites
export const addToFavorites = (hostelId) =>
  api.post("/favorites", { hostelId });

// Remove hostel from favorites
export const removeFromFavorites = (hostelId) =>
  api.delete(`/favorites/${hostelId}`);

// Get user's favorite hostels
export const getUserFavorites = () =>
  api.get("/favorites");

// Check if hostel is favorited by user
export const checkIfFavorited = (hostelId) =>
  api.get(`/favorites/check/${hostelId}`);

// Check multiple hostels
export const checkMultipleFavorites = (hostelIds) =>
  api.post("/favorites/check-multiple", { hostelIds });

// Sync cached favorites to database (on login)
export const syncCachedFavorites = (hostelIds) =>
  api.post("/favorites/sync", { hostelIds });
