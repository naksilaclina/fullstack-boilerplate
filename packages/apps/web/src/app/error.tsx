'use client';

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="py-16 md:py-24">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center py-16">
        <h1 className="text-4xl md:text-6xl font-bold text-destructive mb-6">Something went wrong!</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={reset} size="lg">
            Try again
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="/">Go back home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}