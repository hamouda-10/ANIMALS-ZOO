/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { EditorialHero } from './components/EditorialHero';
import { EditorialStatement } from './components/EditorialStatement';
import { EditorialQuickFacts } from './components/EditorialQuickFacts';
import { Elephant3DStage } from './components/Elephant3DStage';
import { WorldZoosGlobe3D } from './components/WorldZoosGlobe3D';
import { ZoosBookingSection } from './components/ZoosBookingSection';
import { BookingModal } from './components/BookingModal';
import {
  FieldAudioModal,
  MenuDrawer,
  ReservationsDrawer,
  SearchOverlay,
} from './components/Overlays';
import { Reservation, WORLD_ZOOS, ZooSanctuary } from './data/zoosData';

const STORAGE_KEY = 'tana_camps_world_zoo_reservations_v1';

export default function App() {
  const [isRecMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('rec') === '1';
  });

  const recWrapRef = useRef<HTMLDivElement | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [recReveals, setRecReveals] = useState({ s2: false, s3: false });

  // Interactive App State
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [reservationsOpen, setReservationsOpen] = useState(false);
  const [selectedZooId, setSelectedZooId] = useState<string>('tana-sanctuary');
  const [bookingZoo, setBookingZoo] = useState<ZooSanctuary | null>(null);

  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as Reservation[]) : [];
    } catch {
      return [];
    }
  });

  const saveReservations = useCallback((next: Reservation[]) => {
    setReservations(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const handleConfirmReservation = useCallback(
    (res: Reservation) => {
      saveReservations([res, ...reservations]);
    },
    [reservations, saveReservations]
  );

  const handleCancelReservation = useCallback(
    (id: string) => {
      saveReservations(reservations.filter((r) => r.id !== id));
    },
    [reservations, saveReservations]
  );

  // Normal scroll tracking for Hero melt
  useEffect(() => {
    if (isRecMode) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY || 0;
      const vh = window.innerHeight || 960;
      setScrollY(y);
      setScrollProgress(y / vh);
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isRecMode]);

  // Exact Recorder Mode (?rec=1): 6.5s Web Animation translating page across sections 1 -> 2 -> 3
  // Hold to 1.95s (0.30), glide to section 2 by 3.35s (0.5154), hold to 4.25s (0.6538), glide to section 3 by 5.55s (0.8538), hold
  // Reveals up front at 0s, 2.65s, and 4.85s; rAF loop reads current translateY to drive scroll effects deterministically.
  useEffect(() => {
    if (!isRecMode) return;
    document.body.classList.add('rec-mode');

    const wrap = recWrapRef.current;
    if (!wrap) return;

    const vh = window.innerHeight || 960;
    const anim = wrap.animate(
      [
        { transform: 'translate3d(0, 0px, 0)', offset: 0 },
        { transform: 'translate3d(0, 0px, 0)', offset: 1.95 / 6.5, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        { transform: `translate3d(0, -${vh}px, 0)`, offset: 3.35 / 6.5 },
        { transform: `translate3d(0, -${vh}px, 0)`, offset: 4.25 / 6.5, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' },
        { transform: `translate3d(0, -${vh * 2}px, 0)`, offset: 5.55 / 6.5 },
        { transform: `translate3d(0, -${vh * 2}px, 0)`, offset: 1 },
      ],
      {
        duration: 6500,
        fill: 'forwards',
      }
    );

    const t2 = window.setTimeout(() => setRecReveals((r) => ({ ...r, s2: true })), 2650);
    const t3 = window.setTimeout(() => setRecReveals((r) => ({ ...r, s3: true })), 4850);

    let raf = 0;
    const readLoop = () => {
      const mat = window.getComputedStyle(wrap).transform;
      if (mat && mat !== 'none') {
        const parts = mat.match(/matrix\(([^)]+)\)/);
        if (parts) {
          const vals = parts[1].split(',').map(Number);
          const ty = Math.abs(vals[5] || 0);
          setScrollY(ty);
          setScrollProgress(ty / vh);
        }
      }
      raf = window.requestAnimationFrame(readLoop);
    };
    raf = window.requestAnimationFrame(readLoop);

    return () => {
      document.body.classList.remove('rec-mode');
      anim.cancel();
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.cancelAnimationFrame(raf);
    };
  }, [isRecMode]);

  // Keyboard Escape handler for overlays
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        setAudioOpen(false);
        setReservationsOpen(false);
        setBookingZoo(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleLocateOnGlobe = useCallback(
    (zooId: string) => {
      setSelectedZooId(zooId);
      scrollToSection('world-map');
    },
    [scrollToSection]
  );

  const handleBookTanaSanctuary = useCallback(() => {
    const tana = WORLD_ZOOS.find((z) => z.id === 'tana-sanctuary') || WORLD_ZOOS[0];
    setBookingZoo(tana);
  }, []);

  return (
    <div className="min-h-screen bg-[#ECE3D1] text-[#43282A] relative selection:bg-[#A86438] selection:text-[#ECE3D1]">
      {/* Fixed SVG Fractal-Noise Paper Grain Layer (multiply, 38% opacity) */}
      <svg className="paper-grain-overlay" aria-hidden="true">
        <filter id="tana-paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#tana-paper-grain)" />
      </svg>

      {/* Main Content Wrapper (translated in ?rec=1 Recorder Mode) */}
      <main ref={recWrapRef} className="relative w-full">
        {/* Section 1: Hero (Full Viewport) */}
        <EditorialHero
          scrollProgress={scrollProgress}
          scrollY={scrollY}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onSeeMap={() => scrollToSection('world-map')}
          reservationsCount={reservations.length}
          onOpenReservations={() => setReservationsOpen(true)}
        />

        {/* Section 2: Statement (Full Viewport) */}
        <EditorialStatement
          forceRevealed={isRecMode ? recReveals.s2 : false}
          onJumpTo3D={() => scrollToSection('anatomy-3d')}
        />

        {/* Section 3: Quick Facts (Full Viewport) */}
        <EditorialQuickFacts
          forceRevealed={isRecMode ? recReveals.s3 : false}
          virtualScrollY={isRecMode ? scrollY : null}
          onOpenAudioStory={() => setAudioOpen(true)}
        />

        {/* Below Sections 1–3: Complete 3D Wildlife & Global Zoos Booking Experience */}
        {!isRecMode && (
          <>
            {/* Section 4: Interactive 3D Sculptural Elephant Anatomy Diorama */}
            <Elephant3DStage lang={lang} onBookSanctuary={handleBookTanaSanctuary} />

            {/* Section 5: Interactive 3D World Zoos & Sanctuaries Atlas ("SEE ON MAP") */}
            <WorldZoosGlobe3D
              lang={lang}
              selectedZooId={selectedZooId}
              onSelectZoo={setSelectedZooId}
              onBookZoo={setBookingZoo}
            />

            {/* Section 6: World's Most Famous Zoos Directory & Reservation System */}
            <ZoosBookingSection
              lang={lang}
              onToggleLang={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))}
              onBookZoo={setBookingZoo}
              onLocateOnGlobe={handleLocateOnGlobe}
              reservationsCount={reservations.length}
              onOpenReservations={() => setReservationsOpen(true)}
            />

            {/* Quiet Archival Magazine Colophon Footer */}
            <footer
              className="w-full bg-[#ECE3D1] border-t border-[#43282A]/16 py-14 px-6 md:px-10"
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                  <span className="font-display-raw text-[22px] text-[#43282A] block leading-none">
                    Tana Camps
                  </span>
                  <span
                    className="uppercase font-semibold text-[#A86438] block mt-1.5"
                    style={{ fontSize: '8px', letterSpacing: '0.32em' }}
                  >
                    EXPEDITIONS · SPECIES MONOGRAPH &amp; GLOBAL SANCTUARIES
                  </span>
                  <p className="text-[12.5px] text-[#43282A]/62 mt-3 max-w-md m-0">
                    {lang === 'ar'
                      ? 'أرشيف تفاعلي للحياة البرية وحجز زيارات لأشهر حدائق الحيوان والمحميات المعتمدة حول العالم.'
                      : 'An editorial wildlife monograph and interactive 3D reservation guide to accredited zoos and sanctuaries worldwide.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#43282A]/75">
                  <button
                    type="button"
                    onClick={() => scrollToSection('hero')}
                    className="hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'الغلاف' : 'Elephant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('anatomy-3d')}
                    className="hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'مجسم 3D' : '3D Study'}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('world-map')}
                    className="hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'أطلس العالم' : '3D Atlas'}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToSection('book-zoos')}
                    className="hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar' ? 'الحجز' : 'Reservations'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationsOpen(true)}
                    className="text-[#A86438] hover:text-[#43282A] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'ar'
                      ? `تذاكري (${reservations.length})`
                      : `My Passes (${reservations.length})`}
                  </button>
                </div>
              </div>
            </footer>
          </>
        )}
      </main>

      {/* Modals & Drawers */}
      <MenuDrawer
        open={menuOpen}
        lang={lang}
        reservationsCount={reservations.length}
        onClose={() => setMenuOpen(false)}
        onNavigate={scrollToSection}
        onToggleLang={() => setLang((l) => (l === 'en' ? 'ar' : 'en'))}
        onOpenReservations={() => setReservationsOpen(true)}
        onOpenAudio={() => setAudioOpen(true)}
      />

      <SearchOverlay
        open={searchOpen}
        lang={lang}
        onClose={() => setSearchOpen(false)}
        onSelectZoo={(z) => handleLocateOnGlobe(z.id)}
        onBookZoo={(z) => setBookingZoo(z)}
        onJumpSection={scrollToSection}
      />

      <FieldAudioModal open={audioOpen} onClose={() => setAudioOpen(false)} />

      <ReservationsDrawer
        open={reservationsOpen}
        lang={lang}
        reservations={reservations}
        onClose={() => setReservationsOpen(false)}
        onCancelReservation={handleCancelReservation}
        onStartNewBooking={() => scrollToSection('book-zoos')}
      />

      <BookingModal
        zoo={bookingZoo}
        lang={lang}
        onClose={() => setBookingZoo(null)}
        onConfirmReservation={handleConfirmReservation}
      />
    </div>
  );
}
