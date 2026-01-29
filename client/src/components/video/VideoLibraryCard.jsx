import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const VideoLibraryCard = ({ video, className }) => {
    // Determine the best video source
    const videoSrc = video.video?.previewVideoUrl || video.video?.fullVideoUrl || video.video?.url;
    const imageSrc = video.images?.[0] || video.video?.thumbnailUrl || "/placeholder-video.jpg";
    const duration = video.video?.duration;

    return (
        <Link 
            to={`/videos/${video._id}`}
            className={cn(
                "group relative block aspect-[16/9] overflow-hidden rounded-lg border border-white/10 bg-black",
                className
            )}
        >
            {/* Default: Image Thumbnail */}
            <img
                src={imageSrc}
                alt={video.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />

            {/* Hover: Video Preview */}
            <video
                src={videoSrc}
                className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                muted
                loop
                playsInline
                // Play on hover logic handled nicely by react events or we can just rely on autoPlay if we want, 
                // but usually hover play needs JS. Marquee had it inline.
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
                    {duration && (
                        <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                            {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                        </span>
                    )}
                </div>
            </div>

            {/* Play Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="fill-white text-white h-8 w-8 drop-shadow-lg" />
            </div>
        </Link>
    );
};

export default VideoLibraryCard;
