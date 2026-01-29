import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Volume2, VolumeX, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
// Import API to fetch dynamic config
import { platformAPI } from "../../services/api";

const VideoHero = ({ compact = false }) => {
  const audioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const [heroConfig, setHeroConfig] = useState({
      videoUrl: "",
      text: "",
      textSize: "12vw",
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

  // Ensure fallback
  const videoSource = heroConfig.videoUrl; 
  const heroText = heroConfig.text || "VIDEO ARTWORKS by NEMESIS ART";
  const backgroundSoundUrl = heroConfig.backgroundSoundUrl;

  return (
    <div className={`relative w-full bg-black ${compact ? "h-full" : "h-[150vh]"}`}>
      {/* Sticky Container for the video effect */}
      <div className={`${compact ? "absolute inset-0 h-full" : "sticky top-0 h-screen"} w-full overflow-hidden flex items-center justify-center`}>
        
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
             <div className="absolute inset-0 bg-black/40 z-10" /> {/* Dimming Overlay */}
             <video
                className="w-full h-full object-cover"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                src={videoSource}
             />
        </div>

        {/* Text Overlay */}
        <div className="relative z-20 px-8 max-w-[90vw]">
             <h1 
                className="font-black uppercase text-center leading-none tracking-tighter text-white/60 mix-blend-overlay drop-shadow-xl"
                style={{ fontSize: heroConfig.textSize || "12vw" }}
             >
                 {heroText}
             </h1>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex items-center justify-between px-8 sm:px-12 pointer-events-auto">
          <motion.div style={{ opacity }} className="animate-bounce">
              <ArrowDown className="h-6 w-6 text-white/70" />
          </motion.div>

          {/* Optional: Background Audio Player */}
           {backgroundSoundUrl && (
             <audio ref={audioRef} src={backgroundSoundUrl} loop autoPlay />
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
