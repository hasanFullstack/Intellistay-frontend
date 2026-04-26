import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Store, BedDouble, CreditCard, ListChecks } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { getOwnerOnboardingProgress } from "../utils/ownerOnboarding";

const StepCard = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5fb] text-[#235784]">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-[#1b4565]">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-[#555]">{description}</p>
  </div>
);

export default function BecomeOwner() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [hostelsCount, setHostelsCount] = useState(0);
  const [hasRooms, setHasRooms] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [environmentCompleted, setEnvironmentCompleted] = useState(false);

  const loadOwnerChecklist = useCallback(async () => {
    if (user?.role !== "owner") return;
    setLoading(true);

    try {
      const progress = await getOwnerOnboardingProgress();
      setHostelsCount(progress.hostelsCount);
      setHasRooms(progress.hasRooms);
      setStripeConnected(progress.stripeConnected);
      setEnvironmentCompleted(progress.environmentCompleted);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadOwnerChecklist();
  }, [loadOwnerChecklist]);

  const checklist = useMemo(
    () => [
      {
        key: "add-hostel",
        label: "Add hostel",
        done: hostelsCount > 0,
        actionLabel: "Go to Add Hostel",
      },
      {
        key: "add-rooms",
        label: "Add rooms",
        done: hasRooms,
        actionLabel: "Go to Rooms",
      },
      {
        key: "connect-stripe",
        label: "Connect Stripe",
        done: stripeConnected,
        actionLabel: "Go to Stripe Setup",
      },
      {
        key: "environment-profile",
        label: "Complete environment profile",
        done: environmentCompleted,
        actionLabel: "Go to Environment Profile",
      },
    ],
    [hostelsCount, hasRooms, stripeConnected, environmentCompleted],
  );

  const completedCount = checklist.filter((s) => s.done).length;

  const goRegisterOwner = () => {
    navigate("/login", {
      state: {
        from: "/become-owner",
        authMode: "register",
        role: "owner",
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-[rgba(35,87,132,0.12)] bg-gradient-to-b from-white to-[#f7fafc] p-6 shadow-[0_16px_40px_rgba(35,87,132,0.08)] sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1b4565] sm:text-4xl">Become an Owner</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#555] sm:text-lg">
          List your hostel on IntelliStay and start receiving student bookings. Follow the onboarding flow below to
          activate your owner profile.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StepCard
            icon={<Store size={20} />}
            title="Approval flow"
            description="Register as an owner and create your first hostel profile. Keep details complete and accurate for faster approval."
          />
          <StepCard
            icon={<CreditCard size={20} />}
            title="Stripe onboarding"
            description="Connect your Stripe account in owner settings so payouts can be routed to your account."
          />
          <StepCard
            icon={<BedDouble size={20} />}
            title="Add inventory"
            description="Create rooms, set beds and pricing, and keep availability updated for better visibility."
          />
          <StepCard
            icon={<ListChecks size={20} />}
            title="Environment profile"
            description="Complete hostel environment profile to improve matching and recommendations quality."
          />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-[#1b4565]">Owner onboarding checklist</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#eef5fb] px-3 py-1 text-sm font-semibold text-[#235784]">
                {completedCount}/4 completed
              </span>
              {completedCount === 4 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  <CheckCircle2 size={14} />
                  Onboarding complete
                </span>
              )}
            </div>
          </div>

          {!user && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-[#555]">Create an owner account to start onboarding.</p>
              <button
                type="button"
                onClick={goRegisterOwner}
                className="rounded-xl bg-gradient-to-br from-[#235784] to-[#1b4565] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
              >
                Register as Owner
              </button>
            </div>
          )}

          {user && user.role !== "owner" && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <p className="text-sm text-[#555]">You are logged in as a student. Switch to an owner account to continue.</p>
              <button
                type="button"
                onClick={goRegisterOwner}
                className="rounded-xl bg-gradient-to-br from-[#235784] to-[#1b4565] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
              >
                Create Owner Account
              </button>
            </div>
          )}

          {user?.role === "owner" && (
            <div className="mt-5 space-y-3">
              {checklist.map((step) => (
                <div
                  key={step.key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-[#1f2a44]">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-semibold">
                      {step.done ? (
                        <>
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="text-green-700">Done</span>
                        </>
                      ) : (
                        <>
                          <Circle size={16} className="text-slate-400" />
                          <span className="text-slate-500">Pending</span>
                        </>
                      )}
                    </span>

                    {!step.done && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate("/dashboard/owner", {
                            state: { onboardingStep: step.key },
                          })
                        }
                        className="rounded-lg bg-[#eef5fb] px-3 py-1.5 text-xs font-bold text-[#235784] hover:bg-[#e2eef9]"
                      >
                        {step.actionLabel}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/owner")}
                  className="rounded-xl bg-gradient-to-br from-[#235784] to-[#1b4565] px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95"
                >
                  Go to Dashboard
                </button>
                <button
                  type="button"
                  onClick={loadOwnerChecklist}
                  disabled={loading}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#1f2a44] hover:bg-slate-50 disabled:opacity-60"
                >
                  {loading ? "Refreshing..." : "Refresh checklist"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
