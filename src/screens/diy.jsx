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

const DIY_CATEGORY = "diy";

export default function DIY() {
  const [posts, setPosts] = useState([]);
  const [activeTag, setActiveTag] = useState("all");
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const all = await wordPressAPI.fetchAllPosts();

        const filtered = all.filter((post) => {
          const cats =
            post._embedded?.["wp:term"]?.[0]?.map((c) =>
              c.slug?.toLowerCase()
            ) || [];
          return cats.includes(DIY_CATEGORY);
        });

        const tagSet = new Set();
        filtered.forEach((post) => {
          const postTags = post._embedded?.["wp:term"]?.[1] || [];
          postTags.forEach((t) => tagSet.add(t.name));
        });
        setTags([...tagSet]);
        setPosts(filtered);
      } catch (err) {
        setError(err.message || "Failed to load DIY content.");
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
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          DIY
        </Typography>
        <Typography variant="body1" color="text.secondary">
          How-to guides for building tool setups, custom toolboxes, and bike
          maintenance walkthroughs.
        </Typography>
      </Box>

      {tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
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
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            No DIY guides found. Add posts in WordPress with the "diy" category
            to display them here.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {visible.map((post) => (
            <Grid item key={post.id} xs={12} sm={6} md={4}>
              <ArticleCard article={post} type="diy" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
