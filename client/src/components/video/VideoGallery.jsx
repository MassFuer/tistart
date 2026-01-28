import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { artworksAPI } from "../../services/api";
import { Loader2 } from "lucide-react";

const VideoGallery = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await artworksAPI.getAll({ category: "video" });
      setVideos(response.data.data);
    } catch (error) {
      console.error("Failed to fetch videos", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="bg-background py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section className="bg-black text-white py-20">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">Featured Videos</h2>
            <p className="mt-2 text-gray-400">Curated selection of moving images.</p>
          </div>
        </div>
        
        {videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
                No video artworks found. Be the first to upload!
            </div>
        ) : (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, index) => (
            <motion.div
              key={video._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative cursor-pointer overflow-hidden rounded-xl bg-zinc-900 border border-white/10 hover:border-white/20 transition-colors"
              onClick={() => navigate(`/videos/${video._id}`)}
            >
              {/* Aspect Ratio Box */}
              <div className="aspect-[4/5] w-full overflow-hidden">
                <video
                  src={video.video?.previewVideoUrl || video.video?.fullVideoUrl || video.video?.url}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  // Preview on hover
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => {
                    e.target.pause();
                    e.target.currentTime = 0;
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="rounded-full bg-white/20 p-4 backdrop-blur-md transition-transform duration-300 hover:scale-110">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-white group-hover:text-primary transition-colors">{video.title}</h3>
                <p className="text-sm text-gray-400">
                    {video.artist?.firstName} {video.artist?.lastName}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};

export default VideoGallery;
