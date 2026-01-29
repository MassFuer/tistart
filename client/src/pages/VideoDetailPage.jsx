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
import ReactMarkdown from "react-markdown";
import { useAuth } from "../context/AuthContext";
import VideoPlayer from "../components/video/VideoPlayer";
import ReviewSection from "../components/review/ReviewSection";

const VideoDetailPage = () => {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [videoData, setVideoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [bgAudioPlaying, setBgAudioPlaying] = useState(false);
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
                // Do not auto-resume background audio to respect user preference
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
            {videoData.video?.backgroundAudioUrl && isAuthenticated && (
                <audio ref={bgAudioRef} src={videoData.video.backgroundAudioUrl} loop />
            )}

            <div className="container mx-auto px-4">
                {/* Back Link */}
                <Link to="/videos" className="mb-6 inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Gallery
                </Link>

                {/* HEADER SECTION (Title & Artist) */}
                <div className="mb-8 border-b border-white/10 pb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">{videoData.title}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <Link 
                                    to={`/artists/${videoData.artist?._id}`} 
                                    className="flex items-center gap-3 text-white hover:text-primary transition-colors group"
                                >
                                    {videoData.artist?.profilePicture ? (
                                        <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-transparent group-hover:border-primary transition-colors">
                                            <img src={videoData.artist.profilePicture} alt="" className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center">
                                            <span className="text-xs font-bold">{videoData.artist?.firstName?.[0]}</span>
                                        </div>
                                    )}
                                    <span className="font-medium text-lg">{videoData.artist?.firstName} {videoData.artist?.lastName}</span>
                                </Link>
                                
                                {videoData.video?.duration && (
                                    <>
                                        <div className="h-4 w-px bg-white/20 hidden md:block" />
                                        <div className="flex items-center gap-2 text-gray-400 font-mono bg-white/5 px-2 py-1 rounded">
                                            <span className="text-xs uppercase tracking-wider">Duration</span>
                                            <span className="text-white">{Math.floor(videoData.video.duration / 60)}m {videoData.video.duration % 60}s</span>
                                        </div>
                                    </>
                                )}
                                
                                {videoData.video?.isPaid && <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 px-3 py-1">Premium</Badge>}
                            </div>
                        </div>

                        {/* Action Buttons (Like 'Favorite' - placeholder for now) */}
                         <div className="flex gap-3">
                             {/* Future implementation */}
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* LEFT COLUMN: Video & Reviews */}
                    <div className="lg:col-span-2 space-y-12">
                         <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900 ring-1 ring-white/10 shadow-2xl">
                            <VideoPlayer 
                                artwork={videoData} 
                                onPurchaseComplete={fetchVideoDetails}
                                onPlay={() => {
                                    if (videoData.video?.backgroundAudioUrl) setBgAudioPlaying(false);
                                }}
                                onPause={() => {
                                    // Do not auto-resume background audio (respect user preference)
                                }}
                            />
                        </div>

                        {/* Background Audio Control */}
                        {videoData.video?.backgroundAudioUrl && (
                             <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 px-4 backdrop-blur-sm border border-white/5">
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
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-xs text-white border border-white/20 hover:bg-white/10 hover:text-white"
                                        onClick={() => setBgAudioPlaying(!bgAudioPlaying)}
                                    >
                                        Toggle
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Reviews Section */}
                        <div className="pt-8 border-t border-white/10">
                            <ReviewSection artworkId={id} />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Metadata Sidebar */}
                    <div className="space-y-8">
                        
                        {/* Synopsis */}
                        {videoData.video?.synopsis ? (
                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h3 className="text-xs font-bold tracking-widest text-secondary mb-4 uppercase">Synopsis</h3>
                                <p className="text-gray-200 leading-relaxed italic opacity-90">{videoData.video.synopsis}</p>
                            </div>
                        ) : videoData.description && (
                             <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-gray-300 leading-relaxed">
                                <ReactMarkdown>{videoData.description}</ReactMarkdown>
                            </div>
                        )}

                        {/* Credits Grid */}
                        <div className="bg-transparent rounded-xl border border-white/10 overflow-hidden">
                            <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Credits & Info</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 gap-6">
                                {videoData.video?.director && (
                                    <div>
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Director</h4>
                                        <p className="font-medium text-white text-lg">{videoData.video.director}</p>
                                    </div>
                                )}
                                
                                {videoData.video?.coAuthor && (
                                    <div>
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Co-Author</h4>
                                        <p className="font-medium text-white">{videoData.video.coAuthor}</p>
                                    </div>
                                )}

                                {videoData.video?.cast && videoData.video.cast.length > 0 && (
                                    <div>
                                        <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-2">Cast</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {videoData.video.cast.map((actor, i) => (
                                                <Badge key={i} variant="outline" className="border-white/20 text-gray-300 font-normal">
                                                    {actor}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {videoData.video?.fileSize && (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div>
                                            <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">File Size</h4>
                                            <p className="font-mono text-gray-300">{(videoData.video.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                        {videoData.video?.quality && (
                                            <div>
                                                <h4 className="text-xs text-gray-500 uppercase tracking-widest mb-1">Quality</h4>
                                                <Badge className="bg-primary/20 text-secondary border-secondary/20 hover:bg-primary/30">
                                                    {videoData.video.quality}
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Production Team */}
                        {videoData.video?.productionTeam && videoData.video.productionTeam.length > 0 && (
                            <div className="pt-4">
                                <h3 className="text-xs font-bold tracking-widest text-gray-500 mb-4 uppercase">Production Team</h3>
                                <div className="space-y-3">
                                    {videoData.video.productionTeam.map((member, i) => (
                                        <div key={i} className="flex justify-between items-baseline p-2 rounded-lg bg-white/5 border border-white/5 hover:border-white/20 transition-colors">
                                            <span className="text-xs text-gray-400 uppercase font-bold">{member.role}</span>
                                            <span className="font-medium text-white">{member.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recommendations Section */}
                 <div className="mt-24">
                    <h2 className="text-2xl font-bold mb-6">More from {videoData.video?.artist?.firstName}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Future implementation */}
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
