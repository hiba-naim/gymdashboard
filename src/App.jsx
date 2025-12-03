import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import DashboardPage from "./pages/DashboardPage.jsx";
import UserProfilePage from "./pages/UserProfilePage.jsx";
import MemberPage from "./pages/MemberPage.jsx";
import TrainersPage from "./pages/TrainersPage.jsx";
import DrinksPage from "./pages/DrinksPage.jsx";
import ClassesPage from "./pages/ClassesPage.jsx";
import MembersVisualizationPage from "./pages/MembersVisualizationPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import "./styles/app-layout.css";

function ProtectedRoute({ children, requiredRoles = [] }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If requiredRoles is specified and not empty, check if user has the required role
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Your role ({user?.role}) does not have access to this page.</p>
        <a href="/">Back to Dashboard</a>
      </div>
    );
  }

  return children;
}

export default function App() {
  const { isAuthenticated, loading, login, logout, user } = useAuth();

  useEffect(() => {
    console.log('App state changed - isAuthenticated:', isAuthenticated, 'user:', user);
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    try {
      if (user && user.username) {
        // Log the logout activity on the server
        await axios.post("http://localhost:5000/api/logout", {
          username: user.username
        });
      }
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      logout();
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {isAuthenticated && (
        <div className="app-header">
          <div className="header-left">
            <h2>Gym Dashboard</h2>
          </div>
          <div className="header-right">
            <span className="user-info">
              Welcome, {user?.username}! <span className="role-badge">{user?.role?.toUpperCase()}</span>
            </span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={login} />} />
        
        {/* Root redirect based on role */}
        <Route
          path="/"
          element={
            user?.role === "admin" ? (
              <ProtectedRoute requiredRoles={['admin']}>
                <DashboardPage />
              </ProtectedRoute>
            ) : (
              <Navigate to="/profile" replace />
            )
          }
        />
        
        {/* User Profile Page */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute requiredRoles={['user']}>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin can also view specific user profiles */}
        <Route
          path="/member/:id"
          element={
            <ProtectedRoute requiredRoles={['admin', 'user']}>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Only Routes */}
        <Route
          path="/members"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <MembersVisualizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainers"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <TrainersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        
        {/* User/Member Routes */}
        <Route
          path="/drinks"
          element={
            <ProtectedRoute requiredRoles={['user', 'admin']}>
              <DrinksPage />
            </ProtectedRoute>
          }
        />
        
        {/* Old member page route for backward compatibility */}
        <Route
          path="/member-info/:id"
          element={
            <ProtectedRoute requiredRoles={['user', 'admin']}>
              <MemberPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}
