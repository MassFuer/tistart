import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { artworksAPI } from "../services/api";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Settings, 
  Maximize, 
  ArrowLeft,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const VideoDetailPage = () => {
    const { id } = useParams();
    const [videoData, setVideoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [bgAudioPlaying, setBgAudioPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    const videoRef = useRef(null);
    const bgAudioRef = useRef(null);

    useEffect(() => {
        fetchVideoDetails();
    }, [id]);

    const fetchVideoDetails = async () => {
        try {
            const response = await artworksAPI.getOne(id);
            setVideoData(response.data.data);
        } catch (error) {
            console.error("Failed to load video details", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial background audio handling
    useEffect(() => {
        if (bgAudioRef.current && videoData) {
            bgAudioRef.current.volume = 0.3;
            if(bgAudioPlaying) {
                bgAudioRef.current.play().catch(e => console.log("Audio autoplay blocked", e));
            } else {
                bgAudioRef.current.pause();
            }
        }
    }, [bgAudioPlaying, videoData]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!videoData) {
        return (
             <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
                <h2 className="text-xl mb-4">Video not found</h2>
                <Link to="/videos" className="text-primary hover:underline">Return to Gallery</Link>
            </div>
        );
    }

    // Handle Main Video Play/Pause
    const handlePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                // Resume background audio if desired?
                if(videoData.video.backgroundAudioUrl) setBgAudioPlaying(true);
            } else {
                videoRef.current.play();
                // Check if background audio needs to stop
                if(videoData.video.backgroundAudioUrl) setBgAudioPlaying(false);
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (value) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    const formatTime = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className="min-h-screen bg-black text-white pb-20 pt-20">
            {/* Background Audio Player (Hidden) */}
            {videoData.video?.backgroundAudioUrl && (
                <audio ref={bgAudioRef} src={videoData.video.backgroundAudioUrl} loop />
            )}

            <div className="container mx-auto px-4">
                {/* Back Link */}
                <Link to="/videos" className="mb-6 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
                </Link>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Video Player */}
                    <div className="lg:col-span-2">
                         <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 ring-1 ring-white/10 shadow-2xl">
                            <video
                                ref={videoRef}
                                src={videoData.video?.fullVideoUrl || videoData.video?.url}
                                className="h-full w-full object-cover"
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                                onClick={handlePlayPause}
                            >
                                {videoData.video?.subtitlesUrl && (
                                    <track 
                                        kind="subtitles" 
                                        src={videoData.video.subtitlesUrl} 
                                        srcLang="en" 
                                        label="English" 
                                        default 
                                    />
                                )}
                            </video>
                            
                            {/* Custom Controls Overlay */}
                            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                                <div className="p-4 space-y-4">
                                     {/* Progress Bar */}
                                    <Slider
                                        value={[currentTime]}
                                        max={duration}
                                        step={1}
                                        onValueChange={handleSeek}
                                        className="cursor-pointer"
                                    />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <button onClick={handlePlayPause} className="text-white hover:text-primary transition-colors">
                                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                                            </button>
                                            
                                            <div className="flex items-center gap-2 group relative">
                                                <button onClick={() => {
                                                    videoRef.current.muted = !isMuted;
                                                    setIsMuted(!isMuted);
                                                }}>
                                                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                                                </button>
                                            </div>

                                            <span className="text-sm font-medium text-gray-300">
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Quality / Settings Placeholder */}
                                            <button className="text-gray-300 hover:text-white">
                                                <Settings className="h-5 w-5" />
                                            </button>
                                            
                                            <button onClick={toggleFullscreen} className="text-white hover:text-primary">
                                                <Maximize className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Center Play Button Overlay (when paused) */}
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={handlePlayPause}>
                                    <div className="rounded-full bg-white/20 p-6 backdrop-blur-md transition-transform hover:scale-110">
                                        <Play className="h-10 w-10 text-white fill-white ml-1" />
                                    </div>
                                </div>
                            )}
                        </div>

                         {/* Background Audio Control */}
                        {videoData.video?.backgroundAudioUrl && (
                             <div className="mt-4 flex items-center justify-between rounded-lg bg-white/5 p-3 px-4 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        {bgAudioPlaying && (
                                             <div className="absolute -inset-1 animate-pulse rounded-full bg-primary/20" />
                                        )}
                                        <Volume2 className={`h-4 w-4 ${bgAudioPlaying ? 'text-primary' : 'text-gray-500'}`} />
                                    </div>
                                    <span className="text-sm text-gray-300">Atmosphere Audio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="text-xs text-muted-foreground mr-2">{bgAudioPlaying ? "On" : "Off"}</span>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 text-xs border-white/10 dark:text-gray-200 hover:bg-white/10"
                                        onClick={() => setBgAudioPlaying(!bgAudioPlaying)}
                                    >
                                        Toggle
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Metadata */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{videoData.title}</h1>
                            <div className="mt-2 flex items-center gap-3">
                                <span className="text-lg text-primary">{videoData.artist?.firstName} {videoData.artist?.lastName}</span>
                                {videoData.video?.duration && (
                                    <span className="text-sm text-gray-400 border border-white/10 px-2 py-0.5 rounded">
                                        {Math.floor(videoData.video.duration / 60)}m {videoData.video.duration % 60}s
                                    </span>
                                )}
                                {videoData.video?.isPaid && <Badge variant="secondary">Premium</Badge>}
                            </div>
                        </div>

                        {videoData.video?.synopsis && (
                            <div className="prose prose-invert">
                                <h3 className="text-sm font-uppercase font-semibold tracking-wider text-gray-500">SYNOPSIS</h3>
                                <p className="text-gray-300 leading-relaxed mt-2">{videoData.video.synopsis}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6">
                            {videoData.video?.director && (
                                <div>
                                    <h3 className="text-xs font-uppercase font-semibold tracking-wider text-gray-500 mb-1">DIRECTOR</h3>
                                    <p className="font-medium">{videoData.video.director}</p>
                                </div>
                            )}
                            
                            {videoData.video?.cast && videoData.video.cast.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-uppercase font-semibold tracking-wider text-gray-500 mb-1">CAST</h3>
                                    <ul className="space-y-1">
                                        {videoData.video.cast.map((actor, i) => (
                                            <li key={i} className="text-sm text-gray-300">{actor}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {videoData.video?.productionTeam && videoData.video.productionTeam.length > 0 && (
                            <div>
                                <h3 className="text-xs font-uppercase font-semibold tracking-wider text-gray-500 mb-2">TEAM</h3>
                                <div className="space-y-3">
                                    {videoData.video.productionTeam.map((member, i) => (
                                        <div key={i} className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between text-sm border-b border-white/10 pb-2 last:border-0">
                                            <span className="text-gray-400">{member.role}</span>
                                            <span className="font-medium">{member.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommendations Section */}
                 <div className="mt-24">
                    <h2 className="text-2xl font-bold mb-6">More from {videoData.artist?.firstName}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Placeholder for recommendations - fetching unrelated videos for now */}
                        {[1, 2, 3, 4].map((item) => (
                             <div key={item} className="aspect-video bg-gray-900 rounded-lg animate-pulse opacity-50"></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoDetailPage;
