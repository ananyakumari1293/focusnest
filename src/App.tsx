import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/SignUp';
import Onboarding from './pages/Onboarding';
import Workspace from './pages/Workspace';
import { AuthProvider, ProtectedRoute } from './pages/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}
