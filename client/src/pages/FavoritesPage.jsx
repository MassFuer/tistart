import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import Loading from "../components/common/Loading";
import { toast } from "sonner";
import { Heart, ArrowRight, HeartOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const FavoritesPage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Re-fetch when user.favorites changes (after unfavoriting)
  useEffect(() => {
    if (user?.favorites && favorites.length > 0) {
      // Filter out items that are no longer in user.favorites
      const updatedFavorites = favorites.filter((artwork) =>
        user.favorites.some((favId) => favId.toString() === artwork._id.toString())
      );
      if (updatedFavorites.length !== favorites.length) {
        setFavorites(updatedFavorites);
      }
    }
  }, [user?.favorites]);

  const fetchFavorites = async () => {
    try {
      const response = await usersAPI.getFavorites();
      setFavorites(response.data.data);
    } catch (error) {
      toast.error("Failed to load favorites");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-screen">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8">
        <div>
           <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Heart className="h-8 w-8 text-destructive fill-destructive" /> 
              My Favorites
           </h1>
           <p className="text-muted-foreground mt-1">
              Collection of artworks you've saved.
           </p>
        </div>
        <div className="mt-4 md:mt-0">
             <Button variant="outline" asChild>
                <Link to="/gallery">Browse Gallery</Link>
             </Button>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-6">
             <HeartOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            You haven't added any artworks to your favorites list yet. 
            Explore the gallery to find pieces you love!
          </p>
          <Button asChild size="lg">
            <Link to="/gallery">
              Browse Gallery <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map((artwork) => (
            <ArtworkCard key={artwork._id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;