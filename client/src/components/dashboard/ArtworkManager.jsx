import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
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

const ArtworkManager = () => {
  const { user } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [kpis, setKpis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtering & Sorting State
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
  
  const [deleteId, setDeleteId] = useState(null);

  const fetchArtworks = async () => {
    setIsLoading(true);
    try {
        const response = await artworksAPI.getArtistStats();
        setArtworks(response.data.data);
        setKpis(response.data.kpis);
    } catch (error) {
        console.error("Failed to fetch artworks:", error);
        toast.error("Failed to load artworks");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  // Filter and Sort Logic
  const filteredArtworks = artworks.filter(artwork => 
    artwork.title.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle nested or special keys
    if (sortConfig.key === "revenue") {
        aValue = a.stats?.totalRevenue || 0;
        bValue = b.stats?.totalRevenue || 0;
    } else if (sortConfig.key === "sales") {
        aValue = a.stats?.totalSold || 0;
        bValue = b.stats?.totalSold || 0;
    } else if (sortConfig.key === "rating") {
        aValue = a.averageRating || 0;
        bValue = b.averageRating || 0;
    }

    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-4">
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
            placeholder="Search titles..." 
            className="pl-8"
            value={search}  
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button asChild>
            <Link to="/artworks/new">
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
                 <TableCell colSpan={8} className="h-24 text-center">
                    <Loading message="Loading artworks..." />
                 </TableCell>
               </TableRow>
            ) : filteredArtworks.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={8} className="h-32 text-center">
                    <EmptyState message="No artworks found" />
                 </TableCell>
               </TableRow>
            ) : (
                filteredArtworks.map((artwork) => (
                    <TableRow key={artwork._id}>
                        <TableCell>
                             <div className="h-12 w-12 rounded overflow-hidden bg-muted">
                                <img 
                                    src={artwork.images?.[0] || "/placeholder.jpg"} 
                                    alt="" 
                                    className="h-full w-full object-cover"
                                />
                             </div>
                        </TableCell>
                        <TableCell className="font-medium">
                            <div className="flex flex-col">
                                <span>{artwork.title}</span>
                                <span className="text-xs text-muted-foreground">{formatPrice(artwork.price)}</span>
                            </div>
                        </TableCell>
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
                                <span>{artwork.averageRating || 0}</span>
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
