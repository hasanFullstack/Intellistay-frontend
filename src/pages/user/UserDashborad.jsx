import { useEffect, useState } from "react";
import { getUserBookings, cancelBooking } from "../../api/booking.api";
import { useAuth } from "../../auth/AuthContext";
import { toast } from "react-toastify";
import RecommendedHostels from "./RecommendedHostels";
import {
  Calendar,
  MapPin,
  Bed,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  X,
  Bell,
} from "lucide-react";

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bookings");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const res = await getUserBookings(user._id);
      setBookings(res.data || []);
    } catch (err) {
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setCancelLoading(true);
      await cancelBooking(bookingId);
      toast.success("Booking cancelled successfully!");
      setCancelModalId(null);
      await loadBookings();
    } catch (err) {
      toast.error("Failed to cancel booking");
    } finally {
      setCancelLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadBookings();
    }
  }, [user]);

  const formatDate = (date) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getActiveBookings = () =>
    bookings.filter(
      (b) => b.status === "confirmed" || b.status === "pending"
    );
  const getHistoryBookings = () =>
    bookings.filter(
      (b) => b.status === "cancelled" || b.status === "completed"
    );

  const statusConfig = {
    confirmed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      icon: <CheckCircle2 size={14} />,
      label: "Confirmed",
    },
    pending: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      icon: <Clock size={14} />,
      label: "Pending",
    },
    cancelled: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      icon: <XCircle size={14} />,
      label: "Cancelled",
    },
    completed: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-200",
      icon: <CheckCircle2 size={14} />,
      label: "Completed",
    },
  };

  const getStatusBadge = (status) => {
    const cfg = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border ${cfg.border}`}
      >
        {cfg.icon}
        {cfg.label}
      </span>
    );
  };

  // Stats
  const confirmedCount = bookings.filter(
    (b) => b.status === "confirmed"
  ).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const cancelledCount = bookings.filter(
    (b) => b.status === "cancelled"
  ).length;
  const totalSpent = bookings
    .filter((b) => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  return (
    <div className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">

      {/* Main */}
      <div className="flex-grow pt-24 pb-16 px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Sidebar */}
          <section className="lg:col-span-3 space-y-6">

            {/* Profile Card */}
            <div className="bg-white rounded-xl p-8 shadow">
              <div className="flex flex-col items-center text-center">
                <img
                  src={user?.avatar || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRuZSe6bTFXTqCZAoTuOwjXK6Z_R4w-fUP4lQ&s"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover mb-4"
                />

                <h1 className="text-xl font-bold text-gray-900">{user?.name || "User"}</h1>
                <p className="text-gray-500 text-sm">{user?.universityName || "Student"}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-6 rounded-xl">
                <p className="text-2xl font-bold text-[#2b5a84]">{getActiveBookings().length}</p>
                <p className="text-xs text-gray-600 mt-1">Active</p>
              </div>

              <div className="bg-yellow-100 p-6 rounded-xl">
                <p className="text-2xl font-bold text-amber-700">
                  ₹{totalSpent.toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">Total Spent</p>
              </div>

              <div className="bg-emerald-100 p-6 rounded-xl">
                <p className="text-2xl font-bold text-emerald-700">{confirmedCount}</p>
                <p className="text-xs text-gray-600 mt-1">Confirmed</p>
              </div>

              <div className="bg-orange-100 p-6 rounded-xl">
                <p className="text-2xl font-bold text-orange-700">{pendingCount}</p>
                <p className="text-xs text-gray-600 mt-1">Pending</p>
              </div>
            </div>

          </section>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-8">

            {/* Tab Navigation */}
            <div className="flex gap-2 bg-white p-1 rounded-xl w-fit shadow-sm">
              {[
                { key: "bookings", label: "My Bookings", emoji: "📚" },
                { key: "recommendations", label: "Recommended", emoji: "🏠" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{ borderRadius: "0.5rem" }}
                  className={`px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab.key
                      ? "bg-[#2b5a84] text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.emoji} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "recommendations" && <RecommendedHostels />}
            {activeTab === "similar" && <SimilarStudents />}

            {activeTab === "bookings" && (
              <div>
                {loading ? (
                  <div className="flex items-center justify-center py-20 bg-white rounded-xl">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#2b5a84] border-t-transparent mx-auto mb-3"></div>
                      <p className="text-gray-500 text-sm">
                        Loading your bookings...
                      </p>
                    </div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                    <div className="text-5xl mb-4">📭</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Bookings Yet
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      You haven't booked any hostels yet. Start exploring and find
                      the perfect stay!
                    </p>
                    <a
                      href="/hostels"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#2b5a84] text-white rounded-xl font-semibold hover:bg-[#1D4E89] transition"
                    >
                      Browse Hostels →
                    </a>
                  </div>
                ) : (
                  <>
                    {/* Active Bookings */}
                    {getActiveBookings().length > 0 && (
                      <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          Active Bookings
                        </h2>
                        <div className="space-y-4">
                          {getActiveBookings().map((booking) => (
                            <div key={booking._id} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition">
                              <div className="flex gap-6">
                                <img
                                  src={
                                    booking.hostelId?.images?.[0] ||
                                    "https://via.placeholder.com/150"
                                  }
                                  alt="Hostel"
                                  className="w-32 h-32 object-cover rounded-lg"
                                />

                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h3 className="font-bold text-lg text-gray-900">
                                        {booking.hostelId?.name || "Unknown Hostel"}
                                      </h3>
                                      {booking.hostelId?.city && booking.hostelId?.addressLine1 && (
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                          <MapPin size={13} />
                                          {booking.hostelId.addressLine1}, {booking.hostelId.city}
                                        </p>
                                      )}
                                    </div>
                                    {getStatusBadge(booking.status)}
                                  </div>

                                  <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Check-in
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {formatDate(booking.startDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Check-out
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {formatDate(booking.endDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Price/Night
                                      </p>
                                      <p className="font-bold text-[#2b5a84]">
                                        ₹{booking.roomId?.pricePerBed?.toLocaleString() || "—"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setSelectedBooking(booking)}
                                      className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold border border-[#2b5a84] text-[#2b5a84] hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
                                    >
                                      <Eye size={14} />
                                      View Details
                                    </button>
                                    {booking.status !== "cancelled" && (
                                      <button
                                        onClick={() => setCancelModalId(booking._id)}
                                        className="py-2 px-4 rounded-lg text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Booking History */}
                    {getHistoryBookings().length > 0 && (
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          Booking History
                        </h2>
                        <div className="space-y-4">
                          {getHistoryBookings().map((booking) => (
                            <div key={booking._id} className="bg-white p-6 rounded-xl shadow hover:shadow-md transition opacity-75">
                              <div className="flex gap-6">
                                <img
                                  src={
                                    booking.hostelId?.images?.[0] ||
                                    "https://via.placeholder.com/150"
                                  }
                                  alt="Hostel"
                                  className="w-32 h-32 object-cover rounded-lg"
                                />

                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-3">
                                    <div>
                                      <h3 className="font-bold text-lg text-gray-900">
                                        {booking.hostelId?.name || "Unknown Hostel"}
                                      </h3>
                                      {booking.hostelId?.city && booking.hostelId?.addressLine1 && (
                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                          <MapPin size={13} />
                                          {booking.hostelId.addressLine1}, {booking.hostelId.city}
                                        </p>
                                      )}
                                    </div>
                                    {getStatusBadge(booking.status)}
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Check-in
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {formatDate(booking.startDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Check-out
                                      </p>
                                      <p className="font-bold text-gray-900">
                                        {formatDate(booking.endDate)}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-500 font-semibold mb-1">
                                        Total
                                      </p>
                                      <p className="font-bold text-[#2b5a84]">
                                        ₹{booking.totalPrice?.toLocaleString() || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-[#2b5a84] to-[#1D4E89] px-6 py-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Booking Details</h3>
                <p className="text-blue-100 text-sm mt-0.5">
                  ID: {selectedBooking._id?.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                    Hostel
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedBooking.hostelId?.name || "—"}
                  </p>
                  {selectedBooking.hostelId?.city && selectedBooking.hostelId?.addressLine1 && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin size={12} />
                      {selectedBooking.hostelId.addressLine1}, {selectedBooking.hostelId.city}
                    </p>
                  )}
                </div>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Check-in
                  </p>
                  <p className="font-bold text-gray-900">
                    {formatDate(selectedBooking.startDate)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Check-out
                  </p>
                  <p className="font-bold text-gray-900">
                    {formatDate(selectedBooking.endDate)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Room Type
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.roomId?.roomType || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Gender
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.hostelId?.gender || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Beds Booked
                  </p>
                  <p className="font-bold text-gray-900">
                    {selectedBooking.bedsBooked}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1 font-semibold">
                    Price/Bed
                  </p>
                  <p className="font-bold text-gray-900">
                    ₹{selectedBooking.roomId?.pricePerBed?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl flex justify-between items-center">
                <span className="font-bold text-gray-700">Total Amount</span>
                <span className="text-2xl font-bold text-[#2b5a84]">
                  ₹{selectedBooking.totalPrice?.toLocaleString() || "—"}
                </span>
              </div>

              <p className="text-xs text-gray-400 text-center">
                Booked on {formatDate(selectedBooking.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Cancel Booking?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              This action cannot be undone. Your bed reservation will be
              released.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalId(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
              >
                Keep Booking
              </button>
              <button
                onClick={() => handleCancelBooking(cancelModalId)}
                disabled={cancelLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Cancelling...
                  </>
                ) : (
                  "Yes, Cancel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
