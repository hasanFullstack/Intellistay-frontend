import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllHostels } from "../api/hostel.api";
import { Select, Pagination } from "antd";
import "antd/dist/antd.css";
import "./Hostels.css";
import { useAuth } from "../auth/AuthContext";
import AuthModal from "./AuthModal";
import { toast } from "react-toastify";
import { FaMale, FaFemale } from "react-icons/fa";

const HOSTELS_CACHE_KEY = "intellistay.hostels.all.v2";
const HOSTELS_FILTERS_CACHE_KEY = "intellistay.hostels.filters.v2";
const CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes

const readCachedHostels = () => {
  try {
    const rawData = sessionStorage.getItem(HOSTELS_CACHE_KEY);
    if (!rawData) return null;

    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeCachedHostels = (data) => {
  try {
    sessionStorage.setItem(HOSTELS_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore cache write issues quietly.
  }
};

const readCachedFilterHostels = (filterType) => {
  try {
    const rawCache = sessionStorage.getItem(HOSTELS_FILTERS_CACHE_KEY);
    if (!rawCache) return null;

    const cache = JSON.parse(rawCache);
    const filterCache = cache[filterType];
    
    if (!filterCache) return null;
    
    // Check if cache has expired
    if (Date.now() - filterCache.timestamp > CACHE_EXPIRY_TIME) {
      return null;
    }
    
    return filterCache.data;
  } catch {
    return null;
  }
};

const writeCachedFilterHostels = (filterType, data) => {
  try {
    let cache = {};
    const rawCache = sessionStorage.getItem(HOSTELS_FILTERS_CACHE_KEY);
    if (rawCache) {
      cache = JSON.parse(rawCache);
    }
    
    cache[filterType] = {
      data: data,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem(HOSTELS_FILTERS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore cache write issues quietly.
  }
};

const Hostels = () => {
  const navigate = useNavigate();
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All Hostels");
  const [filterGender, setFilterGender] = useState("all");
  const { user } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Reduced from 8 for faster initial render
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadHostels();
  }, []);

  useEffect(() => {
    // Prefetch all filter data when user role is student
    if (user?.role === "student") {
      prefetchAllFilters();
    }
  }, [user?.role]);

  const loadHostels = async () => {
    const cachedHostels = readCachedHostels();

    if (cachedHostels?.length) {
      setHostels(cachedHostels);
      setFilteredHostels(cachedHostels);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await getAllHostels();
      const freshHostels = res.data || [];
      setHostels(freshHostels);
      applyFilters(freshHostels, selectedFilter, searchTerm, filterGender);
      writeCachedHostels(freshHostels);
    } catch (err) {
      if (!cachedHostels?.length) {
        toast.error("Failed to load hostels");
      }
    } finally {
      setLoading(false);
    }
  };

  const prefetchAllFilters = async () => {
    // Fetch ALL filters in parallel at once and cache them
    const filterTypes = ["available", "recommended", "popular", "budget"];
    
    // Create promises for all filters (fetch in parallel, not sequential)
    const fetchPromises = filterTypes.map(async (filterType) => {
      // Skip if already cached
      if (readCachedFilterHostels(filterType)) {
        return;
      }
      
      try {
        const res = await getAllHostels(filterType);
        const data = res.data || [];
        writeCachedFilterHostels(filterType, data);
        console.log(`Cached ${filterType} filter: ${data.length} hostels`);
      } catch (err) {
        console.log(`Prefetch failed for ${filterType}:`, err.message);
      }
    });
    
    // Wait for all filters to be fetched and cached
    await Promise.all(fetchPromises);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(hostels, selectedFilter, value, filterGender);
  };

  const applyFilters = (hostelList, filter, search, gender) => {
    let filtered = hostelList.filter((hostel) =>
      hostel.name.toLowerCase().includes(search.toLowerCase()) ||
      (hostel.city && hostel.city.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply gender filter (filter treats undefined/null as "Male")
    if (gender !== "all") {
      filtered = filtered.filter((hostel) => (hostel.gender || "Male") === gender);
    }

    setFilteredHostels(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (value) => {
    // If the user is not a student, prompt to login/register for student-only filters
    if (value !== "All Hostels" && user?.role !== "student") {
      setAuthModalOpen(true);
      return;
    }

    setSelectedFilter(value);

    // For 'All Hostels' keep using local state
    if (value === "All Hostels") {
      applyFilters(hostels, value, searchTerm, filterGender);
      return;
    }

    // Check cache first for other filters
    const cachedData = readCachedFilterHostels(value);
    if (cachedData && cachedData.length > 0) {
      // IMMEDIATELY show cached data without loading state
      applyFilters(cachedData, value, searchTerm, filterGender);
      
      // Silently fetch fresh data in background (does NOT set loading state)
      (async () => {
        try {
          const res = await getAllHostels(value);
          const data = res.data || [];
          if (data && data.length > 0) {
            writeCachedFilterHostels(value, data);
            // Update UI with fresh data
            applyFilters(data, value, searchTerm, filterGender);
          }
        } catch (err) {
          // Keep showing cached data if refresh fails
          console.log(`Failed to refresh ${value} filter:`, err.message);
        }
      })();
    } else {
      // No cache available, show loading state while fetching
      setLoading(true);
      (async () => {
        try {
          const res = await getAllHostels(value);
          const data = res.data || [];
          writeCachedFilterHostels(value, data);
          applyFilters(data, value, searchTerm, filterGender);
        } catch (err) {
          toast.error("Failed to load filter");
          // Fallback to All Hostels on error
          applyFilters(hostels, "All Hostels", searchTerm, filterGender);
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  const handleGenderFilter = (gender) => {
    setFilterGender(gender);
    if (selectedFilter === "All Hostels") {
      applyFilters(hostels, selectedFilter, searchTerm, gender);
    } else {
      applyFilters(filteredHostels, selectedFilter, searchTerm, gender);
    }
  };

  // Close auth modal callback also resets selectedFilter to All Hostels
  const handleCloseAuthModal = () => {
    setAuthModalOpen(false);
    setSelectedFilter("All Hostels");
  };

  // Calculate paginated hostels
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedHostels = filteredHostels.slice(startIndex, endIndex);

  const handlePaginationChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="hostels-page">
      {/* Hero Section */}
      <div className="relative overflow-hidden hostels-hero" style={{ height: "400px", width: "100vw", marginLeft: "calc(-50vw + 50%)" }}>
        <div className="absolute h-full w-full inset-0">
          <div className="absolute inset-0 bg-black/40"></div>
          <img src="https://www.arcodesk.com/wp-content/uploads/2025/09/Islamic-University-Hostel-Building-Design-in-Narowal.jpeg"
            alt=""
            className="object-fit w-full h-full inset-0 transparent" />
        </div>
        <div className="hero-content relative z-10">
          <h1 className="hero-title">Explore Our Hostels</h1>
          <p className="hero-subtitle">
            Discover comfortable and affordable accommodation for your journey
          </p>
        </div>

        {/* Search Bar */}
        <div className="search-container">
          <div className="search-box">
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search by hostel name or city..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>
      <div className="container-fluid">

        {loading ? (
          <div className="hostels-container">
            <div className="flex results-info flex-col gap-4">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <p>
                    Showing <strong>{filteredHostels.length}</strong> hostel
                    {filteredHostels.length !== 1 ? "s" : ""}
                  </p>
                  {user?.role === "student" && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap text-[#235784] focus:outline-none`}
                    >
                      <i className="bi bi-funnel me-2"></i>
                      Filter
                    </button>
                  )}
                </div>
                <Select
                  value={filterGender}
                  onChange={handleGenderFilter}
                  style={{ width: 150 }}
                  options={[
                    { label: "All Genders", value: "all" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                  ]}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {user?.role === "student" && (
                  <div
                    style={{
                      maxHeight: showFilters ? "500px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-in-out",
                    }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <button
                      onClick={() => handleFilterChange("All Hostels")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "All Hostels"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      All Hostels
                    </button>
                    <button
                      onClick={() => handleFilterChange("available")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "available"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Available Now
                    </button>
                    <button
                      onClick={() => handleFilterChange("recommended")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "recommended"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Recommended
                    </button>
                    <button
                      onClick={() => handleFilterChange("popular")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "popular"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Most Popular
                    </button>
                    <button
                      onClick={() => handleFilterChange("budget")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "budget"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Budget Friendly
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="loading-container">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading hostels...</p>
            </div>
          </div>
        ) : filteredHostels.length === 0 ? (
          <div className="hostels-container">
            <div className="flex results-info flex-col gap-4">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <p>
                    Showing <strong>{filteredHostels.length}</strong> hostel
                    {filteredHostels.length !== 1 ? "s" : ""}
                  </p>
                  {user?.role === "student" && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap text-[#235784] focus:outline-none`}
                    >
                      <i className="bi bi-funnel me-2"></i>
                      Filter
                    </button>
                  )}
                </div>
                <Select
                  value={filterGender}
                  onChange={handleGenderFilter}
                  style={{ width: 150 }}
                  options={[
                    { label: "All Genders", value: "all" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                  ]}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                {user?.role === "student" && (
                  <div
                    style={{
                      maxHeight: showFilters ? "500px" : "0",
                      overflow: "hidden",
                      transition: "max-height 0.3s ease-in-out",
                    }}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <button
                      onClick={() => handleFilterChange("All Hostels")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "All Hostels"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      All Hostels
                    </button>
                    <button
                      onClick={() => handleFilterChange("available")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "available"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Available Now
                    </button>
                    <button
                      onClick={() => handleFilterChange("recommended")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "recommended"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Recommended
                    </button>
                    <button
                      onClick={() => handleFilterChange("popular")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "popular"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Most Popular
                    </button>
                    <button
                      onClick={() => handleFilterChange("budget")}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "budget"
                        ? "bg-[#235784] text-white hover:opacity-95"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                        }`}
                    >
                      Budget Friendly
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <h3>No hostels found</h3>
              <p>
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "No hostels available at the moment"}
              </p>
            </div>
          </div>
        ) : (
          <div className="hostels-container">
            <div className="flex flex-col results-info gap-4">
              <div className="flex justify-between">
                <div className="flex gap-2 items-center">
                  <p>
                    Showing <strong>{filteredHostels.length}</strong> hostel
                    {filteredHostels.length !== 1 ? "s" : ""}
                  </p>

                  {user?.role === "student" && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      style={{ borderRadius: "9999px" }}
                      className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap text-[#235784] focus:outline-none`}
                    >
                      <i className="bi bi-funnel me-2"></i>
                      Filter
                    </button>
                  )}
                </div>
                <Select
                  value={filterGender}
                  onChange={handleGenderFilter}
                  style={{ width: 150 }}
                  options={[
                    { label: "All Genders", value: "all" },
                    { label: "Male", value: "Male" },
                    { label: "Female", value: "Female" },
                  ]}
                />
              </div>
              <div className="flex items-center gap-4 flex-wrap">

                {user?.role === "student" && (
                  <>

                    <div
                      style={{
                        maxHeight: showFilters ? "500px" : "0",
                        overflow: "hidden",
                        transition: "max-height 0.3s ease-in-out",
                      }}
                      className="flex items-center gap-2 flex-wrap"
                    >
                      <button
                        onClick={() => handleFilterChange("All Hostels")}
                        style={{ borderRadius: "9999px" }}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "All Hostels"
                          ? "bg-[#235784] text-white hover:opacity-95"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        All Hostels
                      </button>
                      <button
                        onClick={() => handleFilterChange("available")}
                        style={{ borderRadius: "9999px" }}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "available"
                          ? "bg-[#235784] text-white hover:opacity-95"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        Available Now
                      </button>
                      <button
                        onClick={() => handleFilterChange("recommended")}
                        style={{ borderRadius: "9999px" }}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "recommended"
                          ? "bg-[#235784] text-white hover:opacity-95"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        Recommended
                      </button>
                      <button
                        onClick={() => handleFilterChange("popular")}
                        style={{ borderRadius: "9999px" }}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "popular"
                          ? "bg-[#235784] text-white hover:opacity-95"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        Most Popular
                      </button>
                      <button
                        onClick={() => handleFilterChange("budget")}
                        style={{ borderRadius: "9999px" }}
                        className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors focus:outline-none ${selectedFilter === "budget"
                          ? "bg-[#235784] text-white hover:opacity-95"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-300"
                          }`}
                      >
                        Budget Friendly
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="hostels-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {paginatedHostels.map((hostel) => (
                <div key={hostel._id} className="hostel-card">
                  {/* Featured Image */}
                  <div className="card-image-section">
                    <img
                      src={(hostel.images && hostel.images.length > 0)
                        ? hostel.images[0]
                        : "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=800"}
                      alt={hostel.name}
                      className="card-featured-image"
                    />
                  </div>

                  {/* Card Header */}
                  <div className="bg-gradient-to-br from-[#235784] to-[#1a3f57] px-6 py-2 text-white flex items-end">
                    <div className="hostel-name-badge">
                      <h3 className="hostel-name capitalize">{hostel.name}</h3>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="card-body-section flex flex-col gap-3 px-4 py-3">
                    {/* Location */}

                    <div className="info-item">
                      <i className="bi bi-geo-alt-fill"></i>
                      <div className="info-content">
                        <label>Location</label>
                        <p>{hostel.city && hostel.addressLine1 ? `${hostel.addressLine1}, ${hostel.city}` : "Address not set"}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      {/* Gender Policy */}
                      <div className="info-item">
                        <i className="bi bi-people-fill"></i>
                        <div className="info-content">
                          <label>Gender Policy</label>
                          <p className="font-semibold flex items-center gap-1">
                            {
                              hostel.gender === "Male" ? (
                                <FaMale className="" />
                              ) : (
                                <FaFemale />
                              )
                            }

                            <span className={`text-[#2b5a84]`}>
                              {hostel.gender || "Male"}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Rules */}
                      {hostel.rules && (
                        <div className="info-item">
                          <i className="bi bi-shield-check"></i>
                          <div className="info-content">
                            <label>Rules</label>
                            <p className="rules-text">
                              {hostel.rules.substring(0, 80)}
                              {hostel.rules.length > 80 ? "..." : ""}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer-section">
                    <button
                      className="btn-view-rooms"
                      onClick={() => navigate(`/hostels/${hostel._id}/rooms`)}
                    >
                      <i className="bi bi-door-open"></i>
                      <span>Available Rooms</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
              <Pagination
                current={currentPage}
                total={filteredHostels.length}
                pageSize={itemsPerPage}
                onChange={handlePaginationChange}
                style={{}}
                itemRender={(page, type, originalElement) => {
                  if (type === "page") {
                    return (
                      <a
                        style={{
                          color: currentPage === page ? "white" : "#235784",
                          backgroundColor: currentPage === page ? "#235784" : "transparent",
                          cursor: "pointer",
                          transition: "all 0.3s",
                        }}
                      >
                        {page}
                      </a>
                    );
                  }
                  if (type === "prev") {
                    return (
                      <a
                        style={{
                          color: "#235784",
                          cursor: "pointer",
                          padding: "8px 10px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "4px",
                          transition: "all 0.3s",
                        }}
                      >
                        ← Previous
                      </a>
                    );
                  }
                  if (type === "next") {
                    return (
                      <a
                        style={{
                          color: "#235784",
                          cursor: "pointer",
                          padding: "8px 10px",
                          border: "1px solid #d9d9d9",
                          borderRadius: "4px",
                          transition: "all 0.3s",
                        }}
                      >
                        Next →
                      </a>
                    );
                  }
                  return originalElement;
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hostels;
