import React, { useEffect, useState } from 'react';
import { User, Bed, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllRooms } from '../../src/api/room.api';

const RoomSection = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await getAllRooms({ params: { limit: 2 } });
        const data = Array.isArray(res?.data) ? res.data : [];
        // show latest 2 rooms
        if (mounted) setRooms(data);
      } catch {
        if (mounted) setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 bg-white font-sans">
      {/* Header Row */}
      <div className="flex justify-between items-end mb-10">
        <h2 className="text-4xl font-bold text-slate-900">Hostel rooms</h2>
        <button
          onClick={() => navigate('/rooms')}
          className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition-colors"
        >
          View all rooms
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <p className="text-center text-sm text-gray-500">Loading rooms...</p>
        ) : (
          rooms.map((room) => (
            <div key={room._id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col" >
            {/* Image Container */}
            <div className="relative h-64">
              <img
                src={(room?.images && room.images.length > 0) ? room.images[0] : `https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800`}
                alt={room.description || room.roomType}
                className="w-full h-full object-cover"
              />
              {/* Price Tag */}
              <div className="absolute bottom-4 right-0 bg-white px-4 py-2 rounded-l-md shadow-md">
                <span className="text-xl font-bold text-slate-900">Rs. {room.pricePerBed || room.price}</span>
                <span className="text-xs text-slate-500 ml-1">/ per bed</span>
              </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-bold text-slate-900 mb-4 leading-snug">
                {room.description || `${room.roomType} Room`}
              </h3>
              {room.hostelId?.name && (
                <p className="text-xs text-slate-400 mb-3">{room.hostelId.name}{room.hostelId.city ? `, ${room.hostelId.city}` : ''}</p>
              )}
              <div className="flex items-center gap-6 mb-8 text-slate-500 text-sm">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-slate-400" />
                  <span>{room.totalBeds} bed{room.totalBeds > 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed size={18} className="text-slate-400" />
                  <span>{room.roomType}</span>
                </div>
              </div>

              <button onClick={(e) => { e.stopPropagation(); navigate(`/room/${room._id}/${room.hostelId?._id || room.hostelId}`); }} className="mt-auto flex items-center gap-2 text-[#2b5a84] font-semibold hover:gap-3 transition-all">
                See availability <ArrowRight size={18} />
              </button>
            </div>
          </div>
          ))
        )}

        {/* Promo Blue Card */}
        <div className="bg-[#2b5a84] rounded-xl p-8 text-white flex flex-col justify-between">
          <div>
            <h3 className="text-3xl font-bold mb-3 leading-tight">
              Find Your
              <br />Perfect Match
            </h3>
            <p className="text-blue-100 mb-6 text-sm leading-relaxed">
              IntelliStay uses AI to match you with the right hostel room based on your personality and lifestyle.
            </p>

            <div className="space-y-3 border-l border-blue-400/50 pl-4 py-2">
              <div className="flex items-start gap-2">
                <span className="text-blue-300 mt-0.5">✦</span>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold">Personality quiz</span> — we learn your habits, study style &amp; social preferences
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-300 mt-0.5">✦</span>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold">AI recommendations</span> — rooms ranked by compatibility score
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-300 mt-0.5">✦</span>
                <p className="text-sm leading-relaxed">
                  <span className="font-bold">Verified hostels</span> — environment scores based on real resident data
                </p>
              </div>
            </div>
          </div>

          <button onClick={() => navigate('/personality-quiz')} className="mt-8 w-full bg-blue-50 text-[#2b5a84] font-bold py-3 rounded-lg hover:bg-white transition-colors">
            Take the Quiz →
          </button>
        </div>
      </div>
    </section>
  );
};

export default RoomSection;