import { useEffect, useMemo, useState } from "react";
import {
  UserCircle,
  Sparkles,
  Zap,
  Landmark,
  Eye,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  EyeOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { updateHostel } from "../../api/hostel.api";
import {
  getStripeKeys,
  saveStripeKeys,
  deleteStripeKeys,
} from "../../api/ownerStripe.api";

const RULES_KEY = "owner_ai_pricing_rules";

const readStoredRules = () => {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeStoredRules = (payload) => {
  localStorage.setItem(RULES_KEY, JSON.stringify(payload));
};

export default function OwnerSettingsPage({ hostels = [], onDataRefresh }) {
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const [hostelName, setHostelName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [description, setDescription] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);

  const [autoPricing, setAutoPricing] = useState(true);
  const [floorPrice, setFloorPrice] = useState(2400);
  const [ceilingPrice, setCeilingPrice] = useState(8500);

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

    const stored = readStoredRules();
    const rules = stored[selectedHostel._id] || {};
    setAutoPricing(typeof rules.autoPricing === "boolean" ? rules.autoPricing : true);
    setFloorPrice(Number.isFinite(rules.floorPrice) ? rules.floorPrice : 2400);
    setCeilingPrice(Number.isFinite(rules.ceilingPrice) ? rules.ceilingPrice : 8500);
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

  const handleSaveRules = () => {
    if (floorPrice <= 0 || ceilingPrice <= 0) {
      toast.error("Floor and ceiling prices must be positive");
      return;
    }
    if (floorPrice > ceilingPrice) {
      toast.error("Floor price cannot be above ceiling price");
      return;
    }
    if (!selectedHostel?._id) {
      toast.error("No hostel selected");
      return;
    }

    const stored = readStoredRules();
    stored[selectedHostel._id] = {
      autoPricing,
      floorPrice,
      ceilingPrice,
    };
    writeStoredRules(stored);
    toast.success("AI pricing rules saved");
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

  const openSupport = () => {
    window.open("mailto:support@intellistay.app?subject=Owner%20Settings%20Support", "_blank");
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

          <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#0058be]/5 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none shadow-[0_0_20px_0_rgba(107,56,212,0.1)]" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-[#131b2e] flex items-center gap-2">
                  AI Pricing Rules
                  <span className="text-[10px] bg-[#6b38d4] text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Pro</span>
                </h2>
                <p className="text-sm text-[#424754]">Dynamic automation based on market demand.</p>
              </div>
              <Sparkles className="text-[#6b38d4] w-8 h-8" />
            </div>

            <div className="space-y-8">
              <div className="flex items-center justify-between p-6 bg-[#f2f3ff] rounded-2xl border border-[#6b38d4]/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#6b38d4]/10 flex items-center justify-center text-[#6b38d4]">
                    <Zap size={24} fill="currentColor" />
                  </div>
                  <div>
                    <p className="font-bold text-[#131b2e]">Enable AI Auto-Pricing</p>
                    <p className="text-sm text-[#424754]">Let IntelliStay adjust rates automatically.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPricing}
                    onChange={(e) => setAutoPricing(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-14 h-8 bg-[#d2d9f4] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#6b38d4]"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#f2f3ff] rounded-2xl">
                  <label className="block text-xs font-black text-[#424754] uppercase tracking-tighter mb-1">Floor Price (Min)</label>
                  <div className="text-2xl font-black text-[#131b2e]">Rs {floorPrice.toLocaleString()}</div>
                  <input
                    className="w-full h-1 bg-[#d2d9f4] rounded-lg appearance-none cursor-pointer accent-[#6b38d4] mt-2"
                    type="range"
                    min={500}
                    max={20000}
                    step={100}
                    value={floorPrice}
                    onChange={(e) => setFloorPrice(Number(e.target.value))}
                  />
                </div>
                <div className="p-4 bg-[#f2f3ff] rounded-2xl">
                  <label className="block text-xs font-black text-[#424754] uppercase tracking-tighter mb-1">Ceiling Price (Max)</label>
                  <div className="text-2xl font-black text-[#131b2e]">Rs {ceilingPrice.toLocaleString()}</div>
                  <input
                    className="w-full h-1 bg-[#d2d9f4] rounded-lg appearance-none cursor-pointer accent-[#6b38d4] mt-2"
                    type="range"
                    min={1000}
                    max={50000}
                    step={100}
                    value={ceilingPrice}
                    onChange={(e) => setCeilingPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveRules}
                  disabled={!selectedHostelId}
                  className="px-6 py-3 bg-[#6b38d4] text-white font-bold rounded-full hover:opacity-90 transition-all disabled:opacity-50"
                >
                  Save AI Rules
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

          <section className="bg-[#e2e7ff] p-8 rounded-2xl">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center">
                <HelpCircle className="text-[#0058be] w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-[#131b2e]">Need help with setup?</h3>
              <p className="text-[#424754] text-sm">
                Our 24/7 technical team can help you map your rooms or connect custom domains.
              </p>
              <button
                type="button"
                onClick={openSupport}
                className="text-[#0058be] font-bold hover:underline flex items-center gap-1"
              >
                Open Live Chat
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
