import { Building2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../src/auth/AuthContext";

const OwnerCtaBanner = ({ className = "" }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (user?.role === "owner") {
      navigate("/dashboard/owner");
      return;
    }

    navigate("/become-owner");
  };

  return (
    <section className={`w-full max-w-[1280px] mx-auto px-4 ${className}`.trim()}>
      <div className="flex items-center justify-between gap-6 rounded-3xl border border-[rgba(35,87,132,0.12)] bg-gradient-to-b from-white to-[#f7fafc] px-4 py-5 shadow-[0_16px_40px_rgba(35,87,132,0.08)] sm:px-6 sm:py-6 md:gap-7 lg:px-7 lg:py-[26px] max-md:flex-col max-md:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-[18px] max-md:items-start">
          <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[14px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-[0_12px_24px_rgba(35,87,132,0.2)] sm:h-[62px] sm:w-[62px] sm:rounded-2xl">
            <Building2 size={28} strokeWidth={2.2} />
          </div>

          <div>
            <h2 className="font-[var(--font-headline)] text-[1.5rem] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--color-primary-dark)] sm:text-[1.7rem] lg:text-[1.85rem]">
              Are you a Hostel Owner?
            </h2>
            <p className="mt-2 font-[var(--font-sans)] text-[0.98rem] leading-7 text-[var(--color-gray-text)] sm:text-[1.05rem] lg:text-[1.1rem]">
              List your hostel for free and reach thousands of students and professionals.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="inline-flex min-w-[220px] shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] px-7 py-4 font-[var(--font-sans)] text-base font-bold text-white shadow-[0_14px_28px_rgba(35,87,132,0.18)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(35,87,132,0.24)] max-md:w-full max-md:min-w-0"
        >
          List Your Hostel
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
};

export default OwnerCtaBanner;
