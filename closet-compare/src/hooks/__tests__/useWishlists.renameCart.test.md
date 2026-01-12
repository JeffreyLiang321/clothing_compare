# Test Cases for renameWishlist Function

This document outlines the test cases for the `renameWishlist` function. To run these tests, you'll need to set up a test framework (e.g., Vitest, Jest) and mock the Supabase client.

## Test Cases

### 1. Successful Rename
- **Given**: A wishlist with name "Old Name"
- **When**: `renameWishlist(wishlistId, "New Name")` is called
- **Then**: 
  - Wishlist name is updated to "New Name"
  - Local state is updated optimistically
  - Database is updated
  - No error is thrown

### 2. Empty Name Validation
- **Given**: A wishlist with name "Old Name"
- **When**: `renameWishlist(wishlistId, "   ")` is called (whitespace only)
- **Then**: 
  - Error is thrown: "Cart name cannot be empty"
  - Wishlist name remains unchanged
  - Database is not updated

### 3. Duplicate Name Detection (Case-Insensitive)
- **Given**: 
  - Wishlist A with name "Work"
  - Wishlist B with name "Personal"
- **When**: `renameWishlist(wishlistBId, "work")` is called (lowercase)
- **Then**: 
  - Error is thrown: "A cart named 'work' already exists"
  - Wishlist B name remains "Personal"
  - Database is not updated

### 4. Duplicate Name with Whitespace
- **Given**: 
  - Wishlist A with name "Work"
  - Wishlist B with name "Personal"
- **When**: `renameWishlist(wishlistBId, " work ")` is called (with spaces)
- **Then**: 
  - Error is thrown: "A cart named ' work ' already exists"
  - Wishlist B name remains "Personal"
  - Database is not updated

### 5. No Change Detection
- **Given**: A wishlist with name "Work"
- **When**: `renameWishlist(wishlistId, "Work")` is called (same name)
- **Then**: 
  - Function returns early without database update
  - No error is thrown
  - Wishlist name remains "Work"

### 6. Case-Only Change (Same Normalized Name)
- **Given**: A wishlist with name "Work"
- **When**: `renameWishlist(wishlistId, "work")` is called (different case)
- **Then**: 
  - Function returns early without database update
  - No error is thrown
  - Wishlist name remains "Work" (or updates to "work" if that's the desired behavior)

### 7. Optimistic Update Rollback on Error
- **Given**: A wishlist with name "Old Name"
- **When**: `renameWishlist(wishlistId, "New Name")` is called but database update fails
- **Then**: 
  - Local state is rolled back to "Old Name"
  - Error is thrown
  - Wishlist name in state matches original

### 8. Database Unique Constraint Violation
- **Given**: 
  - Wishlist A with name "Work"
  - Wishlist B with name "Personal"
  - Race condition: Another user creates "Work" between client check and DB update
- **When**: `renameWishlist(wishlistBId, "Work")` is called
- **Then**: 
  - Database returns unique constraint error (code 23505)
  - Error message: "A cart named 'Work' already exists"
  - Local state is rolled back
  - Wishlist B name remains "Personal"

### 9. Trimming Whitespace
- **Given**: A wishlist with name "Old Name"
- **When**: `renameWishlist(wishlistId, "  New Name  ")` is called (with leading/trailing spaces)
- **Then**: 
  - Wishlist name is updated to "New Name" (trimmed)
  - Database stores "New Name" (trimmed)
  - No error is thrown

### 10. User ID Validation
- **Given**: No user ID (userId is null)
- **When**: `renameWishlist(wishlistId, "New Name")` is called
- **Then**: 
  - Error is thrown: "User ID is required"
  - No database update is attempted

### 11. Wishlist Not Found
- **Given**: A non-existent wishlistId
- **When**: `renameWishlist("non-existent-id", "New Name")` is called
- **Then**: 
  - Error is thrown: "Wishlist not found"
  - No database update is attempted

## Implementation Notes

The `renameWishlist` function should:
1. Validate input (trim, non-empty, user ID present)
2. Check for duplicates (case-insensitive, excluding current wishlist)
3. Skip update if name is unchanged (case-insensitive comparison)
4. Perform optimistic update to local state
5. Update database
6. Rollback optimistic update on any error
7. Handle database unique constraint violations gracefully

