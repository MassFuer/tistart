import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { artworksAPI, eventsAPI } from "../services/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, Palette, ShieldCheck, Users } from "lucide-react"; // Icons
import ArtworkCard from "../components/artwork/ArtworkCard";
import EventCard from "../components/event/EventCard";
import WordRotate from "../components/ui/word-rotate";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [artworksRes, eventsRes] = await Promise.all([
          artworksAPI.getAll({ limit: 6, sort: '-createdAt' }),
          eventsAPI.getAll({ limit: 6, sort: '-createdAt' })
        ]);
        setFeaturedArtworks(artworksRes.data.data);
        setFeaturedEvents(eventsRes.data.data || []);
      } catch (error) {
        console.error('Error fetching featured content:', error);
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
        <img
            src="https://www.cercledart.com/wp-content/uploads/2025/06/7638588-scaled.jpg"
            alt="Arrière-plan Cercle d'Art"
            {...{ fetchpriority: "high" }} // Syntaxe React pour l'attribut récent fetchpriority
            className="absolute inset-0 z-0 w-full h-full object-cover"
          />
          
          {/* Overlay */}
          <div className="absolute inset-0 z-[1] bg-black/60" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto space-y-8">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
          <h1
            className="
              text-4xl md:text-6xl
              font-extrabold tracking-tight
              text-white drop-shadow-2xl
              text-center
              flex flex-col md:flex-row
              flex-wrap md:flex-nowrap
              justify-center
              gap-x-3 gap-y-2
            "
          >
            <span className="whitespace-nowrap">Where Art Meets</span>
            <WordRotate
              className="
                text-transparent
                bg-clip-text
                bg-gradient-to-r
                from-amber-200
                via-orange-300
                to-rose-300
                text-center
              "
              words={[
                "Innovation",
                "Creativity",
                "Ironhack ",
                "Passion",
                "Future",
                "Marseille",
              ]}
            />
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
              <Button asChild size="lg" className="h-12 px-8 text-base font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] hover:brightness-110 transition-all duration-200">
                <Link to="/gallery">
                  Explore Gallery
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="h-12 px-8 text-base font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:text-white hover:scale-[1.02] transition-all duration-200">
                <Link to="/events">
                  Discover Events
                </Link>
              </Button>
            </motion.div>
        </div>
      </section>

      {/* VALUE PROPOSITION */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="mx-auto w-12 h-12 bg-primary/10 dark:bg-white/10 rounded-full flex items-center justify-center text-primary dark:text-white">
                    <Palette className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Curated Excellence</h3>
                <p className="text-muted-foreground">Hand-picked artworks from emerging and established talents worldwide.</p>
            </div>
            <div className="space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="mx-auto w-12 h-12 bg-primary/10 dark:bg-white/10 rounded-full flex items-center justify-center text-primary dark:text-white">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Secure Collections</h3>
                <p className="text-muted-foreground">Certified authenticity and secure transactions powered by Stripe.</p>
            </div>
            <div className="space-y-4 p-6 rounded-xl bg-card border border-border/50 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
               <div className="mx-auto w-12 h-12 bg-primary/10 dark:bg-white/10 rounded-full flex items-center justify-center text-primary dark:text-white">
                    <Users className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">Vibrant Community</h3>
                <p className="text-muted-foreground">Join exclusive events, meet artists, and connect with fellow collectors.</p>
            </div>
        </div>
      </section>

      {/* FEATURED ARTWORKS */}
      {!loading && featuredArtworks.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 max-w-7xl mx-auto">
            {featuredArtworks.map((artwork, i) => (
              <motion.div
                key={artwork._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="h-full"
              >
                  <ArtworkCard artwork={artwork} showActions={false} />
              </motion.div>
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
             <Button asChild size="lg" className="w-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                <Link to="/gallery">Explore Full Gallery</Link>
             </Button>
          </div>
        </section>
      )}

      {/* TRENDING EVENTS */}
      {!loading && featuredEvents.length > 0 && (
        <section className="py-16 container mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
                 <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Trending Events</h2>
                 <p className="text-muted-foreground">Discover exhibitions and art experiences near you.</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:inline-flex group">
                <Link to="/events" className="flex items-center gap-2">
                    View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
            {featuredEvents.map((event, i) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="h-full"
              >
                  <EventCard event={event} />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
             <Button asChild size="lg" className="w-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                <Link to="/events">Explore All Events</Link>
             </Button>
          </div>
        </section>
      )}

      {/* CALL TO ACTION */}
      <section className="py-12 bg-muted/50 mt-auto">
        <div className="container mx-auto px-4 text-center space-y-6">
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
                            <Card className="bg-card border-primary/20 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-foreground">Become an Artist</CardTitle>
                                    <CardDescription>Share your creations with our global audience.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild size="lg" className="w-full dark:bg-gray-100 dark:text-black dark:hover:bg-gray-200">
                                        <Link to="/apply-artist">Submit Portfolio</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {user?.artistStatus === "pending" && (
                             <Card className="bg-yellow-500/10 border-yellow-500/50">
                                <CardHeader>
                                    <CardTitle className="text-yellow-600 dark:text-yellow-400">Application Pending</CardTitle>
                                    <CardDescription>We are reviewing your portfolio. Stay tuned!</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                         {user?.artistStatus === "verified" && (
                             <Card className="bg-card border-primary/20 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-foreground">Welcome Back, {user.firstName}</CardTitle>
                                    <CardDescription>Ready to upload new masterpieces?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild size="lg" className="w-full dark:bg-gray-100 dark:text-black dark:hover:bg-gray-200">
                                        <Link to="/upload-artwork">Upload Artwork</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {user?.artistStatus === "incomplete" && (
                             <Card className="bg-red-500/10 border-red-500/50">
                                <CardHeader>
                                    <CardTitle className="text-red-600 dark:text-red-400">Application Update Required</CardTitle>
                                    <CardDescription>Your application was marked as incomplete. Please check your messages for feedback.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button asChild variant="outline" size="lg" className="w-full border-red-200 hover:bg-red-50 text-red-700">
                                        <Link to="/messages">View Feedback</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                        {user?.artistStatus === "suspended" && (
                             <Card className="bg-destructive/10 border-destructive/50">
                                <CardHeader>
                                    <CardTitle className="text-destructive">Account Suspended</CardTitle>
                                    <CardDescription>Your artist privileges have been suspended. Please contact support.</CardDescription>
                                </CardHeader>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-16 bg-background container mx-auto px-4">
        <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to know about collecting and exhibiting on our platform.
            </p>
        </div>

        <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger className="text-lg font-bold">How do I purchase artwork?</AccordionTrigger>
                    <AccordionContent>
                        Browse our gallery, select the piece you love, and add it to your cart. We accept secure payments via Stripe. Once purchased, you'll receive a confirmation and shipping details (or instant access for digital assets).
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className="text-lg font-bold">Is payment secure?</AccordionTrigger>
                    <AccordionContent>
                        Absolutely. We use Stripe, a globally trusted payment processor, to handle all transactions. Your financial data is encrypted and never stored on our servers.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger className="text-lg font-bold">Can I return an artwork?</AccordionTrigger>
                    <AccordionContent>
                        Physical artworks can be returned within 14 days of delivery if they arrive damaged or significantly different from the description. Digital purchases (videos, music) are non-refundable once accessed.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                    <AccordionTrigger className="text-lg font-bold">How do I become a verified artist?</AccordionTrigger>
                    <AccordionContent>
                        Create an account and navigate to the "Apply as Artist" section. Submit your portfolio for review. Our curation team will evaluate your work and get back to you within 48 hours.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                    <AccordionTrigger className="text-lg font-bold">Do you offer international shipping?</AccordionTrigger>
                    <AccordionContent>
                        Yes! Our artists ship worldwide. Shipping costs are calculated at checkout based on your location and the artwork's dimensions.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
