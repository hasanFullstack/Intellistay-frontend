import React, { useMemo, useState } from "react";
import {
  BedDouble,
  Filter,
  Grid3X3,
  List,
  MapPin,
  Pencil,
  PlusCircle,
  Rocket,
  Sparkles,
  Users,
  X,
  Eye,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateHostel, deleteHostel } from "../../api/hostel.api";
import { toast } from "react-toastify";

const getStatusFor = (occupancy, revenue) => {
  if (occupancy >= 98) return { label: "Full Capacity", color: "bg-primary/90" };
  if (occupancy >= 75) return { label: "High Demand", color: "bg-primary/90" };
  if (occupancy >= 50) return { label: "Optimized", color: "bg-tertiary-container/90" };
  if (revenue > 100000) return { label: "Growing", color: "bg-secondary/80" };
  return { label: "Action Needed", color: "bg-error/90" };
};

const getHostelLocation = (hostel) => {
  if (hostel?.location) return hostel.location;

  const parts = [
    hostel?.addressLine1,
    hostel?.addressLine2,
    hostel?.city,
  ].filter(Boolean);

  if (parts.length) return parts.join(", ");
  if (hostel?.address?.city) return hostel.address.city;
  return "-";
};

const getHostelImage = (hostel) => {
  if (Array.isArray(hostel?.photos) && hostel.photos[0]) return hostel.photos[0];
  if (Array.isArray(hostel?.images) && hostel.images[0]) return hostel.images[0];
  if (hostel?.image) return hostel.image;
  return "https://images.unsplash.com/photo-1555854877-bab0e5b3f874?auto=format&fit=crop&w=1200&q=80";
};

