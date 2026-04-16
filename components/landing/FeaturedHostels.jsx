import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Heart, ChevronDown } from "lucide-react";
import { getAllHostels } from "../../src/api/hostel.api";
import { getRoomsByHostel } from "../../src/api/room.api";

const SEATER_OPTIONS = ["Any Seater", "Single", "2 Seater", "4 Seater"];

const extractCity = (city = "") => {
  return String(city).trim();
};

const selectedSeaterToBedCount = (selectedSeater) => {
  if (selectedSeater === "Single") return 1;
  if (selectedSeater === "2 Seater") return 2;
  if (selectedSeater === "4 Seater") return 4;
  return null;
};

const FeaturedHostels = () => {
  const navigate = useNavigate();
  const [activeFilters, setActiveFilters] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Any Location");
  const [selectedSeater, setSelectedSeater] = useState("Any Seater");
  const [hostels, setHostels] = useState([]);
  const [visibleHostels, setVisibleHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchActive, setSearchActive] = useState(false);

  const fallbackImage =
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400";

  const fetchHostels = async () => {
    const res = await getAllHostels();
    return Array.isArray(res?.data) ? res.data : [];
  };

  const buildRoomMeta = async (hostelList) => {
    if (!hostelList.length) return {};

    const entries = await Promise.all(
      hostelList.map(async (hostel) => {
        try {
          const res = await getRoomsByHostel(hostel._id);
          const rooms = Array.isArray(res?.data) ? res.data : [];
          const uniqueSeaters = [
            ...new Set(
              rooms
                .map((room) => Number(room?.totalBeds || 0))
                .filter((beds) => Number.isFinite(beds) && beds > 0),
            ),
          ].sort((a, b) => a - b);

          return [String(hostel._id), uniqueSeaters];
        } catch {
          return [String(hostel._id), []];
        }
      }),
    );

    return Object.fromEntries(entries);
  };

  const latestEight = useMemo(() => {
    return hostels.slice(0, 8);
  }, [hostels]);

  const applyLocalFilters = (hostelList, roomMeta, criteria) => {
    const { text, location, seater } = criteria;
    const q = String(text || "")
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
        location === "Any Location" ||
        hostelCity.toLowerCase() === String(location).toLowerCase();

      const hostelSeaters = roomMeta[String(hostel?._id)] || [];
      const selectedBedCount = selectedSeaterToBedCount(seater);
      const matchesSeater =
        selectedBedCount == null || hostelSeaters.includes(selectedBedCount);

      return matchesText && matchesLocation && matchesSeater;
    });
  };

  const runSearch = async () => {
    try {
      setLoading(true);
      setError("");
      // Determine if any filter/search is active
      const hasFilter =
        String(searchText || "").trim() !== "" ||
        selectedLocation !== "Any Location" ||
        selectedSeater !== "Any Seater";

      // If no filter or search is active, keep showing latest hostels and do not call backend
      if (!hasFilter) {
        setSearchActive(false);
        setVisibleHostels(latestEight);
        return;
      }

      setSearchActive(true);

      const all = await fetchHostels();
      const topEight = all.slice(0, 8);
      const roomMeta = await buildRoomMeta(topEight);

      setHostels(all);

      const result = applyLocalFilters(topEight, roomMeta, {
        text: searchText,
        location: selectedLocation,
        seater: selectedSeater,
      });
      setVisibleHostels(result);
      // Smooth scroll to results header when filters/search were used
      const el = document.getElementById("search-results");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to load hostels");
      setHostels([]);
      setVisibleHostels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        setError("");

        const all = await fetchHostels();
        const topEight = all.slice(0, 8);

        setHostels(all);
        setVisibleHostels(topEight);
      } catch (err) {
        setError(err?.response?.data?.msg || "Failed to load hostels");
        setHostels([]);
        setVisibleHostels([]);
      } finally {
        setLoading(false);
      }
    };

    initialLoad();
  }, []);

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
    setSelectedLocation("Any Location");
    setSelectedSeater("Any Seater");
    setSearchActive(false);
    try {
      setLoading(true);
      setError("");
      const all = await fetchHostels();
      const topEight = all.slice(0, 8);
      setHostels(all);
      setVisibleHostels(topEight);
    } catch (err) {
      setError(err?.response?.data?.msg || "Failed to load hostels");
      setHostels([]);
      setVisibleHostels([]);
    } finally {
      setLoading(false);
    }
  };

  const primaryColor = "#235784";

  const isAnyFilterSelected =
    String(searchText || "").trim() !== "" ||
    selectedLocation !== "Any Location" ||
    selectedSeater !== "Any Seater";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">


      {/* Main Search + Filters (separate cards) */}
      <div className="max-w-6xl mx-auto mb-12 space-y-5">
        {/* Top Search Bar */}
        <div className="bg-white rounded-2xl shadow-[0_12px_35px_rgba(15,23,42,0.12)] p-4 md:p-5 flex flex-wrap items-center gap-4">
          <div className="flex-[2] min-w-[300px] relative self-end">
            <div className="flex items-center rounded-xl px-3 py-2.5 bg-gray-50">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Find hostels by features, Location or address"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full outline-none text-sm text-gray-600 bg-transparent"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Filter Type removed per request */}

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Room Seater
                </span>
                <div className="relative">
                  <select
                    value={selectedSeater}
                    onChange={(e) => setSelectedSeater(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 bg-gray-50 text-sm text-gray-700 appearance-none"
                  >
                    {SEATER_OPTIONS.map((seaterLabel) => (
                      <option key={seaterLabel} value={seaterLabel}>
                        {seaterLabel}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={14}
                    className="text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </label>
              <div className="flex-1 min-w-[200px] relative">
                <label className="text-xs font-bold text-gray-400 uppercase block mb-1">
                  Location
                </label>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 bg-gray-50 text-sm text-gray-700 appearance-none"
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
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-6xl mx-auto">
        <h2 id="search-results" className="text-3xl font-bold text-center !mb-12 text-gray-800">
          {searchActive ? "Search Results" : "Latest Hostels"}
        </h2>

        {error && (
          <p className="text-center text-sm text-amber-600 mb-5">{error}</p>
        )}

        {loading ? (
          <p className="text-center text-gray-500">Loading hostels...</p>
        ) : visibleHostels.length === 0 ? (
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

                    {/* Heart Icon */}
                    <button className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full text-white hover:bg-white hover:text-red-500 transition-colors">
                      <Heart size={18} />
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
