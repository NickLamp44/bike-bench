/**
 * WordPress REST API Service
 * Centralized service for all WordPress API interactions
 * Handles blog articles, maintenance guides, categories, and media
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
      throw new Error(`WordPress API returned ${response.status}`);
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

/**
 * Fetch all posts (unified content: blogs, guides, reviews, interviews, galleries, etc.)
 * All differentiation is done through categories and tags
 * @param {object} filters - Query filters (page, per_page, search, etc.)
 */
export const fetchAllPosts = async (filters = { per_page: 50 }) => {
  const params = new URLSearchParams({
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch all posts (unified content: blogs, guides, reviews, interviews, galleries, etc.)
 * All differentiation is done through categories and tags
 * @param {object} filters - Query filters (page, per_page, search, etc.)
 */
export const fetchAllPosts = async (filters = { per_page: 50 }) => {
  const params = new URLSearchParams({
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch a single post by ID
 * @param {number} id - Post ID
 * @param {string} postType - Type of post (deprecated, kept for compatibility)
 */
export const fetchPostById = async (id, postType = "post") => {
  return fetchFromWP(`/posts/${id}?_embed=true`);
};

/**
 * Fetch all categories
 * @param {object} filters - Query filters
 */
export const fetchCategories = async (filters = { per_page: 100 }) => {
  const params = new URLSearchParams(filters);
  return fetchFromWP(`/categories?${params.toString()}`);
};

/**
 * Fetch posts filtered by category
 * @param {number} categoryId - Category ID or slug
 * @param {string} postType - Type of post
 * @param {object} filters - Additional query filters
 */
export const fetchPostsByCategory = async (
  categoryId,
  postType = "post",
  filters = { per_page: 50 }
) => {
  const params = new URLSearchParams({
    categories: categoryId,
    type: postType,
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Fetch all posts (flexible for all content types)
 * Uses categories and tags to organize content types
 * @param {object} filters - Query filters
 */
export const fetchAllPosts = async (filters = { per_page: 50 }) => {
  return await fetchPosts("post", filters);
};

/**
 * Fetch posts by tag
 * Useful for filtering by content type or other classifications
 * @param {string|number} tagId - Tag ID or slug
 * @param {object} filters - Additional query filters
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

/**
 * Fetch all tags
 * Useful for displaying content type filters
 * @param {object} filters - Query filters
 */
export const fetchTags = async (filters = { per_page: 100 }) => {
  const params = new URLSearchParams(filters);
  return fetchFromWP(`/tags?${params.toString()}`);
};

/**
 * Extract featured image URL from WordPress post
 * Handles both direct featured media and embedded media
 * @param {object} post - WordPress post object
 * @param {string} fallbackImage - Fallback image URL
 */
export const getFeaturedImageUrl = (post, fallbackImage = "") => {
  // Try embedded featured media
  if (post._embedded?.["wp:featuredmedia"]?.[0]?.source_url) {
    return post._embedded["wp:featuredmedia"][0].source_url;
  }

  // Try featured media ID (requires additional fetch)
  if (post.featured_media) {
    // This would require an additional API call in components
    return null; // Signal that additional fetch is needed
  }

  return fallbackImage;
};

/**
 * Extract categories from post
 * @param {object} post - WordPress post object
 */
export const getPostCategories = (post) => {
  return post._embedded?.["wp:term"]?.[0] || [];
};

/**
 * Format post data for easier consumption
 * @param {object} post - Raw WordPress post object
 */
export const formatPost = (post) => {
  const categories = getPostCategories(post);
  const featuredImage = getFeaturedImageUrl(post);

  return {
    id: post.id,
    title: post.title.rendered || post.title,
    content: post.content.rendered,
    excerpt: post.excerpt.rendered,
    slug: post.slug,
    date: post.date,
    modified: post.modified,
    author: post._embedded?.author?.[0]?.name || "Unknown",
    categories: categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })),
    featuredImage,
    // Pass raw ACF fields if available
    acf: post.acf || {},
    // Include raw post for advanced usage
    raw: post,
  };
};

/**
 * Search posts
 * @param {string} searchTerm - Search query
 * @param {string} postType - Type of post
 * @param {object} filters - Additional query filters
 */
export const searchPosts = async (
  searchTerm,
  postType = "post",
  filters = { per_page: 20 }
) => {
  const params = new URLSearchParams({
    search: searchTerm,
    type: postType,
    _embed: true,
    ...filters,
  });

  return fetchFromWP(`/posts?${params.toString()}`);
};

/**
 * Get WordPress configuration status
 * Useful for debugging
 */
export const getWordPressStatus = () => {
  return {
    configured: !!WORDPRESS_URL,
    url: WORDPRESS_URL || "NOT_SET",
  };
};

export default {
  fetchPosts,
  fetchPostById,
  fetchCategories,
  fetchPostsByCategory,
  fetchAllPosts,
  fetchPostsByTag,
  fetchTags,
  getFeaturedImageUrl,
  getPostCategories,
  formatPost,
  searchPosts,
  getWordPressStatus,
};
