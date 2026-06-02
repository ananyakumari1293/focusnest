/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  writeBatch, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// FocusNest Custom Interfaces
interface Task {
  id: string;
  text: string;
  column: 'todo' | 'progress' | 'done';
  priority: 'High' | 'Medium' | 'Low';
  timeEstimate: string;
  type: 'Solo' | 'Group';
}

interface RoomMember {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export default function Workspace() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. FIRST-TIME USER PROTECTION: Redirect to /onboarding if not completed
  const isOnboardingComplete = localStorage.getItem('focusnest_onboarding_complete') === 'true';
  useEffect(() => {
    if (!isOnboardingComplete) {
      navigate('/onboarding');
    }
  }, [isOnboardingComplete, navigate]);

  // Reusable logout function for future integration (signOut from Firebase Auth)
  const handleLogout = async (): Promise<void> => {
    try {
      await signOut(auth);
      navigate('/signup');
    } catch (e) {
      console.error('Logout error', e);
      // Fallback redirect
      navigate('/signup');
    }
  };

  // Load Google Fonts for beautiful typography
  useEffect(() => {
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Caveat:wght@600&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    return () => {
      document.head.removeChild(fontLink);
    };
  }, []);

  // ----------------------------------------------------
  // Local Storage & State Initializations
  // ----------------------------------------------------
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('focusnest_username') || '';
  });

  const [role] = useState<string>(() => {
    return localStorage.getItem('focusnest_role') || '';
  });

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(username);

  // Initialize tasks from local storage - user-specific key
  const [tasks, setTasks] = useState<Task[]>(() => {
    const uid = localStorage.getItem('focusnest_uid') || 'default_user';
    const localKey = `focusnest_tasks_${uid}`;
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
      }
    }
    return []; // Start completely empty so visual empty state renders
  });

  // Load from Firestore asynchronously to fetch latest updates for this specific user
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('focusnest_uid');
    if (!uid) return;

    const loadFromFirestore = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users', uid, 'tasks'));
        const firestoreTasks: Task[] = [];
        querySnapshot.forEach((doc) => {
          firestoreTasks.push(doc.data() as Task);
        });
        
        if (firestoreTasks.length > 0) {
          setTasks(firestoreTasks);
          const localKey = `focusnest_tasks_${uid}`;
          localStorage.setItem(localKey, JSON.stringify(firestoreTasks));
        }
      } catch (err) {
        console.warn('Firestore fetch failed or not configured: ', err);
      }
    };

    loadFromFirestore();
  }, [user?.uid]);

  // Sync tasks to localStorage and Firestore when state changes
  useEffect(() => {
    const uid = user?.uid || localStorage.getItem('focusnest_uid');
    if (!uid) return;

    const localKey = `focusnest_tasks_${uid}`;
    localStorage.setItem(localKey, JSON.stringify(tasks));

    // Async Firestore update
    const syncToFirestore = async () => {
      try {
        const tasksColRef = collection(db, 'users', uid, 'tasks');
        const existingDocs = await getDocs(tasksColRef);
        
        const batch = writeBatch(db);
        
        // Delete all old tasks
        existingDocs.forEach((d) => {
          batch.delete(d.ref);
        });
        
        // Add new tasks
        tasks.forEach((task) => {
          const taskDocRef = doc(tasksColRef, task.id);
          batch.set(taskDocRef, task);
        });
        
        await batch.commit();
      } catch (err) {
        console.warn('Firestore sync failed or not configured: ', err);
      }
    };

    syncToFirestore();
  }, [tasks, user?.uid]);

  // Pomodoro Timer States
  const [timerMode, setTimerMode] = useState<'pomodoro' | 'short' | 'long'>('pomodoro');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [totalDuration, setTotalDuration] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);

  // Focus duration preference (in minutes) loaded from local storage onboarding selection
  const [focusDurationPref, setFocusDurationPref] = useState<number>(() => {
    const saved = localStorage.getItem('focusnest_focus_duration') ||
                  localStorage.getItem('focusnest_timer_preference');
    return saved ? parseInt(saved, 10) : 25; // Default is 25m
  });

  // Custom Minutes Input
  const [customMinsInput, setCustomMinsInput] = useState<string>('60');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);

  // Mobile active Kanban column toggle state
  const [activeMobileColumn, setActiveMobileColumn] = useState<'todo' | 'progress' | 'done'>('todo');

  // Celebration Modal States
  const [isCelebrationOpen, setIsCelebrationOpen] = useState<boolean>(false);
  const [celebratedMinutes, setCelebratedMinutes] = useState<number>(0);

  // Sync Timer duration preference to Local Storage focus duration key
  useEffect(() => {
    localStorage.setItem('focusnest_focus_duration', focusDurationPref.toString());
  }, [focusDurationPref]);

  // Sync Timer state & Preferences to Local Storage
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('focusnest_streak');
    return saved ? parseInt(saved, 10) : 3; // Default starting streak
  });

  const [focusMinutes, setFocusMinutes] = useState<number>(() => {
    const saved = localStorage.getItem('focusnest_focus_minutes');
    return saved ? parseInt(saved, 10) : 50; // Default starting minutes
  });

  useEffect(() => {
    localStorage.setItem('focusnest_streak', streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem('focusnest_focus_minutes', focusMinutes.toString());
  }, [focusMinutes]);

  // Lofi Vinyl Deck States
  const [isPlayingLofi, setIsPlayingLofi] = useState<boolean>(false);
  const [selectedTrack, setSelectedTrack] = useState<number>(0);
  const lofiTracks = [
    { title: 'Cozy Rain Cafe ☕', desc: 'Soft rain, acoustic piano, quiet hubbub' },
    { title: 'Starlit Desk 🌌', desc: 'Dreamy synth pads, slow vinyl crackle' },
    { title: 'Greenhouse Study 🌿', desc: 'Chill beats, forest sounds, bird chirps' }
  ];

  // Floating Add Task Panel State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState<boolean>(false);
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskTime, setNewTaskTime] = useState<string>('25m');
  const [newTaskType, setNewTaskType] = useState<'Solo' | 'Group'>('Solo');

  // Drag & Drop visual states
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<'todo' | 'progress' | 'done' | null>(null);

  // Daily Motivation Quotes
  const [motivationQuote] = useState<string>(() => {
    const quotes = [
      '✨ Small progress is still progress.',
      '🌿 Focus gently, not perfectly.',
      '☕ One task at a time.',
      '🌸 You are building a wonderful workspace.',
      '🧸 Rest is a beautiful part of productivity.'
    ];
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  });

  // Current Date display
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  function handleTimerComplete(): void {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerRunning(false);

    // Dynamic stats updates
    const completedSessionMins = timerMode === 'pomodoro' ? focusDurationPref : timerMode === 'short' ? 5 : 15;
    setFocusMinutes((prev) => prev + completedSessionMins);

    // Record minutes completed for celebration modal display
    setCelebratedMinutes(completedSessionMins);

    // If it was a focus session, increment streak count
    if (timerMode === 'pomodoro') {
      setStreak((prev) => prev + 1);
    }

    // Open premium custom celebration modal (Do NOT use alert())
    setIsCelebrationOpen(true);
  }

  // ----------------------------------------------------
  // Timer Logic
  // ----------------------------------------------------
  useEffect(() => {
    let duration = 25 * 60;
    if (timerMode === 'pomodoro') {
      duration = focusDurationPref * 60;
    } else if (timerMode === 'short') {
      duration = 5 * 60;
    } else if (timerMode === 'long') {
      duration = 15 * 60;
    }

    setTimeLeft(duration);
    setTotalDuration(duration);
    setTimerRunning(false);
  }, [timerMode, focusDurationPref]);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
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
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);


  const toggleTimer = (): void => {
    setTimerRunning(!timerRunning);
  };

  const resetTimer = (): void => {
    setTimerRunning(false);
    let duration = 25 * 60;
    if (timerMode === 'pomodoro') {
      duration = focusDurationPref * 60;
    } else if (timerMode === 'short') {
      duration = 5 * 60;
    } else if (timerMode === 'long') {
      duration = 15 * 60;
    }
    setTimeLeft(duration);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Custom duration setter
  const handleApplyCustomDuration = (): void => {
    const mins = parseInt(customMinsInput, 10);
    if (isNaN(mins) || mins < 5 || mins > 240) {
      alert("Please enter a custom duration between 5 and 240 minutes. 🌸");
      return;
    }
    setFocusDurationPref(mins);
    setShowCustomInput(false);
  };

  // Circular progress stroke calculation (radius = 85, circumference = 2 * PI * 85 ~ 534)
  const circleRadius = 85;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressPercent = totalDuration > 0 ? timeLeft / totalDuration : 1;
  const strokeDashoffset = circleCircumference - (circleCircumference * progressPercent);
  const remainingPercentage = Math.round(progressPercent * 100);

  const getTimerColor = (): string => {
    if (timerMode === 'pomodoro') return '#F8C8DC'; // Blush Pink
    if (timerMode === 'short') return '#A8D5BA'; // Sage Green
    return '#FCE38A'; // Soft Yellow
  };

  const getTimerContextMessage = (): string => {
    if (timerMode === 'pomodoro') return '✨ Deep focus time';
    if (timerMode === 'short') return '☕ Grab water and stretch';
    return '🌿 Recharge your mind';
  };

  // ----------------------------------------------------
  // HTML5 Drag and Drop Handlers
  // ----------------------------------------------------
  const handleDragStart = (e: React.DragEvent, taskId: string): void => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, column: 'todo' | 'progress' | 'done'): void => {
    e.preventDefault();
    if (dragOverColumn !== column) {
      setDragOverColumn(column);
    }
  };

  const handleDragLeave = (): void => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumn: 'todo' | 'progress' | 'done'): void => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    setDragOverColumn(null);
    setDraggingTaskId(null);

    if (!taskId) return;

    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, column: targetColumn };
        }
        return t;
      });
      return updatedTasks;
    });
  };

  const handleDragEnd = (): void => {
    setDraggingTaskId(null);
    setDragOverColumn(null);
  };

  // ----------------------------------------------------
  // Task Actions (Create, Delete)
  // ----------------------------------------------------
  const handleAddTaskSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      column: 'todo',
      priority: newTaskPriority,
      timeEstimate: newTaskTime,
      type: newTaskType
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskPriority('Medium');
    setNewTaskTime('25m');
    setNewTaskType('Solo');
    setIsAddTaskOpen(false);
  };

  const deleteTask = (taskId: string): void => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ----------------------------------------------------
  // AI Suggestions Interaction
  // ----------------------------------------------------
  const handleAiAction = (actionType: 'prioritize' | 'schedule' | 'pomodoro' | 'organize'): void => {
    if (actionType === 'prioritize') {
      // Sort tasks by priority: High -> Medium -> Low inside columns
      setTasks((prev) => {
        const sorted = [...prev].sort((a, b) => {
          const priorityMap = { High: 3, Medium: 2, Low: 1 };
          return priorityMap[b.priority] - priorityMap[a.priority];
        });
        return sorted;
      });
      alert('FocusNest AI ✨ sorted your board! High Priority (Blush Pink) tasks are now at the top of their columns.');
    } else if (actionType === 'pomodoro') {
      setTimerMode('pomodoro');
      resetTimer();
      alert('FocusNest AI ✨ activated a 25-minute Pomodoro session for you. Press Start to focus!');
    } else if (actionType === 'schedule') {
      alert('FocusNest AI ✨ recommends blocking 10:00 AM - 12:00 PM for deep focus work. Break up tasks into smaller chunks.');
    } else if (actionType === 'organize') {
      setStreak((prev) => prev + 1); // Increments and uses streak set safely
      alert(`FocusNest AI ✨ has organized a structured study block. Streak secured (+1 day)! Keep up the beautiful momentum.`);
    }
  };

  const [inviteFeedback, setInviteFeedback] = useState<boolean>(false);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    return localStorage.getItem('focusnest_active_room_id');
  });
  const [roomMembers, setRoomMembers] = useState<RoomMember[]>([]);
  const [roomOwnerUid, setRoomOwnerUid] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string>('');

  // 1. Real-time study room listener
  useEffect(() => {
    if (!activeRoomId) {
      setRoomMembers([]);
      setRoomOwnerUid(null);
      setRoomName('');
      return;
    }

    let unsubscribe = () => {};

    const listenToRoom = () => {
      try {
        unsubscribe = onSnapshot(doc(db, 'studyRooms', activeRoomId), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setRoomMembers(data.members || []);
            setRoomOwnerUid(data.ownerUid || null);
            setRoomName(data.roomName || '');
          } else {
            // Room deleted/no longer exists
            setActiveRoomId(null);
            localStorage.removeItem('focusnest_active_room_id');
          }
        });
      } catch (e) {
        console.warn('Real-time study room listener error: ', e);
      }
    };

    listenToRoom();

    return () => unsubscribe();
  }, [activeRoomId]);

  // 2. Room actions
  const handleCreateStudyRoom = async (): Promise<void> => {
    if (!user) return;
    const randId = Math.random().toString(36).substring(2, 7);
    const generatedRoomId = `cozy-${randId}`;

    try {
      const defaultName = user.displayName || localStorage.getItem('focusnest_name') || 'Study Buddy';
      const defaultAvatar = user.photoURL || localStorage.getItem('focusnest_avatar') || '';

      const roomData = {
        ownerUid: user.uid,
        roomName: `${defaultName}'s Cozy Study Room`,
        createdAt: new Date().toISOString(),
        members: [{
          uid: user.uid,
          displayName: defaultName,
          photoURL: defaultAvatar,
          email: user.email || ''
        }]
      };

      await setDoc(doc(db, 'studyRooms', generatedRoomId), roomData);
      
      localStorage.setItem('focusnest_active_room_id', generatedRoomId);
      setActiveRoomId(generatedRoomId);
      navigate(`/room/${generatedRoomId}`);
    } catch (e) {
      console.error('Failed to create study room', e);
      alert('🌸 Setup issue. Please check your network or try again.');
    }
  };

  const handleLeaveRoom = async (): Promise<void> => {
    if (!user || !activeRoomId) return;

    try {
      const roomRef = doc(db, 'studyRooms', activeRoomId);
      const roomSnap = await getDoc(roomRef);

      if (roomSnap.exists()) {
        const data = roomSnap.data();
        const updatedMembers = (data.members || []).filter((m: RoomMember) => m.uid !== user.uid);
        
        await updateDoc(roomRef, {
          members: updatedMembers
        });
      }

      localStorage.removeItem('focusnest_active_room_id');
      setActiveRoomId(null);
      setRoomMembers([]);
    } catch (e) {
      console.error('Failed to leave room', e);
      // Clean up local cache anyway
      localStorage.removeItem('focusnest_active_room_id');
      setActiveRoomId(null);
      setRoomMembers([]);
    }
  };

  const handleCopyInviteLink = (): void => {
    if (!activeRoomId) return;
    setInviteFeedback(true);
    const inviteLink = `${window.location.origin}/join/${activeRoomId}`;
    navigator.clipboard.writeText(inviteLink);
    setTimeout(() => {
      setInviteFeedback(false);
    }, 3000);
  };

  // Save edited username
  const handleSaveUsername = (): void => {
    if (nameInput.trim()) {
      setUsername(nameInput.trim());
      localStorage.setItem('focusnest_username', nameInput.trim());
    }
    setIsEditingName(false);
  };

  // Calculated Real Analytics (No Fake Data)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.column === 'done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const pendingTasksCount = tasks.filter((t) => t.column !== 'done').length;

  // First-time user protection render guard
  if (!isOnboardingComplete) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Visual CSS Injector */}
      <style dangerouslySetInnerHTML={{ __html: workspaceStyles }} />

      {/* Cozy ambient background glow blobs in the background */}
      <div className="pink-glow-blob" style={{ top: '8%', left: '5%' }} />
      <div className="lavender-glow-blob" style={{ bottom: '15%', right: '8%' }} />

      {/* ================= HEADER SECTION ================= */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.logoGroup} onClick={() => navigate('/')}>
            <svg style={styles.logoSvg} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="#FFFDF8" stroke="#2D2A3A" strokeWidth="6" />
              <path d="M 28,60 C 28,40 50,22 50,22 C 50,22 72,40 72,60 C 72,70 62,78 50,78 C 38,78 28,70 28,60 Z" fill="#F8C8DC" stroke="#2D2A3A" strokeWidth="5" />
              <circle cx="50" cy="52" r="10" fill="#B794F6" stroke="#2D2A3A" strokeWidth="4" />
            </svg>
            <span style={styles.logoText}>FocusNest</span>
          </div>

          <div style={styles.welcomeBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isEditingName ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={handleSaveUsername}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                    autoFocus
                    style={styles.nameEditInput}
                  />
                  <button onClick={handleSaveUsername} style={styles.saveNameBtn}>✓</button>
                </div>
              ) : (
                <h1 style={styles.welcomeTitle}>
                  {username ? `Welcome back, ${username} 🌸` : 'Welcome to FocusNest 🌸'}
                  {role && (
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      backgroundColor: '#E8E5F7',
                      color: '#5C3EAD',
                      border: '1px solid #DDD6FE',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      marginLeft: '10px',
                      display: 'inline-block',
                      verticalAlign: 'middle'
                    }}>
                      🎓 {role}
                    </span>
                  )}
                  <span 
                    onClick={() => { setNameInput(username); setIsEditingName(true); }} 
                    style={styles.editPenIcon} 
                    title="Change Name"
                  >
                    ✎
                  </span>
                </h1>
              )}
            </div>
            <p style={styles.welcomeSubtitle}>Let's build momentum today. One soft step at a time.</p>
          </div>
        </div>

        <div style={styles.headerRight}>
          <div style={styles.dateBlock} className="glass-card shadow-soft">
            <span style={styles.dateLabel}>📅 {currentDateStr}</span>
            <div style={styles.motivationLabel}>
              <span className="sparkle-spark">{motivationQuote}</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} className="btn-scale-secondary">
            ☕ Sign Out
          </button>
        </div>
      </header>

      {/* ================= MAIN DASHBOARD DESK GRID ================= */}
      <main style={styles.mainGrid} className="workspace-main-responsive">
        
        {/* ================= LEFT SIDE: KANBAN BOARD ================= */}
        <section style={styles.columnKanban} className="kanban-board-panel glass-card shadow-premium desk-panel">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>🌸 Focus Desk Board</h2>
            <button 
              onClick={() => setIsAddTaskOpen(true)} 
              className="btn-scale-primary" 
              style={styles.addTaskBtn}
            >
              + Add Task
            </button>
          </div>

          <div style={styles.deskInstructions}>
            💡 <span>Drag and drop tasks between columns to manage your focus desk workflow.</span>
          </div>

          {/* Premium Mobile Kanban Tabs */}
          <div className="mobile-kanban-tabs" style={styles.mobileKanbanTabs}>
            <button 
              type="button"
              onClick={() => setActiveMobileColumn('todo')}
              style={{
                ...styles.mobileTabBtn,
                ...(activeMobileColumn === 'todo' ? styles.mobileTabBtnActiveTodo : {})
              }}
            >
              🌸 To Do
            </button>
            <button 
              type="button"
              onClick={() => setActiveMobileColumn('progress')}
              style={{
                ...styles.mobileTabBtn,
                ...(activeMobileColumn === 'progress' ? styles.mobileTabBtnActiveProgress : {})
              }}
            >
              ☁️ In Progress
            </button>
            <button 
              type="button"
              onClick={() => setActiveMobileColumn('done')}
              style={{
                ...styles.mobileTabBtn,
                ...(activeMobileColumn === 'done' ? styles.mobileTabBtnActiveDone : {})
              }}
            >
              🌿 Completed
            </button>
          </div>

          <div style={styles.kanbanColumnsContainer} className="kanban-columns-responsive">
            
            {/* COLUMN: TO DO */}
            <div 
              className={`kanban-column-dropzone kanban-column-todo ${dragOverColumn === 'todo' ? 'dragover' : ''} ${activeMobileColumn === 'todo' ? 'mobile-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'todo')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'todo')}
              style={styles.kanbanColumn}
            >
              <div style={styles.columnHeader}>
                <span style={styles.columnHeaderBadgePink}>🌸 To Do</span>
                <span style={styles.columnCountBadge}>
                  {tasks.filter((t) => t.column === 'todo').length}
                </span>
              </div>

              <div style={styles.tasksContainer}>
                {tasks.filter((t) => t.column === 'todo').length === 0 ? (
                  <div style={styles.emptyColumnPlaceholder}>
                    <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '4px' }}>✨</span>
                    No tasks planned.
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.column === 'todo')
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`task-draggable-card ${draggingTaskId === task.id ? 'dragging' : ''}`}
                        style={styles.taskCard}
                      >
                        <div style={styles.taskCardHeader}>
                          <span style={{
                            ...styles.priorityBadge,
                            ...styles[`priority_${task.priority}`]
                          }}>{task.priority}</span>
                          <span style={styles.typeBadge}>
                            {task.type === 'Solo' ? '👤 Solo' : '👥 Group'}
                          </span>
                        </div>
                        <p style={styles.taskText}>{task.text}</p>
                        <div style={styles.taskCardFooter}>
                          <span style={styles.timeTag}>⏱️ {task.timeEstimate}</span>
                          <button onClick={() => deleteTask(task.id)} style={styles.deleteTaskBtn} title="Remove Task">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* COLUMN: IN PROGRESS */}
            <div 
              className={`kanban-column-dropzone kanban-column-progress ${dragOverColumn === 'progress' ? 'dragover' : ''} ${activeMobileColumn === 'progress' ? 'mobile-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'progress')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'progress')}
              style={styles.kanbanColumn}
            >
              <div style={styles.columnHeader}>
                <span style={styles.columnHeaderBadgeYellow}>☁️ In Progress</span>
                <span style={styles.columnCountBadge}>
                  {tasks.filter((t) => t.column === 'progress').length}
                </span>
              </div>

              <div style={styles.tasksContainer}>
                {tasks.filter((t) => t.column === 'progress').length === 0 ? (
                  <div style={styles.emptyColumnPlaceholder}>
                    <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '4px' }}>☕</span>
                    Quiet focus space.
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.column === 'progress')
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`task-draggable-card ${draggingTaskId === task.id ? 'dragging' : ''}`}
                        style={styles.taskCard}
                      >
                        <div style={styles.taskCardHeader}>
                          <span style={{
                            ...styles.priorityBadge,
                            ...styles[`priority_${task.priority}`]
                          }}>{task.priority}</span>
                          <span style={styles.typeBadge}>
                            {task.type === 'Solo' ? '👤 Solo' : '👥 Group'}
                          </span>
                        </div>
                        <p style={styles.taskText}>{task.text}</p>
                        <div style={styles.taskCardFooter}>
                          <span style={styles.timeTag}>⏱️ {task.timeEstimate}</span>
                          <button onClick={() => deleteTask(task.id)} style={styles.deleteTaskBtn} title="Remove Task">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* COLUMN: DONE */}
            <div 
              className={`kanban-column-dropzone kanban-column-done ${dragOverColumn === 'done' ? 'dragover' : ''} ${activeMobileColumn === 'done' ? 'mobile-active' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'done')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'done')}
              style={styles.kanbanColumn}
            >
              <div style={styles.columnHeader}>
                <span style={styles.columnHeaderBadgeGreen}>🌿 Completed</span>
                <span style={styles.columnCountBadge}>
                  {tasks.filter((t) => t.column === 'done').length}
                </span>
              </div>

              <div style={styles.tasksContainer}>
                {tasks.filter((t) => t.column === 'done').length === 0 ? (
                  <div style={styles.emptyColumnPlaceholder}>
                    <span style={{ fontSize: '1.25rem', display: 'block', marginBottom: '4px' }}>🌱</span>
                    Complete tasks here!
                  </div>
                ) : (
                  tasks
                    .filter((t) => t.column === 'done')
                    .map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`task-draggable-card ${draggingTaskId === task.id ? 'dragging' : ''}`}
                        style={{
                          ...styles.taskCard,
                          opacity: 0.75,
                          textDecoration: 'line-through'
                        }}
                      >
                        <div style={styles.taskCardHeader}>
                          <span style={{
                            ...styles.priorityBadge,
                            ...styles[`priority_${task.priority}`]
                          }}>{task.priority}</span>
                          <span style={styles.typeBadge}>
                            {task.type === 'Solo' ? '👤 Solo' : '👥 Group'}
                          </span>
                        </div>
                        <p style={styles.taskText}>{task.text}</p>
                        <div style={styles.taskCardFooter}>
                          <span style={styles.timeTag}>⏱️ Completed</span>
                          <button onClick={() => deleteTask(task.id)} style={styles.deleteTaskBtn} title="Remove Task">
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

          </div>

          {/* Whole Board Empty State Warning */}
          {totalTasks === 0 && (
            <div style={styles.entirelyEmptyDeskCard}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}>🌸</span>
              <h3 style={styles.emptyDeskTitle}>Your desk is ready</h3>
              <p style={styles.emptyDeskText}>Add your first task and start building visual momentum on your cozy board.</p>
              <button 
                onClick={() => setIsAddTaskOpen(true)}
                className="btn-scale-primary"
                style={styles.bigEmptyDeskBtn}
              >
                + Plan a Cozy Task
              </button>
            </div>
          )}
        </section>

          {/* FOCUS POMODORO TIMER PANEL */}
          <section style={styles.panelTimer} className="timer-panel glass-card shadow-premium desk-panel">
            <h2 style={styles.panelTitle}>☕ Soft Focus Timer</h2>
            
            <div style={styles.timerToggles} className="timer-toggles">
              <button 
                type="button"
                onClick={() => { setTimerMode('pomodoro'); setShowCustomInput(false); }} 
                style={{
                  ...styles.timerToggleBtn,
                  ...(timerMode === 'pomodoro' ? styles.timerToggleBtnActivePomodoro : {})
                }}
              >
                🌸 Focus Session
              </button>
              <button 
                type="button"
                onClick={() => { setTimerMode('short'); setShowCustomInput(false); }} 
                style={{
                  ...styles.timerToggleBtn,
                  ...(timerMode === 'short' ? styles.timerToggleBtnActiveShort : {})
                }}
              >
                ☕ Short Break (5m)
              </button>
              <button 
                type="button"
                onClick={() => { setTimerMode('long'); setShowCustomInput(false); }} 
                style={{
                  ...styles.timerToggleBtn,
                  ...(timerMode === 'long' ? styles.timerToggleBtnActiveLong : {})
                }}
              >
                🌿 Long Break (15m)
              </button>
            </div>

            {/* Premium Customizable Focus Duration Selector */}
            {timerMode === 'pomodoro' && (
              <div style={styles.durationSelectorContainer}>
                <span style={styles.durationSelectorTitle}>🌸 Select Focus Length:</span>
                <div style={styles.durationOptionsGrid}>
                  {([25, 45, 60, 90] as const).map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setFocusDurationPref(mins);
                        setShowCustomInput(false);
                      }}
                      style={{
                        ...styles.durationOptionBtn,
                        ...(focusDurationPref === mins && !showCustomInput ? styles.durationOptionBtnActive : {})
                      }}
                    >
                      {mins === 25 ? '🌸 25m' : mins === 45 ? '☕ 45m' : mins === 60 ? '📚 60m' : '🚀 90m'}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    style={{
                      ...styles.durationOptionBtn,
                      ...(showCustomInput ? styles.durationOptionBtnActive : {})
                    }}
                  >
                    ✨ Custom
                  </button>
                </div>
                
                {showCustomInput && (
                  <div style={styles.customInputWrapper} className="modal-animation-slide">
                    <input
                      type="number"
                      min="5"
                      max="240"
                      value={customMinsInput}
                      onChange={(e) => setCustomMinsInput(e.target.value)}
                      style={styles.customMinutesInput}
                      placeholder="60"
                    />
                    <span style={styles.customMinutesText}>min (5-240)</span>
                    <button
                      type="button"
                      onClick={handleApplyCustomDuration}
                      style={styles.applyCustomDurationBtn}
                      className="btn-scale-primary"
                    >
                      Apply ✨
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Glowing circular outer timer container with dynamic progress ring */}
            <div style={styles.circularTimerOuter} className="circular-timer-outer">
              <div 
                className={`timer-clock-circle ${timerRunning ? `breathing-active-${timerMode}` : ''}`}
                style={styles.timerClockCircle}
              >
                {/* SVG Circular Progress Ring */}
                <svg width="180" height="180" viewBox="0 0 180 180" style={styles.timerSvgProgress} className="timer-svg-progress">
                  <circle
                    cx="90"
                    cy="90"
                    r={circleRadius}
                    fill="transparent"
                    stroke="rgba(45, 42, 58, 0.04)"
                    strokeWidth="7"
                  />
                  <circle
                    cx="90"
                    cy="90"
                    r={circleRadius}
                    fill="transparent"
                    stroke={getTimerColor()}
                    strokeWidth="7"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s ease' }}
                  />
                </svg>

                {/* Clock Inner labels */}
                <div style={styles.timerContentInner}>
                  <span style={{ ...styles.timerLabelInside, color: getTimerColor() }}>
                    {timerMode === 'pomodoro' ? '🌸 DEEP FOCUS' : '☁️ REST TIMELINE'}
                  </span>
                  <h3 style={styles.timerTime}>{formatTime(timeLeft)}</h3>
                  <span style={styles.timerPercentage}>
                    {remainingPercentage}% Remaining
                  </span>
                  <span style={styles.timerBreatheHint}>
                    {getTimerContextMessage()}
                  </span>
                </div>
              </div>
            </div>

            {/* Control actions */}
            <div style={styles.timerControlsRow}>
              <button 
                onClick={toggleTimer} 
                className="btn-scale-primary" 
                style={{
                  ...styles.timerActionBtn,
                  backgroundColor: timerRunning ? '#A8D5BA' : '#B794F6', // Sage Green vs Lavender
                  color: timerRunning ? '#2D2A3A' : '#FAF9F6',
                  borderColor: '#2D2A3A'
                }}
              >
                {timerRunning ? '⏸️ Pause' : '▶️ Start'}
              </button>
              <button 
                onClick={resetTimer} 
                className="btn-scale-secondary" 
                style={styles.timerActionBtn}
              >
                🔄 Reset
              </button>
            </div>
          </section>

          {/* FOCUSNEST AI ASSISTANT PANEL */}
          <section style={styles.panelAi} className="ai-panel glass-card shadow-premium desk-panel">
            <div style={styles.aiHeader}>
              <div style={styles.aiLogoTitle}>
                <span style={{ fontSize: '1.25rem' }}>✨</span>
                <h2 style={styles.panelTitle}>FocusNest AI</h2>
              </div>
              <span style={styles.aiBadgeActive}>Online</span>
            </div>

            {/* Personalized chat balloon */}
            <div style={styles.aiChatBalloon}>
              <p style={styles.aiChatText}>
                🌸 Hi {username || 'Anu'}, {pendingTasksCount > 0 
                  ? `you have ${pendingTasksCount} tasks waiting on your desk.` 
                  : 'your desk is fully cleared and ready for new goals!'} Would you like help creating a focus plan?
              </p>
            </div>

            <div style={styles.aiSuggestionsGroup}>
              <div 
                onClick={() => handleAiAction('prioritize')} 
                className="ai-suggestion-bubble"
                style={styles.aiSuggestionBubble}
              >
                • Prioritize tasks (Sort High priority)
              </div>
              <div 
                onClick={() => handleAiAction('schedule')} 
                className="ai-suggestion-bubble"
                style={styles.aiSuggestionBubble}
              >
                • Create focus schedule
              </div>
              <div 
                onClick={() => handleAiAction('pomodoro')} 
                className="ai-suggestion-bubble"
                style={styles.aiSuggestionBubble}
              >
                • Plan Pomodoro session
              </div>
              <div 
                onClick={() => handleAiAction('organize')} 
                className="ai-suggestion-bubble"
                style={styles.aiSuggestionBubble}
              >
                • Organize study day
              </div>
            </div>
          </section>

          {/* INTERACTIVE LOFI VINYL RECORD PLAYER */}
          <section style={styles.panelVinyl} className="vinyl-panel glass-card shadow-premium desk-panel">
            <h2 style={styles.panelTitle}>🎵 Study Desk Vinyl Player</h2>
            
            <div style={styles.vinylDeckContainer}>
              {/* Spinning Record Plate */}
              <div style={styles.vinylTurntable}>
                <div 
                  className={`vinyl-record-disc ${isPlayingLofi ? 'vinyl-spinning' : ''}`}
                  style={styles.vinylDisc}
                  onClick={() => setIsPlayingLofi(!isPlayingLofi)}
                >
                  <div style={styles.vinylGroove1} />
                  <div style={styles.vinylGroove2} />
                  <div style={styles.vinylCenterLabel} />
                </div>
                
                {/* Needle arm */}
                <div 
                  className={`vinyl-turntable-arm ${isPlayingLofi ? 'arm-active' : ''}`}
                  style={styles.vinylArm}
                />
              </div>

              {/* Tracks Controller */}
              <div style={styles.vinylControls}>
                <span style={styles.vinylStatusLabel}>
                  {isPlayingLofi ? '📻 STATION ACTIVE' : '💤 PLAYER OFF'}
                </span>
                <h4 style={styles.vinylActiveTitle}>
                  {isPlayingLofi ? lofiTracks[selectedTrack].title : 'Quiet Study Atmosphere'}
                </h4>
                <p style={styles.vinylActiveDesc}>
                  {isPlayingLofi ? lofiTracks[selectedTrack].desc : 'Turn on the turntable for cozy study rhythms.'}
                </p>

                {/* Interactive music controls */}
                <div style={styles.vinylBtnRow}>
                  <button 
                    onClick={() => setIsPlayingLofi(!isPlayingLofi)} 
                    className="btn-scale-primary"
                    style={{
                      ...styles.vinylPlayBtn,
                      backgroundColor: isPlayingLofi ? '#F8C8DC' : '#B794F6',
                      color: isPlayingLofi ? '#2D2A3A' : '#FAF9F6'
                    }}
                  >
                    {isPlayingLofi ? '⏸️ Pause Beats' : '▶️ Play Lofi'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setSelectedTrack((prev) => (prev + 1) % lofiTracks.length);
                      setIsPlayingLofi(true);
                    }}
                    className="btn-scale-secondary"
                    style={styles.vinylNextBtn}
                  >
                    Next Track ➡️
                  </button>
                </div>
              </div>
            </div>

            {/* Music notes floating effect */}
            {isPlayingLofi && (
              <div style={styles.musicNotesOverlay}>
                <span className="music-note n-1">♪</span>
                <span className="music-note n-2">♫</span>
                <span className="music-note n-3">♬</span>
                <span className="music-note n-4">♩</span>
              </div>
            )}
          </section>

          {/* DAILY INSIGHTS PANEL */}
          <section style={styles.panelInsights} className="insights-panel glass-card shadow-premium desk-panel">
            <h2 style={styles.panelTitle}>📊 Study Desk Insights</h2>
            
            <div style={styles.insightsRow}>
              
              {/* Stat 1: Tasks Completed */}
              <div style={styles.insightStatCard} className="stat-card-hover">
                <div style={styles.insightCircleProgress}>
                  <svg width="60" height="60" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" stroke="#EBE7DF" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#A8D5BA" // Sage Green
                      strokeWidth="3"
                      strokeDasharray="100"
                      strokeDashoffset={100 - completionPercentage}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div style={styles.insightCircleValInside}>
                    {completionPercentage}%
                  </div>
                </div>
                <div style={styles.insightStatLabels}>
                  <span style={styles.insightStatNum}>{completedTasks} / {totalTasks}</span>
                  <span style={styles.insightStatLabel}>Tasks Done</span>
                </div>
              </div>

              {/* Stat 2: Focus Minutes */}
              <div style={styles.insightStatCard} className="stat-card-hover">
                <div style={{ ...styles.insightIconCircle, backgroundColor: '#FAF1F5' }}>
                  <span style={{ fontSize: '1.25rem', color: '#DB2777' }}>⏱️</span>
                </div>
                <div style={styles.insightStatLabels}>
                  <span style={styles.insightStatNum}>{focusMinutes}m</span>
                  <span style={styles.insightStatLabel}>Focus Time</span>
                </div>
              </div>

              {/* Stat 3: Productivity Streak */}
              <div style={styles.insightStatCard} className="stat-card-hover">
                <div style={{ ...styles.insightIconCircle, backgroundColor: '#FDFBE7' }}>
                  <span style={{ fontSize: '1.25rem', color: '#CA8A04' }}>🔥</span>
                </div>
                <div style={styles.insightStatLabels}>
                  <span style={styles.insightStatNum}>{streak} days</span>
                  <span style={styles.insightStatLabel}>Active Streak</span>
                </div>
              </div>

            </div>
          </section>

          {/* GROUP STUDY: STUDY TOGETHER 🤍 */}
          <section style={styles.panelGroup} className="group-panel glass-card shadow-premium desk-panel">
            <h2 style={styles.panelTitle}>👥 {roomName || 'Study Together'} 🤍</h2>

            <div style={styles.buddiesRow}>
              {activeRoomId ? (
                <>
                  {roomMembers.map((member: RoomMember) => (
                    <div key={member.uid} style={styles.buddyBubbleCard} className="buddy-hover-card">
                      <div style={{ ...styles.buddyAvatar, backgroundColor: member.uid === user?.uid ? '#F5F3FF' : '#FDF2F8' }}>
                        {member.photoURL ? (
                          <img src={member.photoURL} alt={member.displayName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        ) : (
                          member.displayName ? member.displayName.charAt(0).toUpperCase() : 'B'
                        )}
                        <span 
                          style={{ ...styles.buddyStatusDot, backgroundColor: '#A8D5BA' }}
                          title="Online"
                        />
                      </div>
                      <span style={styles.buddyName}>{member.displayName}{member.uid === user?.uid ? ' 🌸' : ''}</span>
                      <span style={styles.buddyStatusLabelText}>
                        {member.uid === user?.uid ? 'Active (You)' : member.uid === roomOwnerUid ? '👑 Host' : '🌿 Study Buddy'}
                      </span>
                    </div>
                  ))}

                  {roomMembers.length <= 1 && (
                    <div style={styles.emptyStudyGroupCard}>
                      <p style={styles.emptyStudyText}>No other study partners in this room yet. Share the invite link!</p>
                    </div>
                  )}

                  <div style={styles.inviteBuddyCard}>
                    <button 
                      onClick={() => navigate(`/room/${activeRoomId}`)}
                      className="btn-scale-primary"
                      style={{
                        ...styles.inviteButton,
                        backgroundColor: '#B794F6',
                        color: '#FAF9F6',
                        border: '1.5px solid #2D2A3A',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        width: '100%',
                        display: 'block'
                      }}
                    >
                      🚪 Return to Study Room
                    </button>

                    <button 
                      onClick={handleCopyInviteLink} 
                      className="btn-scale-secondary"
                      style={styles.inviteButton}
                    >
                      🔗 Copy Invite Link
                    </button>
                    <p style={styles.inviteSubText}>Room ID: {activeRoomId} • {roomMembers.length} {roomMembers.length === 1 ? 'member' : 'members'}</p>

                    <button 
                      onClick={handleLeaveRoom}
                      className="btn-scale-secondary"
                      style={{
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#EF4444',
                        fontSize: '0.8rem',
                        fontWeight: 650,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        marginTop: '8px',
                        outline: 'none',
                        minHeight: '44px'
                      }}
                    >
                      🚪 Leave Room
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Personalized User Bubble (Online status) */}
                  <div style={styles.buddyBubbleCard} className="buddy-hover-card">
                    <div style={{ ...styles.buddyAvatar, backgroundColor: '#F5F3FF' }}>
                      {username ? username.charAt(0).toUpperCase() : 'A'}
                      <span 
                        style={{ ...styles.buddyStatusDot, backgroundColor: '#A8D5BA' }}
                        title="Active (You)"
                      />
                    </div>
                    <span style={styles.buddyName}>{username || 'Anu'} 🌸</span>
                    <span style={styles.buddyStatusLabelText}>{role || 'Active'} (You)</span>
                  </div>

                  <div style={styles.emptyStudyGroupCard}>
                    <p style={styles.emptyStudyText}>Create a study room to invite partners and focus together.</p>
                  </div>

                  <div style={styles.inviteBuddyCard}>
                    <button 
                      onClick={handleCreateStudyRoom} 
                      className="btn-scale-primary"
                      style={{
                        ...styles.inviteButton,
                        backgroundColor: '#B794F6',
                        color: '#FAF9F6',
                        border: '1.5px solid #2D2A3A',
                        borderRadius: '8px'
                      }}
                    >
                      🌸 Create Study Room
                    </button>
                    <p style={styles.inviteSubText}>Start a cozy space and invite friends.</p>
                  </div>
                </>
              )}
            </div>

            {inviteFeedback && (
              <div style={styles.inviteAlertBox}>
                ✓ Cozy Room link copied! Share the focus vibes. 🌸
              </div>
            )}
          </section>

      </main>

      {/* ================= FLOATING DRAWERS & POPUPS ================= */}
      {isAddTaskOpen && (
        <div style={styles.modalOverlay} className="add-task-modal-overlay" onClick={() => setIsAddTaskOpen(false)}>
          <div 
            style={styles.modalContent} 
            onClick={(e) => e.stopPropagation()}
            className="add-task-modal-content modal-animation-slide"
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>🌸 Plan New Cozy Task</h3>
              <button onClick={() => setIsAddTaskOpen(false)} style={styles.closeModalBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Task Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clean up spacing variables, write summary..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  style={styles.formTextInput}
                  className="form-input-focus"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Priority Level</label>
                <div style={styles.priorityPillGroup}>
                  {(['High', 'Medium', 'Low'] as const).map((prio) => (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setNewTaskPriority(prio)}
                      style={{
                        ...styles.prioPillBtn,
                        ...(newTaskPriority === prio ? styles.prioPillBtnActive : {}),
                        ...(newTaskPriority === prio ? styles[`priority_pill_${prio}`] : {})
                      }}
                    >
                      {prio}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.formGridRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Estimated Duration</label>
                  <select
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    style={styles.formSelect}
                  >
                    <option value="15m">⏱️ 15m (Short task)</option>
                    <option value="25m">⏱️ 25m (1 Pomodoro)</option>
                    <option value="45m">⏱️ 45m (Deep focus)</option>
                    <option value="60m">⏱️ 1h (Extended block)</option>
                    <option value="90m">⏱️ 1.5h (Major milestone)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Task Mode</label>
                  <div style={styles.toggleGroup}>
                    <button
                      type="button"
                      onClick={() => setNewTaskType('Solo')}
                      style={{
                        ...styles.toggleBtn,
                        ...(newTaskType === 'Solo' ? styles.toggleBtnActive : {})
                      }}
                    >
                      👤 Solo
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTaskType('Group')}
                      style={{
                        ...styles.toggleBtn,
                        ...(newTaskType === 'Group' ? styles.toggleBtnActive : {})
                      }}
                    >
                      👥 Group
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-scale-primary" 
                style={styles.modalSubmitBtn}
              >
                Add to To-Do List 🌸
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= TIMER CELEBRATION MODAL ================= */}
      {isCelebrationOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCelebrationOpen(false)}>
          <div 
            style={styles.modalCelebrationContent} 
            onClick={(e) => e.stopPropagation()}
            className="modal-animation-slide"
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>🌸</span>
            <h3 style={styles.celebrationTitle}>
              {timerMode === 'pomodoro' ? 'Session Complete' : 'Break Complete'}
            </h3>
            
            <p style={styles.celebrationSubTitle}>Wonderful work!</p>
            
            <p style={styles.celebrationText}>
              {timerMode === 'pomodoro' 
                ? `You just completed a ${celebratedMinutes}-minute focus session.`
                : `You just completed a ${celebratedMinutes}-minute break.`
              }
            </p>
            
            <p style={styles.celebrationTip}>
              {timerMode === 'pomodoro'
                ? 'Take a short break and recharge. ☕'
                : "Let's resume focus and build momentum! 🚀"
              }
            </p>

            <button 
              onClick={() => {
                setIsCelebrationOpen(false);
                if (timerMode === 'pomodoro') {
                  setTimerMode('short');
                } else {
                  setTimerMode('pomodoro');
                }
              }}
              className="btn-scale-primary"
              style={styles.celebrationCloseBtn}
            >
              {timerMode === 'pomodoro' ? 'Start Short Break ☕' : 'Ready to Focus 🌸'}
            </button>
          </div>
        </div>
      )}

      {/* ================= AESTHETIC SIGNATURE FOOTER ================= */}
      <footer style={styles.footer}>
        <div style={styles.footerSignature} className="footer-hover-signature">
          With Love, Ananya ♡
        </div>
      </footer>
    </div>
  );
}

// ----------------------------------------------------
// FocusNest Style Guidelines - Cozy CSS System
// ----------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  mobileKanbanTabs: {
    display: 'none',
    gap: '8px',
    width: '100%',
    marginBottom: '16px',
    boxSizing: 'border-box'
  },
  mobileTabBtn: {
    flex: 1,
    padding: '10px 6px',
    fontSize: '0.82rem',
    fontWeight: 'bold',
    borderRadius: '20px',
    border: '1.5px solid #EBE7DF',
    backgroundColor: '#FAF9F6',
    color: '#4B5563',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 200ms ease',
    outline: 'none',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  mobileTabBtnActiveTodo: {
    backgroundColor: '#FDF2F8',
    borderColor: '#F8C8DC',
    color: '#DB2777',
    boxShadow: '0 4px 10px rgba(248, 200, 220, 0.2)'
  },
  mobileTabBtnActiveProgress: {
    backgroundColor: '#FDFBE7',
    borderColor: '#FCE38A',
    color: '#CA8A04',
    boxShadow: '0 4px 10px rgba(252, 227, 138, 0.2)'
  },
  mobileTabBtnActiveDone: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A8D5BA',
    color: '#15803D',
    boxShadow: '0 4px 10px rgba(168, 213, 186, 0.2)'
  },
  container: {
    minHeight: '100vh',
    backgroundColor: '#FFFDF8', // Cozy warm cream
    padding: '24px 32px',
    fontFamily: "'Inter', sans-serif",
    color: '#2D2A3A',
    position: 'relative',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '28px',
    flexWrap: 'wrap'
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  logoSvg: {
    width: '38px',
    height: '38px'
  },
  logoText: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    color: '#2D2A3A',
    letterSpacing: '-0.5px'
  },
  welcomeBanner: {
    backgroundColor: '#FAF1F5', // Soft Blush Pink tint backdrop
    border: '2px solid #2D2A3A',
    borderRadius: '16px',
    padding: '16px 20px',
    boxShadow: '0 8px 24px rgba(248, 200, 220, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    backgroundImage: 'radial-gradient(circle at top right, rgba(183, 148, 246, 0.08) 0%, transparent 60%)'
  },
  welcomeTitle: {
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  welcomeSubtitle: {
    fontSize: '0.82rem',
    color: '#6B7280',
    margin: 0,
    fontWeight: 500
  },
  nameEditInput: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#2D2A3A',
    border: '2.5px solid #B794F6',
    borderRadius: '6px',
    padding: '2px 6px',
    backgroundColor: '#FFFDF8',
    outline: 'none',
    width: '180px'
  },
  saveNameBtn: {
    backgroundColor: '#B794F6',
    color: '#FAF9F6',
    border: 'none',
    borderRadius: '4px',
    width: '26px',
    height: '26px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold'
  },
  editPenIcon: {
    fontSize: '0.85rem',
    color: '#B794F6',
    cursor: 'pointer',
    marginLeft: '6px',
    display: 'inline-block',
    transition: 'transform 200ms ease'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logoutBtn: {
    backgroundColor: '#FFFDF8',
    color: '#2D2A3A',
    border: '1.5px solid #2D2A3A',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '0.82rem',
    fontWeight: 650,
    cursor: 'pointer',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    minHeight: '44px',
    transition: 'all 200ms ease'
  },
  dateBlock: {
    padding: '10px 16px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: '1.5px solid #EBE7DF',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px'
  },
  dateLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#4B5563'
  },
  motivationLabel: {
    fontSize: '0.78rem',
    fontFamily: "'Caveat', cursive",
    color: '#5C3EAD',
    fontWeight: 'bold'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '38% 32% 30%',
    gap: '24px',
    alignItems: 'start'
  },
  columnKanban: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: '1.15rem',
    fontWeight: 750,
    color: '#2D2A3A',
    margin: 0
  },
  addTaskBtn: {
    padding: '8px 14px',
    fontSize: '0.85rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  deskInstructions: {
    fontSize: '0.75rem',
    color: '#6B7280',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '8px 12px',
    lineHeight: '1.3'
  },
  kanbanColumnsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  kanbanColumn: {
    backgroundColor: 'rgba(250,249,246,0.65)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '14px',
    padding: '14px',
    minHeight: '200px',
    transition: 'all 250ms ease'
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px',
    borderBottom: '1.5px solid #EBE7DF',
    paddingBottom: '8px'
  },
  columnHeaderBadgePink: {
    fontSize: '0.84rem',
    fontWeight: 'bold',
    backgroundColor: '#FDF2F8',
    color: '#DB2777',
    border: '1.5px solid #FBCFE8',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  columnHeaderBadgeYellow: {
    fontSize: '0.84rem',
    fontWeight: 'bold',
    backgroundColor: '#FDFBE7',
    color: '#CA8A04',
    border: '1.5px solid #FDE68A',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  columnHeaderBadgeGreen: {
    fontSize: '0.84rem',
    fontWeight: 'bold',
    backgroundColor: '#ECFDF5',
    color: '#15803D',
    border: '1.5px solid #A7F3D0',
    padding: '4px 10px',
    borderRadius: '20px'
  },
  columnCountBadge: {
    marginLeft: 'auto',
    backgroundColor: '#EBE7DF',
    color: '#4B5563',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  tasksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  emptyColumnPlaceholder: {
    textAlign: 'center',
    padding: '28px 10px',
    color: '#9CA3AF',
    fontSize: '0.78rem',
    border: '1.5px dashed #EBE7DF',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  taskCard: {
    backgroundColor: '#FFFDF8',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'grab',
    boxShadow: '0 2px 4px rgba(45, 42, 58, 0.02)',
    transition: 'transform 200ms ease, box-shadow 200ms ease',
    position: 'relative'
  },
  taskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  priorityBadge: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '20px',
    border: '1px solid transparent'
  },
  priority_High: {
    backgroundColor: '#FDF2F8',
    color: '#DB2777',
    borderColor: '#FBCFE8'
  },
  priority_Medium: {
    backgroundColor: '#F5F3FF',
    color: '#5C3EAD',
    borderColor: '#DDD6FE'
  },
  priority_Low: {
    backgroundColor: '#ECFDF5',
    color: '#15803D',
    borderColor: '#A7F3D0'
  },
  typeBadge: {
    fontSize: '0.65rem',
    color: '#6B7280',
    fontWeight: 600
  },
  taskText: {
    fontSize: '0.84rem',
    color: '#2D2A3A',
    fontWeight: 550,
    margin: '0 0 10px 0',
    lineHeight: 1.4
  },
  taskCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px dashed #F3F4F6',
    paddingTop: '8px'
  },
  timeTag: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: 600
  },
  deleteTaskBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '0.78rem',
    padding: '2px',
    transition: 'color 200ms ease'
  },
  entirelyEmptyDeskCard: {
    padding: '40px 24px',
    textAlign: 'center',
    border: '2.5px dashed #B794F6',
    borderRadius: '16px',
    backgroundColor: '#FAF9F6', // Soft Cream tint
    marginTop: '12px',
    boxShadow: '0 4px 12px rgba(183,148,246,0.04)'
  },
  emptyDeskTitle: {
    fontSize: '1.05rem',
    fontWeight: 750,
    color: '#5C3EAD',
    margin: '0 0 4px 0'
  },
  emptyDeskText: {
    fontSize: '0.78rem',
    color: '#6B7280',
    margin: '0 0 18px 0',
    lineHeight: '1.4'
  },
  bigEmptyDeskBtn: {
    padding: '10px 18px',
    fontSize: '0.88rem',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  columnCenter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  panelTimer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px'
  },
  panelTitle: {
    fontSize: '1.1rem',
    fontWeight: 750,
    color: '#2D2A3A',
    margin: 0,
    width: '100%',
    textAlign: 'left'
  },
  timerToggles: {
    display: 'flex',
    gap: '6px',
    width: '100%',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  timerToggleBtn: {
    flex: '1 0 auto',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '0.74rem',
    fontWeight: 650,
    color: '#6B7280',
    cursor: 'pointer',
    transition: 'all 200ms ease'
  },
  timerToggleBtnActivePomodoro: {
    backgroundColor: '#FDF2F8',
    borderColor: '#F8C8DC',
    color: '#DB2777'
  },
  timerToggleBtnActiveShort: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A8D5BA',
    color: '#15803D'
  },
  timerToggleBtnActiveLong: {
    backgroundColor: '#FDFBE7',
    borderColor: '#FCE38A',
    color: '#CA8A04'
  },
  durationSelectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    padding: '12px 14px',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    marginTop: '-4px',
    boxSizing: 'border-box'
  },
  durationSelectorTitle: {
    fontSize: '0.76rem',
    fontWeight: 'bold',
    color: '#6B7280',
    textAlign: 'left'
  },
  durationOptionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '6px',
    width: '100%'
  },
  durationOptionBtn: {
    padding: '6px 2px',
    fontSize: '0.72rem',
    fontWeight: 700,
    backgroundColor: '#FFFDF8',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    color: '#4B5563',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    textAlign: 'center',
    outline: 'none'
  },
  durationOptionBtnActive: {
    backgroundColor: '#FDF2F8',
    borderColor: '#F8C8DC',
    color: '#DB2777',
    boxShadow: '0 2px 6px rgba(248, 200, 220, 0.15)'
  },
  customInputWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #EBE7DF',
    justifyContent: 'flex-start'
  },
  customMinutesInput: {
    width: '64px',
    padding: '5px 8px',
    fontSize: '0.8rem',
    border: '1.5px solid #EBE7DF',
    borderRadius: '6px',
    backgroundColor: '#FFFDF8',
    outline: 'none',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  customMinutesText: {
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: 600
  },
  applyCustomDurationBtn: {
    padding: '4px 10px',
    fontSize: '0.74rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: '1.5px solid #2D2A3A'
  },
  circularTimerOuter: {
    position: 'relative',
    margin: '10px 0',
    width: '180px',
    height: '180px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  timerSvgProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    transform: 'rotate(-90deg)'
  },
  timerClockCircle: {
    width: '170px',
    height: '170px',
    borderRadius: '50%',
    backgroundColor: '#FFFDF8',
    border: '3.5px solid #2D2A3A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 8px 24px rgba(45,42,58,0.02)',
    transition: 'all 300ms ease'
  },
  timerContentInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 2
  },
  timerLabelInside: {
    fontSize: '0.62rem',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  timerTime: {
    fontSize: '2.2rem',
    fontWeight: 'bold',
    color: '#2D2A3A',
    margin: '2px 0 2px 0',
    letterSpacing: '-1px'
  },
  timerPercentage: {
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: 700,
    backgroundColor: '#FAF9F6',
    padding: '2px 8px',
    borderRadius: '12px',
    border: '1.5px solid #EBE7DF',
    marginBottom: '4px'
  },
  timerBreatheHint: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    fontWeight: 500
  },
  timerControlsRow: {
    display: 'flex',
    gap: '12px',
    width: '100%'
  },
  timerActionBtn: {
    flex: 1,
    padding: '10px 0',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  panelAi: {
    backgroundColor: '#FAF9F6', // Notebook pad color tone
    border: '2px solid #2D2A3A',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 10px 30px rgba(45, 42, 58, 0.04)',
    position: 'relative',
    overflow: 'hidden'
  },
  aiHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5px solid #EBE7DF',
    paddingBottom: '8px',
    marginBottom: '14px'
  },
  aiLogoTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  aiBadgeActive: {
    fontSize: '0.68rem',
    fontWeight: 'bold',
    color: '#15803D',
    backgroundColor: '#ECFDF5',
    padding: '2px 8px',
    borderRadius: '20px'
  },
  aiChatBalloon: {
    backgroundColor: '#FFFDF8', // Cozy warm cream dialog bubble
    border: '2px solid #2D2A3A',
    borderRadius: '16px',
    borderTopLeftRadius: '2px',
    padding: '14px 18px',
    boxShadow: '4px 4px 0px rgba(45, 42, 58, 0.05)',
    marginBottom: '14px'
  },
  aiChatText: {
    fontSize: '0.82rem',
    lineHeight: 1.45,
    color: '#2D2A3A',
    margin: 0,
    fontWeight: 550
  },
  aiSuggestionsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  aiSuggestionBubble: {
    fontSize: '0.78rem',
    color: '#2D2A3A',
    backgroundColor: '#FFFDF8',
    border: '1.5px solid #EBE7DF',
    borderRadius: '10px',
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'all 200ms ease'
  },
  columnRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  panelVinyl: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    position: 'relative'
  },
  vinylDeckContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center'
  },
  vinylTurntable: {
    width: '90px',
    height: '90px',
    borderRadius: '14px',
    backgroundColor: '#FAF9F6',
    border: '2.5px solid #2D2A3A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.02)'
  },
  vinylDisc: {
    width: '74px',
    height: '74px',
    borderRadius: '50%',
    backgroundColor: '#1F2937', // Black vinyl record
    border: '2.5px solid #111827',
    position: 'relative',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  vinylGroove1: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    right: '10px',
    bottom: '10px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  vinylGroove2: {
    position: 'absolute',
    top: '22px',
    left: '22px',
    right: '22px',
    bottom: '22px',
    borderRadius: '50%',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  vinylCenterLabel: {
    position: 'absolute',
    top: '26px',
    left: '26px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#F8C8DC', // Blush Pink center
    border: '2px solid #2D2A3A'
  },
  vinylArm: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '32px',
    height: '6px',
    backgroundColor: '#D1D5DB',
    border: '1px solid #9CA3AF',
    borderRadius: '4px',
    transformOrigin: 'top right',
    transform: 'rotate(-45deg)',
    transition: 'transform 500ms ease',
    pointerEvents: 'none'
  },
  vinylControls: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  vinylStatusLabel: {
    fontSize: '0.62rem',
    fontWeight: 'bold',
    color: '#B794F6',
    letterSpacing: '1px'
  },
  vinylActiveTitle: {
    fontSize: '0.86rem',
    fontWeight: 'bold',
    color: '#2D2A3A',
    margin: '2px 0 0 0'
  },
  vinylActiveDesc: {
    fontSize: '0.7rem',
    color: '#6B7280',
    margin: '0 0 8px 0',
    lineHeight: '1.25'
  },
  vinylBtnRow: {
    display: 'flex',
    gap: '8px'
  },
  vinylPlayBtn: {
    padding: '6px 12px',
    fontSize: '0.74rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: '1.5px solid #2D2A3A'
  },
  vinylNextBtn: {
    padding: '6px 10px',
    fontSize: '0.74rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  musicNotesOverlay: {
    position: 'absolute',
    top: '10px',
    right: '40px',
    width: '60px',
    height: '60px',
    pointerEvents: 'none'
  },
  panelInsights: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  insightsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  insightStatCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 14px',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '12px',
    transition: 'all 200ms ease'
  },
  insightCircleProgress: {
    position: 'relative',
    width: '42px',
    height: '42px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  insightCircleValInside: {
    position: 'absolute',
    fontSize: '0.64rem',
    fontWeight: 'bold',
    color: '#2D2A3A'
  },
  insightIconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #2D2A3A'
  },
  insightStatLabels: {
    display: 'flex',
    flexDirection: 'column'
  },
  insightStatNum: {
    fontSize: '0.94rem',
    fontWeight: 'bold',
    color: '#2D2A3A'
  },
  insightStatLabel: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: 600
  },
  panelGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  buddiesRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  buddyBubbleCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: '#FAF1F5', // soft pink blush tone
    border: '2px solid #2D2A3A',
    borderRadius: '12px',
    width: '68px',
    textAlign: 'center',
    gap: '4px',
    boxSizing: 'border-box'
  },
  buddyAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#2D2A3A',
    fontWeight: 'bold',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    border: '1.5px solid #2D2A3A'
  },
  buddyStatusDot: {
    position: 'absolute',
    bottom: '-1px',
    right: '-1px',
    width: '9px',
    height: '9px',
    borderRadius: '50%',
    border: '1.5px solid #FFFDF8'
  },
  buddyName: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#2D2A3A',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%'
  },
  buddyStatusLabelText: {
    fontSize: '0.58rem',
    color: '#6B7280',
    fontWeight: 600
  },
  emptyStudyGroupCard: {
    backgroundColor: '#FAF9F6',
    border: '1.5px dashed #EBE7DF',
    borderRadius: '12px',
    padding: '8px 12px',
    flex: '1 0 130px',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    height: '68px',
    boxSizing: 'border-box'
  },
  emptyStudyText: {
    fontSize: '0.7rem',
    color: '#6B7280',
    margin: 0,
    lineHeight: 1.35,
    fontWeight: 500
  },
  inviteBuddyCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '8px 12px',
    backgroundColor: '#FFFDF8',
    border: '2px dashed #B794F6', // Lavender accent dash border
    borderRadius: '12px',
    flex: '1 0 100px',
    gap: '4px',
    textAlign: 'center',
    height: '68px',
    boxSizing: 'border-box'
  },
  inviteButton: {
    padding: '4px 8px',
    fontSize: '0.68rem',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: '1.5px solid #2D2A3A'
  },
  inviteSubText: {
    fontSize: '0.55rem',
    color: '#9CA3AF',
    margin: 0
  },
  inviteAlertBox: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '0.74rem',
    fontWeight: 600,
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
    marginTop: '6px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(45, 42, 58, 0.4)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#FFFDF8',
    border: '3px solid #2D2A3A',
    borderRadius: '16px',
    width: '420px',
    maxWidth: '90%',
    padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    boxSizing: 'border-box'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1.5px solid #EBE7DF',
    paddingBottom: '12px',
    marginBottom: '20px'
  },
  modalTitle: {
    fontSize: '1.05rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: 0
  },
  closeModalBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formLabel: {
    fontSize: '0.8rem',
    fontWeight: 750,
    color: '#4B5563'
  },
  formTextInput: {
    padding: '10px 14px',
    fontSize: '0.84rem',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    backgroundColor: '#FAF9F6',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  priorityPillGroup: {
    display: 'flex',
    gap: '8px',
    width: '100%'
  },
  prioPillBtn: {
    flex: 1,
    padding: '8px 0',
    backgroundColor: '#FAF9F6',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 200ms ease',
    color: '#4B5563'
  },
  prioPillBtnActive: {
    borderColor: '#2D2A3A'
  },
  priority_pill_High: {
    backgroundColor: '#FDF2F8',
    color: '#DB2777',
    borderWidth: '2.5px'
  },
  priority_pill_Medium: {
    backgroundColor: '#F5F3FF',
    color: '#5C3EAD',
    borderWidth: '2.5px'
  },
  priority_pill_Low: {
    backgroundColor: '#ECFDF5',
    color: '#15803D',
    borderWidth: '2.5px'
  },
  formGridRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  formSelect: {
    padding: '8px 12px',
    fontSize: '0.8rem',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    backgroundColor: '#FAF9F6',
    outline: 'none',
    cursor: 'pointer'
  },
  toggleGroup: {
    display: 'flex',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    overflow: 'hidden'
  },
  toggleBtn: {
    flex: 1,
    padding: '8px 0',
    backgroundColor: '#FAF9F6',
    border: 'none',
    fontSize: '0.78rem',
    fontWeight: 700,
    color: '#6B7280',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 200ms ease'
  },
  toggleBtnActive: {
    backgroundColor: '#FAF9FC',
    color: '#B794F6',
    fontWeight: 'bold',
    borderLeft: '1px solid #EBE7DF',
    borderRight: '1px solid #EBE7DF'
  },
  modalSubmitBtn: {
    padding: '12px 0',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '8px'
  },
  modalCelebrationContent: {
    backgroundColor: '#FFFDF8',
    border: '3px solid #2D2A3A',
    borderRadius: '24px',
    width: '380px',
    maxWidth: '90%',
    padding: '32px 24px',
    textAlign: 'center',
    boxShadow: '0 25px 50px rgba(248, 200, 220, 0.25)',
    boxSizing: 'border-box'
  },
  celebrationTitle: {
    fontSize: '1.45rem',
    fontWeight: 850,
    color: '#2D2A3A',
    margin: '4px 0 2px 0'
  },
  celebrationSubTitle: {
    fontSize: '0.94rem',
    fontWeight: 700,
    color: '#DB2777', // Bright pink
    margin: '0 0 16px 0'
  },
  celebrationText: {
    fontSize: '0.86rem',
    color: '#4B5563',
    lineHeight: 1.45,
    margin: '0 0 4px 0',
    fontWeight: 550
  },
  celebrationTip: {
    fontSize: '0.86rem',
    color: '#2D2A3A',
    fontWeight: 700,
    margin: '0 0 24px 0'
  },
  celebrationCloseBtn: {
    width: '100%',
    padding: '12px 0',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '48px',
    paddingBottom: '16px',
    textAlign: 'center',
    width: '100%'
  },
  footerSignature: {
    display: 'inline-block',
    fontFamily: "'Caveat', cursive",
    fontSize: '1.25rem',
    color: '#B794F6',
    cursor: 'pointer'
  }
};

// ----------------------------------------------------
// Custom Visual Enhancements & Keyframe Stylesheet
// ----------------------------------------------------
const workspaceStyles = `
/* Cozy Desk Panels styling - soft board margins */
.desk-panel {
  padding: 20px 24px;
  background-color: rgba(255, 255, 255, 0.7) !important;
  border: 2px solid #2D2A3A !important;
  border-radius: 16px !important;
  transition: transform 250ms ease, box-shadow 250ms ease !important;
}

/* Glass and shadows sways */
.glass-card {
  backdrop-filter: blur(8px);
}
.shadow-premium {
  box-shadow: 0 10px 30px rgba(45, 42, 58, 0.04) !important;
}
.shadow-soft {
  box-shadow: 0 4px 12px rgba(45, 42, 58, 0.02) !important;
}

/* Interactive card lifts */
.task-draggable-card {
  transition: transform 250ms cubic-bezier(0.16, 1, 0.3, 1), 
              box-shadow 250ms cubic-bezier(0.16, 1, 0.3, 1), 
              border-color 250ms ease !important;
}
.task-draggable-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 16px rgba(183, 148, 246, 0.12) !important;
  border-color: #B794F6 !important;
}
.task-draggable-card.dragging {
  opacity: 0.4;
  transform: scale(0.95);
  border: 2.5px dashed #B794F6 !important;
}

