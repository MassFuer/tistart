import React, { useState, useEffect, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ImageUpload = ({
  existingImages = [], // Array of URLs or single URL (if multiple=false)
  onFileSelect,
  onRemoveNew,
  onRemoveExisting,
  maxFiles = 5,
  multiple = true,
  className = "",
}) => {
  const [previewUrls, setPreviewUrls] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  // Normalize existingImages to always be an array for consistent handling internally
  const normalizedExistingImages = Array.isArray(existingImages)
    ? existingImages
    : existingImages
    ? [existingImages]
    : [];

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);

    // Calculate how many more files we can accept
    const currentTotal = normalizedExistingImages.length + selectedFiles.length;

    if (!multiple) {
        if (files.length > 1) {
             toast.error("Only one image allowed");
             return;
        }
    }

    const availableSlots = maxFiles - currentTotal;

    if (multiple && files.length > availableSlots) {
      toast.error(`You can only upload ${availableSlots} more image(s)`);
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    const invalidFiles = files.filter((file) => !validTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      toast.error("Only JPG, PNG, and WebP images are allowed");
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error("Each image must be under 5MB");
      return;
    }

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));

    if (!multiple) {
        // Single mode: Replace current selection
        // Cleanup old previews
        previewUrls.forEach(url => URL.revokeObjectURL(url));
        setPreviewUrls(newPreviewUrls);
        setSelectedFiles(files);
        onFileSelect(files[0]); // Return single file
    } else {
        // Multiple mode: Append
        setPreviewUrls([...previewUrls, ...newPreviewUrls]);
        setSelectedFiles([...selectedFiles, ...files]);
        onFileSelect([...selectedFiles, ...files]); // Return all selected files
    }

    // Reset input so the same file can be selected again if needed (e.g. after removing)
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const removeSelectedFileInternal = (index) => {
    URL.revokeObjectURL(previewUrls[index]);

    let newFiles;
    let newPreviews;

    if (!multiple) {
         newFiles = [];
         newPreviews = [];
         onFileSelect(null);
    } else {
        newPreviews = previewUrls.filter((_, i) => i !== index);
        newFiles = selectedFiles.filter((_, i) => i !== index);
        onFileSelect(newFiles);
    }

    setPreviewUrls(newPreviews);
    setSelectedFiles(newFiles);
    if (onRemoveNew) onRemoveNew(index);
  };

  const removeExistingImageInternal = (index) => {
      if (onRemoveExisting) {
          onRemoveExisting(index);
      }
  };

  const totalImages = normalizedExistingImages.length + selectedFiles.length;

  // Render for Single Image Mode (Simplified View)
  if (!multiple) {
     const hasImage = normalizedExistingImages.length > 0 || previewUrls.length > 0;
     const displayUrl = previewUrls.length > 0 ? previewUrls[0] : normalizedExistingImages[0];

     return (
        <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors ${className}`}>
             {hasImage ? (
                <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border shadow-sm group">
                    <img
                        src={displayUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleTriggerUpload}
                        >
                            Change
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => previewUrls.length > 0 ? removeSelectedFileInternal(0) : removeExistingImageInternal(0)}
                        >
                            Remove
                        </Button>
                    </div>
                </div>
             ) : (
                <div className="text-center py-8">
                     <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                     <p className="text-sm text-muted-foreground mb-4">
                        Drag & drop or click to upload
                     </p>
                     <Button type="button" variant="secondary" onClick={handleTriggerUpload}>
                        <Upload className="mr-2 h-4 w-4" /> Select Image
                     </Button>
                </div>
             )}
             <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
            />
        </div>
     );
  }

  // Render for Multiple Image Mode (Grid View)
  return (
    <div className={`space-y-4 ${className}`}>
        <div className="flex flex-wrap gap-4">
            {/* Existing Images */}
            {normalizedExistingImages.map((url, index) => (
                <div key={`existing-${index}`} className="relative group w-32 h-32 rounded-lg overflow-hidden border">
                    <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={() => removeExistingImageInternal(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            ))}

            {/* New Selected Images */}
            {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} className="relative group w-32 h-32 rounded-lg overflow-hidden border ring-2 ring-primary/20">
                    <img src={url} alt={`New ${index}`} className="w-full h-full object-cover" />
                        <button
                        type="button"
                        onClick={() => removeSelectedFileInternal(index)}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <Badge className="absolute bottom-1 left-1 h-5 text-[10px]" variant="secondary">New</Badge>
                </div>
            ))}

            {/* Upload Button */}
            {totalImages < maxFiles && (
                    <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">Add Image</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </label>
            )}
        </div>
        <p className="text-xs text-muted-foreground">
            {totalImages} / {maxFiles} images selected
        </p>
    </div>
  );
};

export default ImageUpload;
