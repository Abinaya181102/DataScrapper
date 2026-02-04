
// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   IconButton,
//   Paper,
//   Grid,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   Card,
//   CardContent,
//   CardActions
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import DeleteIcon from "@mui/icons-material/Delete";
// import axios from "axios";

// const MappingPage = () => {
//   const [mappingName, setMappingName] = useState("");
//   const [description, setDescription] = useState("");
//   const [jsonFields, setJsonFields] = useState([]);
//   const [currentField, setCurrentField] = useState("");
//   const [message, setMessage] = useState("");

//   const [existingMappings, setExistingMappings] = useState([]);
//   const [selectedMappingId, setSelectedMappingId] = useState("");

//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("user"));
//     if (!user) return;

//     fetchExistingMappings();
//   }, []);

//   const fetchExistingMappings = async () => {
//     try {
//       const userId = JSON.parse(localStorage.getItem("user")).user_id;
//       const response = await axios.get(
//         `http://localhost:5229/api/mapping?userId=${userId}`
//       );
//       setExistingMappings(response.data);
//     } catch (error) {
//       console.error("Failed to load mappings", error);
//     }
//   };

//   const handleSelectMapping = (mappingId) => {
//     setSelectedMappingId(mappingId);

//     if (!mappingId) {
//       resetForm();
//       return;
//     }

//     const selected = existingMappings.find((m) => m.mappingId === mappingId);
//     if (selected) {
//       setMappingName(selected.mappingName);
//       setDescription(selected.description);
//       try {
//         const fieldsArray = JSON.parse(selected.configJson);
//         setJsonFields(Array.isArray(fieldsArray) ? fieldsArray : []);
//       } catch {
//         setJsonFields([]);
//       }
//     }
//   };

//   const resetForm = () => {
//     setMappingName("");
//     setDescription("");
//     setJsonFields([]);
//     setCurrentField("");
//     setMessage("");
//   };

//   const addField = () => {
//     if (!currentField.trim()) return;
//     setJsonFields([...jsonFields, currentField.trim()]);
//     setCurrentField("");
//   };

//   const removeField = (index) => {
//     setJsonFields(jsonFields.filter((_, i) => i !== index));
//   };

//   const handleCreateOrUpdate = async (e) => {
//     e.preventDefault();
//     if (!mappingName) {
//       setMessage("Mapping name is required!");
//       return;
//     }

//     try {
//       const requestData = {
//         mappingName,
//         description,
//         userId: JSON.parse(localStorage.getItem("user")).user_id,
//         configJson: JSON.stringify(jsonFields)
//       };

//       if (selectedMappingId) {
//         await axios.put(
//           `http://localhost:5229/api/mapping/${selectedMappingId}?userId=${requestData.userId}`,
//           requestData,
//           { headers: { "Content-Type": "application/json" } }
//         );
//         setMessage("Mapping updated successfully!");
//       } else {
//         await axios.post(
//           "http://localhost:5229/api/mapping",
//           requestData,
//           { headers: { "Content-Type": "application/json" } }
//         );
//         setMessage("Mapping created successfully!");
//       }

//       resetForm();
//       fetchExistingMappings();
//     } catch (error) {
//       console.error(error);
//       setMessage(error.response?.data?.message || "Failed to save mapping.");
//     }
//   };

//   return (
//     <Box sx={{ p: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
//       <Typography variant="h3" sx={{ mb: 4, textAlign: "center" }}>
//         Mapping Configuration
//       </Typography>

//       <Grid container spacing={4} justifyContent="center">
//         {/* Left panel: Select existing mapping */}
//         <Grid item xs={12} md={4}>
//           <Card elevation={3}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 2 }}>
//                 Existing Mappings
//               </Typography>

//               <FormControl fullWidth>
//                 <InputLabel>Select Mapping</InputLabel>
//                 <Select
//                   value={selectedMappingId}
//                   onChange={(e) => handleSelectMapping(e.target.value)}
//                   label="Select Mapping"
//                 >
//                   <MenuItem value="">(Create New Mapping)</MenuItem>
//                   {existingMappings.map((mapping) => (
//                     <MenuItem
//                       key={mapping.mappingId}
//                       value={mapping.mappingId}
//                     >
//                       {mapping.mappingName}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>
//             </CardContent>
//           </Card>
//         </Grid>

