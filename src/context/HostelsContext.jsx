import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllHostels } from "../api/hostel.api";

const HostelsContext = createContext(null);

// Module-level cache + shared promise to dedupe requests across the app
let cachedHostels = null;
let cacheTimestamp = 0;
let sharedPromise = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const HostelsProvider = ({ children }) => {
  const [hostels, setHostels] = useState(cachedHostels || []);
  const [loading, setLoading] = useState(!Array.isArray(cachedHostels) || cachedHostels.length === 0);
  const [error, setError] = useState(null);

  const fetchHostels = async (force = false) => {
    // Use cached if fresh
    const now = Date.now();
    if (!force && cachedHostels && now - cacheTimestamp < CACHE_TTL) {
      setHostels(cachedHostels);
      setLoading(false);
      return cachedHostels;
    }

    if (!sharedPromise) {
      sharedPromise = (async () => {
        try {
          const res = await getAllHostels();
          const data = Array.isArray(res?.data) ? res.data : [];
          cachedHostels = data;
          cacheTimestamp = Date.now();
          setHostels(data);
          setError(null);
          return data;
        } catch (err) {
          setError(err);
          setHostels([]);
          return [];
        } finally {
          setLoading(false);
          sharedPromise = null;
        }
      })();
    }

    return sharedPromise;
  };

  useEffect(() => {
    // Initial fetch
    fetchHostels().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = async () => {
    setLoading(true);
    return fetchHostels(true);
  };

  return (
    <HostelsContext.Provider value={{ hostels, loading, error, refresh }}>
      {children}
    </HostelsContext.Provider>
  );
};

export const useHostels = () => {
  const ctx = useContext(HostelsContext);
  if (!ctx) throw new Error("useHostels must be used within HostelsProvider");
  return ctx;
};

export default HostelsContext;
