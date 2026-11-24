import React, { useMemo, useState } from 'react';
import { WORLD_ZOOS, ZooSanctuary } from '../data/zoosData';

interface ZoosBookingSectionProps {
  lang: 'en' | 'ar';
  onToggleLang: () => void;
  onBookZoo: (zoo: ZooSanctuary) => void;
  onLocateOnGlobe: (zooId: string) => void;
  reservationsCount: number;
  onOpenReservations: () => void;
}

type ContinentFilter = 'All' | ZooSanctuary['continent'];

const CONTINENTS: { id: ContinentFilter; label: string; labelAr: string }[] = [
  { id: 'All', label: 'All Sanctuaries', labelAr: 'جميع الحدائق' },
  { id: 'Americas', label: 'Americas', labelAr: 'الأمريكتان' },
  { id: 'Europe', label: 'Europe', labelAr: 'أوروبا' },
  { id: 'Asia-Pacific', label: 'Asia-Pacific', labelAr: 'آسيا والمحيط الهادئ' },
  { id: 'Africa', label: 'Africa', labelAr: 'أفريقيا' },
];

interface TiltZooCardProps {
  zoo: ZooSanctuary;
  lang: 'en' | 'ar';
  index: number;
  onBook: (zoo: ZooSanctuary) => void;
  onLocate: (zooId: string) => void;
}

