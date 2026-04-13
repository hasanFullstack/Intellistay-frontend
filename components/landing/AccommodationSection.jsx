import React from 'react';
import { Building2, Users, BedDouble, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccommodationSection = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: <Building2 size={24} className="text-white" />,
      title: "Verified Hostels",
      desc: "Every property is strictly vetted for safety, cleanliness, and comfort."
    },
    {
      icon: <Users size={24} className="text-white" />,
      title: "Smart AI Matching",
      desc: "We use AI to pair you with compatible roommates for a peaceful stay."
    },
    {
      icon: <BedDouble size={24} className="text-white" />,
      title: "Seamless Booking",
      desc: "Instantly reserve your bed online and manage all your bookings digitally."
    }
  ];

  return (
    <section className="w-full bg-slate-50 py-20 px-6 lg:px-24">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative">

        {/* Left Content Column */}
        <div className="w-full lg:w-1/2 z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Find the perfect student accommodation
          </h2>
          <p className="text-slate-500 mb-12 max-w-lg leading-relaxed">
            Our intelligent platform maps you to the best hostels based on your personality, 
            commute preferences, and study habits to ensure a productive and seamless living experience.
          </p>

          {/* Icon List */}
          <div className="space-y-8">
            {features.map((item, idx) => (
              <div key={idx} className="flex items-start gap-5">
                <div className="bg-[#2b5a84] p-4 rounded-lg shadow-lg">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{item.title}</h3>
                  <p className="text-slate-500 text-sm max-w-[90%]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Image with Floating Card */}
        <div className="w-full lg:w-1/2 relative h-[500px] lg:h-[600px]">
          {/* Main Background Image */}
          <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl">
            <img
              src="https://images.pexels.com/photos/271618/pexels-photo-271618.jpeg?auto=compress&cs=tinysrgb&w=1000"
              alt="Modern hostel dorm room"
              className="w-full h-full object-cover"
            />
          </div>

          {/* The Overlapping Floating Card */}
          <div className="absolute top-1/2 -left-4 md:-left-12 lg:-left-20 -translate-y-1/2 bg-white p-8 md:p-10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-[260px] md:w-[320px] z-20">
            <h4 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight mb-4">
              Premium Shared Dormitory
            </h4>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-3xl md:text-4xl font-bold text-slate-900">Rs 15,000</span>
              <span className="text-slate-400 text-sm">/ month</span>
            </div>
            <button 
              onClick={() => navigate('/hostels')}
              className="w-full bg-blue-50 text-[#2b5a84] hover:bg-blue-100 font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              Browse Hostels
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AccommodationSection;