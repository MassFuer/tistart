import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const SuperAdminRoute = ({ children }) => {
  const { isAuthenticated, isSuperAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default SuperAdminRoute;