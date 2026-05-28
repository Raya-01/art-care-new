import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import {
  Mail, Lock, User, Eye, EyeOff, AlertCircle,
  Palette, Shield, Leaf, CheckCircle, XCircle,
  Info, ArrowRight, RefreshCw,
} from 'lucide-react';

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage:   '#A3B995', mist:  '#A8BBB9', mistLt: '#D4E3DE',
  forest: '#2C3E35', stone: '#5C6E6A', bgWarm: '#FAF5EF',
};

const TinyFlower = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7" cy="3.5" rx="1.5" ry="2" fill="#E88067" opacity="0.75"/>
    <ellipse cx="7" cy="10.5" rx="1.5" ry="2" fill="#E88067" opacity="0.75"/>
    <ellipse cx="3.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.75"/>
    <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.75"/>
  </svg>
);

const Sprig = ({ flip = false }: { flip?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none"
    style={{ flexShrink: 0, transform: flip ? 'scaleX(-1)' : undefined, opacity: 0.55 }}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.5"/>
  </svg>
);

const FieldHint = ({ ok, text }: { ok: boolean; text: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.4rem',
    marginTop: '0.4rem', fontSize: '0.79rem',
    color: ok ? C.sage : C.salmon,
    animation: 'su-fadein 0.2s ease both',
  }}>
    {ok
      ? <CheckCircle size={13} style={{ flexShrink: 0 }} />
      : <XCircle     size={13} style={{ flexShrink: 0 }} />}
    <span>{text}</span>
  </div>
);

const FieldInfo = ({ text, example }: { text: string; example?: string }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
    marginTop: '0.4rem', fontSize: '0.79rem', color: C.mist,
  }}>
    <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
    <span>
      {text}
      {example && <span style={{ color: C.stone, marginLeft: '0.3rem' }}>— напр. <em>{example}</em></span>}
    </span>
  </div>
);

const FieldWarn = ({ text, fix }: { text: string; fix: string }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
    marginTop: '0.35rem', fontSize: '0.79rem', color: C.salmon,
    background: 'rgba(232,128,103,0.08)',
    border: `1px solid rgba(232,128,103,0.3)`,
    borderRadius: '8px', padding: '0.3rem 0.6rem',
    animation: 'su-fadein 0.2s ease both',
  }}>
    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
    <span><strong>{text}</strong> — {fix}</span>
  </div>
);

const genMath = () => {
  const ops = ['+', '-', '×'] as const;
  const op  = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '+') { a = Math.floor(Math.random()*12)+1; b = Math.floor(Math.random()*12)+1; answer = a+b; }
  else if (op === '-') { a = Math.floor(Math.random()*12)+6; b = Math.floor(Math.random()*a)+1; answer = a-b; }
  else { a = Math.floor(Math.random()*8)+2; b = Math.floor(Math.random()*8)+2; answer = a*b; }
  return { question: `${a} ${op} ${b} = ?`, answer };
};

