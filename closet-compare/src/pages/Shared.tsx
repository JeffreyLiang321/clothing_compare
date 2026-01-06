import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import type { WishlistShare, Wishlist } from "../types";

export default function Shared() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

      const { data: sharesData, error: sharesError } = await supabase
        .from("wishlist_shares")
        .select("*")
        .ilike("shared_with_email", user.email);

      if (sharesError) {
        console.error("Error fetching shared wishlists:", sharesError);
        setLoading(false);
        return;
      }

      if (!sharesData || sharesData.length === 0) {
        setShares([]);
        setLoading(false);
        return;
      }

      const wishlistIds = sharesData.map((share) => share.wishlist_id);
      const { data: wishlistsData, error: wishlistsError } = await supabase
        .from("wishlists")
        .select("*")
        .in("id", wishlistIds);

      if (wishlistsError) {
        console.error("Error fetching wishlists:", wishlistsError);
        setLoading(false);
        return;
      }

      const sharesWithWishlists = sharesData
        .map((share) => {
          const wishlist = wishlistsData?.find((w) => w.id === share.wishlist_id);
          return wishlist ? { ...share, wishlist } : null;
        })
        .filter(
          (item): item is WishlistShare & { wishlist: Wishlist } =>
            item !== null
        );

      setShares(sharesWithWishlists);
      setLoading(false);
    };

    fetchSharedWishlists();
  }, [user]);

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

