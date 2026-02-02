import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersAPI, artworksAPI, eventsAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import EventCard from "../components/event/EventCard";
import LocationDisplay from "../components/map/LocationDisplay";
import StartConversationButton from "../components/messaging/StartConversationButton";
import { toast } from "sonner";
import Loading from "../components/common/Loading";
import { 
    Globe, 
    Instagram, 
    Facebook, 
    Twitter, 
    MapPin, 
    Calendar,
    CheckCircle2,
    Palette
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from "@/components/ui/tabs";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const ArtistProfilePage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    try {
      const [artistRes, artworksRes, eventsRes] = await Promise.all([
        usersAPI.getArtistProfile(id),
        artworksAPI.getAll({ limit: 50 }),
        eventsAPI.getAll({ artist: id, upcoming: false })
      ]);

      setArtist(artistRes.data.data);
      
      // Filter artworks by this artist
      const artistArtworks = artworksRes.data.data.filter((a) => a.artist?._id === id);
      setArtworks(artistArtworks);
      
      setEvents(eventsRes.data.data);

    } catch (error) {
      console.error("Profile fetch error:", error);
      toast.error("Failed to load artist profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading message="Loading artist profile..." />;
  }

  if (!artist) {
    return (
        <div className="container mx-auto py-32 text-center text-muted-foreground">
            <h2 className="text-2xl font-bold">Profile not found</h2>
            <p>The profile you are looking for does not exist or has been removed.</p>
        </div>
    );
  }

  const socialLinks = artist.artistInfo?.socialMedia;
  const companyName = artist.artistInfo?.companyName || `${artist.firstName} ${artist.lastName}`;
  const isAdmin = ["admin", "superAdmin"].includes(artist.role);
  const isVerified = artist.artistStatus === "verified" || isAdmin;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        
        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
            {/* Avatar */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
                 <Avatar className="h-32 w-32 md:h-40 md:w-40 border-2 border-border shadow-sm">
                    <AvatarImage src={artist.profilePicture} alt={companyName} className="object-cover" />
                    <AvatarFallback className="text-4xl">{artist.firstName?.[0]}</AvatarFallback>
                </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                     <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center md:justify-start gap-2">
                        {companyName}
                        {isVerified && (
                          <CheckCircle2 
                            className={`h-6 w-6 ${isAdmin ? "text-blue-600 dark:text-blue-400" : "text-blue-500"}`} 
                            title={isAdmin ? "Platform Admin" : "Verified Artist"}
                          />
                        )}
                    </h1>
                     {artist.artistInfo?.tagline && (
                        <p className="text-xl text-muted-foreground font-medium mt-1">
                            {artist.artistInfo.tagline}
                        </p>
                    )}
                </div>

                {/* Location */}
                {artist.artistInfo?.address?.city && (
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{artist.artistInfo.address.city}, {artist.artistInfo.address.country}</span>
                    </div>
                )}

                {/* Socials & Actions & KPIs */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                     <StartConversationButton
                        artistId={artist._id}
                        variant="default"
                        size="sm"
                      />
                     
                     {/* Socials */}
                     {socialLinks && (
                         <div className="flex items-center gap-1 border-l pl-3 border-gray-300 dark:border-gray-700">
                            {socialLinks.website && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" asChild>
                                <a href={socialLinks.website} target="_blank" rel="noopener noreferrer">
                                    <Globe className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {socialLinks.instagram && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-pink-600" asChild>
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                                    <Instagram className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                            {socialLinks.facebook && (
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" asChild>
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                                    <Facebook className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                         </div>
                     )}

                     {/* Compact KPIs */}
                     <div className="flex items-center gap-3 text-sm text-muted-foreground border-l pl-4 border-gray-300 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-foreground">{artworks.length}</span>
                            <span>artworks</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <div className="flex items-center gap-1">
                            <span className="font-bold text-foreground">{events.length}</span>
                            <span>events</span>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* 2. Bio Section */}
         {artist.artistInfo?.description && (
            <div className="mb-12 max-w-3xl">
                <h3 className="text-lg font-semibold mb-2">About</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {artist.artistInfo.description}
                </p>
            </div>
        )}

        <Separator className="my-8" />

        {/* 3. Tabs Content */}
        <Tabs defaultValue="artworks" className="w-full space-y-8 mb-16">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
                <TabsTrigger 
                    value="artworks" 
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground text-lg"
                >
                    Artworks
                </TabsTrigger>
                <TabsTrigger 
                    value="events" 
                    className="rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground text-lg"
                >
                    Upcoming Events
                </TabsTrigger>
            </TabsList>

            <TabsContent value="artworks" className="space-y-6 focus-visible:ring-0 mt-6">
                    {artworks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-xl border border-dashed">
                        <Palette className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No Artworks Yet</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {artworks.map((artwork) => (
                            <ArtworkCard key={artwork._id} artwork={artwork} />
                        ))}
                        </div>
                    )}
            </TabsContent>

            <TabsContent value="events" className="space-y-6 focus-visible:ring-0 mt-6">
                    {events.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 rounded-xl border border-dashed">
                        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-4" />
                        <h3 className="text-lg font-medium">No Upcoming Events</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <EventCard key={event._id} event={event} />
                        ))}
                        </div>
                    )}
            </TabsContent>
        </Tabs>

        {/* 4. Location Map (Full Width at Bottom) */}
        {artist.artistInfo?.address?.city && artist.artistInfo.address.location?.coordinates?.length === 2 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
                 <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" /> Visit the Studio
                 </h3>
                 <div className="rounded-xl overflow-hidden border shadow-sm h-[400px] w-full bg-muted/20">
                    <LocationDisplay
                        address={artist.artistInfo.address}
                        coordinates={{
                            lat: artist.artistInfo.address.location.coordinates[1],
                            lng: artist.artistInfo.address.location.coordinates[0],
                        }}
                        showMap={true}
                        height="400px" // Explicit height passed to component
                        zoom={13}
                    />
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default ArtistProfilePage;