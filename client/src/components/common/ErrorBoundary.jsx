import { Component } from "react";


class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console (in production, you'd send to error tracking service)
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-4 text-center">
          <div className="max-w-md space-y-6">
            <div className="text-4xl">⚠️</div>
            <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            <p className="text-muted-foreground">We're sorry, but something unexpected happened. Please try again.</p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button onClick={this.handleReset} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                Try Again
              </button>
              <button onClick={this.handleReload} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Reload Page
              </button>
              <button onClick={this.handleGoHome} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Go to Home
              </button>
            </div>

            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 p-4 bg-muted/50 rounded-md text-left text-xs font-mono overflow-auto max-h-[300px]">
                <summary className="cursor-pointer font-medium mb-2">Error Details (Development Only)</summary>
                <div className="whitespace-pre-wrap text-destructive">{this.state.error.toString()}</div>
                {this.state.errorInfo && (
                  <div className="whitespace-pre-wrap mt-2">{this.state.errorInfo.componentStack}</div>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
