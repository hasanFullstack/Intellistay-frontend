import { useEffect, useState } from "react";
import { getUserBookings } from "../../api/booking.api";
import { useAuth } from "../../auth/AuthContext";
import { toast } from "react-toastify";

const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        if (user?._id) {
          const res = await getUserBookings(user._id);
          setBookings(res.data || []);
        }
      } catch (err) {
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  if (loading) {
    return <div>Loading bookings...</div>;
  }

  return (
    <div>
      <h3>My Bookings ({bookings.length})</h3>
      {bookings.length === 0 ? (
        <p>No bookings found</p>
      ) : (
        <ul>
          {bookings.map((b) => (
            <li key={b._id}>
              {b.hostelName} - {b.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyBookings;
