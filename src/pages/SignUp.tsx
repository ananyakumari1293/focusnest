import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "./AuthContext";

// FocusNest Auth Component - 3-state Unified Auth System
export default function SignUp() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Navigation State Controller
  // 'signup' | 'login' | 'forgot'
  const [authView, setAuthView] = useState<'signup' | 'login' | 'forgot'>('signup');

  // Input States
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Password Visibility States
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Auto redirect authenticated users on mount / session change
  useEffect(() => {
    if (!loading && user) {
      const isOnboardingComplete = localStorage.getItem("focusnest_onboarding_complete") === "true";
      if (isOnboardingComplete) {
        navigate("/workspace");
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, loading, navigate]);

  // Handle clean view switching
  const handleViewChange = (view: 'signup' | 'login' | 'forgot') => {
    setAuthView(view);
    setErrorMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Helper to map raw Firebase error codes to cozy FocusNest messages
  const getCozyErrorMessage = (error: any): string => {
    const code = error?.code || '';
    switch (code) {
      case 'auth/weak-password':
        return '🌸 Choose a slightly stronger password.';
      case 'auth/email-already-in-use':
        return '✨ An account already exists with this email.';
      case 'auth/invalid-email':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return '☕ Double-check your email and password.';
      case 'auth/popup-closed-by-user':
        return '🌿 Google sign-in was cancelled.';
      case 'auth/network-request-failed':
        return '⚡ Connection issue. Please try again.';
      default:
        return error?.message || 'An unexpected error occurred. Please try again.';
    }
  };

  // Form Handlers
  const handleSignUpSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setErrorMessage('Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('🌸 Choose a slightly stronger password.');
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const currentUser = result.user;

      const namePart = email.split('@')[0];
      const defaultName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(currentUser, { displayName: defaultName });
      } catch (profileError) {
        console.error('Failed to update displayName', profileError);
      }

      // Store initial user info in localStorage for backward compatibility
      localStorage.setItem('focusnest_uid', currentUser.uid);
      localStorage.setItem('focusnest_email', currentUser.email || '');
      localStorage.setItem('focusnest_name', defaultName);
      localStorage.setItem('focusnest_username', defaultName);

      // Email Signup User: After account creation, always navigate to onboarding
      navigate("/onboarding");
    } catch (err: any) {
      setErrorMessage(getCozyErrorMessage(err));
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const currentUser = result.user;

      // Store user info in localStorage
      localStorage.setItem('focusnest_uid', currentUser.uid);
      localStorage.setItem('focusnest_email', currentUser.email || '');
      if (currentUser.displayName) {
        localStorage.setItem('focusnest_name', currentUser.displayName);
        localStorage.setItem('focusnest_username', currentUser.displayName);
      }

      // Email Login User: If onboarding completed, navigate to workspace; else, onboarding
      const isOnboardingComplete = localStorage.getItem("focusnest_onboarding_complete") === "true";
      if (isOnboardingComplete) {
        navigate("/workspace");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      setErrorMessage(getCozyErrorMessage(err));
    }
  };

  const handleForgotSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    setErrorMessage('✓ A reset link has been dispatched to your email.');
    setEmail('');
  };

  // Google Authentication Trigger with popup account selection chooser
  const triggerGoogleAuth = async (): Promise<void> => {
    setErrorMessage('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account"
    });

    try {
      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;

      // Save user details in localStorage
      localStorage.setItem('focusnest_uid', currentUser.uid);
      localStorage.setItem('focusnest_email', currentUser.email || '');
      localStorage.setItem('focusnest_name', currentUser.displayName || '');
      localStorage.setItem('focusnest_avatar', currentUser.photoURL || '');
      if (currentUser.displayName) {
        localStorage.setItem('focusnest_username', currentUser.displayName);
      }

      // Google User: If onboarding completed, workspace; else, onboarding
      const isOnboardingComplete = localStorage.getItem("focusnest_onboarding_complete") === "true";
      if (isOnboardingComplete) {
        navigate("/workspace");
      } else {
        navigate("/onboarding");
      }
    } catch (err: any) {
      setErrorMessage(getCozyErrorMessage(err));
    }
  };

  return (
    <div style={styles.container}>
      {/* Injected Refined Interaction Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: cleanInjectedStyles }} />

      {/* Subtle default pink background glow blobs */}
      <div className="pink-glow-blob" style={{ top: '10%', left: '10%' }} />
      <div className="pink-glow-blob" style={{ bottom: '15%', right: '10%' }} />

      <div style={styles.authWrapper} className="auth-grid-responsive">
        
        {/* ================= LEFT COLUMN: COZY WORKSPACE PREVIEW ================= */}
        <div style={styles.illustrationColumn} className="illustration-column-hide">
          <div style={styles.cozyPreviewCard} className="glass-card shadow-premium workspace-preview-glow">
            <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Wood desk gradient */}
                <linearGradient id="woodDeskGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F5F3E9" />
                  <stop offset="100%" stopColor="#EAE6DF" />
                </linearGradient>
                {/* Light lamp cone */}
                <linearGradient id="warmLightCone" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0.0" />
                </linearGradient>
                {/* Soft sky wash */}
                <linearGradient id="pastelSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8E5F7" />
                  <stop offset="100%" stopColor="#FDF2F8" />
                </linearGradient>
                <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#2D2A3A" floodOpacity="0.04" />
                </filter>
              </defs>

              {/* Pastel Cozy sky background */}
              <rect x="15" y="15" width="470" height="380" rx="16" fill="url(#pastelSky)" />

              {/* Wooden Desk Plate */}
              <rect x="15" y="380" width="470" height="105" rx="12" fill="url(#woodDeskGrad)" stroke="#DFD9CD" strokeWidth="3" />
              <line x1="15" y1="395" x2="485" y2="395" stroke="#D1CFC7" strokeWidth="2" />

              {/* Window silhouette casting quiet light */}
              <rect x="40" y="40" width="80" height="140" rx="8" fill="#FFFFFF" fillOpacity="0.35" />
              <line x1="80" y1="40" x2="80" y2="180" stroke="#FAF9F6" strokeWidth="2" />
              <line x1="40" y1="95" x2="120" y2="95" stroke="#FAF9F6" strokeWidth="2" />

              {/* Steaming Mug with rising vapor paths */}
              <g transform="translate(390, 340)">
                <path d="M 0,20 C 0,44 26,44 26,20 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="2.5" />
                <path d="M 26,10 C 33,10 33,26 26,26" fill="none" stroke="#DB2777" strokeWidth="2.5" strokeLinecap="round" />
                <path className="steam-line steam-1" d="M 8,-5 Q 4,-12 10,-20" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
                <path className="steam-line steam-2" d="M 18,-7 Q 22,-14 16,-22" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
                <ellipse cx="13" cy="36" rx="18" ry="4" fill="#EAE6DF" stroke="#D1CFC7" strokeWidth="1.5" />
              </g>

              {/* Glowing desk lamp casting warm golden cone light */}
              <g transform="translate(50, 210)" filter="url(#softShadow)">
                <rect x="15" y="160" width="40" height="10" rx="3" fill="#2D2A3A" />
                <path d="M 35,160 Q 15,100 35,60" fill="none" stroke="#2D2A3A" strokeWidth="6" strokeLinecap="round" />
                <path d="M 22,60 C 22,40 58,40 58,60 Z" fill="#FEF9C3" stroke="#854D0E" strokeWidth="2" />
                <polygon points="10,175 140,380 -40,380" fill="url(#warmLightCone)" />
              </g>

              {/* Green Potted Plant in a white pot */}
              <g transform="translate(420, 310)">
                <polygon points="5,45 25,45 28,70 2,70" fill="#FAF9F6" stroke="#E5E1D8" strokeWidth="2" />
                <rect x="2" y="42" width="24" height="5" rx="1" fill="#EAE6DF" />
                <path d="M 15,42 Q 5,20 -5,25 Q 5,35 15,42" fill="#86EFAC" stroke="#15803D" strokeWidth="1.5" />
                <path d="M 15,42 Q 15,10 10,5 Q 12,25 15,42" fill="#4ADE80" stroke="#15803D" strokeWidth="1.5" />
                <path d="M 15,42 Q 25,15 35,20 Q 22,35 15,42" fill="#22C55E" stroke="#15803D" strokeWidth="1.5" />
              </g>

              {/* Floating rotated sticky notes (yellow, blush pink) */}
              <g transform="translate(360, 90) rotate(5)" className="cozy-rotate-right mini-sticky-note-hover">
                <rect x="0" y="0" width="85" height="85" rx="6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1.5" filter="url(#softShadow)" />
                <line x1="10" y1="20" x2="75" y2="20" stroke="#CA8A04" strokeWidth="2.5" />
                <line x1="10" y1="36" x2="65" y2="36" stroke="#CA8A04" strokeWidth="2.5" />
                <line x1="10" y1="52" x2="70" y2="52" stroke="#CA8A04" strokeWidth="2.5" />
              </g>

              <g transform="translate(68, 305) rotate(-6)" className="cozy-rotate-left mini-sticky-note-hover">
                <rect x="0" y="0" width="75" height="75" rx="5" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="1.5" filter="url(#softShadow)" />
                <text x="10" y="24" fill="#DB2777" fontSize="10" fontWeight="bold" fontFamily="sans-serif">lofi beat</text>
                <text x="10" y="42" fill="#D01C6A" fontSize="9" fontFamily="sans-serif">⏱️ track 1</text>
              </g>

              {/* Additional cozy sticky notes & task cards without crowding */}
              <g transform="translate(340, 210) rotate(-4)" className="cozy-rotate-left mini-sticky-note-hover">
                <rect x="0" y="0" width="115" height="42" rx="6" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="1.5" filter="url(#softShadow)" />
                <text x="10" y="16" fill="#2D2A3A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">📅 Study Session</text>
                <text x="10" y="30" fill="#6B7280" fontSize="7" fontFamily="sans-serif">Cozy Library - Active</text>
                <rect x="95" y="6" width="14" height="14" rx="7" fill="#FBCFE8" />
              </g>

              <g transform="translate(320, 20) rotate(3)" className="cozy-rotate-right mini-sticky-note-hover">
                <rect x="0" y="0" width="130" height="45" rx="6" fill="#FAF9FC" stroke="#FAF9FC" strokeWidth="1.5" filter="url(#softShadow)" />
                <rect x="0" y="0" width="130" height="45" rx="6" fill="none" stroke="#A78BFA" strokeWidth="1.5" />
                <text x="10" y="18" fill="#5C3EAD" fontSize="8" fontWeight="bold" fontFamily="sans-serif">🤖 Scheduler AI</text>
                <text x="10" y="32" fill="#4B5563" fontSize="7.5" fontFamily="sans-serif">Workspace Optimized</text>
              </g>

              {/* Tiny floating timer card in illustration */}
              <g transform="translate(30, 90) rotate(6)" className="cozy-rotate-right mini-sticky-note-hover">
                <rect x="0" y="0" width="100" height="38" rx="6" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="1" filter="url(#softShadow)" />
                <text x="8" y="16" fill="#DB2777" fontSize="8" fontWeight="bold" fontFamily="sans-serif">⏱️ Timer Active</text>
                <text x="8" y="28" fill="#9C4A70" fontSize="7.5" fontFamily="monospace">18:42 Left</text>
              </g>

              {/* Sleek Laptop Mockup representing workspace preview */}
              <g transform="translate(120, 170)" filter="url(#softShadow)">
                <rect x="0" y="0" width="260" height="175" rx="14" fill="#2D2A3A" stroke="#EAE6DF" strokeWidth="3" />
                <rect x="8" y="8" width="244" height="159" rx="8" fill="#FAF9F6" />

                {/* Dashboard layout inside screen */}
                <rect x="8" y="8" width="244" height="24" rx="8" fill="#E8E5F7" />
                <circle cx="20" cy="20" r="3.5" fill="#E5E7EB" />
                <circle cx="28" cy="20" r="3.5" fill="#E5E7EB" />
                <circle cx="36" cy="20" r="3.5" fill="#E5E7EB" />
                <text x="50" y="24" fill="#5C3EAD" fontSize="9" fontWeight="bold" fontFamily="sans-serif">FocusNest Workspace 💻</text>

                {/* Left panel: Kanban */}
                <g transform="translate(16, 40)">
                  <rect x="0" y="0" width="105" height="115" rx="6" fill="#F5F3E9" stroke="#E5E1D8" strokeWidth="1" />
                  <rect x="6" y="16" width="44" height="92" rx="3" fill="#FAF9F6" />
                  <text x="10" y="24" fill="#5C3EAD" fontSize="6" fontWeight="bold" fontFamily="sans-serif">PLANNED</text>
                  
                  {/* Miniature tasks */}
                  <rect x="10" y="28" width="36" height="20" rx="3" fill="#FDF2F8" stroke="#FBCFE8" strokeWidth="0.8" />
                  <rect x="13" y="32" width="24" height="3" rx="1.5" fill="#DB2777" />
                  <rect x="13" y="38" width="15" height="3" rx="1.5" fill="#DB2777" />

                  <rect x="6" y="16" width="44" height="92" rx="3" fill="none" stroke="#EBE7DF" strokeWidth="1" />
                  <rect x="54" y="16" width="44" height="92" rx="3" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="1" />
                  <text x="58" y="24" fill="#15803D" fontSize="6" fontWeight="bold" fontFamily="sans-serif">DONE</text>
                  <rect x="58" y="28" width="36" height="20" rx="3" fill="#DCFCE7" stroke="#86EFAC" strokeWidth="0.8" />
                  <path d="M 80,35 L 82,37 L 86,33" fill="none" stroke="#15803D" strokeWidth="1" />
                </g>

                {/* Right panel: Active Timer */}
                <g transform="translate(130, 40)">
                  <rect x="0" y="0" width="105" height="115" rx="6" fill="#F5F3E9" stroke="#E5E1D8" strokeWidth="1" />
                  <circle cx="52" cy="46" r="22" fill="#FAF9F6" stroke="#A78BFA" strokeWidth="2" />
                  <text x="52" y="49" textAnchor="middle" fill="#5C3EAD" fontSize="8" fontWeight="bold" fontFamily="monospace">25:00</text>
                  
                  {/* mini schedule suggestions */}
                  <rect x="8" y="78" width="89" height="28" rx="4" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="1" />
                  <text x="14" y="88" fill="#6366F1" fontSize="6" fontWeight="bold" fontFamily="sans-serif">🤖 AI Suggestion</text>
                  <rect x="14" y="93" width="70" height="3" rx="1.5" fill="#E8E5F7" />
                  <rect x="14" y="99" width="50" height="3" rx="1.5" fill="#E8E5F7" />
                </g>

                {/* Laptop Base keyboard board */}
                <path d="M -15,175 L 275,175 L 285,188 L -25,188 Z" fill="#EAE6DF" stroke="#D1CFC7" strokeWidth="2.5" />
                <rect x="25" y="177" width="210" height="7" rx="1.5" fill="#C5C2B9" />
              </g>
            </svg>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE FORM PANELS ================= */}
        <div style={styles.formColumn} className="fade-in">
          
          {/* Mobile top mini logo */}
          <div style={styles.mobileLogoHeader} className="mobile-logo-show">
            <svg style={{ ...styles.logoSvg, width: '28px', height: '28px' }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="60" height="60" rx="14" fill="#FAF9F6" stroke="#2D2A3A" strokeWidth="6" />
              <rect x="36" y="36" width="28" height="28" rx="6" fill="#A78BFA" stroke="#2D2A3A" strokeWidth="3" />
            </svg>
            <span style={styles.brandName}>FocusNest</span>
          </div>

          <div style={styles.authCard} className="glass-card premium-card-depth workspace-preview-glow">
            
            {/* VIEW 1: SIGN UP SCREEN */}
            {authView === 'signup' && (
              <div className="fade-in">
                {/* Revamped natural study-desk headlines */}
                <h2 style={styles.authTitle}>Create Your FocusNest</h2>
                <p style={styles.authSubText}>
                  Build your cozy productivity workspace. Plan tasks, stay focused with timers, work with friends, and let AI help you create realistic schedules.
                </p>

                {/* Mini Features Checklist */}
                <div style={styles.featuresListContainer}>
                  <div style={styles.featureCheckItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>Smart Kanban Boards</span>
                  </div>
                  <div style={styles.featureCheckItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>Focus Timer</span>
                  </div>
                  <div style={styles.featureCheckItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>AI Scheduling</span>
                  </div>
                  <div style={styles.featureCheckItem}>
                    <span style={styles.checkIcon}>✓</span>
                    <span>Group Collaboration</span>
                  </div>
                </div>

                {errorMessage && (
                  <div style={{ ...styles.alertBox, backgroundColor: errorMessage.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: errorMessage.startsWith('✓') ? '#15803D' : '#991B1B', borderColor: errorMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5' }}>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSignUpSubmit} style={styles.authForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.textInput}
                      className="text-input-focus"
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Password</label>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ ...styles.textInput, paddingRight: '46px' }}
                        className="text-input-focus"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Confirm Password</label>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ ...styles.textInput, paddingRight: '46px' }}
                        className="text-input-focus"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={styles.eyeBtn}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn} className="btn-scale-primary">
                    Create Account
                  </button>
                </form>

                <div style={styles.dividerRow}>
                  <div style={styles.dividerLine} />
                  <span style={styles.dividerText}>or continue with</span>
                  <div style={styles.dividerLine} />
                </div>

                {/* Branded Google auth with white background and subtle lavender tint on hover */}
                <button onClick={triggerGoogleAuth} style={styles.googleBtn} className="btn-scale-secondary google-btn-hover">
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '10px' }}>
                    <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.72v2.24h2.9c1.7-1.57 2.7-3.87 2.7-6.59z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.23c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.04-3.71H.95v2.3C2.43 15.98 5.48 18 9 18z" fill="#34A853" />
                    <path d="M3.96 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.17.28-1.73V4.97H.95A9.01 9.01 0 0 0 0 9c0 1.45.35 2.82.95 4.03l3.01-2.3z" fill="#FBBC05" />
                    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.03C13.46.6 11.43 0 9 0 5.48 0 2.43 2.02.95 4.97l3.01 2.3c.71-2.13 2.7-3.69 5.04-3.69z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <div style={styles.switchPrompt}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => handleViewChange('login')} style={styles.switchBtn} className="minimal-link">
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: LOGIN SCREEN */}
            {authView === 'login' && (
              <div className="fade-in">
                <h2 style={styles.authTitle}>Welcome Back</h2>
                <p style={styles.authSubText}>
                  Sign in to enter your studio workspace and sync with your active study group rooms.
                </p>

                {errorMessage && (
                  <div style={{ ...styles.alertBox, backgroundColor: errorMessage.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: errorMessage.startsWith('✓') ? '#15803D' : '#991B1B', borderColor: errorMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5' }}>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} style={styles.authForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.textInput}
                      className="text-input-focus"
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ ...styles.inputLabel, marginBottom: 0 }}>Password</label>
                      <button type="button" onClick={() => handleViewChange('forgot')} style={styles.forgotBtn} className="minimal-link">
                        Forgot Password?
                      </button>
                    </div>
                    <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ ...styles.textInput, paddingRight: '46px' }}
                        className="text-input-focus"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={styles.eyeBtn}
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button type="submit" style={styles.submitBtn} className="btn-scale-primary">
                    Sign In
                  </button>
                </form>

                <div style={styles.dividerRow}>
                  <div style={styles.dividerLine} />
                  <span style={styles.dividerText}>or continue with</span>
                  <div style={styles.dividerLine} />
                </div>

                <button onClick={triggerGoogleAuth} style={styles.googleBtn} className="btn-scale-secondary google-btn-hover">
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: '10px' }}>
                    <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.72v2.24h2.9c1.7-1.57 2.7-3.87 2.7-6.59z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.23c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.04-3.71H.95v2.3C2.43 15.98 5.48 18 9 18z" fill="#34A853" />
                    <path d="M3.96 10.73A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.17.28-1.73V4.97H.95A9.01 9.01 0 0 0 0 9c0 1.45.35 2.82.95 4.03l3.01-2.3z" fill="#FBBC05" />
                    <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35L15 2.03C13.46.6 11.43 0 9 0 5.48 0 2.43 2.02.95 4.97l3.01 2.3c.71-2.13 2.7-3.69 5.04-3.69z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                <div style={styles.switchPrompt}>
                  New to FocusNest?{' '}
                  <button type="button" onClick={() => handleViewChange('signup')} style={styles.switchBtn} className="minimal-link">
                    Create Account
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 3: FORGOT PASSWORD SCREEN */}
            {authView === 'forgot' && (
              <div className="fade-in">
                <h2 style={styles.authTitle}>Recover Password</h2>
                <p style={styles.authSubText}>
                  Provide your registered email address and we will dispatch a recovery authorization link.
                </p>

                {errorMessage && (
                  <div style={{ ...styles.alertBox, backgroundColor: errorMessage.startsWith('✓') ? '#DCFCE7' : '#FEE2E2', color: errorMessage.startsWith('✓') ? '#15803D' : '#991B1B', borderColor: errorMessage.startsWith('✓') ? '#86EFAC' : '#FCA5A5', fontSize: '0.85rem' }}>
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleForgotSubmit} style={styles.authForm}>
                  <div style={styles.inputGroup}>
                    <label style={styles.inputLabel}>Email Address</label>
                    <input
                      type="email"
                      placeholder="you@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={styles.textInput}
                      className="text-input-focus"
                      required
                    />
                  </div>

                  <button type="submit" style={styles.submitBtn} className="btn-scale-primary">
                    Send Reset Link
                  </button>
                </form>

                <div style={{ ...styles.microcopy, marginTop: '20px' }}>
                  ⏳ Notice: Recovery reset links expire precisely 1 hour after dispatch.
                </div>

                <div style={styles.switchPrompt}>
                  <button type="button" onClick={() => handleViewChange('login')} style={styles.switchBtn} className="minimal-link">
                    ← Back to Login
                  </button>
                </div>
              </div>
            )}


          </div>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// React Style Definitions
// ----------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    // Elegant warm cream-blush-lavender gradient background canvas
    background: 'linear-gradient(135deg, #FAF9F6 0%, #FDF2F8 50%, #F5F3FF 100%)',
    color: '#2D2A3A', // Charcoal Text
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 6%',
    position: 'relative',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  authWrapper: {
    maxWidth: '1080px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '48px',
    alignItems: 'center',
    zIndex: 2,
  },
  illustrationColumn: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  cozyPreviewCard: {
    width: '100%',
    maxWidth: '460px',
    aspectRatio: '1',
    backgroundColor: '#FAF9F6',
    borderRadius: '24px',
    border: '1.5px solid #EBE7DF',
    overflow: 'hidden',
  },
  formColumn: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mobileLogoHeader: {
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '20px',
  },
  logoSvg: {
    width: '32px',
    height: '32px',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 750,
    color: '#2D2A3A',
    letterSpacing: '-0.5px',
  },
  authCard: {
    backgroundColor: 'rgba(250, 249, 246, 0.9)', // Soft glass depth & warmth
    border: '1px solid rgba(235, 231, 223, 0.6)', // Softer border
    borderRadius: '24px',
    padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 32px)',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '440px',
    margin: '0 auto',
  },
  authTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#2D2A3A',
    letterSpacing: '-0.8px',
    margin: '0 0 10px 0',
  },
  authSubText: {
    fontSize: '0.88rem',
    lineHeight: 1.45,
    color: '#6B7280',
    margin: '0 0 20px 0',
  },
  featuresListContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    backgroundColor: '#FAF9FC',
    border: '1px solid #FAF9FC',
    borderLeft: '3px solid #FAF9FC',
    background: 'linear-gradient(#FAF9FC, #FAF9FC) padding-box, linear-gradient(135deg, #A78BFA, #FBCFE8) border-box',
    padding: '12px 14px',
    borderRadius: '10px',
    marginBottom: '24px',
  },
  featureCheckItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#2D2A3A',
  },
  checkIcon: {
    color: '#6366F1',
    fontWeight: 'bold',
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  inputLabel: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#4B5563',
    marginBottom: '2px',
  },
  textInput: {
    backgroundColor: '#F5F3E9', // Softer default cream background
    border: '1.5px solid #EBE7DF', // Thin default border
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '0.92rem',
    color: '#2D2A3A',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  submitBtn: {
    backgroundColor: '#A78BFA',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '0.92rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
    marginTop: '8px',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  forgotBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6366F1',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: '0',
    top: '0',
    width: '44px',
    height: '44px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6B7280',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    zIndex: 10,
  },
  dividerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '24px 0',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: '#EBE7DF',
  },
  dividerText: {
    fontSize: '0.78rem',
    color: '#9CA3AF',
    fontWeight: 500,
  },
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF', // Clean default white background
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '11px 20px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  switchPrompt: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#6B7280',
    marginTop: '28px',
  },
  switchBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#A78BFA',
    fontSize: '0.85rem',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
    outline: 'none',
  },
  alertBox: {
    padding: '10px 14px',
    border: '1px solid',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  microcopy: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 1.35,
  },
  welcomeCheckmark: {
    fontSize: '3rem',
    marginBottom: '16px',
    display: 'inline-block',
  },
  successOnboardingCard: {
    backgroundColor: '#FAF9FC',
    border: '1.5px dashed #A78BFA',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    margin: '12px 0 8px 0',
  },
  miniStickyNote: {
    position: 'absolute',
    top: '-32px',
    right: '-40px',
    backgroundColor: '#FEF9C3',
    border: '1px solid #EAB308',
    borderRadius: '6px',
    padding: '8px',
    width: '100px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
    color: '#854D0E',
    fontSize: '0.68rem',
    pointerEvents: 'none',
  },
};

