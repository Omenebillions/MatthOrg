import { ArtisanRecommendation } from '../types';
import { authFetch } from '../lib/supabase';

export interface TradeCategoryOption {
  id: string;
  name: string;
  shortLabel: string;
  iconName: string;
  popularServices: string[];
  description: string;
}

export const ARTISAN_TRADE_CATEGORIES: TradeCategoryOption[] = [
  {
    id: 'solar',
    name: 'Solar Engineers & Inverter Specialists',
    shortLabel: 'Solar Engineers',
    iconName: 'Sun',
    description: 'Hybrid inverters, monocrystalline solar panels, lithium LiFePO4 battery banks, and backup automation.',
    popularServices: [
      'Hybrid Inverter Installation (3kVA–20kVA)',
      'Lithium Iron Phosphate (LiFePO4) Battery Setup',
      'Solar Panel Rooftop Array Mounting',
      'Power Energy Audit & Load Balancing',
      'Changeover Switch & Inverter Diagnostics',
    ],
  },
  {
    id: 'electrician',
    name: 'Electricians & Wiring Technicians',
    shortLabel: 'Electricians',
    iconName: 'Zap',
    description: 'Conduit house wiring, 3-phase distribution, surge protection, earthing systems, and fault troubleshooting.',
    popularServices: [
      'Conduit & Surface House Electrical Wiring',
      'Distribution Board (DB) Panel Installation',
      'Earthing Rod & Surge Arrester Setup',
      'Automatic Transfer Switch (ATS) Fabrication',
      'Industrial Power Load Balancing & Fault Rectification',
    ],
  },
  {
    id: 'plumber',
    name: 'Plumbers & Fluid Technicians',
    shortLabel: 'Plumbers',
    iconName: 'Droplets',
    description: 'PPR piping, water treatment plants, borehole pump installation, drainage, and sanitary ware.',
    popularServices: [
      'PPR Hot & Cold Water Piping Installation',
      'Submersible Borehole Pump & Control Box Setup',
      'Water Treatment Plant & Reverse Osmosis',
      'Concealed Leak Detection & Pipe Repair',
      'Bathroom Sanitary Ware & Water Heater Installation',
    ],
  },
  {
    id: 'chef',
    name: 'Private Chefs & Event Caterers',
    shortLabel: 'Chefs & Caterers',
    iconName: 'UtensilsCrossed',
    description: 'Gourmet private dining, Nigerian & continental catering, meal prep, and bespoke party menus.',
    popularServices: [
      'Private Chef Home Dining Experiences',
      'Wedding & Corporate Buffet Catering',
      'Weekly Gourmet Meal Preparation & Packaging',
      'Authentic Nigerian Native Delicacies & Soups',
      'Cocktail Finger Foods & Small Chops Platters',
    ],
  },
  {
    id: 'baker',
    name: 'Bakers & Custom Pastry Artists',
    shortLabel: 'Bakers',
    iconName: 'Cake',
    description: 'Custom wedding cakes, birthday tiers, French pastries, gourmet bread, and celebration desserts.',
    popularServices: [
      'Multi-Tier Custom Wedding Cakes & Fondant Art',
      'Sculpted Themed Birthday & Anniversary Cakes',
      'Gourmet Pastries, Croissants & Artisanal Breads',
      'Dessert Tables & Dessert Cups for Corporate Events',
      'Healthy & Gluten-Free Specialty Cakes',
    ],
  },
  {
    id: 'carpenter',
    name: 'Carpenters & Furniture Artisans',
    shortLabel: 'Carpenters',
    iconName: 'Hammer',
    description: 'Bespoke kitchen cabinets, walk-in closets, hardwood doors, modern sofas, and interior joinery.',
    popularServices: [
      'Modern High-Gloss Kitchen Cabinetry Fabrication',
      'Custom Walk-in Wardrobes & Closets',
      'Hardwood Security Doors & Architraves',
      'Upholstered Sectional Sofas & Dining Sets',
      'Roof Truss Framing & Timber Decking',
    ],
  },
  {
    id: 'hvac',
    name: 'AC Technicians & HVAC Engineers',
    shortLabel: 'AC & HVAC',
    iconName: 'Wind',
    description: 'Split unit installation, inverter AC repair, gas refilling, central VRF servicing, and ductwork.',
    popularServices: [
      'Inverter AC Installation & Pipe Flaring',
      'Compressor Replacement & Gas Leak Sealing',
      'Periodic Chemical AC Servicing & Cleaning',
      'Central VRF & Chiller System Maintenance',
      'Commercial Ventilation & Exhaust Ducting',
    ],
  },
  {
    id: 'painter',
    name: 'Painters, Screeders & POP Artisans',
    shortLabel: 'Painters & POP',
    iconName: 'Paintbrush',
    description: 'Wall screeding, satin emulsion finishing, 3D wall paneling, false POP ceilings, and exterior stucco.',
    popularServices: [
      'Flawless Wall Screeding & Satin Paint Application',
      'Decorative POP Ceiling Design & Recessed Lighting',
      'Epoxy Floor Coating for Garages & Living Rooms',
      'Exterior Weatherproof Textured Stucco Coating',
      'Modern Wallpapers & 3D Wall Panel Installation',
    ],
  },
  {
    id: 'mechanic',
    name: 'Auto Mechanics & Auto Electricians',
    shortLabel: 'Auto Mechanics',
    iconName: 'Wrench',
    description: 'Computerized diagnostics, engine overhaul, suspension repair, gearbox servicing, and wiring.',
    popularServices: [
      'OBD-II Computerized Engine Diagnostics',
      'Brake Pad, Caliper & Suspension Rebuilding',
      'Engine Overhaul & Timing Belt Replacement',
      'Automatic Gearbox Servicing & Fluid Flush',
      'Auto Electrical Rewiring & ECU Troubleshooting',
    ],
  },
  {
    id: 'welder',
    name: 'Welders & Metal Fabricators',
    shortLabel: 'Welders & Metal',
    iconName: 'Shield',
    description: 'Wrought iron gates, burglar proofing, steel roof trusses, stainless steel railings, and tanks.',
    popularServices: [
      'Modern Laser-Cut Iron Security Gates',
      'Stainless Steel Staircase & Balcony Railings',
      'Overhead Galvanized Water Tank Stands',
      'Heavy Duty Industrial Steel Trusses',
      'Burglar Proofing Grilles & Window Enclosures',
    ],
  },
  {
    id: 'tailor',
    name: 'Fashion Designers & Bespoke Tailors',
    shortLabel: 'Tailors & Fashion',
    iconName: 'Scissors',
    description: 'Custom Agbada, Senator suits, English bespoke tailoring, evening gowns, and ceremonial attires.',
    popularServices: [
      'Custom Embroidered Agbada & Kaftans',
      'Fitted Senator Suits & Casual Two-Piece Sets',
      'Bespoke English Two-Piece & Three-Piece Suits',
      'Traditional Wedding Aso-Ebi & Bridal Gowns',
      'Corporate Uniform Design & Bulk Sewing',
    ],
  },
  {
    id: 'tiler',
    name: 'Tilers & Marble Specialists',
    shortLabel: 'Tilers & Marble',
    iconName: 'Grid',
    description: 'Vitrified floor tiles, granite countertops, marble cladding, mosaic swimming pools, and interlocks.',
    popularServices: [
      'Large-Format Vitrified Ceramic & Porcelain Floor Tiling',
      'Granite & Marble Kitchen Countertop Fabrication',
      'Bathroom Wall Tile Waterproofing & Alignment',
      'Swimming Pool Mosaic Tile Installation',
      'Interlocking Stone Paving for Compounds',
    ],
  },
  {
    id: 'graphic_designer',
    name: 'Graphic Designers & Brand Studios',
    shortLabel: 'Graphic Designers',
    iconName: 'Sparkles',
    description: 'Logo design, corporate brand identity, print & signage, 3D motion graphics, and web visuals.',
    popularServices: [
      'Corporate Brand Identity & Logo Design',
      'Large-Format Print, Flyers & Signage Production',
      'Social Media Campaign Graphics & Packaging',
      'Website UI/UX & Digital Marketing Assets',
      '3D Animation, VFX & Motion Graphics',
    ],
  },
];

