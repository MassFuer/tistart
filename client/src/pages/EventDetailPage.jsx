import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { eventsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import LocationDisplay from "../components/map/LocationDisplay";
import { toast } from "sonner";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Share2, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Info,
  Loader2,
  ShoppingCart
} from "lucide-react";

import { formatPrice } from "@/lib/formatters";

// Shadcn Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
  } from "@/components/ui/avatar"

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await eventsAPI.getOne(id);
      setEvent(response.data.data);
    } catch (error) {
      console.error(error);
      setError("Failed to load event. It might have been cancelled or removed.");
    } finally {
      setIsLoading(false);
    }
  };

  const [isJoining, setIsJoining] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [showAttendees, setShowAttendees] = useState(false);

  // Check if current user is attending (from local event state)
  const isAttending = event?.attendees?.some(id => id === user?._id || id?._id === user?._id);
  // Check if user is admin or owner
  const canManage = isAuthenticated && (user?.role === "admin" || user?._id === event?.artist?._id);

  const handleBuyTicket = async () => {
      if (!isAuthenticated) {
          toast.error("Please login to purchase tickets");
          navigate("/login");
          return;
      }
      setIsJoining(true); // Reuse state for loading
      try {
          await addToCart({ eventId: event._id, quantity: 1 });
          navigate("/cart");
      } catch (error) {
          console.error("Failed to add ticket to cart:", error);
      } finally {
          setIsJoining(false);
      }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) return toast.error("Please login to join this event");
    
    setIsJoining(true);
    try {
      const response = await eventsAPI.join(id);
      setEvent(response.data.data);
      toast.success("Successfully joined event!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to join event");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    setIsJoining(true);
    try {
      const response = await eventsAPI.leave(id);
      setEvent(response.data.data);
      toast.success("Successfully left event");
    } catch (error) {
      toast.error("Failed to leave event");
    } finally {
      setIsJoining(false);
    }
  };

  const handleDelete = async () => {
      try {
        await eventsAPI.delete(id);
        toast.success("Event deleted successfully");
        navigate("/events");
      } catch (error) {
        toast.error("Failed to delete event");
      }
  };

  const toggleAttendees = async () => {
    if (showAttendees) {
      setShowAttendees(false);
      return;
    }

    try {
      const response = await eventsAPI.getAttendees(id);
      setAttendees(response.data.data);
      setShowAttendees(true);
    } catch (error) {
      toast.error("Failed to load attendees");
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "EEEE, MMMM d, yyyy");
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  if (isLoading) return <Loading message="Loading event details..." />;

  if (error || !event) {
    return <ErrorMessage message={error || "Event not found"} onRetry={fetchEvent} />;
  }

  const isFull = event.maxCapacity > 0 && event.currentAttendees >= event.maxCapacity;
  const isPast = new Date(event.endDateTime) < new Date();
  const progress = event.maxCapacity > 0 ? (event.currentAttendees / event.maxCapacity) * 100 : 0;

  return (
    <div className="container mx-auto px-0 sm:px-4 py-4 sm:py-8 min-h-screen max-w-6xl">
       {/* Hero Section */}
       <div className="relative w-full h-[250px] sm:h-[300px] md:h-[400px] sm:rounded-xl overflow-hidden mb-6 sm:mb-8 shadow-lg sm:border bg-muted">
           {event.image ? (
               <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
           ) : (
               <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg">
                   No Header Image
               </div>
           )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                     <Badge variant="secondary" className="text-sm px-3 py-1 font-semibold capitalize backdrop-blur-md bg-white/20 hover:bg-white/30 text-white border-none">
                         {event.category}
                     </Badge>
                     {isPast && <Badge variant="destructive">Event Ended</Badge>}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">{event.title}</h1>
                <div className="flex items-center gap-2 text-white/90 font-medium">
                    <span>by</span>
                    <Link to={`/artists/${event.artist?._id}`} className="hover:underline hover:text-white">
                         {event.artist?.artistInfo?.companyName || `${event.artist?.firstName} ${event.artist?.lastName}`}
                    </Link>
                </div>
            </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 px-4 sm:px-0">
           {/* LEFT COLUMN - PART 1 (About) */}
           <div className="lg:col-span-2 space-y-6 sm:space-y-8">
               {/* About */}
               <section>
                   <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                       <Info className="h-5 w-5" /> About this event
                   </h2>
                   <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-line">
                       {event.description}
                   </div>
               </section>

                <Separator />
           </div>

           {/* SIDEBAR (Registration & Manage) */}
           {/* Mobile: 2nd position. Desktop: Right column spanning 2 rows */}
           <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 space-y-6">
                <div className="sticky top-24 space-y-6">
                    {/* Registration Card */}
                   <Card className="border-0 bg-muted/30 shadow-xl z-20">
                       <CardHeader>
                           <CardTitle>Registration</CardTitle>
                           <CardDescription>Secure your spot for this event</CardDescription>
                       </CardHeader>
                       <CardContent className="space-y-6">
                           <div className="flex justify-between items-end">
                               <div>
                                   <p className="text-sm text-muted-foreground">Price</p>
                                   <p className="text-3xl font-bold text-foreground">{event.price === 0 ? "Free" : formatPrice(event.price)}</p>
                               </div>
                               <div className="text-right">
                                   <p className="text-sm text-muted-foreground mb-1">Capacity</p>
                                   <div className="flex items-center gap-2">
                                       <Users className="h-4 w-4" />
                                       <span className="font-semibold">
                                            {event.maxCapacity ? `${event.currentAttendees} / ${event.maxCapacity}` : "Unlimited"}
                                       </span>
                                   </div>
                               </div>
                           </div>

                           {event.maxCapacity > 0 && (
                               <div className="space-y-1">
                                   <Progress value={progress} className="h-2 bg-muted dark:bg-zinc-700" />
                                   <p className="text-xs text-muted-foreground text-right">{Math.round(progress)}% full</p>
                               </div>
                           )}

                           <div className="pt-2">
                                {!isAuthenticated ? (
                                    <div className="space-y-3">
                                        <p className="text-sm text-center text-muted-foreground">Please login to register.</p>
                                        <Button asChild className="w-full">
                                            <Link to="/login">Login to Join</Link>
                                        </Button>
                                    </div>
                                ) : isAttending ? (
                                    <div className="space-y-3">
                                         <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-3 rounded-md flex items-center justify-center gap-2 font-medium border border-green-200 dark:border-green-900">
                                             <CheckCircle2 className="h-5 w-5" /> You are registered
                                         </div>
                                         <AlertDialog>
                                             <AlertDialogTrigger asChild>
                                                 <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" disabled={isJoining || isPast}>
                                                     Cancel Registration
                                                 </Button>
                                             </AlertDialogTrigger>
                                             <AlertDialogContent>
                                                 <AlertDialogHeader>
                                                     <AlertDialogTitle>Cancel Registration?</AlertDialogTitle>
                                                     <AlertDialogDescription>
                                                         This action cannot be undone. You will lose your spot in the event.
                                                     </AlertDialogDescription>
                                                 </AlertDialogHeader>
                                                 <AlertDialogFooter>
                                                     <AlertDialogCancel>Go Back</AlertDialogCancel>
                                                     <AlertDialogAction onClick={handleLeave} className="bg-destructive hover:bg-destructive/90">Yes, Cancel</AlertDialogAction>
                                                 </AlertDialogFooter>
                                             </AlertDialogContent>
                                         </AlertDialog>
                                    </div>
                                ) : isFull ? (
                                    <Button className="w-full" variant="secondary" disabled>
                                        Sold Out
                                    </Button>
                                ) : isPast ? (
                                    <Button className="w-full" variant="secondary" disabled>
                                        Event Ended
                                    </Button>
                                ) : (
                                    event.price > 0 ? (
                                        <Button onClick={handleBuyTicket} className="w-full" size="lg" disabled={isJoining}>
                                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                                            {isJoining ? "Processing..." : "Buy Ticket"}
                                        </Button>
                                    ) : (
                                        <Button onClick={handleJoin} className="w-full" size="lg" disabled={isJoining}>
                                            {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {isJoining ? "Joining..." : "Join Event"}
                                        </Button>
                                    )
                                )}
                           </div>
                       </CardContent>
                       <CardFooter className="bg-muted/50 p-4 text-xs text-muted-foreground text-center">
                            Typically replies within a few hours. Refunds available up to 24h before event.
                       </CardFooter>
                   </Card>
                   
                   {/* Admin Actions */}
                   {canManage && (
                       <Card className="bg-muted/30 border-0 shadow-md">
                           <CardHeader>
                               <CardTitle>Manage Event</CardTitle>
                           </CardHeader>
                           <CardContent className="space-y-3">
                               <Button asChild variant="outline" className="w-full">
                                   <Link to={`/events/${id}/edit`}>
                                       <Edit className="mr-2 h-4 w-4" /> Edit Event
                                   </Link>
                               </Button>
                               
                               <Button variant="outline" className="w-full" onClick={toggleAttendees}>
                                   <Users className="mr-2 h-4 w-4" /> {showAttendees ? "Hide" : "View"} Attendees
                               </Button>

                               <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                         <Button variant="destructive" className="w-full">
                                             <Trash2 className="mr-2 h-4 w-4" /> Delete Event
                                         </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent>
                                         <AlertDialogHeader>
                                             <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                             <AlertDialogDescription>
                                                 This action cannot be undone. This will permanently delete the event and remove all attendee data.
                                             </AlertDialogDescription>
                                         </AlertDialogHeader>
                                         <AlertDialogFooter>
                                             <AlertDialogCancel>Cancel</AlertDialogCancel>
                                             <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                         </AlertDialogFooter>
                                     </AlertDialogContent>
                                 </AlertDialog>
                               
                               {showAttendees && (
                                    <div className="mt-4 pt-4 border-t">
                                        <h4 className="font-semibold mb-2 text-sm">Registered Users ({attendees.length})</h4>
                                        {attendees.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No attendees yet.</p>
                                        ) : (
                                            <ul className="space-y-3">
                                                {attendees.map(att => (
                                                    <li key={att._id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={att.profilePicture} />
                                                            <AvatarFallback>{att.firstName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 overflow-hidden">
                                                            <p className="text-sm font-medium truncate">{att.firstName} {att.lastName}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{att.email}</p>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                               )}
                           </CardContent>
                       </Card>
                   )}
                </div>
           </div>

           {/* LEFT COLUMN - PART 2 (Date & Location) */}
           <div className="lg:col-span-2 space-y-6 sm:space-y-8">
               {/* Date & Time */}
               <section>
                   <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                       <Calendar className="h-5 w-5" /> Date & Time
                   </h2>
                   <div className="grid gap-4 md:grid-cols-2">
                       <Card className="bg-muted/30 border-0 shadow-sm">
                           <CardContent className="p-4 flex items-center gap-4">
                               <div className="p-2 rounded-full bg-muted text-foreground">
                                   <Calendar className="h-6 w-6" />
                               </div>
                               <div>
                                   <p className="text-sm font-medium text-muted-foreground">Start</p>
                                   <p className="font-semibold">{formatDate(event.startDateTime)}</p>
                                   <p className="text-sm">{formatTime(event.startDateTime)}</p>
                               </div>
                           </CardContent>
                       </Card>
                       <Card className="bg-muted/30 border-0 shadow-sm">
                           <CardContent className="p-4 flex items-center gap-4">
                               <div className="p-2 rounded-full bg-muted text-foreground">
                                   <CheckCircle2 className="h-6 w-6" />
                               </div>
                               <div>
                                   <p className="text-sm font-medium text-muted-foreground">End</p>
                                   <p className="font-semibold">{formatDate(event.endDateTime)}</p>
                                   <p className="text-sm">{formatTime(event.endDateTime)}</p>
                               </div>
                           </CardContent>
                       </Card>
                   </div>
               </section>

               <Separator />

               {/* Location */}
               <section>
                   <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                       <MapPin className="h-5 w-5" /> Location
                   </h2>
                   {event.location?.isOnline ? (
                       <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900">
                           <CardContent className="p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                               <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                                   <AlertCircle className="h-8 w-8" />
                               </div>
                               <div className="flex-1">
                                   <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">Online Event</h3>
                                   <p className="text-blue-700 dark:text-blue-300 text-sm mb-3">Join from anywhere in the world.</p>
                                   {event.location.onlineUrl && (
                                       <Button asChild size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
                                           <a href={event.location.onlineUrl} target="_blank" rel="noopener noreferrer">
                                               Join Online <ExternalLink className="ml-2 h-4 w-4" />
                                           </a>
                                       </Button>
                                   )}
                               </div>
                           </CardContent>
                       </Card>
                   ) : (
                       <Card className="overflow-hidden bg-muted/30 border-0 shadow-sm">
                           <CardContent className="p-0">
                               <LocationDisplay
                                  address={{
                                    venue: event.location?.venue,
                                    street: event.location?.street,
                                    streetNum: event.location?.streetNum,
                                    zipCode: event.location?.zipCode,
                                    city: event.location?.city,
                                    country: event.location?.country,
                                  }}
                                  coordinates={
                                    event.location?.coordinates?.coordinates?.length === 2
                                      ? {
                                          lat: event.location.coordinates.coordinates[1],
                                          lng: event.location.coordinates.coordinates[0],
                                        }
                                      : null
                                  }
                                  showMap={true}
                                  height="350px"
                                  layout="horizontal"
                                />
                           </CardContent>
                       </Card>
                   )}
               </section>
           </div>
       </div>

       {/* Mobile Sticky Action Bar */}
       {!canManage && !isPast && !isFull && (
         <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t shadow-lg sm:hidden z-50">
           <div className="flex items-center gap-3">
             <div className="flex-shrink-0">
               <p className="text-lg font-bold">{event.price === 0 ? "Free" : formatPrice(event.price)}</p>
             </div>
             <div className="flex-1">
               {!isAuthenticated ? (
                 <Button asChild className="w-full">
                   <Link to="/login">Login to Join</Link>
                 </Button>
               ) : isAttending ? (
                 <Button variant="outline" className="w-full text-green-600" disabled>
                   <CheckCircle2 className="mr-2 h-4 w-4" /> Registered
                 </Button>
               ) : event.price > 0 ? (
                 <Button onClick={handleBuyTicket} className="w-full" disabled={isJoining}>
                   {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                   Buy Ticket
                 </Button>
               ) : (
                 <Button onClick={handleJoin} className="w-full" disabled={isJoining}>
                   {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                   Join Event
                 </Button>
               )}
             </div>
             <Button variant="outline" size="icon" onClick={() => {
               navigator.clipboard.writeText(window.location.href);
               toast.success("Link copied to clipboard");
             }}>
               <Share2 className="h-5 w-5" />
             </Button>
           </div>
         </div>
       )}

       {/* Bottom padding for sticky bar */}
       <div className="h-20 sm:hidden" />
    </div>
  );
};

export default EventDetailPage;