//         {/* Right panel: Mapping form */}
//         <Grid item xs={12} md={8}>
//           <Card elevation={3}>
//             <CardContent>
//               <Typography variant="h6" sx={{ mb: 3 }}>
//                 {selectedMappingId ? "Update Mapping" : "Create Mapping"}
//               </Typography>

//               <Box
//                 component="form"
//                 onSubmit={handleCreateOrUpdate}
//                 sx={{ display: "flex", flexDirection: "column", gap: 2 }}
//               >
//                 <TextField
//                   label="Mapping Name"
//                   fullWidth
//                   required
//                   value={mappingName}
//                   onChange={(e) => setMappingName(e.target.value)}
//                 />

//                 <TextField
//                   label="Description"
//                   fullWidth
//                   multiline
//                   rows={3}
//                   value={description}
//                   onChange={(e) => setDescription(e.target.value)}
//                 />

//                 {/* Add JSON Field */}
//                 <Box sx={{ display: "flex", gap: 1 }}>
//                   <TextField
//                     label="Add JSON Field"
//                     fullWidth
//                     value={currentField}
//                     onChange={(e) => setCurrentField(e.target.value)}
//                   />
//                   <IconButton
//                     color="primary"
//                     onClick={addField}
//                     sx={{ bgcolor: "#10EDF5", "&:hover": { bgcolor: "#0cdbe2" } }}
//                   >
//                     <AddIcon />
//                   </IconButton>
//                 </Box>

//                 {/* JSON Fields Display */}
//                 <Grid container spacing={2}>
//                   {jsonFields.length === 0 ? (
//                     <Grid item xs={12}>
//                       <Typography variant="body2" color="textSecondary">
//                         No fields added yet.
//                       </Typography>
//                     </Grid>
//                   ) : (
//                     jsonFields.map((field, index) => (
//                       <Grid item xs={12} sm={6} key={index}>
//                         <Card
//                           variant="outlined"
//                           sx={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             p: 1.5,
//                             "&:hover": { bgcolor: "#f0f8ff" }
//                           }}
//                         >
//                           <Typography>{field}</Typography>
//                           <IconButton
//                             color="error"
//                             size="small"
//                             onClick={() => removeField(index)}
//                           >
//                             <DeleteIcon />
//                           </IconButton>
//                         </Card>
//                       </Grid>
//                     ))
//                   )}
//                 </Grid>

//                 <Button
//                   type="submit"
//                   variant="contained"
//                   sx={{
//                     mt: 2,
//                     py: 1.5,
//                     backgroundColor: "#10EDF5",
//                     color: "#000",
//                     fontWeight: 600,
//                     "&:hover": { backgroundColor: "#0cdbe2" }
//                   }}
//                 >
//                   {selectedMappingId ? "Update Mapping" : "Create Mapping"}
//                 </Button>

//                 {message && (
//                   <Typography
//                     sx={{
//                       mt: 1,
//                       fontWeight: "bold",
//                       color: message.includes("success") ? "green" : "red"
//                     }}
//                   >
//                     {message}
//                   </Typography>
//                 )}
//               </Box>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>
//     </Box>
//   );
// };

// export default MappingPage;

//  -- recent working

// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Button,
//   IconButton,
//   Grid,
//   Card,
//   CardContent,
//   CardActions,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper
// } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import DeleteIcon from "@mui/icons-material/Delete";
// import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
// import axios from "axios";

// const MappingPage = () => {
//   const [mappingName, setMappingName] = useState("");
//   const [description, setDescription] = useState("");
//   const [jsonFields, setJsonFields] = useState([]);
//   const [currentField, setCurrentField] = useState("");
//   const [message, setMessage] = useState("");

//   const [existingMappings, setExistingMappings] = useState([]);
//   const [selectedMappingId, setSelectedMappingId] = useState("");
//   const [openModal, setOpenModal] = useState(false);

