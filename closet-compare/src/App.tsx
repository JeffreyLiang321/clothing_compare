import { Routes, Route, Navigate, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { supabase } from "./lib/supabase";
import { ActiveWishlistProvider } from "./contexts/ActiveWishlistContext";
import { isSetupComplete } from "./lib/authHelpers";
import List from "./pages/List";
import AddItem from "./pages/AddItem";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import FinishSetup from "./pages/FinishSetup";
import Share from "./pages/Share";
import Shared from "./pages/Shared";
import SharedView from "./pages/SharedView";
import Settings from "./pages/Settings";
import { useEffect, useState } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();
  const location = useLocation();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      if (loading) return;
      
      if (!session || !user) {
        setCheckingSetup(false);
        return;
      }

      const complete = await isSetupComplete(user.id);
      setSetupComplete(complete);
      setCheckingSetup(false);
    };

    checkSetup();
  }, [session, user, loading]);

  if (loading || checkingSetup) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    const target = location.pathname + location.search;
    if (target !== "/") {
      sessionStorage.setItem("postAuthRedirect", target);
    }
    return <Navigate to="/auth" replace />;
  }

  // Redirect to finish-setup if not complete
  if (!setupComplete) {
    return <Navigate to="/finish-setup" replace />;
  }

  return <ActiveWishlistProvider>{children}</ActiveWishlistProvider>;
}

function FinishSetupRoute({ children }: { children: React.ReactNode }) {
  const { session, loading, user } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {
    const checkSetup = async () => {
      if (loading) return;
      
      if (!session || !user) {
        setCheckingSetup(false);
        return;
      }

      const complete = await isSetupComplete(user.id);
      setSetupComplete(complete);
      setCheckingSetup(false);
    };

    checkSetup();
  }, [session, user, loading]);

  if (loading || checkingSetup) {
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

  // Redirect to home if setup is already complete
  if (setupComplete) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function Nav() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
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
          <NavLink
            to="/settings"
            className={({ isActive }) => `pill ${isActive ? "active" : ""}`}
          >
            Settings
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

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  // changing things
  return (
    <>
      {session && <Nav />}
      <div className="container">
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/finish-setup"
            element={
              <FinishSetupRoute>
                <FinishSetup />
              </FinishSetupRoute>
            }
          />
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
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </>
  );
}
