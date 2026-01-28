import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usersAPI } from "../../services/api";
import { toast } from "sonner";
import { Heart, Star, Pencil, Trash2 } from "lucide-react";
import AddToCartButton from "../common/AddToCartButton";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const ArtworkCard = ({ artwork, showActions = false, onDelete }) => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const isOwner = user?._id === artwork.artist?._id;
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  const isFavorite = user?.favorites?.some(
    (favId) => favId.toString() === artwork._id.toString()
  );

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please login to add favorites");
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await usersAPI.removeFavorite(artwork._id);
        toast.success("Removed from favorites");
      } else {
        await usersAPI.addFavorite(artwork._id);
        toast.success("Added to favorites");
      }
      await refreshUser();
    } catch (error) {
      toast.error("Failed to update favorites");
    } finally {
      setFavoriteLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const isSale = artwork.originalPrice && artwork.price < artwork.originalPrice;

  return (
    <Card className="h-full flex flex-col group overflow-hidden border-border hover:shadow-lg transition-all duration-300">
        <Link to={`/artworks/${artwork._id}`} className="block relative w-full aspect-square overflow-hidden bg-muted">
             {artwork.images?.[0] ? (
                <img 
                    src={artwork.images[0]} 
                    alt={artwork.title} 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                </div>
             )}

             {/* Overlays */}
             <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1 md:gap-2">
                 {isSale && <Badge variant="destructive" className="text-[10px] md:text-xs px-1.5 md:px-2.5">Sale</Badge>}
                 {!artwork.isForSale && <Badge variant="secondary" className="text-[10px] md:text-xs px-1.5 md:px-2.5">Sold</Badge>}
             </div>
             
             {isAuthenticated && !isOwner && (
                 <Button
                    variant="secondary"
                    size="icon"
                    className={`absolute top-2 right-2 md:top-3 md:right-3 h-7 w-7 md:h-8 md:w-8 rounded-full shadow-sm opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity ${isFavorite ? "text-red-500" : "text-muted-foreground"}`}
                    onClick={handleFavorite}
                 >
                     <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${isFavorite ? "fill-current" : ""}`} />
                 </Button>
             )}
        </Link>

        <CardContent className="flex-1 p-2.5 md:p-4">
             <div className="space-y-1">
                 <h3 className="font-semibold text-sm md:text-base leading-tight line-clamp-2" title={artwork.title}>
                     <Link to={`/artworks/${artwork._id}`} className="hover:underline hover:text-primary dark:hover:text-white transition-colors">
                         {artwork.title}
                     </Link>
                 </h3>
                 <p className="text-xs text-muted-foreground truncate">
                     {artwork.artist?.artistInfo?.companyName ? (
                         <Link to={`/artists/${artwork.artist._id}`} className="hover:underline hover:text-foreground transition-colors">
                             {artwork.artist.artistInfo.companyName}
                         </Link>
                     ) : (
                         <Link to={`/artists/${artwork.artist?._id}`} className="hover:underline hover:text-foreground transition-colors">
                             {artwork.artist?.firstName} {artwork.artist?.lastName}
                         </Link>
                     )}
                 </p>
                 <div className="flex items-center justify-between pt-1">
                     <div>
                         <span className="font-bold text-sm md:text-base">{formatPrice(artwork.price)}</span>
                         {isSale && (
                             <span className="text-[10px] ml-1.5 text-muted-foreground line-through">
                                 {formatPrice(artwork.originalPrice)}
                             </span>
                         )}
                     </div>
                     <div className="flex items-center text-yellow-500">
                         <Star className="h-3 w-3 fill-current" />
                         <span className="text-[10px] font-medium ml-0.5 text-foreground">
                             {artwork.averageRating > 0 ? artwork.averageRating.toFixed(1) : "New"}
                         </span>
                     </div>
                 </div>
             </div>
        </CardContent>

        <CardFooter className="p-2.5 pt-0 md:p-4 md:pt-0 flex gap-1.5 md:gap-2">
             {showActions && isOwner ? (
                 <>
                    <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                        <Link to={`/artworks/${artwork._id}/edit`}>
                            <Pencil className="h-3 w-3 md:mr-1.5" /> <span className="hidden md:inline">Edit</span>
                        </Link>
                    </Button>
                    {onDelete && (
                        <Button variant="destructive" size="sm" className="h-8 px-2.5" onClick={() => onDelete(artwork._id)}>
                             <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                 </>
             ) : (
                 <>
                     <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" asChild>
                         <Link to={`/artworks/${artwork._id}`}>View</Link>
                     </Button>
                     {!isOwner && (
                        <div className="flex-1">
                             <AddToCartButton artwork={artwork} className="w-full h-8 text-xs" size="sm" />
                        </div>
                     )}
                 </>
             )}
        </CardFooter>
    </Card>
  );
};

export default ArtworkCard;
