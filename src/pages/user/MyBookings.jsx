import { useEffect, useState } from "react";
import { getUserBookings } from "../../api/booking.api";
import { useAuth } from "../../auth/AuthContext";
import { toast } from "react-toastify";
import AppLoader from "../../components/ui/AppLoader";
import EmptyState from "../../components/ui/EmptyState";
import { getErrorMessage } from "../../utils/getErrorMessage";

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
        toast.error(getErrorMessage(err, "Failed to load bookings"));
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [user]);

  if (loading) {
    return <AppLoader message="Loading your bookings..." className="py-20" />;
  }

  return (
    <div>
      <h3>My Bookings ({bookings.length})</h3>
      {bookings.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description="Once you book a hostel room, it will appear here."
          className="py-12"
        />
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
