// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "./pages/Login";
// import Signup from "./pages/Signup";
// import MappingPage from "./pages/Mapping";
// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         {/* Default page = Login */}
//         <Route path="/" element={<Login />} />

//         <Route path="/signup" element={<Signup />} />
//         <Route path="/mapping" element={<MappingPage />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;


import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import MappingPage from "./pages/Mapping";
import Layout from "./pages/Layout";
import UploadFile from "./pages/UploadFile";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* No Navbar */}
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Pages With Navbar */}
        <Route element={<Layout />}>
          <Route path="/mapping" element={<MappingPage />} />
          {/* Add more later: dashboard, upload, profile etc */}
          <Route path="/upload" element={<UploadFile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
