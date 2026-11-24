import React, { useEffect, useRef, useState } from 'react';
import { HERO_MEDIA } from '../data/zoosData';

interface EditorialStatementProps {
  forceRevealed?: boolean;
  onJumpTo3D?: () => void;
}

type LineToken =
  | { kind: 'text'; value: string }
  | { kind: 'pill'; src: string; alt: string; delayMs: number };

const STATEMENT_LINES: LineToken[][] = [
  [
    { kind: 'text', value: 'THE' },
    {
      kind: 'pill',
      src: HERO_MEDIA.pillSavanna,
      alt: 'Savanna with a young African elephant under acacias',
      delayMs: 260,
    },
    { kind: 'text', value: 'LARGEST' },
  ],
  [
    { kind: 'text', value: 'LAND ANIMAL' },
    {
      kind: 'pill',
      src: HERO_MEDIA.pillSunset,
      alt: 'Elephant mother and calf silhouetted at sunset',
      delayMs: 620,
    },
    { kind: 'text', value: 'ON' },
  ],
  [{ kind: 'text', value: 'THE PLANET' }],
];

export const EditorialStatement: React.FC<EditorialStatementProps> = ({
  forceRevealed = false,
  onJumpTo3D,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(forceRevealed);

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
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: [0.35] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [forceRevealed]);

  const isRevealed = forceRevealed || revealed;
  let letterCounter = 0;

  return (
    <section
      id="statement"
      ref={sectionRef}
      aria-label="Elephants in Africa"
      className={`relative w-full min-h-[100svh] bg-[#ECE3D1] flex flex-col items-center justify-center px-5 sm:px-8 py-24 text-center ${
        isRevealed ? 'is-revealed' : ''
      }`}
    >
      {/* Rust Eyebrow Label */}
      <p
        className="editorial-label text-[#A86438] mb-8 md:mb-10 transition-all duration-700"
        style={{
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        ELEPHANTS IN AFRICA
      </p>

      {/* Three-line uppercase Bodoni statement with inline round photo pills */}
      <h2
        className="statement-heading font-display text-[#43282A] m-0 max-w-[1320px] select-none"
        style={{
          fontSize: 'clamp(40px, 7.2vw, 132px)',
          lineHeight: 1.06,
          letterSpacing: '-0.005em',
        }}
      >
        {STATEMENT_LINES.map((line, lineIndex) => (
          <span key={lineIndex} className="block whitespace-nowrap">
            {line.map((token, tokenIndex) => {
              if (token.kind === 'pill') {
                return (
                  <span
                    key={`pill-${lineIndex}-${tokenIndex}`}
                    className="statement-pill"
                    style={{ transitionDelay: `${token.delayMs}ms` }}
                  >
                    <img
                      src={token.src}
                      alt={token.alt}
                      referrerPolicy="no-referrer"
                      style={{ transitionDelay: `${token.delayMs}ms` }}
                    />
                  </span>
                );
              }

              return (
                <React.Fragment key={`txt-${lineIndex}-${tokenIndex}`}>
                  {token.value.split('').map((ch, charIdx) => {
                    const currentDelay = letterCounter * 26;
                    letterCounter += 1;
                    if (ch === ' ') {
                      return (
                        <span key={`sp-${charIdx}`} className="inline-block w-[0.26em]">
                          &nbsp;
                        </span>
                      );
                    }
                    return (
                      <span key={`ch-${charIdx}`} className="climb-letter-mask">
                        <span
                          className="climb-letter"
                          style={{ transitionDelay: `${currentDelay}ms` }}
                        >
                          {ch}
                        </span>
                      </span>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </span>
        ))}
      </h2>

      {/* 66px Rust Double-Ring Elephant Head Emblem */}
      <button
        type="button"
        onClick={onJumpTo3D}
        title="Inspect 3D Elephant Anatomy"
        aria-label="Elephant crest emblem — explore 3D anatomy"
        className="statement-emblem mt-12 md:mt-14 w-[66px] h-[66px] flex items-center justify-center text-[#A86438] hover:scale-105 transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A86438] rounded-full"
        style={{ transitionDelay: '880ms' }}
      >
        <svg width="66" height="66" viewBox="0 0 66 66" fill="none" aria-hidden="true">
          {/* Outer and inner double ring */}
          <circle cx="33" cy="33" r="31.5" stroke="currentColor" strokeWidth="1" />
          <circle cx="33" cy="33" r="27.2" stroke="currentColor" strokeWidth="0.85" strokeDasharray="1.5 2.4" />
          {/* Minimal fine-line African Elephant Head */}
          <path
            d="M24 23.5C18.2 21.8 14.2 26.2 15.1 32.8C15.9 38.4 19.6 40.8 22.8 39.2M42 23.5C47.8 21.8 51.8 26.2 50.9 32.8C50.1 38.4 46.4 40.8 43.2 39.2"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 23.5C26.4 19.4 39.6 19.4 42 23.5C43.2 27.6 43.4 33.4 41.2 37.8C39.8 40.4 36.8 41.6 35.6 43.4C34.8 44.6 34.7 48.2 33 49.8C31.3 48.2 31.2 44.6 30.4 43.4C29.2 41.6 26.2 40.4 24.8 37.8C22.6 33.4 22.8 27.6 24 23.5Z"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Curved tusks */}
          <path
            d="M27.6 36.6C25.4 39.8 24.4 43.8 26.4 46.5M38.4 36.6C40.6 39.8 41.6 43.8 39.6 46.5"
            stroke="currentColor"
            strokeWidth="1.15"
            strokeLinecap="round"
          />
          {/* Quiet eyes */}
          <circle cx="28.6" cy="30.6" r="1" fill="currentColor" />
          <circle cx="37.4" cy="30.6" r="1" fill="currentColor" />
        </svg>
      </button>
    </section>
  );
};
