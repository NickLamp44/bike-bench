"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { decodeHtmlEntities } from "../../../util/htmlDecoder";
// Pages & Components
import Comments from "../comments/comments";

const WordPressContent = styled(Box)(({ theme }) => ({
  "& img": {
    maxWidth: "100%",
    height: "auto",
    borderRadius: theme.spacing(1),
    margin: theme.spacing(2, 0),
  },
  "& .wp-block-media-text": {
    display: "flex !important",
    alignItems: "center !important",
    gap: `${theme.spacing(3)} !important`,
    margin: `${theme.spacing(3, 0)} !important`,
    // Handle different media positions
    "&.has-media-on-the-right": {
      flexDirection: "row-reverse !important",
    },
    // Responsive behavior - stack on mobile
    [theme.breakpoints.down("md")]: {
      flexDirection: "column !important",
      "&.has-media-on-the-right": {
        flexDirection: "column !important",
      },
    },
    "& .wp-block-media-text__media": {
      flex: "0 0 50% !important",
      margin: "0 !important",
      "& img": {
        width: "100% !important",
        height: "auto !important",
        margin: "0 !important",
        borderRadius: `${theme.spacing(1)} !important`,
      },
    },
    "& .wp-block-media-text__content": {
      flex: "1 !important",
      padding: `0 !important`,
      "& p": {
        margin: `${theme.spacing(1, 0)} !important`,
      },
      "& ul, & ol": {
        paddingLeft: `${theme.spacing(3)} !important`,
        margin: `${theme.spacing(1, 0)} !important`,
      },
      "& li": {
        marginBottom: `${theme.spacing(0.5)} !important`,
      },
    },
  },
  "& .wp-block-gallery": {
    display: "grid !important",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr)) !important",
    gap: `${theme.spacing(2)} !important`,
    margin: `${theme.spacing(3, 0)} !important`,
    "& .wp-block-image": {
      margin: "0 !important",
      "& img": {
        width: "100% !important",
        height: "auto !important",
        objectFit: "cover !important",
        borderRadius: `${theme.spacing(1)} !important`,
        margin: "0 !important",
      },
    },
    "& img": {
      width: "100% !important",
      height: "auto !important",
      objectFit: "cover !important",
      borderRadius: `${theme.spacing(1)} !important`,
      margin: "0 !important",
    },
    // Handle different column layouts
    "&.columns-2": {
      gridTemplateColumns: "repeat(2, 1fr) !important",
    },
    "&.columns-3": {
      gridTemplateColumns: "repeat(3, 1fr) !important",
    },
    "&.columns-4": {
      gridTemplateColumns: "repeat(4, 1fr) !important",
    },
    // Responsive adjustments
    [theme.breakpoints.down("md")]: {
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr)) !important",
      "&.columns-3, &.columns-4": {
        gridTemplateColumns: "repeat(2, 1fr) !important",
      },
    },
    [theme.breakpoints.down("sm")]: {
      gridTemplateColumns: "1fr !important",
      "&.columns-2, &.columns-3, &.columns-4": {
        gridTemplateColumns: "1fr !important",
      },
    },
  },
  "& figure.wp-block-gallery, & .wp-block-gallery figure": {
    display: "grid !important",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr)) !important",
    gap: `${theme.spacing(2)} !important`,
    margin: `${theme.spacing(3, 0)} !important`,
    "& img": {
      width: "100% !important",
      height: "auto !important",
      objectFit: "cover !important",
      borderRadius: `${theme.spacing(1)} !important`,
      margin: "0 !important",
    },
  },
  "& blockquote": {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    paddingLeft: theme.spacing(2),
    fontStyle: "italic",
    margin: theme.spacing(2, 0),
    color: theme.palette.text.secondary,
  },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  "& p": {
    marginBottom: theme.spacing(2),
    lineHeight: 1.7,
  },
  "& a": {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

const parseWordPressContent = (htmlContent) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const coverBlocks = tempDiv.querySelectorAll(".wp-block-cover");
  const parsedBlocks = [];

  coverBlocks.forEach((coverBlock) => {
    const bgImage = coverBlock.querySelector(
      ".wp-block-cover__image-background"
    );
    const backgroundImage = bgImage ? bgImage.src : null;

    const innerContainer = coverBlock.querySelector(
      ".wp-block-cover__inner-container"
    );

    let title = null;
    if (innerContainer) {
      // Try multiple selectors for the title
      title =
        innerContainer.querySelector("h1, h2, h3, h4, h5, h6")?.textContent ||
        innerContainer.querySelector(".wp-block-heading")?.textContent ||
        innerContainer.querySelector("[class*='heading']")?.textContent ||
        null;
    }

    const author = innerContainer
      ? innerContainer.textContent.match(/Author:\s*([^,\n]+)/)?.[1]
      : null;
    const date = innerContainer
      ? innerContainer.textContent.match(/Date:\s*([^,\n]+)/)?.[1]
      : null;

    parsedBlocks.push({
      type: "cover",
      backgroundImage,
      title,
      author,
      date,
    });

    coverBlock.remove();
  });

  return {
    coverBlocks: parsedBlocks,
    remainingContent: tempDiv.innerHTML,
  };
};

