import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Check, X } from 'lucide-react';

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage: '#A3B995', mist: '#A8BBB9', mistLt: '#D4E3DE',
  forest: '#2C3E35', stone: '#5C6E6A', bgWarm: '#FAF5EF', border: '#F9DDB8',
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
    style={{ flexShrink: 0, transform: flip ? 'scaleX(-1)' : undefined, opacity: .55 }}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.5"/>
  </svg>
);

const genMath = () => {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
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
  id: string; email: string; displayName: string;
  role: 'admin'|'user'; status: 'active'|'suspended';
  createdAt: string; updatedAt: string;
  settings: { theme:string; notifications:boolean; language:string; emailNotifications:boolean };
  preferences: { weeklyReport:boolean; dailyReminder:boolean; reminderTime:string };
  collections?: { journal:string; therapy:string; gallery:string; history:string };
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

  const { signup } = useAuth();
  const navigate   = useNavigate();

  const pwRules = PW_RULES.map(r => ({ ...r, ok: r.test(password) }));
  const pwValid = pwRules.every(r => r.ok);
  const pwMatch = password === confirmPassword && confirmPassword.length > 0;

  const createUser = async (userId: string, data: { email:string; displayName:string }) => {
    const user: UserData = {
      id: userId, email: data.email, displayName: data.displayName,
      role: 'user', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      settings: { theme:'light', notifications:true, language:'bg', emailNotifications:true },
      preferences: { weeklyReport:true, dailyReminder:true, reminderTime:'09:00' },
    };
    const users: UserData[] = JSON.parse(localStorage.getItem('users')||'[]');
    if (!users.some(u=>u.email===user.email)) { users.push(user); localStorage.setItem('users', JSON.stringify(users)); }
    return user;
  };

  const initCollections = (userId: string) => {
    const now = new Date().toISOString();
    localStorage.setItem(`journal_${userId}`,  JSON.stringify({ userId, entries:[], createdAt:now }));
    localStorage.setItem(`therapy_${userId}`,  JSON.stringify({ userId, dailyTasks:[], completedTasks:[], streak:0, lastActive:now, createdAt:now }));
    localStorage.setItem(`gallery_${userId}`,  JSON.stringify({ userId, artworks:[], createdAt:now }));
    localStorage.setItem(`history_${userId}`,  JSON.stringify({ userId, activities:[{ type:'account_created', timestamp:now, description:'Акаунтът беше създаден' }], moodEntries:[], achievements:[], createdAt:now }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName||!email||!password||!confirmPassword) { setError('Моля, попълнете всички полета'); return; }
    if (!pwValid)  { setError('Паролата не отговаря на изискванията'); return; }
    if (!pwMatch)  { setError('Паролите не съвпадат'); return; }
    if (!acceptTerms) { setError('Трябва да приемете условията за ползване'); return; }
    if (parseInt(mathAnswer) !== mathQ.answer) {
      setMathError(true); setMathQ(genMath()); setMathAnswer('');
      setError('Грешен отговор на проверката. Нова задача е генерирана.'); return;
    }
    setMathError(false);
    try {
      setError(''); setLoading(true);
      const credential = await signup(email, password, displayName);
      const userId = credential.user?.uid;
      if (!userId) throw new Error('Грешка при създаване');
      await createUser(userId, { email, displayName });
      initCollections(userId);
      localStorage.setItem('currentUser', JSON.stringify({ id:userId, email, displayName, role:'user', status:'active' }));
      navigate('/dashboard');
    } catch (err: any) {
      const messages: Record<string,string> = {
        'auth/email-already-in-use': 'Този имейл вече е регистриран',
        'auth/weak-password':        'Паролата трябва да е поне 6 символа',
        'auth/invalid-email':        'Невалиден имейл адрес',
      };
      setError(messages[err.code]||'Грешка при регистрация. Опитайте отново.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', background: `linear-gradient(160deg, ${C.bgWarm} 0%, #EDF5EF 60%, #F0EBF7 100%)`, fontFamily: "'Nunito', sans-serif", position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes slideUp     { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
        @keyframes blobDrift   { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.08) translateY(-12px)} }
        @keyframes spinAnim    { to{transform:rotate(360deg)} }
        @keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes ruleSlide   { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }

        .su-rainbow {
          height: 4px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
        .su-card    { animation: slideUp .55s cubic-bezier(.22,1,.36,1) both; }
        .su-float   { animation: gentleFloat 4.5s ease-in-out infinite; }
        .su-sway-l  { animation: softSway 5s ease-in-out infinite;    transform-origin: bottom center; }
        .su-sway-r  { animation: softSway 5s ease-in-out infinite .8s;transform-origin: bottom center; }
        .blob-drift { animation: blobDrift 7s ease-in-out infinite; }
        .su-spin    { animation: spinAnim .8s linear infinite; }
        .su-shake   { animation: shake .38s ease-out; }
        .su-rule    { animation: ruleSlide .22s ease both; }

        .su-input { transition: border-color .2s, box-shadow .2s; }
        .su-input:focus { outline: none; border-color: #A3B995 !important; box-shadow: 0 0 0 3px rgba(163,185,149,.2); }
        .su-input::placeholder { color: #B8CECE; }

        .su-btn { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, filter .15s; cursor: pointer; }
        .su-btn:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(232,128,103,.42) !important; filter: brightness(1.05); }
        .su-btn:active:not(:disabled) { transform: scale(.97); }
        .su-btn:disabled { opacity: .45; cursor: not-allowed; }

        .su-link { transition: color .18s; }
        .su-link:hover { color: #C05A3E !important; text-decoration: underline; }

        .su-back { transition: transform .2s, color .2s; display: inline-flex; align-items: center; gap: 5px; }
        .su-back:hover { transform: translateX(-4px); color: #E88067 !important; }

        .su-eye { transition: background .18s; cursor: pointer; }
        .su-eye:hover { background: rgba(163,185,149,.15) !important; }
      `}</style>

      {/* Blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-drift" style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, #FCCAAB, transparent 68%)', opacity: .2 }}/>
        <div className="blob-drift" style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, #D4E3DE, transparent 68%)', opacity: .2, animationDelay: '2s' }}/>
      </div>

      {/* Corner sprigs */}
      <div className="su-sway-l" style={{ position: 'absolute', top: 28, left: 28, opacity: .22 }}>
        <svg width="52" height="52" viewBox="0 0 18 18" fill="none">
          <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
          <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
        </svg>
      </div>
      <div className="su-sway-r" style={{ position: 'absolute', bottom: 28, right: 28, opacity: .22 }}>
        <svg width="52" height="52" viewBox="0 0 18 18" fill="none" style={{ transform:'scaleX(-1)' }}>
          <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
          <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
        </svg>
      </div>

      {/* CARD */}
      <div className="su-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, background: 'white', borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 80px rgba(44,62,53,.16), 0 4px 16px rgba(44,62,53,.08)' }}>

        <div className="su-rainbow"/>

        <div style={{ padding: '32px 36px 28px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
            <div className="su-float" style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, background: `linear-gradient(135deg, ${C.salmon}, ${C.peach})`, boxShadow: `0 8px 28px rgba(232,128,103,.42)` }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C7.03 3 3 7.03 3 12c0 2.5 1 4.77 2.63 6.43.38.39.99.41 1.38.04.29-.28.37-.7.2-1.07C6.44 16.3 6 15.19 6 14c0-3.31 2.69-6 6-6 .96 0 1.87.23 2.67.63.47.24 1.04.13 1.39-.28l1.73-1.97c.38-.43.34-1.09-.1-1.47C16.3 3.71 14.24 3 12 3z" fill="white" opacity=".9"/>
                <circle cx="17.5" cy="15" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="17.5" cy="15" r="1.3" fill="white"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '1.9rem', fontWeight: 700, color: C.forest, margin: 0, lineHeight: 1.1 }}>
              Регистрация
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7, opacity: .48 }}>
              <span className="su-sway-l" style={{ display: 'inline-block' }}><TinyFlower/></span>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.mist, margin: 0 }}>
                Започнете пътуването
              </p>
              <span className="su-sway-r" style={{ display: 'inline-block' }}><TinyFlower/></span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="su-shake" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF0EB', border: `1.5px solid #FCCAAB`, borderRadius: 14, padding: '11px 14px', marginBottom: 18, fontSize: '0.84rem', fontWeight: 600, color: C.salmon }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>

            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <User size={12} style={{ color: C.sage }}/> Пълно име
              </label>
              <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Вашето пълно име" required disabled={loading}
                className="su-input"
                style={{ padding: '11px 15px', borderRadius: 13, fontSize: '0.88rem', border: `2px solid ${C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box' }}/>
            </div>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Mail size={12} style={{ color: C.sage }}/> Имейл адрес
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="вашият@имейл.com" required disabled={loading}
                className="su-input"
                style={{ padding: '11px 15px', borderRadius: 13, fontSize: '0.88rem', border: `2px solid ${C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box' }}/>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Lock size={12} style={{ color: C.sage }}/> Парола
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Поне 6 символа" required disabled={loading}
                  className="su-input"
                  style={{ padding: '11px 44px 11px 15px', borderRadius: 13, fontSize: '0.88rem', border: `2px solid ${C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box' }}/>
                <button type="button" disabled={loading} onClick={() => setShowPassword(v => !v)}
                  className="su-eye" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>

              {/* Password rules checklist */}
              {password.length > 0 && (
                <div style={{ background: C.bgWarm, border: `1.5px solid ${C.mistLt}`, borderRadius: 13, padding: '10px 13px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pwRules.map((r, i) => (
                    <div key={i} className="su-rule" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 600, color: r.ok ? C.sage : C.stone, animationDelay: `${i*0.05}s` }}>
                      <div style={{ width: 17, height: 17, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: r.ok ? C.sage : C.mistLt, transition: 'background .25s' }}>
                        {r.ok ? <Check size={9} color="white"/> : <X size={9} color={C.stone}/>}
                      </div>
                      {r.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Lock size={12} style={{ color: C.sage }}/> Потвърди парола
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Повторете паролата" required disabled={loading}
                  className="su-input"
                  style={{ padding: '11px 44px 11px 15px', borderRadius: 13, fontSize: '0.88rem', border: `2px solid ${confirmPassword.length > 0 ? (pwMatch ? C.sage : C.salmon) : C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box', transition: 'border-color .2s' }}/>
                <button type="button" disabled={loading} onClick={() => setShowConfirm(v => !v)}
                  className="su-eye" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showConfirm ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: pwMatch ? C.sage : C.salmon }}>
                  {pwMatch ? '✓ Паролите съвпадат' : '✗ Паролите не съвпадат'}
                </span>
              )}
            </div>

            {/* Math captcha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                🌿 Проверка — реши задачата
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 13, background: `linear-gradient(135deg, ${C.cream}, ${C.mistLt})`, border: `1.5px solid #FCCAAB` }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', fontWeight: 700, color: C.forest, flex: 1 }}>
                  {mathQ.question}
                </span>
                <input
                  type="number"
                  value={mathAnswer}
                  onChange={e => { setMathAnswer(e.target.value); setMathError(false); }}
                  placeholder="?"
                  disabled={loading}
                  className="su-input"
                  style={{ width: 72, padding: '8px 10px', borderRadius: 10, fontSize: '0.9rem', fontWeight: 700, textAlign: 'center', border: `2px solid ${mathError ? C.salmon : C.mistLt}`, color: C.forest, background: 'white', fontFamily: "'Nunito', sans-serif", boxSizing: 'border-box' }}
                />
              </div>
              {mathError && (
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: C.salmon }}>✗ Грешен отговор — нова задача е генерирана</span>
              )}
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: C.stone, lineHeight: 1.5 }}>
              <div
                role="checkbox" aria-checked={acceptTerms} tabIndex={0}
                onClick={() => !loading && setAcceptTerms(v => !v)}
                onKeyDown={e => e.key === ' ' && !loading && setAcceptTerms(v => !v)}
                style={{ width: 20, height: 20, borderRadius: 7, border: `2px solid ${acceptTerms ? C.sage : C.mistLt}`, background: acceptTerms ? C.sage : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', flexShrink: 0, marginTop: 2 }}>
                {acceptTerms && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <span>
                Съгласявам се с{' '}
                <Link to="/terms" style={{ color: C.salmon, fontWeight: 800, textDecoration: 'none' }}>условията за ползване</Link>
                {' '}и{' '}
                <Link to="/privacy" style={{ color: C.salmon, fontWeight: 800, textDecoration: 'none' }}>политиката за поверителност</Link>
              </span>
            </label>

            {/* Submit */}
            <button type="submit"
              disabled={loading || !pwValid || !pwMatch || !acceptTerms}
              className="su-btn"
              style={{ padding: '13px', borderRadius: 14, fontSize: '0.95rem', fontWeight: 800, color: 'white', background: `linear-gradient(135deg, ${C.salmon}, ${C.peach})`, border: 'none', boxShadow: `0 6px 20px rgba(232,128,103,.32)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? (
                <>
                  <div className="su-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.35)', borderTopColor: 'white' }}/>
                  Регистрация...
                </>
              ) : 'Регистрирай се'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1.5px solid #F0EBE3`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: '0.88rem', color: C.stone, margin: 0 }}>
              Вече имате акаунт?{' '}
              <Link to="/login" className="su-link" style={{ fontWeight: 800, color: C.salmon, textDecoration: 'none' }}>Влезте</Link>
            </p>
            <Link to="/" className="su-back" style={{ fontSize: '0.82rem', color: C.mist, textDecoration: 'none', justifyContent: 'center' }}>
              ← Назад към началото
            </Link>
          </div>

          {/* Floral divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, opacity: .28 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.sage})` }}/>
            <span className="su-sway-l" style={{ display: 'inline-block' }}><Sprig/></span>
            <TinyFlower/><TinyFlower/>
            <span className="su-sway-r" style={{ display: 'inline-block' }}><Sprig flip/></span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.sage}, transparent)` }}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;