import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { artworksAPI } from "../services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Palette, ShieldCheck, Users } from "lucide-react"; // Icons

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await artworksAPI.getAll({ limit: 6, sort: '-createdAt' });
        setFeaturedArtworks(response.data.data);
      } catch (error) {
        console.error('Error fetching featured artworks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* HERO SECTION */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ 
                backgroundImage: 'url("https://www.cercledart.com/wp-content/uploads/2025/06/7638588-scaled.jpg")' 
            }}
        >
            <div className="absolute inset-0 bg-black/60" /> {/* Overlay */}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl mb-4">
                  Where Art Meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Innovation</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-200 font-light max-w-3xl mx-auto leading-relaxed">
                  The premier platform for discovering unique artworks, connecting with visionary artists, and collecting with confidence.
                </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <Button asChild size="lg" className="h-14 px-8 text-lg bg-white text-black hover:bg-gray-100 hover:text-black shadow-xl">
                <Link to="/gallery">
                  Explore Gallery
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-lg border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white hover:border-white/50">
                <Link to="/events">
                  Discover Events
                </Link>
              </Button>
            </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-4 p-6 rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Curated Excellence</h3>
                <p className="text-muted-foreground">Hand-picked artworks from emerging and established talents worldwide.</p>
            </div>
            <div className="space-y-4 p-6 rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
               <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Secure Collections</h3>
                <p className="text-muted-foreground">Certified authenticity and secure transactions powered by Stripe.</p>
            </div>
            <div className="space-y-4 p-6 rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
               <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Vibrant Community</h3>
                <p className="text-muted-foreground">Join exclusive events, meet artists, and connect with fellow collectors.</p>
            </div>
        </div>
      </section>

      {/* FEATURED ARTWORKS */}
      {!loading && featuredArtworks.length > 0 && (
        <section className="py-24 container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
                 <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Trending Now</h2>
                 <p className="text-muted-foreground">Fresh from the studio to your collection.</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:inline-flex group">
                <Link to="/gallery" className="flex items-center gap-2">
                    View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredArtworks.map((artwork, i) => (
              <motion.div
                key={artwork._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Link to={`/artworks/${artwork._id}`} className="block group h-full">
                  <Card className="h-full overflow-hidden border-0 shadow-lg bg-card transition-all duration-300 hover:shadow-2xl">
                    <div className="aspect-[4/3] relative overflow-hidden">
                        <img 
                          src={artwork.images[0]} 
                          alt={artwork.title}
                          loading="lazy"
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-xl line-clamp-1 group-hover:text-primary transition-colors">{artwork.title}</h3>
                             <span className="font-semibold text-lg">{artwork.price}€</span>
                        </div>
                        <p className="text-muted-foreground mb-4">
                          by {artwork.artist?.firstName} {artwork.artist?.lastName}
                        </p>
                        <span className="inline-flex px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full capitalize">
                            {artwork.category}
                        </span>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
             <Button asChild size="lg" className="w-full">
                <Link to="/gallery">Explore Full Gallery</Link>
             </Button>
          </div>
        </section>
      )}

      {/* CALL TO ACTION */}
      <section className="py-20 bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">Ready to start your journey?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Join thousands of artists and collectors shaping the modern art world.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-8">
                {!isAuthenticated ? (
                    <>
                        <Card className="bg-card hover:bg-accent/50 transition-colors border shadow-sm">
                            <CardHeader>
                                <CardTitle>For Collectors</CardTitle>
                                <CardDescription>Find the perfect piece</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild size="lg" className="w-full font-bold">
                                    <Link to="/signup">Join as Collector</Link>
                                </Button>
                            </CardContent>
                        </Card>
                        <Card className="bg-card hover:bg-accent/50 transition-colors border shadow-sm">
                            <CardHeader>
                                <CardTitle>For Artists</CardTitle>
                                <CardDescription>Exhibit to the world</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild size="lg" variant="outline" className="w-full">
                                    <Link to="/signup?role=artist">Apply as Artist</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                   <div className="col-span-1 md:col-span-2">
                        {user?.artistStatus === "none" && (
                            <Card className="bg-primary-foreground text-primary">
                                <CardHeader>
                                    <CardTitle>Become an Artist</CardTitle>
                                    <CardDescription>Share your creations with our global audience.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild size="lg" className="w-full">
                                        <Link to="/apply-artist">Submit Portfolio</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {user?.artistStatus === "pending" && (
                             <Card className="bg-yellow-500/20 border-yellow-400/50 text-white">
                                <CardHeader>
                                    <CardTitle>Application Pending</CardTitle>
                                    <CardDescription className="text-white/80">We are reviewing your portfolio. Stay tuned!</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                         {user?.artistStatus === "verified" && (
                             <Card className="bg-primary-foreground text-primary">
                                <CardHeader>
                                    <CardTitle>Welcome Back, {user.firstName}</CardTitle>
                                    <CardDescription>Ready to upload new masterpieces?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild size="lg" className="w-full">
                                        <Link to="/upload-artwork">Upload Artwork</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                   </div>
                )}
            </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
