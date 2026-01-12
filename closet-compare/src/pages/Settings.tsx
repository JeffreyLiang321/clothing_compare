import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProfile } from "../hooks/useProfile";

export default function Settings() {
  const { user } = useAuth();
  const { profile, loading: profileLoading, updateUsername, refetch } = useProfile(user?.id || null);
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !username.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateUsername(user.id, username.trim());
      await refetch();
      setSuccess("Username updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error updating username:", err);
      setError(err.message || "Failed to update username");
    }

    setSaving(false);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    // Only allow lowercase letters, numbers, and underscores
    if (value === "" || /^[a-z0-9_]*$/.test(value)) {
      setUsername(value);
      setError(null);
    }
  };

  if (profileLoading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">You must be signed in to view settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <h1>Settings</h1>
        <p className="subtitle">Manage your profile settings</p>

        <div style={{ marginTop: 32, maxWidth: 500 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
            Username
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16 }}>
            Your username is used when others share wishlists with you. It must be 3-20 characters
            and can only contain lowercase letters, numbers, and underscores.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                className="input"
                value={username}
                onChange={handleUsernameChange}
                placeholder="your_username"
                minLength={3}
                maxLength={20}
                pattern="[a-z0-9_]{3,20}"
                disabled={saving}
                style={{
                  borderColor: error ? "#991b1b" : undefined,
                }}
              />
              {error && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#991b1b",
                  }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    color: "#065f46",
                  }}
                >
                  {success}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="submit"
                className="button"
                disabled={saving || !username.trim() || username === profile?.username}
              >
                {saving ? "Saving..." : "Save Username"}
              </button>
            </div>
          </form>

          {profile && (
            <div style={{ marginTop: 24, padding: 16, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 8 }}>
                Current username
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>@{profile.username}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

