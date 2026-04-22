import React, { useState, useEffect } from 'react';
import {
  Calendar, ChevronDown, ChevronUp, Target, BookOpen,
  Image, TrendingUp, Download, Award, BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageTutorial, { HISTORY_TUTORIAL_STEPS } from '../components/PageTutorial';

/* ── Types ────────────────────────────────────────────────────────── */
interface TaskHistory    { id: string; text: string; completed: boolean; completedAt?: string; }
interface JournalHistory { id: string; title: string; preview: string; mood: string; }
interface ArtworkHistory { id: string; title: string; previewUrl?: string; }
interface DayHistory {
  date: string; dayNumber: number;
  completedTasks: number; totalTasks: number;
  journalEntries: number; uploadedArtworks: number;
  mood?: string; favorite: boolean;
  tasks: TaskHistory[]; entries: JournalHistory[]; artworks: ArtworkHistory[];
}
interface Stats {
  totalDays: number; totalTasks: number; completedTasks: number;
  totalEntries: number; totalArtworks: number;
  currentStreak: number; bestStreak: number;
}

/* ── Palette — identical to Therapy / Journal / Gallery ─────────── */
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

/* ── Same botanical SVGs as every other page ─────────────────────── */
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

/* ═══════════════════════════════════════════════════════════════════ */
const History: React.FC = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();
  const [history,      setHistory]    = useState<DayHistory[]>([]);
  const [expandedDays, setExpanded]   = useState<Set<number>>(new Set());
  const [filter,       setFilter]     = useState('all');
  const [timeRange,    setTimeRange]  = useState('month');
  const [stats,        setStats]      = useState<Stats>({ totalDays:0, totalTasks:0, completedTasks:0, totalEntries:0, totalArtworks:0, currentStreak:0, bestStreak:0 });

  useEffect(() => { if (currentUser) loadHistory(); }, [currentUser, timeRange]);
  useEffect(() => { calculateStats(); }, [history]);

  const loadHistory = () => {
    if (!currentUser) return;
    try {
      const tasks   = JSON.parse(localStorage.getItem(`therapy_${currentUser.uid}`) || '{}');
      const journal = JSON.parse(localStorage.getItem(`journal_${currentUser.uid}`) || '[]');
      const gallery = JSON.parse(localStorage.getItem(`artcare_gallery_${currentUser.uid}`) || '[]');
      const journalEntries = Array.isArray(journal) ? journal : (journal.entries || []);
      const artworksList   = Array.isArray(gallery)  ? gallery  : (gallery.artworks  || []);
      const grouped = groupByDate(tasks.dailyTasks || [], journalEntries, artworksList);
      setHistory(filterByRange(grouped, timeRange));
    } catch(e) { console.error(e); }
  };

  const filterByRange = (days: DayHistory[], range: string): DayHistory[] => {
    const now = new Date(); const cutoff = new Date();
    if      (range === 'week')    cutoff.setDate(now.getDate() - 7);
    else if (range === 'month')   cutoff.setMonth(now.getMonth() - 1);
    else if (range === '3months') cutoff.setMonth(now.getMonth() - 3);
    else return days;
    return days.filter(d => new Date(d.date) >= cutoff);
  };

  const groupByDate = (tasks: any[], journal: any[], gallery: any[]): DayHistory[] => {
    const map = new Map<string, DayHistory>(); let dayNum = 1;
    const get = (date: string) => {
      if (!map.has(date)) map.set(date, { date, dayNumber:dayNum++, completedTasks:0, totalTasks:0, journalEntries:0, uploadedArtworks:0, favorite:false, tasks:[], entries:[], artworks:[] });
      return map.get(date)!;
    };
    tasks.forEach((t: any) => {
      const date = t.completedAt ? new Date(t.completedAt).toLocaleDateString('bg-BG') : new Date().toLocaleDateString('bg-BG');
      const day = get(date);
      day.tasks.push({ id:t.id, text:t.text, completed:t.completed, completedAt:t.completedAt });
      day.totalTasks++;
      if (t.completed) day.completedTasks++;
    });
    journal.forEach((e: any) => {
      const date = e.date || new Date(e.createdAt || Date.now()).toLocaleDateString('bg-BG');
      const day = get(date);
      day.entries.push({ id:e.id, title:e.title, preview:e.content?.substring(0,80)||'', mood:e.mood });
      day.journalEntries++;
      if (!day.mood) day.mood = e.mood?.split(' ')[0];
    });
    gallery.forEach((a: any) => {
      const date = a.date || new Date(a.createdAt || Date.now()).toLocaleDateString('bg-BG');
      const day = get(date);
      day.artworks.push({ id:a.id, title:a.title, previewUrl:a.imageUrl });
      day.uploadedArtworks++;
    });
    return Array.from(map.values()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const calculateStats = () => {
    const s: Stats = { totalDays:history.length, totalTasks:0, completedTasks:0, totalEntries:0, totalArtworks:0, currentStreak:0, bestStreak:0 };
    history.forEach(d => { s.totalTasks+=d.totalTasks; s.completedTasks+=d.completedTasks; s.totalEntries+=d.journalEntries; s.totalArtworks+=d.uploadedArtworks; });
    let streak=0, best=0;
    [...history].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())
      .forEach(d => { if(d.completedTasks>0){streak++;best=Math.max(best,streak);}else streak=0; });
    s.currentStreak=streak; s.bestStreak=best;
    setStats(s);
  };

  const toggleDay = (dayNum: number) => setExpanded(prev => {
    const n = new Set(prev); n.has(dayNum) ? n.delete(dayNum) : n.add(dayNum); return n;
  });

  const filtered = (() => {
    if (filter==='tasks')   return history.filter(d=>d.completedTasks>0);
    if (filter==='journal') return history.filter(d=>d.journalEntries>0);
    if (filter==='gallery') return history.filter(d=>d.uploadedArtworks>0);
    return history;
  })();

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(history,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='artcare-history.json'; a.click();
  };

  /* ── guards ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid ${C.mistLt}`, borderTopColor:C.salmon, margin:'0 auto 16px', animation:'spin .8s linear infinite' }}/>
        <p style={{ color:C.stone, fontWeight:600 }}>Зареждане на историята...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', maxWidth:400, width:'100%', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
          <Calendar size={28} color="white"/>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.7rem', fontWeight:700, color:C.forest, marginBottom:10 }}>История</h2>
        <p style={{ color:C.stone, marginBottom:28, fontSize:'0.9rem' }}>Влезте, за да видите историята си.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href="/login"    style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration:'none' }}>Вход</a>
          <a href="/register" style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:C.salmon, border:`2px solid ${C.border}`, textDecoration:'none' }}>Регистрация</a>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════ RENDER ═════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily:"'Nunito',sans-serif", paddingBottom:72 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn      { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes softSway    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes barGrow     { from{width:0} to{width:var(--w)} }
        @keyframes heatPop     { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

        /* ── rainbow bar — same as Therapy / Journal / Gallery ── */
        .hist-rainbow {
          height:3px; border-radius:999px;
          background:linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage},${C.mist},${C.salmon});
          background-size:200% 100%;
          animation:borderFlow 6s ease infinite;
        }

        /* ── page-level cards ── */
        .hist-card {
          animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          border-radius:24px; background:white;
          border:1px solid ${C.border};
          box-shadow:0 3px 14px rgba(44,62,53,0.07);
          transition:box-shadow .22s, transform .22s;
        }
        .hist-card:hover { box-shadow:0 10px 28px rgba(44,62,53,0.10); }

        /* ── day row ── */
        .hist-day {
          animation: cardIn .42s cubic-bezier(.22,1,.36,1) both;
          border-radius:20px; background:white;
          transition:transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          overflow:hidden;
        }
        .hist-day:hover { transform:translateY(-3px); box-shadow:0 10px 28px rgba(44,62,53,0.10) !important; }

        /* ── buttons — same as .th-btn / .gal-btn ── */
        .hist-btn {
          cursor:pointer; border:none;
          transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
        }
        .hist-btn:hover  { transform:translateY(-2px); }
        .hist-btn:active { transform:scale(.97); }

        .hist-ghost {
          cursor:pointer;
          transition:transform .18s, background .18s, border-color .18s, color .18s;
        }
        .hist-ghost:hover { transform:translateY(-2px); background:#FFF0EB !important; border-color:#FCCAAB !important; color:${C.salmon} !important; }

        /* ── heatmap cell ── */
        .heat-cell {
          width:22px; height:22px; border-radius:6px;
          animation: heatPop .3s cubic-bezier(.34,1.56,.64,1) both;
          transition:transform .15s;
          cursor:default;
        }
        .heat-cell:hover { transform:scale(1.3); }

        /* ── sways / floats ── */
        .hist-sway-l { animation:softSway 4.5s ease-in-out infinite;     transform-origin:bottom center; }
        .hist-sway-r { animation:softSway 4.5s ease-in-out infinite .6s; transform-origin:bottom center; }
        .hist-float  { animation:gentleFloat 4s ease-in-out infinite; }

        /* ── stats grid ── */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media(max-width:680px){ .stats-grid{ grid-template-columns:repeat(2,1fr) !important; } }

        /* ── progress bar grow animation ── */
        .bar-animated { animation:barGrow .8s cubic-bezier(.34,1.56,.64,1) both; }
      `}</style>

      <PageTutorial storageKey="artcare_tut_history" steps={HISTORY_TUTORIAL_STEPS}/>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'32px 20px' }}>

        {/* rainbow bar */}
        <div className="hist-rainbow" style={{ marginBottom:28 }}/>

        {/* ══ HEADER CARD ════════════════════════════════════════ */}
        <div className="hist-card" style={{ marginBottom:16, overflow:'hidden', animationDelay:'0s' }}>
          <div className="hist-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'22px 28px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, color:C.forest, margin:0, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.32)` }}>
                  <Calendar size={20} color="white"/>
                </span>
                История на активността
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, marginLeft:56 }}>
                <TinyFlower style={{ opacity:.55 }}/>
                <span style={{ fontSize:'0.75rem', color:C.stone, fontWeight:600, fontStyle:'italic' }}>{history.length} активни дни</span>
              </div>
            </div>
            <button onClick={exportJSON}
              className="hist-ghost"
              style={{ padding:'10px 18px', borderRadius:999, fontWeight:700, fontSize:'0.84rem', color:C.stone, background:'white', border:`1.5px solid ${C.mistLt}`, display:'flex', alignItems:'center', gap:7 }}
            ><Download size={14}/> Експорт JSON</button>
          </div>
        </div>

        {/* ══ STATS ══════════════════════════════════════════════ */}
        <div className="stats-grid" style={{ marginBottom:16 }} data-tutorial="history-chart">
          {[
            { icon:<TrendingUp size={18}/>, value:stats.totalDays,                                  label:'Активни дни',     color:C.salmon },
            { icon:<Target size={18}/>,    value:`${stats.completedTasks}/${stats.totalTasks}`,     label:'Задачи',          color:C.peach  },
            { icon:<Award size={18}/>,     value:stats.currentStreak,                               label:'Текуща серия',    color:C.sage   },
            { icon:<BarChart3 size={18}/>, value:stats.bestStreak,                                  label:'Най-добра серия', color:C.mist   },
          ].map((s,i) => (
            <div key={i} className="hist-card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12, animationDelay:`${i*0.05}s` }}>
              <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}22`, color:s.color, flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.6rem', fontWeight:700, color:C.forest, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:'0.68rem', fontWeight:700, color:C.stone, marginTop:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ HEATMAP ════════════════════════════════════════════ */}
        {history.length > 0 && (
          <div className="hist-card" style={{ padding:'20px 24px', marginBottom:16, animationDelay:'.18s' }} data-tutorial="history-streaks">
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
              <TinyFlower style={{ opacity:.7 }}/>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.05rem', fontWeight:700, color:C.forest, margin:0 }}>
                Активност за последния месец
              </h3>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {Array.from({length:35},(_,i) => {
                const d = new Date(); d.setDate(d.getDate()-(34-i));
                const dateStr = d.toLocaleDateString('bg-BG');
                const day = history.find(h=>h.date===dateStr);
                const pct = day ? (day.totalTasks>0 ? day.completedTasks/day.totalTasks : day.journalEntries>0||day.uploadedArtworks>0 ? 0.3 : 0) : 0;
                const bg  = pct>=1 ? C.sage : pct>0.5 ? C.peach : pct>0 ? '#FCCAAB' : '#EDE8E0';
                return (
                  <div key={i}
                    className="heat-cell"
                    title={`${dateStr}${day?` — ${day.completedTasks} задачи`:''}`}
                    style={{ background:bg, animationDelay:`${i*0.012}s` }}
                  />
                );
              })}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, fontSize:'0.72rem', color:C.mist, fontWeight:600 }}>
              <span>По-малко</span>
              {['#EDE8E0','#FCCAAB',C.peach,C.sage].map((c,i)=>(
                <div key={i} style={{ width:16, height:16, borderRadius:4, background:c }}/>
              ))}
              <span>Повече</span>
            </div>
          </div>
        )}

        {/* ══ FILTERS CARD ═══════════════════════════════════════ */}
        <div className="hist-card" style={{ padding:'16px 22px', marginBottom:16, animationDelay:'.22s' }}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', flex:1 }}>
              {[['all','Всички'],['tasks','Задачи'],['journal','Дневник'],['gallery','Галерия']].map(([val,label]) => {
                const active = filter===val;
                return (
                  <button key={val} onClick={()=>setFilter(val)}
                    className={active ? 'hist-btn' : 'hist-ghost'}
                    style={{ padding:'8px 18px', borderRadius:999, fontSize:'0.82rem', fontWeight:700,
                      background: active ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'white',
                      color:      active ? 'white' : C.stone,
                      border:     active ? 'none' : `1.5px solid ${C.mistLt}`,
                      boxShadow:  active ? `0 4px 14px rgba(232,128,103,.25)` : 'none',
                    }}
                  >{label}</button>
                );
              })}
            </div>
            <select value={timeRange} onChange={e=>setTimeRange(e.target.value)}
              style={{ padding:'8px 16px', borderRadius:999, fontSize:'0.82rem', fontWeight:700, color:C.stone, background:C.bgWarm, border:`1.5px solid ${C.mistLt}`, outline:'none', cursor:'pointer' }}
            >
              <option value="week">7 дни</option>
              <option value="month">1 месец</option>
              <option value="3months">3 месеца</option>
              <option value="all">Всичко</option>
            </select>
          </div>
        </div>

        {/* ══ TIMELINE ══════════════════════════════════════════ */}
        {filtered.length === 0 ? (
          <div className="hist-card" style={{ padding:'56px 24px', textAlign:'center', animationDelay:'.26s' }}>
            <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, opacity:.2 }}>
              <Calendar size={28} color="white"/>
            </div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, marginBottom:8 }}>
              Няма активност за избрания период
            </h3>
            <p style={{ fontSize:'0.84rem', color:C.stone, opacity:.7 }}>
              Започнете да използвате ARTCARE, за да изградите история
            </p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {filtered.map((day, idx) => {
              const isOpen = expandedDays.has(day.dayNumber);
              const pct = day.totalTasks > 0 ? Math.round((day.completedTasks/day.totalTasks)*100) : 0;
              const accent = pct===100 ? C.sage : pct>0 ? C.peach : C.mistLt;

              return (
                <div key={day.date}
                  className="hist-day"
                  style={{ border:`1.5px solid ${accent}`, borderLeft:`4px solid ${accent}`, boxShadow:'0 4px 14px rgba(44,62,53,0.07)', animationDelay:`${idx*0.04}s` }}
                >
                  {/* day row header */}
                  <div
                    style={{ padding:'14px 18px', display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, cursor:'pointer' }}
                    onClick={()=>toggleDay(day.dayNumber)}
                  >
                    {/* date badge */}
                    <div style={{ width:48, height:48, borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.cream},#FCCAAB)`, border:`1.5px solid #FCCAAB` }}>
                      <span style={{ fontSize:'0.9rem', fontWeight:800, color:C.salmon, lineHeight:1 }}>
                        {new Date(day.date).toLocaleDateString('bg-BG',{day:'2-digit'})}
                      </span>
                      <span style={{ fontSize:'0.65rem', fontWeight:600, color:C.stone, marginTop:1 }}>
                        {new Date(day.date).toLocaleDateString('bg-BG',{month:'short'})}
                      </span>
                    </div>

                    {/* info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:3 }}>
                        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:700, fontSize:'0.98rem', color:C.forest }}>{day.date}</span>
                        {day.mood && <span style={{ fontSize:'1.1rem', lineHeight:1 }}>{day.mood}</span>}
                        {pct===100 && (
                          <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'2px 9px', borderRadius:999, background:C.sage, color:'white' }}>
                            ✓ Перфектен ден
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap', fontSize:'0.72rem', color:C.mist, fontWeight:600 }}>
                        {day.totalTasks>0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <Target size={10} style={{ color:C.salmon }}/>{day.completedTasks}/{day.totalTasks} задачи
                          </span>
                        )}
                        {day.journalEntries>0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <BookOpen size={10} style={{ color:C.peach }}/>{day.journalEntries} записа
                          </span>
                        )}
                        {day.uploadedArtworks>0 && (
                          <span style={{ display:'flex', alignItems:'center', gap:3 }}>
                            <Image size={10} style={{ color:C.sage }}/>{day.uploadedArtworks} творби
                          </span>
                        )}
                      </div>
                    </div>

                    {/* mini progress bar */}
                    {day.totalTasks > 0 && (
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                        <div style={{ width:72, height:8, borderRadius:999, background:C.mistLt, overflow:'hidden' }}>
                          <div
                            className="bar-animated"
                            style={{ height:'100%', borderRadius:999, background: pct===100 ? C.sage : `linear-gradient(90deg,${C.salmon},${C.peach})`, width:`${pct}%`, ['--w' as any]:`${pct}%` }}
                          />
                        </div>
                        <span style={{ fontSize:'0.72rem', fontWeight:700, color:C.stone, minWidth:32 }}>{pct}%</span>
                      </div>
                    )}

                    {/* chevron */}
                    <div style={{ color:C.mist, flexShrink:0 }}>
                      {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                    </div>
                  </div>

                  {/* expanded detail */}
                  {isOpen && (
                    <div style={{ borderTop:`1.5px solid ${C.border}`, padding:'16px 18px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>

                        {/* tasks */}
                        {day.tasks.length > 0 && (
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:10 }}>
                              <Target size={12} style={{ color:C.salmon }}/>
                              <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.salmon }}>Задачи</span>
                            </div>
                            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                              {day.tasks.map(t => (
                                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:12, background:t.completed?'linear-gradient(135deg,#EEF4EE,#E4EFE4)':C.bgWarm, border:`1px solid ${t.completed?C.sage:C.mistLt}` }}>
                                  <div style={{ width:20, height:20, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:t.completed?`linear-gradient(135deg,${C.sage},${C.mist})`:'white', border:t.completed?'none':`2px solid ${C.mistLt}`, boxShadow:t.completed?`0 2px 6px rgba(163,185,149,.3)`:'none' }}>
                                    {t.completed && <span style={{ color:'white', fontSize:'0.6rem', fontWeight:800 }}>✓</span>}
                                  </div>
                                  <span style={{ fontSize:'0.8rem', fontWeight:600, color:t.completed?C.stone:C.forest, textDecoration:t.completed?'line-through':'none', opacity:t.completed?.6:1 }}>{t.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* journal + artworks */}
                        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                          {day.entries.length > 0 && (
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                                <BookOpen size={12} style={{ color:C.peach }}/>
                                <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.peach }}>Дневник</span>
                              </div>
                              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                                {day.entries.map(e => (
                                  <div key={e.id} style={{ padding:'10px 13px', borderRadius:14, background:C.bgWarm, border:`1px solid ${C.border}` }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                                      <span style={{ fontSize:'1rem', lineHeight:1 }}>{e.mood?.split(' ')[0]}</span>
                                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:700, fontSize:'0.9rem', color:C.forest }}>{e.title}</span>
                                    </div>
                                    <p style={{ fontSize:'0.75rem', color:C.stone, opacity:.7, margin:0, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{e.preview}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {day.artworks.length > 0 && (
                            <div>
                              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                                <Image size={12} style={{ color:C.sage }}/>
                                <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.sage }}>Творби</span>
                              </div>
                              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                                {day.artworks.map(a => (
                                  <span key={a.id} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'5px 12px', borderRadius:999, fontSize:'0.75rem', fontWeight:600, background:C.mistLt, color:C.forest, border:`1px solid #B8CEC6` }}>
                                    🎨 {a.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* floral footer — same as Therapy / Journal / Gallery */}
        {history.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:28, opacity:.28 }}>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
            <span className="hist-sway-l"><Sprig/></span>
            <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
            <span className="hist-sway-r"><Sprig style={{ transform:'scaleX(-1)' }}/></span>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
          </div>
        )}

      </div>
    </div>
  );
};

export default History;