//   useEffect(() => {
//     fetchExistingMappings();
//   }, []);

//   const fetchExistingMappings = async () => {
//     try {
//       const userId = JSON.parse(localStorage.getItem("user"))?.user_id;
//       if (!userId) return;
//       const response = await axios.get(
//         `http://localhost:5229/api/mapping?userId=${userId}`
//       );
//       setExistingMappings(response.data);
//     } catch (error) {
//       console.error("Failed to load mappings", error);
//     }
//   };

//   const handleEditMapping = (mappingId) => {
//     const selected = existingMappings.find((m) => m.mappingId === mappingId);
//     if (selected) {
//       setSelectedMappingId(selected.mappingId);
//       setMappingName(selected.mappingName);
//       setDescription(selected.description);
//       try {
//         const fieldsArray = JSON.parse(selected.configJson);
//         setJsonFields(Array.isArray(fieldsArray) ? fieldsArray : []);
//       } catch {
//         setJsonFields([]);
//       }
//       setOpenModal(true);
//     }
//   };

//   const handleNewMapping = () => {
//     resetForm();
//     setOpenModal(true);
//   };

//   const resetForm = () => {
//     setSelectedMappingId("");
//     setMappingName("");
//     setDescription("");
//     setJsonFields([]);
//     setCurrentField("");
//     setMessage("");
//   };

//   const addField = () => {
//     if (!currentField.trim()) return;
//     setJsonFields([...jsonFields, currentField.trim()]);
//     setCurrentField("");
//   };

//   const removeField = (index) => {
//     setJsonFields(jsonFields.filter((_, i) => i !== index));
//   };

//   const handleCreateOrUpdate = async () => {
//     if (!mappingName) {
//       setMessage("Mapping name is required!");
//       return;
//     }

//     try {
//       const requestData = {
//         mappingName,
//         description,
//         userId: JSON.parse(localStorage.getItem("user")).user_id,
//         configJson: JSON.stringify(jsonFields)
//       };

//       if (selectedMappingId) {
//         await axios.put(
//           `http://localhost:5229/api/mapping/${selectedMappingId}?userId=${requestData.userId}`,
//           requestData,
//           { headers: { "Content-Type": "application/json" } }
//         );
//         setMessage("Mapping updated successfully!");
//       } else {
//         await axios.post(
//           "http://localhost:5229/api/mapping",
//           requestData,
//           { headers: { "Content-Type": "application/json" } }
//         );
//         setMessage("Mapping created successfully!");
//       }

//       setOpenModal(false);
//       resetForm();
//       fetchExistingMappings();
//     } catch (error) {
//       console.error(error);
//       setMessage(error.response?.data?.message || "Failed to save mapping.");
//     }
//   };

//   return (
//     <Box sx={{ p: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
//       <Box
//         sx={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           mb: 4
//         }}
//       >
//         <Typography variant="h4">Field Mappings</Typography>
//         <Button
//           variant="contained"
//           color="primary"
//           startIcon={<AddIcon />}
//           onClick={handleNewMapping}
//           sx={{ backgroundColor: "hsl(226 70% 50%)", color: "#fffefeff" }}
//         >
//          New Mapping
//         </Button>
//       </Box>

//       {/* Table for Existing Mappings */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead sx={{ backgroundColor: "#ffffffff" }}>
//             <TableRow>
//               <TableCell><strong>Mapping Name</strong></TableCell>
//               <TableCell><strong>Description</strong></TableCell>
//               <TableCell><strong>Fields Count</strong></TableCell>
//               <TableCell><strong>Actions</strong></TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {existingMappings.map((mapping) => (
//               <TableRow key={mapping.mappingId}>
//                 <TableCell>{mapping.mappingName}</TableCell>
//                 <TableCell>{mapping.description}</TableCell>
//                 <TableCell>{JSON.parse(mapping.configJson).length}</TableCell>
//                 <TableCell>
//                   <IconButton
//                     onClick={() => handleEditMapping(mapping.mappingId)}
                   
