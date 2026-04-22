import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

export interface PageTutorialStep {
  targetSelector?: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  accentColor?: string;
  accentBg?: string;
  completionQuote?: string;
}

interface PageTutorialProps {
  storageKey: string;
  steps: PageTutorialStep[];
  onDone?: () => void;
}

const C = {
  salmon: '#E88067', peach: '#FBBD96', cream: '#F9DDB8',
  sage: '#A3B995', mist: '#A8BBB9', mistLt: '#D4E3DE',
  forest: '#2C3E35', stone: '#5C6E6A', bgWarm: '#FAF5EF', border: '#F9DDB8',
};

const TinyFlower = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="2" fill="#FBBD96"/>
    <ellipse cx="7" cy="3.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="7" cy="10.5" rx="1.5" ry="2" fill="#E88067" opacity="0.7"/>
    <ellipse cx="3.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
    <ellipse cx="10.5" cy="7" rx="2" ry="1.5" fill="#FCCAAB" opacity="0.7"/>
  </svg>
);

interface SpotRect { top: number; left: number; width: number; height: number; }

function getSpotRect(selector: string): SpotRect | null {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const pad = 10;
  return { top: r.top - pad, left: r.left - pad, width: r.width + pad*2, height: r.height + pad*2 };
}

const TOOLTIP_W = 296;
const TOOLTIP_H = 230;

function tooltipPos(spot: SpotRect, placement: PageTutorialStep['placement']): { top: number; left: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const gap = 14;
  let top = 0, left = 0;

  switch (placement) {
    case 'top':
      top  = spot.top - TOOLTIP_H - gap;
      left = spot.left + spot.width / 2 - TOOLTIP_W / 2;
      break;
    case 'bottom':
      top  = spot.top + spot.height + gap;
      left = spot.left + spot.width / 2 - TOOLTIP_W / 2;
      break;
    case 'left':
      top  = spot.top + spot.height / 2 - TOOLTIP_H / 2;
      left = spot.left - TOOLTIP_W - gap;
      break;
    case 'right':
      top  = spot.top + spot.height / 2 - TOOLTIP_H / 2;
      left = spot.left + spot.width + gap;
      break;
    default:
      top  = vh / 2 - TOOLTIP_H / 2;
      left = vw / 2 - TOOLTIP_W / 2;
  }

  return {
    top:  Math.max(12, Math.min(top,  vh - TOOLTIP_H - 12)),
    left: Math.max(12, Math.min(left, vw - TOOLTIP_W - 12)),
  };
}

