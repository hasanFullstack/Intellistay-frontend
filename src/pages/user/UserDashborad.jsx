import { useEffect, useState } from "react";
import { getUserBookings, cancelBooking } from "../../api/booking.api";
import { useAuth } from "../../auth/AuthContext";
import { toast } from "react-toastify";
import RecommendedHostels from "./RecommendedHostels";
import SimilarStudents from "./SimilarStudents";
import {
  Calendar,
  MapPin,
  Bed,
  IndianRupee,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  BookOpen,
  Eye,
  X,
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

  const stats = [
    {
      label: "Active",
      value: getActiveBookings().length,
      icon: <BookOpen size={20} />,
      gradient: "from-blue-500 to-indigo-600",
    },
    {
      label: "Confirmed",
      value: confirmedCount,
      icon: <CheckCircle2 size={20} />,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      label: "Pending",
      value: pendingCount,
      icon: <Clock size={20} />,
      gradient: "from-amber-500 to-orange-600",
    },
    {
      label: "Total Spent",
      value: `₹${totalSpent.toLocaleString()}`,
      icon: <IndianRupee size={20} />,
      gradient: "from-violet-500 to-purple-600",
    },
  ];

  const BookingCard = ({ booking, showCancel = false }) => (
    <div className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-5">
        {/* Top row: hostel name + status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">
              {booking.hostelId?.name || "Unknown Hostel"}
            </h3>
            {booking.hostelId?.city && booking.hostelId?.addressLine1 && (
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">{booking.hostelId.addressLine1}, {booking.hostelId.city}</span>
              </p>
            )}
          </div>
          {getStatusBadge(booking.status)}
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
              <Calendar size={12} /> Check-in
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {formatDate(booking.startDate)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
              <Calendar size={12} /> Check-out
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {formatDate(booking.endDate)}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
              <Bed size={12} /> Room
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {booking.roomId?.roomType || "—"} × {booking.bedsBooked} bed
              {booking.bedsBooked > 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-0.5 flex items-center gap-1">
              <IndianRupee size={12} /> Total
            </p>
            <p className="text-sm font-bold text-blue-600">
              ₹{booking.totalPrice?.toLocaleString() || "—"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedBooking(booking)}
            className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition flex items-center justify-center gap-1.5"
          >
            <Eye size={14} />
            View Details
          </button>
          {showCancel && booking.status !== "cancelled" && (
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
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Manage your hostel bookings and explore recommendations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm`}
                >
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { key: "bookings", label: "My Bookings", emoji: "📚" },
            { key: "recommendations", label: "Recommended", emoji: "🏠" },
            { key: "similar", label: "Similar Students", emoji: "👥" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
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
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-gray-500 text-sm">
                    Loading your bookings...
                  </p>
                </div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getActiveBookings().map((booking) => (
                        <BookingCard
                          key={booking._id}
                          booking={booking}
                          showCancel
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* History */}
                {getHistoryBookings().length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      Booking History
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getHistoryBookings().map((booking) => (
                        <BookingCard key={booking._id} booking={booking} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex justify-between items-center">
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
                <span className="text-2xl font-bold text-blue-600">
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
