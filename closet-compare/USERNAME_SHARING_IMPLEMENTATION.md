# Username-Based Sharing Implementation Summary

This document summarizes the implementation of username-based sharing, replacing the previous email-based system.

## Overview

The app now uses usernames instead of emails for sharing wishlists. Users can set and edit their username in Settings, and sharing is done by username lookup.

## Files Changed

### 1. Type Definitions
**File**: `src/types.ts`
- Added `Profile` type with `id`, `username`, `created_at`
- Updated `WishlistShare` type:
  - Removed `owner_email` and `shared_with_email`
  - Added `recipient_user_id`
  - Added optional `owner_username` and `recipient_username` for joined data

### 2. Profile Hook
**File**: `src/hooks/useProfile.ts` (NEW)
- `getProfile(userId)`: Fetches or creates profile for a user
- `updateUsername(userId, username)`: Updates username with validation
- `findUserIdByUsername(username)`: Looks up user ID by username (case-insensitive)
- Auto-creates profile if missing
- Validates username: 3-20 chars, lowercase letters/numbers/underscore only
- Handles duplicate username errors

### 3. Settings Page
**File**: `src/pages/Settings.tsx` (NEW)
- UI for username management
- Real-time validation
- Shows current username
- Error handling for duplicate usernames
- Input restrictions (lowercase, alphanumeric, underscore only)

### 4. Updated Sharing Hook
**File**: `src/hooks/useWishlistShares.ts`
- Updated to use `recipient_user_id` instead of `shared_with_email`
- All queries now join with `profiles` table to fetch usernames
- Functions updated:
  - `createShare`: Now takes `recipient_user_id` instead of `shared_with_email`
  - `getSharesByUserId`: Replaces `getSharesByEmail`
  - `getShareByWishlistAndUserId`: Replaces `getShareByWishlistAndEmail`
- All functions return shares with `owner_username` and `recipient_username` populated

### 5. Updated List Page
**File**: `src/pages/List.tsx`
- Changed sharing input from email to username
- Uses `findUserIdByUsername` to lookup recipient
- Validates self-share prevention
- Validates duplicate share prevention
- Displays usernames instead of emails in share list

### 6. Updated Shared Pages
**File**: `src/pages/Shared.tsx`
- Updated to use `getSharesByUserId` instead of `getSharesByEmail`
- Displays owner username instead of email
- Uses `user.id` instead of `user.email` for queries

**File**: `src/pages/SharedView.tsx`
- Updated to use `getShareByWishlistAndUserId` instead of `getShareByWishlistAndEmail`
- Uses `user.id` instead of `user.email` for access checks

### 7. App Navigation
**File**: `src/App.tsx`
- Added Settings route (`/settings`)
- Added Settings link to navigation menu

## New Data Access Functions

### `useProfile` Hook
```typescript
const {
  profile,           // Current user's profile
  loading,           // Loading state
  error,             // Error state
  getProfile,        // Fetch/create profile
  updateUsername,    // Update username with validation
  findUserIdByUsername, // Lookup user by username
  refetch            // Refetch profile
} = useProfile(userId);
```

### Updated `useWishlistShares` Functions
```typescript
// Create share (now uses recipient_user_id)
createShare({
  wishlist_id: string,
  owner_id: string,
  recipient_user_id: string
})

// Get shares for a user (replaces getSharesByEmail)
getSharesByUserId(userId: string)

// Get specific share (replaces getShareByWishlistAndEmail)
getShareByWishlistAndUserId(wishlistId: string, userId: string)
```

## Database Schema Assumptions

The implementation assumes:
- `public.profiles` table exists with:
  - `id` (UUID, primary key, references auth.users)
  - `username` (TEXT, unique, case-insensitive)
  - `created_at` (TIMESTAMP)
- `public.wishlist_shares` table has:
  - `recipient_user_id` (UUID, references profiles.id)
  - RLS policies configured for access control
- Unique index on `lower(username)` in profiles table
- Trigger to auto-create profiles on signup

## Edge Cases Handled

### 1. Duplicate Username
- **Validation**: Client-side check before update
- **Database**: Unique constraint prevents duplicates
- **Error**: "Username is already taken" message shown to user

### 2. Self-Share Prevention
- **Check**: Validates `recipient_user_id !== owner_id` before creating share
- **Error**: "You cannot share with yourself" message

### 3. Already Shared
- **Check**: Validates share doesn't already exist for the same wishlist + recipient
- **Error**: "Wishlist is already shared with this user" message

### 4. Missing Profile
- **Auto-create**: `getProfile` automatically creates profile if missing
- **Default username**: `user_{first8chars}` format
- **Graceful handling**: App continues to work even if profile creation fails initially

### 5. Username Not Found
- **Lookup**: `findUserIdByUsername` throws error if username doesn't exist
- **Error**: "No user with that username" message shown

### 6. Invalid Username Format
- **Validation**: 3-20 characters, lowercase letters/numbers/underscore only
- **Real-time**: Input field restricts invalid characters
- **Error**: Clear validation messages

## UI Changes

### Settings Page
- Accessible via `/settings` route
- Shows current username with @ prefix
- Input field with character restrictions
- Success/error messages
- Save button disabled when unchanged

### Sharing UI (List Page)
- Input changed from email to username
- Placeholder: "username" instead of "recipient@email.com"
- Input type: text (not email)
- Character restrictions applied
- Display shows "@username" format
- No email addresses visible anywhere

### Shared Pages
- Owner displayed as "@username" instead of email
- All email references removed
- Username-based queries throughout

## Migration Notes

### For Existing Users
- Profiles should be auto-created by trigger on signup
- Existing shares using `shared_with_email` will need migration
- Consider data migration script if needed

### For New Users
- Profile created automatically on first signup
- Default username generated if not set
- Users can change username in Settings

## Testing Checklist

- [ ] User can set username in Settings
- [ ] Username validation works (length, characters)
- [ ] Duplicate username error shown correctly
- [ ] User can share wishlist by username
- [ ] Self-share prevention works
- [ ] Duplicate share prevention works
- [ ] Username not found error shown
- [ ] Shared wishlists show owner username
- [ ] Shared page displays usernames correctly
- [ ] No email addresses visible in sharing UI
- [ ] Profile auto-creation works for new users

## Security Considerations

- Usernames are case-insensitive (stored lowercase)
- No email addresses exposed in sharing UI
- RLS policies should enforce access control
- Username validation prevents injection attacks
- User can only update their own username

