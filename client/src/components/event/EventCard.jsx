import { Link } from "react-router-dom";
import { format } from "date-fns";
import "./EventCard.css";

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

  return (
    <div className="event-card">
      <Link to={`/events/${event._id}`}>
        <div className="event-image">
          {event.image ? (
            <img src={event.image} alt={event.title} />
          ) : (
            <div className="no-image">No Image</div>
          )}
          <span className={`category-badge ${event.category}`}>{event.category}</span>
        </div>

        <div className="event-info">
          <div className="event-date">
            <span className="date">{formatDate(event.startDateTime)}</span>
            <span className="time">{formatTime(event.startDateTime)}</span>
          </div>

          <h3 className="event-title">{event.title}</h3>

          <p className="event-artist">
            by {event.artist?.artistInfo?.companyName || `${event.artist?.firstName} ${event.artist?.lastName}`}
          </p>

          <div className="event-location">
            {event.location?.isOnline ? (
              <span className="online-badge">Online Event</span>
            ) : (
              <span>
                {event.location?.venue}, {event.location?.city}
              </span>
            )}
          </div>

          <div className="event-footer">
            <span className="event-price">{formatPrice(event.price)}</span>
            {event.maxCapacity > 0 && (
              <span className="event-capacity">
                {event.currentAttendees}/{event.maxCapacity} attending
              </span>
            )}
          </div>
        </div>
      </Link>

      {showActions && (
        <div className="event-actions">
          <Link to={`/events/${event._id}/edit`} className="btn btn-small">
            Edit
          </Link>
          {onDelete && (
            <button onClick={() => onDelete(event._id)} className="btn btn-small btn-danger">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default EventCard;