import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Button,
  TextField,
  Alert,
} from "@mui/material";

import axios from "axios";

const UploadFile = () => {
  const [existingMappings, setExistingMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [jsonFields, setJsonFields] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  // NEW → Display extracted mapped values
  const [extractedOutput, setExtractedOutput] = useState({});

  useEffect(() => {
    fetchMappings();
  }, []);

  // Fetch Mapping List
  const fetchMappings = async () => {
    try {
      const userJson = localStorage.getItem("user");
      if (!userJson) {
        setMessage("User not logged in.");
        return;
      }

      const userId = JSON.parse(userJson)?.user_id;

      const response = await axios.get(
        `http://localhost:5229/api/mapping?userId=${userId}`
      );

      setExistingMappings(Array.isArray(response.data) ? response.data : []);
    } catch {
      setMessage("Failed to load mappings.");
    }
  };

  // When user selects a mapping, load JSON fields
  const handleMappingSelect = (mappingId) => {
    setSelectedMappingId(mappingId);
    const selected = existingMappings.find((m) => m.mappingId === mappingId);

    if (selected) {
      try {
        const arr = JSON.parse(selected.configJson);
        setJsonFields(Array.isArray(arr) ? arr : []);
      } catch {
        setJsonFields([]);
        setMessage("Invalid JSON in mapping.");
      }
    }
  };

  // Upload File + Show extracted fields + download Excel
 const uploadFileToBackend = async () => {
  setMessage("");
  setExtractedOutput({});

  if (!selectedMappingId) return setMessage("Please select a mapping.");
  if (!selectedFile) return setMessage("Please select a file.");

  try {
    // 1️⃣ Create job
    const jobResponse = await axios.post("http://localhost:5229/api/Jobs", {
      user_id: JSON.parse(localStorage.getItem("user"))?.user_id,
      mapping_id: selectedMappingId,
      uploaded_file_count: 1 // single file
    });

    const jobId = jobResponse.data.job_id;

    // 2️⃣ Upload file and get Excel blob
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("job_id", jobId);
    formData.append("mappingJson", JSON.stringify(jsonFields));

    const response = await axios.post(
      "http://localhost:5229/api/JobFile/upload",
      formData,
      { responseType: "blob" }  // Important for binary Excel
    );

    // 3️⃣ Download Excel
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedFile.name.split(".")[0]}_Extracted.xlsx`;
    link.click();

    setMessage("File processed successfully!");
  } catch (error) {
    console.error(error);
    setMessage("File processing failed.");
  }
};


  return (
    <Box
      sx={{
        flexGrow: 1,
        p: 4,
        display: "flex",
        justifyContent: "center",
        backgroundColor: "#f7f8fa",
        minHeight: "100vh",
      }}
    >
      <Paper sx={{ width: "60%", p: 4 }} elevation={4}>
        <Typography variant="h4" gutterBottom>
          Upload File
        </Typography>

        {/* Mapping Select */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Select Mapping</InputLabel>
          <Select
            value={selectedMappingId}
            label="Select Mapping"
            onChange={(e) => handleMappingSelect(e.target.value)}
            size="small"
          >
            <MenuItem value="">(Select a mapping)</MenuItem>
            {existingMappings.map((mapping) => (
              <MenuItem key={mapping.mappingId} value={mapping.mappingId}>
                {mapping.mappingName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* File Input */}
        <TextField
          fullWidth
          type="file"
          inputProps={{ accept: ".pdf,.docx,.xls,.xlsx,.csv" }}
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          size="small"
        />

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={uploadFileToBackend}
        >
          Upload & Process
        </Button>

        {message && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}

        {/* Mapping Fields Display */}
        {jsonFields.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Mapping Fields</Typography>
            <List sx={{ border: "1px solid #ddd", maxHeight: 200, overflowY: "auto" }}>
              {jsonFields.map((field, i) => (
                <ListItem key={i} divider>
                  <ListItemText primary={field} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* NEW → Extracted Values Preview */}
        {Object.keys(extractedOutput).length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Extracted Output Preview</Typography>

            <List sx={{ border: "1px solid #4caf50", background: "#f1fff1" }}>
              {Object.entries(extractedOutput).map(([key, value], i) => (
                <ListItem key={i} divider>
                  <ListItemText
                    primary={`${key}:`}
                    secondary={value || "(Not found in document)"}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default UploadFile;
