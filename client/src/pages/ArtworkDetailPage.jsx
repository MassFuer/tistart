import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { artworksAPI, usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import AddToCartButton from "../components/common/AddToCartButton";
import ReviewSection from "../components/review/ReviewSection";
import VideoPlayer from "../components/video/VideoPlayer";
import StartConversationButton from "../components/messaging/StartConversationButton";
import { toast } from "sonner";
import {
  Heart,
  Share2,
  Clapperboard,
  ShoppingCart,
  Tag,
  Palette,
  Ruler,
  Box,
  Info,
  Edit,
  Trash2,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import { formatPrice } from "@/lib/formatters";

const ArtworkDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Convert favorites to strings for comparison
  const isFavorite = user?.favorites?.some(
    (favId) => favId.toString() === artwork?._id?.toString()
  );

  const isOwner = user?._id === artwork?.artist?._id;
  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";

  useEffect(() => {
    fetchArtwork();
  }, [id]);

  const [hasViewed, setHasViewed] = useState(false);

  const fetchArtwork = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await artworksAPI.getOne(id);
      const data = response.data.data;
      setArtwork(data);

      // Track View (Images/Sculptures/etc)
      // Videos are tracked in VideoPlayer when played
      if (data.category !== 'video' && !hasViewed) {
         artworksAPI.incrementView(id).catch(err => console.error("Failed to track view", err));
         setHasViewed(true);
      }

    } catch (error) {
      console.error(error);
      setError("Failed to load artwork. It might have been removed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavorite = async () => {
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

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this artwork? This action cannot be undone.")) {
      try {
        await artworksAPI.delete(id);
        toast.success("Artwork deleted successfully");
        navigate("/gallery");
      } catch (error) {
        toast.error("Failed to delete artwork");
      }
    }
  };

  if (isLoading) {
    return <Loading message="Loading artwork details..." />;
  }

  if (error || !artwork) {
    return (
      <ErrorMessage
        message={error || "Artwork not found"}
        onRetry={fetchArtwork}
      />
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 lg:px-8 py-4 sm:py-8 max-w-7xl animate-in fade-in duration-500">
      <Button variant="ghost" className="mb-4 sm:mb-6 mx-4 sm:mx-0 pl-0 hover:bg-transparent hover:text-primary" asChild>
        <Link to="/gallery" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Gallery
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
        {/* Left Column: Gallery */}
        <div className="space-y-3 sm:space-y-4">
            <Card className="overflow-hidden border-0 shadow-none bg-transparent">
                <div className="relative aspect-square sm:aspect-[4/3] w-full sm:rounded-xl overflow-hidden bg-muted/20 sm:border shadow-sm">
                     {artwork.video?.url ? (
                        <div className="w-full h-full relative group">
                            {/* CASE 1: Full Video Access Logic (handled by VideoPlayer) */}
                             <VideoPlayer artwork={artwork} onPurchaseComplete={fetchArtwork} />
                             
                             {/* CASE 2: Preview Logic Override if needed - currently VideoPlayer handles main content. 
                                 The user asked for "Preview checking" specifically.
                                 If VideoPlayer is locked (e.g. paid), we might want to show a Preview button if available. 
                                 However, avoiding complex overlays for now, relying on VideoPlayer's internal logic.
                                 
                                 BUT, if the User explicitly wants a "Preview" distinct from the main video, 
                                 we should check artwork.video.previewVideoUrl.
                             */}
                        </div>
                     ) : artwork.images?.length > 0 ? (
                        <img
                            src={artwork.images[selectedImage]}
                            alt={artwork.title}
                            className="w-full h-full object-contain"
                        />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            No Image Available
                        </div>
                     )}
                </div>
            </Card>

            {/* Thumbnails */}
            {artwork.images?.length > 1 && (
                <div className="px-4 sm:px-0">
                <ScrollArea className="w-full whitespace-nowrap rounded-md sm:border text-center">
                    <div className="flex w-max space-x-3 sm:space-x-4 p-2 sm:p-4">
                        {artwork.images.map((img, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedImage(index)}
                                className={`relative h-24 w-24 shrink-0 overflow-hidden rounded-md border-2 transition-all hover:opacity-100 ${
                                    selectedImage === index ? "border-primary ring-2 ring-primary/20 opacity-100" : "border-transparent opacity-70"
                                }`}
                            >
                                <img
                                    src={img}
                                    alt={`${artwork.title} ${index + 1}`}
                                    className="aspect-square h-full w-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
                </div>
            )}
        </div>

        {/* Right Column: Details */}
        <div className="space-y-6 px-4 sm:px-0">
            <div>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                        {artwork.category}
                    </Badge>
                     {artwork.video?.url && (
                        <Badge variant={artwork.video.isPaid ? "default" : "outline"} className="text-sm px-3 py-1">
                            {artwork.video.isPaid ? "Premium Video" : "Free Video"}
                        </Badge>
                    )}
                    {!artwork.isForSale && (
                        <Badge variant="destructive">Sold Out / Not For Sale</Badge>
                    )}
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">{artwork.title}</h1>

                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                    <span className="text-lg">by</span>
                    <Link to={`/artists/${artwork.artist?._id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Avatar className="h-8 w-8">
                             <AvatarImage src={artwork.artist?.profilePicture} alt={artwork.artist?.firstName} />
                             <AvatarFallback>{artwork.artist?.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-lg border-b border-transparent hover:border-primary">
                            {artwork.artist?.artistInfo?.companyName || `${artwork.artist?.firstName} ${artwork.artist?.lastName}`}
                        </span>
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                     <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-foreground">
                            {artwork.isForSale ? formatPrice(artwork.price) : "N/A"}
                        </span>
                         {artwork.isForSale && artwork.originalPrice && artwork.price < artwork.originalPrice && (
                            <span className="text-xl text-muted-foreground line-through decoration-destructive/50 decoration-2">
                                {formatPrice(artwork.originalPrice)}
                            </span>
                        )}
                     </div>

                     {/* Action Buttons */}
                     <div className="flex gap-2">
                         {isAuthenticated && !isOwner && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleFavorite}
                                disabled={favoriteLoading}
                                className={isFavorite ? "text-red-500 hover:text-red-600 border-red-200 bg-red-50 hover:bg-red-100" : ""}
                            >
                                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                            </Button>
                         )}
                         <Button variant="outline" size="icon" onClick={() => {
                             navigator.clipboard.writeText(window.location.href);
                             toast.success("Link copied to clipboard");
                         }}>
                             <Share2 className="h-5 w-5" />
                         </Button>
                         <StartConversationButton
                             artistId={artwork.artist?._id}
                             artworkId={artwork._id}
                             artworkTitle={artwork.title}
                             variant="outline"
                             size="icon"
                         />
                         {(artwork.category === "video" || artwork.category === "music") && (
                             <Button variant="secondary" size="icon" title="Watch in Immersive Mode" onClick={() => navigate(`/videos/${id}`)}>
                                 <Clapperboard className="h-5 w-5" />
                             </Button>
                         )}
                     </div>
                </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4" /> About the Artwork
                </h3>
                <div className="text-muted-foreground leading-relaxed prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{artwork.description}</ReactMarkdown>
                </div>
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 gap-4 py-4">
                 {artwork.category === "video" || artwork.category === "music" ? (
                    <>
                        {/* Video Quality Display */}
                        {artwork.video?.quality && (
                            <div className="bg-muted/30 p-3 rounded-lg border">
                                <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1 mb-1">
                                    <Ruler className="h-3 w-3" /> Quality
                                </span>
                                <p className="font-medium">{artwork.video.quality}</p>
                            </div>
                        )}
                        {/* Tools Used Display */}
                        {artwork.materialsUsed?.length > 0 && (
                             <div className="bg-muted/30 p-3 rounded-lg border">
                                 <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1 mb-1">
                                    <Box className="h-3 w-3" /> Tools Used
                                </span>
                                <p className="font-medium truncate" title={artwork.materialsUsed.join(", ")}>
                                    {artwork.materialsUsed.join(", ")}
                                </p>
                             </div>
                        )}
                    </>
                 ) : (
                    <>
                        {/* Standard Dimensions */}
                         {artwork.dimensions && (
                            <div className="bg-muted/30 p-3 rounded-lg border">
                                <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1 mb-1">
                                    <Ruler className="h-3 w-3" /> Dimensions
                                </span>
                                <p className="font-medium">
                                    {artwork.dimensions.width} x {artwork.dimensions.height}
                                    {artwork.dimensions.depth ? ` x ${artwork.dimensions.depth}` : ""} {artwork.dimensions.unit}
                                </p>
                            </div>
                         )}
                         {/* Standard Materials */}
                         {artwork.materialsUsed?.length > 0 && (
                             <div className="bg-muted/30 p-3 rounded-lg border">
                                 <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1 mb-1">
                                    <Box className="h-3 w-3" /> Materials
                                </span>
                                <p className="font-medium truncate" title={artwork.materialsUsed.join(", ")}>
                                    {artwork.materialsUsed.join(", ")}
                                </p>
                             </div>
                         )}
                    </>
                 )}
                  {artwork.colors?.length > 0 && (
                     <div className="bg-muted/30 p-3 rounded-lg border col-span-2">
                        <span className="text-xs text-muted-foreground uppercase font-bold flex items-center gap-1 mb-1">
                            <Palette className="h-3 w-3" /> Palette
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {artwork.colors.map((color, i) => (
                                <Badge key={i} variant="outline" className="bg-background">
                                    <span
                                        className="h-2 w-2 rounded-full mr-2 border shadow-sm"
                                        style={{ backgroundColor: color.toLowerCase() }}
                                    />
                                    {color}
                                </Badge>
                            ))}
                        </div>
                     </div>
                 )}
            </div>

            <Separator />

            {/* Primary Actions */}
            <div className="flex flex-col gap-4">
                 {isAuthenticated && (isAdmin || isOwner) ? (
                     <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => navigate(`/artworks/${id}/edit`)} className="w-full">
                            <Edit className="mr-2 h-4 w-4" /> Edit Artwork
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} className="w-full">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Artwork
                        </Button>
                     </div>
                 ) : (
                     <div className="w-full">
                        {artwork.isForSale && (
                             <AddToCartButton artwork={artwork}/>
                        )}
                     </div>
                 )}
            </div>

            {/* Stock Indicator */}
            <div className="flex items-center justify-center text-xs text-muted-foreground gap-2">
                <Box className="h-3 w-3" />
                <span>{artwork.totalInStock > 0 ? `${artwork.totalInStock} units in stock` : "Currently out of stock"}</span>
            </div>
        </div>
      </div>

      <Separator className="my-8 sm:my-12 mx-4 sm:mx-0" />

      {/* Reviews Section */}
      <div className="px-4 sm:px-0">
        <ReviewSection artworkId={artwork._id} artistId={artwork.artist?._id} />
      </div>

      {/* Mobile Sticky Action Bar */}
      {artwork.isForSale && !isOwner && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t shadow-lg sm:hidden z-50">
          <div className="flex gap-2">
            <AddToCartButton artwork={artwork} className="flex-1" />
            {isAuthenticated && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className={isFavorite ? "text-red-500 border-red-200 bg-red-50" : ""}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Bottom padding for sticky bar */}
      <div className="h-20 sm:hidden" />
    </div>
  );
};

export default ArtworkDetailPage;
