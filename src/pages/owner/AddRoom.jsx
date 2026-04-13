import { useState } from "react";
import { addRoom } from "../../api/room.api";
import { toast } from "react-toastify";

const AddRoom = ({ hostelId, onSuccess }) => {
  const [data, setData] = useState({
    roomType: "Shared",
    totalBeds: 4,
    pricePerBed: 5000,
    description: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImages, setPreviewImages] = useState([]);

  const submit = async (e) => {
    e.preventDefault();
    if (!data.roomType || !data.totalBeds || !data.pricePerBed) {
      setError("All fields are required");
      return;
    }

    if (data.images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await addRoom(hostelId, data);
      setData({
        roomType: "Shared",
        totalBeds: 4,
        pricePerBed: 5000,
        description: "",
        images: [],
      });
      setPreviewImages([]);
      toast.success("Room added successfully!");
      if (onSuccess) onSuccess();
    } catch (err) {
      setError("Failed to add room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setData((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
        setPreviewImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={submit}>
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      <div className="mb-3">
        <label htmlFor="roomType" className="form-label fw-semibold">
          Room Type
        </label>
        <select
          id="roomType"
          className="form-select form-select-lg"
          value={data.roomType}
          onChange={(e) => setData({ ...data, roomType: e.target.value })}
        >
          <option>Single</option>
          <option>Shared</option>
          <option>Deluxe</option>
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="totalBeds" className="form-label fw-semibold">
          Total Beds
        </label>
        <input
          id="totalBeds"
          type="number"
          className="form-control form-control-lg"
          min="1"
          value={data.totalBeds}
          onChange={(e) =>
            setData({ ...data, totalBeds: Number(e.target.value) })
          }
        />
      </div>

      <div className="mb-3">
        <label htmlFor="pricePerBed" className="form-label fw-semibold">
          Price Per Bed (Rs)
        </label>
        <input
          id="pricePerBed"
          type="number"
          className="form-control form-control-lg"
          min="0"
          value={data.pricePerBed}
          onChange={(e) =>
            setData({ ...data, pricePerBed: Number(e.target.value) })
          }
        />
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label fw-semibold">
          Description
        </label>
        <textarea
          id="description"
          className="form-control form-control-lg"
          placeholder="Describe this room type..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          rows="2"
        ></textarea>
      </div>

      <div className="mb-3">
        <label htmlFor="roomImages" className="form-label fw-semibold">
          Upload Images (Featured + Gallery)
        </label>
        <input
          id="roomImages"
          type="file"
          className="form-control form-control-lg"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
        />
        <small className="text-muted d-block mt-2">
          First image will be used as featured image. Upload multiple images for
          gallery.
        </small>
      </div>

      {previewImages.length > 0 && (
        <div className="mb-3">
          <label className="form-label fw-semibold">Uploaded Images</label>
          <div className="row g-2">
            {previewImages.map((img, idx) => (
              <div key={idx} className="col-6 col-md-3">
                <div className="position-relative">
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="img-fluid rounded"
                    style={{
                      height: "100px",
                      objectFit: "cover",
                      width: "100%",
                    }}
                  />
                  {idx === 0 && (
                    <span className="badge bg-warning text-dark position-absolute top-0 start-0 m-1">
                      Featured
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute bottom-0 end-0 m-1"
                    onClick={() => removeImage(idx)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="d-grid gap-2 mt-4">
        <button
          type="submit"
          className="btn btn-success btn-lg"
          disabled={loading}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
              ></span>
              Adding...
            </>
          ) : (
            "Add Room"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddRoom;
