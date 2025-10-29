"use client";

import React, { Suspense } from "react";

const SessionsLoading = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-lg text-muted-foreground">Loading sessions...</p>
      </div>
    </div>
  );
};

export default function SessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<SessionsLoading />}>
      {children}
    </Suspense>
  );
}