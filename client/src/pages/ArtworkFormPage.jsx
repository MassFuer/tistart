import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { artworksAPI } from "../services/api";
import toast from "react-hot-toast";
import MarkdownEditor from "../components/common/MarkdownEditor";
import "./ArtworkFormPage.css";

const ArtworkFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  // Video upload state
  const [existingVideo, setExistingVideo] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: "painting",
    isForSale: true,
    materialsUsed: "",
    colors: "",
    dimensions: {
      width: "",
      height: "",
      depth: "",
      unit: "cm",
    },
    totalInStock: 1,
    // Video-specific fields
    video: {
      isPaid: false,
    },
  });

  const isVideoCategory = formData.category === "video" || formData.category === "music";

  const categories = ["painting", "sculpture", "photography", "digital", "music", "video", "other"];

  useEffect(() => {
    if (isEditing) {
      fetchArtwork();
    }
  }, [id]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [previewUrls, videoPreviewUrl]);

  const fetchArtwork = async () => {
    try {
      const response = await artworksAPI.getOne(id);
      const artwork = response.data.data;
      setFormData({
        title: artwork.title || "",
        description: artwork.description || "",
        price: artwork.price || "",
        originalPrice: artwork.originalPrice || "",
        category: artwork.category || "painting",
        isForSale: artwork.isForSale ?? true,
        materialsUsed: artwork.materialsUsed?.join(", ") || "",
        colors: artwork.colors?.join(", ") || "",
        dimensions: {
          width: artwork.dimensions?.width || "",
          height: artwork.dimensions?.height || "",
          depth: artwork.dimensions?.depth || "",
          unit: artwork.dimensions?.unit || "cm",
        },
        totalInStock: artwork.totalInStock || 1,
        video: {
          isPaid: artwork.video?.isPaid || false,
        },
      });
      setExistingImages(artwork.images || []);
      // Set existing video if present
      if (artwork.video?.url) {
        setExistingVideo(artwork.video);
      }
    } catch (error) {
      toast.error("Failed to load artwork");
      navigate("/my-artworks");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5 - existingImages.length - selectedFiles.length;

    if (files.length > maxFiles) {
      toast.error(`You can only upload ${maxFiles} more image(s)`);
      return;
    }

    // Validate file types
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const invalidFiles = files.filter((file) => !validTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    // Validate file sizes (5MB max)
    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be under 5MB");
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeSelectedFile = (index) => {
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  // Video handling
  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only MP4, WebM, and MOV videos are allowed");
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be under 500MB");
      return;
    }

    // Cleanup previous preview
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }

    setSelectedVideo(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setSelectedVideo(null);
    setVideoPreviewUrl(null);
  };

  const removeExistingVideo = () => {
    setExistingVideo(null);
  };

  const uploadVideo = async (artworkId) => {
    if (!selectedVideo) return;

    setIsUploadingVideo(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("video", selectedVideo);
      formDataUpload.append("isPaid", formData.video.isPaid);

      await artworksAPI.uploadVideo(artworkId, formDataUpload);
      toast.success("Video uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload video");
      throw error;
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const uploadImages = async (artworkId) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      selectedFiles.forEach((file) => {
        formDataUpload.append("images", file);
      });

      await artworksAPI.uploadImages(artworkId, formDataUpload);
      toast.success("Images uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload images");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        totalInStock: Number(formData.totalInStock),
        materialsUsed: formData.materialsUsed
          ? formData.materialsUsed.split(",").map((m) => m.trim())
          : [],
        colors: formData.colors ? formData.colors.split(",").map((c) => c.trim()) : [],
        dimensions: {
          width: formData.dimensions.width ? Number(formData.dimensions.width) : undefined,
          height: formData.dimensions.height ? Number(formData.dimensions.height) : undefined,
          depth: formData.dimensions.depth ? Number(formData.dimensions.depth) : undefined,
          unit: formData.dimensions.unit,
        },
      };

      // Don't send video object in regular update - it's handled separately
      // Only send video.isPaid if we have an existing video and no new video is being uploaded
      delete data.video;

      let artworkId = id;

      if (isEditing) {
        // Include existing images in update
        data.images = existingImages;

        // Handle video settings update (isPaid) without overwriting the video URL
        // Only update if we have an existing video and are not uploading a new one
        if (existingVideo && !selectedVideo) {
          data.videoIsPaid = formData.video.isPaid;
        }
        // If user removed the existing video (existingVideo is null) and no new video, clear it
        if (!existingVideo && !selectedVideo && isVideoCategory) {
          data.removeVideo = true;
        }

        await artworksAPI.update(id, data);
        toast.success("Artwork updated successfully");
      } else {
        const response = await artworksAPI.create(data);
        artworkId = response.data.data._id;
        toast.success("Artwork created successfully");
      }

      // Upload new images if any
      if (selectedFiles.length > 0) {
        await uploadImages(artworkId);
      }

      // Upload video if any (for video/music categories)
      if (selectedVideo) {
        await uploadVideo(artworkId);
      }

      navigate("/my-artworks");
    } catch (error) {
      const message = error.response?.data?.error || "Failed to save artwork";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  const totalImages = existingImages.length + selectedFiles.length;

  return (
    <div className="artwork-form-page">
      <div className="form-container">
        <h1>{isEditing ? "Edit Artwork" : "Create New Artwork"}</h1>

        <form onSubmit={handleSubmit} className="artwork-form">
          <section className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Artwork title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <MarkdownEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Describe your artwork... (Markdown supported)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="form-section">
            <h2>Images</h2>
            <p className="form-description">Upload up to 5 images (JPG, PNG, WebP - max 5MB each)</p>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="image-gallery">
                <h4>Current Images</h4>
                <div className="image-preview-grid">
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} className="image-preview-item">
                      <img src={url} alt={`Artwork ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeExistingImage(index)}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {previewUrls.length > 0 && (
              <div className="image-gallery">
                <h4>New Images</h4>
                <div className="image-preview-grid">
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="image-preview-item new-image">
                      <img src={url} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image-btn"
                        onClick={() => removeSelectedFile(index)}
                        title="Remove image"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Input */}
            {totalImages < 5 && (
              <div className="image-upload-area">
                <input
                  type="file"
                  id="images"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <label htmlFor="images" className="file-input-label">
                  <span className="upload-icon">+</span>
                  <span>Add Images ({totalImages}/5)</span>
                </label>
              </div>
            )}
          </section>

          {/* Video Upload Section - Only for video/music categories */}
          {isVideoCategory && (
            <section className="form-section">
              <h2>Video Content</h2>
              <p className="form-description">
                Upload your video file (MP4, WebM, MOV - max 500MB).
                <strong> Important:</strong> Use H.264 codec for best browser compatibility.
                HEVC/H.265 videos may not play in Chrome/Firefox.
              </p>

              {/* Existing Video */}
              {existingVideo && !videoPreviewUrl && (
                <div className="video-gallery">
                  <h4>Current Video</h4>
                  <div className="video-preview-item">
                    <video src={existingVideo.url} controls />
                    <button
                      type="button"
                      className="remove-video-btn"
                      onClick={removeExistingVideo}
                      title="Remove video"
                    >
                      ×
                    </button>
                    {existingVideo.isPaid && (
                      <span className="video-paid-badge">Premium</span>
                    )}
                  </div>
                </div>
              )}

              {/* New Video Preview */}
              {videoPreviewUrl && (
                <div className="video-gallery">
                  <h4>New Video</h4>
                  <div className="video-preview-item new-video">
                    <video src={videoPreviewUrl} controls />
                    <button
                      type="button"
                      className="remove-video-btn"
                      onClick={removeSelectedVideo}
                      title="Remove video"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              {/* Video Upload Input */}
              {!existingVideo && !videoPreviewUrl && (
                <div className="video-upload-area">
                  <input
                    type="file"
                    id="video"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoSelect}
                    className="file-input"
                  />
                  <label htmlFor="video" className="file-input-label">
                    <span className="upload-icon">🎬</span>
                    <span>Add Video</span>
                  </label>
                </div>
              )}

              {/* Change Video Button */}
              {(existingVideo || videoPreviewUrl) && (
                <div className="change-video-area">
                  <input
                    type="file"
                    id="change-video"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleVideoSelect}
                    className="file-input"
                  />
                  <label htmlFor="change-video" className="btn btn-secondary btn-small">
                    Change Video
                  </label>
                </div>
              )}

              {/* Video Pricing Option */}
              <div className="form-group checkbox-group video-pricing">
                <label>
                  <input
                    type="checkbox"
                    name="video.isPaid"
                    checked={formData.video.isPaid}
                    onChange={handleChange}
                  />
                  Premium video (requires purchase to watch)
                </label>
                <p className="form-hint">
                  {formData.video.isPaid
                    ? "Users must pay the artwork price to access the full video."
                    : "Video will be freely viewable by all users."}
                </p>
              </div>
            </section>
          )}

          <section className="form-section">
            <h2>Pricing</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="price">Price (EUR) *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label htmlFor="originalPrice">Original Price (EUR)</label>
                <input
                  type="number"
                  id="originalPrice"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="For discounted items"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="totalInStock">Stock Quantity *</label>
                <input
                  type="number"
                  id="totalInStock"
                  name="totalInStock"
                  value={formData.totalInStock}
                  onChange={handleChange}
                  required
                  min="0"
                  placeholder="1"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isForSale"
                    checked={formData.isForSale}
                    onChange={handleChange}
                  />
                  Available for sale
                </label>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>Details</h2>

            <div className="form-group">
              <label htmlFor="materialsUsed">Materials Used</label>
              <input
                type="text"
                id="materialsUsed"
                name="materialsUsed"
                value={formData.materialsUsed}
                onChange={handleChange}
                placeholder="Oil, canvas, wood (comma separated)"
              />
            </div>

            <div className="form-group">
              <label htmlFor="colors">Colors</label>
              <input
                type="text"
                id="colors"
                name="colors"
                value={formData.colors}
                onChange={handleChange}
                placeholder="Blue, red, gold (comma separated)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dimensions.width">Width</label>
                <input
                  type="number"
                  id="dimensions.width"
                  name="dimensions.width"
                  value={formData.dimensions.width}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.height">Height</label>
                <input
                  type="number"
                  id="dimensions.height"
                  name="dimensions.height"
                  value={formData.dimensions.height}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.depth">Depth</label>
                <input
                  type="number"
                  id="dimensions.depth"
                  name="dimensions.depth"
                  value={formData.dimensions.depth}
                  onChange={handleChange}
                  min="0"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dimensions.unit">Unit</label>
                <select
                  id="dimensions.unit"
                  name="dimensions.unit"
                  value={formData.dimensions.unit}
                  onChange={handleChange}
                >
                  <option value="cm">cm</option>
                  <option value="in">inches</option>
                  <option value="m">m</option>
                </select>
              </div>
            </div>
          </section>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/my-artworks")}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploading || isUploadingVideo}>
              {isSubmitting || isUploading || isUploadingVideo
                ? "Saving..."
                : isEditing
                ? "Update Artwork"
                : "Create Artwork"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ArtworkFormPage;
