const normalizeAddressPart = (value) => String(value ?? "").trim().replace(/\s+/g, " ");

export const formatHostelAddress = (hostel, fallback = "Address not set") => {
  if (!hostel || typeof hostel !== "object") return fallback;

  const parts = [hostel.addressLine1, hostel.addressLine2, hostel.city]
    .map(normalizeAddressPart)
    .filter(Boolean);

  return parts.length ? parts.join(", ") : fallback;
};
