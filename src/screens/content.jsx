import { useState, useEffect, useMemo } from "react";
import {
  Container,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArticleCard from "../components/content/article/articleCard";
import * as wordPressAPI from "../services/wordPressAPI";

const SORT_OPTIONS = [
  { value: "date-desc", label: "Newest First" },
  { value: "date-asc", label: "Oldest First" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "title-desc", label: "Title Z–A" },
  { value: "author-asc", label: "Author A–Z" },
];

export default function Blogs() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeAuthor, setActiveAuthor] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date-desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const [allPosts, allCategories] = await Promise.all([
          wordPressAPI.fetchAllPosts({ per_page: 100 }),
          wordPressAPI.fetchCategories(),
        ]);
        setPosts(allPosts);
        setCategories(allCategories);
      } catch (err) {
        setError(err.message || "Failed to load blog content.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Derive unique authors from embedded post data
  const authors = useMemo(() => {
    const map = new Map();
    posts.forEach((post) => {
      const author = wordPressAPI.getPostAuthor(post);
      if (author && !map.has(author.id)) {
        map.set(author.id, author.name || author.slug || "Unknown");
      }
    });
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [posts]);

  // Apply filters then sort
  const visible = useMemo(() => {
    let result = [...posts];

    if (activeCategory !== "all") {
      result = result.filter((post) =>
        wordPressAPI.getPostCategories(post).some((c) => c.slug === activeCategory)
      );
    }

    if (activeAuthor !== "all") {
      result = result.filter((post) => {
        const author = wordPressAPI.getPostAuthor(post);
        return author && String(author.id) === String(activeAuthor);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (post) =>
          post.title?.rendered?.toLowerCase().includes(q) ||
          post.excerpt?.rendered?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date) - new Date(b.date);
        case "date-desc":
          return new Date(b.date) - new Date(a.date);
        case "title-asc":
          return a.title?.rendered?.localeCompare(b.title?.rendered);
        case "title-desc":
          return b.title?.rendered?.localeCompare(a.title?.rendered);
        case "author-asc": {
          const aName = wordPressAPI.getPostAuthor(a)?.name || "";
          const bName = wordPressAPI.getPostAuthor(b)?.name || "";
          return aName.localeCompare(bName);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [posts, activeCategory, activeAuthor, searchQuery, sortBy]);

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
          background: "linear-gradient(135deg, #1a1a1a 0%, #1a2d3a 100%)",
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
          All Content
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
          Blogs
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 560, lineHeight: 1.7 }}>
          Every article in one place — browse by category, filter by author, or
          search for exactly what you need.
        </Typography>
      </Box>

      <Container maxWidth="xl" sx={{ pb: 8 }}>
        {/* Controls row: search, author filter, sort */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", mb: 4 }}>
          <TextField
            size="small"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: 220, flexGrow: 1, maxWidth: 360 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          {authors.length > 0 && (
            <TextField
              select
              size="small"
              label="Author"
              value={activeAuthor}
              onChange={(e) => setActiveAuthor(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="all">All Authors</MenuItem>
              {authors.map(({ id, name }) => (
                <MenuItem key={id} value={String(id)}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField
            select
            size="small"
            label="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Category chips */}
        {categories.length > 0 && (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
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
          </>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {visible.length} {visible.length === 1 ? "article" : "articles"} found
        </Typography>

        {visible.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">
              No articles match your current filters.
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
