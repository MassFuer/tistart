import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { eventsAPI, messagingAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "../../context/NavigationContext";
import { toast } from "sonner";
import Loading from "../common/Loading";
import EmptyState from "../common/EmptyState";
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
import Pagination from "../common/Pagination";

const EventManagement = ({ isAdmin = false }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveScrollPosition } = useNavigation();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Attendees Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [isAttendeesOpen, setIsAttendeesOpen] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [user, isAdmin, page, limit]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (!isAdmin && user.artistStatus !== 'verified') {
          setLoading(false);
          return;
      }

      let response;
      const params = { page, limit };

      if (isAdmin) {
        // Admin: Fetch ALL events
        response = await eventsAPI.getAll(params);
      } else {
        // Artist: Fetch only their own events
        // Logic currently uses eventsAPI.getAll({ artist: user._id })
        // We will pass pagination params here too
        response = await eventsAPI.getAll({ artist: user._id, ...params });
      }

      setEvents(response.data.data);
      if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      console.error("Failed to fetch events", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && user.artistStatus !== 'verified') {
      if (user.artistStatus === 'pending') {
          return (
            <EmptyState 
                message="Application Under Review" 
                description="We are currently reviewing your artist application. We'll notify you via email once a decision has been made."
            />
          );
      }

      return (
          <EmptyState 
            message="Artist Verification Required" 
            description="You need to complete your artist profile and get verified before you can manage events."
            action={
                <Button asChild>
                    <Link to="/apply-artist">Complete Application</Link>
                </Button>
            }
          />
      );
  }

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
           <h3 className="text-lg font-medium">{isAdmin ? "All Events" : "Your Events"}</h3>
           <p className="text-sm text-muted-foreground">
               {isAdmin ? "Manage all platform events and view attendee lists." : "Manage your exhibitions and view attendee lists."}
           </p>
        </div>
        <Button onClick={() => { saveScrollPosition(); navigate("/events/new"); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Event Name</TableHead>
              {isAdmin && <TableHead>Organizer</TableHead>}
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Attendees</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                     <Loading message="Loading events..." />
                  </TableCell>
                </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-muted-foreground">
                  {isAdmin ? "No events found." : "You haven't created any events yet."}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                      {event.images?.[0] || event.image ? (
                           <Link to={`/events/${event._id}`} className="block h-12 w-12 rounded overflow-hidden bg-muted">
                              <img 
                                src={event.images?.[0] || event.image} 
                                alt="" 
                                className="h-full w-full object-cover hover:scale-105 transition-transform" 
                              />
                           </Link>
                      ) : (
                          <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                              <Calendar className="h-6 w-6 text-muted-foreground opacity-50" />
                          </div>
                      )}
                  </TableCell>
                  <TableCell className="font-medium">
                      <Link to={`/events/${event._id}`} className="hover:underline text-foreground">
                          {event.title}
                      </Link>
                  </TableCell>
                  {isAdmin && (
                      <TableCell>
                          <Link
                              to={`/artists/${event.artist?._id}`}
                              className="text-sm hover:underline text-muted-foreground"
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
      
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={limit}
        onItemsPerPageChange={setLimit}
      />

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
