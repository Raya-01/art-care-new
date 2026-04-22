import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Mail, Star, Target, BookOpen, Image,
  Edit2, Save, X, Camera, Award, Heart,
  Calendar, Settings, LogOut, TrendingUp, BarChart3, Check,
} from 'lucide-react';
import PageTutorial, { PROFILE_TUTORIAL_STEPS } from '../components/PageTutorial';

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage: '#A3B995', mist: '#A8BBB9', mistLt: '#D4E3DE',
  forest: '#2C3E35', stone: '#5C6E6A', bgWarm: '#FAF5EF',
  bgCard: '#FFF8F3', border: '#F9DDB8',
};

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, ...style }}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7" cy="3.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="7" cy="10.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

const Sprig = ({ flip = false }: { flip?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
    style={{ flexShrink: 0, transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M9 16 C9 16 9 8 9 3" stroke={C.sage} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill={C.sage} opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill={C.mist} opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill={C.sage} opacity="0.5"/>
  </svg>
);

interface UserStats {
  totalDays: number; completedTasks: number; totalTasks: number;
  journalEntries: number; uploadedArtworks: number;
  currentStreak: number; bestStreak: number; favoriteMood: string;
}

const ACHIEVEMENT_DEFS = [
  { id:'first-steps',   title:'Първи стъпки',       description:'10 завършени задачи',      icon:'🎯', condition:(s:UserStats)=>s.completedTasks>=10 },
  { id:'task-master',   title:'Майстор на задачите', description:'50 завършени задачи',      icon:'🏆', condition:(s:UserStats)=>s.completedTasks>=50 },
  { id:'reflection',    title:'Рефлексия',           description:'5 записа в дневника',     icon:'📖', condition:(s:UserStats)=>s.journalEntries>=5 },
  { id:'writer',        title:'Писател',             description:'20 записа в дневника',    icon:'✍️', condition:(s:UserStats)=>s.journalEntries>=20 },
  { id:'artist',        title:'Художник',            description:'3 качени творби',          icon:'🎨', condition:(s:UserStats)=>s.uploadedArtworks>=3 },
  { id:'master-artist', title:'Майстор-художник',    description:'10 качени творби',         icon:'🖼️', condition:(s:UserStats)=>s.uploadedArtworks>=10 },
  { id:'streak-7',      title:'Поредица',            description:'7 дни поред',             icon:'🔥', condition:(s:UserStats)=>s.currentStreak>=7 },
  { id:'streak-30',     title:'Месечна поредица',    description:'30 дни поред',            icon:'⚡', condition:(s:UserStats)=>s.currentStreak>=30 },
  { id:'balanced',      title:'Баланс',              description:'Използвай всички функции', icon:'⚖️', condition:(s:UserStats)=>s.completedTasks>=10&&s.journalEntries>=5&&s.uploadedArtworks>=3 },
  { id:'dedicated',     title:'Отдаден',             description:'30 активни дни',          icon:'💎', condition:(s:UserStats)=>s.totalDays>=30 },
];

const Profile: React.FC = () => {
  const { currentUser, logout, updateUserProfile, loading: authLoading } = useAuth();

  const [isEditing,   setIsEditing]   = useState(false);
  const [displayName, setName]        = useState('');
  const [previewUrl,  setPreview]     = useState('');
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab,   setActiveTab]   = useState<'stats'|'achievements'>('stats');
  const [stats,       setStats]       = useState<UserStats>({ totalDays:0, completedTasks:0, totalTasks:0, journalEntries:0, uploadedArtworks:0, currentStreak:0, bestStreak:0, favoriteMood:'😊 Радостен' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const achievements  = ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: a.condition(stats) }));
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  useEffect(() => {
    if (!currentUser) return;
    setName(currentUser.displayName || '');
    setPreview(currentUser.photoURL  || '');
    loadStats();
  }, [currentUser]);

  const loadStats = () => {
    if (!currentUser) return;
    try {
      const progressRaw = localStorage.getItem(`therapy_progress_${currentUser.uid}`);
      const progress    = progressRaw ? JSON.parse(progressRaw) : {};
      const taskStates: Record<string,boolean> = progress.taskStates || {};
      const completedTasksCount = Object.values(taskStates).filter(Boolean).length;
      const totalTasksCount     = Object.keys(taskStates).length;
      const currentStreak       = progress.streak || 0;

      const journalRaw = localStorage.getItem(`journal_${currentUser.uid}`);
      let journal: any[] = [];
      if (journalRaw) { const p = JSON.parse(journalRaw); journal = Array.isArray(p) ? p : (p?.entries || []); }

      const galleryRaw = localStorage.getItem(`artcare_gallery_${currentUser.uid}`);
      let artworks: any[] = [];
      if (galleryRaw) { const p = JSON.parse(galleryRaw); artworks = Array.isArray(p) ? p : (p?.artworks || []); }

      const moodCounts: Record<string,number> = {};
      journal.forEach((e:any) => { if (e.mood) moodCounts[e.mood] = (moodCounts[e.mood]||0)+1; });
      const favMood = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || '😊 Радостен';

      const dates = new Set<string>();
      journal.forEach((e:any)  => { if (e.date) dates.add(e.date); });
      artworks.forEach((a:any) => { if (a.date) dates.add(a.date); });
      if (completedTasksCount > 0) dates.add(new Date().toLocaleDateString('bg-BG'));

      setStats({ totalDays:dates.size, completedTasks:completedTasksCount, totalTasks:totalTasksCount, journalEntries:journal.length, uploadedArtworks:artworks.length, currentStreak, bestStreak:Math.max(currentStreak, progress.bestStreak||0), favoriteMood:favMood });
    } catch(e) { console.error(e); }
  };

  const getLevel         = () => Math.floor((stats.completedTasks + stats.journalEntries + stats.uploadedArtworks) / 10) + 1;
  const getLevelProgress = () => ((stats.completedTasks + stats.journalEntries + stats.uploadedArtworks) % 10) * 10;

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await updateUserProfile?.({ displayName, photoURL: previewUrl });
      setIsEditing(false); setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch(e) { console.error(e); } finally { setSaving(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setPreview(URL.createObjectURL(file)); }
  };

  if (authLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid ${C.mistLt}`, borderTopColor:C.salmon, margin:'0 auto 16px', animation:'spin .8s linear infinite' }}/>
        <p style={{ color:C.stone, fontWeight:600 }}>Зареждане...</p>
      </div>
    </div>
  );

  /* ─────────────────────────────── RENDER ──────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily:"'Nunito',sans-serif", paddingBottom:72 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes spin       { to{transform:rotate(360deg)} }
        @keyframes borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes avatarPulse{ 0%,100%{box-shadow:0 0 0 0 rgba(232,128,103,0)} 50%{box-shadow:0 0 0 10px rgba(232,128,103,.14)} }
        @keyframes softSway   { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes barGrow    { from{width:0} to{width:var(--target-w)} }
        @keyframes achieveIn  { from{opacity:0;transform:scale(.92) translateY(8px)} to{opacity:1;transform:none} }

        .prf-rainbow {
          height:3px;
          background:linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size:200% 100%;
          animation:borderFlow 6s ease infinite;
        }
        .prf-card {
          animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          background:white;
          border-radius:24px;
          border:1px solid #F9DDB8;
          box-shadow:0 3px 14px rgba(44,62,53,.07);
          transition:box-shadow .22s, transform .22s;
        }
        .prf-card:hover { box-shadow:0 10px 28px rgba(44,62,53,.10); }

        .prf-avatar { animation:avatarPulse 3s ease-in-out infinite; }

        .prf-btn {
          cursor:pointer; border:none;
          transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, filter .15s;
        }
        .prf-btn:hover  { transform:translateY(-2px); }
        .prf-btn:active { transform:scale(.97); }

        .prf-ghost {
          cursor:pointer;
          transition:transform .18s, background .2s, border-color .2s, color .2s;
        }
        .prf-ghost:hover { transform:translateY(-2px); background:#FFF0EB !important; border-color:#FCCAAB !important; color:#E88067 !important; }

        .prf-tab {
          cursor:pointer; border:none;
          transition:all .22s;
        }

        .prf-stat {
          transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          border-radius:16px;
        }
        .prf-stat:hover { transform:translateY(-4px); box-shadow:0 10px 24px rgba(44,62,53,.10) !important; }

        .prf-achieve {
          transition:transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          animation:achieveIn .4s cubic-bezier(.22,1,.36,1) both;
          border-radius:18px;
        }
        .prf-achieve.unlocked:hover { transform:translateY(-3px); box-shadow:0 10px 24px rgba(44,62,53,.10) !important; }

        .bar-grow { animation:barGrow .9s cubic-bezier(.34,1.56,.64,1) both; }

        .prf-sway-l { animation:softSway 4.5s ease-in-out infinite;    transform-origin:bottom center; }
        .prf-sway-r { animation:softSway 4.5s ease-in-out infinite .6s;transform-origin:bottom center; }

        .prf-input:focus { outline:none; border-color:#A3B995 !important; box-shadow:0 0 0 3px rgba(163,185,149,.2); }

        .prf-link {
          display:flex; align-items:center; gap:10px;
          padding:11px 15px; border-radius:14px; font-weight:700;
          font-size:0.85rem; text-decoration:none;
          transition:transform .18s, background .18s, box-shadow .18s;
        }
        .prf-link:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(44,62,53,.09); background:#FFF0EB !important; }

        .prf-logout {
          cursor:pointer; transition:transform .18s, background .18s;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .prf-logout:hover { transform:translateY(-2px); background:#FFF5F5 !important; }
      `}</style>

      <PageTutorial storageKey="artcare_tut_profile" steps={PROFILE_TUTORIAL_STEPS}/>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px' }}>

        {/* rainbow bar */}
        <div className="prf-rainbow" style={{ marginBottom:28 }}/>

        {/* save success */}
        {saveSuccess && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 18px', borderRadius:16, marginBottom:16, background:'#EEF4EE', border:`1.5px solid ${C.sage}`, color:C.forest, fontSize:'0.88rem', fontWeight:600, animation:'fadeUp .4s ease both' }}>
            <div style={{ width:24, height:24, borderRadius:'50%', background:C.sage, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Check size={12} color="white"/>
            </div>
            Профилът е обновен успешно!
          </div>
        )}

        {/* two-column layout */}
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20, alignItems:'start' }}>

          {/* ══ LEFT COLUMN ══════════════════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Profile card */}
            <div className="prf-card" style={{ overflow:'hidden', animationDelay:'0s' }}>
              <div className="prf-rainbow" style={{ borderRadius:0 }}/>
              <div style={{ padding:'28px 24px', display:'flex', flexDirection:'column', alignItems:'center' }} data-tutorial="profile-avatar">

                {/* avatar */}
                <div style={{ position:'relative', marginBottom:14 }}>
                  <div className="prf-avatar" style={{ width:104, height:104, borderRadius:'50%', overflow:'hidden', border:`4px solid #FCCAAB` }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                    ) : (
                      <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
                        {(displayName || currentUser?.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <button onClick={() => fileInputRef.current?.click()}
                      className="prf-btn"
                      style={{ position:'absolute', bottom:0, right:0, width:34, height:34, borderRadius:'50%', border:'3px solid white', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 3px 10px rgba(232,128,103,.4)` }}>
                      <Camera size={14} color="white"/>
                    </button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileSelect}/>
                </div>

                {/* name */}
                {isEditing ? (
                  <input type="text" value={displayName} onChange={e=>setName(e.target.value)}
                    className="prf-input"
                    style={{ textAlign:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.15rem', fontWeight:700, color:C.forest, background:C.bgWarm, border:`2px solid ${C.sage}`, borderRadius:12, padding:'8px 14px', width:'100%', boxSizing:'border-box', marginBottom:6 }}/>
                ) : (
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.35rem', fontWeight:700, color:C.forest, margin:'0 0 4px', textAlign:'center' }}>
                    {currentUser?.displayName || 'Потребител'}
                  </h2>
                )}

                <p style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:C.mist, margin:'0 0 14px' }}>
                  <Mail size={11}/>{currentUser?.email}
                </p>

                {/* level badge */}
                <div style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:999, background:`linear-gradient(135deg,${C.cream},#FCCAAB)`, marginBottom:16 }}>
                  <Award size={13} style={{ color:C.salmon }}/>
                  <span style={{ fontSize:'0.84rem', fontWeight:800, color:C.forest }}>Ниво {getLevel()}</span>
                  <div style={{ display:'flex', gap:3 }}>
                    {Array.from({length:Math.min(getLevel(),5)}).map((_,i) => <TinyFlower key={i} style={{ width:9, height:9 }}/>)}
                  </div>
                </div>

                {/* level progress */}
                <div style={{ width:'100%', padding:'12px 14px', borderRadius:14, background:C.bgWarm, border:`1.5px solid ${C.mistLt}`, marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', fontWeight:700, color:C.stone, marginBottom:7 }}>
                    <span>Прогрес до Ниво {getLevel()+1}</span>
                    <span style={{ color:C.salmon }}>{getLevelProgress()}%</span>
                  </div>
                  <div style={{ height:10, borderRadius:999, background:C.mistLt, overflow:'hidden' }}>
                    <div className="bar-grow"
                      style={{ height:'100%', borderRadius:999, background:`linear-gradient(90deg,${C.salmon},${C.peach},${C.sage})`, ['--target-w' as any]:`${getLevelProgress()}%`, width:`${getLevelProgress()}%` }}/>
                  </div>
                </div>

                {/* action buttons */}
                <div style={{ display:'flex', flexDirection:'column', gap:8, width:'100%' }} data-tutorial="profile-settings">
                  {isEditing ? (
                    <>
                      <button onClick={handleSave} disabled={saving}
                        className="prf-btn"
                        style={{ padding:'11px', borderRadius:12, fontWeight:800, fontSize:'0.88rem', color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.3)`, display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', opacity:saving?.6:1 }}>
                        <Save size={14}/>{saving ? 'Запазване...' : 'Запази промените'}
                      </button>
                      <button onClick={() => setIsEditing(false)}
                        className="prf-ghost"
                        style={{ padding:'11px', borderRadius:12, fontWeight:700, fontSize:'0.88rem', color:C.stone, background:'white', border:`1.5px solid ${C.mistLt}`, display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%' }}>
                        <X size={14}/> Отказ
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setIsEditing(true)}
                      className="prf-ghost"
                      style={{ padding:'11px', borderRadius:12, fontWeight:700, fontSize:'0.88rem', color:C.salmon, background:C.bgWarm, border:`1.5px solid #FCCAAB`, display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%' }}>
                      <Edit2 size={14}/> Редактирай профила
                    </button>
                  )}
                  <button onClick={() => logout()}
                    className="prf-logout"
                    style={{ padding:'11px', borderRadius:12, fontWeight:700, fontSize:'0.88rem', color:'#ef4444', background:'white', border:'1.5px solid #fecaca', width:'100%' }}>
                    <LogOut size={14}/> Изход
                  </button>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="prf-card" style={{ padding:'20px 20px', animationDelay:'.07s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
                <TinyFlower style={{ opacity:.65 }}/>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1rem', fontWeight:700, color:C.forest, margin:0 }}>Бързи връзки</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  { href:'/therapy', icon:<Target size={14}/>,   label:'Дневни задачи', accent:C.salmon },
                  { href:'/journal', icon:<BookOpen size={14}/>, label:'Личен дневник', accent:C.sage   },
                  { href:'/gallery', icon:<Image size={14}/>,    label:'Лична галерия', accent:C.peach  },
                  { href:'/history', icon:<Calendar size={14}/>, label:'История',       accent:C.mist   },
                  { href:'/settings',icon:<Settings size={14}/>, label:'Настройки',     accent:C.stone  },
                ].map((link,i) => (
                  <a key={i} href={link.href} className="prf-link"
                    style={{ background:C.bgWarm, color:C.stone, border:`1px solid ${C.mistLt}` }}>
                    <span style={{ color:link.accent }}>{link.icon}</span>{link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ══ RIGHT COLUMN ═════════════════════════════════════════ */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* tab switcher */}
            <div style={{ display:'flex', gap:6, padding:6, borderRadius:18, width:'fit-content', background:C.bgWarm, border:`1.5px solid ${C.mistLt}` }}>
              {(['stats','achievements'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className="prf-tab"
                  style={{ padding:'9px 18px', borderRadius:13, fontSize:'0.84rem', fontWeight:800,
                    background: activeTab===tab ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'transparent',
                    color:      activeTab===tab ? 'white' : C.stone,
                    boxShadow:  activeTab===tab ? `0 4px 14px rgba(232,128,103,.28)` : 'none',
                  }}>
                  {tab==='stats' ? '📊 Статистика' : `🏆 Постижения (${unlockedCount}/${ACHIEVEMENT_DEFS.length})`}
                </button>
              ))}
            </div>

            {/* ── Stats ── */}
            {activeTab==='stats' && (
              <div className="prf-card" style={{ padding:'24px', animationDelay:'.1s' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                  <TinyFlower style={{ opacity:.65 }}/>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.15rem', fontWeight:700, color:C.forest, margin:0 }}>
                    Вашата статистика
                  </h3>
                </div>

                {/* stat grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
                  {[
                    { icon:<Target size={18}/>,   value:stats.completedTasks,             label:'Задачи',     color:C.salmon, bg:'#FFF0EB' },
                    { icon:<BookOpen size={18}/>,  value:stats.journalEntries,             label:'Записи',     color:C.peach,  bg:'#FFF8EE' },
                    { icon:<Image size={18}/>,     value:stats.uploadedArtworks,           label:'Творби',     color:C.sage,   bg:'#EEF4EE' },
                    { icon:<Award size={18}/>,     value:stats.currentStreak,              label:'Серия',      color:C.mist,   bg:'#EEF4F2' },
                    { icon:<Star size={18}/>,      value:stats.bestStreak,                 label:'Рекорд',     color:C.salmon, bg:'#FFF0EB' },
                    { icon:<Heart size={18}/>,     value:stats.favoriteMood.split(' ')[0], label:'Настроение', color:C.peach,  bg:'#FFF8EE' },
                  ].map((s,i) => (
                    <div key={i} className="prf-stat"
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'14px', border:`2px solid ${s.color}28`, background:s.bg }}>
                      <div style={{ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}22`, color:s.color, flexShrink:0 }}>{s.icon}</div>
                      <div>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.6rem', fontWeight:700, color:C.forest, lineHeight:1 }}>{s.value}</div>
                        <div style={{ fontSize:'0.65rem', fontWeight:800, color:C.stone, textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* activity bars */}
                <div style={{ padding:'16px', borderRadius:16, background:C.bgWarm, border:`1.5px solid ${C.mistLt}` }}>
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
                    <TinyFlower style={{ opacity:.5 }}/>
                    <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone }}>Обща активност</span>
                  </div>
                  {[
                    { label:'Задачи',  value:stats.totalTasks>0?(stats.completedTasks/stats.totalTasks)*100:0, color:C.salmon },
                    { label:'Дневник', value:Math.min(stats.journalEntries*5,100),                             color:C.peach  },
                    { label:'Галерия', value:Math.min(stats.uploadedArtworks*10,100),                          color:C.sage   },
                  ].map((b,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                      <span style={{ fontSize:'0.72rem', fontWeight:700, color:C.stone, width:52, textAlign:'right', flexShrink:0 }}>{b.label}</span>
                      <div style={{ flex:1, height:9, borderRadius:999, background:C.mistLt, overflow:'hidden' }}>
                        <div className="bar-grow"
                          style={{ height:'100%', borderRadius:999, background:b.color, ['--target-w' as any]:`${b.value}%`, width:`${b.value}%` }}/>
                      </div>
                      <span style={{ fontSize:'0.72rem', fontWeight:800, color:b.color, width:34, flexShrink:0 }}>{Math.round(b.value)}%</span>
                    </div>
                  ))}
                </div>

                {/* floral footer */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20, opacity:.28 }}>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
                  <span className="prf-sway-l" style={{ display:'inline-block' }}><Sprig/></span>
                  <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
                  <span className="prf-sway-r" style={{ display:'inline-block' }}><Sprig flip/></span>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
                </div>
              </div>
            )}

            {/* ── Achievements ── */}
            {activeTab==='achievements' && (
              <div className="prf-card" style={{ padding:'24px', animationDelay:'.1s' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <TinyFlower style={{ opacity:.65 }}/>
                    <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.15rem', fontWeight:700, color:C.forest, margin:0 }}>Постижения</h3>
                  </div>
                  <span style={{ padding:'4px 13px', borderRadius:999, fontSize:'0.82rem', fontWeight:800, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
                    {unlockedCount}/{ACHIEVEMENT_DEFS.length}
                  </span>
                </div>

                {/* overall progress bar */}
                <div style={{ padding:'12px 14px', borderRadius:14, background:C.bgWarm, border:`1.5px solid ${C.mistLt}`, marginBottom:18 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', fontWeight:700, color:C.stone, marginBottom:6 }}>
                    <span>Прогрес</span>
                    <span style={{ color:C.salmon }}>{Math.round((unlockedCount/ACHIEVEMENT_DEFS.length)*100)}%</span>
                  </div>
                  <div style={{ height:9, borderRadius:999, background:C.mistLt, overflow:'hidden' }}>
                    <div className="bar-grow"
                      style={{ height:'100%', borderRadius:999, background:`linear-gradient(90deg,${C.salmon},${C.peach},${C.sage})`, ['--target-w' as any]:`${(unlockedCount/ACHIEVEMENT_DEFS.length)*100}%`, width:`${(unlockedCount/ACHIEVEMENT_DEFS.length)*100}%` }}/>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {achievements.map((a,idx) => (
                    <div key={a.id}
                      className={`prf-achieve${a.unlocked ? ' unlocked' : ''}`}
                      style={{ display:'flex', alignItems:'center', gap:11, padding:'13px 14px', opacity:a.unlocked?1:.42, background:a.unlocked?`linear-gradient(135deg,${C.cream},#EEF4EE)`:`${C.bgWarm}`, border:`1.5px solid ${a.unlocked?C.sage:C.mistLt}`, animationDelay:`${idx*0.04}s` }}>
                      <div style={{ fontSize:'2rem', flexShrink:0, filter:a.unlocked?'none':'grayscale(1)' }}>{a.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:'0.82rem', fontWeight:700, color:C.forest }}>{a.title}</div>
                        <div style={{ fontSize:'0.68rem', color:C.mist, marginTop:1 }}>{a.description}</div>
                      </div>
                      {a.unlocked
                        ? <div style={{ width:22, height:22, borderRadius:'50%', background:C.sage, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Check size={11} color="white"/></div>
                        : <span style={{ fontSize:'0.62rem', padding:'2px 7px', borderRadius:999, background:C.mistLt, color:C.stone, fontWeight:600, flexShrink:0 }}>🔒</span>
                      }
                    </div>
                  ))}
                </div>

                {unlockedCount===0 && (
                  <p style={{ textAlign:'center', fontSize:'0.85rem', color:C.mist, marginTop:14 }}>
                    Започнете да използвате ArtCare, за да отключите постижения! 🌸
                  </p>
                )}

                {/* floral footer */}
                <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:20, opacity:.28 }}>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
                  <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
                  <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* responsive fallback — stack on small screens */}
        <style>{`@media(max-width:700px){ [data-profile-grid]{grid-template-columns:1fr !important;} }`}</style>
      </div>
    </div>
  );
};

export default Profile;