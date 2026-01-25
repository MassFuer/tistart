import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import { eventsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import LocationDisplay from "../components/map/LocationDisplay";
import toast from "react-hot-toast";
import "./EventDetailPage.css";

const EventDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
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
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;

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

  const formatPrice = (price) => {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  if (isLoading) {
    return <Loading message="Loading event details..." />;
  }

  if (error || !event) {
    return (
      <ErrorMessage
        message={error || "Event not found"}
        onRetry={fetchEvent}
      />
    );
  }

  const isFull = event.maxCapacity > 0 && event.currentAttendees >= event.maxCapacity;
  const isPast = new Date(event.endDateTime) < new Date();

  return (
    <div className="event-detail-page">
      <div className="event-detail">
        <div className="event-header">
          {event.image && (
            <div className="event-image">
              <img src={event.image} alt={event.title} />
            </div>
          )}

          <div className="event-header-info">
            <span className={`category-badge ${event.category}`}>{event.category}</span>
            <h1>{event.title}</h1>

            <Link to={`/artists/${event.artist?._id}`} className="artist-link">
              by {event.artist?.artistInfo?.companyName || `${event.artist?.firstName} ${event.artist?.lastName}`}
            </Link>
          </div>
        </div>

        <div className="event-content">
          <div className="event-main">
            <section className="event-section">
              <h2>About this event</h2>
              <p>{event.description}</p>
            </section>

            <section className="event-section">
              <h2>Date & Time</h2>
              <div className="datetime-info">
                <div className="datetime-row">
                  <strong>Start:</strong>
                  <span>
                    {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                  </span>
                </div>
                <div className="datetime-row">
                  <strong>End:</strong>
                  <span>
                    {formatDate(event.endDateTime)} at {formatTime(event.endDateTime)}
                  </span>
                </div>
              </div>
            </section>

            <section className="event-section">
              <h2>Location</h2>
              {event.location?.isOnline ? (
                <div className="location-info online">
                  <span className="online-badge">Online Event</span>
                  {event.location.onlineUrl && (
                    <a href={event.location.onlineUrl} target="_blank" rel="noopener noreferrer" className="event-link">
                      Join Online
                    </a>
                  )}
                </div>
              ) : (
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
                  height="250px"
                  layout="vertical"
                />
              )}
            </section>
          </div>

          <div className="event-sidebar">
            <div className="event-card-info">
              <div className="price-info">
                <span className="label">Price</span>
                <span className="value">{formatPrice(event.price)}</span>
              </div>

              {event.maxCapacity > 0 && (
                <div className="capacity-info">
                  <span className="label">Capacity</span>
                  <span className="value">
                    {event.currentAttendees} / {event.maxCapacity}
                  </span>
                  <div className="progress-bar">
                    <div
                      className="progress"
                      style={{ width: `${(event.currentAttendees / event.maxCapacity) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {canManage && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  <Link to={`/events/${id}/edit`} className="btn btn-secondary" style={{ textAlign: "center" }}>
                    Edit Event
                  </Link>
                  <button
                    onClick={async () => {
                      if (window.confirm("Are you sure you want to delete this event?")) {
                        try {
                          await eventsAPI.delete(id);
                          toast.success("Event deleted successfully");
                          window.location.href = "/events";
                        } catch (error) {
                          toast.error("Failed to delete event");
                        }
                      }
                    }}
                    className="btn btn-danger"
                  >
                    Delete Event
                  </button>
                  <button onClick={toggleAttendees} className="btn btn-outline">
                    {showAttendees ? "Hide Attendees" : "View Attendees"}
                  </button>
                </div>
              )}

              {/* Attendee List (for admin/owner) */}
              {showAttendees && (
                <div className="attendees-list">
                  <h3>Registered Attendees ({attendees.length})</h3>
                  {attendees.length === 0 ? (
                    <p>No attendees yet.</p>
                  ) : (
                    <ul className="attendee-items">
                      {attendees.map((att) => (
                        <li key={att._id} className="attendee-item">
                           <div className="attendee-avatar">
                             {att.profilePicture ? (
                               <img src={att.profilePicture} alt={att.userName} />
                             ) : (
                               <div className="avatar-placeholder">{att.firstName?.[0]}</div>
                             )}
                           </div>
                           <div className="attendee-info">
                             <span className="attendee-name">{att.firstName} {att.lastName}</span>
                             <span className="attendee-email">{att.email}</span>
                           </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="registration-status-card">
                <h3>Registration</h3>
                {!isAuthenticated ? (
                  <div className="auth-prompt">
                    <p>Please login to register for this event.</p>
                    <Link to="/login" className="btn btn-primary">Login to Join</Link>
                  </div>
                ) : isAttending ? (
                  <div className="registered-status">
                    <div className="status-badge success">✓ You are registered</div>
                    <button 
                      onClick={handleLeave} 
                      className="btn btn-text-danger"
                      disabled={isJoining}
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : isFull ? (
                   <div className="status-badge error">Event is Full</div>
                ) : isPast ? (
                   <div className="status-badge disabled">Event Ended</div>
                ) : (
                  <button 
                    onClick={handleJoin} 
                    className="btn btn-primary btn-block"
                    disabled={isJoining}
                  >
                    {isJoining ? "Joining..." : "Join Event"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;