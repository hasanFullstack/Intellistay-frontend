const HostelCard = ({ hostel, onBook }) => {
  const lowestPrice =
    hostel.rooms && hostel.rooms.length > 0
      ? Math.min(...hostel.rooms.map((r) => r.price))
      : "N/A";

  const totalAvailable = hostel.rooms
    ? hostel.rooms.reduce((sum, r) => sum + (r.availableRooms || 0), 0)
    : 0;

  return (
    <article className="hostel-card">
      <div className="hostel-card__media">
        {hostel.image ? (
          <img
            src={hostel.image}
            alt={hostel.name}
            className="hostel-card__img"
          />
        ) : (
          <div className="hostel-card__placeholder">No image</div>
        )}
      </div>

      <div className="hostel-card__body">
        <h3 className="hostel-card__title">{hostel.name}</h3>
        <p className="hostel-card__location">📍 {hostel.city && hostel.addressLine1 ? `${hostel.addressLine1}, ${hostel.city}` : "Address not set"}</p>

        {hostel.environmentScore && (
          <div className="hostel-card__score">
            <small className="text-success">
              🌍 Environment Score: {hostel.environmentScore}/100
            </small>
          </div>
        )}

        {hostel.facilities && hostel.facilities.length > 0 && (
          <div className="hostel-card__facilities">
            <small className="text-muted">
              ✓ {hostel.facilities.slice(0, 2).join(", ")}
              {hostel.facilities.length > 2 ? "..." : ""}
            </small>
          </div>
        )}

        {hostel.rooms && hostel.rooms.length > 0 && (
          <div className="hostel-card__rooms">
            <small className="text-muted">
              🛏️ {hostel.rooms.map((r) => r.type).join(", ")} - From Rs{" "}
              {lowestPrice}
            </small>
            {totalAvailable > 0 && (
              <small className="badge bg-success ms-2">
                {totalAvailable} available
              </small>
            )}
          </div>
        )}

        <div className="hostel-card__meta">
          <span className="hostel-card__price">
            Rs {lowestPrice === "N/A" ? "N/A" : lowestPrice}/night
          </span>
          {onBook && totalAvailable > 0 && (
            <button className="btn" onClick={() => onBook(hostel._id)}>
              Book
            </button>
          )}
          {onBook && totalAvailable === 0 && (
            <button className="btn btn-secondary" disabled>
              Full
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default HostelCard;
