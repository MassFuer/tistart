import { Star } from "lucide-react";

const StarRating = ({ rating, size = "w-4 h-4", interactive = false, onRate }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= rating
              ? "text-yellow-400 fill-yellow-400"
              : "text-muted-foreground"
          } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
          onClick={interactive ? () => onRate(i) : undefined}
        />
      ))}
    </div>
  );
};

export default StarRating;