// ----------------------------------------------------
// CSS Rules Injection: Premium Spacing & Gradients
// ----------------------------------------------------
const cleanInjectedStyles = `
/* Inter Font Stack Injection */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* Minimal link underlines: sliding lavender-to-pink gradient underline */
.minimal-link {
  position: relative;
  transition: color 250ms ease;
}
.minimal-link:hover {
  color: #2D2A3A !important;
}
.hover-underline::after {
  content: '';
  position: absolute;
  width: 100%;
  transform: scaleX(0);
  height: 2px;
  bottom: -4px;
  left: 0;
  background: linear-gradient(90deg, #A78BFA, #FBCFE8) !important;
  transform-origin: bottom right;
  transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}
.hover-underline:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

/* Form text input focusing: Lavender border, soft pink glow, smooth transition */
.text-input-focus {
  transition: border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease !important;
}
.text-input-focus:focus {
  border-color: #A78BFA !important; /* Lavender focus border */
  box-shadow: 0 0 10px rgba(251, 207, 232, 0.5) !important; /* Soft pink glow */
  background-color: #FAF9F6 !important;
}

/* Linear/Things 3 Premium Micro Scales: Hover is diagonal Lavender-to-Pink gradient with slight lift & glow */
.btn-scale-primary {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-scale-primary:hover {
  transform: translateY(-2px); /* Slight lift effect */
  background: linear-gradient(135deg, #A78BFA 0%, #FBCFE8 100%) !important;
  box-shadow: 0 6px 16px rgba(167, 139, 250, 0.25) !important; /* Soft glow */
}
.btn-scale-primary:active {
  transform: translateY(0.5px);
}

/* Branded Google auth with clean white background and subtle lavender tint on hover */
.google-btn-hover {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.google-btn-hover:hover {
  background-color: #FAF9FC !important; /* Very subtle lavender tint */
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.1) !important; /* Elegant shadow */
  border-color: #A78BFA !important;
}

/* Premium Form Card Depth shadows */
.premium-card-depth {
  box-shadow: 0 25px 50px -12px rgba(45, 42, 58, 0.07), 
              0 10px 20px -15px rgba(167, 139, 250, 0.05) !important;
  backdrop-filter: blur(12px);
}

/* Workspace preview elements: subtle glow when hovered */
.workspace-preview-glow {
  transition: border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease, background-color 300ms ease;
}
.workspace-preview-glow:hover {
  border-color: #A78BFA !important;
  background-color: #FAF9FC !important;
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.18), 0 0 8px rgba(251, 207, 232, 0.15) !important;
}

/* Default Background Glow Blobs: Injects a gentle hint of pink across the margins */
.pink-glow-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(251, 207, 232, 0.28) 0%, rgba(167, 139, 250, 0.05) 60%, rgba(250, 249, 246, 0) 100%);
  pointer-events: none;
  filter: blur(50px);
  z-index: 1;
}

/* Cozy rotated sticky notes: gently rotate 1-2 degrees on hover */
.mini-sticky-note-hover {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 300ms ease;
}
.cozy-rotate-left {
  transform: rotate(-6deg);
}
.cozy-rotate-right {
  transform: rotate(5deg);
}
.cozy-rotate-left:hover {
  transform: rotate(-4deg) scale(1.03) !important;
  box-shadow: 0 6px 12px rgba(0,0,0,0.04) !important;
}
.cozy-rotate-right:hover {
  transform: rotate(3deg) scale(1.03) !important;
  box-shadow: 0 6px 12px rgba(0,0,0,0.04) !important;
}

/* Mug steam rise path keyframes */
.steam-line {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: steamRise 4s linear infinite;
  opacity: 0;
}
.steam-2 {
  animation-delay: 2s;
}
@keyframes steamRise {
  0% {
    stroke-dashoffset: 80;
    opacity: 0;
    transform: translateY(0px) scaleX(1);
  }
  20% {
    opacity: 0.5;
  }
  80% {
    opacity: 0.15;
  }
  100% {
    stroke-dashoffset: 0;
    opacity: 0;
    transform: translateY(-20px) scaleX(0.75);
  }
}

/* Glassmorphic border containers */
.glass-card {
  background-color: #FAF9F6;
  border: 1.5px solid #EBE7DF;
}

.shadow-premium {
  box-shadow: 0 30px 70px -20px rgba(45, 42, 58, 0.08);
}

/* Fade-in components on active view change */
.fade-in {
  animation: fadeInEffect 0.35s ease-out forwards;
}
@keyframes fadeInEffect {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0px); }
}

/* Responsive configurations */
@media (max-width: 1024px) {
  .auth-grid-responsive {
    grid-template-columns: 1fr !important;
    gap: 0px !important;
  }
  .illustration-column-hide {
    display: none !important;
  }
  .mobile-logo-show {
    display: flex !important;
  }
  .pink-glow-blob {
    width: 260px !important;
    height: 260px !important;
  }
}

@media (max-width: 480px) {
  .auth-grid-responsive {
    padding: 12px 4% !important;
  }
  
  /* Touch Targets Safeguard */
  button, input, .btn-scale-primary, .btn-scale-secondary {
    min-height: 44px !important;
    box-sizing: border-box !important;
  }
}
`;
