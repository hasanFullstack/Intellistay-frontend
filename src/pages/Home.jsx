import { useEffect } from "react";
import AOS from "aos";
import HostelHero from "../../components/landing/HostelHero";
import RoomSection from "../../components/landing/RoomSection";
import FeaturesSection from "../../components/landing/Features";
import AccommodationSection from "../../components/landing/AccommodationSection";
import FeaturedHostels from "../../components/landing/FeaturedHostels";
import ContactsSection from "../../components/ContactSection";
import OwnerCtaBanner from "../../components/OwnerCtaBanner";

const Home = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <div>
      {/* HERO SECTION */}
      <HostelHero />
      <FeaturedHostels />
      <RoomSection />
      <FeaturesSection />
      <AccommodationSection />

      <ContactsSection />
      <div style={{ padding: "16px 0" }}>
        <OwnerCtaBanner />
      </div>
    </div>
  );
};

export default Home;
