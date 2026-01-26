import { useEffect, useRef } from "react";
import { useMessaging } from "../../context/MessagingContext";
import { useAuth } from "../../context/AuthContext";
import MessageItem from "./MessageItem";
import TypingIndicator from "./TypingIndicator";
import { Skeleton } from "../ui/skeleton";

const MessageList = () => {
  const { messages, activeConversation, isLoadingMessages, getTypingUsers } = useMessaging();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const typingUsers = getTypingUsers(activeConversation?._id);

  // Get other participant for typing indicator
  const otherParticipant = activeConversation?.participants?.find(
    (p) => p._id !== user?._id
  );

  if (isLoadingMessages) {
    return (
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            <Skeleton className={`h-16 ${i % 2 === 0 ? "w-48" : "w-64"} rounded-lg`} />
          </div>
        ))}
      </div>
    );
  }

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Select a conversation to start messaging</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">No messages yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center justify-center my-4">
            <span className="px-3 py-1 text-xs text-muted-foreground bg-muted rounded-full">
              {date === new Date().toLocaleDateString() ? "Today" : date}
            </span>
          </div>

          <div className="space-y-2">
            {dateMessages.map((message, index) => {
              const isOwn = message.sender?._id === user?._id;
              const showAvatar =
                !isOwn &&
                (index === 0 ||
                  dateMessages[index - 1]?.sender?._id !== message.sender?._id);

              return (
                <MessageItem
                  key={message._id}
                  message={message}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                />
              );
            })}
          </div>
        </div>
      ))}

      {typingUsers.length > 0 && otherParticipant && (
        <TypingIndicator user={otherParticipant} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;