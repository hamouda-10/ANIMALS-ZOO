import React, { useEffect, useRef, useState } from 'react';
import { HERO_MEDIA } from '../data/zoosData';

interface EditorialQuickFactsProps {
  forceRevealed?: boolean;
  virtualScrollY?: number | null; // Used in ?rec=1 recorder mode
  onOpenAudioStory: () => void;
}

const TITLE_WORDS = ['QUICK', 'FACTS', 'ABOUT', 'ELEPHANT'];

const FACT_ROWS = [
  { label: 'Habitat', value: 'Woodland and savanna' },
  { label: 'Scientific name', value: 'Loxodonta africana', italic: true },
  { label: 'Adult weight', value: '2,000 – 6,300 kg' },
  { label: 'IUCN status', value: 'Vulnerable' },
];

// Generate 48 radial tick coordinates around 84x84 circle
const RADIAL_TICKS = Array.from({ length: 48 }, (_, i) => {
  const angle = (i / 48) * Math.PI * 2;
  const isMajor = i % 6 === 0;
  const rInner = isMajor ? 33.5 : 35.5;
  const rOuter = 40.5;
  return {
    x1: 42 + Math.cos(angle) * rInner,
    y1: 42 + Math.sin(angle) * rInner,
    x2: 42 + Math.cos(angle) * rOuter,
    y2: 42 + Math.sin(angle) * rOuter,
    isMajor,
  };
});

