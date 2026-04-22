import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, ArrowRight, Target, Users, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import QuoteDisplay from '../utils/QuoteDisplay';

const SLIDES = [
  { id: 1, label: 'Пролетна светлина', author: 'Мария',   emoji: '🌸', bg: 'linear-gradient(145deg,#F9DDB8 0%,#FCCAAB 100%)' },
  { id: 2, label: 'Спокойствие',        author: 'Иван',    emoji: '🌿', bg: 'linear-gradient(145deg,#D4E3DE 0%,#A8BBB9 100%)' },
  { id: 3, label: 'Топлина',            author: 'Елена',   emoji: '🔥', bg: 'linear-gradient(145deg,#FCCAAB 0%,#FBBD96 100%)' },
  { id: 4, label: 'Природа',            author: 'Димитър', emoji: '🍃', bg: 'linear-gradient(145deg,#A3B995 0%,#D4E3DE 100%)' },
];

const INTERVAL = 15000;

/* ── SVG easel legs ── */
const EaselLegs = () => (
  <svg viewBox="0 0 320 90" width="100%" style={{ display: 'block', marginTop: -2 }} fill="none">
    {/* left leg */}
    <line x1="100" y1="4" x2="30" y2="88" stroke="#8B6F47" strokeWidth="5" strokeLinecap="round"/>
    {/* right leg */}
    <line x1="220" y1="4" x2="290" y2="88" stroke="#8B6F47" strokeWidth="5" strokeLinecap="round"/>
    {/* center support */}
    <line x1="160" y1="4" x2="160" y2="88" stroke="#A0845C" strokeWidth="3.5" strokeLinecap="round"/>
    {/* crossbar */}
    <line x1="72" y1="58" x2="248" y2="58" stroke="#8B6F47" strokeWidth="3" strokeLinecap="round"/>
    {/* feet dots */}
    <circle cx="30"  cy="88" r="4" fill="#6B5035"/>
    <circle cx="290" cy="88" r="4" fill="#6B5035"/>
    <circle cx="160" cy="88" r="4" fill="#6B5035"/>
  </svg>
);

