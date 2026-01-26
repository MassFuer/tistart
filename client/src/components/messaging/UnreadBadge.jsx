import { useMessaging } from "../../context/MessagingContext";
import { Badge } from "../ui/badge";

const UnreadBadge = ({ className = "" }) => {
  const { unreadCount } = useMessaging();

  if (unreadCount === 0) return null;

  return (
    <Badge
      variant="destructive"
      className={`h-5 min-w-5 px-1.5 text-xs ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </Badge>
  );
};

export default UnreadBadge;