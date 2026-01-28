import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { reviewsAPI } from "../../services/api";
import { toast } from "sonner";
import Loading from "../common/Loading";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star,  Trash2, Edit2, MessageSquarePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ReviewSection = ({ artworkId, artistId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    comment: "",
    rating: 5,
  });

  // Check if current user has already reviewed
  const hasReviewed = reviews.some((r) => r.user?._id === user?._id);

  // Check if user is the artist (can't review own artwork)
  const isArtist = user?._id?.toString() === artistId?.toString();
  const isAdmin = user?.role === "admin" || user?.role === "superAdmin";

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

  // Open Dialog for Edit
  const handleEditClick = (review) => {
    setEditingReviewId(review._id);
    setFormData({
      title: review.title || "",
      comment: review.comment || "",
      rating: review.rating,
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setEditingReviewId(null);
    setFormData({ title: "", comment: "", rating: 5 });
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

      if (editingReviewId) {
        // Update existing review
        await reviewsAPI.update(editingReviewId, reviewData);
        toast.success("Review updated successfully!");
        handleCloseEdit();
      } else {
        // Create new review
        await reviewsAPI.create(artworkId, reviewData);
        toast.success("Review posted successfully!");
        setShowForm(false);
        setFormData({ title: "", comment: "", rating: 5 });
      }

      await fetchReviews();
    } catch (err) {
      const errorMsg = err.response?.data?.error || (editingReviewId ? "Failed to update review" : "Failed to post review");
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

  const renderStars = (rating, interactive = false, size = "md") => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        const isFilled = i <= rating;
      stars.push(
        <Star
          key={i}
          className={`${size === "lg" ? "h-6 w-6" : "h-4 w-4"} ${
              isFilled ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
          } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={interactive ? () => handleRatingClick(i) : undefined}
        />
      );
    }
    return <div className="flex gap-0.5">{stars}</div>;
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <Loading message="Loading reviews..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">
          Reviews ({reviews.length})
        </h2>
        {/* Show write review button conditions */}
        {isAuthenticated && !isArtist && !hasReviewed && !showForm && (
          <Button onClick={() => setShowForm(!showForm)}>
             <MessageSquarePlus className="mr-2 h-4 w-4" /> Write a Review
          </Button>
        )}
      </div>

      {!isAuthenticated && (
         <div className="bg-muted/50 p-4 rounded-lg text-center text-muted-foreground">
             Please <a href="/login" className="underline hover:text-primary">log in</a> to leave a review.
         </div>
      )}

      {/* New Review Form Area */}
      {showForm && (
        <Card className="border-primary/20 bg-accent/10">
            <CardHeader>
                <CardTitle>Write your review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Rating</label>
                        {renderStars(formData.rating, true, "lg")}
                    </div>
                    
                    <div className="space-y-2">
                         <label htmlFor="title" className="text-sm font-medium">Title</label>
                         <Input
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="Summarize your experience"
                         />
                    </div>

                    <div className="space-y-2">
                         <label htmlFor="comment" className="text-sm font-medium">Comment</label>
                         <Textarea
                            id="comment"
                            name="comment"
                            value={formData.comment}
                            onChange={handleChange}
                            placeholder="What did you think about this artwork?"
                            rows={4}
                         />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>Post Review</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {reviews.length === 0 && !showForm && !isLoading && (
            <p className="text-center text-muted-foreground py-8">
                No reviews yet. Be the first to share your thoughts!
            </p>
        )}

        {reviews.map((review) => {
            const isAuthor = user?._id?.toString() === review.user?._id?.toString();
            // Permission Logic:
            // Delete: Author OR Admin OR SuperAdmin OR Artwork Owner (Artist)
            const canDelete = isAuthor || isAdmin || isArtist; 
            // Edit: Author OR Admin OR SuperAdmin OR Artwork Owner (Artist)
            const canEdit = isAuthor || isAdmin || isArtist;

            return (
                <Card key={review._id} className="bg-card">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                         {review.user?.role === "artist" ? (
                             <Link to={`/artists/${review.user._id}`} className="hover:opacity-80 transition-opacity">
                                <Avatar>
                                    <AvatarImage src={review.user?.profilePicture} />
                                    <AvatarFallback>{review.user?.firstName?.[0]}</AvatarFallback>
                                </Avatar>
                             </Link>
                         ) : (
                            <Avatar>
                                <AvatarImage src={review.user?.profilePicture} />
                                <AvatarFallback>{review.user?.firstName?.[0]}</AvatarFallback>
                            </Avatar>
                         )}
                        
                        <div className="grid gap-1 flex-1">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold flex items-center gap-2">
                                    {review.user?.role === "artist" ? (
                                        <Link to={`/artists/${review.user._id}`} className="hover:underline hover:text-primary transition-colors">
                                            {review.user?.firstName} {review.user?.lastName}
                                        </Link>
                                    ) : (
                                        <span>{review.user?.firstName} {review.user?.lastName}</span>
                                    )}
                                    {review.isVerified && (
                                        <Badge variant="secondary" className="text-[10px] h-5">Verified Buyer</Badge>
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="flex items-center pt-1">
                                {renderStars(review.rating)}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {review.title && <h4 className="font-semibold text-sm">{review.title}</h4>}
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {review.comment}
                        </p>
                    </CardContent>
                    {(canEdit || canDelete) && (
                        <CardFooter className="flex justify-end gap-2 pt-0 pb-4">
                             {canEdit && (
                                <Button variant="ghost" size="sm" onClick={() => handleEditClick(review)}>
                                    <Edit2 className="mr-2 h-3 w-3" /> Edit
                                </Button>
                             )}
                             {canDelete && (
                                 <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/90 hover:bg-destructive/10" onClick={() => handleDelete(review._id)}>
                                    <Trash2 className="mr-2 h-3 w-3" /> Delete
                                </Button>
                             )}
                        </CardFooter>
                    )}
                </Card>
            );
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
            <DialogDescription>
                Update your review for this artwork.
            </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    {renderStars(formData.rating, true, "lg")}
                </div>
                 <div className="space-y-2">
                     <label htmlFor="edit-title" className="text-sm font-medium">Title</label>
                     <Input
                        id="edit-title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                     />
                </div>
                 <div className="space-y-2">
                     <label htmlFor="edit-comment" className="text-sm font-medium">Comment</label>
                     <Textarea
                        id="edit-comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        rows={4}
                     />
                </div>
                <DialogFooter>
                     <Button type="button" variant="outline" onClick={handleCloseEdit}>Cancel</Button>
                     <Button type="submit">Update</Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewSection;
