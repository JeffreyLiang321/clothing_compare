import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase, getFinishSetupRedirectUrl } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { isSetupComplete } from "../lib/authHelpers";

type AuthMode = "login" | "signup";

export default function Auth() {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine mode from URL or default to login
  const [mode, setMode] = useState<AuthMode>(() => {
    const searchParams = new URLSearchParams(location.search);
    return (searchParams.get("mode") as AuthMode) || "login";
  });

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      // Check if setup is complete and redirect accordingly
      const checkAndRedirect = async () => {
        if (session.user) {
          const complete = await isSetupComplete(session.user.id);
          navigate(complete ? "/" : "/finish-setup", { replace: true });
        }
      };
      checkAndRedirect();
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
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
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

    if (!password) {
      setError("Please enter your password");
      setLoading(false);
      return;
    }

    // Use RPC function to resolve identifier (email or username) to email
    const { data: resolvedEmail, error: rpcError } = await supabase.rpc("resolve_login_email", {
      identifier: input,
    });

    if (rpcError) {
      console.error("Error resolving login email:", rpcError);
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    if (!resolvedEmail) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    // Sign in with password
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password: password,
    });

    if (signInError) {
      setError("Invalid credentials");
      setLoading(false);
      return;
    }

    // Check if setup is complete
    if (data.user) {
      const complete = await isSetupComplete(data.user.id);
      navigate(complete ? "/" : "/finish-setup", { replace: true });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const input = emailOrUsername.trim();
    if (!input) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    // Resolve identifier to email if needed
    let email: string;
    if (input.includes("@")) {
      email = input;
    } else {
      const { data: resolvedEmail, error: rpcError } = await supabase.rpc("resolve_login_email", {
        identifier: input,
      });

      if (rpcError || !resolvedEmail) {
        setError("Could not find an account with that email or username");
        setLoading(false);
        return;
      }

      email = resolvedEmail;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email for a password reset link.");
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const input = emailOrUsername.trim();
    if (!input || !input.includes("@")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    // Sign up with email confirmation
    // Use a temporary password that meets Supabase requirements - user will set their real password in finish-setup
    // After clicking the confirmation email link, user will be redirected to /finish-setup with a session
    // Generate a temporary password that meets all requirements: lowercase, uppercase, digit, symbol, 8+ chars
    const generateTempPassword = () => {
      const lowercase = "abcdefghijklmnopqrstuvwxyz";
      const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const digits = "0123456789";
      const symbols = "!@#$%^&*";
      const allChars = lowercase + uppercase + digits + symbols;
      
      // Ensure at least one of each required type
      let temp = 
        lowercase[Math.floor(Math.random() * lowercase.length)] +
        uppercase[Math.floor(Math.random() * uppercase.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill to 16 characters with random chars
      for (let i = temp.length; i < 16; i++) {
        temp += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the string
      return temp.split('').sort(() => Math.random() - 0.5).join('');
    };

    const { error: signUpError } = await supabase.auth.signUp({
      email: input,
      password: generateTempPassword(), // Temporary password that meets requirements, user will set real one in finish-setup
      options: {
        emailRedirectTo: getFinishSetupRedirectUrl(),
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setMessage("Check your email to confirm your account.");
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-body" style={{ maxWidth: 400, margin: "0 auto" }}>
        <h1>
          {forgotPasswordMode ? "Reset Password" : mode === "login" ? "Sign In" : "Sign Up"}
        </h1>
        <p className="subtitle">
          {forgotPasswordMode
            ? "Enter your email or username to receive a password reset link"
            : mode === "login"
            ? "Enter your email or username and password"
            : "Enter your email to create an account"}
        </p>

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

        <form onSubmit={forgotPasswordMode ? handleForgotPassword : mode === "login" ? handleLogin : handleSignup}>
          <div style={{ marginBottom: 24 }}>
            <label className="label" htmlFor="email-or-username">
              {mode === "login" ? "Email or Username" : "Email"}
            </label>
            <input
              id="email-or-username"
              type={mode === "signup" ? "email" : "text"}
              className="input"
              value={emailOrUsername}
              onChange={(e) => {
                const value = mode === "signup" ? e.target.value : e.target.value.toLowerCase();
                setEmailOrUsername(value);
                setError(null);
              }}
              placeholder={mode === "login" ? "your@email.com or username" : "your@email.com"}
              required
              disabled={loading}
            />
          </div>

          {mode === "login" && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <label className="label" htmlFor="password" style={{ marginBottom: 0 }}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotPasswordMode(true);
                    setError(null);
                    setMessage(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: 12,
                    textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  Forgot password?
                </button>
              </div>
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
              />
            </div>
          )}

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
            style={{ width: "100%", marginBottom: 16 }}
          >
            {loading
              ? forgotPasswordMode
                ? "Sending..."
                : mode === "login"
                ? "Signing in..."
                : "Sending..."
              : forgotPasswordMode
              ? "Send Reset Link"
              : mode === "login"
              ? "Sign In"
              : "Sign Up"}
          </button>

          <div style={{ textAlign: "center" }}>
            {forgotPasswordMode ? (
              <button
                type="button"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setError(null);
                  setMessage(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Back to sign in
              </button>
            ) : mode === "login" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setMessage(null);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: 14,
                    textDecoration: "underline",
                  }}
                >
                  Don't have an account? Sign up
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setMessage(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  cursor: "pointer",
                  fontSize: 14,
                  textDecoration: "underline",
                }}
              >
                Already have an account? Sign in
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
