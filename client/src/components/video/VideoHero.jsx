import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Volume2, VolumeX, ArrowDown, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TextReveal } from "@/components/ui/text-reveal";

const VideoHero = ({ compact = false }) => {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  // Handle mute toggle
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`relative w-full bg-black ${compact ? "h-full" : "h-[150vh]"}`}>
      {/* Sticky Container for the video effect */}
      <div className={`${compact ? "absolute inset-0 h-full" : "sticky top-0 h-screen"} w-full overflow-hidden`}>
        
        {/* Background Video Layer */}
        <div className="absolute inset-0 h-full w-full">
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              src="/videos/sequence_index_portrait.mp4" 
            />
             {/* Dark overlay for contrast if needed, but we want video text effect */}
            <div className="absolute inset-0 bg-black/30" />
        </div>

        {/* Video Text Effect Layer (Mix Blend Mode) */}
        {/* This creates the effect where text 'cuts out' the background or interacts with it */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 mix-blend-overlay">
             <TextReveal className="text-white font-black text-[12vw] leading-none tracking-tighter">
              VIDEO ARTWORKS
             </TextReveal>
        </div>
        
        {/* Alternative Standard Text Layer for readability if mix-blend is too subtle */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
             <motion.h1 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-white/90 font-black text-[10vw] leading-none tracking-tighter text-center mix-blend-overlay"
             >
                VIDEO ARTWORKS
             </motion.h1>
             <p className="mt-8 text-xl text-white/80 font-light tracking-widest uppercase">
                 Immersive • Digital • Experience
             </p>
        </div>

        {/* Controls */}
        <div className="absolute bottom-10 left-0 right-0 z-30 flex items-center justify-between px-8 sm:px-12 pointer-events-auto">
          <motion.div style={{ opacity }} className="animate-bounce">
              <ArrowDown className="h-6 w-6 text-white/70" />
          </motion.div>

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
      
      {/* Scroll spacer to allow TextReveal to work if it relies on scrolling */}
    </div>
  );
};

export default VideoHero;
