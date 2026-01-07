import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");
      if (!code) {
        setError("No authorization code found. Please try signing in again.");
        setLoading(false);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        console.error("exchangeCodeForSession error:", exchangeError);
        setError(`Authentication failed: ${exchangeError.message}`);
        setLoading(false);
        return;
      }

      navigate("/", { replace: true });
    })();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Signing you in...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel">
        <div className="panel-body" style={{ maxWidth: 500, margin: "0 auto" }}>
          <h1>Authentication Error</h1>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>{error}</p>
          <Link to="/auth" className="button">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

