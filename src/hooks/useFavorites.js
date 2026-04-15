import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  addToFavorites,
  removeFromFavorites,
  checkMultipleFavorites,
  syncCachedFavorites,
  getUserFavorites,
} from "../api/favorite.api";
import { toast } from "react-toastify";

const FAVORITES_CACHE_KEY = "intellistay.favorites";

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Get cached favorites from localStorage
  const getCachedFavorites = () => {
    try {
      const cached = localStorage.getItem(FAVORITES_CACHE_KEY);
      return cached ? new Set(JSON.parse(cached)) : new Set();
    } catch {
      return new Set();
    }
  };

  // Save favorites to localStorage
  const saveCachedFavorites = (favSet) => {
    try {
      localStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(Array.from(favSet)));
    } catch {
      console.error("Failed to save favorites to cache");
    }
  };

  // Initialize favorites on mount and when user changes
  useEffect(() => {
    const initFavorites = async () => {
      if (user?._id) {
        // User is logged in
        try {
          setLoading(true);
          
          // First, sync any cached favorites to database
          const cached = getCachedFavorites();
          if (cached.size > 0) {
            try {
              await syncCachedFavorites(Array.from(cached));
            } catch (error) {
              console.error("Failed to sync cached favorites:", error);
            }
            // Clear cache after syncing
            localStorage.removeItem(FAVORITES_CACHE_KEY);
          }

          // Then fetch user's favorites from database
          const response = await getUserFavorites();
          // Response is an array of hostel objects from populate()
          const hostels = Array.isArray(response?.data) ? response.data : [];
          const hostelIds = hostels.map((hostel) => hostel._id).filter(Boolean);
          setFavorites(new Set(hostelIds));
          // Save to localStorage as backup
          saveCachedFavorites(new Set(hostelIds));
        } catch (error) {
          console.error("Failed to load favorites:", error);
          // Fallback to cached if API fails
          setFavorites(getCachedFavorites());
        } finally {
          setLoading(false);
        }
      } else {
        // User not logged in - use cached favorites
        setFavorites(getCachedFavorites());
        setLoading(false);
      }
    };

    initFavorites();
  }, [user?._id]);

  // Toggle favorite for a hostel
  const toggleFavorite = useCallback(
    async (hostelId) => {
      if (!hostelId) return;

      const isFav = favorites.has(hostelId);
      const newFavorites = new Set(favorites);

      try {
        setLoading(true);

        if (isFav) {
          // Remove favorite
          if (user?._id) {
            // Logged in - remove from DB first
            try {
              await removeFromFavorites(hostelId);
            } catch (error) {
              console.error("Failed to remove from DB:", error);
              throw error; // Re-throw to prevent state update
            }
          }
          // Only update state after successful API call
          newFavorites.delete(hostelId);
          setFavorites(newFavorites);
          saveCachedFavorites(newFavorites);
          toast.success("Removed from favorites ❌");
        } else {
          // Add favorite
          if (user?._id) {
            // Logged in - add to DB first
            try {
              await addToFavorites(hostelId);
            } catch (error) {
              console.error("Failed to add to DB:", error);
              throw error; // Re-throw to prevent state update
            }
          }
          // Only update state after successful API call
          newFavorites.add(hostelId);
          setFavorites(newFavorites);
          saveCachedFavorites(newFavorites);
          toast.success("Added to favorites ❤️");
        }
      } catch (error) {
        console.error("Toggle favorite error:", error);
        const msg =
          error.response?.data?.msg ||
          error.response?.data?.message ||
          "Failed to update favorite";
        toast.error(msg);
        // State remains unchanged on error
      } finally {
        setLoading(false);
      }
    },
    [favorites, user?._id]
  );

  // Check if hostel is favorited
  const isFavorited = useCallback(
    (hostelId) => {
      return favorites.has(hostelId);
    },
    [favorites]
  );

  // Add multiple favorites (bulk operation)
  const addMultipleFavorites = useCallback(
    (hostelIds) => {
      const newFavorites = new Set(favorites);
      hostelIds.forEach((id) => newFavorites.add(id));
      setFavorites(newFavorites);
      saveCachedFavorites(newFavorites);
    },
    [favorites]
  );

  // Check favorites for multiple hostels
  const checkMultiple = useCallback(async (hostelIds) => {
    if (!user?._id || hostelIds.length === 0) return;

    try {
      const res = await checkMultipleFavorites(hostelIds);
      const favoriteIds = Object.keys(res.data).filter(
        (id) => res.data[id] === true
      );
      setFavorites(new Set(favoriteIds));
    } catch (error) {
      console.error("Failed to check multip favorites:", error);
    }
  }, [user?._id]);

  return {
    favorites,
    isFavorited,
    toggleFavorite,
    addMultipleFavorites,
    checkMultiple,
    loading,
  };
};
