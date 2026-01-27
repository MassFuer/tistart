import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsAPI } from "../../services/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
  ExternalLink,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../context/AuthContext";
import Loading from "../common/Loading";

const EventManager = () => {
  const { user, isArtist } = useAuth();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState(isArtist ? "organized" : "attending"); // 'organized' | 'attending'

  useEffect(() => {
    fetchEvents();
  }, [filter, user]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let response;
      if (filter === "organized") {
        response = await eventsAPI.getAll({ artist: user._id, upcoming: "all", isPublic: "all" });
      } else {
        response = await eventsAPI.getAll({ attendee: user._id, upcoming: "all", isPublic: "all" });
      }
      setEvents(response.data.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventsAPI.delete(id);
      toast.success("Event deleted successfully");
      fetchEvents(); // Refresh list
    } catch (error) {
       console.error("Delete error:", error);
       toast.error("Failed to delete event");
    }
  };

  if (isLoading) return <Loading message="Loading events..." />;

  // Common Table Render
  const renderEventsTable = () => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="hidden md:table-cell">Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Attendees</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No events found.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event._id}>
                <TableCell className="font-medium">
                    <div className="flex flex-col">
                        <Link to={`/events/${event._id}`} className="hover:underline flex items-center gap-2">
                             {event.title} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </Link>
                        <span className="text-xs text-muted-foreground md:hidden">
                            {format(new Date(event.startDateTime), "PP")}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {format(new Date(event.startDateTime), "PP p")}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                   <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[150px]">
                            {event.location?.isOnline ? "Online" : event.location?.city || "TBD"}
                        </span>
                   </div>
                </TableCell>
                <TableCell>
                    {new Date(event.endDateTime) < new Date() ? (
                        <Badge variant="secondary">Past</Badge>
                    ) : (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Upcoming</Badge>
                    )}
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{event.attendees?.length || 0}</span>
                         {event.maxCapacity > 0 && <span className="text-muted-foreground text-xs">/{event.maxCapacity}</span>}
                    </div>
                </TableCell>
                 <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                         <Link to={`/events/${event._id}`}>
                            View Details
                         </Link>
                      </DropdownMenuItem>
                       {filter === "organized" && (
                           <>
                            <DropdownMenuItem asChild>
                                <Link to={`/events/${event._id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDelete(event._id)}
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                           </>
                       )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Event Management</h2>
          <p className="text-muted-foreground">
            {isArtist ? "Manage your hosted events and check your schedule." : "Track events you are attending."}
          </p>
        </div>
        
        {isArtist && (
            <div className="flex gap-2">
                 {/* Toggle between Organized and Attending for Artists */}
                 <div className="flex items-center bg-muted rounded-lg p-1">
                    <Button 
                        variant={filter === "organized" ? "secondary" : "ghost"} 
                        size="sm"
                        onClick={() => setFilter("organized")}
                    >
                        Hosted
                    </Button>
                    <Button 
                        variant={filter === "attending" ? "secondary" : "ghost"} 
                        size="sm"
                        onClick={() => setFilter("attending")}
                    >
                        Attending
                    </Button>
                 </div>

                 <Button asChild>
                    <Link to="/events/new">
                        <Plus className="mr-2 h-4 w-4" /> Create Event
                    </Link>
                </Button>
            </div>
        )}
      </div>

      {renderEventsTable()}
    </div>
  );
};

export default EventManager;
