import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, BookOpen, Image, History, Target, Sparkles, ArrowLeft } from 'lucide-react';
 
/* ── Botanical SVGs ─────────────────────────────────────────────────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="22" height="22" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke="#A3B995" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill="#A3B995" opacity="0.6"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill="#A8BBB9" opacity="0.6"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill="#A3B995" opacity="0.4"/>
  </svg>
);
 
const TinyFlower = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);
 
/* ── Step definitions ───────────────────────────────────────────────────── */
interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  accentBg: string;
  page?: string;
  pageLabel?: string;
}
 
const STEPS: TutorialStep[] = [
  {
    title: 'Добре дошли в ArtCare!',
    description: 'Вашата платформа за грижа за себе си чрез изкуството. Тук не е нужно да сте художник — нужно е само да сте тук. Нека разгледаме заедно какво ви очаква.',
    icon: (
      <svg viewBox="0 0 64 64" width="52" height="52" fill="none">
        <circle cx="32" cy="32" r="28" fill="#FFF0EB" stroke="#FCCAAB" strokeWidth="1.5"/>
        <path d="M20 38 C20 28 44 28 44 38" stroke="#E88067" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <circle cx="24" cy="28" r="3" fill="#E88067" opacity="0.7"/>
        <circle cx="40" cy="28" r="3" fill="#E88067" opacity="0.7"/>
        <path d="M28 44 C28 44 30 46 36 44" stroke="#A3B995" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    accentColor: '#E88067',
    accentBg: '#FFF0EB',
  },
  {
    title: 'Дневни задачи',
    description: 'Всеки ден ви очакват 10 творчески задачи, внимателно подбрани за вас. Завършете ги, за да подобрите настроението си, да изградите навик и да запазите своята поредица.',
    icon: <Target size={44} style={{ color: '#E88067' }} />,
    accentColor: '#E88067',
    accentBg: '#FFF0EB',
    page: '/therapy',
    pageLabel: 'Към задачите',
  },
  {
    title: 'Личен дневник',
    description: 'Записвайте мислите и чувствата си в сигурна, спокойна среда. Можете да следвате насоки или просто да пишете свободно — без правила, само присъствие.',
    icon: <BookOpen size={44} style={{ color: '#A3B995' }} />,
    accentColor: '#A3B995',
    accentBg: '#EEF4EE',
    page: '/journal',
    pageLabel: 'Към дневника',
  },
  {
    title: 'Лична галерия',
    description: 'Съхранявайте и организирайте вашите творби на едно място. Свържете ги с изпълнени задачи, добавете етикети и наблюдавайте как расте колекцията ви.',
    icon: <Image size={44} style={{ color: '#FBBD96' }} />,
    accentColor: '#FBBD96',
    accentBg: '#FFF8EE',
    page: '/gallery',
    pageLabel: 'Към галерията',
  },
  {
    title: 'История на активността',
    description: 'Проследете своя прогрес, поредици и творческо развитие с времето. Всяка малка стъпка се брои — и тук можете да я видите.',
    icon: <History size={44} style={{ color: '#A8BBB9' }} />,
    accentColor: '#A8BBB9',
    accentBg: '#EEF4F2',
    page: '/history',
    pageLabel: 'Към историята',
  },
  {
    title: 'Готови сте! 🌸',
    description: 'Вашето творческо пътуване започва сега. Помнете — не съвършенството е целта, а присъствието. Малките стъпки всеки ден водят до големи промени.',
    icon: (
      <svg viewBox="0 0 64 64" width="52" height="52" fill="none">
        <circle cx="32" cy="32" r="28" fill="#EEF4EE" stroke="#A3B995" strokeWidth="1.5"/>
        <path d="M20 32 L28 40 L44 24" stroke="#A3B995" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="48" cy="16" r="4" fill="#FBBD96" opacity="0.7"/>
        <circle cx="16" cy="48" r="3" fill="#FCCAAB" opacity="0.6"/>
        <circle cx="50" cy="46" r="2.5" fill="#A3B995" opacity="0.5"/>
      </svg>
    ),
    accentColor: '#A3B995',
    accentBg: '#EEF4EE',
  },
];
 
const Tutorial: React.FC = () => {
  const [step, setStep] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [entering, setEntering] = useState(false);
  const navigate = useNavigate();
 
  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;
 
  const goTo = useCallback((next: number) => {
    setExiting(true);
    setTimeout(() => {
      setStep(next);
      setExiting(false);
      setEntering(true);
      setTimeout(() => setEntering(false), 400);
    }, 220);
  }, []);
 
  const handleNext = () => isLast ? navigate('/therapy') : goTo(step + 1);
  const handleBack = () => !isFirst && goTo(step - 1);
  const handleSkip = () => navigate('/therapy');
 
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        fontFamily: "'Nunito', sans-serif",
        background: dimmed
          ? 'rgba(30,42,36,0.72)'
          : 'linear-gradient(160deg,#FAF5EF 0%,#EEF4F2 100%)',
        transition: 'background 0.35s ease',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,700;1,700&family=Nunito:wght@400;600;700;800&display=swap');
 
        @keyframes slideUp      { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideOut     { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-20px)} }
        @keyframes slideIn      { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatIcon    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes softSway     { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes sparkleAnim  { 0%,100%{transform:scale(1) rotate(0deg)} 50%{transform:scale(1.15) rotate(12deg)} }
        @keyframes shimmer      { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes shimmer2     { 0%,100%{background-position:100%} 50%{background-position:0%} }
        @keyframes softPulse    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.7;transform:scale(0.85)} }
        @keyframes borderFlow   { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes dotPop       { 0%{transform:scale(0.8)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
 
        .tut-card-enter { animation: slideUp  .45s cubic-bezier(.34,1.56,.64,1) both; }
        .tut-card-exit  { animation: slideOut .22s ease forwards; }
        .tut-content-enter { animation: slideIn .35s ease-out both; }
        .tut-content-exit  { animation: slideOut .2s ease forwards; }
        .tut-icon-float { animation: floatIcon 3.5s ease-in-out infinite; }
        .tut-sparkle    { animation: sparkleAnim 2s ease-in-out infinite; }
        .tut-sway-1     { animation: softSway 3.8s ease-in-out infinite; transform-origin: bottom center; }
        .tut-sway-2     { animation: softSway 3.8s ease-in-out infinite .6s; transform-origin: bottom center; }
 
        /* Logo */
        .tut-art {
          font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 700;
          background: linear-gradient(135deg,#E88067 0%,#FBBD96 60%,#E88067 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shimmer 5s ease infinite;
        }
        .tut-care {
          font-family: 'Cormorant Garamond', serif; font-weight: 700;
          background: linear-gradient(135deg,#A3B995 0%,#A8BBB9 60%,#A3B995 100%);
          background-size: 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
          animation: shimmer2 5s ease infinite;
        }
        .tut-dot {
          width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg,#F9DDB8,#FBBD96);
          box-shadow: 0 0 6px rgba(249,221,184,0.8);
          animation: softPulse 3s ease infinite;
        }
 
        /* Rainbow bar */
        .tut-rainbow {
          height: 3px;
          background: linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size: 200% 100%;
          animation: borderFlow 6s ease infinite;
        }
 
        /* Progress dots */
        .tut-prog-dot {
          border-radius: 999px;
          transition: width .4s cubic-bezier(.34,1.56,.64,1), background .3s;
          cursor: pointer;
        }
        .tut-prog-dot.active { animation: dotPop .4s cubic-bezier(.34,1.56,.64,1); }
 
        /* Buttons */
        .tut-btn-next {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 12px 24px; border-radius: 14px; border: none; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-size: 0.9rem; font-weight: 800;
          color: white;
          background: linear-gradient(135deg,#E88067,#FBBD96);
          box-shadow: 0 4px 16px rgba(232,128,103,0.3);
          transition: transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
          flex: 1;
        }
        .tut-btn-next:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(232,128,103,0.4); }
 
        .tut-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 12px 18px; border-radius: 14px; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-size: 0.875rem; font-weight: 700;
          color: #5C6E6A; background: white;
          border: 1.5px solid #F9DDB8;
          transition: transform .2s, border-color .2s, color .2s, background .2s;
          flex: 1;
        }
        .tut-btn-secondary:hover { transform: translateY(-3px); border-color: #FCCAAB; color: #E88067; background: #FFF0EB; }
 
        .tut-btn-skip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 14px; border-radius: 999px; cursor: pointer;
          font-family: 'Nunito', sans-serif; font-size: 0.72rem; font-weight: 700;
          color: #A8BBB9; background: white; border: 1.5px solid #F9DDB8;
          transition: color .2s, border-color .2s, background .2s;
        }
        .tut-btn-skip:hover { color: #E88067; border-color: #FCCAAB; background: #FFF0EB; }
      `}</style>
 
      {/* Ambient blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,#FCCAAB,transparent 68%)', opacity: dimmed ? 0 : 0.16, transition: 'opacity 0.35s' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,#D4E3DE,transparent 68%)', opacity: dimmed ? 0 : 0.16, transition: 'opacity 0.35s' }} />
      </div>
 
      {/* Card */}
      <div
        className={exiting ? 'tut-card-exit' : entering ? 'tut-content-enter' : 'tut-card-enter'}
        style={{
          position: 'relative', zIndex: 1,
          width: '100%', maxWidth: 500,
          background: 'white',
          borderRadius: 28, overflow: 'hidden',
          boxShadow: dimmed
            ? '0 32px 80px rgba(0,0,0,0.45)'
            : '0 24px 72px rgba(44,62,53,0.13)',
          border: '1.5px solid #F9DDB8',
          transition: 'box-shadow 0.35s',
        }}
      >
        {/* Rainbow bar */}
        <div className="tut-rainbow" />
 
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="tut-btn-skip"
          style={{ position: 'absolute', top: 14, right: 14, zIndex: 10 }}
          onMouseEnter={() => setDimmed(true)}
          onMouseLeave={() => setDimmed(false)}
        >
          <X size={12} /> Пропусни
        </button>
 
        <div style={{ padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
 
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 20 }}>
            <span className="tut-sway-1" style={{ opacity: 0.5, marginRight: 4 }}><Sprig /></span>
            <span className="tut-art" style={{ fontSize: '1.6rem', lineHeight: 1 }}>Art</span>
            <span className="tut-dot" style={{ marginBottom: 3 }} />
            <span className="tut-care" style={{ fontSize: '1.6rem', lineHeight: 1 }}>Care</span>
            <span className="tut-sway-2" style={{ opacity: 0.5, marginLeft: 4 }}><Sprig /></span>
          </div>
 
          {/* Floral divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginBottom: 28, opacity: 0.35 }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#F9DDB8)' }} />
            <TinyFlower />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#F9DDB8,#D4E3DE,#F9DDB8)' }} />
            <TinyFlower />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,#F9DDB8,transparent)' }} />
          </div>
 
          {/* Step number pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 999, marginBottom: 16,
            background: current.accentBg,
            border: `1px solid ${current.accentColor}30`,
            fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em',
            color: current.accentColor,
          }}>
            <TinyFlower size={10} />
            Стъпка {step + 1} от {STEPS.length}
          </div>
 
          {/* Icon */}
          <div
            className="tut-icon-float"
            style={{
              width: 80, height: 80, borderRadius: 22,
              background: current.accentBg,
              border: `1.5px solid ${current.accentColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
              boxShadow: `0 8px 24px ${current.accentColor}20`,
            }}
          >
            {current.icon}
          </div>
 
          {/* Title */}
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 'clamp(1.4rem,3vw,1.75rem)',
            fontWeight: 700, fontStyle: 'italic',
            color: '#2C3E35', margin: '0 0 12px', lineHeight: 1.2,
            position: 'relative',
          }}>
            {current.title}
            <span style={{
              display: 'block', height: 2, borderRadius: 999, marginTop: 8,
              background: `linear-gradient(90deg,transparent,${current.accentColor},transparent)`,
            }} />
          </h1>
 
          {/* Description */}
          <p style={{
            fontSize: '0.9rem', lineHeight: 1.8,
            color: '#5C6E6A', margin: '0 0 24px',
            maxWidth: 380,
          }}>
            {current.description}
          </p>
 
          {/* Progress dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`tut-prog-dot${i === step ? ' active' : ''}`}
                onClick={() => goTo(i)}
                style={{
                  height: 6,
                  width: i === step ? 22 : 6,
                  background: i === step ? current.accentColor : '#E8DDD0',
                  boxShadow: i === step ? `0 0 0 3px ${current.accentColor}25` : 'none',
                }}
              />
            ))}
          </div>
 
          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 380 }}>
            {!isFirst && (
              <button
                onClick={handleBack}
                className="tut-btn-secondary"
                style={{ flex: '0 0 auto', padding: '12px 14px' }}
                onMouseEnter={() => setDimmed(true)}
                onMouseLeave={() => setDimmed(false)}
              >
                <ArrowLeft size={16} />
              </button>
            )}
 
            <button
              onClick={handleNext}
              className="tut-btn-next"
              onMouseEnter={() => setDimmed(true)}
              onMouseLeave={() => setDimmed(false)}
            >
              {isLast
                ? <><Sparkles size={16} className="tut-sparkle" /> Започни пътуването</>
                : <>Напред <ArrowRight size={16} /></>
              }
            </button>
 
            {current.page && current.pageLabel && !isLast && (
              <button
                onClick={() => navigate(current.page!)}
                className="tut-btn-secondary"
                onMouseEnter={() => setDimmed(true)}
                onMouseLeave={() => setDimmed(false)}
              >
                {current.pageLabel}
              </button>
            )}
          </div>
 
          {/* Step hint */}
          <p style={{ fontSize: '0.68rem', color: '#C4B9AE', marginTop: 14, marginBottom: 0 }}>
            Щракнете върху точките, за да прескочите напред
          </p>
 
        </div>
      </div>
    </div>
  );
};
 
export default Tutorial;