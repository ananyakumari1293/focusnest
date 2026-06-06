import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { handleSpotifyCallback } from '../services/spotify';

export default function SpotifyCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const authError = searchParams.get('error');

    if (authError) {
      setError(`Authentication failed: ${authError}`);
      return;
    }

    if (!code) {
      setError('Authorization code is missing from response.');
      return;
    }

    const processCallback = async () => {
      try {
        await handleSpotifyCallback(code);
        navigate('/workspace');
      } catch (err: any) {
        setError(err.message || 'An error occurred during Spotify connection.');
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {error ? (
          <>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>⚠️</span>
            <h2 style={styles.title}>Connection Failed</h2>
            <p style={styles.text}>{error}</p>
            <button onClick={() => navigate('/workspace')} style={styles.btn}>
              Return to Workspace
            </button>
          </>
        ) : (
          <>
            <span className="spinner" style={{ fontSize: '3rem', display: 'block', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>🎵</span>
            <h2 style={styles.title}>Connecting Spotify...</h2>
            <p style={styles.text}>Synchronizing your musical vibes with FocusNest.</p>
          </>
        )}
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#FFFDF8',
    fontFamily: "'Inter', sans-serif",
    padding: '24px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#FFFDF8',
    border: '3px solid #2D2A3A',
    borderRadius: '16px',
    padding: '32px 24px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '8px 8px 0px rgba(45, 42, 58, 0.05)',
    boxSizing: 'border-box'
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: '0 0 8px 0'
  },
  text: {
    fontSize: '0.85rem',
    color: '#6B7280',
    lineHeight: 1.45,
    margin: '0 0 20px 0'
  },
  btn: {
    backgroundColor: '#B794F6',
    color: '#FAF9F6',
    border: '2px solid #2D2A3A',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.88rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    outline: 'none',
    boxShadow: '2px 2px 0px #2D2A3A',
    transition: 'all 200ms ease'
  }
};
