import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// FocusNest Core Types
interface Task {
  id: number;
  text: string;
  column: 'planned' | 'progress' | 'completed';
  priority: 'High' | 'Medium' | 'Low';
  timeEstimate: string;
}

interface TimelineItem {
  time: string;
  activity: string;
  duration: string;
  tag: 'Focus' | 'Sync' | 'Assistant' | 'Rest' | 'Review';
}

interface GroupMember {
  name: string;
  status: 'Focusing' | 'Resting';
  timerStr: string;
  avatarBg: string;
}

interface SharedTask {
  id: number;
  taskName: string;
  claimedBy: string;
  status: 'Claimed' | 'Done';
}

export default function Home() {
  const navigate = useNavigate();

  // Focus Timer States
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Kanban Tasks State
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Review UI typography and spacing parameters', column: 'planned', priority: 'High', timeEstimate: '45m' },
    { id: 2, text: 'Consolidate workspace focus routes into single views', column: 'planned', priority: 'Medium', timeEstimate: '30m' },
    { id: 3, text: 'Draft system model parameters for the AI task prioritizing scheduler', column: 'progress', priority: 'High', timeEstimate: '60m' },
    { id: 4, text: 'Configure local storage caches for silent offline mode sessions', column: 'completed', priority: 'Low', timeEstimate: '20m' },
  ]);

  // Group Collaboration States
  const [groupMembers] = useState<GroupMember[]>([
    { name: 'Ananya (You)', status: 'Focusing', timerStr: '18:42', avatarBg: '#A78BFA' },
    { name: 'James', status: 'Resting', timerStr: '04:12', avatarBg: '#FBCFE8' },
    { name: 'Sarah', status: 'Focusing', timerStr: '22:10', avatarBg: '#6366F1' },
  ]);

  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([
    { id: 1, taskName: 'Design workspace canvas layout', claimedBy: 'James', status: 'Done' },
    { id: 2, taskName: 'Integrate workload analyzer models', claimedBy: 'Sarah', status: 'Claimed' },
    { id: 3, taskName: 'Sketch desktop vector preview assets', claimedBy: 'Ananya', status: 'Claimed' },
  ]);

  // AI Assistant Custom Advice State
  const [aiAnalysisActive, setAiAnalysisActive] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string>(
    'FocusNest AI: Workload optimized. We blocked your peak hours (10:00 AM - 12:00 PM) for deep focus implementation.'
  );

  // Focus Timer Logic
  useEffect(() => {
    if (timerMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (timerMode === 'short') setTimeLeft(5 * 60);
    else if (timerMode === 'long') setTimeLeft(15 * 60);
    setTimerRunning(false);
  }, [timerMode]);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
  }, [timerRunning]);

  const toggleTimer = (): void => setTimerRunning(!timerRunning);
  const resetTimer = (): void => {
    setTimerRunning(false);
    if (timerMode === 'pomodoro') setTimeLeft(25 * 60);
    else if (timerMode === 'short') setTimeLeft(5 * 60);
    else if (timerMode === 'long') setTimeLeft(15 * 60);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    let total = 25 * 60;
    if (timerMode === 'short') total = 5 * 60;
    if (timerMode === 'long') total = 15 * 60;
    return ((total - timeLeft) / total) * 100;
  };

  // Move Tasks through Columns
  const shiftTaskColumn = (id: number): void => {
    setTasks((prevTasks) =>
      prevTasks.map((t) => {
        if (t.id === id) {
          let nextCol: 'planned' | 'progress' | 'completed' = 'planned';
          if (t.column === 'planned') nextCol = 'progress';
          else if (t.column === 'progress') nextCol = 'completed';
          return { ...t, column: nextCol };
        }
        return t;
      })
    );
  };

  // Interactive claiming logs
  const toggleSharedTaskStatus = (id: number): void => {
    setSharedTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return { ...t, status: t.status === 'Claimed' ? 'Done' : 'Claimed' };
        }
        return t;
      })
    );
  };

  // Trigger AI analysis recommendation update
  const runAiTriage = (): void => {
    setAiAnalysisActive(true);
    setAiMessage('Analyzing task list... Calculating optimal stress-to-productivity parameters...');
    setTimeout(() => {
      setAiMessage(
        'AI Optimization Done: Focus blocks aligned. Generated 180m total deep work, 50m collaboration, and 30m soft buffer rests.'
      );
      setAiAnalysisActive(false);
    }, 1200);
  };

  // Structured Realistic Daily Schedule data
  const mockSchedule: TimelineItem[] = [
    { time: '09:00 AM - 09:30 AM', activity: '☕ Cozy Coffee & Inbox Sort', duration: '30m', tag: 'Assistant' },
    { time: '09:30 AM - 11:00 AM', activity: '⏳ Deep Focus: Coding Sprint', duration: '90m', tag: 'Focus' },
    { time: '11:00 AM - 11:30 AM', activity: '👥 Peer Group Study Alignment', duration: '30m', tag: 'Sync' },
    { time: '11:30 AM - 12:00 PM', activity: '☕ Quiet Buffer & Team Rest', duration: '30m', tag: 'Rest' },
    { time: '01:30 PM - 03:30 PM', activity: '⏳ High Focus: Task Implementations', duration: '120m', tag: 'Focus' },
    { time: '03:30 PM - 04:00 PM', activity: '📊 Daily Velocity Analytics Audit', duration: '30m', tag: 'Review' },
  ];

  return (
    <div style={styles.container}>
      {/* Injected Refined Interaction Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: cleanInjectedStyles }} />

      {/* Default background pink glow blob for a quiet hint of pink in the background */}
      <div className="pink-glow-blob" style={{ top: '15%', right: '10%' }} />
      <div className="pink-glow-blob" style={{ top: '60%', left: '5%' }} />

      {/* ----------------- NAVBAR ----------------- */}
      <header style={styles.navbar}>
        <div style={styles.navBrand}>
          <svg style={styles.logoSvg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="60" height="60" rx="14" fill="#FAF9F6" stroke="#2D2A3A" strokeWidth="6" />
            <rect x="36" y="36" width="28" height="28" rx="6" fill="#A78BFA" stroke="#2D2A3A" strokeWidth="3" />
            <path d="M 44,14 L 56,14" stroke="#2D2A3A" strokeWidth="6" strokeLinecap="round" />
          </svg>
          <span style={styles.brandName}>FocusNest</span>
        </div>

        <nav style={styles.navLinks}>
          <a href="#features" style={styles.navLink} className="minimal-link hover-underline">Features</a>
          <a href="#workspace" style={styles.navLink} className="minimal-link hover-underline">Workspace</a>
          <a href="#about" style={styles.navLink} className="minimal-link hover-underline">About</a>
        </nav>

        <div style={styles.navActions}>
          <button style={styles.btnSecondary} className="btn-scale-secondary" onClick={() => navigate('/signup')}>Sign In</button>
          <button style={styles.btnPrimary} className="btn-scale-primary" onClick={() => navigate('/signup')}>Get Started</button>
        </div>
      </header>

      {/* ----------------- HERO SECTION ----------------- */}
      <section style={styles.heroSection}>
        <div style={styles.heroGrid} className="hero-grid-responsive">
          {/* Left Column: Heading and Description */}
          <div style={styles.heroLeft}>
            {/* Cozy rotated sticky note with gentle sway interaction on hover */}
            <div style={styles.miniStickyNote} className="cozy-rotate-left mini-sticky-note-hover">
              <span>☕ study note</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', fontWeight: 650 }}>25m focus block 🚀</p>
            </div>

            <h1 style={styles.heroTitle}>FocusNest</h1>
            <p style={styles.heroSub}>
              Plan tasks, stay focused, collaborate with others, and let AI organize your workflow.
            </p>
            <div style={styles.heroCtaGroup} className="cta-group-responsive">
              <Link to="/signup" style={{ ...styles.btnPrimary, textDecoration: 'none', padding: '12px 24px' }} className="btn-scale-primary">
                Get Started
              </Link>
              <a href="#workspace" style={{ ...styles.btnSecondary, textDecoration: 'none', padding: '12px 24px' }} className="btn-scale-secondary">
                Explore Workspace
              </a>
            </div>
          </div>

          {/* Right Column: Realistic Desktop Application Mockup */}
          <div style={styles.heroRight} className="mockup-responsive-wrapper">
            <div style={styles.heroMockupContainer} className="product-window shadow-premium workspace-preview-glow">
              {/* Mockup Title bar */}
              <div style={styles.mockupTitleBar}>
                <div style={styles.dotGroup}>
                  <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
                  <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
                  <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
                </div>
                <span style={styles.mockupPathText}>focusnest.app/workspace</span>
                <div style={{ width: '48px' }} />
              </div>

              {/* Mockup Dashboard Content Grid */}
              <div style={styles.heroMockupContent}>
                {/* Simulated Kanban Columns inside Hero Mockup */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <span style={styles.heroMockupSubTitle}>📋 Tasks In Focus</span>
                  
                  {/* Kanban Card 1 */}
                  <div style={styles.mockupStickyCard} className="workspace-preview-glow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ ...styles.categoryBadge, backgroundColor: '#FAF9F6', color: '#2D2A3A' }}>UI Specs</span>
                      <span style={{ fontSize: '0.72rem', color: '#A78BFA', fontWeight: 650 }}>Planned</span>
                    </div>
                    <p style={styles.mockupCardText}>Review core canvas grid models and margins</p>
                  </div>

                  {/* Kanban Card 2 */}
                  <div style={{ ...styles.mockupStickyCard, borderLeft: '4px solid #A78BFA' }} className="workspace-preview-glow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ ...styles.categoryBadge, backgroundColor: '#FDF2F8', color: '#DB2777' }}>AI Engine</span>
                      <span style={{ fontSize: '0.72rem', color: '#6366F1', fontWeight: 650 }}>Active</span>
                    </div>
                    <p style={styles.mockupCardText}>Integrate user workload analyzer suggestions</p>
                  </div>
                </div>

                {/* Simulated Focus Timer & AI Panel */}
                <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Mini Focus Timer */}
                  <div style={styles.mockupWidgetCard} className="workspace-preview-glow">
                    <span style={styles.widgetHeader}>⏱️ Pomodoro Session</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 'bold', color: '#2D2A3A' }}>25:00</span>
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#E8E5F7', color: '#5C3EAD', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Deep Focus</span>
                    </div>
                  </div>

                  {/* Mini AI Assistant Suggestions Triage */}
                  <div style={{ ...styles.mockupWidgetCard, border: '1px solid #FBCFE8', backgroundColor: '#FAF9FC' }} className="workspace-preview-glow">
                    <span style={{ ...styles.widgetHeader, color: '#6366F1' }}>🤖 AI Triage Advice</span>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.35 }}>
                      "Stress index low. Block 10:00 AM sync block for peak focus task implementation."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- FEATURES GRID SECTION ----------------- */}
      <section id="features" style={styles.featuresSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Everything you need. Calmed.</h2>
          <p style={styles.sectionSubtitle}>
            A unified task manager designed to prioritize silent usability over decorative noise.
          </p>
        </div>

        <div style={styles.featuresGrid} className="features-grid-responsive">
          {/* Feature 1: Smart Kanban Boards */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">📝</div>
            <h3 style={styles.featureCardTitle}>Smart Kanban Boards</h3>
            <p style={styles.featureCardDesc}>
              Create, organize, and manage tasks effortlessly.
            </p>
            {/* Mini Visual Preview */}
            <div style={styles.cardMiniPreview}>
              <div style={styles.miniKanbanCol}>
                <div style={{ ...styles.miniPill, backgroundColor: '#A78BFA', width: '70%' }} />
                <div style={{ ...styles.miniPill, backgroundColor: '#EBE7DF', width: '50%' }} />
              </div>
              <div style={styles.miniKanbanCol}>
                <div style={{ ...styles.miniPill, backgroundColor: '#FBCFE8', width: '90%' }} />
              </div>
            </div>
          </div>

          {/* Feature 2: Focus Timer */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">⏱️</div>
            <h3 style={styles.featureCardTitle}>Focus Timer</h3>
            <p style={styles.featureCardDesc}>
              Built-in Pomodoro and deep work sessions.
            </p>
            {/* Mini Visual Preview */}
            <div style={{ ...styles.cardMiniPreview, justifyContent: 'center', alignItems: 'center' }}>
              <div style={styles.miniTimerBox}>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', fontFamily: 'monospace' }}>25:00</span>
                <span style={{ fontSize: '0.65rem', color: '#6366F1' }}>⏸️ pause</span>
              </div>
            </div>
          </div>

          {/* Feature 3: AI Assistant */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">💡</div>
            <h3 style={styles.featureCardTitle}>AI Assistant</h3>
            <p style={styles.featureCardDesc}>
              Task prioritization and productivity suggestions.
            </p>
            {/* Mini Visual Preview */}
            <div style={styles.cardMiniPreview}>
              <div style={styles.miniChatBubbleLeft}>Optimize my timeline?</div>
              <div style={styles.miniChatBubbleRight}>Rescheduled sync to 11 AM.</div>
            </div>
          </div>

          {/* Feature 4: AI Schedule Generator */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">📅</div>
            <h3 style={styles.featureCardTitle}>AI Schedule Generator</h3>
            <p style={styles.featureCardDesc}>
              Create schedules based on deadlines and priorities.
            </p>
            {/* Mini Visual Preview */}
            <div style={{ ...styles.cardMiniPreview, flexDirection: 'column', gap: '4px' }}>
              <div style={styles.miniScheduleRow}>
                <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#6366F1' }}>09:00 AM</span>
                <div style={{ ...styles.miniPill, backgroundColor: '#E8E5F7', flex: 1 }} />
              </div>
              <div style={styles.miniScheduleRow}>
                <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#6366F1' }}>10:00 AM</span>
                <div style={{ ...styles.miniPill, backgroundColor: '#FAF9F6', border: '1px solid #EBE7DF', flex: 1 }} />
              </div>
            </div>
          </div>

          {/* Feature 5: Analytics Dashboard */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">📊</div>
            <h3 style={styles.featureCardTitle}>Analytics Dashboard</h3>
            <p style={styles.featureCardDesc}>
              Track completion rates, focus hours, and consistency.
            </p>
            {/* Mini Visual Preview */}
            <div style={{ ...styles.cardMiniPreview, alignItems: 'flex-end', justifyContent: 'space-around' }}>
              <div style={{ ...styles.miniBar, height: '40%', backgroundColor: '#E8E5F7' }} />
              <div style={{ ...styles.miniBar, height: '75%', backgroundColor: '#A78BFA' }} />
              <div style={{ ...styles.miniBar, height: '55%', backgroundColor: '#FBCFE8' }} />
              <div style={{ ...styles.miniBar, height: '90%', backgroundColor: '#6366F1' }} />
            </div>
          </div>

          {/* Feature 6: Group Collaboration */}
          <div style={styles.featureCard} className="premium-feature-card">
            <div style={styles.featureIcon} className="feature-icon-wrapper">🤝</div>
            <h3 style={styles.featureCardTitle}>Group Collaboration</h3>
            <p style={styles.featureCardDesc}>
              Work with friends, teams, and study groups.
            </p>
            {/* Mini Visual Preview */}
            <div style={{ ...styles.cardMiniPreview, justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              <div style={styles.miniAvatarGroup}>
                <div style={{ ...styles.miniAvatar, backgroundColor: '#A78BFA', zIndex: 3 }}>AP</div>
                <div style={{ ...styles.miniAvatar, backgroundColor: '#FBCFE8', zIndex: 2, marginLeft: '-8px' }}>JD</div>
                <div style={{ ...styles.miniAvatar, backgroundColor: '#6366F1', zIndex: 1, marginLeft: '-8px' }}>SM</div>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#2D2A3A', marginLeft: '6px' }}>Cozy Lab (3)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- LARGE INTERACTIVE WORKSPACE PREVIEW ----------------- */}
      <section id="workspace" style={styles.workspaceSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Understand FocusNest in Seconds</h2>
          <p style={styles.sectionSubtitle}>
            Click on task cards to shift progress, claim group tasks, or let the AI optimize your daily workflow layout.
          </p>
        </div>

        <div style={styles.workspaceWindow} className="product-window shadow-premium workspace-preview-glow">
          {/* Simulated Browser Bar */}
          <div style={styles.workspaceWindowHeader}>
            <div style={styles.dotGroup}>
              <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
              <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
              <div style={{ ...styles.dot, backgroundColor: '#E5E7EB', border: '1px solid #D1D5DB' }} />
            </div>
            <div style={styles.workspaceBrowserPath}>
              <span>FocusNest Studio Cockpit</span>
              <span style={{ margin: '0 8px', color: '#A78BFA' }}>/</span>
              <span style={{ fontWeight: 650, color: '#2D2A3A' }}>interactive-preview.nest</span>
            </div>
            <div style={{ width: '48px' }} />
          </div>

          {/* Simulated Cockpit Body Grid */}
          <div style={styles.workspaceWindowBody} className="workspace-body-responsive">
            
            {/* Left Col: Kanban Lanes */}
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2D2A3A' }}>📋 Interactive Kanban Board</span>
                <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Click task to move lanes ⚡</span>
              </div>

              <div style={styles.previewKanbanGrid} className="preview-kanban-responsive">
                {/* Planned Column */}
                <div style={styles.kanbanColumn}>
                  <span style={styles.kanbanColHeader}>Planned ({tasks.filter((t) => t.column === 'planned').length})</span>
                  <div style={styles.kanbanCardList}>
                    {tasks
                      .filter((t) => t.column === 'planned')
                      .map((task) => (
                        <div
                          key={task.id}
                          style={styles.taskCard}
                          onClick={() => shiftTaskColumn(task.id)}
                          className="clickable-task-card"
                        >
                          <div style={styles.taskCardHeader}>
                            <span style={{ ...styles.categoryBadge, backgroundColor: '#FDF2F8', color: '#DB2777' }}>
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#A78BFA', fontWeight: 600 }}>Shift ⚡</span>
                          </div>
                          <p style={styles.taskCardText}>{task.text}</p>
                          <span style={styles.taskCardTime}>⏱️ {task.timeEstimate}</span>
                        </div>
                      ))}
                    {tasks.filter((t) => t.column === 'planned').length === 0 && (
                      <div style={styles.kanbanEmptyText}>No planned items</div>
                    )}
                  </div>
                </div>

                {/* Progress Column */}
                <div style={styles.kanbanColumn}>
                  <span style={styles.kanbanColHeader}>In Progress ({tasks.filter((t) => t.column === 'progress').length})</span>
                  <div style={styles.kanbanCardList}>
                    {tasks
                      .filter((t) => t.column === 'progress')
                      .map((task) => (
                        <div
                          key={task.id}
                          style={styles.taskCard}
                          onClick={() => shiftTaskColumn(task.id)}
                          className="clickable-task-card"
                        >
                          <div style={styles.taskCardHeader}>
                            <span style={{ ...styles.categoryBadge, backgroundColor: '#E8E5F7', color: '#5C3EAD' }}>
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#6366F1', fontWeight: 600 }}>Shift ⚡</span>
                          </div>
                          <p style={styles.taskCardText}>{task.text}</p>
                          <span style={styles.taskCardTime}>⏱️ {task.timeEstimate}</span>
                        </div>
                      ))}
                    {tasks.filter((t) => t.column === 'progress').length === 0 && (
                      <div style={styles.kanbanEmptyText}>No active items</div>
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div style={styles.kanbanColumn}>
                  <span style={styles.kanbanColHeader}>Completed ({tasks.filter((t) => t.column === 'completed').length})</span>
                  <div style={styles.kanbanCardList}>
                    {tasks
                      .filter((t) => t.column === 'completed')
                      .map((task) => (
                        <div
                          key={task.id}
                          style={{ ...styles.taskCard, opacity: 0.8 }}
                          onClick={() => shiftTaskColumn(task.id)}
                          className="clickable-task-card"
                        >
                          <div style={styles.taskCardHeader}>
                            <span style={{ ...styles.categoryBadge, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '0.68rem', color: '#9CA3AF', fontWeight: 600 }}>Reset 🔄</span>
                          </div>
                          <p style={{ ...styles.taskCardText, textDecoration: 'line-through', color: '#9CA3AF' }}>{task.text}</p>
                          <span style={styles.taskCardTime}>✓ Completed</span>
                        </div>
                      ))}
                    {tasks.filter((t) => t.column === 'completed').length === 0 && (
                      <div style={styles.kanbanEmptyText}>No completed items</div>
                    )}
                  </div>
                </div>
              </div>

              {/* DEDICATED GROUP COLLABORATION PANEL - Real-time shared focus sessions */}
              <div style={styles.groupCollaborationPanel} className="workspace-preview-glow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.1rem' }}>👥</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#2D2A3A' }}>Cozy Library (Team Room)</span>
                    <span style={{ fontSize: '0.68rem', backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 6px', borderRadius: '4px', fontWeight: 650 }}>
                      Active Study
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>⚡ Shared Focus Sync</span>
                </div>

                <div style={styles.groupWorkspaceGrid} className="group-workspace-responsive">
                  {/* Members List */}
                  <div style={styles.groupMembersCol}>
                    <span style={styles.groupSubTitle}>Active Peers</span>
                    <div style={styles.membersList}>
                      {groupMembers.map((member, index) => (
                        <div key={index} style={styles.memberRow} className="member-hover">
                          <div style={{ ...styles.memberAvatar, backgroundColor: member.avatarBg }}>
                            {member.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={styles.memberNameText}>{member.name}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ ...styles.memberStatusIndicator, backgroundColor: member.status === 'Focusing' ? '#A78BFA' : '#FBCFE8' }} />
                              <span style={styles.memberTimerText}>{member.timerStr}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shared Team Tasks */}
                  <div style={styles.groupTasksCol}>
                    <span style={styles.groupSubTitle}>Shared Focus Tickets</span>
                    <div style={styles.groupTasksList}>
                      {sharedTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleSharedTaskStatus(task.id)}
                          style={{
                            ...styles.sharedTaskRow,
                            borderLeftColor: task.status === 'Done' ? '#DCFCE7' : '#A78BFA',
                          }}
                          className="clickable-task-card"
                        >
                          <div style={{ display: 'flex', justifyItems: 'center', gap: '8px', flex: 1 }}>
                            <input
                              type="checkbox"
                              checked={task.status === 'Done'}
                              readOnly
                              style={{ accentColor: '#A78BFA', cursor: 'pointer' }}
                            />
                            <span
                              style={{
                                ...styles.sharedTaskName,
                                textDecoration: task.status === 'Done' ? 'line-through' : 'none',
                                color: task.status === 'Done' ? '#9CA3AF' : '#2D2A3A',
                              }}
                            >
                              {task.taskName}
                            </span>
                          </div>
                          <span style={styles.claimedBadge}>Claimed by {task.claimedBy}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Focus Timer & Strengthened AI Scheduling Assistant */}
            <div style={{ flex: 0.8, display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Pomodoro Session Block */}
              <div style={styles.previewWidgetBox} className="workspace-preview-glow">
                {/* Floating cozy sticky note with rotation hover interaction */}
                <div style={styles.innerStickyNote} className="cozy-rotate-right-small mini-sticky-note-hover">
                  <span>📌 Note</span>
                  <p style={{ margin: '3px 0 0 0', fontSize: '0.72rem', fontWeight: 650 }}>5m tea break next! 🍵</p>
                </div>

                <span style={styles.previewWidgetHeader}>⏱️ Focus Timer Session</span>
                <div style={styles.interactiveTimerRow}>
                  <div style={styles.timerDisplayCircle}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(251, 207, 232, 0.3)" strokeWidth="6" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="#A78BFA"
                        strokeWidth="6"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - getProgressPercentage() / 100)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                      />
                    </svg>
                    <div style={styles.timerCenterText}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={styles.timerModeSelector}>
                      <button
                        style={timerMode === 'pomodoro' ? styles.timerModeBtnActive : styles.timerModeBtn}
                        onClick={() => setTimerMode('pomodoro')}
                      >
                        Pomodoro
                      </button>
                      <button
                        style={timerMode === 'short' ? styles.timerModeBtnActive : styles.timerModeBtn}
                        onClick={() => setTimerMode('short')}
                      >
                        Break
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        style={timerRunning ? styles.btnTimerControlPause : styles.btnTimerControlStart}
                        onClick={toggleTimer}
                        className="btn-scale"
                      >
                        {timerRunning ? 'Pause' : 'Start Focus'}
                      </button>
                      <button style={styles.btnTimerControlReset} onClick={resetTimer} className="btn-scale">
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengthened AI Scheduler & Realistic Generated Daily Schedule */}
              <div style={{ ...styles.previewWidgetBox, border: '1px solid #A78BFA', backgroundColor: '#FAF9FC' }} className="workspace-preview-glow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ ...styles.previewWidgetHeader, color: '#6366F1' }}>🤖 FocusNest Scheduler AI</span>
                  <button
                    onClick={runAiTriage}
                    disabled={aiAnalysisActive}
                    style={styles.btnAiAnalyze}
                    className="btn-scale"
                  >
                    {aiAnalysisActive ? 'Optimizing...' : 'Optimize Daily'}
                  </button>
                </div>
                <div style={styles.aiTriageDisplayBox}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#2D2A3A', lineHeight: 1.45 }}>
                    {aiMessage}
                  </p>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4B5563', display: 'block', marginBottom: '8px' }}>
                    Generated Realistic Daily Schedule
                  </span>
                  <div style={styles.scheduleRowContainer}>
                    {mockSchedule.map((item, index) => (
                      <div key={index} style={styles.scheduleTimelineRow}>
                        <span style={styles.scheduleTimeText}>{item.time}</span>
                        <div style={styles.scheduleItemLineDot} />
                        <div style={styles.scheduleItemContent}>
                          <span style={styles.scheduleItemName}>{item.activity}</span>
                          <span
                            style={{
                              ...styles.categoryBadge,
                              backgroundColor:
                                item.tag === 'Focus'
                                  ? '#E8E5F7'
                                  : item.tag === 'Sync'
                                  ? '#DCFCE7'
                                  : item.tag === 'Rest'
                                  ? '#FEF9C3'
                                  : '#FDF2F8',
                              color:
                                item.tag === 'Focus'
                                  ? '#5C3EAD'
                                  : item.tag === 'Sync'
                                  ? '#15803D'
                                  : item.tag === 'Rest'
                                  ? '#854D0E'
                                  : '#DB2777',
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          >
                            {item.tag}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ----------------- WHY FOCUSNEST SECTION ----------------- */}
      <section id="about" style={styles.whySection}>
        <div style={styles.sectionHeader}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#6366F1', fontWeight: 700 }}>
            Quiet Efficiency
          </span>
          <h2 style={{ ...styles.sectionTitle, marginTop: '8px' }}>A unified workflow for deep work.</h2>
          <p style={{ ...styles.sectionSubtitle, maxWidth: '600px' }}>
            Manage tasks, focus sessions, AI schedules, analytics, and collaboration without switching between multiple apps.
          </p>
        </div>

        {/* Hand-written study setup sticky note element with rotate hover interaction */}
        <div style={styles.cozyFloatingStickyNote} className="cozy-rotate-right mini-sticky-note-hover">
          <span style={{ fontSize: '0.68rem', fontWeight: 750, color: '#854D0E' }}>🌿 desk tips</span>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', fontWeight: 650, color: '#854D0E' }}>
            Aesthetic layouts reduce cognitive friction! Keep your coffee warm. ☕
          </p>
        </div>

        <div style={styles.whyVisualBlock} className="why-grid-responsive">
          <div style={{ ...styles.whyVisualCard, gridColumn: 'span 2' }} className="premium-feature-card">
            <span style={{ ...styles.whyCardTitle, textAlign: 'center' }}>Cozy Minimalist Framework</span>
            <p style={{ ...styles.whyCardDesc, textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
              No dry corporate reports or spreadsheets. Enjoy a warm, soothing ambient atmosphere that supports prolonged creative study sprints, deep workload balancing, and synchronized collaboration logs. A digital desk crafted for creative professionals.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------- FINAL CTA SECTION ----------------- */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaVisualBlock} className="glass-card workspace-preview-glow">
          <h2 style={styles.ctaTitleText}>Ready to build your productivity system?</h2>
          <div style={styles.ctaButtonGroup} className="cta-group-responsive">
            <button style={{ ...styles.btnPrimary, padding: '14px 28px', fontSize: '1rem' }} className="btn-scale-primary" onClick={() => navigate('/signup')}>
              Create Account
            </button>
            <a href="#workspace" style={{ ...styles.btnSecondary, textDecoration: 'none', padding: '14px 28px', fontSize: '1rem' }} className="btn-scale-secondary">
              Explore Workspace
            </a>
          </div>
        </div>
      </section>

      {/* ----------------- MINIMAL FOOTER ----------------- */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerLeft}>
            <div style={styles.navBrand}>
              <svg style={{ ...styles.logoSvg, width: '28px', height: '28px' }} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="20" y="20" width="60" height="60" rx="14" fill="#FAF9F6" stroke="#2D2A3A" strokeWidth="6" />
                <rect x="36" y="36" width="28" height="28" rx="6" fill="#A78BFA" stroke="#2D2A3A" strokeWidth="3" />
              </svg>
              <span style={{ ...styles.brandName, fontSize: '1.1rem' }}>FocusNest</span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#6B7280' }}>
              Calm tools for focused teams.
            </p>
          </div>
          <div style={styles.footerLinks}>
            <a href="#features" style={styles.footerLink}>Features</a>
            <a href="#workspace" style={styles.footerLink}>Workspace</a>
            <a href="#about" style={styles.footerLink}>About</a>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF' }}>© 2026 FocusNest</span>
          </div>
        </div>
      </footer>

      {/* ----------------- PERSONAL SIGNATURE ----------------- */}
      <div style={styles.signatureContainer}>
        <span style={styles.signatureText} className="signature-hover-effect">
          With Love, Ananya ♡
        </span>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// React Style Definitions
// ----------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#FAF9F6', // Warm Cream
    color: '#2D2A3A', // Charcoal Text
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    position: 'relative',
  },
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(250, 249, 246, 0.9)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid #EBE7DF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 8%',
  },
  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
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
  navLinks: {
    display: 'flex',
    gap: '32px',
  },
  navLink: {
    textDecoration: 'none',
    color: '#6B7280',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  btnPrimary: {
    backgroundColor: '#A78BFA', // Lavender Primary
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(45, 42, 58, 0.05)',
  },
  btnSecondary: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '8px 18px',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  heroSection: {
    padding: '60px 8%',
    display: 'flex',
    justifyContent: 'center',
  },
  heroGrid: {
    maxWidth: '1160px',
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '48px',
    alignItems: 'center',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    position: 'relative',
    zIndex: 2,
  },
  heroTitle: {
    fontSize: 'clamp(2.2rem, 8vw, 4.2rem)',
    fontWeight: 850,
    color: '#2D2A3A',
    margin: '0 0 16px 0',
    letterSpacing: '-1.5px',
  },
  heroSub: {
    fontSize: '1.25rem',
    lineHeight: 1.55,
    color: '#4B5563',
    margin: '0 0 32px 0',
    maxWidth: '480px',
  },
  heroCtaGroup: {
    display: 'flex',
    gap: '12px',
  },
  heroRight: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    zIndex: 2,
  },
  heroMockupContainer: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: '#FAF9F6',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1.5px solid #EBE7DF',
  },
  mockupTitleBar: {
    backgroundColor: '#F5F3E9',
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #EBE7DF',
  },
  dotGroup: {
    display: 'flex',
    gap: '6px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  mockupPathText: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  heroMockupContent: {
    padding: '20px',
    display: 'flex',
    gap: '16px',
    minHeight: '220px',
    backgroundColor: '#FAF9F6',
  },
  heroMockupSubTitle: {
    fontSize: '0.78rem',
    fontWeight: 750,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '4px',
  },
  mockupStickyCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '10px',
    padding: '12px',
    boxShadow: '0 2px 4px rgba(45, 42, 58, 0.02)',
  },
  categoryBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  mockupCardText: {
    margin: '6px 0 0 0',
    fontSize: '0.8rem',
    fontWeight: 500,
    color: '#2D2A3A',
    lineHeight: 1.35,
  },
  mockupWidgetCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '10px',
    padding: '12px',
  },
  widgetHeader: {
    fontSize: '0.72rem',
    fontWeight: 750,
    color: '#6B7280',
    display: 'block',
  },
  featuresSection: {
    padding: '60px 8%',
    backgroundColor: '#FAF9F6',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderTop: '1px solid #EBE7DF',
  },
  sectionHeader: {
    textAlign: 'center',
    maxWidth: '560px',
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#2D2A3A',
    letterSpacing: '-0.8px',
    margin: '0 0 12px 0',
  },
  sectionSubtitle: {
    fontSize: '1rem',
    color: '#6B7280',
    lineHeight: 1.5,
    margin: 0,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: '24px',
    maxWidth: '1080px',
    width: '100%',
  },
  featureCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 10px rgba(45, 42, 58, 0.01)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: '1.4rem',
    marginBottom: '16px',
  },
  featureCardTitle: {
    fontSize: '1.1rem',
    fontWeight: 750,
    color: '#2D2A3A',
    margin: '0 0 8px 0',
  },
  featureCardDesc: {
    fontSize: '0.88rem',
    lineHeight: 1.45,
    color: '#6B7280',
    margin: '0 0 16px 0',
  },
  cardMiniPreview: {
    backgroundColor: '#F5F3E9',
    width: '100%',
    height: '60px',
    borderRadius: '8px',
    border: '1px solid #EBE7DF',
    padding: '8px',
    display: 'flex',
    gap: '8px',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  miniKanbanCol: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    borderRadius: '4px',
    padding: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  miniPill: {
    height: '6px',
    borderRadius: '3px',
  },
  miniTimerBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FAF9F6',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #EBE7DF',
  },
  miniChatBubbleLeft: {
    backgroundColor: '#E8E5F7',
    color: '#5C3EAD',
    fontSize: '0.62rem',
    fontWeight: 600,
    padding: '4px 6px',
    borderRadius: '6px 6px 6px 0px',
    alignSelf: 'flex-start',
    maxWidth: '70%',
  },
  miniChatBubbleRight: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    fontSize: '0.62rem',
    fontWeight: 600,
    padding: '4px 6px',
    borderRadius: '6px 6px 0px 6px',
    alignSelf: 'flex-end',
    border: '1px solid #EBE7DF',
    maxWidth: '70%',
    marginLeft: 'auto',
  },
  miniScheduleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '100%',
  },
  miniBar: {
    width: '10px',
    borderRadius: '2px 2px 0 0',
  },
  miniAvatarGroup: {
    display: 'flex',
    alignItems: 'center',
  },
  miniAvatar: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    fontSize: '0.55rem',
    fontWeight: 'bold',
    color: '#FAF9F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #FAF9F6',
  },
  workspaceSection: {
    backgroundColor: '#FAF9F6',
    padding: '60px 8%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderTop: '1px solid #EBE7DF',
    position: 'relative',
  },
  workspaceWindow: {
    width: '100%',
    maxWidth: '1080px',
    backgroundColor: '#FAF9F6',
    borderRadius: '16px',
    overflow: 'hidden',
    border: '1.5px solid #EBE7DF',
    position: 'relative',
    zIndex: 2,
  },
  workspaceWindowHeader: {
    backgroundColor: '#F5F3E9',
    padding: '10px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5px solid #EBE7DF',
  },
  workspaceBrowserPath: {
    fontSize: '0.78rem',
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  workspaceWindowBody: {
    padding: '24px',
    display: 'flex',
    gap: '24px',
    minHeight: '420px',
    backgroundColor: '#FAF9F6',
  },
  previewKanbanGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px',
  },
  kanbanColumn: {
    backgroundColor: '#F5F3E9',
    borderRadius: '12px',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '320px',
    border: '1.5px solid #EBE7DF',
  },
  kanbanColHeader: {
    fontSize: '0.82rem',
    fontWeight: 750,
    color: '#4B5563',
  },
  kanbanCardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  taskCard: {
    backgroundColor: '#FAF9F6',
    borderRadius: '8px',
    padding: '12px',
    border: '1.5px solid #EBE7DF',
    boxShadow: '0 2px 4px rgba(45, 42, 58, 0.01)',
  },
  taskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  taskCardText: {
    margin: '0 0 8px 0',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#2D2A3A',
    lineHeight: 1.35,
  },
  taskCardTime: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
  },
  kanbanEmptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: '0.78rem',
    fontStyle: 'italic',
    padding: '24px 0',
  },
  groupCollaborationPanel: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 6px rgba(45, 42, 58, 0.01)',
    marginTop: '12px',
  },
  groupWorkspaceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '16px',
  },
  groupMembersCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  groupSubTitle: {
    fontSize: '0.75rem',
    fontWeight: 750,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  memberRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#F5F3E9',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid #EBE7DF',
  },
  memberAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: '#FAF9F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNameText: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#2D2A3A',
  },
  memberStatusIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  memberTimerText: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  groupTasksCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  groupTasksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sharedTaskRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    border: '1px solid #EBE7DF',
    borderLeftWidth: '3px',
    borderRadius: '6px',
    padding: '6px 10px',
  },
  sharedTaskName: {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  claimedBadge: {
    fontSize: '0.62rem',
    backgroundColor: '#E8E5F7',
    color: '#5C3EAD',
    padding: '1px 6px',
    borderRadius: '4px',
    fontWeight: 650,
  },
  previewWidgetBox: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 6px rgba(45, 42, 58, 0.01)',
    position: 'relative',
  },
  previewWidgetHeader: {
    fontSize: '0.82rem',
    fontWeight: 750,
    color: '#4B5563',
    display: 'block',
    marginBottom: '10px',
  },
  interactiveTimerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  timerDisplayCircle: {
    position: 'relative',
    width: '100px',
    height: '100px',
  },
  timerCenterText: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100px',
    height: '100px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerModeSelector: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#F5F3E9',
    padding: '2px',
    borderRadius: '6px',
    border: '1px solid #EBE7DF',
  },
  timerModeBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 0',
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#6B7280',
    cursor: 'pointer',
    outline: 'none',
  },
  timerModeBtnActive: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 0',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#2D2A3A',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    cursor: 'pointer',
    outline: 'none',
  },
  btnTimerControlStart: {
    flex: 1.2,
    backgroundColor: '#A78BFA',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
  },
  btnTimerControlPause: {
    flex: 1.2,
    backgroundColor: '#FBCFE8',
    color: '#2D2A3A',
    border: '1px solid #2D2A3A',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
  },
  btnTimerControlReset: {
    flex: 0.8,
    backgroundColor: '#FAF9F6',
    color: '#4B5563',
    border: '1px solid #EBE7DF',
    borderRadius: '6px',
    padding: '8px 10px',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer',
    outline: 'none',
  },
  btnAiAnalyze: {
    backgroundColor: '#FAF9F6',
    color: '#6366F1',
    border: '1px solid #A78BFA',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.72rem',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
  },
  aiTriageDisplayBox: {
    backgroundColor: '#FAF9F6',
    border: '1px solid #EBE7DF',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  scheduleRowContainer: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  scheduleTimelineRow: {
    display: 'flex',
    gap: '12px',
    paddingBottom: '10px',
    alignItems: 'center',
  },
  scheduleTimeText: {
    fontSize: '0.7rem',
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#6366F1',
    width: '120px',
  },
  scheduleItemLineDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#A78BFA',
  },
  scheduleItemContent: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
    border: '1px solid #EBE7DF',
    padding: '6px 10px',
    borderRadius: '6px',
  },
  scheduleItemName: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#2D2A3A',
  },
  whySection: {
    padding: '60px 8%',
    backgroundColor: '#FAF9F6',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderTop: '1px solid #EBE7DF',
    position: 'relative',
  },
  whyVisualBlock: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    maxWidth: '820px',
    width: '100%',
    marginTop: '16px',
    position: 'relative',
    zIndex: 2,
  },
  whyVisualCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(45, 42, 58, 0.01)',
  },
  whyCardTitle: {
    fontSize: '1.15rem',
    fontWeight: 750,
    color: '#2D2A3A',
    display: 'block',
    marginBottom: '12px',
  },
  whyCardDesc: {
    fontSize: '0.9rem',
    lineHeight: 1.5,
    color: '#6B7280',
    margin: 0,
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
  innerStickyNote: {
    position: 'absolute',
    top: '-16px',
    right: '-24px',
    backgroundColor: '#FEF9C3',
    border: '1px solid #EAB308',
    borderRadius: '6px',
    padding: '6px 10px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
    color: '#854D0E',
    fontSize: '0.68rem',
    zIndex: 10,
    pointerEvents: 'none',
  },
  cozyFloatingStickyNote: {
    position: 'absolute',
    bottom: '40px',
    left: '48px',
    backgroundColor: '#FEF9C3',
    border: '1px solid #EAB308',
    borderRadius: '8px',
    padding: '12px',
    width: '160px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    zIndex: 10,
    pointerEvents: 'none',
  },
  ctaSection: {
    padding: '60px 8% 80px 8%',
    backgroundColor: '#FAF9F6',
    display: 'flex',
    justifyContent: 'center',
    position: 'relative',
  },
  ctaVisualBlock: {
    maxWidth: '720px',
    width: '100%',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '48px 32px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  ctaTitleText: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#2D2A3A',
    letterSpacing: '-0.8px',
    margin: '0 0 28px 0',
  },
  ctaButtonGroup: {
    display: 'flex',
    gap: '12px',
  },
  footer: {
    backgroundColor: '#FAF9F6',
    borderTop: '1px solid #EBE7DF',
    padding: '36px 8%',
  },
  footerInner: {
    maxWidth: '1080px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  footerLinks: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
  },
  footerLink: {
    fontSize: '0.82rem',
    color: '#6B7280',
    textDecoration: 'none',
  },
  signatureContainer: {
    padding: '0 0 40px 0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF9F6',
  },
  signatureText: {
    fontFamily: '"Caveat", "Dancing Script", cursive',
    fontSize: '1.05rem',
    color: '#FBCFE8',
    opacity: 0.65,
    cursor: 'pointer',
    userSelect: 'none',
    letterSpacing: '0.5px',
  },
};

