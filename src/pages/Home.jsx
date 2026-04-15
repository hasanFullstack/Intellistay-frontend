import { useEffect, useState } from "react";
import AOS from "aos";
import { getAllHostels } from "../api/hostel.api";
import { getRoomsByHostel } from "../api/room.api";
import HostelHero from "../../components/landing/HostelHero";
import RoomSection from "../../components/landing/RoomSection";
import FeaturesSection from "../../components/landing/Features";
import AccommodationSection from "../../components/landing/AccommodationSection";
import FeaturedHostels from "../../components/landing/FeaturedHostels";
import ContactsSection from "../../components/ContactSection";
import { toast } from "react-toastify";

const Home = () => {
  const [hostels, setHostels] = useState([]);
  const [hostelRooms, setHostelRooms] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ duration: 900, once: true });

    const fetchData = async () => {
      try {
        const hostelRes = await getAllHostels();
        const hostelsData = hostelRes.data || [];
        setHostels(hostelsData);

        // Fetch rooms for each hostel
        const roomsData = {};
        for (const hostel of hostelsData) {
          const roomRes = await getRoomsByHostel(hostel._id);
          roomsData[hostel._id] = roomRes.data || [];
        }
        setHostelRooms(roomsData);
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMinPrice = (hostelId) => {
    const rooms = hostelRooms[hostelId] || [];
    if (rooms.length === 0) return "N/A";
    const prices = rooms.map((r) => r.pricePerBed);
    return Math.min(...prices);
  };

  const getAvailableRoomsCount = (hostelId) => {
    const rooms = hostelRooms[hostelId] || [];
    return rooms.filter((r) => r.availableBeds > 0).length;
  };

  return (
    <div>
      {/* HERO SECTION */}
      <HostelHero />
      <FeaturedHostels />
      <RoomSection />
      <FeaturesSection />
      <AccommodationSection />
      <ContactsSection />
    </div>
  );
};

export default Home;
