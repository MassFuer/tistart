import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { reviewsAPI } from "../../services/api";
import toast from "react-hot-toast";
import Loading from "../common/Loading";
import "./ReviewSection.css";

const ReviewSection = ({ artworkId, artistId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null); // Track which review is being edited
  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    rating: 5,
  });

  // Check if current user has already reviewed
  const hasReviewed = reviews.some((r) => r.user?._id === user?._id);

  // Check if user is the artist (can't review own artwork)
  const isArtist = user?._id === artistId;

  useEffect(() => {
    fetchReviews();
  }, [artworkId]);

  const fetchReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await reviewsAPI.getByArtwork(artworkId);
      setReviews(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setError("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };

  const handleEdit = (review) => {
    setEditingReview(review._id);
    setFormData({
      title: review.title || "",
      comment: review.comment || "",
      rating: review.rating,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setFormData({ title: "", comment: "", rating: 5 });
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        title: formData.title.trim(),
        comment: formData.comment.trim(),
        rating: Number(formData.rating),
      };

      if (editingReview) {
        // Update existing review
        await reviewsAPI.update(editingReview, reviewData);
        toast.success("Review updated successfully!");
      } else {
        // Create new review
        await reviewsAPI.create(artworkId, reviewData);
        toast.success("Review posted successfully!");
      }

      setFormData({ title: "", comment: "", rating: 5 });
      setEditingReview(null);
      setShowForm(false);
      await fetchReviews();
    } catch (err) {
      const errorMsg = err.response?.data?.error || (editingReview ? "Failed to update review" : "Failed to post review");
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      await reviewsAPI.delete(reviewId);
      toast.success("Review deleted");
      await fetchReviews();
    } catch (err) {
      toast.error("Failed to delete review");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating, interactive = false, size = "medium") => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? "filled" : ""} ${interactive ? "interactive" : ""} star-${size}`}
          onClick={interactive ? () => handleRatingClick(i) : undefined}
        >
          ★
        </span>
      );
    }
    return <div className="stars">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="review-section">
        <h2 className="section-title">Reviews</h2>
        <Loading message="Loading reviews..." />
      </div>
    );
  }

  return (
    <div className="review-section">
      <div className="review-header">
        <h2 className="section-title">
          Reviews {reviews.length > 0 && <span className="review-count">({reviews.length})</span>}
        </h2>

        {/* Show write review button if authenticated, not artist, and hasn't reviewed */}
        {isAuthenticated && !isArtist && !hasReviewed && !showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Write a Review
          </button>
        )}
      </div>

      {/* Login prompt for unauthenticated users */}
      {!isAuthenticated && (
        <p className="login-prompt">
          Please <a href="/login">log in</a> to leave a review.
        </p>
      )}

      {/* Already reviewed message */}
      {isAuthenticated && hasReviewed && (
        <p className="already-reviewed">You have already reviewed this artwork.</p>
      )}

      {/* Artist can't review own work */}
      {isAuthenticated && isArtist && (
        <p className="artist-notice">You cannot review your own artwork.</p>
      )}

      {/* Review Form */}
      {showForm && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h3 className="form-title">{editingReview ? "Edit Your Review" : "Write a Review"}</h3>

          <div className="form-group">
            <label>Your Rating</label>
            {renderStars(formData.rating, true, "large")}
          </div>

          <div className="form-group">
            <label htmlFor="title">Title (optional)</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Summarize your experience"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="comment">Your Review *</label>
            <textarea
              id="comment"
              name="comment"
              value={formData.comment}
              onChange={handleChange}
              placeholder="What did you think about this artwork?"
              rows={4}
              maxLength={1000}
              required
            />
            <span className="char-count">{formData.comment.length}/1000</span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting
                ? (editingReview ? "Updating..." : "Posting...")
                : (editingReview ? "Update Review" : "Post Review")}
            </button>
          </div>
        </form>
      )}

      {/* Error message */}
      {error && <p className="error-message">{error}</p>}

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review this artwork!</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-item-header">
                <div className="reviewer-info">
                  {review.user?.profilePicture ? (
                    <img
                      src={review.user.profilePicture}
                      alt={review.user.firstName}
                      className="reviewer-avatar"
                    />
                  ) : (
                    <div className="reviewer-avatar placeholder">
                      {review.user?.firstName?.[0] || "?"}
                    </div>
                  )}
                  <div className="reviewer-details">
                    <span className="reviewer-name">
                      {review.user?.firstName} {review.user?.lastName}
                      {review.isVerified && (
                        <span className="verified-badge" title="Verified Purchase">
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="review-date">{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                <div className="review-rating">{renderStars(review.rating)}</div>
              </div>

              {review.title && <h4 className="review-title">{review.title}</h4>}
              <p className="review-comment">{review.comment}</p>

              {/* Edit/Delete buttons for owner */}
              {user?._id === review.user?._id && (
                <div className="review-actions">
                  <button
                    className="edit-review-btn"
                    onClick={() => handleEdit(review)}
                    title="Edit review"
                  >
                    Edit
                  </button>
                  <button
                    className="delete-review-btn"
                    onClick={() => handleDelete(review._id)}
                    title="Delete review"
                  >
                    Delete
                  </button>
                </div>
              )}
              {/* Delete button for admin (not owner) */}
              {user?.role === "admin" && user?._id !== review.user?._id && (
                <button
                  className="delete-review-btn"
                  onClick={() => handleDelete(review._id)}
                  title="Delete review"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
