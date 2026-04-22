import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Mail, Phone, MapPin,
  Facebook, Instagram, Youtube,
  CheckCircle, AlertCircle, ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/* ── Same botanical SVGs as Header ─────────────────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="28" height="28" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.65"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.65"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.4"/>
  </svg>
);

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={style}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

/* ── Wavy top edge ──────────────────────────────────────────────────────────── */
const WaveTop = () => (
  <svg viewBox="0 0 1440 48" preserveAspectRatio="none" width="100%" height="48"
    style={{ display: 'block', marginBottom: -2 }}>
    <path
      d="M0,24 C180,48 360,0 540,24 C720,48 900,0 1080,24 C1260,48 1380,12 1440,24 L1440,48 L0,48 Z"
      fill="#2C3E35"
    />
  </svg>
);

const Footer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const currentYear = new Date().getFullYear();
  const [email,  setEmail]  = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const footerLinks = [
    { name: 'Начало',        path: '/' },
    { name: 'Дневни Задачи', path: '/therapy' },
    { name: 'Дневник',       path: '/journal' },
    { name: 'Галерия',       path: '/gallery' },
    { name: 'История',       path: '/history' },
    ...(isAuthenticated ? [{ name: 'Профил', path: '/profile' }] : []),
    { name: 'Настройки',     path: '/settings' },
  ];

  const legalLinks = [
    { name: 'Поверителност', path: '/privacy' },
    { name: 'Условия',       path: '/terms' },
    { name: 'Бисквитки',     path: '/cookies' },
    { name: 'ЧЗВ',           path: '/faq' },
    { name: 'Контакти',      path: '/contact' },
    { name: 'За нас',        path: '/about' },
  ];

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }
    setStatus('loading');
    await new Promise(r => setTimeout(r, 1200));
    setStatus('success');
    setEmail('');
    setTimeout(() => setStatus('idle'), 3500);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        /* ── Keyframes ── */
        @keyframes shimmer    { 0%,100%{background-position:0%}   50%{background-position:100%} }
        @keyframes shimmer2   { 0%,100%{background-position:100%} 50%{background-position:0%} }
        @keyframes softPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.88)} }
        @keyframes softSway   { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes heartbeat  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes riseUp     { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

        /* ── Footer logo — exact same as Header ── */
        .ft-logo-link {
          text-decoration: none;
          display: inline-flex; flex-direction: column; align-items: center; gap: 3px;
          position: relative;
        }
        .ft-logo-main {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 700; line-height: 1;
          display: flex; align-items: center; gap: 6px;
        }
        .ft-art {
          background: linear-gradient(135deg,#E88067 0%,#FBBD96 60%,#E88067 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          font-style: italic;
          transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
          animation: shimmer 5s ease infinite;
        }
        .ft-divider-dot {
          width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,#F9DDB8,#FBBD96);
          box-shadow: 0 0 8px rgba(249,221,184,0.9);
          animation: softPulse 3s ease infinite;
          transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
        }
        .ft-care {
          background: linear-gradient(135deg,#A3B995 0%,#A8BBB9 60%,#A3B995 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
          animation: shimmer2 5s ease infinite;
        }
        .ft-logo-link:hover .ft-art      { letter-spacing: 0.06em; }
        .ft-logo-link:hover .ft-care     { letter-spacing: 0.04em; }
        .ft-logo-link:hover .ft-divider-dot { transform: scale(1.6) rotate(45deg); }

        .ft-sprig-l, .ft-sprig-r {
          position: absolute; top: 50%;
          opacity: 0; pointer-events: none;
          transition: transform 0.5s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
        }
        .ft-sprig-l { left: -28px;  transform: translateY(-50%) rotate(40deg) scaleX(-1); }
        .ft-sprig-r { right: -28px; transform: translateY(-50%) rotate(-40deg); }
        .ft-logo-link:hover .ft-sprig-l { opacity: 1; transform: translateY(-60%) rotate(25deg) scaleX(-1); }
        .ft-logo-link:hover .ft-sprig-r { opacity: 1; transform: translateY(-60%) rotate(-25deg); }

        .ft-tagline {
          font-family: 'Nunito', sans-serif;
          font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.22em;
          color: rgba(163,185,149,0.7); font-weight: 700;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.3s, letter-spacing 0.5s;
        }
        .ft-tagline-flower {
          opacity: 0.5; display: flex; align-items: center;
          transition: opacity 0.3s, transform 0.5s cubic-bezier(.34,1.56,.64,1);
        }
        .ft-logo-link:hover .ft-tagline        { color: #E88067; letter-spacing: 0.28em; }
        .ft-logo-link:hover .ft-tagline-flower { opacity: 1; transform: rotate(20deg) scale(1.2); }

        /* ── Rainbow bar ── */
        .ft-rainbow {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }

        /* ── Sway for sprigs ── */
        .ft-sway-1 { animation: softSway 4s ease-in-out infinite; transform-origin: bottom center; }
        .ft-sway-2 { animation: softSway 4s ease-in-out infinite 0.7s; transform-origin: bottom center; }
        .ft-sway-3 { animation: softSway 4s ease-in-out infinite 1.4s; transform-origin: bottom center; }
        .ft-sway-4 { animation: softSway 4s ease-in-out infinite 2.1s; transform-origin: bottom center; }

        /* ── Nav links ── */
        .ft-nav-link {
          font-family: 'Nunito', sans-serif;
          font-size: 0.875rem; font-weight: 600;
          color: rgba(212,227,222,0.75); text-decoration: none;
          display: inline-flex; align-items: center; gap: 8px;
          transition: color 0.2s, transform 0.2s;
        }
        .ft-nav-link:hover { color: #FBBD96; transform: translateX(4px); }
        .ft-nav-link:hover .ft-nav-dot { background: #FBBD96; transform: scale(1.5); }
        .ft-nav-dot {
          width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0;
          background: rgba(163,185,149,0.5);
          transition: background 0.2s, transform 0.2s;
        }

        /* ── Social buttons ── */
        .ft-social {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(163,185,149,0.2);
          color: rgba(212,227,222,0.7); text-decoration: none;
          transition: all 0.25s cubic-bezier(.34,1.56,.64,1);
        }
        .ft-social:hover {
          background: linear-gradient(135deg,#E88067,#FBBD96);
          border-color: transparent; color: white;
          transform: translateY(-4px) scale(1.1);
          box-shadow: 0 8px 22px rgba(232,128,103,0.4);
        }

        /* ── Section titles ── */
        .ft-section-title {
          font-family: 'Nunito', sans-serif;
          font-size: 0.62rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.18em;
          color: #A3B995;
          display: flex; align-items: center; gap: 8px;
          padding-bottom: 12px; margin-bottom: 18px;
          border-bottom: 1px solid rgba(163,185,149,0.15);
        }

        /* ── Newsletter input ── */
        .ft-input {
          width: 100%; padding: 10px 12px 10px 34px;
          border-radius: 12px; border: 1.5px solid rgba(163,185,149,0.2);
          background: rgba(255,255,255,0.05);
          font-family: 'Nunito', sans-serif; font-size: 0.85rem;
          color: #D4E3DE;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ft-input::placeholder { color: rgba(168,187,185,0.4); }
        .ft-input:focus {
          outline: none;
          border-color: rgba(163,185,149,0.55);
          box-shadow: 0 0 0 3px rgba(163,185,149,0.14);
        }

        /* ── Newsletter button ── */
        .ft-btn {
          width: 100%; padding: 10px;
          border-radius: 12px; border: none; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
          color: white;
          background: linear-gradient(135deg,#A3B995,#A8BBB9);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, opacity 0.2s;
        }
        .ft-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(163,185,149,0.38);
        }
        .ft-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* ── Legal links ── */
        .ft-legal {
          font-family: 'Nunito', sans-serif;
          font-size: 0.72rem; font-weight: 600;
          color: rgba(163,185,149,0.5); text-decoration: none;
          transition: color 0.2s;
        }
        .ft-legal:hover { color: #FBBD96; }

        /* ── Back to top ── */
        .ft-top {
          position: fixed; bottom: 24px; right: 24px; z-index: 50;
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg,#E88067,#FBBD96);
          color: white; border: none; cursor: pointer;
          box-shadow: 0 4px 18px rgba(232,128,103,0.4);
          transition: transform 0.25s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
        }
        .ft-top:hover { transform: translateY(-4px) scale(1.1); box-shadow: 0 10px 28px rgba(232,128,103,0.5); }

        /* ── Heartbeat ── */
        .ft-hb { animation: heartbeat 2.2s ease-in-out infinite; display: inline-flex; align-items: center; }

        /* ── Responsive grid ── */
        .ft-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 40px;
        }
        @media(max-width: 860px) { .ft-main-grid { grid-template-columns: 1fr 1fr !important; } }
        @media(max-width: 540px) { .ft-main-grid { grid-template-columns: 1fr !important; } }

        .ft-bottom-row {
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        @media(max-width: 640px) { .ft-bottom-row { flex-direction: column; align-items: center; } }
      `}</style>

      {/* Wavy transition from page background into dark footer */}
      <WaveTop />

      <footer style={{ background: 'linear-gradient(170deg,#2C3E35 0%,#1A2B25 100%)', fontFamily: "'Nunito', sans-serif" }}>

        {/* Animated rainbow accent bar */}
        <div className="ft-rainbow" />

        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '56px 32px 0' }}>

          {/* ════ Brand centrepiece ══════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 48, gap: 0 }}>

            {/* Flanking botanical sprigs + logo */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 6 }}>
              <span className="ft-sway-1" style={{ opacity: 0.5 }}><Sprig /></span>
              <span className="ft-sway-2" style={{ opacity: 0.35 }}><Sprig style={{ transform: 'scaleX(-1)' }} /></span>

              {/* Logo — identical structure to Header */}
              <button onClick={scrollToTop} className="ft-logo-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <span className="ft-sprig-l"><Sprig /></span>
                <span className="ft-sprig-r"><Sprig /></span>
                <div className="ft-logo-main">
                  <span className="ft-art">Art</span>
                  <span className="ft-divider-dot" />
                  <span className="ft-care">Care</span>
                </div>
                <div className="ft-tagline">
                  <span className="ft-tagline-flower"><TinyFlower /></span>
                  Рисуването като терапия
                  <span className="ft-tagline-flower"><TinyFlower /></span>
                </div>
              </button>

              <span className="ft-sway-3" style={{ opacity: 0.35 }}><Sprig /></span>
              <span className="ft-sway-4" style={{ opacity: 0.5 }}><Sprig style={{ transform: 'scaleX(-1)' }} /></span>
            </div>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 36, marginTop: 20 }}>
              {([['5000+','Потребители'],['10K+','Задачи'],['98%','Доволни']] as [string,string][]).map(([n, l]) => (
                <div key={l} style={{ textAlign: 'center' }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: '1.7rem', fontWeight: 700,
                    background: 'linear-gradient(135deg,#FBBD96,#E88067)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                  }}>{n}</div>
                  <div style={{ fontSize: '0.62rem', color: 'rgba(163,185,149,0.65)', marginTop: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[
                { href: 'https://facebook.com/artcare',  label: 'Facebook',  Icon: Facebook },
                { href: 'https://instagram.com/artcare', label: 'Instagram', Icon: Instagram },
                { href: 'https://youtube.com/@artcare',  label: 'YouTube',   Icon: Youtube },
              ].map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="ft-social">
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* ── floral divider ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 44, opacity: 0.3 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#A3B995)' }} />
            <TinyFlower />
            <div style={{ width: 80, height: 1, background: '#A3B995' }} />
            <TinyFlower />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#A3B995,transparent)' }} />
          </div>

          {/* ════ 3-col content grid ════════════════════════════════════════ */}
          <div className="ft-main-grid">

            {/* ── Navigation ── */}
            <div>
              <div className="ft-section-title">
                <TinyFlower /> Навигация
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 9 }}>
                {footerLinks.map(link => (
                  <li key={link.path}>
                    <Link to={link.path} className="ft-nav-link">
                      <span className="ft-nav-dot" />
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Contact ── */}
            <div>
              <div className="ft-section-title">
                <TinyFlower /> Контакти
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { Icon: Mail,   label: 'podkrepa@artcare.bg', href: 'mailto:podkrepa@artcare.bg' },
                  { Icon: Phone,  label: '+359 88 123 4567',    href: 'tel:+35988123456' },
                  { Icon: MapPin, label: 'София, България',      href: undefined },
                ].map(({ Icon, label, href }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                      background: 'rgba(163,185,149,0.1)',
                      border: '1px solid rgba(163,185,149,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={13} style={{ color: '#A3B995' }} />
                    </div>
                    {href
                      ? <a href={href} className="ft-nav-link" style={{ fontSize: '0.82rem' }}>{label}</a>
                      : <span style={{ fontSize: '0.82rem', color: 'rgba(212,227,222,0.7)', fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>{label}</span>
                    }
                  </div>
                ))}

                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(163,185,149,0.5)', fontWeight: 700, marginBottom: 3 }}>Работно време</div>
                  <div style={{ fontSize: '0.83rem', color: 'rgba(212,227,222,0.75)', fontWeight: 600, fontFamily: "'Nunito',sans-serif" }}>Пон–Пет: 09:00 – 18:00</div>
                </div>
              </div>
            </div>

            {/* ── Newsletter ── */}
            <div>
              <div className="ft-section-title">
                <TinyFlower /> Бюлетин
              </div>
              <p style={{ fontSize: '0.84rem', lineHeight: 1.75, color: 'rgba(157,196,188,0.75)', marginBottom: 16, marginTop: 0 }}>
                Вдъхновяващи съвети и творчески идеи, доставени всяка седмица.
              </p>
              <form onSubmit={handleNewsletter} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'rgba(163,185,149,0.55)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Вашият имейл"
                    disabled={status === 'loading'}
                    className="ft-input"
                    style={{ opacity: status === 'loading' ? 0.5 : 1 }}
                  />
                </div>
                <button type="submit" disabled={status === 'loading'} className="ft-btn">
                  {status === 'loading' ? 'Изпращане…' : 'Абонирай се ✦'}
                </button>
                {status === 'success' && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#A3B995', margin: 0 }}>
                    <CheckCircle size={13} /> Успешно се абонирахте!
                  </p>
                )}
                {status === 'error' && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#E88067', margin: 0 }}>
                    <AlertCircle size={13} /> Моля, въведете валиден имейл
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* ════ Bottom bar ═════════════════════════════════════════════════ */}
          <div style={{ borderTop: '1px solid rgba(163,185,149,0.12)', margin: '40px 0 0', padding: '20px 0 28px' }}>
            <div className="ft-bottom-row">

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'rgba(163,185,149,0.5)', flexWrap: 'wrap' }}>
                <span>© {currentYear}</span>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '0.95rem', fontWeight: 700, color: '#FBBD96' }}>ArtCare</span>
                <span>· Всички права запазени ·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  Създадено с <span className="ft-hb" style={{ margin: '0 2px' }}><Heart size={11} fill="#E88067" style={{ color: '#E88067' }} /></span> в България
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 12px' }}>
                {legalLinks.map((link, i) => (
                  <React.Fragment key={link.path}>
                    <Link to={link.path} className="ft-legal">{link.name}</Link>
                    {i < legalLinks.length - 1 && (
                      <span style={{ color: 'rgba(163,185,149,0.2)', fontSize: '0.7rem' }}>·</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* Back to top */}
      <button onClick={scrollToTop} aria-label="Обратно нагоре" className="ft-top">
        <ChevronUp size={20} />
      </button>
    </>
  );
};

export default Footer;