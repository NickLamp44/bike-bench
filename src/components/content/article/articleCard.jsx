"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  CardActions,
  Avatar,
  IconButton,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ShareIcon from "@mui/icons-material/Share";
import { red } from "@mui/material/colors";
import { decodeHtmlEntities } from "../../../util/htmlDecoder";

export default function ArticleCard({ article, type = "blog" }) {
  const [isFavorited, setIsFavorited] = useState(false);

  if (!article) return null;

  const extractFeaturedImage = (post) => {
    // Try embedded featured media first
    const embeddedMedia = post._embedded?.["wp:featuredmedia"]?.[0];
    if (embeddedMedia && embeddedMedia.source_url && !embeddedMedia.code) {
      return embeddedMedia.source_url;
    }

    // Extract first image from post content if embedded media fails
    if (post.content?.rendered) {
      const imgMatch = post.content.rendered.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }
    }

    // Fallback to appropriate placeholder
    return type === "showcase"
      ? "/showcase-featured-image.png"
      : "/blog-featured-image.png";
  };

  const extractAuthorName = (post) => {
    // Author ID mapping for known authors
    const authorMap = {
      268984364: "Nick Lamparelli",
    };

    // Try embedded author data first
    const embeddedAuthor = post._embedded?.author?.[0];
    if (embeddedAuthor && !embeddedAuthor.code) {
      return (
        embeddedAuthor.display_name ||
        embeddedAuthor.name ||
        embeddedAuthor.slug
      );
    }

    // Use author ID mapping
    if (post.author && authorMap[post.author]) {
      return authorMap[post.author];
    }

    return "The Bike Bench";
  };

  const processedArticle = {
    ...article,
    image: article.image || extractFeaturedImage(article),
    author: article.author || extractAuthorName(article),
    title: decodeHtmlEntities(article.title?.rendered || article.title),
    previewText:
      article.previewText ||
      article.excerpt?.rendered?.replace(/<[^>]*>/g, "") ||
      "Read more about this post...",
  };

  const getInitials = (name) => {
    if (!name || typeof name !== "string") {
      return "TB"; // Default initials for The Bike Bench
    }

    try {
      return name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase();
    } catch (error) {
      console.error(" Error generating initials:", error);
      return "TB";
    }
  };

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    console.log("Added to favorites:", processedArticle.title);
  };

  const handleShareClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Shared:", processedArticle.title);
  };

  const articleLink = processedArticle.slug
    ? `/${type}/${processedArticle.slug}`
    : `/${type}/${processedArticle.id}`;

  return (
    <Link to={articleLink} style={{ textDecoration: "none" }}>
      <Card
        sx={{
          width: { xs: "100%", sm: 300, md: 345 },
          height: 420,
          display: "flex",
          flexDirection: "column",
          padding: 2,
          boxSizing: "border-box",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          transition: "all 0.3s ease",
          "&:hover": {
            boxShadow: 8,
            transform: "translateY(-4px)",
          },
          "&:hover .article-image": {
            transform: "scale(1.05)",
          },
          "&:hover .article-title": {
            color: "primary.main",
          },
        }}
      >
        {/* Image with Hover Effect */}
        <Box
          sx={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 1,
            mb: 1,
          }}
        >
          <CardMedia
            component="img"
            image={processedArticle.image}
            alt={processedArticle.title}
            className="article-image"
            sx={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              transition: "transform 0.3s ease",
            }}
          />

          {/* Subtle overlay on hover */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 100%)",
              opacity: 0,
              transition: "opacity 0.3s ease",
              ".MuiCard-root:hover &": {
                opacity: 1,
              },
            }}
          />
        </Box>

        {/* Header with Author Info */}
        <CardHeader
          avatar={
            <Avatar
              sx={{
                bgcolor: red[700],
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                fontSize: { xs: "0.875rem", sm: "1rem" },
                transition: "transform 0.2s ease",
                "&:hover": {
                  transform: "scale(1.1)",
                },
              }}
              aria-label="author"
            >
              {getInitials(processedArticle.author)}
            </Avatar>
          }
          title={
            <Typography
              variant="h6"
              className="article-title"
              sx={{
                fontWeight: 600,
                fontSize: {
                  xs: "clamp(0.875rem, 3vw, 1rem)",
                  sm: "clamp(1rem, 2.5vw, 1.125rem)",
                  md: "clamp(1.125rem, 2vw, 1.25rem)",
                },
                lineHeight: 1.3,
                transition: "color 0.2s ease",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                wordBreak: "break-word",
                hyphens: "auto",
              }}
            >
              {processedArticle.title}
            </Typography>
          }
          subheader={
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                mt: 0.5,
              }}
            >
              {processedArticle.date instanceof Date
                ? processedArticle.date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : new Date(processedArticle.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
            </Typography>
          }
          sx={{
            paddingBottom: 1,
            paddingTop: 0,
            alignItems: "flex-start",
            "& .MuiCardHeader-content": {
              overflow: "hidden",
              minWidth: 0,
            },
          }}
        />

        {/* Content */}
        <CardContent
          sx={{
            flexGrow: 1,
            paddingTop: 0,
            paddingBottom: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
              fontSize: "0.875rem",
            }}
          >
            {processedArticle.previewText}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
        </CardContent>

        {/* Action Buttons */}
        <CardActions
          disableSpacing
          sx={{
            paddingTop: 0,
            justifyContent: "center",
          }}
        >
          <IconButton
            aria-label="add to favorites"
            onClick={handleFavoriteClick}
            sx={{
              color: isFavorited ? "error.main" : "text.secondary",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "error.light",
                color: "error.main",
                transform: "scale(1.1)",
              },
            }}
          >
            <FavoriteIcon />
          </IconButton>

          <IconButton
            aria-label="share"
            onClick={handleShareClick}
            sx={{
              color: "text.secondary",
              transition: "all 0.2s ease",
              "&:hover": {
                backgroundColor: "primary.light",
                color: "primary.main",
                transform: "scale(1.1)",
              },
            }}
          >
            <ShareIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }} />

          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              fontStyle: "italic",
              opacity: 0.7,
            }}
          >
            Read more →
          </Typography>
        </CardActions>
      </Card>
    </Link>
  );
}
