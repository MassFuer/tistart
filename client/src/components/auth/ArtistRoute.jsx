import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ArtistRoute = ({ children }) => {
  const { isAuthenticated, isVerifiedArtist, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isVerifiedArtist && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ArtistRoute;