

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  Box,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  Select,
  FormControl,
  Avatar,
  InputLabel
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import PersonIcon from "@mui/icons-material/Person";


const MappingPage = () => {
  const [mappingName, setMappingName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonFields, setJsonFields] = useState([]);
  const [currentField, setCurrentField] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const [existingMappings, setExistingMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/"; // or navigate("/login")
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.user_name) setUsername(user.user_name);

    fetchExistingMappings();
  }, []);

  const fetchExistingMappings = async () => {
    try {
      const userId = JSON.parse(localStorage.getItem("user")).user_id;
      const response = await axios.get(
        `http://localhost:5229/api/mapping?userId=${userId}`
      );
      setExistingMappings(response.data);
    } catch (error) {
      console.error("Failed to load mappings", error);
    }
  };

  const handleSelectMapping = (mappingId) => {
    setSelectedMappingId(mappingId);

    if (!mappingId) {
      resetForm();
      return;
    }

    const selected = existingMappings.find((m) => m.mappingId === mappingId);

    if (selected) {
      setMappingName(selected.mappingName);
      setDescription(selected.description);

      try {
        const fieldsArray = JSON.parse(selected.configJson);
        setJsonFields(Array.isArray(fieldsArray) ? fieldsArray : []);
      } catch {
        setJsonFields([]);
      }
    }
  };

  const resetForm = () => {
    setMappingName("");
    setDescription("");
    setJsonFields([]);
    setCurrentField("");
    setMessage("");
  };

  const addField = () => {
    if (!currentField.trim()) return;
    setJsonFields([...jsonFields, currentField.trim()]);
    setCurrentField("");
  };

  const removeField = (index) => {
    const updated = jsonFields.filter((_, i) => i !== index);
    setJsonFields(updated);
  };

  // ------------------------------
  // CREATE Mapping
  // ------------------------------
  const handleCreate = async (e) => {
    e.preventDefault();

    if (!mappingName) {
      setMessage("Mapping name is required!");
      return;
    }

    try {
      const requestData = {
        mappingName,
        description,
        userId: JSON.parse(localStorage.getItem("user")).user_id,
        configJson: JSON.stringify(jsonFields)
      };

      await axios.post("http://localhost:5229/api/mapping", requestData, {
        headers: { "Content-Type": "application/json" }
      });

      setMessage("Mapping created successfully!");
      resetForm();
      fetchExistingMappings();
    } catch (error) {
      console.error(error);
      setMessage("Failed to create mapping.");
    }
  };

  // ------------------------------
  // UPDATE Mapping
  // ------------------------------
  const handleUpdate = async (e) => {
  e.preventDefault();

  if (!mappingName) {
    setMessage("Mapping name is required!");
    return;
  }

  try {
    const requestData = {
      mappingName,
      description,
      configJson: JSON.stringify(jsonFields)
    };
    const userId = JSON.parse(localStorage.getItem("user")).user_id;
    await axios.put(
  `http://localhost:5229/api/mapping/${selectedMappingId}?userId=${userId}`,
  requestData,
  { headers: { "Content-Type": "application/json" } }
);


    setMessage("Mapping updated successfully!");
    fetchExistingMappings();
  } catch (error) {
    console.error(error);
    setMessage(error.response?.data?.message || "Failed to update mapping.");
  }
};

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          flexGrow: 1,
          p: 4,
          backgroundColor: "#f7f8fa",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start"
        }}
      >
        <Paper sx={{ width: "70%", p: 4 }} elevation={4}>
          <Typography variant="h4" gutterBottom>
            Create / Use Existing Mapping
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Existing Mapping</InputLabel>
            <Select
              value={selectedMappingId}
              label="Select Existing Mapping"
              onChange={(e) => handleSelectMapping(e.target.value)}
            >
              <MenuItem value="">(Create New Mapping)</MenuItem>

              {existingMappings.map((mapping) => (
                <MenuItem key={mapping.mappingId} value={mapping.mappingId}>
                  {mapping.mappingName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box component="form" onSubmit={selectedMappingId ? handleUpdate : handleCreate}>
            <TextField
              label="Mapping Name"
              fullWidth
              required
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
              sx={{ mb: 3 }}
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: "flex", mb: 2 }}>
              <TextField
                label="Add JSON Field"
                fullWidth
                value={currentField}
                onChange={(e) => setCurrentField(e.target.value)}
              />
              <IconButton color="primary" onClick={addField}>
                <AddIcon />
              </IconButton>
            </Box>

            <Paper
              sx={{
                maxHeight: 200,
                overflowY: "auto",
                p: 2,
                backgroundColor: "#fafafa",
                border: "1px solid #ddd"
              }}
            >
              {jsonFields.length === 0 ? (
                <Typography>No fields added yet.</Typography>
              ) : (
                jsonFields.map((field, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 1
                    }}
                  >
                    <Typography>{field}</Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeField(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))
              )}
            </Paper>

            <Button
              type="submit"
              variant="contained"
              color={selectedMappingId ? "secondary" : "primary"}
              fullWidth
              sx={{ mt: 3, py: 1.5 }}
            >
              {selectedMappingId ? "Update Mapping" : "Create Mapping"}
            </Button>

            {message && (
              <Typography
                sx={{
                  mt: 2,
                  fontWeight: "bold",
                  color: message.includes("success") ? "green" : "red"
                }}
              >
                {message}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MappingPage;
