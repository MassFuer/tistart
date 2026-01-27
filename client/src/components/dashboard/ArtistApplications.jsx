import { useState, useEffect } from "react";
import { usersAPI, adminAPI } from "../../services/api";
import { toast } from "sonner";
import Loading from "../common/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Eye, FileText, Globe, Mail } from "lucide-react";

// Status Badge Helper
const StatusBadge = ({ status }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    incomplete: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    suspended: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    none: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <Badge variant="outline" className={`capitalize border-0 ${styles[status] || styles.none}`}>
      {status}
    </Badge>
  );
};

const ArtistApplications = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filter, setFilter] = useState("pending"); // pending, all

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch all users with role 'artist' or specific status if API supports it
      // Using generic getAllUsers and client-side filtering for simplicity if backend doesn't support complex filters yet
      const response = await adminAPI.getAllUsers({ limit: 100 }); 
      const allUsers = response.data.data;
      
      // Filter based on selected view
      let filtered = allUsers.filter(u => u.role === "artist" || u.artistStatus !== "none");
      
      if (filter === "pending") {
        filtered = filtered.filter(u => u.artistStatus === "pending");
      }
      
      setUsers(filtered);
    } catch (error) {
      console.error("Failed to fetch users", error);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId, newStatus) => {
    if (!confirm(`Are you sure you want to mark this user as ${newStatus}?`)) return;

    try {
      await adminAPI.updateArtistStatus(userId, newStatus);
      toast.success(`User marked as ${newStatus}`);
      fetchUsers(); // Refresh list
      setIsDetailsOpen(false);
    } catch (error) {
      console.error("Failed to update status", error);
      toast.error("Failed to update status");
    }
  };

  const openDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  if (loading && users.length === 0) return <Loading message="Loading applications..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-lg font-medium">Artist Applications</h3>
           <p className="text-sm text-muted-foreground">Review and manage artist verification requests.</p>
        </div>
        <div className="flex gap-2">
            <Button 
                variant={filter === "pending" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter("pending")}
            >
                Pending Review
            </Button>
            <Button 
                variant={filter === "all" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setFilter("all")}
            >
                All Artists
            </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artist</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  {filter === "pending" ? "No pending applications." : "No artists found."}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={user.profilePicture} />
                              <AvatarFallback>{user.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                      </div>
                  </TableCell>
                  <TableCell>{user.artistInfo?.companyName || "N/A"}</TableCell>
                  <TableCell>
                      <StatusBadge status={user.artistStatus} />
                  </TableCell>
                  <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetails(user)}>
                          <Eye className="mr-2 h-4 w-4" /> Review
                      </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* DETAILED REVIEW DIALOG */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                  <DialogTitle>Review Artist Application</DialogTitle>
                  <DialogDescription>
                      Verify applicant details before approving.
                  </DialogDescription>
              </DialogHeader>

              {selectedUser && (
                  <div className="space-y-6">
                      {/* Personal Info */}
                      <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <Avatar className="h-16 w-16">
                              <AvatarImage src={selectedUser.profilePicture} />
                              <AvatarFallback>{selectedUser.firstName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                              <h4 className="text-lg font-semibold">{selectedUser.firstName} {selectedUser.lastName}</h4>
                              <p className="text-muted-foreground flex items-center gap-2">
                                  <Mail className="h-4 w-4" /> {selectedUser.email}
                              </p>
                              <div className="mt-2 flex gap-2">
                                  <StatusBadge status={selectedUser.artistStatus} />
                                  <Badge variant="outline">{selectedUser.subscriptionTier} Plan</Badge>
                              </div>
                          </div>
                      </div>

                      {/* Business Info */}
                      <div className="space-y-4">
                          <h4 className="font-medium border-b pb-2">Business Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="text-muted-foreground">Type</p>
                                  <p>{selectedUser.artistInfo?.type || "Individual"}</p>
                              </div>
                              <div>
                                  <p className="text-muted-foreground">Company Name</p>
                                  <p>{selectedUser.artistInfo?.companyName || "N/A"}</p>
                              </div>
                              <div>
                                  <p className="text-muted-foreground">Tax ID</p>
                                  <p>{selectedUser.artistInfo?.taxId || "N/A"}</p>
                              </div>
                              <div>
                                  <p className="text-muted-foreground">VAT Number</p>
                                  <p>{selectedUser.artistInfo?.vatNumber || "N/A"}</p>
                              </div>
                          </div>
                      </div>

                      {/* Bio & Socials */}
                      <div className="space-y-4">
                          <h4 className="font-medium border-b pb-2">Profile & Socials</h4>
                          <div>
                              <p className="text-sm text-muted-foreground mb-1">Bio / Description</p>
                              <p className="text-sm bg-muted/30 p-3 rounded-md min-h-[80px]">
                                  {selectedUser.artistInfo?.description || "No description provided."}
                              </p>
                          </div>
                          <div className="flex gap-4 pt-2">
                               {selectedUser.artistInfo?.socialMedia?.website && (
                                   <a href={selectedUser.artistInfo.socialMedia.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                                       <Globe className="h-4 w-4" /> Website
                                   </a>
                               )}
                               {/* Add others if needed */}
                          </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                          {selectedUser.artistStatus === "pending" && (
                              <>
                                  <Button 
                                    variant="outline" 
                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                    onClick={() => handleStatusUpdate(selectedUser._id, "incomplete")}
                                  >
                                      Mark Incomplete
                                  </Button>
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    onClick={() => handleStatusUpdate(selectedUser._id, "verified")}
                                  >
                                      <CheckCircle2 className="mr-2 h-4 w-4" /> Approve & Verify
                                  </Button>
                              </>
                          )}
                          
                          {selectedUser.artistStatus === "verified" && (
                               <Button 
                                 variant="destructive"
                                 onClick={() => handleStatusUpdate(selectedUser._id, "suspended")}
                               >
                                   <XCircle className="mr-2 h-4 w-4" /> Suspend Artist
                               </Button>
                          )}

                           {selectedUser.artistStatus === "suspended" && (
                               <Button 
                                 variant="outline"
                                 onClick={() => handleStatusUpdate(selectedUser._id, "verified")}
                               >
                                   Re-activate
                               </Button>
                          )}
                      </div>
                  </div>
              )}
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArtistApplications;
