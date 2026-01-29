import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoHero from "../components/video/VideoHero";
import VideoMarquee from "../components/video/VideoMarquee";

const VideoPage = () => {
    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
            {/* Top Section - Hero (60%) */}
            <div className="h-[60vh] w-full relative z-10 shrink-0 border-b border-white/10">
                <VideoHero compact={true} />
            </div>
            
            {/* Bottom Section - Marquee + Action (40%) */}
            <div className="h-[40vh] w-full bg-black relative z-20 flex flex-col">
                <div className="flex-1 w-full overflow-hidden">
                    <VideoMarquee />
                </div>
                
                <div className="h-16 shrink-0 flex items-center justify-center border-t border-white/10 bg-black/50 backdrop-blur-sm">
                    <Button asChild variant="ghost" className="text-white hover:bg-white/10 gap-2 group">
                        <Link to="/video-library">
                            View All Video Content
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VideoPage;
