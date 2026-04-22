import React, { useState, useEffect, useRef } from 'react';
import {
  Image, Upload, Star, Trash2, Search, Grid, List,
  X, Calendar, Tag, Download, Share2, Camera, FolderPlus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QuoteDisplay from '../utils/QuoteDisplay';
import PageTutorial, { GALLERY_TUTORIAL_STEPS } from '../components/PageTutorial';

/* ── Types ────────────────────────────────────────────────────────── */
interface Artwork {
  id: string; title: string; description?: string; imageUrl: string;
  date: string; time: string; taskId?: string; taskName?: string;
  tags: string[]; favorite: boolean; folder?: string; size?: string;
}

const FOLDERS = ['Всички', 'Любими', 'Задачи', 'Спонтанни', 'Скетчове', 'Завършени'];

/* ── Palette — identical to Therapy & Journal ────────────────────── */
const C = {
  salmon:  '#E88067',
  peach:   '#FBBD96',
  cream:   '#F9DDB8',
  sage:    '#A3B995',
  mist:    '#A8BBB9',
  mistLt:  '#D4E3DE',
  forest:  '#2C3E35',
  stone:   '#5C6E6A',
  bgWarm:  '#FAF5EF',
  bgCard:  '#FFF8F3',
  border:  '#F9DDB8',
};

/* ── Same botanical SVGs as Therapy / Journal / Header ───────────── */
const Sprig = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={style}>
    <path d="M9 16 C9 16 9 8 9 3" stroke={C.sage} strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M9 10 C7 8 4 8 3 6 C5 5 8 7 9 10Z" fill={C.sage} opacity="0.7"/>
    <path d="M9 7 C11 5 14 5 15 3 C13 2 10 4 9 7Z" fill={C.mist} opacity="0.7"/>
    <path d="M9 13 C7 11 5 12 4 10 C6 9 8 11 9 13Z" fill={C.sage} opacity="0.5"/>
  </svg>
);

