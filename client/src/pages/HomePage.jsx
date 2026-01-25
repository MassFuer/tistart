import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { artworksAPI } from "../services/api";
import "./HomePage.css";

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const [featuredArtworks, setFeaturedArtworks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await artworksAPI.getAll({ limit: 6, sort: '-createdAt' });
        setFeaturedArtworks(response.data.data);
      } catch (error) {
        console.error('Error fetching featured artworks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="home-page">
      <motion.section 
        className="hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Welcome to Nemesis
        </motion.h1>
        <motion.p
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          Discover and collect unique artworks from talented artists worldwide
        </motion.p>

        <motion.div 
          className="hero-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Link to="/gallery" className="btn btn-primary">
            Explore Gallery
          </Link>
          <Link to="/events" className="btn btn-primary">
            View Events
          </Link>
        </motion.div>
      </motion.section>

      {/* Featured Artworks Section */}
      {!loading && featuredArtworks.length > 0 && (
        <section className="featured-section">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Featured Artworks
          </motion.h2>
          
          <div className="featured-grid">
            {featuredArtworks.map((artwork, i) => (
              <motion.div
                key={artwork._id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Link to={`/artworks/${artwork._id}`} className="featured-card">
                  <img 
                    src={artwork.images[0]} 
                    alt={artwork.title}
                    loading="lazy"
                  />
                  <div className="featured-card-content">
                    <h3>{artwork.title}</h3>
                    <p>
                      {artwork.artist?.firstName} {artwork.artist?.lastName}
                    </p>
                    <span className="category-badge">{artwork.category}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {!isAuthenticated && (
        <motion.section 
          className="cta-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Are you an artist?</h2>
          <p>Join our community and showcase your work to art lovers around the world</p>
          <Link to="/signup" className="btn btn-primary">
            Get Started
          </Link>
        </motion.section>
      )}

      {isAuthenticated && user?.artistStatus === "none" && (
        <motion.section 
          className="cta-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Become an Artist</h2>
          <p>Apply to become a verified artist and start selling your artworks</p>
          <Link to="/apply-artist" className="btn btn-primary">
            Apply Now
          </Link>
        </motion.section>
      )}

      {isAuthenticated && user?.artistStatus === "pending" && (
        <motion.section 
          className="status-section"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2>Application Pending</h2>
          <p>Your artist application is being reviewed. We&apos;ll notify you once approved.</p>
        </motion.section>
      )}
    </div>
  );
};

export default HomePage;