export const NIGERIAN_STATES = [
  'Lagos',
  'Abuja (FCT)',
  'Rivers',
  'Oyo',
  'Edo',
  'Delta',
  'Ogun',
  'Kano',
  'Enugu',
  'Anambra',
  'Kaduna',
  'Akwa Ibom',
  'Ondo',
  'Osun',
  'Kwara',
  'Plateau',
  'Imo',
  'Abia',
  'Bayelsa',
  'Cross River',
  'Nationwide',
];

export const POPULAR_TOWNS_BY_STATE: Record<string, string[]> = {
  Lagos: ['Lekki Phase 1', 'Ikeja', 'Victoria Island', 'Yaba', 'Surulere', 'Ajah', 'Ikoyi', 'Maryland', 'Magodo', 'Gbagada', 'Festac', 'Ikorodu'],
  'Abuja (FCT)': ['Maitama', 'Wuse 2', 'Garki', 'Asokoro', 'Jabi', 'Gwarinpa', 'Utako', 'Lugbe', 'Kubwa', 'Life Camp'],
  Rivers: ['Port Harcourt (Old GRA)', 'New GRA', 'Peter Odili Road', 'Trans-Amadi', 'Rumuokwuta', 'Woji', 'Ada George'],
  Oyo: ['Bodija (Ibadan)', 'Oluyole Estate', 'Ring Road', 'Samonda', 'Akobo', 'Jericho'],
  Edo: ['GRA Benin City', 'Uselu', 'Airport Road', 'Ikpoba Hill'],
  Delta: ['GRA Asaba', 'Warri (Effurun)', 'Okpanam Road', 'Ughelli'],
  Ogun: ['Abeokuta', 'Arepo', 'Magboro', 'Mowe', 'Ibafo', 'Sagamu'],
  Kano: ['Nassarawa GRA', 'Bompai', 'Tarauni', 'Fagge'],
  Enugu: ['Independence Layout', 'New Haven', 'GRA Enugu', 'Trans-Ekulu'],
};

