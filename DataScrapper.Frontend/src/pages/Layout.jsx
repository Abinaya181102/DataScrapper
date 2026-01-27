// pages/Layout.jsx
import { Outlet, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Button,
  Divider
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 260;

const Layout = () => {
  const navigate = useNavigate();

  const menuItems = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Mapping", path: "/mapping", icon: <MapIcon /> },
    { label: "Upload Files", path: "/upload", icon: <UploadFileIcon /> },
    { label: "Process Logs", path: "/logs", icon: <ListAltIcon /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", fontFamily: "'Roboto', sans-serif" }}>
      {/* LEFT NAVBAR */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            backgroundColor: "#000",
            color: "#fff", // text color white
            boxSizing: "border-box"
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            variant="h6"
            sx={{ color: "#fff", fontWeight: 600, fontFamily: "'Roboto', sans-serif" }}
          >
            Data Scrapper
          </Typography>
        </Box>

        <Divider sx={{ backgroundColor: "#222" }} />

        <List sx={{ mt: 2 }}>
          {menuItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => navigate(item.path)}
              sx={{
                mb: 1.5,
                borderRadius: 2,
                px: 3,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#fff", // text color white
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: "#222",
                  color: "#fff"
                }
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: "35px" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* LOGOUT */}
        <Box sx={{ p: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{
              color: "#fff",
              borderColor: "#fff",
              "&:hover": {
                backgroundColor: "red",
                color: "#fff",
                borderColor: "red"
              }
            }}
          >
            Sign out
          </Button>
        </Box>
      </Drawer>

      {/* PAGE CONTENT */}
       <Box
            component="main"
            sx={{
                flexGrow: 1,
                overflowY: "auto",
                backgroundColor: "#f5f5f5",
                p: 4,

                /* Hide scrollbar */
                scrollbarWidth: "none",        // Firefox
                msOverflowStyle: "none",       // IE / Edge
                "&::-webkit-scrollbar": {
                display: "none",             // Chrome, Safari
                },
            }}
            >
            <Outlet />
        </Box>

    </Box>
  );
};

export default Layout;
