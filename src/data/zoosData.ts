export interface TicketTier {
  id: 'explorer' | 'keeper' | 'sanctuary';
  name: string;
  nameAr: string;
  priceMultiplier: number;
  description: string;
  descriptionAr: string;
  perks: string[];
  perksAr: string[];
}

export interface ZooSanctuary {
  id: string;
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  country: string;
  countryAr: string;
  continent: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Africa';
  continentAr: string;
  founded: number;
  lat: number;
  lng: number;
  coordinatesLabel: string;
  speciesCount: string;
  acreage: string;
  basePriceUsd: number;
  hours: string;
  rating: number;
  featuredSpecies: string[];
  featuredSpeciesAr: string[];
  elephantProgram: string;
  elephantProgramAr: string;
  summary: string;
  summaryAr: string;
  image: string;
  timeSlots: string[];
}

export interface Reservation {
  id: string;
  reference: string;
  zooId: string;
  zooName: string;
  zooCity: string;
  date: string;
  timeSlot: string;
  tierId: TicketTier['id'];
  tierName: string;
  adults: number;
  children: number;
  seniors: number;
  addOns: string[];
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialNotes: string;
  totalUsd: number;
  createdAt: string;
}

export const HERO_MEDIA = {
  heroPhoto:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/934f4b51-d05b-4498-9c4a-8262f044da66.jpg',
  elephantCutout:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/5d850aba-1a5b-44eb-bd6c-cd9f87845be7.webp',
  pillSavanna:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/a6ea3433-41c4-46b8-aac3-faefa9ad7558.jpg',
  pillSunset:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/9152c213-6763-4147-83f3-b985e6c65a00.jpg',
  tallPortrait:
    'https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/e665edf0-2b16-4b17-ada1-0b928af1dbfa.jpg',
};

export const TICKET_TIERS: TicketTier[] = [
  {
    id: 'explorer',
    name: 'General Explorer Pass',
    nameAr: 'تذكرة الاستكشاف الكاملة',
    priceMultiplier: 1,
    description: 'Full-day access to all habitats, botanical walkways, and scheduled keeper talks.',
    descriptionAr: 'دخول كامل طوال اليوم لجميع الموائل الطبيعية والمسارات النباتية وجلسات الحراس.',
    perks: ['All sanctuary zones', 'Guided tram circuit', 'Digital field map'],
    perksAr: ['جميع مناطق المحمية', 'جولة القطار الداخلي', 'خريطة رقمية تفاعلية'],
  },
  {
    id: 'keeper',
    name: 'Behind-the-Scenes Keeper Tour',
    nameAr: 'جولة خاصة خلف الكواليس',
    priceMultiplier: 1.85,
    description: 'Small-group wildlife specialist escort with close elephant care observation.',
    descriptionAr: 'مرافقة خبير حياة برية لمجموعة صغيرة مع مشاهدة قريبة لرعاية الأفيال.',
    perks: ['Priority gate entry', '90-min biologist walk', 'Acoustic listening session'],
    perksAr: ['دخول سريع بدون انتظار', 'جولة 90 دقيقة مع باحث', 'جلسة استماع صوتي للطبيعة'],
  },
  {
    id: 'sanctuary',
    name: 'Private Conservation Patron',
    nameAr: 'باقة كبار الشخصيات للحفاظ على البيئة',
    priceMultiplier: 3.1,
    description: 'Bespoke sunrise safari vehicle, conservationist luncheon, and endowment certificate.',
    descriptionAr: 'سيارة سفاري خاصة عند الشروق، غداء مع خبراء الحفاظ، وشهادة مساهمة بيئية.',
    perks: ['Private electric rover', 'Sunrise entry access', '15% direct habitat grant'],
    perksAr: ['مركبة كهربائية خاصة', 'دخول حصري عند الفجر', '15% دعم مباشر للموائل'],
  },
];

export const BOOKING_ADDONS = [
  {
    id: 'audio-guide',
    label: 'Binaural Field Audio Guide',
    labelAr: 'الدليل الصوتي المكاني للطبيعة',
    priceUsd: 12,
  },
  {
    id: 'conservation-fund',
    label: 'Loxodonta Corridor Endowment',
    labelAr: 'مساهمة حماية ممر الأفيال',
    priceUsd: 18,
  },
  {
    id: 'eco-transfer',
    label: 'Round-Trip Electric Sanctuary Shuttle',
    labelAr: 'توصيل كهربائي ذهاب وعودة',
    priceUsd: 24,
  },
];

