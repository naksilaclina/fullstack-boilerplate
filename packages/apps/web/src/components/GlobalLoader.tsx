"use client";

import React, { useEffect, useState } from "react";

interface GlobalLoaderProps {
  children: React.ReactNode;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Function to handle loading completion
      const handleLoadComplete = () => {
        // Add a small delay to ensure all content is rendered
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      };

      // Check if document is already loaded
      if (document.readyState === "complete") {
        handleLoadComplete();
      } else {
        // Listen for page load event
        window.addEventListener("load", handleLoadComplete);
        
        // Also listen for Next.js route changes if using router
        // This is a simplified version - in a real app you might want to use Next.js router events
        
        // Cleanup listeners
        return () => {
          window.removeEventListener("load", handleLoadComplete);
        };
      }
    }
  }, []);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg text-muted-foreground">Loading application...</p>
          </div>
        </div>
      )}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-1000"}>
        {children}
      </div>
    </>
  );
};

export default GlobalLoader;