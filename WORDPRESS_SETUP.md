# WordPress Headless CMS Setup Guide

This guide explains how to set up your WordPress site to work with the Bike Bench React app as a headless CMS.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [WordPress Configuration](#wordpress-configuration)
3. [Creating Custom Post Types](#creating-custom-post-types)
4. [Setting Up Advanced Custom Fields (ACF)](#setting-up-advanced-custom-fields)
5. [Environment Variables](#environment-variables)
6. [Testing Your Setup](#testing-your-setup)

---

## Prerequisites

- WordPress 5.9+ (must have REST API available)
- Access to WordPress admin dashboard
- Recommended WordPress Plugins:
  - **Advanced Custom Fields Pro** - For managing maintenance guide fields
  - **WP REST API - Posts extended** - For better REST API support
  - **Yoast SEO** - For better SEO (optional but recommended)

---

## WordPress Configuration

### 1. Enable REST API Access

By default, WordPress 5.9+ has REST API enabled. To verify:

1. Navigate to: **Settings → Permalinks**
2. Make sure "Post name" is selected
3. Click Save Changes
4. Test your REST API by visiting: `https://your-wordpress-site.com/wp-json/`

### 2. Get Your REST API Base URL

Your REST API URL should follow this pattern:
```
https://your-wordpress-site.com/wp-json
```

This is the `REACT_APP_WORDPRESS_URL` you'll use in your `.env` file.

---

## Creating Custom Post Types

### Option 1: Using Code (Recommended)

Add this to your WordPress `functions.php` file:

```php
<?php
// Register Blog Post Type
register_post_type('blog', array(
    'labels' => array(
        'name' => 'Blog Articles',
        'singular_name' => 'Blog Article',
    ),
    'public' => true,
    'show_in_rest' => true,  // IMPORTANT: Enable REST API
    'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'categories', 'tags'),
    'has_archive' => true,
    'menu_icon' => 'dashicons-editor-quote',
    'rewrite' => array('slug' => 'blogs'),
));

// Register Maintenance Guide Post Type
register_post_type('maintenance-guide', array(
    'labels' => array(
        'name' => 'Maintenance Guides',
        'singular_name' => 'Maintenance Guide',
    ),
    'public' => true,
    'show_in_rest' => true,  // IMPORTANT: Enable REST API
    'supports' => array('title', 'editor', 'author', 'thumbnail', 'excerpt', 'categories', 'tags'),
    'has_archive' => true,
    'menu_icon' => 'dashicons-hammer',
    'rewrite' => array('slug' => 'guides'),
));
```

### Option 2: Using Plugin

1. Install and activate the "Custom Post Type UI" plugin
2. Create two post types:
   - **Blog Articles** - slug: `blog`
   - **Maintenance Guides** - slug: `maintenance-guide`
3. For each, make sure to:
   - Enable "Show in REST"
   - Enable "Supports": Title, Editor, Author, Thumbnail, Excerpt, Categories, Tags

---

## Setting Up Advanced Custom Fields (ACF)

Advanced Custom Fields (Pro or Free) allows team members to manage structured data like maintenance steps, tools required, etc.

### 1. Install ACF

1. Go to **Plugins → Add New**
2. Search for "Advanced Custom Fields"
3. Install and activate the free version OR purchase/activate ACF Pro

### 2. Create Field Groups

#### For Maintenance Guides:

1. Go to **ACF → Field Groups** (or **Custom Fields** in ACF Free)
2. Click **Add New Field Group**
3. Name it: "Maintenance Guide Fields"
4. Add the following fields:

**Difficulty Level** (Text)
- Field Name: `difficulty_level`
- Field Type: Select
- Choices: Beginner, Intermediate, Advanced

**Time Estimate** (Text)
- Field Name: `time_estimate`
- Field Type: Text
- Example: "1-2 hours"

**Tools Required** (Repeater or Array)
- Field Name: `tools_required`
- Field Type: Repeater or Text (one tool per line)
- Example: "18mm wrench", "Bike stand"

**Maintenance Steps** (Repeater)
- Field Name: `steps`
- Field Type: Repeater
- Add sub-fields:
  - `title` (Text)
  - `description` (Wysiwyg Editor)
  - `image` (Image)
  - `tools` (Array/List)
  - `warnings` (Textarea)

5. Set the condition to show this field group only for "maintenance-guide" post type
6. Click Publish

### 3. Enable ACF in REST API

In ACF settings, enable REST API for your custom field groups to make the data available in API responses.

---

## Categories and Tags

The app uses WordPress categories for filtering content. Here are recommended categories for your bike maintenance content:

- Brake Systems
- Suspension
- Drivetrain
- Wheels & Tires
- Frame & Components
- General Tools
- Seasonal Maintenance
- Safety Checks

You can create these at **Posts → Categories** in WordPress admin.

---

## Environment Variables

### Setting REACT_APP_WORDPRESS_URL

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add this line:
   ```
   REACT_APP_WORDPRESS_URL=https://your-wordpress-site.com/wp-json
   ```
3. Save the file

### Example URLs

- **Local WordPress**: `http://localhost:8000/wp-json`
- **Production**: `https://bikebench-cms.com/wp-json`
- **Staging**: `https://staging-bikebench-cms.com/wp-json`

---

## Testing Your Setup

### 1. Test REST API Access

Open these URLs in your browser (replace with your WordPress URL):

```
https://your-wordpress-site.com/wp-json/                    # API root
https://your-wordpress-site.com/wp-json/posts?type=post      # Standard posts
https://your-wordpress-site.com/wp-json/posts?type=blog      # Blog articles
https://your-wordpress-site.com/wp-json/posts?type=maintenance-guide  # Guides
https://your-wordpress-site.com/wp-json/categories            # All categories
```

You should see JSON data in each response.

### 2. Test in Your React App

1. Update your `.env` file with your WordPress URL
2. Run `npm start` to start the development server
3. Navigate to the Blogs page - should load blog articles from WordPress
4. Navigate to the ShowCase (Maintenance Guides) page - should load guides from WordPress

### 3. Common Issues & Solutions

**Issue: "WordPress URL not configured"**
- Check that `REACT_APP_WORDPRESS_URL` is set in your `.env` file
- Restart your development server after changing `.env`
- File must be named `.env` (not `.env.local` or `.env.development`)

**Issue: "API returned HTML instead of JSON"**
- Check that REST API is enabled in WordPress
- Verify the URL format: `https://your-site.com/wp-json` (note `/wp-json` at the end)
- Check that permalinks are set to "Post name" in WordPress settings

**Issue: Posts not appearing**
- Make sure "Show in REST" is enabled for the post type
- Add at least one post/guide in WordPress
- Verify the category is assigned to the post

**Issue: Featured images not showing**
- Make sure the "_embed" parameter is in the API URL (this embeds featured media data)
- Upload and set a featured image for your post in WordPress admin
- Check that the image URL is accessible (not blocked by security plugins)

---

## Content Management Workflow

### For Team Members

1. Go to WordPress admin: `https://your-wordpress-site.com/wp-admin/`
2. Create new content:
   - **Blog Articles**: Go to **Blog Articles → Add New** or use your custom post type menu
   - **Maintenance Guides**: Go to **Maintenance Guides → Add New**
3. Fill out the content:
   - Add title, content/editor
   - Upload featured image
   - Assign categories
   - Fill custom fields (if using ACF for guides)
4. Publish
5. The React app will automatically fetch and display your content

### What Syncs Automatically

- Post title and content
- Featured image
- Author name
- Publication date
- Categories and tags
- Custom fields (ACF data)

---

## Next Steps

1. Set up WordPress with custom post types
2. Configure ACF fields for maintenance guides
3. Create test posts in each category
4. Set the `REACT_APP_WORDPRESS_URL` environment variable
5. Test the React app - verify content loads
6. Start adding your bike maintenance content!

---

## Additional Resources

- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Advanced Custom Fields Documentation](https://www.advancedcustomfields.com/resources/)
- [Custom Post Types in WordPress](https://developer.wordpress.org/plugins/post-types/post-types/)