const PageTutorial: React.FC<PageTutorialProps> = ({ storageKey, steps, onDone }) => {
  const [visible,   setVisible]   = useState(false);
  const [stepIdx,   setStepIdx]   = useState(0);
  const [spotRect,  setSpotRect]  = useState<SpotRect | null>(null);
  const [exiting,   setExiting]   = useState(false);
  const [showQuote, setShowQuote] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 900);
      return () => clearTimeout(t);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!visible) return;
    const step = steps[stepIdx];
    if (step?.targetSelector) {
      const update = () => {
        const r = getSpotRect(step.targetSelector!);
        setSpotRect(r);
      };
      update();
      // retry once after paint in case element isn't laid out yet
      const t = setTimeout(update, 200);
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, { passive: true });
      return () => {
        clearTimeout(t);
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update);
      };
    } else {
      setSpotRect(null);
    }
  }, [visible, stepIdx, steps]);

  const dismiss = useCallback((completed = false) => {
    localStorage.setItem(storageKey, 'true');
    const lastStep = steps[steps.length - 1];
    if (completed && lastStep?.completionQuote) {
      setShowQuote(true);
      setTimeout(() => { setShowQuote(false); setVisible(false); onDone?.(); }, 4500);
    } else {
      setExiting(true);
      setTimeout(() => { setVisible(false); setExiting(false); onDone?.(); }, 260);
    }
  }, [storageKey, steps, onDone]);

  const goNext = () => {
    if (stepIdx === steps.length - 1) { dismiss(true); return; }
    setExiting(true);
    setTimeout(() => { setStepIdx(i => i + 1); setExiting(false); }, 200);
  };

  const goBack = () => {
    if (stepIdx === 0) return;
    setExiting(true);
    setTimeout(() => { setStepIdx(i => i - 1); setExiting(false); }, 200);
  };

  if (!visible) return null;

  const step     = steps[stepIdx];
  const isFirst  = stepIdx === 0;
  const isLast   = stepIdx === steps.length - 1;
  const accent   = step.accentColor ?? C.salmon;
  const accentBg = step.accentBg    ?? '#FFF0EB';

  const pos = spotRect
    ? tooltipPos(spotRect, step.placement ?? 'bottom')
    : { top: window.innerHeight / 2 - TOOLTIP_H / 2, left: window.innerWidth / 2 - TOOLTIP_W / 2 };

  return (
    <>
      <style>{`
        @keyframes pt-borderFlow { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes pt-fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes pt-fadeOut    { from{opacity:1} to{opacity:0} }
        @keyframes pt-popIn      { from{opacity:0;transform:scale(.88) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pt-popOut     { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.9)} }
        @keyframes pt-ringPulse  { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes pt-quoteIn    { from{opacity:0;transform:translateY(18px) scale(.95)} to{opacity:1;transform:none} }
        @keyframes pt-sparkle    { 0%,100%{transform:scale(1) rotate(0)} 50%{transform:scale(1.2) rotate(14deg)} }

        .pt-rainbow {
          height:3px;
          background:linear-gradient(90deg,#E88067,#FBBD96,#F9DDB8,#A3B995,#A8BBB9,#E88067);
          background-size:200% 100%;
          animation:pt-borderFlow 6s ease infinite;
        }
        .pt-overlay  { animation:pt-fadeIn .28s ease both; }
        .pt-tooltip  { animation:pt-popIn .38s cubic-bezier(.34,1.56,.64,1) both; }
        .pt-exiting.pt-overlay  { animation:pt-fadeOut .24s ease forwards; }
        .pt-exiting.pt-tooltip  { animation:pt-popOut .2s ease forwards; }
        .pt-ring { animation:pt-ringPulse 2s ease-in-out infinite; }
        .pt-quote { animation:pt-quoteIn .45s cubic-bezier(.22,1,.36,1) both; }
        .pt-sparkle { animation:pt-sparkle 2s ease-in-out infinite; }

        .pt-btn-next {
          flex:1; display:inline-flex; align-items:center; justify-content:center; gap:6px;
          padding:9px 14px; border-radius:12px; border:none; cursor:pointer;
          font-family:'Nunito',sans-serif; font-size:0.82rem; font-weight:800; color:white;
          background:linear-gradient(135deg,#E88067,#FBBD96);
          box-shadow:0 3px 12px rgba(232,128,103,.28);
          transition:transform .18s cubic-bezier(.34,1.56,.64,1),box-shadow .18s;
        }
        .pt-btn-next:hover { transform:translateY(-2px); box-shadow:0 7px 20px rgba(232,128,103,.38); }

        .pt-btn-back {
          display:inline-flex; align-items:center; justify-content:center;
          padding:9px 11px; border-radius:12px; cursor:pointer;
          font-family:'Nunito',sans-serif; font-size:0.82rem; font-weight:700;
          color:#5C6E6A; background:white; border:1.5px solid #F9DDB8;
          transition:transform .18s,border-color .18s,color .18s;
        }
        .pt-btn-back:hover { transform:translateY(-2px); border-color:#FCCAAB; color:#E88067; }

        .pt-btn-skip {
          background:none; border:none; cursor:pointer;
          font-family:'Nunito',sans-serif; font-size:0.68rem; font-weight:700;
          color:#A8BBB9; transition:color .18s; padding:0;
          display:inline-flex; align-items:center; gap:3px;
        }
        .pt-btn-skip:hover { color:#E88067; }
      `}</style>

      {/* ── dim overlay ── */}
      <div
        className={`pt-overlay${exiting ? ' pt-exiting' : ''}`}
        style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(26,43,37,.6)', backdropFilter:'blur(2px)', pointerEvents:'none' }}
        aria-hidden
      />

      {/* ── spotlight SVG ── */}
      {spotRect && (
        <svg
          style={{ position:'fixed', inset:0, zIndex:9001, pointerEvents:'none', width:'100vw', height:'100vh', overflow:'visible' }}
          aria-hidden
        >
          <defs>
            <mask id="pt-mask">
              <rect width="100%" height="100%" fill="white"/>
              <rect
                x={spotRect.left} y={spotRect.top}
                width={spotRect.width} height={spotRect.height}
                rx="16" fill="black"
              />
            </mask>
          </defs>
          {/* slightly re-darken outside */}
          <rect width="100%" height="100%" fill="rgba(26,43,37,.25)" mask="url(#pt-mask)"/>
          {/* animated ring */}
          <rect
            className="pt-ring"
            x={spotRect.left} y={spotRect.top}
            width={spotRect.width} height={spotRect.height}
            rx="16" fill="none"
            stroke={accent} strokeWidth="2.5"
            style={{ filter:`drop-shadow(0 0 8px ${accent}80)` }}
          />
          {/* dashed connector to tooltip */}
          {step.placement !== 'center' && (
            <line
              x1={spotRect.left + spotRect.width / 2}
              y1={['top','left','right'].includes(step.placement ?? '') ? spotRect.top : spotRect.top + spotRect.height}
              x2={pos.left + TOOLTIP_W / 2}
              y2={step.placement === 'top' ? pos.top + TOOLTIP_H : pos.top}
              stroke={accent} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"
            />
          )}
        </svg>
      )}

      {/* ── tooltip card ── */}
      <div
        className={`pt-tooltip${exiting ? ' pt-exiting' : ''}`}
        style={{
          position:'fixed', top:pos.top, left:pos.left,
          width:TOOLTIP_W, zIndex:9002,
          background:'white', borderRadius:20, overflow:'hidden',
          boxShadow:'0 16px 52px rgba(44,62,53,.22)',
          border:`1.5px solid ${accent}28`,
        }}
      >
        <div className="pt-rainbow"/>

        <div style={{ padding:'15px 17px 14px' }}>

          {/* header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
            <div>
              {/* step pill */}
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:999, marginBottom:6, background:accentBg, fontSize:'0.58rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:accent }}>
                <TinyFlower/> {stepIdx+1} / {steps.length}
              </div>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.05rem', fontWeight:700, color:C.forest, margin:0, lineHeight:1.2 }}>
                {step.title}
              </h3>
            </div>
            <button onClick={() => dismiss(false)} className="pt-btn-skip" aria-label="Затвори" style={{ marginTop:2 }}>
              <X size={13}/>
            </button>
          </div>

          {/* thin divider */}
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:9, opacity:.3 }}>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${accent}60)` }}/>
            <TinyFlower/>
            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${accent}60,transparent)` }}/>
          </div>

          {/* description */}
          <p style={{ fontSize:'0.79rem', lineHeight:1.7, color:C.stone, margin:'0 0 13px' }}>
            {step.description}
          </p>

          {/* progress dots */}
          <div style={{ display:'flex', gap:5, marginBottom:11 }}>
            {steps.map((_,i) => (
              <div key={i} style={{ height:4, borderRadius:999, transition:'width .35s cubic-bezier(.34,1.56,.64,1),background .3s', width:i===stepIdx?16:4, background:i===stepIdx?accent:'#E8DDD0' }}/>
            ))}
          </div>

          {/* actions */}
          <div style={{ display:'flex', gap:7 }}>
            {!isFirst && (
              <button onClick={goBack} className="pt-btn-back">
                <ArrowLeft size={13}/>
              </button>
            )}
            <button onClick={goNext} className="pt-btn-next">
              {isLast
                ? <><Sparkles size={12} className="pt-sparkle"/> Готово!</>
                : <>Напред <ArrowRight size={13}/></>
              }
            </button>
          </div>

          {/* skip */}
          <button onClick={() => dismiss(false)} className="pt-btn-skip" style={{ marginTop:9, width:'100%', justifyContent:'center' }}>
            Пропусни ръководството
          </button>

        </div>
      </div>

      {/* ── completion quote overlay ── */}
      {showQuote && (
        <div style={{ position:'fixed', inset:0, zIndex:9100, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'rgba(250,245,239,.92)', backdropFilter:'blur(18px)' }}>
          <div className="pt-quote" style={{ background:'white', borderRadius:24, padding:'32px 28px', maxWidth:380, width:'100%', textAlign:'center', boxShadow:'0 24px 64px rgba(44,62,53,.14)', border:`1.5px solid ${C.border}`, position:'relative', overflow:'hidden' }}>
            <div className="pt-rainbow" style={{ position:'absolute', top:0, left:0, right:0 }}/>
            <div style={{ fontSize:'2rem', marginBottom:14 }}>🌸</div>
            <p style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.15rem', fontWeight:700, color:C.forest, lineHeight:1.65, margin:'0 0 14px' }}>
              {steps[steps.length-1]?.completionQuote}
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:5, justifyContent:'center', opacity:.4 }}>
              <TinyFlower/>
              <span style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.16em', color:C.mist }}>ARTCARE</span>
              <TinyFlower/>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PageTutorial;

