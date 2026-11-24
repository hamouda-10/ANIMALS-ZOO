import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ANATOMY_HOTSPOTS, Reservation, WORLD_ZOOS, ZooSanctuary } from '../data/zoosData';
import { SavannaSoundscape } from '../utils/ambientAudio';

/* =========================================================
   1. EDITORIAL MENU DRAWER
========================================================= */
interface MenuDrawerProps {
  open: boolean;
  lang: 'en' | 'ar';
  reservationsCount: number;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onToggleLang: () => void;
  onOpenReservations: () => void;
  onOpenAudio: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({
  open,
  lang,
  reservationsCount,
  onClose,
  onNavigate,
  onToggleLang,
  onOpenReservations,
  onOpenAudio,
}) => {
  if (!open) return null;

  const chapters = [
    { id: 'hero', num: '01', en: 'Elephant — Loxodonta africana', ar: 'الفيل الأفريقي — الغلاف' },
    { id: 'statement', num: '02', en: 'The Largest Land Animal', ar: 'أضخم حيوان بري على الكوكب' },
    { id: 'quick-facts', num: '03', en: 'Quick Facts & Field Audio', ar: 'حقائق سريعة وتسجيلات السافانا' },
    { id: 'anatomy-3d', num: '04', en: '3D Sculptural Anatomy', ar: 'التشريح النحتي ثلاثي الأبعاد' },
    { id: 'world-map', num: '05', en: '3D World Zoos Atlas', ar: 'أطلس الحدائق العالمي 3D' },
    { id: 'book-zoos', num: '06', en: 'Reserve World Zoo Passes', ar: 'حجز أشهر حدائق الحيوان' },
  ];

  return (
    <div
      className="fixed inset-0 z-[75] bg-[#241415]/68 flex"
      role="dialog"
      aria-modal="true"
      aria-label="Editorial Navigation Menu"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[440px] h-full bg-[#ECE3D1] border-r border-[#43282A]/18 p-8 flex flex-col justify-between overflow-y-auto"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div>
          <div className="flex items-center justify-between pb-6 border-b border-[#43282A]/16">
            <div>
              <span className="font-display-raw text-[20px] text-[#43282A] block leading-none">
                Tana Camps
              </span>
              <span
                className="uppercase font-semibold text-[#A86438] block mt-1"
                style={{ fontSize: '8px', letterSpacing: '0.32em' }}
              >
                EXPEDITIONS · VOL. IV
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-9 h-9 border border-[#43282A]/20 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>

          <nav className="mt-8 space-y-1">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  onNavigate(ch.id);
                  onClose();
                }}
                className="w-full flex items-baseline gap-4 py-3.5 border-b border-[#43282A]/12 text-left group cursor-pointer"
              >
                <span className="editorial-label text-[#A86438] tabular-nums">{ch.num}</span>
                <span className="font-display text-[22px] text-[#43282A] group-hover:text-[#A86438] transition-colors">
                  {lang === 'ar' ? ch.ar : ch.en}
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="pt-8 space-y-3 border-t border-[#43282A]/16 mt-8">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenReservations();
            }}
            className="w-full py-3 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors cursor-pointer"
          >
            {lang === 'ar'
              ? `عرض حجوزاتي (${reservationsCount})`
              : `MY RESERVATIONS (${reservationsCount})`}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onToggleLang}
              className="py-2.5 border border-[#43282A]/22 editorial-label text-[#43282A] hover:border-[#A86438] hover:text-[#A86438] cursor-pointer"
            >
              {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAudio();
              }}
              className="py-2.5 border border-[#43282A]/22 editorial-label text-[#43282A] hover:border-[#A86438] hover:text-[#A86438] cursor-pointer"
            >
              {lang === 'ar' ? 'الصوت الميداني' : '7-MIN AUDIO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   2. GLOBAL SEARCH OVERLAY
========================================================= */
interface SearchOverlayProps {
  open: boolean;
  lang: 'en' | 'ar';
  onClose: () => void;
  onSelectZoo: (zoo: ZooSanctuary) => void;
  onBookZoo: (zoo: ZooSanctuary) => void;
  onJumpSection: (id: string) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  open,
  lang,
  onClose,
  onSelectZoo,
  onBookZoo,
  onJumpSection,
}) => {
  const [term, setTerm] = useState('');

  const results = useMemo(() => {
    const q = term.trim().toLowerCase();
    const matchedZoos = WORLD_ZOOS.filter(
      (z) =>
        !q ||
        z.name.toLowerCase().includes(q) ||
        z.nameAr.includes(q) ||
        z.city.toLowerCase().includes(q) ||
        z.country.toLowerCase().includes(q) ||
        z.featuredSpecies.some((s) => s.toLowerCase().includes(q))
    );
    const matchedAnatomy = ANATOMY_HOTSPOTS.filter(
      (h) =>
        !q ||
        h.title.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q) ||
        h.titleAr.includes(q)
    );
    return { matchedZoos, matchedAnatomy };
  }, [term]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[78] bg-[#241415]/75 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Search Sanctuaries and Species"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[680px] bg-[#ECE3D1] border border-[#43282A]/24 p-6 md:p-8 shadow-2xl"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3 pb-4 border-b border-[#43282A]/22">
          <input
            type="search"
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={
              lang === 'ar'
                ? 'ابحث عن سان دييغو، سنغافورة، فيينا، الأنياب...'
                : 'Search San Diego, Singapore, Vienna, tusks, savanna...'
            }
            className="w-full bg-transparent text-[18px] font-display-raw text-[#43282A] placeholder:text-[#43282A]/40 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 editorial-label text-[#43282A] border border-[#43282A]/20 hover:bg-[#43282A] hover:text-[#ECE3D1] cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <p className="editorial-label text-[#A86438] mb-3">
              {lang === 'ar' ? 'حدائق الحيوان والمحميات' : 'WORLD ZOOS & SANCTUARIES'}
            </p>
            {results.matchedZoos.length === 0 ? (
              <p className="text-[13px] text-[#43282A]/60">No sanctuaries found.</p>
            ) : (
              <div className="divide-y divide-[#43282A]/12">
                {results.matchedZoos.map((z) => (
                  <div
                    key={z.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-display text-[19px] text-[#43282A] m-0">
                        {lang === 'ar' ? z.nameAr : z.name}
                      </p>
                      <p className="text-[12px] text-[#43282A]/65 m-0">
                        {lang === 'ar' ? z.cityAr : z.city} · From ${z.basePriceUsd}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectZoo(z);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold border border-[#43282A]/20 text-[#43282A] hover:border-[#A86438] cursor-pointer whitespace-nowrap"
                      >
                        3D Map
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onBookZoo(z);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold bg-[#43282A] text-[#ECE3D1] hover:bg-[#A86438] cursor-pointer whitespace-nowrap"
                      >
                        Book
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {results.matchedAnatomy.length > 0 && (
            <div>
              <p className="editorial-label text-[#A86438] mb-3">
                {lang === 'ar' ? 'نقاط التشريح ثلاثي الأبعاد' : '3D ELEPHANT ANATOMY'}
              </p>
              <div className="divide-y divide-[#43282A]/12">
                {results.matchedAnatomy.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      onJumpSection('anatomy-3d');
                      onClose();
                    }}
                    className="w-full py-2.5 text-left flex items-center justify-between hover:text-[#A86438] cursor-pointer"
                  >
                    <span className="text-[13.5px] font-medium text-[#43282A]">
                      {lang === 'ar' ? h.titleAr : h.title}
                    </span>
                    <span className="text-[11.5px] text-[#43282A]/60 tabular-nums">{h.metric}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   3. 7-MINUTE SAVANNA FIELD AUDIO DOCUMENTARY MODAL
========================================================= */
interface FieldAudioModalProps {
  open: boolean;
  onClose: () => void;
}

const AUDIO_CHAPTERS = [
  { time: '00:00', title: 'Dawn Over Tana River Gallery Forest', note: 'Acoustic wind across golden panicum grass as the matriarchal herd nears the shallow ford.' },
  { time: '02:14', title: 'Infrasonic Herd Communication (14–28 Hz)', note: 'Sub-audible seismic rumbles traveling through dry alluvial soil, sensed through cushioned footpads.' },
  { time: '04:40', title: 'Keystone Architects of the Acacia Plain', note: 'How browsing corridors open sunlit glades for antelope, hornbills, and migrating savanna herds.' },
];

export const FieldAudioModal: React.FC<FieldAudioModalProps> = ({ open, onClose }) => {
  const [playing, setPlaying] = useState(false);
  const [activeChap, setActiveChap] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const soundRef = useRef<SavannaSoundscape | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!open) {
      soundRef.current?.stop();
      setPlaying(false);
      return;
    }
    soundRef.current = new SavannaSoundscape();
    return () => {
      soundRef.current?.stop();
      soundRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setSeconds((s) => (s >= 420 ? 0 : s + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  // Subtle acoustic canvas waveform visualization
  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const dataArr = new Uint8Array(64);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bars = 40;
      const barW = canvas.width / bars;

      if (playing && analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArr);
      }

      for (let i = 0; i < bars; i++) {
        const val = playing
          ? (dataArr[i % dataArr.length] || 0) / 255
          : 0.08 + Math.sin(t * 0.002 + i * 0.35) * 0.04;
        const h = Math.max(4, (val * 0.85 + (playing ? 0.14 : 0.05)) * canvas.height);
        ctx.fillStyle = i % 5 === 0 ? '#A86438' : '#43282A';
        ctx.globalAlpha = playing ? 0.82 : 0.25;
        ctx.fillRect(i * barW + 2, (canvas.height - h) / 2, barW - 4, h);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [open, playing]);

  if (!open) return null;

  const togglePlay = () => {
    if (playing) {
      soundRef.current?.stop();
      analyserRef.current = null;
      setPlaying(false);
    } else {
      analyserRef.current = soundRef.current?.start() || null;
      setPlaying(true);
    }
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div
      className="fixed inset-0 z-[82] bg-[#241415]/75 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="7-Minute Savanna Field Audio"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[560px] bg-[#ECE3D1] border border-[#43282A]/24 p-6 md:p-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#43282A]/16">
          <div>
            <p className="editorial-label text-[#A86438]">FIELD RECORDING · 07:00</p>
            <h3 className="font-display text-2xl sm:text-3xl text-[#43282A] mt-1 m-0">
              VOICES OF THE TANA SAVANNA
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close field recording player"
            className="w-9 h-9 border border-[#43282A]/20 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="py-6">
          <canvas
            ref={canvasRef}
            width={480}
            height={78}
            className="w-full h-[78px] bg-[#E6DCC8]/75 border border-[#43282A]/12"
          />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={togglePlay}
              className="px-5 py-2.5 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors cursor-pointer"
            >
              {playing ? 'PAUSE SOUNDSCAPE' : 'PLAY SAVANNA AMBIENCE'}
            </button>
            <span className="text-[12.5px] font-mono text-[#43282A] tabular-nums">
              {mins}:{secs} / 07:00
            </span>
          </div>
        </div>

        <div className="border-t border-[#43282A]/16 divide-y divide-[#43282A]/12">
          {AUDIO_CHAPTERS.map((ch, idx) => (
            <button
              key={ch.time}
              type="button"
              onClick={() => {
                setActiveChap(idx);
                setSeconds(idx === 0 ? 0 : idx === 1 ? 134 : 280);
              }}
              className={`w-full py-3.5 text-left transition-colors cursor-pointer ${
                activeChap === idx ? 'opacity-100' : 'opacity-65 hover:opacity-100'
              }`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] font-semibold text-[#43282A]">{ch.title}</span>
                <span className="text-[11px] font-mono text-[#A86438] tabular-nums">{ch.time}</span>
              </div>
              <p className="text-[12px] leading-[1.55] text-[#43282A]/72 mt-1 m-0">{ch.note}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   4. MY RESERVATIONS DRAWER
========================================================= */
interface ReservationsDrawerProps {
  open: boolean;
  lang: 'en' | 'ar';
  reservations: Reservation[];
  onClose: () => void;
  onCancelReservation: (id: string) => void;
  onStartNewBooking: () => void;
}

export const ReservationsDrawer: React.FC<ReservationsDrawerProps> = ({
  open,
  lang,
  reservations,
  onClose,
  onCancelReservation,
  onStartNewBooking,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[78] bg-[#241415]/68 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="My Sanctuary Reservations"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[460px] h-full bg-[#ECE3D1] border-l border-[#43282A]/18 p-7 flex flex-col justify-between overflow-y-auto"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        <div>
          <div className="flex items-center justify-between pb-5 border-b border-[#43282A]/16">
            <div>
              <p className="editorial-label text-[#A86438]">
                {lang === 'ar' ? 'محفظة التذاكر' : 'EXPEDITION FOLIO'}
              </p>
              <h3 className="font-display text-2xl text-[#43282A] mt-1 m-0">
                {lang === 'ar' ? 'حجوزاتي المؤكدة' : 'MY SANCTUARY PASSES'}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close reservations drawer"
              className="w-9 h-9 border border-[#43282A]/20 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] cursor-pointer"
            >
              ✕
            </button>
          </div>

          {reservations.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-display text-xl text-[#43282A]">
                {lang === 'ar' ? 'لا توجد حجوزات بعد' : 'No Passes Reserved Yet'}
              </p>
              <p className="text-[13px] text-[#43282A]/68 mt-2">
                {lang === 'ar'
                  ? 'اختر أي حديقة حيوان من الأطلس ثلاثي الأبعاد أو الدليل العالمي لإصدار تذكرتك.'
                  : 'Select any world sanctuary from our 3D Atlas or directory to reserve timed-entry admission.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartNewBooking();
                }}
                className="mt-6 px-5 py-2.5 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] cursor-pointer"
              >
                {lang === 'ar' ? 'استكشف الحدائق' : 'EXPLORE WORLD ZOOS'}
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="p-5 bg-[#E6DCC8] border border-[#43282A]/18 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-[11px] text-[#A86438] font-semibold">
                        {res.reference}
                      </span>
                      <h4 className="font-display text-[20px] text-[#43282A] m-0">
                        {res.zooName}
                      </h4>
                      <p className="text-[12px] text-[#43282A]/68 m-0">{res.zooCity}</p>
                    </div>
                    <span className="font-display-raw text-[20px] text-[#43282A] tabular-nums">
                      ${res.totalUsd}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[#43282A]/14 text-[12px] text-[#43282A]/78 flex flex-wrap justify-between gap-2">
                    <span className="tabular-nums">
                      {res.date} · {res.timeSlot}
                    </span>
                    <span>
                      {res.adults + res.children + res.seniors} guests · {res.tierName}
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[11.5px] text-[#43282A]/65">{res.guestName}</span>
                    <button
                      type="button"
                      onClick={() => onCancelReservation(res.id)}
                      className="text-[10.5px] uppercase tracking-[0.14em] font-semibold text-[#9A3412] hover:underline cursor-pointer"
                    >
                      {lang === 'ar' ? 'إلغاء الحجز' : 'Cancel Pass'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-[#43282A]/16 mt-6">
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartNewBooking();
            }}
            className="w-full py-3 bg-[#A86438] text-[#ECE3D1] editorial-label hover:bg-[#8A4F2B] transition-colors cursor-pointer"
          >
            {lang === 'ar' ? 'حجز حديقة أخرى' : 'RESERVE ANOTHER SANCTUARY'}
          </button>
        </div>
      </div>
    </div>
  );
};