/* Dropzone Hover glows */
.kanban-column-dropzone {
  transition: border-color 250ms ease, background-color 250ms ease !important;
}
.kanban-column-dropzone.dragover {
  border-color: #B794F6 !important;
  background-color: rgba(245, 243, 255, 0.8) !important;
}

/* Circular Pomodoro Timer breathing active glows based on modes */
.timer-clock-circle {
  transition: border-color 300ms ease, box-shadow 300ms ease !important;
}
.timer-clock-circle.breathing-active-pomodoro {
  border-color: #F8C8DC !important;
  animation: breathingPomodoro 2s ease-in-out infinite alternate;
}
.timer-clock-circle.breathing-active-short {
  border-color: #A8D5BA !important;
  animation: breathingShort 2s ease-in-out infinite alternate;
}
.timer-clock-circle.breathing-active-long {
  border-color: #FCE38A !important;
  animation: breathingLong 2s ease-in-out infinite alternate;
}

@keyframes breathingPomodoro {
  0% { box-shadow: 0 0 12px rgba(248, 200, 220, 0.25), 0 0 24px rgba(248, 200, 220, 0.1); }
  100% { box-shadow: 0 0 28px rgba(248, 200, 220, 0.7), 0 0 50px rgba(248, 200, 220, 0.25); }
}
@keyframes breathingShort {
  0% { box-shadow: 0 0 12px rgba(168, 213, 186, 0.25), 0 0 24px rgba(168, 213, 186, 0.1); }
  100% { box-shadow: 0 0 28px rgba(168, 213, 186, 0.7), 0 0 50px rgba(168, 213, 186, 0.25); }
}
@keyframes breathingLong {
  0% { box-shadow: 0 0 12px rgba(252, 227, 138, 0.25), 0 0 24px rgba(252, 227, 138, 0.1); }
  100% { box-shadow: 0 0 28px rgba(252, 227, 138, 0.7), 0 0 50px rgba(252, 227, 138, 0.25); }
}

