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
} from "@mui/material";
import ArticleCard from "../article/articleCard";

const categories = ["All", "ShowCASE", "Custom Tools", "TBOY"];

export default function FeaturedShowCase() {
  const [activeCategory, setActiveCategory] = useState("");
  const [showcases, setShowcases] = useState([]);
  const [loadingShowcases, setLoadingShowcases] = useState(true);

  useEffect(() => {
    const fetchShowcases = async () => {
      try {
        const wpUrl = process.env.REACT_APP_WORDPRESS_URL;

        if (!wpUrl) {
          console.error("[v0] WordPress URL not configured");
          return;
        }

        const categoriesResponse = await fetch(
          `${wpUrl}/categories?search=ShowCASE`
        );
        let showcaseCategoryId = null;

        if (categoriesResponse.ok) {
          const categoryData = await categoriesResponse.json();
          const showcaseCategory = categoryData.find(
            (cat) =>
              cat.name.toLowerCase().includes("ShowCASE") ||
              cat.slug.toLowerCase().includes("showcase")
          );
          if (showcaseCategory) {
            showcaseCategoryId = showcaseCategory.id;
          }
        }

        if (!showcaseCategoryId) {
          console.error("[v0] ShowCASE category not found");
          return;
        }

        const apiUrl = `${wpUrl}/posts?per_page=6&categories=${showcaseCategoryId}&_embed`;

        console.log("[v0] Fetching featured showcases from:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          console.log(
            "[v0] Featured showcases response not OK:",
            response.status,
            response.statusText
          );
          throw new Error(`Featured showcases API returned ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.log(
            "[v0] Featured showcases response is not JSON:",
            responseText.substring(0, 200)
          );
          throw new Error(
            "Featured showcases API returned HTML instead of JSON"
          );
        }

        const posts = await response.json();
        setShowcases(posts);
      } catch (err) {
        console.error("🔥 Failed to fetch WordPress showcases:", err);
      } finally {
        setLoadingShowcases(false);
      }
    };

    fetchShowcases();
  }, [activeCategory]);

  return (
    <Container sx={{ my: 6 }}>
      <Typography variant="h4" gutterBottom>
        Featured ShowCases
      </Typography>

      {/* <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
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
      </Box> */}

      {loadingShowcases ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {showcases.map((showcase) => (
            <Grid item key={showcase.id} xs={12} sm={6} md={4}>
              <ArticleCard article={showcase} type="showcase" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
