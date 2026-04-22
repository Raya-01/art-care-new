import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

/* ── Botanical SVGs (same as Header/Footer) ─────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="26" height="26" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.6"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.6"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.4"/>
  </svg>
);

const TinyFlower = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

/* ── Wilted flower SVG — the centerpiece ────────────────────────────────── */
const WiltedFlower = () => (
  <svg viewBox="0 0 120 140" width="120" height="140" fill="none">
    {/* stem — droops to the right */}
    <path d="M60 130 C60 100 70 80 68 55" stroke="#A3B995" strokeWidth="3" strokeLinecap="round"/>
    {/* small leaf left */}
    <path d="M63 90 C55 82 48 85 44 80 C50 76 60 82 63 90Z" fill="#A3B995" opacity="0.5"/>
    {/* small leaf right */}
    <path d="M65 75 C73 67 80 70 84 65 C78 61 68 67 65 75Z" fill="#A8BBB9" opacity="0.5"/>
    {/* drooping head — tilted */}
    <g transform="translate(68,52) rotate(35)">
      {/* petals */}
      <ellipse cx="0"   cy="-14" rx="5" ry="9"  fill="#FCCAAB" opacity="0.75"/>
      <ellipse cx="0"   cy="14"  rx="5" ry="9"  fill="#E88067" opacity="0.6"/>
      <ellipse cx="-14" cy="0"   rx="9" ry="5"  fill="#FBBD96" opacity="0.7"/>
      <ellipse cx="14"  cy="0"   rx="9" ry="5"  fill="#FCCAAB" opacity="0.7"/>
      <ellipse cx="-10" cy="-10" rx="5" ry="8"  fill="#F9DDB8" opacity="0.6" transform="rotate(-45 -10 -10)"/>
      <ellipse cx="10"  cy="-10" rx="5" ry="8"  fill="#FBBD96" opacity="0.6" transform="rotate(45 10 -10)"/>
      <ellipse cx="-10" cy="10"  rx="5" ry="8"  fill="#E88067" opacity="0.5" transform="rotate(45 -10 10)"/>
      <ellipse cx="10"  cy="10"  rx="5" ry="8"  fill="#FCCAAB" opacity="0.55" transform="rotate(-45 10 10)"/>
      {/* center */}
      <circle cx="0" cy="0" r="8" fill="#FBBD96"/>
      <circle cx="0" cy="0" r="5" fill="#E88067" opacity="0.7"/>
    </g>
    {/* fallen petal on ground */}
    <ellipse cx="30" cy="134" rx="7" ry="3.5" fill="#FCCAAB" opacity="0.5" transform="rotate(-15 30 134)"/>
    <ellipse cx="88" cy="136" rx="5" ry="2.5" fill="#FBBD96" opacity="0.4" transform="rotate(10 88 136)"/>
  </svg>
);