/* Vinyl deck spin animation */
.vinyl-record-disc {
  transition: transform 300ms ease;
  transform-origin: center center;
}
.vinyl-record-disc.vinyl-spinning {
  animation: vinylSpin 3.5s linear infinite;
}

@keyframes vinylSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Arm rotation placement when active */
.vinyl-turntable-arm {
  transition: transform 500ms cubic-bezier(0.4, 0, 0.2, 1);
}
.vinyl-turntable-arm.arm-active {
  transform: rotate(-10deg) !important;
}

/* Rising music notes animations */
.music-note {
  position: absolute;
  font-size: 1.1rem;
  color: #B794F6;
  opacity: 0;
  animation: floatNote 2.4s linear infinite;
}
.n-1 { left: 10px; animation-delay: 0s; }
.n-2 { left: 25px; animation-delay: 0.6s; }
.n-3 { left: 40px; animation-delay: 1.2s; }
.n-4 { left: 50px; animation-delay: 1.8s; }

@keyframes floatNote {
  0% {
    transform: translateY(30px) scale(0.6);
    opacity: 0;
  }
  20% { opacity: 0.8; }
  80% { opacity: 0.6; }
  100% {
    transform: translateY(-50px) scale(1.1) rotate(20deg);
    opacity: 0;
  }
}

