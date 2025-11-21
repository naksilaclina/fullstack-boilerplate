"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components";
import { AuthGuard } from "@/components";
import { useAuth } from "@/hooks/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-8 md:py-12">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Admin Dashboard
            </h1>
            <div className="ml-4">
              <LogoutButton />
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Welcome back, {user?.firstName}! Here's what's happening today.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl mx-auto">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/admin/users" passHref>
                  <Button variant="default" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                    <Users className="w-5 h-5" />
                    <span>Manage Users</span>
                  </Button>
                </Link>
                <Link href="/admin/sessions" passHref>
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                    <Monitor className="w-5 h-5" />
                    <span>Active Sessions</span>
                  </Button>
                </Link>
                <Link href="/admin/profile" passHref>
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                    <User className="w-5 h-5" />
                    <span>My Profile</span>
                  </Button>
                </Link>
                <Link href="/admin/settings" passHref>
                  <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center gap-1">
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>Current system health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Server</span>
                  </div>
                  <span className="text-green-500 font-medium">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Database</span>
                  </div>
                  <span className="text-green-500 font-medium">Connected</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Storage</span>
                  </div>
                  <span className="text-yellow-500 font-medium">75%</span>
                </div>
                <div className="pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">1.5 TB of 2 TB used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events in your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="mt-1 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New user registered</p>
                    <p className="text-sm text-muted-foreground">John Doe (john@example.com)</p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 pb-3 border-b">
                  <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Session terminated</p>
                    <p className="text-sm text-muted-foreground">User session expired</p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Settings updated</p>
                    <p className="text-sm text-muted-foreground">Security configuration changed</p>
                    <p className="text-xs text-muted-foreground">Yesterday</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}

// Simple icon components for the dashboard
function Users({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );
}

function Monitor({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function User({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}