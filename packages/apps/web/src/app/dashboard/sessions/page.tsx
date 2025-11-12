"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/auth";
import { getSessions, revokeSession, revokeAllSessions } from "@/services/auth";
import { toastService } from "@/services/ui";

interface Session {
  id: string;
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: {
    ip?: string;
    country?: string;
    city?: string;
    region?: string;
  };
  expiresAt: string;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    fetchSessions();
  }, [isAuthenticated, router]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await getSessions();
      setSessions(response.sessions);
    } catch (error: any) {
      console.error("Failed to fetch sessions", error);
      toastService.error({
        message: "Error",
        description: error.message || "Failed to fetch sessions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      await revokeSession(sessionId);
      setSessions(sessions.filter(session => session.id !== sessionId));
      toastService.success({
        message: "Success",
        description: "Session revoked successfully",
      });
    } catch (error: any) {
      console.error("Failed to revoke session", error);
      toastService.error({
        message: "Error",
        description: error.message || "Failed to revoke session",
      });
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      setRevokingAll(true);
      await revokeAllSessions();
      // Keep only the current session (this one)
      setSessions(sessions.slice(0, 1));
      toastService.success({
        message: "Success",
        description: "All other sessions revoked successfully",
      });
    } catch (error: any) {
      console.error("Failed to revoke all sessions", error);
      toastService.error({
        message: "Error",
        description: error.message || "Failed to revoke all sessions",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Your Sessions</h2>
            <Button
              onClick={handleRevokeAllSessions}
              disabled={revokingAll}
              variant="destructive"
            >
              {revokingAll ? "Revoking..." : "Revoke All Other Sessions"}
            </Button>
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active sessions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">
                        {session.userAgent ? session.userAgent.substring(0, 50) + (session.userAgent.length > 50 ? "..." : "") : "Unknown Device"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        IP: {session.ipAddress || session.geoLocation?.ip || "Unknown"} •
                        Created: {new Date(session.createdAt).toLocaleString()} •
                        Expires: {new Date(session.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      variant="destructive"
                      size="sm"
                    >
                      {revoking === session.id ? "Revoking..." : "Revoke"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}