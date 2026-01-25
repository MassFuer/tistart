import { useState } from "react";
import { FaMapMarkerAlt, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import { geocodeAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./AddressForm.css";

const AddressForm = ({
  address = {},
  onChange,
  onGeocode,
  showVenue = false,
  disabled = false,
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeStatus, setGeocodeStatus] = useState(null); // 'success' | 'error' | null

  const handleChange = (field, value) => {
    if (onChange) {
      onChange({
        ...address,
        [field]: value,
      });
    }
    // Reset geocode status when address changes
    setGeocodeStatus(null);
  };

  const handleGeocode = async () => {
    if (!address.city && !address.country) {
      toast.error("Please enter at least a city or country");
      return;
    }

    setIsGeocoding(true);
    setGeocodeStatus(null);

    try {
      const response = await geocodeAPI.geocode({
        street: address.street,
        streetNum: address.streetNum,
        zipCode: address.zipCode,
        city: address.city,
        country: address.country,
      });

      if (response.data?.data) {
        const { lat, lng, displayName } = response.data.data;
        setGeocodeStatus("success");
        toast.success("Location found!");

        if (onGeocode) {
          onGeocode({ lat, lng, displayName });
        }
      }
    } catch (error) {
      setGeocodeStatus("error");
      const message = error.response?.data?.error || "Could not find location";
      toast.error(message);
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <div className="address-form">
      {showVenue && (
        <div className="form-group">
          <label htmlFor="venue">Venue Name</label>
          <input
            type="text"
            id="venue"
            value={address.venue || ""}
            onChange={(e) => handleChange("venue", e.target.value)}
            placeholder="e.g., Gallery Modern Art"
            disabled={disabled}
          />
        </div>
      )}

      <div className="form-row">
        <div className="form-group flex-2">
          <label htmlFor="street">Street</label>
          <input
            type="text"
            id="street"
            value={address.street || ""}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="e.g., Rue de Rivoli"
            disabled={disabled}
          />
        </div>
        <div className="form-group flex-1">
          <label htmlFor="streetNum">Number</label>
          <input
            type="text"
            id="streetNum"
            value={address.streetNum || ""}
            onChange={(e) => handleChange("streetNum", e.target.value)}
            placeholder="e.g., 123"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group flex-1">
          <label htmlFor="zipCode">Zip Code</label>
          <input
            type="text"
            id="zipCode"
            value={address.zipCode || ""}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            placeholder="e.g., 75001"
            disabled={disabled}
          />
        </div>
        <div className="form-group flex-2">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            value={address.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="e.g., Paris"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="country">Country</label>
        <input
          type="text"
          id="country"
          value={address.country || ""}
          onChange={(e) => handleChange("country", e.target.value)}
          placeholder="e.g., France"
          disabled={disabled}
        />
      </div>

      {!disabled && (
        <button
          type="button"
          className={`btn-geocode ${geocodeStatus === "error" ? "geocode-error" : geocodeStatus || ""}`}
          onClick={handleGeocode}
          disabled={isGeocoding || (!address.city && !address.country)}
        >
          {isGeocoding ? (
            <>
              <FaSpinner className="spin" /> Finding location...
            </>
          ) : geocodeStatus === "success" ? (
            <>
              <FaCheck /> Location found
            </>
          ) : geocodeStatus === "error" ? (
            <>
              <FaTimes /> Try again
            </>
          ) : (
            <>
              <FaMapMarkerAlt /> Locate on Map
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default AddressForm;
