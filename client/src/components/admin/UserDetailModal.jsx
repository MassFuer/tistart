import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI } from "../../services/api";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Loading from "@/components/common/Loading";
import { User, Mail, AtSign, Calendar, Shield, AlertTriangle, Trash2, Edit } from "lucide-react";

const UserDetailModal = ({ userId, onClose, onUpdate, onDelete }) => {
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({});

  const isSuperAdmin = currentUser?.role === "superAdmin";
  const artistStatuses = ["none", "pending", "incomplete", "verified", "suspended"];
  const roles = isSuperAdmin
    ? ["user", "artist", "admin", "superAdmin"]
    : ["user", "artist", "admin"];

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                            <AvatarFallback className="text-xl">{user.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                             <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                             <p className="text-muted-foreground">@{user.userName}</p>
                             <div className="flex gap-2 mt-2">
                                 <Badge variant={user.role === "admin" || user.role === "superAdmin" ? "default" : "secondary"} className="capitalize">
                                     {user.role}
                                 </Badge>
                                 {user.artistStatus !== "none" && (
                                     <Badge variant="outline" className="capitalize">
                                         {user.artistStatus}
                                     </Badge>
                                 )}
                             </div>
                        </div>
                    </div>
                )}
                
                {/* Form Mode */}
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="userName">Username</Label>
                             <Input id="userName" name="userName" value={formData.userName} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="email">Email</Label>
                             <Input id="email" name="email" value={formData.email} onChange={handleChange} type="email" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label>Role</Label>
                                 <Select value={formData.role} onValueChange={(val) => handleSelectChange("role", val)}>
                                     <SelectTrigger>
                                         <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                         {roles.map((role) => (
                                             <SelectItem key={role} value={role}>{role}</SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                             </div>
                             <div className="space-y-2">
                                 <Label>Artist Status</Label>
                                 <Select value={formData.artistStatus} onValueChange={(val) => handleSelectChange("artistStatus", val)}>
                                     <SelectTrigger>
                                         <SelectValue />
                                     </SelectTrigger>
                                     <SelectContent>
                                         {artistStatuses.map((status) => (
                                             <SelectItem key={status} value={status}>{status}</SelectItem>
                                         ))}
                                     </SelectContent>
                                 </Select>
                             </div>
                        </div>
                    </div>
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
                                         <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-3 w-3"/> Email</span>
                                         <span>{user.email}</span>
                                     </div>
                                     <div className="flex justify-between">
                                         <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-3 w-3"/> Verified</span>
                                         <span className={user.isEmailVerified ? "text-green-600" : "text-yellow-600"}>
                                             {user.isEmailVerified ? "Yes" : "No"}
                                         </span>
                                     </div>
                                     <div className="flex justify-between">
                                          <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3"/> Joined</span>
                                          <span>{formatDate(user.createdAt)}</span>
                                     </div>
                                 </div>
                             </div>

                             {/* Artist Details */}
                             {user.artistInfo && user.artistStatus !== "none" && (
                                 <div className="space-y-4">
                                     <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                         <AtSign className="h-4 w-4" /> Artist Profile
                                     </h3>
                                     <div className="space-y-2 text-sm">
                                         {user.artistInfo.companyName && (
                                             <div className="flex justify-between">
                                                 <span className="text-muted-foreground">Company</span>
                                                 <span>{user.artistInfo.companyName}</span>
                                             </div>
                                         )}
                                         {user.artistInfo.type && (
                                             <div className="flex justify-between">
                                                 <span className="text-muted-foreground">Type</span>
                                                 <span>{user.artistInfo.type}</span>
                                             </div>
                                         )}
                                          {user.artistInfo.address?.city && (
                                             <div className="flex justify-between">
                                                 <span className="text-muted-foreground">Location</span>
                                                 <span>{user.artistInfo.address.city}, {user.artistInfo.address.country}</span>
                                             </div>
                                         )}
                                     </div>
                                 </div>
                             )}
                        </div>

                         {/* Storage Info */}
                        {user.storage && user.storage.totalBytes > 0 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold flex items-center gap-2 border-b pb-2">
                                    <Shield className="h-4 w-4" /> Storage Usage
                                </h3>
                                <div className="grid grid-cols-4 gap-4 text-center text-sm bg-muted/30 p-4 rounded-lg">
                                     <div>
                                         <p className="text-muted-foreground mb-1">Total</p>
                                         <p className="font-medium">{(user.storage.totalBytes / (1024 * 1024)).toFixed(2)} MB</p>
                                     </div>
                                     <div>
                                         <p className="text-muted-foreground mb-1">Images</p>
                                         <p className="font-medium">{(user.storage.imageBytes / (1024 * 1024)).toFixed(2)} MB</p>
                                     </div>
                                     <div>
                                         <p className="text-muted-foreground mb-1">Videos</p>
                                         <p className="font-medium">{(user.storage.videoBytes / (1024 * 1024)).toFixed(2)} MB</p>
                                     </div>
                                     <div>
                                         <p className="text-muted-foreground mb-1">Files</p>
                                         <p className="font-medium">{user.storage.fileCount || 0}</p>
                                     </div>
                                </div>
                            </div>
                        )}
                        
                        {user.artistStatus === "verified" && (
                             <div className="flex justify-end">
                                 <Button variant="outline" asChild size="sm">
                                     <Link to={`/artists/${user._id}`} target="_blank">View Public Profile</Link>
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
                             <h4 className="font-semibold text-destructive">Delete User Account?</h4>
                             <p className="text-sm text-destructive/80 mb-3">
                                 This action cannot be undone. All data associated with this user will be permanently removed.
                             </p>
                             <div className="flex gap-2">
                                 <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                                     {isDeleting ? "Deleting..." : "Yes, Delete Account"}
                                 </Button>
                                 <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                             </div>
                         </div>
                    </div>
                )}

            </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t flex justify-end gap-2">
             {!isEditing && !showDeleteConfirm && (
                 <>
                    {canDelete() && (
                        <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    )}
                    {canEdit() && (
                        <Button onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    )}
                     <Button variant="outline" onClick={onClose}>Close</Button>
                 </>
             )}
             
             {isEditing && (
                 <>
                     <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</Button>
                     <Button onClick={handleSave} disabled={isSaving}>
                         {isSaving ? "Saving..." : "Save Changes"}
                     </Button>
                 </>
             )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailModal;