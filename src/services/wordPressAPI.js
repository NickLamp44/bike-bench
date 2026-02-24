/**
 * WordPress REST API Service
 * Centralized service for all WordPress API interactions
 * Manages blog articles, guides, reviews, interviews, galleries, and all unified content
 * All differentiation is done through categories and tags
 */

const WORDPRESS_URL = process.env.REACT_APP_WORDPRESS_URL;

// Validate WordPress URL configuration
if (!WORDPRESS_URL) {
  console.warn(
    "[WordPress API] REACT_APP_WORDPRESS_URL is not configured. Please add it to your environment variables."
  );
}

/**
 * Base fetch function with error handling
 * @param {string} endpoint - API endpoint (e.g., '/posts', '/categories')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @throws {Error} When WordPress is not configured or API returns error
 */
const fetchFromWP = async (endpoint, options = {}) => {
  if (!WORDPRESS_URL) {
    throw new Error(
      "WordPress URL not configured. Please set REACT_APP_WORDPRESS_URL in your environment variables."
    );
  }

  const url = `${WORDPRESS_URL}${endpoint}`;

  try {
    console.log(`[WordPress API] Fetching: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      console.error(
        `[WordPress API] Error ${response.status}: ${response.statusText}`
      );
      throw new Error(
        `WordPress API returned ${response.status}: ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text();
      console.error(
        `[WordPress API] Non-JSON response: ${responseText.substring(0, 200)}`
      );
      throw new Error(
        "WordPress API returned non-JSON response. Check your WordPress URL and REST API configuration."
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`[WordPress API] Fetch error:`, error);
    throw error;
  }
};

// ============================================================================
// PRIMARY FUNCTIONS - Use these in your components
// ============================================================================

/**
 * Fetch all posts (unified content: blogs, guides, reviews, interviews, galleries, etc.)
 * All differentiation is done through categories and tags
 * @param {object} filters - Query filters (page, per_page, search, category, tag, orderby, etc.)
 * @returns {Promise<Array>} Array of post objects with embedded data
 * @example
 * const posts = await fetchAllPosts({ per_page: 20, orderby: 'date' });
 */
export const fetchAllPosts = async (filters = { per_page: 50 }) => {
  const params = new URLSearchParams({
    _embed: true, // Include author, categories, featured media, etc.
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch a single post by ID
 * @param {number} id - Post ID
 * @returns {Promise<Object>} Complete post object with embedded data
 * @example
 * const post = await fetchPostById(123);
 */
export const fetchPostById = async (id) => {
  return fetchFromWP(`/posts/${id}?_embed=true`);
};

/**
 * Search posts by keyword
 * @param {string} searchTerm - Search query
 * @param {object} filters - Additional filters (per_page, page, etc.)
 * @returns {Promise<Array>} Array of matching posts
 * @example
 * const results = await searchPosts('chain maintenance', { per_page: 10 });
 */
export const searchPosts = async (
  searchTerm,
  filters = { per_page: 20 }
) => {
  const params = new URLSearchParams({
    search: searchTerm,
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch posts filtered by category
 * @param {number|string} categoryId - Category ID or slug
 * @param {object} filters - Additional filters (per_page, page, orderby, etc.)
 * @returns {Promise<Array>} Array of posts in the category
 * @example
 * const blogPosts = await fetchPostsByCategory('product-reviews', { per_page: 20 });
 */
export const fetchPostsByCategory = async (
  categoryId,
  filters = { per_page: 50 }
) => {
  const params = new URLSearchParams({
    categories: categoryId,
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch posts filtered by tag
 * Useful for filtering by content type or other classifications
 * @param {number|string} tagId - Tag ID or slug
 * @param {object} filters - Additional filters
 * @returns {Promise<Array>} Array of posts with the tag
 * @example
 * const videoContent = await fetchPostsByTag('video', { per_page: 15 });
 */
export const fetchPostsByTag = async (
  tagId,
  filters = { per_page: 50 }
) => {
  const params = new URLSearchParams({
    tags: tagId,
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

// ============================================================================
// TAXONOMY FUNCTIONS - Fetch categories and tags for filtering
// ============================================================================

/**
 * Fetch all categories
 * @param {object} filters - Query filters (per_page, orderby, etc.)
 * @returns {Promise<Array>} Array of category objects
 * @example
 * const categories = await fetchCategories({ per_page: 50 });
 */
export const fetchCategories = async (filters = { per_page: 100 }) => {
  const params = new URLSearchParams(filters);
  return fetchFromWP(`/categories?${params.toString()}`);
};

/**
 * Fetch all tags
 * @param {object} filters - Query filters
 * @returns {Promise<Array>} Array of tag objects
 * @example
 * const tags = await fetchTags({ per_page: 50 });
 */
export const fetchTags = async (filters = { per_page: 100 }) => {
  const params = new URLSearchParams(filters);
  return fetchFromWP(`/tags?${params.toString()}`);
};

// ============================================================================
// UTILITY FUNCTIONS - Extract and format data from posts
// ============================================================================

/**
 * Extract featured image URL from a WordPress post
 * Handles both direct featured media and fallback
 * @param {object} post - WordPress post object
 * @param {string} fallbackImage - Fallback image URL if none found
 * @returns {string|null} Featured image URL or fallback/null
 * @example
 * const imageUrl = getFeaturedImageUrl(post, '/default-blog-image.png');
 */
export const getFeaturedImageUrl = (post, fallbackImage = "") => {
  // Try embedded featured media (most common)
  if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
    return post._embedded["wp:featuredmedia"][0].source_url;
  }

  // Return fallback if no image found
  return fallbackImage || null;
};

/**
 * Extract categories from post's embedded data
 * @param {object} post - WordPress post object
 * @returns {Array} Array of category objects with id, name, slug
 * @example
 * const categories = getPostCategories(post);
 */
export const getPostCategories = (post) => {
  return post._embedded?.["wp:term"]?.[0] || [];
};

/**
 * Extract author information from post
 * @param {object} post - WordPress post object
 * @returns {object|null} Author object with id, name, url, or null
 * @example
 * const author = getPostAuthor(post);
 */
export const getPostAuthor = (post) => {
  return post._embedded?.author?.[0] || null;
};

/**
 * Format post data for easier consumption in React components
 * Extracts and organizes all relevant post data
 * @param {object} post - Raw WordPress post object
 * @returns {object} Formatted post object with organized data
 * @example
 * const formatted = formatPost(rawPost);
 * console.log(formatted.title, formatted.categories, formatted.featuredImage);
 */
export const formatPost = (post) => {
  const categories = getPostCategories(post);
  const author = getPostAuthor(post);
  const featuredImage = getFeaturedImageUrl(post);

  return {
    // Core post data
    id: post.id,
    title: post.title.rendered || post.title,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    slug: post.slug,
    
    // Publishing info
    date: post.date,
    modified: post.modified,
    status: post.status,
    
    // Author
    author: author ? {
      id: author.id,
      name: author.name,
      url: author.link,
    } : null,
    
    // Organization
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })),
    
    // Media
    featuredImage: featuredImage,
    
    // Custom fields (if using ACF plugin)
    acf: post.acf || {},
    
    // Keep raw post for advanced usage or debugging
    raw: post,
  };
};

/**
 * Format multiple posts at once
 * @param {Array<object>} posts - Array of raw WordPress post objects
 * @returns {Array<object>} Array of formatted posts
 * @example
 * const formatted = formatPosts(allPosts);
 */
export const formatPosts = (posts) => {
  return Array.isArray(posts) ? posts.map(formatPost) : [];
};

// ============================================================================
// DEBUG FUNCTIONS - Useful for setup and troubleshooting
// ============================================================================

/**
 * Get WordPress configuration status
 * Useful for debugging connection issues
 * @returns {object} Configuration status
 * @example
 * const status = getWordPressStatus();
 * console.log(status); // { configured: true, url: 'https://...' }
 */
export const getWordPressStatus = () => {
  return {
    configured: !!WORDPRESS_URL,
    url: WORDPRESS_URL || "NOT_SET",
    timestamp: new Date().toISOString(),
  };
};

// ============================================================================
// Default export for convenience
// ============================================================================

export default {
  // Primary functions
  fetchAllPosts,
  fetchPostById,
  searchPosts,
  fetchPostsByCategory,
  fetchPostsByTag,
  
  // Taxonomy functions
  fetchCategories,
  fetchTags,
  
  // Utility functions
  getFeaturedImageUrl,
  getPostCategories,
  getPostAuthor,
  formatPost,
  formatPosts,
  
  // Debug functions
  getWordPressStatus,
};
