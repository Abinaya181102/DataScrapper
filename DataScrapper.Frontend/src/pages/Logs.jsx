import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  TablePagination 
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import HourglassBottomOutlinedIcon from "@mui/icons-material/HourglassBottomOutlined";

const STATUS_COLORS = {
  completed: "success",
  failed: "error",
  processing: "warning"
};

export default function Logs() {
  const userId = JSON.parse(localStorage.getItem("user")).user_id;

  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
   

   useEffect(() => {
  setPage(0);
}, [search, statusFilter]);


  /* ---------------- FETCH JOBS ---------------- */
  useEffect(() => {
  if (!userId) return;

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5229/api/jobs/user/${userId}`
      );

      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoading(false);
    }
  };

  fetchJobs();
}, [userId]);


  /* ---------------- FILTER LOGS ---------------- */
  const logs = jobs;
  const filteredLogs = logs.filter(job => {
  const matchesSearch =
    job.job_id.toString().includes(search) ||
    job.status?.toLowerCase().includes(search.toLowerCase());

  const matchesStatus =
    statusFilter === "all" || job.status === statusFilter;

  return matchesSearch && matchesStatus;
});

  /* ---------------- STATS ---------------- */
  const stats = {
  total: logs.length,
  completed: logs.filter(j => j.status === "completed").length,
  failed: logs.filter(j => j.status === "failed").length,
  processing: logs.filter(j => j.status === "processing" || j.status === "pending").length
};

const paginatedLogs = filteredLogs.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
);
  /* ---------------- UI ---------------- */
  return (
    <Box>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Process Logs
          </Typography>
          <Typography color="text.secondary">
            Monitor file processing status and view detailed extraction logs.
          </Typography>
        </Box>
      </Box>

      {/* STATS */}
      <Grid container spacing={3} mb={4}>
        <StatCard
          icon={<DescriptionOutlinedIcon />}
          title="Total Processed"
          value={stats.total}
        />
        <StatCard
          icon={<CheckCircleOutlineIcon color="success" />}
          title="Successful"
          value={stats.completed}
        />
        <StatCard
          icon={<CancelOutlinedIcon color="error" />}
          title="Failed"
          value={stats.failed}
        />
        <StatCard
          icon={<HourglassBottomOutlinedIcon color="warning" />}
          title="Processing"
          value={stats.processing}
        />
      </Grid>

      {/* SEARCH & FILTER */}
      <Paper sx={{ p: 2, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            <TextField
              fullWidth
              placeholder="Search by file name or message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* ACTIVITY LOG */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight={600} mb={1}>
          Activity Log
        </Typography>
        <Typography color="text.secondary" mb={3}>
          {filteredLogs.length} entries found
        </Typography>

        {filteredLogs.length === 0 ? (
          <Box
            height={260}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            color="text.secondary"
          >
            <Typography variant="h6">No processing logs yet</Typography>
            <Typography>
              Upload and process files to see activity here
            </Typography>
          </Box>
        ) : (
            
          <>
  <Table>
    <TableHead>
      <TableRow>
        <TableCell>Status</TableCell>
        <TableCell>Uploaded Files</TableCell>
        <TableCell>Error</TableCell>
        <TableCell>Created At</TableCell>
      </TableRow>
    </TableHead>

    <TableBody>
      {paginatedLogs.map(job => (
        <TableRow key={job.job_id}>
          <TableCell>
            <Chip
              label={job.status}
              color={
                job.status === "completed"
                  ? "success"
                  : job.status === "failed"
                  ? "error"
                  : "warning"
              }
              size="small"
            />
          </TableCell>

          <TableCell>{job.uploaded_file_count ?? 0}</TableCell>
          <TableCell>{job.error_message || "-"}</TableCell>
          <TableCell>
            {new Date(job.created_at).toLocaleString()}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>

  <TablePagination
    component="div"
    count={filteredLogs.length}
    page={page}
    onPageChange={handleChangePage}
    rowsPerPage={rowsPerPage}
    rowsPerPageOptions={[10]}
  />
</>

        )}
      </Paper>
    </Box>
  );
}

/* ---------------- STAT CARD ---------------- */
function StatCard({ icon, title, value }) {
  return (
    <Grid item xs={12} md={3}>
      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              backgroundColor: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="h5" fontWeight={700}>
              {value}
            </Typography>
            <Typography color="text.secondary">{title}</Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
