"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthGuard } from "@/components";
import { useAuth } from "@/hooks/auth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib";
import { format } from "date-fns";

export default function UserProfilePage() {
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

  // Format preferences for display
  const formatPreferences = (preferences?: { 
    newsletter: boolean; 
    notifications?: { email: boolean; push: boolean };
    theme: "light" | "dark" | "auto";
    language: string;
  }) => {
    if (!preferences) return "Not provided";
    
    const notificationPrefs = [];
    if (preferences.notifications?.email) notificationPrefs.push("Email");
    if (preferences.notifications?.push) notificationPrefs.push("Push");
    
    return (
      <div className="space-y-1">
        <p>Newsletter: {preferences.newsletter ? "Subscribed" : "Not subscribed"}</p>
        <p>Notifications: {notificationPrefs.length > 0 ? notificationPrefs.join(", ") : "None"}</p>
        <p>Theme: {preferences.theme}</p>
        <p>Language: {preferences.language}</p>
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={[UserRole.USER, UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Your Profile
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage your profile information
          </p>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">First Name</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.firstName || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Last Name</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.lastName || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.email || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Role</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Phone</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.phone || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Date of Birth</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {formatDate(user?.dateOfBirth)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Gender</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Bio</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded min-h-[60px]">
                        {user?.bio || "Not provided"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Address</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded min-h-[60px]">
                        {formatAddress(user?.address)}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Timezone</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.timezone || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Locale</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.locale || "Not provided"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Email Verified</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {user?.emailVerified ? "Yes" : "No"}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-muted-foreground">Preferences</label>
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                        {formatPreferences(user?.preferences)}
                      </div>
                    </div>
                  </div>
                </div>
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