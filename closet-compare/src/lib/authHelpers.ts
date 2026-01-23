import { supabase } from "./supabase";

/**
 * Check if a user has completed their setup (has a username set and not auto-generated)
 * @param userId The user ID to check
 * @returns true if setup is complete, false otherwise
 */
export async function isSetupComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking setup status:", error);
    // If there's an error, assume incomplete to be safe
    return false;
  }

  if (!data || !data.username) {
    return false;
  }

  // Setup is incomplete if username is auto-generated (starts with 'user_')
  if (data.username.startsWith("user_")) {
    return false;
  }

  return true;
}

