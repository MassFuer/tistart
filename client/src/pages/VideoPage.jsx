import VideoHero from "../components/video/VideoHero";
import VideoGallery from "../components/video/VideoGallery";
import { useScroll } from "framer-motion";

const VideoPage = () => {
    // Optional: Smooth scroll or other page-level effects could go here
    return (
        <div className="min-h-screen bg-black">
            <VideoHero />
            <div className="relative z-10 bg-background">
                <VideoGallery />
            </div>
        </div>
    );
};

export default VideoPage;
