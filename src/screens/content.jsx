import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import ArticleCard from "../components/content/article/articleCard";
import * as wordPressAPI from "../services/wordPressAPI";

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest First" },
  { value: "date_asc", label: "Oldest First" },
  { value: "author_asc", label: "Author A–Z" },
  { value: "author_desc", label: "Author Z–A" },
  { value: "title_asc", label: "Title A–Z" },
];

export default function Blogs() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAuthor, setActiveAuthor] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [all, cats] = await Promise.all([
          wordPressAPI.fetchAllPosts(),
          wordPressAPI.fetchCategories(),
        ]);
        setPosts(all);
        setCategories(cats);
      } catch (err) {
        setError(err.message || "Failed to load content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derive unique author names from loaded posts
  const authors = useMemo(() => {
    const set = new Set();
    posts.forEach((post) => {
      const name = post._embedded?.author?.[0]?.name;
      if (name) set.add(name);
    });
    return [...set].sort();
  }, [posts]);

  // Filter then sort
  const visible = useMemo(() => {
    let result = [...posts];

    if (activeCategory !== "all") {
      result = result.filter((post) =>
        post._embedded?.["wp:term"]?.[0]?.some(
          (c) => c.slug?.toLowerCase() === activeCategory
        )
      );
    }

    if (activeAuthor !== "all") {
      result = result.filter(
        (post) => post._embedded?.author?.[0]?.name === activeAuthor
      );
    }

    switch (sortBy) {
      case "date_asc":
        result.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "date_desc":
        result.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "author_asc":
        result.sort((a, b) =>
          (a._embedded?.author?.[0]?.name || "").localeCompare(
            b._embedded?.author?.[0]?.name || ""
          )
        );
        break;
      case "author_desc":
        result.sort((a, b) =>
          (b._embedded?.author?.[0]?.name || "").localeCompare(
            a._embedded?.author?.[0]?.name || ""
          )
        );
        break;
      case "title_asc":
        result.sort((a, b) =>
          (a.title?.rendered || "").localeCompare(b.title?.rendered || "")
        );
        break;
      default:
        break;
    }

    return result;
  }, [posts, activeCategory, activeAuthor, sortBy]);

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
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Blogs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Everything in one place — browse all articles, guides, reviews, and
          more.
        </Typography>
      </Box>

      {/* Filters row */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          mb: 3,
        }}
      >
        {/* Author filter */}
        {authors.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="author-select-label">Author</InputLabel>
            <Select
              labelId="author-select-label"
              value={activeAuthor}
              label="Author"
              onChange={(e) => setActiveAuthor(e.target.value)}
            >
              <MenuItem value="all">All Authors</MenuItem>
              {authors.map((author) => (
                <MenuItem key={author} value={author}>
                  {author}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Sort */}
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="sort-select-label">Sort By</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="body2" color="text.secondary" sx={{ ml: "auto" }}>
          {visible.length} {visible.length === 1 ? "article" : "articles"}
        </Typography>
      </Box>

      {/* Category chips */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
        <Chip
          label="All"
          onClick={() => setActiveCategory("all")}
          color={activeCategory === "all" ? "primary" : "default"}
          variant={activeCategory === "all" ? "filled" : "outlined"}
        />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            onClick={() => setActiveCategory(cat.slug)}
            color={activeCategory === cat.slug ? "primary" : "default"}
            variant={activeCategory === cat.slug ? "filled" : "outlined"}
            sx={{ textTransform: "capitalize" }}
          />
        ))}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {visible.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <Typography color="text.secondary">
            No articles match your current filters.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {visible.map((post) => (
            <Grid item key={post.id} xs={12} sm={6} md={4}>
              <ArticleCard article={post} type="blog" />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

