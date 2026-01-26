import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ghost, ArrowLeft } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-8 animate-in fade-in zoom-in duration-500">
      
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <Ghost className="h-32 w-32 text-primary relative z-10 animate-bounce-slow" />
      </div>

      <div className="space-y-4 max-w-md">
        <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-transparent select-none">
          404
        </h1>
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground leading-relaxed">
          Oops! The page you're looking for seems to have vanished into the void. It might have been moved or deleted.
        </p>
      </div>

      <div className="flex gap-4">
        <Button asChild size="lg" className="gap-2">
            <Link to="/">
                <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
        </Button>
        <Button variant="outline" size="lg" asChild>
            <Link to="/gallery">
                Browse Gallery
            </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;