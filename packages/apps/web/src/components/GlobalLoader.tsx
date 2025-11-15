"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/auth";

interface GlobalLoaderProps {
  children: React.ReactNode;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ children }) => {
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { initializing } = useAuth();

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      // Function to handle loading completion
      const handleLoadComplete = () => {
        // Remove the artificial delay - set loading to false immediately
        setIsPageLoading(false);
      };

      // Check if document is already loaded
      if (document.readyState === "complete") {
        handleLoadComplete();
      } else {
        // Listen for page load event
        window.addEventListener("load", handleLoadComplete);
        
        // Cleanup listeners
        return () => {
          window.removeEventListener("load", handleLoadComplete);
        };
      }
    }
  }, []);

  // Show loading if either page is loading OR auth is initializing
  const shouldShowLoader = isPageLoading || initializing;

  return (
    <>
      {shouldShowLoader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg text-muted-foreground">
              {initializing ? "Checking authentication..." : "Loading application..."}
            </p>
          </div>
        </div>
      )}
      <div className={shouldShowLoader ? "opacity-0" : "opacity-100 transition-opacity duration-300"}>
        {children}
      </div>
    </>
  );
};

export default GlobalLoader;