const TiltZooCard: React.FC<TiltZooCardProps> = ({
  zoo,
  lang,
  index,
  onBook,
  onLocate,
}) => {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 9;
    const rx = -(py - 0.5) * 8;
    setTilt({ rx, ry, glareX: px * 100, glareY: py * 100, active: true });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50, active: false });
  };

  return (
    <article
      className="perspective-1000 group"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div
        className="preserve-3d h-full flex flex-col justify-between bg-[#ECE3D1] border border-[#43282A]/16 transition-transform duration-300 ease-out"
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateY(-4px)`
            : 'rotateX(0deg) rotateY(0deg) translateY(0px)',
        }}
      >
        {/* Top Media Frame with Subtle 3D Sheen */}
        <div>
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#DDD1BA]">
            <img
              src={zoo.image}
              alt={`${zoo.name} — ${zoo.city}`}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: tilt.active ? 0.32 : 0,
                background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(251, 245, 234, 0.72), transparent 62%)`,
              }}
            />
          </div>

          <div className="p-6">
            {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
            <div className="flex items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.18em] font-semibold text-[#A86438]">
              <span>
                {String(index + 1).padStart(2, '0')} · {lang === 'ar' ? zoo.countryAr : zoo.country}
              </span>
              <span className="tabular-nums text-[#43282A]/60">
                Est. {zoo.founded}
              </span>
            </div>

            <h3
              className="font-display text-[#43282A] mt-2.5 mb-2"
              style={{ fontSize: 'clamp(22px, 2vw, 29px)', lineHeight: 1.06 }}
            >
              {lang === 'ar' ? zoo.nameAr : zoo.name}
            </h3>

            <p className="text-[12.5px] text-[#43282A]/62 mb-3">
              {lang === 'ar' ? zoo.cityAr : zoo.city} · {zoo.speciesCount} · ★{' '}
              <span className="tabular-nums">{zoo.rating.toFixed(1)}</span>
            </p>

            <p className="text-[13px] leading-[1.68] text-[#43282A]/74 m-0">
              {lang === 'ar' ? zoo.summaryAr : zoo.summary}
            </p>

            {/* Key Species inline unboxed list */}
            <div className="mt-4 pt-3.5 border-t border-[#43282A]/12 text-[11.5px] text-[#43282A]/68">
              <span className="font-semibold text-[#43282A]">
                {lang === 'ar' ? 'أبرز الكائنات: ' : 'Notable Wildlife: '}
              </span>
              {(lang === 'ar' ? zoo.featuredSpeciesAr : zoo.featuredSpecies).join(' · ')}
            </div>
          </div>
        </div>

        {/* Footer Price & Actions */}
        <div className="px-6 pb-6 pt-3 border-t border-[#43282A]/14 flex items-center justify-between gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.16em] text-[#43282A]/55">
              {lang === 'ar' ? 'تبدأ من' : 'Entry from'}
            </span>
            <span className="font-display-raw text-[22px] text-[#43282A] tabular-nums">
              ${zoo.basePriceUsd}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLocate(zoo.id)}
              className="px-3 py-2 text-[10px] uppercase tracking-[0.15em] font-semibold text-[#43282A] border border-[#43282A]/22 hover:border-[#A86438] hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
            >
              {lang === 'ar' ? 'على الخريطة' : '3D Globe'}
            </button>
            <button
              type="button"
              onClick={() => onBook(zoo)}
              className="px-4 py-2 bg-[#43282A] text-[#ECE3D1] text-[10px] uppercase tracking-[0.16em] font-semibold hover:bg-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
            >
              {lang === 'ar' ? 'احجز الآن' : 'Book Pass'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export const ZoosBookingSection: React.FC<ZoosBookingSectionProps> = ({
  lang,
  onToggleLang,
  onBookZoo,
  onLocateOnGlobe,
  reservationsCount,
  onOpenReservations,
}) => {
  const [continent, setContinent] = useState<ContinentFilter>('All');
  const [query, setQuery] = useState('');

  const filteredZoos = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORLD_ZOOS.filter((z) => {
      const matchContinent = continent === 'All' || z.continent === continent;
      if (!matchContinent) return false;
      if (!q) return true;
      return (
        z.name.toLowerCase().includes(q) ||
        z.nameAr.includes(q) ||
        z.city.toLowerCase().includes(q) ||
        z.country.toLowerCase().includes(q) ||
        z.featuredSpecies.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [continent, query]);

  return (
    <section
      id="book-zoos"
      aria-label="World Famous Zoos Reservations"
      className="relative w-full bg-[#E6DCC8] border-t border-[#43282A]/16 py-20 md:py-28 px-5 md:px-10"
    >
      <div className="max-w-[1280px] mx-auto">
        {/* Header Row */}
        <div
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#43282A]/16"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div>
            <p className="editorial-label text-[#A86438] mb-3">
              {lang === 'ar' ? 'الفصل السادس · حجز التذاكر العالمية' : 'CHAPTER 06 · GLOBAL RESERVATIONS'}
            </p>
            <h2
              className="font-display text-[#43282A] m-0"
              style={{ fontSize: 'clamp(34px, 4.2vw, 64px)', lineHeight: 0.98 }}
            >
              {lang === 'ar' ? 'احجز زيارتك لأشهر حدائق الحيوان' : 'BOOK THE WORLD’S GREAT ZOOS'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onToggleLang}
              className="px-4 py-2.5 border border-[#43282A]/24 text-[#43282A] editorial-label hover:border-[#A86438] hover:text-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
            >
              {lang === 'ar' ? 'English Edition' : 'النسخة العربية'}
            </button>
            <button
              type="button"
              onClick={onOpenReservations}
              className="px-5 py-2.5 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors cursor-pointer whitespace-nowrap"
            >
              {lang === 'ar'
                ? `حجوزاتي (${reservationsCount})`
                : `MY PASSES (${reservationsCount})`}
            </button>
          </div>
        </div>

        {/* Interactive Filter Tabs + Search Row */}
        <div
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Filter by continent">
            {CONTINENTS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="tab"
                aria-selected={continent === c.id}
                onClick={() => setContinent(c.id)}
                className={`px-3.5 py-2 text-[10.5px] uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  continent === c.id
                    ? 'bg-[#43282A] text-[#ECE3D1]'
                    : 'text-[#43282A]/72 hover:text-[#43282A] hover:bg-[#43282A]/8'
                }`}
              >
                {lang === 'ar' ? c.labelAr : c.label}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                lang === 'ar' ? 'ابحث عن حديقة أو مدينة أو حيوان...' : 'Filter zoo, city, or species...'
              }
              className="w-full bg-[#ECE3D1] border border-[#43282A]/22 px-3.5 py-2 text-[13px] text-[#43282A] placeholder:text-[#43282A]/45 focus:outline-none focus:border-[#A86438]"
            />
          </div>
        </div>

        {/* 3x2 Curated 3D-Tilt Editorial Grid */}
        {filteredZoos.length === 0 ? (
          <div className="py-16 text-center border border-[#43282A]/14 bg-[#ECE3D1]/60">
            <p className="font-display text-2xl text-[#43282A]">
              {lang === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching sanctuaries'}
            </p>
            <button
              type="button"
              onClick={() => {
                setContinent('All');
                setQuery('');
              }}
              className="mt-4 px-5 py-2 border border-[#43282A]/24 editorial-label text-[#43282A] hover:border-[#A86438] hover:text-[#A86438] cursor-pointer"
            >
              {lang === 'ar' ? 'إعادة ضبط الفلتر' : 'Reset Filter'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-2">
            {filteredZoos.map((zoo, idx) => (
              <TiltZooCard
                key={zoo.id}
                zoo={zoo}
                lang={lang}
                index={idx}
                onBook={onBookZoo}
                onLocate={onLocateOnGlobe}
              />
            ))}
          </div>
        )}

        {/* Quantitative Conservation Proof Strip (Adjacent to Booking CTA) */}
        <div
          className="mt-14 pt-8 border-t border-[#43282A]/16 grid grid-cols-2 lg:grid-cols-4 gap-6"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {[
            {
              stat: '6 Sanctuaries',
              statAr: '6 محميات عالمية',
              label: 'Accredited wildlife conservation partners across 4 continents',
              labelAr: 'شركاء معتمدون لحماية الحياة البرية في 4 قارات',
            },
            {
              stat: '15% Endowment',
              statAr: '15% دعم بيئي',
              label: 'Of every VIP Sanctuary Pass funds Tana River corridors',
              labelAr: 'من كل تذكرة VIP يُخصّص لحماية ممرات أفيال نهر تانا',
            },
            {
              stat: 'Instant 3D Pass',
              statAr: 'تذكرة فورية 3D',
              label: 'Verified timed-entry admission code generated immediately',
              labelAr: 'إصدار فوري لرمز الدخول المؤكد بوقت محدد بدون انتظار',
            },
            {
              stat: '48h Flexible',
              statAr: 'مرونة 48 ساعة',
              label: 'Complimentary date changes or cancellation up to 48 hours prior',
              labelAr: 'تعديل مجاني للموعد أو إلغاء حتى 48 ساعة قبل الزيارة',
            },
          ].map((item) => (
            <div key={item.stat}>
              <p className="font-display text-[22px] text-[#43282A] tabular-nums m-0">
                {lang === 'ar' ? item.statAr : item.stat}
              </p>
              <p className="text-[12.5px] leading-[1.6] text-[#43282A]/68 mt-1.5 m-0">
                {lang === 'ar' ? item.labelAr : item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
