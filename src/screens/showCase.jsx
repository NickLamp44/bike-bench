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

export default function ShowCase() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [showCase, setShowCase] = useState([]);
  const [categories, setCategories] = useState(["all"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategoriesAndShowCases = async () => {
      try {
        setError(null);

        // Fetch categories
        console.log("[ShowCase] Fetching categories...");
        const categoriesData = await wordPressAPI.fetchCategories();
        const categoryNames = [
          "all",
          ...categoriesData.map((cat) => cat.name.toLowerCase()),
        ];
        setCategories(categoryNames);

        // Fetch maintenance guides
        console.log("[ShowCase] Fetching maintenance guides...");
        const guidesData = await wordPressAPI.fetchMaintenanceGuides();

        // Format and enrich guide data
        const enrichedGuides = guidesData.map((post) => ({
          ...post,
          category:
            post._embedded?.["wp:term"]?.[0]?.[0]?.name?.toLowerCase() ||
            "general",
        }));

        setShowCase(enrichedGuides);
      } catch (err) {
        console.error("[ShowCase] Failed to fetch maintenance guides:", err);
        setError(
          err.message ||
            "Failed to load maintenance guides. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndShowCases();
  }, []);

  const filteredShowCases =
    activeCategory === "all"
      ? showCase
      : showCase.filter((guide) => guide.category === activeCategory);

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
        <Alert severity="info">
          Maintenance guides are being set up. Please configure the
          "maintenance-guide" custom post type in WordPress and add your
          content. {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ my: 6 }}>
      <Typography variant="h4" gutterBottom>
        Maintenance Guides
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

      {filteredShowCases.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography color="textSecondary">
            No maintenance guides found in this category.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredShowCases.map((guide) => (
            <Grid item key={guide.id} xs={12} sm={6} md={4}>
              <ArticleCard article={guide} type="showCase" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
