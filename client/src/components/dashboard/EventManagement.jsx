import { useState, useEffect, Fragment } from "react";
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
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronRight,
  ChevronDown,
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
import { useTableGrouping } from "../../hooks/useTableGrouping";
import TableGroupingControls from "../common/TableGroupingControls";

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

  // Sorting State
  const [sortConfig, setSortConfig] = useState({
    key: "startDateTime",
    direction: "desc",
  });

  useEffect(() => {
    fetchEvents();
  }, [user, isAdmin, page, limit, sortConfig]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      if (!isAdmin && user.artistStatus !== "verified") {
        setLoading(false);
        return;
      }

      let response;
      const sortParam =
        sortConfig.direction === "desc" ? `-${sortConfig.key}` : sortConfig.key;
      const params = { page, limit, sort: sortParam };

      if (isAdmin) {
        response = await eventsAPI.getAll(params);
      } else {
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

  const {
    groupBy,
    setGroupBy,
    groupedData: groupedEvents,
    expandedGroups,
    toggleGroup,
    expandAll,
    collapseAll,
  } = useTableGrouping(events);

  const groupOptions = [
    { label: "None", value: null },
    { label: "Organizer", value: "artist.artistInfo.companyName" },
    { label: "Date", value: "startDateTime" },
    { label: "Country", value: "location.country" },
    { label: "City", value: "location.city" },
  ];

  const handleSort = (key) => {
    let sortKey = key;
    if (key === "attendees") sortKey = "attendeesCount";

    setSortConfig((current) => ({
      key: sortKey,
      direction:
        current.key === sortKey && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key) => {
    let sortKey = key;
    if (key === "attendees") sortKey = "attendeesCount";

    if (sortConfig.key !== sortKey)
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-2 h-3 w-3" />
    );
  };

  if (!isAdmin && user.artistStatus !== "verified") {
    if (user.artistStatus === "pending") {
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
      const response = await messagingAPI.createConversation({
        participantId: attendee._id,
      });

      const conversationId = response.data._id || response.data.data?._id;
      navigate(`/messages?conversation=${conversationId}`);
      setIsAttendeesOpen(false);
    } catch (error) {
      console.error("Failed to start conversation", error);
      toast.error("Failed to open messaging");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      await eventsAPI.delete(eventId);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TableGroupingControls
            groupBy={groupBy}
            setGroupBy={setGroupBy}
            options={groupOptions}
            onExpandAll={expandAll}
            onCollapseAll={collapseAll}
          />
        </div>
        <Button
          onClick={() => {
            saveScrollPosition();
            navigate("/events/new");
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Create Event
        </Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("title")}
              >
                <div className="flex items-center">
                  Event Name {getSortIcon("title")}
                </div>
              </TableHead>
              {isAdmin && (
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("organizer")}
                >
                  <div className="flex items-center">
                    Organizer {getSortIcon("organizer")}
                  </div>
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("startDateTime")}
              >
                <div className="flex items-center">
                  Date {getSortIcon("startDateTime")}
                </div>
              </TableHead>
              <TableHead>Location</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("attendees")}
              >
                <div className="flex items-center">
                  Attendees {getSortIcon("attendees")}
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center py-8"
                >
                  <Loading message="Loading events..." />
                </TableCell>
              </TableRow>
            ) : groupBy ? (
              Object.entries(groupedEvents).map(([groupName, groupItems]) => {
                const isExpanded = expandedGroups[groupName];
                const displayGroupName =
                  groupBy === "startDateTime"
                    ? new Date(groupName).toLocaleDateString()
                    : groupName;

                return (
                  <Fragment key={groupName}>
                    <TableRow
                      className="bg-muted/10 hover:bg-muted/20 border-y cursor-pointer transition-colors"
                      onClick={() => toggleGroup(groupName)}
                    >
                      <TableCell
                        colSpan={isAdmin ? 7 : 6}
                        className="py-2 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/5"
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          {displayGroupName} ({groupItems.length})
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded &&
                      groupItems.map((event) => (
                        <TableRow key={event._id}>
                          <TableCell>
                            {event.images?.[0] || event.image ? (
                              <Link
                                to={`/events/${event._id}`}
                                className="block h-12 w-12 rounded overflow-hidden bg-muted"
                              >
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
                            <Link
                              to={`/events/${event._id}`}
                              className="hover:underline text-foreground"
                            >
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
                                  `${event.artist?.firstName || ""} ${event.artist?.lastName || ""}`.trim() ||
                                  "Unknown Organizer"}
                              </Link>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-col text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {new Date(
                                  event.startDateTime,
                                ).toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(
                                  event.startDateTime,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {event.isOnline
                                ? "Online Event"
                                : event.location?.address || "TBA"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewAttendees(event)}
                            >
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
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate(`/events/${event._id}/edit`)
                                  }
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleViewAttendees(event)}
                                >
                                  <Users className="mr-2 h-4 w-4" /> View
                                  Attendees
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteEvent(event._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 7 : 6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {isAdmin
                    ? "No events found."
                    : "You haven't created any events yet."}
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    {event.images?.[0] || event.image ? (
                      <Link
                        to={`/events/${event._id}`}
                        className="block h-12 w-12 rounded overflow-hidden bg-muted"
                      >
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
                    <Link
                      to={`/events/${event._id}`}
                      className="hover:underline text-foreground"
                    >
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
                          `${event.artist?.firstName || ""} ${event.artist?.lastName || ""}`.trim() ||
                          "Unknown Organizer"}
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
                        {new Date(event.startDateTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {event.isOnline
                        ? "Online Event"
                        : event.location?.address || "TBA"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewAttendees(event)}
                    >
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
                        <DropdownMenuItem
                          onClick={() => navigate(`/events/${event._id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleViewAttendees(event)}
                        >
                          <Users className="mr-2 h-4 w-4" /> View Attendees
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteEvent(event._id)}
                          className="text-red-600"
                        >
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
      />

      {/* Attendees Modal */}
      <Dialog open={isAttendeesOpen} onOpenChange={setIsAttendeesOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Event Attendees</DialogTitle>
            <DialogDescription>
              {selectedEvent?.title} -{" "}
              {new Date(selectedEvent?.startDateTime).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {attendeesLoading ? (
              <div className="py-8 flex justify-center">
                <Loading message="Fetching attendees..." />
              </div>
            ) : attendees.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No attendees registered yet.
              </div>
            ) : (
              <div className="space-y-4">
                {attendees.map((attendee) => {
                  const attendeeUser = attendee.user;
                  if (!attendeeUser) return null;

                  return (
                    <div
                      key={attendeeUser._id}
                      className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={
                              attendeeUser.avatar || attendeeUser.profilePicture
                            }
                          />
                          <AvatarFallback>
                            {attendeeUser.firstName?.[0]}
                            {attendeeUser.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {attendeeUser.firstName && attendeeUser.lastName
                              ? `${attendeeUser.firstName} ${attendeeUser.lastName}`
                              : attendeeUser.userName || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {attendeeUser.email}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleMessageAttendee(attendeeUser)}
                        title="Message Attendee"
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
