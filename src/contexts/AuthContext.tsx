import React, {
  createContext, useContext, useEffect,
  useState, useCallback, useRef,
} from 'react';
import {
  type User,
  type UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

/* ══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */
export interface UserData {
  uid:          string;
  email:        string;
  displayName:  string;
  photoURL:     string;
  role:         'admin' | 'user';
  status:       'active' | 'suspended';
  createdAt:    Timestamp;
  updatedAt:    Timestamp;
  lastLogin:    Timestamp;
  settings: {
    theme:                'light' | 'dark' | 'system';
    notifications:        boolean;
    language:             string;
    emailNotifications:   boolean;
  };
  preferences: {
    weeklyReport:   boolean;
    dailyReminder:  boolean;
    reminderTime:   string;
  };
  stats: {
    totalTasksCompleted: number;
    currentStreak: number;
    longestStreak: number;
    totalArtworks: number;
    totalJournalEntries: number;
    lastActiveDate: string;
  };
  bio: string;
  isActive: boolean;
}

interface AuthContextType {
  currentUser:        User | null;
  currentUserData:    UserData | null;
  loading:            boolean;
  isAuthenticated:    boolean;
  isAdmin:            boolean;
  login:              (email: string, password: string) => Promise<UserCredential>;
  signup:             (email: string, password: string, displayName: string) => Promise<UserCredential>;
  logout:             () => Promise<void>;
  resetPassword:      (email: string) => Promise<void>;
  updateUserProfile:  (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateUserSettings: (settings: Partial<UserData['settings']>) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserData['preferences']>) => Promise<void>;
  refreshUserData:    () => Promise<UserData | null>;
  checkUserStatus:    () => Promise<boolean>;
}

/* ══════════════════════════════════════════════════════════════════════════
   Context
═══════════════════════════════════════════════════════════════════════════ */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

/* ══════════════════════════════════════════════════════════════════════════
   Firestore helpers
═══════════════════════════════════════════════════════════════════════════ */
async function readUserFromFirestore(userId: string): Promise<UserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error reading user from Firestore:', error);
    return null;
  }
}

async function writeUserToFirestore(userData: UserData): Promise<void> {
  try {
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, userData, { merge: true });
  } catch (error) {
    console.error('Error writing user to Firestore:', error);
    throw error;
  }
}

async function updateUserInFirestore(userId: string, updates: Partial<UserData>): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user in Firestore:', error);
    throw error;
  }
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

