import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { eventsAPI, geocodeAPI } from "../services/api";
import { parseAddressFromSearch } from "../utils/addressUtils";
import toast from "react-hot-toast";
import AddressForm from "../components/map/AddressForm";
import LocationMap from "../components/map/LocationMap";
import MarkdownEditor from "../components/common/MarkdownEditor";
import ImageUpload from "../components/common/ImageUpload";
import { 
  Loader2, 
  ArrowLeft, 
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const EventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImage, setExistingImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
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

  // Helper for Shadcn Select/Checkbox manual updates
  const handleManualChange = (name, value) => {
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

  const handleImageSelect = (file) => {
    setSelectedFile(file);
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
      // Use shared utility to parse search result
      const parsed = parseAddressFromSearch(newCoords);
      if (parsed) {
        setFormData({
            ...formData,
            location: {
                ...formData.location,
                street: parsed.street || formData.location.street,
                streetNum: parsed.streetNum || formData.location.streetNum,
                zipCode: parsed.zipCode || formData.location.zipCode,
                city: parsed.city || formData.location.city,
                country: parsed.country || formData.location.country,
            }
        });
        // console.log("Parsed address:", parsed);
      }
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
      }
    }
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
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? "Edit Event" : "Create New Event"}
              </h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
              {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Event" : "Publish Event"}
          </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* BASIC INFO */}
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us the details of your event</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Summer Art Exhibition"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                        value={formData.category} 
                        onValueChange={(val) => handleManualChange("category", val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="capitalize">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                     <Label htmlFor="description">Description *</Label>
                     <div className="min-h-[200px] border rounded-md">
                        <MarkdownEditor
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value })}
                            placeholder="Describe your event... (Markdown supported)"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* IMAGE */}
        <Card>
            <CardHeader>
                <CardTitle>Event Image</CardTitle>
                <CardDescription>
                     Upload an image for your event (JPG, PNG, WebP - max 5MB)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ImageUpload
                  existingImages={existingImage ? [existingImage] : []}
                  onFileSelect={handleImageSelect}
                  onRemoveExisting={removeExistingImage}
                  maxFiles={1}
                  multiple={false}
                />
            </CardContent>
        </Card>

        {/* TIME */}
        <Card>
            <CardHeader>
                <CardTitle>Date & Time</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="startDateTime">Start Date & Time *</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="datetime-local"
                                id="startDateTime"
                                name="startDateTime"
                                value={formData.startDateTime}
                                onChange={handleChange}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="endDateTime">End Date & Time *</Label>
                         <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="datetime-local"
                                id="endDateTime"
                                name="endDateTime"
                                value={formData.endDateTime}
                                onChange={handleChange}
                                required
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* LOCATION */}
        <Card>
            <CardHeader>
                <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-2 border p-4 rounded-md bg-muted/20">
                    <Checkbox 
                        id="isOnline" 
                        checked={formData.location.isOnline}
                        onCheckedChange={(checked) => handleManualChange("location.isOnline", checked)}
                    />
                    <div>
                        <Label htmlFor="isOnline" className="font-medium cursor-pointer">This is an online event</Label>
                    </div>
                </div>

                {formData.location.isOnline ? (
                     <div className="space-y-2">
                        <Label htmlFor="location.onlineUrl">Event URL</Label>
                        <Input
                            type="url"
                            id="location.onlineUrl"
                            name="location.onlineUrl"
                            value={formData.location.onlineUrl}
                            onChange={handleChange}
                            placeholder="https://zoom.us/j/..."
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="order-2 lg:order-1">
                             <Label className="mb-4 block">Address Details</Label>
                             <div className="bg-card border rounded-lg p-4">
                                <AddressForm
                                    address={formData.location}
                                    onChange={handleAddressChange}
                                    onGeocode={handleGeocode}
                                    showVenue={true}
                                />
                             </div>
                        </div>
                        <div className="order-1 lg:order-2 space-y-2">
                             <Label>Map Location</Label>
                             <div className="border rounded-lg overflow-hidden h-[350px]">
                                <LocationMap
                                    coordinates={coordinates}
                                    onLocationChange={handleMapLocationChange}
                                    editable={true}
                                    height="100%"
                                    showSearch={true}
                                    zoom={13}
                                />
                             </div>
                             <p className="text-xs text-muted-foreground">
                                Click on the map to automatically set the address.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* CAPACITY & PRICE */}
        <Card>
            <CardHeader>
                <CardTitle>Capacity & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label htmlFor="price">Price (€)</Label>
                        <Input
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
                     <div className="space-y-2">
                        <Label htmlFor="maxCapacity">Max Capacity</Label>
                        <Input
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

                 <div className="flex items-center space-x-2 border p-4 rounded-md">
                    <Checkbox 
                        id="isPublic" 
                        checked={formData.isPublic}
                        onCheckedChange={(checked) => handleManualChange("isPublic", checked)}
                    />
                    <div>
                        <Label htmlFor="isPublic" className="font-medium cursor-pointer">Make this event public</Label>
                        <p className="text-xs text-muted-foreground">
                             Public events are visible to all users in the events page.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Event" : "Publish Event"}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default EventFormPage;