//                   >
//                     <img
//                       src="./src/assets/edit.png"  // replace with your image path
//                       alt="Edit"
//                       style={{ width: 28, height: 24 }} // adjust size as needed
//                     />
//                   </IconButton>

//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>

      // <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
      //   <DialogTitle>Create New Mapping</DialogTitle>
      //   <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
      //     <TextField
      //       label="Mapping Name"
      //       fullWidth
      //       required
      //       value={mappingName}
      //       onChange={(e) => setMappingName(e.target.value)}
      //     />
      //     <TextField
      //       label="Description"
      //       fullWidth
      //       multiline
      //       rows={3}
      //       value={description}
      //       onChange={(e) => setDescription(e.target.value)}
      //     />

      //     {/* Add Field Section */}
      //     <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      //       <TextField
      //         label="Field Name"
      //         fullWidth
      //         value={currentField}
      //         onChange={(e) => setCurrentField(e.target.value)}
      //       />
      //       <Button
      //         variant="contained"
      //         onClick={addField}
      //         startIcon={<AddIcon />}
      //         sx={{
      //           backgroundColor: "hsl(226 70% 50%)",
      //           color: "#fff",
      //           whiteSpace: "nowrap",
      //           minWidth: "120px",
      //           height: "40px",
      //           "&:hover": {
      //             backgroundColor: "hsl(226 70% 50%)",
      //           },
      //         }}
      //       >
      //        Add Fields
      //       </Button>
      //     </Box>

      //     {/* Display Added Fields with Scroll */}
      //     {jsonFields.length === 0 ? (
      //       <Typography variant="body2" color="textSecondary">
      //         No fields added yet.
      //       </Typography>
      //     ) : (
      //       <Box
      //         sx={{
      //           display: "flex",
      //           flexDirection: "column",
      //           gap: 1,
      //           mt: 1,
      //           maxHeight: 200,      // max height before scrolling
      //           overflowY: "auto",   // vertical scroll
      //           pr: 1,               // padding for scrollbar
      //         }}
      //       >
      //         {jsonFields.map((field, index) => (
      //           <Box
      //             key={index}
      //             sx={{
      //               display: "flex",
      //               justifyContent: "space-between",
      //               alignItems: "center",
      //               p: 1.5,
      //               border: "1px solid #ccc",
      //               borderRadius: 1,
      //               bgcolor: "#fff",
      //               "&:hover": { bgcolor: "#f0f8ff" },
      //             }}
      //           >
      //             <Typography>{field}</Typography>
      //             <IconButton color="error" size="small" onClick={() => removeField(index)}>
      //               <DeleteIcon />
      //             </IconButton>
      //           </Box>
      //         ))}
      //       </Box>
      //     )}

      //     {message && (
      //       <Typography
      //         sx={{
      //           mt: 1,
      //           fontWeight: "bold",
      //           color: message.includes("success") ? "green" : "red",
      //         }}
      //       >
      //         {message}
      //       </Typography>
      //     )}
      //   </DialogContent>

      //   <DialogActions sx={{ mb: 2 }}> {/* extra bottom margin */}
      //     <Button onClick={() => setOpenModal(false)} sx={{ color: "hsl(226 70% 50%)" }}>
      //       Cancel
      //     </Button>
      //     <Button
      //       variant="contained"
      //       onClick={handleCreateOrUpdate}
      //       sx={{ backgroundColor: "hsl(226 70% 50%)", color: "#fff" }}
      //     >
      //       Create Mapping
      //     </Button>
      //   </DialogActions>
      // </Dialog>


//     </Box>
//   );
// };

