"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { login as loginService, getProfile } from "@/services/auth";
import { toastService } from "@/services/ui";
import { authorizationService } from "@/services/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user } = useAuth();
  
  // Use a ref to prevent multiple simultaneous submissions
  const isSubmitting = useRef(false);

  // Redirect authenticated users to their default page (only on initial load)
  useEffect(() => {
    if (isAuthenticated && user && !isSubmitting.current) {
      console.log('🔄 Login page redirecting authenticated user to dashboard');
      // Use our authorization service to determine redirect path
      const redirectPath = authorizationService.getPostLoginRedirectPath(user);
      router.push(redirectPath);
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    // Check if we're in development mode
    setIsDevelopment(process.env.NODE_ENV === "development");
    
    // Check for pre-filled credentials from URL parameters (only on initial load)
    const emailParam = searchParams.get('email');
    const passwordParam = searchParams.get('password');
    
    // Set credentials from URL parameters if present
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    if (passwordParam) {
      setPassword(decodeURIComponent(passwordParam));
    }
  }, [searchParams]);

  const handleQuickLogin = async (userEmail: string, userPassword: string) => {
    // Call handleSubmit directly with the credentials to avoid state update race conditions
    handleSubmitDirect(userEmail, userPassword);
  };

  const handleSubmitDirect = async (email: string, password: string) => {
    // Prevent multiple simultaneous submissions
    if (isSubmitting.current) {
      return;
    }
    
    if (!email || !password) {
      toastService.error({
        message: "Login Failed",
        description: "Please provide both email and password."
      });
      return;
    }
    
    isSubmitting.current = true;
    setIsLoading(true);
    
    try {
      const response = await loginService({ email, password });
      // Get full user profile
      const userProfile = await getProfile();
      login(userProfile);

      toastService.success({
        message: "Login Successful",
        description: "Welcome back! You have been successfully logged in."
      });
      
      // Use our authorization service to determine redirect path
      const redirectPath = authorizationService.getPostLoginRedirectPath(userProfile);
      
      // Check if there's a redirect URL in the search params
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(redirectPath);
      }
    } catch (error: any) {
      toastService.error({
        message: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials and try again."
      });
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple simultaneous submissions
    if (isSubmitting.current) {
      return;
    }
    
    if (!email || !password) {
      toastService.error({
        message: "Login Failed",
        description: "Please provide both email and password."
      });
      return;
    }
    
    isSubmitting.current = true;
    setIsLoading(true);
    
    try {
      const response = await loginService({ email, password });
      // Get full user profile
      const userProfile = await getProfile();
      login(userProfile);

      toastService.success({
        message: "Login Successful",
        description: "Welcome back! You have been successfully logged in."
      });
      
      // Reset form fields after successful login
      setEmail("");
      setPassword("");
      
      // Use our authorization service to determine redirect path
      const redirectPath = authorizationService.getPostLoginRedirectPath(userProfile);
      
      // Check if there's a redirect URL in the search params
      const redirectUrl = searchParams.get("redirect");
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push(redirectPath);
      }
    } catch (error: any) {
      toastService.error({
        message: "Login Failed",
        description: error.message || "Failed to login. Please check your credentials and try again."
      });
    } finally {
      isSubmitting.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="py-16 md:py-24">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              
              {/* Quick login buttons for development mode */}
              {isDevelopment && (
                <div className="w-full space-y-2">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-gray-500">
                        Development Quick Login
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleQuickLogin("naksilaclina@gmail.com", "test123")}
                      disabled={isLoading}
                    >
                      Test User
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleQuickLogin("admin@example.com", "admin123")}
                      disabled={isLoading}
                    >
                      Admin User
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => router.push("/register")}
                >
                  Register
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}