import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { artworksAPI, eventsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./ArtistDashboard.css";

const ArtistDashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    artworks: 0,
    events: 0,
  });
  const [recentArtworks, setRecentArtworks] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Prepare query params based on role
      const params = { limit: 5 };
      if (!isAdmin) {
        params.artist = user._id;
      }

      const [artworksRes, eventsRes] = await Promise.all([
        artworksAPI.getAll(params),
        eventsAPI.getAll(params),
      ]);

      setRecentArtworks(artworksRes.data.data);
      setUpcomingEvents(eventsRes.data.data);
      setStats({
        artworks: artworksRes.data.pagination.total,
        events: eventsRes.data.pagination.total,
      });
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="artist-dashboard">
      <div className="dashboard-header">
        <h1>{isAdmin ? "Admin Dashboard" : "Artist Dashboard"}</h1>
        <p>Welcome back, {user?.artistInfo?.companyName || user?.firstName}!</p>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Artworks</h3>
          <p className="stat-number">{stats.artworks}</p>
          <Link to="/my-artworks" className="stat-link">
            View all
          </Link>
        </div>
        <div className="stat-card">
          <h3>Events</h3>
          <p className="stat-number">{stats.events}</p>
          <Link to="/events" className="stat-link">
            View all
          </Link>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/artworks/new" className="btn btn-primary">
          + New Artwork
        </Link>
        <Link to="/events/new" className="btn btn-secondary">
          + New Event
        </Link>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Recent Artworks</h2>
            <Link to="/my-artworks">View All</Link>
          </div>

          {recentArtworks.length === 0 ? (
            <div className="empty-state">
              <p>No artworks yet</p>
              <Link to="/artworks/new" className="btn btn-primary">
                Create your first artwork
              </Link>
            </div>
          ) : (
            <div className="recent-list">
              {recentArtworks.map((artwork) => (
                <div key={artwork._id} className="recent-item">
                  <div className="item-image">
                    {artwork.images?.[0] ? (
                      <img src={artwork.images[0]} alt={artwork.title} />
                    ) : (
                      <div className="no-image-small">No img</div>
                    )}
                  </div>
                  <div className="item-info">
                    <h4>{artwork.title}</h4>
                    <span className="item-category">{artwork.category}</span>
                  </div>
                  <Link to={`/artworks/${artwork._id}/edit`} className="btn btn-small">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Upcoming Events</h2>
            <Link to="/events">View All</Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="empty-state">
              <p>No events yet</p>
              <Link to="/events/new" className="btn btn-primary">
                Create your first event
              </Link>
            </div>
          ) : (
            <div className="recent-list">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="recent-item">
                  <div className="item-image">
                    {event.image ? (
                      <img src={event.image} alt={event.title} />
                    ) : (
                      <div className="no-image-small">No img</div>
                    )}
                  </div>
                  <div className="item-info">
                    <h4>{event.title}</h4>
                    <span className="item-date">
                      {new Date(event.startDateTime).toLocaleDateString()}
                    </span>
                  </div>
                  <Link to={`/events/${event._id}/edit`} className="btn btn-small">
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ArtistDashboard;