export const WORLD_ZOOS: ZooSanctuary[] = [
  {
    id: 'san-diego',
    name: 'San Diego Zoo',
    nameAr: 'حديقة حيوان سان دييغو',
    city: 'San Diego, California',
    cityAr: 'سان دييغو، كاليفورنيا',
    country: 'United States',
    countryAr: 'الولايات المتحدة',
    continent: 'Americas',
    continentAr: 'الأمريكتان',
    founded: 1916,
    lat: 32.7353,
    lng: -117.149,
    coordinatesLabel: '32°44′N 117°08′W',
    speciesCount: '650+ species',
    acreage: '100 acres',
    basePriceUsd: 74,
    hours: '09:00 – 18:00',
    rating: 4.9,
    featuredSpecies: ['African Bush Elephant', 'Giant Panda', 'California Condor'],
    featuredSpeciesAr: ['الفيل الأفريقي', 'الباندا العملاقة', 'كندور كاليفورنيا'],
    elephantProgram: '7.5-acre Elephant Odyssey canyon replicating Pleistocene savanna terrain.',
    elephantProgramAr: 'وادي الفيلة الممتد على 7.5 فدان يحاكي سهول السافانا التاريخية.',
    summary:
      'Pioneering open-air canyon reserve in Balboa Park renowned for botanical curation, frozen-zoo genetic preservation, and expansive multi-species habitats.',
    summaryAr:
      'محمية رائدة في الهواء الطلق بحديقة بالبوا تشتهر بتنوعها النباتي الفريد وبرامج الحفاظ الجيني والموائل المفتوحة.',
    image: '/src/assets/images/zoo_san_diego_1795479789926.jpg',
    timeSlots: ['09:00 Morning Mist', '11:30 Canyon Walk', '14:30 Golden Light'],
  },
  {
    id: 'singapore',
    name: 'Singapore Zoo',
    nameAr: 'حديقة حيوان سنغافورة',
    city: 'Mandai Lake',
    cityAr: 'بحيرة مانداي',
    country: 'Singapore',
    countryAr: 'سنغافورة',
    continent: 'Asia-Pacific',
    continentAr: 'آسيا والمحيط الهادئ',
    founded: 1973,
    lat: 1.4043,
    lng: 103.793,
    coordinatesLabel: '01°24′N 103°47′E',
    speciesCount: '300+ species',
    acreage: '69 acres',
    basePriceUsd: 49,
    hours: '08:30 – 18:00',
    rating: 4.9,
    featuredSpecies: ['Sumatran Orangutan', 'Asian Elephant', 'White Tiger'],
    featuredSpeciesAr: ['إنسان الغاب السومطري', 'الفيل الآسيوي', 'النمر الأبيض'],
    elephantProgram: 'Elephants of Asia timber sanctuary with river bathing pools and enrichment.',
    elephantProgramAr: 'محمية أفيال آسيا الاستوائية مع أحواض استحمام نهرية وبرامج إثراء بيئي.',
    summary:
      'Celebrated worldwide for its moat-and-canopy open concept, where rainforest primates roam freely overhead amid lush tropical rivers.',
    summaryAr:
      'تشتهر عالمياً بتصميمها المفتوح بلا أقفاص حيث تتنقل الكائنات الاستوائية بحرية فوق الممرات المائية والغابات المطيرة.',
    image: '/src/assets/images/zoo_singapore_1795479790349.jpg',
    timeSlots: ['08:30 Dawn Canopy', '11:00 Rainforest River', '15:00 Afternoon Mist'],
  },
  {
    id: 'schonbrunn',
    name: 'Tiergarten Schönbrunn',
    nameAr: 'حديقة حيوان شونبرون (فيينا)',
    city: 'Vienna',
    cityAr: 'فيينا',
    country: 'Austria',
    countryAr: 'النمسا',
    continent: 'Europe',
    continentAr: 'أوروبا',
    founded: 1752,
    lat: 48.1821,
    lng: 16.3027,
    coordinatesLabel: '48°10′N 16°18′E',
    speciesCount: '700+ species',
    acreage: '42 acres',
    basePriceUsd: 34,
    hours: '09:00 – 17:30',
    rating: 4.8,
    featuredSpecies: ['African Elephant', 'Siberian Tiger', 'Giant Panda'],
    featuredSpeciesAr: ['الفيل الأفريقي', 'النمر السيبيري', 'الباندا العملاقة'],
    elephantProgram: 'Historic Elephant Park uniting baroque masonry with contemporary herd research.',
    elephantProgramAr: 'حديقة الفيلة التاريخية التي تجمع بين العمارة الباروكية وأبحاث القطعان الحديثة.',
    summary:
      'The oldest continuously operating zoological garden on Earth, radiating symmetrically from its 1759 Imperial Pavilion inside UNESCO palace grounds.',
    summaryAr:
      'أقدم حديقة حيوان عاملة في العالم منذ عام 1752، تحيط بالجناح الإمبراطوري التاريخي ضمن موقع التراث العالمي.',
    image: '/src/assets/images/zoo_vienna_1795479788915.jpg',
    timeSlots: ['09:00 Imperial Morning', '12:00 Pavilion Noon', '14:45 Autumn Walk'],
  },
  {
    id: 'taronga',
    name: 'Taronga Zoo Sydney',
    nameAr: 'حديقة حيوان تارونغا سيدني',
    city: 'Mosman, Sydney',
    cityAr: 'موسمان، سيدني',
    country: 'Australia',
    countryAr: 'أستراليا',
    continent: 'Asia-Pacific',
    continentAr: 'آسيا والمحيط الهادئ',
    founded: 1916,
    lat: -33.8435,
    lng: 151.2413,
    coordinatesLabel: '33°50′S 151°14′E',
    speciesCount: '350+ species',
    acreage: '69 acres',
    basePriceUsd: 52,
    hours: '09:30 – 17:00',
    rating: 4.8,
    featuredSpecies: ['Koala', 'Asian Elephant', 'Tasmanian Devil'],
    featuredSpeciesAr: ['الكوالا الأسترالي', 'الفيل الآسيوي', 'شيطان تسمانيا'],
    elephantProgram: 'Harbourside conservation breeding center supporting regional elephant sanctuaries.',
    elephantProgramAr: 'مركز إكثار وحفاظ مطل على الميناء لدعم محميات الأفيال الإقليمية.',
    summary:
      'Perched on terraced sandstone cliffs overlooking Sydney Harbour, linking coastal eucalyptus groves with world-leading wildlife veterinary science.',
    summaryAr:
      'تطل على ميناء سيدني من فوق منحدرات الحجر الرملي وتضم غابات الأوكالبتوس ومركزاً عالمياً لطب الحياة البرية.',
    image: '/src/assets/images/zoo_taronga_1795479789028.jpg',
    timeSlots: ['09:30 Harbour Breeze', '12:30 Cliffside Trail', '15:00 Sunset Overlook'],
  },
  {
    id: 'berlin',
    name: 'Berlin Zoological Garden',
    nameAr: 'حديقة حيوان برلين',
    city: 'Tiergarten, Berlin',
    cityAr: 'تيرغارتن، برلين',
    country: 'Germany',
    countryAr: 'ألمانيا',
    continent: 'Europe',
    continentAr: 'أوروبا',
    founded: 1844,
    lat: 52.5079,
    lng: 13.3378,
    coordinatesLabel: '52°30′N 13°20′E',
    speciesCount: '1,200+ species',
    acreage: '86 acres',
    basePriceUsd: 28,
    hours: '09:00 – 18:00',
    rating: 4.8,
    featuredSpecies: ['Giant Panda', 'African Savanna Elephant', 'Hippopotamus'],
    featuredSpeciesAr: ['الباندا العملاقة', 'فيل السافانا', 'فرس النهر'],
    elephantProgram: 'Architectural Elefantentor pagoda sanctuary housing multi-generational herds.',
    elephantProgramAr: 'بوابة الأفيال التاريخية بتصميمها المعماري الفريد وموطن القطعان متعددة الأجيال.',
    summary:
      'Holding the most comprehensive species collection in the world, framed by restored nineteenth-century pavilions and an acclaimed aquarium wing.',
    summaryAr:
      'تضم أكبر تنوع لأنواع الحيوانات في العالم وسط أجنحة معمارية مرممة من القرن التاسع عشر وأكواريوم عالمي.',
    image: '/src/assets/images/zoo_berlin_1795479788548.jpg',
    timeSlots: ['09:00 Pagoda Gate', '11:45 Panda Garden', '14:30 Savanna House'],
  },
  {
    id: 'tana-sanctuary',
    name: 'Tana River Sanctuary',
    nameAr: 'محمية نهر تانا للأفيال',
    city: 'Tana Basin',
    cityAr: 'حوض نهر تانا',
    country: 'Kenya',
    countryAr: 'كينيا',
    continent: 'Africa',
    continentAr: 'أفريقيا',
    founded: 1976,
    lat: -1.8745,
    lng: 40.118,
    coordinatesLabel: '01°52′S 40°07′E',
    speciesCount: '260+ wild species',
    acreage: '41,700 acres',
    basePriceUsd: 115,
    hours: '06:00 – 18:30',
    rating: 5.0,
    featuredSpecies: ['Loxodonta africana', 'Reticulated Giraffe', 'Grevy’s Zebra'],
    featuredSpeciesAr: ['الفيل الأفريقي البري', 'الزرافة الشبكية', 'حمار غريفي الوحشي'],
    elephantProgram: 'Flagship wild migratory corridor studied by Tana Camps field ecologists.',
    elephantProgramAr: 'ممر الهجرة البري الرئيسي الذي يوثقه باحثو محميات تانا الميدانيون.',
    summary:
      'An untouched East African riverine savanna where matriarchal bush elephant herds migrate through acacia woodland beneath boundless skies.',
    summaryAr:
      'سهول سافانا نهرية بكر في شرق أفريقيا حيث تهاجر قطعان الأفيال البرية بين أشجار الأكاسيا تحت سماء مفتوحة.',
    image: '/src/assets/images/zoo_kenya_sanctuary_1795479788479.jpg',
    timeSlots: ['06:00 Dawn River Track', '10:00 Acacia Ridge', '16:00 Dusk Watering Hole'],
  },
];

