import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Check, Plus, Target, Clock, Calendar,
  Flame, Trash2, Sparkles, Star, X, Shield, Edit3, Save,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import QuoteDisplay from '../utils/QuoteDisplay';
import PageTutorial, { THERAPY_TUTORIAL_STEPS } from '../components/PageTutorial';

/* ── Types ─────────────────────────────────────────────────────────── */
interface Task {
  id: string; 
  text: string; 
  completed: boolean;
  isCustom?: boolean; 
  category: string; 
  duration?: string;
  skipped?: boolean;
}

interface DailyProgress {
  userId: string;
  date: string;
  tasks: Task[];
  customTasks: Task[];
  completedCount: number;
  streak: number;
  allCompleted: boolean;
  lastUpdated: Timestamp;
}

/* ── Palette ────────────────────────────────────────────────────────── */
const C = {
  salmon:'#E88067', peach:'#FBBD96', cream:'#F9DDB8',
  sage:'#A3B995', mist:'#A8BBB9', mistLt:'#D4E3DE',
  forest:'#2C3E35', stone:'#5C6E6A', bgWarm:'#FAF5EF',
  bgCard:'#FFF8F3', border:'#F9DDB8',
  adminGold:'#C49A2A',
};

const todayKey = () => new Date().toISOString().split('T')[0];

/* ── SVGs ───────────────────────────────────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke={C.sage} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z"   fill={C.sage} opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z"  fill={C.mist} opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill={C.sage} opacity="0.5"/>
  </svg>
);

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={style}>
    <circle cx="7" cy="7" r="2" fill={C.peach}/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill={C.salmon} opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill={C.salmon} opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB"  opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB"  opacity="0.7"/>
  </svg>
);

/* ── Category colour map ─────────────────────────────────────────────── */
const catMap: Record<string, { bg:string; text:string; border:string }> = {
  drawing:  { bg:'#FFF0EB', text:'#C0603E', border:'#FCCAAB' },
  painting: { bg:'#FFF8EE', text:'#B07030', border:C.cream   },
  mindful:  { bg:'#EEF4EE', text:'#3E6E4A', border:'#B8D4B8' },
  creative: { bg:'#EEF4F2', text:'#3A6660', border:C.mistLt  },
  personal: { bg:'#F5F0FF', text:'#6B50B0', border:'#C9B8E8' },
};
const cmap = (c: string) => catMap[c] ?? catMap.creative;

/* ── Default built-in tasks (fallback if no admin prompts set) ─────── */
const BUILTIN_TASKS: Task[] = [
  { id:'bt1',  text:'Нарисувайте нещо, което ви радва днес',          completed:false, category:'drawing',  duration:'10 мин', skipped:false },
  { id:'bt2',  text:'Оцветете нещо с цветовете на настроението си',   completed:false, category:'painting', duration:'15 мин', skipped:false },
  { id:'bt3',  text:'Медитирайте 5 минути, след това скицирайте',     completed:false, category:'mindful',  duration:'10 мин', skipped:false },
  { id:'bt4',  text:'Създайте нещо само с кръгове и линии',           completed:false, category:'creative', duration:'10 мин', skipped:false },
  { id:'bt5',  text:'Нарисувайте любимото си място',                  completed:false, category:'drawing',  duration:'20 мин', skipped:false },
  { id:'bt6',  text:'Изразете емоция чрез абстрактно изкуство',      completed:false, category:'painting', duration:'15 мин', skipped:false },
  { id:'bt7',  text:'Направете мандала или симетричен дизайн',        completed:false, category:'mindful',  duration:'20 мин', skipped:false },
  { id:'bt8',  text:'Скицирайте 3 неща, за които сте благодарни',     completed:false, category:'personal', duration:'10 мин', skipped:false },
  { id:'bt9',  text:'Нарисувайте нещо, което намирате за красиво',    completed:false, category:'drawing',  duration:'15 мин', skipped:false },
  { id:'bt10', text:'Изразете един страх или притеснение в рисунка',  completed:false, category:'personal', duration:'15 мин', skipped:false },
];

/* ── Load tasks from admin prompts or fallback ─────────────────────── */
function loadDailyTasks(): Task[] {
  try {
    const adminPrompts = localStorage.getItem('artcare_admin_prompts');
    if (adminPrompts) {
      const prompts = JSON.parse(adminPrompts);
      if (Array.isArray(prompts) && prompts.length > 0) {
        return prompts.slice(0, 10).map((p: any, i: number) => ({
          id: p.id || `p-${i}`,
          text: p.text,
          completed: false,
          category: p.category || 'creative',
          duration: p.duration,
          skipped: false,
        }));
      }
    }
  } catch {}
  return [...BUILTIN_TASKS];
}

