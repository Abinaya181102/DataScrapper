import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SnackbarProvider } from "notistack";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MappingPage from "./pages/Mapping";
import Layout from "./pages/Layout";
import UploadFile from "./pages/UploadFile";
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Global Notifications (MUI) */}
      <SnackbarProvider
        maxSnack={3}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected / App Routes */}
            <Route element={<Layout />}>
              <Route path="/mapping" element={<MappingPage />} />
              <Route path="/upload" element={<UploadFile />} />
              <Route path="/dashboard" element={<Dashboard/>} />
              <Route path="/logs" element={<Logs/>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;
