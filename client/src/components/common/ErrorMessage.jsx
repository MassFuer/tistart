import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const ErrorMessage = ({ message = "Something went wrong", onRetry }) => {
  return (
    <Alert variant="destructive" className="my-4 max-w-2xl mx-auto">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="flex flex-col gap-4 pt-2">
        <p>{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="w-fit bg-background text-foreground hover:bg-accent">
            <RefreshCcw className="mr-2 h-3 w-3" /> Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ErrorMessage;
