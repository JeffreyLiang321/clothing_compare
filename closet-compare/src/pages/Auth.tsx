import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, getAuthRedirectUrl } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && session) {
      navigate("/", { replace: true });
    }
  }, [session, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const input = emailOrUsername.trim();
    if (!input) {
      setError("Please enter an email or username");
      setLoading(false);
      return;
    }

    // Use RPC function to resolve identifier (email or username) to email
    const { data: resolvedEmail, error: rpcError } = await supabase.rpc("resolve_login_email", {
      identifier: input,
    });

    if (rpcError) {
      console.error("Error resolving login email:", rpcError);
      setError("Failed to process login request. Please try again.");
      setLoading(false);
      return;
    }

    if (!resolvedEmail) {
      setError("No user found with that email or username.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: resolvedEmail,
      options: {
        emailRedirectTo: getAuthRedirectUrl(),
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }

    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-body" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1>Sign In</h1>
        <p className="subtitle">Enter your email or username to receive a login link</p>

        <button
          type="button"
          className="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          style={{ width: "100%", marginBottom: 24 }}
        >
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 24,
            gap: 12,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 1,
              background: "var(--border)",
            }}
          />
          <span style={{ color: "var(--muted)", fontSize: 14 }}>or</span>
          <div
            style={{
              flex: 1,
              height: 1,
              background: "var(--border)",
            }}
          />
        </div>

        <form onSubmit={handleSignIn}>
          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="email-or-username">
              Email or Username
            </label>
            <input
              id="email-or-username"
              type="text"
              className="input"
              value={emailOrUsername}
              onChange={(e) => {
                const value = e.target.value.toLowerCase();
                // Allow email format (with @, +, etc.) or username format (lowercase, alphanumeric, underscore)
                // More permissive validation - let the backend handle strict validation
                setEmailOrUsername(value);
                setError(null);
              }}
              placeholder="your@email.com or username"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="toast">{error}</div>}
          {message && (
            <div
              style={{
                padding: "12px 16px",
                background: "#d1fae5",
                color: "#065f46",
                borderRadius: 8,
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="button"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Sending..." : "Send login link"}
          </button>
        </form>
      </div>
    </div>
  );
}

