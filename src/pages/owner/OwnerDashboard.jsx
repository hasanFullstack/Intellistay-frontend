import React, { useCallback, useEffect, useMemo, useState } from "react";
import OwnerSidebar from "../../../components/owner/OwnerSidebar";
import { getMyHostels } from "../../api/hostel.api";
import { getRoomsByHostel } from "../../api/room.api";
import { getOwnerBookings } from "../../api/booking.api";
import AddHostel from "./AddHostel";
import OwnerEnvironmentModal from "./OwnerEnvironmentModal";
import HostelPortfolio from "./HostelPortfolio";
import OwnerRoomDashboard from "./OwnerRoomDashboard";
import OwnerSettingsPage from "./OwnerSettingsPage";
import OwnerBookingsCentral from "./OwnerBookingsCentral";
import { ArrowUp, BedDouble, Menu } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KpiCard = ({ title, value, badge, icon, Icon, trend, trendValue, colorClass = "text-primary" }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col justify-between border border-slate-100">
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">{title}</p>
    <div className="flex items-end justify-between">
      <span className="text-3xl font-extrabold">{value}</span>
      {badge && <span className="text-primary text-xs font-bold bg-blue-50 px-2 py-1 rounded-md">{badge}</span>}
      {Icon ? <Icon size={20} strokeWidth={2.2} className={colorClass} /> : null}
      {!Icon && icon ? <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span> : null}
      {trend && (
        <span className={`${trend === 'up' ? 'text-green-600' : 'text-slate-500'} text-xs font-bold flex items-center gap-1`}>
          {trend === 'up' ? <ArrowUp size={14} strokeWidth={2.5} /> : null}
          {trend === 'up' ? trendValue : (trendValue || 'Stable')}
        </span>
      )}
    </div>
  </div>
);

const InsightCard = ({ title, description, borderClass, type, actionText }) => (
  <div className={`bg-white/40 backdrop-blur-sm p-5 rounded-lg border-l-4 ${borderClass} shadow-sm`}>
    <p className="text-sm font-semibold mb-2">{title}</p>
    <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
    <div className="mt-4 flex justify-between items-center">
      <span className={`text-[10px] font-extrabold uppercase tracking-widest ${borderClass.replace('border-', 'text-')}`}>{type}</span>
      {actionText && (
        <button className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-md px-2 py-1 hover:bg-slate-200 transition-colors">{actionText}</button>
      )}
    </div>
  </div>
);

