import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Volume2, VolumeX, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoText } from "@/components/ui/video-text";
// Import API to fetch dynamic config
import { platformAPI } from "../../services/api";

const VideoHero = ({ compact = false }) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [heroConfig, setHeroConfig] = useState({
      videoUrl: "",
      text: "",
      backgroundSoundUrl: ""
  });

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const response = await platformAPI.getConfig();
            if (response.data.data.hero) {
                setHeroConfig(response.data.data.hero);
            }
        } catch (error) {
            console.error("Failed to load hero config", error);
        }
    };
    fetchConfig();
  }, []);

  // Handle mute toggle
  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    
    // Handle background audio sync
    if (audioRef.current) {
        if (newState) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.log("Audio play failed", e));
        }
    }
  };

  // Ensure fallback is a valid video format, not a GIF
  const videoSource = heroConfig.videoUrl || "/videos/sequence_index_portrait.mp4"; 
  const heroText = heroConfig.text || "VIDEO ARTWORKS by NEMESIS ART";

  return (
    <div className={`relative w-full bg-black ${compact ? "h-full" : "h-[150vh]"}`}>
      {/* Sticky Container for the video effect */}
      <div className={`${compact ? "absolute inset-0 h-full" : "sticky top-0 h-screen"} w-full overflow-hidden flex items-center justify-center`}>
        
        {/* Magic UI Video Text */}
        <VideoText
          src={videoSource}
          muted={isMuted}
          className="text-[8vw] md:text-[6vw] font-black uppercase text-center leading-none tracking-tighter"
        >
          {heroText}
        </VideoText>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex items-center justify-between px-8 sm:px-12 pointer-events-auto">
          <motion.div style={{ opacity }} className="animate-bounce">
              <ArrowDown className="h-6 w-6 text-white/70" />
          </motion.div>

          {/* Optional: Background Audio Player */}
           {heroConfig.backgroundSoundUrl && (
             <audio ref={audioRef} src={heroConfig.backgroundSoundUrl} loop />
           )}

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      
      {/* Scroll spacer */}
    </div>
  );
};

export default VideoHero;
