# Migration: owner_id → owner_user_id

## Summary

Updated all `wishlist_shares` related code to use `owner_user_id` instead of `owner_id` to match the current Supabase schema.

## Files Changed

### 1. `src/types.ts`
- **Changed**: `WishlistShare.owner_id` → `WishlistShare.owner_user_id`
- **Why**: TypeScript type must match database schema

### 2. `src/hooks/useWishlistShares.ts`
- **Function parameter**: `ownerId` → `ownerUserId` (for clarity)
- **All database queries**: `.eq("owner_id", ...)` → `.eq("owner_user_id", ...)`
- **All data access**: `share.owner_id` → `share.owner_user_id`
- **Insert payload**: Already had `owner_user_id`, verified correct
- **Why**: Database column is `owner_user_id`, not `owner_id`

### 3. `src/pages/List.tsx`
- **Changed**: `createShare` call uses `owner_user_id: user.id` instead of `owner_id: user.id`
- **Why**: Insert payload must match schema

## Database Schema Alignment

All `wishlist_shares` inserts now include:
- ✅ `wishlist_id`
- ✅ `owner_user_id` 
- ✅ `recipient_user_id`

## Verification

- ✅ TypeScript types updated
- ✅ All database queries use `owner_user_id`
- ✅ All data transformations use `owner_user_id`
- ✅ Insert payloads include all required fields
- ✅ No references to `owner_id` in wishlist_shares context (except local variable `ownerIds` which is fine)

## Note

- `wishlists.user_id` remains unchanged (as requested)
- Only `wishlist_shares` table references were updated


