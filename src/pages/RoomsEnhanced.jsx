import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { getAllHostels } from "../api/hostel.api";
import { getAllRooms, getRoomOccupants } from "../api/room.api";
import "./Rooms.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CITY_COORDS = {
  lahore: [31.5204, 74.3587],
  karachi: [24.8607, 67.0011],
  islamabad: [33.6844, 73.0479],
  rawalpindi: [33.5651, 73.0169],
  faisalabad: [31.4504, 73.135],
  multan: [30.1575, 71.5249],
  peshawar: [34.0151, 71.5249],
};

const FALLBACK_COORD = [31.5204, 74.3587];

const hashString = (value = "") =>
  [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0);

const getHostelCoords = (hostel, index = 0) => {
  const lat = Number(hostel?.latitude ?? hostel?.lat);
  const lng = Number(hostel?.longitude ?? hostel?.lng ?? hostel?.long);

  if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];

  const cityKey = (hostel?.city || "").toLowerCase().trim();
  const base = CITY_COORDS[cityKey] || FALLBACK_COORD;

  const seed = hashString(String(hostel?._id || hostel?.name || index));
  const offsetLat = ((seed % 30) - 15) * 0.0015;
  const offsetLng = (((seed * 7) % 30) - 15) * 0.0015;

  return [base[0] + offsetLat, base[1] + offsetLng];
};

const getCompatibilityLabel = (score) => {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Moderate";
  return "Low";
};

