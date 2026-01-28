import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const { startConversation } = useMessaging();
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show if viewing own profile/artwork
  if (user?._id === artistId) return null;

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to contact the artist");
      navigate("/login");
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
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <MessageCircle className="h-4 w-4 mr-2" />
          Contact Artist
        </>
      )}
    </Button>
  );
};

export default StartConversationButton;