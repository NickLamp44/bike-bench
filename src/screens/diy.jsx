import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import ArticleCard from "../components/content/article/articleCard";
import * as wordPressAPI from "../services/wordPressAPI";

// WordPress category slugs that map to DIY
const DIY_SLUGS = ["diy", "maintenance", "how-to", "review", "tool-setup", "tool-box"];

export default function DIY() {
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const all = await wordPressAPI.fetchAllPosts({ per_page: 50 });

        const filtered = all.filter((post) => {
          const cats = wordPressAPI.getPostCategories(post).map((c) => c.slug?.toLowerCase());
          return cats.some((slug) => DIY_SLUGS.includes(slug));
        });

        // Gather unique categories from matched posts for sub-filtering
        const catMap = new Map();
        filtered.forEach((post) => {
          wordPressAPI.getPostCategories(post).forEach((c) => {
            if (!catMap.has(c.slug)) catMap.set(c.slug, c.name);
          });
        });
        setCategories([...catMap.entries()].map(([slug, name]) => ({ slug, name })));

        // Fall back to all posts during initial WordPress setup
        setPosts(filtered.length > 0 ? filtered : all);
      } catch (err) {
        setError(err.message || "Failed to load DIY content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible =
    activeCategory === "all"
      ? posts
      : posts.filter((post) =>
          wordPressAPI.getPostCategories(post).some((c) => c.slug === activeCategory)
        );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" sx={{ my: 10 }}>
        <CircularProgress />
      </Box>
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
    <Box sx={{ width: "100%" }}>
      {/* Page Header */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #1a1a1a 0%, #3a2d1a 100%)",
          color: "white",
          py: { xs: 6, md: 10 },
          px: { xs: 3, md: 8 },
          mb: 6,
        }}
      >
        <Typography
          variant="overline"
          sx={{ letterSpacing: "0.2em", opacity: 0.7, display: "block", mb: 1 }}
        >
          Hands-On Guides
        </Typography>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: "2.5rem", md: "4rem" },
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            mb: 2,
          }}
        >
          DIY
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 560, lineHeight: 1.7 }}>
          Step-by-step maintenance guides, tool box builds, workshop setups,
          and product reviews to help you wrench smarter.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 8 }}>
        {/* Category filters */}
        {categories.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 5 }}>
            <Chip
              label="All"
              onClick={() => setActiveCategory("all")}
              color={activeCategory === "all" ? "primary" : "default"}
              variant={activeCategory === "all" ? "filled" : "outlined"}
            />
            {categories.map(({ slug, name }) => (
              <Chip
                key={slug}
                label={name}
                onClick={() => setActiveCategory(slug)}
                color={activeCategory === slug ? "primary" : "default"}
                variant={activeCategory === slug ? "filled" : "outlined"}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
        )}

        {visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No DIY content yet. Add posts with a "diy", "maintenance",
              "how-to", or "review" category in WordPress to populate this page.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {visible.map((post) => (
              <Grid item key={post.id} xs={12} sm={6} md={4} lg={3}>
                <ArticleCard article={post} type="blog" />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
