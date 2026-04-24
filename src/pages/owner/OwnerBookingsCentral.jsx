import React, { useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  DoorOpen,
  Bed,
  MoreVertical,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { acceptBooking, rejectBooking } from "../../api/booking.api";
import { toast } from "react-toastify";
import { getErrorMessage } from "../../utils/getErrorMessage";

const isValidDate = (d) => d instanceof Date && !Number.isNaN(d.getTime());

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return isValidDate(d) ? d : null;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const normalizeNights = (booking) => {
  const raw =
    booking?.nights ??
    booking?.numberOfNights ??
    booking?.stayNights ??
    1;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
};

const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const getInitials = (name) => {
  if (!name) return "GU";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "G") + (parts[1]?.[0] || "U");
};

const formatDate = (value) => {
  const d = parseDate(value);
  if (!d) return "-";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const fmtCurrency = (n) => `Rs ${Number(n || 0).toLocaleString()}`;

const getBookingPeriod = (booking) => {
  let start =
    booking?.startDate ||
    booking?.checkInDate ||
    booking?.checkIn ||
    booking?.fromDate ||
    booking?.arrivalDate ||
    booking?.createdAt ||
    null;

  let end =
    booking?.endDate ||
    booking?.checkOutDate ||
    booking?.checkOut ||
    booking?.toDate ||
    booking?.departureDate ||
    null;

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  const nights = normalizeNights(booking);

  if (startDate && endDate) return { start: startDate, end: endDate };
  if (startDate && !endDate) return { start: startDate, end: addDays(startDate, nights) };
  if (!startDate && endDate) return { start: addDays(endDate, -nights), end: endDate };

  return { start: null, end: null };
};

const getTabForBooking = (booking) => {
  const status = String(booking?.status || "").toLowerCase();
  if (["rejected", "cancelled", "completed"].includes(status)) return "Past";

  const { start, end } = getBookingPeriod(booking);
  const nowStart = startOfDay(new Date());

  if (start && end) {
    if (end < nowStart) return "Past";
    if (start <= endOfDay(new Date()) && end >= nowStart) return "Active";
    return "Upcoming";
  }

  if (status === "pending") return "Upcoming";
  if (status === "confirmed") return "Active";
  return "Upcoming";
};

const getStatusStyles = (status) => {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "bg-green-100 text-green-700";
  if (s === "pending") return "bg-yellow-100 text-yellow-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  if (s === "cancelled") return "bg-slate-200 text-slate-700";
  if (s === "completed") return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
};

const getPaymentLabel = (booking) => {
  if (booking?.paymentStatus) return String(booking.paymentStatus).toUpperCase();
  if (booking?.isPaid === true) return "PAID";
  if (booking?.isPaid === false) return "AT CHECK-IN";
  return "-";
};

const avatarPalette = [
  ["bg-[#d8e2ff]", "text-[#0058be]"],
  ["bg-[#e9ddff]", "text-[#6b38d4]"],
  ["bg-[#dff5e8]", "text-emerald-700"],
  ["bg-[#ffe8d6]", "text-orange-700"],
];

export default function OwnerBookingsCentral({ bookings = [], loading = false, onRefresh }) {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("Upcoming");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [openMenuId, setOpenMenuId] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const mapped = useMemo(() => {
    return bookings.map((b, idx) => {
      const guestName = b?.userId?.name || b?.guestName || "Guest";
      const bookingId = b?.bookingNumber || b?._id || `BK-${idx + 1}`;
      const { start, end } = getBookingPeriod(b);

      const nights =
        start && end
          ? Math.max(1, Math.round((endOfDay(end).getTime() - startOfDay(start).getTime()) / (1000 * 60 * 60 * 24)))
          : b?.nights || 1;

      const roomName =
        b?.roomId?.roomLabel
          ? `${b?.roomId?.roomType || "Room"} - ${b.roomId.roomLabel}`
          : b?.roomId?.roomType || "Room";

      const pricePerBed = Number(b?.roomId?.pricePerBed || 0);
      const totalPrice = Number(b?.totalPrice || 0);

      return {
        raw: b,
        actionKey: String(b?._id || bookingId || idx),
        id: String(bookingId),
        email: b?.userId?.email || b?.guestEmail || "-",
        guest: guestName,
        initials: getInitials(guestName),
        palette: avatarPalette[idx % avatarPalette.length],
        hostel: b?.hostelId?.name || "-",
        hostelId: b?.hostelId?._id || b?.hostelId,
        room: roomName,
        roomId: b?.roomId?._id || b?.roomId,
        stay: start ? formatDate(start) : "-",
        nights: `${nights} Night${nights > 1 ? "s" : ""}`,
        status: b?.status || "pending",
        pricePerBed,
        amount: totalPrice > 0 ? totalPrice : pricePerBed,
        paymentStatus: getPaymentLabel(b),
        viewTab: getTabForBooking(b),
      };
    });
  }, [bookings]);

  const todayCheckins = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return mapped.filter((m) => {
      const { start } = getBookingPeriod(m.raw);
      if (!start) return false;
      const status = String(m.status).toLowerCase();
      return start >= todayStart && start <= todayEnd && ["confirmed", "pending"].includes(status);
    }).length;
  }, [mapped]);

  const activeGuests = useMemo(() => {
    const nowStart = startOfDay(new Date());
    const nowEnd = endOfDay(new Date());

    return mapped.filter((m) => {
      const { start, end } = getBookingPeriod(m.raw);
      if (!(start && end)) return false;
      const status = String(m.status).toLowerCase();
      return start <= nowEnd && end >= nowStart && ["confirmed", "pending"].includes(status);
    }).length;
  }, [mapped]);

  const visibleBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return mapped.filter((b) => {
      if (activeView !== b.viewTab) return false;
      if (statusFilter !== "all" && String(b.status).toLowerCase() !== statusFilter) return false;
      if (!q) return true;

      return (
        b.guest.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.hostel.toLowerCase().includes(q) ||
        b.room.toLowerCase().includes(q)
      );
    });
  }, [mapped, activeView, statusFilter, searchTerm]);

  const exportCsv = () => {
    const rows = visibleBookings.map((b) => [
      b.id,
      b.guest,
      b.hostel,
      b.room,
      b.stay,
      b.nights,
      b.status,
      b.amount,
      b.paymentStatus,
    ]);

    const csv = [
      ["Booking ID", "Guest", "Hostel", "Room", "Stay", "Nights", "Status", "Amount", "Payment"],
      ...rows,
    ]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `owner-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bookings exported");
  };

  const handleAccept = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      await acceptBooking(bookingId);
      toast.success("Booking accepted");
      setOpenMenuId(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to accept booking"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (bookingId) => {
    try {
      setProcessingId(bookingId);
      await rejectBooking(bookingId);
      toast.success("Booking rejected");
      setOpenMenuId(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to reject booking"));
    } finally {
      setProcessingId(null);
    }
  };

  const openRoom = (booking) => {
    if (!booking.roomId || !booking.hostelId) {
      toast.info("Room details unavailable for this booking");
      return;
    }
    navigate(`/room/${booking.roomId}/${booking.hostelId}`);
  };

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-[#faf8ff] min-h-screen font-sans text-[#131b2e]">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold tracking-tight font-headline">Bookings Central</h1>
          <p className="text-[#424754] font-medium">Manage and monitor guest arrivals and departures.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-6 py-4 bg-[#f2f3ff] rounded-2xl text-center min-w-[140px]">
            <p className="text-xs font-bold text-[#424754] uppercase tracking-wider mb-1">Today's Check-ins</p>
            <p className="text-2xl font-black text-[#0058be]">{todayCheckins}</p>
          </div>
          <div className="px-6 py-4 bg-[#f2f3ff] rounded-2xl text-center min-w-[140px]">
            <p className="text-xs font-bold text-[#424754] uppercase tracking-wider mb-1">Active Guests</p>
            <p className="text-2xl font-black text-[#6b38d4]">{activeGuests}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-[#eaedff] overflow-hidden p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex p-1 bg-[#f2f3ff] rounded-2xl w-fit">
            {["Upcoming", "Active", "Past"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveView(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === tab ? "bg-white text-[#0058be] !rounded-xl shadow-sm" : "text-[#424754] hover:text-[#131b2e]"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex flex-1 max-w-2xl gap-3">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#727785] group-focus-within:text-[#0058be] transition-colors" size={18} />
              <input
                className="w-full pl-12 pr-4 py-3 bg-[#f2f3ff] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#0058be]/20 transition-all outline-none"
                placeholder="Search by Guest Name or Booking ID..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="px-4 py-3 bg-[#e2e7ff] text-[#131b2e] rounded-2xl flex items-center space-x-2 hover:bg-[#dae2fd] transition-colors"
              >
                <Filter size={18} />
                <span className="text-sm font-semibold">Filters</span>
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-[#eaedff] rounded-xl shadow-lg p-2 z-20">
                  {["all", "pending", "confirmed", "rejected", "cancelled", "completed"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setStatusFilter(s);
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${statusFilter === s ? "bg-[#e2e7ff] text-[#0058be] font-bold" : "hover:bg-[#f2f3ff]"}`}
                    >
                      {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="p-3 bg-[#e2e7ff] text-[#131b2e] rounded-2xl hover:bg-[#dae2fd] transition-colors"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[#424754]">
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest">Guest & ID</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest">Hostel & Room</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest">Check-in Date</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-center">Status</th>
                <th className="pb-4 px-4 text-[10px] font-bold uppercase tracking-widest text-right">Room Price / Bed</th>
                <th className="pb-4 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaedff]">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-[#424754]">Loading bookings...</td>
                </tr>
              )}

              {!loading && visibleBookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-[#f2f3ff]/50 transition-colors">
                  <td className="py-6 px-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${booking.palette[0]} flex items-center justify-center ${booking.palette[1]} font-bold`}>
                        {booking.initials}
                      </div>
                      <div>
                        <p className="font-bold text-[#131b2e]">{booking.guest}</p>
                        <p className="text-xs text-[#424754] font-mono">{booking.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-6 px-4">
                    <p className="font-semibold text-[#131b2e] text-sm">{booking.hostel}</p>
                    <p className="text-xs text-[#424754] flex items-center space-x-1 mt-1">
                      {booking.room.toLowerCase().includes("private") ? <Bed size={14} /> : <DoorOpen size={14} />}
                      <span>{booking.room}</span>
                    </p>
                  </td>
                  <td className="py-6 px-4">
                    <div className="text-sm font-medium text-[#131b2e]">{booking.stay}</div>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase ${getStatusStyles(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-right">
                    <p className="font-bold text-[#131b2e]">{fmtCurrency(booking.pricePerBed > 0 ? booking.pricePerBed : booking.amount)}</p>
                    {booking.amount > 0 && booking.pricePerBed > 0 && booking.amount !== booking.pricePerBed && (
                      <p className="text-[10px] text-[#424754]">Total: {fmtCurrency(booking.amount)}</p>
                    )}
                    <p className="text-[10px] text-[#424754] font-bold uppercase">{booking.paymentStatus}</p>
                  </td>
                  <td className="py-6 px-4 text-right relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenuId((prev) => (prev === booking.actionKey ? null : booking.actionKey))}
                      className="p-2 hover:bg-[#dae2fd] rounded-xl transition-colors text-[#727785]"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openMenuId === booking.actionKey && (
                      <div className="absolute right-4 top-14 bg-white rounded-xl border border-[#eaedff] shadow-lg min-w-[170px] z-20 p-2">
                        {String(booking.status).toLowerCase() === "pending" && booking.raw?._id && (
                          <>
                            <button
                              type="button"
                              disabled={processingId === booking.raw._id}
                              onClick={() => handleAccept(booking.raw._id)}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f2f3ff] flex items-center gap-2"
                            >
                              <Check size={14} className="text-green-600" />
                              Accept Booking
                            </button>
                            <button
                              type="button"
                              disabled={processingId === booking.raw._id}
                              onClick={() => handleReject(booking.raw._id)}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f2f3ff] flex items-center gap-2"
                            >
                              <X size={14} className="text-red-600" />
                              Reject Booking
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => openRoom(booking)}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[#f2f3ff] flex items-center gap-2"
                        >
                          <ExternalLink size={14} className="text-[#0058be]" />
                          Open Room
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && visibleBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-[#424754]">No bookings found for current view.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
