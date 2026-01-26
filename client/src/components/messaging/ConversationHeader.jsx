import { useMessaging } from "../../context/MessagingContext";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { ArrowLeft, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Link } from "react-router-dom";

const ConversationHeader = ({ onBack }) => {
  const { activeConversation, closeConversation, isUserOnline } = useMessaging();
  const { user } = useAuth();

  if (!activeConversation) return null;

  const otherParticipant = activeConversation.participants?.find(
    (p) => p._id !== user?._id
  );

  if (!otherParticipant) return null;

  const displayName =
    otherParticipant.artistInfo?.companyName ||
    `${otherParticipant.firstName} ${otherParticipant.lastName}`;

  const isOnline = isUserOnline(otherParticipant._id);

  const handleBack = () => {
    closeConversation();
    onBack?.();
  };

  return (
    <div className="flex items-center gap-3 p-4 border-b bg-background">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={handleBack}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Link to={`/artists/${otherParticipant._id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant.profilePicture} alt={displayName} />
            <AvatarFallback>
              {otherParticipant.firstName?.[0]}
              {otherParticipant.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{displayName}</h2>
          <p className="text-sm text-muted-foreground">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </Link>

      {activeConversation.artwork && (
        <Link
          to={`/artworks/${activeConversation.artwork._id}`}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80 transition-colors"
        >
          <span className="text-muted-foreground">About:</span>
          <span className="font-medium truncate max-w-32">
            {activeConversation.artwork.title}
          </span>
        </Link>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to={`/artists/${otherParticipant._id}`}>View Profile</Link>
          </DropdownMenuItem>
          {activeConversation.artwork && (
            <DropdownMenuItem asChild>
              <Link to={`/artworks/${activeConversation.artwork._id}`}>
                View Artwork
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ConversationHeader;