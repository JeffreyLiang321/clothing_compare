import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWishlists } from "../hooks/useWishlists";
import { useWishlistShares } from "../hooks/useWishlistShares";
import type { WishlistShare, Wishlist } from "../types";

export default function Shared() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getSharesByUserId } = useWishlistShares(null, null);
  const { getWishlistById } = useWishlists(null);
  const [shares, setShares] = useState<
    Array<WishlistShare & { wishlist: Wishlist }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchSharedWishlists = async () => {
      // Don't enter loading state if user is not available
      if (!user?.id) {
        setLoading(false);
        setError(null);
        setShares([]);
        isFetchingRef.current = false;
        lastFetchedUserIdRef.current = null;
        return;
      }

      // If user ID changed, reset the last fetched user ID to allow new fetch
      if (lastFetchedUserIdRef.current && lastFetchedUserIdRef.current !== user.id) {
        lastFetchedUserIdRef.current = null;
      }

      // Prevent duplicate fetches - if already fetching or already fetched this user ID, skip
      if (isFetchingRef.current || lastFetchedUserIdRef.current === user.id) {
        return;
      }

      isFetchingRef.current = true;
      lastFetchedUserIdRef.current = user.id;
      setLoading(true);
      setError(null);

      try {
        console.log("[Shared] Fetching shares for user ID:", user.id);
        const sharesData = await getSharesByUserId(user.id);

        if (!sharesData || sharesData.length === 0) {
          console.log("[Shared] No shares found");
          setShares([]);
          return;
        }

        console.log("[Shared] Found", sharesData.length, "shares, fetching wishlists...");
        const sharesWithWishlists = await Promise.all(
          sharesData.map(async (share) => {
            try {
              const wishlistData = await getWishlistById(share.wishlist_id);
              return { ...share, wishlist: wishlistData };
            } catch (error) {
              console.error(
                "[Shared] Error fetching wishlist:",
                {
                  wishlist_id: share.wishlist_id,
                  error,
                  table: "wishlists",
                }
              );
              return null;
            }
          })
        );

        const validShares = sharesWithWishlists.filter(
          (item): item is WishlistShare & { wishlist: Wishlist } =>
            item !== null
        );

        console.log("[Shared] Successfully loaded", validShares.length, "wishlists");
        setShares(validShares);
      } catch (error: any) {
        console.error(
          "[Shared] Error fetching shared wishlists:",
          {
            error,
            userId: user.id,
            table: "wishlist_shares",
            filter: `recipient_user_id = ${user.id}`,
          }
        );
        setError(
          error?.message || "Failed to load shared wishlists. Please try again."
        );
        setShares([]);
      } finally {
        // ALWAYS set loading to false, regardless of success or error
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    fetchSharedWishlists();
    // Only depend on user.id, not the entire user object or getSharesByUserId function
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-body">
          <div className="empty">Loading...</div>
        </div>
      </div>
    );
  }
  // catching error properly 
  if (error) {
    return (
      <div className="panel">
        <div className="panel-body">
          <h1>Shared with Me</h1>
          <p className="subtitle">Wishlists shared with you by other users</p>
          <div className="toast toast-error" style={{ marginTop: 24 }}>
            {error}
          </div>
          <button
            className="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 16 }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <h1>Shared with Me</h1>
        <p className="subtitle">Wishlists shared with you by other users</p>

        {shares.length === 0 ? (
          <div className="empty">
            <p>No wishlists shared with you yet</p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
              marginTop: 24,
            }}
          >
            {shares.map((share) => (
              <div
                key={share.id}
                onClick={() => navigate(`/shared/${share.wishlist_id}`)}
                style={{
                  padding: 20,
                  background: "white",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "var(--shadow)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {share.wishlist.name}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--muted)",
                  }}
                >
                  Shared by @{share.owner_username || "unknown"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

