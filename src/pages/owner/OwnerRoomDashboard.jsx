import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoomSuggestedPrice } from "../../api/room.api";
import AddRoom from "./AddRoom";
import { toast } from "react-toastify";

const PAGE_SIZE = 8;

const statusClass = {
  Available: "text-emerald-600",
  Booked: "text-[#0058be]",
  Maintenance: "text-red-600",
};

const statusDotClass = {
  Available: "bg-emerald-600",
  Booked: "bg-[#0058be]",
  Maintenance: "bg-red-600",
};

const inferRoomStatus = (room) => {
  if (room?.status) {
    const normalized = String(room.status).toLowerCase();
    if (normalized.includes("maint")) return "Maintenance";
    if (normalized.includes("book") || normalized.includes("full")) return "Booked";
    if (normalized.includes("avail")) return "Available";
  }

  if (room?.isUnderMaintenance || room?.maintenanceRequired) return "Maintenance";
  if (Number(room?.availableBeds) === 0) return "Booked";
  return "Available";
};

const parseSuggestedPrice = (response, fallback) => {
  const data = response?.data;
  const val =
    data?.suggestedPrice ??
    data?.price ??
    data?.suggested ??
    data?.data?.suggestedPrice ??
    data?.data?.price;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

const addDays = (d, days) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const toDateOnly = (d) => {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameDay = (a, b) => {
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
};

const getBookingPeriod = (booking) => {
  if (!booking) return { start: null, end: null };

  const startCandidates = [booking.arrivalDate, booking.start, booking.checkIn, booking.createdAt];
  const endCandidates = [booking.departureDate, booking.end, booking.checkOut];

  const rawStart = startCandidates.find(Boolean);
  const rawEnd = endCandidates.find(Boolean);

  const nights = Number(booking.nights ?? booking.numberOfNights ?? booking.stayNights ?? 0);

  const start = toDateOnly(rawStart);
  const end = toDateOnly(rawEnd);

  if (start && end) return { start, end };
  if (start && nights > 0) {
    return { start, end: toDateOnly(addDays(start, nights)) };
  }
  if (end && nights > 0) {
    return { start: toDateOnly(addDays(end, -nights)), end };
  }

  // fallback: if createdAt exists, treat createdAt as start and assume 1 night
  if (!start && booking.createdAt) {
    const s = toDateOnly(booking.createdAt);
    return { start: s, end: toDateOnly(addDays(s, Math.max(1, nights || 1))) };
  }

  return { start: start || null, end: end || null };
};

export default function OwnerRoomDashboard({
  hostels = [],
  roomsByHostel = {},
  bookings = [],
  onDataRefresh,
  loading = false,
}) {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All");
  const [suggestedByRoom, setSuggestedByRoom] = useState({});
  const [pricingSourceByRoom, setPricingSourceByRoom] = useState({});
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [page, setPage] = useState(1);
  const [isSyncingPricing, setIsSyncingPricing] = useState(false);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const activeBookingCountByRoom = useMemo(() => {
    const map = {};

    bookings.forEach((booking) => {
      const status = String(booking?.status || "").toLowerCase();
      if (!["pending", "confirmed"].includes(status)) return;

      const roomId = booking?.roomId?._id || booking?.roomId;
      if (!roomId) return;

      const key = String(roomId);
      map[key] = (map[key] || 0) + 1;
    });

    return map;
  }, [bookings]);

  const baseRooms = useMemo(() => {
    const rows = [];

    hostels.forEach((hostel) => {
      const rooms = roomsByHostel[hostel._id] || [];

      rooms.forEach((room) => {
        const currentPrice = Number(room?.pricePerBed || 0);
        const bookingCount = activeBookingCountByRoom[String(room?._id)] || 0;
        const baseStatus = inferRoomStatus(room);
        const status = baseStatus === "Maintenance" ? "Maintenance" : bookingCount > 0 ? "Booked" : baseStatus;
        const roomName = room?.roomLabel
          ? `${room.roomType || "Room"} - ${room.roomLabel}`
          : `${room.roomType || "Room"} - ${String(room?._id || "").slice(-4)}`;

        rows.push({
          id: room._id,
          hostelId: hostel._id,
          hostelName: hostel.name || "Hostel",
          name: roomName,
          type: room.roomType || "Shared",
          capacity: `${Number(room.totalBeds || 0)} Pax`,
          price: currentPrice,
          status,
          bookingCount,
          img:
            room?.images?.[0] ||
            hostel?.images?.[0] ||
            hostel?.photos?.[0] ||
            "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
        });
      });
    });

    return rows;
  }, [hostels, roomsByHostel, activeBookingCountByRoom]);

  const allRooms = useMemo(() => {
    return baseRooms.map((room) => ({
      ...room,
      suggested: suggestedByRoom[room.id] ?? room.price,
      pricingSource: pricingSourceByRoom[room.id] || "fallback",
    }));
  }, [baseRooms, suggestedByRoom, pricingSourceByRoom]);

  useEffect(() => {
    let active = true;

    const fetchSuggestedPrices = async () => {
      if (!baseRooms.length) {
        setSuggestedByRoom({});
        setPricingSourceByRoom({});
        setAiUnavailable(false);
        setIsSyncingPricing(false);
        return;
      }

      setIsSyncingPricing(true);

      const results = await Promise.all(
        baseRooms.map(async (room) => {
          try {
            const res = await getRoomSuggestedPrice(room.id);
            return {
              id: room.id,
              value: parseSuggestedPrice(res, room.price),
              source: "ai",
            };
          } catch {
            return {
              id: room.id,
              value: room.price,
              source: "fallback",
            };
          }
        })
      );

      if (!active) return;

      const nextSuggested = {};
      const nextSource = {};

      results.forEach(({ id, value, source }) => {
        nextSuggested[id] = value;
        nextSource[id] = source;
      });

      setSuggestedByRoom(nextSuggested);
      setPricingSourceByRoom(nextSource);
      setAiUnavailable(results.every(({ source }) => source === "fallback"));
      setIsSyncingPricing(false);
    };

    fetchSuggestedPrices();

    return () => {
      active = false;
    };
  }, [baseRooms]);

  const roomTypes = useMemo(() => {
    const unique = [...new Set(allRooms.map((room) => room.type).filter(Boolean))];
    return ["All Types", ...unique];
  }, [allRooms]);

  const filteredRooms = useMemo(() => {
    return allRooms.filter((room) => {
      const typeOk = selectedType === "All Types" || room.type === selectedType;
      const statusOk = statusFilter === "All" || room.status === statusFilter;
      return typeOk && statusOk;
    });
  }, [allRooms, selectedType, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedRooms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, currentPage]);

  const pricingOverview = useMemo(() => {
    const liveAi = allRooms.filter((room) => room.pricingSource === "ai").length;
    const fallback = allRooms.filter((room) => room.pricingSource !== "ai").length;

    return { liveAi, fallback };
  }, [allRooms]);

  const checkinStats = useMemo(() => {
    const today = toDateOnly(new Date());
    let todaysCheckins = 0;
    let activeGuests = 0;

    bookings.forEach((b) => {
      const { start, end } = getBookingPeriod(b);
      if (!start || !end) return;

      if (isSameDay(start, today)) {
        todaysCheckins += 1;
      }

      if (today.getTime() >= start.getTime() && today.getTime() <= end.getTime()) {
        const beds = Number(b.bedsBooked ?? b.beds ?? b.numberOfGuests ?? b.guests) || 1;
        activeGuests += beds;
      }
    });

    return { todaysCheckins, activeGuests };
  }, [bookings]);

  const exportList = () => {
    const rows = filteredRooms.map((room) => [
      room.id,
      room.hostelName,
      room.name,
      room.type,
      room.capacity,
      room.price.toFixed(2),
      room.status,
      room.suggested.toFixed(2),
    ]);

    const csv = [
      ["Room ID", "Hostel", "Room Name", "Type", "Capacity", "Current Price", "Status", "AI Suggested"],
      ...rows,
    ]
      .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `owner-rooms-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Room list exported");
  };

  const handleAddRoomSuccess = async () => {
    setShowAddRoomModal(false);
    if (onDataRefresh) {
      await onDataRefresh();
    }
  };

  const formatPrice = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1 bg-[#faf8ff] font-sans text-[#131b2e]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight">Room Inventory</h2>
          <p className="text-[#424754] font-medium">
            Manage your {allRooms.length} units with AI suggested pricing from the backend service.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={exportList}
            className="px-6 py-3 rounded-xl bg-[#e2e7ff] text-[#005ac2] font-bold hover:bg-[#dae2fd] transition-colors flex items-center gap-2"
          >
            <Download size={20} />
            Export List
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hostels.length) {
                toast.info("Add a hostel first before adding rooms");
                return;
              }
              if (!selectedHostelId) {
                setSelectedHostelId(hostels[0]._id);
              }
              setShowAddRoomModal(true);
            }}
            className="px-8 py-3 rounded-xl bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus size={20} />
            New Room
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/70 backdrop-blur-xl p-6 rounded-2xl flex flex-wrap items-center gap-6 shadow-sm border border-[#e2e7ff]">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#424754] tracking-wider uppercase">Room Type</label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="bg-[#f2f3ff] border-none rounded-xl text-sm font-semibold p-2 min-w-[160px] focus:ring-2 focus:ring-blue-500/20 outline-none"
            >
              {roomTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#424754] tracking-wider uppercase">Current Status</label>
            <div className="flex gap-2 flex-wrap">
              {["All", "Available", "Booked", "Maintenance"].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-full text-xs font-bold ${statusFilter === status ? "bg-[#0058be] text-white" : "bg-[#e2e7ff] text-[#424754] hover:bg-[#dae2fd]"}`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-[#dce6ff] p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0058be]">Live AI Pricing</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-black text-[#131b2e]">{pricingOverview.liveAi}</span>
              <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[11px] font-bold text-[#0058be]">
                {isSyncingPricing ? "Syncing" : "Ready"}
              </span>
            </div>
            <p className="mt-2 text-sm text-[#424754]">Rooms that currently received a live recommendation from the AI pricing controller.</p>
          </div>

          <div className="rounded-2xl bg-white border border-[#dce6ff] p-5 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#0058be]">Today's Check-ins</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-black text-[#131b2e]">{checkinStats.todaysCheckins}</span>
              <span className="text-sm text-[#424754]">Check-ins today</span>
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#0058be]">Active Guests</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-black text-[#131b2e]">{checkinStats.activeGuests}</span>
              <span className="text-sm text-[#424754]">Currently checked-in</span>
            </div>
            <p className="mt-2 text-sm text-[#424754]">Counts are derived from owner bookings (uses arrival/departure/nights).</p>
          </div>

          <div className="rounded-2xl bg-white border border-[#f3d9d9] p-5 shadow-sm md:col-span-1">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b54747]">Fallback Pricing</div>
            <div className="mt-2 flex items-end justify-between">
              <span className="text-3xl font-black text-[#131b2e]">{pricingOverview.fallback}</span>
              <span className="rounded-full bg-[#fff2f2] px-3 py-1 text-[11px] font-bold text-[#b54747]">Saved Rate</span>
            </div>
            <p className="mt-2 text-sm text-[#424754]">If the AI service is unavailable, the dashboard shows the room's saved price instead of failing or exposing unused AI actions.</p>
            {aiUnavailable && (
              <p className="mt-3 text-xs font-semibold text-[#b54747]">AI service is currently unavailable. Saved room prices are being shown.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-[#e2e7ff] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[880px]">
          <thead>
            <tr className="text-[#424754]">
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Room Name / Type</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-center">Capacity</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">AI Suggested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedRooms.map((room) => {
              const pct = room.price > 0 ? Math.round(((room.suggested - room.price) / room.price) * 100) : 0;
              const lift = `${pct > 0 ? "+" : ""}${pct}%`;

              return (
                <tr key={room.id} className="hover:bg-[#f2f3ff] transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-[#e2e7ff]">
                        <img alt={room.name} src={room.img} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => navigate(`/room/${room.id}/${room.hostelId}`)}
                          className="font-bold text-[#131b2e] hover:text-[#0058be]"
                        >
                          {room.name}
                        </button>
                        <div className="text-xs text-[#424754]">{room.type} · {room.hostelName}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="bg-[#e2e7ff] px-3 py-1 rounded-full text-xs font-bold text-[#0058be]">
                      {room.capacity}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-bold">{formatPrice(room.price)}</div>
                    <div className="text-[10px] text-[#424754]">Current saved price</div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${statusClass[room.status] || "text-[#424754]"}`}>
                      <span className={`w-2 h-2 rounded-full ${statusDotClass[room.status] || "bg-[#424754]"}`}></span>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`space-y-2 ${room.status === "Maintenance" ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#783eb2]">{formatPrice(room.suggested)}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lift.includes("+") ? "bg-[#783eb2]/10 text-[#783eb2]" : "bg-red-100 text-red-600"}`}>
                          {lift}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${room.pricingSource === "ai" ? "bg-[#efe8ff] text-[#6b38d4]" : "bg-[#fff1f1] text-[#b54747]"}`}>
                          {room.pricingSource === "ai" ? "Live AI" : "Fallback"}
                        </span>
                        <span className="text-[10px] text-[#424754]">
                          {room.pricingSource === "ai" ? "Recommended by AI controller" : "Using saved room price"}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!loading && pagedRooms.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-[#424754]">No rooms found for selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-6 flex justify-between items-center bg-[#f2f3ff] rounded-b-2xl mt-2">
          <div className="text-xs text-[#424754] font-medium">
            Showing <span className="font-bold text-[#131b2e]">{filteredRooms.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}-{Math.min(currentPage * PAGE_SIZE, filteredRooms.length)}</span> of <span className="font-bold text-[#131b2e]">{filteredRooms.length}</span> rooms
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#424754] hover:text-[#0058be] transition-colors shadow-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0058be] text-white font-bold text-xs">{currentPage}</button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#424754] hover:text-[#0058be] transition-colors shadow-sm disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {showAddRoomModal && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-xl font-bold">Add New Room</h3>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Select Hostel</label>
                <select
                  className="w-full border rounded-lg px-3 py-2"
                  value={selectedHostelId}
                  onChange={(e) => setSelectedHostelId(e.target.value)}
                >
                  {hostels.map((hostel) => (
                    <option key={hostel._id} value={hostel._id}>{hostel.name}</option>
                  ))}
                </select>
              </div>

              {selectedHostelId ? (
                <AddRoom hostelId={selectedHostelId} onSuccess={handleAddRoomSuccess} />
              ) : (
                <p className="text-sm text-slate-500">Please select a hostel first.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
