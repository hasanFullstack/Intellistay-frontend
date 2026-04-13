import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getRoomById } from "../api/room.api";
import { getHostelById } from "../api/hostel.api";
import { createCheckoutSession } from "../api/booking.api";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

const CheckoutPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [hostel, setHostel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Expect booking info passed in location.state or fallback to query params
  const booking = state || {};
  const { roomId, hostelId, startDate, endDate, bedsBooked } = booking;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        if (!roomId || !hostelId) {
          toast.error("Missing booking info");
          navigate(-1);
          return;
        }
        const r = await getRoomById(roomId);
        const h = await getHostelById(hostelId);
        setRoom(r.data);
        setHostel(h.data);
      } catch (e) {
        toast.error("Failed to load checkout details");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [roomId, hostelId]);

  const calculateTotalPrice = () => {
    if (!room) return 0;
    return room.pricePerBed * (bedsBooked || 1);
  };

  const handlePay = async () => {
    try {
      setSubmitting(true);
      // TEMP: send minimal payload to payments API (avoid images/objects)
      const sessionRes = await createCheckoutSession({
        roomId,
        amount: calculateTotalPrice(),
        currency: "INR",
      });

      const sessionUrl = sessionRes.data?.url;
      const sessionId = sessionRes.data?.id;
      if (sessionUrl) {
        window.location.href = sessionUrl;
        return;
      }
      if (!sessionId) throw new Error("Invalid session from server");
      const stripe = await loadStripe(
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      );
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw error;
    } catch (err) {
      toast.error(err.message || "Payment failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading checkout...</div>;

  return (
    <div className="max-w-6xl mx-auto my-12 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold mb-4">{hostel?.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <img
                src={room?.images?.[0]}
                alt="room"
                className="w-full h-56 object-cover rounded-lg"
              />
            </div>
            <div>
              <h3 className="text-xl font-semibold">{room?.roomType}</h3>
              <p className="text-sm text-gray-600 mt-2">{room?.description}</p>
              <div className="mt-4 text-sm text-gray-700">
                <div>Available Beds: {room?.availableBeds}</div>
                <div>Price per bed: Rs {room?.pricePerBed}</div>
                <div className="mt-2">
                  Booking Dates: {startDate} → {endDate}
                </div>
                <div>Beds: {bedsBooked || 1}</div>
              </div>
            </div>
          </div>
          {/* show more images */}
          {room?.images?.length > 1 && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              {room.images.slice(1, 7).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`img-${i}`}
                  className="w-full h-28 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <aside className="bg-white rounded-xl shadow p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Payment Summary</h3>
            <div className="mt-4 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs {calculateTotalPrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span>Service Fee</span>
                <span>Rs 500</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Total</span>
                <span>Rs {(calculateTotalPrice() + 500).toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={handlePay}
              disabled={submitting}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold disabled:opacity-50"
            >
              {submitting ? "Processing…" : "Pay with Stripe"}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full mt-3 py-2 border rounded-lg"
            >
              Back
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CheckoutPage;
