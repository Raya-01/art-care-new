import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, limit,
  Timestamp, where, getDoc
} from 'firebase/firestore';
import {
  Users, Shield, UserX, CheckCircle, XCircle, Search, Filter,
  Mail, Calendar, Activity, Star, Edit2, Save, X, Trash2,
  Lock, Unlock, AlertCircle, UserCheck, UserMinus, ChevronDown, ChevronUp
} from 'lucide-react';

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage: '#A3B995', mist: '#A8BBB9', mistLt: '#D4E3DE',
  forest: '#2C3E35', stone: '#5C6E6A', bgWarm: '#FAF5EF',
  bgCard: '#FFF8F3', border: '#F9DDB8',
  adminGold: '#C49A2A', adminRed: '#E88067', adminGreen: '#6B9C7A',
};

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, ...style }}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7" cy="3.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="7" cy="10.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'active' | 'suspended';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin: Timestamp;
  settings: {
    theme: string;
    notifications: boolean;
    language: string;
    emailNotifications: boolean;
  };
  preferences: {
    weeklyReport: boolean;
    dailyReminder: boolean;
    reminderTime: string;
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
  photoURL: string;
  isActive: boolean;
}

const AdminDashboard: React.FC = () => {
  const { currentUser, isAdmin, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'user'>('user');
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
    totalTasksCompleted: 0,
    totalArtworks: 0,
    totalJournalEntries: 0,
  });

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersList: UserData[] = [];
      let totalTasks = 0, totalArtworks = 0, totalJournal = 0;

      usersSnapshot.forEach((doc) => {
        const user = doc.data() as UserData;
        usersList.push(user);
        totalTasks += user.stats?.totalTasksCompleted || 0;
        totalArtworks += user.stats?.totalArtworks || 0;
        totalJournal += user.stats?.totalJournalEntries || 0;
      });

      usersList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      setUsers(usersList);
      setStats({
        totalUsers: usersList.length,
        activeUsers: usersList.filter(u => u.status === 'active').length,
        suspendedUsers: usersList.filter(u => u.status === 'suspended').length,
        adminUsers: usersList.filter(u => u.role === 'admin').length,
        totalTasksCompleted: totalTasks,
        totalArtworks: totalArtworks,
        totalJournalEntries: totalJournal,
      });
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        role: newRole,
        updatedAt: Timestamp.now(),
      });
      setUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, role: newRole, updatedAt: Timestamp.now() } : u
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      setUsers(prev => prev.map(u =>
        u.uid === userId ? { ...u, status: newStatus, updatedAt: Timestamp.now() } : u
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setShowConfirm(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (userId === currentUser?.uid) {
      alert('Не можете да изтриете собствения си акаунт!');
      return;
    }
    try {
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      setUsers(prev => prev.filter(u => u.uid !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setShowConfirm(null);
    }
  };

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    return date.toLocaleDateString('bg-BG');
  };

  const formatDateTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '—';
    const date = timestamp.toDate();
    return date.toLocaleString('bg-BG');
  };

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg,${C.bgWarm},#EEF4F2)` }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 48, textAlign: 'center', border: `2px solid ${C.border}` }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${C.mistLt}`, borderTopColor: C.salmon, margin: '0 auto 16px', animation: 'spin .8s linear infinite' }} />
          <p style={{ color: C.stone, fontWeight: 600 }}>Зареждане на админ панела...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `linear-gradient(160deg,${C.bgWarm},#EEF4F2)` }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, border: `2px solid ${C.border}` }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.adminRed }}>
            <Shield size={28} color="white" />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.7rem', fontWeight: 700, color: C.forest, marginBottom: 10 }}>Нямате достъп</h2>
          <p style={{ color: C.stone, marginBottom: 28 }}>Този раздел е достъпен само за администратори.</p>
          <a href="/dashboard" style={{ padding: '10px 24px', borderRadius: 999, fontWeight: 700, color: 'white', background: `linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration: 'none' }}>Назад към началната страница</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily: "'Nunito', sans-serif", paddingBottom: 48 }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .admin-rainbow {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#C49A2A,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
        .admin-card {
          animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          background: white;
          border-radius: 24px;
          border: 1px solid #F9DDB8;
          box-shadow: 0 3px 14px rgba(44,62,53,.07);
          transition: box-shadow .22s;
        }
        .admin-table-row {
          transition: background .2s, transform .2s;
        }
        .admin-table-row:hover {
          background: #FFF8F3 !important;
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
        <div className="admin-rainbow" style={{ marginBottom: 24 }} />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2rem', fontWeight: 700, color: C.forest, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={28} style={{ color: C.adminGold }} />
              Администраторски панел
            </h1>
            <p style={{ color: C.stone, marginTop: 4 }}>Управление на потребителите и системни настройки</p>
          </div>
          <button onClick={loadUsers} style={{ padding: '8px 16px', borderRadius: 999, background: C.bgWarm, border: `1.5px solid ${C.mistLt}`, color: C.stone, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
            🔄 Обнови
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Общо потребители', value: stats.totalUsers, icon: <Users size={20} />, color: C.sage },
            { label: 'Активни', value: stats.activeUsers, icon: <UserCheck size={20} />, color: C.adminGreen },
            { label: 'Спрети', value: stats.suspendedUsers, icon: <UserMinus size={20} />, color: C.adminRed },
            { label: 'Администратори', value: stats.adminUsers, icon: <Shield size={20} />, color: C.adminGold },
            { label: 'Завършени задачи', value: stats.totalTasksCompleted, icon: <CheckCircle size={20} />, color: C.salmon },
            { label: 'Качени творби', value: stats.totalArtworks, icon: <Activity size={20} />, color: C.peach },
          ].map((stat, i) => (
            <div key={i} className="admin-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: C.forest }}>{stat.value}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: C.stone }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="admin-card" style={{ padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 10, background: C.bgWarm, borderRadius: 12, padding: '8px 16px', border: `1.5px solid ${C.mistLt}` }}>
              <Search size={18} style={{ color: C.mist }} />
              <input
                type="text"
                placeholder="Търси по име или имейл..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '0.9rem', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Filter size={16} style={{ color: C.mist }} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${C.mistLt}`, background: 'white', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="all">Всички статуси</option>
                <option value="active">Активни</option>
                <option value="suspended">Спрети</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                style={{ padding: '8px 12px', borderRadius: 10, border: `1.5px solid ${C.mistLt}`, background: 'white', fontFamily: 'inherit', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <option value="all">Всички роли</option>
                <option value="admin">Администратори</option>
                <option value="user">Потребители</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: C.bgWarm, borderBottom: `2px solid ${C.border}` }}>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, color: C.forest }}>Потребител</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, color: C.forest }}>Имейл</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: C.forest }}>Роля</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: C.forest }}>Статус</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: C.forest }}>Задачи</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: C.forest }}>Поредица</th>
                  <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, color: C.forest }}>Регистрация</th>
                  <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, color: C.forest }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => (
                  <tr key={user.uid} className="admin-table-row" style={{ borderBottom: `1px solid ${C.border}`, background: idx % 2 === 0 ? 'white' : C.bgWarm }}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: user.photoURL ? 'transparent' : `linear-gradient(135deg,${C.salmon},${C.peach})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700 }}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            (user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: C.forest }}>{user.displayName || '—'}</div>
                          <div style={{ fontSize: '0.7rem', color: C.mist }}>{user.uid.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', color: C.stone, fontSize: '0.85rem' }}>{user.email}</td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      {editingUser === user.uid ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as any)}
                          style={{ padding: '6px 10px', borderRadius: 8, border: `1.5px solid ${C.sage}`, background: 'white', fontSize: '0.8rem' }}
                        >
                          <option value="user">Потребител</option>
                          <option value="admin">Администратор</option>
                        </select>
                      ) : (
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: 999,
                          background: user.role === 'admin' ? `${C.adminGold}20` : `${C.sage}20`,
                          color: user.role === 'admin' ? C.adminGold : C.sage,
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}>
                          {user.role === 'admin' ? '👑 Админ' : '👤 Потребител'}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: 999,
                        background: user.status === 'active' ? `${C.adminGreen}20` : `${C.adminRed}20`,
                        color: user.status === 'active' ? C.adminGreen : C.adminRed,
                        fontWeight: 700,
                        fontSize: '0.75rem'
                      }}>
                        {user.status === 'active' ? '✅ Активен' : '⛔ Спрян'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 600, color: C.forest }}>
                      {user.stats?.totalTasksCompleted || 0}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                        <span style={{ color: C.salmon }}>🔥</span>
                        <span style={{ fontWeight: 600 }}>{user.stats?.currentStreak || 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: '0.8rem', color: C.stone }}>
                      {formatDate(user.createdAt)}
                    </td>
                    <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {editingUser === user.uid ? (
                          <>
                            <button
                              onClick={async () => {
                                await updateUserRole(user.uid, editRole);
                                setEditingUser(null);
                              }}
                              style={{ padding: '6px 10px', borderRadius: 8, background: C.sage, border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              style={{ padding: '6px 10px', borderRadius: 8, background: C.mistLt, border: 'none', color: C.stone, cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setEditingUser(user.uid);
                                setEditRole(user.role);
                              }}
                              style={{ padding: '6px 10px', borderRadius: 8, background: C.bgWarm, border: `1.5px solid ${C.mistLt}`, cursor: 'pointer', color: C.stone }}
                              title="Редактирай роля"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => toggleUserStatus(user.uid, user.status)}
                              style={{ padding: '6px 10px', borderRadius: 8, background: user.status === 'active' ? `${C.adminRed}20` : `${C.adminGreen}20`, border: 'none', cursor: 'pointer', color: user.status === 'active' ? C.adminRed : C.adminGreen }}
                              title={user.status === 'active' ? 'Спри акаунта' : 'Активирай акаунта'}
                            >
                              {user.status === 'active' ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button
                              onClick={() => setShowConfirm(user.uid)}
                              style={{ padding: '6px 10px', borderRadius: 8, background: `${C.adminRed}20`, border: 'none', cursor: 'pointer', color: C.adminRed }}
                              title="Изтрий потребител"
                              disabled={user.uid === currentUser?.uid}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: C.stone }}>
              <AlertCircle size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
              <p>Няма намерени потребители</p>
            </div>
          )}
        </div>

        {/* Floral footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32, justifyContent: 'center', opacity: 0.3 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${C.sage})` }} />
          <TinyFlower /><TinyFlower style={{ opacity: 0.5 }} /><TinyFlower />
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${C.sage},transparent)` }} />
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(44,62,53,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: 28, maxWidth: 400, textAlign: 'center', border: `2px solid ${C.border}` }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.adminRed}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertCircle size={24} style={{ color: C.adminRed }} />
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.3rem', fontWeight: 700, color: C.forest, marginBottom: 8 }}>Изтриване на потребител</h3>
            <p style={{ color: C.stone, marginBottom: 20 }}>Сигурни ли сте, че искате да изтриете този потребител? Това действие е необратимо.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowConfirm(null)} style={{ padding: '10px 20px', borderRadius: 12, background: 'white', border: `1.5px solid ${C.mistLt}`, cursor: 'pointer', fontWeight: 600 }}>
                Отказ
              </button>
              <button onClick={() => deleteUser(showConfirm)} style={{ padding: '10px 20px', borderRadius: 12, background: C.adminRed, border: 'none', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Изтрий
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;