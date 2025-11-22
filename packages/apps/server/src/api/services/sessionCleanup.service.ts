import { SessionModel } from "@naksilaclina/mongodb";

/**
 * Cleanup expired sessions from the database
 * This function should be called periodically (e.g., daily) to remove old sessions
 * that are no longer needed for security or performance reasons.
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    // Calculate the date 7 days ago (matching refresh token expiration)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Delete sessions that have expired more than 7 days ago
    const result = await SessionModel.deleteMany({
      expiresAt: { $lt: sevenDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired sessions`);
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
  }
}

/**
 * Cleanup orphaned sessions that have no corresponding user
 * This can happen if users are deleted but their sessions remain
 */
export async function cleanupOrphanedSessions(): Promise<void> {
  try {
    // This would require importing the UserModel and checking for orphaned sessions
    // For now, we'll leave this as a placeholder for future implementation
    console.log("Orphaned session cleanup - not implemented yet");
  } catch (error) {
    console.error("Error cleaning up orphaned sessions:", error);
  }
}