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
import Pagination from "../components/common/Pagination";
import SearchBar from "../components/common/SearchBar";
import { FaList, FaCalendarAlt, FaMapMarkedAlt } from "react-icons/fa";
import FilterBar from "../components/events/FilterBar";
import toast from "react-hot-toast";
import { useListing } from "../hooks/useListing";
import "./EventsPage.css";

const EventsPage = () => {
  const { isVerifiedArtist, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid"); // 'grid', 'calendar', or 'map'

  // Grid view state managed by hook
  const {
    data: events,
    loading: isLoading,
    error,
    pagination,
    filters,
    updateFilter,
    setPage,
    refresh
  } = useListing({
    apiFetcher: eventsAPI.getAll,
    initialFilters: {
      category: "",
      startDate: "",
      endDate: "",
      search: "",
    },
    enabled: viewMode === "grid",
  });

  // Separate state for Map and Calendar views
  const [allEventsForMap, setAllEventsForMap] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Fetch specialized data for non-grid views
  useEffect(() => {
    if (viewMode === "calendar") {
      fetchCalendarEvents();
    } else if (viewMode === "map") {
      fetchAllEventsForMap();
    }
  }, [viewMode, filters.category, filters.startDate, filters.endDate, filters.search]);

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
        ...(filters.search && { search: filters.search }),
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
    } catch (error) {
      console.error('Calendar fetch error:', error);
      toast.error("Failed to load calendar events");
    }
  };

  const fetchAllEventsForMap = async () => {
    try {
      const params = { limit: 200 }; // Get more events for map
      if (filters.category) params.category = filters.category;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.search) params.search = filters.search;

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

  // Handlers for FilterBar
  const handleCategoryChange = (e) => updateFilter("category", e.target.value);
  const handleStartDateChange = (e) => updateFilter("startDate", e.target.value);
  const handleEndDateChange = (e) => updateFilter("endDate", e.target.value);
  const handleSearchChange = (value) => updateFilter("search", value);

  // Render content based on view mode
  const renderContent = () => {
    if (viewMode === "grid") {
      if (isLoading) return <Loading message="Loading events..." />;
      if (error) return <ErrorMessage message={error} onRetry={refresh} />;
      if (events.length === 0) return <EmptyState message="No events found" icon="📅" />;

      return (
        <>
          <div className="event-grid">
            {events.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </>
      );
    }

    if (viewMode === "calendar") {
      return (
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
      );
    }

    if (viewMode === "map") {
      return (
        <div className="map-view-container">
          <EventsMap
            events={allEventsForMap}
            height="600px"
            onEventClick={handleMapEventClick}
          />
        </div>
      );
    }
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

      {/* Common Filters for all views */}
      <FilterBar
        category={filters.category}
        startDate={filters.startDate}
        endDate={filters.endDate}
        onCategoryChange={handleCategoryChange}
        onStartDateChange={handleStartDateChange}
        onEndDateChange={handleEndDateChange}
      />
      <SearchBar
        value={filters.search}
        onSearch={handleSearchChange}
        placeholder="Search events..."
      />

      {renderContent()}
    </div>
  );
};

export default EventsPage;