export const ANATOMY_HOTSPOTS = [
  {
    id: 'tusks',
    title: 'Curved Ivory Tusks',
    titleAr: 'الأنياب العاجية المنحنية',
    metric: 'Up to 3.2 m · 45 kg each',
    description:
      'Modified upper incisors that grow continuously throughout life, used to strip acacia bark, dig dry riverbeds for groundwater, and defend calves.',
    descriptionAr:
      'قواطع علوية متحورة تنمو طوال الحياة، تُستخدم لتقشير لحاء الأكاسيا وحفر مجاري المياه الجوفية والدفاع عن الصغار.',
    cameraPreset: 'tusks' as const,
  },
  {
    id: 'ears',
    title: 'Thermoregulatory Pinnae',
    titleAr: 'الأذنان المنظمتان للحرارة',
    metric: '1.8 m span · 5°C blood cooling',
    description:
      'Shaped loosely like the African continent, vast vascular networks inside the ears radiate excess body heat across the open savanna.',
    descriptionAr:
      'تأخذ شكل قارة أفريقيا تقريباً وتحتوي على شبكة وعائية كثيفة تبدد حرارة الجسم الزائدة في سهول السافانا.',
    cameraPreset: 'profile' as const,
  },
  {
    id: 'trunk',
    title: 'Prehensile Proboscis',
    titleAr: 'الخرطوم العضلي الدقيق',
    metric: '40,000 muscles · 10 L water',
    description:
      'A fused upper lip and nose with two opposing finger-like tips capable of lifting a single acacia seed or uprooting a mature sapling.',
    descriptionAr:
      'يضم أكثر من 40 ألف وحدة عضلية مع طرفين دقيقين قادرين على التقاط بذرة واحدة أو حمل جذوع الأشجار.',
    cameraPreset: 'tusks' as const,
  },
  {
    id: 'feet',
    title: 'Seismic Cushion Footpads',
    titleAr: 'الوسائد السمعية في الأقدام',
    metric: '14–35 Hz infrasound detection',
    description:
      'Elastic fatty pads beneath the toe bones distribute six tonnes silently and detect low-frequency herd rumbles traveling kilometers through soil.',
    descriptionAr:
      'وسائد مرنة توزع وزن 6 أطنان بصمت تام وتلتقط الاهتزازات الأرضية لنداءات القطيع عبر عدة كيلومترات.',
    cameraPreset: 'aerial' as const,
  },
];
