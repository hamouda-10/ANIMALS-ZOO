import React, { useMemo, useState } from 'react';
import {
  BOOKING_ADDONS,
  Reservation,
  TICKET_TIERS,
  TicketTier,
  ZooSanctuary,
} from '../data/zoosData';

interface BookingModalProps {
  zoo: ZooSanctuary | null;
  lang: 'en' | 'ar';
  onClose: () => void;
  onConfirmReservation: (reservation: Reservation) => void;
}

function getDefaultTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export const BookingModal: React.FC<BookingModalProps> = ({
  zoo,
  lang,
  onClose,
  onConfirmReservation,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [date, setDate] = useState<string>(getDefaultTomorrow);
  const [timeSlot, setTimeSlot] = useState<string>(zoo?.timeSlots[0] || '');
  const [tierId, setTierId] = useState<TicketTier['id']>('explorer');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [seniors, setSeniors] = useState<number>(0);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>(['audio-guide']);
  const [guestName, setGuestName] = useState<string>('');
  const [guestEmail, setGuestEmail] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [confirmed, setConfirmed] = useState<Reservation | null>(null);
  const [passTilt, setPassTilt] = useState({ rx: 0, ry: 0 });

  React.useEffect(() => {
    if (zoo) {
      setStep(1);
      setTimeSlot(zoo.timeSlots[0]);
      setConfirmed(null);
      setFormError('');
    }
  }, [zoo]);

  const activeTier = useMemo(
    () => TICKET_TIERS.find((t) => t.id === tierId) || TICKET_TIERS[0],
    [tierId]
  );

  const totalUsd = useMemo(() => {
    if (!zoo) return 0;
    const unit = zoo.basePriceUsd * activeTier.priceMultiplier;
    const ticketsSubtotal = adults * unit + children * unit * 0.5 + seniors * unit * 0.8;
    const addOnsSubtotal = selectedAddOns.reduce((acc, id) => {
      const found = BOOKING_ADDONS.find((a) => a.id === id);
      return acc + (found ? found.priceUsd : 0);
    }, 0);
    return Math.round(ticketsSubtotal + addOnsSubtotal);
  }, [zoo, activeTier, adults, children, seniors, selectedAddOns]);

  if (!zoo) return null;

  const toggleAddOn = (id: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFinalize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim() || !guestEmail.includes('@')) {
      setFormError(
        lang === 'ar'
          ? 'يرجى إدخال الاسم الكامل وبريد إلكتروني صحيح.'
          : 'Please enter your full name and a valid email address.'
      );
      return;
    }
    setFormError('');
    const refCode = `TANA-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${String(
      Math.floor(100 + Math.random() * 900)
    )}`;
    const newRes: Reservation = {
      id: `res-${Date.now()}`,
      reference: refCode,
      zooId: zoo.id,
      zooName: lang === 'ar' ? zoo.nameAr : zoo.name,
      zooCity: lang === 'ar' ? zoo.cityAr : zoo.city,
      date,
      timeSlot,
      tierId: activeTier.id,
      tierName: lang === 'ar' ? activeTier.nameAr : activeTier.name,
      adults,
      children,
      seniors,
      addOns: selectedAddOns,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      specialNotes: specialNotes.trim(),
      totalUsd,
      createdAt: new Date().toISOString(),
    };
    setConfirmed(newRes);
    onConfirmReservation(newRes);
    setStep(4);
  };

  const totalGuests = adults + children + seniors;

  return (
    <div
      className="fixed inset-0 z-[80] bg-[#241415]/72 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Reserve tickets for ${zoo.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-[780px] bg-[#ECE3D1] border border-[#43282A]/24 shadow-[0_28px_70px_rgba(24,12,13,0.45)] my-auto"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Modal Top Header */}
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 py-5 border-b border-[#43282A]/16">
          <div>
            <p className="editorial-label text-[#A86438]">
              {lang === 'ar' ? zoo.cityAr : zoo.city} · {zoo.coordinatesLabel}
            </p>
            <h3
              className="font-display text-[#43282A] mt-1 m-0"
              style={{ fontSize: 'clamp(22px, 2.6vw, 32px)', lineHeight: 1.05 }}
            >
              {lang === 'ar' ? zoo.nameAr : zoo.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="w-9 h-9 flex items-center justify-center border border-[#43282A]/20 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Clean Progress Bar */}
        {step < 4 && (
          <div className="px-6 md:px-8 py-3 bg-[#E6DCC8]/75 border-b border-[#43282A]/14 flex items-center justify-between text-[10.5px] uppercase tracking-[0.16em] font-semibold">
            {[
              { n: 1, en: '01 · Schedule & Pass', ar: '01 · الموعد والتذكرة' },
              { n: 2, en: '02 · Guests & Extras', ar: '02 · الزوار والإضافات' },
              { n: 3, en: '03 · Guest Folio', ar: '03 · بيانات الحجز' },
            ].map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => {
                  if (s.n < step) setStep(s.n as 1 | 2 | 3);
                }}
                className={`transition-colors whitespace-nowrap ${
                  step === s.n
                    ? 'text-[#A86438]'
                    : s.n < step
                    ? 'text-[#43282A] cursor-pointer hover:text-[#A86438]'
                    : 'text-[#43282A]/40 cursor-default'
                }`}
              >
                {lang === 'ar' ? s.ar : s.en}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* STEP 1: Date, Time & Pass Tier */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <label className="block">
                  <span className="block editorial-label text-[#43282A] mb-2">
                    {lang === 'ar' ? 'تاريخ الزيارة' : 'Visit Date'}
                  </span>
                  <input
                    type="date"
                    min={getDefaultTomorrow()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#F5EFE2] border border-[#43282A]/22 px-3.5 py-2.5 text-[13.5px] text-[#43282A] tabular-nums focus:outline-none focus:border-[#A86438]"
                  />
                </label>

                <div>
                  <span className="block editorial-label text-[#43282A] mb-2">
                    {lang === 'ar' ? 'الفترة الزمنية' : 'Entry Window'}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {zoo.timeSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`text-left px-3.5 py-2 text-[12.5px] border transition-colors cursor-pointer ${
                          timeSlot === slot
                            ? 'bg-[#43282A] text-[#ECE3D1] border-[#43282A]'
                            : 'bg-[#F5EFE2] text-[#43282A] border-[#43282A]/18 hover:border-[#A86438]'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <span className="block editorial-label text-[#43282A] mb-2.5">
                  {lang === 'ar' ? 'اختر فئة التذكرة' : 'Select Admission Tier'}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {TICKET_TIERS.map((tier) => {
                    const price = Math.round(zoo.basePriceUsd * tier.priceMultiplier);
                    const selected = tierId === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setTierId(tier.id)}
                        className={`text-left p-4 border transition-colors cursor-pointer flex flex-col justify-between ${
                          selected
                            ? 'bg-[#43282A] text-[#ECE3D1] border-[#43282A]'
                            : 'bg-[#E6DCC8]/70 text-[#43282A] border-[#43282A]/18 hover:border-[#A86438]'
                        }`}
                      >
                        <div>
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold text-[13px]">
                              {lang === 'ar' ? tier.nameAr : tier.name}
                            </span>
                            <span
                              className={`font-display-raw text-[19px] tabular-nums ${
                                selected ? 'text-[#ECE3D1]' : 'text-[#A86438]'
                              }`}
                            >
                              ${price}
                            </span>
                          </div>
                          <p
                            className={`text-[12px] leading-[1.55] mt-2 ${
                              selected ? 'text-[#ECE3D1]/80' : 'text-[#43282A]/70'
                            }`}
                          >
                            {lang === 'ar' ? tier.descriptionAr : tier.description}
                          </p>
                        </div>
                        <p
                          className={`text-[11px] mt-3 pt-2.5 border-t ${
                            selected
                              ? 'border-[#ECE3D1]/18 text-[#ECE3D1]/85'
                              : 'border-[#43282A]/14 text-[#43282A]/68'
                          }`}
                        >
                          {(lang === 'ar' ? tier.perksAr : tier.perks).join(' · ')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Guest Counts & Optional Add-ons */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="block editorial-label text-[#43282A] mb-3">
                  {lang === 'ar' ? 'عدد الزوار' : 'Party Size'}
                </span>
                <div className="border-t border-[#43282A]/16">
                  {[
                    {
                      label: lang === 'ar' ? 'بالغون (13+)' : 'Adults (13+)',
                      rate: Math.round(zoo.basePriceUsd * activeTier.priceMultiplier),
                      value: adults,
                      min: 1,
                      setter: setAdults,
                    },
                    {
                      label: lang === 'ar' ? 'أطفال (3–12) · خصم 50%' : 'Children (3–12) · 50% off',
                      rate: Math.round(zoo.basePriceUsd * activeTier.priceMultiplier * 0.5),
                      value: children,
                      min: 0,
                      setter: setChildren,
                    },
                    {
                      label: lang === 'ar' ? 'كبار السن (65+) · خصم 20%' : 'Seniors (65+) · 20% off',
                      rate: Math.round(zoo.basePriceUsd * activeTier.priceMultiplier * 0.8),
                      value: seniors,
                      min: 0,
                      setter: setSeniors,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-3.5 border-b border-[#43282A]/16"
                    >
                      <div>
                        <p className="text-[13.5px] font-medium text-[#43282A] m-0">{row.label}</p>
                        <p className="text-[12px] text-[#A86438] tabular-nums m-0">
                          ${row.rate} USD / guest
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => row.setter(Math.max(row.min, row.value - 1))}
                          className="w-8 h-8 border border-[#43282A]/24 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] transition-colors cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[14px] font-semibold tabular-nums">
                          {row.value}
                        </span>
                        <button
                          type="button"
                          onClick={() => row.setter(Math.min(10, row.value + 1))}
                          className="w-8 h-8 border border-[#43282A]/24 text-[#43282A] hover:bg-[#43282A] hover:text-[#ECE3D1] transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="block editorial-label text-[#43282A] mb-3">
                  {lang === 'ar' ? 'إضافات اختيارية للرحلة' : 'Curated Field Enhancements'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {BOOKING_ADDONS.map((addon) => {
                    const active = selectedAddOns.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => toggleAddOn(addon.id)}
                        className={`p-3.5 text-left border transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#43282A] text-[#ECE3D1] border-[#43282A]'
                            : 'bg-[#F5EFE2] text-[#43282A] border-[#43282A]/18 hover:border-[#A86438]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[12.5px] font-medium">
                            {lang === 'ar' ? addon.labelAr : addon.label}
                          </span>
                          <span className="text-[12px] tabular-nums font-semibold">
                            +${addon.priceUsd}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Guest Folio Details */}
          {step === 3 && (
            <form id="booking-folio-form" onSubmit={handleFinalize} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block editorial-label text-[#43282A] mb-1.5">
                    {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
                  </span>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder={lang === 'ar' ? 'مثال: أحمد محمود' : 'e.g. Elena Vance'}
                    className="w-full bg-[#F5EFE2] border border-[#43282A]/22 px-3.5 py-2.5 text-[13.5px] text-[#43282A] focus:outline-none focus:border-[#A86438]"
                  />
                </label>

                <label className="block">
                  <span className="block editorial-label text-[#43282A] mb-1.5">
                    {lang === 'ar' ? 'البريد الإلكتروني *' : 'Email Address *'}
                  </span>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full bg-[#F5EFE2] border border-[#43282A]/22 px-3.5 py-2.5 text-[13.5px] text-[#43282A] focus:outline-none focus:border-[#A86438]"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block editorial-label text-[#43282A] mb-1.5">
                    {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </span>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+1 555 234 5678"
                    className="w-full bg-[#F5EFE2] border border-[#43282A]/22 px-3.5 py-2.5 text-[13.5px] text-[#43282A] focus:outline-none focus:border-[#A86438]"
                  />
                </label>

                <label className="block">
                  <span className="block editorial-label text-[#43282A] mb-1.5">
                    {lang === 'ar' ? 'ملاحظات خاصة' : 'Accessibility or Notes'}
                  </span>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder={lang === 'ar' ? 'اختياري' : 'Optional'}
                    className="w-full bg-[#F5EFE2] border border-[#43282A]/22 px-3.5 py-2.5 text-[13.5px] text-[#43282A] focus:outline-none focus:border-[#A86438]"
                  />
                </label>
              </div>

              {/* Order Summary Box */}
              <div className="mt-4 p-4 bg-[#E6DCC8] border border-[#43282A]/16 text-[13px] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#43282A]/72">
                    {date} · {timeSlot}
                  </span>
                  <span className="font-medium text-[#43282A]">
                    {lang === 'ar' ? activeTier.nameAr : activeTier.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#43282A]/72">
                    {totalGuests} {lang === 'ar' ? 'زائر' : totalGuests === 1 ? 'guest' : 'guests'}
                  </span>
                  <span className="font-semibold text-[#A86438] tabular-nums">
                    ${totalUsd} USD
                  </span>
                </div>
              </div>

              {formError && (
                <p className="text-[12.5px] text-[#9A3412] font-medium m-0">{formError}</p>
              )}
            </form>
          )}

          {/* STEP 4: Interactive 3D Tiltable Archival Boarding Pass */}
          {step === 4 && confirmed && (
            <div className="flex flex-col items-center text-center">
              <p className="editorial-label text-[#A86438] mb-2">
                {lang === 'ar' ? 'تم تأكيد حجزك بنجاح' : 'RESERVATION CONFIRMED'}
              </p>
              <h4 className="font-display text-2xl sm:text-3xl text-[#43282A] m-0 mb-6">
                {lang === 'ar' ? 'بطاقة الدخول التفاعلية ثلاثية الأبعاد' : 'YOUR ARCHIVAL 3D ENTRY PASS'}
              </h4>

              {/* 3D Tiltable Ticket Card */}
              <div
                className="perspective-1000 w-full max-w-[540px] cursor-pointer"
                onPointerMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const px = (e.clientX - rect.left) / rect.width - 0.5;
                  const py = (e.clientY - rect.top) / rect.height - 0.5;
                  setPassTilt({ rx: -py * 14, ry: px * 16 });
                }}
                onPointerLeave={() => setPassTilt({ rx: 0, ry: 0 })}
              >
                <div
                  className="preserve-3d bg-[#43282A] text-[#ECE3D1] p-6 sm:p-7 text-left border border-[#A86438]/55 shadow-[0_24px_54px_rgba(43,24,25,0.34)] transition-transform duration-200"
                  style={{
                    transform: `rotateX(${passTilt.rx.toFixed(2)}deg) rotateY(${passTilt.ry.toFixed(2)}deg)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#ECE3D1]/18">
                    <div>
                      <span className="editorial-label text-[#D89564] block">
                        TANA CAMPS EXPEDITIONS · ADMIT {totalGuests}
                      </span>
                      <p className="font-display text-[24px] text-[#FBF5EA] mt-1 m-0">
                        {confirmed.zooName}
                      </p>
                      <p className="text-[12px] text-[#ECE3D1]/70 m-0">{confirmed.zooCity}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#ECE3D1]/55 block">
                        REF
                      </span>
                      <span className="font-mono text-[14px] text-[#FBF5EA] tabular-nums">
                        {confirmed.reference}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-b border-[#ECE3D1]/18 text-[12px]">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECE3D1]/55 block">
                        DATE
                      </span>
                      <span className="tabular-nums font-medium">{confirmed.date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECE3D1]/55 block">
                        WINDOW
                      </span>
                      <span>{confirmed.timeSlot.split(' ')[0]}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECE3D1]/55 block">
                        TOTAL PAID
                      </span>
                      <span className="text-[#E3A676] font-semibold tabular-nums">
                        ${confirmed.totalUsd} USD
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.16em] text-[#ECE3D1]/55 block">
                        GUEST HOLDER
                      </span>
                      <span className="text-[13.5px] font-medium">{confirmed.guestName}</span>
                      <span className="block text-[11px] text-[#ECE3D1]/65">
                        {confirmed.tierName}
                      </span>
                    </div>
                    {/* Crisp SVG Archival Barcode */}
                    <svg width="112" height="36" viewBox="0 0 112 36" fill="none" aria-hidden="true">
                      {[2, 6, 11, 14, 19, 24, 27, 33, 38, 41, 46, 52, 55, 61, 66, 71, 75, 81, 86, 91, 95, 101, 106].map(
                        (x, i) => (
                          <rect
                            key={x}
                            x={x}
                            y="2"
                            width={i % 3 === 0 ? 3 : 1.5}
                            height="32"
                            fill="#ECE3D1"
                            fillOpacity="0.88"
                          />
                        )
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[12.5px] text-[#43282A]/68 mt-5 max-w-md">
                {lang === 'ar'
                  ? 'حرك المؤشر فوق البطاقة لمعاينة تأثير الإمالة ثلاثي الأبعاد. تم حفظ التذكرة تلقائياً في قائمة حجوزاتك.'
                  : 'Move your cursor across the pass to inspect the 3D archival tilt. Your reservation has been saved to My Passes.'}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-5 py-2.5 border border-[#43282A]/24 editorial-label text-[#43282A] hover:border-[#A86438] hover:text-[#A86438] cursor-pointer"
                >
                  {lang === 'ar' ? 'طباعة البطاقة' : 'PRINT PASS'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'إغلاق' : 'DONE'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Footer for Steps 1–3 */}
        {step < 4 && (
          <div className="px-6 md:px-8 py-4 bg-[#E6DCC8]/90 border-t border-[#43282A]/16 flex items-center justify-between gap-4">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[#43282A]/60">
                {lang === 'ar' ? 'الإجمالي التقديري' : 'Estimated Total'}
              </span>
              <span className="font-display-raw text-[24px] text-[#43282A] tabular-nums">
                ${totalUsd} USD
              </span>
            </div>

            <div className="flex items-center gap-3">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                  className="px-4 py-2.5 border border-[#43282A]/24 editorial-label text-[#43282A] hover:border-[#A86438] cursor-pointer"
                >
                  {lang === 'ar' ? 'السابق' : 'BACK'}
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                  className="px-6 py-2.5 bg-[#43282A] text-[#ECE3D1] editorial-label hover:bg-[#A86438] transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'التالي' : 'CONTINUE'}
                </button>
              ) : (
                <button
                  type="submit"
                  form="booking-folio-form"
                  className="px-6 py-2.5 bg-[#A86438] text-[#ECE3D1] editorial-label hover:bg-[#8A4F2B] transition-colors cursor-pointer"
                >
                  {lang === 'ar' ? 'تأكيد وإصدار التذكرة' : 'CONFIRM RESERVATION'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
