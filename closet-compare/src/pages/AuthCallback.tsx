import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");
      
      // If no code, redirect to /auth immediately (no error screen)
      if (!code) {
        console.warn("[AuthCallback] No authorization code found in URL, redirecting to /auth");
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[AuthCallback] Exchanging code for session...");
      
      // Exchange code for session - wait for this to complete before any navigation
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("[AuthCallback] exchangeCodeForSession error:", exchangeError);
        // On error, redirect to /auth instead of showing error screen
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[AuthCallback] Session exchange successful, redirecting to /");
      // Only navigate after successful exchange
      navigate("/", { replace: true });
    })();
  }, [navigate, searchParams]);

  // Show loading state while processing
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="empty">Signing you in...</div>
      </div>
    </div>
  );
}

