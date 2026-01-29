import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle, Building2, User, Globe, Instagram, Facebook, Twitter, Upload } from "lucide-react";

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
    siret: "",
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
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Redirect/Status View if already applied
  if (user?.artistStatus !== "none" && user?.artistStatus !== "incomplete") {
    return (
      <div className="container mx-auto max-w-2xl py-20 px-4">
        <Card className="text-center shadow-lg border-0">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {user?.artistStatus === "verified" ? (
                <CheckCircle2 className="h-8 w-8 text-primary" />
              ) : (
                <AlertCircle className="h-8 w-8 text-yellow-500" />
              )}
            </div>
            <CardTitle className="text-2xl">Artist Application Status</CardTitle>
            <CardDescription className="text-base mt-2">
              Current Status: <span className="font-semibold capitalize text-foreground">{user?.artistStatus}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.artistStatus === "pending" && (
              <p className="text-muted-foreground">
                Your application is currently under review. Our team will verify your portfolio and information shortly.
                We'll notify you via email once a decision has been made.
              </p>
            )}
            {user?.artistStatus === "incomplete" && (
              <p className="text-muted-foreground">
                Your application has been marked as incomplete. Please update your profile information and contact support.
              </p>
            )}
            {user?.artistStatus === "verified" && (
              <p className="text-muted-foreground">
                Congratulations! You are a verified artist. You can now access your dashboard to manage your artworks and events.
              </p>
            )}
            {user?.artistStatus === "suspended" && (
              <p className="text-destructive">
                Your artist account has been suspended. Please contact our support team for more information.
              </p>
            )}
          </CardContent>
          <CardFooter className="justify-center pt-4">
            {user?.artistStatus === "verified" && (
              <Button onClick={() => navigate("/dashboard")} size="lg">
                Go to Artist Dashboard
              </Button>
            )}
            {user?.artistStatus === "pending" && (
               <Button variant="outline" onClick={() => navigate("/")}>Return Home</Button>
            )}
          </CardFooter>
        </Card>
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
  
  const handleSelectChange = (val) => {
      setFormData({ ...formData, type: val });
  }

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one social media link
    const hasSocialMedia = Object.values(formData.socialMedia).some(val => val.trim() !== "");
    if (!hasSocialMedia) {
      toast.error("Please provide at least one social media link or website");
      return;
    }

    // Validate profile picture
    if (!profilePicture) {
      toast.error("Please upload a profile picture (or a cover image, your masterpiece for instance)");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append("profilePicture", profilePicture);
      submitData.append("companyName", formData.companyName);
      submitData.append("tagline", formData.tagline);
      submitData.append("description", formData.description);
      submitData.append("type", formData.type);
      submitData.append("taxId", formData.taxId);
      submitData.append("vatNumber", formData.vatNumber);
      submitData.append("siret", formData.siret);
      submitData.append("address", JSON.stringify(formData.address));
      submitData.append("socialMedia", JSON.stringify(formData.socialMedia));

      await applyAsArtist(submitData);
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
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Onboard as an Artist</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join our curated community of creators. Fill out the application below to start exhibiting and selling your work to collectors worldwide.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-8">
          
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Basic Information
              </CardTitle>
              <CardDescription>Tell us about who you are as an artist</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Artist / Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Studio Picasso"
                  />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Entity Type *</Label>
                    <Select value={formData.type} onValueChange={handleSelectChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="individual">Individual Artist</SelectItem>
                            <SelectItem value="company">Company / Gallery</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="A short punchy description (e.g. 'Contemporary Abstract Painter')"
                  />
              </div>

              <div className="space-y-2">
                  <Label htmlFor="description">Bio / Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    placeholder="Tell us your story, your inspiration, and what makes your art unique..."
                    className="min-h-[150px]"
                  />
              </div>

              {/* Profile Picture Upload */}
              <div className="space-y-2">
                <Label htmlFor="profilePicture">Profile Picture *</Label>
                <div className="flex items-center gap-4">
                  {profilePicturePreview && (
                    <img
                      src={profilePicturePreview}
                      alt="Profile preview"
                      className="h-20 w-20 rounded-full object-cover border-2 border-border"
                    />
                  )}
                  <div className="flex-1">
                    <Input
                      id="profilePicture"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload a professional profile photo (JPG, PNG, max 20MB)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> Business Details
                </CardTitle>
                <CardDescription>Required for invoicing and payments</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID / SSN</Label>
                        <Input
                            id="taxId"
                            name="taxId"
                            value={formData.taxId}
                            onChange={handleChange}
                            placeholder="Optional"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vatNumber">VAT Number *</Label>
                        <Input
                            id="vatNumber"
                            name="vatNumber"
                            value={formData.vatNumber}
                            onChange={handleChange}
                            required
                            placeholder="FR12345678901"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="siret">SIRET Number *</Label>
                        <Input
                            id="siret"
                            name="siret"
                            value={formData.siret}
                            onChange={handleChange}
                            required
                            placeholder="12345678901234 (14 digits)"
                            maxLength="14"
                        />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label>Address *</Label>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-3">
                             <Input
                                name="address.street"
                                value={formData.address.street}
                                onChange={handleChange}
                                required
                                placeholder="Street Address"
                            />
                        </div>
                        <div>
                            <Input
                                name="address.streetNum"
                                value={formData.address.streetNum}
                                onChange={handleChange}
                                required
                                placeholder="No."
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3 mt-2">
                         <Input
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleChange}
                            required
                            placeholder="City"
                        />
                         <Input
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleChange}
                            required
                            placeholder="Postal Code"
                        />
                         <Input
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleChange}
                            required
                            placeholder="Country"
                        />
                    </div>
                 </div>
            </CardContent>
          </Card>

          {/* Social Media */}
          <Card>
             <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> Online Presence
                </CardTitle>
                <CardDescription>At least one link required - where can collectors find more about you?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                         <Label className="flex items-center gap-2"><Globe className="h-3 w-3"/> Website</Label>
                         <Input
                            type="url"
                            name="socialMedia.website"
                            value={formData.socialMedia.website}
                            onChange={handleChange}
                            placeholder="https://..."
                         />
                    </div>
                    <div className="space-y-2">
                         <Label className="flex items-center gap-2"><Instagram className="h-3 w-3"/> Instagram</Label>
                         <Input
                            type="url"
                            name="socialMedia.instagram"
                            value={formData.socialMedia.instagram}
                            onChange={handleChange}
                            placeholder="https://instagram.com/..."
                         />
                    </div>
                    <div className="space-y-2">
                         <Label className="flex items-center gap-2"><Facebook className="h-3 w-3"/> Facebook</Label>
                         <Input
                            type="url"
                            name="socialMedia.facebook"
                            value={formData.socialMedia.facebook}
                            onChange={handleChange}
                            placeholder="https://facebook.com/..."
                         />
                    </div>
                     <div className="space-y-2">
                         <Label className="flex items-center gap-2"><Twitter className="h-3 w-3"/> Twitter / X</Label>
                         <Input
                            type="url"
                            name="socialMedia.twitter"
                            value={formData.socialMedia.twitter}
                            onChange={handleChange}
                            placeholder="https://twitter.com/..."
                         />
                    </div>
                </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" className="w-full md:w-auto px-8" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting Application..." : "Submit Application"}
              </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ApplyArtistPage;