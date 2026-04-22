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

/* ══════════════════════════════════════════════════════════════════════════
   Types
═══════════════════════════════════════════════════════════════════════════ */
export interface UserData {
  id:          string;
  email:       string;
  displayName: string;
  photoURL?:   string;
  role:        'admin' | 'user';
  status:      'active' | 'suspended';
  createdAt:   string;
  updatedAt:   string;
  lastLogin?:  string;
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
  collections?: {
    journal:  string;
    therapy:  string;
    gallery:  string;
    history:  string;
  };
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
   localStorage helpers  (no JSON.parse errors bubble up to the console)
═══════════════════════════════════════════════════════════════════════════ */
function lsGet<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; }
  catch { return null; }
}

function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota exceeded – ignore */ }
}

function lsRemove(key: string): void {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

/* ══════════════════════════════════════════════════════════════════════════
   DB helpers (localStorage acts as the local database)
═══════════════════════════════════════════════════════════════════════════ */
function readUser(userId: string): UserData | null {
  const users = lsGet<UserData[]>('users') ?? [];
  return users.find(u => u.id === userId) ?? null;
}

function writeUser(userData: UserData): void {
  const users = lsGet<UserData[]>('users') ?? [];
  const idx   = users.findIndex(u => u.id === userData.id);
  const next  = { ...userData, updatedAt: new Date().toISOString() };
  if (idx !== -1) users[idx] = next; else users.push(next);
  lsSet('users', users);
}

function ensureCollections(userId: string): void {
  // Only create if they genuinely don't exist yet
  if (lsGet(`journal_${userId}`)) return;
  const now = new Date().toISOString();
  lsSet(`journal_${userId}`,  { userId, entries: [],       createdAt: now, updatedAt: now });
  lsSet(`therapy_${userId}`,  { userId, dailyTasks: [],    completedTasks: [], streak: 0, lastActive: now, createdAt: now, updatedAt: now });
  lsSet(`gallery_${userId}`,  { userId, artworks: [],      createdAt: now, updatedAt: now });
  lsSet(`history_${userId}`,  { userId, activities: [{ type: 'account_created', timestamp: now, description: 'Акаунтът беше създаден' }], moodEntries: [], achievements: [], createdAt: now, updatedAt: now });
}

function buildDefaultUserData(firebaseUser: User, isAdmin: boolean): UserData {
  return {
    id:          firebaseUser.uid,
    email:       firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Потребител',
    photoURL:    firebaseUser.photoURL ?? undefined,
    role:        isAdmin ? 'admin' : 'user',
    status:      'active',
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
    lastLogin:   new Date().toISOString(),
    settings:    { theme: 'system', notifications: true, language: 'bg', emailNotifications: true },
    preferences: { weeklyReport: true, dailyReminder: true, reminderTime: '09:00' },
    collections: {
      journal: `journal_${firebaseUser.uid}`,
      therapy: `therapy_${firebaseUser.uid}`,
      gallery: `gallery_${firebaseUser.uid}`,
      history: `history_${firebaseUser.uid}`,
    },
  };
}

function appendHistory(userId: string, type: string, description: string): void {
  const raw = lsGet<{ activities: unknown[]; updatedAt: string }>(`history_${userId}`);
  if (!raw) return;
  raw.activities.push({ type, timestamp: new Date().toISOString(), description });
  raw.updatedAt = new Date().toISOString();
  lsSet(`history_${userId}`, raw);
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

  /* ── Admin claim check ──────────────────────────────────────────────── */
  const checkAdminStatus = async (user: User): Promise<boolean> => {
    try {
      const result = await user.getIdTokenResult(/* forceRefresh */ false);
      const admin  = result.claims.role === 'admin';
      setIsAdmin(admin);
      return admin;
    } catch {
      setIsAdmin(false);
      return false;
    }
  };

  /* ── syncUserData — single source of truth for state + localStorage ─── */
  const syncUserData = useCallback(async (firebaseUser: User): Promise<UserData> => {
    const adminStatus = await checkAdminStatus(firebaseUser);

    let userData = readUser(firebaseUser.uid);

    if (!userData) {
      // First ever login — create the record and all collections
      userData = buildDefaultUserData(firebaseUser, adminStatus);
      writeUser(userData);
      ensureCollections(firebaseUser.uid);
    } else {
      // Merge in any Firebase-side changes (display name / photo updated externally)
      userData = {
        ...userData,
        displayName: firebaseUser.displayName ?? userData.displayName,
        photoURL:    firebaseUser.photoURL    ?? userData.photoURL,
        role:        adminStatus ? 'admin'    : userData.role,
        lastLogin:   new Date().toISOString(),
      };
      writeUser(userData);
      // Ensure collections exist even for older accounts
      ensureCollections(firebaseUser.uid);
    }

    if (userData.status === 'suspended') {
      await signOut(auth);
      throw new Error('Вашият акаунт е деактивиран. Моля, свържете се с администратор.');
    }

    setCurrentUserData(userData);
    lsSet('currentUser', userData);
    return userData;
  }, []);

  /* ── Auth state listener ─────────────────────────────────────────────── */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Don't double-sync when login() / signup() already called syncUserData
        if (!syncing.current) {
          try { await syncUserData(user); } catch { /* suspended – already signed out */ }
        }
      } else {
        setCurrentUserData(null);
        setIsAdmin(false);
        lsRemove('currentUser');
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
      appendHistory(cred.user.uid, 'login', 'Успешен вход в системата');
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
      // Set the display name on the Firebase user object before syncing
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
      appendHistory(currentUser.uid, 'logout', 'Успешен изход от системата');
    }
    setCurrentUserData(null);
    setIsAdmin(false);
    lsRemove('currentUser');
    await signOut(auth);
  };

  /* ── resetPassword ───────────────────────────────────────────────────── */
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

  /* ── updateUserProfile ───────────────────────────────────────────────── */
  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<void> => {
    if (!currentUser || !currentUserData) throw new Error('Няма логнат потребител');

    // Push changes to Firebase
    await updateProfile(currentUser, {
      ...(data.displayName !== undefined && { displayName: data.displayName }),
      ...(data.photoURL    !== undefined && { photoURL:    data.photoURL    }),
    });

    // Merge into local record
    const updated: UserData = {
      ...currentUserData,
      displayName: data.displayName ?? currentUserData.displayName,
      photoURL:    data.photoURL    ?? currentUserData.photoURL,
      updatedAt:   new Date().toISOString(),
    };

    writeUser(updated);
    setCurrentUserData(updated);
    lsSet('currentUser', updated);
  };

  /* ── updateUserSettings ──────────────────────────────────────────────── */
  const updateUserSettings = async (settings: Partial<UserData['settings']>): Promise<void> => {
    if (!currentUserData) throw new Error('Няма логнат потребител');
    const updated: UserData = {
      ...currentUserData,
      settings:  { ...currentUserData.settings, ...settings },
      updatedAt: new Date().toISOString(),
    };
    writeUser(updated);
    setCurrentUserData(updated);
    lsSet('currentUser', updated);
  };

  /* ── updateUserPreferences ───────────────────────────────────────────── */
  const updateUserPreferences = async (prefs: Partial<UserData['preferences']>): Promise<void> => {
    if (!currentUserData) throw new Error('Няма логнат потребител');
    const updated: UserData = {
      ...currentUserData,
      preferences: { ...currentUserData.preferences, ...prefs },
      updatedAt:   new Date().toISOString(),
    };
    writeUser(updated);
    setCurrentUserData(updated);
    lsSet('currentUser', updated);
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