export const INITIAL_ARTISAN_RECOMMENDATIONS: ArtisanRecommendation[] = [
  {
    id: 'rec_solar_01',
    artisan_name: 'Engr. Dapo Alabi (Apex Solar Dynamics)',
    trade_category: 'Solar Engineers & Inverter Specialists',
    phone: '+234 803 441 8920',
    whatsapp: '+2348034418920',
    state: 'Lagos',
    town: 'Lekki Phase 1',
    services_offered: [
      '5kVA - 15kVA Hybrid Inverter Installations',
      'Felicity & Pylontech Lithium Battery Banks',
      'Canadian Solar Tier-1 Panels Mounting',
      'Automated Clean Changeover Wiring',
    ],
    level: 'master_artisan',
    recommender_name: 'Engr. Tunde Adeleke',
    recommender_relationship: 'Homeowner in Lekki',
    work_done: 'Installed a complete 10kVA Felicity Solar Hybrid system with 15kWh Lithium storage at my 5-bedroom duplex.',
    recommendation_note: 'Dapo is exceptionally honest with component specs. He tested every panel on the roof before connection and provided 2 years direct warranty. My generator has been off for 7 months straight.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 28,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d',
    subscription_plan: 'pro',
    is_paid: true,
    created_at: '2026-09-12T10:15:00Z',
  },
  {
    id: 'rec_elec_02',
    artisan_name: 'Mr. Emmanuel Okon (Okon Precision Electrical)',
    trade_category: 'Electricians & Wiring Technicians',
    phone: '+234 812 773 4019',
    whatsapp: '+2348127734019',
    state: 'Abuja (FCT)',
    town: 'Maitama',
    services_offered: [
      '3-Phase Industrial & Residential Conduit Wiring',
      'Schneider Central Distribution Boards',
      'Earthing Protection & Deep Pit Grounding',
      'Automated Transfer Switches (ATS)',
    ],
    level: 'master_artisan',
    recommender_name: 'Amina Sanusi-Bello',
    recommender_relationship: 'Interior Architect',
    work_done: 'Executed complete rewire and custom distribution panel for a 4-unit luxury serviced apartment block in Maitama.',
    recommendation_note: 'Very punctual and understands modern architectural lighting. He uses high-grade Coleman cables exclusively, labels every breaker neatly, and left the work area clean every evening.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 22,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e',
    subscription_plan: 'pro',
    is_paid: true,
    created_at: '2026-09-15T14:20:00Z',
  },
  {
    id: 'rec_plumb_03',
    artisan_name: 'Pa Johnson Adeyemi & Sons Plumbing',
    trade_category: 'Plumbers & Fluid Technicians',
    phone: '+234 802 315 9942',
    whatsapp: '+2348023159942',
    state: 'Lagos',
    town: 'Ikeja',
    services_offered: [
      'PPR Hot & Cold Water Concealed Piping',
      'Submersible Borehole Automation & Float Switches',
      'Industrial Reverse Osmosis Water Treatment',
      'Leak Detection & Pressure Balancing',
    ],
    level: 'master_artisan',
    recommender_name: 'Dr. Kelechi Nwosu',
    recommender_relationship: 'Hospital Administrator',
    work_done: 'Installed whole-building PPR pressurized plumbing and automated water filtration tanks for our surgical clinic in Ikeja GRA.',
    recommendation_note: 'Over 20 years on the job. When other plumbers were guessing about low pressure in the upper floor, Pa Johnson diagnosed the airlock in 10 minutes and resolved it permanently with zero drama.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 35,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7',
    created_at: '2026-09-18T09:40:00Z',
  },
  {
    id: 'rec_chef_04',
    artisan_name: 'Chef Tariere Briggs (Taste of Niger Gourmet)',
    trade_category: 'Private Chefs & Event Caterers',
    phone: '+234 809 618 3350',
    whatsapp: '+2348096183350',
    state: 'Rivers',
    town: 'Port Harcourt (Old GRA)',
    services_offered: [
      'Private Multi-Course Dinner Hosting',
      'Authentic Native Seafood Owo, Fisherman Soup & Banga',
      'Corporate Executive Luncheon Buffets',
      'Gourmet Barbecue & Cocktail Bites',
    ],
    level: 'master_artisan',
    recommender_name: 'Mrs. Ibim West',
    recommender_relationship: 'Private Client',
    work_done: 'Catered our 50th birthday celebration dinner for 35 guests with a 4-course bespoke seafood menu.',
    recommendation_note: 'Her food presentation is world-class! The Fisherman soup and grilled jumbo prawns were talked about for weeks. Her kitchen team was dressed sharply, courteous, and left my kitchen sparkling clean.',
    rating: 5,
    pricing_tier: 'premium_quality',
    vouches_count: 19,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c',
    created_at: '2026-09-21T16:00:00Z',
  },
  {
    id: 'rec_baker_05',
    artisan_name: 'Fatima Bello (Sweet Confections Abuja)',
    trade_category: 'Bakers & Custom Pastry Artists',
    phone: '+234 818 202 5590',
    whatsapp: '+2348182025590',
    state: 'Abuja (FCT)',
    town: 'Wuse 2',
    services_offered: [
      'Architectural 4-Tier Wedding Cakes',
      'Velvet Red, Belgian Chocolate & Carrot Cakes',
      'French Macarons & Artisanal Croissants',
      'Dessert Cup Towers for Luxury Events',
    ],
    level: 'experienced',
    recommender_name: 'Zainab Danjuma',
    recommender_relationship: 'Bride & Event Planner',
    work_done: 'Baked and delivered a 4-tier suspended wedding cake with hand-crafted sugar flowers for 600 wedding guests.',
    recommendation_note: 'Delivered in mint condition 3 hours ahead of reception schedule. The red velvet and salted caramel sponge tasted heavenly — guests were asking for takeaway slices. Zero stress from start to finish.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 24,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1535141192574-5d4897c13136',
    created_at: '2026-09-24T11:10:00Z',
  },
  {
    id: 'rec_carp_06',
    artisan_name: 'Master Uche Nwachukwu (Craftsman Woodworks)',
    trade_category: 'Carpenters & Furniture Artisans',
    phone: '+234 803 720 1198',
    whatsapp: '+2348037201198',
    state: 'Lagos',
    town: 'Yaba',
    services_offered: [
      'High-Gloss Acrylic Kitchen Cabinets',
      'Solid Teakwood Entrance Doors & Frames',
      'Custom Bedroom Walk-in Closets',
      'Modern Media Walls & Floating TV Consoles',
    ],
    level: 'master_artisan',
    recommender_name: 'Femi Olayiwola',
    recommender_relationship: 'Home Renovation Client',
    work_done: 'Built all kitchen cabinets and master bedroom wardrobe for our 4-bedroom terrace house in Surulere.',
    recommendation_note: 'Uche is an old-school craftsman who respects measurements down to the millimeter. Soft-close German hinges, flawless edge banding, and he delivered on the promised 3-week timeline.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 31,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4',
    created_at: '2026-09-27T08:30:00Z',
  },
  {
    id: 'rec_hvac_07',
    artisan_name: 'Engr. Segun Ogundipe (CoolTech HVAC Solutions)',
    trade_category: 'AC Technicians & HVAC Engineers',
    phone: '+234 805 119 4432',
    whatsapp: '+2348051194432',
    state: 'Oyo',
    town: 'Bodija (Ibadan)',
    services_offered: [
      'Inverter AC Installation & Flare Leak Diagnosis',
      'Commercial VRF Central Air Servicing',
      'Precision Chemical Coil Deep Cleaning',
      'Compressor Rewind & Motor Replacement',
    ],
    level: 'experienced',
    recommender_name: 'Prof. Olumide Akindele',
    recommender_relationship: 'Resident in Bodija',
    work_done: 'Installed 6 units of Daikin Inverter split ACs and repaired a commercial cold room at our agro-processing warehouse.',
    recommendation_note: 'Clean copper line routing without ugly hanging wires outside the building. He uses digital pressure gauges and vacuum pump before releasing refrigerant. A true professional.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 17,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758',
    created_at: '2026-10-01T13:45:00Z',
  },
  {
    id: 'rec_paint_08',
    artisan_name: 'Ibrahim Danladi (Royal Finishing & Screeding)',
    trade_category: 'Painters, Screeders & POP Artisans',
    phone: '+234 807 433 9012',
    whatsapp: '+2348074339012',
    state: 'Abuja (FCT)',
    town: 'Gwarinpa',
    services_offered: [
      'Laser-Level Wall Screeding (Mirror Finish)',
      'POP False Ceilings & Warm Cove Lighting',
      'Epoxy Floor Screeding & Metallic Swirls',
      'Washable Silk Emulsion Paint Application',
    ],
    level: 'master_artisan',
    recommender_name: 'Barrister Nkechi Eze',
    recommender_relationship: 'Real Estate Developer',
    work_done: 'Handled full interior screeding and painting for a 6-bedroom detached duplex in Gwarinpa Estate.',
    recommendation_note: 'Walls feel like marble glass! No visible trowel marks or patches. He and his apprentices covered all tile floors and aluminum window frames with masking tape before starting. Pristine work.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 26,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f',
    created_at: '2026-10-04T15:20:00Z',
  },
  {
    id: 'rec_weld_09',
    artisan_name: 'Chidi & Bros Steel Engineering',
    trade_category: 'Welders & Metal Fabricators',
    phone: '+234 813 904 8871',
    whatsapp: '+2348139048871',
    state: 'Edo',
    town: 'GRA Benin City',
    services_offered: [
      'Laser-Cut Motorized Iron Compound Gates',
      'Stainless Steel Grade 304 Staircase Railings',
      'Overhead 20,000L Galvanized Water Tower',
      'Burglar-Proof Window Grilles with Rust Protection',
    ],
    level: 'master_artisan',
    recommender_name: 'Elder Osaro Igbinedion',
    recommender_relationship: 'Compound Owner',
    work_done: 'Fabricated and installed an automated 16ft sliding iron security gate with intercom and stainless steel balcony railings.',
    recommendation_note: 'Heavy gauge steel, no hollow shortcuts. The primer and oven-baked automotive finish have survived rainy season with zero rust spots. Highly recommended in Benin City.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 15,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122',
    created_at: '2026-10-08T09:10:00Z',
  },
  {
    id: 'rec_mech_10',
    artisan_name: 'Autocare By Kayode (Mercedes & Japanese Specialist)',
    trade_category: 'Auto Mechanics & Auto Electricians',
    phone: '+234 802 884 1093',
    whatsapp: '+2348028841093',
    state: 'Lagos',
    town: 'Maryland',
    services_offered: [
      'Autel & Launch Computerized Fault Diagnostics',
      'Hydraulic Suspension (Air-Matic) Troubleshooting',
      'Automatic Transmission Servicing & Solenoids',
      'Preventive 10,000km Engine Maintenance',
    ],
    level: 'master_artisan',
    recommender_name: 'Tunde Bakare',
    recommender_relationship: 'Long-term Client (5 years)',
    work_done: 'Diagnosed and replaced faulty transmission valve body on my Mercedes E-Class that two other workshops said needed a new engine.',
    recommendation_note: 'Kayode is the rarest breed in Lagos auto repair: an honest mechanic. He sends video updates of parts being removed and purchased, and gives you back old parts in boxes. You will never be scammed here.',
    rating: 5,
    pricing_tier: 'fair',
    vouches_count: 42,
    verified: true,
    photo_url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b',
    created_at: '2026-10-11T12:00:00Z',
  },
];

