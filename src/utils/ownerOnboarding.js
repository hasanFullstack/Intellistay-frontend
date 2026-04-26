import { getMyHostels } from "../api/hostel.api";
import { getRoomsByHostel } from "../api/room.api";
import { getStripeKeys } from "../api/ownerStripe.api";
import { checkEnvironmentCompletion } from "../api/hostelEnvironment.api";

export const getOwnerOnboardingProgress = async () => {
  const hostelRes = await getMyHostels();
  const hostels = Array.isArray(hostelRes?.data) ? hostelRes.data : [];
  const hostelsCount = hostels.length;

  let hasRooms = false;
  let environmentCompleted = false;

  if (hostels.length > 0) {
    const roomResults = await Promise.all(
      hostels.map((h) => getRoomsByHostel(h._id).catch(() => ({ data: [] }))),
    );
    const roomsTotal = roomResults.reduce(
      (sum, r) => sum + (Array.isArray(r?.data) ? r.data.length : 0),
      0,
    );
    hasRooms = roomsTotal > 0;

    const envResults = await Promise.all(
      hostels.map((h) =>
        checkEnvironmentCompletion(h._id).catch(() => ({
          data: { completed: false },
        })),
      ),
    );
    environmentCompleted = envResults.some((r) => Boolean(r?.data?.completed));
  }

  const stripeRes = await getStripeKeys().catch(() => ({ data: {} }));
  const stripeData = stripeRes?.data || {};
  const stripeConnected = Boolean(stripeData.accountId || stripeData.publicKey);

  const completedCount = [
    hostelsCount > 0,
    hasRooms,
    stripeConnected,
    environmentCompleted,
  ].filter(Boolean).length;

  return {
    hostelsCount,
    hasRooms,
    stripeConnected,
    environmentCompleted,
    completedCount,
    isComplete: completedCount === 4,
  };
};
