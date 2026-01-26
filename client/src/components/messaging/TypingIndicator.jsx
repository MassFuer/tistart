import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const TypingIndicator = ({ user }) => {
  return (
    <div className="flex items-end gap-2">
      <Avatar className="h-8 w-8">
        <AvatarImage src={user?.profilePicture} />
        <AvatarFallback>
          {user?.firstName?.[0]}
          {user?.lastName?.[0]}
        </AvatarFallback>
      </Avatar>

      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;