/* ════════════ PER-PAGE STEP CONFIGS ════════════════════════════════ */

export const GALLERY_TUTORIAL_STEPS: PageTutorialStep[] = [
  {
    title: 'Вашата лична галерия',
    description: 'Тук живеят всичките ви творби. Качвайте картини, скици или снимки и ги пазете на едно красиво място.',
    placement: 'center',
    accentColor: '#FBBD96', accentBg: '#FFF8EE',
  },
  {
    targetSelector: '[data-tutorial="gallery-upload"]',
    title: 'Качете творба',
    description: 'Натиснете тук, за да добавите нова творба. Прикачете изображение, добавете заглавие и я свържете с изпълнена задача.',
    placement: 'bottom',
    accentColor: '#FBBD96', accentBg: '#FFF8EE',
  },
  {
    targetSelector: '[data-tutorial="gallery-filter"]',
    title: 'Организирайте с папки',
    description: 'Филтрирайте творбите си по папка, дата или етикети. Така лесно намирате любимите моменти.',
    placement: 'bottom',
    accentColor: '#FBBD96', accentBg: '#FFF8EE',
  },
  {
    title: 'Готови сте! 🖼️',
    description: 'Вашата галерия ви чака. Всяка творба е стъпка в пътуването ви — не я подценявайте.',
    placement: 'center',
    accentColor: '#FBBD96', accentBg: '#FFF8EE',
    completionQuote: 'Всяка линия, която нарисувате, е доказателство, че сте били тук. 🌿',
  },
];

