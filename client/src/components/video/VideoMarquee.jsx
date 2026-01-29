import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { artworksAPI } from "../../services/api";
import { Loader2 } from "lucide-react";
import VideoLibraryCard from "./VideoLibraryCard";

const VideoMarquee = () => {
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
                <VideoLibraryCard 
                    key={`${video._id}-${index}`} 
                    video={video} 
                    className="h-[25vh] shrink-0"
                />
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
