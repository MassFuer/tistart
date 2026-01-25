import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { usersAPI, geocodeAPI } from "../services/api";
import { FaPen, FaPlus } from "react-icons/fa";
import AddressForm from "../components/map/AddressForm";
import LocationMap from "../components/map/LocationMap";
import LocationDisplay from "../components/map/LocationDisplay";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { user, refreshUser, updateArtistInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingArtist, setIsEditingArtist] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    userName: user?.userName || "",
  });

  const [artistFormData, setArtistFormData] = useState({
    companyName: user?.artistInfo?.companyName || "",
    tagline: user?.artistInfo?.tagline || "",
    description: user?.artistInfo?.description || "",
    website: user?.artistInfo?.socialMedia?.website || "",
    instagram: user?.artistInfo?.socialMedia?.instagram || "",
    facebook: user?.artistInfo?.socialMedia?.facebook || "",
    twitter: user?.artistInfo?.socialMedia?.twitter || "",
  });

  const [addressData, setAddressData] = useState({
    street: user?.artistInfo?.address?.street || "",
    streetNum: user?.artistInfo?.address?.streetNum || "",
    zipCode: user?.artistInfo?.address?.zipCode || "",
    city: user?.artistInfo?.address?.city || "",
    country: user?.artistInfo?.address?.country || "",
  });

  const [coordinates, setCoordinates] = useState(() => {
    const loc = user?.artistInfo?.address?.location;
    if (loc?.coordinates?.length === 2) {
      return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
    }
    return null;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArtistChange = (e) => {
    setArtistFormData({ ...artistFormData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (newAddress) => {
    setAddressData(newAddress);
  };

  const handleGeocode = (result) => {
    setCoordinates({ lat: result.lat, lng: result.lng });
  };

  const handleMapLocationChange = async (location) => {
    setCoordinates({ lat: location.lat, lng: location.lng });

    // Update address form based on map interaction
    if (location.address) {
      // This is from search - parse the address more intelligently
      console.log("Search result address:", location.address);

      // Try to parse different address formats
      const addressStr = location.address.trim();
      let street = "",
        streetNum = "",
        zipCode = "",
        city = "",
        country = "";

      // Handle different address formats
      const parts = addressStr.split(",").map((part) => part.trim());

      if (parts.length >= 2) {
        // Last part is usually country
        country = parts[parts.length - 1];

        // Find the most likely city part (usually contains zip code or is a city name)
        let cityPart = "";
        let cityIndex = -1;

        // Look for part with zip code pattern (international: 4-6 digits)
        for (let i = parts.length - 2; i >= 0; i--) {
          const zipMatch = parts[i].match(/\b(\d{4,6})\b/);
          if (zipMatch) {
            cityPart = parts[i];
            cityIndex = i;
            zipCode = zipMatch[1];
            break;
          }
        }

        // If no zip code found, try to find city by heuristics
        if (cityIndex === -1) {
          for (
            let i = parts.length - 2;
            i >= Math.max(0, parts.length - 4);
            i--
          ) {
            const part = parts[i];

            // Skip if it looks like administrative region
            const adminKeywords = [
              "Île-de-France",
              "Provence",
              "Région",
              "Department",
              "State",
              "Province",
              "County",
              "District",
              "Region",
              "Departamento",
              "Bundesland",
              "Länder",
              "Oblast",
              "Prefecture",
            ];

            if (
              part.length > 35 || // Too long, likely administrative
              adminKeywords.some((keyword) =>
                part.toLowerCase().includes(keyword.toLowerCase()),
              )
            ) {
              continue;
            }

            // Prefer parts with 2-4 words (likely city names)
            const wordCount = part.split(/\s+/).length;
            if (wordCount >= 1 && wordCount <= 4) {
              cityPart = part;
              cityIndex = i;
              break;
            }
          }
        }

        // Extract city name from city part
        if (cityPart) {
          // Remove zip code if present
          const cityMatch = cityPart.match(/^(\d{4,6}\s*)?(.+)$/);
          if (cityMatch) {
            city = cityMatch[2].trim();
          } else {
            city = cityPart.trim();
          }
        }

        // Everything before the city part is the street address
        if (cityIndex > 0) {
          const streetPart = parts.slice(0, cityIndex).join(", ");

          // Handle various street number formats
          const streetPatterns = [
            /^(\d+[a-zA-Z]?\s*[-/]?\s*)(.+)/, // "123 Main St", "123-A Main St"
            /^(.+?)\s+(\d+[a-zA-Z]?)$/, // "Main St 123"
            /^(\d+)\s+(.+)/, // "123 Main St"
          ];

          for (const pattern of streetPatterns) {
            const streetMatch = streetPart.match(pattern);
            if (streetMatch) {
              if (pattern === streetPatterns[1]) {
                // "Main St 123" format
                street = streetMatch[1].trim();
                streetNum = streetMatch[2].trim();
              } else {
                // "123 Main St" format
                streetNum = streetMatch[1].trim();
                street = streetMatch[2].trim();
              }
              break;
            }
          }

          // If no pattern matched, use the whole part as street
          if (!street) {
            street = streetPart;
          }
        } else if (parts.length === 2) {
          // Only city and country, no street
          street = addressData.street; // Keep existing street
          streetNum = addressData.streetNum; // Keep existing street number
        }
      }

      setAddressData({
        ...addressData,
        street: street || addressData.street,
        streetNum: streetNum || addressData.streetNum,
        zipCode: zipCode || addressData.zipCode,
        city: city || addressData.city,
        country: country || addressData.country,
      });

      console.log("Parsed address:", {
        street,
        streetNum,
        zipCode,
        city,
        country,
      });
    } else {
      // This is from map click - reverse geocode to get address
      try {
        const response = await geocodeAPI.reverse(location.lat, location.lng);
        const addr = response.data.data;

        setAddressData({
          ...addressData,
          street: addr.street || addressData.street,
          streetNum: addr.streetNum || addressData.streetNum,
          zipCode: addr.zipCode || addressData.zipCode,
          city: addr.city || addressData.city,
          country: addr.country || addressData.country,
        });
        toast.success("Address updated from map");
      } catch (error) {
        console.error("Reverse geocode error:", error);
        // Don't show error, coordinates are still saved
      }
    }
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploadingPicture(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);
      await usersAPI.uploadProfilePicture(formData);
      await refreshUser();
      toast.success("Profile picture updated");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to upload picture";
      toast.error(message);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);
      await usersAPI.uploadLogo(formData);
      await refreshUser();
      toast.success("Logo updated");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to upload logo";
      toast.error(message);
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await usersAPI.updateProfile(formData);
      await refreshUser();
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      const message = error.response?.data?.error || "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      userName: user?.userName || "",
    });
    setIsEditing(false);
  };

  const handleArtistSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateArtistInfo({
        companyName: artistFormData.companyName,
        tagline: artistFormData.tagline,
        description: artistFormData.description,
        socialMedia: {
          website: artistFormData.website,
          instagram: artistFormData.instagram,
          facebook: artistFormData.facebook,
          twitter: artistFormData.twitter,
        },
      });
      await refreshUser();
      toast.success("Artist info updated successfully");
      setIsEditingArtist(false);
    } catch (error) {
      const message =
        error.response?.data?.error || "Failed to update artist info";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArtistCancel = () => {
    setArtistFormData({
      companyName: user?.artistInfo?.companyName || "",
      tagline: user?.artistInfo?.tagline || "",
      description: user?.artistInfo?.description || "",
      website: user?.artistInfo?.socialMedia?.website || "",
      instagram: user?.artistInfo?.socialMedia?.instagram || "",
      facebook: user?.artistInfo?.socialMedia?.facebook || "",
      twitter: user?.artistInfo?.socialMedia?.twitter || "",
    });
    setIsEditingArtist(false);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const addressPayload = {
        address: {
          street: addressData.street,
          streetNum: addressData.streetNum,
          zipCode: addressData.zipCode,
          city: addressData.city,
          country: addressData.country,
        },
      };

      // Include coordinates if we have them
      if (coordinates?.lat && coordinates?.lng) {
        addressPayload.address.location = {
          type: "Point",
          coordinates: [coordinates.lng, coordinates.lat],
        };
      }

      await updateArtistInfo(addressPayload);
      await refreshUser();
      toast.success("Address updated successfully");
      setIsEditingAddress(false);
    } catch (error) {
      const message = error.response?.data?.error || "Failed to update address";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressCancel = () => {
    setAddressData({
      street: user?.artistInfo?.address?.street || "",
      streetNum: user?.artistInfo?.address?.streetNum || "",
      zipCode: user?.artistInfo?.address?.zipCode || "",
      city: user?.artistInfo?.address?.city || "",
      country: user?.artistInfo?.address?.country || "",
    });
    const loc = user?.artistInfo?.address?.location;
    if (loc?.coordinates?.length === 2) {
      setCoordinates({ lng: loc.coordinates[0], lat: loc.coordinates[1] });
    } else {
      setCoordinates(null);
    }
    setIsEditingAddress(false);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      none: "status-none",
      pending: "status-pending",
      incomplete: "status-incomplete",
      verified: "status-verified",
      suspended: "status-suspended",
    };
    return classes[status] || "status-none";
  };

  const hasAddress =
    addressData.city || addressData.country || addressData.street;
  const userCoordinates = (() => {
    const loc = user?.artistInfo?.address?.location;
    if (loc?.coordinates?.length === 2) {
      return { lng: loc.coordinates[0], lat: loc.coordinates[1] };
    }
    return null;
  })();

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-wrapper">
            <div
              className={`profile-avatar ${isUploadingPicture ? "uploading" : ""}`}
              onClick={handleProfilePictureClick}
              title="Click to change profile picture"
            >
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt={user.firstName} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
              )}
              <div className="avatar-overlay">
                <span>{isUploadingPicture ? "..." : "Edit"}</span>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
            />
          </div>
          <div className="profile-info">
            <h1>
              {user?.firstName} {user?.lastName}
            </h1>
            <p className="username">@{user?.userName}</p>
            <span className={`role-badge ${user?.role}`}>{user?.role}</span>
            {user?.role === "artist" && (
              <span
                className={`status-badge ${getStatusBadgeClass(user?.artistStatus)}`}
              >
                {user?.artistStatus}
              </span>
            )}
          </div>
        </div>

        <div className="profile-content">
          {/* Personal Information Section */}
          <section className="profile-section">
            <div className="section-header">
              <h2>Personal Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-edit"
                  title="Edit"
                >
                  <FaPen />
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="userName">Username</label>
                  <input
                    type="text"
                    id="userName"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input-disabled"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <span className="label">First Name:</span>
                  <span className="value">{user?.firstName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Last Name:</span>
                  <span className="value">{user?.lastName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Username:</span>
                  <span className="value">@{user?.userName}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{user?.email}</span>
                </div>
              </div>
            )}
          </section>

          {/* Artist Information Section */}
          {user?.role === "artist" && user?.artistInfo && (
            <>
              <section className="profile-section">
                <div className="section-header">
                  <h2>Artist Information</h2>
                  {!isEditingArtist && (
                    <button
                      onClick={() => setIsEditingArtist(true)}
                      className="btn-edit"
                      title="Edit"
                    >
                      <FaPen />
                    </button>
                  )}
                </div>

                {/* Artist Logo */}
                <div className="artist-logo-section">
                  <span className="label">Logo:</span>
                  <div className="artist-logo-wrapper">
                    <div
                      className={`artist-logo ${isUploadingLogo ? "uploading" : ""}`}
                      onClick={handleLogoClick}
                      title="Click to change logo"
                    >
                      {user?.artistInfo?.logo ? (
                        <img src={user.artistInfo.logo} alt="Artist logo" />
                      ) : (
                        <div className="logo-placeholder">
                          <span>+</span>
                        </div>
                      )}
                      <div className="logo-overlay">
                        <span>{isUploadingLogo ? "..." : "Edit"}</span>
                      </div>
                    </div>
                    <input
                      type="file"
                      ref={logoInputRef}
                      onChange={handleLogoChange}
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>

                {isEditingArtist ? (
                  <form onSubmit={handleArtistSubmit} className="profile-form">
                    <div className="form-group">
                      <label htmlFor="companyName">Artist/Company Name</label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={artistFormData.companyName}
                        onChange={handleArtistChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="tagline">Tagline</label>
                      <input
                        type="text"
                        id="tagline"
                        name="tagline"
                        value={artistFormData.tagline}
                        onChange={handleArtistChange}
                        placeholder="A short catchy phrase about your art"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="description">Description</label>
                      <textarea
                        id="description"
                        name="description"
                        value={artistFormData.description}
                        onChange={handleArtistChange}
                        rows="4"
                        placeholder="Tell us about yourself and your art..."
                      />
                    </div>

                    <h3 className="form-subtitle">Social Media Links</h3>

                    <div className="form-group">
                      <label htmlFor="website">Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={artistFormData.website}
                        onChange={handleArtistChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="instagram">Instagram</label>
                      <input
                        type="url"
                        id="instagram"
                        name="instagram"
                        value={artistFormData.instagram}
                        onChange={handleArtistChange}
                        placeholder="https://instagram.com/yourusername"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="facebook">Facebook</label>
                        <input
                          type="url"
                          id="facebook"
                          name="facebook"
                          value={artistFormData.facebook}
                          onChange={handleArtistChange}
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="twitter">Twitter/X</label>
                        <input
                          type="url"
                          id="twitter"
                          name="twitter"
                          value={artistFormData.twitter}
                          onChange={handleArtistChange}
                          placeholder="https://twitter.com/yourusername"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleArtistCancel}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-details">
                    <div className="detail-row">
                      <span className="label">Company Name:</span>
                      <span className="value">
                        {user.artistInfo.companyName}
                      </span>
                    </div>
                    {user.artistInfo.tagline && (
                      <div className="detail-row">
                        <span className="label">Tagline:</span>
                        <span className="value">{user.artistInfo.tagline}</span>
                      </div>
                    )}
                    {user.artistInfo.description && (
                      <div className="detail-row full-width">
                        <span className="label">Description:</span>
                        <span className="value">
                          {user.artistInfo.description}
                        </span>
                      </div>
                    )}
                    {user.artistInfo.socialMedia && (
                      <div className="detail-row full-width">
                        <span className="label">Social Links:</span>
                        <div className="social-links-display">
                          {user.artistInfo.socialMedia.website && (
                            <a
                              href={user.artistInfo.socialMedia.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-link-item"
                            >
                              Website
                            </a>
                          )}
                          {user.artistInfo.socialMedia.instagram && (
                            <a
                              href={user.artistInfo.socialMedia.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-link-item"
                            >
                              Instagram
                            </a>
                          )}
                          {user.artistInfo.socialMedia.facebook && (
                            <a
                              href={user.artistInfo.socialMedia.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-link-item"
                            >
                              Facebook
                            </a>
                          )}
                          {user.artistInfo.socialMedia.twitter && (
                            <a
                              href={user.artistInfo.socialMedia.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="social-link-item"
                            >
                              Twitter
                            </a>
                          )}
                          {!user.artistInfo.socialMedia.website &&
                            !user.artistInfo.socialMedia.instagram &&
                            !user.artistInfo.socialMedia.facebook &&
                            !user.artistInfo.socialMedia.twitter && (
                              <span className="no-links">
                                No social links added
                              </span>
                            )}
                        </div>
                      </div>
                    )}

                    {user.artistStatus === "verified" && (
                      <div className="detail-row full-width">
                        <Link
                          to={`/artists/${user._id}`}
                          className="btn btn-outline view-profile-link"
                        >
                          View Public Profile
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Address Section */}
              <section className="profile-section">
                <div className="section-header">
                  <h2>Studio/Office Location</h2>
                  {!isEditingAddress && (
                    <button
                      onClick={() => setIsEditingAddress(true)}
                      className="btn-edit"
                      title={hasAddress ? "Edit" : "Add"}
                    >
                      {hasAddress ? <FaPen /> : <FaPlus />}
                    </button>
                  )}
                </div>

                {isEditingAddress ? (
                  <form onSubmit={handleAddressSubmit} className="profile-form">
                    <div className="address-map-section">
                      <div className="address-form-wrapper">
                        <AddressForm
                          address={addressData}
                          onChange={handleAddressChange}
                          onGeocode={handleGeocode}
                        />
                      </div>
                      <div className="map-wrapper">
                        <LocationMap
                          coordinates={coordinates}
                          onLocationChange={handleMapLocationChange}
                          editable={true}
                          height="300px"
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        onClick={handleAddressCancel}
                        className="btn btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </form>
                ) : hasAddress || userCoordinates ? (
                  <LocationDisplay
                    address={user?.artistInfo?.address || {}}
                    coordinates={userCoordinates}
                    showMap={!!userCoordinates}
                    height="250px"
                    layout="horizontal"
                  />
                ) : (
                  <div className="no-address">
                    <p>
                      No location set. Click the + button to add your studio or
                      office address.
                    </p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