export default function OwnerDashboard() {
  const [hostels, setHostels] = useState([]);
  const [roomsByHostel, setRoomsByHostel] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddHostel, setShowAddHostel] = useState(false);
  const [quizHostelId, setQuizHostelId] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chartMetric, setChartMetric] = useState("revenue");
  const [chartHoverIndex, setChartHoverIndex] = useState(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const hRes = await getMyHostels();
      const hostelsData = hRes?.data || [];
      setHostels(hostelsData);

      const roomPromises = hostelsData.map((h) =>
        getRoomsByHostel(h._id).then((r) => ({ id: h._id, rooms: r.data || [] })).catch(() => ({ id: h._id, rooms: [] }))
      );
      const roomsResults = await Promise.all(roomPromises);
      const map = {};
      roomsResults.forEach((r) => (map[r.id] = r.rooms));
      setRoomsByHostel(map);

      const bRes = await getOwnerBookings();
      setBookings(bRes?.data || []);
    } catch (err) {
      toast.error("Failed to load owner dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const getCreatedHostelId = (createdHostel) => {
    if (!createdHostel) return null;
    return (
      createdHostel._id ||
      createdHostel.id ||
      createdHostel.hostel?._id ||
      createdHostel.hostel?.id ||
      null
    );
  };

  const handleAddHostelSuccess = async (createdHostel) => {
    const createdHostelId = getCreatedHostelId(createdHostel);
    setShowAddHostel(false);
    await loadDashboardData();

    if (createdHostelId) {
      setQuizHostelId(createdHostelId);
      toast.info("Complete the environment quiz for this hostel.");
    } else {
      toast.warning("Hostel added, but quiz could not open automatically.");
    }
  };

  const handleQuizClose = async () => {
    setQuizHostelId(null);
    await loadDashboardData();
  };

  const parseBookingDate = (booking) => {
    const raw = booking?.startDate || booking?.checkInDate || booking?.checkIn || booking?.createdAt || null;
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const totalRooms = useMemo(
    () => Object.values(roomsByHostel).reduce((s, arr) => s + (arr?.length || 0), 0),
    [roomsByHostel],
  );
  const activeBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending").length;

  const { totalBeds, availableBeds } = useMemo(() => {
    let beds = 0;
    let available = 0;
    Object.values(roomsByHostel).forEach((rooms) => {
      (rooms || []).forEach((room) => {
        beds += Number(room?.totalBeds || 0);
        available += Number(room?.availableBeds || 0);
      });
    });
    return { totalBeds: beds, availableBeds: available };
  }, [roomsByHostel]);

  const bookedBeds = Math.max(totalBeds - availableBeds, 0);
  const occupancyRate = totalBeds > 0 ? Math.round((bookedBeds / totalBeds) * 100) : 0;

  const monthlyRevenue = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    return (bookings || [])
      .filter((b) => {
        const status = String(b?.status || "").toLowerCase();
        return status === "confirmed" || status === "completed";
      })
      .filter((b) => {
        const d = parseBookingDate(b);
        return d && d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, b) => sum + (Number(b?.totalPrice) || 0), 0);
  }, [bookings]);

  const chartData = useMemo(() => {
    const now = new Date();
    const monthBuckets = Array.from({ length: 7 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString("en-US", { month: "short" }),
        revenue: 0,
        occupiedUnits: 0,
      };
    });

    const bucketMap = Object.fromEntries(monthBuckets.map((b) => [b.key, b]));

    (bookings || []).forEach((b) => {
      const d = parseBookingDate(b);
      if (!d) return;

      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = bucketMap[key];
      if (!bucket) return;

      const status = String(b?.status || "").toLowerCase();
      if (status === "confirmed" || status === "completed") {
        bucket.revenue += Number(b?.totalPrice) || 0;
      }

      if (status === "confirmed" || status === "pending" || status === "completed") {
        const units = Number(b?.bedsBooked ?? b?.quantity ?? b?.beds ?? 1);
        bucket.occupiedUnits += Number.isFinite(units) && units > 0 ? units : 1;
      }
    });

    return monthBuckets.map((b) => {
      const occupancy = totalBeds > 0 ? Math.min(100, Math.round((b.occupiedUnits / totalBeds) * 100)) : 0;
      return {
        ...b,
        occupancy,
      };
    });
  }, [bookings, totalBeds]);

  const selectedChartIndex = chartHoverIndex ?? Math.max(chartData.length - 1, 0);
  const selectedChartPoint = chartData[selectedChartIndex] || null;
  const chartValues = chartData.map((d) => (chartMetric === "revenue" ? d.revenue : d.occupancy));
  const chartMax = Math.max(...chartValues, 0);

  const chartSummaryValue = selectedChartPoint
    ? chartMetric === "revenue"
      ? `Rs ${Math.round(selectedChartPoint.revenue).toLocaleString()}`
      : `${selectedChartPoint.occupancy}%`
    : chartMetric === "revenue"
      ? "Rs 0"
      : "0%";

  const recentBookingRows = bookings.slice(0, 6);

  const tabLabel = {
    dashboard: "Portfolio Overview",
    hostels: "My Hostels",
    rooms: "Rooms",
    bookings: "Bookings Central",
    settings: "Settings",
  };

  return (
    <div className="bg-[#faf8ff] text-[#131b2e] font-sans">

      {/* ── Owner sub-header (below global Navbar, always in flow) ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-12">
          {/* Left: hamburger (mobile) + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span className="text-[#0058be] font-bold">Owner</span>
              <span>/</span>
              <span className="text-slate-700 font-semibold capitalize">{tabLabel[activeTab] || "Dashboard"}</span>
            </div>
          </div>
          {/* Right: Add Hostel CTA */}
          <button
            type="button"
            onClick={() => setShowAddHostel(true)}
            className="hidden sm:flex items-center gap-2 bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            <span className="text-base leading-none">+</span> Add Hostel
          </button>
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="flex min-h-[calc(100vh-theme(spacing.12))] relative">

        {/* Backdrop (mobile only) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <OwnerSidebar
          onAdd={() => setShowAddHostel(true)}
          activeTab={activeTab}
          onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

      {showAddHostel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
              <h3 className="text-xl font-bold">Add New Hostel</h3>
              <button
                type="button"
                onClick={() => setShowAddHostel(false)}
                className="rounded-lg px-3 py-1 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <AddHostel onSuccess={handleAddHostelSuccess} />
            </div>
          </div>
        </div>
      )}

      {quizHostelId && (
        <OwnerEnvironmentModal hostelId={quizHostelId} onClose={handleQuizClose} />
      )}

      <main className="flex-1 min-w-0">
        {/* <header className="fixed top-0 right-0 left-64 z-40 h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 shadow-sm">
          <div className="flex justify-between items-center w-full px-8 h-full">
            <div className="flex items-center flex-1 max-w-xl">
              <div className="relative w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                <input className="w-full bg-slate-100 border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20" placeholder="Search hostels, bookings, or guests..." type="text" />
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <nav className="hidden lg:flex items-center space-x-8 mr-8">
                <a className="text-blue-600 font-semibold" href="#">Overview</a>
                <a className="text-slate-600 hover:text-blue-500 transition-all" href="#">Help Center</a>
              </nav>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-slate-600 hover:text-blue-600"><span className="material-symbols-outlined">notifications</span></button>
                <div className="h-10 w-10 rounded-full bg-blue-100 overflow-hidden border border-slate-200"><img alt="User" className="h-full w-full object-cover" src={user?.avatar || 'https://via.placeholder.com/40'} /></div>
              </div>
            </div>
          </div>
        </header> */}

        {activeTab === "hostels" ? (
          <HostelPortfolio
            hostels={hostels}
            roomsByHostel={roomsByHostel}
            bookings={bookings}
            loading={loading}
            onAddHostel={() => setShowAddHostel(true)}
            onHostelUpdated={loadDashboardData}
          />
        ) : activeTab === "rooms" ? (
          <OwnerRoomDashboard
            hostels={hostels}
            roomsByHostel={roomsByHostel}
            bookings={bookings}
            loading={loading}
            onDataRefresh={loadDashboardData}
          />
        ) : activeTab === "bookings" ? (
          <OwnerBookingsCentral
            bookings={bookings}
            loading={loading}
            onRefresh={loadDashboardData}
          />
        ) : activeTab === "settings" ? (
          <OwnerSettingsPage
            hostels={hostels}
            onDataRefresh={loadDashboardData}
          />
        ) : (
          <div className="pt-6 lg:pt-10 pb-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">Portfolio Overview</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold">Live Monitoring</span>
              <span className="text-slate-500 text-sm">Last updated: 2 minutes ago</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-10">
            <KpiCard title="Total Hostels" value={hostels.length} badge="+2 New" />
            <KpiCard title="Total Rooms" value={totalRooms} Icon={BedDouble} colorClass="text-slate-700" />
            <KpiCard title="Occupancy Rate" value={`${occupancyRate}%`} trend="up" trendValue="4.2%" />
            <KpiCard title="Monthly Revenue" value={`Rs ${monthlyRevenue.toLocaleString()}`} trend="up" trendValue="18%" colorClass="text-blue-600" />
            <KpiCard title="Active Bookings" value={activeBookings} trend="stable" trendValue="Stable" />
            <KpiCard title="Avg Night Price" value="$65.5" trend="up" trendValue="$4.0" colorClass="text-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Revenue Performance</h3>
                    <p className="text-sm text-slate-500">Comparative analysis of gross earnings</p>
                  </div>
                  <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setChartMetric("revenue")}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition ${chartMetric === "revenue" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMetric("occupancy")}
                      className={`px-4 py-1 text-xs font-bold rounded-md transition ${chartMetric === "occupancy" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      Occupancy
                    </button>
                  </div>
                </div>
                <div className="mb-4 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-slate-900">{chartSummaryValue}</div>
                  <div className="text-xs font-semibold text-slate-500">
                    {selectedChartPoint ? selectedChartPoint.label : "-"}
                  </div>
                </div>
                <div className="h-64 grid grid-cols-7 items-end gap-3">
                  {chartData.map((point, i) => {
                    const value = chartMetric === "revenue" ? point.revenue : point.occupancy;
                    const ratio = chartMax > 0 ? value / chartMax : 0;
                    const heightPct = value > 0 ? Math.max(ratio * 100, 10) : 5;
                    const isActive = i === selectedChartIndex;

                    return (
                      <button
                        key={point.key}
                        type="button"
                        onMouseEnter={() => setChartHoverIndex(i)}
                        onFocus={() => setChartHoverIndex(i)}
                        onMouseLeave={() => setChartHoverIndex(null)}
                        className="group flex h-full flex-col justify-end"
                        title={`${point.label}: ${chartMetric === "revenue" ? `Rs ${Math.round(point.revenue).toLocaleString()}` : `${point.occupancy}%`}`}
                      >
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 ${isActive ? "bg-gradient-to-t from-blue-600 to-indigo-500" : "bg-blue-100 group-hover:bg-blue-200"}`}
                        />
                        <span className={`mt-2 text-[10px] font-bold ${isActive ? "text-slate-800" : "text-slate-400"}`}>
                          {point.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h3 className="text-xl font-bold mb-6">Recent Bookings</h3>
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100">
                    <tr className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="pb-4">Guest</th>
                      <th className="pb-4">Hostel</th>
                      <th className="pb-4">Status</th>
                      <th className="pb-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentBookingRows.map((b, i) => (
                      <tr key={b._id || i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 text-sm font-semibold">{b.userId?.name || 'Guest'}</td>
                        <td className="py-4 text-sm text-slate-500">{b.hostelId?.name || '—'}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{b.status}</span>
                        </td>
                        <td className="py-4 text-sm font-bold text-right">Rs {b.totalPrice?.toLocaleString() || '0'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

           
          </div>
          </div>
        )}
      </main>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
}
