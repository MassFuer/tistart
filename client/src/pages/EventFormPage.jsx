import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventsAPI, geocodeAPI } from "../services/api";
import toast from "react-hot-toast";
import AddressForm from "../components/map/AddressForm";
import LocationMap from "../components/map/LocationMap";
import "./EventFormPage.css";

const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImage, setExistingImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDateTime: "",
    endDateTime: "",
    category: "exhibition",
    price: 0,
    maxCapacity: "",
    isPublic: true,
    location: {
      venue: "",
      street: "",
      streetNum: "",
      zipCode: "",
      city: "",
      country: "",
      isOnline: false,
      onlineUrl: "",
    },
  });
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  const categories = ["exhibition", "concert", "workshop", "meetup", "other"];

  useEffect(() => {
    if (isEditing) {
      fetchEvent();
    }
  }, [id]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchEvent = async () => {
    try {
      const response = await eventsAPI.getOne(id);
      const event = response.data.data;

      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDateTime: formatDateForInput(event.startDateTime),
        endDateTime: formatDateForInput(event.endDateTime),
        category: event.category || "exhibition",
        price: event.price || 0,
        maxCapacity: event.maxCapacity || "",
        isPublic: event.isPublic ?? true,
        location: {
          venue: event.location?.venue || "",
          street: event.location?.street || "",
          streetNum: event.location?.streetNum || "",
          zipCode: event.location?.zipCode || "",
          city: event.location?.city || "",
          country: event.location?.country || "",
          isOnline: event.location?.isOnline || false,
          onlineUrl: event.location?.onlineUrl || "",
        },
      });
      // Set coordinates if available
      if (event.location?.coordinates?.coordinates?.length === 2) {
        const [lng, lat] = event.location.coordinates.coordinates;
        setCoordinates({ lat, lng });
      }
      setExistingImage(event.image || null);
    } catch (error) {
      toast.error("Failed to load event");
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }

    // Revoke previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Address handlers
  const handleAddressChange = (newAddress) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        ...newAddress,
      },
    });
  };

  const handleGeocode = (result) => {
    setCoordinates({ lat: result.lat, lng: result.lng });
    toast.success("Location found on map");
  };

  const handleMapLocationChange = async (newCoords) => {
    setCoordinates(newCoords);

    // Only reverse geocode if this is from a map click, not from search
    // Search results already have address data
    if (newCoords.address) {
      // This is from search - parse the address more intelligently
      console.log("Search result address:", newCoords.address);

      // Try to parse different address formats
      const addressStr = newCoords.address.trim();
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
          street = formData.location.street; // Keep existing street
          streetNum = formData.location.streetNum; // Keep existing street number
        }
      }

      setFormData({
        ...formData,
        location: {
          ...formData.location,
          street: street || formData.location.street,
          streetNum: streetNum || formData.location.streetNum,
          zipCode: zipCode || formData.location.zipCode,
          city: city || formData.location.city,
          country: country || formData.location.country,
        },
      });

      console.log("Parsed address:", {
        street,
        streetNum,
        zipCode,
        city,
        country,
      });
      // Don't show toast for search - it's expected behavior
    } else {
      // This is from map click - reverse geocode to get address
      try {
        const response = await geocodeAPI.reverse(newCoords.lat, newCoords.lng);
        const addr = response.data.data;

        setFormData({
          ...formData,
          location: {
            ...formData.location,
            street: addr.street || formData.location.street,
            streetNum: addr.streetNum || formData.location.streetNum,
            zipCode: addr.zipCode || formData.location.zipCode,
            city: addr.city || formData.location.city,
            country: addr.country || formData.location.country,
          },
        });
        toast.success("Address updated from map");
      } catch (error) {
        console.error("Reverse geocode error:", error);
        // Don't show error, coordinates are still saved
      }
    }
  };

  const removeSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const removeExistingImage = () => {
    setExistingImage(null);
  };

  const uploadImage = async (eventId) => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("image", selectedFile);

      await eventsAPI.uploadImage(eventId, formDataUpload);
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        maxCapacity: formData.maxCapacity
          ? Number(formData.maxCapacity)
          : undefined,
        startDateTime: new Date(formData.startDateTime).toISOString(),
        endDateTime: new Date(formData.endDateTime).toISOString(),
      };

      // Add coordinates if available and not online event
      if (!formData.location.isOnline && coordinates.lat && coordinates.lng) {
        data.location = {
          ...data.location,
          coordinates: {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat],
          },
        };
      }

      let eventId = id;

      if (isEditing) {
        // If existing image was removed, clear it
        if (!existingImage && !selectedFile) {
          data.image = null;
        }
        await eventsAPI.update(id, data);
        toast.success("Event updated successfully");
      } else {
        const response = await eventsAPI.create(data);
        eventId = response.data.data._id;
        toast.success("Event created successfully");
      }

      // Upload new image if any
      if (selectedFile) {
        await uploadImage(eventId);
      }

      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to save event";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const hasImage = existingImage || previewUrl;

  return (
    <div className="event-form-page">
      <div className="form-container">
        <h1>{isEditing ? "Edit Event" : "Create New Event"}</h1>

        <form onSubmit={handleSubmit} className="event-form">
          <section className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Event title"
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
                placeholder="Describe your event"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="form-section">
            <h2>Event Image</h2>
            <p className="form-description">
              Upload an image for your event (JPG, PNG, WebP - max 5MB)
            </p>

            {/* Existing Image */}
            {existingImage && !previewUrl && (
              <div className="image-gallery">
                <h4>Current Image</h4>
                <div className="image-preview-grid">
                  <div className="image-preview-item">
                    <img src={existingImage} alt="Event" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={removeExistingImage}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* New Image Preview */}
            {previewUrl && (
              <div className="image-gallery">
                <h4>New Image</h4>
                <div className="image-preview-grid">
                  <div className="image-preview-item new-image">
                    <img src={previewUrl} alt="New event" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={removeSelectedFile}
                      title="Remove image"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Input */}
            {!hasImage && (
              <div className="image-upload-area">
                <input
                  type="file"
                  id="image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="image" className="file-input-label">
                  <span className="upload-icon">+</span>
                  <span>Add Event Image</span>
                </label>
              </div>
            )}

            {/* Change Image Button */}
            {hasImage && (
              <div className="change-image-area">
                <input
                  type="file"
                  id="change-image"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label
                  htmlFor="change-image"
                  className="btn btn-secondary btn-small"
                >
                  Change Image
                </label>
              </div>
            )}
          </section>

          <section className="form-section">
            <h2>Date & Time</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startDateTime">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  id="startDateTime"
                  name="startDateTime"
                  value={formData.startDateTime}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="endDateTime">End Date & Time *</label>
                <input
                  type="datetime-local"
                  id="endDateTime"
                  name="endDateTime"
                  value={formData.endDateTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Location</h2>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="location.isOnline"
                  checked={formData.location.isOnline}
                  onChange={handleChange}
                />
                This is an online event
              </label>
            </div>

            {formData.location.isOnline ? (
              <div className="form-group">
                <label htmlFor="location.onlineUrl">Event URL</label>
                <input
                  type="url"
                  id="location.onlineUrl"
                  name="location.onlineUrl"
                  value={formData.location.onlineUrl}
                  onChange={handleChange}
                  placeholder="https://zoom.us/j/..."
                />
              </div>
            ) : (
              <div className="location-editor">
                <div className="location-form-wrapper">
                  <AddressForm
                    address={formData.location}
                    onChange={handleAddressChange}
                    onGeocode={handleGeocode}
                    showVenue={true}
                  />
                </div>

                <div className="location-map-wrapper">
                  <p className="map-hint">
                    Click on the map or use search to set location
                  </p>
                  <LocationMap
                    coordinates={coordinates}
                    onLocationChange={handleMapLocationChange}
                    editable={true}
                    height="350px"
                    showSearch={true}
                    zoom={13}
                  />
                </div>
              </div>
            )}
          </section>

          <section className="form-section">
            <h2>Capacity & Pricing</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (EUR)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0 for free events"
                />
              </div>

              <div className="form-group">
                <label htmlFor="maxCapacity">Max Capacity</label>
                <input
                  type="number"
                  id="maxCapacity"
                  name="maxCapacity"
                  value={formData.maxCapacity}
                  onChange={handleChange}
                  min="0"
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                Make this event public
              </label>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting || isUploading
                ? "Saving..."
                : isEditing
                  ? "Update Event"
                  : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormPage;