/* AI Suggestions bubble scale sways */
.ai-suggestion-bubble {
  transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.ai-suggestion-bubble:hover {
  transform: translateX(4px);
  border-color: #B794F6 !important;
  background-color: #F5F3FF !important;
  color: #5C3EAD !important;
}

/* Premium micro scales for CTA buttons */
.btn-scale-primary {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #B794F6;
  color: #FAF9F6;
  border: 2px solid #2D2A3A;
  box-shadow: 0 2px 4px rgba(45, 42, 58, 0.05);
}
.btn-scale-primary:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #B794F6 0%, #F8C8DC 100%) !important;
  box-shadow: 0 6px 16px rgba(183, 148, 246, 0.2);
}
.btn-scale-primary:active {
  transform: translateY(0.5px);
}

.btn-scale-secondary {
  transition: all 300ms cubic-bezier(0.16, 1, 0.3, 1);
  background-color: #FAF9F6;
  color: #2D2A3A;
  border: 1.5px solid #2D2A3A;
}
.btn-scale-secondary:hover {
  transform: translateY(-1.5px);
  border-color: #B794F6;
  background-color: #FAF9FC;
  box-shadow: 0 4px 12px rgba(248, 200, 220, 0.15);
}
.btn-scale-secondary:active {
  transform: translateY(0.5px);
}

