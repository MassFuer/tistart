import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMessaging } from "../../context/MessagingContext";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const StartConversationButton = ({
  artistId,
  artworkId,
  artworkTitle,
  variant = "default",
  size = "default",
  className = "",
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { startConversation } = useMessaging();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if viewing own profile/artwork
  if (user?._id === artistId) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast("Interested by this artwork?", {
        action: {
          label: "Log in here",
          onClick: () => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`),
        },
      });
      return;
    }

    setIsLoading(true);
    try {
      const defaultMessage = artworkTitle
        ? `Hi! I'm interested in your artwork "${artworkTitle}".`
        : "Hi! I'd like to get in touch with you.";

      const conversation = await startConversation(artistId, artworkId, defaultMessage);
      toast.success("Conversation started!");
      navigate(`/messages?conversation=${conversation._id}`);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className={`h-4 w-4 animate-spin ${size !== "icon" ? "mr-2" : ""}`} />
      ) : (
        <MessageCircle className={`h-4 w-4 ${size !== "icon" ? "mr-2" : ""}`} />
      )}
      {size !== "icon" && (isLoading ? "Starting..." : "Contact Artist")}
    </Button>
  );
};

export default StartConversationButton;