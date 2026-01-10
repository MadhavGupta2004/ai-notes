import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./auth/login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./layout/ProtectedRoute";

function App() {
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={isLoggedIn ? "/dashboard" : "/auth"} />}
        />

        <Route path="/auth" element={<AuthPage />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
