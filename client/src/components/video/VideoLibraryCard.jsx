import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Pause, Volume2, VolumeX, Maximize, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const VideoLibraryCard = ({ video, className, compact = false }) => {
    const videoRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const isPaid = video.video?.isPaid;
    // Secure Logic: Only allows fallback to full URL if video is FREE. Paid videos must have a preview to play on hover.
    const videoSrc = video.video?.previewVideoUrl || (!isPaid ? video.video?.url : null);
    
    const imageSrc = video.images?.[0] || video.video?.thumbnailUrl || "/placeholder-video.jpg";
    const synopsis = video.description || "No synopsis available for this title.";
    
    // Safety check for duration
    const duration = video.video?.duration;

    const handleMouseEnter = () => {
        setIsHovering(true);
        if (videoRef.current) {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.log("Autoplay prevented:", error);
                    setIsPlaying(false);
                });
            }
        }
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
        if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const togglePlay = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const toggleMute = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const handleFullscreen = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            } else if (videoRef.current.webkitRequestFullscreen) { /* Safari */
                videoRef.current.webkitRequestFullscreen();
            }
        }
    };

    return (
        <div 
            className={cn(
                "group flex flex-col bg-card/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5", 
                className
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
             {/* Media Area */}
             <Link to={`/videos/${video._id}`} className="relative aspect-video bg-black overflow-hidden block">
                  {/* Thumbnail Image */}
                  <img 
                    src={imageSrc} 
                    alt={video.title}
                    className={cn(
                        "absolute inset-0 w-full h-full object-cover transition-opacity duration-300", 
                        isHovering ? "opacity-0" : "opacity-100"
                    )} 
                  />
                  
                  {/* Video Player */}
                  <video 
                     ref={videoRef}
                     src={videoSrc}
                     className={cn(
                        "absolute inset-0 w-full h-full object-contain bg-black transition-opacity duration-300", 
                        isHovering ? "opacity-100" : "opacity-0"
                     )}
                     muted={isMuted}
                     loop
                     playsInline
                     onContextMenu={(e) => e.preventDefault()}
                  />

                  {/* Top Badges */}
                   <div className="absolute top-3 right-3 z-20 flex gap-2">
                      {video.video?.quality && (
                          <Badge variant="outline" className="bg-black/60 backdrop-blur border-white/20 text-[10px] text-white uppercase px-1.5 py-0.5">
                              {video.video.quality}
                          </Badge>
                      )}
                      {duration && (
                        <Badge variant="outline" className="bg-black/60 backdrop-blur border-white/20 text-[10px] text-white px-1.5 py-0.5">
                            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                        </Badge>
                      )}
                   </div>
                  
                  {/* Hover Controls Overlay */}
                  <div 
                      className={cn(
                          "absolute inset-0 z-10 flex flex-col justify-end p-3 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300", 
                          isHovering ? "opacity-100" : "opacity-0"
                      )}
                  >
                      {/* Mini Control Bar */}
                      <div className="flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75" onClick={(e) => e.preventDefault()}>
                          <div className="flex items-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={togglePlay}>
                                  {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={toggleMute}>
                                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                              </Button>
                          </div>
                          
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={handleFullscreen}>
                              <Maximize className="h-4 w-4" />
                          </Button>
                      </div>
                  </div>
                  {/* Compact Mode Overlay */}
                  {compact && (
                      <div className={cn(
                          "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none transition-opacity duration-300",
                          isHovering ? "opacity-0" : "opacity-100"
                      )}>
                          <h3 className="font-bold text-white text-sm truncate shadow-sm">{video.title}</h3>
                          <p className="text-xs text-white/70 truncate">{video.artist?.firstName} {video.artist?.lastName}</p>
                      </div>
                  )}
             </Link>

             {/* Footer Info */}
             {!compact && (
             <div className="p-4 flex flex-col gap-3 flex-grow bg-card/5 backdrop-blur-sm">
                 <div className="flex justify-between items-start gap-4">
                     <div className="min-w-0">
                         <h3 className="font-bold text-white text-base leading-tight truncate" title={video.title}>
                            <Link to={`/videos/${video._id}`} className="hover:text-primary transition-colors">
                                {video.title}
                            </Link>
                         </h3>
                         <p className="text-xs text-neutral-400 mt-1 truncate">
                             {video.artist?.firstName} {video.artist?.lastName}
                         </p>
                     </div>
                     <div className="text-right whitespace-nowrap">
                         <span className="font-bold text-white text-sm block">
                            {video.price && video.price > 0 ? `${video.price.toFixed(2)}€` : "Free"}
                         </span>
                     </div>
                 </div>
                 
                 {/* Expandable Synopsis */}
                 <div className="text-xs text-neutral-400 relative border-t border-white/5 pt-2 mt-auto">
                     <p 
                        className={cn(
                            "leading-relaxed transition-all duration-300", 
                            !isExpanded && "line-clamp-2"
                        )}
                     >
                         {synopsis}
                     </p>
                     
                     {synopsis.length > 80 && (
                         <button 
                             onClick={() => setIsExpanded(!isExpanded)} 
                             className="text-[10px] uppercase font-bold text-primary hover:text-primary/80 mt-1 flex items-center gap-1"
                         >
                             {isExpanded ? (
                                 <>Show Less <Expand className="w-3 h-3 rotate-180" /></> 
                             ) : (
                                 <>Read More <Expand className="w-3 h-3" /></>
                             )}
                         </button>
                     )}
                 </div>
             </div>
             )}
        </div>
    );
};

export default VideoLibraryCard;
