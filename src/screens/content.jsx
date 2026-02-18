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

export default function Content() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [content, setContent] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoriesAndContent = async () => {
      try {
        setError(null);

        // Fetch categories
        console.log("[Content] Fetching categories...");
        const categoriesData = await wordPressAPI.fetchCategories();
        const categoryNames = [
          "all",
          ...categoriesData.map((cat) => cat.name.toLowerCase()),
        ];
        setCategories(categoryNames);

        // Fetch all content (blogs, guides, reviews, interviews, galleries, etc.)
        console.log("[Content] Fetching all content...");
        const contentData = await wordPressAPI.fetchAllPosts();

        // Format and enrich content data
        const enrichedContent = contentData.map((post) => ({
          ...post,
          category:
            post._embedded?.["wp:term"]?.[0]?.[0]?.name?.toLowerCase() ||
            "general",
        }));

        setContent(enrichedContent);
      } catch (err) {
        console.error("[Content] Failed to fetch content:", err);
        setError(
          err.message || "Failed to load content. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndContent();
  }, []);

  const filteredContent =
    activeCategory === "all"
      ? content
      : content.filter((item) => item.category === activeCategory);

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
        Content
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Explore our collection of blog articles, maintenance guides, product
        reviews, toolbox showcases, interviews, and galleries.
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 4, flexWrap: "wrap", gap: 1 }}>
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

      {filteredContent.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="textSecondary">
            No content found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredContent.map((item) => (
            <Grid item key={item.id} xs={12} sm={6} md={4}>
              <ArticleCard article={item} type="content" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
