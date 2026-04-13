import { useEffect, useState } from "react";
import { getMyHostels, deleteHostel } from "../../api/hostel.api";
import {
  getRoomsByHostel,
  deleteRoom,
  getRoomSuggestedPrice,
  updateRoom,
} from "../../api/room.api";
import {
  getOwnerBookings,
  acceptBooking,
  rejectBooking,
} from "../../api/booking.api";
import { useAuth } from "../../auth/AuthContext";
import AddHostel from "./AddHostel";
import AddRoom from "./AddRoom";
import OwnerEnvironmentModal from "./OwnerEnvironmentModal";
import "./OwnerDashboard.css";
import DeleteConfirmModal from "../../components/DeleteConfirmModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [hostels, setHostels] = useState([]);
  const [hostelRooms, setHostelRooms] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [showAddHostelModal, setShowAddHostelModal] = useState(false);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState(null);
  const [expandedHostelId, setExpandedHostelId] = useState(null);
  const [activeTab, setActiveTab] = useState("hostels");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [showEnvModal, setShowEnvModal] = useState(false);
  const [envHostelId, setEnvHostelId] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'hostel'|'room', id, hostelId, name }
  const [deleteLoading, setDeleteLoading] = useState(false);

  // AI Pricing State
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingData, setPricingData] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingTargetRoom, setPricingTargetRoom] = useState(null);

  const loadHostels = async () => {
    try {
      setLoading(true);
      const res = await getMyHostels();
      setHostels(res.data || []);
    } catch (err) {
      toast.error("Failed to load hostels");
    } finally {
      setLoading(false);
    }
  };

  const loadRoomsForHostel = async (hostelId) => {
    try {
      const res = await getRoomsByHostel(hostelId);
      setHostelRooms((prev) => ({
        ...prev,
        [hostelId]: res.data || [],
      }));
    } catch (err) {
      toast.error("Failed to load rooms");
    }
  };

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const res = await getOwnerBookings();
      setBookings(res.data || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleExpandHostel = (hostelId) => {
    setExpandedHostelId((prev) => {
      const willExpand = prev !== hostelId;
      if (willExpand && !hostelRooms[hostelId]) {
        loadRoomsForHostel(hostelId);
      }
      return willExpand ? hostelId : null;
    });
  };

  const handleGetAIPricing = async (roomId, hostelId, currentPrice) => {
    setPricingTargetRoom({ id: roomId, hostelId });
    setPricingData(null);
    setShowPricingModal(true);
    setPricingLoading(true);

    try {
      const res = await getRoomSuggestedPrice(roomId);
      setPricingData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to fetch AI pricing");
      setShowPricingModal(false);
    } finally {
      setPricingLoading(false);
    }
  };

  const handleApplyAIPricing = async () => {
    if (!pricingTargetRoom || !pricingData) return;

    try {
      await updateRoom(pricingTargetRoom.id, { pricePerBed: pricingData.suggested_price });
      toast.success(`Price updated to Rs ${pricingData.suggested_price}`);
      setShowPricingModal(false);
      loadRoomsForHostel(pricingTargetRoom.hostelId); // refresh room list
    } catch (err) {
      toast.error("Failed to update price");
    }
  };

  const handleDeleteRoom = (roomId, hostelId, name) => {
    setDeleteTarget({ type: "room", id: roomId, hostelId, name: name || "room" });
    setDeleteModalVisible(true);
  };

  const handleDeleteHostel = (hostelId, name) => {
    setDeleteTarget({ type: "hostel", id: hostelId, name: name || "hostel" });
    setDeleteModalVisible(true);
  };

  const performDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "hostel") {
        await deleteHostel(deleteTarget.id);
        await loadHostels();
        toast.success(`${deleteTarget.name} deleted successfully`);
      } else if (deleteTarget.type === "room") {
        await deleteRoom(deleteTarget.id);
        await loadRoomsForHostel(deleteTarget.hostelId);
        toast.success(`${deleteTarget.name} deleted successfully`);
      }
      setDeleteModalVisible(false);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(`Failed to delete ${deleteTarget?.name || "item"}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await acceptBooking(bookingId);
      toast.success("Booking accepted successfully!");
      loadBookings();
    } catch (err) {
      toast.error("Failed to accept booking");
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to reject this booking?")) {
      try {
        await rejectBooking(bookingId);
        toast.success("Booking rejected successfully!");
        loadBookings();
      } catch (err) {
        toast.error("Failed to reject booking");
      }
    }
  };

  useEffect(() => {
    loadHostels();
    loadBookings();
  }, []);

  const getTotalRoomsCount = () => {
    return Object.values(hostelRooms).reduce(
      (sum, rooms) => sum + rooms.length,
      0,
    );
  };

  const getTotalBedsCount = () => {
    return Object.values(hostelRooms).reduce(
      (sum, rooms) =>
        sum +
        rooms.reduce((roomSum, room) => roomSum + (room.totalBeds || 0), 0),
      0,
    );
  };

  const getTotalAvailableBedsCount = () => {
    return Object.values(hostelRooms).reduce(
      (sum, rooms) =>
        sum +
        rooms.reduce((roomSum, room) => roomSum + (room.availableBeds || 0), 0),
      0,
    );
  };

  return (
    <main className="owner-dashboard">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-8">
            <h1 className="fw-bold">Welcome, {user?.name}!</h1>
            <p className="text-muted">
              Manage your hostels, rooms and bookings
            </p>
          </div>
          <div className="col-md-4 d-flex justify-content-end align-items-center">
            {activeTab === "hostels" && (
              <button
                className="btn btn-primary btn-lg"
                onClick={() => {
                  setSelectedHostelId(null);
                  setShowAddHostelModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i> Add New Hostel
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row mb-4">
          <div className="col-md-3">
            <div className="stat-card card border-0 shadow-sm">
              <div className="card-body">
                <div className="stat-icon bg-primary">
                  <i className="bi bi-building"></i>
                </div>
                <h6 className="card-title text-muted mt-3">Total Hostels</h6>
                <h3 className="fw-bold text-dark">{hostels.length}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card card border-0 shadow-sm">
              <div className="card-body">
                <div className="stat-icon bg-success">
                  <i className="bi bi-door-closed"></i>
                </div>
                <h6 className="card-title text-muted mt-3">Total Rooms</h6>
                <h3 className="fw-bold text-dark">{getTotalRoomsCount()}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card card border-0 shadow-sm">
              <div className="card-body">
                <div className="stat-icon bg-info">
                  <i className="bi bi-person-fill"></i>
                </div>
                <h6 className="card-title text-muted mt-3">Total Beds</h6>
                <h3 className="fw-bold text-dark">{getTotalBedsCount()}</h3>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="stat-card card border-0 shadow-sm">
              <div className="card-body">
                <div className="stat-icon bg-warning">
                  <i className="bi bi-check-circle"></i>
                </div>
                <h6 className="card-title text-muted mt-3">Bookings</h6>
                <h3 className="fw-bold text-dark">{bookings.length}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Analytics – only visible in bookings tab */}
        {activeTab === "bookings" && (
          <div className="row mb-4">
            {[
              { label: "Total Bookings", value: bookings.length, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, color: "#10b981", bg: "#ecfdf5" },
              { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Total Earnings", value: `Rs ${bookings.filter(b => b.status === "confirmed" || b.status === "completed").reduce((s, b) => s + (b.totalPrice || 0), 0).toLocaleString()}`, color: "#8b5cf6", bg: "#f5f3ff" },
            ].map((stat) => (
              <div className="col-md-3" key={stat.label}>
                <div className="card border-0 shadow-sm mb-3" style={{ borderLeft: `4px solid ${stat.color}` }}>
                  <div className="card-body py-3">
                    <p className="text-muted mb-1 small fw-semibold">{stat.label}</p>
                    <h4 className="fw-bold mb-0" style={{ color: stat.color }}>{stat.value}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "hostels" ? "active" : ""}`}
              onClick={() => setActiveTab("hostels")}
            >
              <i className="bi bi-building me-2"></i> Hostels & Rooms
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <i className="bi bi-calendar-check me-2"></i> Bookings
            </button>
          </li>
        </ul>

        {/* Hostels List */}
        {activeTab === "hostels" && (
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom">
              <h5 className="card-title mb-0 fw-bold">Your Hostels</h5>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : hostels.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="bi bi-inbox"
                    style={{ fontSize: "3rem", color: "#ccc" }}
                  ></i>
                  <p className="text-muted mt-3">
                    No hostels yet. Add your first hostel to get started!
                  </p>
                </div>
              ) : (
                <div className="accordion" id="hostelAccordion">
                  {hostels.map((hostel, idx) => {
                    const rooms = hostelRooms[hostel._id] || [];
                    const totalBeds = rooms.reduce(
                      (sum, r) => sum + (r.totalBeds || 0),
                      0,
                    );
                    const availableBeds = rooms.reduce(
                      (sum, r) => sum + (r.availableBeds || 0),
                      0,
                    );

                    return (
                      <div className="accordion-item" key={hostel._id}>
                        <h2 className="accordion-header">
                          <button
                            className="accordion-button"
                            type="button"
                            onClick={() => handleExpandHostel(hostel._id)}
                            aria-expanded={expandedHostelId === hostel._id}
                          >
                            <div className="w-100">
                              <div className="row align-items-center w-100">
                                <div className="col-md-3">
                                  <strong>{hostel.name}</strong>
                                  <div className="small text-muted">
                                    {hostel.city && hostel.addressLine1 ? `${hostel.addressLine1}, ${hostel.city}` : "Address not set"}
                                  </div>
                                </div>
                                <div className="col-md-2">
                                  <span className="badge bg-info">
                                    {rooms.length} rooms
                                  </span>
                                </div>
                                <div className="col-md-2">
                                  <span className="badge bg-success">
                                    {totalBeds} beds
                                  </span>
                                </div>
                                <div className="col-md-2">
                                  <span className="badge bg-warning">
                                    {availableBeds} available
                                  </span>
                                </div>
                                <div className="col-md-3 text-end">
                                  <span
                                    className={`accordion-toggle-icon me-2 ${expandedHostelId === hostel._id
                                      ? "open"
                                      : ""
                                      }`}
                                  >
                                    <i
                                      className={`bi ${expandedHostelId === hostel._id
                                        ? "bi-chevron-up"
                                        : "bi-chevron-down"
                                        }`}
                                    ></i>
                                  </span>
                                  <button
                                    className="btn btn-sm btn-outline-success me-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedHostelId(hostel._id);
                                      setShowAddRoomModal(true);
                                    }}
                                  >
                                    <i className="bi bi-plus"></i> Add Room
                                  </button>
                                  <button
                                    className="btn-delete"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteHostel(hostel._id);
                                    }}
                                    title="Delete hostel"
                                  >
                                    <i
                                      className="bi bi-trash"
                                      aria-hidden="true"
                                    ></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </button>
                        </h2>
                        <div
                          id={`collapse-${hostel._id}`}
                          className="accordion-collapse collapse"
                          data-bs-parent="#hostelAccordion"
                          style={{
                            display:
                              expandedHostelId === hostel._id
                                ? "block"
                                : "none",
                          }}
                        >
                          <div className="accordion-body">
                            {/* Hostel Info */}
                            <div className="mb-4">
                              <h6 className="fw-bold mb-2">Hostel Details</h6>
                              {hostel.description && (
                                <p className="text-muted mb-2">
                                  <strong>Description:</strong>{" "}
                                  {hostel.description}
                                </p>
                              )}
                              {hostel.amenities &&
                                hostel.amenities.length > 0 && (
                                  <p className="mb-2">
                                    <strong>Amenities:</strong>
                                    <div>
                                      {hostel.amenities.map((amenity, i) => (
                                        <span
                                          key={i}
                                          className="badge bg-light text-dark me-1 mb-1"
                                        >
                                          {amenity}
                                        </span>
                                      ))}
                                    </div>
                                  </p>
                                )}
                              {hostel.rules && (
                                <p className="text-muted">
                                  <strong>Rules:</strong> {hostel.rules}
                                </p>
                              )}
                            </div>

                            <hr />

                            {/* Rooms Section */}
                            <h6 className="fw-bold mb-3">Rooms</h6>
                            {rooms.length === 0 ? (
                              <p className="text-muted text-center py-3">
                                No rooms yet. Click "Add Room" to create one.
                              </p>
                            ) : (
                              <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                  <thead className="table-light">
                                    <tr>
                                      <th>Type</th>
                                      <th>Total Beds</th>
                                      <th>Available Beds</th>
                                      <th>Price/Bed (Rs)</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rooms.map((room) => (
                                      <tr key={room._id}>
                                        <td>
                                          <strong>{room.roomType}</strong>
                                        </td>
                                        <td>{room.totalBeds}</td>
                                        <td>
                                          <span
                                            className={`badge ${room.availableBeds > 0
                                              ? "bg-success"
                                              : "bg-danger"
                                              }`}
                                          >
                                            {room.availableBeds}
                                          </span>
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center">
                                            <span>Rs {room.pricePerBed}</span>
                                            <button
                                              className="btn btn-sm ms-2 text-white shadow-sm fw-bold px-3 py-1"
                                              style={{
                                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                                border: 'none',
                                                borderRadius: '20px',
                                                transition: 'all 0.2s ease-in-out'
                                              }}
                                              onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(168, 85, 247, 0.4)'; }}
                                              onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                              onClick={() => handleGetAIPricing(room._id, hostel._id, room.pricePerBed)}
                                              title="Optimize with AI"
                                            >
                                              <i className="bi bi-magic me-1"></i> AI Price
                                            </button>
                                          </div>
                                        </td>
                                        <td>
                                          <button
                                            className="btn-delete"
                                            onClick={() =>
                                              handleDeleteRoom(
                                                room._id,
                                                hostel._id,
                                              )
                                            }
                                            title="Delete room"
                                          >
                                            <i
                                              className="bi bi-trash"
                                              aria-hidden="true"
                                            ></i>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings List */}
        {activeTab === "bookings" && (
          <div>
            {/* Filter Tabs */}
            <div className="d-flex gap-2 mb-4 flex-wrap">
              {[
                { key: "all", label: "All", count: bookings.length },
                { key: "pending", label: "Pending", count: bookings.filter(b => b.status === "pending").length },
                { key: "confirmed", label: "Confirmed", count: bookings.filter(b => b.status === "confirmed").length },
                { key: "cancelled", label: "Cancelled", count: bookings.filter(b => b.status === "cancelled").length },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setBookingFilter(f.key)}
                  className={`btn btn-sm rounded-pill px-3 py-2 fw-semibold ${
                    bookingFilter === f.key
                      ? "btn-primary"
                      : "btn-outline-secondary"
                  }`}
                >
                  {f.label} <span className="badge bg-light text-dark ms-1">{f.count}</span>
                </button>
              ))}
            </div>

            {bookingsLoading ? (
              <div className="text-center py-5">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                <i className="bi bi-inbox" style={{ fontSize: "3rem", color: "#ccc" }}></i>
                <p className="text-muted mt-3">No bookings yet</p>
              </div>
            ) : (
              <div className="row g-3">
                {bookings
                  .filter(b => bookingFilter === "all" || b.status === bookingFilter)
                  .map((booking) => (
                  <div className="col-md-6 col-lg-4" key={booking._id}>
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                      {/* Card header with status */}
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div>
                            <h6 className="fw-bold mb-1 text-dark">{booking.userId?.name || "Guest"}</h6>
                            <small className="text-muted">{booking.userId?.email || ""}</small>
                          </div>
                          <span className={`badge rounded-pill px-3 py-2 ${
                            booking.status === "confirmed" ? "bg-success" :
                            booking.status === "pending" ? "bg-warning text-dark" :
                            "bg-danger"
                          }`}>
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                          </span>
                        </div>

                        <div className="p-3 rounded-3 mb-3" style={{ backgroundColor: '#f8fafc' }}>
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <i className="bi bi-building text-primary"></i>
                            <strong className="text-dark small">{booking.hostelId?.name || "—"}</strong>
                          </div>
                          <div className="row g-2">
                            <div className="col-6">
                              <small className="text-muted d-block">Room</small>
                              <small className="fw-semibold">{booking.roomId?.roomType || "—"}</small>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block">Beds</small>
                              <small className="fw-semibold">{booking.bedsBooked}</small>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block">Check-in</small>
                              <small className="fw-semibold">{new Date(booking.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                            </div>
                            <div className="col-6">
                              <small className="text-muted d-block">Check-out</small>
                              <small className="fw-semibold">{new Date(booking.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <span className="text-muted small">Total Price</span>
                          <span className="fw-bold text-primary fs-5">Rs {booking.totalPrice?.toLocaleString()}</span>
                        </div>

                        {/* Action buttons */}
                        {booking.status !== "cancelled" && (
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm flex-fill fw-semibold"
                              style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '10px' }}
                              onClick={() => handleAcceptBooking(booking._id)}
                              disabled={booking.status === "confirmed"}
                            >
                              <i className="bi bi-check-lg me-1"></i>
                              {booking.status === "confirmed" ? "Accepted" : "Accept"}
                            </button>
                            <button
                              className="btn btn-sm flex-fill fw-semibold"
                              style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '10px' }}
                              onClick={() => handleRejectBooking(booking._id)}
                            >
                              <i className="bi bi-x-lg me-1"></i> Reject
                            </button>
                          </div>
                        )}
                        {booking.status === "cancelled" && (
                          <div className="text-center py-2">
                            <small className="text-muted fst-italic">This booking was cancelled</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {bookings.filter(b => bookingFilter === "all" || b.status === bookingFilter).length === 0 && (
                  <div className="col-12 text-center py-5">
                    <p className="text-muted">No {bookingFilter} bookings found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Hostel Modal */}
      <div
        className={`modal fade ${showAddHostelModal ? "show" : ""}`}
        id="addHostelModal"
        tabIndex="-1"
        style={{ display: showAddHostelModal ? "block" : "none" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">Add New Hostel</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddHostelModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <AddHostel
                onSuccess={(createdHostel) => {
                  setShowAddHostelModal(false);
                  const hostelId = createdHostel?._id || createdHostel?.id;
                  if (hostelId) {
                    setEnvHostelId(hostelId);
                    setShowEnvModal(true);
                  }
                  loadHostels();
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Room Modal */}
      <div
        className={`modal fade ${showAddRoomModal ? "show" : ""}`}
        id="addRoomModal"
        tabIndex="-1"
        style={{ display: showAddRoomModal ? "block" : "none" }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fw-bold">Add New Room</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowAddRoomModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              {selectedHostelId && (
                <AddRoom
                  hostelId={selectedHostelId}
                  onSuccess={() => {
                    setShowAddRoomModal(false);
                    loadRoomsForHostel(selectedHostelId);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddHostelModal && <div className="modal-backdrop fade show"></div>}
      {showAddRoomModal && <div className="modal-backdrop fade show"></div>}
      {showEnvModal && envHostelId && (
        <OwnerEnvironmentModal
          hostelId={envHostelId}
          onClose={(saved) => {
            setShowEnvModal(false);
            setEnvHostelId(null);
            if (saved) loadHostels();
          }}
        />
      )}

      {/* AI Pricing Modal */}
      <div className={`modal fade ${showPricingModal ? "show" : ""}`} style={{ display: showPricingModal ? "block" : "none", backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(3px)' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div className="modal-header text-white border-bottom-0 px-4 py-3" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)' }}>
              <h5 className="modal-title fw-bold d-flex align-items-center">
                <i className="bi bi-stars me-2 fs-4 text-warning"></i> IntelliStay AI Optimizer
              </h5>
              <button type="button" className="btn-close btn-close-white opacity-75" onClick={() => setShowPricingModal(false)}></button>
            </div>
            <div className="modal-body p-4">
              {pricingLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-purple" style={{ color: '#9333ea', width: '3rem', height: '3rem' }} role="status">
                    <span className="visually-hidden">Calculating...</span>
                  </div>
                  <h5 className="mt-4 fw-bold text-dark">Analyzing market data...</h5>
                  <p className="text-muted mb-0 small">Evaluating amenities, city tier, and seasonal trends</p>
                </div>
              ) : pricingData ? (
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <span className="text-muted fw-semibold">Current Base Price</span>
                    <strong className="text-dark fs-5">Rs {pricingData.base_price}/month</strong>
                  </div>

                  <div className="p-4 rounded-4 text-center mb-4 position-relative" style={{ background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0' }}>
                    <div className="text-purple fw-bold mb-2 text-uppercase tracking-wider small" style={{ color: '#7c3aed', letterSpacing: '1px' }}>Optimal Target Price</div>
                    <div className="display-4 fw-bolder mb-3" style={{ color: '#0f172a' }}>
                      Rs {pricingData.suggested_price}
                    </div>

                    <span
                      className="badge rounded-pill px-3 py-2 fs-6 shadow-sm"
                      style={{
                        backgroundColor: pricingData.price_change_percent > 0 ? '#dcfce7' : pricingData.price_change_percent < 0 ? '#fee2e2' : '#f1f5f9',
                        color: pricingData.price_change_percent > 0 ? '#166534' : pricingData.price_change_percent < 0 ? '#991b1b' : '#334155',
                        border: `1px solid ${pricingData.price_change_percent > 0 ? '#bbf7d0' : pricingData.price_change_percent < 0 ? '#fecaca' : '#e2e8f0'}`
                      }}
                    >
                      <i className={`bi ${pricingData.price_change_percent > 0 ? 'bi-graph-up-arrow' : pricingData.price_change_percent < 0 ? 'bi-graph-down-arrow' : 'bi-dash'} me-2`}></i>
                      {pricingData.price_change_percent > 0 ? '+' : ''}{pricingData.price_change_percent}% adjustment
                    </span>
                  </div>

                  <div className="p-3 rounded-4 d-flex align-items-start" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <div className="rounded-circle p-2 bg-white shadow-sm me-3 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                      <i className="bi bi-lightning-charge-fill text-success fs-5"></i>
                    </div>
                    <div>
                      <strong className="text-success d-block mb-1">AI Reasoning</strong>
                      <p className="mb-0 text-success text-opacity-75 small fw-medium">{pricingData.reasoning}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-danger py-4">
                  <i className="bi bi-exclamation-triangle-fill display-4 text-danger opacity-50 mb-3"></i>
                  <h5 className="fw-bold">Analysis Failed</h5>
                  <p className="text-muted mb-0">Our AI couldn't calculate a price for this room right now.</p>
                </div>
              )}
            </div>
            {pricingData && !pricingLoading && (
              <div className="modal-footer border-top-0 px-4 pb-4 pt-2">
                <button type="button" className="btn btn-light fw-bold text-muted px-4" onClick={() => setShowPricingModal(false)} style={{ borderRadius: '8px' }}>Dismiss</button>
                <button
                  type="button"
                  className="btn btn-primary px-4 fw-bold shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)', border: 'none', borderRadius: '8px' }}
                  onClick={handleApplyAIPricing}
                >
                  Apply Optimal Price
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeleteTarget(null);
        }}
        onConfirm={performDelete}
        itemName={deleteTarget?.name}
        confirmLoading={deleteLoading}
      />

      <ToastContainer position="top-right" />
    </main>
  );
};

export default OwnerDashboard;
