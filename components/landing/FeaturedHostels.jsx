import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, ChevronDown } from "lucide-react";
import { useFavorites } from "../../src/hooks/useFavorites";
import { getAllHostels } from "../../src/api/hostel.api";
import { useAuth } from "../../src/auth/AuthContext";
import { useHostels } from "../../src/context/HostelsContext";

const GENDER_OPTIONS = ["Any Gender", "Male", "Female"];
const HOSTEL_TYPE_OPTIONS = [
  { label: "All Hostels", value: "All Hostels" },
  { label: "Available Now", value: "available" },
  { label: "Recommended", value: "recommended" },
  { label: "Most Popular", value: "popular" },
  { label: "Budget Friendly", value: "budget" },
];

const featureFilterCache = new Map();

const extractCity = (city = "") => {
  return String(city).trim();
};

const FeaturedHostels = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeFilters, setActiveFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("All Hostels");
  const [selectedLocation, setSelectedLocation] = useState("Any Location");
  const [selectedGender, setSelectedGender] = useState("Any Gender");
  const [hostels, setHostels] = useState([]);
  const [visibleHostels, setVisibleHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const { hostels: ctxHostels, refresh } = useHostels();
  const isLoggedIn = Boolean(user?._id);

  const latestEight = useMemo(() => {
    return hostels.slice(0, 8);
  }, [hostels]);

  const applyLocalFilters = (hostelList) => {
    const q = String(searchText || "")
      .trim()
      .toLowerCase();

    return hostelList.filter((hostel) => {
      const name = (hostel?.name || "").toLowerCase();
      const city = (hostel?.city || "").toLowerCase();
      const description = (hostel?.description || "").toLowerCase();

      const matchesText =
        !q || name.includes(q) || city.includes(q) || description.includes(q);

      const hostelCity = extractCity(hostel?.city || "");
      const matchesLocation =
        selectedLocation === "Any Location" ||
        hostelCity.toLowerCase() === String(selectedLocation).toLowerCase();

      const hostelGender = String(hostel?.gender || "Male");
      const matchesGender =
        selectedGender === "Any Gender" ||
        hostelGender.toLowerCase() === String(selectedGender).toLowerCase();

      return matchesText && matchesLocation && matchesGender;
    });
  };

  const fetchByType = async (typeValue) => {
    if (typeValue === "All Hostels") {
      if (Array.isArray(ctxHostels) && ctxHostels.length > 0) {
        return ctxHostels;
      }

      const refreshed = await refresh();
      return Array.isArray(refreshed) ? refreshed : [];
    }

    const cached = featureFilterCache.get(typeValue);
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const response =
      await getAllHostels(typeValue);

    const data = Array.isArray(response?.data) ? response.data : [];
    featureFilterCache.set(typeValue, data);

    return data;
  };

  const loadHostelsByType = async (typeValue) => {
    try {
      setLoading(true);
      setError("");

      if (typeValue === "recommended" && !isLoggedIn) {
        setHostels([]);
        setVisibleHostels([]);
        setError("Log in to use the Recommended filter.");
        return;
      }

      const fetched = await fetchByType(typeValue);
      setHostels(fetched);
    } catch (err) {
      const status = err?.response?.status;
      const rawMsg = (err?.response?.data?.msg || "").toLowerCase();
      const isAuthError =
        status === 401 ||
        status === 403 ||
        rawMsg.includes("token") ||
        rawMsg.includes("unauthorized") ||
        rawMsg.includes("not authenticated");

      setError(
        isAuthError
          ? "Log in to use this filter."
          : "Unable to load hostels. Please try again later."
      );
      setHostels([]);
      setVisibleHostels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHostelsByType(selectedType);
  }, [selectedType, ctxHostels, isLoggedIn]);

  useEffect(() => {
    const hasLocalFilters =
      String(searchText || "").trim() !== "" ||
      selectedLocation !== "Any Location" ||
      selectedGender !== "Any Gender";

    const backendFilterApplied = selectedType !== "All Hostels";
    const filtered = applyLocalFilters(hostels);

    if (!hasLocalFilters && !backendFilterApplied) {
      setSearchActive(false);
      setVisibleHostels(hostels.slice(0, 8));
      return;
    }

    setSearchActive(true);
    setVisibleHostels(filtered);
  }, [hostels, searchText, selectedLocation, selectedGender, selectedType]);

  const runSearch = () => {
    const el = document.getElementById("search-results");
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const locationOptions = useMemo(() => {
    const uniqueLocations = [
      ...new Set(
        latestEight
          .map((h) => h?.city || "")
          .filter((city) => Boolean(city)),
      ),
    ];
    return ["Any Location", ...uniqueLocations];
  }, [latestEight]);

  // Filter-type removed; nothing to handle here

  const clearAll = async () => {
    setSearchText("");
    setSelectedType("All Hostels");
    setSelectedLocation("Any Location");
    setSelectedGender("Any Gender");
    setSearchActive(false);
    await loadHostelsByType("All Hostels");
  };

  const primaryColor = "#235784";

  const { toggleFavorite, isFavorited } = useFavorites();

  const isAnyFilterSelected =
    String(searchText || "").trim() !== "" ||
    selectedType !== "All Hostels" ||
    selectedLocation !== "Any Location" ||
    selectedGender !== "Any Gender";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">


      {/* Main Search + Filters (separate cards) */}
      <div className="max-w-6xl mx-auto mb-12 space-y-5">
        {/* Top Search Bar */}
        <div className="bg-white rounded-2xl shadow-[0_12px_35px_rgba(15,23,42,0.12)] p-4 md:p-5 flex flex-wrap items-center gap-4">
          <div className="flex-[2] min-w-[300px] relative self-end">
            <div className="flex items-center rounded-xl px-3 py-2.5 bg-gray-50 border border-[#235784]">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Find hostels by features, Location or address"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full outline-none text-sm text-gray-600 bg-transparent focus:outline-none focus:ring-0 focus-visible:outline-none active:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={runSearch}
            style={{ backgroundColor: primaryColor }}
            className="px-8 py-2.5 rounded text-white font-semibold self-end transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </div>

        {/* Filters Section */}
        <div className="p-4 md:p-5 bg-white rounded-2xl shadow-[0_12px_35px_rgba(15,23,42,0.10)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveFilters(!activeFilters)}
              className="flex items-center text-sm text-[#235784] font-semibold"
            >
              Filters{" "}
              <ChevronDown
                size={16}
                className={`ml-1 transition-transform ${activeFilters ? "rotate-180" : ""}`}
              />
            </button>
            {isAnyFilterSelected && (
              <button
                onClick={clearAll}
                className="text-xs text-gray-400 flex items-center hover:text-gray-600"
              >
                Clear Filters
              </button>
            )}
          </div>

          {activeFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <div className="flex-1 min-w-[200px] relative">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                  Filter Type
                </label>
                <div className="relative">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 bg-gray-50 text-sm text-gray-700 appearance-none border border-[#235784] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-[#235784] active:border-[#235784]"
                  >
                    {HOSTEL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[200px] relative">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                  Location
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 bg-gray-50 text-sm text-gray-700 appearance-none border border-[#235784] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-[#235784] active:border-[#235784]"
                  >
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Hostel Gender
                </span>
                <div className="relative">
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 bg-gray-50 text-sm text-gray-700 appearance-none border border-[#235784] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-[#235784] active:border-[#235784]"
                  >
                    {GENDER_OPTIONS.map((genderOption) => (
                      <option key={genderOption} value={genderOption}>
                        {genderOption}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto">
        <h2 id="search-results" className="text-3xl font-bold text-center !mb-12 text-gray-800">
          {searchActive ? "Filtered Hostels" : "Latest Hostels"}
        </h2>

        {error && (
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-sm text-gray-500">{error}</span>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading hostels...</p>
        ) : error ? null : visibleHostels.length === 0 ? (
          <p className="text-center text-gray-500">No hostels found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {visibleHostels.map((hostel) => (
                <div
                  key={hostel._id}
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/hostels/${hostel._id}/rooms`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/hostels/${hostel._id}/rooms`);
                  }}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={(hostel?.images && hostel.images.length > 0) ? hostel.images[0] : "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800"}
                      alt={hostel?.name || "Hostel"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badges */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {!searchActive && (
                        <span className="bg-[#235784] text-white text-[10px] font-bold px-2 py-1 rounded">
                          LATEST
                        </span>
                      )}
                      <span className="bg-[#235784] text-white text-[10px] font-bold px-2 py-1 rounded uppercase">
                        HOSTEL
                      </span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await toggleFavorite(hostel._id);
                      }}
                      className="absolute top-3 right-3 backdrop-blur-md p-1.5 text-white hover:!bg-gray-700 hover:text-red-500 transition-all duration-200"
                      style={{
                        borderRadius: "0.375rem",
                        backgroundColor: "rgb(110 99 99 / 20%)"
                      }}
                    >
                      <Heart
                        size={18}
                        fill={isFavorited(hostel._id) ? "#ef4444" : "none"}
                        color={isFavorited(hostel._id) ? "#ef4444" : "white"}
                      />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="bg-[#235784] flex items-center text-white text-xs px-2 py-2 ">
                    <h3 className="text-lg mb-0 font-semibold text-gray-800 line-clamp-1 capitalize">
                      {hostel?.name || "Untitled Hostel"}
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className=" flex gap-2">
                      <i className="bi bi-geo-alt-fill text-[#235784]"></i>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {hostel?.city && hostel?.addressLine1
                          ? `${hostel.addressLine1}, ${hostel.city}`
                          : "Address not set"}
                      </p>
                    </div>
                    <div className=" flex gap-2">
                      <i className="bi bi-shield-check text-[#235784]"></i>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {hostel?.rules ||
                          "Comfortable stay with good facilities and a peaceful environment."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturedHostels;
