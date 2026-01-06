import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error("Auth callback error:", error);
            navigate("/auth?error=auth_failed");
            return;
          }

          navigate("/", { replace: true });
        } else {
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth");
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="panel">
      <div className="panel-body">
        <div className="empty">Signing you in...</div>
      </div>
    </div>
  );
}

