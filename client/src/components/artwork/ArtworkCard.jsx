import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usersAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./ArtworkCard.css";

const ArtworkCard = ({ artwork, showActions = false, onDelete }) => {
  const { isAuthenticated, user, refreshUser } = useAuth();
  const isOwner = user?._id === artwork.artist?._id;
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Convert favorites to strings for comparison (MongoDB ObjectIds vs strings)
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

  return (
    <div className="artwork-card">
      {/* Favorite button - top left corner */}
      {isAuthenticated && !isOwner && (
        <button
          onClick={handleFavorite}
          disabled={favoriteLoading}
          className={`favorite-btn ${isFavorite ? "is-favorite" : ""}`}
          title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          {favoriteLoading ? (
            <span className="favorite-spinner"></span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          )}
        </button>
      )}

      <Link to={`/artworks/${artwork._id}`}>
        <div className="artwork-image">
          {artwork.images?.[0] ? (
            <img src={artwork.images[0]} alt={artwork.title} />
          ) : (
            <div className="no-image">No Image</div>
          )}
          {artwork.originalPrice && artwork.price < artwork.originalPrice && (
            <span className="discount-badge">Sale</span>
          )}
        </div>

        <div className="artwork-info">
          <h3 className="artwork-title">{artwork.title}</h3>
          <p className="artwork-artist">
            by {artwork.artist?.artistInfo?.companyName || `${artwork.artist?.firstName} ${artwork.artist?.lastName}`}
          </p>
          <span className="artwork-category">{artwork.category}</span>

          <div className="artwork-price">
            {artwork.isForSale ? (
              <>
                <span className="price">{formatPrice(artwork.price)}</span>
                {artwork.originalPrice && artwork.price < artwork.originalPrice && (
                  <span className="original-price">{formatPrice(artwork.originalPrice)}</span>
                )}
              </>
            ) : (
              <span className="not-for-sale">Not for sale</span>
            )}
          </div>

          {artwork.averageRating > 0 && (
            <div className="artwork-rating">
              {"★".repeat(Math.round(artwork.averageRating))}
              <span>({artwork.numOfReviews})</span>
            </div>
          )}
        </div>
      </Link>

      {showActions && isOwner && (
        <div className="artwork-actions">
          <Link to={`/artworks/${artwork._id}/edit`} className="btn btn-small">
            Edit
          </Link>
          {onDelete && (
            <button onClick={() => onDelete(artwork._id)} className="btn btn-small btn-danger">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ArtworkCard;
