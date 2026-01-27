import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eventsAPI, messagingAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import Loading from "../common/Loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Calendar,
    MapPin,
    Users,
    MessageCircle,
    Edit,
    Trash2,
    Plus,
    MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const EventManagement = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Attendees Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [user, isAdmin]);

  const fetchEvents = async () => {
    try {
      if (isAdmin) {
        // Admin: Fetch ALL events from the platform (no artist filter)
        const response = await eventsAPI.getAll({ limit: 100 });
        setEvents(response.data.data);
      } else {
        // Artist: Fetch only their own events
        const response = await eventsAPI.getAll({ artist: user._id, limit: 100 });
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleViewAttendees = async (event) => {
    setSelectedEvent(event);
    setIsAttendeesOpen(true);
    setAttendeesLoading(true);
    try {
      const response = await eventsAPI.getAttendees(event._id);
      setAttendees(response.data.data);
    } catch (error) {
      console.error("Failed to fetch attendees", error);
      toast.error("Failed to load attendees");
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  };

  const handleMessageAttendee = async (attendee) => {
    try {
      // 1. Check if conversation exists or create one
      // We'll use the generic createConversation which usually handles "get existing or create new" logic
      const response = await messagingAPI.createConversation({
        recipientId: attendee._id
      });

      const conversationId = response.data.data._id;

      // 2. Navigate to messages page with this conversation selected
      navigate(`/messages?conversation=${conversationId}`);

      // Close modal
      setIsAttendeesOpen(false);
    } catch (error) {
      console.error("Failed to start conversation", error);
      toast.error("Failed to open messaging");
    }
  };

  const handleDeleteEvent = async (eventId) => {
      if(!confirm("Are you sure you want to delete this event?")) return;

      try {
          await eventsAPI.delete(eventId);
          toast.success("Event deleted");
          fetchEvents();
      } catch (error) {
          toast.error("Failed to delete event");
      }
  }

  if (loading) return <Loading message="Loading your events..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-lg font-medium">{isAdmin ? "All Events" : "Your Events"}</h3>
           <p className="text-sm text-muted-foreground">
               {isAdmin ? "Manage all platform events and view attendee lists." : "Manage your exhibitions and view attendee lists."}
           </p>
        </div>
        <Button onClick={() => navigate("/events/new")}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              {isAdmin && <TableHead>Organizer</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                  {isAdmin ? "No events found." : "You haven't created any events yet."}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                          {event.images?.[0] && (
                              <img src={event.images[0]} alt="" className="h-10 w-10 rounded-md object-cover bg-muted" />
                          )}
                          <Link to={`/events/${event._id}`} className="hover:underline">
                              {event.title}
                          </Link>
                      </div>
                  </TableCell>
                  {isAdmin && (
                      <TableCell>
                          <Link
                              to={`/artists/${event.artist?._id}`}
                              className="text-sm hover:underline text-primary"
                          >
                              {event.artist?.artistInfo?.companyName ||
                               `${event.artist?.firstName || ''} ${event.artist?.lastName || ''}`.trim() ||
                               'Unknown Organizer'}
                          </Link>
                      </TableCell>
                  )}
                  <TableCell>
                      <div className="flex flex-col text-sm">
                          <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {new Date(event.startDateTime).toLocaleDateString()}
                          </span>
                          <span className="text-xs text-muted-foreground">
                              {new Date(event.startDateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                      </div>
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {event.isOnline ? "Online Event" : event.location?.address || "TBA"}
                      </div>
                  </TableCell>
                  <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleViewAttendees(event)}>
                          <Users className="mr-2 h-3 w-3" />
                          {event.attendees?.length || 0}
                      </Button>
                  </TableCell>
                  <TableCell className="text-right">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/events/${event._id}/edit`)}>
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewAttendees(event)}>
                                  <Users className="mr-2 h-4 w-4" /> View Attendees
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteEvent(event._id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ATTENDEES DIALOG */}
      <Dialog open={isAttendeesOpen} onOpenChange={setIsAttendeesOpen}>
          <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
              <DialogHeader>
                  <DialogTitle>Attendees for "{selectedEvent?.title}"</DialogTitle>
                  <DialogDescription>
                      Total confirmed: {attendees.length}
                  </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4">
                  {attendeesLoading ? (
                      <Loading message="Loading attendees..." />
                  ) : attendees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                          No attendees yet.
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {attendees.map((attendee) => {
                              // API returns { user: {...}, status: "confirmed" }
                              // Handle case where user might be null (deleted user)
                              const user = attendee.user;
                              
                              if (!user) {
                                  return (
                                      <div key={attendee._id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                          <div className="flex items-center gap-3">
                                              <Avatar>
                                                  <AvatarFallback>?</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <p className="font-medium text-sm text-muted-foreground">Unknown User</p>
                                                  <p className="text-xs text-muted-foreground">User may have been deleted</p>
                                              </div>
                                          </div>
                                      </div>
                                  );
                              }

                              return (
                                  <div key={user._id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                      <div className="flex items-center gap-3">
                                          <Avatar>
                                              <AvatarImage src={user.profilePicture} />
                                              <AvatarFallback>{user.firstName?.[0] || "?"}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                              <p className="font-medium text-sm">{user.firstName} {user.lastName}</p>
                                              <p className="text-xs text-muted-foreground">{user.email}</p>
                                          </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleMessageAttendee(user)}
                                      >
                                          <MessageCircle className="h-4 w-4" />
                                      </Button>
                                  </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManagement;