/* Form inputs glows */
.form-input-focus {
  transition: border-color 250ms ease, box-shadow 250ms ease !important;
}
.form-input-focus:focus {
  border-color: #B794F6 !important;
  box-shadow: 0 0 8px rgba(248, 200, 220, 0.6) !important;
}

/* Modal overlays scale in sways */
.modal-animation-slide {
  animation: modalSlide 300ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalSlide {
  0% {
    transform: translateY(30px) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Sparkles text pulse */
.sparkle-spark {
  animation: textPulse 2.5s infinite alternate;
}
@keyframes textPulse {
  0% { opacity: 0.85; }
  100% { opacity: 1; color: #DB2777; }
}

/* Buddy and stat card lifts */
.buddy-hover-card {
  transition: transform 200ms ease, box-shadow 200ms ease !important;
}
.buddy-hover-card:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 10px rgba(0,0,0,0.02) !important;
  border-color: #B794F6 !important;
}

.stat-card-hover {
  transition: transform 200ms ease, border-color 200ms ease !important;
}
.stat-card-hover:hover {
  transform: translateX(2px);
  border-color: #B794F6 !important;
}

/* Elegant footer cursive signature hover effect */
.footer-hover-signature {
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.footer-hover-signature:hover {
  transform: scale(1.08) rotate(-1.5deg);
  color: #DB2777 !important;
  text-shadow: 0 4px 10px rgba(248, 200, 220, 0.25);
}

/* Glow Blobs backgrounds */
.pink-glow-blob {
  position: absolute;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(248, 200, 220, 0.3) 0%, rgba(183, 148, 246, 0.05) 60%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  filter: blur(60px);
  z-index: 0;
}
.lavender-glow-blob {
  position: absolute;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(183, 148, 246, 0.25) 0%, rgba(248, 200, 220, 0.04) 60%, rgba(255, 255, 255, 0) 100%);
  pointer-events: none;
  filter: blur(60px);
  z-index: 0;
}

/* Name Edit Pen icon sways */
.welcomeTitle:hover .editPenIcon {
  transform: rotate(15deg) scale(1.1);
}

/* ==========================================================================
   FocusNest Premium Mobile-First Layout & Responsiveness Media Queries
   ========================================================================== */

/* 1. Desktop & Global Placement Grid (Grid placement for direct children) */
.workspace-main-responsive {
  display: grid;
  grid-template-columns: 38% 32% 30%;
  gap: 24px;
  align-items: start;
}
.kanban-board-panel {
  grid-column: 1;
  grid-row: 1 / span 3;
}
.timer-panel {
  grid-column: 2;
  grid-row: 1;
}
.ai-panel {
  grid-column: 2;
  grid-row: 2;
}
.vinyl-panel {
  grid-column: 3;
  grid-row: 1;
}
.insights-panel {
  grid-column: 3;
  grid-row: 2;
}
.group-panel {
  grid-column: 3;
  grid-row: 3;
}

/* 2. Tablet Responsive Layout (768px - 1024px) */
@media (min-width: 769px) and (max-width: 1024px) {
  .workspace-main-responsive {
    grid-template-columns: 1fr 1fr !important;
    gap: 20px !important;
  }
  .kanban-board-panel {
    grid-column: 1 !important;
    grid-row: 1 / span 5 !important;
  }
  .timer-panel {
    grid-column: 2 !important;
    grid-row: 1 !important;
  }
  .ai-panel {
    grid-column: 2 !important;
    grid-row: 2 !important;
  }
  .group-panel {
    grid-column: 2 !important;
    grid-row: 3 !important;
  }
  .insights-panel {
    grid-column: 2 !important;
    grid-row: 4 !important;
  }
  .vinyl-panel {
    grid-column: 2 !important;
    grid-row: 5 !important;
  }
}

/* 3. Mobile Responsive Layout (under 768px) */
@media (max-width: 768px) {
  /* Main Stacking via Flexbox + Order property */
  .workspace-main-responsive {
    display: flex !important;
    flex-direction: column !important;
    gap: 20px !important;
    padding: 16px 12px !important;
    padding-bottom: 80px !important; /* Future-proof bottom nav drawer spacing */
  }

  /* Strict Mobile Ordering */
  .timer-panel {
    order: 1 !important;
  }
  .ai-panel {
    order: 2 !important;
  }
  .kanban-board-panel {
    order: 3 !important;
  }
  .group-panel {
    order: 4 !important;
  }
  .insights-panel {
    order: 5 !important;
  }
  .vinyl-panel {
    order: 6 !important;
  }

  /* Pomodoro Timer Mobile: Large Centered (Min 220px) */
  .circular-timer-outer {
    width: 230px !important;
    height: 230px !important;
    margin: 20px auto !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }
  .timer-clock-circle {
    width: 220px !important;
    height: 220px !important;
  }
  .timer-svg-progress {
    width: 230px !important;
    height: 230px !important;
  }
  .timer-toggles {
    flex-wrap: wrap !important;
    justify-content: center !important;
    gap: 8px !important;
  }
  .timer-toggles button {
    flex: 1 1 45% !important;
    min-height: 44px !important;
  }

  /* Kanban Board Mobile: Single Lane Carousel view with Capsule Tabs */
  .mobile-kanban-tabs {
    display: flex !important;
  }
  .kanban-columns-responsive {
    display: block !important;
  }
  .kanban-column-dropzone {
    display: none !important; /* Hide other lanes */
  }
  .kanban-column-dropzone.mobile-active {
    display: block !important; /* Show active lane only */
    animation: slideInTab 300ms cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Add Task Modal to Sliding Bottom Sheet */
  .add-task-modal-overlay {
    align-items: flex-end !important;
  }
  .add-task-modal-content {
    width: 100% !important;
    max-width: 100% !important;
    border-radius: 24px 24px 0 0 !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    transform: translateY(0);
    animation: slideUpModal 400ms cubic-bezier(0.16, 1, 0.3, 1) !important;
    padding: 24px 20px 48px 20px !important; /* Spacing for home indicators / future-proof spacing */
    box-sizing: border-box !important;
  }

  /* Premium Touch Targets (Minimum 44px) */
  button, input, select, textarea, .ai-suggestion-bubble, .timer-toggle-btn, .duration-option-btn, .mobile-tab-btn {
    min-height: 44px !important;
    box-sizing: border-box !important;
  }

  /* Cozy Spacing Adjustments */
  .desk-panel {
    padding: 16px !important;
  }
  .buddies-row {
    justify-content: center !important;
  }
}

@keyframes slideInTab {
  from {
    opacity: 0;
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideUpModal {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
`;
