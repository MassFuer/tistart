import { useState } from "react";
import { adminAPI } from "../../services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const CreateUserModal = ({ open, onOpenChange, onSuccess, isSuperAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    password: "",
    role: "user",
    artistStatus: "none",
    galleristStatus: "none",
    isEmailVerified: true, // Default to true for admin creation
    artistInfo: {
      companyName: "",
      type: "individual",
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [obj, field] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [obj]: { ...prev[obj], [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name, value) => {
    // If setting to user, also reset statuses
    if (name === "role" && value === "user") {
      setFormData((prev) => ({
        ...prev,
        role: value,
        artistStatus: "none",
        galleristStatus: "none",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (checked) => {
    setFormData((prev) => ({ ...prev, isEmailVerified: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminAPI.createUser(formData);
      toast.success("User created successfully");
      if (onSuccess) onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        userName: "",
        email: "",
        password: "",
        role: "user",
        artistStatus: "none",
        galleristStatus: "none",
        isEmailVerified: true,
        artistInfo: {
          companyName: "",
          type: "individual",
        },
      });
    } catch (error) {
      console.error("Create user error:", error);
      toast.error(error.response?.data?.error || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const roles = isSuperAdmin
    ? ["user", "artist", "gallerist", "admin", "superAdmin"]
    : ["user", "artist", "gallerist", "admin"]; // Regular admin can create other regular admins or users/artists/gallerists

  const statuses = ["none", "pending", "incomplete", "verified", "suspended"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the platform. They will be able to log in
              immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
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
                placeholder="johndoe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Initial Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
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
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(formData.role === "artist" ||
                formData.role === "gallerist") && (
                <div className="space-y-2">
                  <Label>
                    {formData.role === "artist"
                      ? "Artist Status"
                      : "Gallerist Status"}
                  </Label>
                  <Select
                    value={
                      formData.role === "artist"
                        ? formData.artistStatus
                        : formData.galleristStatus
                    }
                    onValueChange={(val) =>
                      handleSelectChange(
                        formData.role === "artist"
                          ? "artistStatus"
                          : "galleristStatus",
                        val,
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {(formData.role === "artist" || formData.role === "gallerist") && (
              <div className="space-y-2 border-t pt-2">
                <Label htmlFor="artistInfo.companyName">
                  Company / Professional Name
                </Label>
                <Input
                  id="artistInfo.companyName"
                  name="artistInfo.companyName"
                  value={formData.artistInfo.companyName}
                  onChange={handleChange}
                  placeholder="Nemesis Art Gallery"
                  required
                />
              </div>
            )}

            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isEmailVerified"
                checked={formData.isEmailVerified}
                onCheckedChange={handleCheckboxChange}
              />
              <Label
                htmlFor="isEmailVerified"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mark email as verified
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserModal;
