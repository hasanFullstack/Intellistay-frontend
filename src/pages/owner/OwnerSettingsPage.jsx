import { useEffect, useMemo, useState } from "react";
import { UserCircle, Landmark, Eye, RefreshCw, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { updateHostel } from "../../api/hostel.api";
import {
  getStripeKeys,
  saveStripeKeys,
  deleteStripeKeys,
} from "../../api/ownerStripe.api";


export default function OwnerSettingsPage({ hostels = [], onDataRefresh }) {
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const [hostelName, setHostelName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);


  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [accountId, setAccountId] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [hasStoredSecret, setHasStoredSecret] = useState(false);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  useEffect(() => {
    if (!hostels.length) {
      setSelectedHostelId("");
      setHostelName("");
      setContactEmail("");
      setDescription("");
      return;
    }

    const first = hostels[0]?._id || "";
    setSelectedHostelId((prev) => prev || first);
  }, [hostels]);

  const selectedHostel = useMemo(
    () => hostels.find((h) => String(h._id) === String(selectedHostelId)) || null,
    [hostels, selectedHostelId]
  );

  useEffect(() => {
    if (!selectedHostel) return;

    setHostelName(selectedHostel.name || "");
    setContactEmail(selectedHostel.contactEmail || selectedHostel.email || "");
    setDescription(selectedHostel.description || "");
  }, [selectedHostel]);

  const loadStripe = async () => {
    try {
      setStripeLoading(true);
      const res = await getStripeKeys();
      const data = res?.data || {};
      const loadedPublicKey =
        data.publicKey ||
        data.publishableKey ||
        data.stripePublicKey ||
        "";
      const loadedAccountId =
        data.accountId ||
        data.stripeAccountId ||
        "";
      const loadedSecret =
        data.secretKey ||
        data.secretKeyMasked ||
        data.maskedSecret ||
        "";
      const hasSecret = Boolean(data.hasSecret || loadedSecret);

      setPublicKey(loadedPublicKey);
      setAccountId(loadedAccountId);
      setSecretKey(loadedSecret || (hasSecret ? "************" : ""));
      setHasStoredSecret(hasSecret);
      setStripeConfigured(Boolean(loadedPublicKey || loadedAccountId || hasSecret));
    } catch (err) {
      setPublicKey("");
      setSecretKey("");
      setAccountId("");
      setHasStoredSecret(false);
      setStripeConfigured(false);
      toast.error(err?.response?.data?.message || "Failed to load Stripe keys");
    } finally {
      setStripeLoading(false);
    }
  };

  useEffect(() => {
    loadStripe();
  }, []);

  const handleProfileSave = async () => {
    if (!selectedHostel?._id) {
      toast.error("No hostel selected");
      return;
    }

    if (!hostelName.trim()) {
      toast.error("Hostel name is required");
      return;
    }

    try {
      setProfileUpdating(true);
      await updateHostel(selectedHostel._id, {
        ...selectedHostel,
        name: hostelName.trim(),
        description: description.trim(),
        contactEmail: contactEmail.trim(),
      });
      toast.success("Profile updated");
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setProfileUpdating(false);
    }
  };

  

  const handleStripeSave = async () => {
    if (stripeConfigured) {
      toast.info("Stripe keys are already configured. Remove keys first to change them.");
      return;
    }

    if (!publicKey.trim()) {
      toast.error("Stripe publishable key is required");
      return;
    }

    if (!secretKey.trim()) {
      toast.error("Stripe secret key is required");
      return;
    }

    try {
      setStripeSaving(true);
      const payload = {
        publicKey: publicKey.trim(),
        publishableKey: publicKey.trim(),
        stripePublicKey: publicKey.trim(),
        secretKey: secretKey.trim(),
        stripeSecretKey: secretKey.trim(),
        accountId: accountId.trim(),
        stripeAccountId: accountId.trim(),
      };

      await saveStripeKeys(payload);
      toast.success("Stripe settings saved");
      setSecretKey(secretKey.trim());
      setHasStoredSecret(true);
      setStripeConfigured(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to save Stripe settings");
    } finally {
      setStripeSaving(false);
    }
  };

  const handleStripeDelete = async () => {
    if (!window.confirm("Remove saved Stripe keys? This cannot be undone.")) return;

    try {
      await deleteStripeKeys();
      setPublicKey("");
      setSecretKey("");
      setAccountId("");
      setHasStoredSecret(false);
      setStripeConfigured(false);
      toast.success("Stripe keys removed");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to remove keys");
    }
  };
  

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto bg-[#faf8ff] font-sans text-[#131b2e]">
      <header className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-2 font-headline">
          Account Settings
        </h1>
        <p className="text-[#424754] text-lg">
          Configure your hostel's profile, automated intelligence, and financial integrations.
        </p>
      </header>

      <div className="mb-6">
        <label className="block text-xs font-bold text-[#424754] uppercase tracking-widest mb-2">Selected Hostel</label>
        <select
          value={selectedHostelId}
          onChange={(e) => setSelectedHostelId(e.target.value)}
          className="bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 min-w-[260px] focus:ring-2 focus:ring-[#0058be]/20 outline-none"
        >
          {hostels.length === 0 && <option value="">No hostels available</option>}
          {hostels.map((h) => (
            <option key={h._id} value={h._id}>{h.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#eaedff]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-[#131b2e]">General Profile</h2>
                <p className="text-sm text-[#424754]">Update your public hostel identity.</p>
              </div>
              <UserCircle className="text-[#0058be] w-8 h-8" />
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#424754] tracking-wide uppercase">Hostel Name</label>
                  <input
                    className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                    type="text"
                    value={hostelName}
                    onChange={(e) => setHostelName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#424754] tracking-wide uppercase">Contact Email</label>
                  <input
                    className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="owner@hostel.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#424754] tracking-wide uppercase">Bio / Description</label>
                <textarea
                  className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileUpdating || !selectedHostelId}
                  className="px-6 py-3 bg-[#e2e7ff] text-[#0058be] font-bold rounded-full hover:bg-[#dae2fd] transition-colors disabled:opacity-50"
                >
                  {profileUpdating ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </div>
          </section>
          
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm overflow-hidden relative border border-[#eaedff]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0058be]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h2 className="text-2xl font-extrabold text-[#131b2e]">Payment Integration</h2>
                <p className="text-sm text-[#424754]">Connect your Stripe account for instant payouts.</p>
              </div>
              <Landmark className="text-[#424754] w-8 h-8" />
            </div>

            {stripeLoading ? (
              <div className="relative z-10 text-sm text-[#424754]">Loading Stripe settings...</div>
            ) : (
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#424754]">Stripe Publishable Key</label>
                    <span className="text-[10px] text-[#727785] uppercase font-bold">Public</span>
                  </div>
                  <input
                    className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 font-mono text-sm outline-none"
                    placeholder="pk_live_..."
                    type="text"
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    disabled={stripeConfigured}
                  />
                  <p className="text-xs text-[#424754] px-1 italic">Used for client-side checkout flows.</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-[#424754]">Stripe Secret Key</label>
                    <span className="text-[10px] text-[#ba1a1a] uppercase font-bold">Confidential</span>
                  </div>
                  <div className="relative">
                    <input
                      className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 font-mono text-sm pr-12 outline-none"
                      type={showSecret ? "text" : "password"}
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder={hasStoredSecret ? "************" : "sk_live_..."}
                      disabled={stripeConfigured}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#727785] hover:text-[#0058be]"
                      disabled={stripeConfigured && !secretKey}
                    >
                      {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#424754]">Connected Account ID (optional)</label>
                  <input
                    className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 font-mono text-sm outline-none"
                    type="text"
                    placeholder="acct_..."
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    disabled={stripeConfigured}
                  />
                </div>

                {stripeConfigured && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    Stripe keys are configured. Fields are locked for safety. Remove keys to add new ones.
                  </p>
                )}

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={loadStripe}
                    className="py-3 bg-[#e2e7ff] text-[#0058be] font-extrabold rounded-2xl"
                  >
                    Reload
                  </button>
                  <button
                    type="button"
                    onClick={handleStripeDelete}
                    className="py-3 bg-red-100 text-red-700 font-extrabold rounded-2xl"
                  >
                    Remove Keys
                  </button>
                  <button
                    type="button"
                    disabled={stripeSaving || stripeConfigured}
                    onClick={handleStripeSave}
                    className="py-3 bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0058be]/20 disabled:opacity-50"
                  >
                    {stripeConfigured ? "Stripe Connected" : stripeSaving ? "Saving..." : "Save Stripe"}
                  </button>
                </div>

                <button
                  type="button"
                  disabled={stripeSaving || stripeConfigured}
                  onClick={handleStripeSave}
                  className="w-full py-4 bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0058be]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw size={20} />
                  {stripeConfigured ? "Already Connected" : stripeSaving ? "Saving..." : "Save & Connect Stripe"}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
