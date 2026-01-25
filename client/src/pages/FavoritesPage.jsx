import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { usersAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import toast from "react-hot-toast";
import "./FavoritesPage.css";

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
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="favorites-page">
      <div className="page-header">
        <h1>My Favorites</h1>
        <p>Artworks you&apos;ve saved for later</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t added any favorites yet</p>
          <a href="/gallery" className="btn btn-primary">
            Browse Gallery
          </a>
        </div>
      ) : (
        <div className="artwork-grid">
          {favorites.map((artwork) => (
            <ArtworkCard key={artwork._id} artwork={artwork} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;