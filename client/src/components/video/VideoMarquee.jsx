import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { artworksAPI } from "../../services/api";
import { Loader2 } from "lucide-react";

const VideoMarquee = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await artworksAPI.getAll({ category: "video" });
      setVideos(response.data.data);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
        <div className="h-full flex items-center justify-center bg-black text-muted-foreground">
            No features videos available.
        </div>
    );
  }

  // Duplicate list to ensure seamless loop if not enough items or just for standard marquee
  const marqueeVideos = [...videos, ...videos, ...videos]; 

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col justify-center">
      <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <h3 className="text-sm font-medium tracking-widest uppercase text-white/50">Featured Selection</h3>
      </div>

      <div 
        className="flex w-full group/marquee" 
        style={{ overflow: 'hidden' }}
      >
        <div 
            className="flex gap-6 px-6 animate-marquee group-hover/marquee:[animation-play-state:paused] active:[animation-play-state:paused]"
            style={{ width: "max-content" }}
        >
            {marqueeVideos.map((video, index) => (
                <div
                    key={`${video._id}-${index}`}
                    className="relative group shrink-0 h-[25vh] aspect-[16/9] cursor-pointer overflow-hidden rounded-lg border border-white/10"
                    onClick={() => navigate(`/videos/${video._id}`)}
                >
                    {/* Default: Image Thumbnail */}
                    <img
                        src={video.images?.[0] || video.video?.thumbnailUrl || "/placeholder-video.jpg"}
                        alt={video.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* Hover: Video Preview */}
                    <video
                        src={video.video?.previewVideoUrl || video.video?.fullVideoUrl || video.video?.url}
                        className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        muted
                        loop
                        playsInline
                        // Play on hover
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => {
                            e.target.pause();
                            e.target.currentTime = 0;
                        }}
                    />
                    
                     {/* Title Overlay (Persistent) */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 pt-8">
                        <h4 className="text-white font-bold text-sm truncate">{video.title}</h4>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-white/70 text-xs truncate">
                                {video.artist?.firstName} {video.artist?.lastName}
                            </p>
                            {video.video?.duration && (
                                <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                                    {Math.floor(video.video.duration / 60)}:{(video.video.duration % 60).toString().padStart(2, '0')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Play Icon */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play className="fill-white text-white h-8 w-8 drop-shadow-lg" />
                     </div>
                </div>
            ))}
        </div>
      </div>
      
      {/* Styles for marquee animation manually injecting style tag since tailwind config might be missing 'animate-marquee' */}
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        .animate-marquee {
            animation: marquee 150s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoMarquee;
