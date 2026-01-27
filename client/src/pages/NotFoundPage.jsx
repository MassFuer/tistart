import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ghost, ArrowLeft, RefreshCw } from "lucide-react";

const NotFoundPage = () => {
  const [quote, setQuote] = useState("");
  const [loadingQuote, setLoadingQuote] = useState(false);

  const fetchQuote = async () => {
    setLoadingQuote(true);
    try {
      const res = await fetch("https://api.kanye.rest");
      const data = await res.json();
      setQuote(data.quote);
    } catch (err) {
      setQuote("I'm not perfect, but I'm not you."); // Fallback
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuote();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center space-y-8 animate-in fade-in zoom-in duration-500">

      {/* EASTER EGG */}
      <div className="mt-12 pt-8 border-t max-w-lg w-full">
          <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Wisdom from the Void (Yeezy)</p>
          <blockquote className="text-xl italic font-serif text-foreground/80 mb-6 min-h-[3rem]">
              "{quote}"
          </blockquote>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchQuote}
            disabled={loadingQuote}
            className="text-xs"
          >
            {loadingQuote ? <RefreshCw className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
            New Wisdom
          </Button>
      </div>

            
      <div className="relative border-t pt-8 max-w-lg w-full flex justify-center">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <Ghost className="h-32 w-32 text-primary  relative z-10 animate-bounce-slow" />
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