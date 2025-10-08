"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Chip, IconButton, Paper } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { decodeHtmlEntities } from "../../../util/htmlDecoder";

export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [blogSlides, setBlogSlides] = useState([]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? blogSlides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === blogSlides.length - 1 ? 0 : prev + 1));
  };

  const extractFeaturedImage = (post) => {
    // First try embedded featured media
    const embeddedImage = post._embedded?.["wp:featuredmedia"]?.[0];
    if (embeddedImage && embeddedImage.source_url && !embeddedImage.code) {
      return {
        src: embeddedImage.source_url,
        alt: embeddedImage.alt_text || decodeHtmlEntities(post.title.rendered),
      };
    }

    // If embedded media fails, extract first image from content
    if (post.content?.rendered) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = post.content.rendered;
      const firstImg = tempDiv.querySelector("img");

      if (firstImg && firstImg.src) {
        return {
          src: firstImg.src,
          alt: firstImg.alt || decodeHtmlEntities(post.title.rendered),
        };
      }
    }

    // Fallback to placeholder
    return {
      src: "/blog-hero.png",
      alt: decodeHtmlEntities(post.title.rendered),
    };
  };

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const wpUrl = process.env.REACT_APP_WORDPRESS_URL;

        if (!wpUrl) {
          console.error("[v0] WordPress URL not configured");
          return;
        }

        console.log(
          "[v0] Fetching hero slider blogs from:",
          `${wpUrl}/posts?per_page=5&_embed`
        );
        const response = await fetch(`${wpUrl}/posts?per_page=5&_embed`);

        if (!response.ok) {
          console.log(
            "[v0] Hero slider response not OK:",
            response.status,
            response.statusText
          );
          throw new Error(`Hero slider API returned ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const responseText = await response.text();
          console.log(
            "[v0] Hero slider response is not JSON:",
            responseText.substring(0, 200)
          );
          throw new Error("Hero slider API returned HTML instead of JSON");
        }

        const posts = await response.json();

        const blogs = posts.map((post) => ({
          id: post.id,
          title: decodeHtmlEntities(post.title.rendered),
          authorName: post._embedded?.author?.[0]?.name || "Unknown Author",
          publishedDate: new Date(post.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          heroImage: extractFeaturedImage(post),
          tags:
            post._embedded?.["wp:term"]?.[0]?.map((term) => term.name) || [],
          slug: post.slug,
        }));

        setBlogSlides(blogs);
      } catch (error) {
        console.error("Error fetching WordPress blog data:", error);
      }
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    if (blogSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) =>
          prev === blogSlides.length - 1 ? 0 : prev + 1
        );
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [blogSlides.length]);

  if (blogSlides.length === 0) {
    return null;
  }

  const currentSlide = blogSlides[currentIndex];

  return (
    <Box sx={{ maxWidth: "80%",padding: 5,  margin: "0 auto", position: "relative" }}>
      <Paper
        elevation={3}
        sx={{
          position: "relative",
          borderRadius: 2,
          overflow: "hidden",
          height: { xs: 400, md: 600 },
        }}
      >
        <Link
          to={`/blog/${currentSlide.slug || currentSlide.id}`}
          style={{ textDecoration: "none", color: "inherit" }}
        >
          <Box
            sx={{
              position: "relative",
              height: "100%",
              backgroundImage: `url(${
                currentSlide.heroImage?.src || "/fallback.jpg"
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              cursor: "pointer",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1,
              },
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                color: "white",
                zIndex: 2,
                px: 2,
              }}
            >
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                sx={{
                  fontSize: { xs: "1.75rem", md: "3rem" },
                  fontWeight: "bold",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                }}
              >
                {currentSlide.title}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: { xs: "1rem", md: "1.25rem" },
                  mb: 1,
                }}
              >
                By {currentSlide.authorName}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontSize: { xs: "0.9rem", md: "1rem" },
                  mb: 2,
                  opacity: 0.9,
                }}
              >
                {currentSlide.publishedDate}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                {currentSlide.tags?.map((tag, i) => (
                  <Chip
                    key={i}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.9)",
                      color: "text.primary",
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Link>

        {blogSlides.length > 1 && (
          <>
            <IconButton
              onClick={handlePrevious}
              sx={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "text.primary",
                zIndex: 3,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              <ArrowBackIos />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: "absolute",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                backgroundColor: "rgba(255, 255, 255, 0.8)",
                color: "text.primary",
                zIndex: 3,
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                },
              }}
            >
              <ArrowForwardIos />
            </IconButton>
          </>
        )}

        {blogSlides.length > 1 && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 1,
              zIndex: 3,
            }}
          >
            {blogSlides.map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  backgroundColor:
                    index === currentIndex
                      ? "white"
                      : "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "white",
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
