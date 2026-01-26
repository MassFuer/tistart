import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { usersAPI, geocodeAPI } from "../../services/api";
import { parseAddressFromSearch } from "../../utils/addressUtils";
import LocationMap from "../map/LocationMap";
import { 
  User, 
  MapPin, 
  Camera, 
  Upload,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Loader2,
  Lock,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const ProfileSettings = () => {
  const { user, refreshUser, updateArtistInfo, isArtist } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
  });

  const [artistData, setArtistData] = useState({
    companyName: "",
    tagline: "",
    description: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
  });

  const [addressData, setAddressData] = useState({
    street: "",
    streetNum: "",
    zipCode: "",
    city: "",
    country: "",
  });

  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        userName: user.userName || "",
      });

      if (user.artistInfo) {
        setArtistData({
          companyName: user.artistInfo.companyName || "",
          tagline: user.artistInfo.tagline || "",
          description: user.artistInfo.description || "",
          website: user.artistInfo.socialMedia?.website || "",
          instagram: user.artistInfo.socialMedia?.instagram || "",
          facebook: user.artistInfo.socialMedia?.facebook || "",
          twitter: user.artistInfo.socialMedia?.twitter || "",
        });

        if (user.artistInfo.address) {
          setAddressData({
            street: user.artistInfo.address.street || "",
            streetNum: user.artistInfo.address.streetNum || "",
            zipCode: user.artistInfo.address.zipCode || "",
            city: user.artistInfo.address.city || "",
            country: user.artistInfo.address.country || "",
          });

          const loc = user.artistInfo.address.location;
          if (loc?.coordinates?.length === 2) {
            setCoordinates({ lng: loc.coordinates[0], lat: loc.coordinates[1] });
          }
        }
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleArtistChange = (e) => {
    setArtistData({ ...artistData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    setAddressData({ ...addressData, [e.target.name]: e.target.value });
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      toast.error(error.response?.data?.error || "Failed to upload picture");
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      toast.error(error.response?.data?.error || "Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const onProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await usersAPI.updateProfile(profileData);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onArtistSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateArtistInfo({
        companyName: artistData.companyName,
        tagline: artistData.tagline,
        description: artistData.description,
        socialMedia: {
          website: artistData.website,
          instagram: artistData.instagram,
          facebook: artistData.facebook,
          twitter: artistData.twitter,
        },
      });
      await refreshUser();
      toast.success("Artist info updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update artist info");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddressSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        address: {
          ...addressData,
          location: coordinates ? {
            type: "Point",
            coordinates: [coordinates.lng, coordinates.lat],
          } : undefined
        }
      };
      await updateArtistInfo(payload);
      await refreshUser();
      toast.success("Address updated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMapLocationChange = async (location) => {
    setCoordinates({ lat: location.lat, lng: location.lng });
    
    if (!location.address) {
       try {
        const response = await geocodeAPI.reverse(location.lat, location.lng);
        const addr = response.data.data;
        setAddressData(prev => ({
          ...prev,
          street: addr.street || prev.street,
          streetNum: addr.streetNum || prev.streetNum,
          zipCode: addr.zipCode || prev.zipCode,
          city: addr.city || prev.city,
          country: addr.country || prev.country,
        }));
        toast.success("Address updated from map selection");
      } catch (error) {
        console.error("Geocoding error", error);
      }
    } else {
      const parsed = parseAddressFromSearch(location);
      if (parsed) {
        setAddressData(prev => ({ ...prev, ...parsed }));
        toast.success("Address updated from search");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-card p-6 rounded-lg border shadow-sm">
        <div className="relative group">
           <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-muted">
              {user.profilePicture ? (
                <img src={user.profilePicture} alt={user.firstName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground bg-muted">
                    {user.firstName[0]}{user.lastName[0]}
                </div>
              )}
           </div>
           <Button 
                size="icon" 
                variant="secondary" 
                className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
            >
                {isUploadingPicture ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleProfilePictureUpload}
            />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">{user.firstName} {user.lastName}</h2>
            <p className="text-muted-foreground">@{user.userName}</p>
            <p className="text-xs text-muted-foreground break-all">{user.email}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[500px] mb-6">
            <TabsTrigger value="personal"><User className="h-4 w-4 mr-2" /> Personal</TabsTrigger>
            <TabsTrigger value="address"><MapPin className="h-4 w-4 mr-2" /> Address</TabsTrigger>
            {isArtist && <TabsTrigger value="artist"><Globe className="h-4 w-4 mr-2" /> Artist</TabsTrigger>}
            <TabsTrigger value="account"><Lock className="h-4 w-4 mr-2" /> Account</TabsTrigger>
        </TabsList>

        {/* PERSONAL */}
        <TabsContent value="personal">
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="profile-form" onSubmit={onProfileSubmit} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" value={profileData.firstName} onChange={handleProfileChange} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" value={profileData.lastName} onChange={handleProfileChange} required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="userName">Username</Label>
                            <Input id="userName" name="userName" value={profileData.userName} onChange={handleProfileChange} required />
                        </div>
                    </form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" form="profile-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>

        {/* ADDRESS */}
        <TabsContent value="address">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <Card>
                    <CardHeader>
                        <CardTitle>Address Details</CardTitle>
                        <CardDescription>Enter your address details or use the map.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="address-form" onSubmit={onAddressSubmit} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1 space-y-2">
                                    <Label htmlFor="streetNum">Number</Label>
                                    <Input id="streetNum" name="streetNum" value={addressData.streetNum} onChange={handleAddressChange} />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="street">Street Name</Label>
                                    <Input id="street" name="street" value={addressData.street} onChange={handleAddressChange} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" value={addressData.city} onChange={handleAddressChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Zip Code</Label>
                                    <Input id="zipCode" name="zipCode" value={addressData.zipCode} onChange={handleAddressChange} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" name="country" value={addressData.country} onChange={handleAddressChange} />
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" form="address-form" disabled={isSubmitting} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Address
                        </Button>
                    </CardFooter>
                 </Card>
                 
                 <div className="h-[400px] lg:h-auto rounded-lg overflow-hidden border shadow-sm relative z-0">
                     <LocationMap 
                        coordinates={coordinates} 
                        editable={true} 
                        onLocationChange={handleMapLocationChange} 
                        height="100%"
                     />
                 </div>
            </div>
        </TabsContent>

        {/* ARTIST (Only if isArtist) */}
        {isArtist && (
             <TabsContent value="artist">
                 <Card>
                     <CardHeader>
                        <CardTitle>Artist Details</CardTitle>
                        <CardDescription>Manage your public artist profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form id="artist-form" onSubmit={onArtistSubmit} className="space-y-6">
                            <div className="flex items-center gap-4">
                                 <div className="h-20 w-20 rounded-md border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                                    {user.artistInfo?.logo ? (
                                        <img src={user.artistInfo.logo} alt="Logo" className="h-full w-full object-contain" />
                                    ) : (
                                        <Upload className="h-6 w-6 text-muted-foreground" />
                                    )}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium">Change</div>
                                 </div>
                                 <div>
                                     <Label>Artist Logo</Label>
                                     <p className="text-xs text-muted-foreground">Recommended size: 200x200px</p>
                                 </div>
                                 <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company / Artist Name</Label>
                                    <Input id="companyName" name="companyName" value={artistData.companyName} onChange={handleArtistChange} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="tagline">Tagline</Label>
                                    <Input id="tagline" name="tagline" value={artistData.tagline} onChange={handleArtistChange} placeholder="Short catchy phrase" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Bio / Description</Label>
                                <Textarea id="description" name="description" value={artistData.description} onChange={handleArtistChange} rows={4} />
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <Label>Social Media</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-4 w-4 text-muted-foreground" />
                                        <Input name="website" placeholder="Website URL" value={artistData.website} onChange={handleArtistChange} className="h-8 text-sm" />
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Instagram className="h-4 w-4 text-muted-foreground" />
                                        <Input name="instagram" placeholder="Instagram URL" value={artistData.instagram} onChange={handleArtistChange} className="h-8 text-sm" />
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Facebook className="h-4 w-4 text-muted-foreground" />
                                        <Input name="facebook" placeholder="Facebook URL" value={artistData.facebook} onChange={handleArtistChange} className="h-8 text-sm" />
                                    </div>
                                     <div className="flex items-center gap-2">
                                        <Twitter className="h-4 w-4 text-muted-foreground" />
                                        <Input name="twitter" placeholder="Twitter URL" value={artistData.twitter} onChange={handleArtistChange} className="h-8 text-sm" />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" form="artist-form" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Artist Details
                         </Button>
                    </CardFooter>
                 </Card>
             </TabsContent>
        )}

        {/* ACCOUNT */}
        <TabsContent value="account">
             <Card>
                <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your account preferences.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between p-4 border rounded-lg">
                         <div>
                             <h4 className="font-medium">Change Password</h4>
                             <p className="text-sm text-muted-foreground">Update your password to keep your account secure.</p>
                         </div>
                         <Button variant="outline" disabled>Coming Soon</Button>
                     </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                         <div>
                             <h4 className="font-medium text-destructive">Delete Account</h4>
                             <p className="text-sm text-muted-foreground">Permanently remove your account and all data.</p>
                         </div>
                         <Button variant="destructive" disabled>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                         </Button>
                     </div>
                </CardContent>
             </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default ProfileSettings;
