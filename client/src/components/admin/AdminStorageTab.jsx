import { useState, useCallback } from "react";
import { platformAPI } from "../../services/api";
import { toast } from "sonner";
import {
  HardDrive,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListing } from "../../hooks/useListing";
import Pagination from "../common/Pagination";
import Loading from "../common/Loading";

const AdminStorageTab = ({ isSuperAdmin }) => {
  // --- STORAGE LISTING ---
  const fetchStorageWrapper = useCallback((params) => {
    return platformAPI.getStorageUsage(params);
  }, []);

  const {
    data: storageUsers,
    loading: storageLoading,
    pagination: storagePagination,
    filters: storageFilters,
    updateFilter: updateStorageFilter,
    setPage: setStoragePage,
    refresh: refreshStorage,
  } = useListing({
    apiFetcher: fetchStorageWrapper,
    initialFilters: {
      limit: 20,
      sort: "storage.totalBytes",
      order: "desc",
      search: "",
    },
    enabled: true,
  });

  const handleStorageSort = (column) => {
    const currentSort = storageFilters.sort;
    const currentOrder = storageFilters.order || "desc";
    const newOrder =
      currentSort === column && currentOrder === "desc" ? "asc" : "desc";
    updateStorageFilter({ sort: column, order: newOrder });
  };

  const handleUpdateUserTier = async (userId, tier) => {
    try {
      await platformAPI.updateStorageQuota(userId, { subscriptionTier: tier });
      toast.success("Subscription tier updated");
      refreshStorage();
    } catch (error) {
      toast.error("Failed to update tier");
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9"
              value={storageFilters.search}
              onChange={(e) => updateStorageFilter({ search: e.target.value })}
            />
          </div>
        </div>
      </div>

      {storageLoading ? (
        <div className="py-20 flex justify-center">
          <Loading message="Loading distribution..." />
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleStorageSort("firstName")}
                  >
                    User{" "}
                    {storageFilters.sort === "firstName" ? (
                      storageFilters.order === "asc" ? (
                        <ArrowUp className="inline h-3 w-3 ml-1" />
                      ) : (
                        <ArrowDown className="inline h-3 w-3 ml-1" />
                      )
                    ) : (
                      <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                    )}
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead
                    className="cursor-pointer"
                    onClick={() => handleStorageSort("storage.totalBytes")}
                  >
                    Usage{" "}
                    {storageFilters.sort === "storage.totalBytes" ? (
                      storageFilters.order === "asc" ? (
                        <ArrowUp className="inline h-3 w-3 ml-1" />
                      ) : (
                        <ArrowDown className="inline h-3 w-3 ml-1" />
                      )
                    ) : (
                      <ArrowUpDown className="inline h-3 w-3 ml-1 opacity-50" />
                    )}
                  </TableHead>
                  <TableHead>Distribution</TableHead>
                  <TableHead className="text-right">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageUsers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  storageUsers.map((u) => {
                    const usage = u.storage?.totalBytes || 0;
                    const limit = u.storage?.quotaBytes || 1;
                    const percent = Math.min((usage / limit) * 100, 100);

                    return (
                      <TableRow key={u._id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {u.profilePicture ? (
                                <img
                                  src={u.profilePicture}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium truncate">
                                {u.firstName} {u.lastName}
                              </span>
                              <span className="text-xs text-muted-foreground truncate">
                                {u.userName}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isSuperAdmin ? (
                            <Select
                              value={u.subscriptionTier || "free"}
                              onValueChange={(val) =>
                                handleUpdateUserTier(u._id, val)
                              }
                            >
                              <SelectTrigger className="w-[110px] h-8 text-xs uppercase font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">FREE</SelectItem>
                                <SelectItem value="pro">PRO</SelectItem>
                                <SelectItem value="enterprise">
                                  ENTERPRISE
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant="outline"
                              className="uppercase font-bold"
                            >
                              {u.subscriptionTier || "free"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 w-[120px]">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span>{formatBytes(usage)}</span>
                              <span className="text-muted-foreground">
                                / {formatBytes(limit)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div
                                className={`h-full ${percent > 90 ? "bg-destructive" : percent > 75 ? "bg-amber-500" : "bg-primary"}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="whitespace-nowrap">
                              Images: {formatBytes(u.storage?.imageBytes || 0)}{" "}
                              ({u.imageCount || 0})
                            </span>
                            <span className="whitespace-nowrap">
                              Videos: {formatBytes(u.storage?.videoBytes || 0)}{" "}
                              ({u.videoCount || 0})
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {new Date(u.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {storagePagination.pages > 1 && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={storagePagination.page}
                totalPages={storagePagination.pages}
                onPageChange={setStoragePage}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default AdminStorageTab;
