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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { decodeHtmlEntities } from "../../../util/htmlDecoder";

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
    "&.has-media-on-the-right": {
      flexDirection: "row-reverse !important",
    },
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
      padding: "0 !important",
      "& p": {
        margin: `${theme.spacing(1, 0)} !important`,
      },
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
  "& ul, & ol": {
    paddingLeft: theme.spacing(3),
    margin: theme.spacing(1, 0),
  },
  "& li": {
    marginBottom: theme.spacing(1),
  },
  "& a": {
    color: theme.palette.primary.main,
    textDecoration: "none",
    "&:hover": {
      textDecoration: "underline",
    },
  },
}));

const extractFeaturedImage = (post) => {
  const featuredMedia = post._embedded?.["wp:featuredmedia"]?.[0];
  if (featuredMedia && !featuredMedia.code) {
    return featuredMedia.source_url;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = post.content?.rendered || "";
  const firstImg = tempDiv.querySelector("img");
  return firstImg?.src || "/showcase-featured-image.png";
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

/**
 * Parse maintenance guide steps from ACF or content
 * Looks for ACF "steps" repeater field or h2 headers as step breaks
 */
const parseMaintenanceSteps = (post) => {
  // Try to get steps from ACF fields first
  if (post.acf?.steps && Array.isArray(post.acf.steps)) {
    return post.acf.steps.map((step, index) => ({
      order: index + 1,
      title: step.title || `Step ${index + 1}`,
      description: step.description || "",
      image: step.image?.url || null,
      tools: step.tools || [],
      warnings: step.warnings || "",
    }));
  }

  // Fallback: parse content for h2 headers as step breaks
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = post.content?.rendered || "";

  const steps = [];
  const h2Headers = tempDiv.querySelectorAll("h2");

  h2Headers.forEach((header, index) => {
    let stepContent = "";
    let nextElement = header.nextElementSibling;

    while (nextElement && nextElement.tagName !== "H2") {
      stepContent += nextElement.outerHTML;
      nextElement = nextElement.nextElementSibling;
    }

    steps.push({
      order: index + 1,
      title: header.textContent || `Step ${index + 1}`,
      description: stepContent,
      image: null,
      tools: [],
      warnings: "",
    });
  });

  return steps;
};

export default function MaintenanceGuide() {
  const { guideId } = useParams();
  const [guide, setGuide] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const wpUrl = process.env.REACT_APP_WORDPRESS_URL;
        if (!wpUrl) {
          setError("WordPress URL not configured.");
          return;
        }

        let url;
        if (isNaN(guideId)) {
          url = `${wpUrl}/posts?slug=${guideId}&type=maintenance-guide&_embed`;
        } else {
          url = `${wpUrl}/posts/${guideId}?type=maintenance-guide&_embed`;
        }

        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Guide API returned ${response.status}`);

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("WordPress API returned HTML instead of JSON");
        }

        const data = await response.json();
        const post = Array.isArray(data) ? data[0] : data;

        if (!post) {
          setError("Maintenance guide not found");
          return;
        }

        setGuide(post);
        const parsedSteps = parseMaintenanceSteps(post);
        setSteps(parsedSteps);
      } catch (err) {
        console.error("Error fetching maintenance guide:", err);
        setError("Failed to fetch maintenance guide");
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [guideId]);

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

  if (!guide) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="info" sx={{ maxWidth: 600, mx: "auto" }}>
          Maintenance guide not found
        </Alert>
      </Container>
    );
  }

  const featuredImage = extractFeaturedImage(guide);
  const authorName = extractAuthorName(guide);
  const categories = guide._embedded?.["wp:term"]?.[0] || [];
  const publishedDate = new Date(guide.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Extract metadata from ACF
  const difficulty = guide.acf?.difficulty_level || "Intermediate";
  const timeEstimate = guide.acf?.time_estimate || "1-2 hours";
  const toolsRequired = guide.acf?.tools_required || [];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Paper
        elevation={4}
        sx={{
          position: "relative",
          minHeight: { xs: "40vh", md: "50vh" },
          borderRadius: 3,
          overflow: "hidden",
          mb: 6,
          backgroundImage: `url(${featuredImage})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%)",
          }}
        />

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
          <Chip
            label="Maintenance Guide"
            sx={{
              backgroundColor: "rgba(76, 175, 80, 0.8)",
              color: "white",
              backdropFilter: "blur(10px)",
              mb: 2,
            }}
          />

          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.8rem", sm: "2.3rem", md: "2.8rem" },
              lineHeight: 1.2,
              textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
              mb: 4,
              maxWidth: "90%",
            }}
          >
            {decodeHtmlEntities(guide.title?.rendered)}
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
              label={`By ${authorName}`}
              sx={{
                backgroundColor: "rgba(0,0,0,0.3)",
                color: "white",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            />
            <Chip
              label={publishedDate}
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
                  }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Quick Info Cards */}
      <Grid container spacing={2} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Difficulty Level
              </Typography>
              <Typography variant="h6">{difficulty}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Time Estimate
              </Typography>
              <Typography variant="h6">{timeEstimate}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: "center" }}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Steps
              </Typography>
              <Typography variant="h6">{steps.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tools Required */}
      {toolsRequired.length > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 6,
            backgroundColor: "info.light",
            borderLeft: "4px solid",
            borderLeftColor: "info.main",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Tools Required
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            {toolsRequired.map((tool, index) => (
              <Chip
                key={index}
                label={tool}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Step-by-Step Guide */}
      {steps.length > 0 ? (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, mb: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
            Step-by-Step Instructions
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={index} completed={activeStep > index}>
                <StepLabel
                  onClick={() => setActiveStep(index)}
                  sx={{ cursor: "pointer" }}
                >
                  {step.title}
                </StepLabel>
                <StepContent sx={{ borderLeftColor: "primary.main" }}>
                  {step.image && (
                    <Box
                      component="img"
                      src={step.image}
                      alt={step.title}
                      sx={{
                        width: "100%",
                        maxWidth: "400px",
                        borderRadius: 1,
                        mb: 2,
                      }}
                    />
                  )}

                  <WordPressContent
                    dangerouslySetInnerHTML={{
                      __html: step.description,
                    }}
                    sx={{ mb: 2 }}
                  />

                  {step.warnings && (
                    <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>
                      <strong>Warning:</strong> {step.warnings}
                    </Alert>
                  )}

                  <Box sx={{ mb: 2 }}>
                    {index === steps.length - 1 ? (
                      <Typography
                        variant="body2"
                        sx={{ color: "success.main", fontWeight: 600 }}
                      >
                        Guide Complete!
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", mt: 2 }}
                      >
                        Click the next step above to continue
                      </Typography>
                    )}
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 3, mb: 6 }}>
          <WordPressContent
            dangerouslySetInnerHTML={{
              __html: guide.content?.rendered || "",
            }}
          />
        </Paper>
      )}
    </Container>
  );
}
