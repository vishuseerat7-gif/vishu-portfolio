import { useState, useEffect, useRef, useCallback } from 'react';

/* ============================================================
   NATH STUDIO · Cinematic Poster Experience
   Default accordion → click expand → hero banner → masonry gallery
   ============================================================ */

const CDN = 'https://res.cloudinary.com/jijruffl/image/upload/';

/* Song posters (vertical) — the accordion items */
const SONG_POSTERS = [
  { src: CDN + 'v1786303590/ChatGPT_Image_Aug_10_2026_12_11_46_AM_otumn5.png', vibe: 'Urban' },
  { src: CDN + 'v1786305869/ChatGPT_Image_Aug_10_2026_01_15_01_AM_cgrt7m.png', vibe: 'Romantic' },
  { src: CDN + 'v1786305869/ChatGPT_Image_Aug_10_2026_01_24_04_AM_izbxvp.png', vibe: 'Bhangra' },
  { src: CDN + 'v1786303592/ChatGPT_Image_Aug_10_2026_12_51_34_AM_kyji6g.png', vibe: 'Sad' },
  { src: CDN + 'v1786303592/ChatGPT_Image_Aug_10_2026_12_23_46_AM_etnkxb.png', vibe: 'Folk' },
  { src: CDN + 'v1786303595/ChatGPT_Image_Aug_10_2026_12_21_03_AM_wtqtne.png', vibe: 'Desi' },
  { src: CDN + 'v1786305864/ChatGPT_Image_Aug_10_2026_01_18_01_AM_kyhsxm.png', vibe: 'Party' },
  { src: CDN + 'v1786305880/63ccf13a-1245-413a-a624-54ef2b6de739_jquqh7.png', vibe: 'Hip-Hop' },
];

/* Gallery stills (flyers + ads) — masonry "Behind the Scenes" */
const GALLERY = [
  { src: CDN + 'v1786348995/6ff6a17779aed750b1ecdcb405d683ae_pnqezl.jpg', h: 'landscape' },
  { src: CDN + 'v1786349043/ChatGPT_Image_Aug_10_2026_01_04_55_PM_kwmsif.png', h: 'portrait' },
  { src: CDN + 'v1786349040/ChatGPT_Image_Aug_10_2026_01_01_54_PM_x5vx1f.png', h: 'portrait' },
  { src: CDN + 'v1786349018/ChatGPT_Image_Aug_10_2026_01_06_34_PM_ho033c.png', h: 'landscape' },
  { src: CDN + 'v1786349016/ChatGPT_Image_Aug_10_2026_01_02_02_PM_aqqkmt.png', h: 'portrait' },
  { src: CDN + 'v1786349012/ChatGPT_Image_Aug_10_2026_12_52_28_PM_ipcghg.png', h: 'landscape' },
  { src: CDN + 'v1786349019/fcd404d0a087cf7f96a39af6ed2b19cd_yt1zew.jpg', h: 'landscape' },
  { src: CDN + 'v1786349020/ChatGPT_Image_Aug_10_2026_12_48_26_PM_xi4e0y.png', h: 'portrait' },
];

/* Song titles for the hero banner (index-matched to SONG_POSTERS) */
const TITLES = ['YAADAN', 'NAZAR', 'JHOOM', 'LAMBE RASTE', 'MAAHI VE', 'TERA HUN', 'BARSHAN', 'RAAT'];

export default function CinematicPosters() {
  const [active, setActive] = useState(-1);          // -1 = accordion, >=0 = hero expanded
  const [hinted, setHinted] = useState(-1);          // hovered card
  const [galleryOpen, setGalleryOpen] = useState(false);
  const wrapRef = useRef(null);
  const galleryRef = useRef(null);

  /* lock body scroll while hero is open */
  useEffect(() => {
    document.body.style.overflow = active >= 0 ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [active]);

  /* Escape closes hero */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setActive(-1); setGalleryOpen(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* scroll-driven dim + gallery reveal (parallax) */
  useEffect(() => {
    const onScroll = () => {
      if (!wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // hero dims as we scroll
      const dim = Math.min(1, Math.max(0, (-r.top) / (vh * 0.5)));
      wrapRef.current.style.setProperty('--dim', dim);
      // gallery reveal when section scrolled near
      if (galleryRef.current) {
        const gr = galleryRef.current.getBoundingClientRect();
        if (gr.top < vh * 0.85 && gr.bottom > 0) setGalleryOpen(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const hero = active >= 0 ? SONG_POSTERS[active] : null;

  return (
    <section id="cinema-posters" className="cinema" ref={wrapRef}>
      {/* ------- DEFAULT: horizontal accordion ------- */}
      <div className={`cinema-accordion ${active >= 0 ? 'is-dimmed' : ''}`}>
        <div className="cinema-rail" role="list">
          {SONG_POSTERS.map((p, i) => (
            <div
              key={i}
              role="listitem"
              className={`cinema-card ${hinted === i ? 'is-hover' : ''} ${hinted >= 0 && hinted !== i ? 'is-dim' : ''}`}
              onMouseEnter={() => setHinted(i)}
              onMouseLeave={() => setHinted(-1)}
              onClick={() => setActive(i)}
            >
              <img src={p.src} alt={`Song ${i + 1}`} loading="lazy" />
              <span className="vibe">{p.vibe}</span>
              <span className="vibe-v">#{p.vibe}</span>
              <div className="glass-open" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              </div>
            </div>
          ))}
        </div>
        <p className="cinema-hint">↗ Click a poster to expand</p>
      </div>

      {/* ------- EXPANDED: cinematic hero (modal popup, NOT fullscreen) ------- */}
      <div
        className={`cinema-hero ${active >= 0 ? 'is-open' : ''}`}
        onClick={() => setActive(-1)}
      >
        {hero && (
          <div className="hero-frame" onClick={(e) => e.stopPropagation()}>
            <img src={hero.src} alt={`Song ${active + 1}`} />
            <button className="hero-close" aria-label="Close" onClick={() => setActive(-1)}>✕</button>
            <div className="hero-scrim" />
            <div className="hero-inner">
              <p className="hero-sub">NATH STUDIO PRESENTS</p>
              <h1 className="hero-title">{TITLES[active]}</h1>
              <div className="hero-actions">
                <button className="glass-btn" aria-label="Play">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button className="glass-btn" aria-label="Add to playlist">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
                </button>
                <button className="back-btn" aria-label="Back" onClick={() => setActive(-1)}>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ------- SCROLL STATE: masonry gallery ------- */}
      <div className={`cinema-gallery ${galleryOpen ? 'is-revealed' : ''}`} ref={galleryRef}>
        <h2 className="gallery-head">Gallery <em>/ Behind the Scenes</em></h2>
        <div className="masonry">
          {GALLERY.map((g, i) => (
            <figure key={i} className={`masonry-item ${g.h}`} style={{ '--i': i % 3 }}>
              <img src={g.src} alt={`Still ${i + 1}`} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}