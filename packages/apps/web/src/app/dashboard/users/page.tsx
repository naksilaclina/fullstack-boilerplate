"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/auth/useAuth";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/lib/roles";

export default function UsersManagementPage() {
  const { user } = useAuth();

  // Mock user data for demonstration
  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "user", status: "Active" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user", status: "Active" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "admin", status: "Active" },
  ];

  return (
    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Users Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage all registered users
          </p>
        </div>
        
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </div>
              <Button>Add New User</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((userData) => (
                    <tr key={userData.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{userData.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{userData.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                          {userData.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {userData.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                        <Button variant="destructive" size="sm">Delete</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}