const RoomsEnhanced = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [hostels, setHostels] = useState([]);
  const [hostelSearch, setHostelSearch] = useState("");
  const [selectedHostel, setSelectedHostel] = useState("all");

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    search: "",
    minPrice: "",
    maxPrice: "",
    minBeds: "",
    maxBeds: "",
    gender: "all",
    amenities: [],
    roommateMode: "all", // all | shared-only | high-match
  });

  const [highlightedRoom, setHighlightedRoom] = useState(null);
  const [showMap, setShowMap] = useState(true);

  const [compatibilityByRoom, setCompatibilityByRoom] = useState({});
  const [expandedRoommates, setExpandedRoommates] = useState({});

  const roomRefs = useRef({});

  const token = localStorage.getItem("token");

  const hostelById = useMemo(() => {
    const map = new Map();
    hostels.forEach((h) => map.set(String(h._id), h));
    return map;
  }, [hostels]);

  const filteredHostels = useMemo(() => {
    const query = hostelSearch.trim().toLowerCase();
    if (!query) return hostels;
    return hostels.filter(
      (h) =>
        h?.name?.toLowerCase().includes(query) ||
        h?.city?.toLowerCase().includes(query) ||
        h?.addressLine1?.toLowerCase().includes(query),
    );
  }, [hostels, hostelSearch]);

  const amenityOptions = useMemo(() => {
    const source =
      selectedHostel === "all"
        ? hostels
        : hostels.filter((h) => String(h._id) === String(selectedHostel));

    const all = new Set();
    source.forEach((h) => (h.amenities || []).forEach((a) => all.add(a)));

    return [...all].sort((a, b) => a.localeCompare(b));
  }, [hostels, selectedHostel]);

  const roomMarkers = useMemo(() => {
    return rooms.map((room, idx) => {
      const hostel =
        typeof room.hostelId === "object"
          ? room.hostelId
          : hostelById.get(String(room.hostelId));
      const coords = getHostelCoords(hostel, idx);
      return {
        room,
        hostel,
        coords,
      };
    });
  }, [rooms, hostelById]);

  const mapCenter = useMemo(() => {
    if (roomMarkers.length > 0) return roomMarkers[0].coords;
    return FALLBACK_COORD;
  }, [roomMarkers]);

  const displayedRooms = useMemo(() => {
    if (filters.roommateMode !== "high-match") return rooms;

    return rooms.filter((room) => {
      const payload = compatibilityByRoom[room._id];
      return Number(payload?.bestScore || 0) >= 65;
    });
  }, [rooms, filters.roommateMode, compatibilityByRoom]);

  useEffect(() => {
    const preselected = searchParams.get("hostel");
    if (preselected) setSelectedHostel(preselected);
  }, [searchParams]);

  useEffect(() => {
    const loadHostels = async () => {
      try {
        const res = await getAllHostels();
        setHostels(Array.isArray(res.data) ? res.data : []);
      } catch {
        toast.error("Failed to load hostels");
      }
    };

    loadHostels();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRooms();
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, selectedHostel, filters]);

  useEffect(() => {
    const fetchCompatibility = async () => {
      if (!token || rooms.length === 0) {
        setCompatibilityByRoom({});
        return;
      }

      const targetRooms = rooms.filter(
        (room) => String(room.roomType || "").toLowerCase() !== "single",
      );

      if (targetRooms.length === 0) {
        setCompatibilityByRoom({});
        return;
      }

      const initState = {};
      targetRooms.forEach((r) => {
        initState[r._id] = { loading: true, occupants: [], summary: null };
      });
      setCompatibilityByRoom(initState);

      const results = await Promise.all(
        targetRooms.map(async (room) => {
          try {
            const res = await getRoomOccupants(room._id);
            const occupants = Array.isArray(res.data?.occupants)
              ? res.data.occupants
              : [];
            const best = occupants
              .filter((o) => Number.isFinite(o.similarityScore))
              .sort((a, b) => b.similarityScore - a.similarityScore)[0];

            return [
              room._id,
              {
                loading: false,
                occupants,
                summary: res.data?.summary || null,
                bestScore: best?.similarityScore ?? null,
                bestLabel:
                  best?.matchLabel ||
                  (Number.isFinite(best?.similarityScore)
                    ? getCompatibilityLabel(best.similarityScore)
                    : null),
              },
            ];
          } catch {
            return [
              room._id,
              {
                loading: false,
                occupants: [],
                summary: null,
                bestScore: null,
                bestLabel: null,
              },
            ];
          }
        }),
      );

      setCompatibilityByRoom(Object.fromEntries(results));
    };

    fetchCompatibility();
  }, [rooms, token]);

  const fetchRooms = async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: pagination.limit,
        availableOnly: true,
        search: filters.search || undefined,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        minBeds: filters.minBeds || undefined,
        maxBeds: filters.maxBeds || undefined,
        gender: filters.gender,
        amenities:
          filters.amenities.length > 0
            ? filters.amenities.join(",")
            : undefined,
        roommateMode:
          filters.roommateMode === "high-match"
            ? "shared-only"
            : filters.roommateMode,
      };

      if (selectedHostel !== "all") params.hostelId = selectedHostel;

      const res = await getAllRooms({ params });

      const payload = res.data;

      if (Array.isArray(payload)) {
        setRooms(payload);
        setPagination((prev) => ({
          ...prev,
          total: payload.length,
          totalPages: 1,
        }));
      } else {
        setRooms(Array.isArray(payload?.data) ? payload.data : []);
        setPagination(
          payload?.pagination || {
            page: 1,
            limit: pagination.limit,
            total: 0,
            totalPages: 1,
          },
        );
      }
    } catch {
      toast.error("Failed to load rooms");
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const onHostelSelect = (hostelId) => {
    setSelectedHostel(hostelId);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (hostelId === "all") next.delete("hostel");
      else next.set("hostel", hostelId);
      return next;
    });
  };

  const toggleAmenity = (amenity) => {
    setCurrentPage(1);
    setFilters((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const updateFilter = (key, value) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setFilters({
      search: "",
      minPrice: "",
      maxPrice: "",
      minBeds: "",
      maxBeds: "",
      gender: "all",
      amenities: [],
      roommateMode: "all",
    });
  };

  const handleMarkerClick = (roomId) => {
    setHighlightedRoom(roomId);
    const target = roomRefs.current[roomId];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="rooms-page">
      <div className="container-fluid rooms-shell">
        <div className="rooms-header">
          <h1 className="rooms-title">Find Your Perfect Room</h1>
          <p className="rooms-subtitle">
            Filter smarter, compare faster, and match with the right roommates.
          </p>
        </div>

        <div className="hostel-picker-card">
          <div className="hostel-picker-top">
            <h5 className="m-0">Hostels</h5>
            <input
              type="text"
              className="form-control hostel-search"
              placeholder="Search hostels by name or city"
              value={hostelSearch}
              onChange={(e) => setHostelSearch(e.target.value)}
            />
          </div>

          <div className="hostel-chip-row">
            <button
              className={`hostel-chip ${selectedHostel === "all" ? "active" : ""}`}
              onClick={() => onHostelSelect("all")}
            >
              All Hostels
            </button>
            {filteredHostels.map((hostel) => (
              <button
                key={hostel._id}
                className={`hostel-chip ${
                  selectedHostel === hostel._id ? "active" : ""
                }`}
                onClick={() => onHostelSelect(hostel._id)}
              >
                <span className="chip-name">{hostel.name}</span>
                <span className="chip-location">{hostel.city}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rooms-filters-sticky">
          <div className="filters-grid">
            <input
              type="text"
              className="form-control"
              placeholder="Search rooms, hostels, city..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />

            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
            />

            <input
              type="number"
              min="0"
              className="form-control"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
            />

            <select
              className="form-select"
              value={filters.minBeds}
              onChange={(e) => updateFilter("minBeds", e.target.value)}
            >
              <option value="">Min beds</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>

            <select
              className="form-select"
              value={filters.gender}
              onChange={(e) => updateFilter("gender", e.target.value)}
            >
              <option value="all">Any Gender Policy</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              className="form-select"
              value={filters.roommateMode}
              onChange={(e) => updateFilter("roommateMode", e.target.value)}
            >
              <option value="all">Any Room Type</option>
              <option value="shared-only">Shared only</option>
              <option value="high-match">High roommate match</option>
            </select>
          </div>

          {amenityOptions.length > 0 && (
            <div className="amenity-chip-row">
              {amenityOptions.map((amenity) => (
                <button
                  key={amenity}
                  className={`amenity-chip ${
                    filters.amenities.includes(amenity) ? "active" : ""
                  }`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </button>
              ))}
            </div>
          )}

          <div className="filters-actions">
            <button className="btn btn-sm btn-outline-dark" onClick={clearFilters}>
              Reset Filters
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => setShowMap((prev) => !prev)}
            >
              {showMap ? "Hide Map" : "Show Map"}
            </button>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className={showMap ? "col-xl-7" : "col-12"}>
            {loading ? (
              <div className="loading-box">Loading rooms...</div>
            ) : displayedRooms.length === 0 ? (
              <div className="empty-box">
                No rooms found for selected filters. Try broadening your search.
              </div>
            ) : (
              <>
                <div className="rooms-grid">
                  {displayedRooms.map((room) => {
                    const hostel =
                      typeof room.hostelId === "object"
                        ? room.hostelId
                        : hostelById.get(String(room.hostelId));

                    const compatibility = compatibilityByRoom[room._id];
                    const showRoommateMatch =
                      String(room.roomType || "").toLowerCase() !== "single";

                    return (
                      <div
                        key={room._id}
                        ref={(el) => {
                          if (el) roomRefs.current[room._id] = el;
                        }}
                        className={`room-card ${
                          highlightedRoom === room._id ? "highlighted" : ""
                        }`}
                        onMouseEnter={() => setHighlightedRoom(room._id)}
                      >
                        <div className="room-image-section">
                          <img
                            src={
                              room.images?.[0] ||
                              "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1000"
                            }
                            alt={room.roomType}
                            className="room-featured-image"
                          />
                          <div className="availability-badge">
                            {room.availableBeds} beds left
                          </div>
                        </div>

                        <div className="room-content">
                          <div className="room-title-row">
                            <h5 className="room-type mb-0">{room.roomType}</h5>
                            <span className="room-price">Rs {room.pricePerBed}/mo</span>
                          </div>

                          <div className="room-meta">
                            <span>{room.totalBeds} total beds</span>
                            <span>{hostel?.city || "City N/A"}</span>
                            <span>{hostel?.gender || "Policy N/A"}</span>
                          </div>

                          <p className="room-hostel-name">{hostel?.name || "Hostel"}</p>

                          {showRoommateMatch && (
                            <div className="compatibility-wrap">
                              {!token ? (
                                <span className="compat-chip neutral">
                                  Login to view roommate match
                                </span>
                              ) : compatibility?.loading ? (
                                <span className="compat-chip neutral">
                                  Checking roommate compatibility...
                                </span>
                              ) : Number.isFinite(compatibility?.bestScore) ? (
                                <span className="compat-chip good">
                                  {Math.round(compatibility.bestScore)}% match • {compatibility.bestLabel}
                                </span>
                              ) : compatibility?.summary?.visibleOccupiedBeds > 0 ? (
                                <span className="compat-chip neutral">
                                  Roommates present, profile data limited
                                </span>
                              ) : (
                                <span className="compat-chip neutral">No roommates yet</span>
                              )}

                              {token && (compatibility?.occupants?.length || 0) > 0 && (
                                <button
                                  className="btn-link-toggle"
                                  onClick={() =>
                                    setExpandedRoommates((prev) => ({
                                      ...prev,
                                      [room._id]: !prev[room._id],
                                    }))
                                  }
                                >
                                  {expandedRoommates[room._id]
                                    ? "Hide roommates"
                                    : "Show roommates"}
                                </button>
                              )}
                            </div>
                          )}

                          {expandedRoommates[room._id] &&
                            (compatibility?.occupants?.length || 0) > 0 && (
                              <div className="roommate-list">
                                {compatibility.occupants.map((occ) => (
                                  <div key={occ._id} className="roommate-item">
                                    <div className="roommate-top">
                                      <strong>{occ.name}</strong>
                                      {Number.isFinite(occ.similarityScore) && (
                                        <span className="score-chip">
                                          {Math.round(occ.similarityScore)}%
                                        </span>
                                      )}
                                    </div>
                                    <div className="roommate-sub">
                                      Beds: {occ.bedNumbers?.length > 0
                                        ? occ.bedNumbers.join(", ")
                                        : occ.bedsBooked || 1}
                                    </div>
                                    {(occ.topMatches || []).length > 0 && (
                                      <div className="traits-row">
                                        {occ.topMatches.slice(0, 3).map((t) => (
                                          <span key={t.label} className="trait-chip">
                                            {t.label}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                          <div className="room-actions">
                            <button
                              className="btn btn-dark btn-sm"
                              onClick={() =>
                                navigate(`/room/${room._id}/${hostel?._id || room.hostelId}`)
                              }
                            >
                              View Details
                            </button>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              onClick={() =>
                                navigate(`/room/${room._id}/${hostel?._id || room.hostelId}`)
                              }
                            >
                              Quick Book
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="pagination-wrap">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      disabled={currentPage >= pagination.totalPages}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {showMap && (
            <div className="col-xl-5">
              <div className="map-card">
                <div className="map-title">Map View</div>
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  scrollWheelZoom={false}
                  className="rooms-map"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  {roomMarkers.map(({ room, hostel, coords }) => (
                    <Marker
                      key={room._id}
                      position={coords}
                      eventHandlers={{
                        click: () => handleMarkerClick(room._id),
                      }}
                    >
                      <Popup>
                        <div className="map-popup">
                          <strong>{hostel?.name || "Hostel"}</strong>
                          <div>{room.roomType}</div>
                          <div>Rs {room.pricePerBed}/month</div>
                          <button
                            className="btn btn-sm btn-dark mt-2"
                            onClick={() =>
                              navigate(`/room/${room._id}/${hostel?._id || room.hostelId}`)
                            }
                          >
                            Quick Book
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsEnhanced;
