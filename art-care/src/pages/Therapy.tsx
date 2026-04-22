import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Check, Plus, Target, Clock, Calendar,
  Flame, Trash2, Sparkles, Star, X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QuoteDisplay from '../utils/QuoteDisplay';
import { generateDailyTasks, type Task } from '../utils/taskGenerator';
import PageTutorial, { THERAPY_TUTORIAL_STEPS } from '../components/PageTutorial';

/* ── Types ─────────────────────────────────────────────────────────── */
interface Progress {
  completedCount: number;
  streak: number;
  lastUpdated: string;
  taskStates: Record<string, boolean>;
  customTasks: Task[];
}

/* ── Palette — exact match with Header / Footer / Home ─────────────── */
const C = {
  salmon:  '#E88067',
  peach:   '#FBBD96',
  cream:   '#F9DDB8',
  sage:    '#A3B995',
  mist:    '#A8BBB9',
  mistLt:  '#D4E3DE',
  forest:  '#2C3E35',
  stone:   '#5C6E6A',
  bgWarm:  '#FAF5EF',
  bgCard:  '#FFF8F3',
  border:  '#F9DDB8',
};

const todayKey = () => new Date().toISOString().split('T')[0];

/* ── Shared botanical SVGs (identical to Header / Footer) ──────────── */
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

/* ── Category pill styles — same vibe as Home feature cards ─────────── */
const catMap: Record<string, { bg: string; text: string; border: string }> = {
  drawing:  { bg: '#FFF0EB', text: '#C0603E', border: '#FCCAAB' },
  painting: { bg: '#FFF8EE', text: '#B07030', border: C.cream   },
  mindful:  { bg: '#EEF4EE', text: '#3E6E4A', border: '#B8D4B8' },
  creative: { bg: '#EEF4F2', text: '#3A6660', border: C.mistLt  },
  personal: { bg: '#F5F0FF', text: '#6B50B0', border: '#C9B8E8' },
};
const cmap = (c: string) => catMap[c] ?? catMap.creative;

