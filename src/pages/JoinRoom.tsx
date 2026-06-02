import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function JoinRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'checking' | 'not-found' | 'joining' | 'error'>('checking');
  const [errorText, setErrorText] = useState<string>('');

  useEffect(() => {
    if (loading || !roomId) return;

    const executeJoin = async () => {
      // 1. If user is not logged in, cache the pending join target and redirect to signup
      if (!user) {
        localStorage.setItem('focusnest_pending_join', roomId);
        navigate('/signup');
        return;
      }

      setStatus('joining');

      try {
        const { doc, getDoc, updateDoc, arrayUnion } = await import('firebase/firestore');
        const { db } = await import('../services/firebase');

        const roomRef = doc(db, 'studyRooms', roomId);
        const roomSnap = await getDoc(roomRef);

        if (!roomSnap.exists()) {
          setStatus('not-found');
          return;
        }

        const roomData = roomSnap.data();
        const existingMembers = roomData.members || [];
        const isAlreadyMember = existingMembers.some((m: any) => m.uid === user.uid);

        if (!isAlreadyMember) {
          const defaultName = user.displayName || localStorage.getItem('focusnest_name') || 'Study Buddy';
          const defaultAvatar = user.photoURL || localStorage.getItem('focusnest_avatar') || '';
          
          await updateDoc(roomRef, {
            members: arrayUnion({
              uid: user.uid,
              displayName: defaultName,
              photoURL: defaultAvatar,
              email: user.email || ''
            })
          });
        }

        // Save active room ID locally
        localStorage.setItem('focusnest_active_room_id', roomId);
        
        // Remove pending room after successful join
        localStorage.removeItem('focusnest_pending_join');
        
        // Success: Navigate to workspace
        navigate('/workspace');
      } catch (err: any) {
        console.error('Failed to join room', err);
        setStatus('error');
        setErrorText(err?.message || 'An unexpected error occurred.');
      }
    };

    executeJoin();
  }, [roomId, user, loading, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'checking' && (
          <div style={styles.content}>
            <span style={styles.icon}>🌸</span>
            <h2 style={styles.title}>Locating Room</h2>
            <p style={styles.subtext}>Finding your cozy study room...</p>
          </div>
        )}

        {status === 'joining' && (
          <div style={styles.content}>
            <span style={styles.icon}>☕</span>
            <h2 style={styles.title}>Setting Up Desk</h2>
            <p style={styles.subtext}>Preparing your focus desk in the study room...</p>
          </div>
        )}

        {status === 'not-found' && (
          <div style={styles.content}>
            <span style={styles.icon}>🌿</span>
            <h2 style={styles.title}>Room Not Found</h2>
            <p style={styles.subtext}>This study room doesn't seem to exist, or the link may have expired.</p>
            <button onClick={() => navigate('/')} style={styles.btn} className="btn-scale-primary">
              Return Home
            </button>
          </div>
        )}

        {status === 'error' && (
          <div style={styles.content}>
            <span style={styles.icon}>⚡</span>
            <h2 style={styles.title}>Connection Issue</h2>
            <p style={styles.subtext}>{errorText || 'Could not connect to the room.'}</p>
            <button onClick={() => navigate('/signup')} style={styles.btn} className="btn-scale-primary">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    background: 'linear-gradient(135deg, #FAF9F6 0%, #FDF2F8 50%, #F5F3FF 100%)',
    color: '#2D2A3A',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: 'rgba(250, 249, 246, 0.9)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '40px 32px',
    boxShadow: '0 20px 40px -15px rgba(45, 42, 58, 0.06)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
    boxSizing: 'border-box'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  icon: {
    fontSize: '3rem',
    display: 'inline-block',
    animation: 'bounce 2s infinite'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#2D2A3A',
    letterSpacing: '-0.5px',
    margin: 0
  },
  subtext: {
    fontSize: '0.9rem',
    color: '#6B7280',
    lineHeight: 1.45,
    margin: 0
  },
  btn: {
    backgroundColor: '#A78BFA',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
    marginTop: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px'
  }
};