export const EditorialQuickFacts: React.FC<EditorialQuickFactsProps> = ({
  forceRevealed = false,
  virtualScrollY = null,
  onOpenAudioStory,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const portraitWrapRef = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(forceRevealed);
  const [parallaxPct, setParallaxPct] = useState(0);

  useEffect(() => {
    if (forceRevealed) {
      setRevealed(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: [0.25] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [forceRevealed]);

  // Portrait ±7% parallax with scroll (works in both normal scroll and recorder mode)
  useEffect(() => {
    const updateParallax = () => {
      const el = portraitWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 960;
      const centerOffset = (rect.top + rect.height / 2 - vh / 2) / vh;
      const clamped = Math.max(-1, Math.min(1, centerOffset));
      setParallaxPct(clamped * 7);
    };

    updateParallax();
    if (virtualScrollY !== null) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        updateParallax();
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [virtualScrollY]);

  const isRevealed = forceRevealed || revealed;
  let letterIdx = 0;

  return (
    <section
      id="quick-facts"
      ref={sectionRef}
      aria-label="Quick facts about the African bush elephant"
      className={`relative w-full min-h-[100svh] bg-[#ECE3D1] flex items-center justify-center px-6 md:px-10 py-20 md:py-24 ${
        isRevealed ? 'is-revealed' : ''
      }`}
    >
      <div className="w-full max-w-[1180px] border-t border-[#43282A]/16 pt-12 md:pt-14">
        <div className="grid grid-cols-1 min-[761px]:grid-cols-[1.12fr_1.12fr_0.96fr] gap-12 min-[761px]:gap-10 lg:gap-14 items-start">
          {/* Left Column: Label + Stacked Title + 84px Rotating Play Badge */}
          <div className="flex flex-col justify-between h-full">
            <div>
              <p
                className="editorial-label text-[#A86438] mb-5 transition-all duration-700"
                style={{
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(10px)',
                }}
              >
                ELEPHANT
              </p>

              <h2
                className="facts-heading font-display text-[#43282A] m-0"
                style={{
                  fontSize: 'clamp(34px, 4.25vw, 66px)',
                  lineHeight: 0.96,
                  letterSpacing: '-0.005em',
                }}
              >
                {TITLE_WORDS.map((word) => (
                  <span key={word} className="block">
                    {word.split('').map((ch, i) => {
                      const delay = letterIdx * 30;
                      letterIdx += 1;
                      return (
                        <span key={`${word}-${i}`} className="climb-letter-mask">
                          <span
                            className="climb-letter"
                            style={{ transitionDelay: `${delay}ms` }}
                          >
                            {ch}
                          </span>
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h2>
            </div>

            {/* 84px Play Badge with 48 Radial Ticks turning once every 16s */}
            <div
              className="facts-stagger mt-12 md:mt-16 flex items-center gap-4"
              style={{ transitionDelay: '520ms' }}
            >
              <button
                type="button"
                onClick={onOpenAudioStory}
                aria-label="Play 7-minute African bush elephant field audio documentary"
                className="group relative w-[84px] h-[84px] flex items-center justify-center rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A86438]"
              >
                <svg
                  width="84"
                  height="84"
                  viewBox="0 0 84 84"
                  className="ticks-spin text-[#43282A]"
                  aria-hidden="true"
                >
                  {RADIAL_TICKS.map((t, idx) => (
                    <line
                      key={idx}
                      x1={t.x1}
                      y1={t.y1}
                      x2={t.x2}
                      y2={t.y2}
                      stroke="currentColor"
                      strokeOpacity={t.isMajor ? 0.78 : 0.34}
                      strokeWidth={t.isMajor ? 1.2 : 0.85}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <span className="absolute inset-[14px] rounded-full border border-[#43282A]/16 bg-[#E6DCC8]/70 group-hover:bg-[#A86438] group-hover:border-[#A86438] transition-colors duration-300 flex items-center justify-center">
                  <svg
                    width="13"
                    height="15"
                    viewBox="0 0 13 15"
                    fill="none"
                    className="translate-x-[1.5px] text-[#43282A] group-hover:text-[#ECE3D1] transition-colors duration-300"
                    aria-hidden="true"
                  >
                    <path d="M1.5 1.2L11.8 7.5L1.5 13.8V1.2Z" fill="currentColor" />
                  </svg>
                </span>
              </button>
              <div className="flex flex-col">
                <span className="editorial-label text-[#43282A]">7 MINUTES</span>
                <button
                  type="button"
                  onClick={onOpenAudioStory}
                  className="text-left text-[12px] text-[#43282A]/60 hover:text-[#A86438] transition-colors mt-1 cursor-pointer"
                >
                  Listen to savanna field notes
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column: Keystone Species Prose + Hairline Facts Table */}
          <div className="flex flex-col justify-between pt-1 min-[761px]:pt-7">
            <p
              className="facts-stagger text-[13.4px] leading-[1.78] text-[#43282A]/72 m-0 max-w-[40ch]"
              style={{ transitionDelay: '280ms' }}
            >
              The African bush elephant is a keystone architect of woodland and savanna
              ecosystems. By clearing dense thickets, dispersing acacia seeds across vast
              migratory corridors, and digging dry riverbeds during the arid season to expose
              subterranean water tables, matriarchal herds sustain countless species that share
              the East African plains.
            </p>

            <div className="mt-10 md:mt-14 w-full border-t border-[#43282A]/16">
              {FACT_ROWS.map((row, idx) => (
                <div
                  key={row.label}
                  className="facts-stagger flex items-baseline justify-between gap-4 py-3.5 border-b border-[#43282A]/16 text-[13px]"
                  style={{ transitionDelay: `${420 + idx * 100}ms` }}
                >
                  <span className="text-[#43282A] font-medium whitespace-nowrap">
                    {row.label}
                  </span>
                  <span
                    className={`text-[#A86438] text-right tabular-nums ${
                      row.italic ? 'italic' : ''
                    }`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Tall 2:3 Portrait with clip-path wipe & ±7% scroll parallax */}
          <div ref={portraitWrapRef} className="w-full">
            <div className="portrait-wipe relative w-full aspect-[2/3] overflow-hidden bg-[#E6DCC8]">
              <div
                className="w-full h-full"
                style={{
                  transform: `translate3d(0, ${parallaxPct.toFixed(2)}%, 0) scale(1.16)`,
                  willChange: 'transform',
                }}
              >
                <img
                  src={HERO_MEDIA.tallPortrait}
                  alt="African bush elephant head in profile with one long tusk against green foliage"
                  referrerPolicy="no-referrer"
                  className="portrait-wipe-img w-full h-full object-cover"
                />
              </div>
            </div>
            <p
              className="facts-stagger mt-3 text-[11px] text-[#43282A]/55 tracking-[0.04em]"
              style={{ transitionDelay: '780ms' }}
            >
              Fig. 03 · Mature bull tusk profile, Tana River gallery forest.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
