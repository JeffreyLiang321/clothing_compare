import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { isSetupComplete } from "../lib/authHelpers";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error("[AuthCallback] exchangeCodeForSession error:", exchangeError);
        // On error, redirect to /auth instead of showing error screen
        navigate("/auth", { replace: true });
        return;
      }

      console.log("[AuthCallback] Session exchange successful, checking setup status...");
      
      // Check if setup is complete
      if (data.user) {
        const complete = await isSetupComplete(data.user.id);
        if (complete) {
          const redirect = sessionStorage.getItem("postAuthRedirect");
          sessionStorage.removeItem("postAuthRedirect");
          navigate(redirect || "/", { replace: true });
        } else {
          navigate("/finish-setup", { replace: true });
        }
      } else {
        navigate("/", { replace: true });
      }
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

