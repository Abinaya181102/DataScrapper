import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";

const Layout = () => {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const [username, setUsername] = React.useState("");

  const openMenu = Boolean(anchorEl);

  React.useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.user_name) setUsername(user.user_name);
  }, []);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      {/* ---------- NAVBAR ----------- */}
      <AppBar position="static">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Left: Title */}
          <Typography variant="h6">DataScrapper</Typography>

          {/* Center: Upload Button */}
          <Box sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <Button
              color="inherit"
              sx={{ textTransform: "none", fontSize: "1rem" }}
              onClick={() => navigate("/upload")}
            >
              Upload File
            </Button>
          </Box>

          {/* Right: Profile */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">{username}</Typography>

            <IconButton onClick={handleMenuOpen} color="inherit">
              <Avatar sx={{ width: 32, height: 32 }}>
                <PersonIcon />
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ---------- PAGE CONTENT ----------- */}
      <Outlet />
    </>
  );
};

export default Layout;

