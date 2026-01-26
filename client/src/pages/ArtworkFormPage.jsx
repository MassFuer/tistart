import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { artworksAPI } from "../services/api";
import toast from "react-hot-toast";
import MarkdownEditor from "../components/common/MarkdownEditor";
import ImageUpload from "../components/common/ImageUpload";
import { 
  Video, 
  Loader2, 
  ArrowLeft, 
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Trash2 } from "lucide-react";

const ArtworkFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

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
    video: {
      isPaid: false,
    },
  });

  const isVideoCategory = formData.category === "video" || formData.category === "music";
  const categories = ["painting", "sculpture", "photography", "digital", "music", "video", "other"];

  // Effects & Handlers (kept same as original)
  useEffect(() => {
    if (isEditing) {
      fetchArtwork();
    }
  }, [id]);

  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

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

  // Select Change Handler for Shadcn Select
  const handleSelectChange = (name, value) => {
    if (name.includes(".")) {
       const [parent, child] = name.split(".");
       setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleImagesSelect = (files) => {
     // ImageUpload returns all currently selected files
     // But since we are managing state here too (somewhat duplicated in ImageUpload state for preview)
     // we need to be careful. The component is designed to return the *new list* of files.
     // However, for this specific integration where we want to keep `selectedFiles` in sync:
     // The component returns `[...selectedFiles, ...newFiles]` on selection
     // and `filteredFiles` on removal.
     setSelectedFiles(files);
  };

  const handleRemoveExistingImage = (index) => {
      setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only MP4, WebM, and MOV videos are allowed");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("Video must be under 500MB");
      return;
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setSelectedVideo(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const removeSelectedVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
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
      delete data.video;
      let artworkId = id;

      if (isEditing) {
        data.images = existingImages;
        if (existingVideo && !selectedVideo) {
          data.videoIsPaid = formData.video.isPaid;
        }
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

      if (selectedFiles.length > 0) await uploadImages(artworkId);
      if (selectedVideo) await uploadVideo(artworkId);

      navigate("/my-artworks");
    } catch (error) {
       console.error(error);
      const message = error.response?.data?.error || "Failed to save artwork";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/my-artworks")}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? "Edit Artwork" : "Create New Artwork"}
              </h1>
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading || isUploadingVideo}>
              {(isSubmitting || isUploading || isUploadingVideo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Artwork" : "Publish Artwork"}
          </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BASIC INFO */}
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Tell us about your masterpiece</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Sunset on the Seine"
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select 
                        value={formData.category} 
                        onValueChange={(val) => handleSelectChange("category", val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="capitalize">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <div className="min-h-[200px] border rounded-md">
                        <MarkdownEditor
                            value={formData.description}
                            onChange={(value) => setFormData({ ...formData, description: value })}
                            placeholder="Describe your artwork... (Markdown supported)"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* MEDIA */}
        <Card>
            <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
                <CardDescription>
                    Upload up to 5 images. {isVideoCategory && "For videos/music, upload a preview clip or full file."}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                {/* Images */}
                <div className="space-y-4">
                    <Label className="text-base">Images</Label>
                    <ImageUpload
                        existingImages={existingImages}
                        onFileSelect={handleImagesSelect}
                        onRemoveExisting={handleRemoveExistingImage}
                        maxFiles={5}
                        multiple={true}
                    />
                </div>
                
                {/* Video */}
                {isVideoCategory && (
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base">Video / Audio Content</Label>
                        <Alert className={`bg-muted/50 ${existingVideo || videoPreviewUrl ? "border-green-200" : ""}`}>
                            <div className="flex flex-col gap-4">
                                {(existingVideo || videoPreviewUrl) ? (
                                    <div className="w-full max-w-md aspect-video bg-black rounded-lg overflow-hidden relative">
                                        <video 
                                            src={videoPreviewUrl || existingVideo?.url} 
                                            controls 
                                            className="w-full h-full"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 rounded-full"
                                            onClick={videoPreviewUrl ? removeSelectedVideo : removeExistingVideo}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-background">
                                         <Video className="h-10 w-10 text-muted-foreground mb-4" />
                                         <p className="text-sm text-muted-foreground mb-4 text-center">
                                             Upload MP4, WebM or MOV (max 500MB). <br />
                                             Recommended codec: H.264
                                         </p>
                                         <Button type="button" variant="secondary" onClick={() => document.getElementById('video-upload').click()}>
                                            <Upload className="mr-2 h-4 w-4" /> Select Video File
                                         </Button>
                                         <input
                                            id="video-upload"
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleVideoSelect}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox 
                                        id="video-paid" 
                                        checked={formData.video.isPaid}
                                        onCheckedChange={(checked) => handleSelectChange("video.isPaid", checked)}
                                    />
                                    <div>
                                        <Label htmlFor="video-paid" className="font-medium">Premium Content</Label>
                                        <p className="text-xs text-muted-foreground">
                                            If checked, users must purchase the artwork to watch the full video.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Alert>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* DETAILS & PRICING */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="materials">Materials Used</Label>
                        <Input
                            id="materials"
                            name="materialsUsed"
                            value={formData.materialsUsed}
                            onChange={handleChange}
                            placeholder="e.g. Oil, Canvas, Wood"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="colors">Colors</Label>
                        <Input
                            id="colors"
                            name="colors"
                            value={formData.colors}
                            onChange={handleChange}
                            placeholder="e.g. Red, Blue, Gold"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                placeholder="Width"
                                type="number"
                                name="dimensions.width"
                                value={formData.dimensions.width}
                                onChange={handleChange}
                            />
                            <Input
                                placeholder="Height"
                                type="number"
                                name="dimensions.height"
                                value={formData.dimensions.height}
                                onChange={handleChange}
                            />
                            <Input
                                placeholder="Depth"
                                type="number"
                                name="dimensions.depth"
                                value={formData.dimensions.depth}
                                onChange={handleChange}
                            />
                        </div>
                         <Select 
                            value={formData.dimensions.unit} 
                            onValueChange={(val) => handleSelectChange("dimensions.unit", val)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cm">cm</SelectItem>
                                <SelectItem value="in">inches</SelectItem>
                                <SelectItem value="m">meters</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Pricing & Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (€) *</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0" 
                                step="0.01"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="originalPrice">Original Price (€)</Label>
                            <Input
                                id="originalPrice"
                                name="originalPrice"
                                type="number"
                                min="0" 
                                step="0.01"
                                value={formData.originalPrice}
                                onChange={handleChange}
                            />
                        </div>
                     </div>
                     
                     <div className="space-y-2">
                        <Label htmlFor="stock">Stock Quantity *</Label>
                        <Input
                            id="stock"
                            name="totalInStock"
                            type="number"
                            min="0"
                            value={formData.totalInStock}
                            onChange={handleChange}
                            required
                        />
                     </div>

                     <div className="flex items-center space-x-2 pt-4">
                        <Checkbox 
                            id="for-sale" 
                            checked={formData.isForSale}
                            onCheckedChange={(checked) => handleSelectChange("isForSale", checked)}
                        />
                         <div>
                            <Label htmlFor="for-sale" className="font-medium">Available for Sale</Label>
                            <p className="text-xs text-muted-foreground">
                                Allow users to purchase this artwork immediately.
                            </p>
                        </div>
                     </div>
                </CardContent>
            </Card>
        </div>

        <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" onClick={() => navigate("/my-artworks")}>
                Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isUploading || isUploadingVideo}>
                {(isSubmitting || isUploading || isUploadingVideo) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Artwork" : "Publish Artwork"}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default ArtworkFormPage;
