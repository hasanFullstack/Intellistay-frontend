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
import { ArrowUp } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const KpiCard = ({ title, value, badge, icon, trend, trendValue, colorClass = "text-primary" }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col justify-between border border-slate-100">
    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">{title}</p>
    <div className="flex items-end justify-between">
      <span className="text-3xl font-extrabold">{value}</span>
      {badge && <span className="text-primary text-xs font-bold bg-blue-50 px-2 py-1 rounded-md">{badge}</span>}
      {icon && <span className={`material-symbols-outlined ${colorClass}`}>{icon}</span>}
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

  const totalRooms = useMemo(() => Object.values(roomsByHostel).reduce((s, arr) => s + (arr?.length || 0), 0), [roomsByHostel]);
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed').length;
  const activeBookings = bookings.filter((b) => b.status === 'confirmed' || b.status === 'pending').length;
  const monthlyRevenue = useMemo(() => bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((s, b) => s + (b.totalPrice || 0), 0), [bookings]);
  const occupancyRate = totalRooms > 0 ? Math.round((confirmedBookings / totalRooms) * 100) : 0;

  const recentBookingRows = bookings.slice(0, 6);

  return (
    <div className="min-h-screen relative bg-[#faf8ff] text-[#131b2e] font-sans">
      <OwnerSidebar
        onAdd={() => setShowAddHostel(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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

      <main className="ml-64 min-h-screen">
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
          <div className="pt-28 pb-12 px-8">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight mb-2">Portfolio Overview</h2>
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 px-3 py-1 rounded-full text-blue-700 text-xs font-semibold">Live Monitoring</span>
              <span className="text-slate-500 text-sm">Last updated: 2 minutes ago</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-10">
            <KpiCard title="Total Hostels" value={hostels.length} badge="+2 New" />
            <KpiCard title="Total Rooms" value={totalRooms} icon="king_bed" />
            <KpiCard title="Occupancy Rate" value={`${occupancyRate}%`} trend="up" trendValue="4.2%" />
            <KpiCard title="Monthly Revenue" value={`Rs ${monthlyRevenue.toLocaleString()}`} trend="up" trendValue="18%" colorClass="text-blue-600" />
            <KpiCard title="Active Bookings" value={activeBookings} trend="stable" trendValue="Stable" />
            <KpiCard title="Avg Night Price" value="$65.5" trend="up" trendValue="$4.0" colorClass="text-purple-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-bold mb-1">Revenue Performance</h3>
                    <p className="text-sm text-slate-500">Comparative analysis of gross earnings</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button className="px-4 py-1 text-xs font-bold bg-white rounded-md shadow-sm">Revenue</button>
                    <button className="px-4 py-1 text-xs font-bold text-slate-500">Occupancy</button>
                  </div>
                </div>
                <div className="h-64 flex items-end space-x-4">
                  {[32, 48, 40, 56, 60, 64, 52].map((height, i) => (
                    <div key={i} style={{ height: `${height}%` }} className={`flex-1 rounded-t-lg transition-all cursor-pointer ${i === 5 ? 'bg-gradient-to-t from-blue-600 to-purple-600' : 'bg-blue-100 hover:bg-blue-200'}`} />
                  ))}
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

            <div className="space-y-8">
              <div className="bg-[#f0ebff] p-8 rounded-xl shadow-sm border border-purple-100 flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg text-white">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <h3 className="text-xl font-bold">Intelli Insights</h3>
                </div>
                <div className="space-y-6">
                  <InsightCard title="Demand Surge Detected" description="Demand is increasing in Lahore. Adjust inventory for the festival week." type="Growth Opportunity" borderClass="border-blue-600" actionText="Dismiss" />
                  <InsightCard title="Dynamic Pricing Alert" description="Weekend pricing can be optimized by +12% based on local occupancy." type="Revenue Boost" borderClass="border-purple-600" />
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold py-3 rounded-lg shadow-md">Apply All Recommendations</button>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </main>
      <ToastContainer position="top-right" />
    </div>
  );
}
