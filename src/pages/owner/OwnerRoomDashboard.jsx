import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  Plus,
  Sparkles,
  TrendingUp,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getRoomSuggestedPrice, updateRoom } from "../../api/room.api";
import AddRoom from "./AddRoom";
import { toast } from "react-toastify";

const AUTOPILOT_STORAGE_KEY = "owner_room_autopilot";
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

const loadAutopilotMap = () => {
  try {
    const raw = localStorage.getItem(AUTOPILOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveAutopilotMap = (map) => {
  localStorage.setItem(AUTOPILOT_STORAGE_KEY, JSON.stringify(map));
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
  const [autopilotByRoom, setAutopilotByRoom] = useState(loadAutopilotMap);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [page, setPage] = useState(1);
  const [applying, setApplying] = useState(false);

  const bookingsByHostel = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const hid = b?.hostelId?._id || b?.hostelId;
      if (!hid) return;
      if (!map[hid]) map[hid] = [];
      map[hid].push(b);
    });
    return map;
  }, [bookings]);

  const allRooms = useMemo(() => {
    const rows = [];

    hostels.forEach((hostel) => {
      const rooms = roomsByHostel[hostel._id] || [];
      const hostelBookings = bookingsByHostel[hostel._id] || [];

      rooms.forEach((room) => {
        const currentPrice = Number(room?.pricePerBed || 0);
        const status = inferRoomStatus(room);
        const roomName = room?.roomLabel
          ? `${room.roomType || "Room"} - ${room.roomLabel}`
          : `${room.roomType || "Room"} - ${String(room?._id || "").slice(-4)}`;

        const roomBookings = hostelBookings.filter((b) => String(b?.roomId?._id || b?.roomId) === String(room._id));

        rows.push({
          id: room._id,
          hostelId: hostel._id,
          hostelName: hostel.name || "Hostel",
          name: roomName,
          type: room.roomType || "Shared",
          capacity: `${Number(room.totalBeds || 0)} Pax`,
          price: currentPrice,
          status,
          suggested: suggestedByRoom[room._id] ?? currentPrice,
          autoPilot: !!autopilotByRoom[room._id],
          img: room?.images?.[0] || hostel?.images?.[0] || hostel?.photos?.[0] || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80",
          room,
          bookingCount: roomBookings.length,
        });
      });
    });

    return rows;
  }, [hostels, roomsByHostel, bookingsByHostel, suggestedByRoom, autopilotByRoom]);

  useEffect(() => {
    let active = true;
    const fetchSuggested = async () => {
      const roomIds = allRooms.map((r) => r.id);
      if (!roomIds.length) {
        setSuggestedByRoom({});
        return;
      }

      const results = await Promise.all(
        allRooms.map(async (r) => {
          try {
            const res = await getRoomSuggestedPrice(r.id);
            return [r.id, parseSuggestedPrice(res, r.price)];
          } catch {
            return [r.id, r.price];
          }
        })
      );

      if (!active) return;
      const next = {};
      results.forEach(([id, value]) => {
        next[id] = value;
      });
      setSuggestedByRoom(next);
    };

    fetchSuggested();
    return () => {
      active = false;
    };
  }, [hostels, roomsByHostel]);

  const roomTypes = useMemo(() => {
    const unique = [...new Set(allRooms.map((r) => r.type).filter(Boolean))];
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
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRooms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, currentPage]);

  const revenuePotential = useMemo(() => {
    const adjustable = allRooms.filter((r) => r.status !== "Maintenance" && r.price > 0);
    if (!adjustable.length) return 0;

    const avgLift = adjustable.reduce((sum, r) => {
      const pct = ((r.suggested - r.price) / r.price) * 100;
      return sum + pct;
    }, 0) / adjustable.length;

    return Math.max(-99, Math.round(avgLift * 10) / 10);
  }, [allRooms]);

  const optimizationSummary = useMemo(() => {
    const adjustable = allRooms.filter((r) => r.status !== "Maintenance" && r.price > 0);
    const positive = adjustable.filter((r) => r.suggested > r.price);

    const ratio = adjustable.length ? Math.round((positive.length / adjustable.length) * 100) : 0;
    const projectedLift = positive.reduce((sum, r) => sum + (r.suggested - r.price), 0);

    return {
      ratio,
      projectedLift,
    };
  }, [allRooms]);

  const maintenanceQueue = useMemo(() => allRooms.filter((r) => r.status === "Maintenance"), [allRooms]);

  const toggleAutopilot = (roomId) => {
    setAutopilotByRoom((prev) => {
      const next = { ...prev, [roomId]: !prev[roomId] };
      saveAutopilotMap(next);
      return next;
    });
  };

  const exportList = () => {
    const rows = filteredRooms.map((r) => [
      r.id,
      r.hostelName,
      r.name,
      r.type,
      r.capacity,
      r.price.toFixed(2),
      r.status,
      r.suggested.toFixed(2),
      r.autoPilot ? "On" : "Off",
    ]);

    const csv = [
      ["Room ID", "Hostel", "Room Name", "Type", "Capacity", "Current Price", "Status", "AI Suggested", "Autopilot"],
      ...rows,
    ]
      .map((line) => line.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `owner-rooms-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Room list exported");
  };

  const applyAiPricing = async (onlyAutopilot = false) => {
    const targetRooms = allRooms.filter(
      (r) => r.status !== "Maintenance" && (!onlyAutopilot || r.autoPilot)
    );

    if (!targetRooms.length) {
      toast.info(onlyAutopilot ? "No auto-pilot rooms to update" : "No rooms available for AI pricing");
      return;
    }

    try {
      setApplying(true);
      await Promise.all(
        targetRooms.map((r) =>
          updateRoom(r.id, {
            ...r.room,
            pricePerBed: Number(r.suggested.toFixed(2)),
          })
        )
      );
      toast.success(`Updated ${targetRooms.length} rooms with AI pricing`);
      if (onDataRefresh) await onDataRefresh();
    } catch {
      toast.error("Failed to apply AI pricing to one or more rooms");
    } finally {
      setApplying(false);
    }
  };

  const handleAddRoomSuccess = async () => {
    setShowAddRoomModal(false);
    if (onDataRefresh) await onDataRefresh();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 flex-1 bg-[#faf8ff] font-sans text-[#131b2e]">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight">Room Inventory</h2>
          <p className="text-[#424754] font-medium">Manage your {allRooms.length} units with dynamic AI pricing intelligence.</p>
        </div>
        <div className="flex gap-4">
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
              if (!selectedHostelId) setSelectedHostelId(hostels[0]._id);
              setShowAddRoomModal(true);
            }}
            className="px-8 py-3 rounded-xl bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-bold shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            <Plus size={20} />
            New Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 bg-white/70 backdrop-blur-xl p-6 rounded-2xl flex flex-wrap items-center gap-6 shadow-sm">
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
              {roomTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
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

        <div className="bg-gradient-to-br from-[#0058be] to-[#6b38d4] p-6 rounded-2xl text-white relative overflow-hidden flex flex-col justify-center shadow-md">
          <div className="relative z-10">
            <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Revenue Potential</p>
            <h3 className="text-2xl font-black">{revenuePotential >= 0 ? `+${revenuePotential}%` : `${revenuePotential}%`}</h3>
            <p className="text-[11px] opacity-90 mt-1">AI optimization can increase monthly yield.</p>
          </div>
          <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-2 shadow-sm border border-[#e2e7ff] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[980px]">
          <thead>
            <tr className="text-[#424754]">
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Room Name / Type</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-center">Capacity</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">Status</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider">AI Suggested</th>
              <th className="px-6 py-5 text-[11px] font-bold uppercase tracking-wider text-right">AI Auto-Pilot</th>
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
                    <div className="font-bold">Rs {room.price.toFixed(2)}</div>
                    <div className="text-[10px] text-[#424754]">Base Rate</div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`flex items-center gap-1.5 text-xs font-bold ${statusClass[room.status] || "text-[#424754]"}`}>
                      <span className={`w-2 h-2 rounded-full ${statusDotClass[room.status] || "bg-[#424754]"}`}></span>
                      {room.status}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className={`flex items-center gap-2 ${room.status === "Maintenance" ? "opacity-50" : ""}`}>
                      <span className="font-bold text-[#783eb2]">Rs {room.suggested.toFixed(2)}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lift.includes("+") ? "bg-[#783eb2]/10 text-[#783eb2]" : "bg-red-100 text-red-600"}`}>
                        {lift}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button
                      type="button"
                      onClick={() => toggleAutopilot(room.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${room.autoPilot ? "bg-[#6b38d4]" : "bg-gray-300"}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${room.autoPilot ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && pagedRooms.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-[#424754]">No rooms found for selected filters.</td>
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
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#424754] hover:text-[#0058be] transition-colors shadow-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0058be] text-white font-bold text-xs">{currentPage}</button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-[#424754] hover:text-[#0058be] transition-colors shadow-sm disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl space-y-4 border border-[#e2e7ff] shadow-sm">
          <div className="flex items-center gap-3 text-[#783eb2]">
            <TrendingUp size={20} />
            <h4 className="font-bold">Market Trend</h4>
          </div>
          <p className="text-sm text-[#424754] leading-relaxed">
            Local demand spike detected for your top performing room categories. Recommended dynamic uplift is reflected in AI suggested prices.
          </p>
          <button
            type="button"
            onClick={() => applyAiPricing(false)}
            disabled={applying}
            className="text-xs font-black text-[#783eb2] uppercase tracking-widest hover:underline disabled:opacity-50"
          >
            {applying ? "Applying..." : "Apply to all"}
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl space-y-4 border-2 border-[#0058be]/10 shadow-sm">
          <div className="flex items-center gap-3 text-[#0058be]">
            <Sparkles size={20} />
            <h4 className="font-bold">Optimization Summary</h4>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-black text-[#131b2e]">{optimizationSummary.ratio}%</span>
              <span className="text-xs text-[#424754] ml-1">of rooms</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-600">+ Rs {optimizationSummary.projectedLift.toFixed(0)}</span>
              <div className="text-[10px] text-[#424754] uppercase">Projected Lift</div>
            </div>
          </div>
          <div className="w-full bg-[#e2e7ff] h-2 rounded-full overflow-hidden">
            <div className="bg-[#0058be] h-full" style={{ width: `${optimizationSummary.ratio}%` }}></div>
          </div>
          <button
            type="button"
            onClick={() => applyAiPricing(true)}
            disabled={applying}
            className="text-xs font-black text-[#0058be] uppercase tracking-widest hover:underline disabled:opacity-50"
          >
            {applying ? "Applying..." : "Apply Auto-Pilot Rooms"}
          </button>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-2xl space-y-4 border border-[#e2e7ff] shadow-sm">
          <div className="flex items-center gap-3 text-[#424754]">
            <Wrench size={20} />
            <h4 className="font-bold">Maintenance Queue</h4>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{maintenanceQueue.length} units pending</span>
            <span className={`text-xs px-2 py-1 font-bold rounded ${maintenanceQueue.length ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
              {maintenanceQueue.length ? "High Priority" : "Clear"}
            </span>
          </div>
          <p className="text-xs text-[#424754] italic">Next scheduled check: Tomorrow, 09:00 AM</p>
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
                  {hostels.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
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
