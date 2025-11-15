"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { register as registerService } from "@/services/auth";
import { toastService } from "@/services/ui";
import { authorizationService } from "@/services/auth";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, user, isReady } = useAuth();

  // Track if we're in the process of redirecting
  const isRedirecting = useRef(false);

  // Redirect authenticated users to their default page when auth state is ready
  useEffect(() => {
    // Only redirect if:
    // 1. Auth state is ready
    // 2. User is authenticated
    // 3. We're not already redirecting
    if (isReady && isAuthenticated && user && !isRedirecting.current) {
      console.log('🔄 Register page redirecting authenticated user to dashboard');
      isRedirecting.current = true;

      // Use our authorization service to determine redirect path based on user role
      const redirectPath = authorizationService.getPostLoginRedirectPath(user);
      router.push(redirectPath);
    }
  }, [isReady, isAuthenticated, user, router]);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevelopment(process.env.NODE_ENV === "development");
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);

    try {
      const response = await registerService({ firstName, lastName, email, password });
      login(response.user); // Pass only the user object, not the accessToken

      toastService.success({
        message: "Registration Successful",
        description: "Account created successfully! Welcome to our platform.",
      });

      // Note: We don't redirect here anymore. The useEffect above will handle redirection
      // when the auth state is properly updated
    } catch (error: any) {
      toastService.error({
        message: "Registration Failed",
        description: error.message || "Failed to register. Please check your information and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 md:py-24">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up for a new account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
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
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>

              {/* Quick test register for development mode */}
              {isDevelopment && (
                <div className="w-full space-y-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-gray-500">
                        Development Quick Register
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Generate unique test data
                        const timestamp = Date.now();
                        const randomNum = Math.floor(Math.random() * 1000);
                        setFirstName(`User${randomNum}`);
                        setLastName(`Test${timestamp.toString().slice(-4)}`);
                        setEmail(`user${timestamp}${randomNum}@example.com`);
                        setPassword("Test123!@#");
                      }}
                      disabled={isLoading}
                    >
                      New Test User
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // Fill with existing test user data from seed (will cause duplicate error)
                        setFirstName("Test");
                        setLastName("User");
                        setEmail("test@example.com"); // Known existing email from seed
                        setPassword("Test123!@#");
                      }}
                      disabled={isLoading}
                    >
                      Existing User
                    </Button>
                  </div>
                </div>
              )}

              <div className="text-center text-sm">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}