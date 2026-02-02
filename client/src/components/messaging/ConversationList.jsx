import { useMessaging } from "../../context/MessagingContext";
import { useAuth } from "../../context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const ConversationList = () => {
  const {
    conversations,
    activeConversation,
    openConversation,
    isLoadingConversations,
    isUserOnline,
  } = useMessaging();
  const { user } = useAuth();

  if (isLoadingConversations) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start a conversation by contacting an artist
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conversation) => {
        // Get the other participant
        const otherParticipant =
          conversation.participants?.find((p) => p._id !== user?._id) ||
          conversation.participants?.[0] ||
          user; // Fallback to current user if no other participant or participants array is empty

        // If for some reason, otherParticipant is still null/undefined (e.g., user is null and participants is empty), skip.
        if (!otherParticipant) return null;

        const isSelf = otherParticipant._id === user?._id;

        const isActive = activeConversation?._id === conversation._id;
        const isOnline = isUserOnline(otherParticipant._id);
        const displayName = isSelf
          ? "My Notes (You)"
          : otherParticipant.artistInfo?.companyName ||
            `${otherParticipant.firstName} ${otherParticipant.lastName}`;

        return (
          <button
            key={conversation._id}
            onClick={() => openConversation(conversation)}
            className={`flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b ${
              isActive ? "bg-muted" : ""
            }`}
          >
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={otherParticipant.profilePicture}
                  alt={displayName}
                />
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
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium truncate">{displayName}</span>
                {conversation.lastMessage?.createdAt && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(
                      new Date(conversation.lastMessage.createdAt),
                      {
                        addSuffix: false,
                      },
                    )}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-sm text-muted-foreground truncate">
                  {conversation.lastMessage?.content || "No messages yet"}
                </p>
                {conversation.unreadCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-5 px-1.5">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>

              {conversation.artwork && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Re: {conversation.artwork.title}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversationList;
