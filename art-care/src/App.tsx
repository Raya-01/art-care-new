import React, { useContext } from 'react';
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
import { useAuth } from './contexts/AuthContext'; // ✅ Променете на useAuth
import Tutorial from './components/Tutorial';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth(); // ✅ Използвайте useAuth тук
  
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

const App: React.FC = () => {
  return (
    // ✅ ПРЕМАХНЕТЕ AuthProvider от тук, вече е в main.tsx
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
      </Route>
      
      {/* Tutorial route - публичен */}
      <Route path="/tutorial" element={<Tutorial />} />
    </Routes>
  );
};

export default App;