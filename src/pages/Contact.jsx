import { useState } from "react";
import "./Contact.css";
import ContactSection from "../../components/ContactSection";
import { toast } from "react-toastify";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      toast.success("Message sent! We'll get back to you soon.");
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="contact-page">
        <div className="container-fluid">
          <div className="row align-items-center min-vh-100">
            {/* Left Section - Info */}
            <div className="col-lg-6 contact-info-section">
              <div className="contact-info">
                <h1 className="contact-title">Why Choose Us?</h1>
                <p className="contact-subtitle">
                  We provide the best hostel experience with excellent service,
                  comfortable accommodations, and a welcoming community.
                </p>

                {/* Info Cards */}
                <div className="info-cards">
                  <div className="info-card">
                    <div className="info-icon">
                      <i className="bi bi-star-fill"></i>
                    </div>
                    <div className="info-content">
                      <h5>High Quality</h5>
                      <p>Premium accommodations and amenities for our guests</p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon">
                      <i className="bi bi-people-fill"></i>
                    </div>
                    <div className="info-content">
                      <h5>Community</h5>
                      <p>
                        Meet travelers from around the world and make memories
                      </p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon">
                      <i className="bi bi-shield-check"></i>
                    </div>
                    <div className="info-content">
                      <h5>Safe & Secure</h5>
                      <p>24/7 security and professional management</p>
                    </div>
                  </div>

                  <div className="info-card">
                    <div className="info-icon">
                      <i className="bi bi-lightning-fill"></i>
                    </div>
                    <div className="info-content">
                      <h5>Best Value</h5>
                      <p>Competitive prices with exceptional quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section - Contact Form */}
            <div className="col-lg-6 contact-form-section">
              <div className="contact-form-wrapper">
                <h2 className="form-title">Get in Touch</h2>
                <p className="form-subtitle">
                  Have any questions? We'd love to hear from you. Send us a
                  message and we'll respond as soon as possible.
                </p>

                {submitted && (
                  <div className="alert alert-success alert-dismissible fade show">
                    <i className="bi bi-check-circle me-2"></i>
                    Thank you! We've received your message and will get back to
                    you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <i className="bi bi-person"></i>
                  </div>

                  <div className="form-group">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Your Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                    <i className="bi bi-envelope"></i>
                  </div>

                  <div className="form-group">
                    <textarea
                      className="form-control"
                      placeholder="Your Message"
                      name="message"
                      rows="5"
                      value={formData.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ContactSection />
    </>
  );
};

export default Contact;
