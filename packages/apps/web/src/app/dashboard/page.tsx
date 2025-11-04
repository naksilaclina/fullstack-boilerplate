"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import LogoutButton from "@/components/LogoutButton";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/auth/useAuth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/roles";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Welcome back, {user?.firstName}!
          </p>
        </div>
        
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>Welcome back, {user?.firstName}!</CardDescription>
              </div>
              <LogoutButton />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
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
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
                      View Profile
                    </button>
                    <button className="w-full text-left p-2 hover:bg-gray-100 rounded">
                      Account Settings
                    </button>
                    <Link href="/dashboard/sessions" passHref>
                      <Button variant="outline" className="w-full">
                        Manage Sessions
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}