import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Route not found:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="font-mono text-6xl font-bold text-severity-critical mb-4">404</div>
        <p className="font-mono text-sm text-muted-foreground mb-2">ROUTE NOT FOUND</p>
        <p className="text-xs text-muted-foreground mb-6">
          Requested path: <code className="text-foreground">{location.pathname}</code>
        </p>
        <a href="/" className="font-mono text-xs text-primary hover:text-primary/80 transition-colors">
          RETURN TO CONTROL
        </a>
      </div>
    </div>
  );
};

export default NotFound;
