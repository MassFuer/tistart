import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { videosAPI, artworksAPI } from "../../services/api";
import { toast } from "sonner";
import { 
  Lock, 
  Play, 
  Pause,
  Film, 
  AlertCircle,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Loader2,
  Clapperboard
} from "lucide-react";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const VideoPlayer = ({ artwork, onPurchaseComplete, onPlay: onPlayCallback, onPause: onPauseCallback }) => {
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const [accessInfo, setAccessInfo] = useState(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  const video = artwork?.video;

  // Normalize URL: Support both 'url' and 'fullVideoUrl'
  const videoUrl = video?.url || video?.fullVideoUrl;

  const isOwner = user?._id === artwork?.artist?._id;
  const isPaid = video?.isPaid;

  useEffect(() => {
    if (videoUrl) {
      checkAccess();
    } else {
      setIsLoading(false);
    }
  }, [artwork?._id, isAuthenticated, videoUrl]);

  const checkAccess = async () => {

    const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin';

    if (isOwner || isAdmin) {
      setAccessInfo({ hasAccess: true, isOwner: true });
      await fetchStreamUrl();
      setIsLoading(false);
      return;
    }

    // REQUIRE LOGIN FOR ALL USERS (Even for free videos)
    if (!isAuthenticated) {
      setAccessInfo({ hasAccess: false, requiresLogin: true });
      setIsLoading(false);
      return;
    }

    if (!isPaid) {
      setAccessInfo({ hasAccess: true });
      await fetchStreamUrl();
      setIsLoading(false);
      return;
    }

    try {
      const response = await videosAPI.checkAccess(artwork._id);
      setAccessInfo(response.data.data);
      if (response.data.data.hasAccess) {
        await fetchStreamUrl();
      }
    } catch (err) {
      console.error("Access check failed:", err);
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

  const handleBuyClick = async () => {
      setIsPurchasing(true);
      try {
        await addToCart(artwork._id, 1);
        toast.success("Video added to cart!");
        navigate("/checkout");
      } catch (err) {
        const message = err.response?.data?.error || "Failed to add to cart";
        toast.error(message);
      } finally {
        setIsPurchasing(false);
      }
  };

  // --- Player Controls ---

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        onPauseCallback?.();
      } else {
        videoRef.current.play();
        onPlayCallback?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else {
        setVolume(1);
        videoRef.current.volume = 1;
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const skipRequest = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Auto-hide controls
  let controlsTimeout;
  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
        if (isPlaying) setShowControls(false);
    }, 2500);
  };

  if (!videoUrl) {
    return null;
  }

  // Loading
  if (isLoading) {
    return (
      <div className="w-full aspect-video bg-muted flex flex-col items-center justify-center rounded-xl animate-pulse">
        <Film className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">Loading video...</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="w-full aspect-video bg-destructive/10 flex flex-col items-center justify-center rounded-xl p-6 text-center">
        <AlertCircle className="h-10 w-10 text-destructive mb-4" />
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button variant="outline" onClick={checkAccess}>Try Again</Button>
      </div>
    );
  }

  // HAS ACCESS - RENDER PLAYER
  if (accessInfo?.hasAccess) {
    const videoSrc = streamUrl || videoUrl;
    
    return (
      <div className="w-full space-y-2">
        <div 
            ref={containerRef}
            className="group relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm border"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            poster={video.thumbnailUrl || artwork.images?.[0]}
            onContextMenu={(e) => e.preventDefault()}
            controlsList="nodownload"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
                setIsPlaying(false);
                onPauseCallback?.();
            }}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onPlay={() => {
                setIsPlaying(true);
                onPlayCallback?.();
                
                // Track View
                if (!hasViewed && artwork?._id) {
                    artworksAPI.incrementView(artwork._id).catch(err => console.error("Failed to track view", err));
                    setHasViewed(true);
                }
            }}
            onPause={() => {
                setIsPlaying(false);
                onPauseCallback?.();
            }}
            onClick={togglePlay}
          />

          {/* Buffering Indicator */}
          {isBuffering && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                <Loader2 className="h-10 w-10 animate-spin text-white" />
             </div>
          )}

          {/* Big Play Button (Center) */}
          {!isPlaying && !isBuffering && (
             <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/10 hover:bg-black/20 transition-colors"
                onClick={togglePlay}
             >
                <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm transition-transform transform group-hover:scale-110">
                   <Play className="h-8 w-8 text-white fill-white ml-1" />
                </div>
             </div>
          )}

          {/* Controls Overlay */}
          <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 py-4 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
             
             {/* Progress Bar */}
             <div className="mb-4 flex items-center gap-3">
                 <span className="text-xs text-white font-mono w-10 text-right">{formatTime(currentTime)}</span>
                 <Slider 
                    value={[currentTime]} 
                    max={duration || 100} 
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                 />
                 <span className="text-xs text-white font-mono w-10">{formatTime(duration)}</span>
             </div>

             {/* Buttons Row */}
             <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                     <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
                     </button>
                     
                     <div className="flex items-center gap-2">
                        <button onClick={() => skipRequest(-10)} className="text-white/80 hover:text-white" title="-10s">
                            <RotateCcw className="h-4 w-4" />
                        </button>
                         <button onClick={() => skipRequest(10)} className="text-white/80 hover:text-white" title="+10s">
                            <RotateCw className="h-4 w-4" />
                        </button>
                     </div>

                     {/* Volume */}
                     <div className="flex items-center gap-2 group/vol">
                         <button onClick={toggleMute} className="text-white hover:text-primary">
                            {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                         </button>
                         <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                             <Slider 
                                value={[isMuted ? 0 : volume]} 
                                max={1} 
                                step={0.01}
                                onValueChange={handleVolumeChange}
                                className="w-20"
                             />
                         </div>
                     </div>
                 </div>

                 {/* Right Side */}
                 <div className="flex items-center gap-3">
                     {accessInfo?.purchasedAt && (
                        <Badge variant="outline" className="text-white border-white/30 bg-white/10 text-[10px] h-5">
                            Purchased
                        </Badge>
                     )}
                     <button onClick={toggleFullscreen} className="text-white hover:text-primary">
                        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                     </button>
                 </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // If preview is playing, render the player with preview URL content
  if (isPlayingPreview && video?.previewVideoUrl) {
      return (
          <div className="w-full space-y-2">
            <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-sm border">
                <video
                    src={video.previewVideoUrl}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                    onEnded={() => setIsPlayingPreview(false)}
                />
                <button 
                    onClick={() => setIsPlayingPreview(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-sm transition-colors"
                >
                    <Minimize className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 right-4">
                     <Button size="sm" onClick={() => setIsPlayingPreview(false)}>
                        Unlock Full Video
                     </Button>
                </div>
            </div>
          </div>
      );
  }

  // PAYWALL (Login or Buy)
  return (
    <div className="w-full">
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden group">
        {/* Background Preview */}
        <div 
            className="absolute inset-0 bg-cover bg-center blur-sm opacity-50 scale-105"
            style={{ backgroundImage: `url(${video.thumbnailUrl || artwork.images?.[0]})` }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white z-10">
            <div className="bg-background/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl max-w-sm w-full mx-auto">
                <Lock className="h-12 w-12 mx-auto mb-4 text-white/80" />
                <h3 className="text-2xl font-bold mb-2">Premium Content</h3>
                
                {accessInfo?.requiresLogin ? (
                    <>
                        <p className="text-white/80 mb-6">Log in to watch or purchase this video.</p>
                        <div className="flex flex-col gap-3 w-full">
                            {video?.previewVideoUrl && (
                                <Button onClick={() => setIsPlayingPreview(true)} variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                                    <Clapperboard className="mr-2 h-4 w-4" /> Watch Preview
                                </Button>
                            )}
                            <Button onClick={() => navigate("/login")} className="w-full font-semibold" size="lg">
                                Log In to Watch
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mb-6">
                            <p className="text-3xl font-bold text-primary-foreground mb-1">
                                {Number(artwork.price).toFixed(2)} €
                            </p>
                            <p className="text-sm text-white/70">One-time purchase • Unlimited streaming</p>
                        </div>
                        
                        <div className="flex flex-col gap-3 w-full">
                             {video?.previewVideoUrl && (
                                <Button onClick={() => setIsPlayingPreview(true)} variant="secondary" className="w-full bg-white/20 hover:bg-white/30 text-white border-0">
                                    <Clapperboard className="mr-2 h-4 w-4" /> Watch Preview
                                </Button>
                            )}

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button size="lg" className="w-full font-semibold box-shadow-xl">
                                        Unlock Now
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Purchase</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to add <strong>{artwork.title}</strong> to your cart for <strong>{Number(artwork.price).toFixed(2)} €</strong>.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBuyClick} disabled={isPurchasing}>
                                            {isPurchasing ? "Processing..." : "Continue to Checkout"}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
