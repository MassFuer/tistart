import { Loader2 } from "lucide-react";

const Loading = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] w-full text-muted-foreground animate-in fade-in duration-300">
    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

export default Loading;