export default function HostelPortfolio({
  hostels = [],
  roomsByHostel = {},
  bookings = [],
  onAddHostel,
  onHostelUpdated,
  loading = false,
}) {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [editingHostel, setEditingHostel] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cards = useMemo(() => {
    return hostels.map((h) => {
      const rooms = roomsByHostel[h._id] || [];
      const totalRooms = rooms.length;

      const hostelBookings = bookings.filter((b) => {
        const bookingHostelId = b?.hostelId?._id || b?.hostelId;
        return String(bookingHostelId) === String(h._id);
      });

      const confirmedOrCompleted = hostelBookings.filter(
        (b) => b.status === "confirmed" || b.status === "completed"
      );
      const activeBookings = hostelBookings.filter(
        (b) => b.status === "confirmed" || b.status === "pending"
      );

      const revenue = confirmedOrCompleted.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const occupancy = totalRooms > 0 ? Math.round((activeBookings.length / totalRooms) * 100) : 0;
      const statusObj = getStatusFor(occupancy, revenue);

      return {
        id: h._id,
        sourceHostel: h,
        name: h.name || "Untitled Hostel",
        location: getHostelLocation(h),
        revenue,
        occupancy,
        status: statusObj.label,
        statusColor: statusObj.color,
        image: getHostelImage(h),
        alt: h.name || "Hostel",
        description: h.description || "No description added yet.",
        amenitiesCount: Array.isArray(h.amenities) ? h.amenities.length : 0,
        amenities: Array.isArray(h.amenities) ? h.amenities : [],
        totalRooms,
        activeBookings: activeBookings.length,
        completedBookings: confirmedOrCompleted.length,
        gender: h.gender || "Not specified",
        rules: h.rules || "No rules provided",
      };
    });
  }, [hostels, roomsByHostel, bookings]);

  const filteredCards = useMemo(() => {
    if (statusFilter === "all") return cards;
    return cards.filter((c) => c.status === statusFilter);
  }, [cards, statusFilter]);

  const aiInsight = useMemo(() => {
    if (!cards.length) {
      return {
        title: "No Portfolio Signals Yet",
        description: "Add hostels and rooms to unlock dynamic pricing and occupancy recommendations.",
        lift: 0,
        targetHostel: "your next property",
      };
    }

    const candidate = [...cards].sort((a, b) => a.occupancy - b.occupancy)[0];
    const upliftPct = candidate.occupancy < 50 ? 18 : candidate.occupancy < 75 ? 12 : 6;
    const lift = Math.round((candidate.revenue || 0) * (upliftPct / 100));

    return {
      title: "Revenue Optimization Detected",
      description: `Our models suggest adjusting weekend rates for "${candidate.name}" by ${upliftPct}% based on demand and occupancy patterns.`,
      lift,
      targetHostel: candidate.name,
    };
  }, [cards]);

  const formatRevenue = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

  const openDetails = (hostel) => {
    if (!hostel?.id) {
      toast.error("Hostel details are unavailable");
      return;
    }
    navigate(`/hostels/${hostel.id}/rooms`);
  };

  const openEdit = (hostel) => {
    setEditingHostel(hostel);
    setEditForm({
      name: hostel.sourceHostel?.name || "",
      addressLine1: hostel.sourceHostel?.addressLine1 || "",
      addressLine2: hostel.sourceHostel?.addressLine2 || "",
      city: hostel.sourceHostel?.city || hostel.sourceHostel?.address?.city || "",
      description: hostel.sourceHostel?.description || "",
    });
  };

  const closeEdit = () => {
    setEditingHostel(null);
    setEditForm({ name: "", addressLine1: "", addressLine2: "", city: "", description: "" });
  };

  const handleEditSave = async () => {
    if (!editingHostel?.id) return;
    if (!editForm.name.trim()) {
      toast.error("Hostel name is required");
      return;
    }

    try {
      setSaving(true);
      await updateHostel(editingHostel.id, {
        name: editForm.name.trim(),
        addressLine1: editForm.addressLine1.trim(),
        addressLine2: editForm.addressLine2.trim(),
        city: editForm.city.trim(),
        description: editForm.description.trim(),
      });
      toast.success("Hostel updated successfully");
      closeEdit();
      if (onHostelUpdated) {
        await onHostelUpdated();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update hostel");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHostel = async () => {
    const id = editingHostel?.id || editingHostel?.sourceHostel?._id;
    if (!id) {
      toast.error("Unable to determine hostel id to delete");
      return;
    }

    const ok = window.confirm("Are you sure you want to delete this hostel? This action cannot be undone.");
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteHostel(id);
      toast.success("Hostel deleted");
      closeEdit();
      if (onHostelUpdated) await onHostelUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete hostel");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFromCard = async (hostel) => {
    const id = hostel?.id || hostel?.sourceHostel?._id || hostel?._id;
    if (!id) {
      toast.error("Unable to determine hostel id to delete");
      return;
    }

    const ok = window.confirm(`Delete ${hostel?.name || 'this hostel'}? This action cannot be undone.`);
    if (!ok) return;

    try {
      setDeleting(true);
      await deleteHostel(id);
      toast.success("Hostel deleted");
      if (onHostelUpdated) await onHostelUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to delete hostel");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="pb-12 px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Hostel Portfolio</h2>
          <p className="text-on-surface-variant text-lg max-w-2xl">
            Manage your properties, monitor real-time occupancy, and optimize revenue streams with AI-driven insights.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-high text-primary px-4 py-3 rounded-2xl font-bold flex items-center gap-2">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent outline-none text-sm"
            >
              <option value="all">All</option>
              <option value="Full Capacity">Full Capacity</option>
              <option value="High Demand">High Demand</option>
              <option value="Optimized">Optimized</option>
              <option value="Growing">Growing</option>
              <option value="Action Needed">Action Needed</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
            className="bg-surface-container-high text-primary px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-all"
          >
            {viewMode === "grid" ? <List size={16} /> : <Grid3X3 size={16} />}
            {viewMode === "grid" ? "List View" : "Grid View"}
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-1 ${viewMode === "grid" ? "md:grid-cols-2 xl:grid-cols-3" : "xl:grid-cols-1"} gap-8`}>
        {loading && (
          <div className="col-span-full text-center py-20 text-slate-500">Loading hostels...</div>
        )}

        {!loading && filteredCards.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-500">
            No hostels found for selected filter.
          </div>
        )}

        {!loading && filteredCards.map((hostel) => (
          <div key={hostel.id} className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group">
            <div className="relative h-56 overflow-hidden">
              <img
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                src={hostel.image}
                alt={hostel.alt}
              />
              <div className="absolute top-4 right-4">
                <span className={`${hostel.statusColor} text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md`}>
                  {hostel.status}
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{hostel.name}</h3>
                  <p className="text-sm text-on-surface-variant flex items-center gap-1">
                    <MapPin size={14} />
                    {hostel.location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                  <p className="text-xl font-extrabold text-primary">{formatRevenue(hostel.revenue)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 mb-6">
                <span className="flex items-center gap-1"><BedDouble size={12} /> {hostel.totalRooms}</span>
                <span className="flex items-center gap-1"><Users size={12} /> {hostel.activeBookings}</span>
                <span className="flex items-center gap-1"><Sparkles size={12} /> {hostel.amenitiesCount}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Occupancy</span>
                  <span className="text-sm font-bold text-primary">{hostel.occupancy}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${hostel.occupancy < 50 ? 'bg-error' : 'signature-gradient'}`}
                    style={{ width: `${hostel.occupancy}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-outline-variant/15">
                <button
                  type="button"
                  onClick={() => openDetails(hostel)}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(hostel)}
                  className="px-4 bg-surface-container-high text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-all hover:scale-105"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteFromCard(hostel)}
                  disabled={deleting}
                  className="px-4 text-red-700 rounded-xl  transition-all hover:scale-105"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

      

        <button
          type="button"
          onClick={onAddHostel}
          className="border-4 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-8 text-center hover:bg-slate-50 hover:border-primary/40 transition-all cursor-pointer group h-full min-h-[400px]"
        >
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            <PlusCircle size={30} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Expand Portfolio</h3>
          <p className="text-slate-500 text-sm max-w-[200px] mt-2">Connect a new property to the IntelliStay ecosystem in minutes.</p>
        </button>
      </div>

      {editingHostel && (
        <div className="fixed inset-0 z-[80] bg-black/50 p-4 flex items-start justify-center overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-xl font-bold">Edit Hostel</h3>
                <p className="text-sm text-slate-500">Update basic details for <span className="font-semibold">{editingHostel?.name || editingHostel?.sourceHostel?.name}</span></p>
              </div>
              <button type="button" onClick={closeEdit} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form className="p-0" onSubmit={(e) => { e.preventDefault(); handleEditSave(); }}>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: 12 }}>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Hostel Name</label>
                  <input className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none" placeholder="Hostel Name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">City</label>
                  <input className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none" placeholder="City" value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 1</label>
                  <input className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none" placeholder="Address Line 1" value={editForm.addressLine1} onChange={(e) => setEditForm((p) => ({ ...p, addressLine1: e.target.value }))} />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Address Line 2</label>
                  <input className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none" placeholder="Address Line 2" value={editForm.addressLine2} onChange={(e) => setEditForm((p) => ({ ...p, addressLine2: e.target.value }))} />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Description</label>
                  <textarea className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none resize-none" rows={4} placeholder="Description" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeEdit} className="px-4 py-2 rounded-full border text-sm hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-5 py-2 rounded-full bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-bold text-sm disabled:opacity-60">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
