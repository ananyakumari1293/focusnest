/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

interface Member {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

interface Presence {
  uid: string;
  displayName: string;
  photoURL: string;
  online: boolean;
  lastSeen: number;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any;
}

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Firestore Room States
  const [roomName, setRoomName] = useState<string>('Cozy Study Room');
  const [roomGoal, setRoomGoal] = useState<string>('');
  const [ownerUid, setOwnerUid] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);

  // Room states loading and existence
  const [loading, setLoading] = useState<boolean>(true);
  const [roomExists, setRoomExists] = useState<boolean>(true);

  // Shared Timer States
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(25 * 60);
  const [timerStartTimestamp, setTimerStartTimestamp] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerTargetDuration, setTimerTargetDuration] = useState<number>(25 * 60);

  // Chat & Presence States
  const [presenceList, setPresenceList] = useState<{ [uid: string]: Presence }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<string>('');

  // Refs for intervals & scrolling
  const timerIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 0. Room route protection redirect check
  useEffect(() => {
    if (authLoading) return;

    // Logged out: redirect to JoinRoom gateway to cache pending join
    if (!user) {
      navigate(`/join/${roomId}`);
      return;
    }

    // Logged in but not in members list (e.g. manual URL navigation): redirect to JoinRoom
    if (!loading && roomExists && members.length > 0) {
      const isMember = members.some((m) => m.uid === user.uid);
      if (!isMember) {
        navigate(`/join/${roomId}`);
      }
    }
  }, [user, authLoading, loading, roomExists, members, roomId, navigate]);

  // 1. Subscribe to Room document (real-time name, goals, members list, timer state)
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'studyRooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRoomName(data.roomName || 'Cozy Study Room');
        setRoomGoal(data.roomGoal || '');
        setGoalInput(data.roomGoal || '');
        setOwnerUid(data.ownerUid || '');
        setMembers(data.members || []);
        
        // Sync Timer states from Firestore
        const isRunning = data.timerRunning || false;
        const duration = data.timerDuration || 25 * 60;
        const startTimestamp = data.timerStartTimestamp || 0;

        setTimerRunning(isRunning);
        setTimerDuration(duration);
        setTimerStartTimestamp(startTimestamp);
        
        // Track the full target duration for resets
        if (duration === 25 * 60 || duration === 50 * 60 || duration === 90 * 60) {
          setTimerTargetDuration(duration);
        }
        
        if (isRunning && startTimestamp > 0) {
          const elapsed = Math.floor((Date.now() - startTimestamp) / 1000);
          const remaining = Math.max(0, duration - elapsed);
          setTimeLeft(remaining);
        } else {
          setTimeLeft(duration);
        }
        
        setRoomExists(true);
      } else {
        setRoomExists(false);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching room doc', err);
      setRoomExists(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  // 2. Client-side timer interval synchronizer
  useEffect(() => {
    if (timerRunning && timerStartTimestamp > 0) {
      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTimestamp) / 1000);
        const remaining = Math.max(0, timerDuration - elapsed);
        setTimeLeft(remaining);

        if (remaining <= 0) {
          if (timerIntervalRef.current) {
            window.clearInterval(timerIntervalRef.current);
          }
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimeLeft(timerDuration);
    }

    return () => {
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning, timerDuration, timerStartTimestamp]);

  // 3. Presence tracking logic
  useEffect(() => {
    if (!user || !roomId || !roomExists) return;

    const presenceRef = doc(db, 'studyRooms', roomId, 'presence', user.uid);
    const defaultName = user.displayName || localStorage.getItem('focusnest_name') || 'Study Buddy';
    const defaultAvatar = user.photoURL || localStorage.getItem('focusnest_avatar') || '';

    // Mark Online
    const setOnline = async () => {
      try {
        await setDoc(presenceRef, {
          uid: user.uid,
          displayName: defaultName,
          photoURL: defaultAvatar,
          online: true,
          lastSeen: Date.now()
        });
      } catch (err) {
        console.warn('Error setting presence online', err);
      }
    };

    setOnline();

    // Mark Offline on Unmount or Tab Close
    const setOffline = async () => {
      try {
        await updateDoc(presenceRef, {
          online: false,
          lastSeen: Date.now()
        });
      } catch (err) {
        console.warn('Error setting presence offline', err);
      }
    };

    const handleBeforeUnload = () => {
      setOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      setOffline();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, roomId, roomExists]);

  // 4. Subscribe to presence list in the room
  useEffect(() => {
    if (!roomId || !roomExists) return;

    const presenceColRef = collection(db, 'studyRooms', roomId, 'presence');
    const unsubscribe = onSnapshot(presenceColRef, (snapshot) => {
      const presObj: { [uid: string]: Presence } = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as Presence;
        presObj[doc.id] = data;
      });
      setPresenceList(presObj);
    });

    return () => unsubscribe();
  }, [roomId, roomExists]);

  // 5. Subscribe to Chat messages subcollection
  useEffect(() => {
    if (!roomId || !roomExists) return;

    const messagesColRef = collection(db, 'studyRooms', roomId, 'messages');
    const q = query(messagesColRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgsList: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgsList.push({
          id: docSnap.id,
          senderId: data.senderId,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt
        });
      });
      setMessages(msgsList);
    });

    return () => unsubscribe();
  }, [roomId, roomExists]);

  // Auto scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Chat Actions
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !roomId) return;

    try {
      const messagesColRef = collection(db, 'studyRooms', roomId, 'messages');
      const senderName = user.displayName || localStorage.getItem('focusnest_name') || 'Study Buddy';
      
      await addDoc(messagesColRef, {
        senderId: user.uid,
        senderName,
        text: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  // Shared Goal Actions
  const handleSaveGoal = async () => {
    if (!roomId) return;
    try {
      const roomRef = doc(db, 'studyRooms', roomId);
      await updateDoc(roomRef, {
        roomGoal: goalInput.trim()
      });
      setIsEditingGoal(false);
    } catch (err) {
      console.error('Failed to save goal', err);
    }
  };

  // Shared Timer Actions
  const toggleTimer = async () => {
    if (!roomId) return;
    const roomRef = doc(db, 'studyRooms', roomId);

    try {
      if (timerRunning) {
        // Pause timer: calculate exactly what remains
        const elapsed = Math.floor((Date.now() - timerStartTimestamp) / 1000);
        const remaining = Math.max(0, timerDuration - elapsed);
        await updateDoc(roomRef, {
          timerRunning: false,
          timerDuration: remaining,
          timerStartTimestamp: 0
        });
      } else {
        // Start/resume timer
        await updateDoc(roomRef, {
          timerRunning: true,
          timerStartTimestamp: Date.now(),
          timerDuration: timeLeft
        });
      }
    } catch (err) {
      console.error('Failed to toggle timer', err);
    }
  };

  const handleResetTimer = async () => {
    if (!roomId) return;
    const roomRef = doc(db, 'studyRooms', roomId);
    try {
      await updateDoc(roomRef, {
        timerRunning: false,
        timerDuration: timerTargetDuration, // reset to full target session duration
        timerStartTimestamp: 0
      });
    } catch (err) {
      console.error('Failed to reset timer', err);
    }
  };

  const handleChangeDuration = async (minutes: number) => {
    if (!roomId) return;
    const roomRef = doc(db, 'studyRooms', roomId);
    try {
      await updateDoc(roomRef, {
        timerRunning: false,
        timerDuration: minutes * 60,
        timerStartTimestamp: 0
      });
    } catch (err) {
      console.error('Failed to change duration', err);
    }
  };

  // Invitation Actions
  const handleCopyInviteLink = () => {
    if (!roomId) return;
    setCopyFeedback(true);
    const inviteLink = `${window.location.origin}/join/${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    setTimeout(() => {
      setCopyFeedback(false);
    }, 3000);
  };

  // Leave Room Actions
  const handleLeaveRoom = async () => {
    if (!user || !roomId) return;

    try {
      // 1. Mark presence as offline
      const presenceRef = doc(db, 'studyRooms', roomId, 'presence', user.uid);
      await updateDoc(presenceRef, {
        online: false,
        lastSeen: Date.now()
      });

      // 2. Remove user from room static membership array
      const roomRef = doc(db, 'studyRooms', roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        const currentMembers = data.members || [];
        const updatedMembers = currentMembers.filter((m: any) => m.uid !== user.uid);
        
        await updateDoc(roomRef, {
          members: updatedMembers
        });
      }
    } catch (err) {
      console.warn('Failed to cleanly remove from members list', err);
    } finally {
      // 3. Clear local storage active room reference
      localStorage.removeItem('focusnest_active_room_id');
      
      // 4. Return to workspace
      navigate('/workspace');
    }
  };

  const handleReturnToWorkspace = () => {
    navigate('/workspace');
  };

  // Helper formatting minutes:seconds
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Circular progress calculations (circumference = 534)
  const circleRadius = 85;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progressPercent = timerDuration > 0 ? timeLeft / timerDuration : 1;
  const strokeDashoffset = circleCircumference - (circleCircumference * progressPercent);
  const remainingPercentage = Math.round(progressPercent * 100);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <span style={{ fontSize: '2.5rem', animation: 'spin 2s linear infinite', display: 'inline-block' }}>🌸</span>
          <h2 style={{ fontSize: '1.25rem', color: '#2D2A3A', fontWeight: 650, margin: '16px 0 0 0' }}>Cozying up the Room...</h2>
        </div>
      </div>
    );
  }

  if (!roomExists) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <span style={{ fontSize: '3rem' }}>🌿</span>
          <h2 style={styles.errorTitle}>Study Room Missing</h2>
          <p style={styles.errorText}>We couldn't load this study desk. It may have expired or been disbanded.</p>
          <button onClick={() => navigate('/workspace')} style={styles.errorBtn} className="btn-scale-primary">
            Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER SECTION */}
      <header style={styles.header}>
        <div style={styles.logoGroup} onClick={handleReturnToWorkspace}>
          <span style={styles.logoIcon}>🌸</span>
          <span style={styles.logoText}>FocusNest Room</span>
        </div>

        <div style={styles.headerRoomInfo}>
          <h1 style={styles.headerRoomName}>{roomName}</h1>
          <span style={styles.headerMemberCount}>
            👥 {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div style={styles.headerActions}>
          <button 
            onClick={handleCopyInviteLink} 
            style={styles.btnSecondary} 
            className="btn-scale-secondary"
          >
            🔗 Copy Link
          </button>
          <button 
            onClick={handleLeaveRoom} 
            style={styles.btnLeave} 
            className="btn-scale-secondary"
          >
            🚪 Leave Room
          </button>
        </div>
      </header>

      {copyFeedback && (
        <div style={styles.copyFeedbackAlert}>
          ✓ Invite link copied! Share the study desk: {window.location.origin}/join/{roomId} 🌸
        </div>
      )}

      {/* MAIN LAYOUT */}
      <main style={styles.mainGrid}>
        
        {/* LEFT COLUMN: SHARED POMODORO TIMER */}
        <section style={styles.columnCard} className="glass-card shadow-premium timer-section">
          <h3 style={styles.cardTitle}>🌸 Study Desk Timer</h3>
          
          <div style={styles.timerCenter}>
            <div style={styles.timerCircleContainer}>
              <svg width="220" height="220" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="110"
                  cy="110"
                  r={circleRadius}
                  stroke="#F3EBF9"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="110"
                  cy="110"
                  r={circleRadius}
                  stroke="#F8C8DC"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circleCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div style={styles.timerClockTextContainer}>
                <h2 style={styles.timerText}>{formatTime(timeLeft)}</h2>
                <span style={styles.timerPercentLabel}>{remainingPercentage}% remaining</span>
              </div>
            </div>
          </div>

          <div style={styles.timerControls}>
            <button 
              onClick={toggleTimer} 
              style={{
                ...styles.btnPrimary,
                backgroundColor: timerRunning ? '#A8D5BA' : '#B794F6'
              }}
              className="btn-scale-primary"
            >
              {timerRunning ? '⏸️ Pause' : '▶️ Start'}
            </button>
            <button 
              onClick={handleResetTimer} 
              style={styles.btnSecondary}
              className="btn-scale-secondary"
            >
              🔄 Reset
            </button>
          </div>

          <div style={styles.durationSelector}>
            <span style={styles.durationSelectorLabel}>Change duration:</span>
            <div style={styles.durationButtonsRow}>
              <button 
                onClick={() => handleChangeDuration(25)} 
                style={styles.btnDuration}
                className="btn-scale-secondary"
              >
                25m
              </button>
              <button 
                onClick={() => handleChangeDuration(50)} 
                style={styles.btnDuration}
                className="btn-scale-secondary"
              >
                50m
              </button>
              <button 
                onClick={() => handleChangeDuration(90)} 
                style={styles.btnDuration}
                className="btn-scale-secondary"
              >
                90m
              </button>
            </div>
          </div>
        </section>

        {/* CENTER COLUMN: SHARED GOALS SECTION */}
        <section style={styles.columnCard} className="glass-card shadow-premium goal-section">
          <h3 style={styles.cardTitle}>🎯 Shared Room Goal</h3>
          <p style={styles.goalDescription}>Establish a main focus target for everyone in the room. Realtime updates for all partners.</p>

          <div style={styles.goalDisplayContainer}>
            {isEditingGoal ? (
              <div style={styles.goalEditRow}>
                <input 
                  type="text" 
                  value={goalInput} 
                  onChange={(e) => setGoalInput(e.target.value)} 
                  placeholder="e.g. Finish 5 DSA questions..."
                  style={styles.goalInput}
                  maxLength={100}
                />
                <div style={styles.goalActionsRow}>
                  <button onClick={handleSaveGoal} style={styles.goalBtnSave} className="btn-scale-primary">
                    Save
                  </button>
                  <button onClick={() => setIsEditingGoal(false)} style={styles.goalBtnCancel} className="btn-scale-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={styles.goalViewRow}>
                <div style={styles.goalTextCard}>
                  {roomGoal ? (
                    <span style={styles.goalText}>“ {roomGoal} ”</span>
                  ) : (
                    <span style={styles.goalTextPlaceholder}>No goal set yet. Click edit to align your targets! 🌸</span>
                  )}
                </div>
                <button 
                  onClick={() => {
                    setGoalInput(roomGoal);
                    setIsEditingGoal(true);
                  }}
                  style={styles.goalBtnEdit}
                  className="btn-scale-secondary"
                >
                  📝 Edit Goal
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: ONLINE MEMBERS PANEL */}
        <section style={styles.columnCard} className="glass-card shadow-premium members-section">
          <h3 style={styles.cardTitle}>👥 Study Buddies</h3>
          
          <div style={styles.buddiesList}>
            {members.map((member) => {
              const presence = presenceList[member.uid];
              const isOnline = presence ? presence.online : false;

              return (
                <div key={member.uid} style={styles.buddyRow} className="buddy-hover-card">
                  <div style={{
                    ...styles.buddyAvatar,
                    backgroundColor: member.uid === user?.uid ? '#F5F3FF' : '#FDF2F8'
                  }}>
                    {member.photoURL ? (
                      <img 
                        src={member.photoURL} 
                        alt={member.displayName} 
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                      />
                    ) : (
                      member.displayName ? member.displayName.charAt(0).toUpperCase() : 'B'
                    )}
                    <span 
                      style={{
                        ...styles.buddyStatusDot,
                        backgroundColor: isOnline ? '#A8D5BA' : '#9CA3AF'
                      }}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div style={styles.buddyInfo}>
                    <span style={styles.buddyName}>
                      {member.displayName} {member.uid === user?.uid ? '🌸' : ''}
                    </span>
                    <span style={styles.buddyStatusLabel}>
                      {member.uid === ownerUid ? '👑 Host' : '🌿 Partner'} • {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      {/* BOTTOM SECTION: REALTIME CHAT */}
      <footer style={styles.chatSection} className="glass-card shadow-premium chat-section">
        <h3 style={styles.cardTitle}>💬 Cozy Room Chat</h3>
        
        <div style={styles.chatLogsContainer}>
          {messages.length === 0 ? (
            <div style={styles.chatLogsEmpty}>
              <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>No messages yet. Send a cozy welcome to your partners! 🌸</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div 
                  key={msg.id} 
                  style={{
                    ...styles.chatBubbleRow,
                    justifyContent: isMe ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    ...styles.chatBubble,
                    backgroundColor: isMe ? '#F5F3FF' : '#FAF9F6',
                    border: isMe ? '1px solid #DDD6FE' : '1px solid #EBE7DF',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                  }}>
                    <span style={styles.chatBubbleSender}>{msg.senderName}</span>
                    <p style={styles.chatBubbleText}>{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} style={styles.chatForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message to your study partners..."
            style={styles.chatInput}
            maxLength={200}
          />
          <button 
            type="submit" 
            style={styles.btnChatSend}
            className="btn-scale-primary"
          >
            Send 🌸
          </button>
        </form>
      </footer>
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
    flexDirection: 'column',
    padding: '20px',
    boxSizing: 'border-box'
  },
  loadingContainer: {
    background: 'linear-gradient(135deg, #FAF9F6 0%, #FDF2F8 50%, #F5F3FF 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Inter", sans-serif'
  },
  loadingCard: {
    backgroundColor: 'rgba(250, 249, 246, 0.9)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '30px 40px',
    textAlign: 'center',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.03)'
  },
  errorContainer: {
    background: 'linear-gradient(135deg, #FAF9F6 0%, #FDF2F8 50%, #F5F3FF 100%)',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: '"Inter", sans-serif',
    padding: '20px',
    boxSizing: 'border-box'
  },
  errorCard: {
    backgroundColor: 'rgba(250, 249, 246, 0.95)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '40px 30px',
    textAlign: 'center',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(45, 42, 58, 0.05)',
    boxSizing: 'border-box'
  },
  errorTitle: {
    fontSize: '1.4rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: '16px 0 8px 0'
  },
  errorText: {
    fontSize: '0.9rem',
    color: '#6B7280',
    lineHeight: 1.45,
    margin: '0 0 24px 0'
  },
  errorBtn: {
    backgroundColor: '#B794F6',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: 650,
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '44px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    backgroundColor: 'rgba(250, 249, 246, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '20px',
    padding: '16px 24px',
    marginBottom: '20px',
    boxShadow: '0 10px 30px -10px rgba(45, 42, 58, 0.04)'
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  logoIcon: {
    fontSize: '1.5rem'
  },
  logoText: {
    fontSize: '1.1rem',
    fontWeight: 850,
    color: '#2D2A3A',
    letterSpacing: '-0.5px'
  },
  headerRoomInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  headerRoomName: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: 0
  },
  headerMemberCount: {
    fontSize: '0.78rem',
    color: '#6B7280',
    fontWeight: 550,
    marginTop: '4px'
  },
  headerActions: {
    display: 'flex',
    gap: '8px'
  },
  btnSecondary: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '40px'
  },
  btnLeave: {
    backgroundColor: '#FAF9F6',
    color: '#EF4444',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '40px'
  },
  copyFeedbackAlert: {
    backgroundColor: '#ECFDF5',
    color: '#065F46',
    border: '1px solid #A7F3D0',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '0.85rem',
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: '20px',
    width: '100%',
    boxSizing: 'border-box',
    animation: 'fadeIn 0.3s ease'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  columnCard: {
    backgroundColor: 'rgba(250, 249, 246, 0.75)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: 0,
    letterSpacing: '-0.3px',
    borderBottom: '1px solid #EBE7DF',
    paddingBottom: '12px'
  },
  timerCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '20px 0'
  },
  timerCircleContainer: {
    position: 'relative',
    width: '220px',
    height: '220px'
  },
  timerClockTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none'
  },
  timerText: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#2D2A3A',
    margin: 0,
    fontFamily: '"Courier New", Courier, monospace'
  },
  timerPercentLabel: {
    fontSize: '0.72rem',
    color: '#6B7280',
    fontWeight: 550,
    marginTop: '4px'
  },
  timerControls: {
    display: 'flex',
    gap: '12px'
  },
  btnPrimary: {
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '0.9rem',
    fontWeight: 650,
    cursor: 'pointer',
    flex: 1,
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.05)',
    minHeight: '44px'
  },
  durationSelector: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '8px'
  },
  durationSelectorLabel: {
    fontSize: '0.8rem',
    color: '#6B7280',
    fontWeight: 600
  },
  durationButtonsRow: {
    display: 'flex',
    gap: '8px'
  },
  btnDuration: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '0.8rem',
    fontWeight: 650,
    cursor: 'pointer',
    flex: 1,
    minHeight: '36px'
  },
  goalDescription: {
    fontSize: '0.8rem',
    color: '#6B7280',
    lineHeight: 1.4,
    margin: 0
  },
  goalDisplayContainer: {
    marginTop: '16px',
    backgroundColor: '#FFFDF9',
    border: '1.5px dashed #EBE7DF',
    borderRadius: '16px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    justifyContent: 'center',
    minHeight: '120px',
    boxSizing: 'border-box'
  },
  goalViewRow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'center'
  },
  goalTextCard: {
    width: '100%'
  },
  goalText: {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#6B21A8',
    fontStyle: 'italic',
    lineHeight: 1.4
  },
  goalTextPlaceholder: {
    fontSize: '0.85rem',
    color: '#9CA3AF',
    fontStyle: 'italic'
  },
  goalBtnEdit: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #2D2A3A',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '36px'
  },
  goalEditRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  goalInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #2D2A3A',
    fontSize: '0.88rem',
    color: '#2D2A3A',
    backgroundColor: '#FAF9F6',
    outline: 'none',
    boxSizing: 'border-box'
  },
  goalActionsRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end'
  },
  goalBtnSave: {
    backgroundColor: '#B794F6',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '32px'
  },
  goalBtnCancel: {
    backgroundColor: '#FAF9F6',
    color: '#2D2A3A',
    border: '1.5px solid #EBE7DF',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.78rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '32px'
  },
  buddiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '260px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  buddyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'rgba(250, 249, 246, 0.5)',
    border: '1px solid #EBE7DF',
    borderRadius: '16px',
    padding: '10px 14px',
    boxSizing: 'border-box'
  },
  buddyAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#2D2A3A',
    border: '1.5px solid #2D2A3A',
    position: 'relative'
  },
  buddyStatusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    border: '1.5px solid #2D2A3A'
  },
  buddyInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  buddyName: {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: '#2D2A3A'
  },
  buddyStatusLabel: {
    fontSize: '0.7rem',
    color: '#6B7280',
    fontWeight: 550
  },
  chatSection: {
    backgroundColor: 'rgba(250, 249, 246, 0.75)',
    border: '1.5px solid #EBE7DF',
    borderRadius: '24px',
    padding: '24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  chatLogsContainer: {
    backgroundColor: '#FFFDF9',
    border: '1.5px solid #EBE7DF',
    borderRadius: '16px',
    padding: '16px',
    height: '180px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxSizing: 'border-box'
  },
  chatLogsEmpty: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  chatBubbleRow: {
    display: 'flex',
    width: '100%'
  },
  chatBubble: {
    padding: '10px 14px',
    borderRadius: '16px',
    maxWidth: '70%',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxSizing: 'border-box',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.01)'
  },
  chatBubbleSender: {
    fontSize: '0.68rem',
    fontWeight: 750,
    color: '#6B7280'
  },
  chatBubbleText: {
    fontSize: '0.82rem',
    color: '#2D2A3A',
    margin: 0,
    lineHeight: 1.35
  },
  chatForm: {
    display: 'flex',
    gap: '10px'
  },
  chatInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1.5px solid #2D2A3A',
    fontSize: '0.88rem',
    color: '#2D2A3A',
    backgroundColor: '#FAF9F6',
    outline: 'none',
    boxSizing: 'border-box'
  },
  btnChatSend: {
    backgroundColor: '#B794F6',
    color: '#FAF9F6',
    border: '1.5px solid #2D2A3A',
    borderRadius: '12px',
    padding: '0 20px',
    fontSize: '0.88rem',
    fontWeight: 650,
    cursor: 'pointer',
    minHeight: '44px'
  }
};
