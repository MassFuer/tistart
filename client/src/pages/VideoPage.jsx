import VideoHero from "../components/video/VideoHero";
import VideoMarquee from "../components/video/VideoMarquee";

const VideoPage = () => {
    return (
        <div className="h-screen w-full bg-black flex flex-col overflow-hidden">
            {/* Top Section - Hero (60%) */}
            <div className="h-[60vh] w-full relative z-10 shrink-0 border-b border-white/10">
                <VideoHero compact={true} />
            </div>
            
            {/* Bottom Section - Marquee (40%) */}
            <div className="h-[40vh] w-full bg-black relative z-20">
                <VideoMarquee />
            </div>
        </div>
    );
};

export default VideoPage;
