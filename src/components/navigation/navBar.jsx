import * as React from "react";
import { Link, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Menu from "@mui/material/Menu";
import MenuIcon from "@mui/icons-material/Menu";
import Container from "@mui/material/Container";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Badge from "@mui/material/Badge";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Tooltip from "@mui/material/Tooltip";
import MenuItem from "@mui/material/MenuItem";
import { styled, alpha } from "@mui/material/styles";
import InputBase from "@mui/material/InputBase";
import SearchIcon from "@mui/icons-material/Search";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../services/firebase";
import { useCart } from "../../context/cartContext";
import CartModal from "../store/cart/cartModal";

const pages = [
  { label: "ShowCASE", path: "/showcase" },
  { label: "DIY", path: "/diy" },
  { label: "Blogs", path: "/blogs" },
  // { label: "Shop", path: "/shop" },
];

const settings = ["Profile", "Logout"];

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

export default function Navbar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [avatarUrl, setAvatarUrl] = React.useState(
    localStorage.getItem("avatarUrl") || null
  );
  const [isCartOpen, setCartOpen] = React.useState(false);

  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleCloseUserMenu = () => setAnchorElUser(null);
  const handleOpenCart = () => setCartOpen(true);
  const handleCloseCart = () => setCartOpen(false);

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleSettingClick = async (setting) => {
    handleCloseUserMenu();
    if (setting === "Logout") {
      await signOut(auth);
      localStorage.removeItem("avatarUrl");
      navigate("/login");
    } else {
      navigate(`/${setting.toLowerCase()}`);
    }
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const cached = localStorage.getItem("avatarUrl");
        if (!cached) {
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            const pic = data.profilePic || "";
            setAvatarUrl(pic);
            localStorage.setItem("avatarUrl", pic);
          }
        }
      } else {
        setUser(null);
        setAvatarUrl(null);
        localStorage.removeItem("avatarUrl");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          height: "100px",
          background:"#507e6c",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          overflow: "visible",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar
            disableGutters
            sx={{ minHeight: "100px", alignItems: "center", px: 2 }}
          >
            {/* Logo + Brand Text (Desktop) */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                mr: 2,
              }}
            >
              <Box
                component="img"
                src="/Img/logos/LeTourDeToolBox.png"
                alt="The Bike Bench Logo"
                sx={{ height: 125, width: "auto", mr: 1 }}
              />
              <Typography
                variant="h6"
                noWrap
                component={Link}
                to="/"
                sx={{
                  fontFamily: "monospace",
                  fontWeight: 700,
                  letterSpacing: ".3rem",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                The Bike Bench
              </Typography>
            </Box>

            {/* Mobile Menu Icon */}
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton onClick={handleOpenNavMenu} color="inherit">
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorElNav}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                sx={{ display: { xs: "block", md: "none" } }}
              >
                {pages.map((page) => (
                  <MenuItem
                    key={page.label}
                    component={Link}
                    to={page.path}
                    onClick={handleCloseNavMenu}
                  >
                    <Typography textAlign="center">{page.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            {/* Logo - Small screen */}
            <Box
              component="img"
              src="/Img/logos/LeTourDeToolBox.png"
              alt="ToolBoxWarz Logo"
              sx={{ height: 40, mr: 1, display: { xs: "flex", md: "none" } }}
            />
            <Typography
              variant="h5"
              noWrap
              component={Link}
              to="/"
              sx={{
                mr: 2,
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontFamily: "monospace",
                fontWeight: 700,
                letterSpacing: ".3rem",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              The Bike Bench 
            </Typography>

            {/* Desktop Links */}
            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {pages.map((page) => (
                <Button
                  key={page.label}
                  component={Link}
                  to={page.path}
                  onClick={handleCloseNavMenu}
                  sx={{ my: 2, color: "white", display: "block" }}
                >
                  {page.label}
                </Button>
              ))}
            </Box>

            {/* Search Bar */}
            {/* <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Search…"
                inputProps={{ "aria-label": "search" }}
              />
            </Search> */}

            {/* Cart Icon */}
            {/* <Box sx={{ mx: 2 }}>
              <IconButton size="large" color="inherit" onClick={handleOpenCart}>
                <Badge badgeContent={cartItems.length} color="error">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Box> */}

            {/* Avatar/Account */}
            <Box sx={{ flexGrow: 0 }}>
              {user ? (
                <>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <Avatar alt={user.displayName} src={avatarUrl || ""} />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: "45px" }}
                    anchorEl={anchorElUser}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    {settings.map((setting) => (
                      <MenuItem
                        key={setting}
                        onClick={() => handleSettingClick(setting)}
                      >
                        <Typography textAlign="center">{setting}</Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button component={Link} to="/login" color="inherit">
                    Login
                  </Button>
                  <Button
                    component={Link}
                    to="/signup"
                    color="inherit"
                    variant="outlined"
                  >
                    Sign Up
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <CartModal
        open={isCartOpen}
        onClose={handleCloseCart}
        cartItems={cartItems}
        onRemoveItem={removeFromCart}
        total={total}
      />
    </>
  );
}
