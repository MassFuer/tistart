import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { useMessaging } from "../../context/MessagingContext";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck } from "lucide-react";

const MessageItem = ({ message, isOwn, showAvatar }) => {
  const { respondToOffer } = useMessaging();

  const isOffer = message.type === "offer";
  const isSystem = message.type === "system";
  const isPending = message.isPending;

  // Check if message is read by others
  const isRead = message.readBy?.length > 1;

  // Helper to render text with clickable links
  const renderWithLinks = (text) => {
    if (!text) return "";
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-300 hover:underline underline-offset-4 font-medium break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full whitespace-pre-wrap text-center">
          {renderWithLinks(message.content)}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender?.profilePicture} />
          <AvatarFallback>
            {message.sender?.firstName?.[0]}
            {message.sender?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      )}

      {!isOwn && !showAvatar && <div className="w-8" />}

      <div
        className={`max-w-[70%] ${
          isOwn
            ? "bg-gray-800 dark:bg-gray-900 text-white"
            : "bg-gray-600 dark:bg-gray-700 text-white"
        } rounded-2xl ${
          isOwn ? "rounded-br-md" : "rounded-bl-md"
        } px-4 py-2 ${isPending ? "opacity-70" : ""}`}
      >
        {isOffer ? (
          <div className="space-y-2">
            <p className="font-medium">Price Offer</p>
            <p className="text-2xl font-bold">
              €{message.offer?.amount?.toFixed(2)}
            </p>
            {message.offer?.status === "pending" && !isOwn && (
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => respondToOffer(message._id, "accepted")}
                  className="flex-1"
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => respondToOffer(message._id, "rejected")}
                  className="flex-1"
                >
                  Decline
                </Button>
              </div>
            )}
            {message.offer?.status && message.offer.status !== "pending" && (
              <p
                className={`text-sm font-medium ${
                  message.offer.status === "accepted"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message.offer.status === "accepted" ? "Accepted" : "Declined"}
              </p>
            )}
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{renderWithLinks(message.content)}</p>
        )}

        <div
          className={`flex items-center gap-1 mt-1 ${
            isOwn ? "justify-end" : "justify-start"
          }`}
        >
          <span
            className={`text-xs ${
              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
            }`}
          >
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: false,
            })}
          </span>

          {isOwn && (
            <span className="text-primary-foreground/70">
              {isPending ? (
                <Check className="h-3 w-3" />
              ) : isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;