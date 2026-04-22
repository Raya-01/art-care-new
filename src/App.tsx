import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Therapy from './pages/Therapy';
import Journal from './pages/Journal';
import Gallery from './pages/Gallery';
import History from './pages/History';
import Profile from './pages/Profile';
import Login from './auth/Login';
import Signup from './auth/Signup';
import NotFound from './components/NotFound';
import { useAuth } from './contexts/AuthContext';
import Tutorial from './components/Tutorial';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();
 
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Зареждане на ARTCARE...</p>
        </div>
      </div>
    );
  }
 
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

// 👈 Променен AdminRoute
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading, isAdmin } = useAuth();
 
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Зареждане на ARTCARE...</p>
        </div>
      </div>
    );
  }
 
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
 
  // 👈 Променено: ако не е админ, пренасочва към началната страница
  if (!isAdmin) {
    return <Navigate to="/" />;
  }
 
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      {/* Публични routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="*" element={<NotFound />} />
      </Route>
     
      {/* Защитени routes */}
      <Route path="/" element={<Layout />}>
        <Route path="therapy" element={
          <ProtectedRoute>
            <Therapy />
          </ProtectedRoute>
        } />
        <Route path="journal" element={
          <ProtectedRoute>
            <Journal />
          </ProtectedRoute>
        } />
        <Route path="gallery" element={
          <ProtectedRoute>
            <Gallery />
          </ProtectedRoute>
        } />
        <Route path="history" element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        } />
        <Route path="profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Route>
     
      {/* Tutorial route - публичен */}
      <Route path="/tutorial" element={<Tutorial />} />
    </Routes>
  );
};

export default App;