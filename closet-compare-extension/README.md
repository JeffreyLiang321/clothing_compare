# Closet Compare Chrome Extension

A browser extension that makes it super easy to save clothing items to [Closet Compare](https://github.com/JeffreyLiang321/closet-compare) — your personal wishlist tracker for clothes you're thinking about buying.

## What is Closet Compare?

Closet Compare is a web app I built to help you keep track of clothing items you're considering buying. Instead of having a million browser tabs open or losing track of that perfect jacket you saw last week, you can save everything in one place.

**Key features:**
- 📦 **Multiple wishlists** — Organize items into different carts (e.g., "Winter Clothes", "Summer Wardrobe")
- 🏷️ **Track everything** — Store item name, price, store, tags, notes, and images
- 📊 **Status tracking** — Mark items as "Considering", "Bought", or "Dropped" with reasons
- 👥 **Share with friends** — Share your wishlists and get feedback with like/dislike reactions
- 📈 **Insights** — See your median price, most-saved stores, and top tags
- 🔍 **Filter & sort** — Find items quickly by status, price, or date

## What does the extension do?

The Chrome extension extracts product information from any clothing website and opens Closet Compare with all the details pre-filled. Instead of manually copying and pasting URLs, names, prices, and images, you just click the extension icon and everything is ready to go.

**It automatically extracts:**
- Product URL
- Item name (from page title or Open Graph tags)
- Store name (from the website domain)
- Price (from meta tags or page content)
- Product image (from Open Graph or Twitter Card images)

## Installation

### Load as Unpacked Extension (For Development/Personal Use)

1. **Download or clone the extension files**
   ```bash
   git clone <your-repo-url>
   cd closet-compare-extension
   ```

2. **Open Chrome Extensions page**
   - Go to `chrome://extensions/` in your browser
   - Or: Chrome menu → Extensions → Manage Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top-right corner

4. **Load the extension**
   - Click "Load unpacked"
   - Select the `closet-compare-extension` folder
   - The extension should now appear in your extensions list

5. **Configure the app URL**
   - Right-click the extension icon → Options
   - Enter your Closet Compare app URL:
     - **Local development**: `http://localhost:5173`
     - **Production**: `https://your-app.vercel.app` (or wherever you've deployed it)
   - Click "Save"

## How to Use

1. **Browse clothing websites** — Visit any online store (Uniqlo, Zara, H&M, etc.)

2. **Click the extension icon** — When you find something you like, click the Closet Compare extension icon in your Chrome toolbar

3. **Review pre-filled data** — A new tab opens with Closet Compare's "Add Item" page, with all the product info already filled in:
   - URL, name, store, price, and image are pre-populated
   - You can edit anything before saving

4. **Add details** (optional):
   - Add tags (e.g., "jacket", "winter", "casual")
   - Add notes (e.g., "Size M, check reviews")
   - Adjust price if needed

5. **Save** — Click "Add Item" and it's saved to your current wishlist!

## Configuration

The extension needs to know where your Closet Compare app is hosted. Configure it in the extension options:

1. Right-click the extension icon → **Options**
2. Enter your app URL:
   - Local: `http://localhost:5173`
   - Production: `https://your-deployed-app.com`
3. Click **Save**

The URL is stored in Chrome's sync storage, so it will sync across your devices.

## How It Works

The extension uses Chrome's scripting API to extract data from the current page:

- **URL**: Uses `window.location.href`
- **Name**: Checks Open Graph (`og:title`) or Twitter Card (`twitter:title`) meta tags, falls back to page title
- **Store**: Extracts from the hostname (e.g., `uniqlo.com` → "Uniqlo")
- **Price**: Looks for `product:price:amount` or `og:price:amount` meta tags, or searches page text for price patterns
- **Image**: Uses `og:image` or `twitter:image` meta tags

Then it opens your Closet Compare app with all this data as URL parameters, which the app automatically fills into the add item form.

## Requirements

- **Chrome browser** (or Chromium-based browsers like Edge, Brave)
- **Closet Compare app** — You need the main web app running and accessible
- **Permissions**: The extension needs:
  - `activeTab` — To read the current page's content
  - `tabs` — To open new tabs
  - `scripting` — To extract page data
  - `storage` — To save your app URL preference

## Troubleshooting

**Extension icon is grayed out / doesn't work:**
- Make sure you're on a valid webpage (not `chrome://` pages)
- Check that the extension is enabled in `chrome://extensions/`

**Data isn't being extracted correctly:**
- Some websites don't have proper meta tags
- The extension does its best, but you may need to manually fill in some fields
- Price extraction is a best-effort — it looks for common patterns but may miss some formats

**Opens wrong URL or doesn't open:**
- Check your extension options — make sure the app URL is correct
- Try the full URL including `https://` or `http://`
- For local development, make sure your dev server is running on port 5173

**Extension doesn't appear:**
- Make sure you loaded it correctly in Developer Mode
- Check that all files are in the extension folder
- Try reloading the extension in `chrome://extensions/`

## Development

The extension is a simple Manifest V3 extension with:
- `manifest.json` — Extension configuration
- `background.js` — Service worker that handles the click action
- `options.html/js` — Settings page for configuring the app URL

To modify:
1. Edit the files in `closet-compare-extension/`
2. Go to `chrome://extensions/`
3. Click the reload icon on the extension card
4. Test your changes

## Privacy

The extension:
- ✅ Only reads data from pages you explicitly click on
- ✅ Only extracts product information (no personal data)
- ✅ Stores your app URL locally in Chrome sync storage
- ✅ Doesn't send any data to third parties
- ✅ All data goes directly to your Closet Compare app

## License

[Your license here]

## Support

If you run into issues or have questions, feel free to open an issue on GitHub or reach out!

---

**Made with ❤️ for keeping track of all the clothes you want to buy**

