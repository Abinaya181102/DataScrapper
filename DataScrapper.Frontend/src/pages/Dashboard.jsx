import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Link
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import axios from "axios";

const StatCard = ({ title, value, subtitle, icon }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e5e7eb",
      height: "100%",
      width: "140%"
    }}
  >
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={600}>{title}</Typography>
        {icon}
      </Stack>

      <Typography variant="h3" fontWeight={700}>
        {value}
      </Typography>

      <Typography color="success.main" fontSize={14}>
        {subtitle}
      </Typography>
    </Stack>
  </Paper>
);

const ActionCard = ({ icon, title, description }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      borderRadius: 3,
      border: "1px solid #e5e7eb",
      height: "100%",
      width: "80%"
    }}
  >
    <Stack spacing={2}>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
          color: "#fff"
        }}
      >
        {icon}
      </Box>

      <Typography fontWeight={600} fontSize={18}>
        {title}
      </Typography>

      <Typography color="text.secondary">
        {description}
      </Typography>

    </Stack>
  </Paper>
);

const Dashboard = () => {
  const [filesProcessed, setFilesProcessed] = useState(0);

  useEffect(() => {
    const fetchJobFiles = async () => {
      try {
        const response = await axios.get("http://localhost:5229/api/JobFile");
        const completedFiles = response.data.filter(
          (file) => file.status?.toLowerCase() === "completed"
        );
        setFilesProcessed(completedFiles.length);
      } catch (error) {
        console.error("Error fetching job files", error);
      }
    };

    fetchJobFiles();
  }, []);

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" fontWeight={700} mb={1}>
        Dashboard
      </Typography>
      <Typography color="text.secondary" mb={4}>
        Welcome to DataScrapper. Start by uploading files or configuring field mappings.
      </Typography>

      {/* Stats */}
      <Grid container spacing={10} mb={4}>
        <Grid item >
          <StatCard
            title="Files Processed"
            value={filesProcessed}
            icon={<DescriptionOutlinedIcon color="primary" />}

          />
        </Grid>

        <Grid item >
          <StatCard
            title="Fields Mapped"
            value={0}
            icon={<SettingsOutlinedIcon color="primary" />}
          />
        </Grid>

        <Grid item >
          <StatCard
            title="Active Jobs"
            value={0}
            icon={<ShowChartOutlinedIcon color="primary" />}
          />
        </Grid>

        <Grid item >
          <StatCard
            title="Success Rate"
            value="100%"
            icon={<TrendingUpOutlinedIcon color="primary" />}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Typography variant="h5" fontWeight={700} mb={3}>
        Quick Actions
      </Typography>

      <Grid container spacing={1}>
        <Grid item >
          <ActionCard
            icon={<CloudUploadOutlinedIcon />}
            title="Upload Files"
            description="Upload PDF, Word, or Excel files for data extraction"
          />
        </Grid>

        <Grid item xs={12} ml={-9}>
          <ActionCard
            icon={<TuneOutlinedIcon />}
            title="Field Mapping"
            description="Define custom field mappings for your documents"
          />
        </Grid>

        <Grid item xs={12} ml={-9}>
          <ActionCard
            icon={<ListAltOutlinedIcon />}
            title="View Logs"
            description="Monitor processing status and view detailed logs"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