const Home: React.FC = () => {
  const [current,   setCurrent]   = useState(0);
  const [animDir,   setAnimDir]   = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  const go = useCallback((next: number, dir: 'left' | 'right') => {
    if (animating) return;
    setAnimDir(dir);
    setAnimating(true);
    setTimeout(() => { setCurrent(next); setAnimating(false); }, 300);
  }, [animating]);

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length, 'left');
  const next = useCallback(() => go((current + 1) % SLIDES.length, 'right'), [current, go]);

  useEffect(() => {
    const id = setInterval(next, INTERVAL);
    return () => clearInterval(id);
  }, [next]);

  const features = [
    { icon: <Target size={22} />,    title: 'Дневни задачи',  description: 'Персонализирани арт упражнения за всеки ден', color: '#E88067', bg: '#FFF0EB' },
    { icon: <Heart size={22} />,     title: 'Личен дневник',  description: 'Записвайте мисли и емоции с грижа',            color: '#A3B995', bg: '#EEF4EE' },
    { icon: <ImageIcon size={22} />, title: 'Галерия',        description: 'Съхранявайте и споделяйте творбите си',        color: '#FBBD96', bg: '#FFF8EE' },
    { icon: <Sparkles size={22} />,  title: 'Прогрес',        description: 'Наблюдавайте развитието си с времето',         color: '#A8BBB9', bg: '#EEF4F2' },
  ];

  const slide = SLIDES[current];

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp     { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gentleFloat{ 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes slideOutL  { from{opacity:1;transform:translateX(0)}     to{opacity:0;transform:translateX(-40px)} }
        @keyframes slideOutR  { from{opacity:1;transform:translateX(0)}     to{opacity:0;transform:translateX(40px)}  }
        @keyframes slideInR   { from{opacity:0;transform:translateX(40px)}  to{opacity:1;transform:translateX(0)}    }
        @keyframes slideInL   { from{opacity:0;transform:translateX(-40px)} to{opacity:1;transform:translateX(0)}    }

        .hero-1 { animation: fadeUp .65s ease-out both 0s; }
        .hero-2 { animation: fadeUp .65s ease-out both .1s; }
        .hero-3 { animation: fadeUp .65s ease-out both .2s; }
        .hero-4 { animation: fadeUp .65s ease-out both .32s; }
        .hero-5 { animation: fadeUp .65s ease-out both .44s; }

        .easel-float { animation: gentleFloat 5s ease-in-out infinite; }

        .slide-exit-l  { animation: slideOutL .3s ease forwards; }
        .slide-exit-r  { animation: slideOutR .3s ease forwards; }
        .slide-enter-r { animation: slideInR  .3s ease forwards; }
        .slide-enter-l { animation: slideInL  .3s ease forwards; }

        .feature-card { transition: transform .25s, box-shadow .25s; }
        .feature-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(44,62,53,0.09) !important; }

        .stat-card { transition: transform .25s; position: relative; overflow: hidden; }
        .stat-card:hover { transform: translateY(-4px); }

        .btn-primary   { transition: transform .18s, box-shadow .18s; }
        .btn-primary:hover   { transform: translateY(-2px); box-shadow: 0 10px 26px rgba(232,128,103,0.32) !important; }
        .btn-secondary { transition: transform .18s, background .18s, border-color .18s; }
        .btn-secondary:hover { transform: translateY(-2px); background: #FFF0EB !important; border-color: #FCCAAB !important; }

        .c-arrow { transition: transform .18s, background .18s; cursor: pointer; border: none; outline: none; }
        .c-arrow:hover { transform: scale(1.15); background: white !important; }

        .dot-btn { transition: width .35s cubic-bezier(.34,1.56,.64,1), background .3s; border: none; cursor: pointer; padding: 0; outline: none; }

        .rainbow-bar {
          height: 2px; border-radius: 999px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 7s ease infinite;
        }

        /* canvas texture overlay */
        .canvas-texture {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background-image:
            repeating-linear-gradient(0deg,   transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px),
            repeating-linear-gradient(90deg,  transparent, transparent 3px, rgba(255,255,255,0.04) 3px, rgba(255,255,255,0.04) 4px);
        }

        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: center; }
        @media(max-width:900px){ .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; } }

        .features-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 14px; }
        @media(max-width:860px){ .features-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media(max-width:480px){ .features-grid { grid-template-columns: 1fr !important; } }

        .stats-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        @media(max-width:560px){ .stats-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(160deg,#FAF5EF 0%,#EEF4F2 100%)', position: 'relative', padding: '88px 32px 80px' }}>

        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }} aria-hidden>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,#FCCAAB,transparent 68%)', opacity: 0.18 }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle,#D4E3DE,transparent 68%)', opacity: 0.16 }} />
        </div>

        <div className="hero-grid" style={{ maxWidth: 1120, margin: '0 auto', position: 'relative', zIndex: 1 }}>

          {/* ── Left: text ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div className="hero-1" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 13px', borderRadius: 999, background: '#F9DDB8', color: '#E88067', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
              <Sparkles size={11} /> Арт-терапия за всеки
            </div>

            <h1 className="hero-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2rem,3.8vw,2.9rem)', fontWeight: 700, lineHeight: 1.18, color: '#2C3E35', marginBottom: 18, marginTop: 0 }}>
              Добре дошли във {' '}
              <span style={{ color: '#E88067', fontStyle: 'italic' }}>вашето</span>
              <br />тихо кътче.
            </h1>

            <p className="hero-3" style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#5C6E6A', marginBottom: 10, marginTop: 0, maxWidth: 430 }}>
              Тук не се изисква перфектност — само присъствие. ARTCARE е мястото, където идвате когато имате нужда от малко красота, или просто когато искате да сте само вие.
            </p>
            <p className="hero-4" style={{ fontSize: '0.95rem', lineHeight: 1.85, color: '#5C6E6A', marginBottom: 28, marginTop: 0, maxWidth: 430 }}>
              Вярваме, че един молив и празен лист понякога могат да свършат работата, която думите не могат. Не трябва да сте художник — трябва само да сте тук.
            </p>

            <div className="hero-5" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <Link to="/therapy" className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 14, fontSize: '0.875rem', fontWeight: 700, color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg,#E88067,#FBBD96)', boxShadow: '0 4px 16px rgba(232,128,103,0.28)' }}>
                Започнете пътуването <ArrowRight size={15} />
              </Link>
              <Link to="/about" className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 14, fontSize: '0.875rem', fontWeight: 700, color: '#5C6E6A', textDecoration: 'none', background: 'white', border: '1.5px solid #F9DDB8' }}>
                Научете повече
              </Link>
            </div>
          </div>

          {/* ── Right: canvas on easel ── */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div className="easel-float" style={{ width: '100%', maxWidth: 400 }}>

              {/* ── Canvas frame ── */}
              <div style={{
                position: 'relative',
                /* wooden outer frame */
                background: 'linear-gradient(135deg,#C8A97E 0%,#A0845C 40%,#C8A97E 60%,#8B6F47 100%)',
                borderRadius: 6,
                padding: 10,
                boxShadow: '0 8px 32px rgba(44,30,10,0.22), 0 2px 6px rgba(44,30,10,0.15), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}>

                {/* inner frame bevel */}
                <div style={{
                  background: 'linear-gradient(135deg,#8B6F47,#A0845C 30%,#8B6F47 70%,#6B5035)',
                  borderRadius: 3,
                  padding: 6,
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.25)',
                }}>

                  {/* canvas surface */}
                  <div style={{ position: 'relative', borderRadius: 2, overflow: 'hidden', background: '#FAF5EF' }}>

                    {/* slide */}
                    <div
                      key={slide.id}
                      className={animating
                        ? (animDir === 'right' ? 'slide-exit-l' : 'slide-exit-r')
                        : (animDir === 'right' ? 'slide-enter-r' : 'slide-enter-l')
                      }
                      style={{ background: slide.bg, minHeight: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative' }}
                    >
                      {/* canvas texture overlay */}
                      <div className="canvas-texture" />

                      {/* 👉 Replace emoji block with: <img src={slide.src} alt={slide.label} style={{width:'100%',height:'100%',objectFit:'cover',position:'absolute',inset:0}} /> */}
                      <span style={{ fontSize: '4rem', lineHeight: 1, position: 'relative', zIndex: 2 }}>{slide.emoji}</span>
                      <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
                        <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontWeight: 700, fontStyle: 'italic', color: '#2C3E35', margin: 0 }}>{slide.label}</p>
                        <p style={{ fontSize: '0.7rem', color: '#5C6E6A', margin: '3px 0 0' }}>от {slide.author}</p>
                      </div>
                    </div>

                    {/* canvas edge shadows for depth */}
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 18px rgba(44,30,10,0.1)', zIndex: 3, borderRadius: 2 }} />

                    {/* prev / next */}
                    <button onClick={prev} className="c-arrow" aria-label="Предишна"
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', color: '#5C6E6A', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, boxShadow: '0 2px 8px rgba(44,30,10,0.12)' }}>
                      <ChevronLeft size={17} />
                    </button>
                    <button onClick={next} className="c-arrow" aria-label="Следваща"
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.75)', color: '#5C6E6A', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, boxShadow: '0 2px 8px rgba(44,30,10,0.12)' }}>
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>

                {/* canvas label plate — like a gallery museum tag nailed to the frame */}
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6B5035', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }} />
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic' }}>Общност · Последни творби</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: '0.6rem', fontWeight: 700 }}>
                      <Users size={9} /> Живо
                    </div>
                  </div>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6B5035', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }} />
                </div>
              </div>

              {/* dots below frame */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                {SLIDES.map((_, i) => (
                  <button key={i} className="dot-btn" onClick={() => go(i, i > current ? 'right' : 'left')}
                    style={{ height: 6, width: i === current ? 20 : 6, borderRadius: 999, background: i === current ? '#E88067' : '#D4C9BC' }}
                    aria-label={`Слайд ${i + 1}`} />
                ))}
              </div>

              {/* SVG easel legs */}
              <EaselLegs />
            </div>
          </div>

        </div>
      </section>

      {/* ══ QUOTE ═════════════════════════════════════════════════════════ */}
      <section style={{ background: '#FAF5EF', padding: '52px 32px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <QuoteDisplay type="welcome" />
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '60px 32px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 36, gap: 5 }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#E88067' }}>Функции</span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.5rem,2.8vw,1.9rem)', fontWeight: 700, color: '#2C3E35', margin: 0, lineHeight: 1.2 }}>
              Какво предлага <span style={{ color: '#E88067', fontStyle: 'italic' }}>ARTCARE</span>
            </h2>
            <div className="rainbow-bar" style={{ width: 44, marginTop: 2 }} />
            <p style={{ fontSize: '0.88rem', color: '#5C6E6A', margin: '2px 0 0', maxWidth: 340, lineHeight: 1.6 }}>
              Инструменти за творчество, рефлексия и грижа за себе си
            </p>
          </div>

          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card" style={{ borderRadius: 16, padding: '20px 16px', textAlign: 'center', background: 'white', boxShadow: '0 3px 14px rgba(44,62,53,0.06)', border: '1px solid #F9DDB8' }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', background: f.bg, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#2C3E35', marginBottom: 5, marginTop: 0 }}>{f.title}</h3>
                <p style={{ fontSize: '0.73rem', lineHeight: 1.6, color: '#5C6E6A', margin: 0 }}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═════════════════════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(160deg,#FAF5EF 0%,#EEF4F2 100%)', padding: '60px 32px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div className="stats-grid">
            {[
              { number: '1000+', label: 'Потребители',           accent: '#E88067' },
              { number: '50+',   label: 'Арт упражнения',        accent: '#A3B995' },
              { number: '∞',     label: 'Творчески възможности', accent: '#FBBD96' },
            ].map((s, i) => (
              <div key={i} className="stat-card" style={{ background: 'white', borderRadius: 18, padding: '24px 18px', textAlign: 'center', border: '1px solid #F9DDB8', boxShadow: '0 4px 18px rgba(44,62,53,0.06)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: s.accent, borderRadius: '18px 18px 0 0' }} />
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '2.2rem', fontWeight: 700, color: s.accent, lineHeight: 1, marginBottom: 5 }}>{s.number}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#5C6E6A' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;