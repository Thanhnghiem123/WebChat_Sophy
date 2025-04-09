// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signin from "./components/auth/Signin";
import Register from "./components/auth/Register";
import QRScanner from "./components/auth/QRScanner";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./components/routes/PrivateRoute";
import ForgotPassword from "./components/auth/ForgotPassword";
import VerifyOTP from "./components/auth/VerifyOTP";
import ResetPassword from "./components/auth/ResetPassword";
import { LanguageProvider } from "../src/features/auth/context/LanguageContext"; // Import LanguageProvider

const App: React.FC = () => {
  return (
    <LanguageProvider> {/* Bọc toàn bộ ứng dụng trong LanguageProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<Signin />} />
          <Route path="/qr-signin" element={<QRScanner />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/main"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;