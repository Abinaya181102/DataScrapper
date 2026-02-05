import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Alert,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";

const UploadFile = () => {
  const [existingMappings, setExistingMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [jsonFields, setJsonFields] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [jobId, setJobId] = useState(null);


  // Preview states
  const [previewOpen, setPreviewOpen] = useState(false);
  const [excelBlob, setExcelBlob] = useState(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(
        `http://localhost:5229/api/mapping?userId=${user?.user_id}`
      );
      setExistingMappings(res.data || []);
    } catch {
      setMessage("Failed to load mappings");
    }
  };

  const handleMappingSelect = (mappingId) => {
    setSelectedMappingId(mappingId);
    const selected = existingMappings.find(
      (m) => m.mappingId === mappingId
    );

    if (selected) {
      try {
        setJsonFields(JSON.parse(selected.configJson) || []);
      } catch {
        setJsonFields([]);
      }
    }
  };

  const uploadFileToBackend = async () => {
  if (!selectedMappingId) return setMessage("Please select a mapping");
  if (selectedFiles.length === 0) return setMessage("Please select files");
 
  try {
    const user = JSON.parse(localStorage.getItem("user"));
 
    // Create Job
    const jobRes = await axios.post("http://localhost:5229/api/Jobs", {
      user_id: user.user_id,
      mapping_id: selectedMappingId,
      uploaded_file_count: selectedFiles.length,
      status: "processing"
    });
 
    const createdJobId = jobRes.data.job_id;
    setJobId(createdJobId);
 
    // Process files one by one
    const formData = new FormData();
 
    // 🔥 Append ALL files using SAME key
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });
 
    formData.append("job_id", createdJobId);
    formData.append("mappingJson", JSON.stringify(jsonFields));
 
    const res = await axios.post(
      "http://localhost:5229/api/JobFile/upload",
      formData,
      { responseType: "blob" }
    );
 
    // One merged Excel
    setExcelBlob(res.data);
 
    // Update job status
    await axios.put(`http://localhost:5229/api/Jobs/${createdJobId}`, {
      job_id: createdJobId,
      status: "completed",
      completed_at: new Date().toISOString()
    });

    setPreviewOpen(true);
  } catch (error) {
    console.error(error);
 
    if (jobId) {
      await axios.put(`http://localhost:5229/api/Jobs/${jobId}`, {
        job_id: jobId,
        status: "failed",
        error_message: "File extraction failed"
      });
    }
 
    setMessage("File processing failed");
  }
};


  const handleExport = () => {
    if (!excelBlob) return;

    const blob = new Blob([excelBlob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Extracted_Output.xlsx`;
    link.click();

    setPreviewOpen(false);
  };

  return (
    <Box sx={{ p: 4, background: "#f7f8fa", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight={600}>
        Upload Files
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3, mt: 1 }}>
        Upload your documents for data extraction. Supported formats: PDF, Word, Excel.
      </Typography>

      {/* Mapping Dropdown */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Mapping</InputLabel>
        <Select
          value={selectedMappingId}
          label="Select Mapping"
          onChange={(e) => handleMappingSelect(e.target.value)}
        >
          {existingMappings.map((m) => (
            <MenuItem key={m.mappingId} value={m.mappingId}>
              {m.mappingName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Upload Area */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Paper
          variant="outlined"
          component="label"
          sx={{
            width: "100%",
            maxWidth: 900,
            borderStyle: "dashed",
            borderRadius: 2,
            p: 6,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: "#fafbfd",
          }}
        >
          <input
            hidden
            type="file"
            multiple
            accept=".pdf,.docx,.xls,.xlsx"
            onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
          />

          <CloudUploadOutlinedIcon sx={{ fontSize: 48, color: "#1976d2" }} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Drag & drop files here
          </Typography>
          <Typography color="text.secondary">
            or click to browse from your computer
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Chip label="PDF" sx={{ mr: 1 }} />
            <Chip label="DOCX" sx={{ mr: 1 }} />
            <Chip label="XLSX" />
          </Box>
        </Paper>
      </Box>

      {/* Uploaded Files */}
      {selectedFiles.length > 0 && (
  <Paper sx={{ p: 3, mb: 3 }}>
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography fontWeight={600}>Uploaded Files</Typography>
      <Button variant="contained" onClick={uploadFileToBackend}>
        Process Files
      </Button>
    </Box>
 
    <List
      sx={{
        maxHeight: 300,        // adjust as needed
        overflowY: "auto",
        mt: 2,
      }}
    >
      {selectedFiles.map((file, index) => (
        <ListItem
          key={index}
          secondaryAction={
            <IconButton
              onClick={() =>
                setSelectedFiles(files =>
                  files.filter((_, i) => i !== index)
                )
              }
            >
              <CloseIcon />
            </IconButton>
          }
        >
          <CheckCircleIcon color="success" sx={{ mr: 2 }} />
          <ListItemText
            primary={file.name}
            secondary={`${(file.size / 1024).toFixed(1)} KB`}
          />
        </ListItem>
      ))}
    </List>
  </Paper>
)}

      {/* Mapping Fields */}
      {jsonFields.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography fontWeight={600} sx={{ mb: 2 }}>
            Mapping Fields
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List>
            {jsonFields.map((field, i) => (
              <ListItem key={i}>
                <ListItemText primary={field} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {message && (
        <Alert sx={{ mt: 3 }} severity="info">
          {message}
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} maxWidth="md" fullWidth>
        <DialogTitle>Extracted Data Preview</DialogTitle>
        <Typography color="text.secondary" >
              Extraction completed successfully. Click Export to download the Excel file.
        </Typography>


        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setPreviewOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleExport}>
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadFile;
