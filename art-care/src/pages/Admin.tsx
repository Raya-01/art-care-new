import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users, Search, Filter, Activity, BarChart3, MessageSquare, Flag, Image, Settings,
  Shield, Calendar, Clock, TrendingUp, UserCheck, UserX, Lock, RefreshCw, Download,
  PieChart, Award, Heart, BookOpen, Target, Star, AlertTriangle, CheckCircle,
  XCircle, Eye, EyeOff, LogOut, Palette, Trash2, Bell, Mail, ChevronRight,
  Edit, MoreVertical
} from 'lucide-react';

interface AdminUser {
  id: string; email: string; displayName: string; createdAt: string;
  lastLogin?: string; updatedAt: string; role?: 'admin' | 'user';
  status?: 'active' | 'suspended' | 'deleted';
  stats?: { totalTasks: number; completedTasks: number; journalEntries: number; artworks: number; streak: number; lastActive: string; };
}
interface FeedbackData { id: string; userId: string; userName: string; userEmail: string; type: 'feedback' | 'bug' | 'suggestion'; message: string; rating?: number; timestamp: string; status: 'new' | 'reviewed' | 'resolved'; }
interface ReportData { id: string; reporterId: string; reporterName: string; reportedUserId?: string; contentId?: string; contentType: 'user' | 'comment' | 'artwork' | 'journal'; reason: string; description: string; timestamp: string; status: 'pending' | 'reviewed' | 'resolved'; }
interface ContentItem { id: string; userId: string; userName: string; type: 'artwork' | 'journal'; title?: string; content: string; imageUrl?: string; timestamp: string; status: 'active' | 'flagged' | 'hidden'; flags?: number; }
interface AppStats { totalUsers: number; activeToday: number; activeWeek: number; totalTasks: number; completedTasks: number; totalJournalEntries: number; totalArtworks: number; newUsersToday: number; }
interface Announcement { id: string; title: string; message: string; type: 'info' | 'warning' | 'success'; createdAt: string; active: boolean; }

const COLORS = {
  sage: '#D4E3DE', sageMid: '#A8BBB9', sageGreen: '#A3B995',
  peachLight: '#F9DDB8', peachMid: '#FBBD96', peachSoft: '#FCCAAB',
  terra: '#E88067', bg: '#FAF5EF', dark: '#2C3E35', mid: '#5C6E6A'
};

