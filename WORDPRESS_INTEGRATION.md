# WordPress Headless CMS Integration - Setup & Usage Guide

This document covers the WordPress integration for the Bike Bench React app.

## Quick Start

1. **Set WordPress URL in .env:**
   ```
   REACT_APP_WORDPRESS_URL=https://your-wordpress-site.com/wp-json
   ```

2. **Set up WordPress** (see WORDPRESS_SETUP.md for detailed instructions):
   - Create custom post types: `blog` and `maintenance-guide`
   - Install Advanced Custom Fields (ACF) for maintenance guides
   - Add your content in WordPress admin

3. **Run the app:**
   ```bash
   npm install
   npm start
   ```

---

## Architecture Overview

### Service Layer: `src/services/wordPressAPI.js`

Centralized WordPress REST API service providing:

- `fetchPosts(postType, filters)` - Get posts of a specific type
- `fetchBlogArticles(filters)` - Get blog articles with fallback
- `fetchMaintenanceGuides(filters)` - Get maintenance guides
- `fetchCategories()` - Get all categories
- `fetchPostsByCategory(categoryId, postType, filters)` - Get posts by category
- `searchPosts(searchTerm, postType, filters)` - Search content
- `getFeaturedImageUrl(post, fallback)` - Extract featured image
- `formatPost(post)` - Format post data for consumption

### Error Handling

All API calls include:
- Network error handling
- HTTP status validation
- JSON response validation
- User-friendly error messages
- Fallback images for missing content

### Error Boundary: `src/components/content/article/wordPressErrorBoundary.jsx`

Wraps components to catch and display errors gracefully:

```jsx
<WordPressErrorBoundary>
  <YourComponent />
</WordPressErrorBoundary>
```

---

## Components

### Blog Screen: `src/screens/blogs.jsx`

Displays blog articles fetched from WordPress:
- Category filtering
- Uses `fetchBlogArticles()` from API service
- Error alerts for failed fetches
- Empty state messaging

**Usage:**
```jsx
import Blogs from './screens/blogs';
<Blogs />
```

### ShowCase Screen: `src/screens/showCase.jsx`

Displays maintenance guides from WordPress:
- Category filtering
- Uses `fetchMaintenanceGuides()` from API service
- Graceful error messaging for unconfigured post type
- Helpful setup instructions

**Usage:**
```jsx
import ShowCase from './screens/showCase';
<ShowCase />
```

### Article Component: `src/components/content/article/article.jsx`

Displays individual blog articles:
- Featured image with overlay
- Author and date information
- Category badges
- WordPress block formatting (galleries, media, etc.)

**Usage:**
```jsx
<Article requireCategory="blog" />
```

### Maintenance Guide Component: `src/components/content/article/maintenanceGuide.jsx`

Specialized component for maintenance guides:
- Step-by-step instructions with stepper UI
- Difficulty level and time estimate
- Tools required display
- Warning badges for each step
- Featured image hero section

**Usage:**
```jsx
<MaintenanceGuide />
```

**Features:**
- Parses ACF "steps" repeater field
- Falls back to parsing h2 headers as step breaks
- Interactive step navigation
- Image support per step

---

## Data Flow

```
WordPress Admin
       ↓
REST API (wp-json)
       ↓
wordPressAPI.js Service
       ↓
Components (Article, MaintenanceGuide)
       ↓
UI Display
```

## Environment Variables

### Required
- `REACT_APP_WORDPRESS_URL` - WordPress REST API base URL (format: `https://site.com/wp-json`)

