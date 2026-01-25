import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="home-page">
      <section className="hero">
        <h1>Welcome to Nemesis</h1>
        <p>Discover and collect unique artworks from talented artists worldwide</p>

        <div className="hero-actions">
          <Link to="/gallery" className="btn btn-primary">
            Explore Gallery
          </Link>
          <Link to="/events" className="btn btn-secondary">
            View Events
          </Link>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="cta-section">
          <h2>Are you an artist?</h2>
          <p>Join our community and showcase your work to art lovers around the world</p>
          <Link to="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </section>
      )}

      {isAuthenticated && user?.artistStatus === "none" && (
        <section className="cta-section">
          <h2>Become an Artist</h2>
          <p>Apply to become a verified artist and start selling your artworks</p>
          <Link to="/apply-artist" className="btn btn-primary">
            Apply Now
          </Link>
        </section>
      )}

      {isAuthenticated && user?.artistStatus === "pending" && (
        <section className="status-section">
          <h2>Application Pending</h2>
          <p>Your artist application is being reviewed. We&apos;ll notify you once approved.</p>
        </section>
      )}
    </div>
  );
};

export default HomePage;
