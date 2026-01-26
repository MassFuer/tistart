import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Edit, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EventCard = ({ event, showActions = false, onDelete }) => {
  const formatDate = (dateString) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const formatTime = (dateString) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const isFull = event.maxCapacity > 0 && event.currentAttendees >= event.maxCapacity;

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/events/${event._id}`} className="block relative aspect-video w-full overflow-hidden bg-muted group cursor-pointer">
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.title} 
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant="secondary" className="capitalize backdrop-blur-md bg-white/80 dark:bg-black/60">
                {event.category}
            </Badge>
        </div>
        {isFull && (
            <div className="absolute top-2 left-2">
                 <Badge variant="destructive">Sold Out</Badge>
            </div>
        )}
      </Link>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
             <div className="flex items-center text-xs text-muted-foreground mb-1">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatDate(event.startDateTime)} • {formatTime(event.startDateTime)}</span>
             </div>
        </div>
        <CardTitle className="text-xl line-clamp-1 leading-tight">
            <Link to={`/events/${event._id}`} className="hover:underline">
                {event.title}
            </Link>
        </CardTitle>
        <CardDescription className="line-clamp-1">
            by{" "}
            <Link to={`/artists/${event.artist?._id}`} className="hover:underline hover:text-foreground transition-colors">
                {event.artist?.artistInfo?.companyName || `${event.artist?.firstName} ${event.artist?.lastName}`}
            </Link>
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-2 flex-grow">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
             <div className="flex items-center">
                 <MapPin className="mr-1 h-3 w-3" />
                 {event.location?.isOnline ? (
                    <span>Online Event</span>
                 ) : (
                    <span className="truncate">
                        {event.location?.venue}, {event.location?.city}
                    </span>
                 )}
             </div>
             {event.maxCapacity > 0 && (
                 <div className="flex items-center">
                     <Users className="mr-1 h-3 w-3" />
                     <span>{event.currentAttendees} / {event.maxCapacity} attending</span>
                 </div>
             )}
        </div>
      </CardContent>

      <CardFooter className="p-4 flex justify-between items-center border-t bg-muted/20 mt-auto">
        <div className="font-semibold text-primary">
            {formatPrice(event.price)}
        </div>
        
        {showActions ? (
           <div className="flex gap-2">
               <Button variant="ghost" size="icon" asChild>
                   <Link to={`/events/${event._id}/edit`}>
                       <Edit className="h-4 w-4" />
                   </Link>
               </Button>
               {onDelete && (
                   <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(event._id)}>
                       <Trash2 className="h-4 w-4" />
                   </Button>
               )}
           </div>
        ) : (
             <Button size="sm" asChild>
                <Link to={`/events/${event._id}`}>Details</Link>
             </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default EventCard;