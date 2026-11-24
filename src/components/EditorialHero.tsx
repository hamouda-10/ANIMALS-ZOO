import React from 'react';
import { HERO_MEDIA } from '../data/zoosData';

interface EditorialHeroProps {
  scrollProgress: number; // 0 to 1+ based on hero viewport scroll
  scrollY: number;
  onOpenMenu: () => void;
  onOpenSearch: () => void;
  onSeeMap: () => void;
  reservationsCount: number;
  onOpenReservations: () => void;
}

const TITLE_LETTERS = 'ELEPHANT'.split('');

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  scrollProgress,
  scrollY,
  onOpenMenu,
  onOpenSearch,
  onSeeMap,
  reservationsCount,
  onOpenReservations,
}) => {
  // Melt progress reaches 1.0 by 60% of a viewport scrolled
  const melt = Math.min(1, Math.max(0, scrollProgress / 0.6));
  const blurPx = melt * 6;
  const stageDriftY = scrollY * 0.32;
  const gradientHeightPct = 34 + melt * 66;
  const gradientOpacity = 0.72 + melt * 0.28;
  const pillOpacity = Math.max(0, 1 - melt * 1.35);

  return (
    <section
      id="hero"
      aria-label="Elephant — Loxodonta africana"
      className="relative w-full h-[100svh] min-h-[600px] overflow-hidden bg-[#ECE3D1] select-none"
    >
      {/* Centered 2688:1520 Stage */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="hero-stage shrink-0"
          style={{
            transform: `translate3d(0, ${stageDriftY.toFixed(2)}px, 0)`,
          }}
        >
          {/* Layer 1: Background Savanna Hero Photo */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              filter: blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
            }}
          >
            <img
              src={HERO_MEDIA.heroPhoto}
              alt="African bush elephant with long tusks walking through golden savanna grass"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover anim-hero-photo"
              draggable={false}
            />
          </div>

          {/* Subtle top legibility scrim for nav & sky balance */}
          <div
            className="absolute inset-x-0 top-0 h-[28%] pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, rgba(42, 26, 24, 0.24) 0%, rgba(42, 26, 24, 0) 100%)',
            }}
          />

          {/* Layer 2: Title Block behind the elephant cut-out */}
          <div
            className="hero-title-block absolute inset-x-0 flex flex-col items-center text-center pointer-events-none z-10"
            style={{ top: '19.2%' }}
          >
            <p
              className="hero-eyebrow anim-fade-down mb-[1.15cqw]"
              style={{ animationDelay: '0.28s' }}
            >
              LOXODONTA AFRICANA
            </p>
            <h1
              className="hero-word m-0 p-0 whitespace-nowrap"
              aria-label="ELEPHANT"
            >
              {TITLE_LETTERS.map((char, idx) => (
                <span
                  key={`${char}-${idx}`}
                  className="anim-hero-letter"
                  style={{ animationDelay: `${0.32 + idx * 0.095}s` }}
                >
                  {char}
                </span>
              ))}
            </h1>
          </div>

          {/* Layer 3: Elephant Cut-out overlapping the lower letters "PH" */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: '26.19%',
              top: '30.99%',
              width: '46.5%',
              filter: blurPx > 0.05 ? `blur(${blurPx.toFixed(2)}px)` : 'none',
            }}
          >
            <img
              src={HERO_MEDIA.elephantCutout}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
              className="w-full h-auto block anim-hero-photo"
              style={{ transformOrigin: 'center 58%' }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom Center Cream Pill "SEE ON MAP" (sits UNDER the melting paper gradient so it disappears with the photo) */}
      <div
        className="absolute inset-x-0 bottom-[6.2svh] z-30 flex justify-center pointer-events-none"
        style={{ opacity: pillOpacity }}
      >
        <button
          type="button"
          onClick={onSeeMap}
          className="anim-hero-pill pointer-events-auto group inline-flex items-center gap-3 rounded-full bg-[#ECE3D1] text-[#43282A] pl-2.5 pr-4 py-2 shadow-[0_12px_34px_rgba(43,24,25,0.22)] border border-[#43282A]/12 hover:bg-[#F5EFE2] transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A86438]"
        >
          <span className="w-6 h-6 rounded-full bg-[#43282A] text-[#ECE3D1] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
            <svg width="11" height="13" viewBox="0 0 11 13" fill="none" aria-hidden="true">
              <path
                d="M5.5 0.75C2.88 0.75 0.75 2.88 0.75 5.5C0.75 8.85 5.5 12.25 5.5 12.25C5.5 12.25 10.25 8.85 10.25 5.5C10.25 2.88 8.12 0.75 5.5 0.75ZM5.5 7.25C4.53 7.25 3.75 6.47 3.75 5.5C3.75 4.53 4.53 3.75 5.5 3.75C6.47 3.75 7.25 4.53 7.25 5.5C7.25 6.47 6.47 7.25 5.5 7.25Z"
                fill="currentColor"
              />
            </svg>
          </span>
          <span className="editorial-label text-[#43282A] whitespace-nowrap">
            SEE ON MAP
          </span>
          <svg
            width="14"
            height="10"
            viewBox="0 0 14 10"
            fill="none"
            className="text-[#A86438] transition-transform duration-300 group-hover:translate-x-0.5 shrink-0"
            aria-hidden="true"
          >
            <path
              d="M1 5H12.5M12.5 5L8.75 1.25M12.5 5L8.75 8.75"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scroll-linked paper melt gradient rising over the photo & pill */}
      <div
        className="absolute inset-x-0 bottom-0 z-[35] pointer-events-none"
        style={{
          height: `${gradientHeightPct.toFixed(2)}%`,
          opacity: gradientOpacity,
          background: `linear-gradient(to top, #ECE3D1 0%, #ECE3D1 ${(16 + melt * 42).toFixed(1)}%, rgba(236, 227, 209, ${(0.88 * melt + 0.32 * (1 - melt)).toFixed(2)}) 62%, rgba(236, 227, 209, 0) 100%)`,
        }}
      />

      {/* Top Editorial Nav over the photo */}
      <header
        className="anim-fade-down absolute inset-x-0 top-0 z-40 px-6 md:px-10 pt-6 md:pt-7 flex items-center justify-between text-[#FBF5EA]"
        style={{ animationDelay: '0.18s' }}
      >
        {/* Left: Two-line menu icon + MENU */}
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="inline-flex items-center gap-3 py-2 pr-3 text-[#FBF5EA] hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ECE3D1] rounded"
        >
          <span className="flex flex-col gap-[5px] w-5" aria-hidden="true">
            <span className="block h-[1.4px] w-full bg-current rounded-full" />
            <span className="block h-[1.4px] w-3.5 bg-current rounded-full" />
          </span>
          <span className="editorial-label hidden min-[761px]:inline whitespace-nowrap">
            MENU
          </span>
        </button>

        {/* Centre: Tana Camps / EXPEDITIONS */}
        <a
          href="#hero"
          className="flex flex-col items-center text-center leading-none text-[#FBF5EA] hover:opacity-90 transition-opacity"
        >
          <span className="font-display-raw text-[19px] tracking-[0.02em] whitespace-nowrap">
            Tana Camps
          </span>
          <span
            className="uppercase font-semibold mt-1 whitespace-nowrap opacity-90"
            style={{ fontSize: '7.5px', letterSpacing: '0.32em' }}
          >
            EXPEDITIONS
          </span>
        </a>

        {/* Right: Search icon + SEARCH (and subtle passes counter if user has booked) */}
        <div className="flex items-center gap-4">
          {reservationsCount > 0 && (
            <button
              type="button"
              onClick={onOpenReservations}
              className="hidden sm:inline-flex items-center gap-1.5 editorial-label text-[#FBF5EA] hover:text-[#ECE3D1] border-b border-[#FBF5EA]/40 pb-0.5 cursor-pointer whitespace-nowrap"
            >
              <span>PASSES ({reservationsCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search sanctuaries and species"
            className="inline-flex items-center gap-2.5 py-2 pl-3 text-[#FBF5EA] hover:opacity-80 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[#ECE3D1] rounded"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.35" />
              <path
                d="M10.4 10.4L13.75 13.75"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
              />
            </svg>
            <span className="editorial-label hidden min-[761px]:inline whitespace-nowrap">
              SEARCH
            </span>
          </button>
        </div>
      </header>
    </section>
  );
};