export const JOURNAL_TUTORIAL_STEPS: PageTutorialStep[] = [
  {
    title: 'Добре дошли в дневника',
    description: 'Вашето лично пространство за мисли, чувства и рефлексия. Всичко написано тук е само ваше.',
    placement: 'center',
    accentColor: '#A3B995', accentBg: '#EEF4EE',
  },
  {
    targetSelector: '[data-tutorial="journal-new"]',
    title: 'Нов запис',
    description: 'Натиснете тук, за да започнете нов запис. Пишете свободно или следвайте насоките на ARTCARE.',
    placement: 'bottom',
    accentColor: '#A3B995', accentBg: '#EEF4EE',
  },
  {
    targetSelector: '[data-tutorial="journal-prompts"]',
    title: 'Творчески насоки',
    description: 'Ако не знаете откъде да започнете, използвайте нашите насоки — вдъхновяващи въпроси за себеизразяване.',
    placement: 'left',
    accentColor: '#A3B995', accentBg: '#EEF4EE',
  },
  {
    title: 'Пишете без страх 📖',
    description: 'Дневникът ви е безопасно място. Пишете честно, пишете свободно — само присъствието има значение.',
    placement: 'center',
    accentColor: '#A3B995', accentBg: '#EEF4EE',
    completionQuote: 'Думите, написани за себе си, имат особена магия — те лекуват бавно и тихо. 🌸',
  },
];

