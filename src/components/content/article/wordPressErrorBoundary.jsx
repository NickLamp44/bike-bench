import React from "react";
import { Alert, Container, Box, Typography, Button } from "@mui/material";
import { useState } from "react";

/**
 * Error Boundary Component
 * Catches errors in child components and displays a user-friendly message
 * Useful for WordPress API failures and other runtime errors
 */
class WordPressErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[WordPress Error Boundary] Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Container sx={{ py: 6 }}>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              Oops! Something went wrong
            </Typography>
            <Typography variant="body2" gutterBottom>
              We encountered an error loading this content. This might be due to
              a WordPress connection issue.
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 2 }}>
              Error: {this.state.error?.message}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={() => window.location.reload()}
                variant="outlined"
              >
                Retry
              </Button>
            </Box>
          </Alert>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default WordPressErrorBoundary;
