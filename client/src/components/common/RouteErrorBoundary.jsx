import { Component } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

/**
 * Route-level error boundary — keeps the app shell (Navbar, Footer) intact
 * when a page component crashes. Wraps route elements in App.jsx.
 */
class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("RouteErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">This page encountered an error</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Something went wrong loading this page. The rest of the app should still work.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Try Again
            </Button>
            <Button onClick={() => (window.location.href = "/")}>
              <Home className="mr-2 h-4 w-4" /> Go Home
            </Button>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <details className="mt-6 p-4 bg-muted/50 rounded-md text-left text-xs font-mono overflow-auto max-h-[200px] w-full max-w-lg">
              <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
              <div className="whitespace-pre-wrap text-destructive">{this.state.error.toString()}</div>
            </details>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;