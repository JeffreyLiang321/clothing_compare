import { useEffect } from "react";
import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import List from "./pages/List";
import AddItem from "./pages/AddItem";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Share from "./pages/Share";
import Shared from "./pages/Shared";
import SharedView from "./pages/SharedView";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function Nav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  return (
    <nav className="nav">
      <div className="nav-content">
        <NavLink to="/" className="brand">
          <span>🧥</span>
          <span>Closet Compare</span>
        </NavLink>
        <div className="nav-links">
          <NavLink
            to="/"
            className={({ isActive }) => `pill ${isActive ? "active" : ""}`}
          >
            Wishlist
          </NavLink>
          <NavLink
            to="/add"
            className={({ isActive }) => `pill ${isActive ? "active" : ""}`}
          >
            Add Item
          </NavLink>
          <NavLink
            to="/shared"
            className={({ isActive }) => `pill ${isActive ? "active" : ""}`}
          >
            Shared
          </NavLink>
          <button
            type="button"
            className="button secondary"
            onClick={handleSignOut}
            style={{ fontSize: 14, padding: "8px 16px" }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const handleHashChange = async () => {
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");

        if (type === "magiclink" && accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            window.location.hash = "";
            if (location.pathname.startsWith("/auth")) {
              navigate("/");
            }
          }
        }
      }
    };

    handleHashChange();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          window.location.hash = "";
          if (location.pathname.startsWith("/auth")) {
            navigate("/");
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, loading]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {session && <Nav />}
      <div className="container">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/share/:token" element={<Share />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <List />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add"
            element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared"
            element={
              <ProtectedRoute>
                <Shared />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shared/:id"
            element={
              <ProtectedRoute>
                <SharedView />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