/* ═══════════════════════════════════════════════════════════════════ */
const Therapy: React.FC = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [customTasks,  setCustomTasks]  = useState<Task[]>([]);
  const [newTaskText,  setNewText]      = useState('');
  const [showQuote,    setShowQuote]    = useState(false);
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [streak,       setStreak]       = useState(0);
  const [pageLoading,  setPageLoading]  = useState(true);
  const [currentDate]  = useState(new Date());
  const quoteTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storageKey = useCallback(
    (s: string) => `therapy_${s}_${currentUser?.uid ?? 'guest'}`,
    [currentUser],
  );
  const today = todayKey();

  /* ── toast trigger ─────────────────────────────────────────────── */
  const triggerQuote = useCallback(() => {
    setShowQuote(true);
    setQuoteVisible(true);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => {
      setQuoteVisible(false);
      setTimeout(() => setShowQuote(false), 380);
    }, 7000);
  }, []);

  /* ── load ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) return;
    try {
      const raw = localStorage.getItem(storageKey('progress'));
      let prog: Progress = { completedCount: 0, streak: 0, lastUpdated: today, taskStates: {}, customTasks: [] };
      if (raw) {
        const p = JSON.parse(raw) as Progress;
        if (p.lastUpdated === today) {
          prog = p;
        } else {
          const yest = new Date(); yest.setDate(yest.getDate() - 1);
          prog.streak = p.lastUpdated === yest.toISOString().split('T')[0] ? p.streak : 0;
          prog.lastUpdated = today;
        }
      }
      const daily = generateDailyTasks().map(t => ({ ...t, completed: prog.taskStates[t.id] ?? false }));
      setTasks(daily);
      setCustomTasks(prog.customTasks ?? []);
      setStreak(prog.streak);
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  }, [currentUser]);

  /* ── persist ───────────────────────────────────────────────────── */
  const persist = useCallback((ut: Task[], uc: Task[], ns: number) => {
    if (!currentUser) return;
    const taskStates: Record<string, boolean> = {};
    ut.forEach(t => { taskStates[t.id] = t.completed; });
    localStorage.setItem(storageKey('progress'), JSON.stringify({
      completedCount: ut.filter(t => t.completed).length + uc.filter(t => t.completed).length,
      streak: ns, lastUpdated: today, taskStates, customTasks: uc,
    } as Progress));
  }, [currentUser, storageKey, today]);

  /* ── toggle ────────────────────────────────────────────────────── */
  const toggleTask = (id: string, isCustom = false) => {
    if (!currentUser) return;
    let ut = tasks, uc = customTasks, ns = streak;
    if (isCustom) {
      uc = customTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      setCustomTasks(uc);
    } else {
      ut = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      setTasks(ut);
      if (ut.every(t => t.completed) && ut.length > 0) {
        ns = streak + 1; setStreak(ns); triggerQuote();
      }
    }
    persist(ut, uc, ns);
  };

  const addCustomTask = () => {
    if (!newTaskText.trim() || customTasks.length >= 10) return;
    const t: Task = { id: `custom-${Date.now()}`, text: newTaskText.trim(), completed: false, isCustom: true, category: 'personal' };
    const uc = [...customTasks, t];
    setCustomTasks(uc); setNewText('');
    persist(tasks, uc, streak);
  };

  const removeCustomTask = (id: string) => {
    const uc = customTasks.filter(t => t.id !== id);
    setCustomTasks(uc); persist(tasks, uc, streak);
  };

  const dailyDone    = tasks.filter(t => t.completed).length;
  const dailyTotal   = tasks.length;
  const dailyPct     = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0;
  const allDailyDone = dailyDone === dailyTotal && dailyTotal > 0;

  const formatDate = (d: Date) =>
    d.toLocaleDateString('bg-BG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const motivMsg = () => {
    if (dailyPct >= 100) return '🎉 Завършихте всички задачи за днес!';
    if (dailyPct >= 75)  return '💪 Много добре — продължавайте!';
    if (dailyPct >= 50)  return '🌟 Вече сте наполовина — страхотно!';
    if (dailyPct >= 25)  return '✨ Добър старт, продължете!';
    return '🚀 Започнете с първата задача...';
  };

  /* ── guards ────────────────────────────────────────────────────── */
  if (loading || pageLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 48, textAlign: 'center', border: `2px solid ${C.border}`, boxShadow: '0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', border: `4px solid ${C.mistLt}`, borderTopColor: C.salmon, margin: '0 auto 16px', animation: 'spin .8s linear infinite' }}/>
        <p style={{ color: C.stone, fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>Зареждане на задачите...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: `linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily: "'Nunito',sans-serif" }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 48, textAlign: 'center', maxWidth: 400, width: '100%', border: `2px solid ${C.border}`, boxShadow: '0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${C.salmon},${C.peach})` }}>
          <Target size={28} color="white"/>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.7rem', fontWeight: 700, color: C.forest, marginBottom: 10 }}>Дневни задачи</h2>
        <p style={{ color: C.stone, marginBottom: 28, fontSize: '0.9rem' }}>Моля, влезте за да видите вашите задачи.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="/login"    style={{ padding: '10px 24px', borderRadius: 999, fontWeight: 700, color: 'white', background: `linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration: 'none', fontFamily: "'Nunito',sans-serif" }}>Вход</a>
          <a href="/register" style={{ padding: '10px 24px', borderRadius: 999, fontWeight: 700, color: C.salmon, border: `2px solid ${C.border}`, textDecoration: 'none', fontFamily: "'Nunito',sans-serif" }}>Регистрация</a>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════ RENDER ══════════════════════════════ */
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily: "'Nunito',sans-serif", paddingBottom: 72 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        /* ── keyframes ─────────────────────────────────────────────── */
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes softPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.88)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes checkBounce { 0%{transform:scale(0)} 55%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes toastIn     { from{opacity:0;transform:translateX(60px) scale(.94)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes toastOut    { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(.94)} }
        @keyframes streakGlow  { 0%,100%{box-shadow:0 0 0 0 rgba(232,128,103,0)} 50%{box-shadow:0 0 0 10px rgba(232,128,103,.12)} }
        @keyframes shimmer     { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes shimmer2    { 0%,100%{background-position:100%} 50%{background-position:0%} }

        /* ── rainbow bar — same as Header ── */
        .th-rainbow {
          height: 3px; border-radius: 999px;
          background: linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage},${C.mist},${C.salmon});
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }

        /* ── card entrance (staggered on page load) ── */
        .th-card {
          animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          border-radius: 24px;
          background: white;
          border: 1px solid ${C.border};
          box-shadow: 0 3px 14px rgba(44,62,53,0.07);
          transition: box-shadow .22s, transform .22s;
        }
        .th-card:hover { box-shadow: 0 10px 28px rgba(44,62,53,0.1); }

        /* ── task card — matches .feature-card in Home ── */
        .th-task {
          border-radius: 16px;
          border: 1.5px solid ${C.border};
          background: ${C.bgCard};
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, border-color .2s, background .25s;
          cursor: pointer;
          animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
        }
        .th-task:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 26px rgba(44,62,53,0.1);
          border-color: #FCCAAB;
        }
        .th-task-done {
          background: linear-gradient(135deg,#EEF4EE,#E8F0EA) !important;
          border-color: ${C.sage} !important;
        }

        .th-check-bounce { animation: checkBounce .35s cubic-bezier(.34,1.56,.64,1); }

        /* ── progress bar ── */
        .th-bar-fill {
          height: 100%; border-radius: 999px;
          background: linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage});
          background-size: 200% 100%;
          animation: shimmer 4s ease infinite;
          transition: width .8s cubic-bezier(.34,1.56,.64,1);
        }

        /* ── streak card pulse ── */
        .th-streak { animation: streakGlow 2.8s ease-in-out infinite; }

        /* ── sways ── */
        .th-sway-l { animation: softSway 4.5s ease-in-out infinite;      transform-origin: bottom center; }
        .th-sway-r { animation: softSway 4.5s ease-in-out infinite .6s;  transform-origin: bottom center; }
        .th-float  { animation: gentleFloat 4s ease-in-out infinite; }
        .th-sparkle{ animation: softPulse 2.5s ease-in-out infinite; }

        /* ── buttons ── */
        .th-btn {
          cursor: pointer; border: none;
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
        }
        .th-btn:hover  { transform: translateY(-2px); }
        .th-btn:active { transform: scale(.97); }

        .th-ghost {
          cursor: pointer;
          transition: transform .18s, background .18s, border-color .18s;
        }
        .th-ghost:hover { transform: translateY(-2px); background: #FFF0EB !important; border-color: #FCCAAB !important; }

        /* ── input ── */
        .th-input:focus {
          outline: none;
          border-color: ${C.sage} !important;
          box-shadow: 0 0 0 3px rgba(163,185,149,.18);
        }

        /* ── remove btn ── */
        .th-remove { transition: transform .2s, opacity .2s; opacity: 0; }
        .th-task:hover .th-remove { opacity: 1; }
        .th-remove:hover { transform: rotate(90deg) scale(1.15) !important; }

        /* ── toast ── */
        .th-toast-in  { animation: toastIn  .38s cubic-bezier(.22,1,.36,1) both; }
        .th-toast-out { animation: toastOut .34s ease both; }

        /* ── grid ── */
        .th-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media(max-width: 620px) { .th-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <PageTutorial storageKey="artcare_tut_therapy" steps={THERAPY_TUTORIAL_STEPS}/>

      {/* ── Quote toast — bottom-right, small, dismissible ───────────── */}
      {showQuote && (
        <div
          className={quoteVisible ? 'th-toast-in' : 'th-toast-out'}
          style={{
            position: 'fixed', bottom: 28, right: 24, zIndex: 80,
            maxWidth: 300, width: 'calc(100% - 48px)',
            background: 'white', borderRadius: 18,
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 12px 40px rgba(44,62,53,0.14)',
            overflow: 'hidden',
            pointerEvents: quoteVisible ? 'auto' : 'none',
          }}
        >
          <div className="th-rainbow" style={{ borderRadius: 0 }}/>
          <div style={{ padding: '12px 14px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span className="th-float" style={{ fontSize: '1.2rem', lineHeight: 1 }}>🌸</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '0.88rem', fontWeight: 700, color: C.forest }}>
                  Поздравления!
                </span>
              </div>
              <button
                onClick={() => { setQuoteVisible(false); setTimeout(() => setShowQuote(false), 380); }}
                style={{ width: 24, height: 24, borderRadius: '50%', border: `1.5px solid ${C.mistLt}`, background: C.bgWarm, color: C.stone, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(90deg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              ><X size={11}/></button>
            </div>

            {/* the actual quote — small, italic, in a soft bg pill */}
            <div style={{ fontSize: '0.78rem', fontStyle: 'italic', lineHeight: 1.6, color: C.stone, background: C.bgWarm, borderRadius: 12, padding: '8px 11px', border: `1px solid ${C.border}` }}>
              <QuoteDisplay type="task_completion"/>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                <TinyFlower/><TinyFlower style={{ opacity: 0.5 }}/><TinyFlower/>
              </div>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: C.stone, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={10} style={{ color: C.salmon }}/> {streak} дни поредица
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ MAIN ═════════════════════════════════ */}
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 20px' }}>

        {/* top rainbow bar — same as Header */}
        <div className="th-rainbow" style={{ marginBottom: 28 }}/>

        {/* ══ HEADER CARD ══════════════════════════════════════════ */}
        <div
          className="th-card"
          style={{ marginBottom: 16, overflow: 'hidden', animationDelay: '0s' }}
        >
          {/* thin accent stripe */}
          <div className="th-rainbow" style={{ borderRadius: 0 }}/>

          <div style={{ padding: '24px 28px' }}>

            {/* Title row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700, color: C.forest, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow: `0 4px 14px rgba(232,128,103,.32)` }}>
                    <Target size={20} color="white"/>
                  </span>
                  Дневни задачи
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, marginLeft: 56 }}>
                  <TinyFlower style={{ opacity: 0.55 }}/>
                  <span style={{ fontSize: '0.75rem', color: C.stone, fontWeight: 600 }}>{formatDate(currentDate)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 999, background: C.bgWarm, border: `1.5px solid ${C.border}`, fontSize: '0.78rem', fontWeight: 700, color: C.stone }}>
                <Calendar size={12} style={{ color: C.salmon }}/>
                {currentDate.toLocaleDateString('bg-BG', { day: 'numeric', month: 'long' })}
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }} data-tutorial="therapy-streak">

              {/* Streak — warm salmon */}
              <div className="th-streak" style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 18, background: `linear-gradient(135deg,#FFF8EE,${C.bgWarm})`, border: `1.5px solid ${C.border}` }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow: `0 4px 14px rgba(232,128,103,.3)` }}>
                  <Flame size={20} color="white"/>
                </div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.9rem', fontWeight: 700, color: C.forest, lineHeight: 1 }}>{streak}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.stone, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>дни поредица</div>
                </div>
              </div>

              {/* Done count — sage */}
              <div style={{ flex: '1 1 140px', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 18, background: 'linear-gradient(135deg,#EEF4EE,#E4EFE4)', border: `1.5px solid #C4D8C4` }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: `linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow: `0 4px 14px rgba(163,185,149,.3)` }}>
                  <Check size={20} color="white"/>
                </div>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.9rem', fontWeight: 700, color: C.forest, lineHeight: 1 }}>
                    {dailyDone}<span style={{ fontSize: '1rem', color: C.stone, fontWeight: 600 }}>/{dailyTotal}</span>
                  </div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: C.stone, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>задачи за днес</div>
                </div>
              </div>

              {/* All done badge */}
              {allDailyDone && (
                <div className="th-float" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px', borderRadius: 18, background: 'linear-gradient(135deg,#EEF4EE,#E4EFE4)', border: `1.5px solid ${C.sage}` }}>
                  <Sparkles size={16} className="th-sparkle" style={{ color: C.sage }}/>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: C.forest }}>Перфектен ден!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══ PROGRESS CARD ════════════════════════════════════════ */}
        <div className="th-card" style={{ padding: '20px 28px', marginBottom: 16, animationDelay: '.07s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 700, color: C.forest, margin: 0 }}>
              Дневен прогрес
            </h3>
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.4rem', fontWeight: 700, color: C.salmon, background: C.bgWarm, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '2px 12px' }}>
              {dailyPct}%
            </span>
          </div>

          {/* Track */}
          <div style={{ height: 16, borderRadius: 999, background: C.mistLt, overflow: 'hidden', marginBottom: 12, position: 'relative', boxShadow: 'inset 0 1px 4px rgba(44,62,53,.08)' }}>
            <div className="th-bar-fill" style={{ width: `${dailyPct}%` }}/>
            {/* milestone ticks */}
            {[25, 50, 75].map(m => (
              <div key={m} style={{ position: 'absolute', top: '50%', left: `${m}%`, transform: 'translate(-50%,-50%)', width: 5, height: 5, borderRadius: '50%', background: dailyPct >= m ? 'rgba(255,255,255,.85)' : 'rgba(92,110,106,.25)', transition: 'background .4s' }}/>
            ))}
          </div>

          {/* Motivation — same "quiet pill" style as everywhere */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <span className="th-sway-l"><Sprig/></span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.stone, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 16px' }}>
              {motivMsg()}
            </span>
            <span className="th-sway-r"><Sprig style={{ transform: 'scaleX(-1)' }}/></span>
          </div>
        </div>

        {/* ══ DAILY TASKS ══════════════════════════════════════════ */}
        <div className="th-card" style={{ padding: '22px 28px', marginBottom: 16, animationDelay: '.13s' }} data-tutorial="therapy-task-card">

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={15} style={{ color: C.salmon, flexShrink: 0 }}/>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.15rem', fontWeight: 700, color: C.forest, margin: 0 }}>
                Дневни задачи
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {allDailyDone && <Sparkles size={13} className="th-sparkle" style={{ color: C.salmon }}/>}
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.stone, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 999, padding: '2px 11px' }}>
                {dailyDone}/{dailyTotal}
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.76rem', color: C.stone, marginBottom: 18, marginLeft: 24, fontStyle: 'italic', opacity: 0.7 }}>
            Завършете всички 10 задачи за да увеличите поредицата ✨
          </p>

          <div className="th-grid">
            {tasks.map((task, i) => {
              const cs = cmap(task.category);
              return (
                <div
                  key={task.id}
                  className={`th-task${task.completed ? ' th-task-done' : ''}`}
                  onClick={() => toggleTask(task.id)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '13px 15px', animationDelay: `${i * 0.04}s` }}
                >
                  {/* checkbox */}
                  <div style={{ marginTop: 2, flexShrink: 0 }}>
                    {task.completed
                      ? <div className="th-check-bounce" style={{ width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow: `0 2px 8px rgba(163,185,149,.35)` }}>
                          <Check size={12} color="white"/>
                        </div>
                      : <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid ${C.mistLt}`, background: 'white', transition: 'border-color .2s' }}/>
                    }
                  </div>

                  {/* text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: task.completed ? C.stone : C.forest, lineHeight: 1.5, textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.55 : 1, transition: 'all .25s' }}>
                      {task.text}
                    </span>
                    <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 8px', borderRadius: 999, background: cs.bg, color: cs.text, border: `1px solid ${cs.border}` }}>
                        {task.category}
                      </span>
                      {task.duration && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 8px', borderRadius: 999, background: 'white', color: C.stone, border: `1px solid ${C.mistLt}`, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={8}/>{task.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══ CUSTOM TASKS ═════════════════════════════════════════ */}
        <div className="th-card" style={{ padding: '22px 28px', animationDelay: '.19s' }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={15} style={{ color: C.peach, flexShrink: 0 }}/>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '1.15rem', fontWeight: 700, color: C.forest, margin: 0 }}>
                Мои задачи
              </h2>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.stone, background: C.bgWarm, border: `1px solid ${C.border}`, borderRadius: 999, padding: '2px 11px' }}>
              {customTasks.length}/10
            </span>
          </div>
          <p style={{ fontSize: '0.76rem', color: C.stone, marginBottom: 18, marginLeft: 24, fontStyle: 'italic', opacity: 0.7 }}>
            Незадължителни — добавете своите лични цели за деня.
          </p>

          {/* Add row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="th-input"
              placeholder="Нова лична задача... (Enter за добавяне)"
              value={newTaskText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCustomTask()}
              disabled={customTasks.length >= 10}
              style={{ flex: '1 1 200px', padding: '10px 18px', borderRadius: 999, fontSize: '0.84rem', fontWeight: 600, border: `1.5px solid ${C.mistLt}`, background: C.bgWarm, color: C.forest, fontFamily: "'Nunito',sans-serif", transition: 'border-color .2s, box-shadow .2s' }}
            />
            <button
              className="th-btn"
              onClick={addCustomTask}
              disabled={!newTaskText.trim() || customTasks.length >= 10}
              style={{ padding: '10px 22px', borderRadius: 999, fontWeight: 700, color: 'white', fontSize: '0.84rem', background: `linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow: `0 4px 14px rgba(232,128,103,.28)`, display: 'flex', alignItems: 'center', gap: 6, opacity: (!newTaskText.trim() || customTasks.length >= 10) ? 0.45 : 1, fontFamily: "'Nunito',sans-serif" }}
            >
              <Plus size={15}/> Добави
            </button>
          </div>

          {customTasks.length >= 10 && (
            <p style={{ fontSize: '0.8rem', textAlign: 'center', marginBottom: 14, padding: '6px 14px', borderRadius: 999, color: C.salmon, background: 'rgba(232,128,103,.07)', border: '1.5px solid rgba(232,128,103,.2)' }}>
              Достигнахте максималния брой лични задачи (10)
            </p>
          )}

          {/* Empty state */}
          {customTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', borderRadius: 16, border: `2px dashed ${C.border}`, background: C.bgWarm, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 12, left: 14, opacity: 0.3 }}><Sprig/></div>
              <div style={{ position: 'absolute', top: 12, right: 14, opacity: 0.3 }}><Sprig style={{ transform: 'scaleX(-1)' }}/></div>
              <div style={{ fontSize: '2rem', marginBottom: 8, opacity: 0.35 }}>✏️</div>
              <p style={{ fontWeight: 700, color: C.stone, fontSize: '0.88rem' }}>Все още няма лични задачи</p>
              <p style={{ fontSize: '0.76rem', color: C.stone, opacity: 0.6, marginTop: 4 }}>Добавете до 10 свои цели за деня</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {customTasks.map((task, i) => (
                <div
                  key={task.id}
                  className={`th-task${task.completed ? ' th-task-done' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 15px', borderLeft: `4px solid ${task.completed ? C.sage : C.peach}`, animationDelay: `${i * 0.05}s` }}
                >
                  <div style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => toggleTask(task.id, true)}>
                    {task.completed
                      ? <div className="th-check-bounce" style={{ width: 22, height: 22, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg,${C.sage},${C.mist})`, boxShadow: `0 2px 8px rgba(163,185,149,.35)` }}>
                          <Check size={12} color="white"/>
                        </div>
                      : <div style={{ width: 22, height: 22, borderRadius: 7, border: `2px solid #FCCAAB`, background: 'white' }}/>
                    }
                  </div>

                  <span
                    onClick={() => toggleTask(task.id, true)}
                    style={{ flex: 1, fontSize: '0.84rem', fontWeight: 600, color: task.completed ? C.stone : C.forest, cursor: 'pointer', textDecoration: task.completed ? 'line-through' : 'none', opacity: task.completed ? 0.55 : 1, transition: 'all .25s' }}
                  >
                    {task.text}
                  </span>

                  <button
                    className="th-remove th-btn"
                    onClick={() => removeCustomTask(task.id)}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(232,128,103,.09)', color: C.salmon, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  >
                    <Trash2 size={12}/>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Floral divider footer — same pattern used in Header tagline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, opacity: 0.28 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${C.sage})` }}/>
            <TinyFlower/><TinyFlower style={{ opacity: 0.5 }}/><TinyFlower/>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${C.sage},transparent)` }}/>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Therapy;