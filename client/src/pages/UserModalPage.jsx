import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import UserDetailModal from "../components/admin/UserDetailModal";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/common/Loading";

const UserModalPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Only superAdmins can access this page
  useEffect(() => {
    if (!user || user.role !== "superAdmin") {
      navigate("/");
    }
  }, [user, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    // Redirect to admin users tab after closing
    navigate("/admin?tab=users");
  };

  if (!user || user.role !== "superAdmin") {
    return <Loading />;
  }

  return (
    <UserDetailModal
      userId={userId}
      onClose={handleClose}
      onUpdate={() => {}}
      onDelete={() => navigate("/admin?tab=users")}
    />
  );
};

export default UserModalPage;
