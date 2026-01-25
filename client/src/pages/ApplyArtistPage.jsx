import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./ApplyArtistPage.css";

const ApplyArtistPage = () => {
  const { user, applyAsArtist } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    type: "individual",
    taxId: "",
    vatNumber: "",
    address: {
      street: "",
      streetNum: "",
      zipCode: "",
      city: "",
      country: "",
    },
    socialMedia: {
      website: "",
      instagram: "",
      facebook: "",
      twitter: "",
    },
  });

  // Redirect if already applied
  if (user?.artistStatus !== "none") {
    return (
      <div className="apply-artist-page">
        <div className="status-card">
          <h1>Artist Application</h1>
          {user?.artistStatus === "pending" && (
            <>
              <p className="status pending">Your application is pending review</p>
              <p>We&apos;ll notify you once your application has been reviewed.</p>
            </>
          )}
          {user?.artistStatus === "incomplete" && (
            <>
              <p className="status incomplete">Your application is incomplete</p>
              <p>Please update your information and resubmit.</p>
            </>
          )}
          {user?.artistStatus === "verified" && (
            <>
              <p className="status verified">You&apos;re a verified artist!</p>
              <button onClick={() => navigate("/dashboard")} className="btn btn-primary">
                Go to Dashboard
              </button>
            </>
          )}
          {user?.artistStatus === "suspended" && (
            <>
              <p className="status suspended">Your artist account is suspended</p>
              <p>Please contact support for assistance.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await applyAsArtist(formData);
      toast.success("Application submitted successfully!");
      navigate("/");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to submit application";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="apply-artist-page">
      <div className="form-container">
        <h1>Become an Artist</h1>
        <p className="form-description">
          Fill out the form below to apply as an artist. Once approved, you&apos;ll be able to create and sell artworks.
        </p>

        <form onSubmit={handleSubmit} className="artist-form">
          <section className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="companyName">Company / Artist Name *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
                placeholder="Your artist or company name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tagline">Tagline</label>
              <input
                type="text"
                id="tagline"
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                placeholder="A short description of your work"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Tell us about yourself and your art"
              />
            </div>

            <div className="form-group">
              <label htmlFor="type">Type *</label>
              <select id="type" name="type" value={formData.type} onChange={handleChange} required>
                <option value="individual">Individual Artist</option>
                <option value="company">Company / Gallery</option>
              </select>
            </div>
          </section>

          <section className="form-section">
            <h2>Business Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="taxId">Tax ID</label>
                <input
                  type="text"
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  placeholder="Tax identification number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="vatNumber">VAT Number</label>
                <input
                  type="text"
                  id="vatNumber"
                  name="vatNumber"
                  value={formData.vatNumber}
                  onChange={handleChange}
                  placeholder="EU VAT number"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Address</h2>

            <div className="form-row">
              <div className="form-group flex-2">
                <label htmlFor="address.street">Street</label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Street name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.streetNum">Number</label>
                <input
                  type="text"
                  id="address.streetNum"
                  name="address.streetNum"
                  value={formData.address.streetNum}
                  onChange={handleChange}
                  placeholder="123"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address.zipCode">ZIP Code</label>
                <input
                  type="text"
                  id="address.zipCode"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.city">City *</label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  required
                  placeholder="City"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address.country">Country *</label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  required
                  placeholder="Country"
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Social Media (Optional)</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="socialMedia.website">Website</label>
                <input
                  type="url"
                  id="socialMedia.website"
                  name="socialMedia.website"
                  value={formData.socialMedia.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="socialMedia.instagram">Instagram</label>
                <input
                  type="url"
                  id="socialMedia.instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="socialMedia.facebook">Facebook</label>
                <input
                  type="url"
                  id="socialMedia.facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/page"
                />
              </div>

              <div className="form-group">
                <label htmlFor="socialMedia.twitter">Twitter</label>
                <input
                  type="url"
                  id="socialMedia.twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-large" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ApplyArtistPage;