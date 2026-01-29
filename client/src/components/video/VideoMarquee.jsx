import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { artworksAPI } from "../../services/api";
import { Loader2 } from "lucide-react";
import VideoLibraryCard from "./VideoLibraryCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Popcorn } from "lucide-react";

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
      <div className="absolute top-4 left-6 z-10 flex items-center gap-4">
          <Link to="/video-library" className="flex items-center gap-2 group/label">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <h3 className="text-sm font-medium tracking-widest uppercase text-white/50 group-hover/label:text-white transition-colors">Featured Selection</h3>
          </Link>
          
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-gray-500 hover:text-white gap-2 group border border-white/10 bg-white/5">
              <Link to="/video-library">
                  Go to library <Popcorn /> 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
          </Button>
      </div>

      <div 
        className="flex flex-col gap-4 w-full group/marquee" 
        style={{ overflow: 'hidden' }}
      >
        {/* Row 1: Standard Marquee */}
        <div 
            className="flex gap-6 px-6 animate-marquee group-hover/marquee:[animation-play-state:paused] active:[animation-play-state:paused]"
            style={{ width: "max-content" }}
        >
            {marqueeVideos.map((video, index) => (
                <VideoLibraryCard 
                    key={`r1-${video._id}-${index}`} 
                    video={video} 
                    className="h-[18vh] w-[32vh] shrink-0"
                    compact={true}
                />
            ))}
        </div>

        {/* Row 2: Reverse Marquee */}
        <div 
            className="flex gap-6 px-6 animate-marquee-reverse group-hover/marquee:[animation-play-state:paused] active:[animation-play-state:paused]"
            style={{ width: "max-content" }}
        >
            {marqueeVideos.map((video, index) => (
                <VideoLibraryCard 
                    key={`r2-${video._id}-${index}`} 
                    video={video} 
                    className="h-[18vh] w-[32vh] shrink-0"
                    compact={true}
                />
            ))}
        </div>
      </div>
      
      {/* Styles for marquee animation */}
      <style>{`
        @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
        }
        @keyframes marquee-reverse {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
        }
        .animate-marquee {
            animation: marquee 150s linear infinite;
        }
        .animate-marquee-reverse {
            animation: marquee-reverse 150s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default VideoMarquee;
