import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

export default function ContactSection() {
  const contactIconBoxClass =
    "w-[50px] h-[50px] rounded-[10px] bg-gradient-to-br from-[#235784] to-[#1a3f57] text-white flex items-center justify-center shrink-0";

  return (
    <section className="bg-gray-100 py-20">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left Content */}
        <div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Contacts</h2>

          <p className="text-gray-600 max-w-md mb-10">
            Contact us for any help.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Phone */}
            <div className="flex gap-4">
              <div className={contactIconBoxClass}>
                <FaPhoneAlt size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                <p className="text-gray-600 text-sm">(329) 580-7077</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4">
              <div className={contactIconBoxClass}>
                <FaEnvelope size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                <p className="text-gray-600 text-sm">info@intellistay.com</p>
              </div>
            </div>

            {/* Location */}
            <div className="flex gap-4">
              <div className={contactIconBoxClass}>
                <FaMapMarkerAlt size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Location</h4>
                <p className="text-gray-600 text-sm">
                  Bahria University <br />
                  Islamabad Campus
                </p>
              </div>
            </div>

            {/* Working Time */}
            <div className="flex gap-4">
              <div className={contactIconBoxClass}>
                <FaClock size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">
                  Working Time
                </h4>
                <p className="text-gray-600 text-sm">
                  Everyday <br />
                  10 am — 5 pm
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Map */}
        <div className="w-full h-[420px] rounded-lg overflow-hidden">
          <iframe
            title="map"
            src="https://www.google.com/maps?q=33.71558,73.02891&output=embed
"
            className="w-full h-full border-0"
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
