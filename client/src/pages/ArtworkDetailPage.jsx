import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { artworksAPI, usersAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import AddToCartButton from "../components/common/AddToCartButton";
import ReviewSection from "../components/review/ReviewSection";
import VideoPlayer from "../components/video/VideoPlayer";
import toast from "react-hot-toast";
import "./ArtworkDetailPage.css";

const ArtworkDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user, refreshUser } = useAuth();
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

  useEffect(() => {
    fetchArtwork();
  }, [id]);

  const fetchArtwork = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await artworksAPI.getOne(id);
      setArtwork(response.data.data);
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
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
    <div className="artwork-detail-page">
      <div className="artwork-detail">
        <div className="artwork-gallery">
          {/* Video Player for video/music artworks - shows as main content */}
          {artwork.video?.url && (
            <VideoPlayer artwork={artwork} onPurchaseComplete={fetchArtwork} />
          )}

          {/* Main Image - show if NO video, OR if video exists with images */}
          {artwork.images?.length > 0 && (
            <div className={`main-image ${artwork.video?.url ? "with-video" : ""}`}>
              <img src={artwork.images[selectedImage]} alt={artwork.title} />
            </div>
          )}

          {/* Show "No Image" only when no video AND no images */}
          {!artwork.video?.url && !artwork.images?.length && (
            <div className="main-image">
              <div className="no-image">No Image Available</div>
            </div>
          )}

          {/* Thumbnails - show if multiple images exist */}
          {artwork.images?.length > 1 && (
            <div className="thumbnail-list">
              {artwork.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === selectedImage ? "active" : ""}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img} alt={`${artwork.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="artwork-info">
          <div className="info-header">
            <div>
              <div className="badges">
                <span className="category-badge">{artwork.category}</span>
                {artwork.video?.url && (
                  <span className={`video-badge ${artwork.video.isPaid ? "paid" : "free"}`}>
                    {artwork.video.isPaid ? "Premium Video" : "Free Video"}
                  </span>
                )}
              </div>
              <h1>{artwork.title}</h1>
            </div>
            {/* Favorite heart button */}
            {isAuthenticated && !isOwner && (
              <button
                onClick={handleFavorite}
                disabled={favoriteLoading}
                className={`detail-favorite-btn ${isFavorite ? "is-favorite" : ""}`}
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
          </div>

          <Link to={`/artists/${artwork.artist?._id}`} className="artist-link">
            {artwork.artist?.artistInfo?.companyName && (
              <span className="artist-company">{artwork.artist.artistInfo.companyName}</span>
            )}
            <span className="artist-name">
              by {artwork.artist?.firstName} {artwork.artist?.lastName}
            </span>
          </Link>

          <div className="price-section">
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
            <div className="rating">
              {"★".repeat(Math.round(artwork.averageRating))}
              <span className="rating-count">({artwork.numOfReviews} reviews)</span>
            </div>
          )}

          <div className="description">
            <h3>Description</h3>
            <p>{artwork.description}</p>
          </div>

          <div className="details">
            {artwork.dimensions && (
              <div className="detail-item">
                <strong>Dimensions:</strong>
                <span>
                  {artwork.dimensions.width} x {artwork.dimensions.height}
                  {artwork.dimensions.depth ? ` x ${artwork.dimensions.depth}` : ""} {artwork.dimensions.unit}
                </span>
              </div>
            )}

            {artwork.materialsUsed?.length > 0 && (
              <div className="detail-item">
                <strong>Materials:</strong>
                <span>{artwork.materialsUsed.join(", ")}</span>
              </div>
            )}

            {artwork.colors?.length > 0 && (
              <div className="detail-item">
                <strong>Colors:</strong>
                <div className="color-list">
                  {artwork.colors.map((color, index) => (
                    <span key={index} className="color-tag">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="detail-item">
              <strong>Stock:</strong>
              <span>{artwork.totalInStock > 0 ? `${artwork.totalInStock} available` : "Out of stock"}</span>
            </div>
          </div>

          <div className="actions">
            {isAuthenticated && (user?.role === "admin" || isOwner) ? (
              <div className="owner-actions">
                <Link to={`/artworks/${id}/edit`} className="btn btn-secondary">
                  Edit
                </Link>
                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to delete this artwork?")) {
                      try {
                        await artworksAPI.delete(id);
                        toast.success("Artwork deleted successfully");
                        window.location.href = "/gallery";
                      } catch (error) {
                        toast.error("Failed to delete artwork");
                      }
                    }
                  }}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            ) : (
              <div className="buyer-actions">
                <AddToCartButton artwork={artwork} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewSection artworkId={artwork._id} artistId={artwork.artist?._id} />
    </div>
  );
};

export default ArtworkDetailPage;
