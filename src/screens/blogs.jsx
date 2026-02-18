"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Button,
  ButtonGroup,
  Grid,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArticleCard from "../components/content/article/articleCard";
import * as wordPressAPI from "../services/wordPressAPI";

export default function Blogs() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoriesAndBlogs = async () => {
      try {
        setError(null);

        // Fetch categories
        console.log("[Blogs] Fetching categories...");
        const categoriesData = await wordPressAPI.fetchCategories();
        const categoryNames = [
          "all",
          ...categoriesData.map((cat) => cat.name.toLowerCase()),
        ];
        setCategories(categoryNames);

        // Fetch all posts (flexible for all content types)
        console.log("[Blogs] Fetching all posts...");
        const postsData = await wordPressAPI.fetchAllPosts();

        // Format and enrich post data
        const enrichedPosts = postsData.map((post) => ({
          ...post,
          category:
            post._embedded?.["wp:term"]?.[0]?.[0]?.name?.toLowerCase() ||
            "general",
        }));

        setPosts(enrichedPosts);
      } catch (err) {
        console.error("[Blogs] Failed to fetch posts:", err);
        setError(err.message || "Failed to load content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndPosts();
  }, []);

  const filteredPosts =
    activeCategory === "all"
      ? posts
      : posts.filter((post) => post.category === activeCategory);

  if (loading) {
    return (
      <Container sx={{ my: 6 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ my: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ my: 6 }}>
      <Typography variant="h4" gutterBottom>
        Blog & Articles
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <ButtonGroup variant="text" aria-label="category button group">
          {categories.map((cat) => (
            <Button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              variant={activeCategory === cat ? "contained" : "text"}
              sx={{
                textTransform: "capitalize",
                color: activeCategory === cat ? "white" : "inherit",
                backgroundColor:
                  activeCategory === cat ? "primary.main" : "transparent",
                "&:hover": {
                  backgroundColor:
                    activeCategory === cat ? "primary.dark" : "action.hover",
                },
              }}
            >
              {cat}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      {filteredBlogs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="textSecondary">
            No blog articles found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredBlogs.map((blog) => (
            <Grid item key={blog.id} xs={12} sm={6} md={4}>
              <ArticleCard article={blog} type="blog" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