### Optional (Firebase Auth/Storage)
- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`
- `REACT_APP_FIREBASE_MEASUREMENT_ID`

---

## Content Management

### Adding Blog Articles

1. Go to WordPress admin → **Blog Articles** (or your custom post type menu)
2. Click **Add New**
3. Fill in:
   - **Title** - Article headline
   - **Content** - Article body (use WordPress editor blocks)
   - **Featured Image** - Hero image for the article
   - **Categories** - Assign relevant categories (Brake Systems, Drivetrain, etc.)
   - **Excerpt** - Short summary (optional)
4. Click **Publish**
5. Content appears on the Blog page automatically

### Adding Maintenance Guides

1. Go to WordPress admin → **Maintenance Guides**
2. Click **Add New**
3. Fill in basic info:
   - **Title** - Guide name
   - **Content** - Detailed instructions (use h2 headers for steps)
   - **Featured Image** - Guide header image
   - **Categories** - (Brake Systems, Drivetrain, etc.)
4. Fill in custom fields (requires ACF):
   - **Difficulty Level** - Beginner / Intermediate / Advanced
   - **Time Estimate** - "1-2 hours"
   - **Tools Required** - List of needed tools
   - **Maintenance Steps** (Repeater):
     - Title for each step
     - Description (with images/formatting)
     - Step image
     - Tools for this step
     - Warnings/cautions

5. Click **Publish**

---

## Troubleshooting

### API Connection Issues

**Problem: "WordPress URL not configured"**
- Solution: Verify `REACT_APP_WORDPRESS_URL` is set in `.env`
- Restart dev server after changing `.env`

**Problem: "API returned HTML instead of JSON"**
- Check REST API is enabled in WordPress settings
- Verify URL format: `https://your-site.com/wp-json` (with `/wp-json`)
- Check permalinks are set to "Post name"

**Problem: Posts not loading**
- Verify custom post types have "Show in REST" enabled
- Add at least one post of that type
- Check categories are assigned to posts
- Use browser console to see actual API errors

**Problem: Featured images not showing**
- Use featured-image.png from `/public` folder as fallback
- Ensure images are uploaded to WordPress
- Check image URLs are accessible (not blocked by CORS/security)

### Image Fallbacks

Fallback images are provided for:
- Blog articles: `/public/blog-featured-image.png`
- Maintenance guides: `/public/showcase-featured-image.png`

These display automatically if:
- No featured image is set
- Featured media URL is broken
- Image fails to load

---

## Advanced Usage

### Custom Post Type Filtering

Fetch posts from a specific post type:

```javascript
import * as wordPressAPI from '../services/wordPressAPI';

// Fetch only maintenance guides
const guides = await wordPressAPI.fetchMaintenanceGuides({
  per_page: 20,
  search: 'brake'
});
```

### Category Filtering

```javascript
// Fetch guides in a specific category
const brakeGuides = await wordPressAPI.fetchPostsByCategory(
  'brake-systems',
  'maintenance-guide'
);
```

### Accessing ACF Custom Fields

```javascript
const post = await wordPressAPI.fetchPostById(123);
console.log(post.acf.difficulty_level);  // ACF fields
console.log(post.acf.tools_required);
console.log(post.acf.steps);  // Repeater field
```

---

## Performance Considerations

1. **API Requests**: Each screen makes 2 API calls (categories + posts)
2. **Embed Parameters**: Using `_embed=true` includes media/author data in single request
3. **Per Page**: Default `per_page=50`, adjust as needed
4. **Caching**: Currently no client-side caching; implement if needed for performance

---

## Security

- REST API exposes published content only
- Author/draft content requires proper authentication
- No sensitive data should be stored in posts
- CORS headers should allow your app domain

---

## Next Steps

1. Complete WordPress setup (see WORDPRESS_SETUP.md)
2. Test API endpoints in browser
3. Add test content in WordPress
4. Verify content appears in React app
5. Deploy app and WordPress together

---

## File Reference

### New Files Added
- `src/services/wordPressAPI.js` - WordPress API service layer
- `src/components/content/article/maintenanceGuide.jsx` - Maintenance guide component
- `src/components/content/article/wordPressErrorBoundary.jsx` - Error handling wrapper
- `WORDPRESS_SETUP.md` - Detailed WordPress setup instructions
- `.env.example` - Environment variable template
- `public/blog-featured-image.png` - Fallback blog image
- `public/showcase-featured-image.png` - Fallback guide image

### Modified Files
- `src/screens/blogs.jsx` - Uses new API service
- `src/screens/showCase.jsx` - Uses new API service
- `src/config/constants.js` - Already had WordPress URL config

---

## Support & Resources

- [WordPress REST API Docs](https://developer.wordpress.org/rest-api/)
- [Advanced Custom Fields Docs](https://www.advancedcustomfields.com/)
- [Headless WordPress Guide](https://wordpress.org/support/article/glossary/#headless-cms)

