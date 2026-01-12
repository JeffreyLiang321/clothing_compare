# Ownership Boundaries

## Auth

- **AuthCallback.tsx**: enacts PKCE, checking for code and exchanging for session
- **Auth.tsx**: handles sign in with Google email and regular magic link sign in
- **useAuth.ts**: handles listening to Supabase auth events to set user, session, and loading
- **ProtectedRoute (within App.tsx)**: handles rendering based on authentication state
- **supabase.ts**: configures Supabase client and provides auth redirect URL helper

## Items

- **useItems.ts**: manages CRUD operations for items (create, read, update, delete) with wishlist-scoped fetching and local state management
- **List.tsx**: displays items table with filtering, sorting, and wishlist selection; orchestrates item updates/deletes and account-based sharing
- **AddItem.tsx**: handles item creation form, prefills from URL params, manages form state and submission
- **ItemTable.tsx**: renders items in table format with inline editing capabilities and read-only mode support
- **ItemForm.tsx**: provides reusable form UI for item creation/editing with all fields and validation

## Wishlists

- **useWishlists.ts**: manages wishlist CRUD operations, fetching by user ID, token lookup, and ID lookup
- **WishlistSelector.tsx**: handles wishlist selection UI, creates default wishlist if none exist, manages active wishlist in localStorage, and provides cart creation modal
- **List.tsx**: displays items from the selected wishlist and handles account-based sharing UI for that wishlist
- **AddItem.tsx**: uses wishlist selection for item creation context

## Sharing

### Account-Based Sharing (email-to-email)
- **useWishlistShares.ts**: manages wishlist_shares table operations (create, delete, fetch by wishlist/owner, fetch by email, verify access)
- **List.tsx**: handles UI for sharing wishlists with other users via email (create/remove shares)
- **Shared.tsx**: displays list of wishlists shared with the current user's email
- **SharedView.tsx**: displays a single shared wishlist (read-only) with copy-to-own-cart functionality; verifies email-based access

### Token-Based Public Sharing
- **Share.tsx**: handles public token-based sharing (read-only view via share_token); no auth required
- **useWishlists.ts**: provides `getWishlistByToken()` for fetching public wishlists by token

## Components

- **ItemTable.tsx**: renders items table with edit/delete actions; supports read-only mode
- **ItemForm.tsx**: reusable form component for item data entry
- **WishlistSelector.tsx**: dropdown selector for choosing active wishlist with creation flow
- **InsightBar.tsx**: displays aggregated statistics (top store, median price, top tag, status counts, total items)

## Routing & Navigation

- **App.tsx**: defines all routes, wraps protected routes, provides navigation component
- **Nav (within App.tsx)**: renders navigation bar with sign-out functionality
- **main.tsx**: app entry point with router setup

## Data Flow Patterns

- **Hooks** (useAuth, useItems, useWishlists, useWishlistShares): handle data fetching, mutations, and local state
- **Pages**: orchestrate UI, user interactions, and hook usage
- **Components**: presentational UI with minimal business logic
- **lib/supabase.ts**: centralized Supabase client configuration

