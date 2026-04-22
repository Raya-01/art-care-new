import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, Plus, Trash2, Edit, Save, X,
  Calendar, Clock, Search, Heart, Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QuoteDisplay from '../utils/QuoteDisplay';
import PageTutorial, { JOURNAL_TUTORIAL_STEPS } from '../components/PageTutorial';

interface JournalEntry {
  id: string; title: string; content: string;
  date: string; time: string; mood: string;
  tags: string[]; favorite: boolean; prompt?: string;
}

/* ── Palette — identical to Therapy ──────────────────────────────── */
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

const MOODS = [
  '😊 Радостен','😌 Спокоен','😢 Тъжен','😡 Разгневен',
  '🤔 Замислен','😴 Уморен','🎨 Творчески','🌟 Вдъхновен',
];
const PROMPTS = [
  'Какво ме накара да се усмихна днес?','Какво предизвикателство преодолях?',
  'За какво съм благодарен/а?','Какво научих за себе си днес?',
  'Каква емоция преобладаваше в мен?','Какво творческо начинание предприех?',
  'Какъв красив момент забелязах?','Какво ме вдъхнови днес?',
  'С какво се справих по-добре от вчера?','Какво желая за утре?',
];

/* ── Same SVGs as Therapy / Header ───────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke={C.sage} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill={C.sage} opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill={C.mist} opacity="0.7"/>
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

/* ── mood accent colours ─────────────────────────────────────────── */
const moodColour: Record<string, { bg: string; text: string; border: string }> = {
  '😊': { bg: '#FFF8EE', text: '#B07030', border: C.cream   },
  '😌': { bg: '#EEF4F2', text: '#3A6660', border: C.mistLt  },
  '😢': { bg: '#EEF0F8', text: '#4A5890', border: '#C0C8E0'  },
  '😡': { bg: '#FFF0EB', text: '#C0603E', border: '#FCCAAB'  },
  '🤔': { bg: '#F5F0FF', text: '#6B50B0', border: '#C9B8E8'  },
  '😴': { bg: '#F0F0F5', text: '#5C5C7A', border: '#C8C8DC'  },
  '🎨': { bg: '#FFF0EB', text: '#C0603E', border: '#FCCAAB'  },
  '🌟': { bg: '#FFF8EE', text: '#B07030', border: C.cream    },
};
const mc = (mood: string) => moodColour[mood.split(' ')[0]] ?? { bg: '#EEF4EE', text: C.stone, border: C.mistLt };