const PW_RULES = [
  { label: 'Поне 6 символа',        test: (p: string) => p.length >= 6 },
  { label: 'Поне една главна буква', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Поне една малка буква',  test: (p: string) => /[a-z]/.test(p) },
  { label: 'Поне една цифра',        test: (p: string) => /[0-9]/.test(p) },
];

interface UserData {
  uid: string; email: string; displayName: string;
  role: 'admin' | 'user'; status: 'active' | 'suspended';
  createdAt: Timestamp; updatedAt: Timestamp; lastLogin: Timestamp;
  settings: { theme: string; notifications: boolean; language: string; emailNotifications: boolean };
  preferences: { weeklyReport: boolean; dailyReminder: boolean; reminderTime: string };
  stats: {
    totalTasksCompleted: number; currentStreak: number; longestStreak: number;
    totalArtworks: number; totalJournalEntries: number; lastActiveDate: string;
  };
  bio: string; photoURL: string; isActive: boolean;
}

const Signup = () => {
  const [displayName,     setDisplayName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms,     setAcceptTerms]     = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);
  const [mathQ,           setMathQ]           = useState(genMath);
  const [mathAnswer,      setMathAnswer]      = useState('');
  const [mathError,       setMathError]       = useState(false);
  const [touched, setTouched] = useState({
    displayName: false, email: false,
    password: false, confirmPassword: false, math: false,
  });

  const { signup } = useAuth();
  const navigate   = useNavigate();

  const touch = (f: keyof typeof touched) =>
    setTouched(prev => ({ ...prev, [f]: true }));

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const pwRules    = PW_RULES.map(r => ({ ...r, ok: r.test(password) }));
  const pwValid    = pwRules.every(r => r.ok);
  const pwMatch    = password === confirmPassword && confirmPassword.length > 0;

  const v = {
    name: {
      ok:    displayName.trim().length >= 2,
      empty: touched.displayName && displayName.trim().length === 0,
      short: touched.displayName && displayName.trim().length > 0 && displayName.trim().length < 2,
    },
    email: {
      ok:        emailRegex.test(email),
      empty:     touched.email && email.length === 0,
      noAt:      touched.email && email.length > 0 && !email.includes('@'),
      badFormat: touched.email && email.length > 0 && !emailRegex.test(email),
    },
    password: {
      ok:    pwValid,
      empty: touched.password && password.length === 0,
    },
    confirm: {
      ok:      pwMatch,
      empty:   touched.confirmPassword && confirmPassword.length === 0,
      mismatch: touched.confirmPassword && confirmPassword.length > 0 && !pwMatch,
    },
    math: {
      ok:    parseInt(mathAnswer) === mathQ.answer && mathAnswer.length > 0,
      wrong: touched.math && mathAnswer.length > 0 && parseInt(mathAnswer) !== mathQ.answer,
      empty: touched.math && mathAnswer.length === 0,
    },
  };

  const todayKey = () => new Date().toISOString().split('T')[0];

  const createUserInFirestore = async (userId: string, userEmail: string, userDisplayName: string) => {
    const now = Timestamp.now();
    const userData: UserData = {
      uid: userId, email: userEmail, displayName: userDisplayName,
      role: 'user', status: 'active',
      createdAt: now, updatedAt: now, lastLogin: now,
      settings: { theme: 'system', notifications: true, language: 'bg', emailNotifications: true },
      preferences: { weeklyReport: true, dailyReminder: true, reminderTime: '09:00' },
      stats: { totalTasksCompleted: 0, currentStreak: 0, longestStreak: 0, totalArtworks: 0, totalJournalEntries: 0, lastActiveDate: todayKey() },
      bio: '', photoURL: '', isActive: true,
    };
    await setDoc(doc(db, 'users', userId), userData);
  };

  const initializeDailyProgress = async (userId: string) => {
    const today = todayKey();
    const defaultTasks = [
      { id: 'bt1', text: 'Нарисувайте нещо, което ви радва днес',       completed: false, category: 'drawing',  duration: '10 мин', skipped: false },
      { id: 'bt2', text: 'Оцветете нещо с цветовете на настроението си', completed: false, category: 'painting', duration: '15 мин', skipped: false },
      { id: 'bt3', text: 'Медитирайте 5 минути, след това скицирайте',   completed: false, category: 'mindful',  duration: '10 мин', skipped: false },
      { id: 'bt4', text: 'Създайте нещо само с кръгове и линии',          completed: false, category: 'creative', duration: '10 мин', skipped: false },
      { id: 'bt5', text: 'Нарисувайте любимото си място',                 completed: false, category: 'drawing',  duration: '20 мин', skipped: false },
    ];
    await setDoc(doc(db, 'dailyProgress', `${userId}_${today}`), {
      userId, date: today, tasks: defaultTasks, customTasks: [],
      completedCount: 0, streak: 0, allCompleted: false, lastUpdated: Timestamp.now(),
    });
  };

  const initLocalStorageCollections = (userId: string) => {
    const now = new Date().toISOString();
    localStorage.setItem(`journal_${userId}`,  JSON.stringify({ userId, entries: [], createdAt: now }));
    localStorage.setItem(`gallery_${userId}`,  JSON.stringify({ userId, artworks: [], createdAt: now }));
    localStorage.setItem(`therapy_${userId}`,  JSON.stringify({ userId, dailyTasks: [], streak: 0, lastActive: now, createdAt: now }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true, math: true });

    if (!v.name.ok)    { setError('Моля, въведете валидно пълно име'); return; }
    if (!v.email.ok)   { setError('Моля, въведете валиден имейл адрес'); return; }
    if (!pwValid)       { setError('Паролата не отговаря на изискванията'); return; }
    if (!pwMatch)       { setError('Паролите не съвпадат'); return; }
    if (!acceptTerms)   { setError('Трябва да приемете условията за ползване'); return; }
    if (!v.math.ok) {
      setMathError(true); setMathQ(genMath()); setMathAnswer('');
      setError('Грешен отговор на проверката. Нова задача е генерирана.'); return;
    }

    setMathError(false);
    try {
      setError(''); setLoading(true);
      const credential = await signup(email, password, displayName);
      const userId = credential.user?.uid;
      if (!userId) throw new Error('Грешка при създаване на потребител');
      await createUserInFirestore(userId, email, displayName);
      await initializeDailyProgress(userId);
      initLocalStorageCollections(userId);
      localStorage.setItem('currentUser', JSON.stringify({ id: userId, email, displayName, role: 'user', status: 'active' }));
      navigate('/dashboard');
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/email-already-in-use':   'Този имейл вече е регистриран',
        'auth/weak-password':          'Паролата трябва да е поне 6 символа',
        'auth/invalid-email':          'Невалиден имейл адрес',
        'auth/operation-not-allowed':  'Регистрацията е временно недостъпна',
      };
      setError(messages[err.code] || err.message || 'Грешка при регистрация. Опитайте отново.');
    } finally { setLoading(false); }
  };

  const refreshMath = () => { setMathQ(genMath()); setMathAnswer(''); setMathError(false); };

  const Label = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 7,
      fontSize: '0.82rem', fontWeight: 800, color: C.forest,
      textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
    }}>
      <span style={{ color: C.sage }}>{icon}</span> {text}
    </label>
  );

  const inputStyle = (hasError = false): React.CSSProperties => ({
    padding: '12px 15px', borderRadius: 14, fontSize: '0.95rem',
    border: `2px solid ${hasError ? 'rgba(232,128,103,0.5)' : C.mistLt}`,
    color: C.forest, background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(3px)', width: '100%', boxSizing: 'border-box',
    fontFamily: "'Nunito', sans-serif",
    transition: 'border-color .2s, box-shadow .2s',
  });

  return (
    <div style={{
      height: '100vh', width: '100%', display: 'flex', overflow: 'hidden',
      fontFamily: "'Nunito', sans-serif",
      background: `linear-gradient(160deg, ${C.bgWarm} 0%, #EDF5EF 60%, #F0EBF7 100%)`,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes softSway   { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
        @keyframes blobDrift  { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.08) translateY(-14px)} }
        @keyframes spinAnim   { to{transform:rotate(360deg)} }
        @keyframes shake      { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes panelSlide { from{opacity:0;transform:translateX(22px)} to{opacity:1;transform:translateX(0)} }
        @keyframes su-fadein  { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ruleSlide  { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }

        .su-rainbow {
          height: 4px; width: 100%;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
        .su-sway-l  { animation: softSway 5s ease-in-out infinite;    transform-origin: bottom center; }
        .su-sway-r  { animation: softSway 5s ease-in-out infinite .8s;transform-origin: bottom center; }
        .su-blob    { animation: blobDrift 7s ease-in-out infinite; }
        .su-spin    { animation: spinAnim .8s linear infinite; }
        .su-shake   { animation: shake .38s ease-out; }
        .su-panel   { animation: panelSlide .55s cubic-bezier(.22,1,.36,1) both; }
        .su-rule    { animation: ruleSlide .22s ease both; }

        .su-input { transition: border-color .2s, box-shadow .2s; }
        .su-input:focus { outline: none; border-color: #A3B995 !important; box-shadow: 0 0 0 4px rgba(163,185,149,.2); }
        .su-input::placeholder { color: #B8CECE; }

        .su-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, filter .15s; cursor: pointer; }
        .su-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(232,128,103,.44) !important; filter: brightness(1.05); }
        .su-btn:active:not(:disabled) { transform: scale(.97); }
        .su-btn:disabled { opacity: .45; cursor: not-allowed; }

        .su-link { transition: color .18s; }
        .su-link:hover { color: #C05A3E !important; text-decoration: underline; }

        .su-eye { transition: background .18s; cursor: pointer; }
        .su-eye:hover { background: rgba(163,185,149,.18) !important; }

        .su-feature { transition: transform .2s, background .2s; }
        .su-feature:hover { transform: translateX(6px); background: rgba(255,255,255,0.12) !important; }

        @media (max-width: 860px) {
          .su-left  { display: none !important; }
          .su-right { border-radius: 0 !important; }
        }
      `}</style>

      <div className="su-left" style={{
        flex: '0 0 44%', position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        <img
          src="/art-therapy-bg.jpg"
          alt="Art therapy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(160deg, rgba(44,62,53,0.84) 0%, rgba(163,185,149,0.52) 100%)`,
        }}/>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="su-blob" style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,189,150,0.25), transparent 68%)' }}/>
          <div className="su-blob" style={{ position: 'absolute', bottom: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,187,185,0.2), transparent 68%)', animationDelay: '2s' }}/>
        </div>

        <div className="su-rainbow" style={{ position: 'relative', zIndex: 2 }}/>

        <div style={{
          position: 'relative', zIndex: 2, flex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '3rem 3rem 2.5rem',
        }}>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
            fontSize: '3rem', fontWeight: 700, color: 'white',
            margin: '0 0 4px', lineHeight: 1.1,
          }}>ArtCare</h1>
          <p style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.3rem', color: 'rgba(249,221,184,0.85)',
            margin: '0 0 26px', fontStyle: 'italic', fontWeight: 600,
          }}>Започнете пътуването</p>

          <p style={{
            fontSize: '1rem', color: 'rgba(255,255,255,0.72)',
            lineHeight: 1.7, marginBottom: 32, maxWidth: 300,
          }}>
            Създайте своя акаунт и влезте в пространство за творческа терапия — дневник, галерия и практики.
          </p>

          {[
            { icon: <Palette size={18}/>, title: 'Арт дневник',        desc: 'Твоето творческо пространство' },
            { icon: <Leaf    size={18}/>, title: 'Терапевтични цикли', desc: 'Структурирани практики'        },
            { icon: <Shield  size={18}/>, title: 'Сигурен профил',     desc: 'Само ти виждаш творбите си'    },
          ].map(f => (
            <div key={f.title} className="su-feature" style={{
              display: 'flex', alignItems: 'center', gap: 14,
              marginBottom: 12, padding: '10px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'default',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(232,128,103,.55), rgba(251,189,150,.35))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9DDB8',
              }}>{f.icon}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'white' }}>{f.title}</span>
                <span style={{ fontSize: '0.76rem', color: 'rgba(255,255,255,0.52)' }}>{f.desc}</span>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, opacity: 0.3 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(249,221,184,0.7))' }}/>
            <span className="su-sway-l" style={{ display: 'inline-block' }}><Sprig/></span>
            <TinyFlower/><TinyFlower/>
            <span className="su-sway-r" style={{ display: 'inline-block' }}><Sprig flip/></span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(249,221,184,0.7), transparent)' }}/>
          </div>
        </div>
      </div>

      <div className="su-right su-panel" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'flex-start', alignItems: 'center',
        overflowY: 'auto', position: 'relative',
        padding: '0 2rem 2rem',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div className="su-blob" style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,189,150,0.16), transparent 68%)', animationDelay: '1s' }}/>
          <div className="su-blob" style={{ position: 'absolute', bottom: -60, left: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,227,222,0.18), transparent 68%)', animationDelay: '3s' }}/>
        </div>

        <div className="su-sway-r" style={{ position: 'absolute', top: 20, right: 20, opacity: .18, transformOrigin: 'bottom center', zIndex: 0 }}>
          <svg width="52" height="52" viewBox="0 0 18 18" fill="none" style={{ transform: 'scaleX(-1)' }}>
            <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
            <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
          </svg>
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 430, paddingTop: '2rem' }}>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic',
              fontSize: '2.2rem', fontWeight: 700, color: C.forest,
              margin: '0 0 4px', lineHeight: 1.1,
            }}>Регистрация</h2>
            <p style={{ fontSize: '0.88rem', color: C.stone, margin: 0, fontWeight: 600 }}>
              Попълнете данните си за нов акаунт
            </p>
          </div>

          {error && (
            <div className="su-shake" style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'rgba(232,128,103,0.08)', border: `1.5px solid rgba(232,128,103,0.35)`,
              borderRadius: 14, padding: '12px 15px', marginBottom: 20,
              fontSize: '0.86rem', fontWeight: 600, color: C.salmon,
              animation: 'su-fadein .3s ease both',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

            <div>
              <Label icon={<User size={13}/>} text="Пълно име"/>
              <input
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => touch('displayName')}
                placeholder="Вашето пълно име"
                required disabled={loading}
                className="su-input"
                style={inputStyle(touched.displayName && !v.name.ok)}
              />
              {!touched.displayName && <FieldInfo text="Въведете вашето пълно име" example="Иван Петров"/>}
              {touched.displayName && v.name.ok && <FieldHint ok text="Името изглежда добре!"/>}
              {v.name.empty && <FieldWarn text="Полето е задължително" fix="Въведете вашето пълно име"/>}
              {v.name.short && <FieldWarn text="Твърде кратко" fix="Името трябва да е поне 2 символа"/>}
            </div>

            <div>
              <Label icon={<Mail size={13}/>} text="Имейл адрес"/>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={() => touch('email')}
                placeholder="вашият@имейл.com"
                required disabled={loading}
                className="su-input"
                style={inputStyle(touched.email && !v.email.ok)}
              />
              {!touched.email && <FieldInfo text="Имейлът, с който ще влизате в ArtCare" example="ivan@gmail.com"/>}
              {touched.email && v.email.ok && <FieldHint ok text="Валиден имейл адрес!"/>}
              {v.email.empty   && <FieldWarn text="Полето е задължително" fix="Въведете вашия имейл адрес"/>}
              {v.email.noAt    && <FieldWarn text="Липсва @" fix='Имейлът трябва да съдържа @ — напр. "ivan@gmail.com"'/>}
              {v.email.badFormat && !v.email.noAt && <FieldWarn text="Невалиден формат" fix='Проверете имейла — напр. "ivan@gmail.com"'/>}
            </div>

            <div>
              <Label icon={<Lock size={13}/>} text="Парола"/>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  onBlur={() => touch('password')}
                  placeholder="Поне 6 символа"
                  required disabled={loading}
                  className="su-input"
                  style={{ ...inputStyle(touched.password && !v.password.ok), paddingRight: 46 }}
                />
                <button type="button" disabled={loading} onClick={() => setShowPassword(s => !s)}
                  className="su-eye"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 9, border: 'none', background: 'transparent', color: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{
                  marginTop: 8, background: C.bgWarm,
                  border: `1.5px solid ${C.mistLt}`, borderRadius: 12,
                  padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {pwRules.map((r, i) => (
                    <div key={i} className="su-rule" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: '0.78rem', fontWeight: 600,
                      color: r.ok ? C.sage : C.stone,
                      animationDelay: `${i * 0.05}s`,
                    }}>
                      <div style={{
                        width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: r.ok ? C.sage : C.mistLt, transition: 'background .25s',
                      }}>
                        {r.ok
                          ? <CheckCircle size={10} color="white"/>
                          : <XCircle     size={10} color={C.stone}/>}
                      </div>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
              {!touched.password && !password && (
                <FieldInfo text="Главна + малка буква и цифра" example="Abc123"/>
              )}
              {touched.password && v.password.ok && <FieldHint ok text="Паролата отговаря на всички изисквания!"/>}
              {v.password.empty && <FieldWarn text="Полето е задължително" fix="Въведете вашата парола"/>}
            </div>

            <div>
              <Label icon={<Lock size={13}/>} text="Потвърди парола"/>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onBlur={() => touch('confirmPassword')}
                  placeholder="Повторете паролата"
                  required disabled={loading}
                  className="su-input"
                  style={{ ...inputStyle(touched.confirmPassword && !v.confirm.ok), paddingRight: 46 }}
                />
                <button type="button" disabled={loading} onClick={() => setShowConfirm(s => !s)}
                  className="su-eye"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 9, border: 'none', background: 'transparent', color: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
              {!touched.confirmPassword && <FieldInfo text="Въведете паролата отново за потвърждение"/>}
              {touched.confirmPassword && v.confirm.ok   && <FieldHint ok text="Паролите съвпадат!"/>}
              {v.confirm.mismatch                         && <FieldWarn text="Паролите не съвпадат" fix="Уверете се, че двете пароли съвпадат"/>}
              {v.confirm.empty                            && <FieldWarn text="Полето е задължително" fix="Повторете вашата парола"/>}
            </div>

            <div>
              <label style={{
                fontSize: '0.82rem', fontWeight: 800, color: C.forest,
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, display: 'block',
              }}>🌿 Проверка — реши задачата</label>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 14,
                background: `linear-gradient(135deg, ${C.cream}, ${C.mistLt})`,
                border: `1.5px solid #FCCAAB`,
              }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '1.1rem', fontWeight: 700, color: C.forest, flex: 1,
                }}>{mathQ.question}</span>
                <button type="button" onClick={refreshMath} disabled={loading}
                  title="Нова задача"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.mist, display: 'flex', alignItems: 'center', padding: 4, transition: 'color .2s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.sage)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.mist)}>
                  <RefreshCw size={15}/>
                </button>
                <input
                  type="number" value={mathAnswer}
                  onChange={e => { setMathAnswer(e.target.value); setMathError(false); touch('math'); }}
                  onBlur={() => touch('math')}
                  placeholder="?"
                  disabled={loading}
                  className="su-input"
                  style={{
                    width: 68, padding: '8px 10px', borderRadius: 10,
                    fontSize: '0.92rem', fontWeight: 700, textAlign: 'center',
                    border: `2px solid ${mathError ? C.salmon : C.mistLt}`,
                    color: C.forest, background: 'white',
                    fontFamily: "'Nunito', sans-serif", boxSizing: 'border-box',
                  }}
                />
              </div>
              {!touched.math && <FieldInfo text="Изчислете и въведете резултата"/>}
              {touched.math && v.math.ok   && <FieldHint ok text="Правилен отговор!"/>}
              {v.math.wrong                && <FieldWarn text="Грешен отговор" fix={`Изчислете внимателно и опитайте пак`}/>}
              {v.math.empty                && <FieldWarn text="Полето е задължително" fix="Въведете резултата от задачата"/>}
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.86rem', fontWeight: 600, color: C.stone, lineHeight: 1.5 }}>
              <div
                role="checkbox" aria-checked={acceptTerms} tabIndex={0}
                onClick={() => !loading && setAcceptTerms(v => !v)}
                onKeyDown={e => e.key === ' ' && !loading && setAcceptTerms(v => !v)}
                style={{
                  width: 20, height: 20, borderRadius: 7, flexShrink: 0,
                  border: `2px solid ${acceptTerms ? C.sage : C.mistLt}`,
                  background: acceptTerms ? C.sage : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all .2s', marginTop: 2,
                }}>
                {acceptTerms && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span>
                Съгласявам се с{' '}
                <Link to="/terms" style={{ color: C.salmon, fontWeight: 800, textDecoration: 'none' }}>условията за ползване</Link>
                {' '}и{' '}
                <Link to="/privacy" style={{ color: C.salmon, fontWeight: 800, textDecoration: 'none' }}>политиката за поверителност</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !pwValid || !pwMatch || !acceptTerms}
              className="su-btn"
              style={{
                padding: '14px', borderRadius: 16, fontSize: '0.97rem',
                fontWeight: 800, color: 'white',
                background: `linear-gradient(135deg, ${C.salmon}, ${C.peach})`,
                border: 'none', boxShadow: `0 6px 20px rgba(232,128,103,.32)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                marginTop: 4,
              }}>
              {loading ? (
                <>
                  <div className="su-spin" style={{ width: 17, height: 17, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.35)', borderTopColor: 'white' }}/>
                  Регистрация...
                </>
              ) : (
                <>
                  <span>Регистрирай се</span>
                  <ArrowRight size={17}/>
                </>
              )}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0', opacity: 0.32 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.sage})` }}/>
            <span className="su-sway-l" style={{ display: 'inline-block' }}><TinyFlower/></span>
            <span className="su-sway-r" style={{ display: 'inline-block' }}><TinyFlower/></span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.sage}, transparent)` }}/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'center' }}>
            <p style={{ fontSize: '0.9rem', color: C.stone, margin: 0 }}>
              Вече имате акаунт?{' '}
              <Link to="/login" className="su-link" style={{ fontWeight: 800, color: C.salmon, textDecoration: 'none' }}>
                Влезте
              </Link>
            </p>
            <Link to="/" style={{ fontSize: '0.83rem', color: C.mist, textDecoration: 'none', transition: 'color .2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = C.salmon)}
              onMouseLeave={e => (e.currentTarget.style.color = C.mist)}>
              ← Назад към началото
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;