"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/store/authStore";
import { toastService } from "@/services/toastService";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/userService";
import RoleProtectedRoute from "@/components/RoleProtectedRoute";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function AdminUsers() {
  const { user: currentUser, accessToken } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // Load users on component mount
  useEffect(() => {
    if (accessToken) {
      loadUsers();
    }
  }, [accessToken]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getUsers(accessToken!);
      setUsers(response.data);
    } catch (error: any) {
      toastService.error({
        message: "Load Failed",
        description: error.message || "Failed to load users. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const userData = { firstName, lastName, email, password, role };
      const response = await createUser(userData, accessToken!);
      
      toastService.success({
        message: "User Created",
        description: `User ${response.data.firstName} ${response.data.lastName} created successfully.`,
      });
      
      // Reset form and refresh user list
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("user");
      setShowAddForm(false);
      loadUsers();
    } catch (error: any) {
      toastService.error({
        message: "Creation Failed",
        description: error.message || "Failed to create user. Please try again.",
      });
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;
    
    try {
      const userData = { firstName, lastName, email, role };
      const response = await updateUser(editingUser.id, userData, accessToken!);
      
      toastService.success({
        message: "User Updated",
        description: `User ${response.data.firstName} ${response.data.lastName} updated successfully.`,
      });
      
      // Reset form and refresh user list
      setFirstName("");
      setLastName("");
      setEmail("");
      setRole("user");
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      toastService.error({
        message: "Update Failed",
        description: error.message || "Failed to update user. Please try again.",
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      await deleteUser(userId, accessToken!);
      
      toastService.success({
        message: "User Deleted",
        description: `User ${userName} deleted successfully.`,
      });
      
      // Refresh user list
      loadUsers();
    } catch (error: any) {
      toastService.error({
        message: "Deletion Failed",
        description: error.message || "Failed to delete user. Please try again.",
      });
    }
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(user.role);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("user");
  };

  return (
    <RoleProtectedRoute allowedRoles={["admin"]}>
      <div className="py-16 md:py-24">
        <div className="flex flex-col items-center gap-6 text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            User Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="w-full">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>User List</CardTitle>
                  <CardDescription>All registered users</CardDescription>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)}>
                  {showAddForm ? "Cancel" : "Add User"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add User Form */}
              {(showAddForm || editingUser) && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>{editingUser ? "Edit User" : "Add New User"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={editingUser ? handleUpdateUser : handleAddUser} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      
                      {!editingUser && (
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required={!editingUser}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <select
                          id="role"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full p-2 border rounded"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button type="submit">
                          {editingUser ? "Update User" : "Create User"}
                        </Button>
                        {editingUser && (
                          <Button type="button" variant="outline" onClick={cancelEdit}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
              
              {/* Users Table */}
              {loading ? (
                <p>Loading users...</p>
              ) : users.length === 0 ? (
                <p className="mb-4">No users found</p>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.firstName} {user.lastName}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "admin" 
                                ? "bg-red-100 text-red-800" 
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => startEditUser(user)}
                              >
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              <div className="mt-4">
                <p className="font-medium">Total Users: {users.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleProtectedRoute>
  );
}