// export default MappingPage;



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
  Paper,
  MenuItem
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

  useEffect(() => {
    fetchExistingMappings();
  }, []);

  const fetchExistingMappings = async () => {
    const userId = JSON.parse(localStorage.getItem("user"))?.user_id;
    if (!userId) return;

    const res = await axios.get(
      `/api/mapping?userId=${userId}`
    );
    setExistingMappings(res.data);
  };

  /* ---------------- CREATE ---------------- */
  const handleNewMapping = () => {
    resetForm();
    setIsEditMode(false);
    setOpenModal(true);
  };

  /* ---------------- EDIT ---------------- */
  const handleEditMapping = (mappingId) => {
    const selected = existingMappings.find(m => m.mappingId === mappingId);
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
    const userId = JSON.parse(localStorage.getItem("user")).user_id;

    const payload = {
      mappingName,
      description,
      userId,
      configJson: JSON.stringify(jsonFields)
    };

    if (selectedMappingId) {
      await axios.put(
        `/api/mapping/${selectedMappingId}?userId=${userId}`,
        payload
      );
    } else {
      await axios.post("/api/mapping", payload);
    }

    resetForm();
    setOpenModal(false);
    setIsEditMode(false);
    fetchExistingMappings();
  };

  /* ========================================================= */

  return (
    <Box sx={{ p: 4, backgroundColor: "#f5f6f8", minHeight: "100vh" }}>

      {/* ================= FULL PAGE EDIT ================= */}
      {isEditMode ? (
        <>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 5 }}>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <IconButton onClick={() => setIsEditMode(false)}>
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight={600}>
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
                sx={{
                  backgroundColor: "hsl(226 70% 50%)",
                  height: 40,          // 👈 reduced height
                  px: 3
                }}
              >
                Save Mapping
              </Button>
            </Box>
          </Box>


          {/* Mapping Details */}
          <Paper sx={{ p: 4, mb: 4 }}>
            <Grid container spacing={30}>
              <Grid item xs={7}>
                <TextField
                  label="Mapping Name"
                  fullWidth
                  value={mappingName}
                  onChange={(e) => setMappingName(e.target.value)}
                  sx={{width: '200%'}}
                />
              </Grid>

              <Grid item xs={7}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  sx={{width: '270%'}}
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
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mb: 2
                }}
              >
                <TextField
                  fullWidth
                  value={field}
                  placeholder="Enter field name"
                  onChange={(e) => updateFieldValue(index, e.target.value)}
                />

                <IconButton
                  color="error"
                  onClick={() => removeField(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              sx={{ mt: 2 , width: '100%', backgroundColor: "hsl(226 70% 50%)", color: "#fff",}}
              onClick={addEmptyField}
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
              <Typography variant="h4">Field Mappings</Typography>
              <Typography color="text.secondary" sx={{ mt:2,}}>
                  Manage your document field mappings for data extraction
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewMapping}
              sx={{ backgroundColor: "hsl(226 70% 50%)" , height: 40}}
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
                {existingMappings.map(mapping => (
                  <TableRow key={mapping.mappingId}>
                    <TableCell>{mapping.mappingName}</TableCell>
                    <TableCell>{mapping.description}</TableCell>
                    <TableCell>
                      {JSON.parse(mapping.configJson).length}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleEditMapping(mapping.mappingId)}
                      >
                        <img
                          src="/src/assets/edit.png"
                          alt="edit"
                          width={22}
                        />
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
                whiteSpace: "nowrap",
                minWidth: "120px",
                height: "40px",
                "&:hover": {
                  backgroundColor: "hsl(226 70% 50%)",
                },
              }}
            >
             Add Fields
            </Button>
          </Box>

          {/* Display Added Fields with Scroll */}
          {jsonFields.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No fields added yet.
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                mt: 1,
                maxHeight: 200,      // max height before scrolling
                overflowY: "auto",   // vertical scroll
                pr: 1,               // padding for scrollbar
              }}
            >
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
                  <IconButton color="error" size="small" onClick={() => removeField(index)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {message && (
            <Typography
              sx={{
                mt: 1,
                fontWeight: "bold",
                color: message.includes("success") ? "green" : "red",
              }}
            >
              {message}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ mb: 2, pr: 3 }}> 
          <Button onClick={() => setOpenModal(false)} sx={{ color: "hsl(226 70% 50%)" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateOrUpdate}
            sx={{ backgroundColor: "hsl(226 70% 50%)", color: "#fff" }}
          >
            Create Mapping
          </Button>
        </DialogActions>
      </Dialog>
      )}
    </Box>
  );
};

export default MappingPage;
