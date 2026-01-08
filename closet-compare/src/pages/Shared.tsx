import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWishlists } from "../hooks/useWishlists";
import { useWishlistShares } from "../hooks/useWishlistShares";
import type { WishlistShare, Wishlist } from "../types";

export default function Shared() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getSharesByEmail } = useWishlistShares(null, null);
  const { getWishlist } = useWishlists(user?.id || null);
  const [shares, setShares] = useState<
    Array<WishlistShare & { wishlist: Wishlist }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedWishlists = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const sharesData = await getSharesByEmail(user.email);

        if (!sharesData || sharesData.length === 0) {
          setShares([]);
          setLoading(false);
          return;
        }

        const sharesWithWishlists = await Promise.all(
          sharesData.map(async (share) => {
            try {
              // For shared wishlists, we need to fetch without user_id check
              // So we'll use a direct query here
              const { data: wishlistData, error } = await supabase
                .from("wishlists")
                .select("*")
                .eq("id", share.wishlist_id)
                .single();

              if (error || !wishlistData) {
                return null;
              }

              return { ...share, wishlist: wishlistData as Wishlist };
            } catch (error) {
              console.error("Error fetching wishlist:", error);
              return null;
            }
          })
        );

        setShares(
          sharesWithWishlists.filter(
            (item): item is WishlistShare & { wishlist: Wishlist } =>
              item !== null
          )
        );
      } catch (error) {
        console.error("Error fetching shared wishlists:", error);
        setShares([]);
      }

      setLoading(false);
    };

    fetchSharedWishlists();
  }, [user, getSharesByEmail]);

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
                  Shared by {share.owner_email}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