const LOCAL_STORAGE_KEY = 'matthorg_artisan_recommendations_v1';
const VOUCHED_STORAGE_KEY = 'matthorg_user_vouched_ids_v1';

/**
 * Fetches all artisan recommendations from server API and merges with local storage.
 */
export async function fetchArtisanRecommendations(): Promise<ArtisanRecommendation[]> {
  let serverList: ArtisanRecommendation[] = [];
  try {
    const res = await fetch('/api/recommendations');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.data) && data.data.length > 0) {
        serverList = data.data;
      }
    }
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Server fetch error (falling back to local):', err);
  }

  let localCustom: ArtisanRecommendation[] = [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      localCustom = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  // Merge unique: seeded defaults + server saved + local saved
  const map = new Map<string, ArtisanRecommendation>();
  INITIAL_ARTISAN_RECOMMENDATIONS.forEach((item) => map.set(item.id, item));
  serverList.forEach((item) => map.set(item.id, item));
  localCustom.forEach((item) => map.set(item.id, item));

  return Array.from(map.values()).sort((a, b) => {
    // Sort by most vouched + newest
    if ((b.vouches_count || 0) !== (a.vouches_count || 0)) {
      return (b.vouches_count || 0) - (a.vouches_count || 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Generates the official MatthOrg invitation message template requested by the user:
 *
 * You've been recommended!
 * MatthOrg Invitation
 * Someone has recommended your services on MatthOrg because they believe your work deserves more recognition.
 * Claim your professional profile to tell more customers what you do, showcase your work and explore opportunities to grow your business.
 */
export function buildArtisanOutreachMessage(
  recommendation: ArtisanRecommendation,
  channel: 'whatsapp' | 'sms' = 'whatsapp',
  claimBaseUrl?: string
): string {
  const baseUrl = claimBaseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://matthorg.com');
  const claimUrl = `${baseUrl}/business?claim=${encodeURIComponent(recommendation.id)}&artisan=${encodeURIComponent(recommendation.artisan_name)}`;

  const recommenderContext = recommendation.recommender_name
    ? `(${recommendation.recommender_name} recommended you on MatthOrg)`
    : '';

  if (channel === 'sms') {
    return `You've been recommended!\nMatthOrg Invitation\n\nSomeone has recommended your services on MatthOrg because they believe your work deserves more recognition ${recommenderContext}.\n\nClaim your professional profile to tell more customers what you do, showcase your work and explore opportunities to grow your business.\n\nClaim here: ${claimUrl}`;
  }

  // WhatsApp formatted message with bolding and clean line breaks
  return `*You've been recommended!* 🎉\n*MatthOrg Invitation*\n\nHello *${recommendation.artisan_name}*,\n\nSomeone has recommended your services on MatthOrg because they believe your work deserves more recognition ${recommenderContext ? `\n_${recommenderContext}_` : ''}.\n\n*Claim your professional profile* to tell more customers what you do, showcase your work and explore opportunities to grow your business.\n\n👉 *Claim your profile here:* ${claimUrl}\n\n_MatthOrg — Empowering Nigerian Artisans & Service Contractors._`;
}

/**
 * Saves a new artisan recommendation locally and persists to server store.
 */
export async function saveArtisanRecommendation(
  newRec: Omit<ArtisanRecommendation, 'id' | 'created_at' | 'vouches_count'>
): Promise<ArtisanRecommendation> {
  const completeRec: ArtisanRecommendation = {
    ...newRec,
    id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    vouches_count: 1, // Recommender counts as first vouch
    validation_status: 'pending',
    outreach_status: 'not_contacted',
    created_at: new Date().toISOString(),
    verified: false,
  };

  // 1. Save in localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: ArtisanRecommendation[] = raw ? JSON.parse(raw) : [];
    existing.unshift(completeRec);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('[MatthOrg Recommendations] Local storage save error:', e);
  }

  // 2. Persist to server API
  try {
    await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completeRec),
    });
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Server persist error:', err);
  }

  return completeRec;
}

/**
 * Updates an artisan recommendation's validation status, outreach status, or notes.
 */
export async function updateArtisanRecommendation(
  id: string,
  updates: Partial<ArtisanRecommendation>
): Promise<ArtisanRecommendation | null> {
  let updatedItem: ArtisanRecommendation | null = null;

  // 1. Update in localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: ArtisanRecommendation[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((r) => r.id === id);
    if (index !== -1) {
      existing[index] = { ...existing[index], ...updates, updated_at: new Date().toISOString() };
      updatedItem = existing[index];
    } else {
      // Find from initial seed if not in localStorage yet
      const seedItem = INITIAL_ARTISAN_RECOMMENDATIONS.find((r) => r.id === id);
      if (seedItem) {
        updatedItem = { ...seedItem, ...updates, updated_at: new Date().toISOString() };
        existing.unshift(updatedItem);
      }
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (e) {
    console.warn('[MatthOrg Recommendations] Local storage update error:', e);
  }

  // 2. Persist to server API (admin auth required)
  try {
    const res = await authFetch(`/api/recommendations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data) {
        updatedItem = data.data;
      }
    }
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Server PATCH error:', err);
  }

  return updatedItem;
}

/**
 * Deletes an artisan recommendation.
 */
export async function deleteArtisanRecommendation(id: string): Promise<boolean> {
  // 1. Remove from localStorage
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const existing: ArtisanRecommendation[] = JSON.parse(raw);
      const filtered = existing.filter((r) => r.id !== id);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  // 2. Remove on server (admin auth required)
  try {
    await authFetch(`/api/recommendations/${id}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Server DELETE error:', err);
  }

  return true;
}

/**
 * Allows an authenticated artisan signing up via ?claim=... to claim their recommended profile safely.
 */
export async function claimArtisanRecommendation(id: string): Promise<ArtisanRecommendation | null> {
  if (!id) return null;
  try {
    const res = await authFetch(`/api/recommendations/${encodeURIComponent(id)}/claim`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Claim API notice:', err);
  }
  return null;
}

/**
 * Checks if the user already vouched for an artisan recommendation.
 */
export function hasUserVouched(recommendationId: string): boolean {
  try {
    const raw = localStorage.getItem(VOUCHED_STORAGE_KEY);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return list.includes(recommendationId);
  } catch {
    return false;
  }
}

/**
 * Adds a community vouch to an artisan recommendation.
 */
export async function vouchForArtisan(recommendationId: string): Promise<number> {
  // Record user vouch in localStorage
  try {
    const raw = localStorage.getItem(VOUCHED_STORAGE_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(recommendationId)) {
      list.push(recommendationId);
      localStorage.setItem(VOUCHED_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // ignore
  }

  // Update in localStorage
  let newVouches = 1;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    const existing: ArtisanRecommendation[] = raw ? JSON.parse(raw) : [];
    const item = existing.find((r) => r.id === recommendationId);
    if (item) {
      item.vouches_count = (item.vouches_count || 0) + 1;
      newVouches = item.vouches_count;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    }
  } catch {
    // ignore
  }

  // Call server vouch API
  try {
    const res = await fetch(`/api/recommendations/${recommendationId}/vouch`, {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.vouches_count) {
        newVouches = data.vouches_count;
      }
    }
  } catch (err) {
    console.warn('[MatthOrg Recommendations] Vouch API error:', err);
  }

  return newVouches;
}