const Admin = () => {
  const { currentUser, currentUserData, logout } = useAuth() as any;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'content' | 'feedback' | 'reports' | 'analytics' | 'announcements'>('dashboard');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended' | 'admin'>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [contentSearch, setContentSearch] = useState('');
  const [contentFilter, setContentFilter] = useState<'all' | 'active' | 'flagged' | 'hidden'>('all');
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'new' | 'reviewed' | 'resolved'>('all');
  const [reports, setReports] = useState<ReportData[]>([]);
  const [reportsFilter, setReportsFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', message: '', type: 'info' as 'info' | 'warning' | 'success' });
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [stats, setStats] = useState<AppStats>({ totalUsers: 0, activeToday: 0, activeWeek: 0, totalTasks: 0, completedTasks: 0, totalJournalEntries: 0, totalArtworks: 0, newUsersToday: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Admin check via Firebase Custom Claims or localStorage role
  useEffect(() => {
    const check = async () => {
      if (!currentUser) { navigate('/login'); return; }
      // Check Firebase custom claims first
      const tokenResult = await currentUser.getIdTokenResult?.().catch(() => null);
      const isAdminByToken = tokenResult?.claims?.admin === true;
      // Fallback: check localStorage users array
      const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const localUser = allUsers.find((u: any) => u.id === currentUser.uid || u.email === currentUser.email);
      const isAdminByLS = localUser?.role === 'admin';
      // Also check currentUserData from AuthContext
      const isAdminByContext = currentUserData?.role === 'admin';
      if (!isAdminByToken && !isAdminByLS && !isAdminByContext) {
        navigate('/dashboard'); return;
      }
      await loadAll();
    };
    check();
  }, [currentUser]);

  useEffect(() => { filterUsers(users, userSearch, userFilter); }, [userSearch, userFilter]);

  const loadAll = async () => {
    setPageLoading(true);
    loadUsers(); loadContent(); loadFeedback(); loadReports(); loadAnnouncements(); calculateStats();
    setPageLoading(false);
  };

  const calculateUserStats = (userId: string) => {
    try {
      const tasks = JSON.parse(localStorage.getItem(`therapy_${userId}`) || '{}');
      const journal = JSON.parse(localStorage.getItem(`journal_${userId}`) || '[]');
      const gallery = JSON.parse(localStorage.getItem(`artcare_gallery_${userId}`) || '[]');
      const progress = JSON.parse(localStorage.getItem(`therapy_progress_${userId}`) || '{}');
      const tasksList = tasks.dailyTasks || [];
      const journalList = Array.isArray(journal) ? journal : (journal.entries || []);
      const galleryList = Array.isArray(gallery) ? gallery : (gallery.artworks || []);
      return {
        totalTasks: tasksList.length,
        completedTasks: tasksList.filter((t: any) => t.completed).length,
        journalEntries: journalList.length,
        artworks: galleryList.length,
        streak: progress.streak || 0,
        lastActive: progress.lastUpdated || new Date().toISOString()
      };
    } catch { return { totalTasks: 0, completedTasks: 0, journalEntries: 0, artworks: 0, streak: 0, lastActive: new Date().toISOString() }; }
  };

  const loadUsers = () => {
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    const enriched = all.map((u: AdminUser) => ({ ...u, role: u.role || 'user', status: u.status || 'active', stats: calculateUserStats(u.id) }));
    setUsers(enriched);
    filterUsers(enriched, userSearch, userFilter);
  };

  const filterUsers = (list: AdminUser[], search: string, filter: string) => {
    let f = [...list];
    if (search) f = f.filter(u => u.email?.toLowerCase().includes(search.toLowerCase()) || u.displayName?.toLowerCase().includes(search.toLowerCase()));
    if (filter === 'active') f = f.filter(u => u.status === 'active');
    else if (filter === 'suspended') f = f.filter(u => u.status === 'suspended');
    else if (filter === 'admin') f = f.filter(u => u.role === 'admin');
    setFilteredUsers(f);
  };

  const loadContent = () => {
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    const items: ContentItem[] = [];
    all.forEach((user: AdminUser) => {
      const journal = JSON.parse(localStorage.getItem(`journal_${user.id}`) || '[]');
      const entries = Array.isArray(journal) ? journal : (journal.entries || []);
      entries.forEach((e: any) => items.push({ id: `j_${e.id}`, userId: user.id, userName: user.displayName, type: 'journal', title: e.title, content: e.content || '', timestamp: e.date || '', status: 'active', flags: 0 }));
      const gallery = JSON.parse(localStorage.getItem(`artcare_gallery_${user.id}`) || '[]');
      const artworks = Array.isArray(gallery) ? gallery : (gallery.artworks || []);
      artworks.forEach((a: any) => items.push({ id: `a_${a.id}`, userId: user.id, userName: user.displayName, type: 'artwork', title: a.title, content: a.description || '', imageUrl: a.imageUrl, timestamp: a.date || '', status: 'active', flags: 0 }));
    });
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setContent(items);
  };

  const loadFeedback = () => {
    const saved = JSON.parse(localStorage.getItem('artcare_feedback') || '[]');
    const sample: FeedbackData[] = saved.length ? saved : [
      { id: '1', userId: 'demo1', userName: 'Иван Петров', userEmail: 'ivan@example.com', type: 'feedback', message: 'Страхотно приложение! Много ми помага с ежедневните задачи.', rating: 5, timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'reviewed' },
      { id: '2', userId: 'demo2', userName: 'Мария Иванова', userEmail: 'maria@example.com', type: 'suggestion', message: 'Би било чудесно да има повече медитации за сън.', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'new' },
      { id: '3', userId: 'demo3', userName: 'Георги Димитров', userEmail: 'georgi@example.com', type: 'bug', message: 'Приложението спря да записва настроенията ми от вчера.', timestamp: new Date(Date.now() - 259200000).toISOString(), status: 'new' },
    ];
    setFeedback(sample);
  };

  const loadReports = () => {
    const saved = JSON.parse(localStorage.getItem('artcare_reports') || '[]');
    const sample: ReportData[] = saved.length ? saved : [
      { id: '1', reporterId: 'user1', reporterName: 'Анна Георгиева', reportedUserId: 'user2', contentType: 'user', reason: 'Неподходящо поведение', description: 'Потребителят публикува обидни коментари.', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'pending' },
      { id: '2', reporterId: 'user3', reporterName: 'Петър Иванов', contentId: 'artwork_123', contentType: 'artwork', reason: 'Нецензурно съдържание', description: 'Творбата съдържа неподходящи изображения.', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'reviewed' },
    ];
    setReports(sample);
  };

  const loadAnnouncements = () => {
    const saved = JSON.parse(localStorage.getItem('artcare_announcements') || '[]');
    setAnnouncements(saved);
  };

  const calculateStats = () => {
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    const now = new Date(); const weekAgo = new Date(now.getTime() - 7 * 86400000); const today = now.toDateString();
    let activeToday = 0, activeWeek = 0, totalTasks = 0, completedTasks = 0, totalJournal = 0, totalArtworks = 0, newToday = 0;
    all.forEach((user: AdminUser) => {
      const progress = JSON.parse(localStorage.getItem(`therapy_progress_${user.id}`) || '{}');
      const tasks = JSON.parse(localStorage.getItem(`therapy_${user.id}`) || '{}');
      const journal = JSON.parse(localStorage.getItem(`journal_${user.id}`) || '[]');
      const gallery = JSON.parse(localStorage.getItem(`artcare_gallery_${user.id}`) || '[]');
      if (progress.lastUpdated) {
        const d = new Date(progress.lastUpdated);
        if (d.toDateString() === today) activeToday++;
        if (d > weekAgo) activeWeek++;
      }
      const tl = (tasks.dailyTasks || []);
      totalTasks += tl.length;
      completedTasks += tl.filter((t: any) => t.completed).length;
      const jl = Array.isArray(journal) ? journal : (journal.entries || []);
      totalJournal += jl.length;
      const gl = Array.isArray(gallery) ? gallery : (gallery.artworks || []);
      totalArtworks += gl.length;
      if (user.createdAt && new Date(user.createdAt).toDateString() === today) newToday++;
    });
    setStats({ totalUsers: all.length, activeToday, activeWeek, totalTasks, completedTasks, totalJournalEntries: totalJournal, totalArtworks, newUsersToday: newToday });
  };

  // User actions
  const updateUserInLS = (userId: string, changes: Partial<AdminUser>) => {
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    const updated = all.map((u: AdminUser) => u.id === userId ? { ...u, ...changes } : u);
    localStorage.setItem('users', JSON.stringify(updated));
    loadUsers();
  };

  const handleSuspend = (userId: string) => { setActionLoading(true); updateUserInLS(userId, { status: 'suspended' }); showToast('Потребителят е спрян.'); setActionLoading(false); };
  const handleActivate = (userId: string) => { setActionLoading(true); updateUserInLS(userId, { status: 'active' }); showToast('Потребителят е активиран.'); setActionLoading(false); };
  const handleMakeAdmin = (userId: string) => {
    if (!window.confirm('Да се направи ли потребителят администратор?')) return;
    setActionLoading(true); updateUserInLS(userId, { role: 'admin' }); showToast('Администраторски права дадени.'); setActionLoading(false);
  };
  const handleRemoveAdmin = (userId: string) => {
    if (userId === currentUser?.uid) { showToast('Не може да премахнете собствените си права!', 'error'); return; }
    if (!window.confirm('Да се премахнат ли администраторските права?')) return;
    setActionLoading(true); updateUserInLS(userId, { role: 'user' }); showToast('Администраторски права премахнати.'); setActionLoading(false);
  };
  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.uid) { showToast('Не може да изтриете собствения си акаунт!', 'error'); return; }
    if (!window.confirm('Сигурни ли сте? Това действие е необратимо.')) return;
    setActionLoading(true);
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    localStorage.setItem('users', JSON.stringify(all.filter((u: AdminUser) => u.id !== userId)));
    // Clean up user data
    ['therapy_', 'therapy_progress_', 'journal_', 'artcare_gallery_', 'history_'].forEach(k => localStorage.removeItem(k + userId));
    loadUsers(); calculateStats();
    showToast('Потребителят е изтрит.'); setActionLoading(false);
  };

  const handleSendPasswordReset = (email: string) => { showToast(`Изпратен имейл за нулиране на парола до ${email}.`); };

  // Content actions
  const updateContent = (id: string, changes: Partial<ContentItem>) => setContent(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  const handleHide = (id: string) => { updateContent(id, { status: 'hidden' }); showToast('Съдържанието е скрито.'); };
  const handleFlag = (id: string) => { updateContent(id, { status: 'flagged', flags: (content.find(c => c.id === id)?.flags || 0) + 1 }); showToast('Съдържанието е отбелязано.'); };
  const handleUnhide = (id: string) => { updateContent(id, { status: 'active' }); showToast('Съдържанието е показано отново.'); };

  // Feedback & reports
  const updateFeedback = (id: string, status: FeedbackData['status']) => { setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f)); localStorage.setItem('artcare_feedback', JSON.stringify(feedback.map(f => f.id === id ? { ...f, status } : f))); showToast('Статусът е обновен.'); };
  const updateReport = (id: string, status: ReportData['status']) => { setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r)); localStorage.setItem('artcare_reports', JSON.stringify(reports.map(r => r.id === id ? { ...r, status } : r))); showToast('Докладът е обновен.'); };

  // Announcements
  const createAnnouncement = () => {
    if (!newAnnouncement.title || !newAnnouncement.message) return;
    const ann: Announcement = { id: `ann_${Date.now()}`, ...newAnnouncement, createdAt: new Date().toISOString(), active: true };
    const updated = [ann, ...announcements];
    setAnnouncements(updated);
    localStorage.setItem('artcare_announcements', JSON.stringify(updated));
    setNewAnnouncement({ title: '', message: '', type: 'info' });
    setShowAnnouncementForm(false);
    showToast('Обявлението е публикувано.');
  };
  const toggleAnnouncement = (id: string) => {
    const updated = announcements.map(a => a.id === id ? { ...a, active: !a.active } : a);
    setAnnouncements(updated);
    localStorage.setItem('artcare_announcements', JSON.stringify(updated));
  };
  const deleteAnnouncement = (id: string) => {
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    localStorage.setItem('artcare_announcements', JSON.stringify(updated));
  };

  const exportUsers = () => {
    const all = JSON.parse(localStorage.getItem('users') || '[]');
    const csv = ['Email,Name,Role,Status,Created\n', ...all.map((u: AdminUser) => `${u.email},${u.displayName},${u.role || 'user'},${u.status || 'active'},${u.createdAt}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'artcare-users.csv'; a.click();
    showToast('Данните са експортирани.');
  };

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('bg-BG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch { return '—'; } };

  if (pageLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.bg }}>
      <div className="bg-white rounded-3xl p-12 text-center border-2" style={{ borderColor: COLORS.peachSoft, boxShadow: '0 24px 64px rgba(44,62,53,0.11)' }}>
        <div className="w-14 h-14 rounded-full border-4 mx-auto mb-6 animate-spin" style={{ borderColor: COLORS.sage, borderTopColor: COLORS.terra }} />
        <p style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Зареждане на административния панел...</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', icon: <BarChart3 size={16} />, label: 'Табло' },
    { id: 'users', icon: <Users size={16} />, label: 'Потребители', badge: users.filter(u => u.status === 'suspended').length },
    { id: 'content', icon: <Image size={16} />, label: 'Съдържание', badge: content.filter(c => c.status === 'flagged').length, warn: true },
    { id: 'feedback', icon: <MessageSquare size={16} />, label: 'Обратна връзка', badge: feedback.filter(f => f.status === 'new').length },
    { id: 'reports', icon: <Flag size={16} />, label: 'Доклади', badge: reports.filter(r => r.status === 'pending').length, danger: true },
    { id: 'analytics', icon: <TrendingUp size={16} />, label: 'Анализи' },
    { id: 'announcements', icon: <Bell size={16} />, label: 'Обявления', badge: announcements.filter(a => a.active).length },
  ] as any[];

  return (
    <div className="min-h-screen py-8 px-4 md:px-8" style={{ background: COLORS.bg }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl font-semibold text-white shadow-xl animate-bounce" style={{ background: toast.type === 'success' ? 'linear-gradient(135deg,#A3B995,#A8BBB9)' : 'linear-gradient(135deg,#E88067,#FBBD96)', fontFamily: 'Nunito, sans-serif' }}>
          {toast.type === 'success' ? '✓ ' : '✕ '}{toast.message}
        </div>
      )}

      {/* User modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(44,62,53,0.6)', backdropFilter: 'blur(8px)' }} onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto border-2" style={{ borderColor: COLORS.peachSoft, boxShadow: '0 30px 70px rgba(44,62,53,0.25)' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}><Shield size={18} style={{ color: COLORS.terra }} />Детайли за потребител</h2>
              <button onClick={() => setShowUserModal(false)} className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:rotate-90" style={{ background: COLORS.bg, border: `2px solid ${COLORS.peachSoft}`, color: COLORS.mid }}><XCircle size={16} /></button>
            </div>
            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg,#F9DDB8,#D4E3DE)', border: `2px solid ${COLORS.peachSoft}` }}>
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)' }}>{(selectedUser.displayName || 'U')[0].toUpperCase()}</div>
              <div>
                <div className="font-bold text-lg" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{selectedUser.displayName}</div>
                <div className="text-sm" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{selectedUser.email}</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: selectedUser.role === 'admin' ? 'linear-gradient(135deg,#E88067,#FBBD96)' : '#F9DDB8', color: selectedUser.role === 'admin' ? 'white' : COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{selectedUser.role === 'admin' ? 'Администратор' : 'Потребител'}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: selectedUser.status === 'active' ? '#d4edda' : '#f8d7da', color: selectedUser.status === 'active' ? '#155724' : '#721c24', fontFamily: 'Nunito, sans-serif' }}>{selectedUser.status === 'active' ? 'Активен' : 'Спрян'}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { icon: <Target size={16} />, val: selectedUser.stats?.completedTasks || 0, label: 'Завършени задачи' },
                { icon: <BookOpen size={16} />, val: selectedUser.stats?.journalEntries || 0, label: 'Записи' },
                { icon: <Image size={16} />, val: selectedUser.stats?.artworks || 0, label: 'Творби' },
                { icon: <Award size={16} />, val: selectedUser.stats?.streak || 0, label: 'Поредица' },
              ].map((s, i) => (
                <div key={i} className="p-3 rounded-xl flex items-center gap-2" style={{ background: COLORS.bg, border: `2px solid ${COLORS.sage}` }}>
                  <span style={{ color: COLORS.terra }}>{s.icon}</span>
                  <div><div className="font-bold" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{s.val}</div><div className="text-xs" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{s.label}</div></div>
                </div>
              ))}
            </div>
            <div className="text-xs mb-6 space-y-1" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>
              <div>📅 Регистриран: {formatDate(selectedUser.createdAt)}</div>
              <div>🕐 Последна активност: {formatDate(selectedUser.stats?.lastActive || selectedUser.updatedAt)}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedUser.status === 'active'
                ? <button onClick={() => { handleSuspend(selectedUser.id); setShowUserModal(false); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>Спри акаунта</button>
                : <button onClick={() => { handleActivate(selectedUser.id); setShowUserModal(false); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#A3B995,#A8BBB9)', fontFamily: 'Nunito, sans-serif' }}>Активирай акаунта</button>}
              {selectedUser.role !== 'admin'
                ? <button onClick={() => { handleMakeAdmin(selectedUser.id); setShowUserModal(false); }} className="px-4 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)', fontFamily: 'Nunito, sans-serif' }}>Направи администратор</button>
                : selectedUser.id !== currentUser?.uid && <button onClick={() => { handleRemoveAdmin(selectedUser.id); setShowUserModal(false); }} className="px-4 py-2 rounded-xl text-sm font-semibold border-2" style={{ borderColor: COLORS.peachSoft, color: COLORS.terra, fontFamily: 'Nunito, sans-serif' }}>Премахни права</button>}
              <button onClick={() => handleSendPasswordReset(selectedUser.email)} className="px-4 py-2 rounded-xl text-sm font-semibold border-2" style={{ borderColor: COLORS.sageMid, color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Нулирай парола</button>
              {selectedUser.id !== currentUser?.uid && <button onClick={() => { handleDeleteUser(selectedUser.id); setShowUserModal(false); }} className="px-4 py-2 rounded-xl text-sm font-semibold border-2" style={{ borderColor: '#fecaca', color: '#ef4444', fontFamily: 'Nunito, sans-serif' }}>Изтрий акаунт</button>}
              <button onClick={() => setShowUserModal(false)} className="px-4 py-2 rounded-xl text-sm font-semibold border-2 ml-auto" style={{ borderColor: COLORS.sage, color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Затвори</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="h-1.5 rounded-full mb-6" style={{ background: 'linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9)' }} />

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 mb-5 border-2 flex flex-wrap justify-between items-center gap-4" style={{ borderColor: COLORS.sage, boxShadow: '0 24px 64px rgba(44,62,53,0.11), 0 4px 16px rgba(44,62,53,0.06)' }}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>
              <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)' }}><Shield size={22} color="white" /></span>
              Административен панел
            </h1>
            <p className="mt-1 text-sm" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Управление на потребители, съдържание и статистики</p>
          </div>
          <div className="flex gap-2">
            <button onClick={loadAll} disabled={actionLoading} className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border-2 transition-all hover:-translate-y-0.5 disabled:opacity-50" style={{ borderColor: COLORS.sage, color: COLORS.mid, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }}>
              <RefreshCw size={15} className={actionLoading ? 'animate-spin' : ''} />Обнови
            </button>
            <button onClick={exportUsers} className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border-2 transition-all hover:-translate-y-0.5" style={{ borderColor: COLORS.sageMid, color: COLORS.mid, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }}>
              <Download size={15} />CSV
            </button>
            <button onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 border-2 transition-all hover:-translate-y-0.5" style={{ borderColor: '#fecaca', color: '#ef4444', background: '#fff5f5', fontFamily: 'Nunito, sans-serif' }}>
              <LogOut size={15} />Изход
            </button>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { icon: <Users size={20} />, val: stats.totalUsers, label: 'Общо потребители', color: COLORS.terra, sub: `+${stats.newUsersToday} днес` },
            { icon: <Activity size={20} />, val: stats.activeToday, label: 'Активни днес', color: COLORS.peachMid, sub: `${stats.activeWeek} тази седмица` },
            { icon: <Target size={20} />, val: `${stats.completedTasks}/${stats.totalTasks}`, label: 'Задачи', color: COLORS.sageGreen },
            { icon: <Heart size={20} />, val: stats.totalJournalEntries + stats.totalArtworks, label: 'Записи + Творби', color: COLORS.sageMid },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-4 border-2 transition-all hover:-translate-y-1" style={{ borderColor: COLORS.sage, boxShadow: '0 8px 24px rgba(44,62,53,0.08)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}22`, color: s.color }}>{s.icon}</div>
              <div>
                <div className="text-2xl font-bold" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{s.val}</div>
                <div className="text-xs" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{s.label}</div>
                {s.sub && <div className="text-xs mt-0.5 font-medium" style={{ color: s.color, fontFamily: 'Nunito, sans-serif' }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl p-2 mb-5 flex flex-wrap gap-1 border-2" style={{ borderColor: COLORS.sage }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5" style={{ background: activeTab === tab.id ? 'linear-gradient(135deg,#F9DDB8,#D4E3DE)' : 'transparent', color: activeTab === tab.id ? COLORS.dark : COLORS.mid, border: activeTab === tab.id ? `2px solid ${COLORS.peachSoft}` : '2px solid transparent', fontFamily: 'Nunito, sans-serif' }}>
              {tab.icon}{tab.label}
              {tab.badge > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white" style={{ background: tab.danger ? '#ef4444' : tab.warn ? '#f59e0b' : COLORS.terra }}>{tab.badge}</span>}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-3xl p-6 border-2 min-h-96" style={{ borderColor: COLORS.sage, boxShadow: '0 24px 64px rgba(44,62,53,0.11), 0 4px 16px rgba(44,62,53,0.06)' }}>

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl" style={{ background: COLORS.bg, border: `2px solid ${COLORS.sage}` }}>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}><Activity size={18} style={{ color: COLORS.terra }} />Последни потребители</h2>
                <div className="flex flex-col gap-2">
                  {users.slice(0, 6).map(u => (
                    <div key={u.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 transition-all hover:translate-x-1 cursor-pointer" style={{ borderColor: COLORS.sage }} onClick={() => { setSelectedUser(u); setShowUserModal(true); }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)' }}>{(u.displayName || 'U')[0].toUpperCase()}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate" style={{ color: COLORS.dark, fontFamily: 'Nunito, sans-serif' }}>{u.displayName || u.email}</div>
                        <div className="text-xs truncate" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{u.email}</div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: u.role === 'admin' ? 'linear-gradient(135deg,#E88067,#FBBD96)' : COLORS.peachLight, color: u.role === 'admin' ? 'white' : COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{u.role === 'admin' ? 'Admin' : 'User'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5 rounded-2xl" style={{ background: COLORS.bg, border: `2px solid ${COLORS.sage}` }}>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}><BarChart3 size={18} style={{ color: COLORS.terra }} />Завършване на задачи</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Задачи', val: stats.totalTasks ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0, color: COLORS.terra },
                    { label: 'Активни потребители (7 дни)', val: stats.totalUsers ? Math.round(stats.activeWeek / stats.totalUsers * 100) : 0, color: COLORS.sageGreen },
                    { label: 'Съдържание (активно)', val: content.length ? Math.round(content.filter(c => c.status === 'active').length / content.length * 100) : 100, color: COLORS.sageMid },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>
                        <span>{r.label}</span><span className="font-bold" style={{ color: r.color }}>{r.val}%</span>
                      </div>
                      <div className="h-3 rounded-full" style={{ background: COLORS.sage }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${r.val}%`, background: r.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'linear-gradient(135deg,#F9DDB8,#D4E3DE)', fontFamily: 'Nunito, sans-serif', color: COLORS.dark }}>
                  <strong>Общо съдържание:</strong> {content.length} записа · {content.filter(c => c.status === 'flagged').length} отбелязани · {feedback.filter(f => f.status === 'new').length} нови отзива · {reports.filter(r => r.status === 'pending').length} чакащи доклади
                </div>
              </div>
            </div>
          )}

          {/* USERS */}
          {activeTab === 'users' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.sageMid }} />
                  <input type="text" placeholder="Търси по име или имейл..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }} />
                </div>
                <select value={userFilter} onChange={e => setUserFilter(e.target.value as any)} className="px-4 py-2.5 rounded-xl outline-none text-sm" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }}>
                  <option value="all">Всички ({users.length})</option>
                  <option value="active">Активни ({users.filter(u => u.status === 'active').length})</option>
                  <option value="suspended">Спряни ({users.filter(u => u.status === 'suspended').length})</option>
                  <option value="admin">Администратори ({users.filter(u => u.role === 'admin').length})</option>
                </select>
              </div>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: COLORS.peachSoft }}>
                  <Users size={40} className="mx-auto mb-3 opacity-30" style={{ color: COLORS.terra }} />
                  <p style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Няма намерени потребители</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: COLORS.bg }}>
                        {['Потребител', 'Имейл', 'Роля', 'Статус', 'Задачи', 'Регистриран', 'Действия'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-semibold border-b-2" style={{ color: COLORS.dark, borderColor: COLORS.peachSoft, fontFamily: 'Nunito, sans-serif' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="transition-colors" style={{ borderBottom: `2px solid ${COLORS.bg}` }} onMouseEnter={e => (e.currentTarget.style.background = COLORS.bg)} onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)' }}>{(u.displayName || 'U')[0].toUpperCase()}</div>
                              <span className="font-semibold" style={{ color: COLORS.dark, fontFamily: 'Nunito, sans-serif' }}>{u.displayName || '—'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{u.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: u.role === 'admin' ? 'linear-gradient(135deg,#E88067,#FBBD96)' : COLORS.peachLight, color: u.role === 'admin' ? 'white' : COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{u.role === 'admin' ? 'Администратор' : 'Потребител'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold" style={{ background: u.status === 'active' ? '#d4edda' : '#f8d7da', color: u.status === 'active' ? '#155724' : '#721c24', fontFamily: 'Nunito, sans-serif' }}>{u.status === 'active' ? 'Активен' : 'Спрян'}</span>
                          </td>
                          <td className="px-4 py-3 text-xs" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{u.stats?.completedTasks || 0}/{u.stats?.totalTasks || 0}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{formatDate(u.createdAt)}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => { setSelectedUser(u); setShowUserModal(true); }} title="Детайли" className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110" style={{ borderColor: COLORS.sage, color: COLORS.mid }}><Eye size={13} /></button>
                              {u.status === 'active'
                                ? <button onClick={() => handleSuspend(u.id)} title="Спри" disabled={actionLoading} className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110" style={{ borderColor: '#fecaca', color: '#ef4444' }}><UserX size={13} /></button>
                                : <button onClick={() => handleActivate(u.id)} title="Активирай" disabled={actionLoading} className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110" style={{ borderColor: '#bbf7d0', color: '#16a34a' }}><UserCheck size={13} /></button>}
                              <button onClick={() => u.role !== 'admin' ? handleMakeAdmin(u.id) : handleRemoveAdmin(u.id)} title={u.role === 'admin' ? 'Премахни права' : 'Направи администратор'} disabled={actionLoading} className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110" style={{ borderColor: u.role === 'admin' ? '#fecaca' : COLORS.peachSoft, color: u.role === 'admin' ? '#ef4444' : COLORS.terra }}><Shield size={13} /></button>
                              {u.id !== currentUser?.uid && <button onClick={() => handleDeleteUser(u.id)} title="Изтрий" disabled={actionLoading} className="w-7 h-7 rounded-lg flex items-center justify-center border transition-all hover:scale-110" style={{ borderColor: '#fecaca', color: '#ef4444' }}><Trash2 size={13} /></button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* CONTENT */}
          {activeTab === 'content' && (
            <div>
              <div className="flex flex-wrap gap-3 mb-5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: COLORS.sageMid }} />
                  <input type="text" placeholder="Търси в съдържанието..." value={contentSearch} onChange={e => setContentSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }} />
                </div>
                <select value={contentFilter} onChange={e => setContentFilter(e.target.value as any)} className="px-4 py-2.5 rounded-xl outline-none text-sm" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: COLORS.bg, fontFamily: 'Nunito, sans-serif' }}>
                  <option value="all">Всичко</option><option value="active">Активно</option><option value="flagged">Отбелязано</option><option value="hidden">Скрито</option>
                </select>
              </div>
              {content.filter(c => (contentFilter === 'all' || c.status === contentFilter) && (c.content.toLowerCase().includes(contentSearch.toLowerCase()) || c.title?.toLowerCase().includes(contentSearch.toLowerCase()))).length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: COLORS.peachSoft }}>
                  <Image size={40} className="mx-auto mb-3 opacity-30" style={{ color: COLORS.terra }} />
                  <p style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Няма съдържание</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {content.filter(c => (contentFilter === 'all' || c.status === contentFilter) && (c.content.toLowerCase().includes(contentSearch.toLowerCase()) || c.title?.toLowerCase().includes(contentSearch.toLowerCase()))).map(item => (
                    <div key={item.id} className="rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-1" style={{ borderColor: item.status === 'flagged' ? '#fbbf24' : item.status === 'hidden' ? '#d1d5db' : COLORS.sage, boxShadow: '0 8px 24px rgba(44,62,53,0.08)', opacity: item.status === 'hidden' ? 0.6 : 1 }}>
                      {item.type === 'artwork' && item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-36 object-cover" />}
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold flex items-center gap-1" style={{ color: item.type === 'journal' ? COLORS.peachMid : COLORS.sageGreen, fontFamily: 'Nunito, sans-serif' }}>
                            {item.type === 'journal' ? <BookOpen size={11} /> : <Image size={11} />}
                            {item.type === 'journal' ? 'Дневник' : 'Творба'}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: item.status === 'active' ? '#d4edda' : item.status === 'flagged' ? '#fff3cd' : '#e2e3e5', color: item.status === 'active' ? '#155724' : item.status === 'flagged' ? '#856404' : '#383d41', fontFamily: 'Nunito, sans-serif' }}>{item.status === 'active' ? 'Активно' : item.status === 'flagged' ? 'Отбелязано' : 'Скрито'}</span>
                        </div>
                        {item.title && <p className="font-semibold text-sm mb-1" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{item.title}</p>}
                        <p className="text-xs line-clamp-2 mb-3" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{item.content || '—'}</p>
                        <div className="flex justify-between items-center text-xs" style={{ color: COLORS.sageMid, fontFamily: 'Nunito, sans-serif' }}>
                          <span>{item.userName}</span>
                          <div className="flex gap-1">
                            {item.status !== 'hidden'
                              ? <button onClick={() => handleHide(item.id)} title="Скрий" className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: '#fecaca', color: '#ef4444' }}><EyeOff size={11} /></button>
                              : <button onClick={() => handleUnhide(item.id)} title="Покажи" className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: '#bbf7d0', color: '#16a34a' }}><Eye size={11} /></button>}
                            {item.status !== 'flagged' && <button onClick={() => handleFlag(item.id)} title="Отбележи" className="w-6 h-6 rounded-lg flex items-center justify-center border" style={{ borderColor: '#fde68a', color: '#d97706' }}><Flag size={11} /></button>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FEEDBACK */}
          {activeTab === 'feedback' && (
            <div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {(['all', 'new', 'reviewed', 'resolved'] as const).map(f => (
                  <button key={f} onClick={() => setFeedbackFilter(f)} className="px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: feedbackFilter === f ? 'linear-gradient(135deg,#E88067,#FBBD96)' : COLORS.bg, color: feedbackFilter === f ? 'white' : COLORS.mid, border: feedbackFilter === f ? '2px solid transparent' : `2px solid ${COLORS.sage}`, fontFamily: 'Nunito, sans-serif' }}>
                    {f === 'all' ? 'Всички' : f === 'new' ? 'Нови' : f === 'reviewed' ? 'Прегледани' : 'Решени'} ({feedback.filter(fb => f === 'all' || fb.status === f).length})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {feedback.filter(f => feedbackFilter === 'all' || f.status === feedbackFilter).map(item => (
                  <div key={item.id} className="p-5 rounded-2xl border-2 transition-all hover:translate-x-1" style={{ background: COLORS.bg, borderColor: COLORS.sage, borderLeft: `5px solid ${item.status === 'new' ? '#3b82f6' : item.status === 'reviewed' ? '#f59e0b' : '#22c55e'}` }}>
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)' }}>{item.userName[0]?.toUpperCase()}</div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: COLORS.dark, fontFamily: 'Nunito, sans-serif' }}>{item.userName}</div>
                          <div className="text-xs" style={{ color: COLORS.sageMid, fontFamily: 'Nunito, sans-serif' }}>{item.userEmail}</div>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: item.type === 'bug' ? '#fee2e2' : item.type === 'suggestion' ? '#fef9c3' : '#dbeafe', color: item.type === 'bug' ? '#991b1b' : item.type === 'suggestion' ? '#854d0e' : '#1e40af', fontFamily: 'Nunito, sans-serif' }}>
                        {item.type === 'bug' ? '🐛 Проблем' : item.type === 'suggestion' ? '💡 Предложение' : '💬 Обратна връзка'}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{item.message}</p>
                    {item.rating && (
                      <div className="flex gap-1 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < item.rating! ? '#f59e0b' : 'none'} color={i < item.rating! ? '#f59e0b' : '#d1d5db'} />)}</div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: COLORS.sage }}>
                      <span className="text-xs" style={{ color: COLORS.sageMid, fontFamily: 'Nunito, sans-serif' }}>{formatDate(item.timestamp)}</span>
                      <div className="flex gap-2">
                        {item.status === 'new' && <button onClick={() => updateFeedback(item.id, 'reviewed')} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1" style={{ background: '#3b82f6', fontFamily: 'Nunito, sans-serif' }}><Eye size={11} />Прегледай</button>}
                        {item.status !== 'resolved' && <button onClick={() => updateFeedback(item.id, 'resolved')} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1" style={{ background: '#22c55e', fontFamily: 'Nunito, sans-serif' }}><CheckCircle size={11} />Реши</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REPORTS */}
          {activeTab === 'reports' && (
            <div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {(['all', 'pending', 'reviewed', 'resolved'] as const).map(f => (
                  <button key={f} onClick={() => setReportsFilter(f)} className="px-4 py-2 rounded-full text-sm font-semibold transition-all" style={{ background: reportsFilter === f ? 'linear-gradient(135deg,#E88067,#FBBD96)' : COLORS.bg, color: reportsFilter === f ? 'white' : COLORS.mid, border: reportsFilter === f ? '2px solid transparent' : `2px solid ${COLORS.sage}`, fontFamily: 'Nunito, sans-serif' }}>
                    {f === 'all' ? 'Всички' : f === 'pending' ? 'Чакащи' : f === 'reviewed' ? 'Прегледани' : 'Решени'} ({reports.filter(r => f === 'all' || r.status === f).length})
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {reports.filter(r => reportsFilter === 'all' || r.status === reportsFilter).map(report => (
                  <div key={report.id} className="p-5 rounded-2xl border-2 transition-all hover:translate-x-1" style={{ background: COLORS.bg, borderColor: COLORS.sage, borderLeft: `5px solid ${report.status === 'pending' ? '#f59e0b' : report.status === 'reviewed' ? '#3b82f6' : '#22c55e'}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fee2e2' }}><AlertTriangle size={18} color="#ef4444" /></div>
                      <div className="flex-1 flex flex-wrap justify-between items-center gap-2">
                        <span className="font-semibold" style={{ color: COLORS.dark, fontFamily: 'Nunito, sans-serif' }}>{report.contentType === 'user' ? 'Доклад за потребител' : report.contentType === 'artwork' ? 'Доклад за творба' : 'Доклад за коментар'}</span>
                        <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: report.status === 'pending' ? '#fef9c3' : report.status === 'reviewed' ? '#dbeafe' : '#d4edda', color: report.status === 'pending' ? '#854d0e' : report.status === 'reviewed' ? '#1e40af' : '#155724', fontFamily: 'Nunito, sans-serif' }}>{report.status === 'pending' ? 'Чакащ' : report.status === 'reviewed' ? 'Прегледан' : 'Решен'}</span>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl mb-3 text-sm" style={{ background: 'white', border: `2px solid ${COLORS.sage}` }}>
                      <div className="mb-1" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}><strong style={{ color: COLORS.dark }}>Причина:</strong> {report.reason}</div>
                      <div className="mb-1" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}><strong style={{ color: COLORS.dark }}>Описание:</strong> {report.description}</div>
                      <div style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}><strong style={{ color: COLORS.dark }}>Докладвано от:</strong> {report.reporterName}</div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs" style={{ color: COLORS.sageMid, fontFamily: 'Nunito, sans-serif' }}>{formatDate(report.timestamp)}</span>
                      <div className="flex gap-2">
                        {report.status === 'pending' && <button onClick={() => updateReport(report.id, 'reviewed')} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1" style={{ background: '#3b82f6', fontFamily: 'Nunito, sans-serif' }}><Eye size={11} />Прегледай</button>}
                        {report.status !== 'resolved' && <button onClick={() => updateReport(report.id, 'resolved')} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1" style={{ background: '#22c55e', fontFamily: 'Nunito, sans-serif' }}><CheckCircle size={11} />Реши</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Потребители', items: [{ label: 'Общо', val: stats.totalUsers }, { label: 'Активни днес', val: stats.activeToday }, { label: 'Активни тази седмица', val: stats.activeWeek }, { label: 'Нови днес', val: stats.newUsersToday }, { label: 'Администратори', val: users.filter(u => u.role === 'admin').length }, { label: 'Спряни', val: users.filter(u => u.status === 'suspended').length }] },
                { title: 'Съдържание', items: [{ label: 'Записи в дневник', val: stats.totalJournalEntries }, { label: 'Качени творби', val: stats.totalArtworks }, { label: 'Общо задачи', val: stats.totalTasks }, { label: 'Завършени задачи', val: stats.completedTasks }, { label: 'Отбелязано съдържание', val: content.filter(c => c.status === 'flagged').length }, { label: 'Скрито съдържание', val: content.filter(c => c.status === 'hidden').length }] },
              ].map((section, si) => (
                <div key={si} className="p-5 rounded-2xl" style={{ background: COLORS.bg, border: `2px solid ${COLORS.sage}` }}>
                  <h3 className="font-bold text-lg mb-4" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{section.title}</h3>
                  <div className="flex flex-col gap-2">
                    {section.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-white rounded-xl border" style={{ borderColor: COLORS.sage }}>
                        <span className="text-sm" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{item.label}</span>
                        <span className="font-bold text-lg" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="md:col-span-2 p-5 rounded-2xl" style={{ background: COLORS.bg, border: `2px solid ${COLORS.sage}` }}>
                <h3 className="font-bold text-lg mb-4" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>Обратна връзка</h3>
                <div className="grid grid-cols-3 gap-4">
                  {[['Нова', feedback.filter(f => f.status === 'new').length, '#3b82f6'], ['Прегледана', feedback.filter(f => f.status === 'reviewed').length, '#f59e0b'], ['Решена', feedback.filter(f => f.status === 'resolved').length, '#22c55e']].map(([label, val, color]) => (
                    <div key={label as string} className="p-4 rounded-xl text-center bg-white border" style={{ borderColor: COLORS.sage }}>
                      <div className="text-3xl font-bold" style={{ color: color as string, fontFamily: 'Lora, serif' }}>{val as number}</div>
                      <div className="text-sm mt-1" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{label as string}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div>
              <div className="flex justify-between items-center mb-5">
                <p className="text-sm" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{announcements.filter(a => a.active).length} активни обявления</p>
                <button onClick={() => setShowAnnouncementForm(!showAnnouncementForm)} className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm flex items-center gap-2 transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)', fontFamily: 'Nunito, sans-serif', boxShadow: '0 8px 20px rgba(232,128,103,0.3)' }}>
                  <Bell size={15} />Ново обявление
                </button>
              </div>
              {showAnnouncementForm && (
                <div className="mb-5 p-5 rounded-2xl border-2" style={{ background: COLORS.bg, borderColor: COLORS.peachSoft }}>
                  <h3 className="font-bold mb-4" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>Ново обявление</h3>
                  <div className="flex flex-col gap-3">
                    <input type="text" placeholder="Заглавие" value={newAnnouncement.title} onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))} className="px-4 py-3 rounded-xl outline-none" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: 'white', fontFamily: 'Nunito, sans-serif' }} />
                    <textarea placeholder="Съдържание на обявлението..." value={newAnnouncement.message} onChange={e => setNewAnnouncement(p => ({ ...p, message: e.target.value }))} rows={4} className="px-4 py-3 rounded-xl outline-none resize-none" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: 'white', fontFamily: 'Nunito, sans-serif' }} />
                    <div className="flex gap-3 flex-wrap items-center">
                      <select value={newAnnouncement.type} onChange={e => setNewAnnouncement(p => ({ ...p, type: e.target.value as any }))} className="px-4 py-2.5 rounded-xl outline-none" style={{ border: `2px solid ${COLORS.sage}`, color: COLORS.dark, background: 'white', fontFamily: 'Nunito, sans-serif' }}>
                        <option value="info">ℹ️ Информация</option>
                        <option value="warning">⚠️ Предупреждение</option>
                        <option value="success">✅ Успех</option>
                      </select>
                      <button onClick={createAnnouncement} disabled={!newAnnouncement.title || !newAnnouncement.message} className="px-6 py-2.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#E88067,#FBBD96)', fontFamily: 'Nunito, sans-serif' }}>Публикувай</button>
                      <button onClick={() => setShowAnnouncementForm(false)} className="px-5 py-2.5 rounded-xl font-semibold text-sm border-2" style={{ borderColor: COLORS.sage, color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Отказ</button>
                    </div>
                  </div>
                </div>
              )}
              {announcements.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed" style={{ borderColor: COLORS.peachSoft }}>
                  <Bell size={40} className="mx-auto mb-3 opacity-30" style={{ color: COLORS.terra }} />
                  <p style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>Няма обявления. Създайте първото!</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {announcements.map(ann => (
                    <div key={ann.id} className="p-5 rounded-2xl border-2 transition-all" style={{ background: ann.active ? COLORS.bg : 'white', borderColor: ann.type === 'warning' ? '#fbbf24' : ann.type === 'success' ? '#4ade80' : COLORS.sage, opacity: ann.active ? 1 : 0.6 }}>
                      <div className="flex flex-wrap justify-between items-start gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span>{ann.type === 'warning' ? '⚠️' : ann.type === 'success' ? '✅' : 'ℹ️'}</span>
                            <span className="font-bold" style={{ color: COLORS.dark, fontFamily: 'Lora, serif' }}>{ann.title}</span>
                            {!ann.active && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#e5e7eb', color: '#6b7280', fontFamily: 'Nunito, sans-serif' }}>Неактивно</span>}
                          </div>
                          <p className="text-sm" style={{ color: COLORS.mid, fontFamily: 'Nunito, sans-serif' }}>{ann.message}</p>
                          <p className="text-xs mt-1" style={{ color: COLORS.sageMid, fontFamily: 'Nunito, sans-serif' }}>{formatDate(ann.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleAnnouncement(ann.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all" style={{ borderColor: ann.active ? '#fecaca' : '#bbf7d0', color: ann.active ? '#ef4444' : '#16a34a', fontFamily: 'Nunito, sans-serif' }}>{ann.active ? 'Деактивирай' : 'Активирай'}</button>
                          <button onClick={() => deleteAnnouncement(ann.id)} className="w-7 h-7 rounded-lg flex items-center justify-center border" style={{ borderColor: '#fecaca', color: '#ef4444' }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Admin;