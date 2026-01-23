import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";
import { isSetupComplete } from "../lib/authHelpers";

export default function FinishSetup() {
  const { user, session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { updateUsername } = useProfile(user?.id || null);
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingSetup, setCheckingSetup] = useState(true);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/auth", { replace: true });
    }
  }, [session, authLoading, navigate]);

  // Check if setup is already complete
  useEffect(() => {
    const checkSetup = async () => {
      if (!user) return;
      
      const complete = await isSetupComplete(user.id);
      if (complete) {
        navigate("/", { replace: true });
      } else {
        setCheckingSetup(false);
      }
    };

    if (user && !authLoading) {
      checkSetup();
    }
  }, [user, authLoading, navigate]);

  if (authLoading || checkingSetup) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate username
    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      setError("Username must be between 3 and 20 characters");
      setLoading(false);
      return;
    }

    if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
      setError("Username can only contain lowercase letters, numbers, and underscores");
      setLoading(false);
      return;
    }

    // Validate password with specific requirements
    const passwordErrors: string[] = [];
    
    if (password.length < 8) {
      passwordErrors.push("at least 8 characters");
    }
    
    if (!/[a-z]/.test(password)) {
      passwordErrors.push("a lowercase letter");
    }
    
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push("an uppercase letter");
    }
    
    if (!/[0-9]/.test(password)) {
      passwordErrors.push("a digit");
    }
    
    if (!/[^a-zA-Z0-9]/.test(password)) {
      passwordErrors.push("a symbol");
    }
    
    if (passwordErrors.length > 0) {
      const errorMessage = `Password must contain ${passwordErrors.join(", ")}`;
      setError(errorMessage);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Step A: Ensure profile row exists (upsert if needed)
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: user.id, username: trimmedUsername, onboarding_complete: false },
          { onConflict: "id" }
        );

      if (profileError) {
        // If upsert fails, try update
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ username: trimmedUsername })
          .eq("id", user.id);

        if (updateError) {
          // Check if it's a unique constraint violation
          if (updateError.code === "23505" || updateError.message.includes("unique")) {
            setError("Username is already taken");
            setLoading(false);
            return;
          }
          throw updateError;
        }
      }

      // Step B: Set username (already done above, but handle unique constraint error)
      try {
        await updateUsername(user.id, trimmedUsername);
      } catch (err: any) {
        if (err.message.includes("taken") || err.message.includes("unique")) {
          setError("Username is already taken");
          setLoading(false);
          return;
        }
        throw err;
      }

      // Step C: Set password
      const { error: passwordError } = await supabase.auth.updateUser({
        password: password,
      });

      if (passwordError) {
        // Parse Supabase password error messages to show specific requirements
        const errorMessage = passwordError.message.toLowerCase();
        const missingRequirements: string[] = [];
        
        // Check for common Supabase password error patterns
        if (errorMessage.includes("lowercase") || errorMessage.includes("lower case")) {
          missingRequirements.push("a lowercase letter");
        }
        if (errorMessage.includes("uppercase") || errorMessage.includes("upper case")) {
          missingRequirements.push("an uppercase letter");
        }
        if (errorMessage.includes("digit") || errorMessage.includes("number")) {
          missingRequirements.push("a digit");
        }
        if (errorMessage.includes("symbol") || errorMessage.includes("special character")) {
          missingRequirements.push("a symbol");
        }
        if (errorMessage.includes("length") || errorMessage.includes("8")) {
          missingRequirements.push("at least 8 characters");
        }
        
        // If we parsed specific requirements, show them; otherwise show the original error
        if (missingRequirements.length > 0) {
          throw new Error(`Password must contain ${missingRequirements.join(", ")}`);
        }
        
        throw passwordError;
      }

      // Step D: Mark onboarding as complete
      const { error: onboardingError } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      if (onboardingError) {
        console.error("Error marking onboarding complete:", onboardingError);
        // Don't fail the whole flow if this fails, but log it
      }

      // Step E: Setup complete, redirect to app home
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Error completing setup:", err);
      setError(err.message || "Failed to complete setup. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-body" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1>Finish Setup</h1>
        <p className="subtitle">Set your username and password to complete your account</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => {
                const value = e.target.value.toLowerCase();
                // Only allow lowercase letters, numbers, and underscores
                if (value === "" || /^[a-z0-9_]*$/.test(value)) {
                  setUsername(value);
                  setError(null);
                }
              }}
              placeholder="username"
              required
              disabled={loading}
              minLength={3}
              maxLength={20}
            />
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              3-20 characters, lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              placeholder="Password"
              required
              disabled={loading}
              minLength={8}
            />
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
              At least 8 characters, including lowercase, uppercase, digit, and symbol
            </p>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              placeholder="Confirm password"
              required
              disabled={loading}
              minLength={8}
            />
          </div>

          {error && <div className="toast">{error}</div>}

          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Completing setup..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}

