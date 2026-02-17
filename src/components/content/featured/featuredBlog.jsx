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

const categories = ["All", "How To", "Product Review"];

export default function FeaturedBlogs() {
  const [activeCategory, setActiveCategory] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const wpUrl = process.env.REACT_APP_WORDPRESS_URL;

        if (!wpUrl) {
          console.error(" WordPress URL not configured");
          return;
        }

        let apiUrl = `${wpUrl}/posts?per_page=6&_embed`;

        if (activeCategory !== "Blog") {
          const categoriesResponse = await fetch(
            `${wpUrl}/categories?search=${activeCategory}`
          );
          if (categoriesResponse.ok) {
            const categoryData = await categoriesResponse.json();
            if (categoryData.length > 0) {
              const categoryId = categoryData[0].id;
              apiUrl = `${wpUrl}/posts?per_page=6&categories=${categoryId}&_embed`;
            }
          }
        }

        console.log(" Fetching featured blogs from:", apiUrl);
        const response = await fetch(apiUrl);

        if (!response.ok) {
          console.log(
            " Featured blogs response not OK:",
            response.status,
            response.statusText
          );
          throw new Error(`Featured blogs API returned ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.log(
            " Featured blogs response is not JSON:",
            responseText.substring(0, 200)
          );
          throw new Error("Featured blogs API returned HTML instead of JSON");
        }

        const posts = await response.json();

        const fetched = posts.map((post) => ({
          ...post,
          category: post._embedded?.["wp:term"]?.[0]?.[0]?.name || "Blog",
        }));

        setBlogs(fetched);
      } catch (err) {
        console.error("🔥 Failed to fetch WordPress blogs:", err);
      } finally {
        setLoadingBlogs(false);
      }
    };

    fetchBlogs();
  }, [activeCategory]);

  const filteredBlogs = blogs;

  return (
    <Container sx={{ my: 6 }}>
      <Typography variant="h4" gutterBottom>
        Featured Blogs
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

      {loadingBlogs ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
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