const NotFound: React.FC = () => (
  <>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

      @keyframes floatFlower  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      @keyframes slideUp      { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin         { to{transform:rotate(360deg)} }
      @keyframes spinReverse  { to{transform:rotate(-360deg)} }
      @keyframes softSway     { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }
      @keyframes shimmer      { 0%,100%{background-position:0%} 50%{background-position:100%} }
      @keyframes shimmer2     { 0%,100%{background-position:100%} 50%{background-position:0%} }
      @keyframes softPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.88)} }
      @keyframes borderFlow   { 0%,100%{background-position:0%} 50%{background-position:100%} }

      .nf-wrap    { animation: slideUp .55s cubic-bezier(.34,1.56,.64,1) both; }
      .nf-flower  { animation: floatFlower 4s ease-in-out infinite; }
      .nf-ring1   { animation: spin 24s linear infinite; }
      .nf-ring2   { animation: spinReverse 18s linear infinite; }
      .nf-sway-1  { animation: softSway 4s ease-in-out infinite; transform-origin: bottom center; }
      .nf-sway-2  { animation: softSway 4s ease-in-out infinite .7s; transform-origin: bottom center; }
      .nf-sway-3  { animation: softSway 4s ease-in-out infinite 1.4s; transform-origin: bottom center; }
      .nf-sway-4  { animation: softSway 4s ease-in-out infinite 2.1s; transform-origin: bottom center; }

      /* ── Logo — identical to Header/Footer ── */
      .nf-logo-link {
        text-decoration: none;
        display: inline-flex; flex-direction: column; align-items: center; gap: 3px;
        position: relative;
      }
      .nf-logo-main {
        font-family: 'Cormorant Garamond', serif;
        font-size: 1.9rem; font-weight: 700; line-height: 1;
        display: flex; align-items: center; gap: 6px;
      }
      .nf-art {
        background: linear-gradient(135deg,#E88067 0%,#FBBD96 60%,#E88067 100%);
        background-size: 200%;
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        font-style: italic;
        animation: shimmer 5s ease infinite;
        transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
      }
      .nf-dot {
        width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
        background: linear-gradient(135deg,#F9DDB8,#FBBD96);
        box-shadow: 0 0 6px rgba(249,221,184,0.8);
        animation: softPulse 3s ease infinite;
        transition: transform 0.4s cubic-bezier(.34,1.56,.64,1);
      }
      .nf-care {
        background: linear-gradient(135deg,#A3B995 0%,#A8BBB9 60%,#A3B995 100%);
        background-size: 200%;
        -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        animation: shimmer2 5s ease infinite;
        transition: letter-spacing 0.5s cubic-bezier(.34,1.56,.64,1);
      }
      .nf-logo-link:hover .nf-art  { letter-spacing: 0.06em; }
      .nf-logo-link:hover .nf-care { letter-spacing: 0.04em; }
      .nf-logo-link:hover .nf-dot  { transform: scale(1.6) rotate(45deg); }

      .nf-sprig-l, .nf-sprig-r {
        position: absolute; top: 50%;
        opacity: 0; pointer-events: none;
        transition: transform 0.5s cubic-bezier(.34,1.56,.64,1), opacity 0.3s;
      }
      .nf-sprig-l { left: -26px;  transform: translateY(-50%) rotate(40deg) scaleX(-1); }
      .nf-sprig-r { right: -26px; transform: translateY(-50%) rotate(-40deg); }
      .nf-logo-link:hover .nf-sprig-l { opacity: 1; transform: translateY(-60%) rotate(25deg) scaleX(-1); }
      .nf-logo-link:hover .nf-sprig-r { opacity: 1; transform: translateY(-60%) rotate(-25deg); }

      .nf-tagline {
        font-family: 'Nunito', sans-serif;
        font-size: 0.55rem; text-transform: uppercase; letter-spacing: 0.22em;
        color: #A8BBB9; font-weight: 700;
        display: flex; align-items: center; gap: 5px;
        transition: color 0.3s, letter-spacing 0.5s;
      }
      .nf-tagline-flower { opacity: 0.5; display: flex; align-items: center; transition: opacity 0.3s, transform 0.5s cubic-bezier(.34,1.56,.64,1); }
      .nf-logo-link:hover .nf-tagline        { color: #E88067; letter-spacing: 0.28em; }
      .nf-logo-link:hover .nf-tagline-flower { opacity: 1; transform: rotate(20deg) scale(1.2); }

      /* ── rainbow bar ── */
      .nf-rainbow {
        height: 3px;
        background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
        background-size: 200% 100%;
        animation: borderFlow 6s ease infinite;
      }

      /* ── buttons ── */
      .nf-btn-primary {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 11px 22px; border-radius: 14px; border: none; cursor: pointer;
        font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
        color: white; text-decoration: none;
        background: linear-gradient(135deg,#E88067,#FBBD96);
        box-shadow: 0 4px 16px rgba(232,128,103,0.28);
        transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
      }
      .nf-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 26px rgba(232,128,103,0.36); }

      .nf-btn-ghost {
        display: inline-flex; align-items: center; gap: 7px;
        padding: 11px 22px; border-radius: 14px; cursor: pointer;
        font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
        color: #5C6E6A; background: white; text-decoration: none;
        border: 1.5px solid #F9DDB8;
        transition: transform .2s, border-color .2s, color .2s, background .2s;
      }
      .nf-btn-ghost:hover { transform: translateY(-3px); border-color: #FCCAAB; background: #FFF0EB; color: #E88067; }
    `}</style>

    <div
      style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', fontFamily: "'Nunito', sans-serif",
        background: 'linear-gradient(160deg,#FAF5EF 0%,#EEF4F2 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(circle,#FCCAAB,transparent 68%)', opacity: 0.14 }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,#D4E3DE,transparent 68%)', opacity: 0.16 }} />
      </div>

      <div className="nf-wrap" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>

        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 28,
          overflow: 'hidden', textAlign: 'center',
          boxShadow: '0 24px 72px rgba(44,62,53,0.11)',
          border: '1.5px solid #F9DDB8',
        }}>
          {/* Rainbow top bar */}
          <div className="nf-rainbow" />

          <div style={{ padding: '36px 36px 32px' }}>

            {/* ── Logo ── */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <Link to="/" className="nf-logo-link">
                <span className="nf-sprig-l"><Sprig /></span>
                <span className="nf-sprig-r"><Sprig /></span>
                <div className="nf-logo-main">
                  <span className="nf-art">Art</span>
                  <span className="nf-dot" />
                  <span className="nf-care">Care</span>
                </div>
                <div className="nf-tagline">
                  <span className="nf-tagline-flower"><TinyFlower size={10} /></span>
                  Рисуването като терапия
                  <span className="nf-tagline-flower"><TinyFlower size={10} /></span>
                </div>
              </Link>
            </div>

            {/* ── Floral divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, opacity: 0.4 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#F9DDB8)' }} />
              <TinyFlower size={11} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#F9DDB8,#D4E3DE,#F9DDB8)' }} />
              <TinyFlower size={11} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#F9DDB8,transparent)' }} />
            </div>

            {/* ── Wilted flower + rings ── */}
            <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto 20px' }}>
              {/* spinning dashed rings */}
              <svg className="nf-ring1" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="74" stroke="#FCCAAB" strokeWidth="1.5" strokeDasharray="14 10"/>
              </svg>
              <svg className="nf-ring2" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 160 160" fill="none">
                <circle cx="80" cy="80" r="56" stroke="#D4E3DE" strokeWidth="1.5" strokeDasharray="8 14"/>
              </svg>
              {/* ghost 404 */}
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Cormorant Garamond',serif", fontSize: '3.6rem', fontWeight: 700,
                color: 'rgba(163,185,149,0.1)', letterSpacing: '-2px', userSelect: 'none',
              }}>404</span>
              {/* wilted flower */}
              <div className="nf-flower" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WiltedFlower />
              </div>
            </div>

            {/* ── Headline ── */}
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.5rem,4vw,1.9rem)',
              fontWeight: 700, fontStyle: 'italic',
              color: '#2C3E35', margin: '0 0 12px', lineHeight: 1.2,
            }}>
              Страницата не може да бъде намерена
            </h1>

            {/* ── Body text ── */}
            <p style={{ fontSize: '0.9rem', lineHeight: 1.8, color: '#5C6E6A', margin: '0 0 24px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
              Съжаляваме — страницата, която търсите, е извън наличност, не съществува или временно не може да бъде достигната.
              Но не се притеснявайте, вашето тихо кътче ви чака.
            </p>

            {/* ── Suggestions ── */}
            <div style={{
              borderRadius: 16, padding: '14px 18px', marginBottom: 24, textAlign: 'left',
              background: 'linear-gradient(135deg,#FAF5EF,#FFF8F3)',
              border: '1px solid #F9DDB8',
            }}>
              <p style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#E88067', margin: '0 0 10px' }}>
                Какво можете да направите
              </p>
              {[
                'Проверете дали адресът е правилен',
                'Върнете се на началната страница',
                'Използвайте навигационното меню',
              ].map(s => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: '#5C6E6A' }}>
                  <TinyFlower size={11} />
                  {s}
                </div>
              ))}
            </div>

            {/* ── Botanical sprig row ── */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 22, opacity: 0.45 }}>
              <span className="nf-sway-1"><Sprig /></span>
              <span className="nf-sway-2"><Sprig style={{ transform: 'scaleX(-1)' }} /></span>
              <span className="nf-sway-3"><Sprig /></span>
              <span className="nf-sway-4"><Sprig style={{ transform: 'scaleX(-1)' }} /></span>
            </div>

            {/* ── Actions ── */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="nf-btn-primary">
                <Home size={15} /> Към началото
              </Link>
              <button onClick={() => window.history.back()} className="nf-btn-ghost">
                <ArrowLeft size={15} /> Назад
              </button>
            </div>

          </div>
        </div>

        {/* Below-card caption */}
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.72rem', color: '#A8BBB9', fontWeight: 600 }}>
          Код на грешката: 404 · Страницата не е намерена
        </p>
      </div>
    </div>
  </>
);

export default NotFound;