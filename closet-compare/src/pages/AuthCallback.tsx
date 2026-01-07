import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    (async () => {
      const code = searchParams.get("code");
      if (!code) {
        navigate("/auth", { replace: true });
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("exchangeCodeForSession error:", error);
        navigate("/auth", { replace: true });
        return;
      }

      navigate("/", { replace: true });
    })();
  }, [navigate, searchParams]);

  return <div style={{ padding: 24 }}>Signing you in...</div>;
}

