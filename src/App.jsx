import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


import { AppProvider } from './context/AppContext';
import { useAppContext } from './context/useAppContext';
import TradingPlatform from './components/TradingPlatform';
import AdminPanel from './components/AdminPanel';
import Auth from './components/Auth';
import Unauthorized from './components/Unauthorized';
import ProfileDashboard from './components/ProfileDashboard';
import NewsScreen from './components/NewsScreen';
import ChallengeScreen from './components/ChallengeScreen';
import HistoryScreen from './components/HistoryScreen';
import './index.css';

const ProtectedRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user } = useAppContext();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/unauthorized" />;
  return children;
};

const MainApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TradingPlatform />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfileDashboard />
          </ProtectedRoute>
        } />
        <Route path="/challenge" element={
          <ProtectedRoute>
            <ChallengeScreen />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryScreen />
          </ProtectedRoute>
        } />
        <Route path="/news" element={
          <ProtectedRoute>
            <NewsScreen />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/home" element={<Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Router>
  );
};

function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}

export default App;
