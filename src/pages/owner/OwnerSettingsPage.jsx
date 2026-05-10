import { useEffect, useMemo, useState } from "react";
import { UserCircle, Landmark, RefreshCw, CheckCircle2, ExternalLink, Unlink } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { updateProfile } from "../../api/user.api";
import { toast } from "react-toastify";
import {
  startConnectOnboarding,
  getConnectStatus,
  createStripeDashboardLink,
  disconnectStripe,
} from "../../api/ownerStripe.api";
import { getErrorMessage } from "../../utils/getErrorMessage";


export default function OwnerSettingsPage({ hostels = [], onDataRefresh }) {
  const { user, updateUser } = useAuth();

  const [ownerName, setOwnerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState("");
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [avatarHover, setAvatarHover] = useState(false);


  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeConnecting, setStripeConnecting] = useState(false);
  const [stripeOpeningDashboard, setStripeOpeningDashboard] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(false);

  useEffect(() => {
    // keep in sync if auth user updates
    if (!user) return;
    setOwnerName(user.name || "");
    setContactEmail(user.email || "");
    setPhone(user.phone || "");
    setImage(user.image || "");
  }, [user]);

  const loadStripeStatus = async () => {
    try {
      setStripeLoading(true);
      const res = await getConnectStatus();
      const data = res?.data || {};
      setStripeConnected(Boolean(data.connected));
      setStripeAccountId(data.accountId || null);
      setStripeOnboardingComplete(Boolean(data.onboardingComplete));
    } catch (err) {
      setStripeConnected(false);
      setStripeAccountId(null);
      setStripeOnboardingComplete(false);
    } finally {
      setStripeLoading(false);
    }
  };

  useEffect(() => {
    loadStripeStatus();
  }, []);

  const handleProfileSave = async () => {
    if (!ownerName.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setProfileUpdating(true);
      const payload = {
        name: ownerName.trim(),
        email: contactEmail.trim(),
        phone: phone.trim(),
        image: image || "",
      };
      const res = await updateProfile(payload);
      const updatedUser = res?.data?.user || res?.data || null;
      if (updatedUser && updateUser) updateUser(updatedUser);
      toast.success("Profile updated");
      if (onDataRefresh) await onDataRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setProfileUpdating(false);
    }
  };



  const handleConnectStripe = async () => {
    try {
      setStripeConnecting(true);
      const res = await startConnectOnboarding();
      const { url } = res?.data || {};
      if (!url) throw new Error("No onboarding URL returned");
      // Redirect the owner to Stripe's hosted onboarding page
      window.location.href = url;
    } catch (err) {
      const code = err?.response?.data?.code;
      if (code === "CONNECT_NOT_ENABLED") {
        toast.error(
          "Stripe Connect is not enabled on the platform account. Enable it at dashboard.stripe.com/connect, then try again.",
        );
      } else {
        toast.error(getErrorMessage(err, "Failed to start Stripe onboarding"));
      }
      setStripeConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!window.confirm("Disconnect your Stripe account? Students will pay through the platform account instead.")) return;
    try {
      await disconnectStripe();
      setStripeConnected(false);
      setStripeAccountId(null);
      setStripeOnboardingComplete(false);
      toast.success("Stripe account disconnected");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to disconnect Stripe"));
    }
  };

  const handleOpenStripeDashboard = async () => {
    try {
      setStripeOpeningDashboard(true);
      const res = await createStripeDashboardLink();
      const { url } = res?.data || {};
      if (!url) throw new Error("No Stripe dashboard URL returned");
      window.location.href = url;
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to open Stripe dashboard"));
    } finally {
      setStripeOpeningDashboard(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-[#eaedff]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-[#131b2e]">General Profile</h2>
                <p className="text-sm text-[#424754]">Update your public hostel identity.</p>
              </div>
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden bg-[#eaf1ff] cursor-pointer hover:ring-2 hover:ring-[#0058be]/20 transition-all"
                onClick={() => document.getElementById("owner-image-file").click()}
                onMouseEnter={() => setAvatarHover(true)}
                onMouseLeave={() => setAvatarHover(false)}
              >
                <img src={image ? image : "/profile.jpg"} alt="Owner" className="w-full h-full object-cover" />
                <div className={`absolute bg-black inset-0 h-full w-full z-50 flex items-center justify-center transition-opacity pointer-events-none ${avatarHover ? "opacity-80" : "opacity-0"}`}>
                  <span className="text-sm text-white font-semibold">Change</span>
                </div>
              </div>
            </div>

            <div className="mb-6">

              <div className="flex items-center gap-4">
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-widest mb-2">Name</label>
                  <input
                    className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-xs font-bold text-[#424754] uppercase tracking-widest mb-2">Email</label>
                  <input
                    className="w-full mt-2 bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <input
                id="owner-image-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    setImage(reader.result);
                  };
                  reader.readAsDataURL(file);
                }}
              />
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#424754] tracking-wide uppercase">Phone Number</label>
                <input
                  className="w-full bg-[#f2f3ff] border-none rounded-2xl px-4 py-3 focus:ring-2 focus:ring-[#0058be]/20 outline-none"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g., +92 300 1234567"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProfileSave}
                  disabled={profileUpdating}
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
              <div className="relative z-10 text-sm text-[#424754] animate-pulse">Loading payment status...</div>
            ) : (
              <div className="space-y-5 relative z-10">
                {stripeConnected ? (
                  <>
                    <div className={`flex items-start gap-3 p-4 rounded-2xl border ${stripeOnboardingComplete ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
                      <CheckCircle2 size={20} className={`mt-0.5 shrink-0 ${stripeOnboardingComplete ? "text-emerald-600" : "text-amber-500"}`} />
                      <div>
                        <p className={`text-sm font-bold ${stripeOnboardingComplete ? "text-emerald-800" : "text-amber-800"}`}>
                          {stripeOnboardingComplete ? "Stripe account active" : "Onboarding incomplete"}
                        </p>
                        <p className="text-xs text-[#424754] mt-0.5 font-mono break-all">{stripeAccountId}</p>
                        {!stripeOnboardingComplete && (
                          <p className="text-xs text-amber-700 mt-1">Finish setting up your Stripe account to receive payouts.</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-[#424754] leading-relaxed">
                      Student payments are routed directly to your Stripe account. The platform only retains the service fee.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {stripeOnboardingComplete && (
                        <button
                          type="button"
                          disabled={stripeOpeningDashboard}
                          onClick={handleOpenStripeDashboard}
                          className="py-3 flex items-center justify-center gap-2 bg-[#eaf1ff] text-[#0058be] font-extrabold rounded-2xl border border-[#cfe0ff] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <ExternalLink size={16} />
                          {stripeOpeningDashboard ? "Opening..." : "Open Stripe Dashboard"}
                        </button>
                      )}
                      {!stripeOnboardingComplete && (
                        <button
                          type="button"
                          disabled={stripeConnecting}
                          onClick={handleConnectStripe}
                          className="py-3 flex items-center justify-center gap-2 bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0058be]/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                          <ExternalLink size={16} />
                          {stripeConnecting ? "Redirecting..." : "Complete Setup"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDisconnectStripe}
                        className={`py-3 flex items-center justify-center gap-2 bg-red-50 text-red-700 font-extrabold rounded-2xl border border-red-200 active:scale-[0.98] transition-all ${stripeOnboardingComplete ? "col-span-2" : ""}`}
                      >
                        <Unlink size={16} />
                        Disconnect
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#f2f3ff] rounded-2xl p-4 text-sm text-[#424754] space-y-2">
                      <p className="font-bold text-[#131b2e]">How it works</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs leading-relaxed">
                        <li>Click below — you'll be taken to Stripe's secure onboarding page.</li>
                        <li>Enter your bank details on Stripe (we never see this).</li>
                        <li>Return here — your account is linked and payouts are automatic.</li>
                      </ol>
                    </div>
                    <p className="text-xs text-[#424754]">
                      No Stripe account? One will be created for you. If you skip this, all payments stay on the platform account.
                    </p>
                    <button
                      type="button"
                      disabled={stripeConnecting}
                      onClick={handleConnectStripe}
                      className="w-full py-4 bg-gradient-to-br from-[#0058be] to-[#6b38d4] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0058be]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ExternalLink size={20} />
                      {stripeConnecting ? "Redirecting to Stripe..." : "Connect with Stripe"}
                    </button>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
