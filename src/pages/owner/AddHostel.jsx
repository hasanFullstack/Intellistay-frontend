import { useState } from "react";
import { addHostel } from "../../api/hostel.api";
import { toast } from "react-toastify";

const AddHostel = ({ onSuccess }) => {
  const [data, setData] = useState({
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    description: "",
    amenities: "",
    rules: "",
    gender: "Male",
    environmentScore: 50,
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewImages, setPreviewImages] = useState([]);
  

  const submit = async (e) => {
    e.preventDefault();
    if (!data.name || !data.addressLine1 || !data.city) {
      setError("Name, address line 1, and city are required");
      return;
    }

    if (!data.gender || !["Male", "Female"].includes(data.gender)) {
      setError("Please select a valid gender policy (Male or Female)");
      return;
    }

    if (data.images.length === 0) {
      setError("Please upload at least one image");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const submitData = {
        ...data,
        amenities: data.amenities
          ? data.amenities.split(",").map((f) => f.trim())
          : [],
      };
      const res = await addHostel(submitData);
      const createdHostel = res?.data || res;

      setData({
        name: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        description: "",
        amenities: "",
        rules: "",
        gender: "Male",
        environmentScore: 50,
        images: [],
      });
      setPreviewImages([]);
      toast.success("Hostel added successfully! Now add rooms to this hostel.");
      if (onSuccess) onSuccess(createdHostel);
    } catch (err) {
      setError("Failed to add hostel. Please try again.");
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
        <label htmlFor="name" className="form-label fw-semibold">
          Hostel Name
        </label>
        <input
          id="name"
          type="text"
          className="form-control form-control-lg"
          placeholder="e.g., City Center Hostel"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="addressLine1" className="form-label fw-semibold">
          Address Line 1 <span className="text-danger">*</span>
        </label>
        <input
          id="addressLine1"
          type="text"
          className="form-control form-control-lg"
          placeholder="e.g., 4522 W Oak Ave"
          value={data.addressLine1}
          onChange={(e) => setData({ ...data, addressLine1: e.target.value })}
          required
        />
        <small className="text-muted d-block mt-1">
          Primary address: House/Building Number + Street Name + Street Suffix (St, Ave, Blvd, Rd, etc.)
        </small>
      </div>

      <div className="mb-3">
        <label htmlFor="addressLine2" className="form-label fw-semibold">
          Address Line 2 <span className="text-muted">(Optional)</span>
        </label>
        <input
          id="addressLine2"
          type="text"
          className="form-control form-control-lg"
          placeholder="e.g., Apt 3B, Suite 200, Floor 4"
          value={data.addressLine2}
          onChange={(e) => setData({ ...data, addressLine2: e.target.value })}
        />
        <small className="text-muted d-block mt-1">
          Use for: Apartment/Suite/Unit numbers, Floor numbers, or P.O. Box (leave blank if not applicable)
        </small>
      </div>

      <div className="mb-3">
        <label htmlFor="city" className="form-label fw-semibold">
          City <span className="text-danger">*</span>
        </label>
        <input
          id="city"
          type="text"
          className="form-control form-control-lg"
          placeholder="e.g., Chicago or Los Angeles"
          value={data.city}
          onChange={(e) => setData({ ...data, city: e.target.value })}
          required
        />
        <small className="text-muted d-block mt-1">
          City or town name (do not include state or postal code)
        </small>
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label fw-semibold">
          Description
        </label>
        <textarea
          id="description"
          className="form-control form-control-lg"
          placeholder="Describe your hostel..."
          value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          rows="3"
        ></textarea>
      </div>

      <div className="mb-3">
        <label htmlFor="amenities" className="form-label fw-semibold">
          Amenities (comma-separated)
        </label>
        <input
          id="amenities"
          type="text"
          className="form-control form-control-lg"
          placeholder="e.g., WiFi, Parking, Kitchen, AC"
          value={data.amenities}
          onChange={(e) => setData({ ...data, amenities: e.target.value })}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="gender" className="form-label fw-semibold">
          Gender Policy <span className="text-danger">*</span>
        </label>
        <select
          id="gender"
          className="form-select form-select-lg"
          value={data.gender}
          onChange={(e) => setData({ ...data, gender: e.target.value })}
          required
        >
          <option value="">Select Gender Policy</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </div>

      <div className="mb-3">
        <label htmlFor="rules" className="form-label fw-semibold">
          House Rules
        </label>
        <textarea
          id="rules"
          className="form-control form-control-lg"
          placeholder="e.g., No smoking, quiet hours after 10pm..."
          value={data.rules}
          onChange={(e) => setData({ ...data, rules: e.target.value })}
          rows="3"
        ></textarea>
      </div>

      <div className="mb-3">
        <label htmlFor="images" className="form-label fw-semibold">
          Upload Images (Featured + Gallery)
        </label>
        <input
          id="images"
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
          className="btn btn-primary btn-lg"
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
            "Add Hostel"
          )}
        </button>
      </div>
    </form>
  );
};

export default AddHostel;