const extractFeaturedImage = (post) => {
  // Try embedded featured media first
  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
  if (featuredMedia && !featuredMedia.code) {
    return featuredMedia.source_url;
  }

  // Fallback: extract first image from content
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = post.content?.rendered || "";
  const firstImg = tempDiv.querySelector("img");
  return firstImg?.src || "/article-featured-image.png";
};

const extractAuthorName = (post) => {
  const embeddedAuthor = post._embedded?.author?.[0];
  if (embeddedAuthor && !embeddedAuthor.code) {
    return (
      embeddedAuthor.display_name || embeddedAuthor.name || embeddedAuthor.slug
    );
  }
  return "The Bike Bench";
};

export default function Article({
  requireCategory = null,
  showComments = false,
}) {
  const { blogId, showCaseId } = useParams();
  const articleId = blogId || showCaseId;
  const [article, setArticle] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const wpUrl = process.env.REACT_APP_WORDPRESS_URL;
        if (!wpUrl) {
          setError("WordPress URL not configured.");
          return;
        }

        let url;
        if (isNaN(articleId)) {
          url = `${wpUrl}/posts?slug=${articleId}&_embed`;
        } else {
          url = `${wpUrl}/posts/${articleId}?_embed`;
        }

        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Article API returned ${response.status}`);

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("WordPress API returned HTML instead of JSON");
        }

        const data = await response.json();
        const post = Array.isArray(data) ? data[0] : data;

        if (!post) {
          setError("Article not found");
          return;
        }

        if (requireCategory) {
          const categories = post._embedded?.["wp:term"]?.[0] || [];
          const hasRequiredCategory = categories.some(
            (cat) =>
              cat.name.toLowerCase().includes(requireCategory.toLowerCase()) ||
              cat.slug.toLowerCase().includes(requireCategory.toLowerCase())
          );

          if (!hasRequiredCategory) {
            setError(`This article is not a ${requireCategory}`);
            return;
          }
        }

        setArticle(post);
      } catch (err) {
        console.error("Error fetching WordPress article:", err);
        setError("Failed to fetch article");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId, requireCategory]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="error" sx={{ maxWidth: 600, mx: "auto" }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!article) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          Article not found
        </Alert>
      </Container>
    );
  }

  const { coverBlocks, remainingContent } = parseWordPressContent(
    article.content?.rendered || ""
  );
  const coverBlock = coverBlocks.length > 0 ? coverBlocks[0] : null;
  const featuredImage = extractFeaturedImage(article);
  const authorName = extractAuthorName(article);
  const categories = article._embedded?.["wp:term"]?.[0] || [];
  const publishedDate = new Date(article.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero / Cover - Use cover block if available, otherwise use featured image */}
      <Paper
        elevation={4}
        sx={{
          position: "relative",
          minHeight: { xs: "50vh", md: "60vh" },
          borderRadius: 3,
          overflow: "hidden",
          mb: 6,
          backgroundImage: `url(${
            coverBlock?.backgroundImage || featuredImage
          })`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay for better text readability */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Content */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "white",
            textAlign: "center",
            p: { xs: 3, md: 5 },
            zIndex: 1,
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
              lineHeight: 1.2,
              textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
              mb: 4,
              maxWidth: "90%",
            }}
          >
            {decodeHtmlEntities(coverBlock?.title || article.title?.rendered)}
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 2,
              mb: 3,
            }}
          >
            <Chip
              label={`By ${coverBlock?.author || authorName}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Chip
              label={`${coverBlock?.date || publishedDate}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
          </Box>

          {categories.length > 0 && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 1,
              }}
            >
              {categories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  variant="outlined"
                  size="small"
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.4)",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.2)",
                    },
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Article Content */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <WordPressContent
          dangerouslySetInnerHTML={{ __html: remainingContent }}
          sx={{
            fontSize: { xs: "1rem", md: "1.125rem" },
            lineHeight: 1.7,
            color: "text.primary",
          }}
        />
      </Paper>

      {/* {showComments && (
        <Box sx={{ mt: 4 }}>
          <Comments showCaseId={articleId} />
        </Box>
      )} */}
    </Container>
  );
}
