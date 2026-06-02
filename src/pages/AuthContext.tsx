import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Sync user profile to localStorage for backward compatibility and workspace access
        localStorage.setItem('focusnest_uid', currentUser.uid);
        localStorage.setItem('focusnest_email', currentUser.email || '');
        localStorage.setItem('focusnest_name', currentUser.displayName || '');
        localStorage.setItem('focusnest_avatar', currentUser.photoURL || '');
      } else {
        // Fallback: Check if there's a mock user in localStorage (e.g. from Google Auth fallback)
        const mockUid = localStorage.getItem('focusnest_uid');
        if (mockUid) {
          setUser({
            uid: mockUid,
            email: localStorage.getItem('focusnest_email') || '',
            displayName: localStorage.getItem('focusnest_name') || '',
            photoURL: localStorage.getItem('focusnest_avatar') || '',
          } as any);
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/signup');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#FFFDF8',
        fontFamily: "'Inter', sans-serif",
        color: '#B794F6'
      }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#B794F6' }}>🌸 Nesting focus...</span>
      </div>
    );
  }

  return user ? <>{children}</> : null;
};
