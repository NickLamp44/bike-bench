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

// WordPress category slugs that map to ShowCASE
const SHOWCASE_SLUGS = ["showcase", "community", "toolbox", "community-builds", "tool-deep-dive"];

export default function ShowCase() {
  const [posts, setPosts] = useState([]);
  const [activeTag, setActiveTag] = useState("all");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const all = await wordPressAPI.fetchAllPosts({ per_page: 50 });

        const filtered = all.filter((post) => {
          const cats = wordPressAPI.getPostCategories(post).map((c) => c.slug?.toLowerCase());
          return cats.some((slug) => SHOWCASE_SLUGS.includes(slug));
        });

        // Collect tags from matched posts for sub-filtering
        const tagSet = new Set();
        filtered.forEach((post) => {
          const postTags = post._embedded?.["wp:term"]?.[1] || [];
          postTags.forEach((t) => tagSet.add(t.name));
        });

        setTags([...tagSet]);
        // Fall back to all posts during initial WordPress setup
        setPosts(filtered.length > 0 ? filtered : all);
      } catch (err) {
        setError(err.message || "Failed to load ShowCASE content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const visible =
    activeTag === "all"
      ? posts
      : posts.filter((post) =>
          post._embedded?.["wp:term"]?.[1]?.some((t) => t.name === activeTag)
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
          background: "linear-gradient(135deg, #1a1a1a 0%, #2d4a3e 100%)",
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
          Featured Builds
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
          Show<span style={{ color: "#507e6c" }}>CASE</span>
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 560, lineHeight: 1.7 }}>
          Community builds, professional toolbox deep dives, and the setups
          that define the craft. Real gear, real people, real results.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 8 }}>
        {/* Tag filters */}
        {tags.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 5 }}>
            <Chip
              label="All"
              onClick={() => setActiveTag("all")}
              color={activeTag === "all" ? "primary" : "default"}
              variant={activeTag === "all" ? "filled" : "outlined"}
            />
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onClick={() => setActiveTag(tag)}
                color={activeTag === tag ? "primary" : "default"}
                variant={activeTag === tag ? "filled" : "outlined"}
                sx={{ textTransform: "capitalize" }}
              />
            ))}
          </Box>
        )}

        {visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No ShowCASE content yet. Add posts with a "showcase", "community",
              or "toolbox" category in WordPress to populate this page.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {visible.map((post) => (
              <Grid item key={post.id} xs={12} sm={6} md={4} lg={3}>
                <ArticleCard article={post} type="showcase" />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
