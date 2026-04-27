import { Sparkles, Brain, MapPin, BarChart3 } from "lucide-react";
import RecommendedHostels from "./RecommendedHostels";

const AIRecommendationPage = () => {
  return (
    <main className="min-h-screen bg-[#f4f7fb] pt-24 pb-16">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#dbe7f4] bg-white shadow-[0_10px_40px_rgba(35,87,132,0.12)] p-6 sm:p-10 mb-8">
          <div className="absolute -top-12 -right-10 w-44 h-44 rounded-full bg-[#d6e7f6] blur-2xl" />
          <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-[#dce9fb] blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black tracking-[0.18em] uppercase text-[#235784] bg-[#e7f0f8] px-3 py-1 rounded-full">
                <Sparkles size={14} />
                AI Recommendation Lab
              </p>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-[#1f2a37]">
                Find Hostels That Match Your Personality
              </h1>
              <p className="mt-3 text-[#526173] max-w-2xl">
                Every card below blends your personality profile with hostel environment signals to compute a compatibility score.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-[#235784] to-[#1a3f57] text-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-[#d8e6f4] text-xs font-semibold uppercase tracking-wide">
                  <Brain size={14} />
                  Personality Fit
                </div>
                <div className="mt-1 text-lg font-bold">Weighted</div>
              </div>
              <div className="rounded-2xl bg-[#eef5fb] text-[#1f2a37] px-4 py-3 border border-[#d7e6f5]">
                <div className="flex items-center gap-2 text-[#235784] text-xs font-semibold uppercase tracking-wide">
                  <BarChart3 size={14} />
                  Match Score
                </div>
                <div className="mt-1 text-lg font-bold">Live %</div>
              </div>
              <div className="rounded-2xl bg-[#eef5fb] text-[#1f2a37] px-4 py-3 border border-[#d7e6f5] col-span-2">
                <div className="flex items-center gap-2 text-[#235784] text-xs font-semibold uppercase tracking-wide">
                  <MapPin size={14} />
                  Location + Lifestyle + Budget Context
                </div>
                <div className="mt-1 text-sm font-semibold">Balanced ranking across hostel dimensions</div>
              </div>
            </div>
          </div>
        </div>

        <RecommendedHostels />
      </section>
    </main>
  );
};

export default AIRecommendationPage;
