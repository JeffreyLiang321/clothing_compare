import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { useWishlists } from "../hooks/useWishlists";

type ActiveWishlistContextType = {
  activeWishlistId: string | null;
  setActiveWishlistId: (id: string | null) => void;
};

const ActiveWishlistContext = createContext<ActiveWishlistContextType | undefined>(undefined);

export function ActiveWishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { wishlists, loading: wishlistsLoading } = useWishlists(user?.id || null);
  const [activeWishlistId, setActiveWishlistIdState] = useState<string | null>(null);

  // Clear active wishlist when user changes
  useEffect(() => {
    setActiveWishlistIdState(null);
  }, [user?.id]);

  // Initialize active wishlist from user's wishlists
  useEffect(() => {
    if (!user || wishlistsLoading) {
      return;
    }

    // If no wishlists, clear active
    if (wishlists.length === 0) {
      if (activeWishlistId !== null) {
        setActiveWishlistIdState(null);
      }
      return;
    }

    // If no active wishlist is set, use the first one
    if (!activeWishlistId) {
      setActiveWishlistIdState(wishlists[0].id);
      return;
    }

    // Validate that active wishlist belongs to current user
    const isValid = wishlists.some((w) => w.id === activeWishlistId);
    if (!isValid) {
      // Reset to first wishlist if current one is invalid
      setActiveWishlistIdState(wishlists[0].id);
    }
  }, [user?.id, wishlistsLoading, wishlists.length, wishlists, activeWishlistId]);

  const setActiveWishlistId = (id: string | null) => {
    // Validate that the wishlist belongs to current user before setting
    if (id && user && wishlists.length > 0) {
      const isValid = wishlists.some((w) => w.id === id);
      if (!isValid) {
        console.warn("Attempted to set active wishlist that doesn't belong to current user");
        return;
      }
    }
    setActiveWishlistIdState(id);
  };

  return (
    <ActiveWishlistContext.Provider value={{ activeWishlistId, setActiveWishlistId }}>
      {children}
    </ActiveWishlistContext.Provider>
  );
}

export function useActiveWishlist() {
  const context = useContext(ActiveWishlistContext);
  if (context === undefined) {
    throw new Error("useActiveWishlist must be used within ActiveWishlistProvider");
  }
  return context;
}

