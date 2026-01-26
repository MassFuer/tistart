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
             <div className="absolute top-3 left-3 flex flex-col gap-2">
                 {isSale && <Badge variant="destructive">Sale</Badge>}
                 {!artwork.isForSale && <Badge variant="secondary">Sold</Badge>}
             </div>
             
             {isAuthenticated && !isOwner && (
                 <Button
                    variant="secondary"
                    size="icon"
                    className={`absolute top-3 right-3 h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity ${isFavorite ? "text-red-500 opacity-100" : "text-muted-foreground"}`}
                    onClick={handleFavorite}
                 >
                     <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                 </Button>
             )}
        </Link>

        <CardContent className="flex-1 p-4">
             <div className="flex justify-between items-start gap-2 mb-2">
                 <div className="min-w-0">
                     <h3 className="font-semibold text-lg leading-none truncate" title={artwork.title}>
                         <Link to={`/artworks/${artwork._id}`} className="hover:underline hover:text-primary transition-colors">
                             {artwork.title}
                         </Link>
                     </h3>
                     <p className="text-sm text-muted-foreground truncate mt-1">
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
                 </div>
                 <div className="text-right flex-shrink-0">
                     <div className="font-bold text-lg">{formatPrice(artwork.price)}</div>
                     {isSale && (
                         <div className="text-xs text-muted-foreground line-through">
                             {formatPrice(artwork.originalPrice)}
                         </div>
                     )}
                 </div>
             </div>
             
             <div className="flex items-center gap-2 mt-3">
                 <div className="flex items-center text-yellow-500">
                     <Star className="h-3 w-3 fill-current" />
                     <span className="text-xs font-medium ml-1 text-foreground">
                         {artwork.averageRating > 0 ? (
                            <>
                                {artwork.averageRating.toFixed(1)} 
                                <span className="text-muted-foreground ml-1">({artwork.numOfReviews})</span>
                            </>
                         ) : "New"}
                     </span>
                 </div>
                 <span className="text-xs text-muted-foreground">•</span>
                 <span className="text-xs text-muted-foreground uppercase tracking-wide">
                     {artwork.category}
                 </span>
             </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
             {showActions && isOwner ? (
                 <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                        <Link to={`/artworks/${artwork._id}/edit`}>
                            <Pencil className="h-3 w-3 mr-2" /> Edit
                        </Link>
                    </Button>
                    {onDelete && (
                        <Button variant="destructive" size="sm" onClick={() => onDelete(artwork._id)}>
                             <Trash2 className="h-3 w-3" />
                        </Button>
                    )}
                 </>
             ) : (
                 <>
                     <Button variant="outline" size="default" className="flex-1" asChild>
                         <Link to={`/artworks/${artwork._id}`}>Details</Link>
                     </Button>
                     {/* Use the AddToCartButton component to handle logic and styling */}
                     {!isOwner && (
                        <AddToCartButton artwork={artwork} className="flex-1" />
                     )}
                 </>
             )}
        </CardFooter>
    </Card>
  );
};

export default ArtworkCard;