/* ═══════════════════════════════════════════════════════════════════════ */
const Therapy: React.FC = () => {
  const { currentUser, loading, isAuthenticated, isAdmin } = useAuth();

  const [tasks,       setTasks]       = useState<Task[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);
  const [newTaskText, setNewText]     = useState('');
  const [showQuote,   setShowQuote]   = useState(false);
  const [quoteVisible,setQuoteVisible]= useState(false);
  const [streak,      setStreak]      = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentDate] = useState(new Date());
  const [saving,      setSaving]      = useState(false);

  /* Admin prompt editor state */
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [adminPrompts,     setAdminPrompts]     = useState<Task[]>([]);
  const [editingIdx,       setEditingIdx]       = useState<number|null>(null);
  const [promptSaved,      setPromptSaved]      = useState(false);

  const quoteTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const today = todayKey();

  /* ── Load from Firestore ────────────────────────────────────────────── */
  const loadProgress = useCallback(async () => {
    if (!currentUser) return;

    try {
      const progressRef = doc(db, 'dailyProgress', `${currentUser.uid}_${today}`);
      const progressDoc = await getDoc(progressRef);
      
      let userTasks: Task[] = [];
      let userCustomTasks: Task[] = [];
      let userStreak = 0;

      if (progressDoc.exists()) {
        const data = progressDoc.data() as DailyProgress;
        userTasks = data.tasks || [];
        userCustomTasks = data.customTasks || [];
        userStreak = data.streak || 0;
      } else {
        const dailyTasks = loadDailyTasks();
        userTasks = dailyTasks;
        userCustomTasks = [];
        userStreak = 0;
      }

      setTasks(userTasks);
      setCustomTasks(userCustomTasks);
      setStreak(userStreak);

      if (isAdmin) {
        const ap = localStorage.getItem('artcare_admin_prompts');
        if (ap) setAdminPrompts(JSON.parse(ap));
        else setAdminPrompts([...BUILTIN_TASKS]);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setPageLoading(false);
    }
  }, [currentUser, isAdmin, today]);

  /* ── Save to Firestore ──────────────────────────────────────────────── */
  const saveProgress = useCallback(async (
    updatedTasks: Task[],
    updatedCustomTasks: Task[],
    newStreak: number
  ) => {
    if (!currentUser) return;
    
    setSaving(true);
    try {
      const completedCount = updatedTasks.filter(t => t.completed).length +
                             updatedCustomTasks.filter(t => t.completed).length;
      const allCompleted = updatedTasks.length > 0 && 
                           updatedTasks.every(t => t.completed);

      const progressRef = doc(db, 'dailyProgress', `${currentUser.uid}_${today}`);
      await setDoc(progressRef, {
        userId: currentUser.uid,
        date: today,
        tasks: updatedTasks,
        customTasks: updatedCustomTasks,
        completedCount,
        streak: newStreak,
        allCompleted,
        lastUpdated: Timestamp.now(),
      }, { merge: true });

      const userStatsRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userStatsRef, {
        'stats.currentStreak': newStreak,
        'stats.lastActiveDate': today,
        'stats.totalTasksCompleted': completedCount,
        updatedAt: Timestamp.now(),
      });

      const taskStates: Record<string, boolean> = {};
      updatedTasks.forEach(t => { taskStates[t.id] = t.completed; });
      localStorage.setItem(`therapy_progress_${currentUser.uid}`, JSON.stringify({
        completedCount,
        streak: newStreak,
        lastUpdated: today,
        taskStates,
        customTasks: updatedCustomTasks,
      }));
      
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSaving(false);
    }
  }, [currentUser, today]);

  /* ── Initial load ───────────────────────────────────────────────────── */
  useEffect(() => {
    if (currentUser) {
      loadProgress();
    } else if (!loading) {
      setPageLoading(false);
    }
  }, [currentUser, loading, loadProgress]);

  /* ── Toast ──────────────────────────────────────────────────────────── */
  const triggerQuote = useCallback(() => {
    setShowQuote(true); setQuoteVisible(true);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => {
      setQuoteVisible(false);
      setTimeout(() => setShowQuote(false), 380);
    }, 7000);
  }, []);

  /* ── Toggle task ────────────────────────────────────────────────────── */
  const toggleTask = async (id: string, isCustom = false) => {
    if (!currentUser) return;
    
    let updatedTasks = [...tasks];
    let updatedCustomTasks = [...customTasks];
    let newStreak = streak;

    if (isCustom) {
      updatedCustomTasks = updatedCustomTasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      setCustomTasks(updatedCustomTasks);
    } else {
      updatedTasks = updatedTasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);
      
      const allCompleted = updatedTasks.every(t => t.completed);
      if (allCompleted && updatedTasks.length > 0) {
        newStreak = streak + 1;
        setStreak(newStreak);
        triggerQuote();
      }
    }
    
    await saveProgress(updatedTasks, updatedCustomTasks, newStreak);
  };

  const addCustomTask = async () => {
    if (!newTaskText.trim() || customTasks.length >= 10) return;
    
    const newTask: Task = {
      id: `custom-${Date.now()}`,
      text: newTaskText.trim(),
      completed: false,
      isCustom: true,
      category: 'personal',
      skipped: false,
    };
    
    const updatedCustomTasks = [...customTasks, newTask];
    setCustomTasks(updatedCustomTasks);
    setNewText('');
    await saveProgress(tasks, updatedCustomTasks, streak);
  };

  const removeCustomTask = async (id: string) => {
    const updatedCustomTasks = customTasks.filter(t => t.id !== id);
    setCustomTasks(updatedCustomTasks);
    await saveProgress(tasks, updatedCustomTasks, streak);
  };

  /* ── Admin: save prompts ────────────────────────────────────────────── */
  const saveAdminPrompts = () => {
    localStorage.setItem('artcare_admin_prompts', JSON.stringify(adminPrompts));
    setShowPromptEditor(false);
    setEditingIdx(null);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 3000);
    const daily = loadDailyTasks().map(t => ({ 
      ...t, 
      completed: tasks.find(et => et.id === t.id)?.completed ?? false 
    }));
    setTasks(daily);
    saveProgress(daily, customTasks, streak);
  };

  const dailyDone  = tasks.filter(t => t.completed).length;
  const dailyTotal = tasks.length;
  const dailyPct   = dailyTotal > 0 ? Math.round((dailyDone/dailyTotal)*100) : 0;
  const allDone    = dailyDone === dailyTotal && dailyTotal > 0;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('bg-BG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  const motivMsg = () => {
    if (dailyPct>=100) return '🎉 Завършихте всички задачи за днес!';
    if (dailyPct>=75)  return '💪 Много добре — продължавайте!';
    if (dailyPct>=50)  return '🌟 Вече сте наполовина — страхотно!';
    if (dailyPct>=25)  return '✨ Добър старт, продължете!';
    return '🚀 Започнете с първата задача...';
  };

  /* ── Guards ─────────────────────────────────────────────────────────── */
  if (loading || pageLoading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito', sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid ${C.mistLt}`, borderTopColor:C.salmon, margin:'0 auto 16px', animation:'spin .8s linear infinite' }}/>
        <p style={{ color:C.stone, fontWeight:600, fontFamily:"'Nunito', sans-serif" }}>Зареждане на задачите...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito', sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', maxWidth:400, width:'100%', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
          <Target size={28} color="white"/>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'1.7rem', fontWeight:700, color:C.forest, marginBottom:10 }}>Дневни задачи</h2>
        <p style={{ color:C.stone, marginBottom:28, fontSize:'0.9rem' }}>Моля, влезте за да видите вашите задачи.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href="/login"  style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration:'none', fontFamily:"'Nunito', sans-serif" }}>Вход</a>
          <a href="/signup" style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:C.salmon, border:`2px solid ${C.border}`, textDecoration:'none', fontFamily:"'Nunito', sans-serif" }}>Регистрация</a>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════ RENDER ═══════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(125deg, ${C.bgWarm} 0%, #FEF7E8 40%, #EEF4F2 100%)`, fontFamily:"'Nunito', sans-serif", position:'relative', overflowX:'hidden' }}>

      {/* Organic background blobs */}
      <div style={{ position:'fixed', top:'-20vh', left:'-15vw', width:'70vw', height:'70vw', background:`radial-gradient(circle, ${C.peach}20, transparent 70%)`, borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', bottom:'-10vh', right:'-10vw', width:'60vw', height:'60vw', background:`radial-gradient(circle, ${C.mistLt}30, transparent 70%)`, borderRadius:'50%', pointerEvents:'none', zIndex:0 }} />
      <div style={{ position:'fixed', top:'40%', left:'-5vw', width:'40vw', height:'40vw', background:`radial-gradient(circle, ${C.sage}15, transparent 70%)`, borderRadius:'50%', filter:'blur(60px)', pointerEvents:'none', zIndex:0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes borderFlow  { 0%,100%{background-position:0%}50%{background-position:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes softPulse   { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(.88)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)} }
        @keyframes checkBounce { 0%{transform:scale(0)}55%{transform:scale(1.3)}100%{transform:scale(1)} }
        @keyframes toastIn     { from{opacity:0;transform:translateX(60px) scale(.94)}to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes toastOut    { from{opacity:1;transform:translateX(0) scale(1)}to{opacity:0;transform:translateX(60px) scale(.94)} }
        @keyframes streakGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(232,128,103,0)}50%{box-shadow:0 0 0 10px rgba(232,128,103,.12)} }
        @keyframes shimmer     { 0%,100%{background-position:0%}50%{background-position:100%} }
        @keyframes adminFlash  { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn     { from{opacity:0;transform:scale(.96) translateY(14px)}to{opacity:1;transform:none} }
        @keyframes floatLeaf   { 0%,100%{transform:translateY(0px) rotate(0deg)}50%{transform:translateY(-12px) rotate(6deg)} }

        .th-rainbow{
          height:3px; border-radius:999px;
          background:linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage},${C.mist},${C.salmon});
          background-size:200% 100%; animation:borderFlow 6s ease infinite;
        }
        .th-card{
          animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          border-radius:28px;
          background:rgba(255,248,243,0.7);
          backdrop-filter:blur(2px);
          border:1px solid rgba(249,221,184,0.5);
          box-shadow:0 8px 32px rgba(44,62,53,0.05);
          transition:box-shadow .22s, transform .22s;
        }
        .th-card:hover{box-shadow:0 16px 40px rgba(44,62,53,0.08);}
        .th-task{
          border-radius:20px; border:1px solid rgba(249,221,184,0.6); background:rgba(255,248,243,0.8);
          transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, border-color .2s, background .25s;
          cursor:pointer; animation:fadeUp .4s cubic-bezier(.22,1,.36,1) both;
        }
        .th-task:hover{transform:translateY(-4px); box-shadow:0 12px 28px rgba(44,62,53,0.08); border-color:#FCCAAB;}
        .th-task-done{background:rgba(238,244,238,0.85) !important; border-color:${C.sage} !important;}
        .th-check-bounce{animation:checkBounce .35s cubic-bezier(.34,1.56,.64,1);}
        .th-bar-fill{
          height:100%; border-radius:999px;
          background:linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage});
          background-size:200% 100%; animation:shimmer 4s ease infinite;
          transition:width .8s cubic-bezier(.34,1.56,.64,1);
        }
        .th-streak{animation:streakGlow 2.8s ease-in-out infinite;}
        .th-sway-l{animation:softSway 4.5s ease-in-out infinite; transform-origin:bottom center;}
        .th-sway-r{animation:softSway 4.5s ease-in-out infinite .6s; transform-origin:bottom center;}
        .th-float{animation:softPulse 4s ease-in-out infinite;}
        .th-sparkle{animation:softPulse 2.5s ease-in-out infinite;}
        .th-btn{cursor:pointer; border:none; transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;}
        .th-btn:hover{transform:translateY(-2px);}
        .th-btn:active{transform:scale(.97);}
        .th-ghost{cursor:pointer; transition:transform .18s, background .18s, border-color .18s;}
        .th-ghost:hover{transform:translateY(-2px); background:#FFF0EB !important; border-color:#FCCAAB !important;}
        .th-input:focus{outline:none; border-color:${C.sage} !important; box-shadow:0 0 0 3px rgba(163,185,149,.18);}
        .th-remove{transition:transform .2s, opacity .2s; opacity:0;}
        .th-task:hover .th-remove{opacity:1;}
        .th-remove:hover{transform:rotate(90deg) scale(1.15) !important;}
        .th-toast-in{animation:toastIn .38s cubic-bezier(.22,1,.36,1) both;}
        .th-toast-out{animation:toastOut .34s ease both;}
        .th-grid{display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:18px;}
        @media(max-width:680px){.th-grid{grid-template-columns:1fr;}}
        .admin-badge{background:linear-gradient(135deg,${C.adminGold},#E8B84B); background-size:200%; animation:shimmer 4s ease infinite;}
        .admin-flash{animation:adminFlash .3s ease both;}
        .modal-in{animation:modalIn .34s cubic-bezier(.22,1,.36,1) both;}
        .admin-row{transition:background .15s; border-radius:12px;}
        .admin-row:hover{background:${C.bgWarm} !important;}
        .floating-leaf{position:absolute; pointer-events:none; opacity:0.3; animation:floatLeaf 12s ease-in-out infinite;}
      `}</style>

      <PageTutorial storageKey="artcare_tut_therapy" steps={THERAPY_TUTORIAL_STEPS}/>

      {/* Floating decorative leaves */}
      <div className="floating-leaf" style={{ top:'12%', left:'2%', width:40, height:40 }}>
        <Sprig style={{ width:40, height:40 }}/>
      </div>
      <div className="floating-leaf" style={{ top:'70%', right:'1%', width:50, height:50, animationDelay:'-4s' }}>
        <Sprig style={{ width:50, height:50, transform:'scaleX(-1)' }}/>
      </div>
      <div className="floating-leaf" style={{ bottom:'15%', left:'5%', width:30, height:30, animationDelay:'-8s' }}>
        <Sprig style={{ width:30, height:30 }}/>
      </div>

      {/* Prompt saved flash */}
      {promptSaved && (
        <div className="admin-flash" style={{ position:'fixed', top:82, right:20, zIndex:60, padding:'12px 18px', borderRadius:16, background:'#EEF4EE', border:`1.5px solid ${C.sage}`, color:C.forest, fontSize:'0.88rem', fontWeight:700, display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 24px rgba(44,62,53,0.12)' }}>
          <Check size={14} style={{ color:C.sage }}/> Задачите са обновени за всички потребители!
        </div>
      )}

      {/* Saving indicator */}
      {saving && (
        <div style={{ position:'fixed', bottom:20, left:20, zIndex:60, padding:'8px 16px', borderRadius:20, background:C.forest, color:'white', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:8 }}>
          <div className="th-spin" style={{ width:12, height:12, borderRadius:'50%', border:'2px solid white', borderTopColor:'transparent', animation:'spin .6s linear infinite' }}/>
          Запазване...
        </div>
      )}

      {/* Quote toast */}
      {showQuote && (
        <div className={quoteVisible ? 'th-toast-in' : 'th-toast-out'}
          style={{ position:'fixed', bottom:28, right:24, zIndex:80, maxWidth:300, width:'calc(100% - 48px)', background:'white', borderRadius:18, border:`1.5px solid ${C.border}`, boxShadow:'0 12px 40px rgba(44,62,53,0.14)', overflow:'hidden', pointerEvents:quoteVisible?'auto':'none' }}>
          <div className="th-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'12px 14px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="th-float" style={{ fontSize:'1.2rem', lineHeight:1 }}>🌸</span>
                <span style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'0.88rem', fontWeight:700, color:C.forest }}>Поздравления!</span>
              </div>
              <button onClick={()=>{ setQuoteVisible(false); setTimeout(()=>setShowQuote(false),380); }}
                style={{ width:24, height:24, borderRadius:'50%', border:`1.5px solid ${C.mistLt}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='rotate(90deg)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='none')}>
                <X size={11}/>
              </button>
            </div>
            <div style={{ fontSize:'0.78rem', fontStyle:'italic', lineHeight:1.6, color:C.stone, background:C.bgWarm, borderRadius:12, padding:'8px 11px', border:`1px solid ${C.border}` }}>
              <QuoteDisplay type="task_completion"/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
              <div style={{ display:'flex', gap:4 }}>
                <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
              </div>
              <span style={{ fontSize:'0.68rem', fontWeight:700, color:C.stone, display:'flex', alignItems:'center', gap:4 }}>
                <Flame size={10} style={{ color:C.salmon }}/>{streak} дни поредица
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Admin Prompt Editor Modal */}
      {showPromptEditor && isAdmin && (
        <div style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(44,62,53,0.55)', backdropFilter:'blur(8px)' }}
          onClick={()=>setShowPromptEditor(false)}>
          <div className="modal-in"
            style={{ background:'white', width:'100%', maxWidth:620, maxHeight:'88vh', overflowY:'auto', borderRadius:24, boxShadow:'0 32px 80px rgba(44,62,53,0.25)', border:`2px solid ${C.adminGold}40` }}
            onClick={e=>e.stopPropagation()}>
            <div style={{ height:4, background:`linear-gradient(90deg,${C.adminGold},#E8B84B,${C.salmon},${C.adminGold})`, backgroundSize:'200%', animation:'borderFlow 4s ease infinite' }}/>
            <div style={{ padding:'22px 26px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.adminGold},#E8B84B)` }}>
                    <Shield size={16} color="white"/>
                  </div>
                  <div>
                    <p style={{ fontSize:'0.58rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.16em', color:C.adminGold, margin:0 }}>Администратор</p>
                    <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'1.2rem', fontWeight:700, color:C.forest, margin:0 }}>
                      Редактиране на задачи
                    </h3>
                  </div>
                </div>
                <button onClick={()=>setShowPromptEditor(false)}
                  style={{ width:32, height:32, borderRadius:'50%', border:`1.5px solid ${C.border}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='rotate(90deg)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='none')}><X size={14}/></button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:7, marginBottom:18 }}>
                {adminPrompts.map((p, idx) => {
                  const cs = cmap(p.category);
                  return editingIdx===idx ? (
                    <div key={p.id} style={{ padding:'12px 14px', borderRadius:14, border:`2px solid ${C.sage}`, background:C.bgWarm }}>
                      <textarea value={p.text}
                        onChange={e=>setAdminPrompts(prev=>prev.map((x,i)=>i===idx?{...x,text:e.target.value}:x))}
                        rows={2}
                        style={{ width:'100%', padding:'8px 12px', borderRadius:10, fontSize:'0.84rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:'white', resize:'none', fontFamily:"'Nunito', sans-serif", marginBottom:8, boxSizing:'border-box' }}
                      />
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                        <select value={p.category}
                          onChange={e=>setAdminPrompts(prev=>prev.map((x,i)=>i===idx?{...x,category:e.target.value}:x))}
                          style={{ padding:'6px 10px', borderRadius:8, fontSize:'0.78rem', border:`1.5px solid ${C.mistLt}`, outline:'none', cursor:'pointer' }}>
                          {['drawing','painting','mindful','creative','personal'].map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                        <input type="text" value={p.duration||''} placeholder="Продъл."
                          onChange={e=>setAdminPrompts(prev=>prev.map((x,i)=>i===idx?{...x,duration:e.target.value||undefined}:x))}
                          style={{ padding:'6px 10px', borderRadius:8, fontSize:'0.78rem', border:`1.5px solid ${C.mistLt}`, width:110 }}
                        />
                        <button onClick={()=>setEditingIdx(null)}
                          style={{ padding:'6px 14px', borderRadius:8, fontSize:'0.78rem', fontWeight:700, color:'white', background:C.sage, border:'none', cursor:'pointer' }}>
                          Готово
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={p.id} className="admin-row"
                      style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', border:`1px solid ${C.border}`, background:idx%2===0?'white':C.bgWarm }}>
                      <span style={{ fontSize:'0.65rem', color:C.mist, fontWeight:700, width:18, flexShrink:0 }}>{idx+1}</span>
                      <p style={{ flex:1, fontSize:'0.84rem', color:C.forest, margin:0, fontWeight:600 }}>{p.text}</p>
                      <div style={{ display:'flex', gap:5, flexShrink:0, alignItems:'center' }}>
                        <span style={{ fontSize:'0.62rem', padding:'2px 7px', borderRadius:999, background:cs.bg, color:cs.text, border:`1px solid ${cs.border}`, fontWeight:700 }}>{p.category}</span>
                        {p.duration && <span style={{ fontSize:'0.62rem', color:C.mist, fontWeight:600 }}>{p.duration}</span>}
                        <button onClick={()=>setEditingIdx(idx)} style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:C.bgWarm, border:`1.5px solid ${C.mistLt}`, color:C.stone, cursor:'pointer' }}>
                          <Edit3 size={10}/>
                        </button>
                        <button onClick={()=>setAdminPrompts(prev=>prev.filter((_,i)=>i!==idx))} style={{ width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#FFF0EB', border:`1.5px solid #FCCAAB`, color:C.salmon, cursor:'pointer' }}>
                          <Trash2 size={10}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display:'flex', gap:10, paddingTop:14, borderTop:`1.5px solid ${C.border}` }}>
                <button onClick={()=>setShowPromptEditor(false)}
                  style={{ flex:1, padding:'11px', borderRadius:12, fontWeight:700, fontSize:'0.86rem', color:C.stone, background:'white', border:`1.5px solid ${C.mistLt}`, cursor:'pointer' }}>
                  Отказ
                </button>
                <button onClick={saveAdminPrompts}
                  style={{ flex:2, padding:'11px', borderRadius:12, fontWeight:800, fontSize:'0.86rem', color:'white', background:`linear-gradient(135deg,${C.adminGold},#E8B84B)`, border:'none', cursor:'pointer', boxShadow:`0 4px 14px rgba(196,154,42,.3)`, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  <Save size={14}/> Запази и приложи за всички
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════ MAIN FULL-WIDTH LAYOUT ════════════════════════════ */}
      <div style={{ position:'relative', zIndex:2, padding:'28px 5% 60px' }}>

        <div className="th-rainbow" style={{ marginBottom:32, width:'100%' }}/>

        {/* HEADER */}
        <div style={{ display:'flex', flexWrap:'wrap', alignItems:'flex-start', justifyContent:'space-between', gap:20, marginBottom:28 }}>
          <div>
            <h1 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'clamp(2rem,5vw,3rem)', fontWeight:700, color:C.forest, margin:0, display:'flex', alignItems:'center', gap:14 }}>
              <span style={{ width:52, height:52, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 8px 18px rgba(232,128,103,.25)` }}>
                <Target size={24} color="white"/>
              </span>
              Дневни задачи
            </h1>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:8, marginLeft:66 }}>
              <TinyFlower style={{ opacity:.6 }}/>
              <span style={{ fontSize:'0.85rem', color:C.stone, fontWeight:600 }}>{formatDate(currentDate)}</span>
            </div>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', borderRadius:999, background:'rgba(255,248,243,0.7)', backdropFilter:'blur(2px)', border:`1px solid ${C.border}`, fontSize:'0.85rem', fontWeight:700, color:C.stone }}>
              <Calendar size={14} style={{ color:C.salmon }}/>
              {currentDate.toLocaleDateString('bg-BG', { day:'numeric', month:'long' })}
            </div>
            {isAdmin && (
              <button onClick={()=>setShowPromptEditor(true)}
                className="th-btn admin-badge"
                style={{ padding:'8px 18px', borderRadius:999, fontSize:'0.85rem', fontWeight:800, color:'white', display:'flex', alignItems:'center', gap:8 }}>
                <Shield size={14}/> Редактирай задачи
              </button>
            )}
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:20, marginBottom:28 }}>
          <div className="th-streak" style={{ flex:'1 1 240px', display:'flex', alignItems:'center', gap:16, padding:'20px 24px', borderRadius:28, background:'rgba(255,248,243,0.7)', backdropFilter:'blur(2px)', border:`1px solid ${C.border}` }}>
            <div style={{ width:54, height:54, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 6px 16px rgba(232,128,103,.3)` }}>
              <Flame size={26} color="white"/>
            </div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'2.8rem', fontWeight:700, color:C.forest, lineHeight:1 }}>{streak}</div>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:C.stone, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>дни поредица</div>
            </div>
          </div>
          <div style={{ flex:'1 1 240px', display:'flex', alignItems:'center', gap:16, padding:'20px 24px', borderRadius:28, background:'rgba(238,244,238,0.8)', backdropFilter:'blur(2px)', border:`1px solid #C4D8C4` }}>
            <div style={{ width:54, height:54, borderRadius:18, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow:`0 6px 16px rgba(163,185,149,.3)` }}>
              <Check size={26} color="white"/>
            </div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'2.8rem', fontWeight:700, color:C.forest, lineHeight:1 }}>
                {dailyDone}<span style={{ fontSize:'1.4rem', color:C.stone, fontWeight:600 }}>/{dailyTotal}</span>
              </div>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:C.stone, marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>задачи за днес</div>
            </div>
          </div>
          {allDone && (
            <div className="th-float" style={{ flex:'1 1 200px', display:'flex', alignItems:'center', gap:12, padding:'20px 24px', borderRadius:28, background:'rgba(238,244,238,0.8)', backdropFilter:'blur(2px)', border:`1px solid ${C.sage}` }}>
              <Sparkles size={22} className="th-sparkle" style={{ color:C.sage }}/>
              <span style={{ fontSize:'1rem', fontWeight:700, color:C.forest }}>Перфектен ден!</span>
            </div>
          )}
        </div>

        {/* PROGRESS CARD */}
        <div className="th-card" style={{ padding:'24px 32px', marginBottom:32 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, margin:0 }}>Дневен прогрес</h3>
            <span style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:'1.7rem', fontWeight:700, color:C.salmon, background:'rgba(255,248,243,0.8)', border:`1px solid ${C.border}`, borderRadius:16, padding:'4px 18px' }}>{dailyPct}%</span>
          </div>
          <div style={{ height:18, borderRadius:999, background:C.mistLt, overflow:'hidden', marginBottom:16, position:'relative', boxShadow:'inset 0 1px 4px rgba(44,62,53,.08)' }}>
            <div className="th-bar-fill" style={{ width:`${dailyPct}%` }}/>
            {[25,50,75].map(m=>(
              <div key={m} style={{ position:'absolute', top:'50%', left:`${m}%`, transform:'translate(-50%,-50%)', width:6, height:6, borderRadius:'50%', background:dailyPct>=m?'rgba(255,255,255,.85)':'rgba(92,110,106,.25)', transition:'background .4s' }}/>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
            <span className="th-sway-l"><Sprig/></span>
            <span style={{ fontSize:'0.9rem', fontWeight:600, color:C.stone, background:'rgba(255,248,243,0.6)', border:`1px solid ${C.border}`, borderRadius:999, padding:'6px 24px' }}>{motivMsg()}</span>
            <span className="th-sway-r"><Sprig style={{ transform:'scaleX(-1)' }}/></span>
          </div>
        </div>

        {/* TWO‑COLUMN LAYOUT */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(360px, 1fr))', gap:28 }}>
          
          {/* Daily tasks */}
          <div className="th-card" style={{ padding:'26px 28px' }} data-tutorial="therapy-task-card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Star size={18} style={{ color:C.salmon, flexShrink:0 }}/>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, margin:0 }}>Дневни задачи</h2>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {allDone && <Sparkles size={15} className="th-sparkle" style={{ color:C.salmon }}/>}
                <span style={{ fontSize:'0.8rem', fontWeight:700, color:C.stone, background:'rgba(255,248,243,0.6)', border:`1px solid ${C.border}`, borderRadius:999, padding:'3px 14px' }}>
                  {dailyDone}/{dailyTotal}
                </span>
              </div>
            </div>
            <p style={{ fontSize:'0.8rem', color:C.stone, marginBottom:24, marginLeft:32, fontStyle:'italic', opacity:.7 }}>
              Завършете всички {dailyTotal} задачи за да увеличите поредицата ✨
            </p>
            <div className="th-grid">
              {tasks.map((task, i) => {
                const cs = cmap(task.category);
                return (
                  <div key={task.id} className={`th-task${task.completed?' th-task-done':''}`}
                    onClick={()=>toggleTask(task.id)}
                    style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 18px', animationDelay:`${i*0.04}s` }}>
                    <div style={{ marginTop:2, flexShrink:0 }}>
                      {task.completed
                        ? <div className="th-check-bounce" style={{ width:24, height:24, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow:`0 2px 8px rgba(163,185,149,.35)` }}>
                            <Check size={14} color="white"/>
                          </div>
                        : <div style={{ width:24, height:24, borderRadius:9, border:`2px solid ${C.mistLt}`, background:'white' }}/>
                      }
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ display:'block', fontSize:'0.9rem', fontWeight:600, color:task.completed?C.stone:C.forest, lineHeight:1.5, textDecoration:task.completed?'line-through':'none', opacity:task.completed?.55:1, transition:'all .25s' }}>
                        {task.text}
                      </span>
                      <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 10px', borderRadius:999, background:cs.bg, color:cs.text, border:`1px solid ${cs.border}` }}>{task.category}</span>
                        {task.duration && (
                          <span style={{ fontSize:'0.68rem', fontWeight:600, padding:'2px 10px', borderRadius:999, background:'white', color:C.stone, border:`1px solid ${C.mistLt}`, display:'flex', alignItems:'center', gap:4 }}>
                            <Clock size={9}/>{task.duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom tasks */}
          <div className="th-card" style={{ padding:'26px 28px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Plus size={18} style={{ color:C.peach, flexShrink:0 }}/>
                <h2 style={{ fontFamily:"'Cormorant Garamond', serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, margin:0 }}>Мои задачи</h2>
              </div>
              <span style={{ fontSize:'0.8rem', fontWeight:700, color:C.stone, background:'rgba(255,248,243,0.6)', border:`1px solid ${C.border}`, borderRadius:999, padding:'3px 14px' }}>
                {customTasks.length}/10
              </span>
            </div>
            <p style={{ fontSize:'0.8rem', color:C.stone, marginBottom:24, marginLeft:32, fontStyle:'italic', opacity:.7 }}>
              Незадължителни — добавете своите лични цели за деня.
            </p>
            <div style={{ display:'flex', gap:10, marginBottom:22, flexWrap:'wrap' }}>
              <input type="text" className="th-input"
                placeholder="Нова лична задача... (Enter за добавяне)"
                value={newTaskText} onChange={e=>setNewText(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addCustomTask()}
                disabled={customTasks.length>=10}
                style={{ flex:'1 1 220px', padding:'12px 20px', borderRadius:999, fontSize:'0.88rem', fontWeight:600, border:`1.5px solid ${C.mistLt}`, background:'rgba(255,248,243,0.6)', color:C.forest, fontFamily:"'Nunito', sans-serif", transition:'border-color .2s, box-shadow .2s' }}
              />
              <button className="th-btn" onClick={addCustomTask}
                disabled={!newTaskText.trim()||customTasks.length>=10}
                style={{ padding:'12px 26px', borderRadius:999, fontWeight:700, color:'white', fontSize:'0.88rem', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'flex', alignItems:'center', gap:8, opacity:(!newTaskText.trim()||customTasks.length>=10)?.45:1, fontFamily:"'Nunito', sans-serif" }}>
                <Plus size={16}/> Добави
              </button>
            </div>

            {customTasks.length>=10 && (
              <p style={{ fontSize:'0.8rem', textAlign:'center', marginBottom:16, padding:'8px 16px', borderRadius:999, color:C.salmon, background:'rgba(232,128,103,.07)', border:'1.5px solid rgba(232,128,103,.2)' }}>
                Достигнахте максималния брой лични задачи (10)
              </p>
            )}

            {customTasks.length===0 ? (
              <div style={{ textAlign:'center', padding:'40px 20px', borderRadius:20, border:`2px dashed ${C.border}`, background:'rgba(255,248,243,0.4)', position:'relative' }}>
                <div style={{ position:'absolute', top:12, left:14, opacity:.3 }}><Sprig/></div>
                <div style={{ position:'absolute', top:12, right:14, opacity:.3 }}><Sprig style={{ transform:'scaleX(-1)' }}/></div>
                <div style={{ fontSize:'2.5rem', marginBottom:10, opacity:.4 }}>✏️</div>
                <p style={{ fontWeight:700, color:C.stone, fontSize:'0.95rem' }}>Все още няма лични задачи</p>
                <p style={{ fontSize:'0.8rem', color:C.stone, opacity:.6, marginTop:4 }}>Добавете до 10 свои цели за деня</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {customTasks.map((task, i) => (
                  <div key={task.id} className={`th-task${task.completed?' th-task-done':''}`}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderLeft:`5px solid ${task.completed?C.sage:C.peach}`, animationDelay:`${i*0.05}s` }}>
                    <div style={{ cursor:'pointer', flexShrink:0 }} onClick={()=>toggleTask(task.id,true)}>
                      {task.completed
                        ? <div className="th-check-bounce" style={{ width:24, height:24, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow:`0 2px 8px rgba(163,185,149,.35)` }}>
                            <Check size={14} color="white"/>
                          </div>
                        : <div style={{ width:24, height:24, borderRadius:9, border:`2px solid #FCCAAB`, background:'white' }}/>
                      }
                    </div>
                    <span onClick={()=>toggleTask(task.id,true)}
                      style={{ flex:1, fontSize:'0.9rem', fontWeight:600, color:task.completed?C.stone:C.forest, cursor:'pointer', textDecoration:task.completed?'line-through':'none', opacity:task.completed?.55:1, transition:'all .25s' }}>
                      {task.text}
                    </span>
                    <button className="th-remove th-btn" onClick={()=>removeCustomTask(task.id)}
                      style={{ width:30, height:30, borderRadius:'50%', border:'none', cursor:'pointer', background:'rgba(232,128,103,.09)', color:C.salmon, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Trash2 size={14}/>
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:28, opacity:.3 }}>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
              <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Therapy;