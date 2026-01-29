import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoHero from "../components/video/VideoHero";
import VideoMarquee from "../components/video/VideoMarquee";
import { useTheme } from "../context/ThemeContext";
import { useEffect } from "react";

const VideoPage = () => {
    const { setDarkMode } = useTheme();

    useEffect(() => {
        setDarkMode(true);
    }, [setDarkMode]);

    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
            {/* Top Section - Hero (50%) */}
            <div className="h-[50vh] w-full relative z-10 shrink-0 border-b border-white/10">
                <VideoHero compact={true} />
            </div>
            
            {/* Bottom Section - Marquee + Action (50%) */}
            <div className="h-[50vh] w-full bg-black relative z-20 flex flex-col">
                <div className="flex-1 w-full overflow-hidden">
                    <VideoMarquee />
                </div>
            </div>
        </div>
    );
};

export default VideoPage;
