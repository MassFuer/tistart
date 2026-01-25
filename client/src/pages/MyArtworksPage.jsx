import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ArtworkCard from "../components/artwork/ArtworkCard";
import toast from "react-hot-toast";
import "./MyArtworksPage.css";

const MyArtworksPage = () => {
  const { user, isAdmin } = useAuth();
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMyArtworks();
  }, []);

  const fetchMyArtworks = async () => {
    try {
      const response = await artworksAPI.getAll({ limit: 100 });
      // If admin, show all. If artist, filter by ID.
      const filteredArtworks = isAdmin
        ? response.data.data
        : response.data.data.filter((a) => a.artist?._id === user._id);
      setArtworks(filteredArtworks);
    } catch (error) {
      toast.error("Failed to load artworks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this artwork?")) {
      return;
    }

    try {
      await artworksAPI.delete(id);
      setArtworks(artworks.filter((a) => a._id !== id));
      toast.success("Artwork deleted successfully");
    } catch (error) {
      toast.error("Failed to delete artwork");
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="my-artworks-page">
      <div className="page-header">
        <div>
          <h1>{isAdmin ? "All Artworks" : "My Artworks"}</h1>
          <p>{isAdmin ? "Manage all artworks on the platform" : "Manage your artwork collection"}</p>
        </div>
        <Link to="/artworks/new" className="btn btn-primary">
          + New Artwork
        </Link>
      </div>

      {artworks.length === 0 ? (
        <div className="empty-state">
          <p>You haven&apos;t created any artworks yet</p>
          <Link to="/artworks/new" className="btn btn-primary">
            Create your first artwork
          </Link>
        </div>
      ) : (
        <div className="artwork-grid">
          {artworks.map((artwork) => (
            <ArtworkCard
              key={artwork._id}
              artwork={artwork}
              showActions={true}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyArtworksPage;