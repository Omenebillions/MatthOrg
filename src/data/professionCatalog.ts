import { BUSINESS_INDUSTRIES } from './businessIndustries';
import { ARTISAN_TRADE_CATEGORIES } from './recommendationsData';
import { BASE_SERVICE_TAXONOMY, inferServiceAttributes } from './serviceTaxonomy';
import type { DirectoryBusiness } from '../types';

export interface ProfessionCatalogItem {
  label: string;
  industry: string;
  providerType: DirectoryBusiness['provider_type'];
  group: 'Artisan & Trade' | 'Freelancer & Creative' | 'Independent Professional' | 'Product Seller & Merchant' | 'Services & Contracting';
  keywords: string[];
  popular?: boolean;
}

const CORE_PROFESSIONS: ProfessionCatalogItem[] = [
  // Popular Everyday Trades, Artisans, Professionals, Freelancers & Sellers
  {
    label: 'Tailor / Fashion Designer',
    industry: 'Other Specialized Enterprise / General Contractor',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['tailor', 'fashion designer', 'seamstress', 'sewing', 'bespoke', 'aso ebi', 'clothing', 'garment'],
    popular: true,
  },
  {
    label: 'Lawyer / Legal Practitioner',
    industry: 'Legal Services, Corporate CAC & Compliance',
    providerType: 'professional',
    group: 'Independent Professional',
    keywords: ['lawyer', 'legal', 'barrister', 'solicitor', 'attorney', 'cac', 'contract', 'litigation', 'property law'],
    popular: true,
  },
  {
    label: 'Graphic Designer & Brand Identity',
    industry: 'Media, Photography, Videography & Branding',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['graphic designer', 'designer', 'logo', 'flyer', 'branding', 'illustrator', 'ui', 'poster'],
    popular: true,
  },
  {
    label: 'Plumber & Water Technician',
    industry: 'Plumbing, Water Systems & Boreholes',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['plumber', 'plumbing', 'pipe', 'leak', 'bathroom', 'borehole', 'pump', 'sanitary'],
    popular: true,
  },
  {
    label: 'Electrician & Wiring Technician',
    industry: 'Electrical Engineering, Power & Energy',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['electrician', 'wiring', 'electrical', 'conduit', 'changeover', 'power', 'socket', 'panel'],
    popular: true,
  },
  {
    label: 'Solar & Inverter Technician',
    industry: 'Electrical Engineering, Power & Energy',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['solar', 'inverter', 'battery', 'panels', 'hybrid', 'lithium', 'backup power'],
    popular: true,
  },
  {
    label: 'Caterer & Private Chef',
    industry: 'Events, Catering, Decor & Rentals',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['caterer', 'chef', 'cook', 'food', 'small chops', 'buffet', 'meal prep', 'events'],
    popular: true,
  },
  {
    label: 'Baker & Cake Maker',
    industry: 'Events, Catering, Decor & Rentals',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['baker', 'cake', 'pastry', 'pastries', 'bread', 'cupcake', 'wedding cake'],
    popular: true,
  },
  {
    label: 'Hair Stylist & Braider',
    industry: 'Beauty, Hair Styling, Spa & Personal Wellness',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['hair', 'hairstylist', 'salon', 'braids', 'wig', 'weave', 'beauty'],
    popular: true,
  },
  {
    label: 'Makeup Artist',
    industry: 'Beauty, Hair Styling, Spa & Personal Wellness',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['makeup', 'mua', 'bridal', 'glam', 'beauty', 'gele'],
    popular: true,
  },
  {
    label: 'Barber / Grooming Specialist',
    industry: 'Beauty, Hair Styling, Spa & Personal Wellness',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['barber', 'haircut', 'grooming', 'barbing salon'],
  },
  {
    label: 'Auto Mechanic & Car Diagnostics',
    industry: 'Automotive Repairs, Diagnostics & Fleet Maintenance',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['mechanic', 'car repair', 'auto', 'engine', 'rewire', 'brake', 'diagnostics', 'ac repair'],
    popular: true,
  },
  {
    label: 'AC & Refrigerator Technician',
    industry: 'HVAC, Air Conditioning & Refrigeration',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['ac', 'air conditioner', 'fridge', 'freezer', 'refrigerator', 'hvac', 'cooling', 'gas refill'],
  },
  {
    label: 'Generator Repair Technician',
    industry: 'Electrical Engineering, Power & Energy',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['generator', 'gen', 'diesel', 'petrol', 'overhaul', 'servicing'],
  },
  {
    label: 'Carpenter & Furniture Maker',
    industry: 'Carpentry, Furniture, Woodwork & Cabinetry',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['carpenter', 'furniture', 'cabinet', 'kitchen', 'wardrobe', 'door', 'woodwork', 'upholstery'],
  },
  {
    label: 'Painter, Screeder & POP Installer',
    industry: 'Interior Design, Finishing & Painting',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['painter', 'painting', 'screeding', 'pop', 'ceiling', 'wallpaper', 'interior'],
  },
  {
    label: 'Welder & Metal Fabricator',
    industry: 'Metal Fabrication, Welding, Roofing & Aluminium',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['welder', 'fabrication', 'gate', 'burglar proof', 'steel', 'iron', 'handrail'],
  },
  {
    label: 'Aluminium & Glass Installer',
    industry: 'Metal Fabrication, Welding, Roofing & Aluminium',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['aluminium', 'window', 'glass', 'partition', 'shower cubicle', 'sliding door'],
  },
  {
    label: 'Tiler & Stone / Marble Installer',
    industry: 'Building, Construction & Civil Works',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['tiler', 'tiling', 'tiles', 'marble', 'granite', 'flooring'],
  },
  {
    label: 'Bricklayer / Mason & Builder',
    industry: 'Building, Construction & Civil Works',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['bricklayer', 'mason', 'building', 'contractor', 'construction', 'renovation', 'plastering'],
  },
  {
    label: 'Phone & Laptop Repair Technician',
    industry: 'IT Services, Software, Web & Cloud',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['phone repair', 'laptop repair', 'screen replacement', 'iphone', 'macbook', 'computer technician'],
  },
  {
    label: 'Web & Software Developer',
    industry: 'IT Services, Software, Web & Cloud',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['web developer', 'software', 'website', 'app developer', 'react', 'wordpress', 'ecommerce', 'freelancer'],
    popular: true,
  },
  {
    label: 'UI/UX & Product Designer',
    industry: 'IT Services, Software, Web & Cloud',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['ui', 'ux', 'product designer', 'figma', 'mobile design', 'freelancer'],
  },
  {
    label: 'Digital Marketer & Social Media Manager',
    industry: 'Media, Photography, Videography & Branding',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['digital marketing', 'social media', 'ads', 'seo', 'content creator', 'copywriter'],
  },
  {
    label: 'Photographer & Videographer',
    industry: 'Media, Photography, Videography & Branding',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['photographer', 'videographer', 'wedding', 'studio', 'drone', 'editing'],
  },
  {
    label: 'Accountant & Tax Consultant',
    industry: 'Accounting, Bookkeeping, Audit & Tax Advisory',
    providerType: 'professional',
    group: 'Independent Professional',
    keywords: ['accountant', 'tax', 'bookkeeping', 'audit', 'firs', 'payroll', 'finance'],
  },
  {
    label: 'Real Estate Agent & Property Manager',
    industry: 'Real Estate, Property Management & Valuation',
    providerType: 'professional',
    group: 'Independent Professional',
    keywords: ['realtor', 'real estate', 'agent', 'property', 'land', 'apartment', 'rent', 'shortlet'],
  },
  {
    label: 'Architect & Building Plan Designer',
    industry: 'Architecture, Surveying & Structural Engineering',
    providerType: 'professional',
    group: 'Independent Professional',
    keywords: ['architect', '3d design', 'building plan', 'structural', 'cad', 'surveyor'],
  },
  {
    label: 'Private Tutor & Exam Coach',
    industry: 'Education, Private Tutoring & Vocational Training',
    providerType: 'professional',
    group: 'Independent Professional',
    keywords: ['tutor', 'teacher', 'home lesson', 'waec', 'jamb', 'igcse', 'coding tutor'],
  },
  {
    label: 'Cleaner & Fumigation Specialist',
    industry: 'Cleaning, Janitorial & Facility Management',
    providerType: 'artisan',
    group: 'Services & Contracting',
    keywords: ['cleaner', 'cleaning', 'deep clean', 'fumigation', 'pest control', 'laundry', 'upholstery'],
  },
  {
    label: 'Logistics & Dispatch Rider',
    industry: 'Logistics, Haulage, Dispatch & Relocation',
    providerType: 'artisan',
    group: 'Services & Contracting',
    keywords: ['dispatch', 'delivery', 'rider', 'courier', 'logistics', 'moving', 'relocation', 'haulage'],
  },
  {
    label: 'Event Planner & Decorator',
    industry: 'Events, Catering, Decor & Rentals',
    providerType: 'business',
    group: 'Services & Contracting',
    keywords: ['event planner', 'decor', 'wedding', 'rentals', 'ushers', 'mc'],
  },
  {
    label: 'CCTV & Security Installer',
    industry: 'CCTV, Security Systems & Access Control',
    providerType: 'repair_technician',
    group: 'Artisan & Trade',
    keywords: ['cctv', 'camera', 'electric fence', 'access control', 'intercom', 'gate motor'],
  },
  {
    label: 'Printer & Custom Merch Seller',
    industry: 'Printing, Signage & Corporate Merchandise',
    providerType: 'business',
    group: 'Services & Contracting',
    keywords: ['printer', 'printing', 'banner', 'flyer', 'signage', 'souvenir', 't-shirt printing'],
  },
  {
    label: 'Electronics & Phone Seller',
    industry: 'Wholesale, Retail & General Merchandise Supplies',
    providerType: 'merchant',
    group: 'Product Seller & Merchant',
    keywords: ['electronics', 'phones', 'laptops', 'accessories', 'solar products', 'gadgets', 'seller'],
    popular: true,
  },
  {
    label: 'Fashion, Fabrics & Accessories Seller',
    industry: 'Wholesale, Retail & General Merchandise Supplies',
    providerType: 'merchant',
    group: 'Product Seller & Merchant',
    keywords: ['fashion seller', 'boutique', 'clothes', 'shoes', 'bags', 'fabrics', 'ankara', 'thrift'],
  },
  {
    label: 'Building Materials & Hardware Seller',
    industry: 'Wholesale, Retail & General Merchandise Supplies',
    providerType: 'merchant',
    group: 'Product Seller & Merchant',
    keywords: ['building materials', 'cement', 'tiles', 'paint', 'plumbing materials', 'electrical cables', 'hardware'],
  },
  {
    label: 'Foodstuff & Agro Produce Seller',
    industry: 'Agriculture, Farming, Livestock & Agro-Allied',
    providerType: 'merchant',
    group: 'Product Seller & Merchant',
    keywords: ['foodstuff', 'poultry', 'fish', 'eggs', 'palm oil', 'rice', 'groceries', 'farm produce'],
  },
  {
    label: 'Skincare, Cosmetics & Perfumes Seller',
    industry: 'Beauty, Hair Styling, Spa & Personal Wellness',
    providerType: 'merchant',
    group: 'Product Seller & Merchant',
    keywords: ['skincare', 'cosmetics', 'perfumes', 'body oils', 'beauty products', 'seller'],
  },
  {
    label: 'Shoe & Bag Maker / Cobbler',
    industry: 'Other Specialized Enterprise / General Contractor',
    providerType: 'artisan',
    group: 'Artisan & Trade',
    keywords: ['shoemaker', 'cobbler', 'leather', 'sandals', 'palm slippers', 'bags'],
  },
  {
    label: 'Interior Decorator & Stager',
    industry: 'Interior Design, Finishing & Painting',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['interior decorator', 'interior design', 'curtains', 'blinds', 'rugs', 'home staging'],
  },
  {
    label: 'Dry Cleaner & Laundry Service',
    industry: 'Cleaning, Janitorial & Facility Management',
    providerType: 'business',
    group: 'Services & Contracting',
    keywords: ['laundry', 'dry cleaner', 'ironing', 'wash and fold'],
  },
  {
    label: 'Car Wash & Auto Detailing',
    industry: 'Automotive Repairs, Diagnostics & Fleet Maintenance',
    providerType: 'artisan',
    group: 'Services & Contracting',
    keywords: ['car wash', 'detailing', 'polishing', 'ceramic coating'],
  },
  {
    label: 'Writer, Editor & Virtual Assistant',
    industry: 'IT Services, Software, Web & Cloud',
    providerType: 'professional',
    group: 'Freelancer & Creative',
    keywords: ['writer', 'copywriter', 'content writer', 'virtual assistant', 'editor', 'proofreading'],
  },
];

function buildProfessionCatalog(): ProfessionCatalogItem[] {
  const map = new Map<string, ProfessionCatalogItem>();

  for (const item of CORE_PROFESSIONS) {
    map.set(item.label.toLowerCase(), item);
  }

  // Merge BASE_SERVICE_TAXONOMY entries
  for (const svc of BASE_SERVICE_TAXONOMY) {
    const key = svc.name.toLowerCase();
    if (!map.has(key)) {
      const attrs = inferServiceAttributes(svc.name, svc.category);
      const matchedInd = BUSINESS_INDUSTRIES.find(
        (ind) => ind.name.toLowerCase() === attrs.category.toLowerCase()
      );
      map.set(key, {
        label: svc.name,
        industry: matchedInd?.name || attrs.category || 'Other Specialized Enterprise / General Contractor',
        providerType: 'business',
        group: 'Services & Contracting',
        keywords: [...(svc.seoKeywords || []), ...(svc.subServices || []).slice(0, 2)],
      });
    }
  }

  // Merge ARTISAN_TRADE_CATEGORIES
  for (const trade of ARTISAN_TRADE_CATEGORIES) {
    const key = trade.name.toLowerCase();
    if (!map.has(key)) {
      const attrs = inferServiceAttributes(trade.name);
      map.set(key, {
        label: trade.name,
        industry: attrs.category || 'Other Specialized Enterprise / General Contractor',
        providerType: 'artisan',
        group: 'Artisan & Trade',
        keywords: [trade.shortLabel, ...trade.popularServices],
      });
    }
  }

  // Merge BUSINESS_INDUSTRIES specializations
  for (const ind of BUSINESS_INDUSTRIES) {
    if (!map.has(ind.name.toLowerCase())) {
      map.set(ind.name.toLowerCase(), {
        label: ind.name,
        industry: ind.name,
        providerType: 'business',
        group: 'Services & Contracting',
        keywords: ind.keywords,
      });
    }
  }

  return Array.from(map.values());
}

export const PROFESSION_CATALOG: ProfessionCatalogItem[] = buildProfessionCatalog();

export const POPULAR_PROFESSIONS: ProfessionCatalogItem[] = PROFESSION_CATALOG.filter((p) => p.popular);

export function searchProfessions(query: string, limit = 10): ProfessionCatalogItem[] {
  const clean = (query || '').trim().toLowerCase();
  if (!clean) {
    return POPULAR_PROFESSIONS.slice(0, limit);
  }

  const terms = clean.split(/\s+/).filter(Boolean);
  const scored: Array<{ item: ProfessionCatalogItem; score: number }> = [];

  for (const item of PROFESSION_CATALOG) {
    const labelLower = item.label.toLowerCase();
    const hay = [item.label, item.industry, item.group, ...item.keywords].join(' ').toLowerCase();

    let score = 0;
    if (labelLower === clean) score += 120;
    else if (labelLower.startsWith(clean)) score += 90;
    else if (labelLower.includes(clean)) score += 65;

    for (const kw of item.keywords) {
      const kwLower = kw.toLowerCase();
      if (kwLower === clean) score += 80;
      else if (kwLower.startsWith(clean)) score += 50;
      else if (kwLower.includes(clean)) score += 30;
    }

    if (score === 0 && terms.every((t) => hay.includes(t))) {
      score += 25;
    }

    if (score > 0) {
      if (item.popular) score += 5;
      scored.push({ item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label));
  return scored.slice(0, limit).map((s) => s.item);
}

export function inferIndustryAndTypeForProfession(profession: string): {
  industry: string;
  providerType: DirectoryBusiness['provider_type'];
} {
  const clean = (profession || '').trim();
  if (!clean) {
    return {
      industry: 'Other Specialized Enterprise / General Contractor',
      providerType: 'business',
    };
  }

  const lower = clean.toLowerCase();
  const exact = PROFESSION_CATALOG.find((p) => p.label.toLowerCase() === lower);
  if (exact) {
    return { industry: exact.industry, providerType: exact.providerType };
  }

  const matched = searchProfessions(clean, 1)[0];
  if (matched) {
    return { industry: matched.industry, providerType: matched.providerType };
  }

  const sellerHint = /\b(seller|trader|merchant|vendor|shop|store|dealer|wholesale|retail|distributor|boutique)\b/i.test(lower);
  const artisanHint = /\b(tailor|plumber|electrician|mechanic|carpenter|welder|painter|tiler|mason|bricklayer|baker|chef|caterer|barber|stylist|makeup|cobbler|repair|technician|driver|rider|cleaner)\b/i.test(lower);
  const proHint = /\b(lawyer|barrister|solicitor|doctor|nurse|pharmacist|accountant|auditor|architect|engineer|consultant|designer|developer|writer|tutor|realtor|agent|photographer|videographer)\b/i.test(lower);

  const inferred = inferServiceAttributes(clean);
  const matchedBizIndustry = BUSINESS_INDUSTRIES.find(
    (ind) =>
      ind.name.toLowerCase() === inferred.category.toLowerCase() ||
      ind.keywords.some((kw) => lower.includes(kw))
  );

  return {
    industry: matchedBizIndustry?.name || inferred.category || 'Other Specialized Enterprise / General Contractor',
    providerType: sellerHint
      ? 'merchant'
      : artisanHint
        ? 'artisan'
        : proHint
          ? 'professional'
          : 'business',
  };
}
