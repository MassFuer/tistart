import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI, platformAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "../../context/NavigationContext";
import { formatPrice } from "../../lib/formatters";
import { toast } from "sonner";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Search,
  ArrowUpDown,
  TrendingUp,
  MessageSquare,
  Star,
  Package
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import Loading from "../common/Loading";
import EmptyState from "../common/EmptyState";
import StatCard from "./StatCard";
import Pagination from "../common/Pagination";

const ArtworkManager = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const { saveScrollPosition } = useNavigation();
  const [artworks, setArtworks] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtering & Sorting State
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });

  const [deleteId, setDeleteId] = useState(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const fetchArtworks = async () => {
    setIsLoading(true);
    try {
        if (!isAdmin && user.artistStatus !== 'verified') {
            setIsLoading(false);
            return;
        }

        // Build sort parameter for API
        const sortParam = sortConfig.direction === 'desc' ? `-${sortConfig.key}` : sortConfig.key;

        if (isAdmin) {
            // Admin: Fetch artworks with server-side sorting and pagination
            const params = {
                page,
                limit,
                sort: sortParam,
                search: search || undefined
            };
            
            const [artworksRes, statsRes] = await Promise.all([
                artworksAPI.getAll(params),
                platformAPI.getStats("all")
            ]);
            
            setArtworks(artworksRes.data.data);
            if (artworksRes.data.pagination) {
                setTotalPages(artworksRes.data.pagination.pages);
            }
            
            // Map platform stats to KPI format
            const platformStats = statsRes.data.data;
            setKpis({
                totalRevenue: platformStats.orders?.totalRevenue || 0,
                totalSold: platformStats.orders?.total || 0,
                avgRating: "N/A",
                totalArtworks: platformStats.artworks?.total || 0,
                totalReviews: 0,
            });
        } else {
            // Artist: Fetch only their own artworks with stats
            const response = await artworksAPI.getArtistStats();
            setArtworks(response.data.data);
            setKpis(response.data.kpis);
        }
    } catch (error) {
        console.error("Failed to fetch artworks:", error);
        toast.error("Failed to load artworks");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, [isAdmin, page, limit, sortConfig, search]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  if (!isAdmin && user.artistStatus !== 'verified') {
      if (user.artistStatus === 'pending') {
          return (
            <EmptyState 
                message="Application Under Review" 
                description="We are currently reviewing your artist application. We'll notify you via email once a decision has been made."
            />
          );
      }

      return (
          <EmptyState 
            message="Artist Verification Required" 
            description="You need to complete your artist profile and get verified before you can manage artworks."
            action={
                <Button asChild>
                    <Link to="/apply-artist">Complete Application</Link>
                </Button>
            }
          />
      );
  }

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await artworksAPI.delete(deleteId);
      toast.success("Artwork deleted successfully");
      fetchArtworks(); // Refresh data
    } catch (error) {
      toast.error("Failed to delete artwork");
    } finally {
      setDeleteId(null);
    }
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // For admin: artworks are already filtered and sorted by server
  // For artist: artworks come from getArtistStats (no pagination needed)
  const displayArtworks = artworks;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
            <StatCard 
                title="Total Revenue" 
                value={formatPrice(kpis.totalRevenue)} 
                icon={TrendingUp} 
                description="Lifetime earnings" 
            />
            <StatCard 
                title="Items Sold" 
                value={kpis.totalSold} 
                icon={Package} 
                description="Total artworks sold" 
            />
             <StatCard 
                title="Avg Rating" 
                value={kpis.avgRating} 
                icon={Star} 
                description={`From ${kpis.totalReviews} reviews`} 
            />
            <StatCard 
                title="Total Artworks" 
                value={kpis.totalArtworks} 
                icon={Star} 
                description="Active portfolio items" 
            />
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAdmin ? "Search all artworks..." : "Search titles..."}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild>
            <Link to="/artworks/new" onClick={() => saveScrollPosition()}>
                <Plus className="mr-2 h-4 w-4" /> New Artwork
            </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("title")}>
                <div className="flex items-center">
                    Title {sortConfig.key === "title" && <ArrowUpDown className="ml-2 h-3 w-3" />}
                </div>
              </TableHead>
              {isAdmin && <TableHead>Artist</TableHead>}
              <TableHead className="cursor-pointer" onClick={() => handleSort("sales")}>
                 <div className="flex items-center">
                    Sales {sortConfig.key === "sales" && <ArrowUpDown className="ml-2 h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("revenue")}>
                 <div className="flex items-center">
                    Revenue {sortConfig.key === "revenue" && <ArrowUpDown className="ml-2 h-3 w-3" />}
                </div>
              </TableHead>
               <TableHead className="cursor-pointer" onClick={() => handleSort("rating")}>
                 <div className="flex items-center">
                    Rating {sortConfig.key === "rating" && <ArrowUpDown className="ml-2 h-3 w-3" />}
                </div>
              </TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={isAdmin ? 9 : 8} className="h-24 text-center">
                    <Loading message="Loading artworks..." />
                 </TableCell>
               </TableRow>
            ) : displayArtworks.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={isAdmin ? 9 : 8} className="h-32 text-center">
                    <EmptyState message="No artworks found" />
                 </TableCell>
               </TableRow>
            ) : (
                displayArtworks.map((artwork) => (
                    <TableRow key={artwork._id}>
                        <TableCell>
                             <Link to={`/artworks/${artwork._id}`} className="block h-12 w-12 rounded overflow-hidden bg-muted">
                                <img
                                    src={artwork.images?.[0] || "/placeholder.jpg"}
                                    alt=""
                                    className="h-full w-full object-cover hover:scale-105 transition-transform"
                                />
                             </Link>
                        </TableCell>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <Link to={`/artworks/${artwork._id}`} className="hover:underline text-foreground">
                                    {artwork.title}
                                </Link>
                                <span className="text-xs text-muted-foreground">{formatPrice(artwork.price)}</span>
                            </div>
                        </TableCell>
                        {isAdmin && (
                            <TableCell>
                                <Link
                                    to={`/artists/${artwork.artist?._id}`}
                                    className="text-sm hover:underline text-muted-foreground"
                                >
                                    {artwork.artist?.artistInfo?.companyName ||
                                     `${artwork.artist?.firstName || ''} ${artwork.artist?.lastName || ''}`.trim() ||
                                     'Unknown Artist'}
                                </Link>
                            </TableCell>
                        )}
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium">{artwork.stats?.totalSold || 0}</span>
                                <span className="text-xs text-muted-foreground">orders</span>
                            </div>
                        </TableCell>
                         <TableCell>
                             <span className="font-medium text-green-600">
                                {formatPrice(artwork.stats?.totalRevenue || 0)}
                             </span>
                        </TableCell>
                         <TableCell>
                             <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{(artwork.averageRating || 0).toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({artwork.numOfReviews || 0})</span>
                             </div>
                        </TableCell>
                        <TableCell className="text-center">{artwork.totalInStock}</TableCell>
                        <TableCell>
                            <Badge variant={artwork.isForSale ? "secondary" : "outline"}>
                                {artwork.isForSale ? "For Sale" : "Private"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Actions</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link to={`/artworks/${artwork._id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> View Public
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link to={`/artworks/${artwork._id}/edit`}>
                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => setDeleteId(artwork._id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination 
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={limit}
        onItemsPerPageChange={setLimit}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This is permanent. Deleting this artwork will remove it from the gallery
                    and all associated data (except historical orders).
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ArtworkManager;
