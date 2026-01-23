# Closet Compare

Hey there, this is a personal wishlist tracker for clothing items you're considering buying. Stop losing track of that perfect jacket you saw last week — save everything in one place, organize it, share it with friends, and get their feedback.

## What is this?

Closet Compare is a web app I built to solve a simple problem: I was constantly finding clothes I wanted to buy but forgetting about them later. Instead of having a million browser tabs open or losing links in bookmarks, I wanted one place to track everything.

**The core idea:** Save clothing items from any store, organize them into wishlists, track their status (considering → bought/dropped), and share with friends to get their opinions.

## Features

### 📦 Multiple Wishlists
Create different carts for different purposes — "Winter Clothes", "Summer Wardrobe", "Gift Ideas", etc. Switch between them easily.

### 🏷️ Rich Item Tracking
For each item, track:
- **Store** — Where it's from (Uniqlo, Zara, etc.)
- **Name** — Product name
- **Price** — Current price
- **Image** — Product photo
- **Tags** — Custom tags (e.g., "jacket", "winter", "casual")
- **Notes** — Personal notes or reminders
- **Status** — Considering, Bought, or Dropped
- **Decision reason** — Why you bought or dropped it

### 📊 Insights Dashboard
See helpful stats about your wishlist:
- Most saved store
- Median price across all items
- Top tags
- Status breakdown

### 👥 Sharing & Collaboration
- **Share wishlists** with friends by username
- **Get feedback** — Recipients can like/dislike items
- **See aggregate scores** — View how many people liked/disliked each item
- **Owners see all reactions** — Full visibility into what people think

### 🔍 Filter & Sort
- Filter by status (All, Considering, Bought, Dropped)
- Sort by newest, price (low to high, high to low)
- Search and organize easily

### 🚀 Chrome Extension
Install the [Chrome extension](../closet-compare-extension/) to save items with one click. It automatically extracts product info from any clothing website.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Deployment**: Vercel
- **Extension**: Chrome Extension Manifest V3

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- (Optional) Chrome browser for the extension

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd closet-compare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see `migrations/` folder)
   - Get your project URL and anon key

4. **Configure environment variables**
   Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Run database migrations**
   - Execute the SQL files in the `migrations/` folder in your Supabase SQL editor
   - Required migrations:
     - Tables: `profiles`, `wishlists`, `items`, `wishlist_shares`, `item_reactions`
     - RPC functions: `get_wishlist_item_scores`

6. **Start the dev server**
   ```bash
   npm run dev
   ```

7. **Open in browser**
   - Navigate to `http://localhost:5173`
   - Sign up / sign in with Supabase Auth
   - Complete onboarding (set username)
   - Start adding items!

### Building for Production

```bash
npm run build
```

The `dist/` folder contains the production build. Deploy to Vercel, Netlify, or any static hosting service.

## Database Schema

### Tables

- **profiles** — User profiles with usernames
- **wishlists** — User wishlists/carts
- **items** — Clothing items in wishlists
- **wishlist_shares** — Sharing relationships between users
- **item_reactions** — Like/dislike reactions on items

### RLS Policies

- Users can only access their own data
- Shared wishlists are accessible to recipients
- Recipients can only see their own reactions (owners see all)
- Owners can read all reactions on their shared items

## Project Structure

```
closet-compare/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── contexts/       # React contexts
│   ├── lib/            # Utilities (Supabase client, auth helpers)
│   └── types.ts        # TypeScript types
├── migrations/         # SQL migration files
├── public/             # Static assets
└── closet-compare-extension/  # Chrome extension

closet-compare-extension/
├── manifest.json       # Extension manifest
├── background.js       # Extension service worker
├── options.html/js     # Extension settings page
└── README.md          # Extension documentation
```

## Usage

### Adding Items

**Via Web App:**
1. Go to "Add Item" page
2. Fill in item details manually
3. Or use the Chrome extension (see below)

**Via Chrome Extension:**
1. Browse any clothing website
2. Click the extension icon
3. Item details are auto-filled
4. Review and save

### Managing Wishlists

- Create multiple wishlists from Settings
- Switch between wishlists using the selector
- Rename or delete wishlists
- Share wishlists with friends by username

### Sharing & Feedback

- Share a wishlist: Enter recipient's username in the share form
- View shared wishlists: Go to "Shared with Me" page
- React to items: Like/dislike buttons appear on shared items
- See scores: View aggregate likes/dislikes and total votes

### Tracking Status

- **Considering** — Default status for new items
- **Bought** — Mark when purchased (add reason)
- **Dropped** — Mark when decided not to buy (add reason)

## Chrome Extension

See the [extension README](../closet-compare-extension/README.md) for installation and usage instructions.

The extension automatically extracts:
- Product URL
- Item name
- Store name
- Price
- Product image

## Environment Variables

Required:
- `VITE_SUPABASE_URL` — Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Your Supabase anon/public key

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The `vercel.json` config handles routing for the SPA.

### Other Platforms

Any static hosting service works:
- Netlify
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

Make sure to:
- Set environment variables
- Configure SPA routing (redirect all routes to `index.html`)

## Contributing

Feel free to open issues or submit pull requests! This is a personal project, but I'm happy to accept contributions.

## Acknowledgments

Built with:
- [React](https://react.dev/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

---

**Made to solve my own problem of losing track of clothes I want to buy. Hope it helps you too!**
