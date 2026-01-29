import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { artworksAPI } from "../services/api";
import { useNavigation } from "../context/NavigationContext";
import { toast } from "sonner";
import MarkdownEditor from "../components/common/MarkdownEditor";
import ImageUpload from "../components/common/ImageUpload";
import { 
  Video, 
  Loader2, 
  ArrowLeft, 
  Upload,
  Music,
  FileText,
  Clapperboard,
  Users,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";  
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const ArtworkFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { goBackWithScroll } = useNavigation();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Video Asset States
  const [selectedFullVideo, setSelectedFullVideo] = useState(null);
  const [selectedPreviewVideo, setSelectedPreviewVideo] = useState(null);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [selectedSubtitles, setSelectedSubtitles] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    originalPrice: "",
    category: searchParams.get("category") || "painting",
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
    // Video Specific Data
    video: {
      isPaid: false,
      synopsis: "",
      director: "",
      coAuthor: "",
      cast: [], // Array of strings
      productionTeam: [], // Array of { role, name, link }
      // Existing URLs (for editing)
      fullVideoUrl: "",
      previewVideoUrl: "",
      backgroundAudioUrl: "",
      subtitlesUrl: "",
      quality: ""
    },
  });

  const isVideoCategory = formData.category === "video" || formData.category === "music";
  const categories = ["painting", "sculpture", "photography", "digital", "music", "video", "other"];

  // Helper for dynamic fields
  const [newCastMember, setNewCastMember] = useState("");
  const [newTeamMember, setNewTeamMember] = useState({ role: "", name: "" });

  useEffect(() => {
    if (isEditing) {
      fetchArtwork();
    }
  }, [id]);

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
          synopsis: artwork.video?.synopsis || "",
          director: artwork.video?.director || "",
          coAuthor: artwork.video?.coAuthor || "",
          cast: artwork.video?.cast || [],
          productionTeam: artwork.video?.productionTeam || [],
          fullVideoUrl: artwork.video?.fullVideoUrl || artwork.video?.url || "", // Fallback to legacy url
          previewVideoUrl: artwork.video?.previewVideoUrl || "",
          backgroundAudioUrl: artwork.video?.backgroundAudioUrl || "",
          subtitlesUrl: artwork.video?.subtitlesUrl || "",
          quality: artwork.video?.quality || ""
        },
      });
      setExistingImages(artwork.images || []);
    } catch (error) {
      toast.error("Failed to load artwork");
      navigate("/gallery");
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
     setSelectedFiles(files);
  };

  const handleRemoveExistingImage = (index) => {
      setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  // --- Dynamic Field Handlers ---
  const addCastMember = () => {
      if(newCastMember.trim()) {
          setFormData({
              ...formData,
              video: { ...formData.video, cast: [...formData.video.cast, newCastMember.trim()] }
          });
          setNewCastMember("");
      }
  };

  const removeCastMember = (index) => {
      const newCast = [...formData.video.cast];
      newCast.splice(index, 1);
      setFormData({ ...formData, video: { ...formData.video, cast: newCast } });
  };

  const addTeamMember = () => {
      if(newTeamMember.role.trim() && newTeamMember.name.trim()) {
           setFormData({
              ...formData,
              video: { ...formData.video, productionTeam: [...formData.video.productionTeam, { ...newTeamMember }] }
          });
          setNewTeamMember({ role: "", name: "" });
      }
  };

  const removeTeamMember = (index) => {
      const newTeam = [...formData.video.productionTeam];
      newTeam.splice(index, 1);
      setFormData({ ...formData, video: { ...formData.video, productionTeam: newTeam } });
  };

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStats, setUploadStats] = useState({ loaded: 0, total: 0 });
  // --- Dynamic Field Handlers ---
  // --- File Select Handlers ---
  const handleFileSelect = (setter, allowedTypes, maxSizeMB) => (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      // Strict type check
      if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
          toast.error(`Invalid file type. Allowed: ${allowedTypes.join(", ")}`);
          return;
      }
      
      // Size check
      if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File too large. Max ${maxSizeMB}MB`);
          return;
      }
      setter(file);
  };
  // ----------------------------

  const uploadAssets = async (artworkId) => {
      const uploadPromises = [];
      const uploads = [
          { file: selectedFullVideo, field: "fullVideo", isPaid: formData.video.isPaid },
          { file: selectedPreviewVideo, field: "previewVideo", isPaid: false },
          { file: selectedAudio, field: "backgroundAudio", isPaid: false }, 
          { file: selectedSubtitles, field: "subtitles", isPaid: false },
      ];

      // Calculate total size for weighted progress? 
      // For simplicity, we track progress of the largest file (Full Video) mainly, 
      // or we just show "Uploading..." for others.
      // Let's attach progress listener to the Full Video upload specifically if it exists.

      uploads.forEach(({ file, field, isPaid }) => {
          if (file) {
               const fd = new FormData();
               fd.append(field, file); 
               fd.append("isPaid", isPaid);
               
               const onProgress = (field === "fullVideo") ? (progressEvent) => {
                   const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                   setUploadProgress(percentCompleted);
                   setUploadStats({
                       loaded: (progressEvent.loaded / (1024 * 1024)).toFixed(2),
                       total: (progressEvent.total / (1024 * 1024)).toFixed(2)
                   });
               } : undefined;

               uploadPromises.push(artworksAPI.uploadVideo(artworkId, fd, onProgress)); 
          }
      });

      if (selectedFiles.length > 0) {
           const fd = new FormData();
           selectedFiles.forEach((file) => fd.append("images", file));
           uploadPromises.push(artworksAPI.uploadImages(artworkId, fd));
      }

      await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      // Ensure video object is clean
      // Remove URLs from data payload as they are handled by file uploads or read-only
      // But we keep them if we are just updating metadata and not uploading new files.
      
      let artworkId = id;

      if (isEditing) {
        data.images = existingImages;
        // logic for partial updates handled by backend generally
        await artworksAPI.update(id, data);
        toast.success("Artwork updated successfully");
      } else {
        const response = await artworksAPI.create(data);
        artworkId = response.data.data._id;
        toast.success("Artwork created successfully");
      }

      // Handle File Uploads
      if (selectedFullVideo || selectedPreviewVideo || selectedAudio || selectedSubtitles || selectedFiles.length > 0) {
          setIsUploading(true);
          await uploadAssets(artworkId);
          setIsUploading(false);
      }

      navigate("/gallery");
    } catch (error) {
       console.error(error);
       setIsUploading(false);
      const message = error.response?.data?.error || "Failed to save artwork";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => goBackWithScroll("/gallery")}>
                  <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">
                {isEditing ? "Edit Artwork" : "Create New Artwork"}
              </h1>
          </div>

          <div className="flex items-center gap-4">
               {isUploading && (
                   <div className="flex flex-col items-end mr-4">
                       <div className="flex items-center gap-2">
                           <span className="text-sm font-medium text-muted-foreground">{uploadProgress}%</span>
                           <div className="h-2 w-24 bg-secondary rounded-full overflow-hidden">
                               <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                           </div>
                       </div>
                       <span className="text-xs text-muted-foreground mt-1">
                           {uploadStats.loaded}MB / {uploadStats.total}MB
                       </span>
                   </div>
               )}
               <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
                  {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Update Artwork" : "Publish Artwork"}
              </Button>
          </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* BASIC INFO */}
        <Card>
            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(val) => handleSelectChange("category", val)}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <div className="min-h-[200px] border rounded-md">
                        <MarkdownEditor value={formData.description} onChange={(value) => setFormData({ ...formData, description: value })} />
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* MEDIA GALLERY (Images) */}
        <Card>
            <CardHeader>
                <CardTitle>Image Gallery</CardTitle>
                <CardDescription>Upload cover images or stills (Max 5)</CardDescription>
            </CardHeader>
            <CardContent>
                <ImageUpload
                    existingImages={existingImages}
                    onFileSelect={handleImagesSelect}
                    onRemoveExisting={handleRemoveExistingImage}
                    maxFiles={5}
                    multiple={true}
                />
            </CardContent>
        </Card>

        {/* VIDEO SPECIFIC SECTION */}
        {isVideoCategory && (
            <div className="space-y-6">
                 {/* Video Metadata */}
                 <Card className="border-primary/20">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clapperboard className="h-5 w-5 text-primary" />
                            <CardTitle>Video Metadata</CardTitle>
                        </div>
                        <CardDescription>Rich details for the video detail page</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Synopsis</Label>
                            <Textarea 
                                name="video.synopsis" 
                                value={formData.video.synopsis} 
                                onChange={handleChange} 
                                placeholder="A brief summary of the film..."
                                className="resize-none h-24"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Director</Label>
                                <Input name="video.director" value={formData.video.director} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <Label>Co-Author</Label>
                                <Input name="video.coAuthor" value={formData.video.coAuthor} onChange={handleChange} />
                            </div>
                        </div>
                        
                        {/* Cast Management */}
                        <div className="space-y-2">
                            <Label>Cast</Label>
                            <div className="flex gap-2">
                                <Input 
                                    value={newCastMember} 
                                    onChange={(e) => setNewCastMember(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCastMember())}
                                    placeholder="Actor Name" 
                                />
                                <Button type="button" size="icon" onClick={addCastMember}><Plus className="h-4 w-4" /></Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.video.cast.map((actor, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                                        {actor}
                                        <Trash2 className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeCastMember(i)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* Team Management */}
                         <div className="space-y-2">
                            <Label>Production Team</Label>
                             <div className="flex gap-2">
                                <Input 
                                    value={newTeamMember.role} 
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })} 
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                                    placeholder="Role (e.g. Sound)" 
                                    className="w-1/3"
                                />
                                <Input 
                                    value={newTeamMember.name} 
                                    onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })} 
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                                    placeholder="Name" 
                                />
                                <Button type="button" size="icon" onClick={addTeamMember}><Plus className="h-4 w-4" /></Button>
                            </div>
                             <div className="space-y-1 mt-2">
                                {formData.video.productionTeam.map((member, i) => (
                                    <div key={i} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md text-sm">
                                        <span><span className="font-semibold">{member.role}:</span> {member.name}</span>
                                        <Trash2 className="h-4 w-4 cursor-pointer hover:text-destructive" onClick={() => removeTeamMember(i)} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                 </Card>

                 {/* Video Assets Upload */}
                 <Card className="border-primary/20">
                    <CardHeader>
                         <div className="flex items-center gap-2">
                            <Upload className="h-5 w-5 text-primary" />
                            <CardTitle>Video Assets</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        
                        {/* Full Video */}
                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                Full Video (Private/Paid)
                                {formData.video.fullVideoUrl && <span className="text-xs text-green-500 font-medium">Currently Uploaded</span>}
                            </Label>
                            <div className="rounded-md border border-input p-4 bg-background hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            id="fullVideo" 
                                            type="file" 
                                            className="hidden" 
                                            accept="video/mp4,video/webm,video/quicktime" 
                                            onChange={handleFileSelect(setSelectedFullVideo, ["video/mp4", "video/webm", "video/quicktime"], 2048)} 
                                        />
                                        <Label htmlFor="fullVideo" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                            <Upload className="mr-2 h-4 w-4" /> Choose File
                                        </Label>
                                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                            {selectedFullVideo ? selectedFullVideo.name : "No file selected"}
                                        </span>
                                    </div>
                                    {selectedFullVideo && (
                                        <div className="mt-2 w-full max-w-sm rounded overflow-hidden bg-black aspect-video">
                                            <video src={URL.createObjectURL(selectedFullVideo)} controls className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="paid" checked={formData.video.isPaid} onCheckedChange={(c) => handleSelectChange("video.isPaid", c)} />
                                        <Label htmlFor="paid" className="cursor-pointer text-sm">Premium Content (Paid)</Label>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Main content file. Max 500MB.</p>
                        </div>

                         {/* Preview Video */}
                         <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                Preview Clip (Public)
                                {formData.video.previewVideoUrl && <span className="text-xs text-green-500 font-medium">Currently Uploaded</span>}
                            </Label>
                             <div className="rounded-md border border-input p-4 bg-background hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            id="previewVideo" 
                                            type="file" 
                                            className="hidden" 
                                            accept="video/mp4,video/webm" 
                                            onChange={handleFileSelect(setSelectedPreviewVideo, ["video/mp4", "video/webm"], 50)} 
                                        />
                                        <Label htmlFor="previewVideo" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                            <Upload className="mr-2 h-4 w-4" /> Choose Clip
                                        </Label>
                                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                            {selectedPreviewVideo ? selectedPreviewVideo.name : "No file selected"}
                                        </span>
                                    </div>
                                    {selectedPreviewVideo && (
                                        <div className="mt-2 w-full max-w-sm rounded overflow-hidden bg-black aspect-video">
                                            <video src={URL.createObjectURL(selectedPreviewVideo)} controls className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">Short teaser (30-60s) for public viewing.</p>
                        </div>

                        {/* Background Audio */}
                        <div className="space-y-2">
                             <Label className="flex items-center justify-between">
                                Background Audio (Public Ambience)
                                {formData.video.backgroundAudioUrl && <span className="text-xs text-green-500 font-medium">Currently Uploaded</span>}
                            </Label>
                            <div className="rounded-md border border-input p-4 bg-background hover:bg-muted/20 transition-colors">
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-4">
                                        <Input 
                                            id="bgAudio" 
                                            type="file" 
                                            className="hidden" 
                                            accept="audio/mpeg,audio/aac,audio/wav" 
                                            onChange={handleFileSelect(setSelectedAudio, ["audio/mpeg", "audio/aac", "audio/wav", "audio/mp3"], 20)} 
                                        />
                                        <Label htmlFor="bgAudio" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                            <Music className="mr-2 h-4 w-4" /> Choose Audio
                                        </Label>
                                        <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                            {selectedAudio ? selectedAudio.name : "No file selected"}
                                        </span>
                                    </div>
                                    {selectedAudio && (
                                        <div className="mt-2">
                                             <audio src={URL.createObjectURL(selectedAudio)} controls className="w-full h-8" />
                                        </div>
                                    )}
                                </div>
                            </div>
                             <p className="text-xs text-muted-foreground">MP3/AAC played in background on detail page.</p>
                        </div>

                         {/* Subtitles */}
                         <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                Subtitles (VTT/SRT)
                                {formData.video.subtitlesUrl && <span className="text-xs text-green-500 font-medium">Currently Uploaded</span>}
                            </Label>
                            <div className="rounded-md border border-input p-4 bg-background hover:bg-muted/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Input 
                                        id="subtitles" 
                                        type="file" 
                                        className="hidden" 
                                        accept=".vtt,.srt" 
                                        onChange={handleFileSelect(setSelectedSubtitles, [], 5)} 
                                    />
                                    <Label htmlFor="subtitles" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2">
                                        <FileText className="mr-2 h-4 w-4" /> Choose Subtitles
                                    </Label>
                                    <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                                        {selectedSubtitles ? selectedSubtitles.name : "No file selected"}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </CardContent>
                 </Card>
            </div>
        )}

        {/* PRICING & INVENTORY (Kept simplified below) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle>Pricing</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (€) *</Label>
                        <Input id="price" name="price" type="number" value={formData.price} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="originalPrice">Original Price (€)</Label>
                        <Input id="originalPrice" name="originalPrice" type="number" value={formData.originalPrice} onChange={handleChange} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <Checkbox id="sale" checked={formData.isForSale} onCheckedChange={(c) => handleSelectChange("isForSale", c)} />
                        <Label htmlFor="sale">For Sale</Label>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="totalInStock">Stock *</Label>
                        <Input id="totalInStock" name="totalInStock" type="number" value={formData.totalInStock} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="materialsUsed">{isVideoCategory ? "Tools Used" : "Materials"}</Label>
                        <Input 
                            id="materialsUsed" 
                            name="materialsUsed" 
                            value={formData.materialsUsed} 
                            onChange={handleChange} 
                            placeholder={isVideoCategory ? "e.g. Sony A7S III, Premiere Pro, DaVinci Resolve" : "e.g. Oil, Canvas, Digital"} 
                        />
                    </div>
                    
                    {/* Dimension / Quality Logic */}
                    {isVideoCategory ? (
                         <div className="space-y-2">
                             <Label htmlFor="quality">Registered Quality (Resolution)</Label>
                             <Select 
                                value={formData.video.quality} 
                                onValueChange={(val) => handleSelectChange("video.quality", val)}
                             >
                                <SelectTrigger><SelectValue placeholder="Select Quality" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="8K">8K Ultra HD</SelectItem>
                                    <SelectItem value="4K">4K UHD</SelectItem>
                                    <SelectItem value="2K">2K QHD</SelectItem>
                                    <SelectItem value="1080p">1080p Full HD</SelectItem>
                                    <SelectItem value="720p">720p HD</SelectItem>
                                    <SelectItem value="High Quality">High Quality Audio</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                    ) : (
                         <div className="flex gap-4">
                             <div className="space-y-2 flex-1">
                                 <Label htmlFor="width">Width ({formData.dimensions.unit}) *</Label>
                                 <Input id="width" placeholder="Width" name="dimensions.width" value={formData.dimensions.width} onChange={handleChange} required />
                             </div>
                             <div className="space-y-2 flex-1">
                                 <Label htmlFor="height">Height ({formData.dimensions.unit}) *</Label>
                                 <Input id="height" placeholder="Height" name="dimensions.height" value={formData.dimensions.height} onChange={handleChange} required />
                             </div>
                             <div className="space-y-2 w-24">
                                <Label htmlFor="unit">Unit</Label>
                                <Select 
                                    value={formData.dimensions.unit} 
                                    onValueChange={(val) => handleSelectChange("dimensions.unit", val)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cm">cm</SelectItem>
                                        <SelectItem value="in">in</SelectItem>
                                        <SelectItem value="m">m</SelectItem>
                                    </SelectContent>
                                </Select>
                             </div>
                         </div>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="flex justify-end gap-4 pb-12">
            <Button type="button" variant="outline" onClick={() => goBackWithScroll("/gallery")}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || isUploading}>
                {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Artwork" : "Publish Artwork"}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default ArtworkFormPage;
