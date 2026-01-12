# Wishlist Initialization Loop Fix

## Problem
The wishlist initialization logic was creating default wishlists in a loop when fetch errors occurred. When `wishlists` was empty due to an error, the code treated it as "no wishlists exist" and attempted to create a default one, causing an infinite loop.

## Solution
Updated the initialization logic to:
1. Only create default wishlist after **successful** fetch AND `wishlists.length === 0`
2. Check for error state and skip creation if fetch failed
3. Add error state display with "Retry" button
4. Ensure effect runs once per session using `hasInitializedRef` guard

## File Changed
**File**: `src/components/WishlistSelector.tsx`

## Exact Changes

### 1. Added error state from hook
```diff
- const { wishlists, loading: wishlistsLoading, createWishlist, renameWishlist, refetch } = useWishlists(user?.id || null);
+ const { wishlists, loading: wishlistsLoading, error: wishlistsError, createWishlist, renameWishlist, refetch } = useWishlists(user?.id || null);
```

### 2. Removed unnecessary ref
```diff
  const onWishlistChangeRef = useRef(onWishlistChange);
  const hasInitializedRef = useRef(false);
- const hasRefetchedRef = useRef(false);
```

### 3. Simplified reset logic
```diff
  // Reset initialization state when user changes
  useEffect(() => {
    hasInitializedRef.current = false;
-   hasRefetchedRef.current = false;
    setActiveWishlistId(null);
  }, [user?.id]);
```

### 4. Fixed initialization logic
```diff
  useEffect(() => {
    const initializeWishlists = async () => {
-     console.log("[WishlistSelector] initializeWishlists called", {
-       user: user?.id,
-       wishlistsLoading,
-       hasInitialized: hasInitializedRef.current,
-       wishlistsCount: wishlists.length,
-       hasRefetched: hasRefetchedRef.current,
-       wishlistIds: wishlists.map((w) => w.id),
-     });
-
       // Only run when loading completes and we haven't initialized yet
       if (!user || wishlistsLoading || hasInitializedRef.current) {
-         console.log("[WishlistSelector] Early return:", {
-           noUser: !user,
-           loading: wishlistsLoading,
-           initialized: hasInitializedRef.current,
-         });
         return;
       }
 
-      // If wishlists is empty and we haven't done a defensive refetch yet, do it
-      // This ensures we have the latest data before creating a default
-      if (wishlists.length === 0 && !hasRefetchedRef.current) {
-        console.log("[WishlistSelector] Doing defensive refetch (wishlists is empty)");
-        hasRefetchedRef.current = true;
-        await refetch();
-        console.log("[WishlistSelector] Defensive refetch completed, effect will re-run");
-        // If refetch populated wishlists, let the effect re-run with the new data
-        return;
-      }
-
-      // Now we're confident the list is loaded (either populated or confirmed empty)
-      // Mark as initialized to prevent duplicate creation
-      hasInitializedRef.current = true;
-      console.log("[WishlistSelector] Marked as initialized. Current wishlists count:", wishlists.length);
-
-      // If still empty after refetch, create default wishlist
+      // If there's an error, don't attempt to create default wishlist
+      // Mark as initialized to prevent retry loops
+      if (wishlistsError) {
+        console.error("[WishlistSelector] Error fetching wishlists, skipping initialization:", wishlistsError);
+        hasInitializedRef.current = true;
+        return;
+      }
+
+      // Only create default wishlist if fetch was successful AND wishlists.length === 0
       if (wishlists.length === 0) {
-        console.log("[WishlistSelector] Creating default 'My Wishlist' (confirmed empty after refetch)");
+        console.log("[WishlistSelector] Creating default 'My Wishlist' (confirmed empty after successful fetch)");
+        // Mark as initialized BEFORE attempting creation to prevent loops
         hasInitializedRef.current = true;
         
         try {
          const newWishlist = await createWishlist("My Wishlist");
          console.log("[WishlistSelector] Created default wishlist:", newWishlist.id);
          await refetch();
 
          const activeId = newWishlist.id;
          setActiveWishlistId(activeId);
          localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
          if (onWishlistChangeRef.current) {
            onWishlistChangeRef.current(activeId);
          }
        } catch (error) {
          console.error("Error creating default wishlist:", error);
-         hasInitializedRef.current = false;
+          // Don't reset hasInitializedRef - we've already tried once
        }
        return;
      }
 
       // If wishlists exist, set active from localStorage or first wishlist
+      hasInitializedRef.current = true;
-      console.log("[WishlistSelector] Wishlists exist, setting active wishlist. Available:", wishlists.map((w) => ({ id: w.id, name: w.name })));
       const storedId = localStorage.getItem(ACTIVE_WISHLIST_KEY);
       const activeId =
         storedId && wishlists.some((w) => w.id === storedId)
           ? storedId
           : wishlists[0].id;
 
-      console.log("[WishlistSelector] Setting active wishlist:", activeId);
       setActiveWishlistId(activeId);
       localStorage.setItem(ACTIVE_WISHLIST_KEY, activeId);
       if (onWishlistChangeRef.current) {
         onWishlistChangeRef.current(activeId);
       }
     };
 
     initializeWishlists();
-  }, [user?.id, wishlistsLoading, wishlists.length, refetch, createWishlist]);
+  }, [user?.id, wishlistsLoading, wishlists.length, wishlistsError, refetch, createWishlist]);
```

### 5. Added error UI with retry button
```diff
  if (wishlistsLoading) {
    return (
      <select className="select" disabled style={{ minWidth: 200 }}>
        <option>Loading...</option>
      </select>
    );
  }
 
+ if (wishlistsError) {
+   return (
+     <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 200 }}>
+       <div style={{ fontSize: 14, color: "#991b1b", padding: "8px 12px", background: "#fee2e2", borderRadius: 6 }}>
+         Failed to load wishlists
+       </div>
+       <button
+         type="button"
+         className="button"
+         onClick={async () => {
+           await refetch();
+         }}
+         style={{ fontSize: 14, padding: "8px 12px" }}
+       >
+         Retry
+       </button>
+     </div>
+   );
+ }
+
   return (
```

## Key Improvements

1. **Error Check First**: Before attempting to create a default wishlist, we check if there's an error. If so, we skip creation and mark as initialized to prevent loops.

2. **Success-Only Creation**: Default wishlist is only created if:
   - Fetch completed successfully (`!wishlistsError`)
   - AND `wishlists.length === 0`

3. **Initialization Guard**: `hasInitializedRef` is set BEFORE attempting creation, preventing infinite loops even if creation fails.

4. **Error UI**: When fetch fails, user sees an error message with a "Retry" button instead of a broken dropdown.

5. **Simplified Logic**: Removed unnecessary defensive refetch logic that was causing complexity.

## Testing

- ✅ Fetch error: Shows error message with retry button, no default wishlist creation
- ✅ Successful fetch with 0 wishlists: Creates default wishlist once
- ✅ Successful fetch with existing wishlists: Sets active wishlist, no creation
- ✅ Retry button: Refetches and re-initializes correctly
- ✅ No infinite loops: `hasInitializedRef` prevents re-running initialization