/* ══════════════════════════════════════════════════════════════════════════
   Provider
═══════════════════════════════════════════════════════════════════════════ */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser,     setCurrentUser]     = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [loading,         setLoading]         = useState(true);

  // Prevent calling syncUserData twice when auth state fires during login/signup
  const syncing = useRef(false);

  /* ── Build default user data for new users ──────────────────────────── */
  const buildDefaultUserData = (firebaseUser: User): UserData => {
    const now = Timestamp.now();
    const today = getTodayKey();
   
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Потребител',
      photoURL: firebaseUser.photoURL ?? '',
      role: 'user', // 👈 Нов потребител винаги е 'user'
      status: 'active',
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      settings: {
        theme: 'system',
        notifications: true,
        language: 'bg',
        emailNotifications: true,
      },
      preferences: {
        weeklyReport: true,
        dailyReminder: true,
        reminderTime: '09:00',
      },
      stats: {
        totalTasksCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalArtworks: 0,
        totalJournalEntries: 0,
        lastActiveDate: today,
      },
      bio: '',
      isActive: true,
    };
  };

  /* ── Initialize daily progress for new users ────────────────────────── */
  const initializeDailyProgress = async (userId: string) => {
    const today = getTodayKey();
    const defaultTasks = [
      { id: 'bt1', text: 'Нарисувайте нещо, което ви радва днес', completed: false, category: 'drawing', duration: '10 мин', skipped: false },
      { id: 'bt2', text: 'Оцветете нещо с цветовете на настроението си', completed: false, category: 'painting', duration: '15 мин', skipped: false },
      { id: 'bt3', text: 'Медитирайте 5 минути, след това скицирайте', completed: false, category: 'mindful', duration: '10 мин', skipped: false },
      { id: 'bt4', text: 'Създайте нещо само с кръгове и линии', completed: false, category: 'creative', duration: '10 мин', skipped: false },
      { id: 'bt5', text: 'Нарисувайте любимото си място', completed: false, category: 'drawing', duration: '20 мин', skipped: false },
      { id: 'bt6', text: 'Изразете емоция чрез абстрактно изкуство', completed: false, category: 'painting', duration: '15 мин', skipped: false },
      { id: 'bt7', text: 'Направете мандала или симетричен дизайн', completed: false, category: 'mindful', duration: '20 мин', skipped: false },
      { id: 'bt8', text: 'Скицирайте 3 неща, за които сте благодарни', completed: false, category: 'personal', duration: '10 мин', skipped: false },
      { id: 'bt9', text: 'Нарисувайте нещо, което намирате за красиво', completed: false, category: 'drawing', duration: '15 мин', skipped: false },
      { id: 'bt10', text: 'Изразете един страх или притеснение в рисунка', completed: false, category: 'personal', duration: '15 мин', skipped: false },
    ];

    try {
      const progressRef = doc(db, 'dailyProgress', `${userId}_${today}`);
      await setDoc(progressRef, {
        userId,
        date: today,
        tasks: defaultTasks,
        customTasks: [],
        completedCount: 0,
        streak: 0,
        allCompleted: false,
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error initializing daily progress:', error);
    }
  };

  /* ── syncUserData — single source of truth for state + Firestore ────── */
  const syncUserData = useCallback(async (firebaseUser: User): Promise<UserData> => {
    let userData = await readUserFromFirestore(firebaseUser.uid);

    if (!userData) {
      // First ever login — create the record and initialize collections
      userData = buildDefaultUserData(firebaseUser);
      await writeUserToFirestore(userData);
      await initializeDailyProgress(firebaseUser.uid);
     
      // Also initialize localStorage collections as backup
      const now = new Date().toISOString();
      localStorage.setItem(`journal_${firebaseUser.uid}`, JSON.stringify({ userId: firebaseUser.uid, entries: [], createdAt: now }));
      localStorage.setItem(`therapy_${firebaseUser.uid}`, JSON.stringify({ userId: firebaseUser.uid, dailyTasks: [], completedTasks: [], streak: 0, lastActive: now, createdAt: now }));
      localStorage.setItem(`gallery_${firebaseUser.uid}`, JSON.stringify({ userId: firebaseUser.uid, artworks: [], createdAt: now }));
      localStorage.setItem(`history_${firebaseUser.uid}`, JSON.stringify({
        userId: firebaseUser.uid,
        activities: [{ type: 'account_created', timestamp: now, description: 'Акаунтът беше създаден' }],
        moodEntries: [],
        achievements: [],
        createdAt: now
      }));
    } else {
      // Update last login and merge any Firebase-side changes
      const updates: Partial<UserData> = {
        displayName: firebaseUser.displayName ?? userData.displayName,
        photoURL: firebaseUser.photoURL ?? userData.photoURL,
        lastLogin: Timestamp.now(),
        isActive: true,
      };
     
      await updateUserInFirestore(firebaseUser.uid, updates);
      userData = { ...userData, ...updates };
    }

    // 👈 Важно: setIsAdmin идва от userData.role (от Firestore)
    setIsAdmin(userData.role === 'admin');

    if (userData.status === 'suspended') {
      await signOut(auth);
      throw new Error('Вашият акаунт е деактивиран. Моля, свържете се с администратор.');
    }

    setCurrentUserData(userData);
   
    // Cache in localStorage for quick access
    localStorage.setItem('currentUser', JSON.stringify({
      id: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      status: userData.status,
      settings: userData.settings,
    }));
   
    return userData;
  }, []);

  /* ── Auth state listener ─────────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        if (!syncing.current) {
          try {
            await syncUserData(user);
          } catch (error) {
            console.error('Error syncing user data:', error);
          }
        }
      } else {
        setCurrentUserData(null);
        setIsAdmin(false);
        localStorage.removeItem('currentUser');
      }

      setLoading(false);
    });

    return unsub;
  }, [syncUserData]);

  /* ── login ───────────────────────────────────────────────────────────── */
  const login = async (email: string, password: string): Promise<UserCredential> => {
    syncing.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await syncUserData(cred.user);
     
      const historyRef = doc(db, 'history', `${cred.user.uid}_${Date.now()}`);
      await setDoc(historyRef, {
        userId: cred.user.uid,
        type: 'login',
        timestamp: Timestamp.now(),
        description: 'Успешен вход в системата',
      });
     
      return cred;
    } finally {
      syncing.current = false;
    }
  };

  /* ── signup ──────────────────────────────────────────────────────────── */
  const signup = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    syncing.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });
      await syncUserData(cred.user);
      return cred;
    } finally {
      syncing.current = false;
    }
  };

  /* ── logout ──────────────────────────────────────────────────────────── */
  const logout = async (): Promise<void> => {
    if (currentUser) {
      const historyRef = doc(db, 'history', `${currentUser.uid}_${Date.now()}`);
      await setDoc(historyRef, {
        userId: currentUser.uid,
        type: 'logout',
        timestamp: Timestamp.now(),
        description: 'Успешен изход от системата',
      });
    }
   
    setCurrentUserData(null);
    setIsAdmin(false);
    localStorage.removeItem('currentUser');
    await signOut(auth);
  };

  /* ── resetPassword ───────────────────────────────────────────────────── */
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  /* ── updateUserProfile ───────────────────────────────────────────────── */
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!currentUser || !currentUserData) throw new Error('Няма логнат потребител');

    await updateProfile(currentUser, {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.photoURL    !== undefined && { photoURL:    data.photoURL    }),
    });

    const updates: Partial<UserData> = {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.photoURL    !== undefined && { photoURL:    data.photoURL }),
    };
   
    await updateUserInFirestore(currentUser.uid, updates);
   
    const updated = await readUserFromFirestore(currentUser.uid);
    if (updated) {
      setCurrentUserData(updated);
      localStorage.setItem('currentUser', JSON.stringify({
        id: updated.uid,
        email: updated.email,
        displayName: updated.displayName,
        role: updated.role,
        status: updated.status,
        settings: updated.settings,
      }));
    }
  };

  /* ── updateUserSettings ──────────────────────────────────────────────── */
  const updateUserSettings = async (settings: Partial<UserData['settings']>): Promise<void> => {
    if (!currentUserData) throw new Error('Няма логнат потребител');
   
    const updatedSettings = { ...currentUserData.settings, ...settings };
    await updateUserInFirestore(currentUserData.uid, { settings: updatedSettings });
   
    const updated = await readUserFromFirestore(currentUserData.uid);
    if (updated) {
      setCurrentUserData(updated);
    }
  };

  /* ── updateUserPreferences ───────────────────────────────────────────── */
  const updateUserPreferences = async (prefs: Partial<UserData['preferences']>): Promise<void> => {
    if (!currentUserData) throw new Error('Няма логнат потребител');
   
    const updatedPrefs = { ...currentUserData.preferences, ...prefs };
    await updateUserInFirestore(currentUserData.uid, { preferences: updatedPrefs });
   
    const updated = await readUserFromFirestore(currentUserData.uid);
    if (updated) {
      setCurrentUserData(updated);
    }
  };

  /* ── refreshUserData ─────────────────────────────────────────────────── */
  const refreshUserData = async (): Promise<UserData | null> => {
    if (!currentUser) return null;
    return syncUserData(currentUser);
  };

  /* ── checkUserStatus ─────────────────────────────────────────────────── */
  const checkUserStatus = async (): Promise<boolean> => {
    if (!currentUserData) return false;
    if (currentUserData.status === 'suspended') {
      await logout();
      throw new Error('Вашият акаунт е деактивиран. Моля, свържете се с администратор.');
    }
    return true;
  };

  /* ── context value ───────────────────────────────────────────────────── */
  const value: AuthContextType = {
    currentUser,
    currentUserData,
    loading,
    isAuthenticated: !!currentUser,
    isAdmin,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserSettings,
    updateUserPreferences,
    refreshUserData,
    checkUserStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};