export const THERAPY_TUTORIAL_STEPS: PageTutorialStep[] = [
  {
    title: 'Дневните ви задачи',
    description: 'Всеки ден ви очакват 10 творчески задачи. Малки покани да спрете, да създадете и да се свържете със себе си.',
    placement: 'center',
    accentColor: '#E88067', accentBg: '#FFF0EB',
  },
  {
    targetSelector: '[data-tutorial="therapy-task-card"]',
    title: 'Задача за деня',
    description: 'Всяка карта съдържа кратко творческо предизвикателство. Натиснете я, за да я отметнете като изпълнена.',
    placement: 'bottom',
    accentColor: '#E88067', accentBg: '#FFF0EB',
  },
  {
    targetSelector: '[data-tutorial="therapy-streak"]',
    title: 'Вашата поредица',
    description: 'Тук се вижда колко последователни дни сте изпълнявали задачи. Малките навици изграждат нещо голямо.',
    placement: 'bottom',
    accentColor: '#E88067', accentBg: '#FFF0EB',
  },
  {
    title: 'Готови сте! 🎯',
    description: 'Не е нужно всичко да е съвършено. Достатъчно е да опитате — това е най-важната стъпка.',
    placement: 'center',
    accentColor: '#E88067', accentBg: '#FFF0EB',
    completionQuote: 'Не съвършеното, а опитаното — то е истинската творба. 🌺',
  },
];

export const HISTORY_TUTORIAL_STEPS: PageTutorialStep[] = [
  {
    title: 'Вашата история',
    description: 'Тук можете да проследите своя творчески път — завършени задачи, поредици и развитие с времето.',
    placement: 'center',
    accentColor: '#A8BBB9', accentBg: '#EEF4F2',
  },
  {
    targetSelector: '[data-tutorial="history-chart"]',
    title: 'Статистика',
    description: 'Вижте кога сте най-активни и как се развива вашата творческа рутина. Всеки ден отбелязан тук е победа.',
    placement: 'bottom',
    accentColor: '#A8BBB9', accentBg: '#EEF4F2',
  },
  {
    targetSelector: '[data-tutorial="history-streaks"]',
    title: 'Поредици',
    description: 'Тук се вижда вашият личен рекорд и текущата поредица. Колко далеч можете да стигнете?',
    placement: 'top',
    accentColor: '#A8BBB9', accentBg: '#EEF4F2',
    completionQuote: 'Всяка стъпка напред, колкото и малка, е вече история. ✨',
  },
];

export const PROFILE_TUTORIAL_STEPS: PageTutorialStep[] = [
  {
    title: 'Вашият профил',
    description: 'Тук управлявате вашите лични данни, снимка и следите постиженията си в ARTCARE.',
    placement: 'center',
    accentColor: '#E88067', accentBg: '#FFF0EB',
  },
  {
    targetSelector: '[data-tutorial="profile-avatar"]',
    title: 'Вашата снимка',
    description: 'Натиснете тук, за да качите профилна снимка. Малките детайли правят пространството по-ваше.',
    placement: 'right',
    accentColor: '#E88067', accentBg: '#FFF0EB',
  },
  {
    targetSelector: '[data-tutorial="profile-settings"]',
    title: 'Действия',
    description: 'Редактирайте профила, разгледайте бързите връзки или излезте от акаунта от тук.',
    placement: 'top',
    accentColor: '#E88067', accentBg: '#FFF0EB',
    completionQuote: 'ARTCARE е вашето пространство — направете го точно такова, каквото ви е нужно. 🌿',
  },
];