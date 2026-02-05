import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import axios from "axios";

const MappingPage = () => {
  const [mappingName, setMappingName] = useState("");
  const [description, setDescription] = useState("");
  const [jsonFields, setJsonFields] = useState([]);
  const [currentField, setCurrentField] = useState("");
  const [message, setMessage] = useState("");

  const [existingMappings, setExistingMappings] = useState([]);
  const [selectedMappingId, setSelectedMappingId] = useState(null);

  const [openModal, setOpenModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Fetch existing mappings
  useEffect(() => {
    const fetchMappings = async () => {
      const userId = JSON.parse(localStorage.getItem("user"))?.user_id;
      if (!userId) return;

      try {
        const res = await axios.get(`http://localhost:5229/api/mapping?userId=${userId}`);
        setExistingMappings(res.data);
      } catch (err) {
        console.error("Failed to fetch mappings", err);
      }
    };

    fetchMappings();
  }, []);

  /* ---------------- CREATE ---------------- */
  const handleNewMapping = () => {
    resetForm();
    setIsEditMode(false);
    setOpenModal(true);
  };

  /* ---------------- EDIT ---------------- */
  const handleEditMapping = (mappingId) => {
    const selected = existingMappings.find((m) => m.mappingId === mappingId);
    if (!selected) return;

    setSelectedMappingId(selected.mappingId);
    setMappingName(selected.mappingName);
    setDescription(selected.description);

    try {
      setJsonFields(JSON.parse(selected.configJson));
    } catch {
      setJsonFields([]);
    }

    setIsEditMode(true);
  };

  /* ---------------- COMMON ---------------- */
  const resetForm = () => {
    setMappingName("");
    setDescription("");
    setJsonFields([]);
    setCurrentField("");
    setSelectedMappingId(null);
    setMessage("");
  };

  const addField = () => {
    if (!currentField.trim()) return;
    setJsonFields([...jsonFields, currentField.trim()]);
    setCurrentField("");
  };

  const updateFieldValue = (index, value) => {
    const updatedFields = [...jsonFields];
    updatedFields[index] = value;
    setJsonFields(updatedFields);
  };

  const addEmptyField = () => {
    setJsonFields([...jsonFields, ""]);
  };

  const removeField = (index) => {
    setJsonFields(jsonFields.filter((_, i) => i !== index));
  };

  const handleCreateOrUpdate = async () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.user_id;
    if (!userId) return;

    const payload = {
      mappingName,
      description,
      userId,
      configJson: JSON.stringify(jsonFields),
    };

    try {
      if (selectedMappingId) {
        await axios.put(`http://localhost:5229/api/mapping/${selectedMappingId}?userId=${userId}`, payload);
      } else {
        await axios.post("http://localhost:5229/api/mapping", payload);
      }

      resetForm();
      setOpenModal(false);
      setIsEditMode(false);

      // Refresh mappings
      const res = await axios.get(`http://localhost:5229/api/mapping?userId=${userId}`);
      setExistingMappings(res.data);
    } catch (err) {
      console.error("Failed to create/update mapping", err);
      setMessage("Failed to save mapping");
    }
  };

  return (
    <Box sx={{ p: 4, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>

      {/* ================= EDIT MODE ================= */}
      {isEditMode ? (
        <>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 5 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <IconButton aria-label="back-to-list" onClick={() => setIsEditMode(false)}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" component="h1" aria-label="edit-mapping-title" fontWeight={600}>
                  Edit Mapping
                </Typography>
              </Box>
              <Typography color="text.secondary" sx={{ ml: 5 }}>
                Configure fields for this mapping
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Button variant="outlined" onClick={() => setIsEditMode(false)} sx={{ height: 40, px: 3 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateOrUpdate}
                sx={{ backgroundColor: "hsl(226 70% 50%)", height: 40, px: 3 }}
              >
                Save Mapping
              </Button>
            </Box>
          </Box>

          {/* Mapping Details */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Mapping Name"
                  fullWidth
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Field Mappings */}
          <Paper sx={{ p: 4 }}>
            <Typography variant="h6" mb={3}>
              Field Mappings
            </Typography>

            {jsonFields.map((field, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <TextField
                  fullWidth
                  value={field}
                  placeholder="Enter field name"
                  onChange={(e) => updateFieldValue(index, e.target.value)}
                />
                <IconButton
                  aria-label={`delete-field-${index}`}
                  color="error"
                  onClick={() => removeField(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              sx={{ mt: 2, width: '100%', backgroundColor: "hsl(226 70% 50%)", color: "#fff" }}
              onClick={addEmptyField}
              aria-label="add-empty-field"
            >
              Add Field
            </Button>
          </Paper>
        </>
      ) : (
        <>
          {/* ================= LIST VIEW ================= */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Box>
              <Typography variant="h4" component="h1" aria-label="list-mapping-title">Field Mappings</Typography>
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Manage your document field mappings for data extraction
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewMapping}
              sx={{ backgroundColor: "hsl(226 70% 50%)", height: 40 }}
              aria-label="new-mapping-button"
            >
              New Mapping
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Mapping Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Fields</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {existingMappings.map((mapping) => (
                  <TableRow key={mapping.mappingId}>
                    <TableCell>{mapping.mappingName}</TableCell>
                    <TableCell>{mapping.description}</TableCell>
                    <TableCell>{JSON.parse(mapping.configJson).length}</TableCell>
                    <TableCell>
                      <IconButton
                        aria-label={`edit-mapping-${mapping.mappingId}`}
                        onClick={() => handleEditMapping(mapping.mappingId)}
                      >
                        <img src="/src/assets/edit.png" alt="edit" width={22} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ================= CREATE DIALOG ================= */}
      {!isEditMode && (
        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create New Mapping</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Mapping Name"
              fullWidth
              required
              value={mappingName}
              onChange={(e) => setMappingName(e.target.value)}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Add Field Section */}
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <TextField
                label="Field Name"
                fullWidth
                value={currentField}
                onChange={(e) => setCurrentField(e.target.value)}
              />
              <Button
                variant="contained"
                onClick={addField}
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: "hsl(226 70% 50%)",
                  color: "#fff",
                  minWidth: "120px",
                  height: "40px",
                  "&:hover": { backgroundColor: "hsl(226 70% 50%)" },
                }}
                aria-label="add-field-dialog"
              >
                Add Fields
              </Button>
            </Box>

            {/* Display Added Fields */}
            {jsonFields.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No fields added yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1, maxHeight: 200, overflowY: "auto", pr: 1 }}>
                {jsonFields.map((field, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      bgcolor: "#fff",
                      "&:hover": { bgcolor: "#f0f8ff" },
                    }}
                  >
                    <Typography>{field}</Typography>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => removeField(index)}
                      aria-label={`delete-field-dialog-${index}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}

            {message && (
              <Typography sx={{ mt: 1, fontWeight: "bold", color: message.includes("success") ? "green" : "red" }}>
                {message}
              </Typography>
            )}
          </DialogContent>

          <DialogActions sx={{ mb: 2, pr: 3 }}>
            <Button onClick={() => setOpenModal(false)} sx={{ color: "hsl(226 70% 50%)" }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleCreateOrUpdate} sx={{ backgroundColor: "hsl(226 70% 50%)", color: "#fff" }}>
              Create Mapping
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default MappingPage;
