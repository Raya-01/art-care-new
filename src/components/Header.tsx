import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu, X, User, LogOut, Settings,
  Home, BookOpen, Palette, History, Target, ChevronDown, Shield
} from 'lucide-react';

/* ── Tiny botanical SVGs ──────────────────────────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.5"/>
  </svg>
);

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={style}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

/* ── Component ────────────────────────────────────────────────────────────── */
const Header: React.FC = () => {
  const { currentUser, currentUserData, logout, isAdmin } = useAuth();
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const profileRef = useRef<HTMLDivElement>(null);

  // Desktop navigation items (without Gallery and History)
  const navItems = [
    { name: 'Начало',        path: '/',        icon: <Home size={15} /> },
    { name: 'Дневни Задачи', path: '/therapy', icon: <Target size={15} /> },
    { name: 'Дневник',       path: '/journal', icon: <BookOpen size={15} /> },
  ];

  // Items for profile dropdown (Gallery and History moved here)
  const profileMenuItems = [
    { name: 'Галерия',       path: '/gallery', icon: <Palette size={15} /> },
    { name: 'История',       path: '/history', icon: <History size={15} /> },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try { await logout(); navigate('/'); }
    catch (e) { console.error('Грешка при изход:', e); }
  };

  const getDisplayName = () =>
    currentUserData?.displayName || currentUser?.displayName ||
    currentUser?.email?.split('@')[0] || '';
  const getInitial = () => getDisplayName().charAt(0).toUpperCase();
  const isActive   = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        /* ── Logo ─────────────────────────────────────────────────────── */
        .cc-logo-link {
          text-decoration: none;
          display: inline-flex; flex-direction: column; align-items: center; gap: 3px;
          position: relative; flex-shrink: 0;
        }
        .cc-logo-main {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.1rem; font-weight: 700; line-height: 1; letter-spacing: 0.01em;
          display: flex; align-items: center; gap: 6px; position: relative;
        }
        .cc-art {
          background: linear-gradient(135deg,#E88067 0%,#FBBD96 60%,#E88067 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          font-style: italic;
          transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
          animation: shimmer 5s ease infinite;
        }
        .cc-divider {
          width: 5px; height: 5px; border-radius: 50%;
          background: linear-gradient(135deg,#F9DDB8,#FBBD96);
          box-shadow: 0 0 6px rgba(249,221,184,0.8);
          flex-shrink: 0;
          transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
          animation: softPulse 3s ease infinite;
        }
        .cc-care {
          background: linear-gradient(135deg,#A3B995 0%,#A8BBB9 60%,#A3B995 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
          animation: shimmer2 5s ease infinite;
        }
        .cc-logo-link:hover .cc-art    { letter-spacing: 0.06em; }
        .cc-logo-link:hover .cc-care   { letter-spacing: 0.04em; }
        .cc-logo-link:hover .cc-divider { transform: scale(1.6) rotate(45deg); }

        /* flanking sprigs */
        .cc-sprig-l, .cc-sprig-r {
          position: absolute; top: 50%;
          opacity: 0; pointer-events: none;
          transition: transform 0.5s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
        }
        .cc-sprig-l { left: -24px;  transform: translateY(-50%) rotate(40deg) scaleX(-1); }
        .cc-sprig-r { right: -24px; transform: translateY(-50%) rotate(-40deg); }
        .cc-logo-link:hover .cc-sprig-l { opacity: 1; transform: translateY(-60%) rotate(25deg) scaleX(-1); }
        .cc-logo-link:hover .cc-sprig-r { opacity: 1; transform: translateY(-60%) rotate(-25deg); }

        /* tagline */
        .cc-tagline {
          font-family: 'Nunito', sans-serif;
          font-size: 0.58rem; text-transform: uppercase; letter-spacing: 0.22em;
          color: #A8BBB9; font-weight: 700;
          display: flex; align-items: center; gap: 6px;
          transition: color 0.3s, letter-spacing 0.5s;
        }
        .cc-tagline-flower {
          opacity: 0.6; display: flex; align-items: center;
          transition: opacity 0.3s, transform 0.5s cubic-bezier(.34,1.56,.64,1);
        }
        .cc-logo-link:hover .cc-tagline         { color: #E88067; letter-spacing: 0.28em; }
        .cc-logo-link:hover .cc-tagline-flower   { opacity: 1; transform: rotate(20deg) scale(1.2); }

        /* ── Nav pills ─────────────────────────────────────────────────── */
        .cc-pill {
          font-family: 'Nunito', sans-serif;
          display: flex; align-items: center; gap: 6px;
          padding: 7px 16px; border-radius: 6px;
          font-size: 0.85rem; font-weight: 700;
          text-decoration: none; color: #5C6E6A;
          position: relative; overflow: hidden;
          border: 1.5px solid transparent; background: transparent;
          transition: color 0.2s, transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s, border-color 0.2s;
        }
        .cc-pill::before {
          content: ''; position: absolute; inset: 0; border-radius: 6px;
          background: linear-gradient(135deg,#FFF0EB,#FFF8F3);
          opacity: 0; transition: opacity 0.2s;
        }
        .cc-pill > * { position: relative; z-index: 1; }
        .cc-pill:hover { color: #E88067; border-color: #FCCAAB; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(232,128,103,0.2); }
        .cc-pill:hover::before { opacity: 1; }

        .cc-pill-active {
          background: linear-gradient(135deg,#E88067,#FBBD96) !important;
          color: white !important; border-color: transparent !important;
          box-shadow: 0 4px 16px rgba(232,128,103,0.4), inset 0 1px 0 rgba(255,255,255,0.2) !important;
        }
        .cc-pill-active::before { display: none !important; }
        .cc-pill-active:hover   { transform: translateY(-2px) !important; }

        /* ── Profile button ────────────────────────────────────────────── */
        .cc-profile-btn {
          font-family: 'Nunito', sans-serif;
          display: flex; align-items: center; gap: 8px;
          padding: 6px 16px 6px 6px; border-radius: 8px;
          border: 2px solid #FCCAAB; background: white;
          color: #2C3E35; font-size: 0.875rem; font-weight: 700; cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .cc-profile-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(232,128,103,0.28); }

        /* ── Auth buttons ──────────────────────────────────────────────── */
        .cc-btn-login {
          font-family: 'Nunito', sans-serif;
          padding: 8px 20px; border-radius: 6px;
          font-size: 0.875rem; font-weight: 700;
          text-decoration: none; color: #5C6E6A;
          border: 1.5px solid #D4E3DE; background: transparent;
          transition: all 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .cc-btn-login:hover { color: #2C3E35; border-color: #A3B995; transform: translateY(-1px); }

        .cc-btn-signup {
          font-family: 'Nunito', sans-serif;
          padding: 8px 20px; border-radius: 6px;
          font-size: 0.875rem; font-weight: 700;
          text-decoration: none; color: white;
          background: linear-gradient(135deg,#E88067,#FBBD96); border: none;
          box-shadow: 0 4px 14px rgba(232,128,103,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s;
          position: relative; overflow: hidden;
        }
        .cc-btn-signup::before {
          content: '✦'; position: absolute; right: -16px; top: 50%;
          transform: translateY(-50%); font-size: 0.6rem; color: rgba(255,255,255,0.7);
          transition: right 0.3s cubic-bezier(.34,1.56,.64,1), opacity 0.3s; opacity: 0;
        }
        .cc-btn-signup:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(232,128,103,0.4); }
        .cc-btn-signup:hover::before { right: 10px; opacity: 1; }

        /* ── Dropdown ──────────────────────────────────────────────────── */
        .cc-dropdown-item {
          font-family: 'Nunito', sans-serif;
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: 6px;
          font-size: 0.875rem; font-weight: 600;
          text-decoration: none; color: #2C3E35;
          transition: background 0.15s, color 0.15s, transform 0.15s;
          border: none; background: transparent; width: 100%; text-align: left; cursor: button;
        }
        .cc-dropdown-item:hover  { background: #FFF0EB; color: #E88067; transform: translateX(3px); }
        .cc-dropdown-danger      { color: #E88067; }
       
        /* Active state for dropdown items */
        .cc-dropdown-item-active {
          background: linear-gradient(135deg,#E88067,#FBBD96) !important;
          color: white !important;
        }
        .cc-dropdown-item-active:hover {
          transform: translateX(3px) !important;
        }

        /* Admin badge in dropdown */
        .admin-badge {
          background: linear-gradient(135deg,#C49A2A,#E8B84B) !important;
          color: white !important;
        }

        /* ── Mobile links ──────────────────────────────────────────────── */
        .cc-mobile-link {
          font-family: 'Nunito', sans-serif;
          display: flex; align-items: center; gap: 12px;
          padding: 11px 16px; border-radius: 8px;
          font-size: 0.9rem; font-weight: 700;
          text-decoration: none; color: #2C3E35;
          transition: background 0.15s, color 0.15s;
          border: none; background: transparent; cursor: pointer; width: 100%; text-align: left;
        }
        .cc-mobile-link:hover       { background: #FFF0EB; color: #E88067; }
        .cc-mobile-link-active      { background: linear-gradient(135deg,#E88067,#FBBD96) !important; color: white !important; }

        /* ── Hamburger ─────────────────────────────────────────────────── */
        .cc-hamburger {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; border: none;
          background: transparent; cursor: pointer; color: #5C6E6A;
          transition: background 0.15s, color 0.15s, transform 0.2s cubic-bezier(.34,1.56,.64,1);
        }
        .cc-hamburger:hover, .cc-hamburger-open { background: #FFF0EB; color: #E88067; transform: rotate(5deg); }

        /* ── Animations ────────────────────────────────────────────────── */
        @keyframes shimmer    { 0%,100%{background-position:0%}   50%{background-position:100%} }
        @keyframes shimmer2   { 0%,100%{background-position:100%} 50%{background-position:0%}   }
        @keyframes softPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        @keyframes borderFlow { 0%,100%{background-position:0%}   50%{background-position:100%} }
        @keyframes fadeIn     { from{opacity:0}                        to{opacity:1} }
        @keyframes riseUp     { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .anim-fade { animation: fadeIn  0.2s ease; }
        .anim-rise { animation: riseUp  0.3s cubic-bezier(.34,1.56,.64,1); }

        /* ── Responsive ────────────────────────────────────────────────── */
        .cc-desktop-nav  { display: none  !important; }
        .cc-hamburger    { display: flex  !important; }
        .cc-profile-name { display: none  !important; }
        @media (min-width: 1024px) {
          .cc-desktop-nav { display: flex !important; }
          .cc-hamburger   { display: none !important; }
        }
        @media (min-width: 640px) {
          .cc-profile-name { display: inline !important; }
        }

        /* ── Animated header accent line ───────────────────────────────── */
        .cc-rainbow-bar {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
      `}</style>

      <header style={{
        position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50,
        transition: 'background 0.3s, box-shadow 0.3s, border-color 0.3s, backdrop-filter 0.3s',
        background: scrolled
          ? 'rgba(253,248,243,0.96)'
          : 'linear-gradient(160deg,#FAF5EF 0%,#F6EEE5 50%,#F2EAE0 100%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(232,128,103,0.12)' : 'transparent'}`,
        boxShadow:    scrolled ? '0 4px 32px rgba(44,62,53,0.07)' : 'none',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
      }}>
        <div className="cc-rainbow-bar" />

        <div style={{
          maxWidth: '1300px', margin: '0 auto',
          padding: '0 28px', height: '70px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>

          {/* ── Cottagecore Logo ── */}
          <Link to="/" className="cc-logo-link">
            <span className="cc-sprig-l"><Sprig /></span>
            <span className="cc-sprig-r"><Sprig /></span>
            <div className="cc-logo-main">
              <span className="cc-art">Art</span>
              <span className="cc-divider" />
              <span className="cc-care">Care</span>
            </div>
            <div className="cc-tagline">
              <span className="cc-tagline-flower"><TinyFlower /></span>
              Рисуването като терапия
              <span className="cc-tagline-flower"><TinyFlower /></span>
            </div>
          </Link>

          {/* ── Desktop Nav (only 3 items) ── */}
          {currentUser && (
            <nav className="cc-desktop-nav" style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
              {navItems.map(item => (
                <Link key={item.path} to={item.path} className={`cc-pill ${isActive(item.path) ? 'cc-pill-active' : ''}`}>
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* ── Right side ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

            {currentUser ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button className="cc-profile-btn" onClick={() => setProfileOpen(v => !v)}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#E88067,#FBBD96)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.875rem', fontWeight: 700, flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(232,128,103,0.3)',
                  }}>
                    {getInitial()}
                  </div>
                  <span className="cc-profile-name" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {getDisplayName()}
                  </span>
                  <ChevronDown size={14} style={{ color: '#A8BBB9', flexShrink: 0, transition: 'transform 0.3s', transform: profileOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {profileOpen && (
                  <div className="anim-rise" style={{
                    position: 'absolute', right: 0, top: 'calc(100% + 10px)',
                    width: '240px', zIndex: 50, borderRadius: '10px', overflow: 'hidden',
                    background: 'white', border: '1.5px solid #F9DDB8',
                    boxShadow: '0 20px 50px rgba(44,62,53,0.11), 0 4px 12px rgba(232,128,103,0.07)',
                  }}>
                    <div style={{ height: '2px', background: 'linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995)' }} />
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #F9DDB8', background: 'linear-gradient(135deg,#FFF8F3,#FFF5EE)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TinyFlower style={{ flexShrink: 0, opacity: 0.7 }} />
                      <div>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#A8BBB9', marginBottom: '2px', fontFamily: 'Nunito, sans-serif' }}>Акаунт</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2C3E35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Nunito, sans-serif' }}>{getDisplayName()}</p>
                      </div>
                    </div>
                    <div style={{ padding: '8px' }}>
                      {/* Gallery and History items */}
                      {profileMenuItems.map(item => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={`cc-dropdown-item ${isActive(item.path) ? 'cc-dropdown-item-active' : ''}`}
                          onClick={() => setProfileOpen(false)}
                        >
                          {item.icon} {item.name}
                        </Link>
                      ))}
                     
                      <div style={{ margin: '6px 0', borderTop: '1px solid #F9DDB8' }} />
                     
                      {/* 👈 За администратор: показва "Админ Панел" вместо "Моят Профил" */}
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          className="cc-dropdown-item admin-badge"
                          onClick={() => setProfileOpen(false)}
                        >
                          <Shield size={15} /> Админ Панел
                        </Link>
                      ) : (
                        <Link
                          to="/profile"  
                          className="cc-dropdown-item"
                          onClick={() => setProfileOpen(false)}
                        >
                          <User size={15} /> Моят Профил
                        </Link>
                      )}
                     
                      <Link to="/settings" className="cc-dropdown-item" onClick={() => setProfileOpen(false)}>
                        <Settings size={15} /> Настройки
                      </Link>
                      <div style={{ margin: '6px 0', borderTop: '1px solid #F9DDB8' }} />
                      <button onClick={handleLogout} className="cc-dropdown-item cc-dropdown-danger">
                        <LogOut size={15} /> Изход
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link to="/login"  className="cc-btn-login">Вход</Link>
                <Link to="/signup" className="cc-btn-signup">Регистрация</Link>
              </div>
            )}

            {currentUser && (
              <button
                className={`cc-hamburger ${mobileMenuOpen ? 'cc-hamburger-open' : ''}`}
                onClick={() => setMobileMenuOpen(v => !v)}
                aria-label="Меню"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Mobile menu (includes Gallery and History) ── */}
      {currentUser && mobileMenuOpen && (
        <>
          <div className="anim-fade" onClick={() => setMobileMenuOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(44,62,53,0.15)', backdropFilter: 'blur(3px)' }} />
          <div className="anim-rise" style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 45, paddingTop: '76px',
            background: 'linear-gradient(160deg,#FAF5EF,#F6EEE5)',
            borderBottom: '1px solid #F9DDB8',
            boxShadow: '0 12px 40px rgba(44,62,53,0.09)',
          }}>
            <div style={{ height: '2px', background: 'linear-gradient(90deg,transparent,#E88067,#FBBD96,#A3B995,transparent)', margin: '0 20px', borderRadius: '999px' }} />
            <div style={{ padding: '10px 14px 18px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* All nav items including Gallery and History for mobile */}
              {[...navItems, ...profileMenuItems].map(item => (
                <Link key={item.path} to={item.path}
                  className={`cc-mobile-link ${isActive(item.path) ? 'cc-mobile-link-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}>
                  {item.icon} {item.name}
                </Link>
              ))}
             
              <div style={{ margin: '8px 12px', height: '1px', background: 'linear-gradient(90deg,transparent,#F9DDB8,transparent)' }} />
             
              {/* 👈 За администратор в мобилното меню */}
              {isAdmin ? (
                <Link to="/admin"
                  className="cc-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'linear-gradient(135deg,#C49A2A,#E8B84B)', color: 'white' }}>
                  <Shield size={16} /> Админ Панел
                </Link>
              ) : (
                <Link to="/profile" className="cc-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                  <User size={16} /> Моят Профил
                </Link>
              )}
             
              <Link to="/settings" className="cc-mobile-link" onClick={() => setMobileMenuOpen(false)}>
                <Settings size={16} /> Настройки
              </Link>
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="cc-mobile-link" style={{ color: '#E88067' }}>
                <LogOut size={16} /> Изход
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;