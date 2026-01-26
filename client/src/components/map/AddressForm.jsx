import { useState } from "react";
import { MapPin, Loader2, Check, X } from "lucide-react";
import { geocodeAPI } from "../../services/api";
import toast from "react-hot-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="space-y-4">
      {showVenue && (
        <div className="space-y-2">
          <Label htmlFor="venue">Venue Name</Label>
          <Input
            type="text"
            id="venue"
            value={address.venue || ""}
            onChange={(e) => handleChange("venue", e.target.value)}
            placeholder="e.g., Vélodrome Stadium"
            disabled={disabled}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="street">Street</Label>
          <Input
            type="text"
            id="street"
            value={address.street || ""}
            onChange={(e) => handleChange("street", e.target.value)}
            placeholder="e.g., Boulevard Michelet"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="streetNum">Number</Label>
          <Input
            type="text"
            id="streetNum"
            value={address.streetNum || ""}
            onChange={(e) => handleChange("streetNum", e.target.value)}
            placeholder="e.g., 123"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zipCode">Zip Code</Label>
          <Input
            type="text"
            id="zipCode"
            value={address.zipCode || ""}
            onChange={(e) => handleChange("zipCode", e.target.value)}
            placeholder="e.g., 13000"
            disabled={disabled}
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            type="text"
            id="city"
            value={address.city || ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="e.g., Marseille"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Input
          type="text"
          id="country"
          value={address.country || ""}
          onChange={(e) => handleChange("country", e.target.value)}
          placeholder="e.g., France"
          disabled={disabled}
        />
      </div>

      {!disabled && (
        <Button
          type="button"
          variant={geocodeStatus === "success" ? "default" : geocodeStatus === "error" ? "destructive" : "secondary"}
          className="w-full sm:w-auto"
          onClick={handleGeocode}
          disabled={isGeocoding || (!address.city && !address.country)}
        >
          {isGeocoding ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finding location...
            </>
          ) : geocodeStatus === "success" ? (
            <>
              <Check className="mr-2 h-4 w-4" /> Location found
            </>
          ) : geocodeStatus === "error" ? (
            <>
              <X className="mr-2 h-4 w-4" /> Try again
            </>
          ) : (
            <>
              <MapPin className="mr-2 h-4 w-4" /> Locate on Map
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default AddressForm;
