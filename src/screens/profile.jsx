"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Paper,
  Avatar,
  Typography,
  Button,
  TextField,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { decodeHtmlEntities } from "../util/htmlDecoder";

const wpUrl =
  "https://public-api.wordpress.com/wp/v2/sites/thebikebench.wordpress.com";

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: "24px" }}>
      {value === index && children}
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [userArticles, setUserArticles] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user data and articles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          // Fetch user data from Firestore
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setUserData(data);
            setEditedData(data);

            // Fetch user's articles from WordPress
            try {
              const response = await fetch(
                `${wpUrl}/posts?author=${
                  data.userName || data.fullName
                }&per_page=10`
              );
              if (response.ok) {
                const articles = await response.json();
                setUserArticles(articles);
              }
            } catch (err) {
              console.log("Could not fetch user articles:", err);
            }
          }
        } catch (err) {
          setError("Failed to load profile data");
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedData(userData);
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, editedData);
      setUserData(editedData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save changes");
      console.error(err);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedData({ ...editedData, [field]: value });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 8, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Profile updated successfully!
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Profile Header */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, #466755 0%, #7e936b 100%)",
          color: "white",
          position: "relative",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          <Avatar
            src={userData.profilePic || ""}
            alt={userData.fullName}
            sx={{ width: 120, height: 120, border: "4px solid white" }}
          />

          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
              {userData.fullName}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
              @
              {userData.userName ||
                userData.fullName.toLowerCase().replace(/\s+/g, "")}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {userData.email && (
                <Chip
                  icon={<EmailIcon />}
                  label={userData.email}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
              )}
              {userData.homeTown && (
                <Chip
                  icon={<LocationIcon />}
                  label={userData.homeTown}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
              )}

              {userData.createdAt && (
                <Chip
                  icon={<CalendarIcon />}
                  label={new Date(
                    userData.createdAt.seconds * 1000
                  ).toLocaleDateString()}
                  sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
                />
              )}
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
            onClick={handleEditToggle}
            sx={{
              bgcolor: "white",
              color: "#357e55",
              "&:hover": { bgcolor: "rgba(255,255,255,0.9)" },
            }}
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </Button>
        </Box>
      </Paper>

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="About" />
          <Tab label="Articles" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      {/* About Tab */}
      <TabPanel value={tabValue} index={0}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            About Me
          </Typography>

          {isEditing ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={4}
                value={editedData.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
              />
              <TextField
                fullWidth
                label="Hometown"
                value={editedData.homeTown || ""}
                onChange={(e) => handleInputChange("homeTown", e.target.value)}
              />
              <TextField
                fullWidth
                label="Birth Date"
                type="date"
                value={editedData.birthDate || ""}
                onChange={(e) => handleInputChange("birthDate", e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                sx={{ alignSelf: "flex-start" }}
              >
                Save Changes
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                {userData.bio ||
                  "No bio added yet. Click 'Edit Profile' to add one!"}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{userData.email}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Hometown
                  </Typography>
                  <Typography variant="body1">
                    {userData.homeTown || "Not specified"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Member Since
                  </Typography>
                  <Typography variant="body1">
                    {userData.createdAt
                      ? new Date(
                          userData.createdAt.seconds * 1000
                        ).toLocaleDateString()
                      : "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Birth Date
                  </Typography>
                  <Typography variant="body1">
                    {userData.birthDate
                      ? new Date(userData.birthDate).toLocaleDateString()
                      : "Not specified"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </TabPanel>

      {/* Articles Tab */}
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          My Articles
        </Typography>

        {userArticles.length > 0 ? (
          <Grid container spacing={3}>
            {userArticles.map((article) => (
              <Grid item xs={12} sm={6} md={4} key={article.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s",
                    "&:hover": { transform: "translateY(-4px)" },
                  }}
                >
                  {article._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={
                        article._embedded["wp:featuredmedia"][0].source_url
                      }
                      alt={decodeHtmlEntities(article.title.rendered)}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {decodeHtmlEntities(article.title.rendered)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(article.date).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      onClick={() => navigate(`/blog/${article.slug}`)}
                    >
                      Read More
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={2} sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              No articles published yet.
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* Settings Tab */}
      <TabPanel value={tabValue} index={2}>
        <Paper elevation={2} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Account Settings
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Account Information
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                User ID: {user?.uid}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Authentication Provider:{" "}
                {userData.authProvider || "Email/Password"}
              </Typography>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                Danger Zone
              </Typography>
              <Button variant="outlined" color="error">
                Delete Account
              </Button>
            </Box>
          </Box>
        </Paper>
      </TabPanel>
    </Container>
  );
}
