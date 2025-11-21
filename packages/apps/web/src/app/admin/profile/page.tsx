"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/components";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib";
import { format } from "date-fns";

export default function AdminProfilePage() {
  const { user } = useAuth();

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not provided";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  // Format address for display
  const formatAddress = (address?: { street?: string; city?: string; state?: string; zipCode?: string; country?: string }) => {
    if (!address) return "Not provided";
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Not provided";
  };

  return (
    <AuthGuard allowedRoles={[UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Your profile information
          </p>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user?.role}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user?.phone || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{formatDate(user?.dateOfBirth)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{user?.gender || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="font-medium">{user?.bio || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{formatAddress(user?.address)}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Timezone</p>
                <p className="font-medium">{user?.timezone || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Locale</p>
                <p className="font-medium">{user?.locale || "Not provided"}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Email Verified</p>
                <p className="font-medium">{user?.emailVerified ? "Yes" : "No"}</p>
              </div>
            </div>
            
            <div className="pt-6">
              <Button variant="outline">Edit Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
}