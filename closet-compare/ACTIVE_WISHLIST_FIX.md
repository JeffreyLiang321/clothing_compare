# Active Wishlist Fix - Single Source of Truth

## Problem

When adding an item, the wrong `wishlist_id` was being used because:
1. **Multiple sources of truth**: `AddItem.tsx` read from localStorage independently
2. **Stale localStorage**: When user signs out/in, localStorage wasn't cleared, so it contained the previous user's wishlist ID
3. **No validation**: No check that the wishlist belongs to the current user before insert
4. **Race conditions**: Components initialized at different times, causing mismatches

## Root Cause

**Where the wrong wishlist_id was stored**: `localStorage.getItem("activeWishlistId")`

**Why it was wrong**:
- User A (84793c...) had wishlist `4a281d1c...` selected
- User A signs out
- User B (44cef...) signs in
- `AddItem.tsx` reads from localStorage on mount (line 41): `getActiveWishlistId()` returns `4a281d1c...`
- This wishlist belongs to User A, not User B
- RLS correctly blocks the insert because `wishlist_id` doesn't belong to User B

## Solution

Created a **single source of truth** using React Context that:
1. Manages `activeWishlistId` in one place
2. Clears it when user changes
3. Validates it belongs to current user
4. Initializes from user's wishlists

## Files Changed

### 1. `src/contexts/ActiveWishlistContext.tsx` (NEW)
- Context provider that manages `activeWishlistId`
- Clears when `user?.id` changes
- Validates wishlist belongs to current user
- Auto-initializes to first wishlist if none selected

### 2. `src/App.tsx`
- Wraps `ProtectedRoute` with `ActiveWishlistProvider`
- Ensures context is available to all protected pages

### 3. `src/pages/AddItem.tsx`
- Removed: `useState` for `activeWishlistId` and `getActiveWishlistId()` call
- Added: `useActiveWishlist()` hook
- Added: Validation guard before insert - checks wishlist belongs to user
- Uses context `activeWishlistId` instead of localStorage

### 4. `src/pages/List.tsx`
- Removed: `useState` for `activeWishlistId`
- Added: `useActiveWishlist()` hook
- Uses context `activeWishlistId` instead of local state

### 5. `src/components/WishlistSelector.tsx`
- Removed: All `localStorage` read/write operations
- Removed: `getActiveWishlistId()` and `setActiveWishlistId()` export functions
- Added: `useActiveWishlist()` hook
- Uses context for `activeWishlistId` and `setActiveWishlistId`
- Syncs changes to callback via `useEffect`

### 6. `src/pages/SharedView.tsx`
- Removed: `getActiveWishlistId()` import and calls
- Added: `useActiveWishlist()` hook
- Uses context `activeWishlistId` instead of localStorage

## Key Features

### 1. Single Source of Truth
- All components use `useActiveWishlist()` hook
- No localStorage reads/writes scattered across components
- Context manages state centrally

### 2. User Change Handling
- Context clears `activeWishlistId` when `user?.id` changes
- Prevents stale data from previous user

### 3. Validation
- Context validates wishlist belongs to current user before setting
- `AddItem.tsx` has additional guard before insert
- Invalid wishlists are reset to first valid wishlist

### 4. Auto-initialization
- If no active wishlist, uses first wishlist from user's list
- If active wishlist is invalid, resets to first valid wishlist

## Flow After Fix

1. User signs in → Context clears `activeWishlistId` (null)
2. Wishlists load → Context sets to first wishlist
3. User selects different wishlist → Context validates and sets
4. User signs out → Context clears `activeWishlistId`
5. New user signs in → Context starts fresh (no stale data)
6. AddItem uses context → Always gets current user's wishlist
7. Insert validates → Double-check before insert

## Why This Fixes the Bug

**Before**: 
- `AddItem.tsx` read stale localStorage value from previous user
- No validation that wishlist belongs to current user
- Multiple components managing state independently

**After**:
- `AddItem.tsx` reads from context (single source of truth)
- Context cleared when user changes (no stale data)
- Validation ensures wishlist belongs to current user
- All components stay in sync

## Testing

- ✅ Sign in as User A, select wishlist → Works
- ✅ Sign out → Context cleared
- ✅ Sign in as User B → Starts fresh, no User A's wishlist
- ✅ Add item → Uses User B's wishlist (validated)
- ✅ Switch wishlists → All components update together
- ✅ Invalid wishlist → Auto-resets to valid one

