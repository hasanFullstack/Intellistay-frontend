import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHostelById } from "../api/hostel.api";
import { getRoomsByHostel } from "../api/room.api";
import { toast } from "react-toastify";
import { ArrowLeft, Building2, CircleCheck, MapPin, SunSnow, Wifi, Coffee, DoorClosedLocked, TowerControl, CookingPot, Users, Navigation, UtensilsCrossed, ShieldCheck, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import "./Rooms.css";
import "./HostelRooms.css";


// map amenity text to material icon names
const amenityIcons = (amenity) => {
  const key = (amenity || "").toLowerCase();
  if (key.includes("wifi")) return <Wifi />;
  if (key.includes("ac") || key.includes("air")) return <SunSnow className="w-8 h-8" />;
  if (key.includes("laundry")) return <TowerControl />;
  if (key.includes("coffee") || key.includes("cafe")) return <Coffee />;
  if (key.includes("kitchen") || key.includes("kitchen")) return <CookingPot />;
  if (key.includes("parking")) return <MapPin />;
  if (key.includes("security")) return <DoorClosedLocked />;
  return <CircleCheck />;
};

// Generate location highlights from hostel data
const generateLocationHighlights = (hostel) => {
  if (hostel.highlights && Array.isArray(hostel.highlights)) {
    return hostel.highlights.map((h) => ({
      icon: getHighlightIcon(h.icon || "location"),
      title: h.title,
      description: h.description,
    }));
  }

  // Fallback: generate from hostel data
  const defaultHighlights = [
    {
      icon: <Navigation className="w-5 h-5 text-slate-700" />,
      title: "Prime Location",
      description: hostel.city && hostel.addressLine1 ? `${hostel.addressLine1}, ${hostel.city}` : "Well-located hostel",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-slate-700" />,
      title: "Safety & Security",
      description:
        hostel.amenities?.some((a) =>
          a.toLowerCase().includes("security")
        )
          ? "Security features included"
          : "Safe accommodations",
    },
  ];

  if (
    hostel.amenities?.some((a) =>
      a.toLowerCase().includes("coffee") || a.toLowerCase().includes("kitchen")
    )
  ) {
    defaultHighlights.push({
      icon: <UtensilsCrossed className="w-5 h-5 text-slate-700" />,
      title: "Food & Amenities",
      description: "Dining facilities available",
    });
  }

  return defaultHighlights;
};

// Map highlight icon strings to components
const getHighlightIcon = (iconName) => {
  const key = (iconName || "").toLowerCase();
  if (key.includes("navigation") || key.includes("location"))
    return <Navigation className="w-5 h-5 text-slate-700" />;
  if (key.includes("utensil") || key.includes("food"))
    return <UtensilsCrossed className="w-5 h-5 text-slate-700" />;
  if (key.includes("shield") || key.includes("security"))
    return <ShieldCheck className="w-5 h-5 text-slate-700" />;
  return <Navigation className="w-5 h-5 text-slate-700" />;
};

const HostelRooms = () => {
  const { hostelId } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const loadHostelRooms = async () => {
      if (!hostelId) return;

      try {
        setLoading(true);
        const [hostelRes, roomsRes] = await Promise.all([
          getHostelById(hostelId),
          getRoomsByHostel(hostelId),
        ]);

        setHostel(hostelRes.data || null);
        setRooms(roomsRes.data || []);
      } catch {
        setHostel(null);
        setRooms([]);
        toast.error("Failed to load hostel rooms");
      } finally {
        setLoading(false);
      }
    };

    loadHostelRooms();
  }, [hostelId]);

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const roomName = room.roomType || "";
      const matchesSearch = roomName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesSearch && room.availableBeds > 0;
    });
  }, [rooms, searchTerm]);

  const openRoomDetail = (roomId) => {
    navigate(`/room/${roomId}/${hostelId}`);
  };

  const handleRoomCardKeyDown = (event, roomId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openRoomDetail(roomId);
    }
  };

  if (loading) {
    return (
      <div className="rooms-page">
        <div className="container-fluid py-5">
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading hostel rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!hostel) {
    return (
      <div className="rooms-page">
        <div className="container-fluid py-5">
          <div className="hostel-rooms-empty-state text-center">
            <i className="bi bi-building"></i>
            <h2>Hostel not found</h2>
            <p>The hostel you selected could not be loaded.</p>
            <button
              type="button"
              className="btn-book hostel-rooms-back-btn"
              onClick={() => navigate("/hostels")}
            >
              <i className="bi bi-arrow-left"></i>
              Back to Hostels
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rooms-page hostel-rooms-shell text-on-surface">
      <div className="bg-white/80 backdrop-blur-md shadow-sm">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-4">
          <button
            onClick={() => navigate("/hostels")}
            className="flex items-center gap-2 text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition font-medium"
          >
            <ArrowLeft size={18} />
            Back to Hostels
          </button>
        </div>
      </div>

      <div className="pt-8 pb-32 max-w-[1440px] mx-auto px-6 md:px-12">

        {/* HERO */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7 flex flex-col justify-end">
            <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 bg-black rounded-full text-sm text-white font-bold">Premium Experience</div>

            <h1 className="text-5xl md:text-7xl font-extrabold !text-[#235784] mb-6">{hostel.name}</h1>

            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined !text-[#235784]"><MapPin /></span>
              <p className="text-lg text-gray-600 font-medium mb-0">{hostel.city && hostel.addressLine1 ? `${hostel.addressLine1}, ${hostel.city}` : "Address not set"}</p>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                {hostel.gender || "Male"} Hostel
              </span>
            </div>

            <p className="text-xl max-w-2xl mb-8">{hostel.description}</p>
          </div>

          {/* Images / Gallery with Carousel */}
          <div className="lg:col-span-5">
            {Array.isArray(hostel.images) && hostel.images.length > 0 ? (
              <div className="flex flex-col gap-4">
                {/* Main Image with Navigation */}
                <div className="relative rounded-xl overflow-hidden bg-surface-container">
                  <img
                    src={hostel.images[selectedImage]}
                    alt={`${hostel.name} ${selectedImage}`}
                    className="w-full h-96 object-contain"
                  />

                  {/* Left Navigation Button */}
                  {hostel.images.length > 1 && (
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === 0 ? hostel.images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-gray-50/50 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-100"
                      aria-label="Previous image"
                      style={{ borderRadius: "100%" }}
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-800" />
                    </button>
                  )}

                  {/* Right Navigation Button */}
                  {hostel.images.length > 1 && (
                    <button
                      onClick={() => setSelectedImage((prev) => (prev === hostel.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-50/50 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-100"
                      aria-label="Next image"
                      style={{ borderRadius: "100%" }}
                    >
                      <ChevronRight className="w-6 h-6 text-slate-800" />
                    </button>
                  )}

                  {/* Image Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {selectedImage + 1} / {hostel.images.length}
                  </div>
                </div>

                {/* Thumbnail Gallery */}
                {hostel.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {hostel.images.map((src, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300 hover:border-gray-400'
                          }`}
                      >
                        <img src={src} alt={`${hostel.name} ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 rounded-xl object-cover w-full h-96 bg-surface-container" />
                <div className="rounded-xl object-cover w-full h-20 bg-surface-container" />
                <div className="rounded-xl object-cover w-full h-20 bg-surface-container" />
              </div>
            )}
          </div>
        </section>

        {/* STATUS */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="mb-16">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-6">Status Overview</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex justify-between items-center p-8 bg-[#f2f4f7] rounded-xl">
                    <div>
                      <p className="text-on-surface-variant text-base">Total Rooms</p>
                      <p className="text-4xl font-black">{rooms.length}</p>
                    </div>
                    <Building2 className="text-[#c2cdde] w-12 h-12" />
                  </div>

                  <div className="flex justify-between items-center p-8 bg-[#f2f4f7] rounded-xl">
                    <div>
                      <p className="text-on-surface-variant text-base">Available Now</p>
                      <p className="text-4xl font-bold text-[#235784]">{filteredRooms.length}</p>
                    </div>
                    <CircleCheck className="text-[#235784] w-12 h-12" />
                  </div>
                </div>
              </div>
            </div>

            {/* AMENITIES */}
            {hostel.amenities && hostel.amenities.length > 0 && (
              <section className="mb-16">
                <h2 className="text-2xl font-bold mb-8 !text-[#235784]">Curated Amenities</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {hostel.amenities.map((amenity, i) => (
                    <div key={i} className="flex flex-col items-center p-6 bg-white rounded-xl shadow-sm">
                      <span className="material-symbols-outlined text-[#003b44] mb-3 text-3xl">{amenityIcons(amenity)}</span>
                      <span className="text-sm font-semibold">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Filters */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between gap-8">
                <h2 className="!text-[#235784] !text-2xl font-bold">Available Spaces</h2>
              </div>
            </div>

            {/* ROOM CARDS */}
            <section>

              <div className="space-y-6">
                {filteredRooms.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center">
                    <div className="text-center max-w-md">
                      <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">No Rooms Available</h3>
                      <p className="text-gray-500 mb-6">All rooms in this hostel are currently booked. Check back soon or explore other hostels!</p>
                      <button
                        onClick={() => navigate("/hostels")}
                        style={{ borderRadius: '0.5rem' }}
                        className="px-6 py-3 bg-[#235784] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Explore Other Hostels
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredRooms.map((room) => (
                    <article
                      key={room._id}
                      className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border-none flex flex-col md:flex-row"
                      role="button"
                      tabIndex={0}
                      onClick={() => openRoomDetail(room._id)}
                      onKeyDown={(event) => handleRoomCardKeyDown(event, room._id)}
                    >
                      <div className="md:w-1/3 h-64 md:h-auto overflow-hidden relative">
                        {room.images && room.images.length > 0 ? (
                          <img src={room.images[0]} alt={room.roomType} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-surface-container" />
                        )}
                        <div className="absolute top-4 left-4">
                          <span className="bg-[#235784] text-white px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">{room.availableBeds} Beds Available</span>
                        </div>
                      </div>

                      <div className="p-8 md:w-2/3 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-2xl font-bold text-black mb-1">{room.roomType}</h3>
                              <div className="flex items-center gap-2 text-on-surface-variant">
                                <Users className="w-5 h-5" />
                                <span className="text-sm font-medium">{room.totalBeds} Beds Capacity</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold uppercase text-on-surface-variant tracking-widest mb-1">Monthly</p>
                              <p className="text-2xl font-black text-[#235784]">Rs {room.pricePerBed}</p>
                            </div>
                          </div>
                          <p className="text-on-surface-variant text-sm mb-6 leading-relaxed">{room.description || 'No description provided for this room.'}</p>
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-gray-300">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 text-gray-700 flex items-center justify-center text-[10px] font-bold">JD</div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 text-gray-700 flex items-center justify-center text-[10px] font-bold">AS</div>
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-[#235784] text-white flex items-center justify-center text-[10px] font-bold">+2</div>
                          </div>
                          <button style={{ borderRadius: '0.75rem' }} className="px-8 py-3 bg-[#235784] text-white rounded-lg font-bold hover:scale-105 transition-transform shadow-lg shadow-primary/20">Book Bed Now</button>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            {/* Main White Card */}
            <div className="bg-slate-50/50 rounded-[32px] p-8 border border-slate-100 shadow-sm">
              <h2 className="!text-2xl font-bold text-black !mb-8">Location Highlights</h2>

              {/* Features List */}
              <div className="space-y-6">
                {generateLocationHighlights(hostel || {}).map((item, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="mt-2">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-slate-800 !text-lg leading-tight">{item.title}</h3>
                      <p className="text-slate-500 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* <hr className="border-slate-200 mb-8" /> */}

              {/* Map Section */}
              {/* <div className="relative rounded-2xl overflow-hidden mb-4 h-48 bg-teal-700"> */}
              {/* Replace with an actual Map component or Static Image */}
              {/* <img
                  src="/api/placeholder/400/200"
                  alt="Location Map"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-900 rounded-full border-4 border-white/30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
              </div> */}

              {/* Button */}
              {/* <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-blue-900 font-bold rounded-xl transition-colors">
                View on Google Maps
              </button> */}
            </div>

            {/* Sustainability Banner - Show if hostel has sustainability info or high environment score */}
            {(hostel?.sustainability || hostel?.environmentScore > 70) && (
              <div className="bg-green-400 rounded-[32px] p-6 flex gap-4 items-start">
                <div className="mt-1">
                  <Leaf className="w-6 h-6 text-green-900" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Sustainability Focus</h3>
                  <p className="text-green-800/80 text-sm leading-snug">
                    {hostel?.sustainability || `${hostel?.name || "This hostel"} is committed to sustainable practices and environmental responsibility.`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HostelRooms;
