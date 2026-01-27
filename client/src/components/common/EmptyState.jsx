import { SearchX } from "lucide-react";

const EmptyState = ({
  message = "No items found",
  description,
  icon,
  action,
  children,
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] w-full p-8 text-center border-2 border-dashed rounded-lg bg-muted/10">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
        {icon || <SearchX className="h-10 w-10 text-muted-foreground" />}
      </div>
      <p className="text-lg font-medium text-foreground mb-2">{message}</p>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{description}</p>
      )}
      {(children || action) && (
        <div className="flex gap-4 items-center">
            {action}
            {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
