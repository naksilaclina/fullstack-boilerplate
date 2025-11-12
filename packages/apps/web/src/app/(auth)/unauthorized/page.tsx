"use client";

import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toastService } from "@/services/ui";

export default function UnauthorizedPage() {
  useEffect(() => {
    toastService.error({
      message: "Access Denied",
      description: "You don't have permission to view that page. Please contact your administrator if you believe this is an error.",
    });
  }, []);

  return (
    <div className="py-16 md:py-24">
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view this page</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don't have the necessary permissions to access this page. 
              Please contact your administrator if you believe this is an error.
            </p>
            <Link href="/">
              <Button className="w-full">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}