const TinyFlower = ({ style }: { style?: React.CSSProperties }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={style}>
    <circle cx="7" cy="7" r="2" fill={C.peach}/>
    <ellipse cx="7"    cy="3.5"  rx="1.5" ry="2"   fill={C.salmon} opacity="0.7"/>
    <ellipse cx="7"    cy="10.5" rx="1.5" ry="2"   fill={C.salmon} opacity="0.7"/>
    <ellipse cx="3.5"  cy="7"    rx="2"   ry="1.5" fill="#FCCAAB"  opacity="0.7"/>
    <ellipse cx="10.5" cy="7"    rx="2"   ry="1.5" fill="#FCCAAB"  opacity="0.7"/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════════ */
const Gallery: React.FC = () => {
  const { currentUser, loading, isAuthenticated } = useAuth();

  const [artworks,   setArtworks]   = useState<Artwork[]>([]);
  const [filtered,   setFiltered]   = useState<Artwork[]>([]);
  const [folder,     setFolder]     = useState('Всички');
  const [searchTerm, setSearch]     = useState('');
  const [viewMode,   setView]       = useState<'grid'|'list'>('grid');
  const [showModal,  setShowModal]  = useState(false);
  const [uploadMode, setUpMode]     = useState<'file'|'camera'>('file');
  const [newArt,     setNew]        = useState<Partial<Artwork>>({ title:'', description:'', tags:[], favorite:false, folder:'Спонтанни' });
  const [selFile,    setFile]       = useState<File | null>(null);
  const [preview,    setPreview]    = useState('');
  const [showQuote,  setShowQuote]  = useState(false);
  const [quoteVis,   setQuoteVis]   = useState(false);
  const [tagInput,   setTagInput]   = useState('');
  const [camStream,  setCamStream]  = useState<MediaStream | null>(null);
  const [camCapture, setCamCapture] = useState(false);
  const fileRef   = useRef<HTMLInputElement>(null);
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const quoteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── load ── */
  useEffect(() => {
    if (currentUser) {
      const saved = localStorage.getItem(`artcare_gallery_${currentUser.uid}`);
      if (saved) { try { const p = JSON.parse(saved); setArtworks(p); setFiltered(p); } catch {} }
    }
  }, [currentUser]);

  useEffect(() => {
    let f = artworks;
    if (folder !== 'Всички') {
      if (folder === 'Любими') f = f.filter(a => a.favorite);
      else if (folder === 'Задачи') f = f.filter(a => a.taskId);
      else f = f.filter(a => a.folder === folder);
    }
    if (searchTerm) f = f.filter(a =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFiltered(f);
  }, [folder, searchTerm, artworks]);

  useEffect(() => () => { camStream?.getTracks().forEach(t => t.stop()); }, [camStream]);

  const saveAll = (list: Artwork[]) => {
    if (!currentUser) return;
    localStorage.setItem(`artcare_gallery_${currentUser.uid}`, JSON.stringify(list));
  };

  /* ── quote toast ── */
  const triggerQuote = () => {
    setShowQuote(true); setQuoteVis(true);
    if (quoteTimer.current) clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => {
      setQuoteVis(false);
      setTimeout(() => setShowQuote(false), 380);
    }, 6000);
  };

  /* ── camera ── */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCamStream(stream);
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
    } catch { alert('Не може да се отвори камерата.'); setUpMode('file'); }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current, c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      const file = new File([blob], `scan-${Date.now()}.jpg`, { type:'image/jpeg' });
      setFile(file); setPreview(URL.createObjectURL(file)); setCamCapture(true);
      camStream?.getTracks().forEach(t => t.stop()); setCamStream(null);
    }, 'image/jpeg', 0.9);
  };

  const retakePhoto = () => {
    setCamCapture(false); setPreview(''); setFile(null); startCamera();
  };

  const switchMode = (mode: 'file'|'camera') => {
    setUpMode(mode); setPreview(''); setFile(null); setCamCapture(false);
    camStream?.getTracks().forEach(t => t.stop()); setCamStream(null);
    if (mode === 'camera') setTimeout(startCamera, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Моля изберете изображение'); return; }
    if (file.size > 10*1024*1024) { alert('Изображението трябва да е под 10MB'); return; }
    setFile(file); setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    if (!currentUser || !selFile || !newArt.title) return;
    const now = new Date();
    const art: Artwork = {
      id: `art-${Date.now()}`, title: newArt.title!,
      description: newArt.description,
      imageUrl: URL.createObjectURL(selFile),
      date: now.toLocaleDateString('bg-BG'),
      time: now.toLocaleTimeString('bg-BG', { hour:'2-digit', minute:'2-digit' }),
      tags: newArt.tags||[], favorite: newArt.favorite||false,
      folder: newArt.folder||'Спонтанни',
      size: `${(selFile.size/1024/1024).toFixed(2)} MB`,
    };
    const updated = [art, ...artworks];
    setArtworks(updated); saveAll(updated);
    triggerQuote(); resetModal();
  };

  const resetModal = () => {
    if (preview) URL.revokeObjectURL(preview);
    camStream?.getTracks().forEach(t => t.stop());
    setCamStream(null); setCamCapture(false); setUpMode('file');
    setFile(null); setPreview('');
    setNew({ title:'', description:'', tags:[], favorite:false, folder:'Спонтанни' });
    setShowModal(false); setTagInput('');
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !newArt.tags?.includes(tag.trim()))
      setNew(p => ({ ...p, tags:[...(p.tags||[]), tag.trim()] }));
  };
  const removeTag = (tag: string) => setNew(p => ({ ...p, tags:p.tags?.filter(t=>t!==tag)||[] }));

  const toggleFav = (id: string) => {
    const u = artworks.map(a => a.id===id ? {...a, favorite:!a.favorite} : a);
    setArtworks(u); saveAll(u);
  };

  const handleDelete = (id: string) => {
    if (!currentUser || !window.confirm('Изтриване на творбата?')) return;
    const u = artworks.filter(a => a.id!==id);
    setArtworks(u); saveAll(u);
  };

  const handleDownload = (a: Artwork) => {
    const el = document.createElement('a'); el.href=a.imageUrl; el.download=`${a.title}.jpg`; el.click();
  };

  const handleShare = async (a: Artwork) => {
    if (navigator.share) await navigator.share({ title:a.title, url:a.imageUrl });
    else { navigator.clipboard.writeText(a.imageUrl); alert('Линкът е копиран!'); }
  };

  /* ── guards ── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:44, height:44, borderRadius:'50%', border:`4px solid ${C.mistLt}`, borderTopColor:C.salmon, margin:'0 auto 16px', animation:'spin .8s linear infinite' }}/>
        <p style={{ color:C.stone, fontWeight:600 }}>Зареждане на галерията...</p>
      </div>
    </div>
  );

  if (!isAuthenticated) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:`linear-gradient(160deg,${C.bgWarm},#EEF4F2)`, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'white', borderRadius:24, padding:48, textAlign:'center', maxWidth:400, width:'100%', border:`2px solid ${C.border}`, boxShadow:'0 24px 64px rgba(44,62,53,0.11)' }}>
        <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})` }}>
          <Image size={28} color="white"/>
        </div>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.7rem', fontWeight:700, color:C.forest, marginBottom:10 }}>Лична галерия</h2>
        <p style={{ color:C.stone, marginBottom:28, fontSize:'0.9rem' }}>Моля, влезте за да достъпите вашите творби.</p>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <a href="/login"    style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, textDecoration:'none' }}>Вход</a>
          <a href="/register" style={{ padding:'10px 24px', borderRadius:999, fontWeight:700, color:C.salmon, border:`2px solid ${C.border}`, textDecoration:'none' }}>Регистрация</a>
        </div>
      </div>
    </div>
  );

  /* ═══════════════════════════ RENDER ═════════════════════════════ */
  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(160deg,${C.bgWarm} 0%,#EEF4F2 100%)`, fontFamily:"'Nunito',sans-serif", paddingBottom:72 }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600;1,700&family=Nunito:wght@400;600;700;800&display=swap');

        @keyframes spin        { to{transform:rotate(360deg)} }
        @keyframes borderFlow  { 0%,100%{background-position:0%} 50%{background-position:100%} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardIn      { from{opacity:0;transform:translateY(12px) scale(.97)} to{opacity:1;transform:none} }
        @keyframes toastIn     { from{opacity:0;transform:translateX(60px) scale(.94)} to{opacity:1;transform:translateX(0) scale(1)} }
        @keyframes toastOut    { from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(60px)} }
        @keyframes editorIn    { from{opacity:0;transform:translateY(18px) scale(.98)} to{opacity:1;transform:none} }
        @keyframes gentleFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes softSway    { 0%,100%{transform:rotate(-5deg)} 50%{transform:rotate(5deg)} }
        @keyframes softPulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.88)} }
        @keyframes imgReveal   { from{opacity:0;transform:scale(1.04)} to{opacity:1;transform:scale(1)} }

        /* ── rainbow bar ── */
        .gal-rainbow {
          height:3px; border-radius:999px;
          background:linear-gradient(90deg,${C.salmon},${C.peach},${C.cream},${C.sage},${C.mist},${C.salmon});
          background-size:200% 100%;
          animation:borderFlow 6s ease infinite;
        }

        /* ── page cards — same as .th-card / .jnl-card ── */
        .gal-card {
          animation: fadeUp .5s cubic-bezier(.22,1,.36,1) both;
          border-radius: 24px;
          background: white;
          border: 1px solid ${C.border};
          box-shadow: 0 3px 14px rgba(44,62,53,0.07);
          transition: box-shadow .22s, transform .22s;
        }
        .gal-card:hover { box-shadow: 0 10px 28px rgba(44,62,53,0.10); }

        /* ── artwork tile ── */
        .art-tile {
          animation: cardIn .45s cubic-bezier(.22,1,.36,1) both;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid ${C.border};
          background: white;
          transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
          cursor: pointer;
        }
        .art-tile:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow: 0 18px 40px rgba(44,62,53,0.13);
          border-color: #FCCAAB;
        }
        .art-tile img { animation: imgReveal .5s ease both; }
        .art-tile .art-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to bottom, rgba(44,62,53,0.18), rgba(44,62,53,0.62));
          opacity:0; transition:opacity .28s;
          display:flex; flex-direction:column; justify-content:space-between; padding:12px;
        }
        .art-tile:hover .art-overlay { opacity:1; }

        /* ── buttons — same as .th-btn / .jnl-btn ── */
        .gal-btn {
          cursor:pointer; border:none;
          transition:transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s;
        }
        .gal-btn:hover  { transform:translateY(-2px); }
        .gal-btn:active { transform:scale(.97); }

        .gal-ghost {
          cursor:pointer;
          transition:transform .18s, background .18s, border-color .18s, color .18s;
        }
        .gal-ghost:hover { transform:translateY(-2px); background:#FFF0EB !important; border-color:#FCCAAB !important; color:${C.salmon} !important; }

        /* ── icon action button ── */
        .gal-act {
          cursor:pointer; border:none;
          transition:transform .18s, box-shadow .18s;
        }
        .gal-act:hover  { transform:scale(1.12); }
        .gal-act:active { transform:scale(.95); }

        /* ── folder pill ── */
        .folder-pill {
          cursor:pointer;
          transition:transform .18s, background .18s, border-color .18s, color .18s, box-shadow .18s;
        }
        .folder-pill:hover { transform:translateY(-2px); }

        /* ── input focus ── */
        .gal-input:focus {
          outline:none;
          border-color:${C.sage} !important;
          box-shadow:0 0 0 3px rgba(163,185,149,.18);
        }

        /* ── toast ── */
        .gal-toast-in  { animation:toastIn  .38s cubic-bezier(.22,1,.36,1) both; }
        .gal-toast-out { animation:toastOut .34s ease both; }

        /* ── modal ── */
        .gal-modal { animation:editorIn .34s cubic-bezier(.22,1,.36,1) both; }

        /* ── sway / float / sparkle ── */
        .gal-sway-l { animation:softSway 4.5s ease-in-out infinite;     transform-origin:bottom center; }
        .gal-sway-r { animation:softSway 4.5s ease-in-out infinite .6s; transform-origin:bottom center; }
        .gal-float  { animation:gentleFloat 4s ease-in-out infinite; }
        .gal-sparkle{ animation:softPulse 2.5s ease-in-out infinite; }

        /* ── grids ── */
        .art-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
        @media(max-width:540px){ .art-grid { grid-template-columns:repeat(2,1fr) !important; gap:10px; } }

        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:16px; }
        @media(max-width:680px){ .stats-grid { grid-template-columns:repeat(2,1fr) !important; } }
      `}</style>

      <PageTutorial storageKey="artcare_tut_gallery" steps={GALLERY_TUTORIAL_STEPS}/>

      {/* ── Quote toast ────────────────────────────────────────── */}
      {showQuote && (
        <div
          className={quoteVis ? 'gal-toast-in' : 'gal-toast-out'}
          style={{ position:'fixed', bottom:28, right:24, zIndex:80, maxWidth:300, width:'calc(100% - 48px)', background:'white', borderRadius:18, border:`1.5px solid ${C.border}`, boxShadow:'0 12px 40px rgba(44,62,53,0.14)', overflow:'hidden', pointerEvents:quoteVis?'auto':'none' }}
        >
          <div className="gal-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'12px 14px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="gal-float" style={{ fontSize:'1.2rem', lineHeight:1 }}>🎨</span>
                <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'0.88rem', fontWeight:700, color:C.forest }}>Творбата е запазена!</span>
              </div>
              <button
                onClick={() => { setQuoteVis(false); setTimeout(()=>setShowQuote(false),380); }}
                style={{ width:24, height:24, borderRadius:'50%', border:`1.5px solid ${C.mistLt}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s' }}
                onMouseEnter={e=>(e.currentTarget.style.transform='rotate(90deg)')}
                onMouseLeave={e=>(e.currentTarget.style.transform='none')}
              ><X size={11}/></button>
            </div>
            <div style={{ fontSize:'0.78rem', fontStyle:'italic', lineHeight:1.6, color:C.stone, background:C.bgWarm, borderRadius:12, padding:'8px 11px', border:`1px solid ${C.border}` }}>
              <QuoteDisplay type="upload"/>
            </div>
            <div style={{ display:'flex', gap:4, marginTop:8, opacity:.35 }}>
              <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
            </div>
          </div>
        </div>
      )}

      {/* ── Upload modal ─────────────────────────────────────────── */}
      {showModal && (
        <div
          style={{ position:'fixed', inset:0, zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16, background:'rgba(44,62,53,0.55)', backdropFilter:'blur(8px)' }}
          onClick={resetModal}
        >
          <div
            className="gal-modal"
            style={{ background:'white', width:'100%', maxWidth:600, maxHeight:'92vh', overflowY:'auto', borderRadius:28, boxShadow:'0 32px 80px rgba(44,62,53,0.25)', position:'relative', overflow:'hidden' }}
            onClick={e=>e.stopPropagation()}
          >
            <div className="gal-rainbow" style={{ borderRadius:0 }}/>
            <div style={{ padding:'24px 28px 28px' }}>

              {/* modal header */}
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                <div>
                  <p style={{ fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.18em', color:C.mist, marginBottom:2 }}>Галерия</p>
                  <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.5rem', fontWeight:700, color:C.forest, margin:0 }}>Качване на творба</h2>
                </div>
                <button
                  onClick={resetModal}
                  style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${C.border}`, background:C.bgWarm, color:C.stone, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'transform .2s', flexShrink:0 }}
                  onMouseEnter={e=>(e.currentTarget.style.transform='rotate(90deg)')}
                  onMouseLeave={e=>(e.currentTarget.style.transform='none')}
                ><X size={15}/></button>
              </div>

              {/* mode tabs */}
              <div style={{ display:'flex', gap:6, marginBottom:20, padding:5, borderRadius:18, background:C.bgWarm, border:`1.5px solid ${C.border}` }}>
                {(['file','camera'] as const).map(mode => (
                  <button key={mode}
                    onClick={() => switchMode(mode)}
                    className="gal-btn"
                    style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px', borderRadius:13, fontSize:'0.84rem', fontWeight:700,
                      background: uploadMode===mode ? (mode==='file' ? `linear-gradient(135deg,${C.salmon},${C.peach})` : `linear-gradient(135deg,${C.sage},${C.mist})`) : 'transparent',
                      color:      uploadMode===mode ? 'white' : C.stone,
                      boxShadow:  uploadMode===mode ? `0 4px 14px rgba(232,128,103,0.25)` : 'none',
                    }}
                  >
                    {mode==='file' ? <Upload size={14}/> : <Camera size={14}/>}
                    {mode==='file' ? 'Качи файл' : 'Сканирай'}
                  </button>
                ))}
              </div>

              {/* file upload zone */}
              {uploadMode==='file' && (
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{ borderRadius:18, border:`2px dashed ${preview ? C.sage : '#FCCAAB'}`, background:preview?'white':C.bgWarm, minHeight:170, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', marginBottom:20, overflow:'hidden', transition:'border-color .2s' }}
                >
                  {preview ? (
                    <img src={preview} alt="preview" style={{ width:'100%', height:240, objectFit:'cover', borderRadius:16 }}/>
                  ) : (
                    <div style={{ textAlign:'center', padding:'32px 24px' }}>
                      <div style={{ width:52, height:52, borderRadius:15, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)` }}>
                        <Upload size={24} color="white"/>
                      </div>
                      <p style={{ fontWeight:700, color:C.forest, marginBottom:4 }}>Кликнете или плъзнете изображение</p>
                      <p style={{ fontSize:'0.8rem', color:C.mist }}>PNG, JPG, WEBP до 10MB</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileSelect}/>
                </div>
              )}

              {/* camera zone */}
              {uploadMode==='camera' && (
                <div style={{ borderRadius:18, overflow:'hidden', marginBottom:20, background:'#111', minHeight:240, position:'relative' }}>
                  {!camCapture ? (
                    <>
                      <video ref={videoRef} autoPlay playsInline muted style={{ width:'100%', maxHeight:280, borderRadius:18 }}/>
                      <canvas ref={canvasRef} style={{ display:'none' }}/>
                      {camStream && (
                        <button onClick={capturePhoto}
                          className="gal-act"
                          style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', width:56, height:56, borderRadius:'50%', border:'4px solid white', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 6px 18px rgba(232,128,103,.5)` }}
                        ><Camera size={22} color="white"/></button>
                      )}
                      {!camStream && (
                        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ textAlign:'center' }}>
                            <div style={{ width:52, height:52, borderRadius:15, margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.sage},${C.mist})` }}>
                              <Camera size={24} color="white"/>
                            </div>
                            <p style={{ color:'white', fontWeight:700, fontSize:'0.84rem', marginBottom:10 }}>Инициализиране...</p>
                            <button onClick={startCamera}
                              className="gal-btn"
                              style={{ padding:'8px 20px', borderRadius:999, fontSize:'0.8rem', fontWeight:700, color:'white', background:`linear-gradient(135deg,${C.sage},${C.mist})` }}
                            >Отвори камера</button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ position:'relative' }}>
                      <img src={preview} alt="captured" style={{ width:'100%', borderRadius:18 }}/>
                      <button onClick={retakePhoto}
                        style={{ position:'absolute', bottom:12, right:12, padding:'6px 14px', borderRadius:999, fontSize:'0.75rem', fontWeight:700, color:'white', background:'rgba(44,62,53,0.75)', cursor:'pointer', border:'none' }}
                      >Снимай отново</button>
                    </div>
                  )}
                </div>
              )}

              {/* form fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                <div style={{ gridColumn:'1' }}>
                  <label style={{ display:'block', fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone, marginBottom:6 }}>Заглавие *</label>
                  <input type="text" value={newArt.title||''} onChange={e=>setNew(p=>({...p,title:e.target.value}))} placeholder="Заглавие на творбата"
                    className="gal-input"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:12, fontSize:'0.85rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, boxSizing:'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display:'block', fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone, marginBottom:6 }}>Папка</label>
                  <select value={newArt.folder||'Спонтанни'} onChange={e=>setNew(p=>({...p,folder:e.target.value}))}
                    style={{ width:'100%', padding:'10px 14px', borderRadius:12, fontSize:'0.85rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, boxSizing:'border-box', outline:'none', cursor:'pointer' }}
                  >
                    {FOLDERS.filter(f=>f!=='Всички'&&f!=='Любими').map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={{ display:'block', fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone, marginBottom:6 }}>Описание</label>
                  <textarea value={newArt.description||''} onChange={e=>setNew(p=>({...p,description:e.target.value}))} placeholder="Разкажете нещо за вашата творба..." rows={3}
                    className="gal-input"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:12, fontSize:'0.85rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, resize:'none', boxSizing:'border-box' }}
                  />
                </div>
                <div style={{ gridColumn:'1 / -1' }}>
                  <label style={{ display:'block', fontSize:'0.62rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.14em', color:C.stone, marginBottom:6 }}>Етикети</label>
                  <input type="text" value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="Добавете и натиснете Enter"
                    onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(tagInput); setTagInput(''); } }}
                    className="gal-input"
                    style={{ width:'100%', padding:'10px 14px', borderRadius:12, fontSize:'0.85rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, boxSizing:'border-box' }}
                  />
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {newArt.tags?.map((tag,i)=>(
                      <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:999, fontSize:'0.72rem', fontWeight:600, background:C.cream, color:C.stone, border:`1px solid rgba(252,202,171,0.5)` }}>
                        {tag}
                        <button onClick={()=>removeTag(tag)} style={{ opacity:.5, cursor:'pointer', background:'none', border:'none', fontSize:'0.8rem', color:C.stone, padding:0 }} onMouseEnter={e=>(e.currentTarget.style.opacity='1')} onMouseLeave={e=>(e.currentTarget.style.opacity='.5')}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <input type="checkbox" id="gal-fav" checked={newArt.favorite||false} onChange={e=>setNew(p=>({...p,favorite:e.target.checked}))} style={{ width:14, height:14, accentColor:C.salmon }}/>
                  <label htmlFor="gal-fav" style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', fontSize:'0.8rem', fontWeight:700, color:C.stone }}>
                    <Star size={13} style={{ color:C.peach }}/> Любима
                  </label>
                </div>
              </div>

              {/* modal footer */}
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:16, borderTop:`1.5px solid ${C.border}` }}>
                <button onClick={resetModal}
                  className="gal-ghost"
                  style={{ padding:'10px 20px', borderRadius:999, fontWeight:700, fontSize:'0.84rem', color:C.stone, background:'white', border:`1.5px solid ${C.mistLt}` }}
                >Отказ</button>
                <button onClick={handleUpload} disabled={!selFile||!newArt.title}
                  className="gal-btn"
                  style={{ padding:'10px 22px', borderRadius:999, fontWeight:700, fontSize:'0.84rem', color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'flex', alignItems:'center', gap:7, opacity:(!selFile||!newArt.title)?0.4:1 }}
                ><Upload size={15}/> Качи в галерията</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ MAIN ════════════════════════════ */}
      <div style={{ maxWidth:1160, margin:'0 auto', padding:'32px 20px' }}>

        {/* rainbow bar */}
        <div className="gal-rainbow" style={{ marginBottom:28 }}/>

        {/* ══ HEADER CARD ════════════════════════════════════════ */}
        <div className="gal-card" style={{ marginBottom:16, overflow:'hidden', animationDelay:'0s' }} data-tutorial="gallery-upload">
          <div className="gal-rainbow" style={{ borderRadius:0 }}/>
          <div style={{ padding:'22px 28px', display:'flex', flexWrap:'wrap', justifyContent:'space-between', alignItems:'center', gap:14 }}>
            <div>
              <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:700, color:C.forest, margin:0, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:44, height:44, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.32)` }}>
                  <Image size={20} color="white"/>
                </span>
                Лична галерия
              </h1>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:5, marginLeft:56 }}>
                <TinyFlower style={{ opacity:.55 }}/>
                <span style={{ fontSize:'0.75rem', color:C.stone, fontWeight:600, fontStyle:'italic' }}>{artworks.length} творби</span>
              </div>
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button onClick={()=>{ setUpMode('camera'); setShowModal(true); setTimeout(startCamera,200); }}
                className="gal-ghost"
                style={{ padding:'10px 18px', borderRadius:999, fontWeight:700, fontSize:'0.84rem', color:C.sage, background:'#EEF4EE', border:`1.5px solid ${C.sage}`, display:'flex', alignItems:'center', gap:7 }}
              ><Camera size={14}/> Сканирай</button>
              <button onClick={()=>{ setUpMode('file'); setShowModal(true); }}
                className="gal-btn"
                style={{ padding:'10px 22px', borderRadius:999, fontWeight:700, fontSize:'0.84rem', color:'white', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'flex', alignItems:'center', gap:7 }}
              ><Upload size={14}/> Качи творба</button>
            </div>
          </div>
        </div>

        {/* ══ FILTERS CARD ═══════════════════════════════════════ */}
        <div className="gal-card" style={{ padding:'18px 24px', marginBottom:16, animationDelay:'.06s' }} data-tutorial="gallery-filter">

          {/* folder pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
            {FOLDERS.map(f => {
              const active = folder===f;
              const count = f==='Всички' ? artworks.length : f==='Любими' ? artworks.filter(a=>a.favorite).length : null;
              return (
                <button key={f} onClick={()=>setFolder(f)}
                  className="folder-pill"
                  style={{ padding:'7px 16px', borderRadius:999, fontSize:'0.82rem', fontWeight:700, display:'flex', alignItems:'center', gap:5,
                    background: active ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'white',
                    color:      active ? 'white' : C.stone,
                    border:     active ? '1.5px solid transparent' : `1.5px solid ${C.mistLt}`,
                    boxShadow:  active ? `0 4px 14px rgba(232,128,103,.25)` : 'none',
                  }}
                >
                  {f==='Любими' && <Star size={11}/>}
                  {f==='Задачи' && <Tag size={11}/>}
                  {f}
                  {count !== null && (
                    <span style={{ padding:'1px 7px', borderRadius:999, fontSize:'0.68rem', fontWeight:700, background:active?'rgba(255,255,255,0.28)':C.cream, color:active?'white':C.stone }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* search + view toggle */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
            <div style={{ flex:'1 1 200px', position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:C.mist, pointerEvents:'none' }}/>
              <input type="text" placeholder="Търсене в галерията..."
                value={searchTerm} onChange={e=>setSearch(e.target.value)}
                className="gal-input"
                style={{ width:'100%', paddingLeft:34, paddingRight:14, paddingTop:9, paddingBottom:9, borderRadius:999, fontSize:'0.84rem', border:`1.5px solid ${C.mistLt}`, color:C.forest, background:C.bgWarm, boxSizing:'border-box' }}
              />
            </div>
            {/* view toggle */}
            <div style={{ display:'flex', borderRadius:999, overflow:'hidden', border:`1.5px solid ${C.mistLt}` }}>
              {(['grid','list'] as const).map(v => (
                <button key={v} onClick={()=>setView(v)}
                  className="gal-act"
                  style={{ padding:'9px 14px', display:'flex', alignItems:'center', justifyContent:'center', background: viewMode===v ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'white', color: viewMode===v ? 'white' : C.stone }}
                >
                  {v==='grid' ? <Grid size={14}/> : <List size={14}/>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ ARTWORKS ══════════════════════════════════════════ */}
        {filtered.length > 0 ? (
          viewMode==='grid' ? (
            <div className="art-grid">
              {filtered.map((art, idx) => (
                <div key={art.id} className="art-tile" style={{ animationDelay:`${idx*0.05}s` }}>
                  <div style={{ position:'relative', aspectRatio:'1', overflow:'hidden' }}>
                    <img src={art.imageUrl} alt={art.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} loading="lazy"/>
                    <div className="art-overlay">
                      {/* top: fav star */}
                      <div style={{ display:'flex', justifyContent:'flex-end' }}>
                        <button onClick={()=>toggleFav(art.id)}
                          className="gal-act"
                          style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background: art.favorite ? `linear-gradient(135deg,${C.salmon},${C.peach})` : 'rgba(255,255,255,0.92)' }}
                        ><Star size={13} color={art.favorite?'white':C.stone} fill={art.favorite?'white':'none'}/></button>
                      </div>
                      {/* bottom: actions */}
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:7 }}>
                        <button onClick={()=>handleDownload(art)} className="gal-act" style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.92)' }}><Download size={12} color={C.stone}/></button>
                        <button onClick={()=>handleShare(art)} className="gal-act" style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.92)' }}><Share2 size={12} color={C.stone}/></button>
                        <button onClick={()=>handleDelete(art.id)} className="gal-act" style={{ width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:`rgba(232,128,103,0.9)` }}><Trash2 size={12} color="white"/></button>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding:'12px 14px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:700, fontSize:'0.95rem', color:C.forest, margin:0, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{art.title}</h3>
                      {art.folder && (
                        <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:C.mistLt, color:C.stone, marginLeft:6, flexShrink:0, fontWeight:600 }}>{art.folder}</span>
                      )}
                    </div>
                    {art.description && (
                      <p style={{ fontSize:'0.75rem', color:C.stone, opacity:.7, margin:'3px 0 6px', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{art.description}</p>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.68rem', color:C.mist, marginBottom:6 }}>
                      <Calendar size={9}/>{art.date}
                    </div>
                    {art.tags.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {art.tags.slice(0,3).map((tag,i)=>(
                          <span key={i} style={{ padding:'2px 8px', borderRadius:999, fontSize:'0.65rem', fontWeight:600, background:C.cream, color:C.stone }}>{tag}</span>
                        ))}
                        {art.tags.length>3 && <span style={{ padding:'2px 8px', borderRadius:999, fontSize:'0.65rem', fontWeight:600, background:C.cream, color:C.stone }}>+{art.tags.length-3}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* list view */
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map((art, idx) => (
                <div key={art.id} className="art-tile"
                  style={{ display:'flex', gap:14, padding:14, borderRadius:18, animationDelay:`${idx*0.04}s` }}>
                  <img src={art.imageUrl} alt={art.title} style={{ width:80, height:80, objectFit:'cover', borderRadius:12, flexShrink:0 }} loading="lazy"/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:3 }}>
                      <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontWeight:700, fontSize:'0.98rem', color:C.forest, margin:0 }}>{art.title}</h3>
                      {art.folder && <span style={{ fontSize:'0.65rem', padding:'2px 8px', borderRadius:999, background:C.mistLt, color:C.stone, flexShrink:0, fontWeight:600 }}>{art.folder}</span>}
                    </div>
                    {art.description && <p style={{ fontSize:'0.76rem', color:C.stone, opacity:.7, margin:'2px 0 5px' }}>{art.description}</p>}
                    <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.68rem', color:C.mist, marginBottom:6 }}>
                      <Calendar size={9}/>{art.date} · {art.time}
                    </div>
                    {art.tags.length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:8 }}>
                        {art.tags.slice(0,4).map((tag,i)=>(
                          <span key={i} style={{ padding:'2px 8px', borderRadius:999, fontSize:'0.65rem', fontWeight:600, background:C.cream, color:C.stone }}>{tag}</span>
                        ))}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>toggleFav(art.id)} className="gal-act"
                        style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:art.favorite?`linear-gradient(135deg,${C.salmon},${C.peach})`:'white', border:art.favorite?'none':`1.5px solid #FCCAAB`, boxShadow:art.favorite?`0 2px 8px rgba(232,128,103,.28)`:'none' }}
                      ><Star size={11} color={art.favorite?'white':C.peach} fill={art.favorite?'white':'none'}/></button>
                      <button onClick={()=>handleDownload(art)} className="gal-act"
                        style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'white', border:`1.5px solid ${C.mistLt}` }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#EEF4EE';e.currentTarget.style.borderColor=C.sage;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.borderColor=C.mistLt;}}
                      ><Download size={11} color={C.stone}/></button>
                      <button onClick={()=>handleShare(art)} className="gal-act"
                        style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'white', border:`1.5px solid ${C.mistLt}` }}
                        onMouseEnter={e=>{e.currentTarget.style.background='#EEF4EE';e.currentTarget.style.borderColor=C.sage;}}
                        onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.borderColor=C.mistLt;}}
                      ><Share2 size={11} color={C.stone}/></button>
                      <button onClick={()=>handleDelete(art.id)} className="gal-act"
                        style={{ width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'white', border:`1.5px solid #FCCAAB` }}
                        onMouseEnter={e=>(e.currentTarget.style.background='#FFF0EB')}
                        onMouseLeave={e=>(e.currentTarget.style.background='white')}
                      ><Trash2 size={11} color={C.salmon}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* empty state */
          <div className="gal-card" style={{ padding:'56px 24px', textAlign:'center', animationDelay:'.1s' }}>
            <div style={{ width:60, height:60, borderRadius:16, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, opacity:.2 }}>
              <Image size={28} color="white"/>
            </div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'1.3rem', fontWeight:700, color:C.forest, marginBottom:8 }}>
              {searchTerm ? 'Няма намерени творби' : 'Вашата галерия е празна'}
            </h3>
            <p style={{ fontSize:'0.84rem', color:C.stone, marginBottom:24, opacity:.7 }}>
              {searchTerm ? 'Променете критериите за търсене' : 'Качете вашата първа творба'}
            </p>
            {!searchTerm && (
              <button onClick={()=>{ setUpMode('file'); setShowModal(true); }}
                className="gal-btn"
                style={{ padding:'10px 28px', borderRadius:999, fontWeight:700, color:'white', fontSize:'0.88rem', background:`linear-gradient(135deg,${C.salmon},${C.peach})`, boxShadow:`0 4px 14px rgba(232,128,103,.28)`, display:'inline-flex', alignItems:'center', gap:7, border:'none' }}
              ><Upload size={15}/> Качете първата творба</button>
            )}
          </div>
        )}

        {/* ══ STATS ══════════════════════════════════════════════ */}
        {artworks.length > 0 && (
          <>
            <div className="stats-grid" style={{ animationDelay:'.15s' }}>
              {[
                { icon:<Image size={18}/>,     value:artworks.length,                              label:'Общо творби',  color:C.salmon },
                { icon:<Star size={18}/>,      value:artworks.filter(a=>a.favorite).length,        label:'Любими',       color:C.peach  },
                { icon:<FolderPlus size={18}/>,value:new Set(artworks.map(a=>a.folder)).size,       label:'Папки',        color:C.sage   },
                { icon:<Tag size={18}/>,       value:new Set(artworks.flatMap(a=>a.tags)).size,     label:'Етикети',      color:C.mist   },
              ].map((s,i) => (
                <div key={i} className="gal-card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12, animationDelay:`${0.15+i*0.05}s` }}>
                  <div style={{ width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:`${s.color}22`, color:s.color, flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:700, color:C.forest, lineHeight:1 }}>{s.value}</div>
                    <div style={{ fontSize:'0.68rem', fontWeight:700, color:C.stone, marginTop:2, textTransform:'uppercase', letterSpacing:'0.08em' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* floral footer */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:22, opacity:.28 }}>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${C.sage})` }}/>
              <span className="gal-sway-l"><Sprig/></span>
              <TinyFlower/><TinyFlower style={{ opacity:.5 }}/><TinyFlower/>
              <span className="gal-sway-r"><Sprig style={{ transform:'scaleX(-1)' }}/></span>
              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${C.sage},transparent)` }}/>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Gallery;