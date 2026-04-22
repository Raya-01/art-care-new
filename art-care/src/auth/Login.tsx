import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, X } from 'lucide-react';

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
    style={{ flexShrink: 0, transform: flip ? 'scaleX(-1)' : undefined, opacity: 0.55 }}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.5"/>
  </svg>
);

interface UserData {
  id: string; email: string; displayName: string;
  role: 'admin' | 'user'; status: 'active' | 'suspended';
  createdAt: string; updatedAt: string; lastLogin?: string;
  settings?: { theme: string; notifications: boolean; language: string; emailNotifications: boolean };
  preferences?: { weeklyReport: boolean; dailyReminder: boolean; reminderTime: string };
  collections?: { journal: string; therapy: string; gallery: string; history: string };
}

const Login = () => {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [rememberMe, setRememberMe]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [mounted, setMounted]           = useState(false);
  const [btnHover, setBtnHover]         = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = (location.state as any)?.from?.pathname || '/dashboard';

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('rememberedUser');
      if (saved) { const { email: e } = JSON.parse(saved); setEmail(e); setRememberMe(true); }
    } catch {}
  }, []);

  const getUserFromDatabase = (email: string): UserData | null => {
    try {
      const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
      return users.find(u => u.email === email) || null;
    } catch { return null; }
  };

  const handleSuccessfulLogin = async (userData: UserData) => {
    if (userData.status === 'suspended') {
      setError('Вашият акаунт е деактивиран. Свържете се с администратор.');
      setLoading(false); return;
    }
    localStorage.setItem('currentUser', JSON.stringify({
      id: userData.id, email: userData.email, displayName: userData.displayName,
      role: userData.role, status: userData.status,
      settings: userData.settings, collections: userData.collections,
    }));
    if (rememberMe) localStorage.setItem('rememberedUser', JSON.stringify({ email: userData.email, timestamp: new Date().toISOString() }));
    else localStorage.removeItem('rememberedUser');
    const users: UserData[] = JSON.parse(localStorage.getItem('users') || '[]');
    const idx = users.findIndex(u => u.id === userData.id);
    if (idx !== -1) { users[idx].lastLogin = new Date().toISOString(); users[idx].updatedAt = new Date().toISOString(); localStorage.setItem('users', JSON.stringify(users)); }
    navigate(userData.role === 'admin' ? '/admin' : from, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Моля, попълнете всички полета'); return; }
    if (password.length < 6) { setError('Паролата трябва да е поне 6 символа'); return; }
    try {
      setError(''); setLoading(true);
      const credential = await login(email, password);
      let userData = getUserFromDatabase(email);
      if (!userData && credential?.user?.uid) {
        userData = {
          id: credential.user.uid, email: credential.user.email || email,
          displayName: credential.user.displayName || email.split('@')[0],
          role: 'user', status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          settings: { theme: 'light', notifications: true, language: 'bg', emailNotifications: true },
          preferences: { weeklyReport: true, dailyReminder: true, reminderTime: '09:00' },
        };
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(userData); localStorage.setItem('users', JSON.stringify(users));
      }
      if (userData) await handleSuccessfulLogin(userData);
      else throw new Error('Потребителят не е намерен');
    } catch (err: any) {
      const messages: Record<string, string> = {
        'auth/invalid-email': 'Невалиден имейл адрес',
        'auth/user-disabled': 'Акаунтът е деактивиран',
        'auth/user-not-found': 'Няма потребител с този имейл',
        'auth/wrong-password': 'Грешна парола',
        'auth/invalid-credential': 'Невалиден имейл или парола',
        'auth/too-many-requests': 'Твърде много опити. Опитайте по-късно.',
      };
      setError(err.message?.includes('деактивиран') ? err.message : (messages[err.code] || 'Грешка при влизане. Опитайте отново.'));
    } finally { setLoading(false); }
  };

  const clearRemembered = () => { localStorage.removeItem('rememberedUser'); setEmail(''); setRememberMe(false); };
  const hasRemembered = mounted && !!localStorage.getItem('rememberedUser');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: `linear-gradient(160deg, ${C.bgWarm} 0%, #EDF5EF 60%, #F0EBF7 100%)`, fontFamily: "'Nunito', sans-serif", position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes slideUp     { from{opacity:0;transform:translateY(28px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-7deg)} 50%{transform:rotate(7deg)} }
        @keyframes blobDrift   { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.08) translateY(-12px)} }
        @keyframes spinAnim    { to{transform:rotate(360deg)} }
        @keyframes shake       { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }

        .login-rainbow {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
        .login-card   { animation: slideUp .55s cubic-bezier(.22,1,.36,1) both; }
        .login-float  { animation: gentleFloat 4.5s ease-in-out infinite; }
        .login-sway-l { animation: softSway 5s ease-in-out infinite;    transform-origin: bottom center; }
        .login-sway-r { animation: softSway 5s ease-in-out infinite .8s;transform-origin: bottom center; }
        .blob-drift   { animation: blobDrift 7s ease-in-out infinite; }
        .login-spin   { animation: spinAnim .8s linear infinite; }
        .login-shake  { animation: shake .38s ease-out; }
        .login-fadein { animation: fadeIn .3s ease both; }

        .login-input { transition: border-color .2s, box-shadow .2s; }
        .login-input:focus { outline: none; border-color: #A3B995 !important; box-shadow: 0 0 0 3px rgba(163,185,149,.2); }
        .login-input::placeholder { color: #B8CECE; }

        .login-btn-primary { transition: transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s, filter .15s; cursor: pointer; }
        .login-btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(232,128,103,.42) !important; filter: brightness(1.05); }
        .login-btn-primary:active:not(:disabled) { transform: scale(.97); }
        .login-btn-primary:disabled { opacity: .55; cursor: not-allowed; }

        .login-link { transition: color .18s; }
        .login-link:hover { color: #C05A3E !important; text-decoration: underline; }

        .login-back { transition: transform .2s, color .2s; display: inline-flex; align-items: center; gap: 5px; }
        .login-back:hover { transform: translateX(-4px); color: #E88067 !important; }

        .login-eye { transition: background .18s; cursor: pointer; }
        .login-eye:hover { background: rgba(163,185,149,.15) !important; }
      `}</style>

      {/* Ambient background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div className="blob-drift" style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, #FCCAAB, transparent 68%)', opacity: .22 }}/>
        <div className="blob-drift" style={{ position: 'absolute', bottom: -80, left: -80, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, #D4E3DE, transparent 68%)', opacity: .22, animationDelay: '1.5s' }}/>
        <div className="blob-drift" style={{ position: 'absolute', top: '40%', left: '10%', width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, #A3B995, transparent 68%)', opacity: .1, animationDelay: '3s' }}/>
      </div>

      {/* Corner botanical sprigs */}
      <div className="login-sway-l" style={{ position: 'absolute', top: 32, left: 32, opacity: .25 }}>
        <svg width="56" height="56" viewBox="0 0 18 18" fill="none">
          <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
          <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
          <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.5"/>
        </svg>
      </div>
      <div className="login-sway-r" style={{ position: 'absolute', bottom: 32, right: 32, opacity: .25 }}>
        <svg width="56" height="56" viewBox="0 0 18 18" fill="none" style={{ transform: 'scaleX(-1)' }}>
          <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
          <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
        </svg>
      </div>

      {/* CARD */}
      <div className="login-card" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, background: 'white', borderRadius: 28, overflow: 'hidden', boxShadow: '0 24px 80px rgba(44,62,53,.16), 0 4px 16px rgba(44,62,53,.08)' }}>

        {/* Rainbow stripe */}
        <div className="login-rainbow" style={{ height: 4 }}/>

        <div style={{ padding: '36px 36px 32px' }}>

          {/* Logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <div className="login-float" style={{ width: 68, height: 68, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, background: `linear-gradient(135deg, ${C.salmon}, ${C.peach})`, boxShadow: `0 8px 28px rgba(232,128,103,.42)` }}>
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M12 3C7.03 3 3 7.03 3 12c0 2.5 1 4.77 2.63 6.43.38.39.99.41 1.38.04.29-.28.37-.7.2-1.07C6.44 16.3 6 15.19 6 14c0-3.31 2.69-6 6-6 .96 0 1.87.23 2.67.63.47.24 1.04.13 1.39-.28l1.73-1.97c.38-.43.34-1.09-.1-1.47C16.3 3.71 14.24 3 12 3z" fill="white" opacity=".9"/>
                <circle cx="17.5" cy="15" r="3.5" stroke="white" strokeWidth="1.8" fill="none"/>
                <circle cx="17.5" cy="15" r="1.3" fill="white"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '2rem', fontWeight: 700, color: C.forest, margin: 0, lineHeight: 1.1 }}>
              Вход в ArtCare
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, opacity: .5 }}>
              <span className="login-sway-l" style={{ display: 'inline-block' }}><TinyFlower/></span>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.mist, margin: 0 }}>
                Рисуването като терапия
              </p>
              <span className="login-sway-r" style={{ display: 'inline-block' }}><TinyFlower/></span>
            </div>
          </div>

          {/* Remembered chip */}
          {hasRemembered && (
            <div className="login-fadein" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.cream, border: `1px solid #FCCAAB`, borderRadius: 14, padding: '10px 14px', marginBottom: 16, fontSize: '0.84rem', fontWeight: 600, color: C.stone }}>
              <span>👤 Запомнен: {email}</span>
              <button onClick={clearRemembered} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.salmon, display: 'flex', alignItems: 'center', padding: 2, borderRadius: '50%', transition: 'transform .2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(90deg)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                <X size={13}/>
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="login-shake login-fadein" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FFF0EB', border: `1.5px solid #FCCAAB`, borderRadius: 14, padding: '11px 14px', marginBottom: 18, fontSize: '0.84rem', fontWeight: 600, color: C.salmon }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }}/>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>

            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Mail size={13} style={{ color: C.sage }}/> Имейл адрес
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="вашият@имейл.com" required disabled={loading}
                className="login-input"
                style={{ padding: '12px 16px', borderRadius: 14, fontSize: '0.9rem', border: `2px solid ${C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box' }}/>
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.8rem', fontWeight: 800, color: C.forest, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                <Lock size={13} style={{ color: C.sage }}/> Парола
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Въведете паролата си" required disabled={loading}
                  className="login-input"
                  style={{ padding: '12px 46px 12px 16px', borderRadius: 14, fontSize: '0.9rem', border: `2px solid ${C.mistLt}`, color: C.forest, background: C.bgWarm, fontFamily: "'Nunito', sans-serif", width: '100%', boxSizing: 'border-box' }}/>
                <button type="button" disabled={loading} onClick={() => setShowPassword(v => !v)}
                  className="login-eye"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', color: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, color: C.stone }}>
                <div
                  role="checkbox" aria-checked={rememberMe} tabIndex={0}
                  onClick={() => !loading && setRememberMe(v => !v)}
                  onKeyDown={e => e.key === ' ' && !loading && setRememberMe(v => !v)}
                  style={{ width: 20, height: 20, borderRadius: 7, border: `2px solid ${rememberMe ? C.sage : C.mistLt}`, background: rememberMe ? C.sage : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s', flexShrink: 0 }}>
                  {rememberMe && <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                Запомни ме
              </label>
              <Link to="/forgot-password" className="login-link" style={{ fontSize: '0.84rem', fontWeight: 700, color: C.salmon, textDecoration: 'none' }}>
                Забравена парола?
              </Link>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="login-btn-primary"
              style={{ padding: '14px', borderRadius: 14, fontSize: '0.95rem', fontWeight: 800, color: 'white', background: `linear-gradient(135deg, ${C.salmon}, ${C.peach})`, border: 'none', boxShadow: `0 6px 20px rgba(232,128,103,.32)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              {loading ? (
                <>
                  <div className="login-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,.35)', borderTopColor: 'white' }}/>
                  Влизане...
                </>
              ) : 'Влез'}
            </button>
          </form>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 22, borderTop: `1.5px solid #F0EBE3`, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: '0.88rem', color: C.stone, margin: 0 }}>
              Нямате акаунт?{' '}
              <Link to="/signup" className="login-link" style={{ fontWeight: 800, color: C.salmon, textDecoration: 'none' }}>Регистрирайте се</Link>
            </p>
            <Link to="/" className="login-back" style={{ fontSize: '0.82rem', color: C.mist, textDecoration: 'none', justifyContent: 'center' }}>
              ← Назад към началото
            </Link>
          </div>

          {/* Floral divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, opacity: .28 }}>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${C.sage})` }}/>
            <span className="login-sway-l" style={{ display: 'inline-block' }}><Sprig/></span>
            <TinyFlower/><TinyFlower/>
            <span className="login-sway-r" style={{ display: 'inline-block' }}><Sprig flip/></span>
            <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${C.sage}, transparent)` }}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;