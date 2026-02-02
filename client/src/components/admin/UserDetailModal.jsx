import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { adminAPI, platformAPI, messagingAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "@/components/common/Loading";
import {
  User,
  Mail,
  AtSign,
  Calendar,
  Shield,
  AlertTriangle,
  Trash2,
  Edit,
  Copy,
  FileIcon,
  Film,
  HardDrive,
  MessageCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Palette,
  CalendarDays,
} from "lucide-react";

const UserDetailModal = ({ userId, onClose, onUpdate, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({});

  // File Listing State
  const [showFiles, setShowFiles] = useState(false);
  const [userFiles, setUserFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const isSuperAdmin = currentUser?.role === "superAdmin";
  const roles = isSuperAdmin
    ? ["user", "artist", "gallerist", "admin", "superAdmin"]
    : ["user", "artist", "gallerist", "admin"];
  const statuses = ["none", "pending", "incomplete", "verified", "suspended"];

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getUser(userId);
      setUser(response.data.data);
      setFormData({
        firstName: response.data.data.firstName || "",
        lastName: response.data.data.lastName || "",
        userName: response.data.data.userName || "",
        email: response.data.data.email || "",
        role: response.data.data.role || "user",
        artistStatus: response.data.data.artistStatus || "none",
        galleristStatus: response.data.data.galleristStatus || "none",
        profilePicture: response.data.data.profilePicture || "",
        artistInfo: {
          companyName: response.data.data.artistInfo?.companyName || "",
          tagline: response.data.data.artistInfo?.tagline || "",
          description: response.data.data.artistInfo?.description || "",
          type: response.data.data.artistInfo?.type || "individual",
          taxId: response.data.data.artistInfo?.taxId || "",
          vatNumber: response.data.data.artistInfo?.vatNumber || "",
          siret: response.data.data.artistInfo?.siret || "",
          address: {
            street: response.data.data.artistInfo?.address?.street || "",
            streetNum: response.data.data.artistInfo?.address?.streetNum || "",
            zipCode: response.data.data.artistInfo?.address?.zipCode || "",
            city: response.data.data.artistInfo?.address?.city || "",
            country: response.data.data.artistInfo?.address?.country || "",
          },
          socialMedia: {
            facebook:
              response.data.data.artistInfo?.socialMedia?.facebook || "",
            instagram:
              response.data.data.artistInfo?.socialMedia?.instagram || "",
            twitter: response.data.data.artistInfo?.socialMedia?.twitter || "",
            website: response.data.data.artistInfo?.socialMedia?.website || "",
          },
          policies: {
            returnDays:
              response.data.data.artistInfo?.policies?.returnDays || 14,
            freeShippingThreshold:
              response.data.data.artistInfo?.policies?.freeShippingThreshold ||
              0,
            taxRate: response.data.data.artistInfo?.policies?.taxRate || 0,
          },
        },
      });
    } catch (error) {
      toast.error("Failed to load user details");
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const parts = name.split(".");
      setFormData((prev) => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await adminAPI.updateUser(userId, formData);
      toast.success("User updated successfully");
      setIsEditing(false);
      fetchUser();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  // ...
  const navigate = useNavigate();

  const handleContact = async () => {
    try {
      const res = await messagingAPI.createConversation({
        participantId: userId,
      });
      onClose();
      const convId = res.data.data?._id || res.data._id;
      navigate(`/messages?conversation=${convId}`);
    } catch (error) {
      console.error("Start chat error", error);
      toast.error("Failed to start conversation");
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await adminAPI.updateArtistStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUser();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };
  // ...

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await adminAPI.deleteUser(userId);
      toast.success("User deleted successfully");
      if (onDelete) onDelete();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const canEdit = () => {
    if (!user) return false;
    if (isSuperAdmin) {
      return user.role !== "superAdmin" || user._id === currentUser._id;
    }
    return user.role !== "admin" && user.role !== "superAdmin";
  };

  const canDelete = () => {
    if (!user) return false;
    if (user._id === currentUser._id) return false;
    if (isSuperAdmin) {
      return user.role !== "superAdmin";
    }
    return user.role !== "admin" && user.role !== "superAdmin";
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleViewFiles = async () => {
    setShowFiles(true);
    if (userFiles.length > 0) return;

    setFilesLoading(true);
    try {
      const res = await platformAPI.getUserFiles(userId);
      setUserFiles(res.data.data);
    } catch (err) {
      toast.error("Failed to load user files");
    } finally {
      setFilesLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <Loading />
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) return null;

  if (showFiles) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFiles(false)}
              >
                ← Back
              </Button>
              <DialogTitle>
                User Files: {user?.firstName} {user?.lastName}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto bg-muted/10">
            {filesLoading ? (
              <div className="py-20 flex justify-center">
                <Loading message="Loading files..." />
              </div>
            ) : (
              <div className="p-6">
                {userFiles.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    No files found in storage.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {userFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-card p-3 rounded border text-sm hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          {file.type === "video" ? (
                            <Film className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-orange-500" />
                          )}
                          <div className="flex flex-col truncate">
                            <span
                              className="font-medium truncate max-w-[300px]"
                              title={file.key}
                            >
                              {file.key.split("/").pop()}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {file.type} •{" "}
                              {(file.size / (1024 * 1024)).toFixed(2)} MB •{" "}
                              {new Date(file.lastModified).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(file.url);
                              toast.success("URL copied");
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Link to={file.url} target="_blank">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              Open
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <DialogFooter className="p-4 border-t">
            <Button onClick={() => setShowFiles(false)}>Close Files</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{isEditing ? "Edit User" : "User Details"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header Profile - Only show in View mode */}
            {!isEditing && (
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border">
                  <AvatarImage src={user.profilePicture} />
                  <AvatarFallback className="text-xl">
                    {user.firstName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-muted-foreground">@{user.userName}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge
                      variant={
                        user.role === "admin" || user.role === "superAdmin"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {user.role}
                    </Badge>
                    {user.artistStatus !== "none" && (
                      <Badge
                        variant="outline"
                        className="capitalize text-orange-600 border-orange-200 bg-orange-50"
                      >
                        Artist: {user.artistStatus}
                      </Badge>
                    )}
                    {user.galleristStatus !== "none" && (
                      <Badge
                        variant="outline"
                        className="capitalize text-purple-600 border-purple-200 bg-purple-50"
                      >
                        Gallerist: {user.galleristStatus}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form Mode */}
            {isEditing ? (
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-5 h-9 mb-4">
                  <TabsTrigger value="account" className="text-xs">
                    Account
                  </TabsTrigger>
                  <TabsTrigger value="profile" className="text-xs">
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="business" className="text-xs">
                    Business
                  </TabsTrigger>
                  <TabsTrigger value="address" className="text-xs">
                    Address
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs">
                    Ext.
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="account" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="userName">Username</Label>
                    <Input
                      id="userName"
                      name="userName"
                      value={formData.userName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(val) => handleSelectChange("role", val)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.role === "artist" && (
                      <div className="space-y-2">
                        <Label>Artist Status</Label>
                        <Select
                          value={formData.artistStatus}
                          onValueChange={(val) =>
                            handleSelectChange("artistStatus", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {formData.role === "gallerist" && (
                      <div className="space-y-2">
                        <Label>Gallerist Status</Label>
                        <Select
                          value={formData.galleristStatus}
                          onValueChange={(val) =>
                            handleSelectChange("galleristStatus", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statuses.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="profile" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profilePicture">Profile Picture URL</Label>
                    <Input
                      id="profilePicture"
                      name="profilePicture"
                      value={formData.profilePicture}
                      onChange={handleChange}
                      placeholder="https://..."
                    />
                    {formData.profilePicture && (
                      <div className="mt-2 flex justify-center">
                        <Avatar className="h-24 w-24 border">
                          <AvatarImage src={formData.profilePicture} />
                          <AvatarFallback>Preview</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artistInfo.tagline">Tagline</Label>
                    <Input
                      id="artistInfo.tagline"
                      name="artistInfo.tagline"
                      value={formData.artistInfo.tagline}
                      onChange={handleChange}
                      placeholder="Contemporary Artist & Sculptor"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artistInfo.description">
                      Description / Bio
                    </Label>
                    <textarea
                      id="artistInfo.description"
                      name="artistInfo.description"
                      value={formData.artistInfo.description}
                      onChange={handleChange}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Tell the world about yourself..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="artistInfo.companyName">
                      Company / Professional Name
                    </Label>
                    <Input
                      id="artistInfo.companyName"
                      name="artistInfo.companyName"
                      value={formData.artistInfo.companyName}
                      onChange={handleChange}
                      placeholder="Artistic Vision LLC"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Entity Type</Label>
                      <Select
                        value={formData.artistInfo.type}
                        onValueChange={(val) =>
                          handleSelectChange("artistInfo.type", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.siret">SIRET (FR)</Label>
                      <Input
                        id="artistInfo.siret"
                        name="artistInfo.siret"
                        value={formData.artistInfo.siret}
                        onChange={handleChange}
                        placeholder="9-digit or 14-digit number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.taxId">
                        Tax ID (Federal/Local)
                      </Label>
                      <Input
                        id="artistInfo.taxId"
                        name="artistInfo.taxId"
                        value={formData.artistInfo.taxId}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.vatNumber">VAT Number</Label>
                      <Input
                        id="artistInfo.vatNumber"
                        name="artistInfo.vatNumber"
                        value={formData.artistInfo.vatNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="address" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="artistInfo.address.street">Street</Label>
                      <Input
                        id="artistInfo.address.street"
                        name="artistInfo.address.street"
                        value={formData.artistInfo.address.street}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.address.streetNum">
                        Num / Apt
                      </Label>
                      <Input
                        id="artistInfo.address.streetNum"
                        name="artistInfo.address.streetNum"
                        value={formData.artistInfo.address.streetNum}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.address.city">City</Label>
                      <Input
                        id="artistInfo.address.city"
                        name="artistInfo.address.city"
                        value={formData.artistInfo.address.city}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.address.zipCode">
                        Zip Code
                      </Label>
                      <Input
                        id="artistInfo.address.zipCode"
                        name="artistInfo.address.zipCode"
                        value={formData.artistInfo.address.zipCode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artistInfo.address.country">Country</Label>
                    <Input
                      id="artistInfo.address.country"
                      name="artistInfo.address.country"
                      value={formData.artistInfo.address.country}
                      onChange={handleChange}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <h4 className="text-sm font-semibold border-b pb-1">
                    Social Media
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.socialMedia.website">
                        Website
                      </Label>
                      <Input
                        id="artistInfo.socialMedia.website"
                        name="artistInfo.socialMedia.website"
                        value={formData.artistInfo.socialMedia.website}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.socialMedia.instagram">
                        Instagram
                      </Label>
                      <Input
                        id="artistInfo.socialMedia.instagram"
                        name="artistInfo.socialMedia.instagram"
                        value={formData.artistInfo.socialMedia.instagram}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <h4 className="text-sm font-semibold border-b pb-1 pt-2">
                    Policies
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.policies.returnDays">
                        Return Days
                      </Label>
                      <Input
                        id="artistInfo.policies.returnDays"
                        name="artistInfo.policies.returnDays"
                        type="number"
                        value={formData.artistInfo.policies.returnDays}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.policies.taxRate">
                        Tax Rate (%)
                      </Label>
                      <Input
                        id="artistInfo.policies.taxRate"
                        name="artistInfo.policies.taxRate"
                        type="number"
                        value={formData.artistInfo.policies.taxRate}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="artistInfo.policies.freeShippingThreshold">
                        Free Ship. Over (€)
                      </Label>
                      <Input
                        id="artistInfo.policies.freeShippingThreshold"
                        name="artistInfo.policies.freeShippingThreshold"
                        type="number"
                        value={
                          formData.artistInfo.policies.freeShippingThreshold
                        }
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // View Mode
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                      <User className="h-4 w-4" /> Account Info
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" /> Email
                        </span>
                        <span>{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Shield className="h-3 w-3" /> Verified
                        </span>
                        <span
                          className={
                            user.isEmailVerified
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {user.isEmailVerified ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" /> Created
                        </span>
                        <span>{formatDate(user.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <CalendarDays className="h-3 w-3" /> Updated
                        </span>
                        <span>{formatDate(user.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge
                        variant={
                          user.role === "admin" || user.role === "superAdmin"
                            ? "default"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {user.role}
                      </Badge>
                      {user.artistStatus !== "none" && (
                        <Badge
                          variant="outline"
                          className="capitalize text-orange-600 border-orange-200 bg-orange-50"
                        >
                          Artist: {user.artistStatus}
                        </Badge>
                      )}
                      {user.galleristStatus !== "none" && (
                        <Badge
                          variant="outline"
                          className="capitalize text-purple-600 border-purple-200 bg-purple-50"
                        >
                          Gallerist: {user.galleristStatus}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Artist/Business Details */}
                  {user.artistInfo &&
                    (user.artistStatus !== "none" ||
                      user.galleristStatus !== "none") && (
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                          <AtSign className="h-4 w-4" /> Business Profile
                        </h3>
                        <div className="space-y-2 text-sm">
                          {user.artistInfo.companyName && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Company
                              </span>
                              <span>{user.artistInfo.companyName}</span>
                            </div>
                          )}
                          {user.artistInfo.type && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Type
                              </span>
                              <span className="capitalize">
                                {user.artistInfo.type}
                              </span>
                            </div>
                          )}
                          {user.artistInfo.taxId && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Tax ID
                              </span>
                              <span>{user.artistInfo.taxId}</span>
                            </div>
                          )}
                          {user.artistInfo.vatNumber && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                VAT Number
                              </span>
                              <span>{user.artistInfo.vatNumber}</span>
                            </div>
                          )}
                          {user.artistInfo.siret && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                SIRET
                              </span>
                              <span>{user.artistInfo.siret}</span>
                            </div>
                          )}
                          {user.subscriptionTier && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Subscription
                              </span>
                              <Badge variant="outline" className="capitalize">
                                {user.subscriptionTier}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Description/Bio */}
                        {user.artistInfo.description && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">
                              Description
                            </p>
                            <p className="text-sm bg-muted/30 p-3 rounded-md">
                              {user.artistInfo.description}
                            </p>
                          </div>
                        )}

                        {/* Social Media */}
                        {user.artistInfo.socialMedia &&
                          Object.keys(user.artistInfo.socialMedia).length >
                            0 && (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">
                                Social Media
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {user.artistInfo.socialMedia.website && (
                                  <a
                                    href={user.artistInfo.socialMedia.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Website
                                  </a>
                                )}
                                {user.artistInfo.socialMedia.instagram && (
                                  <a
                                    href={user.artistInfo.socialMedia.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Instagram
                                  </a>
                                )}
                                {user.artistInfo.socialMedia.twitter && (
                                  <a
                                    href={user.artistInfo.socialMedia.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Twitter
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                </div>

                {/* Address Information */}
                {user.artistInfo?.address && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                      <User className="h-4 w-4" /> Address
                    </h3>
                    <div className="space-y-2 text-sm">
                      {user.artistInfo.address.street && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            Street & Number
                          </span>
                          <span>
                            {user.artistInfo.address.street}
                            {user.artistInfo.address.streetNum
                              ? ` ${user.artistInfo.address.streetNum}`
                              : ""}
                          </span>
                        </div>
                      )}
                      {user.artistInfo.address.city && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">City</span>
                          <span>{user.artistInfo.address.city}</span>
                        </div>
                      )}
                      {user.artistInfo.address.zipCode && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Zip Code
                          </span>
                          <span>{user.artistInfo.address.zipCode}</span>
                        </div>
                      )}
                      {user.artistInfo.address.country && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country</span>
                          <span>{user.artistInfo.address.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Artist Statistics */}
                {user.artistStatus === "verified" && user.artistStats && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                      <TrendingUp className="h-4 w-4" /> Artist Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm bg-muted/30 p-4 rounded-lg">
                      {user.artistStats.totalRevenue !== undefined && (
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Total Revenue
                          </p>
                          <p className="font-medium text-green-600">
                            €{(user.artistStats.totalRevenue / 100).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {user.artistStats.totalSales !== undefined && (
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Total Sales
                          </p>
                          <p className="font-medium">
                            {user.artistStats.totalSales}
                          </p>
                        </div>
                      )}
                      {user.artistStats.totalArtworks !== undefined && (
                        <div>
                          <p className="text-muted-foreground mb-1">Artworks</p>
                          <p className="font-medium">
                            {user.artistStats.totalArtworks}
                          </p>
                        </div>
                      )}
                      {user.artistStats.totalEvents !== undefined && (
                        <div>
                          <p className="text-muted-foreground mb-1">Events</p>
                          <p className="font-medium">
                            {user.artistStats.totalEvents}
                          </p>
                        </div>
                      )}
                      {isSuperAdmin &&
                        user.artistStats.totalViews !== undefined && (
                          <div>
                            <p className="text-muted-foreground mb-1">
                              Total Views
                            </p>
                            <p className="font-medium">
                              {user.artistStats.totalViews}
                            </p>
                          </div>
                        )}
                      {isSuperAdmin &&
                        user.artistStats.totalPlays !== undefined && (
                          <div>
                            <p className="text-muted-foreground mb-1">
                              Total Plays
                            </p>
                            <p className="font-medium">
                              {user.artistStats.totalPlays}
                            </p>
                          </div>
                        )}
                    </div>
                    {user.artistStats.avgRating !== undefined && (
                      <div className="text-sm text-center">
                        <span className="text-muted-foreground">
                          Average Rating:{" "}
                        </span>
                        <span className="font-medium">
                          {user.artistStats.avgRating.toFixed(1)} / 5.0
                        </span>
                        {user.artistStats.totalReviews !== undefined && (
                          <span className="text-muted-foreground">
                            {" "}
                            ({user.artistStats.totalReviews} reviews)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Storage Info */}
                {user.storage && user.storage.totalBytes > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                      <Shield className="h-4 w-4" /> Storage Usage
                    </h3>
                    <div className="grid grid-cols-4 gap-4 text-center text-sm bg-muted/30 p-4 rounded-lg">
                      <div>
                        <p className="text-muted-foreground mb-1">Total</p>
                        <p className="font-medium">
                          {(user.storage.totalBytes / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Images</p>
                        <div className="font-medium">
                          {(user.storage.imageBytes / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                          {user.storage.imageCount !== undefined && (
                            <span className="block text-xs text-muted-foreground">
                              {user.storage.imageCount} files
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Videos</p>
                        <div className="font-medium">
                          {(user.storage.videoBytes / (1024 * 1024)).toFixed(2)}{" "}
                          MB
                          {user.storage.videoCount !== undefined && (
                            <span className="block text-xs text-muted-foreground">
                              {user.storage.videoCount} files
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Files</p>
                        <p className="font-medium">
                          {user.storage.fileCount || 0}
                        </p>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleViewFiles}
                        >
                          <HardDrive className="mr-2 h-3 w-3" /> View File
                          Details
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {user.artistStatus === "verified" && (
                  <div className="flex justify-end">
                    <Button variant="outline" asChild size="sm">
                      <Link to={`/artists/${user._id}`} target="_blank">
                        View Public Profile
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
              <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-destructive">
                    Delete User Account?
                  </h4>
                  <p className="text-sm text-destructive/80 mb-3">
                    This action cannot be undone. All data associated with this
                    user will be permanently removed.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex justify-end gap-2">
          {isEditing && (
            <>
              <Button
                variant="secondary"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          )}

          {!isEditing && !showDeleteConfirm && (
            <div className="flex gap-2 w-full justify-between">
              <div className="flex gap-2">
                {user.artistStatus === "pending" && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange("verified")}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange("incomplete")}
                    >
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={handleContact}>
                  <MessageCircle className="mr-2 h-4 w-4" /> Contact
                </Button>
              </div>

              <div className="flex gap-2">
                {canEdit() && (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                )}
                {canDelete() && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;
