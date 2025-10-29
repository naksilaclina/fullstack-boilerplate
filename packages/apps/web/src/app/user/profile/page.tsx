"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/roles";

export default function UserProfilePage() {
  const { user } = useAuth();

  return (
    <RoleProtectedRoute allowedRoles={[UserRole.USER, UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile information
          </p>
        </div>
        
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {user?.firstName}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    {user?.lastName}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {user?.email}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                  {user?.role}
                </div>
              </div>
              
              <div className="pt-4">
                <Button variant="outline">Edit Profile</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleProtectedRoute>
  );
}