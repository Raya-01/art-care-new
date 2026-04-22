import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useAuth } from '../contexts/AuthContext';
import QuoteDisplay from '../utils/QuoteDisplay';
import { Sparkles, X } from 'lucide-react';
 
/* ── tiny botanical SVGs ──────────────────────────────────────────────────── */
const TinyFlower = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);
 
const Sprig = () => (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.55"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.55"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.35"/>
  </svg>
);
 
const Layout: React.FC = () => {
  const { currentUser, currentUserData } = useAuth();
  const location  = useLocation();
  const navigate  = useNavigate();
 
  const [showWelcomeQuote,    setShowWelcomeQuote]    = useState(false);
  const [showTutorialPrompt,  setShowTutorialPrompt]  = useState(false);
  const [hasSeenTutorial,     setHasSeenTutorial]     = useState(false);
  const [welcomeDismissing,   setWelcomeDismissing]   = useState(false);
  const [tutorialDismissing,  setTutorialDismissing]  = useState(false);
 
  /* tutorial prompt — 3s after first login */
  useEffect(() => {
    if (currentUser && !hasSeenTutorial) {
      const seen = localStorage.getItem(`artcare_tutorial_seen_${currentUser.uid}`);
      if (!seen) {
        const t = setTimeout(() => setShowTutorialPrompt(true), 3000);
        return () => clearTimeout(t);
      }
    }
  }, [currentUser, hasSeenTutorial]);
 
  /* welcome quote — once per page per user */
  useEffect(() => {
    if (currentUser) {
      const key = `artcare_welcome_${location.pathname}_${currentUser.uid}`;
      if (!localStorage.getItem(key)) {
        setShowWelcomeQuote(true);
        localStorage.setItem(key, 'true');
        const t = setTimeout(() => dismissWelcome(), 7000);
        return () => clearTimeout(t);
      }
    } else {
      setShowWelcomeQuote(false);
    }
  }, [location.pathname, currentUser]);
 
  /* track tutorial seen */
  useEffect(() => {
    if (currentUser) {
      const seen = localStorage.getItem(`artcare_tutorial_seen_${currentUser.uid}`);
      if (seen) setHasSeenTutorial(true);
    }
  }, [currentUser]);
 
  const dismissWelcome = () => {
    setWelcomeDismissing(true);
    setTimeout(() => { setShowWelcomeQuote(false); setWelcomeDismissing(false); }, 350);
  };
 
  const dismissTutorial = () => {
    setTutorialDismissing(true);
    setTimeout(() => {
      setShowTutorialPrompt(false);
      setTutorialDismissing(false);
    }, 300);
    if (currentUser) {
      localStorage.setItem(`artcare_tutorial_seen_${currentUser.uid}`, 'true');
      setHasSeenTutorial(true);
    }
  };
 
  const startTutorial = () => {
    dismissTutorial();
    navigate('/tutorial');
  };
 
  const getPageTitle = () => {
    const map: Record<string, string> = {
      '/':          'Начало',
      '/therapy':   'Дневни Задачи',
      '/journal':   'Личен Дневник',
      '/gallery':   'Лична Галерия',
      '/history':   'История',
      '/profile':   'Профил',
      '/settings':  'Настройки',
      '/tutorial':  'Ръководство',
    };
    return map[location.pathname] || 'ARTCARE';
  };
 
  const getDisplayName = () =>
    currentUserData?.displayName || currentUser?.displayName || 'Потребител';
 
  const isPublicRoute = [
    '/login', '/signup', '/forgot-password', '/terms', '/privacy',
  ].includes(location.pathname);
 
  /* ── Public route wrapper (no header/footer) ────────────────────────────── */
  if (isPublicRoute) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#FAF5EF 0%,#EEF4F2 100%)' }}>
        <main>
          <Outlet />
        </main>
      </div>
    );
  }
 
  /* ── Main app layout ────────────────────────────────────────────────────── */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Nunito:wght@400;600;700;800&display=swap');
 
        /* ── Keyframes ── */
        @keyframes pageFadeIn   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(44px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideOutRight{ from{opacity:1;transform:translateX(0)}    to{opacity:0;transform:translateX(44px)} }
        @keyframes fadeInScale  { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes fadeOutScale { from{opacity:1;transform:scale(1)}  to{opacity:0;transform:scale(.96)} }
        @keyframes sparkle      { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.15) rotate(14deg)} }
        @keyframes softSway     { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes borderFlow   { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes softPulse    { 0%,100%{opacity:1} 50%{opacity:0.5} }
 
        /* ── Page content ── */
        .ly-page { animation: pageFadeIn .45s ease-out both; }
 
        /* ── Welcome modal ── */
        .ly-welcome-enter { animation: fadeInScale .35s cubic-bezier(.34,1.56,.64,1) both; }
        .ly-welcome-exit  { animation: fadeOutScale .3s ease forwards; }
 
        /* ── Tutorial prompt ── */
        .ly-tutorial-enter { animation: slideInRight .38s cubic-bezier(.34,1.56,.64,1) both; }
        .ly-tutorial-exit  { animation: slideOutRight .28s ease forwards; }
 
        /* ── Sparkle icon ── */
        .ly-sparkle { animation: sparkle 2.2s ease-in-out infinite; }
 
        /* ── Sway ── */
        .ly-sway-1 { animation: softSway 4s ease-in-out infinite; transform-origin: bottom center; }
        .ly-sway-2 { animation: softSway 4s ease-in-out infinite .8s; transform-origin: bottom center; }
 
        /* ── Gradient bar ── */
        .ly-grad-bar {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
 
        /* ── Pulse dot ── */
        .ly-pulse { animation: softPulse 2.5s ease-in-out infinite; }
 
        /* ── Buttons ── */
        .ly-btn-primary {
          font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 18px; border-radius: 14px; border: none; cursor: pointer;
          color: white; background: linear-gradient(135deg,#A3B995,#A8BBB9);
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
        }
        .ly-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(163,185,149,0.35); }
 
        .ly-btn-ghost {
          font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 18px; border-radius: 14px; cursor: pointer;
          color: #5C6E6A; background: transparent;
          border: 1.5px solid #D4E3DE;
          transition: transform .2s, border-color .2s, color .2s;
        }
        .ly-btn-ghost:hover { transform: translateY(-2px); border-color: #A3B995; color: #2C3E35; }
 
        .ly-close-btn {
          width: 30px; height: 30px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: none; cursor: pointer;
          color: #A8BBB9;
          transition: background .2s, color .2s, transform .2s;
        }
        .ly-close-btn:hover { background: #FFF0EB; color: #E88067; transform: rotate(90deg) scale(1.1); }
 
        /* ── Overlay backdrop ── */
        .ly-backdrop {
          position: fixed; inset: 0; z-index: 50;
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
          background: rgba(250,245,239,0.88);
          backdrop-filter: blur(14px);
        }
      `}</style>
 
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'linear-gradient(160deg,#FAF5EF 0%,#EEF4F2 100%)', fontFamily: "'Nunito', sans-serif" }}>
 
        {currentUser && <Header />}
 
        {/* ══ Tutorial prompt ═══════════════════════════════════════════════ */}
        {showTutorialPrompt && currentUser && (
          <div
            className={`${tutorialDismissing ? 'ly-tutorial-exit' : 'ly-tutorial-enter'}`}
            style={{
              position: 'fixed', top: 88, right: 20, zIndex: 50,
              width: 300, maxWidth: 'calc(100vw - 2rem)',
            }}
          >
            <div style={{
              background: 'white',
              borderRadius: 24,
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(44,62,53,0.13)',
              border: '1.5px solid #F9DDB8',
            }}>
              {/* top accent bar */}
              <div className="ly-grad-bar" />
 
              <div style={{ padding: '16px 18px 18px' }}>
 
                {/* header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 10,
                      background: 'linear-gradient(135deg,#FFF0EB,#F9DDB8)',
                      border: '1px solid #FCCAAB',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Sparkles size={17} className="ly-sparkle" style={{ color: '#E88067' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#A8BBB9', fontWeight: 700, margin: 0 }}>Добре дошли</p>
                      <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#2C3E35', margin: 0 }}>Първи стъпки</h3>
                    </div>
                  </div>
                  <button onClick={dismissTutorial} className="ly-close-btn" aria-label="Затвори">
                    <X size={14} />
                  </button>
                </div>
 
                {/* body */}
                <p style={{ fontSize: '0.84rem', lineHeight: 1.75, color: '#5C6E6A', margin: '0 0 14px' }}>
                  Здравей, <strong style={{ color: '#2C3E35' }}>{getDisplayName()}</strong>!
                  Искате ли кратко ръководство за функциите на ARTCARE?
                </p>
 
                {/* decorative flower row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, opacity: 0.5 }}>
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#F9DDB8)' }} />
                  <TinyFlower />
                  <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#F9DDB8,transparent)' }} />
                </div>
 
                {/* actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={startTutorial} className="ly-btn-primary">
                    <Sparkles size={14} /> Да, покажете ми
                  </button>
                  <button onClick={dismissTutorial} className="ly-btn-ghost">
                    По-късно
                  </button>
                </div>
 
              </div>
            </div>
          </div>
        )}
 
        {/* ══ Welcome quote modal ═══════════════════════════════════════════ */}
        {showWelcomeQuote && currentUser && (
          <div className="ly-backdrop" onClick={dismissWelcome}>
            <div
              className={welcomeDismissing ? 'ly-welcome-exit' : 'ly-welcome-enter'}
              style={{
                background: 'white',
                borderRadius: 28,
                padding: '36px 32px 28px',
                maxWidth: 440, width: '100%',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 28px 72px rgba(44,62,53,0.15)',
                border: '1.5px solid #F9DDB8',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* top gradient bar */}
              <div className="ly-grad-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
 
              {/* soft background blobs */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,#FCCAAB,transparent 70%)', opacity: 0.15 }} />
                <div style={{ position: 'absolute', bottom: -20, left: -20, width: 110, height: 110, borderRadius: '50%', background: 'radial-gradient(circle,#D4E3DE,transparent 70%)', opacity: 0.18 }} />
              </div>
 
              {/* close */}
              <button onClick={dismissWelcome} className="ly-close-btn" aria-label="Затвори"
                style={{ position: 'absolute', top: 14, right: 14, zIndex: 1 }}>
                <X size={15} />
              </button>
 
              {/* botanical corner decoration */}
              <div style={{ position: 'absolute', top: 10, left: 14, display: 'flex', gap: 3, opacity: 0.45 }}>
                <span className="ly-sway-1"><Sprig /></span>
                <span className="ly-sway-2"><Sprig /></span>
              </div>
 
              {/* quote */}
              <div style={{ position: 'relative', zIndex: 1 }}>
                <QuoteDisplay type="welcome" />
              </div>
 
              {/* footer strip */}
              <div style={{
                borderTop: '1.5px solid #F4EDE4',
                marginTop: 20, paddingTop: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                position: 'relative', zIndex: 1,
              }}>
                <TinyFlower />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#5C6E6A' }}>
                  Добре дошли в{' '}
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontStyle: 'italic',
                    background: 'linear-gradient(135deg,#E88067,#FBBD96)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {getPageTitle()}
                  </span>
                  ,{' '}{getDisplayName()}!
                </span>
                <TinyFlower />
              </div>
 
              {/* tap to dismiss hint */}
              <p style={{ textAlign: 'center', fontSize: '0.68rem', color: '#A8BBB9', marginTop: 10, marginBottom: 0 }}>
                Докоснете навсякъде, за да затворите
              </p>
            </div>
          </div>
        )}
 
        {/* ══ Page content ════════════════════════════════════════════════ */}
        <main
          style={{
            flex: 1,
            paddingTop: currentUser ? '72px' : '0',
          }}
        >
          <div
            key={location.pathname}
            className="ly-page"
            style={{ maxWidth: 1400, margin: '0 auto', width: '100%', padding: '24px 24px' }}
          >
            <Outlet />
          </div>
        </main>
 
        {currentUser && <Footer />}
      </div>
    </>
  );
};
 
export default Layout;