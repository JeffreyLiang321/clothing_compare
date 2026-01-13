import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileData = await getProfile(userId);
        setProfile(profileData);
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError(err.message);
        setProfile(null);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  const getProfile = async (userId: string): Promise<Profile> => {
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (fetchError) {
      // If profile doesn't exist, try to create it
      if (fetchError.code === "PGRST116") {
        console.log("Profile not found, creating...");
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert([{ id: userId, username: `user_${userId.slice(0, 8)}` }])
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
          throw new Error("Failed to create profile. Please try again.");
        }

        return newProfile as Profile;
      }

      console.error("Error fetching profile:", fetchError);
      throw fetchError;
    }

    return data as Profile;
  };

  const updateUsername = async (userId: string, username: string): Promise<Profile> => {
    // Validate username format
    const trimmedUsername = username.trim().toLowerCase();
    
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      throw new Error("Username can only contain lowercase letters, numbers, and underscores");
    }

    // Check for duplicates (case-insensitive)
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmedUsername)
      .neq("id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 means no rows found, which is what we want
      console.error("Error checking username:", checkError);
      throw new Error("Failed to check username availability");
    }

    if (existing) {
      throw new Error("Username is already taken");
    }

    // Update username
    const { data, error: updateError } = await supabase
      .from("profiles")
      .update({ username: trimmedUsername })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      // Handle unique constraint violation
      if (updateError.code === "23505" || updateError.message.includes("unique")) {
        throw new Error("Username is already taken");
      }
      console.error("Error updating username:", updateError);
      throw updateError;
    }

    // Update local state
    if (data) {
      setProfile(data as Profile);
    }

    return data as Profile;
  };

  const findUserIdByUsername = async (username: string): Promise<string> => {
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedUsername) {
      throw new Error("Username cannot be empty");
    }

    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("username", trimmedUsername)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        throw new Error("No user with that username");
      }
      console.error("Error finding user by username:", fetchError);
      throw fetchError;
    }

    if (!data) {
      throw new Error("No user with that username");
    }

    return data.id;
  };


  const refetch = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const profileData = await getProfile(userId);
      setProfile(profileData);
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      setError(err.message);
      setProfile(null);
    }

    setLoading(false);
  };

  return {
    profile,
    loading,
    error,
    getProfile,
    updateUsername,
    findUserIdByUsername,
    refetch,
  };
}

