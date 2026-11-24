import { Lead, BusinessProfile } from '../types';

export interface BusinessIndustryDef {
  id: string;
  name: string;
  categoryGroup: string;
  description: string;
  defaultSpecializations: string[];
  sampleItems: { name: string; unit: string; price: number }[];
  keywords: string[];
}

export const BUSINESS_INDUSTRIES: BusinessIndustryDef[] = [
  {
    id: 'building_construction',
    name: 'Building, Construction & Civil Works',
    categoryGroup: 'Construction & Real Estate',
    description: 'General building contractors, civil engineers, renovations, concrete casting, foundation and site management.',
    defaultSpecializations: [
      'Residential Duplex & Bungalow Construction',
      'Structural Renovation & Remodeling',
      'Commercial Building & Warehouse Fitout',
      'Concrete Flooring & Foundation Works',
      'Civil Drainage & Road Paving',
    ],
    sampleItems: [
      { name: 'Site Mobilization & Engineering Supervision', unit: 'job', price: 350000 },
      { name: 'Concrete Casting & Reinforcement (Per m³)', unit: 'm³', price: 85000 },
      { name: 'Blocklaying & Mortar Works (9-inch hollow)', unit: 'sqm', price: 12500 },
      { name: 'Structural Renovation & Demolition Clearance', unit: 'job', price: 650000 },
    ],
    keywords: ['building', 'construction', 'civil', 'contractor', 'renovation', 'concrete', 'foundation', 'duplex', 'masonry', 'drainage', 'blocks'],
  },
  {
    id: 'electrical_power',
    name: 'Electrical Engineering, Power & Energy',
    categoryGroup: 'Engineering & Technical',
    description: 'Domestic & industrial wiring, conduit piping, panels, transformers, backup power, generators, and solar setups.',
    defaultSpecializations: [
      'Full Conduit & Surface Electrical Wiring',
      'Solar Hybrid Inverter Systems & Lithium Storage',
      'Industrial Distribution Board & Changeover Switches',
      'Diesel Generator Servicing & Synchronization',
      'Surge Protection & Lightning Arrestor Installation',
    ],
    sampleItems: [
      { name: '10kVA Hybrid Pure Sine Inverter System', unit: 'unit', price: 950000 },
      { name: '15kWh LiFePO4 Lithium Battery Bank', unit: 'unit', price: 2100000 },
      { name: 'Whole-Building Conduit Electrical Piping & Wiring', unit: 'job', price: 850000 },
      { name: 'Automatic Transfer Switch (ATS) 100A Panel', unit: 'unit', price: 280000 },
    ],
    keywords: ['electrical', 'electrician', 'wiring', 'power', 'solar', 'inverter', 'battery', 'generator', 'conduit', 'breaker', 'transformer', 'ats'],
  },
  {
    id: 'plumbing_water',
    name: 'Plumbing, Water Systems & Boreholes',
    categoryGroup: 'Engineering & Technical',
    description: 'Residential & commercial plumbing, water treatment plants, borehole drilling, pressure pumps, and sanitary ware.',
    defaultSpecializations: [
      'Borehole Drilling & Submersible Pump Installation',
      'Whole-House Sanitary Plumbing & PPR Piping',
      'Industrial Reverse Osmosis Water Treatment',
      'Automated Water Pressure Boosters & Storage Tanks',
      'Sewerage Drainage & Bio-digester Systems',
    ],
    sampleItems: [
      { name: 'Deep Commercial Borehole Drilling & Casing', unit: 'job', price: 1450000 },
      { name: 'Submersible Water Pump 1.5HP with Control Box', unit: 'set', price: 220000 },
      { name: 'Automatic Multi-Stage Water Filtration & RO Plant', unit: 'system', price: 850000 },
      { name: 'Complete Bathroom Sanitary Piping & Fittings Installation', unit: 'room', price: 175000 },
    ],
    keywords: ['plumbing', 'plumber', 'pipe', 'borehole', 'water', 'pump', 'tank', 'drainage', 'ppr', 'sanitary', 'sewer', 'filtration'],
  },
  {
    id: 'hvac_cooling',
    name: 'HVAC, Air Conditioning & Refrigeration',
    categoryGroup: 'Engineering & Technical',
    description: 'Central air conditioning, inverter split units, VRF systems, cold rooms, and industrial ventilation.',
    defaultSpecializations: [
      'Multi-Split & Inverter Air Conditioner Installation',
      'Commercial VRF & Ducted Central AC Systems',
      'Cold Room Construction & Industrial Chiller Repairs',
      'Ductwork Fabrication & Exhaust Ventilation',
      'AC Preventive Maintenance & Gas Re-charging',
    ],
    sampleItems: [
      { name: '2.0HP Dual Inverter Split AC Supply & Pipe Run', unit: 'unit', price: 540000 },
      { name: 'Commercial Cold Room 10x10ft Compressor & Panels', unit: 'room', price: 4200000 },
      { name: 'Ductwork Fabrication & Industrial Exhaust Fan', unit: 'job', price: 920000 },
      { name: 'Chemical Coil Wash & R410A Refrigerant Refill', unit: 'unit', price: 45000 },
    ],
    keywords: ['ac', 'hvac', 'air conditioner', 'cooling', 'refrigeration', 'cold room', 'chiller', 'ventilation', 'compressor', 'duct'],
  },
  {
    id: 'it_software',
    name: 'IT Services, Software, Web & Cloud',
    categoryGroup: 'Digital & Technology',
    description: 'Custom software development, web applications, mobile apps, enterprise ERPs, cloud hosting, and IT infrastructure.',
    defaultSpecializations: [
      'Custom Web Application Development (React, Node, Cloud)',
      'Cross-Platform Mobile Apps (iOS & Android)',
      'Corporate Portal, eCommerce & Payment Gateway Integration',
      'Enterprise Network Infrastructure & Starlink Setup',
      'Cloud Hosting, Cyber Security & Managed IT Support',
    ],
    sampleItems: [
      { name: 'Custom Responsive Web Application & Database', unit: 'project', price: 1250000 },
      { name: 'Mobile App Development (React Native / Flutter)', unit: 'project', price: 2800000 },
      { name: 'Paystack / Flutterwave Payment Gateway Integration', unit: 'module', price: 180000 },
      { name: 'Office Local Area Network (Cat6/Gigabit) & Wi-Fi', unit: 'setup', price: 450000 },
    ],
    keywords: ['software', 'web', 'developer', 'app', 'code', 'it', 'cloud', 'hosting', 'network', 'cybersecurity', 'starlink', 'database', 'technology'],
  },
  {
    id: 'cctv_security',
    name: 'CCTV, Security Systems & Access Control',
    categoryGroup: 'Security & Safety',
    description: 'IP surveillance cameras, biometric access control, electric fences, automatic gates, and alarm systems.',
    defaultSpecializations: [
      '8 to 32 Channel 4K IP CCTV & Mobile Remote Viewing',
      'Electric Security Fencing & Siren Alarm Integration',
      'Biometric Time & Attendance / RFID Door Access',
      'Automated Sliding & Swing Gate Motorization',
      'Fire Alarm Detection & Smoke Sensor Installation',
    ],
    sampleItems: [
      { name: '8-Channel 4K IP CCTV Kit with 4TB Hard Drive', unit: 'kit', price: 680000 },
      { name: 'Automated Italian Gate Sliding Motor with Remotes', unit: 'system', price: 520000 },
      { name: 'Electric Fence (8-Strand High-Tensile) & Energizer', unit: 'job', price: 460000 },
      { name: 'Biometric Fingerprint & Face Recognition Door Lock', unit: 'unit', price: 195000 },
    ],
    keywords: ['cctv', 'security', 'camera', 'surveillance', 'access control', 'electric fence', 'alarm', 'gate automation', 'biometric', 'fire alarm'],
  },
  {
    id: 'interior_design',
    name: 'Interior Design, Finishing & Painting',
    categoryGroup: 'Construction & Real Estate',
    description: 'Architectural interior decoration, POP plasterboard ceilings, wall screeding, luxury painting, wallpaper, and lighting.',
    defaultSpecializations: [
      'POP False Ceiling Design & Perimeter Cove Lighting',
      'Wall Screeding, Primer & Royal Matte Painting',
      '3D Wall Panels, Acoustic Slats & Custom Wallpaper',
      'Complete Residential & Commercial Interior Fit-Out',
      'Luxury Vinyl & Wood Laminate Flooring',
    ],
    sampleItems: [
      { name: 'POP Ceiling Supply & Installation with Cornices (Per sqm)', unit: 'sqm', price: 14500 },
      { name: 'Wall Screeding & Premium Silk Emulsion (Per sqm)', unit: 'sqm', price: 5800 },
      { name: 'Architectural LED Linear & Magnetic Track Lighting Kit', unit: 'set', price: 340000 },
      { name: 'Luxury Acoustic Wood Slat Paneling (Per Panel)', unit: 'panel', price: 48000 },
    ],
    keywords: ['interior', 'painting', 'paint', 'screeding', 'pop', 'ceiling', 'decor', 'wallpaper', 'flooring', 'lighting', 'finishing'],
  },
  {
    id: 'cleaning_facility',
    name: 'Cleaning, Janitorial & Facility Management',
    categoryGroup: 'Facility & Maintenance',
    description: 'Post-construction deep cleaning, corporate janitorial, industrial fumigation, upholstery care, and facility maintenance.',
    defaultSpecializations: [
      'Post-Construction & Move-In Deep Cleaning',
      'Corporate Office Janitorial & Facility Management',
      'Industrial Pest Control, Fumigation & Disinfection',
      'Upholstery, Rug & Mattress Steam Cleaning',
      'High-Rise Window & Glass Facade Cleaning',
    ],
    sampleItems: [
      { name: 'Comprehensive Post-Construction Deep Cleaning (Duplex)', unit: 'job', price: 180000 },
      { name: 'Quarterly Industrial Pest Control & Fumigation Contract', unit: 'quarter', price: 120000 },
      { name: 'Commercial Office Janitorial Service (Monthly)', unit: 'month', price: 350000 },
      { name: 'L-Shaped Fabric Sofa Deep Steam Wash & Extraction', unit: 'set', price: 35000 },
    ],
    keywords: ['cleaning', 'cleaner', 'janitorial', 'fumigation', 'pest control', 'deep clean', 'facility', 'upholstery', 'maintenance', 'hygiene'],
  },
  {
    id: 'architecture_survey',
    name: 'Architecture, Surveying & Structural Engineering',
    categoryGroup: 'Engineering & Technical',
    description: '3D architectural designs, building plans, CAD drawings, topographical land surveying, and structural calculations.',
    defaultSpecializations: [
      'Contemporary 3D Architectural Drawings & 4K Renders',
      'Structural Engineering Calculations & Detailing',
      'Registered Cadastral Land Survey & Boundary Demarcation',
      'Mechanical & Electrical (MEP) Building Services Plans',
      'Statutory Building Approval Processing',
    ],
    sampleItems: [
      { name: 'Complete Architectural & Structural Working Drawings', unit: 'set', price: 950000 },
      { name: 'Registered Cadastral Survey Plan (With Beacon Pillars)', unit: 'plan', price: 450000 },
      { name: '3D Exterior & Interior Photorealistic Renderings', unit: 'package', price: 280000 },
      { name: 'Soil Test & Geotechnical Investigation Report', unit: 'site', price: 350000 },
    ],
    keywords: ['architecture', 'architect', 'drawing', 'survey', 'surveyor', 'structural', 'cad', '3d', 'engineering', 'building plan'],
  },
  {
    id: 'carpentry_furniture',
    name: 'Carpentry, Furniture, Woodwork & Cabinetry',
    categoryGroup: 'Crafts & Manufacturing',
    description: 'Custom kitchen cabinets, wardrobes, wooden doors, office workstations, dining sets, and architectural millwork.',
    defaultSpecializations: [
      'High-Gloss Acrylic & HDF Fitted Kitchen Cabinets',
      'Walk-in Wardrobes & Custom Bedroom Closets',
      'Solid Wood Security & Interior Flush Doors',
      'Executive Office Workstations & Conference Tables',
      'Architectural Wall Cladding & TV Console Units',
    ],
    sampleItems: [
      { name: 'Modern Fitted Kitchen Cabinets with Quartz Top (Linear ft)', unit: 'ft', price: 95000 },
      { name: 'Floor-to-Ceiling 6-Door Wardrobe with Mirrors', unit: 'unit', price: 620000 },
      { name: 'Solid Hardwood Fluted TV Console & Backlit Unit', unit: 'unit', price: 380000 },
      { name: 'Executive 6-Seater Conference Room Table', unit: 'unit', price: 450000 },
    ],
    keywords: ['carpentry', 'furniture', 'wood', 'cabinet', 'kitchen', 'wardrobe', 'door', 'console', 'woodwork', 'joinery', 'table'],
  },
  {
    id: 'metal_fabrication',
    name: 'Metal Fabrication, Welding, Roofing & Aluminium',
    categoryGroup: 'Crafts & Manufacturing',
    description: 'Steel gates, railings, burglar proofing, metal trusses, aluminium windows, glass partitions, and stone-coated roofing.',
    defaultSpecializations: [
      'Wrought Iron & Laser-Cut Architectural Security Gates',
      'Stainless Steel & Glass Balcony Railings',
      'Aluminium Casement Windows & Soundproof Glazing',
      'Stone-Coated Metal Roofing Tiles & Structural Trusses',
      'Frameless Glass Office Partitions & Shower Cubicles',
    ],
    sampleItems: [
      { name: 'Laser-Cut Architectural Steel Entrance Gate (12x7ft)', unit: 'unit', price: 850000 },
      { name: 'Stainless Steel Handrails with Toughened Glass (Per m)', unit: 'meter', price: 48000 },
      { name: 'Aluminium Casement Window (1200x1200mm Reflective Glass)', unit: 'unit', price: 72000 },
      { name: 'Frameless 10mm Toughened Glass Shower Enclosure', unit: 'set', price: 280000 },
    ],
    keywords: ['metal', 'welding', 'fabrication', 'gate', 'iron', 'steel', 'railing', 'aluminium', 'glass', 'roofing', 'truss', 'burglar'],
  },
  {
    id: 'auto_repairs',
    name: 'Automotive Repairs, Diagnostics & Fleet Maintenance',
    categoryGroup: 'Automotive & Logistics',
    description: 'Computerized engine diagnostics, mechanical repairs, auto AC servicing, brake systems, bodywork spray painting, and tracking.',
    defaultSpecializations: [
      'Computerized OBD-II Diagnostics & ECU Programming',
      'Automotive AC Compressor Replacement & Climate Repair',
      'Engine Overhaul, Transmission & Suspension Servicing',
      'Oven-Baked Automotive Spray Painting & Panel Beating',
      'Fleet GPS Tracking & Preventive Fleet Maintenance',
    ],
    sampleItems: [
      { name: 'Full Vehicle OBD-II Health Scan & Live Diagnostics', unit: 'scan', price: 25000 },
      { name: 'Major Engine Preventive Service (Synthetic Oil, Filters, Plugs)', unit: 'service', price: 110000 },
      { name: 'Car AC System Flush, Condenser & Freon Recharge', unit: 'vehicle', price: 95000 },
      { name: 'Oven-Baked Complete Body Respray (German Polyurethane)', unit: 'car', price: 420000 },
    ],
    keywords: ['auto', 'mechanic', 'car', 'vehicle', 'engine', 'diagnostics', 'transmission', 'fleet', 'tracking', 'brake', 'spray painting'],
  },
  {
    id: 'logistics_haulage',
    name: 'Logistics, Haulage, Dispatch & Relocation',
    categoryGroup: 'Automotive & Logistics',
    description: 'Interstate goods haulage, residential relocation, packaging, last-mile courier dispatch, and container clearing.',
    defaultSpecializations: [
      'Interstate Freight Haulage (5 to 30 Ton Trucks)',
      'Full Home & Office Relocation (Packing, Moving, Unpacking)',
      'Intra-City Motorbike & Van Express Dispatch Services',
      'Heavy Equipment & Plant Machinery Transport',
      'Warehouse Storage & Fulfillment Distribution',
    ],
    sampleItems: [
      { name: 'Interstate 15-Ton Truck Haulage (Lagos to Abuja)', unit: 'trip', price: 950000 },
      { name: '3-Bedroom Complete House Moving with Packing Materials', unit: 'move', price: 260000 },
      { name: 'Monthly Dedicated Motorbike Delivery Rider Contract', unit: 'month', price: 160000 },
      { name: 'Forklift Offloading & Warehouse Pallet Stacking', unit: 'day', price: 95000 },
    ],
    keywords: ['logistics', 'haulage', 'truck', 'moving', 'relocation', 'dispatch', 'delivery', 'freight', 'courier', 'cargo', 'transport'],
  },
  {
    id: 'events_catering',
    name: 'Events, Catering, Decor & Rentals',
    categoryGroup: 'Events & Hospitality',
    description: 'Corporate and wedding catering, buffet service, marquee tent rentals, luxury stage decor, lighting, and sound.',
    defaultSpecializations: [
      'Corporate Buffet & Executive Cocktail Catering',
      'Wedding Reception Catering (African & Continental Dishes)',
      'Event Hall Styling, Backdrops & Floral Installations',
      'Outdoor Canopies, Chiavari Chairs & Cooling Rentals',
      'Line Array Sound Systems, DJ & Stage Lighting Setup',
    ],
    sampleItems: [
      { name: 'Buffet Catering per Guest (Main, Salad, Protein & Dessert)', unit: 'pax', price: 8500 },
      { name: 'Luxury Wedding Reception Backdrop & Floral Arch', unit: 'event', price: 750000 },
      { name: '200 Pax Air-Conditioned Marquee Tent with Flooring', unit: 'day', price: 650000 },
      { name: 'Professional Sound System, Mics & Sound Engineer (Full Day)', unit: 'day', price: 220000 },
    ],
    keywords: ['catering', 'caterer', 'event', 'wedding', 'party', 'food', 'decor', 'tent', 'rentals', 'buffet', 'sound', 'chairs'],
  },
  {
    id: 'media_photography',
    name: 'Media, Photography, Videography & Branding',
    categoryGroup: 'Creative & Media',
    description: 'Corporate photography, wedding cinematography, 4K commercial video production, drone filming, and creative brand design.',
    defaultSpecializations: [
      'Corporate Documentary & Commercial Video Production',
      'Cinematic Wedding Photography & 4K Highlight Reels',
      'Aerial Drone Filming & Real Estate Virtual Tours',
      'Brand Identity Design (Logos, Style Guides, Pitch Decks)',
      'Social Media Content Creation & Product Photography',
    ],
    sampleItems: [
      { name: 'Corporate Promo Video (4K, Interviews, B-Roll, Color Grade)', unit: 'video', price: 650000 },
      { name: 'Full-Day Commercial Photography with Retouched Images', unit: 'day', price: 250000 },
      { name: 'Licensed 4K Aerial Drone Coverage & Pilot', unit: 'day', price: 180000 },
      { name: 'Comprehensive Corporate Brand Identity & Logo Package', unit: 'package', price: 320000 },
    ],
    keywords: ['photography', 'photographer', 'videography', 'video', 'cinematography', 'camera', 'drone', 'media', 'branding', 'production'],
  },
  {
    id: 'printing_branding',
    name: 'Printing, Signage & Corporate Merchandise',
    categoryGroup: 'Creative & Media',
    description: 'Offset printing, custom branded merchandise, large format banners, vehicle branding, and 3D LED illuminated signage.',
    defaultSpecializations: [
      '3D Acrylic & LED Illuminated Channel Letter Signage',
      'Corporate Diaries, Calendars, Folders & Annual Reports',
      'Custom Branded Polo T-Shirts, Hoodies & Corporate Wear',
      'Large Format Flex Banners, Sav Vinyl & Roll-up Banners',
      'Product Packaging Boxes, Custom Bags & Thermal Labels',
    ],
    sampleItems: [
      { name: '3D Frontlit LED Channel Letter Building Signboard', unit: 'sign', price: 650000 },
      { name: 'Executive Embossed Hardcover Corporate Diaries (100 pcs)', unit: '100 pcs', price: 420000 },
      { name: 'Premium Heavyweight Embroidered Polo T-Shirts (50 pcs)', unit: '50 pcs', price: 260000 },
      { name: 'Luxury Roll-up Banner Stands with Full-Color Print', unit: 'unit', price: 38000 },
    ],
    keywords: ['printing', 'printer', 'signage', 'branding', 'banner', 'merchandise', 't-shirt', 'billboard', 'flyer', 'packaging'],
  },
  {
    id: 'real_estate',
    name: 'Real Estate, Property Management & Valuation',
    categoryGroup: 'Construction & Real Estate',
    description: 'Commercial & residential sales, estate facility management, tenant verification, leases, and property appraisal.',
    defaultSpecializations: [
      'Commercial Office & Residential Leasing Management',
      'Land & Property Acquisition Advisory (Title Search)',
      'Estate Facility Maintenance & Service Charge Accounting',
      'Independent Property Valuation & Appraisal Reports',
      'Short-Let Apartment Operations & Hospitality Management',
    ],
    sampleItems: [
      { name: 'Annual Property Management Service Retainer (Per Unit)', unit: 'annum', price: 150000 },
      { name: 'Comprehensive Title Verification & Governor’s Consent Search', unit: 'report', price: 180000 },
      { name: 'Certified Commercial Property Valuation Report', unit: 'report', price: 350000 },
      { name: 'Turnkey Short-Let Setup & Furnishing Advisory', unit: 'property', price: 500000 },
    ],
    keywords: ['real estate', 'property', 'land', 'realtor', 'estate', 'rent', 'lease', 'apartment', 'housing', 'valuation', 'tenant'],
  },
  {
    id: 'agriculture_farming',
    name: 'Agriculture, Farming, Livestock & Agro-Allied',
    categoryGroup: 'Agriculture & Processing',
    description: 'Poultry production, commercial greenhouse setup, automated drip irrigation, fish farming, and agro-commodity supply.',
    defaultSpecializations: [
      'Automated Commercial Greenhouse Construction & Drip Systems',
      'Commercial Poultry Battery Cages & Automated Feeders',
      'Recirculating Aquaculture (Fish Farm) Tanks & Aeration',
      'Borehole Solar Pumping for Farm Irrigation',
      'Livestock Feed Formulation & Bulk Commodity Supply',
    ],
    sampleItems: [
      { name: 'Commercial Greenhouse Tunnel (8m x 24m) with Drip Kit', unit: 'greenhouse', price: 2400000 },
      { name: 'Galvanized 3-Tier Poultry Battery Cage (120 Birds)', unit: 'set', price: 220000 },
      { name: 'Solar Direct DC Borehole Pumping System for Farm', unit: 'system', price: 1350000 },
      { name: 'High-Density Polyethylene (HDPE) Fish Tarpaulin Pond (10x10ft)', unit: 'unit', price: 160000 },
    ],
    keywords: ['agriculture', 'farm', 'farming', 'poultry', 'livestock', 'fish', 'irrigation', 'greenhouse', 'crops', 'agro', 'feed'],
  },
  {
    id: 'healthcare_medical',
    name: 'Healthcare, Medical Equipment & Supplies',
    categoryGroup: 'Health & Wellness',
    description: 'Hospital equipment installation, diagnostic ultrasound & X-ray machines, clinical consumables, and lab outfitting.',
    defaultSpecializations: [
      'Diagnostic Ultrasound & Patient Monitor Calibration',
      'Complete Medical Laboratory Equipment Outfitting',
      'Hospital Bed, Surgical Lighting & Theatre Setup',
      'Medical Oxygen Plant & Central Gas Piping Systems',
      'Bulk PPE, Diagnostic Test Kits & Clinic Consumables',
    ],
    sampleItems: [
      { name: 'Color Doppler Diagnostic Ultrasound Scanner System', unit: 'system', price: 5800000 },
      { name: 'Multi-Parameter ICU Patient Monitor with SpO2/ECG', unit: 'unit', price: 750000 },
      { name: 'Hydraulic Multi-Functional Hospital Delivery & Ward Bed', unit: 'unit', price: 380000 },
      { name: 'Annual Biomedical Equipment Preventive Maintenance', unit: 'clinic', price: 450000 },
    ],
    keywords: ['medical', 'hospital', 'healthcare', 'clinic', 'laboratory', 'diagnostic', 'doctor', 'equipment', 'pharmaceutical', 'health'],
  },
  {
    id: 'legal_advisory',
    name: 'Legal Services, Corporate CAC & Compliance',
    categoryGroup: 'Professional & Business Services',
    description: 'Corporate Affairs Commission (CAC) registration, legal drafting, trademarks, commercial disputes, and governance.',
    defaultSpecializations: [
      'CAC Company Incorporation (Private Limited, NGO, Trustees)',
      'Commercial Contract Drafting & Non-Disclosure Agreements',
      'Trademark, Patent & Copyright Intellectual Property Filing',
      'Regulatory Compliance (SCUML, NAFDAC, Tax Registration)',
      'Property Conveyancing & Deed of Assignment Perfection',
    ],
    sampleItems: [
      { name: 'Full CAC Private Limited Incorporation (RC, Articles, TIN)', unit: 'package', price: 85000 },
      { name: 'Standard Commercial Service Agreement & Master SLA', unit: 'draft', price: 150000 },
      { name: 'Trademark Search & Official Class Registration Filing', unit: 'mark', price: 160000 },
      { name: 'Deed of Assignment Drafting & Legal Title Search', unit: 'conveyance', price: 250000 },
    ],
    keywords: ['legal', 'law', 'lawyer', 'cac', 'incorporation', 'trademark', 'contract', 'compliance', 'scuml', 'agreement', 'regulatory'],
  },
  {
    id: 'accounting_tax',
    name: 'Accounting, Bookkeeping, Audit & Tax Advisory',
    categoryGroup: 'Professional & Business Services',
    description: 'Financial accounting, corporate tax clearance certificates (TCC), payroll, external audits, and QuickBooks setup.',
    defaultSpecializations: [
      'Monthly Bookkeeping & Management Financial Statements',
      'FIRS Corporate Income Tax (CIT) & VAT Filing',
      'Annual Statutory Financial Audit & External Reporting',
      'Cloud Accounting Software Deployment (QuickBooks / Zoho)',
      'Tax Clearance Certificate (TCC) Acquisition',
    ],
    sampleItems: [
      { name: 'Quarterly Bookkeeping & Management Account Review', unit: 'quarter', price: 180000 },
      { name: 'Annual Company Tax Returns & FIRS CIT Clearance Filing', unit: 'year', price: 250000 },
      { name: 'Statutory Independent Financial Audit Report', unit: 'audit', price: 450000 },
      { name: 'QuickBooks Cloud Setup, Chart of Accounts & Staff Training', unit: 'package', price: 220000 },
    ],
    keywords: ['accounting', 'accountant', 'tax', 'audit', 'bookkeeping', 'firs', 'vat', 'payroll', 'finance', 'tcc', 'financial'],
  },
  {
    id: 'beauty_wellness',
    name: 'Beauty, Hair Styling, Spa & Personal Wellness',
    categoryGroup: 'Health & Wellness',
    description: 'Bridal beauty, hair extensions & styling, spa therapy, aesthetics, skincare clinic, and wellness massage.',
    defaultSpecializations: [
      'Luxury Bridal Hair & Makeup Artistry (On-Location)',
      'Full Body Massage, Deep Tissue & Aromatherapy Spa',
      'Dermatological Skincare & Facial Rejuvenation',
      'Barbershop & VIP Grooming Lounge Setup',
      'Nail Artistry, Acrylic Sculpting & Pedicure Care',
    ],
    sampleItems: [
      { name: 'Bridal Glam Makeup & Hairstyling (Bride + 2 Maidens)', unit: 'event', price: 220000 },
      { name: '60-Minute Swedish & Deep Tissue Body Massage Session', unit: 'session', price: 35000 },
      { name: 'Hydra-Facial Deep Pore Extraction & Light Therapy', unit: 'treatment', price: 48000 },
      { name: 'Monthly VIP Executive Grooming & Hair Care Subscription', unit: 'month', price: 65000 },
    ],
    keywords: ['beauty', 'hair', 'salon', 'makeup', 'spa', 'massage', 'wellness', 'skincare', 'barber', 'nails', 'cosmetics'],
  },
  {
    id: 'education_tutoring',
    name: 'Education, Private Tutoring & Vocational Training',
    categoryGroup: 'Education & Training',
    description: 'Home tutoring, Cambridge/WAEC/JAMB exam prep, STEM & coding bootcamps, school curriculum, and corporate training.',
    defaultSpecializations: [
      'Private Cambridge IGCSE, SAT & A-Level Home Tutoring',
      'Kids Coding, Robotics & STEM Holiday Bootcamps',
      'Adult Executive English, French & Language Instruction',
      'Corporate Professional Soft-Skills & Leadership Workshops',
      'Early Childhood Montessori Daycare & Learning Materials',
    ],
    sampleItems: [
      { name: 'Monthly Private Home Tutoring (3 Days/Week, 2 Hours/Day)', unit: 'month', price: 95000 },
      { name: 'Cambridge IGCSE Exam Intensive Prep (3-Month Package)', unit: 'package', price: 280000 },
      { name: 'Kids Coding & Python Fundamentals Bootcamp (4 Weeks)', unit: 'student', price: 65000 },
      { name: 'Corporate 2-Day Leadership & Customer Service Training', unit: 'day', price: 350000 },
    ],
    keywords: ['education', 'tutor', 'tutoring', 'school', 'training', 'exam', 'teacher', 'coding', 'students', 'learning', 'waec', 'igcse'],
  },
  {
    id: 'general_merchandise',
    name: 'Wholesale, Retail & General Merchandise Supplies',
    categoryGroup: 'Commerce & Trade',
    description: 'Bulk supply of FMCG, building materials, corporate gifts, electrical fittings, industrial tools, and retail inventory.',
    defaultSpecializations: [
      'Bulk Building Materials & Cement Distribution',
      'Corporate Office Stationery & Consumables Supply',
      'Industrial Safety Equipment (PPE, Helmets, Boots)',
      'Wholesale FMCG & Packaged Foodstuff Distribution',
      'High-Grade Electrical Cables & Hardware Supplies',
    ],
    sampleItems: [
      { name: 'Heavy-Duty Industrial Safety Boots & Hardhats (50 sets)', unit: '50 sets', price: 380000 },
      { name: 'Direct Factory Supply Dangote Cement (Trailer Load 900 bags)', unit: 'trailer', price: 6750000 },
      { name: 'Pure Copper 2.5mm Conduit Single Core Cables (10 Coils)', unit: '10 coils', price: 285000 },
      { name: 'Bulk Premium A4 Copy Paper Boxes (50 Cartons)', unit: '50 cartons', price: 450000 },
    ],
    keywords: ['wholesale', 'merchant', 'supplier', 'retail', 'materials', 'supplies', 'fmcg', 'goods', 'hardware', 'trade', 'procurement'],
  },
  {
    id: 'other_custom',
    name: 'Other Specialized Enterprise / General Contractor',
    categoryGroup: 'General Services',
    description: 'Multi-disciplinary contracting, custom specialty services, cross-industry procurement and service delivery.',
    defaultSpecializations: [
      'Multi-Disciplinary Project Management & Supervision',
      'General Service Contracting & Vendor Outsourcing',
      'Turnkey Commercial Procurement & Installation',
      'Technical Audit & Facility Inspection',
    ],
    sampleItems: [
      { name: 'Comprehensive Technical Service Mobilization', unit: 'job', price: 250000 },
      { name: 'Turnkey Supply, Installation & Commissioning', unit: 'contract', price: 1200000 },
      { name: 'Project Quality Assurance & Site Inspection', unit: 'visit', price: 85000 },
    ],
    keywords: ['service', 'contractor', 'general', 'enterprise', 'project', 'procurement', 'consultant'],
  },
];

