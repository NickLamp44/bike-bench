import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  ButtonBase,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import * as wordPressAPI from "../../../services/wordPressAPI";
import { decodeHtmlEntities } from "../../../util/htmlDecoder";

const ACCENT = "#3a6186";

function extractImage(post) {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url && !media.code) return media.source_url;
  const match = post.content?.rendered?.match(/<img[^>]+src="([^">]+)"/);
  if (match) return match[1];
  return "/blog-featured-image.png";
}

function HeroCard({ post }) {
  const image = extractImage(post);
  const title = decodeHtmlEntities(post.title?.rendered || "");
  const excerpt = post.excerpt?.rendered?.replace(/<[^>]*>/g, "").slice(0, 120) || "";
  const date = new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const slug = post.slug || post.id;
  const cats = wordPressAPI.getPostCategories(post);
  const author = wordPressAPI.getPostAuthor(post);

  return (
    <ButtonBase
      component={Link}
      to={`/blog/${slug}`}
      sx={{
        display: "block",
        textAlign: "left",
        width: "100%",
        borderRadius: 2,
        overflow: "hidden",
        "&:hover .card-img": { transform: "scale(1.04)" },
        "&:hover .card-title": { opacity: 0.85 },
      }}
    >
      <Box sx={{ position: "relative", overflow: "hidden", borderRadius: 2, aspectRatio: "16/10" }}>
        <Box
          className="card-img"
          sx={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "transform 0.45s ease",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
          }}
        />
        <Box sx={{ position: "absolute", bottom: 0, left: 0, p: { xs: 2.5, md: 3.5 } }}>
          {cats.length > 0 && (
            <Chip
              label={cats[0].name}
              size="small"
              sx={{ mb: 1.5, backgroundColor: ACCENT, color: "white", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.08em", textTransform: "uppercase" }}
            />
          )}
          <Typography
            className="card-title"
            variant="h5"
            sx={{ color: "white", fontWeight: 800, lineHeight: 1.2, mb: 1, fontSize: { xs: "1.2rem", md: "1.5rem" }, transition: "opacity 0.2s" }}
          >
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.5, display: { xs: "none", sm: "block" }, mb: 1 }}>
            {excerpt}
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {author?.name && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
                {author.name}
              </Typography>
            )}
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", letterSpacing: "0.05em" }}>
              {date}
            </Typography>
          </Box>
        </Box>
      </Box>
    </ButtonBase>
  );
}

function SmallCard({ post }) {
  const image = extractImage(post);
  const title = decodeHtmlEntities(post.title?.rendered || "");
  const date = new Date(post.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const slug = post.slug || post.id;
  const cats = wordPressAPI.getPostCategories(post);

  return (
    <ButtonBase
      component={Link}
      to={`/blog/${slug}`}
      sx={{
        display: "flex",
        textAlign: "left",
        width: "100%",
        gap: 2,
        alignItems: "flex-start",
        borderRadius: 1.5,
        p: 1,
        mx: -1,
        "&:hover .sm-img": { transform: "scale(1.05)" },
        "&:hover .sm-title": { color: ACCENT },
      }}
    >
      <Box sx={{ flexShrink: 0, width: 90, height: 68, borderRadius: 1.5, overflow: "hidden" }}>
        <Box
          className="sm-img"
          sx={{
            width: "100%",
            height: "100%",
            backgroundImage: `url(${image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "transform 0.35s ease",
          }}
        />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        {cats.length > 0 && (
          <Typography variant="caption" sx={{ color: ACCENT, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.07em", textTransform: "uppercase", display: "block", mb: 0.25 }}>
            {cats[0].name}
          </Typography>
        )}
        <Typography
          className="sm-title"
          variant="body2"
          sx={{ fontWeight: 700, lineHeight: 1.3, mb: 0.5, transition: "color 0.2s", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {title}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.disabled", letterSpacing: "0.04em" }}>
          {date}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default function FeaturedBlogs() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wordPressAPI
      .fetchAllPosts({ per_page: 7 })
      .then((all) => setPosts(all.slice(0, 7)))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const [hero, ...rest] = posts;
  const sideCards = rest.slice(0, 3);

  return (
    <Box
      component="section"
      sx={{
        px: { xs: 2, sm: 4, md: 6, lg: 8 },
        py: { xs: 5, md: 7 },
        backgroundColor: "action.hover",
      }}
    >
      {/* Section header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          mb: 3,
          pb: 1.5,
          borderBottom: "2px solid",
          borderColor: "divider",
        }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ letterSpacing: "0.18em", color: ACCENT, fontWeight: 700, display: "block", lineHeight: 1, mb: 0.5 }}
          >
            Latest
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
            Blogs
          </Typography>
        </Box>
        <Box
          component={Link}
          to="/blogs"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: "text.secondary",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            "&:hover": { color: ACCENT },
            transition: "color 0.2s",
          }}
        >
          View all <ArrowForwardIcon sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
          No blog posts yet. Add posts in WordPress to populate this section.
        </Typography>
      ) : (
        <Grid container spacing={3} alignItems="stretch">
          {/* Side cards — left column on blogs (reversed layout for visual variety) */}
          <Grid item xs={12} md={5} sx={{ order: { xs: 2, md: 1 } }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                height: "100%",
                justifyContent: "space-between",
                borderRight: { md: "1px solid" },
                borderColor: { md: "divider" },
                pr: { md: 3 },
              }}
            >
              {sideCards.map((post) => (
                <SmallCard key={post.id} post={post} />
              ))}
            </Box>
          </Grid>

          {/* Hero card — right column */}
          <Grid item xs={12} md={7} sx={{ order: { xs: 1, md: 2 } }}>
            {hero && <HeroCard post={hero} />}
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
