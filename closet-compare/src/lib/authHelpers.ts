import { supabase } from "./supabase";

/**
 * Check if a user has completed their setup
 * @param userId The user ID to check
 * @returns true if setup is complete, false otherwise
 */
export async function isSetupComplete(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, onboarding_complete")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking setup status:", error);
    // If there's an error, assume incomplete to be safe
    return false;
  }

  if (!data) {
    return false;
  }

  // Check onboarding_complete field first (if it exists and is explicitly false)
  if (data.onboarding_complete === false) {
    return false;
  }

  // If onboarding_complete is true, setup is complete
  if (data.onboarding_complete === true) {
    return true;
  }

  // Fallback for older profiles without onboarding_complete field:
  // check if username is set and not auto-generated
  if (!data.username || data.username.startsWith("user_")) {
    return false;
  }

  return true;
}