// ----------------------------------------------------
// CSS Rules Injection: Micro-interactions & Gradients
// ----------------------------------------------------
const cleanInjectedStyles = `
/* Inter & Caveat Fonts Stack Injection */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@600&display=swap');

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

/* 6 Feature Cards Style: Transitions borders to sharp double-background gradient and interior blush pink tint */
.premium-feature-card {
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 300ms ease, 
              background-color 300ms ease,
              background 300ms ease;
  background-color: #FAF9F6;
  border: 1.5px solid #EBE7DF;
}
.premium-feature-card:hover {
  transform: translateY(-4px); /* Slight lift */
  box-shadow: 0 12px 24px -8px rgba(167, 139, 250, 0.08) !important; /* Stronger shadow */
  border-color: transparent !important;
  /* Double-background trick to change border to lavender-pink and background slightly to blush pink #FAF2F6 */
  background: linear-gradient(#FAF2F6, #FAF2F6) padding-box, 
              linear-gradient(135deg, #A78BFA, #FBCFE8) border-box !important;
}

/* Make icons in the cards slightly brighter on hover */
.premium-feature-card:hover .feature-icon-wrapper {
  filter: brightness(1.15);
  transform: scale(1.05);
}
.feature-icon-wrapper {
  transition: transform 300ms ease, filter 300ms ease;
}

/* Kanban card interactions: subtle glow and soft pink background change when hovered */
.clickable-task-card {
  cursor: pointer;
  transition: border-color 250ms ease, transform 200ms ease, box-shadow 250ms ease, background-color 250ms ease;
}
.clickable-task-card:hover {
  border-color: #FBCFE8 !important; /* Blush pink border */
  background-color: #FDF2F7 !important; /* Slight color change to soft cozy blush pink */
  transform: scale(1.015);
  box-shadow: 0 0 12px rgba(251, 207, 232, 0.35) !important;
}

/* Workspace preview elements: subtly glow when hovered */
.workspace-preview-glow {
  transition: border-color 300ms ease, box-shadow 300ms ease, transform 300ms ease;
}
.workspace-preview-glow:hover {
  border-color: #A78BFA !important;
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
.cozy-rotate-right-small {
  transform: rotate(4deg);
}
.cozy-rotate-right {
  transform: rotate(6deg);
}
.cozy-rotate-left:hover {
  transform: rotate(-4deg) scale(1.03) !important;
  box-shadow: 0 6px 12px rgba(0,0,0,0.04) !important;
}
.cozy-rotate-right-small:hover {
  transform: rotate(2deg) scale(1.03) !important;
  box-shadow: 0 6px 12px rgba(0,0,0,0.04) !important;
}
.cozy-rotate-right:hover {
  transform: rotate(4deg) scale(1.03) !important;
  box-shadow: 0 6px 12px rgba(0,0,0,0.04) !important;
}

/* Peer list hover effects */
.member-hover {
  transition: background-color 200ms ease, transform 150ms ease;
}
.member-hover:hover {
  background-color: #EBE7DF !important;
  transform: translateX(2px);
}

/* Mockup containers shadow standards */
.product-window {
  box-shadow: 0 20px 50px -15px rgba(45, 42, 58, 0.06);
}

.shadow-premium {
  box-shadow: 0 30px 70px -20px rgba(45, 42, 58, 0.08);
}

/* Glassmorphic border containers */
.glass-card {
  background-color: #FAF9F6;
  border: 1.5px solid #EBE7DF;
}

/* Responsive configurations */
@media (max-width: 1024px) {
  .hero-grid-responsive {
    grid-template-columns: 1fr !important;
    gap: 40px !important;
    text-align: center;
  }
  .heroLeft {
    align-items: center !important;
  }
  .heroTitle {
    font-size: 3.2rem !important;
  }
  .heroSub {
    font-size: 1.15rem !important;
  }
  .heroCtaGroup {
    justify-content: center !important;
  }
  .featuresGrid-responsive {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  .mockup-responsive-wrapper {
    width: 100% !important;
  }
  .heroMockupContainer {
    max-width: 100% !important;
  }
  .cozyFloatingStickyNote {
    display: none !important;
  }
  .pink-glow-blob {
    width: 280px !important;
    height: 280px !important;
  }
}

@media (max-width: 768px) {
  .navLinks {
    display: none !important;
  }
  .heroTitle {
    font-size: clamp(2rem, 8vw, 3.2rem) !important;
  }
  .cta-group-responsive {
    flex-direction: column !important;
    width: 100% !important;
    gap: 12px !important;
  }
  .cta-group-responsive button, .cta-group-responsive a {
    display: inline-flex !important;
    align-items: center;
    justify-content: center;
    min-height: 44px !important;
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }
  .features-grid-responsive {
    grid-template-columns: 1fr !important;
  }
  .preview-kanban-responsive {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  .workspace-body-responsive {
    flex-direction: column !important;
  }
  .why-grid-responsive {
    grid-template-columns: 1fr !important;
  }
  .group-workspace-responsive {
    grid-template-columns: 1fr !important;
    gap: 16px !important;
  }
  
  /* Touch Targets Safeguard */
  button, input, select, textarea, .btn-scale-primary, .btn-scale-secondary {
    min-height: 44px !important;
    box-sizing: border-box !important;
  }
  .footerInner {
    flex-direction: column !important;
    text-align: center;
    align-items: center !important;
  }
  .footerLeft {
    align-items: center !important;
  }
}

/* Personal Signature Styles */
.signature-hover-effect {
  display: inline-block;
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.signature-hover-effect:hover {
  opacity: 1 !important;
  color: #E879F9 !important; /* Slightly brighter lavender-pink color */
  transform: scale(1.06) !important; /* Tiny scale animation */
}
`;
export { styles };
