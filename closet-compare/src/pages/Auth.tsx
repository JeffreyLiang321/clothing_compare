import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (session) {
    navigate("/", { replace: true });
    return null;
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
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
        <p className="subtitle">Enter your email to receive a login link</p>

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
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
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

