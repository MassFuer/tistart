import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const ArtistRoute = ({ children }) => {
  const { isAuthenticated, isVerifiedArtist, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="loading border-t-2 border-primary h-12 w-12 rounded-full animate-spin mx-auto mt-20"></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (!isVerifiedArtist && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ArtistRoute;