/* ═══════════════════════════════════════════════════════════════════ */
const Journal: React.FC = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  const [entries,    setEntries]    = useState<JournalEntry[]>([]);
  const [filtered,   setFiltered]   = useState<JournalEntry[]>([]);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [current,    setCurrent]    = useState<Partial<JournalEntry>>({ title:'', content:'', mood:'', tags:[], favorite:false });
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [prompt,     setPrompt]     = useState('');
  const [tagInput,   setTagInput]   = useState('');
  const [searchTerm, setSearch]     = useState('');
  const [filterFav,  setFilterFav]  = useState(false);
  const [showQuote,  setShowQuote]  = useState(false);
  const [quoteVis,   setQuoteVis]   = useState(false);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── load ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentUser) { setEntries([]); setFiltered([]); return; }
    try {
      const raw = localStorage.getItem(`journal_${currentUser.uid}`);
      if (raw) {
        const p = JSON.parse(raw);
        const arr: JournalEntry[] = Array.isArray(p) ? p : (p?.entries || []);
        setEntries(arr); setFiltered(arr);
      }
    } catch {}
  }, [currentUser]);

  useEffect(() => {
    let f = entries;
    if (filterFav) f = f.filter(e => e.favorite);
    if (searchTerm) f = f.filter(e =>
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFiltered(f);
  }, [searchTerm, entries, filterFav]);

  const saveAll = useCallback((list: JournalEntry[]) => {
    if (!currentUser) return;
    localStorage.setItem(`journal_${currentUser.uid}`, JSON.stringify(list));
  }, [currentUser]);

  /* ── toast ───────────────────────────────────────────────────── */
  const triggerQuote = useCallback(() => {
    setShowQuote(true); setQuoteVis(true);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => {
      setQuoteVis(false);
      setTimeout(() => setShowQuote(false), 380);
    }, 6000);
  }, []);

  /* ── CRUD ────────────────────────────────────────────────────── */
  const handleSave = () => {
    if (!currentUser || !current.content?.trim()) return;
    const now = new Date();
    const entry: JournalEntry = {
      id: editingId || `entry-${Date.now()}`,
      title: current.title?.trim() || current.content.split(' ').slice(0,5).join(' '),
      content: current.content.trim(),
      date: now.toLocaleDateString('bg-BG'),
      time: now.toLocaleTimeString('bg-BG', { hour:'2-digit', minute:'2-digit' }),
      mood: current.mood || MOODS[0],
      tags: current.tags || [],
      favorite: current.favorite || false,
      prompt: prompt || undefined,
    };
    let updated: JournalEntry[];
    if (editingId) updated = entries.map(e => e.id === editingId ? entry : e);
    else { updated = [entry, ...entries]; triggerQuote(); }
    setEntries(updated); saveAll(updated); resetEditor();
  };

  const handleDelete = (id: string) => {
    if (!currentUser || !window.confirm('Изтриване на записа?')) return;
    const u = entries.filter(e => e.id !== id);
    setEntries(u); saveAll(u);
    if (expanded === id) setExpanded(null);
  };

  const handleEdit = (entry: JournalEntry) => {
    setCurrent(entry); setEditingId(entry.id); setPrompt(entry.prompt || ''); setShowEditor(true);
  };

  const handleFav = (id: string) => {
    if (!currentUser) return;
    const u = entries.map(e => e.id === id ? { ...e, favorite: !e.favorite } : e);
    setEntries(u); saveAll(u);
  };

  const resetEditor = () => {
    setCurrent({ title:'', content:'', mood:'', tags:[], favorite:false });
    setEditingId(null); setShowEditor(false); setPrompt(''); setTagInput('');
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !current.tags?.includes(t)) {
      setCurrent(p => ({ ...p, tags: [...(p.tags||[]), t] }));
      setTagInput('');
    }
  };

  const openNew = () => {
    resetEditor();
    setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setShowEditor(true);
  };

  /* ── guards ──────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid ${C.mistLt}`, borderTopColor:C.salmon, margin:'0 auto 16px', animation:'spin .8s linear infinite' }}/>
        <p style={{ color:C.stone, fontWeight:600, fontFamily:"'Nunito',sans-serif" }}>Зареждане...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', maxWidth:400, width:'100%', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
          <BookOpen size={28} color="white"/>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.7rem', fontWeight:700, color:C.forest, marginBottom:10 }}>Личен дневник</h2>
        <p style={{ color:C.stone, marginBottom:28, fontSize:'0.9rem' }}>Влезте за да видите вашите записи.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href="/login"    style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration:'none', fontFamily:"'Nunito',sans-serif" }}>Вход</a>
          <a href="/register" style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:C.salmon, border:`2px solid ${C.border}`, textDecoration:'none', fontFamily:"'Nunito',sans-serif" }}>Регистрация</a>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════════ RENDER ═══════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily:"'Nunito',sans-serif", paddingBottom:72 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes softPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.88)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes checkBounce { 0%{transform:scale(0)} 55%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes toastIn     { from{opacity:0;transform:translateX(60px) scale(.94)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes toastOut    { from{opacity:1;transform:translateX(0) scale(1)} to{opacity:0;transform:translateX(60px) scale(.94)} }
        @keyframes editorIn    { from{opacity:0;transform:translateY(18px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes cardIn      { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        .jnl-rainbow {
          height:3px; border-radius:999px;
          background:linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage},${C.mist},${C.salmon});
          background-size:200% 100%;
          animation:borderFlow 6s ease infinite;
        }

        /* ── cards — same as .th-card in Therapy ── */
        .jnl-card {
          animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          border-radius: 24px;
          background: white;
          border: 1px solid ${C.border};
          box-shadow: 0 3px 14px rgba(44,62,53,0.07);
          transition: box-shadow .22s, transform .22s;
        }
        .jnl-card:hover { box-shadow: 0 10px 28px rgba(44,62,53,0.10); }

        /* ── entry row card ── */
        .jnl-entry {
          border-radius: 18px;
          border: 1.5px solid ${C.border};
          background: ${C.bgCard};
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s, border-color .2s;
          animation: cardIn .4s cubic-bezier(.22,1,.36,1) both;
          cursor: pointer;
          overflow: hidden;
        }
        .jnl-entry:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 26px rgba(44,62,53,0.10);
          border-color: #FCCAAB;
        }
        .jnl-entry.open {
          border-color: ${C.sage};
          background: white;
        }

        /* ── paper texture for open entries ── */
        .jnl-paper {
          background-image: repeating-linear-gradient(
            transparent, transparent 27px,
            rgba(163,185,149,0.15) 27px, rgba(163,185,149,0.15) 28px
          );
          background-color: #FFFDF8;
        }

        /* ── buttons — same as .th-btn ── */
        .jnl-btn {
          cursor: pointer; border: none;
          transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
        }
        .jnl-btn:hover  { transform: translateY(-2px); }
        .jnl-btn:active { transform: scale(.97); }

        .jnl-ghost {
          cursor: pointer;
          transition: transform .18s, background .18s, border-color .18s;
        }
        .jnl-ghost:hover { transform: translateY(-2px); background: #FFF0EB !important; border-color: #FCCAAB !important; color: ${C.salmon} !important; }

        /* ── input focus ── */
        .jnl-input:focus {
          outline: none;
          border-color: ${C.sage} !important;
          box-shadow: 0 0 0 3px rgba(163,185,149,.18);
        }

        /* ── action buttons visible always on entry ── */
        .jnl-act {
          transition: transform .18s, background .18s, box-shadow .18s;
          cursor: pointer;
        }
        .jnl-act:hover { transform: scale(1.1); }

        /* ── sways / floats ── */
        .jnl-sway-l { animation: softSway 4.5s ease-in-out infinite;     transform-origin: bottom center; }
        .jnl-sway-r { animation: softSway 4.5s ease-in-out infinite .6s; transform-origin: bottom center; }
        .jnl-float  { animation: gentleFloat 4s ease-in-out infinite; }
        .jnl-sparkle{ animation: softPulse 2.5s ease-in-out infinite; }

        /* ── toast ── */
        .jnl-toast-in  { animation: toastIn  .38s cubic-bezier(.22,1,.36,1) both; }
        .jnl-toast-out { animation: toastOut .34s ease both; }

        /* ── editor modal ── */
        .jnl-editor { animation: editorIn .34s cubic-bezier(.22,1,.36,1) both; }

        /* ── mood chips ── */
        .jnl-mood {
          cursor: pointer; border: 1.5px solid ${C.mistLt};
          background: ${C.bgWarm}; color: ${C.stone};
          transition: all .18s cubic-bezier(.34,1.56,.64,1);
        }
        .jnl-mood:hover   { transform: translateY(-2px); border-color: #FCCAAB; background: #FFF0EB; }
        .jnl-mood.active  { background: linear-gradient(135deg,${C.salmon},${C.peach}); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(232,128,103,0.25); }

        /* ── spine texture for editor ── */
        .jnl-spine {
          background:
            repeating-linear-gradient(45deg,rgba(255,255,255,.022) 0,rgba(255,255,255,.022) 1px,transparent 1px,transparent 7px),
            linear-gradient(180deg,#2C4A3E,#1e3830 50%,#2C4A3E);
        }

        /* ── entry grid ── */
        .jnl-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width: 680px) { .jnl-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      <PageTutorial storageKey="artcare_tut_journal" steps={JOURNAL_TUTORIAL_STEPS}/>

      {/* ── Quote toast ────────────────────────────────────────── */}
      {showQuote && (
        <div
          className={quoteVis ? 'jnl-toast-in' : 'jnl-toast-out'}
          style={{ position:'fixed', bottom:28, right:24, zIndex:80, maxWidth:300, width:'calc(100% - 48px)', background:'white', borderRadius:18, border:`1.5px solid ${C.border}`, boxShadow:'0 12px 40px rgba(44,62,53,0.14)', overflow:'hidden', pointerEvents: quoteVis ? 'auto' : 'none' }}
        >
          <div className="jnl-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'12px 14px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="jnl-float" style={{ fontSize:'1.2rem', lineHeight:1 }}>📖</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', fontWeight:700, color:C.forest }}>Нов запис!</span>
              </div>
              <button
                onClick={() => { setQuoteVis(false); setTimeout(() => setShowQuote(false), 380); }}
                style={{ width:24, height:24, borderRadius:'50%', border:`1.5px solid ${C.mistLt}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(90deg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              ><X size={11}/></button>
            </div>
            <div style={{ fontSize:'0.78rem', fontStyle:'italic', lineHeight:1.6, color:C.stone, background:C.bgWarm, borderRadius:12, padding:'8px 11px', border:`1px solid ${C.border}` }}>
              <QuoteDisplay type="journal"/>
            </div>
            <div style={{ display:'flex', gap:4, marginTop:8, opacity:.35 }}>
              <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
            </div>
          </div>
        </div>
      )}

      {/* ── Editor modal ─────────────────────────────────────────── */}
      {showEditor && (
        <div
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(44,62,53,0.55)', backdropFilter:'blur(8px)' }}
          onClick={resetEditor}
        >
          <div
            className="jnl-editor"
            style={{ background:'white', width:'100%', maxWidth:580, maxHeight:'90vh', overflowY:'auto', borderRadius:20, boxShadow:'0 32px 80px rgba(44,62,53,0.25)', display:'flex' }}
            onClick={e => e.stopPropagation()}
          >
            {/* spine strip */}
            <div className="jnl-spine" style={{ width:32, flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between', padding:'16px 0', borderRadius:'20px 0 0 20px' }}>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[...Array(6)].map((_,i) => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'rgba(249,221,184,0.18)', border:'1px solid rgba(249,221,184,0.12)' }}/>)}
              </div>
              <p style={{ writingMode:'vertical-rl', transform:'rotate(180deg)', fontFamily:"'Cormorant Garamond',serif", fontSize:'0.5rem', fontWeight:700, letterSpacing:'0.22em', fontStyle:'italic', color:'rgba(249,221,184,0.22)' }}>ДНЕВНИК</p>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {[...Array(6)].map((_,i) => <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:'rgba(249,221,184,0.18)', border:'1px solid rgba(249,221,184,0.12)' }}/>)}
              </div>
            </div>

            {/* editor body */}
            <div style={{ flex:1, minWidth:0 }}>
              <div className="jnl-rainbow" style={{ borderRadius:0 }}/>
              <div style={{ padding:'22px 26px 26px' }}>

                {/* header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18 }}>
                  <div>
                    <p style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color:C.mist, marginBottom:2 }}>Личен дневник</p>
                    <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.35rem', fontWeight:700, color:C.forest, margin:0 }}>
                      {editingId ? 'Редактиране' : 'Нов запис'}
                    </h2>
                  </div>
                  <button
                    onClick={resetEditor}
                    style={{ width:32, height:32, borderRadius:'50%', border:`1.5px solid ${C.border}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s', flexShrink:0 }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(90deg)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  ><X size={14}/></button>
                </div>

                {/* prompt card */}
                <div style={{ marginBottom:16, padding:'12px 14px', borderRadius:16, border:`1.5px solid #FCCAAB`, background:`linear-gradient(135deg,${C.cream},${C.mistLt})` }} data-tutorial="journal-prompts">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <TinyFlower/>
                      <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone }}>Подсказка</span>
                    </div>
                    <button
                      onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])}
                      className="jnl-ghost"
                      style={{ fontSize:'0.7rem', padding:'3px 10px', borderRadius:999, fontWeight:700, background:'white', color:C.salmon, border:`1px solid #FCCAAB` }}
                    >Нова →</button>
                  </div>
                  <p style={{ fontSize:'0.88rem', fontStyle:'italic', color:C.forest, fontFamily:"'Cormorant Garamond',serif", lineHeight:1.45, margin:0 }}>
                    {prompt || PROMPTS[0]}
                  </p>
                </div>

                {/* mood */}
                <div style={{ marginBottom:16 }}>
                  <p style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone, marginBottom:8 }}>Настроение</p>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                    {MOODS.map(mood => (
                      <button key={mood}
                        className={`jnl-mood${current.mood === mood ? ' active' : ''}`}
                        onClick={() => setCurrent(p => ({ ...p, mood }))}
                        style={{ padding:'6px 12px', borderRadius:999, fontSize:'0.78rem', fontWeight:700 }}
                      >{mood}</button>
                    ))}
                  </div>
                </div>

                {/* title */}
                <input type="text" placeholder="Заглавие (по избор)"
                  value={current.title||''} onChange={e => setCurrent(p => ({...p, title:e.target.value}))}
                  className="jnl-input"
                  style={{ width:'100%', padding:'10px 16px', borderRadius:12, marginBottom:10, fontSize:'1rem', fontWeight:700, border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, fontFamily:"'Cormorant Garamond',serif", boxSizing:'border-box' }}
                />

                {/* content */}
                <textarea placeholder="Напишете вашите мисли тук..."
                  value={current.content||''} onChange={e => setCurrent(p => ({...p, content:e.target.value}))}
                  rows={8}
                  className="jnl-input jnl-paper"
                  style={{ width:'100%', padding:'12px 16px', borderRadius:12, marginBottom:10, fontSize:'0.85rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, resize:'none', lineHeight:'28px', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif" }}
                />

                {/* tags */}
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', gap:8, marginBottom:8 }}>
                    <input type="text" placeholder="Добавете етикет..."
                      value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key==='Enter' && (e.preventDefault(), addTag())}
                      className="jnl-input"
                      style={{ flex:1, padding:'8px 14px', borderRadius:999, fontSize:'0.78rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm }}
                    />
                    <button onClick={addTag}
                      className="jnl-btn"
                      style={{ padding:'8px 16px', borderRadius:999, fontSize:'0.78rem', fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 12px rgba(232,128,103,0.25)` }}
                    >+ Добави</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {current.tags?.map((tag,i) => (
                      <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:999, fontSize:'0.72rem', fontWeight:600, background:C.cream, color:C.stone, border:`1px solid rgba(252,202,171,0.5)` }}>
                        {tag}
                        <button onClick={() => setCurrent(p => ({...p, tags:p.tags?.filter(t=>t!==tag)||[]}))}
                          style={{ opacity:.5, cursor:'pointer', background:'none', border:'none', fontSize:'0.8rem', color:C.stone, lineHeight:1, padding:0, marginLeft:2 }}
                          onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                          onMouseLeave={e=>(e.currentTarget.style.opacity='.5')}
                        >×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* footer */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:14, borderTop:`1.5px solid ${C.border}` }}>
                  <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer', fontSize:'0.78rem', fontWeight:700, color:C.stone }}>
                    <input type="checkbox" checked={current.favorite||false}
                      onChange={e => setCurrent(p => ({...p, favorite:e.target.checked}))}
                      style={{ width:14, height:14, accentColor:C.salmon }}/>
                    <Heart size={12} color={C.salmon}/> Любим
                  </label>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={resetEditor}
                      className="jnl-ghost"
                      style={{ padding:'8px 18px', borderRadius:999, fontWeight:700, fontSize:'0.8rem', color:C.stone, background:'white', border:`1.5px solid ${C.mistLt}` }}
                    >Отказ</button>
                    <button onClick={handleSave} disabled={!current.content?.trim()}
                      className="jnl-btn"
                      style={{ padding:'8px 20px', borderRadius:999, fontWeight:700, fontSize:'0.8rem', color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,0.28)`, display:'flex', alignItems:'center', gap:6, opacity:current.content?.trim() ? 1 : 0.4 }}
                    ><Save size={13}/> Запази</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ MAIN ════════════════════════════ */}
      <div style={{ maxWidth:920, margin:'0 auto', padding:'32px 20px' }}>

        {/* rainbow bar */}
        <div className="jnl-rainbow" style={{ marginBottom:28 }}/>

        {/* ══ HEADER CARD ════════════════════════════════════════ */}
        <div className="jnl-card" style={{ marginBottom:16, overflow:'hidden', animationDelay:'0s' }}>
          <div className="jnl-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'22px 28px' }}>
            <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div>
                <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, color:C.forest, margin:0, display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.32)` }}>
                    <BookOpen size={20} color="white"/>
                  </span>
                  Личен дневник
                </h1>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, marginLeft:56 }}>
                  <TinyFlower style={{ opacity:.55 }}/>
                  <span style={{ fontSize:'0.75rem', color:C.stone, fontWeight:600, fontStyle:'italic' }}>{entries.length} записи</span>
                </div>
              </div>
              <button onClick={openNew}
                className="jnl-btn"
                data-tutorial="journal-new"
                style={{ padding:'10px 22px', borderRadius:999, fontWeight:700, color:'white', fontSize:'0.88rem', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'flex', alignItems:'center', gap:7 }}
              ><Plus size={15}/> Нов запис</button>
            </div>
          </div>
        </div>

        {/* ══ SEARCH & FILTER ════════════════════════════════════ */}
        <div className="jnl-card" style={{ padding:'16px 22px', marginBottom:16, animationDelay:'.05s' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            <div style={{ flex:'1 1 200px', position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.mist, pointerEvents:'none' }}/>
              <input type="text" placeholder="Търсене в записите..."
                value={searchTerm} onChange={e => setSearch(e.target.value)}
                className="jnl-input"
                style={{ width:'100%', paddingLeft:34, paddingRight:14, paddingTop:9, paddingBottom:9, borderRadius:999, fontSize:'0.84rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, boxSizing:'border-box' }}
              />
            </div>
            <button onClick={() => setFilterFav(!filterFav)}
              className={filterFav ? 'jnl-btn' : 'jnl-ghost'}
              style={{
                padding:'9px 18px', borderRadius:999, fontWeight:700, fontSize:'0.84rem',
                display:'flex', alignItems:'center', gap:6,
                background:   filterFav ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'white',
                color:        filterFav ? 'white' : C.stone,
                border:       filterFav ? 'none' : `1.5px solid ${C.mistLt}`,
                boxShadow:    filterFav ? `0 4px 14px rgba(232,128,103,.28)` : 'none',
              }}
            ><Heart size={13}/> Любими</button>
          </div>
        </div>

        {/* ══ ENTRIES ════════════════════════════════════════════ */}
        {filtered.length === 0 ? (
          <div className="jnl-card" style={{ padding:'56px 24px', textAlign:'center', animationDelay:'.1s' }}>
            <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, opacity:.2 }}>
              <BookOpen size={28} color="white"/>
            </div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, marginBottom:8 }}>
              {searchTerm||filterFav ? 'Няма намерени записи' : 'Вашият дневник е празен'}
            </h3>
            <p style={{ fontSize:'0.84rem', color:C.stone, marginBottom:24, opacity:.7 }}>Започнете да записвате вашите мисли и чувства</p>
            {!searchTerm && !filterFav && (
              <button onClick={openNew}
                className="jnl-btn"
                style={{ padding:'10px 28px', borderRadius:999, fontWeight:700, color:'white', fontSize:'0.88rem', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'inline-flex', alignItems:'center', gap:7 }}
              ><Plus size={15}/> Напишете първия запис</button>
            )}
          </div>
        ) : (
          <div className="jnl-card" style={{ padding:'22px 28px', animationDelay:'.1s' }}>

            {/* section header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <BookOpen size={15} style={{ color:C.salmon, flexShrink:0 }}/>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.15rem', fontWeight:700, color:C.forest, margin:0 }}>Записи</h2>
              </div>
              <span style={{ fontSize:'0.75rem', fontWeight:700, color:C.stone, background:C.bgWarm, border:`1px solid ${C.border}`, borderRadius:999, padding:'2px 11px' }}>
                {filtered.length}
              </span>
            </div>
            <p style={{ fontSize:'0.76rem', color:C.stone, marginBottom:18, marginLeft:24, fontStyle:'italic', opacity:.7 }}>
              Натиснете запис за да разгърнете ✨
            </p>

            {/* entries grid */}
            <div className="jnl-grid">
              {filtered.map((e, idx) => {
                const isOpen = expanded === e.id;
                const mood   = e.mood.split(' ')[0];
                const moodCs = mc(e.mood);
                return (
                  <div key={e.id}
                    className={`jnl-entry${isOpen ? ' open' : ''}`}
                    style={{ animationDelay:`${idx * 0.05}s` }}
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                  >
                    {/* entry top stripe */}
                    <div className="jnl-rainbow" style={{ borderRadius:0, height:3 }}/>

                    <div style={{ padding:'14px 16px' }}>
                      {/* mood + title + fav */}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:8 }}>
                        <span style={{ fontSize:'1.4rem', lineHeight:1, flexShrink:0, marginTop:2 }}>{mood}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1rem', fontWeight:700, color:C.forest, margin:0 }}>
                              {e.title}
                            </h3>
                            {e.favorite && <Heart size={12} fill={C.salmon} color={C.salmon} style={{ flexShrink:0 }}/>}
                          </div>
                          {/* meta row */}
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
                            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.68rem', color:C.mist }}>
                              <Calendar size={9}/>{e.date}
                            </span>
                            <span style={{ fontSize:'0.68rem', fontStyle:'italic', color:C.stone, padding:'1px 8px', borderRadius:999, background:moodCs.bg, border:`1px solid ${moodCs.border}`, color:moodCs.text }}>
                              {e.mood.split(' ').slice(1).join(' ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* preview / full content */}
                      {isOpen ? (
                        <div className="jnl-paper" style={{ borderRadius:10, padding:'12px 14px', marginBottom:10 }}>
                          {e.prompt && (
                            <div style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:'0.68rem', fontStyle:'italic', background:C.cream, color:C.stone, border:`1px solid rgba(252,202,171,0.5)`, marginBottom:10 }}>
                              <TinyFlower/> "{e.prompt.substring(0,55)}{e.prompt.length>55?'…':''}"
                            </div>
                          )}
                          <p style={{ fontSize:'0.84rem', color:C.forest, lineHeight:'28px', whiteSpace:'pre-line', margin:0 }}>
                            {e.content}
                          </p>
                          {e.tags.length > 0 && (
                            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:10 }}>
                              {e.tags.map((tag,i) => (
                                <span key={i} style={{ padding:'2px 9px', borderRadius:999, fontSize:'0.68rem', fontWeight:600, background:C.cream, color:C.stone }}>{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize:'0.8rem', color:C.stone, lineHeight:1.55, marginBottom:10, opacity:.75 }}>
                          {e.content.substring(0,100)}{e.content.length>100?'…':''}
                        </p>
                      )}

                      {/* actions row */}
                      <div
                        style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:`1px solid ${C.border}`, marginTop: isOpen ? 0 : -2 }}
                        onClick={ev => ev.stopPropagation()}
                      >
                        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.68rem', color:C.mist }}>
                          <Clock size={9}/>{e.time}
                        </span>
                        <div style={{ display:'flex', gap:6 }}>
                          {/* fav */}
                          <button onClick={() => handleFav(e.id)}
                            className="jnl-act"
                            style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: e.favorite ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'white', border: e.favorite ? 'none' : `1.5px solid #FCCAAB`, boxShadow: e.favorite ? `0 2px 8px rgba(232,128,103,0.28)` : 'none' }}
                          ><Heart size={11} color={e.favorite?'white':C.salmon} fill={e.favorite?'white':'none'}/></button>
                          {/* edit */}
                          <button onClick={() => handleEdit(e)}
                            className="jnl-act"
                            style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'white', border:`1.5px solid ${C.mistLt}` }}
                            onMouseEnter={ev => { ev.currentTarget.style.background='#EEF4EE'; ev.currentTarget.style.borderColor=C.sage; }}
                            onMouseLeave={ev => { ev.currentTarget.style.background='white'; ev.currentTarget.style.borderColor=C.mistLt; }}
                          ><Edit size={11} color={C.stone}/></button>
                          {/* delete */}
                          <button onClick={() => handleDelete(e.id)}
                            className="jnl-act"
                            style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'white', border:`1.5px solid #FCCAAB` }}
                            onMouseEnter={ev => (ev.currentTarget.style.background='#FFF0EB')}
                            onMouseLeave={ev => (ev.currentTarget.style.background='white')}
                          ><Trash2 size={11} color={C.salmon}/></button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* floral footer */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:22, opacity:.28 }}>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
              <span className="jnl-sway-l"><Sprig/></span>
              <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
              <span className="jnl-sway-r"><Sprig style={{ transform:'scaleX(-1)' }}/></span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;