import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { videosAPI } from "../../services/api";
import toast from "react-hot-toast";
import "./VideoPlayer.css";

const VideoPlayer = ({ artwork, onPurchaseComplete }) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState(null);

  const video = artwork?.video;
  const isOwner = user?._id === artwork?.artist?._id;
  const isPaid = video?.isPaid;

  useEffect(() => {
    if (video?.url) {
      checkAccess();
    } else {
      setIsLoading(false);
    }
  }, [artwork?._id, isAuthenticated]);

  const checkAccess = async () => {
    // Owner always has access - get signed URL for proper streaming
    if (isOwner) {
      setAccessInfo({ hasAccess: true, isOwner: true });
      await fetchStreamUrl();
      setIsLoading(false);
      return;
    }

    // For free videos, still need signed URL for proper streaming
    if (!isPaid) {
      setAccessInfo({ hasAccess: true });
      await fetchStreamUrl();
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated) {
      setAccessInfo({ hasAccess: false, requiresLogin: true });
      setIsLoading(false);
      return;
    }

    try {
      const response = await videosAPI.checkAccess(artwork._id);
      setAccessInfo(response.data.data);

      // If user has access, get stream URL
      if (response.data.data.hasAccess) {
        await fetchStreamUrl();
      }
    } catch (err) {
      setError("Failed to check video access");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStreamUrl = async () => {
    try {
      const response = await videosAPI.getStreamUrl(artwork._id);
      setStreamUrl(response.data.data.streamUrl);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessInfo({ hasAccess: false, price: err.response.data.price });
      } else {
        setError("Failed to load video");
      }
    }
  };

  const handleBuyClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to purchase this video");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true);
    setShowConfirmModal(false);

    try {
      // Add to cart with quantity 1
      await addToCart(artwork._id, 1);
      toast.success("Video added to cart!");
      // Redirect to checkout
      navigate("/checkout");
    } catch (err) {
      const message = err.response?.data?.error || "Failed to add to cart";
      toast.error(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCancelPurchase = () => {
    setShowConfirmModal(false);
  };

  // No video
  if (!video?.url) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="video-player-container">
        <div className="video-loading">
          <div className="spinner"></div>
          <p>Loading video...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="video-player-container">
        <div className="video-error">
          <p>{error}</p>
          <button onClick={checkAccess} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Free video or user has access (owner, purchased, or free content)
  if (accessInfo?.hasAccess) {
    // Always use signed stream URL for proper video streaming with correct headers
    // Falls back to direct URL only if stream URL is not available
    const videoSrc = streamUrl || video.url;

    return (
      <div className="video-player-container">
        <div className="video-wrapper">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            poster={video.thumbnailUrl || artwork.images?.[0]}
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        </div>
        {video.duration && (
          <div className="video-meta">
            <span className="video-duration">
              {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
            </span>
            {accessInfo?.purchasedAt && (
              <span className="video-purchased">
                Purchased {new Date(accessInfo.purchasedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Requires login
  if (accessInfo?.requiresLogin) {
    return (
      <div className="video-player-container">
        <div className="video-paywall">
          <div
            className="video-preview-overlay"
            style={{ backgroundImage: `url(${video.thumbnailUrl || artwork.images?.[0]})` }}
          >
            <div className="paywall-content">
              <span className="paywall-icon">🔒</span>
              <h3>Premium Video Content</h3>
              <p>Log in to watch or purchase this video</p>
              <a href="/login" className="btn btn-primary">
                Log In
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Requires purchase
  return (
    <div className="video-player-container">
      <div className="video-paywall">
        <div
          className="video-preview-overlay"
          style={{ backgroundImage: `url(${video.thumbnailUrl || artwork.images?.[0]})` }}
        >
          <div className="paywall-content">
            <span className="paywall-icon">🎬</span>
            <h3>Premium Video</h3>
            <p className="video-price">{artwork.price?.toFixed(2)} EUR</p>
            <p className="video-description">One-time purchase for unlimited streaming</p>
            <button
              onClick={handleBuyClick}
              disabled={isPurchasing}
              className="btn btn-primary btn-purchase"
            >
              {isPurchasing ? "Processing..." : `Buy Now - ${artwork.price?.toFixed(2)} EUR`}
            </button>
            <p className="paywall-note">Instant access after purchase</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="video-confirm-modal-overlay" onClick={handleCancelPurchase}>
          <div className="video-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Purchase</h3>
            <p>
              You are about to purchase access to <strong>{artwork.title}</strong> for{" "}
              <strong>{artwork.price?.toFixed(2)} EUR</strong>.
            </p>
            <p className="modal-note">
              This will add the video to your cart and redirect you to checkout.
            </p>
            <div className="modal-actions">
              <button
                onClick={handleCancelPurchase}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
                className="btn btn-primary"
              >
                {isPurchasing ? "Processing..." : "Confirm & Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
