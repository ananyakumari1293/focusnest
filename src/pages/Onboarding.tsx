import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Type definitions for onboarding choices
type OnboardingRole = 'Student' | 'Professional' | 'Freelancer' | '';
type OnboardingSession = '25' | '45' | '60' | '90' | '';
type OnboardingGoal = 'Web Development' | 'DSA' | 'AI & Machine Learning' | 'Placements' | 'College Exams' | 'Personal Projects' | 'Other' | '';

export default function Onboarding() {
  const navigate = useNavigate();

  // Load Google Fonts
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  // Onboarding Form States
  const [step, setStep] = useState<number>(1);
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<OnboardingRole>('');
  const [wakeTime, setWakeTime] = useState<string>('07:30');
  const [sleepTime, setSleepTime] = useState<string>('23:00');
  const [focusSession, setFocusSession] = useState<OnboardingSession>('');
  const [focusGoal, setFocusGoal] = useState<OnboardingGoal>('');
  const [customGoal, setCustomGoal] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Total steps in onboarding flow (1 to 7)
  const totalSteps = 7;

  // Step Controllers
  const nextStep = (): void => {
    setErrorMessage('');
    // Validation per step
    if (step === 1 && !name.trim()) {
      setErrorMessage('Please tell us your name so we can cozy up your space!');
      return;
    }
    if (step === 2 && !role) {
      setErrorMessage('Choose the option that fits you best.');
      return;
    }
    if (step === 3 && !wakeTime) {
      setErrorMessage('When do you usually wake up?');
      return;
    }
    if (step === 4 && !sleepTime) {
      setErrorMessage('When do you usually go to sleep?');
      return;
    }
    if (step === 5 && !focusSession) {
      setErrorMessage('How long can you comfortably focus?');
      return;
    }
    if (step === 6 && !focusGoal) {
      setErrorMessage('What is your main focus right now?');
      return;
    }
    if (step === 6 && focusGoal === 'Other' && !customGoal.trim()) {
      setErrorMessage('Please write down your custom focus area.');
      return;
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = (): void => {
    setErrorMessage('');
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  // Final submit handler
  const handleCompleteOnboarding = (): void => {
    // Validate required fields before proceeding
    if (!name.trim()) {
      setErrorMessage('Please tell us your name so we can cozy up your space!');
      setStep(1);
      return;
    }
    if (!role) {
      setErrorMessage('Choose the option that fits you best.');
      setStep(2);
      return;
    }
    if (!focusSession) {
      setErrorMessage('How long can you comfortably focus?');
      setStep(5);
      return;
    }

    // Save onboarding states to localStorage for workspace loading
    localStorage.setItem("focusnest_username", name.trim());
    localStorage.setItem("focusnest_role", role);
    localStorage.setItem("focusnest_focus_duration", focusSession);
    localStorage.setItem("focusnest_onboarding_complete", "true");

    // Also store timeline preferences and goal
    localStorage.setItem("focusnest_wake_time", wakeTime);
    localStorage.setItem("focusnest_sleep_time", sleepTime);
    localStorage.setItem("focusnest_focus_goal", focusGoal === 'Other' ? customGoal : focusGoal);

    // TODO: Save onboarding states to Firestore database
    // example: await setDoc(doc(db, "users", auth.currentUser.uid), { name, role, wakeTime, sleepTime, focusSession, focusGoal: focusGoal === 'Other' ? customGoal : focusGoal });
    
    // Navigate to the main workspace page
    navigate('/workspace');
  };

  // Progress percentage logic
  const progressPercent = ((step - 1) / (totalSteps - 1)) * 100;

  // Helpers to get display value for final summary
  const getGoalDisplay = (): string => {
    if (focusGoal === 'Other') return customGoal;
    return focusGoal;
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Interaction Style Injection */}
      <style dangerouslySetInnerHTML={{ __html: injectedStyles }} />

      {/* Cozy ambient glow blobs in the background */}
      <div className="pink-glow-blob" style={{ top: '5%', left: '10%' }} />
      <div className="pink-glow-blob" style={{ bottom: '10%', right: '15%' }} />

      <div style={styles.onboardingWrapper} className="onboarding-grid-responsive">
        
        {/* ================= LEFT COLUMN: INTERACTIVE DIGITAL STUDY DESK ================= */}
        <div style={styles.illustrationColumn} className="illustration-column-hide">
          <div style={styles.cozyPreviewCard} className="glass-card shadow-premium workspace-preview-glow">
            
            <svg viewBox="0 0 500 500" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                {/* Desk Wood gradient */}
                <linearGradient id="deskWood" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F6F4EB" />
                  <stop offset="100%" stopColor="#EBE7DE" />
                </linearGradient>
                {/* Soft sky wash */}
                <linearGradient id="deskSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E8E5F7" />
                  <stop offset="100%" stopColor="#FDF2F8" />
                </linearGradient>
                {/* Yellow Sticky Note shadow */}
                <filter id="cozyShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#2D2A3A" floodOpacity="0.05" />
                </filter>
                {/* Warm lamp light cone */}
                <linearGradient id="warmLightCone" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#FAF9F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Backboard background wall */}
              <rect x="15" y="15" width="470" height="380" rx="16" fill="url(#deskSky)" />

              {/* Wooden Desk Surface */}
              <rect x="15" y="375" width="470" height="110" rx="12" fill="url(#deskWood)" stroke="#DFD9CD" strokeWidth="2.5" />
              <line x1="15" y1="390" x2="485" y2="390" stroke="#D3CDC1" strokeWidth="1.5" />

              {/* Floating window casting light */}
              <rect x="40" y="45" width="80" height="120" rx="6" fill="#FFFFFF" fillOpacity="0.3" />
              <line x1="80" y1="45" x2="80" y2="165" stroke="#FAF9F6" strokeWidth="1.5" />
              <line x1="40" y1="95" x2="120" y2="95" stroke="#FAF9F6" strokeWidth="1.5" />

              {/* A cute Sage Green plant in a white pot */}
              <g transform="translate(415, 305)">
                <polygon points="5,45 25,45 28,70 2,70" fill="#FAF9F6" stroke="#E5E1D8" strokeWidth="2" />
                <rect x="2" y="41" width="24" height="4" rx="1" fill="#EAE6DF" />
                {/* Green Leaves */}
                <path d="M 15,42 Q 5,15 -8,22 Q 5,32 15,42" fill="#A7D8B9" stroke="#3D7D54" strokeWidth="1.5" />
                <path d="M 15,42 Q 15,5 12,0 Q 14,20 15,42" fill="#84C69B" stroke="#3D7D54" strokeWidth="1.5" />
                <path d="M 15,42 Q 25,12 38,18 Q 23,32 15,42" fill="#5FAD79" stroke="#3D7D54" strokeWidth="1.5" />
              </g>

              {/* Steaming Mug with rising vapor paths */}
              <g transform="translate(70, 335)">
                <path d="M 0,20 C 0,44 26,44 26,20 Z" fill="#FBCFE8" stroke="#DB2777" strokeWidth="2" />
                <path d="M 26,10 C 33,10 33,26 26,26" fill="none" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
                {/* Steam lines */}
                <path className="steam-line steam-1" d="M 8,-5 Q 4,-12 10,-20" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" />
                <path className="steam-line steam-2" d="M 18,-7 Q 22,-14 16,-22" fill="none" stroke="#DB2777" strokeWidth="1.8" strokeLinecap="round" />
                {/* Active Focus Session Display on mug */}
                <text x="13" y="32" fill="#DB2777" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {focusSession ? `${focusSession}m` : 'focus'}
                </text>
              </g>

              {/* Desk clock displaying wake up / sleep times */}
              <g transform="translate(355, 335)" filter="url(#cozyShadow)">
                <circle cx="16" cy="16" r="18" fill="#FAF9F6" stroke="#2D2A3A" strokeWidth="2.5" />
                <line x1="16" y1="16" x2="16" y2="8" stroke="#2D2A3A" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="16" x2="24" y2="16" stroke="#2D2A3A" strokeWidth="1.5" strokeLinecap="round" />
                {/* Dynamic label showing wake/sleep time depending on active step */}
                <rect x="-8" y="24" width="48" height="15" rx="4" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="1" />
                <text x="16" y="33" fill="#6B7280" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  {step <= 3 ? `Wake: ${wakeTime || '07:30'}` : `Rest: ${sleepTime || '23:00'}`}
                </text>
              </g>

              {/* Yellow Cozy Sticky note showing progress and goals */}
              <g transform="translate(345, 80) rotate(5)" className="cozy-rotate-right mini-sticky-note-hover">
                <rect x="0" y="0" width="90" height="90" rx="6" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1.5" filter="url(#cozyShadow)" />
                <line x1="10" y1="18" x2="80" y2="18" stroke="#CA8A04" strokeWidth="2.5" />
                
                <text x="45" y="42" fill="#854D0E" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                  NEST BUILD
                </text>
                
                <rect x="12" y="52" width="66" height="6" rx="3" fill="#EAE6D8" />
                <rect x="12" y="52" width={Math.max(8, progressPercent * 0.66)} height="6" rx="3" fill="#EAB308" />
                
                <text x="45" y="76" fill="#CA8A04" fontSize="8.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  {`STEP ${step} / ${totalSteps}`}
                </text>
              </g>

              {/* A beautiful glowing desk lamp casting warm light */}
              <g transform="translate(45, 195)" filter="url(#cozyShadow)">
                <rect x="10" y="160" width="30" height="8" rx="2" fill="#2D2A3A" />
                <path d="M 25,160 Q 5,100 25,50" fill="none" stroke="#2D2A3A" strokeWidth="5.5" strokeLinecap="round" />
                <path d="M 12,50 C 12,30 48,30 48,50 Z" fill="#FEF9C3" stroke="#854D0E" strokeWidth="2" />
                {/* Soft yellow warm cone gradient light */}
                <polygon points="5,170 160,370 -40,370" fill="url(#warmLightCone)" />
              </g>

              {/* Main Laptop screen reacting to user input selections */}
              <g transform="translate(115, 175)" filter="url(#cozyShadow)">
                {/* Frame */}
                <rect x="0" y="0" width="250" height="170" rx="14" fill="#2D2A3A" stroke="#EAE6DF" strokeWidth="3" />
                {/* Inner Screen */}
                <rect x="8" y="8" width="234" height="154" rx="8" fill="#FAF9F6" />

                {/* Simulated workspace header */}
                <rect x="8" y="8" width="234" height="24" rx="8" fill="#E8E5F7" />
                <circle cx="20" cy="20" r="3" fill="#E5E7EB" />
                <circle cx="27" cy="20" r="3" fill="#E5E7EB" />
                <circle cx="34" cy="20" r="3" fill="#E5E7EB" />
                
                {/* Dynamic user name rendering */}
                <text x="48" y="24" fill="#5C3EAD" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
                  {name.trim() ? `🌸 ${name.trim()}'s Workspace` : '🌸 FocusNest Workspace'}
                </text>

                {/* Dashboard layout blocks */}
                <g transform="translate(18, 42)">
                  
                  {/* Left block: User Profile Summary Preview */}
                  <rect x="0" y="0" width="95" height="108" rx="6" fill="#F5F3E9" stroke="#E5E1D8" strokeWidth="1" />
                  
                  {/* Avatar Icon */}
                  <circle cx="47" cy="30" r="16" fill="#FBCFE8" stroke="#DB2777" strokeWidth="1.5" />
                  <text x="47.5" y="34.5" fill="#DB2777" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    {name.trim() ? name.trim().charAt(0).toUpperCase() : '?'}
                  </text>

                  {/* Dynamic Role Badge */}
                  <rect x="10" y="54" width="75" height="15" rx="4" fill="#E8E5F7" stroke="#A78BFA" strokeWidth="0.8" />
                  <text x="47" y="64" fill="#5C3EAD" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    {role ? `🎓 ${role}` : 'Role Unset'}
                  </text>

                  {/* Schedule display preview block */}
                  <rect x="10" y="75" width="75" height="24" rx="4" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="0.8" />
                  <text x="14" y="85" fill="#6B7280" fontSize="5.8" fontFamily="sans-serif">
                    {`🌅 Wake: ${wakeTime || '07:30'}`}
                  </text>
                  <text x="14" y="93" fill="#6B7280" fontSize="5.8" fontFamily="sans-serif">
                    {`🌌 Sleep: ${sleepTime || '23:00'}`}
                  </text>
                </g>

                <g transform="translate(121, 42)">
                  {/* Right block: Workload Goals & Timer widget */}
                  <rect x="0" y="0" width="95" height="108" rx="6" fill="#F5F3E9" stroke="#E5E1D8" strokeWidth="1" />
                  
                  {/* Goal label badge */}
                  <text x="10" y="16" fill="#6B7280" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
                    🎯 FOCUS GOAL
                  </text>
                  
                  <rect x="10" y="22" width="75" height="28" rx="4" fill="#FAF9F6" stroke="#EBE7DF" strokeWidth="0.8" />
                  
                  {/* Dynamic Focus Goal display */}
                  <text x="14" y="34" fill="#2D2A3A" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">
                    {focusGoal ? getGoalDisplay() : 'No Goal Selected'}
                  </text>
                  <text x="14" y="44" fill="#A78BFA" fontSize="6" fontWeight="bold" fontFamily="sans-serif">
                    {focusGoal ? 'AI priority aligned' : 'triage pending'}
                  </text>

                  {/* Active focus timer widget block */}
                  <text x="10" y="62" fill="#6B7280" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">
                    ⏳ FOCUS TRACK
                  </text>
                  
                  <rect x="10" y="68" width="75" height="30" rx="4" fill="#FAF9F6" stroke="#E8E5F7" strokeWidth="0.8" />
                  
                  {/* Display timer duration chosen */}
                  <text x="47" y="82" fill="#6366F1" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {focusSession ? `${focusSession}:00` : '25:00'}
                  </text>
                  <text x="47.5" y="92" fill="#86EFAC" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    🌱 COZY READY
                  </text>
                </g>

                {/* Lower keyboard plate */}
                <path d="M -15,170 L 265,170 L 275,182 L -25,182 Z" fill="#EAE6DF" stroke="#D1CFC7" strokeWidth="2" />
                <rect x="25" y="171" width="200" height="6" rx="1.5" fill="#C5C2B9" />
              </g>
            </svg>

          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTERACTIVE FORM CARDS ================= */}
        <div style={styles.formColumn}>
          
          {/* Logo bar */}
          <div style={styles.brandHeader}>
            <svg style={styles.logoSvg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="20" y="20" width="60" height="60" rx="14" fill="#FAF9F6" stroke="#2D2A3A" strokeWidth="6" />
              <rect x="36" y="36" width="28" height="28" rx="6" fill="#A78BFA" stroke="#2D2A3A" strokeWidth="3" />
            </svg>
            <span style={styles.brandName}>FocusNest</span>
          </div>

          <div style={styles.authCard} className="glass-card premium-card-depth workspace-preview-glow">
            
            {/* Progress Bar Indicator */}
            {step < totalSteps && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${progressPercent}%` }} />
                </div>
                <div style={styles.progressLabel}>
                  <span>Creating study desk...</span>
                  <span style={{ fontWeight: 'bold', color: '#6366F1' }}>{step} of 6</span>
                </div>
              </div>
            )}

            {/* Error alerts */}
            {errorMessage && (
              <div style={styles.alertBox} className="fade-in">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* ================= STEP 1: WHAT SHOULD WE CALL YOU? ================= */}
            {step === 1 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>Welcome to FocusNest 🌸</h2>
                <p style={styles.stepDesc}>Let's create your cozy productivity space.</p>
                
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>What should we call you?</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ananya"
                    style={styles.textInput}
                    className="text-input-focus"
                    required
                  />
                  <span style={styles.microcopy}>We will customize your dashboard, sticky notes, and workspaces.</span>
                </div>
              </div>
            )}

            {/* ================= STEP 2: TELL US ABOUT YOURSELF ================= */}
            {step === 2 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>Tell us about yourself 🎓</h2>
                <p style={styles.stepDesc}>Let's customize your FocusNest to match your daily routine.</p>

                <div style={styles.cardGroup}>
                  {/* Card: Student */}
                  <div
                    onClick={() => setRole('Student')}
                    style={{
                      ...styles.selectableCard,
                      ...(role === 'Student' ? styles.selectableCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.cardIcon}>🎓</span>
                    <div>
                      <span style={styles.cardTitle}>Student</span>
                      <p style={styles.cardSub}>Optimized for homework, exams, and lecture slots.</p>
                    </div>
                    {role === 'Student' && <span style={styles.checkmarkIcon}>✓</span>}
                  </div>

                  {/* Card: Professional */}
                  <div
                    onClick={() => setRole('Professional')}
                    style={{
                      ...styles.selectableCard,
                      ...(role === 'Professional' ? styles.selectableCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.cardIcon}>💼</span>
                    <div>
                      <span style={styles.cardTitle}>Professional</span>
                      <p style={styles.cardSub}>Optimized for meetings, projects, and focal deep work.</p>
                    </div>
                    {role === 'Professional' && <span style={styles.checkmarkIcon}>✓</span>}
                  </div>

                  {/* Card: Freelancer */}
                  <div
                    onClick={() => setRole('Freelancer')}
                    style={{
                      ...styles.selectableCard,
                      ...(role === 'Freelancer' ? styles.selectableCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.cardIcon}>🚀</span>
                    <div>
                      <span style={styles.cardTitle}>Freelancer</span>
                      <p style={styles.cardSub}>Optimized for tasks, client deliverables, and flexible times.</p>
                    </div>
                    {role === 'Freelancer' && <span style={styles.checkmarkIcon}>✓</span>}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: WAKE TIME ================= */}
            {step === 3 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>When do you usually wake up? 🌅</h2>
                <p style={styles.stepDesc}>We'll help you start your day with a peaceful morning routine.</p>

                <div style={styles.inputGroup} className="center-time-picker">
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    style={styles.timeInput}
                    className="text-input-focus"
                    required
                  />
                  <div style={styles.cozyTimeTip} className="mini-sticky-note-hover">
                    <span>☕ Cozy Tip</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>
                      "Early hours represent peak workload processing limits!"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 4: SLEEP TIME ================= */}
            {step === 4 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>When do you usually sleep? 🌌</h2>
                <p style={styles.stepDesc}>We'll make sure you get enough rest to stay fresh and creative.</p>

                <div style={styles.inputGroup} className="center-time-picker">
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    style={styles.timeInput}
                    className="text-input-focus"
                    required
                  />
                  <div style={{ ...styles.cozyTimeTip, backgroundColor: '#FAF9FC', borderColor: '#A78BFA', color: '#5C3EAD' }} className="mini-sticky-note-hover">
                    <span>🌿 Cozy Tip</span>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem' }}>
                      "Turn off your workspace 1 hour before sleep for peaceful recovery."
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 5: FAVORITE FOCUS SESSION ================= */}
            {step === 5 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>Choose your favorite focus session ⏱️</h2>
                <p style={styles.stepDesc}>Pick a pomodoro session length that works best for your flow.</p>

                <div style={styles.timerSelectionGrid} className="timer-selection-grid-responsive">
                  {/* Session: 25 Min */}
                  <div
                    onClick={() => setFocusSession('25')}
                    style={{
                      ...styles.timerOptionCard,
                      ...(focusSession === '25' ? styles.timerOptionCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.timerIcon}>☕</span>
                    <span style={styles.timerMinutes}>25 Min</span>
                    <span style={styles.timerDesc}>Classic pomodoro streak</span>
                  </div>

                  {/* Session: 45 Min */}
                  <div
                    onClick={() => setFocusSession('45')}
                    style={{
                      ...styles.timerOptionCard,
                      ...(focusSession === '45' ? styles.timerOptionCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.timerIcon}>🌸</span>
                    <span style={styles.timerMinutes}>45 Min</span>
                    <span style={styles.timerDesc}>Optimal school block</span>
                  </div>

                  {/* Session: 60 Min */}
                  <div
                    onClick={() => setFocusSession('60')}
                    style={{
                      ...styles.timerOptionCard,
                      ...(focusSession === '60' ? styles.timerOptionCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.timerIcon}>🚀</span>
                    <span style={styles.timerMinutes}>60 Min</span>
                    <span style={styles.timerDesc}>Advanced deep dive slot</span>
                  </div>

                  {/* Session: 90 Min */}
                  <div
                    onClick={() => setFocusSession('90')}
                    style={{
                      ...styles.timerOptionCard,
                      ...(focusSession === '90' ? styles.timerOptionCardSelected : {}),
                    }}
                    className="cozy-selectable-card"
                  >
                    <span style={styles.timerIcon}>🔥</span>
                    <span style={styles.timerMinutes}>90 Min</span>
                    <span style={styles.timerDesc}>Elite flow endurance block</span>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 6: WHAT ARE YOU FOCUSING ON NOW? ================= */}
            {step === 6 && (
              <div className="fade-in">
                <h2 style={styles.stepTitle}>What are you focusing on right now? 🎯</h2>
                <p style={styles.stepDesc}>Tell us what you're working on, and we'll help organize your task list.</p>

                <div style={styles.goalsFlexList}>
                  {[
                    'Web Development',
                    'DSA',
                    'AI & Machine Learning',
                    'Placements',
                    'College Exams',
                    'Personal Projects',
                    'Other',
                  ].map((goalItem) => (
                    <button
                      key={goalItem}
                      onClick={() => {
                        setFocusGoal(goalItem as OnboardingGoal);
                        setErrorMessage('');
                      }}
                      style={{
                        ...styles.goalTagButton,
                        ...(focusGoal === goalItem ? styles.goalTagButtonSelected : {}),
                      }}
                      className="goal-tag-interactive"
                    >
                      {goalItem === 'Other' ? '✍️ Other' : goalItem}
                    </button>
                  ))}
                </div>

                {focusGoal === 'Other' && (
                  <div style={{ ...styles.inputGroup, marginTop: '20px' }} className="fade-in">
                    <label style={styles.inputLabel}>Describe your focus area</label>
                    <input
                      type="text"
                      value={customGoal}
                      onChange={(e) => setCustomGoal(e.target.value)}
                      placeholder="Writing my novel, Painting, etc."
                      style={styles.textInput}
                      className="text-input-focus"
                      required
                    />
                  </div>
                )}
              </div>
            )}

            {/* ================= FINAL STEP: READY COZY NEST ONBOARDING SUMMARY ================= */}
            {step === 7 && (
              <div className="fade-in" style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem', marginBottom: '10px', display: 'inline-block' }}>✨</span>
                <h2 style={styles.stepTitle}>Your FocusNest is ready</h2>
                <p style={styles.stepDesc}>
                  Your digital study desk is fully organized and optimized. Here are your setup credentials:
                </p>

                {/* Onboarding Summary Checklist Card */}
                <div style={styles.summaryCard} className="workspace-preview-glow">
                  
                  {/* Profile line */}
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>👤 Name</span>
                    <span style={styles.summaryVal}>{name}</span>
                  </div>

                  {/* Role line */}
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>💼 Workspace Role</span>
                    <span style={styles.summaryVal}>{role}</span>
                  </div>

                  {/* Session duration */}
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>⏱️ Focus Streak Block</span>
                    <span style={styles.summaryVal}>{focusSession} Minutes</span>
                  </div>

                  {/* Goal focus */}
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>🎯 Core Focus Area</span>
                    <span style={styles.summaryVal}>{getGoalDisplay()}</span>
                  </div>

                  {/* Sleep rhythm slots */}
                  <div style={styles.summaryRow}>
                    <span style={styles.summaryLabel}>⏰ Core Timeline</span>
                    <span style={styles.summaryVal}>🌅 {wakeTime} - 🌌 {sleepTime}</span>
                  </div>
                </div>

                {/* Proceed button */}
                <button onClick={handleCompleteOnboarding} style={{ ...styles.submitBtn, marginTop: '24px' }} className="btn-scale-primary">
                  Enter My Workspace →
                </button>
              </div>
            )}

            {/* Previous / Next Navigation actions */}
            {step < totalSteps && (
              <div style={styles.flowActionsRow} className="flow-actions-row-responsive">
                {step > 1 ? (
                  <button onClick={prevStep} style={styles.btnSecondary} className="btn-scale-secondary">
                    ← Previous
                  </button>
                ) : (
                  <div style={{ width: '48px' }} />
                )}
                
                <button onClick={nextStep} style={styles.btnPrimary} className="btn-scale-primary">
                  Next Step →
                </button>
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
    background: 'linear-gradient(135deg, #FAF9F6 0%, #FDF2F8 50%, #F5F3FF 100%)',
    color: '#2D2A3A',
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
  onboardingWrapper: {
    maxWidth: '1080px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
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
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
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
    backgroundColor: 'rgba(250, 249, 246, 0.9)',
    border: '1px solid rgba(235, 231, 223, 0.6)',
    borderRadius: '24px',
    padding: 'clamp(20px, 4vw, 36px) clamp(16px, 4vw, 30px)',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '450px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '440px',
    justifyContent: 'space-between',
  },
  progressContainer: {
    marginBottom: '20px',
  },
  progressBarBg: {
    height: '6px',
    backgroundColor: '#EBE7DF',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #A78BFA 0%, #FBCFE8 100%)',
    borderRadius: '3px',
    transition: 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6B7280',
    marginTop: '6px',
    fontWeight: 600,
  },
  stepTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#2D2A3A',
    letterSpacing: '-0.8px',
    margin: '0 0 8px 0',
  },
  stepDesc: {
    fontSize: '0.88rem',
    lineHeight: 1.45,
    color: '#6B7280',
    margin: '0 0 24px 0',
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
    backgroundColor: '#F5F3E9',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '0.92rem',
    color: '#2D2A3A',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  timeInput: {
    backgroundColor: '#F5F3E9',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    padding: '16px 20px',
    fontSize: '1.8rem',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2D2A3A',
    outline: 'none',
    width: '180px',
    margin: '10px auto',
    display: 'block',
    boxSizing: 'border-box',
  },
  cozyTimeTip: {
    backgroundColor: '#FEF9C3',
    border: '1px solid #EAB308',
    borderRadius: '8px',
    padding: '10px 14px',
    color: '#854D0E',
    fontSize: '0.78rem',
    fontWeight: 'bold',
    maxWidth: '280px',
    margin: '16px auto 0 auto',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
  },
  selectableCard: {
    display: 'flex',
    gap: '14px',
    padding: '12px 16px',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    cursor: 'pointer',
    alignItems: 'center',
    boxSizing: 'border-box',
    width: '100%',
    position: 'relative',
  },
  selectableCardSelected: {
    border: '2px solid #A78BFA',
    backgroundColor: '#FDF4FF',
    boxShadow: '0 8px 20px rgba(167,139,250,0.25)',
  },
  checkmarkIcon: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    color: '#A78BFA',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  cardIcon: {
    fontSize: '1.8rem',
  },
  cardTitle: {
    fontSize: '0.92rem',
    fontWeight: 750,
    color: '#2D2A3A',
    display: 'block',
    marginBottom: '2px',
  },
  cardSub: {
    fontSize: '0.75rem',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.35,
  },
  cardGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  timerSelectionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    width: '100%',
  },
  timerOptionCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  timerOptionCardSelected: {
    border: '2px solid #A78BFA',
    backgroundColor: '#FDF4FF',
    boxShadow: '0 8px 20px rgba(167,139,250,0.25)',
  },
  timerIcon: {
    fontSize: '1.5rem',
    marginBottom: '6px',
  },
  timerMinutes: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#2D2A3A',
    display: 'block',
    marginBottom: '2px',
  },
  timerDesc: {
    fontSize: '0.7rem',
    color: '#6B7280',
  },
  goalsFlexList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  goalTagButton: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#4B5563',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 200ms ease',
  },
  goalTagButtonSelected: {
    backgroundColor: '#E8E5F7',
    borderColor: '#A78BFA',
    color: '#5C3EAD',
    boxShadow: '0 4px 10px rgba(167, 139, 250, 0.15)',
  },
  summaryCard: {
    backgroundColor: '#FAF9FC',
    border: '1.5px dashed #A78BFA',
    borderRadius: '16px',
    padding: '20px 24px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    margin: '20px 0 8px 0',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #EBE7DF',
    paddingBottom: '8px',
  },
  summaryLabel: {
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#6B7280',
  },
  summaryVal: {
    fontSize: '0.82rem',
    fontWeight: 750,
    color: '#2D2A3A',
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
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px',
  },
  btnPrimary: {
    backgroundColor: '#A78BFA',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.88rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(45, 42, 58, 0.05)',
    minHeight: '44px',
  },
  btnSecondary: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '10px 18px',
    fontSize: '0.88rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
    minHeight: '44px',
  },
  flowActionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '24px',
    width: '100%',
  },
  alertBox: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
    border: '1.5px solid #FCA5A5',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '0.82rem',
    fontWeight: 600,
    lineHeight: 1.4,
    marginBottom: '20px',
  },
  microcopy: {
    fontSize: '0.75rem',
    color: '#9CA3AF',
    lineHeight: 1.35,
    marginTop: '4px',
  },
};

// ----------------------------------------------------
// CSS Rules Injection: Micro-interactions & Gradients
// ----------------------------------------------------
const injectedStyles = `
/* Cozy selectable cards: lift sways and color transition */
.cozy-selectable-card {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 250ms cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 250ms ease, 
              background-color 250ms ease !important;
}
.cozy-selectable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(45, 42, 58, 0.03) !important;
  border-color: #FBCFE8 !important;
  background-color: #FAF9FC !important;
}
.cozy-selectable-card:active {
  transform: translateY(0.5px);
}

/* Linear/Things 3 Premium Micro Scales for Buttons */
.btn-scale-primary {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #A78BFA;
  color: #FAF9F6;
  border: 1.5px solid #2D2A3A;
  box-shadow: 0 2px 4px rgba(45, 42, 58, 0.05);
}
.btn-scale-primary:hover {
  transform: translateY(-1.5px);
  background: linear-gradient(135deg, #A78BFA 0%, #FBCFE8 100%) !important;
  box-shadow: 0 4px 12px rgba(167, 139, 250, 0.2);
}
.btn-scale-primary:active {
  transform: translateY(0.5px);
}

.btn-scale-secondary {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #FAF9F6;
  color: #2D2A3A;
  border: 1.5px solid #EBE7DF;
}
.btn-scale-secondary:hover {
  transform: translateY(-1.5px);
  border-color: #A78BFA;
  background: #FAF9FC;
  box-shadow: 0 4px 12px rgba(251, 207, 232, 0.15);
}
.btn-scale-secondary:active {
  transform: translateY(0.5px);
}

/* Form text input focusing: Lavender border, soft pink glow, smooth transition */
.text-input-focus {
  transition: border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease !important;
}
.text-input-focus:focus {
  border-color: #A78BFA !important;
  box-shadow: 0 0 10px rgba(251, 207, 232, 0.5) !important;
  background-color: #FAF9F6 !important;
}

/* Goal tags interactions */
.goal-tag-interactive {
  transition: all 250ms ease;
}
.goal-tag-interactive:hover {
  transform: translateY(-1px);
  border-color: #FBCFE8 !important;
  background-color: #FAF9FC !important;
}

/* Default Background Glow Blobs */
.pink-glow-blob {
  position: absolute;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(251, 207, 232, 0.28) 0%, rgba(167, 139, 250, 0.05) 60%, rgba(250, 249, 246, 0) 100%);
  pointer-events: none;
  filter: blur(50px);
  z-index: 1;
}

/* Warm yellow desk lamp cone */
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600&display=swap');

@media (max-width: 1024px) {
  .onboarding-grid-responsive {
    grid-template-columns: 1fr !important;
    gap: 40px !important;
  }
  .illustration-column-hide {
    display: none !important;
  }
}

@media (max-width: 480px) {
  .timer-selection-grid-responsive {
    grid-template-columns: 1fr !important;
  }
  .flow-actions-row-responsive {
    flex-direction: column-reverse !important;
    gap: 12px !important;
  }
  .flow-actions-row-responsive button {
    width: 100% !important;
    min-height: 44px !important;
    margin: 0 !important;
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
  }
  .flow-actions-row-responsive div {
    display: none !important;
  }
  
  /* Touch Targets Safeguard */
  button, input, select, textarea, .btn-scale-primary, .btn-scale-secondary {
    min-height: 44px !important;
    box-sizing: border-box !important;
  }
}
`;
