import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./layout/Home";
import Login from "./layout/Login";
import NotFound from "./layout/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";
import {ACCESS_TOKEN, REFRESH_TOKEN} from "./constants.js";
import WarehousesPage from "./layout/WarehousesPage.jsx";
import CarriersPage from "./layout/Carriers.jsx";

function Logout() {
  localStorage.removeItem(ACCESS_TOKEN);
  localStorage.removeItem(REFRESH_TOKEN);
  return <Navigate to="/login" replace />;
}

function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />

            {/* Protected + Layout */}
            <Route
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="/" element={<Home />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/carriers" element={<CarriersPage />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;