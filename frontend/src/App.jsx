import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./layout/Home";
import Login from "./layout/Login";
import NotFound from "./layout/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";

function Logout() {
    localStorage.removeItem("access_token");
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
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
}

export default App;