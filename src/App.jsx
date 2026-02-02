import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/Notfound";
import ProtectedRoute from "./layout/ProtectedRoute";

function App() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  return (
    <BrowserRouter>
      <Routes>
        {/* AUTH */}
        <Route
          path="/auth"
          element={isLoggedIn ? <Navigate to="/dashboard" /> : <Login />}
        />

        {/* PROTECTED */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* DEFAULT */}
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/auth"} />}
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
