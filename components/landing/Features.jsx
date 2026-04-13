import React from 'react';
import { Wifi, MapPin, ShieldCheck, BookOpen, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FeaturesSection = () => {
    const navigate = useNavigate();
    const features = [
        {
            icon: <Wifi className="text-blue-600" size={28} />,
            title: "High-speed campus-wide WiFi included"
        },
        {
            icon: <MapPin className="text-blue-600" size={28} />,
            title: "Premium locations near major universities"
        },
        {
            icon: <ShieldCheck className="text-blue-600" size={28} />,
            title: "24/7 Security and verified property owners"
        },
        {
            icon: <BookOpen className="text-blue-600" size={28} />,
            title: "Dedicated study zones and library spaces"
        }
    ];

    return (
        <section className="w-full flex flex-col lg:flex-row min-h-[600px] bg-white overflow-hidden">
            {/* Left Content Side */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
                    Smart features for the modern student
                </h2>

                <p className="text-slate-500 text-base md:text-lg mb-12 max-w-xl leading-relaxed">
                    Intellistay provides completely digitized hostel booking, smart roommate matching,
                    and premium amenities to ensure that your academic life is completely stress-free.
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 mb-12">
                    {features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-4">
                            <div className="flex-shrink-0 mt-1">
                                {feature.icon}
                            </div>
                            <span className="text-slate-700 text-sm md:text-base leading-snug">
                                {feature.title}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <button
                        onClick={() => navigate('/hostels')}
                        className="btn  hover:bg-[#1e4161] text-white !px-8 py-3 rounded-md font-semibold transition-all"
                    >
                        Find Hostels
                    </button>
                    <button
                        onClick={() => navigate('/about')}
                        className="flex items-center gap-2 text-[#2b5a84] font-semibold hover:gap-3 transition-all"
                    >
                        More about us <ArrowRight size={18} />
                    </button>
                </div>
            </div>

            {/* Right Image/Video Side */}
            <div className="w-full lg:w-1/2 relative min-h-[400px]">

                <div className="absolute h-full w-full inset-0">
                    <img
                        src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1000"
                        alt="Students laughing and studying in hostel"
                        className="w-full h-full object-fit"
                    />
                </div>

                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <button className="w-20 h-20 bg-white/30 backdrop-blur-sm border-2 border-white rounded-full flex items-center justify-center hover:scale-110 transition-transform">
                        <Play className="text-white fill-white ml-1" size={32} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default FeaturesSection;