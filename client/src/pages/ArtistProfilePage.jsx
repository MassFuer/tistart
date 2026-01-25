import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { usersAPI, artworksAPI } from "../services/api";
import ArtworkCard from "../components/artwork/ArtworkCard";
import LocationDisplay from "../components/map/LocationDisplay";
import toast from "react-hot-toast";
import "./ArtistProfilePage.css";

const ArtistProfilePage = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [artworks, setArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchArtistData();
  }, [id]);

  const fetchArtistData = async () => {
    try {
      const [artistRes, artworksRes] = await Promise.all([
        usersAPI.getArtistProfile(id),
        artworksAPI.getAll({ limit: 50 }),
      ]);

      setArtist(artistRes.data.data);

      // Filter artworks by this artist
      const artistArtworks = artworksRes.data.data.filter((a) => a.artist?._id === id);
      setArtworks(artistArtworks);
    } catch (error) {
      toast.error("Failed to load artist profile");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!artist) {
    return <div className="error">Artist not found</div>;
  }

  return (
    <div className="artist-profile-page">
      <div className="artist-header">
        <div className="artist-avatar">
          {artist.artistInfo?.logo || artist.profilePicture ? (
            <img src={artist.artistInfo?.logo || artist.profilePicture} alt={artist.artistInfo?.companyName} />
          ) : (
            <div className="avatar-placeholder">
              {artist.firstName?.[0]}
              {artist.lastName?.[0]}
            </div>
          )}
        </div>

        <div className="artist-info">
          <h1>{artist.artistInfo?.companyName || `${artist.firstName} ${artist.lastName}`}</h1>
          {artist.artistInfo?.tagline && <p className="tagline">{artist.artistInfo.tagline}</p>}

          {artist.artistInfo?.address && (
            <p className="location">
              {artist.artistInfo.address.city}, {artist.artistInfo.address.country}
            </p>
          )}

          {artist.artistInfo?.socialMedia && (
            <div className="social-links">
              {artist.artistInfo.socialMedia.website && (
                <a
                  href={artist.artistInfo.socialMedia.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="Website"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </a>
              )}
              {artist.artistInfo.socialMedia.instagram && (
                <a
                  href={artist.artistInfo.socialMedia.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="Instagram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              )}
              {artist.artistInfo.socialMedia.facebook && (
                <a
                  href={artist.artistInfo.socialMedia.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="Facebook"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              )}
              {artist.artistInfo.socialMedia.twitter && (
                <a
                  href={artist.artistInfo.socialMedia.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="Twitter/X"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {artist.artistInfo?.description && (
        <section className="artist-section">
          <h2>About</h2>
          <p>{artist.artistInfo.description}</p>
        </section>
      )}

      {/* Location Section */}
      {artist.artistInfo?.address && (artist.artistInfo.address.city || artist.artistInfo.address.street) && (
        <section className="artist-section">
          <h2>Studio Location</h2>
          <LocationDisplay
            address={{
              street: artist.artistInfo.address.street,
              streetNum: artist.artistInfo.address.streetNum,
              zipCode: artist.artistInfo.address.zipCode,
              city: artist.artistInfo.address.city,
              country: artist.artistInfo.address.country,
            }}
            coordinates={
              artist.artistInfo.address.location?.coordinates?.length === 2
                ? {
                    lat: artist.artistInfo.address.location.coordinates[1],
                    lng: artist.artistInfo.address.location.coordinates[0],
                  }
                : null
            }
            showMap={true}
            height="250px"
            layout="horizontal"
          />
        </section>
      )}

      <section className="artist-section">
        <h2>Artworks ({artworks.length})</h2>
        {artworks.length === 0 ? (
          <p className="empty-message">No artworks yet</p>
        ) : (
          <div className="artwork-grid">
            {artworks.map((artwork) => (
              <ArtworkCard key={artwork._id} artwork={artwork} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default ArtistProfilePage;