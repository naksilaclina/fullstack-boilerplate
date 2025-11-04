"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/roles";

export default function UserPanel() {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            User Panel
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, {user?.firstName}!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Manage your profile settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
                <p><span className="font-medium">Role:</span> {user?.role}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>Update your account settings</p>
                <Link href="/user/sessions" passHref>
                  <Button variant="outline" className="w-full">
                    Manage Active Sessions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}