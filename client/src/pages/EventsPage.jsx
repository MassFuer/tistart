import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { eventsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/event/EventCard";
import EventsMap from "../components/map/EventsMap";
import Loading from "../components/common/Loading";
import ErrorMessage from "../components/common/ErrorMessage";
import EmptyState from "../components/common/EmptyState";
import { FaList, FaCalendarAlt, FaMapMarkedAlt } from "react-icons/fa";
import FilterBar from "../components/events/FilterBar";
import SearchBar from "../components/events/SearchBar";
import toast from "react-hot-toast";
import "./EventsPage.css";

const EventsPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [allEventsForMap, setAllEventsForMap] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'calendar', or 'map'
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    category: "",
  });
  // Additional filter state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({});

  const categories = ["exhibition", "concert", "workshop", "meetup", "other"];

  useEffect(() => {
    fetchEvents();
  }, [filters.page, filters.category, startDate, endDate, searchQuery]);

  useEffect(() => {
    if (viewMode === "calendar") {
      fetchCalendarEvents();
    } else if (viewMode === "map") {
      fetchAllEventsForMap();
    }
  }, [viewMode, filters.category, startDate, endDate, searchQuery]);

  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.category) params.category = filters.category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery) params.search = searchQuery;

      const response = await eventsAPI.getAll(params);
      setEvents(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error(error);
      setError("Failed to load events. Please try again later.");
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCalendarEvents = async () => {
    try {
      // Get date range for calendar (current month ± 1 month for buffer)
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 12, 0);

      const response = await eventsAPI.getCalendar({
        start: start.toISOString(),
        end: end.toISOString(),
        ...(filters.category && { category: filters.category }),
        ...(searchQuery && { search: searchQuery }),
      });

      const formattedEvents = response.data.data.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        url: `/events/${event.id}`,
        backgroundColor: getCategoryColor(event.extendedProps?.category),
      }));
      setCalendarEvents(formattedEvents);
      console.log('Calendar events loaded:', formattedEvents.length);
    } catch (error) {
      console.error('Calendar fetch error:', error);
      toast.error("Failed to load calendar events");
    }
  };

  const fetchAllEventsForMap = async () => {
    try {
      const params = { limit: 200 }; // Get more events for map
      if (filters.category) params.category = filters.category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery) params.search = searchQuery;

      const response = await eventsAPI.getAll(params);
      setAllEventsForMap(response.data.data);
    } catch (error) {
      toast.error("Failed to load events for map");
    }
  };

  const handleMapEventClick = (event) => {
    navigate(`/events/${event._id}`);
  };

  const getCategoryColor = (category) => {
    const colors = {
      exhibition: "#3498db",
      concert: "#e74c3c",
      workshop: "#2ecc71",
      meetup: "#9b59b6",
      other: "#95a5a6",
    };
    return colors[category] || colors.other;
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setFilters({ ...filters, page: 1 });
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setFilters({ ...filters, page: 1 });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="events-page">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Events</h1>
          <p>Discover upcoming art events, exhibitions, and workshops</p>
        </div>
        {(isVerifiedArtist || isAdmin) && (
          <Link to="/events/new" className="btn btn-primary">
            + Create Event
          </Link>
        )}
      </div>

      <div className="view-toggle">
        <button
          className={`btn view-btn ${viewMode === "grid" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setViewMode("grid")}
          title="Grid View"
        >
          <FaList /> <span>List</span>
        </button>
        <button
          className={`btn view-btn ${viewMode === "map" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setViewMode("map")}
          title="Map View"
        >
          <FaMapMarkedAlt /> <span>Map</span>
        </button>
        <button
          className={`btn view-btn ${viewMode === "calendar" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setViewMode("calendar")}
          title="Calendar View"
        >
          <FaCalendarAlt /> <span>Calendar</span>
        </button>
      </div>

      {viewMode === "grid" && (
        <>
          <>
            <FilterBar
              category={filters.category}
              startDate={startDate}
              endDate={endDate}
              onCategoryChange={handleFilterChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
            <SearchBar value={searchQuery} onSearch={handleSearchChange} />
          </>

          {isLoading ? (
            <Loading message="Loading events..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchEvents} />
          ) : events.length === 0 ? (
            <EmptyState message="No events found" icon="📅" />
          ) : (
            <>
              <div className="event-grid">
                {events.map((event) => (
                  <EventCard key={event._id} event={event} />
                ))}
              </div>

              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="btn btn-secondary"
                  >
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.pages}
                    className="btn btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {viewMode === "calendar" && (
        <>
          <FilterBar
            category={filters.category}
            startDate={startDate}
            endDate={endDate}
            onCategoryChange={handleFilterChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
          />
          <SearchBar value={searchQuery} onSearch={handleSearchChange} />
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek",
              }}
              events={calendarEvents}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                window.location.href = info.event.url;
              }}
              height="auto"
            />
          </div>
        </>
      )}

      {viewMode === "map" && (
        <>
          <>
            <FilterBar
              category={filters.category}
              startDate={startDate}
              endDate={endDate}
              onCategoryChange={handleFilterChange}
              onStartDateChange={handleStartDateChange}
              onEndDateChange={handleEndDateChange}
            />
            <SearchBar value={searchQuery} onSearch={handleSearchChange} />
          </>

          <div className="map-view-container">
            <EventsMap
              events={allEventsForMap}
              height="600px"
              onEventClick={handleMapEventClick}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default EventsPage;