export const NIGERIAN_STATES = [
  'Abia',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Edo',
  'Ekiti',
  'Enugu',
  'FCT - Abuja',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
  'Nationwide / All States',
  'International / Remote',
];

// Real-data architecture: SEED_NICHE_LEADS is empty to avoid hardcoded fake records
export const SEED_NICHE_LEADS: Partial<Lead>[] = [];

// Helper: Match leads to the business niche unless user specifically searched for something else
export function filterLeadsByBusinessNiche(
  leads: Lead[],
  business: BusinessProfile,
  searchQuery?: string,
  categoryFilter?: string
): {
  filtered: Lead[];
  isNicheMatched: boolean;
  activeNicheLabel: string;
} {
  const query = (searchQuery || '').trim().toLowerCase();
  const category = (categoryFilter || 'all').trim();

  // Find matching industry profile
  const matchedIndustry = BUSINESS_INDUSTRIES.find(
    (ind) => ind.name.toLowerCase() === (business.industry || '').toLowerCase()
  ) || BUSINESS_INDUSTRIES.find(
    (ind) => (business.industry || '').toLowerCase().includes(ind.keywords[0])
  );

  const activeNicheLabel = business.industry || business.specialization || 'General Business';

  // 1. If user explicitly entered a search query, prioritize the explicit search query!
  if (query.length > 0) {
    const matched = leads.filter((lead) => {
      const matchName = lead.customer_name.toLowerCase().includes(query);
      const matchService = lead.service_required.toLowerCase().includes(query);
      const matchLoc = lead.location.toLowerCase().includes(query);
      const matchNotes = (lead.notes || '').toLowerCase().includes(query);
      const matchCategory = lead.service_category.toLowerCase().includes(query);
      return matchName || matchService || matchLoc || matchNotes || matchCategory;
    });

    return {
      filtered: matched,
      isNicheMatched: false,
      activeNicheLabel,
    };
  }

  // 2. If user explicitly selected a category from the filter dropdown/pills (and it's not 'all')
  if (category !== 'all') {
    const matched = leads.filter((lead) => lead.service_category === category);
    return {
      filtered: matched,
      isNicheMatched: false,
      activeNicheLabel,
    };
  }

  // 3. Otherwise: Default to looking at business settings (industry + specialization)!
  // Extract keywords from business settings
  const keywords: string[] = [];
  if (matchedIndustry) {
    keywords.push(...matchedIndustry.keywords);
  }
  if (business.industry) {
    business.industry.toLowerCase().split(/[\s,&/]+/).filter((w) => w.length > 3).forEach((w) => keywords.push(w));
  }
  if (business.specialization) {
    business.specialization.toLowerCase().split(/[\s,&/]+/).filter((w) => w.length > 3).forEach((w) => keywords.push(w));
  }

  // Deduplicate keywords
  const uniqueKeywords = Array.from(new Set(keywords));

  if (uniqueKeywords.length === 0) {
    // If no specific niche defined, show all leads
    return {
      filtered: leads,
      isNicheMatched: false,
      activeNicheLabel: 'All Opportunities',
    };
  }

  // Filter leads that match business niche keywords OR service_category
  const nicheLeads = leads.filter((lead) => {
    const textToMatch = `${lead.service_required} ${lead.service_category} ${lead.notes || ''}`.toLowerCase();
    return uniqueKeywords.some((kw) => textToMatch.includes(kw));
  });

  // If we found niche-matched leads, return them! If fewer than 2, combine with top active leads so user has plenty to see
  if (nicheLeads.length > 0) {
    return {
      filtered: nicheLeads,
      isNicheMatched: true,
      activeNicheLabel,
    };
  }

  // Fallback: return all leads
  return {
    filtered: leads,
    isNicheMatched: false,
    activeNicheLabel,
  };
}

// Real-data architecture: Zero fake leads generated
export function generateDynamicLeadsForBusiness(
  business: BusinessProfile,
  customQuery?: string,
  count = 2
): Lead[] {
  return [];
}
