import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useMemo } from "react";

// Floating particle component
const Particle = ({ delay, size, x, y, duration }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
      background: `radial-gradient(circle, rgba(163,201,255,${0.15 + Math.random() * 0.2}) 0%, transparent 70%)`,
    }}
    initial={{ opacity: 0, scale: 0, y: 20 }}
    animate={{
      opacity: [0, 0.8, 0.4, 0.8, 0],
      scale: [0.5, 1.2, 0.9, 1.1, 0.5],
      y: [20, -30, -10, -40, 20],
      x: [0, 15, -10, 5, 0],
    }}
    transition={{
      duration: duration,
      delay: delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Glowing orb background element
const GlowOrb = ({ className, delay = 0 }) => (
  <motion.div
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: [0.15, 0.3, 0.15], scale: [0.8, 1.1, 0.8] }}
    transition={{ duration: 8, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const BookingSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const booking = location.state?.booking;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate particles with stable positions
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        delay: i * 0.4,
        size: 8 + Math.random() * 50,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: 6 + Math.random() * 6,
      })),
    []
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -180 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { type: "spring", stiffness: 200, damping: 12, delay: 0.1 },
    },
  };

  const dashboardPath =
    location.state?.userRole === "owner"
      ? "/dashboard/owner"
      : "/dashboard/user";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor: "#f7f9fb",
        backgroundImage: `
          radial-gradient(at 0% 0%, hsla(210, 100%, 93%, 1) 0px, transparent 50%),
          radial-gradient(at 50% 0%, hsla(215, 100%, 97%, 1) 0px, transparent 50%),
          radial-gradient(at 100% 0%, hsla(210, 100%, 93%, 1) 0px, transparent 50%),
          radial-gradient(at 50% 50%, hsla(220, 30%, 95%, 1) 0px, transparent 50%)
        `,
        fontFamily: "'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      {/* Background glow orbs */}
      <GlowOrb
        className="w-64 h-64 bg-blue-200/30 top-1/4 -left-20"
        delay={0}
      />
      <GlowOrb
        className="w-96 h-96 bg-indigo-100/25 bottom-1/4 -right-20"
        delay={2}
      />
      <GlowOrb
        className="w-48 h-48 bg-sky-200/20 top-10 right-1/3"
        delay={4}
      />

      {/* Floating particles */}
      {mounted &&
        particles.map((p) => (
          <Particle
            key={p.id}
            delay={p.delay}
            size={p.size}
            x={p.x}
            y={p.y}
            duration={p.duration}
          />
        ))}

      {/* Main content */}
      <AnimatePresence>
        {mounted && (
          <motion.div
            className="max-w-3xl w-full relative z-10 px-6 py-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Success Icon */}
            <motion.div className="text-center mb-10" variants={itemVariants}>
              <motion.div
                className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
                style={{
                  background: "linear-gradient(135deg, #003868, #194f87)",
                  boxShadow: "0 12px 40px rgba(0, 56, 104, 0.25)",
                }}
                variants={iconVariants}
              >
                <motion.span
                  className="material-symbols-outlined text-white"
                  style={{
                    fontSize: "40px",
                    fontVariationSettings: "'FILL' 1",
                  }}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  check_circle
                </motion.span>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: "#003868",
                }}
                variants={itemVariants}
              >
                Booking Confirmed!
              </motion.h1>

              <motion.p
                className="text-lg max-w-xl mx-auto leading-relaxed"
                style={{ color: "#424750" }}
                variants={itemVariants}
              >
                Your reservation has been received successfully. You'll find all
                the details in your dashboard.
              </motion.p>
            </motion.div>

            {/* Booking Summary — Bento Grid */}
            {booking && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10"
                variants={itemVariants}
              >
                {/* Main Details Card */}
                <motion.div
                  className="md:col-span-2 p-7 rounded-xl"
                  style={{
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 20px 40px rgba(25, 28, 30, 0.06)",
                    border: "1px solid rgba(195, 198, 209, 0.1)",
                  }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0px 24px 48px rgba(25, 28, 30, 0.1)",
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="flex justify-between items-start mb-7">
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-widest mb-1"
                        style={{ color: "#424750" }}
                      >
                        Stay Destination
                      </p>
                      <h2
                        className="text-2xl font-bold"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: "#003868",
                        }}
                      >
                        {booking.hostelName || "Your Hostel"}
                      </h2>
                      {booking.hostelLocation && (
                        <p
                          className="text-sm mt-1 flex items-center gap-1"
                          style={{ color: "#424750" }}
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: "16px" }}
                          >
                            location_on
                          </span>
                          {booking.hostelLocation}
                        </p>
                      )}
                    </div>
                    <motion.div
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: "#eceef0",
                        color: "#003868",
                      }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      CONFIRMED
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <div
                        className="flex items-center gap-2 mb-1"
                        style={{ color: "#424750" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          calendar_today
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Check-in
                        </span>
                      </div>
                      <p
                        className="font-semibold"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: "#191c1e",
                        }}
                      >
                        {formatDate(booking.startDate)}
                      </p>
                    </div>
                    <div>
                      <div
                        className="flex items-center gap-2 mb-1"
                        style={{ color: "#424750" }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: "16px" }}
                        >
                          calendar_month
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Check-out
                        </span>
                      </div>
                      <p
                        className="font-semibold"
                        style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif",
                          color: "#191c1e",
                        }}
                      >
                        {formatDate(booking.endDate)}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Side Cards */}
                <div className="flex flex-col gap-5">
                  {/* Beds / Room Info */}
                  <motion.div
                    className="flex-1 p-5 rounded-xl"
                    style={{
                      backgroundColor: "rgba(205, 225, 254, 0.5)",
                      border: "1px solid rgba(195, 198, 209, 0.1)",
                    }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <div
                      className="flex items-center gap-2 mb-2"
                      style={{ color: "#51647c" }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                      >
                        bed
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Room
                      </span>
                    </div>
                    <p
                      className="text-xl font-bold"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: "#35485f",
                      }}
                    >
                      {booking.roomType || "Room"} ×{" "}
                      {booking.bedsBooked || 1} bed
                      {(booking.bedsBooked || 1) > 1 ? "s" : ""}
                    </p>
                  </motion.div>

                  {/* Total Price */}
                  <motion.div
                    className="flex-1 p-5 rounded-xl"
                    style={{
                      backgroundColor: "#e0e3e5",
                      border: "1px solid rgba(195, 198, 209, 0.1)",
                    }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 20,
                    }}
                  >
                    <div
                      className="flex items-center gap-2 mb-2"
                      style={{ color: "#424750" }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: "20px" }}
                      >
                        payments
                      </span>
                      <span className="text-xs font-bold uppercase tracking-widest">
                        Total
                      </span>
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        color: "#191c1e",
                      }}
                    >
                      ₹{booking.totalPrice?.toLocaleString() || "—"}
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              variants={itemVariants}
            >
              <motion.button
                className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  background: "linear-gradient(135deg, #003868, #194f87)",
                  color: "#ffffff",
                  border: "none",
                }}
                whileHover={{
                  scale: 1.03,
                  boxShadow: "0 16px 40px rgba(0, 56, 104, 0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(dashboardPath)}
              >
                Go to Dashboard
                <motion.span
                  className="material-symbols-outlined"
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  arrow_forward
                </motion.span>
              </motion.button>

              <motion.button
                className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 cursor-pointer"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  backgroundColor: "#f2f4f6",
                  color: "#003868",
                  border: "none",
                }}
                whileHover={{
                  scale: 1.03,
                  backgroundColor: "#eceef0",
                }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/hostels")}
              >
                Browse More
              </motion.button>
            </motion.div>

            {/* Subtle bottom tagline */}
            <motion.p
              className="text-center mt-12 text-sm"
              style={{ color: "#737781" }}
              variants={itemVariants}
            >
              Powered by{" "}
              <span
                className="font-bold"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: "#003868",
                }}
              >
                IntelliStay
              </span>
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BookingSuccess;
