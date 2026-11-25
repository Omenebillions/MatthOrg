-- ============================================================================
-- MatthOrg Additive Directory Seed Migration:
-- Imports 191 Nigerian Businesses, Artisans & Professionals across
-- Lagos, Ogun (Iju/Akute), FCT Abuja, and Rivers (Port Harcourt).
--
-- EXECUTION NOTES:
--   - Safe, idempotent, non-destructive, wrapped in BEGIN / COMMIT.
--   - Run manually in Supabase SQL Editor after 20261114_universal_conversational_marketplace.sql.
--   - Preserves existing records using NOT EXISTS deduplication by google_place_id and business_name+state.
-- ============================================================================

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.directory_businesses') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.directory_businesses does not exist.';
    END IF;
    IF to_regclass('public.services') IS NULL THEN
        RAISE EXCEPTION 'Pre-check failed: public.services does not exist.';
    END IF;
END $$;


WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'YIDRIS PLUMBING SERVICE',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'YIDRIS PLUMBING SERVICE provides Plumber services at 31 Tapa St, Lagos Island, Lagos. Rated 4.8/5 across 174 customer reviews.',
    'Plumber in Lagos Island, Lagos',
    '+2349021606286',
    '+2349021606286',
    NULL,
    '31 Tapa St, Lagos Island, Lagos',
    'Lagos Island',
    'Lagos',
    'Nigeria',
    ARRAY['Lagos Island', 'Lagos', '31 Tapa St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lagos island', 'lagos', '31 tapa st', 'yidris plumbing service', 'chijbzi6dmt0oxar9ceqrahc5jk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lagos Island","owner_full_name":"YIDRIS PLUMBING SERVICE","google_place_id":"ChIJBZi6DMT0OxAR9cEQrAHc5Jk","google_rating":4.8,"google_review_count":174,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJBZi6DMT0OxAR9cEQrAHc5Jk' OR 
      (lower(trim(db.business_name)) = lower(trim('YIDRIS PLUMBING SERVICE')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('YIDRIS PLUMBING SERVICE'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'YIDRIS PLUMBING SERVICE provides Plumber services at 31 Tapa St, Lagos Island, Lagos. Rated 4.8/5 across 174 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Lagos Island', 'Lagos', '31 Tapa St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lagos island', 'lagos', '31 tapa st', 'yidris plumbing service', 'chijbzi6dmt0oxar9ceqrahc5jk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'G Flow Plumbing Service',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'G Flow Plumbing Service provides Plumber services at 79 Mobolaji Bank Anthony Way, Opebi, Ikeja, Lagos. Rated 4.8/5 across 24 customer reviews.',
    'Plumber in Ikeja, Lagos',
    '+2348125956440',
    '+2348125956440',
    NULL,
    '79 Mobolaji Bank Anthony Way, Opebi, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '79 Mobolaji Bank Anthony Way', 'Opebi']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ikeja', 'lagos', '79 mobolaji bank anthony way', 'opebi', 'g flow plumbing service', 'chija8e66m-joxarn41gxsj_b8u']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"G Flow Plumbing Service","google_place_id":"ChIJA8E66m-jOxARN41gxSJ_b8U","google_rating":4.8,"google_review_count":24,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJA8E66m-jOxARN41gxSJ_b8U' OR 
      (lower(trim(db.business_name)) = lower(trim('G Flow Plumbing Service')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('G Flow Plumbing Service'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'G Flow Plumbing Service provides Plumber services at 79 Mobolaji Bank Anthony Way, Opebi, Ikeja, Lagos. Rated 4.8/5 across 24 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '79 Mobolaji Bank Anthony Way', 'Opebi']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ikeja', 'lagos', '79 mobolaji bank anthony way', 'opebi', 'g flow plumbing service', 'chija8e66m-joxarn41gxsj_b8u']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Jebe plumbing tech',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Jebe plumbing tech provides Plumber services at 8 Freeman St, Lagos Island, Lagos. Rated 4.9/5 across 20 customer reviews.',
    'Plumber in Lagos Island, Lagos',
    '+2348149442345',
    '+2348149442345',
    NULL,
    '8 Freeman St, Lagos Island, Lagos',
    'Lagos Island',
    'Lagos',
    'Nigeria',
    ARRAY['Lagos Island', 'Lagos', '8 Freeman St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lagos island', 'lagos', '8 freeman st', 'jebe plumbing tech', 'chijyw3esgqloxarskd6lbe4hc0']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lagos Island","owner_full_name":"Jebe plumbing tech","google_place_id":"ChIJYw3ESgqLOxARsKd6Lbe4Hc0","google_rating":4.9,"google_review_count":20,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJYw3ESgqLOxARsKd6Lbe4Hc0' OR 
      (lower(trim(db.business_name)) = lower(trim('Jebe plumbing tech')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Jebe plumbing tech'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Jebe plumbing tech provides Plumber services at 8 Freeman St, Lagos Island, Lagos. Rated 4.9/5 across 20 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Lagos Island', 'Lagos', '8 Freeman St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lagos island', 'lagos', '8 freeman st', 'jebe plumbing tech', 'chijyw3esgqloxarskd6lbe4hc0']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Oga Plumber',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Oga Plumber provides Plumber services at 9A Alh. Adewunmi Fowewe St, Lekki, Lagos. Rated 4.8/5 across 73 customer reviews.',
    'Plumber in Lekki, Lagos',
    '+2347030598852',
    '+2347030598852',
    NULL,
    '9A Alh. Adewunmi Fowewe St, Lekki, Lagos',
    'Lekki',
    'Lagos',
    'Nigeria',
    ARRAY['Lekki', 'Lagos', '9A Alh. Adewunmi Fowewe St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lekki', 'lagos', '9a alh. adewunmi fowewe st', 'oga plumber', 'chijbfzudet3oxart5uqynd0eew']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lekki","owner_full_name":"Oga Plumber","google_place_id":"ChIJBfzuDET3OxART5uQyND0eEw","google_rating":4.8,"google_review_count":73,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJBfzuDET3OxART5uQyND0eEw' OR 
      (lower(trim(db.business_name)) = lower(trim('Oga Plumber')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Oga Plumber'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Oga Plumber provides Plumber services at 9A Alh. Adewunmi Fowewe St, Lekki, Lagos. Rated 4.8/5 across 73 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Lekki', 'Lagos', '9A Alh. Adewunmi Fowewe St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'lekki', 'lagos', '9a alh. adewunmi fowewe st', 'oga plumber', 'chijbfzudet3oxart5uqynd0eew']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'PLUMBERS WORLD',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'PLUMBERS WORLD provides Plumber services at 63 Paul Ave, Yakoyo Rd, Ojodu, Lagos. Rated 4.7/5 across 7 customer reviews.',
    'Plumber in Ojodu, Lagos',
    '+2348169133000',
    '+2348169133000',
    NULL,
    '63 Paul Ave, Yakoyo Rd, Ojodu, Lagos',
    'Ojodu',
    'Lagos',
    'Nigeria',
    ARRAY['Ojodu', 'Lagos', '63 Paul Ave', 'Yakoyo Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ojodu', 'lagos', '63 paul ave', 'yakoyo rd', 'plumbers world', 'chijz1zq4uqtoxaraudnj2dc7oa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojodu","owner_full_name":"PLUMBERS WORLD","google_place_id":"ChIJz1ZQ4uqTOxARAudNJ2dC7OA","google_rating":4.7,"google_review_count":7,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJz1ZQ4uqTOxARAudNJ2dC7OA' OR 
      (lower(trim(db.business_name)) = lower(trim('PLUMBERS WORLD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('PLUMBERS WORLD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'PLUMBERS WORLD provides Plumber services at 63 Paul Ave, Yakoyo Rd, Ojodu, Lagos. Rated 4.7/5 across 7 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Ojodu', 'Lagos', '63 Paul Ave', 'Yakoyo Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ojodu', 'lagos', '63 paul ave', 'yakoyo rd', 'plumbers world', 'chijz1zq4uqtoxaraudnj2dc7oa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Opeyemiade plumbing services',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Opeyemiade plumbing services provides Plumber services at 5 Fawole St, Orile Agege, Lagos. Rated 4.6/5 across 40 customer reviews.',
    'Plumber in Orile Agege, Lagos',
    '+2348161417426',
    '+2348161417426',
    NULL,
    '5 Fawole St, Orile Agege, Lagos',
    'Orile Agege',
    'Lagos',
    'Nigeria',
    ARRAY['Orile Agege', 'Lagos', '5 Fawole St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'orile agege', 'lagos', '5 fawole st', 'opeyemiade plumbing services', 'chijrarybs6roxar4r7bagmfdk8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Orile Agege","owner_full_name":"Opeyemiade plumbing services","google_place_id":"ChIJraryBs6ROxAR4R7bAGMfDK8","google_rating":4.6,"google_review_count":40,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJraryBs6ROxAR4R7bAGMfDK8' OR 
      (lower(trim(db.business_name)) = lower(trim('Opeyemiade plumbing services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Opeyemiade plumbing services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Opeyemiade plumbing services provides Plumber services at 5 Fawole St, Orile Agege, Lagos. Rated 4.6/5 across 40 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Orile Agege', 'Lagos', '5 Fawole St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'orile agege', 'lagos', '5 fawole st', 'opeyemiade plumbing services', 'chijrarybs6roxar4r7bagmfdk8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Potamoi Waters Limited',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Potamoi Waters Limited provides Plumber services at 5 Oba Dosumu St, Ikeja GRA, Lagos. Rated 4.8/5 across 13 customer reviews.',
    'Plumber in Ikeja GRA, Lagos',
    '+2349129430141',
    '+2349129430141',
    NULL,
    '5 Oba Dosumu St, Ikeja GRA, Lagos',
    'Ikeja GRA',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja GRA', 'Lagos', '5 Oba Dosumu St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ikeja gra', 'lagos', '5 oba dosumu st', 'potamoi waters limited', 'chijjatggs-soxar7xw7weksjom']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja GRA","owner_full_name":"Potamoi Waters Limited","google_place_id":"ChIJjatGgS-SOxAR7xw7WeKsjoM","google_rating":4.8,"google_review_count":13,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJjatGgS-SOxAR7xw7WeKsjoM' OR 
      (lower(trim(db.business_name)) = lower(trim('Potamoi Waters Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Potamoi Waters Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Potamoi Waters Limited provides Plumber services at 5 Oba Dosumu St, Ikeja GRA, Lagos. Rated 4.8/5 across 13 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja GRA', 'Lagos', '5 Oba Dosumu St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ikeja gra', 'lagos', '5 oba dosumu st', 'potamoi waters limited', 'chijjatggs-soxar7xw7weksjom']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Pipesnco plumbing',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Pipesnco plumbing provides Plumber services at Hub Plaza, 62 Addo Rd, Ajah, Lagos. Rated 4.8/5 across 13 customer reviews.',
    'Plumber in Ajah, Lagos',
    '+2348118194324',
    '+2348118194324',
    NULL,
    'Hub Plaza, 62 Addo Rd, Ajah, Lagos',
    'Ajah',
    'Lagos',
    'Nigeria',
    ARRAY['Ajah', 'Lagos', 'Hub Plaza', '62 Addo Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ajah', 'lagos', 'hub plaza', '62 addo rd', 'pipesnco plumbing', 'chijucfwteknoxarnr0v5hwh7tk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ajah","owner_full_name":"Pipesnco plumbing","google_place_id":"ChIJUcFWTeKNOxARnR0V5hwH7tk","google_rating":4.8,"google_review_count":13,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJUcFWTeKNOxARnR0V5hwH7tk' OR 
      (lower(trim(db.business_name)) = lower(trim('Pipesnco plumbing')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Pipesnco plumbing'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Pipesnco plumbing provides Plumber services at Hub Plaza, 62 Addo Rd, Ajah, Lagos. Rated 4.8/5 across 13 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Ajah', 'Lagos', 'Hub Plaza', '62 Addo Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'ajah', 'lagos', 'hub plaza', '62 addo rd', 'pipesnco plumbing', 'chijucfwteknoxarnr0v5hwh7tk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Adedare Nigeria Enterprises',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Adedare Nigeria Enterprises provides Plumber services at 4 Oremerin St, Akowonjo, Lagos. Rated 4.7/5 across 22 customer reviews.',
    'Plumber in Akowonjo, Lagos',
    '+2348033713584',
    '+2348033713584',
    NULL,
    '4 Oremerin St, Akowonjo, Lagos',
    'Akowonjo',
    'Lagos',
    'Nigeria',
    ARRAY['Akowonjo', 'Lagos', '4 Oremerin St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'akowonjo', 'lagos', '4 oremerin st', 'adedare nigeria enterprises', 'chijt3snwuwroxarsk4bepd6vla']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Akowonjo","owner_full_name":"Adedare Nigeria Enterprises","google_place_id":"ChIJt3SnwUWROxARsk4BePd6VlA","google_rating":4.7,"google_review_count":22,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJt3SnwUWROxARsk4BePd6VlA' OR 
      (lower(trim(db.business_name)) = lower(trim('Adedare Nigeria Enterprises')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Adedare Nigeria Enterprises'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Adedare Nigeria Enterprises provides Plumber services at 4 Oremerin St, Akowonjo, Lagos. Rated 4.7/5 across 22 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Akowonjo', 'Lagos', '4 Oremerin St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'akowonjo', 'lagos', '4 oremerin st', 'adedare nigeria enterprises', 'chijt3snwuwroxarsk4bepd6vla']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'BABACUS MECHANICAL SERVICES',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber · AC & HVAC Technician',
    'BABACUS MECHANICAL SERVICES provides Plumber · AC & HVAC Technician services at 2d Abiola Cl, Shonibare Est, Maryland, Lagos. Rated 5.0/5 across 7 customer reviews. Note: plumbing and AC.',
    'Plumber · AC & HVAC Technician in Maryland, Lagos',
    '+2349061231305',
    '+2349061231305',
    NULL,
    '2d Abiola Cl, Shonibare Est, Maryland, Lagos',
    'Maryland',
    'Lagos',
    'Nigeria',
    ARRAY['Maryland', 'Lagos', '2d Abiola Cl', 'Shonibare Est']::TEXT[],
    ARRAY['Plumber', 'AC & HVAC Technician', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'ac & hvac technician', 'pipefitting & leak repair', 'sanitary installations', 'ac installation & maintenance', 'hvac services', 'maryland', 'lagos', '2d abiola cl', 'shonibare est', 'babacus mechanical services', 'chijo_72zgctoxarjwvfpnnldnc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Maryland","owner_full_name":"BABACUS MECHANICAL SERVICES","google_place_id":"ChIJo_72ZgCTOxARJwvFPnNlDNc","google_rating":5,"google_review_count":7,"notes":"plumbing and AC","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJo_72ZgCTOxARJwvFPnNlDNc' OR 
      (lower(trim(db.business_name)) = lower(trim('BABACUS MECHANICAL SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('BABACUS MECHANICAL SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'BABACUS MECHANICAL SERVICES provides Plumber · AC & HVAC Technician services at 2d Abiola Cl, Shonibare Est, Maryland, Lagos. Rated 5.0/5 across 7 customer reviews. Note: plumbing and AC.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations', 'AC Installation & Maintenance', 'HVAC Services']::TEXT[],
  'Request a Quote',
  ARRAY['Maryland', 'Lagos', '2d Abiola Cl', 'Shonibare Est']::TEXT[],
  ARRAY['plumber', 'ac & hvac technician', 'pipefitting & leak repair', 'sanitary installations', 'ac installation & maintenance', 'hvac services', 'maryland', 'lagos', '2d abiola cl', 'shonibare est', 'babacus mechanical services', 'chijo_72zgctoxarjwvfpnnldnc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'M.A Electrical Services',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'M.A Electrical Services provides Electrician services at 27 Eric More St, Wemabod Estate, Ikeja, Lagos. Rated 4.9/5 across 15 customer reviews.',
    'Electrician in Ikeja, Lagos',
    '+2347052821455',
    '+2347052821455',
    NULL,
    '27 Eric More St, Wemabod Estate, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '27 Eric More St', 'Wemabod Estate']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '27 eric more st', 'wemabod estate', 'm.a electrical services', 'chij30p91ycfoxardjrupulimia']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"M.A Electrical Services","google_place_id":"ChIJ30p91YCFOxARDJRuPULImIA","google_rating":4.9,"google_review_count":15,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ30p91YCFOxARDJRuPULImIA' OR 
      (lower(trim(db.business_name)) = lower(trim('M.A Electrical Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('M.A Electrical Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'M.A Electrical Services provides Electrician services at 27 Eric More St, Wemabod Estate, Ikeja, Lagos. Rated 4.9/5 across 15 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '27 Eric More St', 'Wemabod Estate']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '27 eric more st', 'wemabod estate', 'm.a electrical services', 'chij30p91ycfoxardjrupulimia']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Jaywise Electrical Services',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Jaywise Electrical Services provides Electrician services at 43 Odozi St, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: Google lists state as Ogun; Ojodu is in Lagos.',
    'Electrician in Ojodu, Lagos',
    '+2348134995192',
    '+2348134995192',
    NULL,
    '43 Odozi St, Ojodu, Lagos',
    'Ojodu',
    'Lagos',
    'Nigeria',
    ARRAY['Ojodu', 'Lagos', '43 Odozi St']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ojodu', 'lagos', '43 odozi st', 'jaywise electrical services', 'chijmxscplp1oxari3ozuwgekxu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojodu","owner_full_name":"Jaywise Electrical Services","google_place_id":"ChIJMXscplP1OxARI3ozuWGEkXU","google_rating":5,"google_review_count":1,"notes":"Google lists state as Ogun; Ojodu is in Lagos","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJMXscplP1OxARI3ozuWGEkXU' OR 
      (lower(trim(db.business_name)) = lower(trim('Jaywise Electrical Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Jaywise Electrical Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Jaywise Electrical Services provides Electrician services at 43 Odozi St, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: Google lists state as Ogun; Ojodu is in Lagos.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ojodu', 'Lagos', '43 Odozi St']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ojodu', 'lagos', '43 odozi st', 'jaywise electrical services', 'chijmxscplp1oxari3ozuwgekxu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'BOLA ELECTRICAL AND SOLAR ENGINEERING',
    'business',
    'Electrical & Power Systems',
    'Electrician · Solar installer',
    'BOLA ELECTRICAL AND SOLAR ENGINEERING provides Electrician · Solar installer services at 16 Kings Ave, Ereke Ave, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: electrical and solar.',
    'Electrician · Solar installer in Ojodu, Lagos',
    '+2347061531289',
    '+2347061531289',
    NULL,
    '16 Kings Ave, Ereke Ave, Ojodu, Lagos',
    'Ojodu',
    'Lagos',
    'Nigeria',
    ARRAY['Ojodu', 'Lagos', '16 Kings Ave', 'Ereke Ave']::TEXT[],
    ARRAY['Electrician', 'Solar installer', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'ojodu', 'lagos', '16 kings ave', 'ereke ave', 'bola electrical and solar engineering', 'chij5r3ruoetoxarxyygvwjqsqa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojodu","owner_full_name":"BOLA ELECTRICAL AND SOLAR ENGINEERING","google_place_id":"ChIJ5R3ruoeTOxARXYyGVwJQSQA","google_rating":5,"google_review_count":1,"notes":"electrical and solar","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ5R3ruoeTOxARXYyGVwJQSQA' OR 
      (lower(trim(db.business_name)) = lower(trim('BOLA ELECTRICAL AND SOLAR ENGINEERING')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('BOLA ELECTRICAL AND SOLAR ENGINEERING'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'BOLA ELECTRICAL AND SOLAR ENGINEERING provides Electrician · Solar installer services at 16 Kings Ave, Ereke Ave, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: electrical and solar.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance', 'Solar Inverter Installation']::TEXT[],
  'Request a Quote',
  ARRAY['Ojodu', 'Lagos', '16 Kings Ave', 'Ereke Ave']::TEXT[],
  ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'ojodu', 'lagos', '16 kings ave', 'ereke ave', 'bola electrical and solar engineering', 'chij5r3ruoetoxarxyygvwjqsqa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Babstech Engineering Services',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'Babstech Engineering Services provides Electrician services at Seriki-Aro Ave, Ikeja, Lagos. Rated 4.9/5 across 10 customer reviews.',
    'Electrician in Ikeja, Lagos',
    '+2348122326063',
    '+2348122326063',
    NULL,
    'Seriki-Aro Ave, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', 'Seriki-Aro Ave']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', 'seriki-aro ave', 'babstech engineering services', 'chij65de8pytoxartx3fhc9e1na']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Babstech Engineering Services","google_place_id":"ChIJ65dE8pyTOxARTX3fHc9e1NA","google_rating":4.9,"google_review_count":10,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ65dE8pyTOxARTX3fHc9e1NA' OR 
      (lower(trim(db.business_name)) = lower(trim('Babstech Engineering Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Babstech Engineering Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Babstech Engineering Services provides Electrician services at Seriki-Aro Ave, Ikeja, Lagos. Rated 4.9/5 across 10 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', 'Seriki-Aro Ave']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', 'seriki-aro ave', 'babstech engineering services', 'chij65de8pytoxartx3fhc9e1na']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Corustar Technological Services',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Corustar Technological Services provides Electrician services at 5 Yaya Abatan St, Ogba, Ikeja, Lagos. Rated 5.0/5 across 22 customer reviews.',
    'Electrician in Ikeja, Lagos',
    '+2347057399297',
    '+2347057399297',
    NULL,
    '5 Yaya Abatan St, Ogba, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '5 Yaya Abatan St', 'Ogba']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '5 yaya abatan st', 'ogba', 'corustar technological services', 'chijjxrkj_gtoxaru4fp-2punmc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Corustar Technological Services","google_place_id":"ChIJJxRkJ_GTOxARu4FP-2PUNmc","google_rating":5,"google_review_count":22,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJJxRkJ_GTOxARu4FP-2PUNmc' OR 
      (lower(trim(db.business_name)) = lower(trim('Corustar Technological Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Corustar Technological Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Corustar Technological Services provides Electrician services at 5 Yaya Abatan St, Ogba, Ikeja, Lagos. Rated 5.0/5 across 22 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '5 Yaya Abatan St', 'Ogba']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '5 yaya abatan st', 'ogba', 'corustar technological services', 'chijjxrkj_gtoxaru4fp-2punmc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JB ONEIRO NIGERIA LIMITED',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'JB ONEIRO NIGERIA LIMITED provides Electrician services at 49 Ogunkoya St, Ikosi Ketu, Lagos.',
    'Electrician in Ikosi Ketu, Lagos',
    '+2348095286671',
    '+2348095286671',
    NULL,
    '49 Ogunkoya St, Ikosi Ketu, Lagos',
    'Ikosi Ketu',
    'Lagos',
    'Nigeria',
    ARRAY['Ikosi Ketu', 'Lagos', '49 Ogunkoya St']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikosi ketu', 'lagos', '49 ogunkoya st', 'jb oneiro nigeria limited', 'chijcdlsm7utoxarfe_x7ttfwi4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikosi Ketu","owner_full_name":"JB ONEIRO NIGERIA LIMITED","google_place_id":"ChIJcdlSm7uTOxARFe_x7TTfWi4","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJcdlSm7uTOxARFe_x7TTfWi4' OR 
      (lower(trim(db.business_name)) = lower(trim('JB ONEIRO NIGERIA LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JB ONEIRO NIGERIA LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'JB ONEIRO NIGERIA LIMITED provides Electrician services at 49 Ogunkoya St, Ikosi Ketu, Lagos.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikosi Ketu', 'Lagos', '49 Ogunkoya St']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikosi ketu', 'lagos', '49 ogunkoya st', 'jb oneiro nigeria limited', 'chijcdlsm7utoxarfe_x7ttfwi4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Patrose Advanced Engineering Ltd',
    'business',
    'Electrical & Power Systems',
    'Electrician · AC & HVAC Technician',
    'Patrose Advanced Engineering Ltd provides Electrician · AC & HVAC Technician services at 19 Irewole St, Opebi, Ikeja, Lagos. Rated 5.0/5 across 47 customer reviews. Note: engineering firm: power, HVAC, security.',
    'Electrician · AC & HVAC Technician in Ikeja, Lagos',
    '+2347038347655',
    '+2347038347655',
    NULL,
    '19 Irewole St, Opebi, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '19 Irewole St', 'Opebi']::TEXT[],
    ARRAY['Electrician', 'AC & HVAC Technician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'ac & hvac technician', 'electrical wiring & troubleshooting', 'power maintenance', 'ac installation & maintenance', 'hvac services', 'cctv & smart home systems', 'ikeja', 'lagos', '19 irewole st', 'opebi', 'patrose advanced engineering ltd', 'chij5rxw4g2toxarqjtqytbinpo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Patrose Advanced Engineering Ltd","google_place_id":"ChIJ5RxW4G2TOxARQJTqYTBiNpo","google_rating":5,"google_review_count":47,"notes":"engineering firm: power, HVAC, security","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ5RxW4G2TOxARQJTqYTBiNpo' OR 
      (lower(trim(db.business_name)) = lower(trim('Patrose Advanced Engineering Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Patrose Advanced Engineering Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Patrose Advanced Engineering Ltd provides Electrician · AC & HVAC Technician services at 19 Irewole St, Opebi, Ikeja, Lagos. Rated 5.0/5 across 47 customer reviews. Note: engineering firm: power, HVAC, security.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance', 'AC Installation & Maintenance', 'HVAC Services', 'CCTV & Smart Home Systems']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '19 Irewole St', 'Opebi']::TEXT[],
  ARRAY['electrician', 'ac & hvac technician', 'electrical wiring & troubleshooting', 'power maintenance', 'ac installation & maintenance', 'hvac services', 'cctv & smart home systems', 'ikeja', 'lagos', '19 irewole st', 'opebi', 'patrose advanced engineering ltd', 'chij5rxw4g2toxarqjtqytbinpo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Kobeissi Electrical & Mechanical Engineering Ltd',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'Kobeissi Electrical & Mechanical Engineering Ltd provides Electrician services at Plot 3 Billing Way, Allen, Ikeja, Lagos. Rated 5.0/5 across 2 customer reviews.',
    'Electrician in Ikeja, Lagos',
    '+2347015040654',
    '+2347015040654',
    NULL,
    'Plot 3 Billing Way, Allen, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', 'Plot 3 Billing Way', 'Allen']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', 'plot 3 billing way', 'allen', 'kobeissi electrical & mechanical engineering ltd', 'chijaqaaadgsoxar14nuahpg4ik']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Kobeissi Electrical & Mechanical Engineering Ltd","google_place_id":"ChIJAQAAADGSOxAR14nUAHpg4ik","google_rating":5,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJAQAAADGSOxAR14nUAHpg4ik' OR 
      (lower(trim(db.business_name)) = lower(trim('Kobeissi Electrical & Mechanical Engineering Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Kobeissi Electrical & Mechanical Engineering Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Kobeissi Electrical & Mechanical Engineering Ltd provides Electrician services at Plot 3 Billing Way, Allen, Ikeja, Lagos. Rated 5.0/5 across 2 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', 'Plot 3 Billing Way', 'Allen']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', 'plot 3 billing way', 'allen', 'kobeissi electrical & mechanical engineering ltd', 'chijaqaaadgsoxar14nuahpg4ik']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JUHARES ASHIRLES ELECTRIC NIGERIA Ltd',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'JUHARES ASHIRLES ELECTRIC NIGERIA Ltd provides Electrician services at 23 Ogundana St, Allen, Ikeja, Lagos.',
    'Electrician in Ikeja, Lagos',
    '+2348080293309',
    '+2348080293309',
    NULL,
    '23 Ogundana St, Allen, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '23 Ogundana St', 'Allen']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '23 ogundana st', 'allen', 'juhares ashirles electric nigeria ltd', 'chij26-id46toxaruxxdoxy9lb4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"JUHARES ASHIRLES ELECTRIC NIGERIA Ltd","google_place_id":"ChIJ26-ID46TOxARuxXDOxy9LB4","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ26-ID46TOxARuxXDOxy9LB4' OR 
      (lower(trim(db.business_name)) = lower(trim('JUHARES ASHIRLES ELECTRIC NIGERIA Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JUHARES ASHIRLES ELECTRIC NIGERIA Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'JUHARES ASHIRLES ELECTRIC NIGERIA Ltd provides Electrician services at 23 Ogundana St, Allen, Ikeja, Lagos.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '23 Ogundana St', 'Allen']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'ikeja', 'lagos', '23 ogundana st', 'allen', 'juhares ashirles electric nigeria ltd', 'chij26-id46toxaruxxdoxy9lb4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Fajmal Electrical And Solar Installation Expert Services',
    'artisan',
    'Electrician & Solar Contracting',
    'Electrician · Solar installer',
    'Fajmal Electrical And Solar Installation Expert Services provides Electrician · Solar installer services at 19 Ikosi Rd, Isheri, Ikeja, Lagos. Rated 5.0/5 across 48 customer reviews.',
    'Electrician · Solar installer in Ikeja, Lagos',
    '+2347036043069',
    '+2347036043069',
    NULL,
    '19 Ikosi Rd, Isheri, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '19 Ikosi Rd', 'Isheri']::TEXT[],
    ARRAY['Electrician', 'Solar installer', 'Electrician & Solar Contracting']::TEXT[],
    ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'ikeja', 'lagos', '19 ikosi rd', 'isheri', 'fajmal electrical and solar installation expert services', 'chijnqvhcllbdqyr0szoc9432mu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Fajmal Electrical And Solar Installation Expert Services","google_place_id":"ChIJNQVHCLlbdQYR0SzOc9432MU","google_rating":5,"google_review_count":48,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJNQVHCLlbdQYR0SzOc9432MU' OR 
      (lower(trim(db.business_name)) = lower(trim('Fajmal Electrical And Solar Installation Expert Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Fajmal Electrical And Solar Installation Expert Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrician & Solar Contracting',
  'Fajmal Electrical And Solar Installation Expert Services provides Electrician · Solar installer services at 19 Ikosi Rd, Isheri, Ikeja, Lagos. Rated 5.0/5 across 48 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance', 'Solar installer', 'Solar Installer', 'Solar Inverter Installation']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '19 Ikosi Rd', 'Isheri']::TEXT[],
  ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'ikeja', 'lagos', '19 ikosi rd', 'isheri', 'fajmal electrical and solar installation expert services', 'chijnqvhcllbdqyr0szoc9432mu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'M. Ade Furniture and Carpentry Works',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'M. Ade Furniture and Carpentry Works provides Carpenter services at 43 Old Ota Rd, Abule Egba, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Abule Egba, Lagos',
    '+2348155843142',
    '+2348155843142',
    NULL,
    '43 Old Ota Rd, Abule Egba, Lagos',
    'Abule Egba',
    'Lagos',
    'Nigeria',
    ARRAY['Abule Egba', 'Lagos', '43 Old Ota Rd']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'abule egba', 'lagos', '43 old ota rd', 'm. ade furniture and carpentry works', 'chijpzfxkc6qoxarwrogtfntidw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Abule Egba","owner_full_name":"M. Ade Furniture and Carpentry Works","google_place_id":"ChIJPzfXKc6QOxARWRoGtFNTidw","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJPzfXKc6QOxARWRoGtFNTidw' OR 
      (lower(trim(db.business_name)) = lower(trim('M. Ade Furniture and Carpentry Works')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('M. Ade Furniture and Carpentry Works'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'M. Ade Furniture and Carpentry Works provides Carpenter services at 43 Old Ota Rd, Abule Egba, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Abule Egba', 'Lagos', '43 Old Ota Rd']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'abule egba', 'lagos', '43 old ota rd', 'm. ade furniture and carpentry works', 'chijpzfxkc6qoxarwrogtfntidw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'IDEALINNO FURNITURE AND CARPENTRY WORK LTD',
    'business',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'IDEALINNO FURNITURE AND CARPENTRY WORK LTD provides Carpenter services at 6 Ajibode St, Olowora, Magodo/Isheri, Lagos. Rated 4.9/5 across 59 customer reviews.',
    'Carpenter in Magodo/Isheri, Lagos',
    '+2348029578691',
    '+2348029578691',
    NULL,
    '6 Ajibode St, Olowora, Magodo/Isheri, Lagos',
    'Magodo/Isheri',
    'Lagos',
    'Nigeria',
    ARRAY['Magodo/Isheri', 'Lagos', '6 Ajibode St', 'Olowora']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'magodo/isheri', 'lagos', '6 ajibode st', 'olowora', 'idealinno furniture and carpentry work ltd', 'chijw8dardqtoxaryigojxxpfjq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Magodo/Isheri","owner_full_name":"IDEALINNO FURNITURE AND CARPENTRY WORK LTD","google_place_id":"ChIJw8dARDqTOxARYiGojxxPFjQ","google_rating":4.9,"google_review_count":59,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJw8dARDqTOxARYiGojxxPFjQ' OR 
      (lower(trim(db.business_name)) = lower(trim('IDEALINNO FURNITURE AND CARPENTRY WORK LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('IDEALINNO FURNITURE AND CARPENTRY WORK LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'IDEALINNO FURNITURE AND CARPENTRY WORK LTD provides Carpenter services at 6 Ajibode St, Olowora, Magodo/Isheri, Lagos. Rated 4.9/5 across 59 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Magodo/Isheri', 'Lagos', '6 Ajibode St', 'Olowora']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'magodo/isheri', 'lagos', '6 ajibode st', 'olowora', 'idealinno furniture and carpentry work ltd', 'chijw8dardqtoxaryigojxxpfjq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Yomi Carpenters',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Yomi Carpenters provides Carpenter services at 7/8 Mafoluku St, Oshodi, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Oshodi, Lagos',
    '+2348074283692',
    '+2348074283692',
    NULL,
    '7/8 Mafoluku St, Oshodi, Lagos',
    'Oshodi',
    'Lagos',
    'Nigeria',
    ARRAY['Oshodi', 'Lagos', '7/8 Mafoluku St']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'oshodi', 'lagos', '7/8 mafoluku st', 'yomi carpenters', 'chijdz4ejwyooxarb5btxgurqts']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Oshodi","owner_full_name":"Yomi Carpenters","google_place_id":"ChIJdz4EJwyOOxARb5BTxguRQTs","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJdz4EJwyOOxARb5BTxguRQTs' OR 
      (lower(trim(db.business_name)) = lower(trim('Yomi Carpenters')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Yomi Carpenters'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Yomi Carpenters provides Carpenter services at 7/8 Mafoluku St, Oshodi, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Oshodi', 'Lagos', '7/8 Mafoluku St']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'oshodi', 'lagos', '7/8 mafoluku st', 'yomi carpenters', 'chijdz4ejwyooxarb5btxgurqts']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Bros D E-Carpenter',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Bros D E-Carpenter provides Carpenter services at 103 Dopemu Rd, Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Agege, Lagos',
    '+2348051537995',
    '+2348051537995',
    NULL,
    '103 Dopemu Rd, Agege, Lagos',
    'Agege',
    'Lagos',
    'Nigeria',
    ARRAY['Agege', 'Lagos', '103 Dopemu Rd']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'agege', 'lagos', '103 dopemu rd', 'bros d e-carpenter', 'chijeux2bv-roxarik0clhbh_iq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Agege","owner_full_name":"Bros D E-Carpenter","google_place_id":"ChIJeUX2bV-ROxARIK0ClhBh_iQ","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJeUX2bV-ROxARIK0ClhBh_iQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Bros D E-Carpenter')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Bros D E-Carpenter'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Bros D E-Carpenter provides Carpenter services at 103 Dopemu Rd, Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Agege', 'Lagos', '103 Dopemu Rd']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'agege', 'lagos', '103 dopemu rd', 'bros d e-carpenter', 'chijeux2bv-roxarik0clhbh_iq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Alraz Carpentery And Upholstery Work',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Alraz Carpentery And Upholstery Work provides Carpenter services at 305 Iju Ishaga Rd, Ifako Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Ifako Agege, Lagos',
    '+2348052065638',
    '+2348052065638',
    NULL,
    '305 Iju Ishaga Rd, Ifako Agege, Lagos',
    'Ifako Agege',
    'Lagos',
    'Nigeria',
    ARRAY['Ifako Agege', 'Lagos', '305 Iju Ishaga Rd']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ifako agege', 'lagos', '305 iju ishaga rd', 'alraz carpentery and upholstery work', 'chijfyfekkowoxaruotjf5r7zgk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ifako Agege","owner_full_name":"Alraz Carpentery And Upholstery Work","google_place_id":"ChIJfyFEKKOWOxARuoTjF5R7ZGk","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJfyFEKKOWOxARuoTjF5R7ZGk' OR 
      (lower(trim(db.business_name)) = lower(trim('Alraz Carpentery And Upholstery Work')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Alraz Carpentery And Upholstery Work'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Alraz Carpentery And Upholstery Work provides Carpenter services at 305 Iju Ishaga Rd, Ifako Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Ifako Agege', 'Lagos', '305 Iju Ishaga Rd']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ifako agege', 'lagos', '305 iju ishaga rd', 'alraz carpentery and upholstery work', 'chijfyfekkowoxaruotjf5r7zgk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Dada Carpenter Work Shop',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Dada Carpenter Work Shop provides Carpenter services at Plot 10 Oluwa Akerele St, Ikeja, Lagos. Rated 3.7/5 across 3 customer reviews. Note: a reviewer says he stopped picking calls when an issue came up.',
    'Carpenter in Ikeja, Lagos',
    '+2347053923065',
    '+2347053923065',
    NULL,
    'Plot 10 Oluwa Akerele St, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', 'Plot 10 Oluwa Akerele St']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ikeja', 'lagos', 'plot 10 oluwa akerele st', 'dada carpenter work shop', 'chijbrz5timsoxarbqhjn1dyzjg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Dada Carpenter Work Shop","google_place_id":"ChIJbRz5TimSOxARbQhjN1dYzjg","google_rating":3.7,"google_review_count":3,"notes":"a reviewer says he stopped picking calls when an issue came up","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJbRz5TimSOxARbQhjN1dYzjg' OR 
      (lower(trim(db.business_name)) = lower(trim('Dada Carpenter Work Shop')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Dada Carpenter Work Shop'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Dada Carpenter Work Shop provides Carpenter services at Plot 10 Oluwa Akerele St, Ikeja, Lagos. Rated 3.7/5 across 3 customer reviews. Note: a reviewer says he stopped picking calls when an issue came up.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', 'Plot 10 Oluwa Akerele St']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ikeja', 'lagos', 'plot 10 oluwa akerele st', 'dada carpenter work shop', 'chijbrz5timsoxarbqhjn1dyzjg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Woodpecker Concepts Ltd',
    'business',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Woodpecker Concepts Ltd provides Carpenter services at 2 Owolewa St, off Randle Ave, Surulere, Lagos. Rated 4.5/5 across 26 customer reviews. Note: one review alleges non-delivery after a deposit.',
    'Carpenter in Surulere, Lagos',
    '+2348023122760',
    '+2348023122760',
    NULL,
    '2 Owolewa St, off Randle Ave, Surulere, Lagos',
    'Surulere',
    'Lagos',
    'Nigeria',
    ARRAY['Surulere', 'Lagos', '2 Owolewa St', 'off Randle Ave']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'surulere', 'lagos', '2 owolewa st', 'off randle ave', 'woodpecker concepts ltd', 'chijfe4ouaknoxarq-imxk_wjag']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Surulere","owner_full_name":"Woodpecker Concepts Ltd","google_place_id":"ChIJfe4OuAKNOxARq-ImXk_wJag","google_rating":4.5,"google_review_count":26,"notes":"one review alleges non-delivery after a deposit","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJfe4OuAKNOxARq-ImXk_wJag' OR 
      (lower(trim(db.business_name)) = lower(trim('Woodpecker Concepts Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Woodpecker Concepts Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Woodpecker Concepts Ltd provides Carpenter services at 2 Owolewa St, off Randle Ave, Surulere, Lagos. Rated 4.5/5 across 26 customer reviews. Note: one review alleges non-delivery after a deposit.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Surulere', 'Lagos', '2 Owolewa St', 'off Randle Ave']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'surulere', 'lagos', '2 owolewa st', 'off randle ave', 'woodpecker concepts ltd', 'chijfe4ouaknoxarq-imxk_wjag']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Sabol Capentery & Furnitures',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Sabol Capentery & Furnitures provides Carpenter services at 14 Demurine Rd, Agboyi, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Agboyi, Lagos',
    '+2348086103833',
    '+2348086103833',
    NULL,
    '14 Demurine Rd, Agboyi, Lagos',
    'Agboyi',
    'Lagos',
    'Nigeria',
    ARRAY['Agboyi', 'Lagos', '14 Demurine Rd']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'agboyi', 'lagos', '14 demurine rd', 'sabol capentery & furnitures', 'chijmum4o_csoxarxdlso_4myoe']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Agboyi","owner_full_name":"Sabol Capentery & Furnitures","google_place_id":"ChIJMUm4O_CSOxARXDLSO_4myoE","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJMUm4O_CSOxARXDLSO_4myoE' OR 
      (lower(trim(db.business_name)) = lower(trim('Sabol Capentery & Furnitures')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Sabol Capentery & Furnitures'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Sabol Capentery & Furnitures provides Carpenter services at 14 Demurine Rd, Agboyi, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Agboyi', 'Lagos', '14 Demurine Rd']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'agboyi', 'lagos', '14 demurine rd', 'sabol capentery & furnitures', 'chijmum4o_csoxarxdlso_4myoe']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Pastor Mfon',
    'supplier',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Pastor Mfon provides Carpenter services at 3 Ogunsedine St, Ketu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: listed only as a manufacturer; trade unconfirmed.',
    'Carpenter in Ketu, Lagos',
    '+2348055401805',
    '+2348055401805',
    NULL,
    '3 Ogunsedine St, Ketu, Lagos',
    'Ketu',
    'Lagos',
    'Nigeria',
    ARRAY['Ketu', 'Lagos', '3 Ogunsedine St']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ketu', 'lagos', '3 ogunsedine st', 'pastor mfon', 'chijg8oz-fksoxarbjdygevnu98']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ketu","owner_full_name":"Pastor Mfon","google_place_id":"ChIJg8oz-fKSOxARBJDYgEvnu98","google_rating":5,"google_review_count":1,"notes":"listed only as a manufacturer; trade unconfirmed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJg8oz-fKSOxARBJDYgEvnu98' OR 
      (lower(trim(db.business_name)) = lower(trim('Pastor Mfon')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Pastor Mfon'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Pastor Mfon provides Carpenter services at 3 Ogunsedine St, Ketu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: listed only as a manufacturer; trade unconfirmed.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Ketu', 'Lagos', '3 Ogunsedine St']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'ketu', 'lagos', '3 ogunsedine st', 'pastor mfon', 'chijg8oz-fksoxarbjdygevnu98']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'WELDING 360 COMPANY',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'WELDING 360 COMPANY provides Welder services at 28 Iju Rd, Ifako Agege, Lagos. Rated 4.9/5 across 118 customer reviews.',
    'Welder in Ifako Agege, Lagos',
    '+2347032080489',
    '+2347032080489',
    NULL,
    '28 Iju Rd, Ifako Agege, Lagos',
    'Ifako Agege',
    'Lagos',
    'Nigeria',
    ARRAY['Ifako Agege', 'Lagos', '28 Iju Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ifako agege', 'lagos', '28 iju rd', 'welding 360 company', 'chijr3feyxsroxar5mnev_2zepw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ifako Agege","owner_full_name":"WELDING 360 COMPANY","google_place_id":"ChIJr3feYxSROxAR5mneV_2ZEPw","google_rating":4.9,"google_review_count":118,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJr3feYxSROxAR5mneV_2ZEPw' OR 
      (lower(trim(db.business_name)) = lower(trim('WELDING 360 COMPANY')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('WELDING 360 COMPANY'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'WELDING 360 COMPANY provides Welder services at 28 Iju Rd, Ifako Agege, Lagos. Rated 4.9/5 across 118 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ifako Agege', 'Lagos', '28 Iju Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ifako agege', 'lagos', '28 iju rd', 'welding 360 company', 'chijr3feyxsroxar5mnev_2zepw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Kennah stainless and welding company Limited',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Kennah stainless and welding company Limited provides Welder services at Plot 12 Emmanuel High St, Ojota, Lagos. Rated 4.5/5 across 2 customer reviews.',
    'Welder in Ojota, Lagos',
    '+2348020686271',
    '+2348020686271',
    NULL,
    'Plot 12 Emmanuel High St, Ojota, Lagos',
    'Ojota',
    'Lagos',
    'Nigeria',
    ARRAY['Ojota', 'Lagos', 'Plot 12 Emmanuel High St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ojota', 'lagos', 'plot 12 emmanuel high st', 'kennah stainless and welding company limited', 'chij_88nijetoxar_9ecm2mgfqq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojota","owner_full_name":"Kennah stainless and welding company Limited","google_place_id":"ChIJ_88nIjeTOxAR_9ecM2mGfQQ","google_rating":4.5,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_88nIjeTOxAR_9ecM2mGfQQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Kennah stainless and welding company Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Kennah stainless and welding company Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Kennah stainless and welding company Limited provides Welder services at Plot 12 Emmanuel High St, Ojota, Lagos. Rated 4.5/5 across 2 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ojota', 'Lagos', 'Plot 12 Emmanuel High St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ojota', 'lagos', 'plot 12 emmanuel high st', 'kennah stainless and welding company limited', 'chij_88nijetoxar_9ecm2mgfqq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JASOOM WELDING AND CONSTRUCTION SERVICES',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'JASOOM WELDING AND CONSTRUCTION SERVICES provides Welder services at Bank Ln, Town Planning St, Ilupeju, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Ilupeju, Lagos',
    '+2348189277179',
    '+2348189277179',
    NULL,
    'Bank Ln, Town Planning St, Ilupeju, Lagos',
    'Ilupeju',
    'Lagos',
    'Nigeria',
    ARRAY['Ilupeju', 'Lagos', 'Bank Ln', 'Town Planning St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ilupeju', 'lagos', 'bank ln', 'town planning st', 'jasoom welding and construction services', 'chijotpjywcnoxariok4afn5ycm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ilupeju","owner_full_name":"JASOOM WELDING AND CONSTRUCTION SERVICES","google_place_id":"ChIJOTPjyWCNOxARiOK4aFN5ycM","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJOTPjyWCNOxARiOK4aFN5ycM' OR 
      (lower(trim(db.business_name)) = lower(trim('JASOOM WELDING AND CONSTRUCTION SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JASOOM WELDING AND CONSTRUCTION SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'JASOOM WELDING AND CONSTRUCTION SERVICES provides Welder services at Bank Ln, Town Planning St, Ilupeju, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ilupeju', 'Lagos', 'Bank Ln', 'Town Planning St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ilupeju', 'lagos', 'bank ln', 'town planning st', 'jasoom welding and construction services', 'chijotpjywcnoxariok4afn5ycm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Kenny welding construction',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Kenny welding construction provides Welder services at 11 Sheyindemi St, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: Google lists state as Ogun; Ojodu is in Lagos.',
    'Welder in Ojodu, Lagos',
    '+2348164402177',
    '+2348164402177',
    NULL,
    '11 Sheyindemi St, Ojodu, Lagos',
    'Ojodu',
    'Lagos',
    'Nigeria',
    ARRAY['Ojodu', 'Lagos', '11 Sheyindemi St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ojodu', 'lagos', '11 sheyindemi st', 'kenny welding construction', 'chijgx5vsaitoxar3tdhr2eak24']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojodu","owner_full_name":"Kenny welding construction","google_place_id":"ChIJGX5VsAiTOxAR3TDHr2eak24","google_rating":5,"google_review_count":1,"notes":"Google lists state as Ogun; Ojodu is in Lagos","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJGX5VsAiTOxAR3TDHr2eak24' OR 
      (lower(trim(db.business_name)) = lower(trim('Kenny welding construction')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Kenny welding construction'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Kenny welding construction provides Welder services at 11 Sheyindemi St, Ojodu, Lagos. Rated 5.0/5 across 1 customer reviews. Note: Google lists state as Ogun; Ojodu is in Lagos.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ojodu', 'Lagos', '11 Sheyindemi St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ojodu', 'lagos', '11 sheyindemi st', 'kenny welding construction', 'chijgx5vsaitoxar3tdhr2eak24']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Seedorf Welding Construction Company',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Seedorf Welding Construction Company provides Welder services at 32 Agunbiade St, Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Agege, Lagos',
    '+2348132058000',
    '+2348132058000',
    NULL,
    '32 Agunbiade St, Agege, Lagos',
    'Agege',
    'Lagos',
    'Nigeria',
    ARRAY['Agege', 'Lagos', '32 Agunbiade St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'agege', 'lagos', '32 agunbiade st', 'seedorf welding construction company', 'chij97cax1sroxaru1hhqmemex4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Agege","owner_full_name":"Seedorf Welding Construction Company","google_place_id":"ChIJ97CaX1SROxARU1hhqmEmEX4","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ97CaX1SROxARU1hhqmEmEX4' OR 
      (lower(trim(db.business_name)) = lower(trim('Seedorf Welding Construction Company')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Seedorf Welding Construction Company'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Seedorf Welding Construction Company provides Welder services at 32 Agunbiade St, Agege, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Agege', 'Lagos', '32 Agunbiade St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'agege', 'lagos', '32 agunbiade st', 'seedorf welding construction company', 'chij97cax1sroxaru1hhqmemex4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Happy Brother Steel Work',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Happy Brother Steel Work provides Welder services at 18 Jimoh Balogun St, Ikosi Ketu, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Ikosi Ketu, Lagos',
    '+2348125277494',
    '+2348125277494',
    NULL,
    '18 Jimoh Balogun St, Ikosi Ketu, Lagos',
    'Ikosi Ketu',
    'Lagos',
    'Nigeria',
    ARRAY['Ikosi Ketu', 'Lagos', '18 Jimoh Balogun St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ikosi ketu', 'lagos', '18 jimoh balogun st', 'happy brother steel work', 'chij25spovssoxarnm143iqcptg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikosi Ketu","owner_full_name":"Happy Brother Steel Work","google_place_id":"ChIJ25SpOVSSOxARnM143iqcptg","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ25SpOVSSOxARnM143iqcptg' OR 
      (lower(trim(db.business_name)) = lower(trim('Happy Brother Steel Work')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Happy Brother Steel Work'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Happy Brother Steel Work provides Welder services at 18 Jimoh Balogun St, Ikosi Ketu, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ikosi Ketu', 'Lagos', '18 Jimoh Balogun St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ikosi ketu', 'lagos', '18 jimoh balogun st', 'happy brother steel work', 'chij25spovssoxarnm143iqcptg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'OOJ FABRICATOR & CONSTRUCTION LTD',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'OOJ FABRICATOR & CONSTRUCTION LTD provides Welder services at Ikorodu Rd, Kosofe, Lagos. Rated 5.0/5 across 14 customer reviews.',
    'Welder in Kosofe, Lagos',
    '+2347067712213',
    '+2347067712213',
    NULL,
    'Ikorodu Rd, Kosofe, Lagos',
    'Kosofe',
    'Lagos',
    'Nigeria',
    ARRAY['Kosofe', 'Lagos', 'Ikorodu Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'kosofe', 'lagos', 'ikorodu rd', 'ooj fabricator & construction ltd', 'chijfxzlpobpoxarq7rw5ev9zzo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Kosofe","owner_full_name":"OOJ FABRICATOR & CONSTRUCTION LTD","google_place_id":"ChIJfXzlPobpOxARq7RW5eV9ZZo","google_rating":5,"google_review_count":14,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJfXzlPobpOxARq7RW5eV9ZZo' OR 
      (lower(trim(db.business_name)) = lower(trim('OOJ FABRICATOR & CONSTRUCTION LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('OOJ FABRICATOR & CONSTRUCTION LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'OOJ FABRICATOR & CONSTRUCTION LTD provides Welder services at Ikorodu Rd, Kosofe, Lagos. Rated 5.0/5 across 14 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Kosofe', 'Lagos', 'Ikorodu Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'kosofe', 'lagos', 'ikorodu rd', 'ooj fabricator & construction ltd', 'chijfxzlpobpoxarq7rw5ev9zzo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Sunbam Welding and Construction',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Sunbam Welding and Construction provides Welder services at Expressway 1, Ikosi Ketu, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Ikosi Ketu, Lagos',
    '+2348032631959',
    '+2348032631959',
    NULL,
    'Expressway 1, Ikosi Ketu, Lagos',
    'Ikosi Ketu',
    'Lagos',
    'Nigeria',
    ARRAY['Ikosi Ketu', 'Lagos', 'Expressway 1']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ikosi ketu', 'lagos', 'expressway 1', 'sunbam welding and construction', 'chijfxsimlmtoxarxzrn56a9ljs']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikosi Ketu","owner_full_name":"Sunbam Welding and Construction","google_place_id":"ChIJfxsImlmTOxARxZrn56A9Ljs","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJfxsImlmTOxARxZrn56A9Ljs' OR 
      (lower(trim(db.business_name)) = lower(trim('Sunbam Welding and Construction')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Sunbam Welding and Construction'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Sunbam Welding and Construction provides Welder services at Expressway 1, Ikosi Ketu, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Ikosi Ketu', 'Lagos', 'Expressway 1']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'ikosi ketu', 'lagos', 'expressway 1', 'sunbam welding and construction', 'chijfxsimlmtoxarxzrn56a9ljs']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Omooba Welding Works & Steel Construction Services',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Omooba Welding Works & Steel Construction Services provides Welder services at 4 Hussey Rd, Yaba, Lagos. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Yaba, Lagos',
    '+2349033354765',
    '+2349033354765',
    NULL,
    '4 Hussey Rd, Yaba, Lagos',
    'Yaba',
    'Lagos',
    'Nigeria',
    ARRAY['Yaba', 'Lagos', '4 Hussey Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'yaba', 'lagos', '4 hussey rd', 'omooba welding works & steel construction services', 'chijhccswmqnoxar3-vupg9sguy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Yaba","owner_full_name":"Omooba Welding Works & Steel Construction Services","google_place_id":"ChIJHccSWmqNOxAR3-vupg9sgUY","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJHccSWmqNOxAR3-vupg9sgUY' OR 
      (lower(trim(db.business_name)) = lower(trim('Omooba Welding Works & Steel Construction Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Omooba Welding Works & Steel Construction Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Omooba Welding Works & Steel Construction Services provides Welder services at 4 Hussey Rd, Yaba, Lagos. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Yaba', 'Lagos', '4 Hussey Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'yaba', 'lagos', '4 hussey rd', 'omooba welding works & steel construction services', 'chijhccswmqnoxar3-vupg9sguy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Olajiji Fashion Designer',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Olajiji Fashion Designer provides Tailor / Fashion designer services at 30b Ayodeji Otegbola St, Gbagada, Lagos. Rated 5.0/5 across 61 customer reviews.',
    'Tailor / Fashion designer in Gbagada, Lagos',
    '+2348052944788',
    '+2348052944788',
    NULL,
    '30b Ayodeji Otegbola St, Gbagada, Lagos',
    'Gbagada',
    'Lagos',
    'Nigeria',
    ARRAY['Gbagada', 'Lagos', '30b Ayodeji Otegbola St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gbagada', 'lagos', '30b ayodeji otegbola st', 'olajiji fashion designer', 'chijn-atv-wnoxaragpe2hwt0jm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gbagada","owner_full_name":"Olajiji Fashion Designer","google_place_id":"ChIJN-Atv-WNOxARAGpe2hWt0jM","google_rating":5,"google_review_count":61,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJN-Atv-WNOxARAGpe2hWt0jM' OR 
      (lower(trim(db.business_name)) = lower(trim('Olajiji Fashion Designer')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Olajiji Fashion Designer'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Olajiji Fashion Designer provides Tailor / Fashion designer services at 30b Ayodeji Otegbola St, Gbagada, Lagos. Rated 5.0/5 across 61 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Gbagada', 'Lagos', '30b Ayodeji Otegbola St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gbagada', 'lagos', '30b ayodeji otegbola st', 'olajiji fashion designer', 'chijn-atv-wnoxaragpe2hwt0jm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Tailored by Adunni Ltd.',
    'business',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Tailored by Adunni Ltd. provides Tailor / Fashion designer services at Store G7, Ikeja Town Square, Lagos. Rated 4.8/5 across 16 customer reviews.',
    'Tailor / Fashion designer in Ikeja Town Square, Lagos',
    '+2349115114509',
    '+2349115114509',
    NULL,
    'Store G7, Ikeja Town Square, Lagos',
    'Ikeja Town Square',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja Town Square', 'Lagos', 'Store G7']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ikeja town square', 'lagos', 'store g7', 'tailored by adunni ltd.', 'chijcrndstatoxarpnzi1mnbhbi']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja Town Square","owner_full_name":"Tailored by Adunni Ltd.","google_place_id":"ChIJcRNdsTaTOxARpnzI1MNBHBI","google_rating":4.8,"google_review_count":16,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJcRNdsTaTOxARpnzI1MNBHBI' OR 
      (lower(trim(db.business_name)) = lower(trim('Tailored by Adunni Ltd.')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Tailored by Adunni Ltd.'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Tailored by Adunni Ltd. provides Tailor / Fashion designer services at Store G7, Ikeja Town Square, Lagos. Rated 4.8/5 across 16 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja Town Square', 'Lagos', 'Store G7']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ikeja town square', 'lagos', 'store g7', 'tailored by adunni ltd.', 'chijcrndstatoxarpnzi1mnbhbi']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Royal Apparels',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Royal Apparels provides Tailor / Fashion designer services at 18 Emmanuel St, Ojota, Lagos. Rated 4.8/5 across 37 customer reviews.',
    'Tailor / Fashion designer in Ojota, Lagos',
    '+2348131685894',
    '+2348131685894',
    NULL,
    '18 Emmanuel St, Ojota, Lagos',
    'Ojota',
    'Lagos',
    'Nigeria',
    ARRAY['Ojota', 'Lagos', '18 Emmanuel St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ojota', 'lagos', '18 emmanuel st', 'royal apparels', 'chijh7ytflmtoxarwerv-arwvjc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojota","owner_full_name":"Royal Apparels","google_place_id":"ChIJH7YtfLmTOxARWErV-ArwVJc","google_rating":4.8,"google_review_count":37,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJH7YtfLmTOxARWErV-ArwVJc' OR 
      (lower(trim(db.business_name)) = lower(trim('Royal Apparels')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Royal Apparels'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Royal Apparels provides Tailor / Fashion designer services at 18 Emmanuel St, Ojota, Lagos. Rated 4.8/5 across 37 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ojota', 'Lagos', '18 Emmanuel St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ojota', 'lagos', '18 emmanuel st', 'royal apparels', 'chijh7ytflmtoxarwerv-arwvjc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'VSE Luxury Bridal',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'VSE Luxury Bridal provides Tailor / Fashion designer services at 16 Ishola Bello St, Ojodu, Lagos. Rated 5.0/5 across 24 customer reviews.',
    'Tailor / Fashion designer in Ojodu, Lagos',
    '+2347035542120',
    '+2347035542120',
    NULL,
    '16 Ishola Bello St, Ojodu, Lagos',
    'Ojodu',
    'Lagos',
    'Nigeria',
    ARRAY['Ojodu', 'Lagos', '16 Ishola Bello St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ojodu', 'lagos', '16 ishola bello st', 'vse luxury bridal', 'chijocorsistoxarkj5nr2orpb0']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ojodu","owner_full_name":"VSE Luxury Bridal","google_place_id":"ChIJOcOrsiSTOxARkJ5Nr2OrpB0","google_rating":5,"google_review_count":24,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJOcOrsiSTOxARkJ5Nr2OrpB0' OR 
      (lower(trim(db.business_name)) = lower(trim('VSE Luxury Bridal')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('VSE Luxury Bridal'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'VSE Luxury Bridal provides Tailor / Fashion designer services at 16 Ishola Bello St, Ojodu, Lagos. Rated 5.0/5 across 24 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ojodu', 'Lagos', '16 Ishola Bello St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ojodu', 'lagos', '16 ishola bello st', 'vse luxury bridal', 'chijocorsistoxarkj5nr2orpb0']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'A&K Stitches',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'A&K Stitches provides Tailor / Fashion designer services at 15 Anuoluwapo St, Somolu, Lagos. Rated 4.9/5 across 10 customer reviews.',
    'Tailor / Fashion designer in Somolu, Lagos',
    '+2348166767148',
    '+2348166767148',
    NULL,
    '15 Anuoluwapo St, Somolu, Lagos',
    'Somolu',
    'Lagos',
    'Nigeria',
    ARRAY['Somolu', 'Lagos', '15 Anuoluwapo St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'somolu', 'lagos', '15 anuoluwapo st', 'a&k stitches', 'chijxfhpqtsnoxarvhrbghbtd1s']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Somolu","owner_full_name":"A&K Stitches","google_place_id":"ChIJxfhPqtSNOxARvhrbghBTD1s","google_rating":4.9,"google_review_count":10,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJxfhPqtSNOxARvhrbghBTD1s' OR 
      (lower(trim(db.business_name)) = lower(trim('A&K Stitches')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('A&K Stitches'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'A&K Stitches provides Tailor / Fashion designer services at 15 Anuoluwapo St, Somolu, Lagos. Rated 4.9/5 across 10 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Somolu', 'Lagos', '15 Anuoluwapo St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'somolu', 'lagos', '15 anuoluwapo st', 'a&k stitches', 'chijxfhpqtsnoxarvhrbghbtd1s']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'House of Kings Creations',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'House of Kings Creations provides Tailor / Fashion designer services at 11 Olorunlogbon St, Anthony, Lagos. Rated 4.9/5 across 110 customer reviews.',
    'Tailor / Fashion designer in Anthony, Lagos',
    '+2349169373203',
    '+2349169373203',
    NULL,
    '11 Olorunlogbon St, Anthony, Lagos',
    'Anthony',
    'Lagos',
    'Nigeria',
    ARRAY['Anthony', 'Lagos', '11 Olorunlogbon St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'anthony', 'lagos', '11 olorunlogbon st', 'house of kings creations', 'chij_euto1knoxaru4nxohyy2e4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Anthony","owner_full_name":"House of Kings Creations","google_place_id":"ChIJ_euTO1KNOxARU4nxOhyy2e4","google_rating":4.9,"google_review_count":110,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_euTO1KNOxARU4nxOhyy2e4' OR 
      (lower(trim(db.business_name)) = lower(trim('House of Kings Creations')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('House of Kings Creations'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'House of Kings Creations provides Tailor / Fashion designer services at 11 Olorunlogbon St, Anthony, Lagos. Rated 4.9/5 across 110 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Anthony', 'Lagos', '11 Olorunlogbon St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'anthony', 'lagos', '11 olorunlogbon st', 'house of kings creations', 'chij_euto1knoxaru4nxohyy2e4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Ginika Signature',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Ginika Signature provides Tailor / Fashion designer services at 71 Victor Fagbemi St, Ipaja, Lagos. Rated 5.0/5 across 22 customer reviews.',
    'Tailor / Fashion designer in Ipaja, Lagos',
    '+2349035344094',
    '+2349035344094',
    NULL,
    '71 Victor Fagbemi St, Ipaja, Lagos',
    'Ipaja',
    'Lagos',
    'Nigeria',
    ARRAY['Ipaja', 'Lagos', '71 Victor Fagbemi St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ipaja', 'lagos', '71 victor fagbemi st', 'ginika signature', 'chij-4z7yoyroxarnqyqp5qiloy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ipaja","owner_full_name":"Ginika Signature","google_place_id":"ChIJ-4z7YOyROxARNqyqP5qILOY","google_rating":5,"google_review_count":22,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ-4z7YOyROxARNqyqP5qILOY' OR 
      (lower(trim(db.business_name)) = lower(trim('Ginika Signature')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Ginika Signature'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Ginika Signature provides Tailor / Fashion designer services at 71 Victor Fagbemi St, Ipaja, Lagos. Rated 5.0/5 across 22 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ipaja', 'Lagos', '71 Victor Fagbemi St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ipaja', 'lagos', '71 victor fagbemi st', 'ginika signature', 'chij-4z7yoyroxarnqyqp5qiloy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Mieko Michi',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Mieko Michi provides Tailor / Fashion designer services at 1 Olubiyi Fayinto St, Ifako-Ijaiye, Lagos. Rated 4.9/5 across 43 customer reviews.',
    'Tailor / Fashion designer in Ifako-Ijaiye, Lagos',
    '+2348032061325',
    '+2348032061325',
    NULL,
    '1 Olubiyi Fayinto St, Ifako-Ijaiye, Lagos',
    'Ifako-Ijaiye',
    'Lagos',
    'Nigeria',
    ARRAY['Ifako-Ijaiye', 'Lagos', '1 Olubiyi Fayinto St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ifako-ijaiye', 'lagos', '1 olubiyi fayinto st', 'mieko michi', 'chijgwjsu8qwoxaracpnh-k2_dy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ifako-Ijaiye","owner_full_name":"Mieko Michi","google_place_id":"ChIJgwJSu8qWOxARaCpNh-k2_DY","google_rating":4.9,"google_review_count":43,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJgwJSu8qWOxARaCpNh-k2_DY' OR 
      (lower(trim(db.business_name)) = lower(trim('Mieko Michi')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Mieko Michi'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Mieko Michi provides Tailor / Fashion designer services at 1 Olubiyi Fayinto St, Ifako-Ijaiye, Lagos. Rated 4.9/5 across 43 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ifako-Ijaiye', 'Lagos', '1 Olubiyi Fayinto St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ifako-ijaiye', 'lagos', '1 olubiyi fayinto st', 'mieko michi', 'chijgwjsu8qwoxaracpnh-k2_dy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Powertech Solar Energy Co. Ltd',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Powertech Solar Energy Co. Ltd provides Solar installer services at 23 Bariga Rd, Bariga, Lagos. Rated 4.8/5 across 61 customer reviews. Note: also runs solar training.',
    'Solar installer in Bariga, Lagos',
    '+2348036106824',
    '+2348036106824',
    NULL,
    '23 Bariga Rd, Bariga, Lagos',
    'Bariga',
    'Lagos',
    'Nigeria',
    ARRAY['Bariga', 'Lagos', '23 Bariga Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'vocational training & academy', 'bariga', 'lagos', '23 bariga rd', 'powertech solar energy co. ltd', 'chijzfax5qmnoxarryagobnqcz8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Bariga","owner_full_name":"Powertech Solar Energy Co. Ltd","google_place_id":"ChIJzfAx5qmNOxARryaGOBnQCz8","google_rating":4.8,"google_review_count":61,"notes":"also runs solar training","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJzfAx5qmNOxARryaGOBnQCz8' OR 
      (lower(trim(db.business_name)) = lower(trim('Powertech Solar Energy Co. Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Powertech Solar Energy Co. Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Powertech Solar Energy Co. Ltd provides Solar installer services at 23 Bariga Rd, Bariga, Lagos. Rated 4.8/5 across 61 customer reviews. Note: also runs solar training.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Bariga', 'Lagos', '23 Bariga Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'vocational training & academy', 'bariga', 'lagos', '23 bariga rd', 'powertech solar energy co. ltd', 'chijzfax5qmnoxarryagobnqcz8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'SOLARITY PLUS LIMITED',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'SOLARITY PLUS LIMITED provides Solar installer services at 15 Bajulaye Rd, Somolu, Lagos. Rated 4.8/5 across 241 customer reviews. Note: supplier/manufacturer.',
    'Solar installer in Somolu, Lagos',
    '+2349053902950',
    '+2349053902950',
    NULL,
    '15 Bajulaye Rd, Somolu, Lagos',
    'Somolu',
    'Lagos',
    'Nigeria',
    ARRAY['Somolu', 'Lagos', '15 Bajulaye Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'somolu', 'lagos', '15 bajulaye rd', 'solarity plus limited', 'chijrdv3m62noxarhc1pidransm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Somolu","owner_full_name":"SOLARITY PLUS LIMITED","google_place_id":"ChIJRdV3M62NOxARHc1PiDrAnsM","google_rating":4.8,"google_review_count":241,"notes":"supplier/manufacturer","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJRdV3M62NOxARHc1PiDrAnsM' OR 
      (lower(trim(db.business_name)) = lower(trim('SOLARITY PLUS LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('SOLARITY PLUS LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'SOLARITY PLUS LIMITED provides Solar installer services at 15 Bajulaye Rd, Somolu, Lagos. Rated 4.8/5 across 241 customer reviews. Note: supplier/manufacturer.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Somolu', 'Lagos', '15 Bajulaye Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'somolu', 'lagos', '15 bajulaye rd', 'solarity plus limited', 'chijrdv3m62noxarhc1pidransm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'FELICITY SOLAR NIG LTD',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'FELICITY SOLAR NIG LTD provides Solar installer services at 2 Omotayo Omotosho St, Amuwo Odofin, Lagos. Rated 4.5/5 across 96 customer reviews. Note: supplier; mixed reviews incl. an after-sales complaint.',
    'Solar installer in Amuwo Odofin, Lagos',
    '+2347030512628',
    '+2347030512628',
    NULL,
    '2 Omotayo Omotosho St, Amuwo Odofin, Lagos',
    'Amuwo Odofin',
    'Lagos',
    'Nigeria',
    ARRAY['Amuwo Odofin', 'Lagos', '2 Omotayo Omotosho St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'amuwo odofin', 'lagos', '2 omotayo omotosho st', 'felicity solar nig ltd', 'chijgziixjcjoxar8fx2qmwfnwy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Amuwo Odofin","owner_full_name":"FELICITY SOLAR NIG LTD","google_place_id":"ChIJgzIiXJCJOxAR8fx2QmwFnWY","google_rating":4.5,"google_review_count":96,"notes":"supplier; mixed reviews incl. an after-sales complaint","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJgzIiXJCJOxAR8fx2QmwFnWY' OR 
      (lower(trim(db.business_name)) = lower(trim('FELICITY SOLAR NIG LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('FELICITY SOLAR NIG LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'FELICITY SOLAR NIG LTD provides Solar installer services at 2 Omotayo Omotosho St, Amuwo Odofin, Lagos. Rated 4.5/5 across 96 customer reviews. Note: supplier; mixed reviews incl. an after-sales complaint.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Amuwo Odofin', 'Lagos', '2 Omotayo Omotosho St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'amuwo odofin', 'lagos', '2 omotayo omotosho st', 'felicity solar nig ltd', 'chijgziixjcjoxar8fx2qmwfnwy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Trulight Renewable Energy Ltd',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Trulight Renewable Energy Ltd provides Solar installer services at 32B Gateway Cres, Magodo GRA, Lagos. Rated 4.8/5 across 55 customer reviews.',
    'Solar installer in Magodo GRA, Lagos',
    '+2348035015137',
    '+2348035015137',
    NULL,
    '32B Gateway Cres, Magodo GRA, Lagos',
    'Magodo GRA',
    'Lagos',
    'Nigeria',
    ARRAY['Magodo GRA', 'Lagos', '32B Gateway Cres']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'magodo gra', 'lagos', '32b gateway cres', 'trulight renewable energy ltd', 'chijqvvgnautoxarmkz1ky7tvrs']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Magodo GRA","owner_full_name":"Trulight Renewable Energy Ltd","google_place_id":"ChIJqVVGNAuTOxARMkZ1kY7tvrs","google_rating":4.8,"google_review_count":55,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJqVVGNAuTOxARMkZ1kY7tvrs' OR 
      (lower(trim(db.business_name)) = lower(trim('Trulight Renewable Energy Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Trulight Renewable Energy Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Trulight Renewable Energy Ltd provides Solar installer services at 32B Gateway Cres, Magodo GRA, Lagos. Rated 4.8/5 across 55 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Magodo GRA', 'Lagos', '32B Gateway Cres']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'magodo gra', 'lagos', '32b gateway cres', 'trulight renewable energy ltd', 'chijqvvgnautoxarmkz1ky7tvrs']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Optimal Techie Solar Energy Company',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'Optimal Techie Solar Energy Company provides Solar installer services at 16 Olayiwola St, Oregun, Ikeja, Lagos. Rated 5.0/5 across 51 customer reviews. Note: equipment distributor.',
    'Solar installer in Ikeja, Lagos',
    '+2347074716523',
    '+2347074716523',
    NULL,
    '16 Olayiwola St, Oregun, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '16 Olayiwola St', 'Oregun']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'ikeja', 'lagos', '16 olayiwola st', 'oregun', 'optimal techie solar energy company', 'chijw1zs0yqtoxarjcabjdq3bxq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"Optimal Techie Solar Energy Company","google_place_id":"ChIJw1ZS0YqTOxARjcAbJDQ3bXQ","google_rating":5,"google_review_count":51,"notes":"equipment distributor","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJw1ZS0YqTOxARjcAbJDQ3bXQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Optimal Techie Solar Energy Company')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Optimal Techie Solar Energy Company'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Optimal Techie Solar Energy Company provides Solar installer services at 16 Olayiwola St, Oregun, Ikeja, Lagos. Rated 5.0/5 across 51 customer reviews. Note: equipment distributor.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '16 Olayiwola St', 'Oregun']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'ikeja', 'lagos', '16 olayiwola st', 'oregun', 'optimal techie solar energy company', 'chijw1zs0yqtoxarjcabjdq3bxq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Ecozar Solar Energy',
    'artisan',
    'Solar & Renewable Power',
    'Solar installer',
    'Ecozar Solar Energy provides Solar installer services at 8 The Providence St, Lekki Phase 1, Lagos. Rated 5.0/5 across 17 customer reviews.',
    'Solar installer in Lekki Phase 1, Lagos',
    '+2349099999231',
    '+2349099999231',
    NULL,
    '8 The Providence St, Lekki Phase 1, Lagos',
    'Lekki Phase 1',
    'Lagos',
    'Nigeria',
    ARRAY['Lekki Phase 1', 'Lagos', '8 The Providence St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'lekki phase 1', 'lagos', '8 the providence st', 'ecozar solar energy', 'chijlwnddzz3oxarg1sq_fjidk4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lekki Phase 1","owner_full_name":"Ecozar Solar Energy","google_place_id":"ChIJlwnDDzz3OxARg1SQ_fJIdk4","google_rating":5,"google_review_count":17,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJlwnDDzz3OxARg1SQ_fJIdk4' OR 
      (lower(trim(db.business_name)) = lower(trim('Ecozar Solar Energy')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Ecozar Solar Energy'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Ecozar Solar Energy provides Solar installer services at 8 The Providence St, Lekki Phase 1, Lagos. Rated 5.0/5 across 17 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Lekki Phase 1', 'Lagos', '8 The Providence St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'lekki phase 1', 'lagos', '8 the providence st', 'ecozar solar energy', 'chijlwnddzz3oxarg1sq_fjidk4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Gennex Technologies',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'Gennex Technologies provides Solar installer services at Plot 32 Adebisi Ogunniyi Cres, Ikate, Lekki, Lagos. Rated 4.4/5 across 89 customer reviews. Note: supplier.',
    'Solar installer in Lekki, Lagos',
    '+2348179464060',
    '+2348179464060',
    NULL,
    'Plot 32 Adebisi Ogunniyi Cres, Ikate, Lekki, Lagos',
    'Lekki',
    'Lagos',
    'Nigeria',
    ARRAY['Lekki', 'Lagos', 'Plot 32 Adebisi Ogunniyi Cres', 'Ikate']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'lekki', 'lagos', 'plot 32 adebisi ogunniyi cres', 'ikate', 'gennex technologies', 'chijlf-wcj71oxarump8wmoyvqa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lekki","owner_full_name":"Gennex Technologies","google_place_id":"ChIJLf-Wcj71OxARUmP8wmOyVQA","google_rating":4.4,"google_review_count":89,"notes":"supplier","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJLf-Wcj71OxARUmP8wmOyVQA' OR 
      (lower(trim(db.business_name)) = lower(trim('Gennex Technologies')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Gennex Technologies'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Gennex Technologies provides Solar installer services at Plot 32 Adebisi Ogunniyi Cres, Ikate, Lekki, Lagos. Rated 4.4/5 across 89 customer reviews. Note: supplier.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Lekki', 'Lagos', 'Plot 32 Adebisi Ogunniyi Cres', 'Ikate']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'lekki', 'lagos', 'plot 32 adebisi ogunniyi cres', 'ikate', 'gennex technologies', 'chijlf-wcj71oxarump8wmoyvqa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Ekenet Solar and Inverter Company',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Ekenet Solar and Inverter Company provides Solar installer services at 36 Brown St, Oshodi, Lagos. Rated 4.9/5 across 35 customer reviews.',
    'Solar installer in Oshodi, Lagos',
    '+2348085942643',
    '+2348085942643',
    NULL,
    '36 Brown St, Oshodi, Lagos',
    'Oshodi',
    'Lagos',
    'Nigeria',
    ARRAY['Oshodi', 'Lagos', '36 Brown St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'oshodi', 'lagos', '36 brown st', 'ekenet solar and inverter company', 'chijryuyjtknoxaruzynlghnc5c']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Oshodi","owner_full_name":"Ekenet Solar and Inverter Company","google_place_id":"ChIJryUyJtKNOxARuZynlghNC5c","google_rating":4.9,"google_review_count":35,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJryUyJtKNOxARuZynlghNC5c' OR 
      (lower(trim(db.business_name)) = lower(trim('Ekenet Solar and Inverter Company')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Ekenet Solar and Inverter Company'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Ekenet Solar and Inverter Company provides Solar installer services at 36 Brown St, Oshodi, Lagos. Rated 4.9/5 across 35 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Oshodi', 'Lagos', '36 Brown St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'oshodi', 'lagos', '36 brown st', 'ekenet solar and inverter company', 'chijryuyjtknoxaruzynlghnc5c']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Arnergy Solar',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'Arnergy Solar provides Solar installer services at 1 Industrial St, Ilupeju, Lagos. Rated 4.7/5 across 48 customer reviews. Note: manufacturer and installer.',
    'Solar installer in Ilupeju, Lagos',
    '+2347002288888',
    '+2347002288888',
    NULL,
    '1 Industrial St, Ilupeju, Lagos',
    'Ilupeju',
    'Lagos',
    'Nigeria',
    ARRAY['Ilupeju', 'Lagos', '1 Industrial St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'ilupeju', 'lagos', '1 industrial st', 'arnergy solar', 'chijaey6v9skoxar6_mf04gvhxy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ilupeju","owner_full_name":"Arnergy Solar","google_place_id":"ChIJaeY6v9SKOxAR6_MF04gVHxY","google_rating":4.7,"google_review_count":48,"notes":"manufacturer and installer","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJaeY6v9SKOxAR6_MF04gVHxY' OR 
      (lower(trim(db.business_name)) = lower(trim('Arnergy Solar')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Arnergy Solar'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Arnergy Solar provides Solar installer services at 1 Industrial St, Ilupeju, Lagos. Rated 4.7/5 across 48 customer reviews. Note: manufacturer and installer.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Ilupeju', 'Lagos', '1 Industrial St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'ilupeju', 'lagos', '1 industrial st', 'arnergy solar', 'chijaey6v9skoxar6_mf04gvhxy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Iedit Design',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Iedit Design provides Graphic designer services at Olota, Ekoro Rd, Abule Egba, Lagos. Rated 4.9/5 across 42 customer reviews.',
    'Graphic designer in Abule Egba, Lagos',
    '+2349033743135',
    '+2349033743135',
    NULL,
    'Olota, Ekoro Rd, Abule Egba, Lagos',
    'Abule Egba',
    'Lagos',
    'Nigeria',
    ARRAY['Abule Egba', 'Lagos', 'Olota', 'Ekoro Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'abule egba', 'lagos', 'olota', 'ekoro rd', 'iedit design', 'chijpxmlgyiroxarqueyxcfqih4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Abule Egba","owner_full_name":"Iedit Design","google_place_id":"ChIJPxmLgYiROxARQuEYxcFQIh4","google_rating":4.9,"google_review_count":42,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJPxmLgYiROxARQuEYxcFQIh4' OR 
      (lower(trim(db.business_name)) = lower(trim('Iedit Design')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Iedit Design'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Iedit Design provides Graphic designer services at Olota, Ekoro Rd, Abule Egba, Lagos. Rated 4.9/5 across 42 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Abule Egba', 'Lagos', 'Olota', 'Ekoro Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'abule egba', 'lagos', 'olota', 'ekoro rd', 'iedit design', 'chijpxmlgyiroxarqueyxcfqih4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'MediaCraft Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'MediaCraft Studio provides Graphic designer services at 81 Lewis St, Lagos Island, Lagos. Rated 4.8/5 across 56 customer reviews. Note: web design and marketing.',
    'Graphic designer in Lagos Island, Lagos',
    '+2347062606896',
    '+2347062606896',
    NULL,
    '81 Lewis St, Lagos Island, Lagos',
    'Lagos Island',
    'Lagos',
    'Nigeria',
    ARRAY['Lagos Island', 'Lagos', '81 Lewis St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'lagos island', 'lagos', '81 lewis st', 'mediacraft studio', 'chijb438cweloxardfmwsypstgo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lagos Island","owner_full_name":"MediaCraft Studio","google_place_id":"ChIJB438CweLOxARDFMWSYPstgo","google_rating":4.8,"google_review_count":56,"notes":"web design and marketing","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJB438CweLOxARDFMWSYPstgo' OR 
      (lower(trim(db.business_name)) = lower(trim('MediaCraft Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('MediaCraft Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'MediaCraft Studio provides Graphic designer services at 81 Lewis St, Lagos Island, Lagos. Rated 4.8/5 across 56 customer reviews. Note: web design and marketing.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design']::TEXT[],
  'Request a Quote',
  ARRAY['Lagos Island', 'Lagos', '81 Lewis St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'lagos island', 'lagos', '81 lewis st', 'mediacraft studio', 'chijb438cweloxardfmwsypstgo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'SKY VFX STUDIOS',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'SKY VFX STUDIOS provides Graphic designer services at 7 Olayinka Bamgbose St, Ikeja, Lagos. Rated 5.0/5 across 65 customer reviews. Note: training school (graphics, VFX).',
    'Graphic designer in Ikeja, Lagos',
    '+2348032496995',
    '+2348032496995',
    NULL,
    '7 Olayinka Bamgbose St, Ikeja, Lagos',
    'Ikeja',
    'Lagos',
    'Nigeria',
    ARRAY['Ikeja', 'Lagos', '7 Olayinka Bamgbose St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3d animation & vfx', 'vocational training & academy', 'ikeja', 'lagos', '7 olayinka bamgbose st', 'sky vfx studios', 'chij8spq_gqtoxardr8cm5p7rqi']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikeja","owner_full_name":"SKY VFX STUDIOS","google_place_id":"ChIJ8SPq_gqTOxARDR8cM5p7RqI","google_rating":5,"google_review_count":65,"notes":"training school (graphics, VFX)","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ8SPq_gqTOxARDR8cM5p7RqI' OR 
      (lower(trim(db.business_name)) = lower(trim('SKY VFX STUDIOS')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('SKY VFX STUDIOS'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'SKY VFX STUDIOS provides Graphic designer services at 7 Olayinka Bamgbose St, Ikeja, Lagos. Rated 5.0/5 across 65 customer reviews. Note: training school (graphics, VFX).',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', '3D Animation & VFX', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Ikeja', 'Lagos', '7 Olayinka Bamgbose St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3d animation & vfx', 'vocational training & academy', 'ikeja', 'lagos', '7 olayinka bamgbose st', 'sky vfx studios', 'chij8spq_gqtoxardr8cm5p7rqi']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Hazken Digital',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Hazken Digital provides Graphic designer services at 25 Akeju St, Somolu, Lagos. Rated 5.0/5 across 174 customer reviews. Note: print and signage; one review disputes their service.',
    'Graphic designer in Somolu, Lagos',
    '+2349029480399',
    '+2349029480399',
    NULL,
    '25 Akeju St, Somolu, Lagos',
    'Somolu',
    'Lagos',
    'Nigeria',
    ARRAY['Somolu', 'Lagos', '25 Akeju St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'somolu', 'lagos', '25 akeju st', 'hazken digital', 'chijrc-n_xwnoxarlajtuuodxdg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Somolu","owner_full_name":"Hazken Digital","google_place_id":"ChIJrc-n_xWNOxARlaJtuuODxdg","google_rating":5,"google_review_count":174,"notes":"print and signage; one review disputes their service","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJrc-n_xWNOxARlaJtuuODxdg' OR 
      (lower(trim(db.business_name)) = lower(trim('Hazken Digital')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Hazken Digital'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Hazken Digital provides Graphic designer services at 25 Akeju St, Somolu, Lagos. Rated 5.0/5 across 174 customer reviews. Note: print and signage; one review disputes their service.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Somolu', 'Lagos', '25 Akeju St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'somolu', 'lagos', '25 akeju st', 'hazken digital', 'chijrc-n_xwnoxarlajtuuodxdg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Iceberg Creative Print Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Iceberg Creative Print Studio provides Graphic designer services at Somolu, Lagos. Rated 4.9/5 across 107 customer reviews. Note: print and branding.',
    'Graphic designer in Somolu, Lagos',
    '+2348023093704',
    '+2348023093704',
    NULL,
    'Somolu, Lagos',
    'Somolu',
    'Lagos',
    'Nigeria',
    ARRAY['Somolu', 'Lagos']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'branding & identity', 'somolu', 'lagos', 'iceberg creative print studio', 'chijvqsy9_inoxaragaaowegnza']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Somolu","owner_full_name":"Iceberg Creative Print Studio","google_place_id":"ChIJvQSY9_iNOxARaGAAOwEgnZA","google_rating":4.9,"google_review_count":107,"notes":"print and branding","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJvQSY9_iNOxARaGAAOwEgnZA' OR 
      (lower(trim(db.business_name)) = lower(trim('Iceberg Creative Print Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Iceberg Creative Print Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Iceberg Creative Print Studio provides Graphic designer services at Somolu, Lagos. Rated 4.9/5 across 107 customer reviews. Note: print and branding.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production', 'Branding & Identity']::TEXT[],
  'Request a Quote',
  ARRAY['Somolu', 'Lagos']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'branding & identity', 'somolu', 'lagos', 'iceberg creative print studio', 'chijvqsy9_inoxaragaaowegnza']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Meshratio Studios',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Meshratio Studios provides Graphic designer services at Kunle Ogedengbe Cres, Ikosi Ketu, Lagos. Rated 5.0/5 across 63 customer reviews. Note: 3D animation.',
    'Graphic designer in Ikosi Ketu, Lagos',
    '+2348140441576',
    '+2348140441576',
    NULL,
    'Kunle Ogedengbe Cres, Ikosi Ketu, Lagos',
    'Ikosi Ketu',
    'Lagos',
    'Nigeria',
    ARRAY['Ikosi Ketu', 'Lagos', 'Kunle Ogedengbe Cres']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3d animation & vfx', 'ikosi ketu', 'lagos', 'kunle ogedengbe cres', 'meshratio studios', 'chij8xdpfvsnoxardxq-8omf38k']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ikosi Ketu","owner_full_name":"Meshratio Studios","google_place_id":"ChIJ8xDPfVSNOxARDXq-8oMf38k","google_rating":5,"google_review_count":63,"notes":"3D animation","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ8xDPfVSNOxARDXq-8oMf38k' OR 
      (lower(trim(db.business_name)) = lower(trim('Meshratio Studios')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Meshratio Studios'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Meshratio Studios provides Graphic designer services at Kunle Ogedengbe Cres, Ikosi Ketu, Lagos. Rated 5.0/5 across 63 customer reviews. Note: 3D animation.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', '3D Animation & VFX']::TEXT[],
  'Request a Quote',
  ARRAY['Ikosi Ketu', 'Lagos', 'Kunle Ogedengbe Cres']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3d animation & vfx', 'ikosi ketu', 'lagos', 'kunle ogedengbe cres', 'meshratio studios', 'chij8xdpfvsnoxardxq-8omf38k']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Rivasult Creative',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Rivasult Creative provides Graphic designer services at 10 Omonubi St, Surulere, Lagos. Rated 4.9/5 across 10 customer reviews.',
    'Graphic designer in Surulere, Lagos',
    '+2348161749132',
    '+2348161749132',
    NULL,
    '10 Omonubi St, Surulere, Lagos',
    'Surulere',
    'Lagos',
    'Nigeria',
    ARRAY['Surulere', 'Lagos', '10 Omonubi St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'surulere', 'lagos', '10 omonubi st', 'rivasult creative', 'chijo5nde8sboxar0rzgih0bjio']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Surulere","owner_full_name":"Rivasult Creative","google_place_id":"ChIJO5NdE8SBOxAR0RzgIH0bJIo","google_rating":4.9,"google_review_count":10,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJO5NdE8SBOxAR0RzgIH0bJIo' OR 
      (lower(trim(db.business_name)) = lower(trim('Rivasult Creative')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Rivasult Creative'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Rivasult Creative provides Graphic designer services at 10 Omonubi St, Surulere, Lagos. Rated 4.9/5 across 10 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Surulere', 'Lagos', '10 Omonubi St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'surulere', 'lagos', '10 omonubi st', 'rivasult creative', 'chijo5nde8sboxar0rzgih0bjio']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Locreative Media LTD',
    'business',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Locreative Media LTD provides Graphic designer services at 4 Chief Okonta Cl, Orile Iganmu, Lagos. Rated 5.0/5 across 51 customer reviews. Note: design, print, web.',
    'Graphic designer in Orile Iganmu, Lagos',
    '+2348104338780',
    '+2348104338780',
    NULL,
    '4 Chief Okonta Cl, Orile Iganmu, Lagos',
    'Orile Iganmu',
    'Lagos',
    'Nigeria',
    ARRAY['Orile Iganmu', 'Lagos', '4 Chief Okonta Cl']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'print & signage production', 'orile iganmu', 'lagos', '4 chief okonta cl', 'locreative media ltd', 'chijk5kccnmnoxarf3vrg8ilrb8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Orile Iganmu","owner_full_name":"Locreative Media LTD","google_place_id":"ChIJk5KcCNmNOxARf3vRG8Ilrb8","google_rating":5,"google_review_count":51,"notes":"design, print, web","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJk5KcCNmNOxARf3vRG8Ilrb8' OR 
      (lower(trim(db.business_name)) = lower(trim('Locreative Media LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Locreative Media LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Locreative Media LTD provides Graphic designer services at 4 Chief Okonta Cl, Orile Iganmu, Lagos. Rated 5.0/5 across 51 customer reviews. Note: design, print, web.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Orile Iganmu', 'Lagos', '4 Chief Okonta Cl']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'print & signage production', 'orile iganmu', 'lagos', '4 chief okonta cl', 'locreative media ltd', 'chijk5kccnmnoxarf3vrg8ilrb8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Creative Studios',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Creative Studios provides Graphic designer services at 14 Dele Adedayo St, Ogudu, Lagos. Rated 4.5/5 across 20 customer reviews. Note: advertising agency.',
    'Graphic designer in Ogudu, Lagos',
    '+2349090135851',
    '+2349090135851',
    NULL,
    '14 Dele Adedayo St, Ogudu, Lagos',
    'Ogudu',
    'Lagos',
    'Nigeria',
    ARRAY['Ogudu', 'Lagos', '14 Dele Adedayo St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'ogudu', 'lagos', '14 dele adedayo st', 'creative studios', 'chijzaxv_5qsoxarbplkiotfavy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ogudu","owner_full_name":"Creative Studios","google_place_id":"ChIJzaXV_5qSOxARbPLKIotFAvY","google_rating":4.5,"google_review_count":20,"notes":"advertising agency","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJzaXV_5qSOxARbPLKIotFAvY' OR 
      (lower(trim(db.business_name)) = lower(trim('Creative Studios')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Creative Studios'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Creative Studios provides Graphic designer services at 14 Dele Adedayo St, Ogudu, Lagos. Rated 4.5/5 across 20 customer reviews. Note: advertising agency.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Ogudu', 'Lagos', '14 Dele Adedayo St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'ogudu', 'lagos', '14 dele adedayo st', 'creative studios', 'chijzaxv_5qsoxarbplkiotfavy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Creative joe Studios',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Creative joe Studios provides Graphic designer services at 14 Olu Ajisegbede St, Somolu, Lagos. Rated 4.6/5 across 5 customer reviews.',
    'Graphic designer in Somolu, Lagos',
    '+2349099868815',
    '+2349099868815',
    NULL,
    '14 Olu Ajisegbede St, Somolu, Lagos',
    'Somolu',
    'Lagos',
    'Nigeria',
    ARRAY['Somolu', 'Lagos', '14 Olu Ajisegbede St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'somolu', 'lagos', '14 olu ajisegbede st', 'creative joe studios', 'chij9-pwr-qnoxarkonkdl_83hq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Somolu","owner_full_name":"Creative joe Studios","google_place_id":"ChIJ9-PWr-qNOxARKOnKDL_83hQ","google_rating":4.6,"google_review_count":5,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ9-PWr-qNOxARKOnKDL_83hQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Creative joe Studios')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Creative joe Studios'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Lagos'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Creative joe Studios provides Graphic designer services at 14 Olu Ajisegbede St, Somolu, Lagos. Rated 4.6/5 across 5 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Somolu', 'Lagos', '14 Olu Ajisegbede St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'somolu', 'lagos', '14 olu ajisegbede st', 'creative joe studios', 'chij9-pwr-qnoxarkonkdl_83hq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Hatamo Bespoke Fashion',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Hatamo Bespoke Fashion provides Tailor / Fashion designer services at 18 Ogunseye St, Iju, Ajuwon/Akute, Ogun. Rated 5.0/5 across 43 customer reviews. Note: surfaced by the Lagos search.',
    'Tailor / Fashion designer in Iju / Akute, Ogun',
    '+2348138755510',
    '+2348138755510',
    NULL,
    '18 Ogunseye St, Iju, Ajuwon/Akute, Ogun',
    'Iju / Akute',
    'Ogun',
    'Nigeria',
    ARRAY['Iju / Akute', 'Ogun', 'Lagos', '18 Ogunseye St', 'Iju', 'Ajuwon/Akute']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'iju / akute', 'ogun', 'lagos', '18 ogunseye st', 'iju', 'ajuwon/akute', 'hatamo bespoke fashion', 'chijpwvkxnovoxarxocmijuu6eq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Iju / Akute","owner_full_name":"Hatamo Bespoke Fashion","google_place_id":"ChIJpWVKXNOVOxARXOCMijuU6EQ","google_rating":5,"google_review_count":43,"notes":"surfaced by the Lagos search","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJpWVKXNOVOxARXOCMijuU6EQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Hatamo Bespoke Fashion')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Ogun')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Hatamo Bespoke Fashion'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Ogun'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Hatamo Bespoke Fashion provides Tailor / Fashion designer services at 18 Ogunseye St, Iju, Ajuwon/Akute, Ogun. Rated 5.0/5 across 43 customer reviews. Note: surfaced by the Lagos search.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Iju / Akute', 'Ogun', 'Lagos', '18 Ogunseye St', 'Iju', 'Ajuwon/Akute']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'iju / akute', 'ogun', 'lagos', '18 ogunseye st', 'iju', 'ajuwon/akute', 'hatamo bespoke fashion', 'chijpwvkxnovoxarxocmijuu6eq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ROYAL KLASSIC KOUTURE',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'ROYAL KLASSIC KOUTURE provides Tailor / Fashion designer services at Damry Plaza, Alagbole-Akute Rd, Iju, Ogun. Rated 4.9/5 across 36 customer reviews. Note: surfaced by the Lagos search.',
    'Tailor / Fashion designer in Iju / Akute, Ogun',
    '+2347065244145',
    '+2347065244145',
    NULL,
    'Damry Plaza, Alagbole-Akute Rd, Iju, Ogun',
    'Iju / Akute',
    'Ogun',
    'Nigeria',
    ARRAY['Iju / Akute', 'Ogun', 'Lagos', 'Damry Plaza', 'Alagbole-Akute Rd', 'Iju']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'iju / akute', 'ogun', 'lagos', 'damry plaza', 'alagbole-akute rd', 'iju', 'royal klassic kouture', 'chijxed5h6gtoxar4onraeshm24']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Iju / Akute","owner_full_name":"ROYAL KLASSIC KOUTURE","google_place_id":"ChIJxeD5H6GTOxAR4ONRaeshM24","google_rating":4.9,"google_review_count":36,"notes":"surfaced by the Lagos search","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJxeD5H6GTOxAR4ONRaeshM24' OR 
      (lower(trim(db.business_name)) = lower(trim('ROYAL KLASSIC KOUTURE')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Ogun')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ROYAL KLASSIC KOUTURE'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Ogun'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'ROYAL KLASSIC KOUTURE provides Tailor / Fashion designer services at Damry Plaza, Alagbole-Akute Rd, Iju, Ogun. Rated 4.9/5 across 36 customer reviews. Note: surfaced by the Lagos search.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Iju / Akute', 'Ogun', 'Lagos', 'Damry Plaza', 'Alagbole-Akute Rd', 'Iju']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'iju / akute', 'ogun', 'lagos', 'damry plaza', 'alagbole-akute rd', 'iju', 'royal klassic kouture', 'chijxed5h6gtoxar4onraeshm24']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Hydro-Tech Water Engineering Services Ltd',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Hydro-Tech Water Engineering Services Ltd provides Plumber services at Kaura Modern Market, Durumi, Abuja. Rated 4.8/5 across 25 customer reviews.',
    'Plumber in Durumi, Abuja',
    '+2347016957907',
    '+2347016957907',
    NULL,
    'Kaura Modern Market, Durumi, Abuja (FCT)',
    'Durumi',
    'Abuja',
    'Nigeria',
    ARRAY['Durumi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kaura Modern Market']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'durumi', 'abuja', 'fct', 'abuja (fct)', 'kaura modern market', 'hydro-tech water engineering services ltd', 'chijf-mhgs4ltharoio9u6nyq5q']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Durumi","owner_full_name":"Hydro-Tech Water Engineering Services Ltd","google_place_id":"ChIJF-MHGS4LThAROiO9U6nYq5Q","google_rating":4.8,"google_review_count":25,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJF-MHGS4LThAROiO9U6nYq5Q' OR 
      (lower(trim(db.business_name)) = lower(trim('Hydro-Tech Water Engineering Services Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Hydro-Tech Water Engineering Services Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Hydro-Tech Water Engineering Services Ltd provides Plumber services at Kaura Modern Market, Durumi, Abuja. Rated 4.8/5 across 25 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Durumi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kaura Modern Market']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'durumi', 'abuja', 'fct', 'abuja (fct)', 'kaura modern market', 'hydro-tech water engineering services ltd', 'chijf-mhgs4ltharoio9u6nyq5q']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DreamFlush Plumbing and Integrated Services',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'DreamFlush Plumbing and Integrated Services provides Plumber services at Jahi, Gwarinpa, Abuja. Rated 4.9/5 across 26 customer reviews.',
    'Plumber in Gwarinpa, Abuja',
    '+2347038870713',
    '+2347038870713',
    NULL,
    'Jahi, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Jahi']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'jahi', 'dreamflush plumbing and integrated services', 'chij6ruyurt1thariwc0ujeckeu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"DreamFlush Plumbing and Integrated Services","google_place_id":"ChIJ6RuyUrt1ThARiwc0UJecKEU","google_rating":4.9,"google_review_count":26,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ6RuyUrt1ThARiwc0UJecKEU' OR 
      (lower(trim(db.business_name)) = lower(trim('DreamFlush Plumbing and Integrated Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DreamFlush Plumbing and Integrated Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'DreamFlush Plumbing and Integrated Services provides Plumber services at Jahi, Gwarinpa, Abuja. Rated 4.9/5 across 26 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Jahi']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'jahi', 'dreamflush plumbing and integrated services', 'chij6ruyurt1thariwc0ujeckeu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Perfect Plumbing Services',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Perfect Plumbing Services provides Plumber services at 33 Williams Cres, AMAC, Abuja. Rated 4.9/5 across 13 customer reviews.',
    'Plumber in AMAC, Abuja',
    '+2348128038418',
    '+2348128038418',
    NULL,
    '33 Williams Cres, AMAC, Abuja (FCT)',
    'AMAC',
    'Abuja',
    'Nigeria',
    ARRAY['AMAC', 'Abuja', 'FCT', 'Abuja (FCT)', '33 Williams Cres']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'amac', 'abuja', 'fct', 'abuja (fct)', '33 williams cres', 'perfect plumbing services', 'chijc07zrvwlthardxizwybzujk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"AMAC","owner_full_name":"Perfect Plumbing Services","google_place_id":"ChIJC07ZRVwLThARDxiZwybzujk","google_rating":4.9,"google_review_count":13,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJC07ZRVwLThARDxiZwybzujk' OR 
      (lower(trim(db.business_name)) = lower(trim('Perfect Plumbing Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Perfect Plumbing Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Perfect Plumbing Services provides Plumber services at 33 Williams Cres, AMAC, Abuja. Rated 4.9/5 across 13 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['AMAC', 'Abuja', 'FCT', 'Abuja (FCT)', '33 Williams Cres']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'amac', 'abuja', 'fct', 'abuja (fct)', '33 williams cres', 'perfect plumbing services', 'chijc07zrvwlthardxizwybzujk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'EmmyOK plumber',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'EmmyOK plumber provides Plumber services at Kuchingoro, off Airport Rd, Abuja. Rated 4.9/5 across 15 customer reviews.',
    'Plumber in off Airport Rd, Abuja',
    '+2348100001318',
    '+2348100001318',
    NULL,
    'Kuchingoro, off Airport Rd, Abuja (FCT)',
    'off Airport Rd',
    'Abuja',
    'Nigeria',
    ARRAY['off Airport Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kuchingoro']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'off airport rd', 'abuja', 'fct', 'abuja (fct)', 'kuchingoro', 'emmyok plumber', 'chij7_8gonpztharnww2f4nccoa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"off Airport Rd","owner_full_name":"EmmyOK plumber","google_place_id":"ChIJ7_8gOnpzThARnWw2F4NccoA","google_rating":4.9,"google_review_count":15,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ7_8gOnpzThARnWw2F4NccoA' OR 
      (lower(trim(db.business_name)) = lower(trim('EmmyOK plumber')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('EmmyOK plumber'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'EmmyOK plumber provides Plumber services at Kuchingoro, off Airport Rd, Abuja. Rated 4.9/5 across 15 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['off Airport Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kuchingoro']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'off airport rd', 'abuja', 'fct', 'abuja (fct)', 'kuchingoro', 'emmyok plumber', 'chij7_8gonpztharnww2f4nccoa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'NBKASH PLUMBING SERVICES',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'NBKASH PLUMBING SERVICES provides Plumber services at Dape, Gwarinpa, Abuja. Rated 4.9/5 across 58 customer reviews.',
    'Plumber in Gwarinpa, Abuja',
    '+2348131613208',
    '+2348131613208',
    NULL,
    'Dape, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dape']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'dape', 'nbkash plumbing services', 'chijwba_xnd1thark8gdgd1wlds']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"NBKASH PLUMBING SERVICES","google_place_id":"ChIJWbA_xNd1ThARk8gdgd1wlDs","google_rating":4.9,"google_review_count":58,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJWbA_xNd1ThARk8gdgd1wlDs' OR 
      (lower(trim(db.business_name)) = lower(trim('NBKASH PLUMBING SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('NBKASH PLUMBING SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'NBKASH PLUMBING SERVICES provides Plumber services at Dape, Gwarinpa, Abuja. Rated 4.9/5 across 58 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dape']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'dape', 'nbkash plumbing services', 'chijwba_xnd1thark8gdgd1wlds']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Deco mechanical plumbing',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Deco mechanical plumbing provides Plumber services at Shop 280, Wuye Ultra Modern Market, Abuja. Rated 4.9/5 across 24 customer reviews.',
    'Plumber in Wuye Ultra Modern Market, Abuja',
    '+2348161301756',
    '+2348161301756',
    NULL,
    'Shop 280, Wuye Ultra Modern Market, Abuja (FCT)',
    'Wuye Ultra Modern Market',
    'Abuja',
    'Nigeria',
    ARRAY['Wuye Ultra Modern Market', 'Abuja', 'FCT', 'Abuja (FCT)', 'Shop 280']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'wuye ultra modern market', 'abuja', 'fct', 'abuja (fct)', 'shop 280', 'deco mechanical plumbing', 'chija3przqglthary1gkl5i6c3e']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuye Ultra Modern Market","owner_full_name":"Deco mechanical plumbing","google_place_id":"ChIJa3PrzqgLThARY1Gkl5I6c3E","google_rating":4.9,"google_review_count":24,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJa3PrzqgLThARY1Gkl5I6c3E' OR 
      (lower(trim(db.business_name)) = lower(trim('Deco mechanical plumbing')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Deco mechanical plumbing'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Deco mechanical plumbing provides Plumber services at Shop 280, Wuye Ultra Modern Market, Abuja. Rated 4.9/5 across 24 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Wuye Ultra Modern Market', 'Abuja', 'FCT', 'Abuja (FCT)', 'Shop 280']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'wuye ultra modern market', 'abuja', 'fct', 'abuja (fct)', 'shop 280', 'deco mechanical plumbing', 'chija3przqglthary1gkl5i6c3e']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Plumbing Services Abuja',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Plumbing Services Abuja provides Plumber services at 22 off Railway Rd, Kubwa, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Plumber in Kubwa, Abuja',
    '+2347038331270',
    '+2347038331270',
    NULL,
    '22 off Railway Rd, Kubwa, Abuja (FCT)',
    'Kubwa',
    'Abuja',
    'Nigeria',
    ARRAY['Kubwa', 'Abuja', 'FCT', 'Abuja (FCT)', '22 off Railway Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'kubwa', 'abuja', 'fct', 'abuja (fct)', '22 off railway rd', 'plumbing services abuja', 'chijzbuuh9oltharlrf58a1rhtc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Kubwa","owner_full_name":"Plumbing Services Abuja","google_place_id":"ChIJZbuuH9oLThARlRF58A1rHtc","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJZbuuH9oLThARlRF58A1rHtc' OR 
      (lower(trim(db.business_name)) = lower(trim('Plumbing Services Abuja')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Plumbing Services Abuja'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Plumbing Services Abuja provides Plumber services at 22 off Railway Rd, Kubwa, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Kubwa', 'Abuja', 'FCT', 'Abuja (FCT)', '22 off Railway Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'kubwa', 'abuja', 'fct', 'abuja (fct)', '22 off railway rd', 'plumbing services abuja', 'chijzbuuh9oltharlrf58a1rhtc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Salos Plumbing Nigeria Limited',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Salos Plumbing Nigeria Limited provides Plumber services at Dakwo, opp. Sunnyvale Estate, Abuja. Rated 4.9/5 across 8 customer reviews.',
    'Plumber in opp. Sunnyvale Estate, Abuja',
    '+2348031344242',
    '+2348031344242',
    NULL,
    'Dakwo, opp. Sunnyvale Estate, Abuja (FCT)',
    'opp. Sunnyvale Estate',
    'Abuja',
    'Nigeria',
    ARRAY['opp. Sunnyvale Estate', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dakwo']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'opp. sunnyvale estate', 'abuja', 'fct', 'abuja (fct)', 'dakwo', 'salos plumbing nigeria limited', 'chijs4_8ocwntharjb0av3qwz-y']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"opp. Sunnyvale Estate","owner_full_name":"Salos Plumbing Nigeria Limited","google_place_id":"ChIJs4_8oCwNThARjB0av3QwZ-Y","google_rating":4.9,"google_review_count":8,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJs4_8oCwNThARjB0av3QwZ-Y' OR 
      (lower(trim(db.business_name)) = lower(trim('Salos Plumbing Nigeria Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Salos Plumbing Nigeria Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Salos Plumbing Nigeria Limited provides Plumber services at Dakwo, opp. Sunnyvale Estate, Abuja. Rated 4.9/5 across 8 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['opp. Sunnyvale Estate', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dakwo']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'opp. sunnyvale estate', 'abuja', 'fct', 'abuja (fct)', 'dakwo', 'salos plumbing nigeria limited', 'chijs4_8ocwntharjb0av3qwz-y']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Sam D Electrical work and maintenance',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Sam D Electrical work and maintenance provides Electrician services at 45 Gana St, Maitama, Abuja. Rated 5.0/5 across 4 customer reviews.',
    'Electrician in Maitama, Abuja',
    '+2348036828394',
    '+2348036828394',
    NULL,
    '45 Gana St, Maitama, Abuja (FCT)',
    'Maitama',
    'Abuja',
    'Nigeria',
    ARRAY['Maitama', 'Abuja', 'FCT', 'Abuja (FCT)', '45 Gana St']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'maitama', 'abuja', 'fct', 'abuja (fct)', '45 gana st', 'sam d electrical work and maintenance', 'chijr0gxzv4ltharts2eajql5hw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Maitama","owner_full_name":"Sam D Electrical work and maintenance","google_place_id":"ChIJr0gxzV4LThARTS2eAJQl5hw","google_rating":5,"google_review_count":4,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJr0gxzV4LThARTS2eAJQl5hw' OR 
      (lower(trim(db.business_name)) = lower(trim('Sam D Electrical work and maintenance')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Sam D Electrical work and maintenance'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Sam D Electrical work and maintenance provides Electrician services at 45 Gana St, Maitama, Abuja. Rated 5.0/5 across 4 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Maitama', 'Abuja', 'FCT', 'Abuja (FCT)', '45 Gana St']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'maitama', 'abuja', 'fct', 'abuja (fct)', '45 gana st', 'sam d electrical work and maintenance', 'chijr0gxzv4ltharts2eajql5hw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Treeple-T Electrical service',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Treeple-T Electrical service provides Electrician services at 168 Aminu Kano Cres, Wuse 2, Abuja. Rated 5.0/5 across 3 customer reviews.',
    'Electrician in Wuse 2, Abuja',
    '+2347067976334',
    '+2347067976334',
    NULL,
    '168 Aminu Kano Cres, Wuse 2, Abuja (FCT)',
    'Wuse 2',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '168 Aminu Kano Cres']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '168 aminu kano cres', 'treeple-t electrical service', 'chij2zpg_1wltharmkcrgfmnizk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse 2","owner_full_name":"Treeple-T Electrical service","google_place_id":"ChIJ2zpg_1wLThARMKCrgfmnIZk","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ2zpg_1wLThARMKCrgfmnIZk' OR 
      (lower(trim(db.business_name)) = lower(trim('Treeple-T Electrical service')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Treeple-T Electrical service'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Treeple-T Electrical service provides Electrician services at 168 Aminu Kano Cres, Wuse 2, Abuja. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '168 Aminu Kano Cres']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '168 aminu kano cres', 'treeple-t electrical service', 'chij2zpg_1wltharmkcrgfmnizk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED provides Electrician services at Kur Mohammed Ave, Wuse, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Electrician in Wuse, Abuja',
    '+2347066059789',
    '+2347066059789',
    NULL,
    'Kur Mohammed Ave, Wuse, Abuja (FCT)',
    'Wuse',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kur Mohammed Ave']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'wuse', 'abuja', 'fct', 'abuja (fct)', 'kur mohammed ave', 'davnath electrical global resources limited', 'chija9fi5dqltharjz1nxu8nwbw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse","owner_full_name":"DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED","google_place_id":"ChIJA9FI5DQLThARjZ1nxU8NwBw","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJA9FI5DQLThARjZ1nxU8NwBw' OR 
      (lower(trim(db.business_name)) = lower(trim('DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'DAVNATH ELECTRICAL GLOBAL RESOURCES LIMITED provides Electrician services at Kur Mohammed Ave, Wuse, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kur Mohammed Ave']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'wuse', 'abuja', 'fct', 'abuja (fct)', 'kur mohammed ave', 'davnath electrical global resources limited', 'chija9fi5dqltharjz1nxu8nwbw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'AMBASSADOR MULTILINK ENTERPRISES',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'AMBASSADOR MULTILINK ENTERPRISES provides Electrician services at Apo Urban Market, Apo, Abuja. Rated 5.0/5 across 2 customer reviews.',
    'Electrician in Apo, Abuja',
    '+2347067159594',
    '+2347067159594',
    NULL,
    'Apo Urban Market, Apo, Abuja (FCT)',
    'Apo',
    'Abuja',
    'Nigeria',
    ARRAY['Apo', 'Abuja', 'FCT', 'Abuja (FCT)', 'Apo Urban Market']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'apo', 'abuja', 'fct', 'abuja (fct)', 'apo urban market', 'ambassador multilink enterprises', 'chiju7ukqgilthartevu_ihd3kk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Apo","owner_full_name":"AMBASSADOR MULTILINK ENTERPRISES","google_place_id":"ChIJu7UKqgILThARtEVu_ihD3kk","google_rating":5,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJu7UKqgILThARtEVu_ihD3kk' OR 
      (lower(trim(db.business_name)) = lower(trim('AMBASSADOR MULTILINK ENTERPRISES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('AMBASSADOR MULTILINK ENTERPRISES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'AMBASSADOR MULTILINK ENTERPRISES provides Electrician services at Apo Urban Market, Apo, Abuja. Rated 5.0/5 across 2 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Apo', 'Abuja', 'FCT', 'Abuja (FCT)', 'Apo Urban Market']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'apo', 'abuja', 'fct', 'abuja (fct)', 'apo urban market', 'ambassador multilink enterprises', 'chiju7ukqgilthartevu_ihd3kk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ABUJA ELECTRICAL CONTRACTORS BWARI',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'ABUJA ELECTRICAL CONTRACTORS BWARI provides Electrician services at Central Business District, Abuja. Rated 4.5/5 across 2 customer reviews. Note: no phone listed.',
    'Electrician in Central Business District, Abuja',
    NULL,
    NULL,
    NULL,
    'Central Business District, Abuja (FCT)',
    'Central Business District',
    'Abuja',
    'Nigeria',
    ARRAY['Central Business District', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'central business district', 'abuja', 'fct', 'abuja (fct)', 'abuja electrical contractors bwari', 'chija1ao1npdtrarfzd8q7jwp2q']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Central Business District","owner_full_name":"ABUJA ELECTRICAL CONTRACTORS BWARI","google_place_id":"ChIJa1Ao1NPdTRARfZd8q7JwP2Q","google_rating":4.5,"google_review_count":2,"notes":"no phone listed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJa1Ao1NPdTRARfZd8q7JwP2Q' OR 
      (lower(trim(db.business_name)) = lower(trim('ABUJA ELECTRICAL CONTRACTORS BWARI')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ABUJA ELECTRICAL CONTRACTORS BWARI'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'ABUJA ELECTRICAL CONTRACTORS BWARI provides Electrician services at Central Business District, Abuja. Rated 4.5/5 across 2 customer reviews. Note: no phone listed.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Central Business District', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'central business district', 'abuja', 'fct', 'abuja (fct)', 'abuja electrical contractors bwari', 'chija1ao1npdtrarfzd8q7jwp2q']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Evans All Electrical Abuja',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Evans All Electrical Abuja provides Electrician services at Plot 1033 CRD City, Lugbe, Abuja. Note: listed as car repair; no reviews.',
    'Electrician in Lugbe, Abuja',
    '+2348104160011',
    '+2348104160011',
    NULL,
    'Plot 1033 CRD City, Lugbe, Abuja (FCT)',
    'Lugbe',
    'Abuja',
    'Nigeria',
    ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 1033 CRD City']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'plot 1033 crd city', 'evans all electrical abuja', 'chij46apj3sltharao-qjdugjqy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lugbe","owner_full_name":"Evans All Electrical Abuja","google_place_id":"ChIJ46apJ3sLThARaO-qjdUgJqY","google_rating":null,"google_review_count":null,"notes":"listed as car repair; no reviews","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ46apJ3sLThARaO-qjdUgJqY' OR 
      (lower(trim(db.business_name)) = lower(trim('Evans All Electrical Abuja')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Evans All Electrical Abuja'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Evans All Electrical Abuja provides Electrician services at Plot 1033 CRD City, Lugbe, Abuja. Note: listed as car repair; no reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 1033 CRD City']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'plot 1033 crd city', 'evans all electrical abuja', 'chij46apj3sltharao-qjdugjqy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Kell Electricals Limited',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'Kell Electricals Limited provides Electrician services at 90 1st Ave, Gwarinpa, Abuja. Rated 4.4/5 across 41 customer reviews. Note: mixed reviews incl. non-delivery complaints.',
    'Electrician in Gwarinpa, Abuja',
    '+2348140205895',
    '+2348140205895',
    NULL,
    '90 1st Ave, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', '90 1st Ave']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', '90 1st ave', 'kell electricals limited', 'chijze5bvpalthars3gbqrvsg3m']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"Kell Electricals Limited","google_place_id":"ChIJZe5BVPALThARs3GbqRvSg3M","google_rating":4.4,"google_review_count":41,"notes":"mixed reviews incl. non-delivery complaints","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJZe5BVPALThARs3GbqRvSg3M' OR 
      (lower(trim(db.business_name)) = lower(trim('Kell Electricals Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Kell Electricals Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Kell Electricals Limited provides Electrician services at 90 1st Ave, Gwarinpa, Abuja. Rated 4.4/5 across 41 customer reviews. Note: mixed reviews incl. non-delivery complaints.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', '90 1st Ave']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', '90 1st ave', 'kell electricals limited', 'chijze5bvpalthars3gbqrvsg3m']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Focats Electric',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Focats Electric provides Electrician services at Kabusa, Lokogoma, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Electrician in Lokogoma, Abuja',
    '+2348118228844',
    '+2348118228844',
    NULL,
    'Kabusa, Lokogoma, Abuja (FCT)',
    'Lokogoma',
    'Abuja',
    'Nigeria',
    ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kabusa']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'kabusa', 'focats electric', 'chij_cnbqqmlthar-w8-hg4fev8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lokogoma","owner_full_name":"Focats Electric","google_place_id":"ChIJ_cNBQqMLThAR-w8-HG4FEv8","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_cNBQqMLThAR-w8-HG4FEv8' OR 
      (lower(trim(db.business_name)) = lower(trim('Focats Electric')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Focats Electric'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Focats Electric provides Electrician services at Kabusa, Lokogoma, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kabusa']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'kabusa', 'focats electric', 'chij_cnbqqmlthar-w8-hg4fev8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'De Ebumars Innovation Ltd',
    'business',
    'Electrician & Solar Contracting',
    'Electrician · Solar installer',
    'De Ebumars Innovation Ltd provides Electrician · Solar installer services at Platinum Mega Mall, Jahi, Kado, Abuja. Rated 4.8/5 across 479 customer reviews. Note: also CCTV and smart home.',
    'Electrician · Solar installer in Kado, Abuja',
    '+2348038681101',
    '+2348038681101',
    NULL,
    'Platinum Mega Mall, Jahi, Kado, Abuja (FCT)',
    'Kado',
    'Abuja',
    'Nigeria',
    ARRAY['Kado', 'Abuja', 'FCT', 'Abuja (FCT)', 'Platinum Mega Mall', 'Jahi']::TEXT[],
    ARRAY['Electrician', 'Solar installer', 'Electrician & Solar Contracting']::TEXT[],
    ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'cctv & smart home systems', 'kado', 'abuja', 'fct', 'abuja (fct)', 'platinum mega mall', 'jahi', 'de ebumars innovation ltd', 'chijce0pvajftrar8zcmg3093me']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Kado","owner_full_name":"De Ebumars Innovation Ltd","google_place_id":"ChIJCe0PVAjfTRAR8zcMg3093mE","google_rating":4.8,"google_review_count":479,"notes":"also CCTV and smart home","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJCe0PVAjfTRAR8zcMg3093mE' OR 
      (lower(trim(db.business_name)) = lower(trim('De Ebumars Innovation Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('De Ebumars Innovation Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrician & Solar Contracting',
  'De Ebumars Innovation Ltd provides Electrician · Solar installer services at Platinum Mega Mall, Jahi, Kado, Abuja. Rated 4.8/5 across 479 customer reviews. Note: also CCTV and smart home.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance', 'Solar installer', 'Solar Installer', 'Solar Inverter Installation']::TEXT[],
  'Request a Quote',
  ARRAY['Kado', 'Abuja', 'FCT', 'Abuja (FCT)', 'Platinum Mega Mall', 'Jahi']::TEXT[],
  ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'cctv & smart home systems', 'kado', 'abuja', 'fct', 'abuja (fct)', 'platinum mega mall', 'jahi', 'de ebumars innovation ltd', 'chijce0pvajftrar8zcmg3093me']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'OKEH POWER TECH LTD',
    'business',
    'Electrician & Solar Contracting',
    'Electrician · Solar installer',
    'OKEH POWER TECH LTD provides Electrician · Solar installer services at World Mart Plaza, Area 1, Abuja. Rated 4.9/5 across 60 customer reviews. Note: industrial solar.',
    'Electrician · Solar installer in Area 1, Abuja',
    '+2348169554360',
    '+2348169554360',
    NULL,
    'World Mart Plaza, Area 1, Abuja (FCT)',
    'Area 1',
    'Abuja',
    'Nigeria',
    ARRAY['Area 1', 'Abuja', 'FCT', 'Abuja (FCT)', 'World Mart Plaza']::TEXT[],
    ARRAY['Electrician', 'Solar installer', 'Electrician & Solar Contracting']::TEXT[],
    ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'area 1', 'abuja', 'fct', 'abuja (fct)', 'world mart plaza', 'okeh power tech ltd', 'chijoch7u44ntharmy-skpjuvzo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Area 1","owner_full_name":"OKEH POWER TECH LTD","google_place_id":"ChIJOch7U44NThARMy-sKPJuVZo","google_rating":4.9,"google_review_count":60,"notes":"industrial solar","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJOch7U44NThARMy-sKPJuVZo' OR 
      (lower(trim(db.business_name)) = lower(trim('OKEH POWER TECH LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('OKEH POWER TECH LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrician & Solar Contracting',
  'OKEH POWER TECH LTD provides Electrician · Solar installer services at World Mart Plaza, Area 1, Abuja. Rated 4.9/5 across 60 customer reviews. Note: industrial solar.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance', 'Solar installer', 'Solar Installer', 'Solar Inverter Installation']::TEXT[],
  'Request a Quote',
  ARRAY['Area 1', 'Abuja', 'FCT', 'Abuja (FCT)', 'World Mart Plaza']::TEXT[],
  ARRAY['electrician', 'solar installer', 'electrical wiring & troubleshooting', 'power maintenance', 'solar inverter installation', 'battery & panel setup', 'area 1', 'abuja', 'fct', 'abuja (fct)', 'world mart plaza', 'okeh power tech ltd', 'chijoch7u44ntharmy-skpjuvzo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'The Carpenter',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'The Carpenter provides Carpenter services at Praf Mall, 168 Aminu Kano Cres, Wuse 2, Abuja. Rated 5.0/5 across 8 customer reviews.',
    'Carpenter in Wuse 2, Abuja',
    '+2348099245000',
    '+2348099245000',
    NULL,
    'Praf Mall, 168 Aminu Kano Cres, Wuse 2, Abuja (FCT)',
    'Wuse 2',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', 'Praf Mall', '168 Aminu Kano Cres']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', 'praf mall', '168 aminu kano cres', 'the carpenter', 'chij89je3qaltharn6jmimu_oky']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse 2","owner_full_name":"The Carpenter","google_place_id":"ChIJ89je3QALThARn6jmiMU_OkY","google_rating":5,"google_review_count":8,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ89je3QALThARn6jmiMU_OkY' OR 
      (lower(trim(db.business_name)) = lower(trim('The Carpenter')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('The Carpenter'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'The Carpenter provides Carpenter services at Praf Mall, 168 Aminu Kano Cres, Wuse 2, Abuja. Rated 5.0/5 across 8 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', 'Praf Mall', '168 Aminu Kano Cres']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', 'praf mall', '168 aminu kano cres', 'the carpenter', 'chij89je3qaltharn6jmimu_oky']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Sagesse De Dieu Limited',
    'business',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Sagesse De Dieu Limited provides Carpenter services at Biggie St, Dei-Dei, Madalla, Abuja. Rated 5.0/5 across 8 customer reviews.',
    'Carpenter in Madalla, Abuja',
    '+2348099999369',
    '+2348099999369',
    NULL,
    'Biggie St, Dei-Dei, Madalla, Abuja (FCT)',
    'Madalla',
    'Abuja',
    'Nigeria',
    ARRAY['Madalla', 'Abuja', 'FCT', 'Abuja (FCT)', 'Biggie St', 'Dei-Dei']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'madalla', 'abuja', 'fct', 'abuja (fct)', 'biggie st', 'dei-dei', 'sagesse de dieu limited', 'chijw9h_gcf3tharmdrfo_orzxk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Madalla","owner_full_name":"Sagesse De Dieu Limited","google_place_id":"ChIJW9h_gcF3ThARMdRfO_OrZxk","google_rating":5,"google_review_count":8,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJW9h_gcF3ThARMdRfO_OrZxk' OR 
      (lower(trim(db.business_name)) = lower(trim('Sagesse De Dieu Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Sagesse De Dieu Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Sagesse De Dieu Limited provides Carpenter services at Biggie St, Dei-Dei, Madalla, Abuja. Rated 5.0/5 across 8 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Madalla', 'Abuja', 'FCT', 'Abuja (FCT)', 'Biggie St', 'Dei-Dei']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'madalla', 'abuja', 'fct', 'abuja (fct)', 'biggie st', 'dei-dei', 'sagesse de dieu limited', 'chijw9h_gcf3tharmdrfo_orzxk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'iVantage Custom Woodwork',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'iVantage Custom Woodwork provides Carpenter services at Kugbo Furniture Market, Abuja. Rated 4.9/5 across 9 customer reviews.',
    'Carpenter in Kugbo Furniture Market, Abuja',
    '+2349066630552',
    '+2349066630552',
    NULL,
    'Kugbo Furniture Market, Abuja (FCT)',
    'Kugbo Furniture Market',
    'Abuja',
    'Nigeria',
    ARRAY['Kugbo Furniture Market', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'kugbo furniture market', 'abuja', 'fct', 'abuja (fct)', 'ivantage custom woodwork', 'chij6rsklzjztharkzanuim7wwg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Kugbo Furniture Market","owner_full_name":"iVantage Custom Woodwork","google_place_id":"ChIJ6RsklzJzThARkzAnuIm7wWg","google_rating":4.9,"google_review_count":9,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ6RsklzJzThARkzAnuIm7wWg' OR 
      (lower(trim(db.business_name)) = lower(trim('iVantage Custom Woodwork')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('iVantage Custom Woodwork'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'iVantage Custom Woodwork provides Carpenter services at Kugbo Furniture Market, Abuja. Rated 4.9/5 across 9 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Kugbo Furniture Market', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'kugbo furniture market', 'abuja', 'fct', 'abuja (fct)', 'ivantage custom woodwork', 'chij6rsklzjztharkzanuim7wwg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'The Carpenter''s House',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'The Carpenter''s House provides Carpenter services at Plot 75 K Cl, 1st Ave, Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Carpenter in Gwarinpa, Abuja',
    '+2348065588587',
    '+2348065588587',
    NULL,
    'Plot 75 K Cl, 1st Ave, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 75 K Cl', '1st Ave']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'plot 75 k cl', '1st ave', 'the carpenter''s house', 'chij9x8aiqzftrarwtizjgq01ay']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"The Carpenter''s House","google_place_id":"ChIJ9X8AiQzfTRARwtizjgQ01AY","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ9X8AiQzfTRARwtizjgQ01AY' OR 
      (lower(trim(db.business_name)) = lower(trim('The Carpenter''s House')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('The Carpenter''s House'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'The Carpenter''s House provides Carpenter services at Plot 75 K Cl, 1st Ave, Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 75 K Cl', '1st Ave']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'plot 75 k cl', '1st ave', 'the carpenter''s house', 'chij9x8aiqzftrarwtizjgq01ay']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Lane 7',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Lane 7 provides Carpenter services at 13 Fez St, Wuse 2, Abuja. Rated 4.8/5 across 63 customer reviews. Note: furniture store; one review complains of no quote follow-up.',
    'Carpenter in Wuse 2, Abuja',
    '+2348170005263',
    '+2348170005263',
    NULL,
    '13 Fez St, Wuse 2, Abuja (FCT)',
    'Wuse 2',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '13 Fez St']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '13 fez st', 'lane 7', 'chijm8txdbsltharhatmgq_ry90']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse 2","owner_full_name":"Lane 7","google_place_id":"ChIJM8TxDbsLThARhAtmGQ_RY90","google_rating":4.8,"google_review_count":63,"notes":"furniture store; one review complains of no quote follow-up","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJM8TxDbsLThARhAtmGQ_RY90' OR 
      (lower(trim(db.business_name)) = lower(trim('Lane 7')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Lane 7'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Lane 7 provides Carpenter services at 13 Fez St, Wuse 2, Abuja. Rated 4.8/5 across 63 customer reviews. Note: furniture store; one review complains of no quote follow-up.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication', 'Custom Furniture']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '13 Fez St']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '13 fez st', 'lane 7', 'chijm8txdbsltharhatmgq_ry90']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Richwood Carpentry Nigeria Ltd',
    'business',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Richwood Carpentry Nigeria Ltd provides Carpenter services at Suite 317a DBB Plaza, Gwarinpa, Abuja. Rated 5.0/5 across 2 customer reviews. Note: UK phone number.',
    'Carpenter in Gwarinpa, Abuja',
    '+447404380349',
    '+447404380349',
    NULL,
    'Suite 317a DBB Plaza, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Suite 317a DBB Plaza']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'suite 317a dbb plaza', 'richwood carpentry nigeria ltd', 'chijqxfbiix1tharq5o7uf8eago']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"Richwood Carpentry Nigeria Ltd","google_place_id":"ChIJqxFbIix1ThARq5o7Uf8eaGo","google_rating":5,"google_review_count":2,"notes":"UK phone number","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJqxFbIix1ThARq5o7Uf8eaGo' OR 
      (lower(trim(db.business_name)) = lower(trim('Richwood Carpentry Nigeria Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Richwood Carpentry Nigeria Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Richwood Carpentry Nigeria Ltd provides Carpenter services at Suite 317a DBB Plaza, Gwarinpa, Abuja. Rated 5.0/5 across 2 customer reviews. Note: UK phone number.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'Suite 317a DBB Plaza']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'suite 317a dbb plaza', 'richwood carpentry nigeria ltd', 'chijqxfbiix1tharq5o7uf8eago']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    '99 Rain Projects',
    'business',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    '99 Rain Projects provides Carpenter services at 4 Oshogbo Cl, Garki Area 11, Abuja. Rated 4.9/5 across 24 customer reviews. Note: furniture.',
    'Carpenter in Garki Area 11, Abuja',
    '+2349026366660',
    '+2349026366660',
    NULL,
    '4 Oshogbo Cl, Garki Area 11, Abuja (FCT)',
    'Garki Area 11',
    'Abuja',
    'Nigeria',
    ARRAY['Garki Area 11', 'Abuja', 'FCT', 'Abuja (FCT)', '4 Oshogbo Cl']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'garki area 11', 'abuja', 'fct', 'abuja (fct)', '4 oshogbo cl', '99 rain projects', 'chij8ycxaliltharpyxfcgs-un4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki Area 11","owner_full_name":"99 Rain Projects","google_place_id":"ChIJ8YCxalILThARpyXfCgs-Un4","google_rating":4.9,"google_review_count":24,"notes":"furniture","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ8YCxalILThARpyXfCgs-Un4' OR 
      (lower(trim(db.business_name)) = lower(trim('99 Rain Projects')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('99 Rain Projects'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  '99 Rain Projects provides Carpenter services at 4 Oshogbo Cl, Garki Area 11, Abuja. Rated 4.9/5 across 24 customer reviews. Note: furniture.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication', 'Custom Furniture']::TEXT[],
  'Request a Quote',
  ARRAY['Garki Area 11', 'Abuja', 'FCT', 'Abuja (FCT)', '4 Oshogbo Cl']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'garki area 11', 'abuja', 'fct', 'abuja (fct)', '4 oshogbo cl', '99 rain projects', 'chij8ycxaliltharpyxfcgs-un4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Helobcapitols Constructions & interior design',
    'professional',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Helobcapitols Constructions & interior design provides Carpenter services at MKK Plaza, Apo, Gudu, Abuja. Rated 5.0/5 across 11 customer reviews. Note: interior design and cabinetry.',
    'Carpenter in Gudu, Abuja',
    '+2348132300106',
    '+2348132300106',
    NULL,
    'MKK Plaza, Apo, Gudu, Abuja (FCT)',
    'Gudu',
    'Abuja',
    'Nigeria',
    ARRAY['Gudu', 'Abuja', 'FCT', 'Abuja (FCT)', 'MKK Plaza', 'Apo']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'interior design & cabinetry', 'gudu', 'abuja', 'fct', 'abuja (fct)', 'mkk plaza', 'apo', 'helobcapitols constructions & interior design', 'chijt9weqtcnthar7az3vsl2qhi']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gudu","owner_full_name":"Helobcapitols Constructions & interior design","google_place_id":"ChIJt9WeQTcNThAR7Az3vsL2QHI","google_rating":5,"google_review_count":11,"notes":"interior design and cabinetry","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJt9WeQTcNThAR7Az3vsL2QHI' OR 
      (lower(trim(db.business_name)) = lower(trim('Helobcapitols Constructions & interior design')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Helobcapitols Constructions & interior design'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Helobcapitols Constructions & interior design provides Carpenter services at MKK Plaza, Apo, Gudu, Abuja. Rated 5.0/5 across 11 customer reviews. Note: interior design and cabinetry.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication', 'Interior Design & Cabinetry']::TEXT[],
  'Request a Quote',
  ARRAY['Gudu', 'Abuja', 'FCT', 'Abuja (FCT)', 'MKK Plaza', 'Apo']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'interior design & cabinetry', 'gudu', 'abuja', 'fct', 'abuja (fct)', 'mkk plaza', 'apo', 'helobcapitols constructions & interior design', 'chijt9weqtcnthar7az3vsl2qhi']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Najcarpentry',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Najcarpentry provides Carpenter services at Deidei Market, Abuja.',
    'Carpenter in Deidei Market, Abuja',
    '+2347081521648',
    '+2347081521648',
    NULL,
    'Deidei Market, Abuja (FCT)',
    'Deidei Market',
    'Abuja',
    'Nigeria',
    ARRAY['Deidei Market', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'deidei market', 'abuja', 'fct', 'abuja (fct)', 'najcarpentry', 'chijz-yuwemltharp9jt-nmy6tm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Deidei Market","owner_full_name":"Najcarpentry","google_place_id":"ChIJz-YuWEMLThARP9Jt-NmY6tM","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJz-YuWEMLThARP9Jt-NmY6tM' OR 
      (lower(trim(db.business_name)) = lower(trim('Najcarpentry')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Najcarpentry'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Najcarpentry provides Carpenter services at Deidei Market, Abuja.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Deidei Market', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'deidei market', 'abuja', 'fct', 'abuja (fct)', 'najcarpentry', 'chijz-yuwemltharp9jt-nmy6tm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Furniture City Abuja',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Furniture City Abuja provides Carpenter services at Sunnyvale Junction, Lokogoma, Abuja. Rated 5.0/5 across 2 customer reviews.',
    'Carpenter in Lokogoma, Abuja',
    '+2347037225977',
    '+2347037225977',
    NULL,
    'Sunnyvale Junction, Lokogoma, Abuja (FCT)',
    'Lokogoma',
    'Abuja',
    'Nigeria',
    ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Sunnyvale Junction']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'sunnyvale junction', 'furniture city abuja', 'chij8rndo-clthar2cg_gsf3vi4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lokogoma","owner_full_name":"Furniture City Abuja","google_place_id":"ChIJ8RndO-cLThAR2cg_gsf3vi4","google_rating":5,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ8RndO-cLThAR2cg_gsf3vi4' OR 
      (lower(trim(db.business_name)) = lower(trim('Furniture City Abuja')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Furniture City Abuja'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Furniture City Abuja provides Carpenter services at Sunnyvale Junction, Lokogoma, Abuja. Rated 5.0/5 across 2 customer reviews.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Sunnyvale Junction']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'sunnyvale junction', 'furniture city abuja', 'chij8rndo-clthar2cg_gsf3vi4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Designfab Metal Works Ltd.',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Designfab Metal Works Ltd. provides Welder services at Beside Platinum Mega Mall, Katampe Rd, Abuja. Rated 4.4/5 across 14 customer reviews. Note: mixed reviews incl. two fraud complaints.',
    'Welder in Katampe Rd, Abuja',
    '+2348104149992',
    '+2348104149992',
    NULL,
    'Beside Platinum Mega Mall, Katampe Rd, Abuja (FCT)',
    'Katampe Rd',
    'Abuja',
    'Nigeria',
    ARRAY['Katampe Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Beside Platinum Mega Mall']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'katampe rd', 'abuja', 'fct', 'abuja (fct)', 'beside platinum mega mall', 'designfab metal works ltd.', 'chijfzw0llxztrarnldnzy_gybq']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Katampe Rd","owner_full_name":"Designfab Metal Works Ltd.","google_place_id":"ChIJfzw0llXZTRARNLdNZY_gYbQ","google_rating":4.4,"google_review_count":14,"notes":"mixed reviews incl. two fraud complaints","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJfzw0llXZTRARNLdNZY_gYbQ' OR 
      (lower(trim(db.business_name)) = lower(trim('Designfab Metal Works Ltd.')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Designfab Metal Works Ltd.'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Designfab Metal Works Ltd. provides Welder services at Beside Platinum Mega Mall, Katampe Rd, Abuja. Rated 4.4/5 across 14 customer reviews. Note: mixed reviews incl. two fraud complaints.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Katampe Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Beside Platinum Mega Mall']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'katampe rd', 'abuja', 'fct', 'abuja (fct)', 'beside platinum mega mall', 'designfab metal works ltd.', 'chijfzw0llxztrarnldnzy_gybq']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Chrisamarich nig ltd',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Chrisamarich nig ltd provides Welder services at Dakwo, Lokogoma, Abuja. Rated 5.0/5 across 3 customer reviews.',
    'Welder in Lokogoma, Abuja',
    '+2348036144742',
    '+2348036144742',
    NULL,
    'Dakwo, Lokogoma, Abuja (FCT)',
    'Lokogoma',
    'Abuja',
    'Nigeria',
    ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dakwo']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'dakwo', 'chrisamarich nig ltd', 'chijs0oqpoontharj9vxyovfbd4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lokogoma","owner_full_name":"Chrisamarich nig ltd","google_place_id":"ChIJs0OqPOoNThARJ9vxYovFBD4","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJs0OqPOoNThARJ9vxYovFBD4' OR 
      (lower(trim(db.business_name)) = lower(trim('Chrisamarich nig ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Chrisamarich nig ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Chrisamarich nig ltd provides Welder services at Dakwo, Lokogoma, Abuja. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Lokogoma', 'Abuja', 'FCT', 'Abuja (FCT)', 'Dakwo']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lokogoma', 'abuja', 'fct', 'abuja (fct)', 'dakwo', 'chrisamarich nig ltd', 'chijs0oqpoontharj9vxyovfbd4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'YOUNGDON NIG LTD',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'YOUNGDON NIG LTD provides Welder services at Airport Rd, Lugbe, Abuja. Rated 5.0/5 across 5 customer reviews.',
    'Welder in Lugbe, Abuja',
    '+2349077165579',
    '+2349077165579',
    NULL,
    'Airport Rd, Lugbe, Abuja (FCT)',
    'Lugbe',
    'Abuja',
    'Nigeria',
    ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Airport Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'airport rd', 'youngdon nig ltd', 'chijcbokptvztharhtu5xvwqqjy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lugbe","owner_full_name":"YOUNGDON NIG LTD","google_place_id":"ChIJcbOkPtVzThARHtu5XVwQqjY","google_rating":5,"google_review_count":5,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJcbOkPtVzThARHtu5XVwQqjY' OR 
      (lower(trim(db.business_name)) = lower(trim('YOUNGDON NIG LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('YOUNGDON NIG LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'YOUNGDON NIG LTD provides Welder services at Airport Rd, Lugbe, Abuja. Rated 5.0/5 across 5 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Airport Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'airport rd', 'youngdon nig ltd', 'chijcbokptvztharhtu5xvwqqjy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Extreme Fabrication & welding',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Extreme Fabrication & welding provides Welder services at Gbesa, Airport Rd, Abuja. Rated 5.0/5 across 4 customer reviews.',
    'Welder in Airport Rd, Abuja',
    '+2348087228747',
    '+2348087228747',
    NULL,
    'Gbesa, Airport Rd, Abuja (FCT)',
    'Airport Rd',
    'Abuja',
    'Nigeria',
    ARRAY['Airport Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Gbesa']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'airport rd', 'abuja', 'fct', 'abuja (fct)', 'gbesa', 'extreme fabrication & welding', 'chij_tmkmgbltharm6ber6-mkoa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Airport Rd","owner_full_name":"Extreme Fabrication & welding","google_place_id":"ChIJ_TMKMgBlThARM6Ber6-mkoA","google_rating":5,"google_review_count":4,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_TMKMgBlThARM6Ber6-mkoA' OR 
      (lower(trim(db.business_name)) = lower(trim('Extreme Fabrication & welding')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Extreme Fabrication & welding'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Extreme Fabrication & welding provides Welder services at Gbesa, Airport Rd, Abuja. Rated 5.0/5 across 4 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Airport Rd', 'Abuja', 'FCT', 'Abuja (FCT)', 'Gbesa']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'airport rd', 'abuja', 'fct', 'abuja (fct)', 'gbesa', 'extreme fabrication & welding', 'chij_tmkmgbltharm6ber6-mkoa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Godwin Welding Construction',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Godwin Welding Construction provides Welder services at Lugbe, Abuja. Rated 5.0/5 across 5 customer reviews.',
    'Welder in Lugbe, Abuja',
    '+2348121163001',
    '+2348121163001',
    NULL,
    'Lugbe, Abuja (FCT)',
    'Lugbe',
    'Abuja',
    'Nigeria',
    ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'godwin welding construction', 'chijxaqiwfeltharkmwkbpsl59s']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lugbe","owner_full_name":"Godwin Welding Construction","google_place_id":"ChIJXaqiwfELThARkmwKbpSl59s","google_rating":5,"google_review_count":5,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJXaqiwfELThARkmwKbpSl59s' OR 
      (lower(trim(db.business_name)) = lower(trim('Godwin Welding Construction')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Godwin Welding Construction'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Godwin Welding Construction provides Welder services at Lugbe, Abuja. Rated 5.0/5 across 5 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'godwin welding construction', 'chijxaqiwfeltharkmwkbpsl59s']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Emmanuel Welding and fabrications',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Emmanuel Welding and fabrications provides Welder services at Opp. Medimax Hospital, Garki, Abuja. Rated 4.0/5 across 8 customer reviews. Note: mixed reviews incl. a dishonesty complaint; no phone listed.',
    'Welder in Garki, Abuja',
    NULL,
    NULL,
    NULL,
    'Opp. Medimax Hospital, Garki, Abuja (FCT)',
    'Garki',
    'Abuja',
    'Nigeria',
    ARRAY['Garki', 'Abuja', 'FCT', 'Abuja (FCT)', 'Opp. Medimax Hospital']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'garki', 'abuja', 'fct', 'abuja (fct)', 'opp. medimax hospital', 'emmanuel welding and fabrications', 'chijwyea5u0ntharvdf-_gcxtes']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki","owner_full_name":"Emmanuel Welding and fabrications","google_place_id":"ChIJWyeA5u0NThARvDF-_gcXTEs","google_rating":4,"google_review_count":8,"notes":"mixed reviews incl. a dishonesty complaint; no phone listed","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJWyeA5u0NThARvDF-_gcXTEs' OR 
      (lower(trim(db.business_name)) = lower(trim('Emmanuel Welding and fabrications')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Emmanuel Welding and fabrications'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Emmanuel Welding and fabrications provides Welder services at Opp. Medimax Hospital, Garki, Abuja. Rated 4.0/5 across 8 customer reviews. Note: mixed reviews incl. a dishonesty complaint; no phone listed.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Garki', 'Abuja', 'FCT', 'Abuja (FCT)', 'Opp. Medimax Hospital']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'garki', 'abuja', 'fct', 'abuja (fct)', 'opp. medimax hospital', 'emmanuel welding and fabrications', 'chijwyea5u0ntharvdf-_gcxtes']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'PAM WELDER',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'PAM WELDER provides Welder services at Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Gwarinpa, Abuja',
    '+2348067735495',
    '+2348067735495',
    NULL,
    'Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'pam welder', 'chijje4amwb1tharq-xtyjsmy_w']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"PAM WELDER","google_place_id":"ChIJje4AMwB1ThARq-XTYJSMy_w","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJje4AMwB1ThARq-XTYJSMy_w' OR 
      (lower(trim(db.business_name)) = lower(trim('PAM WELDER')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('PAM WELDER'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'PAM WELDER provides Welder services at Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'pam welder', 'chijje4amwb1tharq-xtyjsmy_w']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Lifemark welding and fabrication Nigeria limited',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Lifemark welding and fabrication Nigeria limited provides Welder services at Galadimawa, Abuja. Rated 5.0/5 across 2 customer reviews.',
    'Welder in Galadimawa, Abuja',
    '+2349015140433',
    '+2349015140433',
    NULL,
    'Galadimawa, Abuja (FCT)',
    'Galadimawa',
    'Abuja',
    'Nigeria',
    ARRAY['Galadimawa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'galadimawa', 'abuja', 'fct', 'abuja (fct)', 'lifemark welding and fabrication nigeria limited', 'chijncbtxt5zthar7kzm_qrraii']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Galadimawa","owner_full_name":"Lifemark welding and fabrication Nigeria limited","google_place_id":"ChIJNcBTXt5zThAR7kZM_QrrAII","google_rating":5,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJNcBTXt5zThAR7kZM_QrrAII' OR 
      (lower(trim(db.business_name)) = lower(trim('Lifemark welding and fabrication Nigeria limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Lifemark welding and fabrication Nigeria limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Lifemark welding and fabrication Nigeria limited provides Welder services at Galadimawa, Abuja. Rated 5.0/5 across 2 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Galadimawa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'galadimawa', 'abuja', 'fct', 'abuja (fct)', 'lifemark welding and fabrication nigeria limited', 'chijncbtxt5zthar7kzm_qrraii']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ENES Welding and Fabrication',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'ENES Welding and Fabrication provides Welder services at Gosa, Abuja.',
    'Welder in Gosa, Abuja',
    '+2347089698049',
    '+2347089698049',
    NULL,
    'Gosa, Abuja (FCT)',
    'Gosa',
    'Abuja',
    'Nigeria',
    ARRAY['Gosa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'gosa', 'abuja', 'fct', 'abuja (fct)', 'enes welding and fabrication', 'chijl6ostbfzthar9_lgzqccpk0']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gosa","owner_full_name":"ENES Welding and Fabrication","google_place_id":"ChIJL6oStBFzThAR9_LgzqCcpK0","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJL6oStBFzThAR9_LgzqCcpK0' OR 
      (lower(trim(db.business_name)) = lower(trim('ENES Welding and Fabrication')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ENES Welding and Fabrication'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'ENES Welding and Fabrication provides Welder services at Gosa, Abuja.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Gosa', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'gosa', 'abuja', 'fct', 'abuja (fct)', 'enes welding and fabrication', 'chijl6ostbfzthar9_lgzqccpk0']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Iron metal eldad',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Iron metal eldad provides Welder services at Utako, Abuja. Rated 5.0/5 across 3 customer reviews.',
    'Welder in Utako, Abuja',
    '+2348188210158',
    '+2348188210158',
    NULL,
    'Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'utako', 'abuja', 'fct', 'abuja (fct)', 'iron metal eldad', 'chijdxhksrz1tharqb-jswglsza']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"Iron metal eldad","google_place_id":"ChIJdxhksrZ1ThARqb-jswGlSzA","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJdxhksrZ1ThARqb-jswGlSzA' OR 
      (lower(trim(db.business_name)) = lower(trim('Iron metal eldad')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Iron metal eldad'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Iron metal eldad provides Welder services at Utako, Abuja. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'utako', 'abuja', 'fct', 'abuja (fct)', 'iron metal eldad', 'chijdxhksrz1tharqb-jswglsza']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Iran Femi',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Iran Femi provides Tailor / Fashion designer services at 33 Dan Suleiman, Utako, Abuja. Rated 5.0/5 across 60 customer reviews.',
    'Tailor / Fashion designer in Utako, Abuja',
    '+2348165744968',
    '+2348165744968',
    NULL,
    '33 Dan Suleiman, Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', '33 Dan Suleiman']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', '33 dan suleiman', 'iran femi', 'chijlxxezjhztharltukpxvao8e']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"Iran Femi","google_place_id":"ChIJlXXEZjhzThARLTukPxVAo8E","google_rating":5,"google_review_count":60,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJlXXEZjhzThARLTukPxVAo8E' OR 
      (lower(trim(db.business_name)) = lower(trim('Iran Femi')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Iran Femi'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Iran Femi provides Tailor / Fashion designer services at 33 Dan Suleiman, Utako, Abuja. Rated 5.0/5 across 60 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', '33 Dan Suleiman']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', '33 dan suleiman', 'iran femi', 'chijlxxezjhztharltukpxvao8e']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Tailoredbydimples',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Tailoredbydimples provides Tailor / Fashion designer services at Eden Parks & Gardens, Utako, Abuja. Rated 5.0/5 across 84 customer reviews.',
    'Tailor / Fashion designer in Utako, Abuja',
    '+2347033249855',
    '+2347033249855',
    NULL,
    'Eden Parks & Gardens, Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Eden Parks & Gardens']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', 'eden parks & gardens', 'tailoredbydimples', 'chijqz2lrpqltharjqyvgx38tyi']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"Tailoredbydimples","google_place_id":"ChIJqZ2lRPQLThARJQyVgX38tyI","google_rating":5,"google_review_count":84,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJqZ2lRPQLThARJQyVgX38tyI' OR 
      (lower(trim(db.business_name)) = lower(trim('Tailoredbydimples')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Tailoredbydimples'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Tailoredbydimples provides Tailor / Fashion designer services at Eden Parks & Gardens, Utako, Abuja. Rated 5.0/5 across 84 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Eden Parks & Gardens']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', 'eden parks & gardens', 'tailoredbydimples', 'chijqz2lrpqltharjqyvgx38tyi']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'T''trell Fashion House & Academy',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'T''trell Fashion House & Academy provides Tailor / Fashion designer services at Wuye, Abuja. Rated 5.0/5 across 140 customer reviews. Note: also a fashion academy.',
    'Tailor / Fashion designer in Wuye, Abuja',
    '+2347069457950',
    '+2347069457950',
    NULL,
    'Wuye, Abuja (FCT)',
    'Wuye',
    'Abuja',
    'Nigeria',
    ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'wuye', 'abuja', 'fct', 'abuja (fct)', 't''trell fashion house & academy', 'chijyevno1ultharv2vlewffvnc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuye","owner_full_name":"T''trell Fashion House & Academy","google_place_id":"ChIJyeVnO1ULThARV2vleWfFvNc","google_rating":5,"google_review_count":140,"notes":"also a fashion academy","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJyeVnO1ULThARV2vleWfFvNc' OR 
      (lower(trim(db.business_name)) = lower(trim('T''trell Fashion House & Academy')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('T''trell Fashion House & Academy'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'T''trell Fashion House & Academy provides Tailor / Fashion designer services at Wuye, Abuja. Rated 5.0/5 across 140 customer reviews. Note: also a fashion academy.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'wuye', 'abuja', 'fct', 'abuja (fct)', 't''trell fashion house & academy', 'chijyevno1ultharv2vlewffvnc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'QueenTee Fashion & Beauty Empire',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'QueenTee Fashion & Beauty Empire provides Tailor / Fashion designer services at 7B Oka-Akoko St, Garki 2, Abuja. Rated 4.7/5 across 151 customer reviews. Note: fashion plus salon/spa.',
    'Tailor / Fashion designer in Garki 2, Abuja',
    '+2349027683339',
    '+2349027683339',
    NULL,
    '7B Oka-Akoko St, Garki 2, Abuja (FCT)',
    'Garki 2',
    'Abuja',
    'Nigeria',
    ARRAY['Garki 2', 'Abuja', 'FCT', 'Abuja (FCT)', '7B Oka-Akoko St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'beauty salon & spa', 'garki 2', 'abuja', 'fct', 'abuja (fct)', '7b oka-akoko st', 'queentee fashion & beauty empire', 'chijaesutncltharav2td8tal6c']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki 2","owner_full_name":"QueenTee Fashion & Beauty Empire","google_place_id":"ChIJaesutncLThARav2Td8Tal6c","google_rating":4.7,"google_review_count":151,"notes":"fashion plus salon/spa","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJaesutncLThARav2Td8Tal6c' OR 
      (lower(trim(db.business_name)) = lower(trim('QueenTee Fashion & Beauty Empire')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('QueenTee Fashion & Beauty Empire'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'QueenTee Fashion & Beauty Empire provides Tailor / Fashion designer services at 7B Oka-Akoko St, Garki 2, Abuja. Rated 4.7/5 across 151 customer reviews. Note: fashion plus salon/spa.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Beauty Salon & Spa']::TEXT[],
  'Request a Quote',
  ARRAY['Garki 2', 'Abuja', 'FCT', 'Abuja (FCT)', '7B Oka-Akoko St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'beauty salon & spa', 'garki 2', 'abuja', 'fct', 'abuja (fct)', '7b oka-akoko st', 'queentee fashion & beauty empire', 'chijaesutncltharav2td8tal6c']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'De General''s Clothing',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'De General''s Clothing provides Tailor / Fashion designer services at Zone 5, Lugbe, Abuja. Rated 5.0/5 across 37 customer reviews.',
    'Tailor / Fashion designer in Lugbe, Abuja',
    '+2347069425303',
    '+2347069425303',
    NULL,
    'Zone 5, Lugbe, Abuja (FCT)',
    'Lugbe',
    'Abuja',
    'Nigeria',
    ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Zone 5']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'zone 5', 'de general''s clothing', 'chijoy0fanqltharlrip3-vlrwa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Lugbe","owner_full_name":"De General''s Clothing","google_place_id":"ChIJOY0fanQLThARLriP3-VLRWA","google_rating":5,"google_review_count":37,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJOY0fanQLThARLriP3-VLRWA' OR 
      (lower(trim(db.business_name)) = lower(trim('De General''s Clothing')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('De General''s Clothing'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'De General''s Clothing provides Tailor / Fashion designer services at Zone 5, Lugbe, Abuja. Rated 5.0/5 across 37 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Lugbe', 'Abuja', 'FCT', 'Abuja (FCT)', 'Zone 5']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'lugbe', 'abuja', 'fct', 'abuja (fct)', 'zone 5', 'de general''s clothing', 'chijoy0fanqltharlrip3-vlrwa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Baafans Fashion and Design Home',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Baafans Fashion and Design Home provides Tailor / Fashion designer services at Suite 123C Befs Plaza, Utako, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Tailor / Fashion designer in Utako, Abuja',
    '+2348076146528',
    '+2348076146528',
    NULL,
    'Suite 123C Befs Plaza, Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Suite 123C Befs Plaza']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', 'suite 123c befs plaza', 'baafans fashion and design home', 'chija-cvccqlthart6qmprtyr2o']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"Baafans Fashion and Design Home","google_place_id":"ChIJA-cVccQLThARt6qMpRTYr2o","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJA-cVccQLThARt6qMpRTYr2o' OR 
      (lower(trim(db.business_name)) = lower(trim('Baafans Fashion and Design Home')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Baafans Fashion and Design Home'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Baafans Fashion and Design Home provides Tailor / Fashion designer services at Suite 123C Befs Plaza, Utako, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Suite 123C Befs Plaza']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'utako', 'abuja', 'fct', 'abuja (fct)', 'suite 123c befs plaza', 'baafans fashion and design home', 'chija-cvccqlthart6qmprtyr2o']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ST. JOHN PAUL TAILORS',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'ST. JOHN PAUL TAILORS provides Tailor / Fashion designer services at 1st Ave, Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Tailor / Fashion designer in Gwarinpa, Abuja',
    '+2348066725016',
    '+2348066725016',
    NULL,
    '1st Ave, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', '1st Ave']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', '1st ave', 'st. john paul tailors', 'chijh5oe_nf1tharnpfgl3-oery']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"ST. JOHN PAUL TAILORS","google_place_id":"ChIJh5OE_nF1ThARNpfgl3-oERY","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJh5OE_nF1ThARNpfgl3-oERY' OR 
      (lower(trim(db.business_name)) = lower(trim('ST. JOHN PAUL TAILORS')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ST. JOHN PAUL TAILORS'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'ST. JOHN PAUL TAILORS provides Tailor / Fashion designer services at 1st Ave, Gwarinpa, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', '1st Ave']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', '1st ave', 'st. john paul tailors', 'chijh5oe_nf1tharnpfgl3-oery']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Pristê',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Pristê provides Tailor / Fashion designer services at 9 Ona Cres, Maitama, Abuja. Rated 4.9/5 across 70 customer reviews.',
    'Tailor / Fashion designer in Maitama, Abuja',
    '+2347034070310',
    '+2347034070310',
    NULL,
    '9 Ona Cres, Maitama, Abuja (FCT)',
    'Maitama',
    'Abuja',
    'Nigeria',
    ARRAY['Maitama', 'Abuja', 'FCT', 'Abuja (FCT)', '9 Ona Cres']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'maitama', 'abuja', 'fct', 'abuja (fct)', '9 ona cres', 'pristê', 'chijnzffxf91tharsy8arkctdbw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Maitama","owner_full_name":"Pristê","google_place_id":"ChIJnZFFxF91ThARsY8ARKcTdbw","google_rating":4.9,"google_review_count":70,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJnZFFxF91ThARsY8ARKcTdbw' OR 
      (lower(trim(db.business_name)) = lower(trim('Pristê')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Pristê'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Pristê provides Tailor / Fashion designer services at 9 Ona Cres, Maitama, Abuja. Rated 4.9/5 across 70 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Maitama', 'Abuja', 'FCT', 'Abuja (FCT)', '9 Ona Cres']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'maitama', 'abuja', 'fct', 'abuja (fct)', '9 ona cres', 'pristê', 'chijnzffxf91tharsy8arkctdbw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Baldon Clothiers',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Baldon Clothiers provides Tailor / Fashion designer services at 14 Agadez Cres, Wuse 2, Abuja. Rated 4.7/5 across 103 customer reviews.',
    'Tailor / Fashion designer in Wuse 2, Abuja',
    '+2348079160844',
    '+2348079160844',
    NULL,
    '14 Agadez Cres, Wuse 2, Abuja (FCT)',
    'Wuse 2',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '14 Agadez Cres']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '14 agadez cres', 'baldon clothiers', 'chij84mgffsktharbpdf3snackg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse 2","owner_full_name":"Baldon Clothiers","google_place_id":"ChIJ84MgffsKThARbpdF3sNackg","google_rating":4.7,"google_review_count":103,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ84MgffsKThARbpdF3sNackg' OR 
      (lower(trim(db.business_name)) = lower(trim('Baldon Clothiers')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Baldon Clothiers'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Baldon Clothiers provides Tailor / Fashion designer services at 14 Agadez Cres, Wuse 2, Abuja. Rated 4.7/5 across 103 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', '14 Agadez Cres']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', '14 agadez cres', 'baldon clothiers', 'chij84mgffsktharbpdf3snackg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'FnB Designs',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'FnB Designs provides Tailor / Fashion designer services at House 5, 22 Rd, Wole Soyinka Ave, Gwarinpa, Abuja. Rated 4.5/5 across 90 customer reviews.',
    'Tailor / Fashion designer in Gwarinpa, Abuja',
    '+2348035403660',
    '+2348035403660',
    NULL,
    'House 5, 22 Rd, Wole Soyinka Ave, Gwarinpa, Abuja (FCT)',
    'Gwarinpa',
    'Abuja',
    'Nigeria',
    ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'House 5', '22 Rd', 'Wole Soyinka Ave']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'house 5', '22 rd', 'wole soyinka ave', 'fnb designs', 'chijh75j-3p1tharhqyjldn9kxs']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Gwarinpa","owner_full_name":"FnB Designs","google_place_id":"ChIJh75J-3p1ThARHqYJLdn9KXs","google_rating":4.5,"google_review_count":90,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJh75J-3p1ThARHqYJLdn9KXs' OR 
      (lower(trim(db.business_name)) = lower(trim('FnB Designs')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('FnB Designs'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'FnB Designs provides Tailor / Fashion designer services at House 5, 22 Rd, Wole Soyinka Ave, Gwarinpa, Abuja. Rated 4.5/5 across 90 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Gwarinpa', 'Abuja', 'FCT', 'Abuja (FCT)', 'House 5', '22 Rd', 'Wole Soyinka Ave']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'gwarinpa', 'abuja', 'fct', 'abuja (fct)', 'house 5', '22 rd', 'wole soyinka ave', 'fnb designs', 'chijh75j-3p1tharhqyjldn9kxs']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'BASOL ENERGY SERVICES LIMITED',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'BASOL ENERGY SERVICES LIMITED provides Solar installer services at Plot 485 Ajose Adeogun St, Utako, Abuja. Rated 4.8/5 across 54 customer reviews. Note: one review alleges a faulty product.',
    'Solar installer in Utako, Abuja',
    '+2347036020004',
    '+2347036020004',
    NULL,
    'Plot 485 Ajose Adeogun St, Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 485 Ajose Adeogun St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'utako', 'abuja', 'fct', 'abuja (fct)', 'plot 485 ajose adeogun st', 'basol energy services limited', 'chijox6x2ocltharsacbupqktnk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"BASOL ENERGY SERVICES LIMITED","google_place_id":"ChIJox6X2OcLThARSacbupQktNk","google_rating":4.8,"google_review_count":54,"notes":"one review alleges a faulty product","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJox6X2OcLThARSacbupQktNk' OR 
      (lower(trim(db.business_name)) = lower(trim('BASOL ENERGY SERVICES LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('BASOL ENERGY SERVICES LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'BASOL ENERGY SERVICES LIMITED provides Solar installer services at Plot 485 Ajose Adeogun St, Utako, Abuja. Rated 4.8/5 across 54 customer reviews. Note: one review alleges a faulty product.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 485 Ajose Adeogun St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'utako', 'abuja', 'fct', 'abuja (fct)', 'plot 485 ajose adeogun st', 'basol energy services limited', 'chijox6x2ocltharsacbupqktnk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'J&W Solar Company Ltd',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'J&W Solar Company Ltd provides Solar installer services at Obum Plaza, Wuse 2, Abuja. Rated 4.9/5 across 50 customer reviews.',
    'Solar installer in Wuse 2, Abuja',
    '+2348167878543',
    '+2348167878543',
    NULL,
    'Obum Plaza, Wuse 2, Abuja (FCT)',
    'Wuse 2',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', 'Obum Plaza']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', 'obum plaza', 'j&w solar company ltd', 'chijj7u3y-ulthariz-nxllww5w']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse 2","owner_full_name":"J&W Solar Company Ltd","google_place_id":"ChIJj7U3Y-ULThARIz-nxlLwW5w","google_rating":4.9,"google_review_count":50,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJj7U3Y-ULThARIz-nxlLwW5w' OR 
      (lower(trim(db.business_name)) = lower(trim('J&W Solar Company Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('J&W Solar Company Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'J&W Solar Company Ltd provides Solar installer services at Obum Plaza, Wuse 2, Abuja. Rated 4.9/5 across 50 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse 2', 'Abuja', 'FCT', 'Abuja (FCT)', 'Obum Plaza']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuse 2', 'abuja', 'fct', 'abuja (fct)', 'obum plaza', 'j&w solar company ltd', 'chijj7u3y-ulthariz-nxllww5w']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Transenergy Kapital Limited',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Transenergy Kapital Limited provides Solar installer services at Nicon Insurance Plaza, CBD, Abuja. Rated 5.0/5 across 90 customer reviews.',
    'Solar installer in CBD, Abuja',
    '+2347030694184',
    '+2347030694184',
    NULL,
    'Nicon Insurance Plaza, CBD, Abuja (FCT)',
    'CBD',
    'Abuja',
    'Nigeria',
    ARRAY['CBD', 'Abuja', 'FCT', 'Abuja (FCT)', 'Nicon Insurance Plaza']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'cbd', 'abuja', 'fct', 'abuja (fct)', 'nicon insurance plaza', 'transenergy kapital limited', 'chij12u48q8ptharfmzuyntccaw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"CBD","owner_full_name":"Transenergy Kapital Limited","google_place_id":"ChIJ12U48Q8PThARFmzUynTCcaw","google_rating":5,"google_review_count":90,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ12U48Q8PThARFmzUynTCcaw' OR 
      (lower(trim(db.business_name)) = lower(trim('Transenergy Kapital Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Transenergy Kapital Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Transenergy Kapital Limited provides Solar installer services at Nicon Insurance Plaza, CBD, Abuja. Rated 5.0/5 across 90 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['CBD', 'Abuja', 'FCT', 'Abuja (FCT)', 'Nicon Insurance Plaza']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'cbd', 'abuja', 'fct', 'abuja (fct)', 'nicon insurance plaza', 'transenergy kapital limited', 'chij12u48q8ptharfmzuyntccaw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JP2 Solar Technologies Limited (Abuja)',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'JP2 Solar Technologies Limited (Abuja) provides Solar installer services at Block B029 Mabushi Ultra Modern Market, Jabi, Abuja. Rated 4.9/5 across 21 customer reviews. Note: supplier.',
    'Solar installer in Jabi, Abuja',
    '+2348033900832',
    '+2348033900832',
    NULL,
    'Block B029 Mabushi Ultra Modern Market, Jabi, Abuja (FCT)',
    'Jabi',
    'Abuja',
    'Nigeria',
    ARRAY['Jabi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Block B029 Mabushi Ultra Modern Market']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'jabi', 'abuja', 'fct', 'abuja (fct)', 'block b029 mabushi ultra modern market', 'jp2 solar technologies limited (abuja)', 'chijp5pzzaz1tharbixctsexgne']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Jabi","owner_full_name":"JP2 Solar Technologies Limited (Abuja)","google_place_id":"ChIJp5pzzAZ1ThARBiXCTSEXgnE","google_rating":4.9,"google_review_count":21,"notes":"supplier","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJp5pzzAZ1ThARBiXCTSEXgnE' OR 
      (lower(trim(db.business_name)) = lower(trim('JP2 Solar Technologies Limited (Abuja)')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JP2 Solar Technologies Limited (Abuja)'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'JP2 Solar Technologies Limited (Abuja) provides Solar installer services at Block B029 Mabushi Ultra Modern Market, Jabi, Abuja. Rated 4.9/5 across 21 customer reviews. Note: supplier.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Jabi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Block B029 Mabushi Ultra Modern Market']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'jabi', 'abuja', 'fct', 'abuja (fct)', 'block b029 mabushi ultra modern market', 'jp2 solar technologies limited (abuja)', 'chijp5pzzaz1tharbixctsexgne']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JRB Solar Investment Ltd.',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'JRB Solar Investment Ltd. provides Solar installer services at Plot 739 Muhammed M. Bello Way, Wuye, Abuja. Rated 4.9/5 across 69 customer reviews.',
    'Solar installer in Wuye, Abuja',
    '+2349067521111',
    '+2349067521111',
    NULL,
    'Plot 739 Muhammed M. Bello Way, Wuye, Abuja (FCT)',
    'Wuye',
    'Abuja',
    'Nigeria',
    ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 739 Muhammed M. Bello Way']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuye', 'abuja', 'fct', 'abuja (fct)', 'plot 739 muhammed m. bello way', 'jrb solar investment ltd.', 'chijrerkvnr0tharwgnms6gksck']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuye","owner_full_name":"JRB Solar Investment Ltd.","google_place_id":"ChIJreRKvNR0ThARwGnMS6Gksck","google_rating":4.9,"google_review_count":69,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJreRKvNR0ThARwGnMS6Gksck' OR 
      (lower(trim(db.business_name)) = lower(trim('JRB Solar Investment Ltd.')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JRB Solar Investment Ltd.'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'JRB Solar Investment Ltd. provides Solar installer services at Plot 739 Muhammed M. Bello Way, Wuye, Abuja. Rated 4.9/5 across 69 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 739 Muhammed M. Bello Way']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuye', 'abuja', 'fct', 'abuja (fct)', 'plot 739 muhammed m. bello way', 'jrb solar investment ltd.', 'chijrerkvnr0tharwgnms6gksck']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Solar Hub Technologies Ltd',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Solar Hub Technologies Ltd provides Solar installer services at Banex Plaza, Wuse, Abuja. Rated 5.0/5 across 53 customer reviews.',
    'Solar installer in Wuse, Abuja',
    '+2349131852317',
    '+2349131852317',
    NULL,
    'Banex Plaza, Wuse, Abuja (FCT)',
    'Wuse',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', 'Banex Plaza']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuse', 'abuja', 'fct', 'abuja (fct)', 'banex plaza', 'solar hub technologies ltd', 'chij_8ebtmgltharo6ocslyhnoa']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse","owner_full_name":"Solar Hub Technologies Ltd","google_place_id":"ChIJ_8ebtMgLThARo6OcSLyhnOA","google_rating":5,"google_review_count":53,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_8ebtMgLThARo6OcSLyhnOA' OR 
      (lower(trim(db.business_name)) = lower(trim('Solar Hub Technologies Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Solar Hub Technologies Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Solar Hub Technologies Ltd provides Solar installer services at Banex Plaza, Wuse, Abuja. Rated 5.0/5 across 53 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', 'Banex Plaza']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'wuse', 'abuja', 'fct', 'abuja (fct)', 'banex plaza', 'solar hub technologies ltd', 'chij_8ebtmgltharo6ocslyhnoa']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Bullageon Energy limited',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Bullageon Energy limited provides Solar installer services at Decent Shelter Plaza, Life Camp, Utako, Abuja. Rated 4.9/5 across 32 customer reviews.',
    'Solar installer in Utako, Abuja',
    '+2349071077777',
    '+2349071077777',
    NULL,
    'Decent Shelter Plaza, Life Camp, Utako, Abuja (FCT)',
    'Utako',
    'Abuja',
    'Nigeria',
    ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Decent Shelter Plaza', 'Life Camp']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'utako', 'abuja', 'fct', 'abuja (fct)', 'decent shelter plaza', 'life camp', 'bullageon energy limited', 'chijr2l0xqcltharg7kxlmkkbjs']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Utako","owner_full_name":"Bullageon Energy limited","google_place_id":"ChIJR2L0xqcLThARG7KxlmkKBJs","google_rating":4.9,"google_review_count":32,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJR2L0xqcLThARG7KxlmkKBJs' OR 
      (lower(trim(db.business_name)) = lower(trim('Bullageon Energy limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Bullageon Energy limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Bullageon Energy limited provides Solar installer services at Decent Shelter Plaza, Life Camp, Utako, Abuja. Rated 4.9/5 across 32 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Utako', 'Abuja', 'FCT', 'Abuja (FCT)', 'Decent Shelter Plaza', 'Life Camp']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'utako', 'abuja', 'fct', 'abuja (fct)', 'decent shelter plaza', 'life camp', 'bullageon energy limited', 'chijr2l0xqcltharg7kxlmkkbjs']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'TAICO SOLAR COMPANY ABUJA GARKI',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'TAICO SOLAR COMPANY ABUJA GARKI provides Solar installer services at Block D, Garki International Market, Abuja. Rated 5.0/5 across 20 customer reviews.',
    'Solar installer in Garki International Market, Abuja',
    '+2347063675673',
    '+2347063675673',
    NULL,
    'Block D, Garki International Market, Abuja (FCT)',
    'Garki International Market',
    'Abuja',
    'Nigeria',
    ARRAY['Garki International Market', 'Abuja', 'FCT', 'Abuja (FCT)', 'Block D']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'garki international market', 'abuja', 'fct', 'abuja (fct)', 'block d', 'taico solar company abuja garki', 'chijrrndjzyntharm8k_dsvfc44']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki International Market","owner_full_name":"TAICO SOLAR COMPANY ABUJA GARKI","google_place_id":"ChIJrRnDjzYNThARm8k_dsVfC44","google_rating":5,"google_review_count":20,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJrRnDjzYNThARm8k_dsVfC44' OR 
      (lower(trim(db.business_name)) = lower(trim('TAICO SOLAR COMPANY ABUJA GARKI')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('TAICO SOLAR COMPANY ABUJA GARKI'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'TAICO SOLAR COMPANY ABUJA GARKI provides Solar installer services at Block D, Garki International Market, Abuja. Rated 5.0/5 across 20 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Garki International Market', 'Abuja', 'FCT', 'Abuja (FCT)', 'Block D']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'garki international market', 'abuja', 'fct', 'abuja (fct)', 'block d', 'taico solar company abuja garki', 'chijrrndjzyntharm8k_dsvfc44']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'CNE Graphics Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'CNE Graphics Studio provides Graphic designer services at Plot 482, Kaura, Abuja. Rated 4.9/5 across 14 customer reviews. Note: design and print.',
    'Graphic designer in Kaura, Abuja',
    '+2342092914673',
    '+2342092914673',
    NULL,
    'Plot 482, Kaura, Abuja (FCT)',
    'Kaura',
    'Abuja',
    'Nigeria',
    ARRAY['Kaura', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 482']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'kaura', 'abuja', 'fct', 'abuja (fct)', 'plot 482', 'cne graphics studio', 'chijbxqoyoaltharkcc3f4gvdne']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Kaura","owner_full_name":"CNE Graphics Studio","google_place_id":"ChIJbXqOyoALThARkcc3f4gVDnE","google_rating":4.9,"google_review_count":14,"notes":"design and print","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJbXqOyoALThARkcc3f4gVDnE' OR 
      (lower(trim(db.business_name)) = lower(trim('CNE Graphics Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('CNE Graphics Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'CNE Graphics Studio provides Graphic designer services at Plot 482, Kaura, Abuja. Rated 4.9/5 across 14 customer reviews. Note: design and print.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Kaura', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 482']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'kaura', 'abuja', 'fct', 'abuja (fct)', 'plot 482', 'cne graphics studio', 'chijbxqoyoaltharkcc3f4gvdne']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ETC DESIGN STUDIO',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'ETC DESIGN STUDIO provides Graphic designer services at Plot 724 Goke Adegoroye Cl, Wuye, Abuja. Rated 4.4/5 across 23 customer reviews. Note: design, photo/video, training.',
    'Graphic designer in Wuye, Abuja',
    '+2348065433937',
    '+2348065433937',
    NULL,
    'Plot 724 Goke Adegoroye Cl, Wuye, Abuja (FCT)',
    'Wuye',
    'Abuja',
    'Nigeria',
    ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 724 Goke Adegoroye Cl']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'vocational training & academy', 'photography & video editing', 'wuye', 'abuja', 'fct', 'abuja (fct)', 'plot 724 goke adegoroye cl', 'etc design studio', 'chijbspunzl1tharkqflzelnk2m']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuye","owner_full_name":"ETC DESIGN STUDIO","google_place_id":"ChIJbSPuNZl1ThARKqflZELnK2M","google_rating":4.4,"google_review_count":23,"notes":"design, photo/video, training","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJbSPuNZl1ThARKqflZELnK2M' OR 
      (lower(trim(db.business_name)) = lower(trim('ETC DESIGN STUDIO')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ETC DESIGN STUDIO'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'ETC DESIGN STUDIO provides Graphic designer services at Plot 724 Goke Adegoroye Cl, Wuye, Abuja. Rated 4.4/5 across 23 customer reviews. Note: design, photo/video, training.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Vocational Training & Academy', 'Photography & Video Editing']::TEXT[],
  'Request a Quote',
  ARRAY['Wuye', 'Abuja', 'FCT', 'Abuja (FCT)', 'Plot 724 Goke Adegoroye Cl']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'vocational training & academy', 'photography & video editing', 'wuye', 'abuja', 'fct', 'abuja (fct)', 'plot 724 goke adegoroye cl', 'etc design studio', 'chijbspunzl1tharkqflzelnk2m']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Abule Graphics',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Abule Graphics provides Graphic designer services at Kpeyegyi Junction, Karshi, Abuja. Rated 5.0/5 across 14 customer reviews. Note: web design and digital marketing.',
    'Graphic designer in Karshi, Abuja',
    '+2348063439039',
    '+2348063439039',
    NULL,
    'Kpeyegyi Junction, Karshi, Abuja (FCT)',
    'Karshi',
    'Abuja',
    'Nigeria',
    ARRAY['Karshi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kpeyegyi Junction']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'digital marketing', 'karshi', 'abuja', 'fct', 'abuja (fct)', 'kpeyegyi junction', 'abule graphics', 'chijbxfrwtn3oxarptcrc-ac-vy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Karshi","owner_full_name":"Abule Graphics","google_place_id":"ChIJBxfRWtn3OxARPtcRc-ac-vY","google_rating":5,"google_review_count":14,"notes":"web design and digital marketing","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJBxfRWtn3OxARPtcRc-ac-vY' OR 
      (lower(trim(db.business_name)) = lower(trim('Abule Graphics')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Abule Graphics'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Abule Graphics provides Graphic designer services at Kpeyegyi Junction, Karshi, Abuja. Rated 5.0/5 across 14 customer reviews. Note: web design and digital marketing.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design', 'Digital Marketing']::TEXT[],
  'Request a Quote',
  ARRAY['Karshi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kpeyegyi Junction']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'digital marketing', 'karshi', 'abuja', 'fct', 'abuja (fct)', 'kpeyegyi junction', 'abule graphics', 'chijbxfrwtn3oxarptcrc-ac-vy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Xplicitmode',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Xplicitmode provides Graphic designer services at Freedom Plaza, Oladipo Diya St, Abuja. Rated 5.0/5 across 60 customer reviews. Note: web, branding, digital marketing.',
    'Graphic designer in Oladipo Diya St, Abuja',
    '+2349072596048',
    '+2349072596048',
    NULL,
    'Freedom Plaza, Oladipo Diya St, Abuja (FCT)',
    'Oladipo Diya St',
    'Abuja',
    'Nigeria',
    ARRAY['Oladipo Diya St', 'Abuja', 'FCT', 'Abuja (FCT)', 'Freedom Plaza']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'branding & identity', 'digital marketing', 'oladipo diya st', 'abuja', 'fct', 'abuja (fct)', 'freedom plaza', 'xplicitmode', 'chijsqreihunthar7t7za6kxenc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Oladipo Diya St","owner_full_name":"Xplicitmode","google_place_id":"ChIJSQREihUNThAR7T7ZA6KXEnc","google_rating":5,"google_review_count":60,"notes":"web, branding, digital marketing","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJSQREihUNThAR7T7ZA6KXEnc' OR 
      (lower(trim(db.business_name)) = lower(trim('Xplicitmode')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Xplicitmode'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Xplicitmode provides Graphic designer services at Freedom Plaza, Oladipo Diya St, Abuja. Rated 5.0/5 across 60 customer reviews. Note: web, branding, digital marketing.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design', 'Branding & Identity']::TEXT[],
  'Request a Quote',
  ARRAY['Oladipo Diya St', 'Abuja', 'FCT', 'Abuja (FCT)', 'Freedom Plaza']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'branding & identity', 'digital marketing', 'oladipo diya st', 'abuja', 'fct', 'abuja (fct)', 'freedom plaza', 'xplicitmode', 'chijsqreihunthar7t7za6kxenc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'UCHETECH STUDIOS',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'UCHETECH STUDIOS provides Graphic designer services at Kpeyegyi, Karshi, Abuja. Rated 5.0/5 across 1 customer reviews.',
    'Graphic designer in Karshi, Abuja',
    '+2348116832891',
    '+2348116832891',
    NULL,
    'Kpeyegyi, Karshi, Abuja (FCT)',
    'Karshi',
    'Abuja',
    'Nigeria',
    ARRAY['Karshi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kpeyegyi']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'karshi', 'abuja', 'fct', 'abuja (fct)', 'kpeyegyi', 'uchetech studios', 'chij2sfrzmuptharz1oavfs4ts8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Karshi","owner_full_name":"UCHETECH STUDIOS","google_place_id":"ChIJ2SFrZmUPThARZ1oAvfS4tS8","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ2SFrZmUPThARZ1oAvfS4tS8' OR 
      (lower(trim(db.business_name)) = lower(trim('UCHETECH STUDIOS')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('UCHETECH STUDIOS'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'UCHETECH STUDIOS provides Graphic designer services at Kpeyegyi, Karshi, Abuja. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Karshi', 'Abuja', 'FCT', 'Abuja (FCT)', 'Kpeyegyi']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'karshi', 'abuja', 'fct', 'abuja (fct)', 'kpeyegyi', 'uchetech studios', 'chij2sfrzmuptharz1oavfs4ts8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Marty Creative Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Marty Creative Studio provides Graphic designer services at 2 Obuasi Cl, Wuse, Abuja. Rated 5.0/5 across 6 customer reviews. Note: web design.',
    'Graphic designer in Wuse, Abuja',
    '+2349079079304',
    '+2349079079304',
    NULL,
    '2 Obuasi Cl, Wuse, Abuja (FCT)',
    'Wuse',
    'Abuja',
    'Nigeria',
    ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', '2 Obuasi Cl']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'wuse', 'abuja', 'fct', 'abuja (fct)', '2 obuasi cl', 'marty creative studio', 'chijd9hhntcltharambmlikiyc8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Wuse","owner_full_name":"Marty Creative Studio","google_place_id":"ChIJD9HHNtcLThARamBMlIkiyc8","google_rating":5,"google_review_count":6,"notes":"web design","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJD9HHNtcLThARamBMlIkiyc8' OR 
      (lower(trim(db.business_name)) = lower(trim('Marty Creative Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Marty Creative Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Marty Creative Studio provides Graphic designer services at 2 Obuasi Cl, Wuse, Abuja. Rated 5.0/5 across 6 customer reviews. Note: web design.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design']::TEXT[],
  'Request a Quote',
  ARRAY['Wuse', 'Abuja', 'FCT', 'Abuja (FCT)', '2 Obuasi Cl']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'wuse', 'abuja', 'fct', 'abuja (fct)', '2 obuasi cl', 'marty creative studio', 'chijd9hhntcltharambmlikiyc8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'BABATDESIGN LIMITED',
    'business',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'BABATDESIGN LIMITED provides Graphic designer services at Area 10, Garki, Abuja. Rated 4.8/5 across 70 customer reviews. Note: print and signage.',
    'Graphic designer in Garki, Abuja',
    '+2349133368807',
    '+2349133368807',
    NULL,
    'Area 10, Garki, Abuja (FCT)',
    'Garki',
    'Abuja',
    'Nigeria',
    ARRAY['Garki', 'Abuja', 'FCT', 'Abuja (FCT)', 'Area 10']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'garki', 'abuja', 'fct', 'abuja (fct)', 'area 10', 'babatdesign limited', 'chijwdwnyxf1tharjuxt6gyyjkw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki","owner_full_name":"BABATDESIGN LIMITED","google_place_id":"ChIJwdWNyxF1ThARJuxT6GyyJkw","google_rating":4.8,"google_review_count":70,"notes":"print and signage","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJwdWNyxF1ThARJuxT6GyyJkw' OR 
      (lower(trim(db.business_name)) = lower(trim('BABATDESIGN LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('BABATDESIGN LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'BABATDESIGN LIMITED provides Graphic designer services at Area 10, Garki, Abuja. Rated 4.8/5 across 70 customer reviews. Note: print and signage.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Garki', 'Abuja', 'FCT', 'Abuja (FCT)', 'Area 10']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'garki', 'abuja', 'fct', 'abuja (fct)', 'area 10', 'babatdesign limited', 'chijwdwnyxf1tharjuxt6gyyjkw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'MaxiGee',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'MaxiGee provides Graphic designer services at 4 Soba Cl, Garki Area 2, Abuja. Rated 5.0/5 across 40 customer reviews. Note: cartoon and graphics.',
    'Graphic designer in Garki Area 2, Abuja',
    '+2348062079550',
    '+2348062079550',
    NULL,
    '4 Soba Cl, Garki Area 2, Abuja (FCT)',
    'Garki Area 2',
    'Abuja',
    'Nigeria',
    ARRAY['Garki Area 2', 'Abuja', 'FCT', 'Abuja (FCT)', '4 Soba Cl']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'garki area 2', 'abuja', 'fct', 'abuja (fct)', '4 soba cl', 'maxigee', 'chij0ygwhit_thareyiyngy1_r8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Garki Area 2","owner_full_name":"MaxiGee","google_place_id":"ChIJ0YGWhIt_ThAReYIyNgY1_r8","google_rating":5,"google_review_count":40,"notes":"cartoon and graphics","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ0YGWhIt_ThAReYIyNgY1_r8' OR 
      (lower(trim(db.business_name)) = lower(trim('MaxiGee')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('MaxiGee'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Abuja'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'MaxiGee provides Graphic designer services at 4 Soba Cl, Garki Area 2, Abuja. Rated 5.0/5 across 40 customer reviews. Note: cartoon and graphics.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Garki Area 2', 'Abuja', 'FCT', 'Abuja (FCT)', '4 Soba Cl']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'garki area 2', 'abuja', 'fct', 'abuja (fct)', '4 soba cl', 'maxigee', 'chij0ygwhit_thareyiyngy1_r8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Plumserv Limited',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Plumserv Limited provides Plumber services at 15 Masa Rd, Abuloma Rd, Fimeama, Rivers. Rated 4.9/5 across 19 customer reviews.',
    'Plumber in Fimeama, Rivers',
    '+2348084141272',
    '+2348084141272',
    NULL,
    '15 Masa Rd, Abuloma Rd, Fimeama, Rivers',
    'Fimeama',
    'Rivers',
    'Nigeria',
    ARRAY['Fimeama', 'Port Harcourt', 'Rivers', '15 Masa Rd', 'Abuloma Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'fimeama', 'port harcourt', 'rivers', '15 masa rd', 'abuloma rd', 'plumserv limited', 'chijmxk5mi3narar-97acmcacle']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Fimeama","owner_full_name":"Plumserv Limited","google_place_id":"ChIJMxK5Mi3NaRAR-97acMCaCLE","google_rating":4.9,"google_review_count":19,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJMxK5Mi3NaRAR-97acMCaCLE' OR 
      (lower(trim(db.business_name)) = lower(trim('Plumserv Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Plumserv Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Plumserv Limited provides Plumber services at 15 Masa Rd, Abuloma Rd, Fimeama, Rivers. Rated 4.9/5 across 19 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Fimeama', 'Port Harcourt', 'Rivers', '15 Masa Rd', 'Abuloma Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'fimeama', 'port harcourt', 'rivers', '15 masa rd', 'abuloma rd', 'plumserv limited', 'chijmxk5mi3narar-97acmcacle']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Pivotal Plumbing Services & Co',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Pivotal Plumbing Services & Co provides Plumber services at 11 Freedom Ave, Aker Rd, Iwofe, Rivers. Rated 4.5/5 across 16 customer reviews.',
    'Plumber in Iwofe, Rivers',
    '+2349135716438',
    '+2349135716438',
    NULL,
    '11 Freedom Ave, Aker Rd, Iwofe, Rivers',
    'Iwofe',
    'Rivers',
    'Nigeria',
    ARRAY['Iwofe', 'Port Harcourt', 'Rivers', '11 Freedom Ave', 'Aker Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'iwofe', 'port harcourt', 'rivers', '11 freedom ave', 'aker rd', 'pivotal plumbing services & co', 'chijg1f7rxxpararwdp5pdi8-v8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Iwofe","owner_full_name":"Pivotal Plumbing Services & Co","google_place_id":"ChIJG1F7RXXPaRARwDP5pdI8-v8","google_rating":4.5,"google_review_count":16,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJG1F7RXXPaRARwDP5pdI8-v8' OR 
      (lower(trim(db.business_name)) = lower(trim('Pivotal Plumbing Services & Co')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Pivotal Plumbing Services & Co'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Pivotal Plumbing Services & Co provides Plumber services at 11 Freedom Ave, Aker Rd, Iwofe, Rivers. Rated 4.5/5 across 16 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Iwofe', 'Port Harcourt', 'Rivers', '11 Freedom Ave', 'Aker Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'iwofe', 'port harcourt', 'rivers', '11 freedom ave', 'aker rd', 'pivotal plumbing services & co', 'chijg1f7rxxpararwdp5pdi8-v8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'G-WIN PLUMBING SERVICE',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'G-WIN PLUMBING SERVICE provides Plumber services at Nkpelu, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Plumber in Nkpelu, Rivers',
    '+2348148139173',
    '+2348148139173',
    NULL,
    'Nkpelu, Rivers',
    'Nkpelu',
    'Rivers',
    'Nigeria',
    ARRAY['Nkpelu', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'nkpelu', 'port harcourt', 'rivers', 'g-win plumbing service', 'chijjrcoagbrararrwukny_lgh4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Nkpelu","owner_full_name":"G-WIN PLUMBING SERVICE","google_place_id":"ChIJjRCoAGbRaRARrWUkNY_lGh4","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJjRCoAGbRaRARrWUkNY_lGh4' OR 
      (lower(trim(db.business_name)) = lower(trim('G-WIN PLUMBING SERVICE')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('G-WIN PLUMBING SERVICE'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'G-WIN PLUMBING SERVICE provides Plumber services at Nkpelu, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Nkpelu', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'nkpelu', 'port harcourt', 'rivers', 'g-win plumbing service', 'chijjrcoagbrararrwukny_lgh4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DENCO PLUMBING SERVICES',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'DENCO PLUMBING SERVICES provides Plumber services at Mile 3, Rumukalagba, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Plumber in Rumukalagba, Rivers',
    '+2348034466291',
    '+2348034466291',
    NULL,
    'Mile 3, Rumukalagba, Rivers',
    'Rumukalagba',
    'Rivers',
    'Nigeria',
    ARRAY['Rumukalagba', 'Port Harcourt', 'Rivers', 'Mile 3']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumukalagba', 'port harcourt', 'rivers', 'mile 3', 'denco plumbing services', 'chijl_u8iulnararzgnuitqpth8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumukalagba","owner_full_name":"DENCO PLUMBING SERVICES","google_place_id":"ChIJl_U8IuLNaRARZGNuitqPth8","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJl_U8IuLNaRARZGNuitqPth8' OR 
      (lower(trim(db.business_name)) = lower(trim('DENCO PLUMBING SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DENCO PLUMBING SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'DENCO PLUMBING SERVICES provides Plumber services at Mile 3, Rumukalagba, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Rumukalagba', 'Port Harcourt', 'Rivers', 'Mile 3']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumukalagba', 'port harcourt', 'rivers', 'mile 3', 'denco plumbing services', 'chijl_u8iulnararzgnuitqpth8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Brightful plumbing concerns',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Brightful plumbing concerns provides Plumber services at Mile 3, Mgbuoba, Rivers. Rated 4.6/5 across 10 customer reviews.',
    'Plumber in Mgbuoba, Rivers',
    '+2348101102829',
    '+2348101102829',
    NULL,
    'Mile 3, Mgbuoba, Rivers',
    'Mgbuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', 'Mile 3']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'mgbuoba', 'port harcourt', 'rivers', 'mile 3', 'brightful plumbing concerns', 'chij4dgwwenpararhf8jbnllld0']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuoba","owner_full_name":"Brightful plumbing concerns","google_place_id":"ChIJ4dgWWEnPaRARHF8jBnllLD0","google_rating":4.6,"google_review_count":10,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ4dgWWEnPaRARHF8jBnllLD0' OR 
      (lower(trim(db.business_name)) = lower(trim('Brightful plumbing concerns')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Brightful plumbing concerns'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Brightful plumbing concerns provides Plumber services at Mile 3, Mgbuoba, Rivers. Rated 4.6/5 across 10 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', 'Mile 3']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'mgbuoba', 'port harcourt', 'rivers', 'mile 3', 'brightful plumbing concerns', 'chij4dgwwenpararhf8jbnllld0']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Danphils plumbing services ltd',
    'business',
    'Plumbing & Water Systems',
    'Plumber',
    'Danphils plumbing services ltd provides Plumber services at 5 Okuru Rd, Trans Amadi, Rivers.',
    'Plumber in Trans Amadi, Rivers',
    '+2347039687994',
    '+2347039687994',
    NULL,
    '5 Okuru Rd, Trans Amadi, Rivers',
    'Trans Amadi',
    'Rivers',
    'Nigeria',
    ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', '5 Okuru Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'trans amadi', 'port harcourt', 'rivers', '5 okuru rd', 'danphils plumbing services ltd', 'chij6tz8o3_nararg1usfq0mbvu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Trans Amadi","owner_full_name":"Danphils plumbing services ltd","google_place_id":"ChIJ6TZ8o3_NaRARG1USFQ0MbVU","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ6TZ8o3_NaRARG1USFQ0MbVU' OR 
      (lower(trim(db.business_name)) = lower(trim('Danphils plumbing services ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Danphils plumbing services ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Danphils plumbing services ltd provides Plumber services at 5 Okuru Rd, Trans Amadi, Rivers.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', '5 Okuru Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'trans amadi', 'port harcourt', 'rivers', '5 okuru rd', 'danphils plumbing services ltd', 'chij6tz8o3_nararg1usfq0mbvu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DE CONFIDENTIAL PLUMBING SERVICE',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'DE CONFIDENTIAL PLUMBING SERVICE provides Plumber services at 14 Wokekoro St, Rumuodara, Rivers.',
    'Plumber in Rumuodara, Rivers',
    '+2348114121403',
    '+2348114121403',
    NULL,
    '14 Wokekoro St, Rumuodara, Rivers',
    'Rumuodara',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuodara', 'Port Harcourt', 'Rivers', '14 Wokekoro St']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumuodara', 'port harcourt', 'rivers', '14 wokekoro st', 'de confidential plumbing service', 'chij6-bg9xvnararz0gtpdlbzj4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuodara","owner_full_name":"DE CONFIDENTIAL PLUMBING SERVICE","google_place_id":"ChIJ6-BG9xvNaRARz0GTPdlbZj4","google_rating":null,"google_review_count":null,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ6-BG9xvNaRARz0GTPdlbZj4' OR 
      (lower(trim(db.business_name)) = lower(trim('DE CONFIDENTIAL PLUMBING SERVICE')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DE CONFIDENTIAL PLUMBING SERVICE'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'DE CONFIDENTIAL PLUMBING SERVICE provides Plumber services at 14 Wokekoro St, Rumuodara, Rivers.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuodara', 'Port Harcourt', 'Rivers', '14 Wokekoro St']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumuodara', 'port harcourt', 'rivers', '14 wokekoro st', 'de confidential plumbing service', 'chij6-bg9xvnararz0gtpdlbzj4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Vepo Plumbers',
    'artisan',
    'Plumbing & Water Systems',
    'Plumber',
    'Vepo Plumbers provides Plumber services at 89 Stadium Rd, Rumuomasi, Rivers. Rated 4.4/5 across 7 customer reviews.',
    'Plumber in Rumuomasi, Rivers',
    '+2348039347059',
    '+2348039347059',
    NULL,
    '89 Stadium Rd, Rumuomasi, Rivers',
    'Rumuomasi',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuomasi', 'Port Harcourt', 'Rivers', '89 Stadium Rd']::TEXT[],
    ARRAY['Plumber', 'Plumbing & Water Systems']::TEXT[],
    ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumuomasi', 'port harcourt', 'rivers', '89 stadium rd', 'vepo plumbers', 'chijj3z6zdhnarardyhdswekyxk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuomasi","owner_full_name":"Vepo Plumbers","google_place_id":"ChIJj3z6zdHNaRARdyhDsWEkYXk","google_rating":4.4,"google_review_count":7,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJj3z6zdHNaRARdyhDsWEkYXk' OR 
      (lower(trim(db.business_name)) = lower(trim('Vepo Plumbers')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Vepo Plumbers'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumbing & Water Systems',
  'Vepo Plumbers provides Plumber services at 89 Stadium Rd, Rumuomasi, Rivers. Rated 4.4/5 across 7 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuomasi', 'Port Harcourt', 'Rivers', '89 Stadium Rd']::TEXT[],
  ARRAY['plumber', 'pipefitting & leak repair', 'sanitary installations', 'rumuomasi', 'port harcourt', 'rivers', '89 stadium rd', 'vepo plumbers', 'chijj3z6zdhnarardyhdswekyxk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'D''prime Maintenance Services',
    'artisan',
    'Plumber & Electrician Contracting',
    'Plumber · Electrician',
    'D''prime Maintenance Services provides Plumber · Electrician services at Plot 24 C&C Estate, Okporo Rd, Umudara, Rivers. Rated 4.8/5 across 30 customer reviews.',
    'Plumber · Electrician in Umudara, Rivers',
    '+2348026433364',
    '+2348026433364',
    NULL,
    'Plot 24 C&C Estate, Okporo Rd, Umudara, Rivers',
    'Umudara',
    'Rivers',
    'Nigeria',
    ARRAY['Umudara', 'Port Harcourt', 'Rivers', 'Plot 24 C&C Estate', 'Okporo Rd']::TEXT[],
    ARRAY['Plumber', 'Electrician', 'Plumber & Electrician Contracting']::TEXT[],
    ARRAY['plumber', 'electrician', 'pipefitting & leak repair', 'sanitary installations', 'electrical wiring & troubleshooting', 'power maintenance', 'umudara', 'port harcourt', 'rivers', 'plot 24 c&c estate', 'okporo rd', 'd''prime maintenance services', 'chijgw5m9wbnararyydiaubutse']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Umudara","owner_full_name":"D''prime Maintenance Services","google_place_id":"ChIJGW5M9wbNaRARyYDiaubUTsE","google_rating":4.8,"google_review_count":30,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJGW5M9wbNaRARyYDiaubUTsE' OR 
      (lower(trim(db.business_name)) = lower(trim('D''prime Maintenance Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('D''prime Maintenance Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Plumber',
  'Plumber & Electrician Contracting',
  'D''prime Maintenance Services provides Plumber · Electrician services at Plot 24 C&C Estate, Okporo Rd, Umudara, Rivers. Rated 4.8/5 across 30 customer reviews.',
  ARRAY['Plumber', 'Pipefitting & Leak Repair', 'Sanitary Installations', 'Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Umudara', 'Port Harcourt', 'Rivers', 'Plot 24 C&C Estate', 'Okporo Rd']::TEXT[],
  ARRAY['plumber', 'electrician', 'pipefitting & leak repair', 'sanitary installations', 'electrical wiring & troubleshooting', 'power maintenance', 'umudara', 'port harcourt', 'rivers', 'plot 24 c&c estate', 'okporo rd', 'd''prime maintenance services', 'chijgw5m9wbnararyydiaubutse']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Plumber'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    '21st CENTURY ELECTRICALS LIMITED',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    '21st CENTURY ELECTRICALS LIMITED provides Electrician services at 109 Rumuagholu Rd, Rivers. Rated 5.0/5 across 29 customer reviews.',
    'Electrician in 109 Rumuagholu Rd, Rivers',
    '+2348134007488',
    '+2348134007488',
    NULL,
    '109 Rumuagholu Rd, Rivers',
    '109 Rumuagholu Rd',
    'Rivers',
    'Nigeria',
    ARRAY['109 Rumuagholu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', '109 rumuagholu rd', 'port harcourt', 'rivers', '21st century electricals limited', 'chije_7vt-zrararmyb_gvcqjww']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"109 Rumuagholu Rd","owner_full_name":"21st CENTURY ELECTRICALS LIMITED","google_place_id":"ChIJe_7vT-zRaRARMYB_GVCqJww","google_rating":5,"google_review_count":29,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJe_7vT-zRaRARMYB_GVCqJww' OR 
      (lower(trim(db.business_name)) = lower(trim('21st CENTURY ELECTRICALS LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('21st CENTURY ELECTRICALS LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  '21st CENTURY ELECTRICALS LIMITED provides Electrician services at 109 Rumuagholu Rd, Rivers. Rated 5.0/5 across 29 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['109 Rumuagholu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', '109 rumuagholu rd', 'port harcourt', 'rivers', '21st century electricals limited', 'chije_7vt-zrararmyb_gvcqjww']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Bowwood Electrical Company',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'Bowwood Electrical Company provides Electrician services at 177 Okporo Rd, Rivers. Rated 4.7/5 across 36 customer reviews.',
    'Electrician in 177 Okporo Rd, Rivers',
    '+2349078652960',
    '+2349078652960',
    NULL,
    '177 Okporo Rd, Rivers',
    '177 Okporo Rd',
    'Rivers',
    'Nigeria',
    ARRAY['177 Okporo Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', '177 okporo rd', 'port harcourt', 'rivers', 'bowwood electrical company', 'chijxwqlmq8xqharpskjexbly94']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"177 Okporo Rd","owner_full_name":"Bowwood Electrical Company","google_place_id":"ChIJxWqlMQ8XQhARPsKJexBlY94","google_rating":4.7,"google_review_count":36,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJxWqlMQ8XQhARPsKJexBlY94' OR 
      (lower(trim(db.business_name)) = lower(trim('Bowwood Electrical Company')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Bowwood Electrical Company'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Bowwood Electrical Company provides Electrician services at 177 Okporo Rd, Rivers. Rated 4.7/5 across 36 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['177 Okporo Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', '177 okporo rd', 'port harcourt', 'rivers', 'bowwood electrical company', 'chijxwqlmq8xqharpskjexbly94']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DAEMASTER Electrical',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'DAEMASTER Electrical provides Electrician services at Rukpokwu, Rivers. Rated 4.9/5 across 7 customer reviews.',
    'Electrician in Rukpokwu, Rivers',
    '+2348035980005',
    '+2348035980005',
    NULL,
    'Rukpokwu, Rivers',
    'Rukpokwu',
    'Rivers',
    'Nigeria',
    ARRAY['Rukpokwu', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'rukpokwu', 'port harcourt', 'rivers', 'daemaster electrical', 'chijaxgalnnrararjgvqdahv71o']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rukpokwu","owner_full_name":"DAEMASTER Electrical","google_place_id":"ChIJAxGalNnRaRARjgVqDAHv71o","google_rating":4.9,"google_review_count":7,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJAxGalNnRaRARjgVqDAHv71o' OR 
      (lower(trim(db.business_name)) = lower(trim('DAEMASTER Electrical')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DAEMASTER Electrical'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'DAEMASTER Electrical provides Electrician services at Rukpokwu, Rivers. Rated 4.9/5 across 7 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Rukpokwu', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'rukpokwu', 'port harcourt', 'rivers', 'daemaster electrical', 'chijaxgalnnrararjgvqdahv71o']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Kenturkey Electrical Engineering Services',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'Kenturkey Electrical Engineering Services provides Electrician services at 3 Testimony Ln, Woji, Rivers. Rated 4.9/5 across 12 customer reviews.',
    'Electrician in Woji, Rivers',
    '+2349031314782',
    '+2349031314782',
    NULL,
    '3 Testimony Ln, Woji, Rivers',
    'Woji',
    'Rivers',
    'Nigeria',
    ARRAY['Woji', 'Port Harcourt', 'Rivers', '3 Testimony Ln']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'woji', 'port harcourt', 'rivers', '3 testimony ln', 'kenturkey electrical engineering services', 'chijtvbcl0jlararaopipux1jq8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Woji","owner_full_name":"Kenturkey Electrical Engineering Services","google_place_id":"ChIJTVbCL0jLaRARAopIPUX1Jq8","google_rating":4.9,"google_review_count":12,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJTVbCL0jLaRARAopIPUX1Jq8' OR 
      (lower(trim(db.business_name)) = lower(trim('Kenturkey Electrical Engineering Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Kenturkey Electrical Engineering Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Kenturkey Electrical Engineering Services provides Electrician services at 3 Testimony Ln, Woji, Rivers. Rated 4.9/5 across 12 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Woji', 'Port Harcourt', 'Rivers', '3 Testimony Ln']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'woji', 'port harcourt', 'rivers', '3 testimony ln', 'kenturkey electrical engineering services', 'chijtvbcl0jlararaopipux1jq8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Volt Edge Electrical Services',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'Volt Edge Electrical Services provides Electrician services at Ada-George Rd, Rumuafrikom, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Electrician in Rumuafrikom, Rivers',
    '+2348126873789',
    '+2348126873789',
    NULL,
    'Ada-George Rd, Rumuafrikom, Rivers',
    'Rumuafrikom',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuafrikom', 'Port Harcourt', 'Rivers', 'Ada-George Rd']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'rumuafrikom', 'port harcourt', 'rivers', 'ada-george rd', 'volt edge electrical services', 'chij_asezczparar34hq_aoijau']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuafrikom","owner_full_name":"Volt Edge Electrical Services","google_place_id":"ChIJ_aseZczPaRAR34HQ_aOiJAU","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ_aseZczPaRAR34HQ_aOiJAU' OR 
      (lower(trim(db.business_name)) = lower(trim('Volt Edge Electrical Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Volt Edge Electrical Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'Volt Edge Electrical Services provides Electrician services at Ada-George Rd, Rumuafrikom, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuafrikom', 'Port Harcourt', 'Rivers', 'Ada-George Rd']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'rumuafrikom', 'port harcourt', 'rivers', 'ada-george rd', 'volt edge electrical services', 'chij_asezczparar34hq_aoijau']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'FRABEN Electrical Services',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'FRABEN Electrical Services provides Electrician services at 6 Elder Obunezi, Ihunwo St, Nvigwe, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Electrician in Nvigwe, Rivers',
    '+2348065735051',
    '+2348065735051',
    NULL,
    '6 Elder Obunezi, Ihunwo St, Nvigwe, Rivers',
    'Nvigwe',
    'Rivers',
    'Nigeria',
    ARRAY['Nvigwe', 'Port Harcourt', 'Rivers', '6 Elder Obunezi', 'Ihunwo St']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'nvigwe', 'port harcourt', 'rivers', '6 elder obunezi', 'ihunwo st', 'fraben electrical services', 'chijwspvvflnararxq2_ahsfo6a']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Nvigwe","owner_full_name":"FRABEN Electrical Services","google_place_id":"ChIJWSPVVFLNaRARXQ2_AhsFO6A","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJWSPVVFLNaRARXQ2_AhsFO6A' OR 
      (lower(trim(db.business_name)) = lower(trim('FRABEN Electrical Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('FRABEN Electrical Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'FRABEN Electrical Services provides Electrician services at 6 Elder Obunezi, Ihunwo St, Nvigwe, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Nvigwe', 'Port Harcourt', 'Rivers', '6 Elder Obunezi', 'Ihunwo St']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'nvigwe', 'port harcourt', 'rivers', '6 elder obunezi', 'ihunwo st', 'fraben electrical services', 'chijwspvvflnararxq2_ahsfo6a']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'SOLOPET ELECTRICAL ENGINEERING SERVICES',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'SOLOPET ELECTRICAL ENGINEERING SERVICES provides Electrician services at 28 Okporo Rd, Mgbuesilara, Rivers. Rated 4.0/5 across 2 customer reviews.',
    'Electrician in Mgbuesilara, Rivers',
    '+2349035007927',
    '+2349035007927',
    NULL,
    '28 Okporo Rd, Mgbuesilara, Rivers',
    'Mgbuesilara',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '28 Okporo Rd']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'mgbuesilara', 'port harcourt', 'rivers', '28 okporo rd', 'solopet electrical engineering services', 'chijdesiad_narar9jejqftpbh8']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuesilara","owner_full_name":"SOLOPET ELECTRICAL ENGINEERING SERVICES","google_place_id":"ChIJdesIaD_NaRAR9jEJqftpbH8","google_rating":4,"google_review_count":2,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJdesIaD_NaRAR9jEJqftpbH8' OR 
      (lower(trim(db.business_name)) = lower(trim('SOLOPET ELECTRICAL ENGINEERING SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('SOLOPET ELECTRICAL ENGINEERING SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'SOLOPET ELECTRICAL ENGINEERING SERVICES provides Electrician services at 28 Okporo Rd, Mgbuesilara, Rivers. Rated 4.0/5 across 2 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '28 Okporo Rd']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'mgbuesilara', 'port harcourt', 'rivers', '28 okporo rd', 'solopet electrical engineering services', 'chijdesiad_narar9jejqftpbh8']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'CUMULUS ELECTRICAL',
    'artisan',
    'Electrical & Power Systems',
    'Electrician',
    'CUMULUS ELECTRICAL provides Electrician services at 35 Mini Ave, Mgbuoba, Rivers. Rated 5.0/5 across 3 customer reviews.',
    'Electrician in Mgbuoba, Rivers',
    '+2348060746512',
    '+2348060746512',
    NULL,
    '35 Mini Ave, Mgbuoba, Rivers',
    'Mgbuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '35 Mini Ave']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'mgbuoba', 'port harcourt', 'rivers', '35 mini ave', 'cumulus electrical', 'chijyttotofmyumr5e50yzslul0']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuoba","owner_full_name":"CUMULUS ELECTRICAL","google_place_id":"ChIJyTtOTOFmyUMR5E50YZSLuL0","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJyTtOTOFmyUMR5E50YZSLuL0' OR 
      (lower(trim(db.business_name)) = lower(trim('CUMULUS ELECTRICAL')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('CUMULUS ELECTRICAL'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'CUMULUS ELECTRICAL provides Electrician services at 35 Mini Ave, Mgbuoba, Rivers. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '35 Mini Ave']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'mgbuoba', 'port harcourt', 'rivers', '35 mini ave', 'cumulus electrical', 'chijyttotofmyumr5e50yzslul0']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'BENOTEK ENGINEERING',
    'business',
    'Electrical & Power Systems',
    'Electrician',
    'BENOTEK ENGINEERING provides Electrician services at RIVTAF Golf Estate, Trans Amadi, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Electrician in Trans Amadi, Rivers',
    '+2349050462888',
    '+2349050462888',
    NULL,
    'RIVTAF Golf Estate, Trans Amadi, Rivers',
    'Trans Amadi',
    'Rivers',
    'Nigeria',
    ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', 'RIVTAF Golf Estate']::TEXT[],
    ARRAY['Electrician', 'Electrical & Power Systems']::TEXT[],
    ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'trans amadi', 'port harcourt', 'rivers', 'rivtaf golf estate', 'benotek engineering', 'chij6xdje1fnarar1iqs45tvrlw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Trans Amadi","owner_full_name":"BENOTEK ENGINEERING","google_place_id":"ChIJ6xdjE1fNaRAR1IqS45TVrlw","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ6xdjE1fNaRAR1IqS45TVrlw' OR 
      (lower(trim(db.business_name)) = lower(trim('BENOTEK ENGINEERING')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('BENOTEK ENGINEERING'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Electrician',
  'Electrical & Power Systems',
  'BENOTEK ENGINEERING provides Electrician services at RIVTAF Golf Estate, Trans Amadi, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Electrician', 'Electrical Wiring & Troubleshooting', 'Power Maintenance']::TEXT[],
  'Request a Quote',
  ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', 'RIVTAF Golf Estate']::TEXT[],
  ARRAY['electrician', 'electrical wiring & troubleshooting', 'power maintenance', 'trans amadi', 'port harcourt', 'rivers', 'rivtaf golf estate', 'benotek engineering', 'chij6xdje1fnarar1iqs45tvrlw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Electrician'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'COTECK Furniture',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'COTECK Furniture provides Carpenter services at Eliozu Rd, Rivers. Rated 5.0/5 across 1 customer reviews. Note: furniture maker; no phone listed.',
    'Carpenter in Eliozu Rd, Rivers',
    NULL,
    NULL,
    NULL,
    'Eliozu Rd, Rivers',
    'Eliozu Rd',
    'Rivers',
    'Nigeria',
    ARRAY['Eliozu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'eliozu rd', 'port harcourt', 'rivers', 'coteck furniture', 'chijatjcmqbtararisid2dlkclw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Eliozu Rd","owner_full_name":"COTECK Furniture","google_place_id":"ChIJATJCMqbTaRARISiD2dLKclw","google_rating":5,"google_review_count":1,"notes":"furniture maker; no phone listed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJATJCMqbTaRARISiD2dLKclw' OR 
      (lower(trim(db.business_name)) = lower(trim('COTECK Furniture')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('COTECK Furniture'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'COTECK Furniture provides Carpenter services at Eliozu Rd, Rivers. Rated 5.0/5 across 1 customer reviews. Note: furniture maker; no phone listed.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication', 'Custom Furniture']::TEXT[],
  'Request a Quote',
  ARRAY['Eliozu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'eliozu rd', 'port harcourt', 'rivers', 'coteck furniture', 'chijatjcmqbtararisid2dlkclw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Madera Furniture Nigeria',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Madera Furniture Nigeria provides Carpenter services at 75 Okporo Rd, Mgbuesilara, Rivers. Note: furniture maker.',
    'Carpenter in Mgbuesilara, Rivers',
    '+2347060997286',
    '+2347060997286',
    NULL,
    '75 Okporo Rd, Mgbuesilara, Rivers',
    'Mgbuesilara',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '75 Okporo Rd']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'mgbuesilara', 'port harcourt', 'rivers', '75 okporo rd', 'madera furniture nigeria', 'chijuy38k2xnararm9lva2flska']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuesilara","owner_full_name":"Madera Furniture Nigeria","google_place_id":"ChIJUy38K2XNaRARm9lvA2fLSkA","google_rating":null,"google_review_count":null,"notes":"furniture maker","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJUy38K2XNaRARm9lvA2fLSkA' OR 
      (lower(trim(db.business_name)) = lower(trim('Madera Furniture Nigeria')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Madera Furniture Nigeria'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Madera Furniture Nigeria provides Carpenter services at 75 Okporo Rd, Mgbuesilara, Rivers. Note: furniture maker.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication', 'Custom Furniture']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '75 Okporo Rd']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'custom furniture', 'mgbuesilara', 'port harcourt', 'rivers', '75 okporo rd', 'madera furniture nigeria', 'chijuy38k2xnararm9lva2flska']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Coteck Interior Exterior',
    'artisan',
    'Carpentry, Furniture & Joinery',
    'Carpenter',
    'Coteck Interior Exterior provides Carpenter services at 11 Collyns Owhonda St, Eagle Island, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed as general contractor.',
    'Carpenter in Eagle Island, Rivers',
    '+2348088844684',
    '+2348088844684',
    NULL,
    '11 Collyns Owhonda St, Eagle Island, Rivers',
    'Eagle Island',
    'Rivers',
    'Nigeria',
    ARRAY['Eagle Island', 'Port Harcourt', 'Rivers', '11 Collyns Owhonda St']::TEXT[],
    ARRAY['Carpenter', 'Carpentry, Furniture & Joinery']::TEXT[],
    ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'eagle island', 'port harcourt', 'rivers', '11 collyns owhonda st', 'coteck interior exterior', 'chijt0mpkifpararkuhjyzxvgcg']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Eagle Island","owner_full_name":"Coteck Interior Exterior","google_place_id":"ChIJt0MpkIfPaRARkUHjyzxvgCg","google_rating":5,"google_review_count":1,"notes":"listed as general contractor","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJt0MpkIfPaRARkUHjyzxvgCg' OR 
      (lower(trim(db.business_name)) = lower(trim('Coteck Interior Exterior')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Coteck Interior Exterior'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Carpenter',
  'Carpentry, Furniture & Joinery',
  'Coteck Interior Exterior provides Carpenter services at 11 Collyns Owhonda St, Eagle Island, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed as general contractor.',
  ARRAY['Carpenter', 'Custom Woodwork & Cabinetry', 'Furniture Fabrication']::TEXT[],
  'Request a Quote',
  ARRAY['Eagle Island', 'Port Harcourt', 'Rivers', '11 Collyns Owhonda St']::TEXT[],
  ARRAY['carpenter', 'custom woodwork & cabinetry', 'furniture fabrication', 'eagle island', 'port harcourt', 'rivers', '11 collyns owhonda st', 'coteck interior exterior', 'chijt0mpkifpararkuhjyzxvgcg']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Carpenter'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ZEBAS WELDING AND FABRICATION',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'ZEBAS WELDING AND FABRICATION provides Welder services at 1 Ihunwo St, Woji/Trans Amadi, Rivers. Rated 5.0/5 across 19 customer reviews. Note: also a welding training workshop.',
    'Welder in Woji/Trans Amadi, Rivers',
    '+2348102767823',
    '+2348102767823',
    NULL,
    '1 Ihunwo St, Woji/Trans Amadi, Rivers',
    'Woji/Trans Amadi',
    'Rivers',
    'Nigeria',
    ARRAY['Woji/Trans Amadi', 'Port Harcourt', 'Rivers', '1 Ihunwo St']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'vocational training & academy', 'woji/trans amadi', 'port harcourt', 'rivers', '1 ihunwo st', 'zebas welding and fabrication', 'chij9ro0axfnararfk0br2bgj1u']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Woji/Trans Amadi","owner_full_name":"ZEBAS WELDING AND FABRICATION","google_place_id":"ChIJ9Ro0AxfNaRARFK0br2bGj1U","google_rating":5,"google_review_count":19,"notes":"also a welding training workshop","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ9Ro0AxfNaRARFK0br2bGj1U' OR 
      (lower(trim(db.business_name)) = lower(trim('ZEBAS WELDING AND FABRICATION')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ZEBAS WELDING AND FABRICATION'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'ZEBAS WELDING AND FABRICATION provides Welder services at 1 Ihunwo St, Woji/Trans Amadi, Rivers. Rated 5.0/5 across 19 customer reviews. Note: also a welding training workshop.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Woji/Trans Amadi', 'Port Harcourt', 'Rivers', '1 Ihunwo St']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'vocational training & academy', 'woji/trans amadi', 'port harcourt', 'rivers', '1 ihunwo st', 'zebas welding and fabrication', 'chij9ro0axfnararfk0br2bgj1u']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'FK METAL AND FABRICATION WORK',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'FK METAL AND FABRICATION WORK provides Welder services at 111 Peter Odili Rd, Faga, Rivers. Rated 5.0/5 across 29 customer reviews.',
    'Welder in Faga, Rivers',
    '+2348068749178',
    '+2348068749178',
    NULL,
    '111 Peter Odili Rd, Faga, Rivers',
    'Faga',
    'Rivers',
    'Nigeria',
    ARRAY['Faga', 'Port Harcourt', 'Rivers', '111 Peter Odili Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'faga', 'port harcourt', 'rivers', '111 peter odili rd', 'fk metal and fabrication work', 'chijt8fwxvrnarar51bmrhi6z5e']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Faga","owner_full_name":"FK METAL AND FABRICATION WORK","google_place_id":"ChIJt8fwXvrNaRAR51bmrhI6z5E","google_rating":5,"google_review_count":29,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJt8fwXvrNaRAR51bmrhI6z5E' OR 
      (lower(trim(db.business_name)) = lower(trim('FK METAL AND FABRICATION WORK')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('FK METAL AND FABRICATION WORK'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'FK METAL AND FABRICATION WORK provides Welder services at 111 Peter Odili Rd, Faga, Rivers. Rated 5.0/5 across 29 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Faga', 'Port Harcourt', 'Rivers', '111 Peter Odili Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'faga', 'port harcourt', 'rivers', '111 peter odili rd', 'fk metal and fabrication work', 'chijt8fwxvrnarar51bmrhi6z5e']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'OBIYTEK WELDING & MULTI SERVICE',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'OBIYTEK WELDING & MULTI SERVICE provides Welder services at Rumuowha, Rivers. Rated 5.0/5 across 3 customer reviews.',
    'Welder in Rumuowha, Rivers',
    '+2347089662319',
    '+2347089662319',
    NULL,
    'Rumuowha, Rivers',
    'Rumuowha',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuowha', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuowha', 'port harcourt', 'rivers', 'obiytek welding & multi service', 'chijbwxbnvptararwpkymgpvyvk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuowha","owner_full_name":"OBIYTEK WELDING & MULTI SERVICE","google_place_id":"ChIJbwXBNVPTaRARwPKYmgPVYvk","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJbwXBNVPTaRARwPKYmgPVYvk' OR 
      (lower(trim(db.business_name)) = lower(trim('OBIYTEK WELDING & MULTI SERVICE')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('OBIYTEK WELDING & MULTI SERVICE'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'OBIYTEK WELDING & MULTI SERVICE provides Welder services at Rumuowha, Rivers. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuowha', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuowha', 'port harcourt', 'rivers', 'obiytek welding & multi service', 'chijbwxbnvptararwpkymgpvyvk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'SIJINUS METALS CONSTRUCTION LTD',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'SIJINUS METALS CONSTRUCTION LTD provides Welder services at 22 Rd, Woji, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Woji, Rivers',
    '+2349069978816',
    '+2349069978816',
    NULL,
    '22 Rd, Woji, Rivers',
    'Woji',
    'Rivers',
    'Nigeria',
    ARRAY['Woji', 'Port Harcourt', 'Rivers', '22 Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'woji', 'port harcourt', 'rivers', '22 rd', 'sijinus metals construction ltd', 'chijewv275tnararkryh4rxklfo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Woji","owner_full_name":"SIJINUS METALS CONSTRUCTION LTD","google_place_id":"ChIJewV275TNaRARKRYH4rxKlFo","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJewV275TNaRARKRYH4rxKlFo' OR 
      (lower(trim(db.business_name)) = lower(trim('SIJINUS METALS CONSTRUCTION LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('SIJINUS METALS CONSTRUCTION LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'SIJINUS METALS CONSTRUCTION LTD provides Welder services at 22 Rd, Woji, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Woji', 'Port Harcourt', 'Rivers', '22 Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'woji', 'port harcourt', 'rivers', '22 rd', 'sijinus metals construction ltd', 'chijewv275tnararkryh4rxklfo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Austine Welding & Fabrication Works',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Austine Welding & Fabrication Works provides Welder services at Ogbogoro Rd, Rumuopirikom, Rivers. Rated 5.0/5 across 1 customer reviews.',
    'Welder in Rumuopirikom, Rivers',
    '+2347025470497',
    '+2347025470497',
    NULL,
    'Ogbogoro Rd, Rumuopirikom, Rivers',
    'Rumuopirikom',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuopirikom', 'Port Harcourt', 'Rivers', 'Ogbogoro Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuopirikom', 'port harcourt', 'rivers', 'ogbogoro rd', 'austine welding & fabrication works', 'chijo9aylq_pararmavgxadtoqs']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuopirikom","owner_full_name":"Austine Welding & Fabrication Works","google_place_id":"ChIJO9aYlq_PaRARMAvGXaDToqs","google_rating":5,"google_review_count":1,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJO9aYlq_PaRARMAvGXaDToqs' OR 
      (lower(trim(db.business_name)) = lower(trim('Austine Welding & Fabrication Works')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Austine Welding & Fabrication Works'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Austine Welding & Fabrication Works provides Welder services at Ogbogoro Rd, Rumuopirikom, Rivers. Rated 5.0/5 across 1 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuopirikom', 'Port Harcourt', 'Rivers', 'Ogbogoro Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuopirikom', 'port harcourt', 'rivers', 'ogbogoro rd', 'austine welding & fabrication works', 'chijo9aylq_pararmavgxadtoqs']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Alesunny Tech.Enterprises',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Alesunny Tech.Enterprises provides Welder services at Igbo Etche Rd, Rumuokwurusi, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed generically; trade unconfirmed.',
    'Welder in Rumuokwurusi, Rivers',
    '+2347034290554',
    '+2347034290554',
    NULL,
    'Igbo Etche Rd, Rumuokwurusi, Rivers',
    'Rumuokwurusi',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuokwurusi', 'Port Harcourt', 'Rivers', 'Igbo Etche Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuokwurusi', 'port harcourt', 'rivers', 'igbo etche rd', 'alesunny tech.enterprises', 'chijfya7udbtararfw6yannbrxu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuokwurusi","owner_full_name":"Alesunny Tech.Enterprises","google_place_id":"ChIJFya7UdbTaRARfW6yANnBRXU","google_rating":5,"google_review_count":1,"notes":"listed generically; trade unconfirmed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJFya7UdbTaRARfW6yANnBRXU' OR 
      (lower(trim(db.business_name)) = lower(trim('Alesunny Tech.Enterprises')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Alesunny Tech.Enterprises'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Alesunny Tech.Enterprises provides Welder services at Igbo Etche Rd, Rumuokwurusi, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed generically; trade unconfirmed.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuokwurusi', 'Port Harcourt', 'Rivers', 'Igbo Etche Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuokwurusi', 'port harcourt', 'rivers', 'igbo etche rd', 'alesunny tech.enterprises', 'chijfya7udbtararfw6yannbrxu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'MPW SERVICES',
    'artisan',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'MPW SERVICES provides Welder services at Rumuibekwe Housing Estate, Obia, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed generically; trade unconfirmed.',
    'Welder in Obia, Rivers',
    '+2348113825025',
    '+2348113825025',
    NULL,
    'Rumuibekwe Housing Estate, Obia, Rivers',
    'Obia',
    'Rivers',
    'Nigeria',
    ARRAY['Obia', 'Port Harcourt', 'Rivers', 'Rumuibekwe Housing Estate']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'obia', 'port harcourt', 'rivers', 'rumuibekwe housing estate', 'mpw services', 'chijn92chs3nararcowcce1rutw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Obia","owner_full_name":"MPW SERVICES","google_place_id":"ChIJN92Chs3NaRARCoWCCE1rUTw","google_rating":5,"google_review_count":1,"notes":"listed generically; trade unconfirmed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJN92Chs3NaRARCoWCCE1rUTw' OR 
      (lower(trim(db.business_name)) = lower(trim('MPW SERVICES')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('MPW SERVICES'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'MPW SERVICES provides Welder services at Rumuibekwe Housing Estate, Obia, Rivers. Rated 5.0/5 across 1 customer reviews. Note: listed generically; trade unconfirmed.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Obia', 'Port Harcourt', 'Rivers', 'Rumuibekwe Housing Estate']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'obia', 'port harcourt', 'rivers', 'rumuibekwe housing estate', 'mpw services', 'chijn92chs3nararcowcce1rutw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Accessfab Limited',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'Accessfab Limited provides Welder services at 43B Ahoada East-West Rd, Aligbolu, Rivers. Rated 4.9/5 across 17 customer reviews. Note: welding training centre.',
    'Welder in Aligbolu, Rivers',
    '+2348128032012',
    '+2348128032012',
    NULL,
    '43B Ahoada East-West Rd, Aligbolu, Rivers',
    'Aligbolu',
    'Rivers',
    'Nigeria',
    ARRAY['Aligbolu', 'Port Harcourt', 'Rivers', '43B Ahoada East-West Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'vocational training & academy', 'aligbolu', 'port harcourt', 'rivers', '43b ahoada east-west rd', 'accessfab limited', 'chij9xdgagltararccudmgedglc']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Aligbolu","owner_full_name":"Accessfab Limited","google_place_id":"ChIJ9xDGAGLTaRARCcudmGEdGLc","google_rating":4.9,"google_review_count":17,"notes":"welding training centre","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ9xDGAGLTaRARCcudmGEdGLc' OR 
      (lower(trim(db.business_name)) = lower(trim('Accessfab Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Accessfab Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'Accessfab Limited provides Welder services at 43B Ahoada East-West Rd, Aligbolu, Rivers. Rated 4.9/5 across 17 customer reviews. Note: welding training centre.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Aligbolu', 'Port Harcourt', 'Rivers', '43B Ahoada East-West Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'vocational training & academy', 'aligbolu', 'port harcourt', 'rivers', '43b ahoada east-west rd', 'accessfab limited', 'chij9xdgagltararccudmgedglc']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'De Efficient Welding/Inspection Services Limited',
    'business',
    'Welding, Metalwork & Fabrication',
    'Welder',
    'De Efficient Welding/Inspection Services Limited provides Welder services at East-West Rd, Rumuokoro, Rivers. Rated 3.3/5 across 3 customer reviews.',
    'Welder in Rumuokoro, Rivers',
    '+2348067032943',
    '+2348067032943',
    NULL,
    'East-West Rd, Rumuokoro, Rivers',
    'Rumuokoro',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuokoro', 'Port Harcourt', 'Rivers', 'East-West Rd']::TEXT[],
    ARRAY['Welder', 'Welding, Metalwork & Fabrication']::TEXT[],
    ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuokoro', 'port harcourt', 'rivers', 'east-west rd', 'de efficient welding/inspection services limited', 'chijzzurh4fnarar8mesj2evfrw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuokoro","owner_full_name":"De Efficient Welding/Inspection Services Limited","google_place_id":"ChIJzzuRh4fNaRAR8MESj2eVFrw","google_rating":3.3,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJzzuRh4fNaRAR8MESj2eVFrw' OR 
      (lower(trim(db.business_name)) = lower(trim('De Efficient Welding/Inspection Services Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('De Efficient Welding/Inspection Services Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Welder',
  'Welding, Metalwork & Fabrication',
  'De Efficient Welding/Inspection Services Limited provides Welder services at East-West Rd, Rumuokoro, Rivers. Rated 3.3/5 across 3 customer reviews.',
  ARRAY['Welder', 'Metal Fabrication', 'Steel Construction & Gates']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuokoro', 'Port Harcourt', 'Rivers', 'East-West Rd']::TEXT[],
  ARRAY['welder', 'metal fabrication', 'steel construction & gates', 'rumuokoro', 'port harcourt', 'rivers', 'east-west rd', 'de efficient welding/inspection services limited', 'chijzzurh4fnarar8mesj2evfrw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Welder'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'AD CLASSY BESPOKE TAILORING',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'AD CLASSY BESPOKE TAILORING provides Tailor / Fashion designer services at 52 Rumuepirikom/Iwofe Rd, Rivers. Rated 5.0/5 across 14 customer reviews.',
    'Tailor / Fashion designer in 52 Rumuepirikom/Iwofe Rd, Rivers',
    '+2348020339511',
    '+2348020339511',
    NULL,
    '52 Rumuepirikom/Iwofe Rd, Rivers',
    '52 Rumuepirikom/Iwofe Rd',
    'Rivers',
    'Nigeria',
    ARRAY['52 Rumuepirikom/Iwofe Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', '52 rumuepirikom/iwofe rd', 'port harcourt', 'rivers', 'ad classy bespoke tailoring', 'chija4glkprpararenz1qtksx8e']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"52 Rumuepirikom/Iwofe Rd","owner_full_name":"AD CLASSY BESPOKE TAILORING","google_place_id":"ChIJA4glKPrPaRAREnZ1qtkSX8E","google_rating":5,"google_review_count":14,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJA4glKPrPaRAREnZ1qtkSX8E' OR 
      (lower(trim(db.business_name)) = lower(trim('AD CLASSY BESPOKE TAILORING')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('AD CLASSY BESPOKE TAILORING'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'AD CLASSY BESPOKE TAILORING provides Tailor / Fashion designer services at 52 Rumuepirikom/Iwofe Rd, Rivers. Rated 5.0/5 across 14 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['52 Rumuepirikom/Iwofe Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', '52 rumuepirikom/iwofe rd', 'port harcourt', 'rivers', 'ad classy bespoke tailoring', 'chija4glkprpararenz1qtksx8e']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Deonstyle Couture',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Deonstyle Couture provides Tailor / Fashion designer services at Christy Plaza, Ozuoba, Rivers. Rated 5.0/5 across 33 customer reviews.',
    'Tailor / Fashion designer in Ozuoba, Rivers',
    '+2348139212558',
    '+2348139212558',
    NULL,
    'Christy Plaza, Ozuoba, Rivers',
    'Ozuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Ozuoba', 'Port Harcourt', 'Rivers', 'Christy Plaza']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ozuoba', 'port harcourt', 'rivers', 'christy plaza', 'deonstyle couture', 'chije1ovghprarare3r9vmjljas']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ozuoba","owner_full_name":"Deonstyle Couture","google_place_id":"ChIJE1ovGHPRaRARE3r9vMJLJas","google_rating":5,"google_review_count":33,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJE1ovGHPRaRARE3r9vMJLJas' OR 
      (lower(trim(db.business_name)) = lower(trim('Deonstyle Couture')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Deonstyle Couture'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Deonstyle Couture provides Tailor / Fashion designer services at Christy Plaza, Ozuoba, Rivers. Rated 5.0/5 across 33 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Ozuoba', 'Port Harcourt', 'Rivers', 'Christy Plaza']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'ozuoba', 'port harcourt', 'rivers', 'christy plaza', 'deonstyle couture', 'chije1ovghprarare3r9vmjljas']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Luka Clothiers LTD',
    'business',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Luka Clothiers LTD provides Tailor / Fashion designer services at 308 NTA Rd, Mgbuoba, Rivers. Rated 4.8/5 across 6 customer reviews.',
    'Tailor / Fashion designer in Mgbuoba, Rivers',
    '+2347037712633',
    '+2347037712633',
    NULL,
    '308 NTA Rd, Mgbuoba, Rivers',
    'Mgbuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '308 NTA Rd']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'mgbuoba', 'port harcourt', 'rivers', '308 nta rd', 'luka clothiers ltd', 'chijs3i9sv0uuuerc8ye3ftt-ei']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuoba","owner_full_name":"Luka Clothiers LTD","google_place_id":"ChIJs3i9sV0UUUERc8YE3ftt-EI","google_rating":4.8,"google_review_count":6,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJs3i9sV0UUUERc8YE3ftt-EI' OR 
      (lower(trim(db.business_name)) = lower(trim('Luka Clothiers LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Luka Clothiers LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Luka Clothiers LTD provides Tailor / Fashion designer services at 308 NTA Rd, Mgbuoba, Rivers. Rated 4.8/5 across 6 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '308 NTA Rd']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'mgbuoba', 'port harcourt', 'rivers', '308 nta rd', 'luka clothiers ltd', 'chijs3i9sv0uuuerc8ye3ftt-ei']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'NK DELIGHT FASHION AND DESIGNING',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'NK DELIGHT FASHION AND DESIGNING provides Tailor / Fashion designer services at Rd 5 Pipeline Rd, Rumuagholu, Rivers. Rated 4.6/5 across 16 customer reviews.',
    'Tailor / Fashion designer in Rumuagholu, Rivers',
    '+2348066731749',
    '+2348066731749',
    NULL,
    'Rd 5 Pipeline Rd, Rumuagholu, Rivers',
    'Rumuagholu',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuagholu', 'Port Harcourt', 'Rivers', 'Rd 5 Pipeline Rd']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'rumuagholu', 'port harcourt', 'rivers', 'rd 5 pipeline rd', 'nk delight fashion and designing', 'chijrqcylcltarartu9syx7q5ic']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuagholu","owner_full_name":"NK DELIGHT FASHION AND DESIGNING","google_place_id":"ChIJrQCYLcLTaRARtU9SYx7q5ic","google_rating":4.6,"google_review_count":16,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJrQCYLcLTaRARtU9SYx7q5ic' OR 
      (lower(trim(db.business_name)) = lower(trim('NK DELIGHT FASHION AND DESIGNING')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('NK DELIGHT FASHION AND DESIGNING'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'NK DELIGHT FASHION AND DESIGNING provides Tailor / Fashion designer services at Rd 5 Pipeline Rd, Rumuagholu, Rivers. Rated 4.6/5 across 16 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuagholu', 'Port Harcourt', 'Rivers', 'Rd 5 Pipeline Rd']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'rumuagholu', 'port harcourt', 'rivers', 'rd 5 pipeline rd', 'nk delight fashion and designing', 'chijrqcylcltarartu9syx7q5ic']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Bliss Stitches',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Bliss Stitches provides Tailor / Fashion designer services at 4 Kelechi St, Mgbuesilara, Rivers. Rated 4.6/5 across 18 customer reviews. Note: also an academy; one review reports slow replies to overseas orders.',
    'Tailor / Fashion designer in Mgbuesilara, Rivers',
    '+2348187260954',
    '+2348187260954',
    NULL,
    '4 Kelechi St, Mgbuesilara, Rivers',
    'Mgbuesilara',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '4 Kelechi St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'mgbuesilara', 'port harcourt', 'rivers', '4 kelechi st', 'bliss stitches', 'chij7tv7crpnarar3rwzeuo_lxe']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuesilara","owner_full_name":"Bliss Stitches","google_place_id":"ChIJ7TV7crPNaRAR3RwZEuO_LXE","google_rating":4.6,"google_review_count":18,"notes":"also an academy; one review reports slow replies to overseas orders","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ7TV7crPNaRAR3RwZEuO_LXE' OR 
      (lower(trim(db.business_name)) = lower(trim('Bliss Stitches')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Bliss Stitches'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Bliss Stitches provides Tailor / Fashion designer services at 4 Kelechi St, Mgbuesilara, Rivers. Rated 4.6/5 across 18 customer reviews. Note: also an academy; one review reports slow replies to overseas orders.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuesilara', 'Port Harcourt', 'Rivers', '4 Kelechi St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'mgbuesilara', 'port harcourt', 'rivers', '4 kelechi st', 'bliss stitches', 'chij7tv7crpnarar3rwzeuo_lxe']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Bellas Fashion Place',
    'artisan',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Bellas Fashion Place provides Tailor / Fashion designer services at 124 NTA Rd, Mgbuoba, Rivers. Rated 4.3/5 across 15 customer reviews. Note: also a tailoring school; no phone listed.',
    'Tailor / Fashion designer in Mgbuoba, Rivers',
    NULL,
    NULL,
    NULL,
    '124 NTA Rd, Mgbuoba, Rivers',
    'Mgbuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '124 NTA Rd']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'mgbuoba', 'port harcourt', 'rivers', '124 nta rd', 'bellas fashion place', 'chijx-2n8ijoararenflzkkqpuu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuoba","owner_full_name":"Bellas Fashion Place","google_place_id":"ChIJx-2n8ijOaRAReNFLZkKqPUU","google_rating":4.3,"google_review_count":15,"notes":"also a tailoring school; no phone listed","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJx-2n8ijOaRAReNFLZkKqPUU' OR 
      (lower(trim(db.business_name)) = lower(trim('Bellas Fashion Place')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Bellas Fashion Place'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Bellas Fashion Place provides Tailor / Fashion designer services at 124 NTA Rd, Mgbuoba, Rivers. Rated 4.3/5 across 15 customer reviews. Note: also a tailoring school; no phone listed.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '124 NTA Rd']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'mgbuoba', 'port harcourt', 'rivers', '124 nta rd', 'bellas fashion place', 'chijx-2n8ijoararenflzkkqpuu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'L''Ecole Unique Fashion Institute',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'L''Ecole Unique Fashion Institute provides Tailor / Fashion designer services at 2 Omachi Ln, Trans Amadi, Rivers. Rated 4.9/5 across 31 customer reviews. Note: fashion school, not a tailor shop.',
    'Tailor / Fashion designer in Trans Amadi, Rivers',
    '+2348083449835',
    '+2348083449835',
    NULL,
    '2 Omachi Ln, Trans Amadi, Rivers',
    'Trans Amadi',
    'Rivers',
    'Nigeria',
    ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', '2 Omachi Ln']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'trans amadi', 'port harcourt', 'rivers', '2 omachi ln', 'l''ecole unique fashion institute', 'chiju9romhrnarar8diwqidk4xk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Trans Amadi","owner_full_name":"L''Ecole Unique Fashion Institute","google_place_id":"ChIJu9roMhrNaRAR8DiWQidK4xk","google_rating":4.9,"google_review_count":31,"notes":"fashion school, not a tailor shop","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJu9roMhrNaRAR8DiWQidK4xk' OR 
      (lower(trim(db.business_name)) = lower(trim('L''Ecole Unique Fashion Institute')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('L''Ecole Unique Fashion Institute'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'L''Ecole Unique Fashion Institute provides Tailor / Fashion designer services at 2 Omachi Ln, Trans Amadi, Rivers. Rated 4.9/5 across 31 customer reviews. Note: fashion school, not a tailor shop.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Trans Amadi', 'Port Harcourt', 'Rivers', '2 Omachi Ln']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'trans amadi', 'port harcourt', 'rivers', '2 omachi ln', 'l''ecole unique fashion institute', 'chiju9romhrnarar8diwqidk4xk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DEHANS The Fashion House',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'DEHANS The Fashion House provides Tailor / Fashion designer services at 12 Ede St, Nkpogu, Rivers. Rated 4.9/5 across 14 customer reviews. Note: also a fashion academy.',
    'Tailor / Fashion designer in Nkpogu, Rivers',
    '+2348035428718',
    '+2348035428718',
    NULL,
    '12 Ede St, Nkpogu, Rivers',
    'Nkpogu',
    'Rivers',
    'Nigeria',
    ARRAY['Nkpogu', 'Port Harcourt', 'Rivers', '12 Ede St']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'nkpogu', 'port harcourt', 'rivers', '12 ede st', 'dehans the fashion house', 'chijaebfllfnararqlmghsb-cji']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Nkpogu","owner_full_name":"DEHANS The Fashion House","google_place_id":"ChIJAeBFLlfNaRARqLMGHsB-cJI","google_rating":4.9,"google_review_count":14,"notes":"also a fashion academy","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJAeBFLlfNaRARqLMGHsB-cJI' OR 
      (lower(trim(db.business_name)) = lower(trim('DEHANS The Fashion House')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DEHANS The Fashion House'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'DEHANS The Fashion House provides Tailor / Fashion designer services at 12 Ede St, Nkpogu, Rivers. Rated 4.9/5 across 14 customer reviews. Note: also a fashion academy.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Nkpogu', 'Port Harcourt', 'Rivers', '12 Ede St']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'vocational training & academy', 'nkpogu', 'port harcourt', 'rivers', '12 ede st', 'dehans the fashion house', 'chijaebfllfnararqlmghsb-cji']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Gosh Couture Poppin',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Gosh Couture Poppin provides Tailor / Fashion designer services at 33 Apara Rd, New GRA, Rivers. Rated 5.0/5 across 16 customer reviews.',
    'Tailor / Fashion designer in New GRA, Rivers',
    '+2349126000347',
    '+2349126000347',
    NULL,
    '33 Apara Rd, New GRA, Rivers',
    'New GRA',
    'Rivers',
    'Nigeria',
    ARRAY['New GRA', 'Port Harcourt', 'Rivers', '33 Apara Rd']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'new gra', 'port harcourt', 'rivers', '33 apara rd', 'gosh couture poppin', 'chijethw19zpararozgf23hqb7k']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"New GRA","owner_full_name":"Gosh Couture Poppin","google_place_id":"ChIJeTHw19zPaRAROZgf23HQB7k","google_rating":5,"google_review_count":16,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJeTHw19zPaRAROZgf23HQB7k' OR 
      (lower(trim(db.business_name)) = lower(trim('Gosh Couture Poppin')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Gosh Couture Poppin'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Gosh Couture Poppin provides Tailor / Fashion designer services at 33 Apara Rd, New GRA, Rivers. Rated 5.0/5 across 16 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['New GRA', 'Port Harcourt', 'Rivers', '33 Apara Rd']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'new gra', 'port harcourt', 'rivers', '33 apara rd', 'gosh couture poppin', 'chijethw19zpararozgf23hqb7k']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Sito & Guru Empire',
    'professional',
    'Fashion, Tailoring & Apparel',
    'Tailor / Fashion designer',
    'Sito & Guru Empire provides Tailor / Fashion designer services at Royal Havannah Estate, Mgbuosimiri, Rivers. Rated 4.8/5 across 56 customer reviews.',
    'Tailor / Fashion designer in Mgbuosimiri, Rivers',
    '+2348165482857',
    '+2348165482857',
    NULL,
    'Royal Havannah Estate, Mgbuosimiri, Rivers',
    'Mgbuosimiri',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuosimiri', 'Port Harcourt', 'Rivers', 'Royal Havannah Estate']::TEXT[],
    ARRAY['Tailor / Fashion designer', 'Fashion, Tailoring & Apparel']::TEXT[],
    ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'mgbuosimiri', 'port harcourt', 'rivers', 'royal havannah estate', 'sito & guru empire', 'chijb9q-eibrarar4zv3odwlrbm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuosimiri","owner_full_name":"Sito & Guru Empire","google_place_id":"ChIJB9Q-eIbRaRAR4ZV3odWlRbM","google_rating":4.8,"google_review_count":56,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJB9Q-eIbRaRAR4ZV3odWlRbM' OR 
      (lower(trim(db.business_name)) = lower(trim('Sito & Guru Empire')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Sito & Guru Empire'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Tailor / Fashion designer',
  'Fashion, Tailoring & Apparel',
  'Sito & Guru Empire provides Tailor / Fashion designer services at Royal Havannah Estate, Mgbuosimiri, Rivers. Rated 4.8/5 across 56 customer reviews.',
  ARRAY['Tailor / Fashion designer', 'Tailor', 'Fashion Designer', 'Bespoke Tailoring & Couture']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuosimiri', 'Port Harcourt', 'Rivers', 'Royal Havannah Estate']::TEXT[],
  ARRAY['tailor / fashion designer', 'tailor', 'fashion designer', 'bespoke tailoring & couture', 'mgbuosimiri', 'port harcourt', 'rivers', 'royal havannah estate', 'sito & guru empire', 'chijb9q-eibrarar4zv3odwlrbm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Tailor / Fashion designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JP2 Solar Technologies Limited (Port Harcourt)',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'JP2 Solar Technologies Limited (Port Harcourt) provides Solar installer services at 3 Babbe St, Aba Rd, D-line, Rivers. Rated 4.9/5 across 35 customer reviews. Note: supplier; also CCTV.',
    'Solar installer in D-line, Rivers',
    '+2348033900832',
    '+2348033900832',
    NULL,
    '3 Babbe St, Aba Rd, D-line, Rivers',
    'D-line',
    'Rivers',
    'Nigeria',
    ARRAY['D-line', 'Port Harcourt', 'Rivers', '3 Babbe St', 'Aba Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'cctv & smart home systems', 'd-line', 'port harcourt', 'rivers', '3 babbe st', 'aba rd', 'jp2 solar technologies limited (port harcourt)', 'chijp6eb5p3oarars3s8snlwq24']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"D-line","owner_full_name":"JP2 Solar Technologies Limited (Port Harcourt)","google_place_id":"ChIJp6Eb5p3OaRARs3S8snlwq24","google_rating":4.9,"google_review_count":35,"notes":"supplier; also CCTV","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJp6Eb5p3OaRARs3S8snlwq24' OR 
      (lower(trim(db.business_name)) = lower(trim('JP2 Solar Technologies Limited (Port Harcourt)')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JP2 Solar Technologies Limited (Port Harcourt)'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'JP2 Solar Technologies Limited (Port Harcourt) provides Solar installer services at 3 Babbe St, Aba Rd, D-line, Rivers. Rated 4.9/5 across 35 customer reviews. Note: supplier; also CCTV.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup', 'CCTV & Smart Home Systems']::TEXT[],
  'Request a Quote',
  ARRAY['D-line', 'Port Harcourt', 'Rivers', '3 Babbe St', 'Aba Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'cctv & smart home systems', 'd-line', 'port harcourt', 'rivers', '3 babbe st', 'aba rd', 'jp2 solar technologies limited (port harcourt)', 'chijp6eb5p3oarars3s8snlwq24']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Prestige Solar Energy and Electrical Limited',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Prestige Solar Energy and Electrical Limited provides Solar installer services at 153 Rukpokwu, Eneka Rd, Rivers. Rated 5.0/5 across 16 customer reviews.',
    'Solar installer in Eneka Rd, Rivers',
    '+2347069437651',
    '+2347069437651',
    NULL,
    '153 Rukpokwu, Eneka Rd, Rivers',
    'Eneka Rd',
    'Rivers',
    'Nigeria',
    ARRAY['Eneka Rd', 'Port Harcourt', 'Rivers', '153 Rukpokwu']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'eneka rd', 'port harcourt', 'rivers', '153 rukpokwu', 'prestige solar energy and electrical limited', 'chijtwdbwbxtararagekvpnxmva']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Eneka Rd","owner_full_name":"Prestige Solar Energy and Electrical Limited","google_place_id":"ChIJTwDbWbXTaRARaGekvPnxmVA","google_rating":5,"google_review_count":16,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJTwDbWbXTaRARaGekvPnxmVA' OR 
      (lower(trim(db.business_name)) = lower(trim('Prestige Solar Energy and Electrical Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Prestige Solar Energy and Electrical Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Prestige Solar Energy and Electrical Limited provides Solar installer services at 153 Rukpokwu, Eneka Rd, Rivers. Rated 5.0/5 across 16 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Eneka Rd', 'Port Harcourt', 'Rivers', '153 Rukpokwu']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'eneka rd', 'port harcourt', 'rivers', '153 rukpokwu', 'prestige solar energy and electrical limited', 'chijtwdbwbxtararagekvpnxmva']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'HakunaSolar',
    'artisan',
    'Solar & Renewable Power',
    'Solar installer',
    'HakunaSolar provides Solar installer services at 14 Bekwere Wosu, D-line, Rivers. Rated 4.9/5 across 50 customer reviews.',
    'Solar installer in D-line, Rivers',
    '+2348038341853',
    '+2348038341853',
    NULL,
    '14 Bekwere Wosu, D-line, Rivers',
    'D-line',
    'Rivers',
    'Nigeria',
    ARRAY['D-line', 'Port Harcourt', 'Rivers', '14 Bekwere Wosu']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'd-line', 'port harcourt', 'rivers', '14 bekwere wosu', 'hakunasolar', 'chijveplakjparar_k5p898tdek']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"D-line","owner_full_name":"HakunaSolar","google_place_id":"ChIJVepLaKjPaRAR_k5P898tdek","google_rating":4.9,"google_review_count":50,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJVepLaKjPaRAR_k5P898tdek' OR 
      (lower(trim(db.business_name)) = lower(trim('HakunaSolar')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('HakunaSolar'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'HakunaSolar provides Solar installer services at 14 Bekwere Wosu, D-line, Rivers. Rated 4.9/5 across 50 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['D-line', 'Port Harcourt', 'Rivers', '14 Bekwere Wosu']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'd-line', 'port harcourt', 'rivers', '14 bekwere wosu', 'hakunasolar', 'chijveplakjparar_k5p898tdek']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'FRANCOSTECH LIMITED',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'FRANCOSTECH LIMITED provides Solar installer services at Geoglad Plaza, Ada-George Rd, Rumuafrikom, Rivers. Rated 5.0/5 across 43 customer reviews.',
    'Solar installer in Rumuafrikom, Rivers',
    '+2348033389728',
    '+2348033389728',
    NULL,
    'Geoglad Plaza, Ada-George Rd, Rumuafrikom, Rivers',
    'Rumuafrikom',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuafrikom', 'Port Harcourt', 'Rivers', 'Geoglad Plaza', 'Ada-George Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumuafrikom', 'port harcourt', 'rivers', 'geoglad plaza', 'ada-george rd', 'francostech limited', 'chijs03fao7pararhtvvto1xxkm']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuafrikom","owner_full_name":"FRANCOSTECH LIMITED","google_place_id":"ChIJs03FAO7PaRARhtvvTo1XxkM","google_rating":5,"google_review_count":43,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJs03FAO7PaRARhtvvTo1XxkM' OR 
      (lower(trim(db.business_name)) = lower(trim('FRANCOSTECH LIMITED')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('FRANCOSTECH LIMITED'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'FRANCOSTECH LIMITED provides Solar installer services at Geoglad Plaza, Ada-George Rd, Rumuafrikom, Rivers. Rated 5.0/5 across 43 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuafrikom', 'Port Harcourt', 'Rivers', 'Geoglad Plaza', 'Ada-George Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumuafrikom', 'port harcourt', 'rivers', 'geoglad plaza', 'ada-george rd', 'francostech limited', 'chijs03fao7pararhtvvto1xxkm']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Felicity Solar Port Harcourt',
    'supplier',
    'Solar & Renewable Power',
    'Solar installer',
    'Felicity Solar Port Harcourt provides Solar installer services at 14 Bekwere Wosu St, D-line, Rivers. Rated 4.8/5 across 28 customer reviews. Note: supplier; same address and phone as HakunaSolar.',
    'Solar installer in D-line, Rivers',
    '+2348038341853',
    '+2348038341853',
    NULL,
    '14 Bekwere Wosu St, D-line, Rivers',
    'D-line',
    'Rivers',
    'Nigeria',
    ARRAY['D-line', 'Port Harcourt', 'Rivers', '14 Bekwere Wosu St']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'd-line', 'port harcourt', 'rivers', '14 bekwere wosu st', 'felicity solar port harcourt', 'chij4fdgi8hpararrz5rezowyvy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"D-line","owner_full_name":"Felicity Solar Port Harcourt","google_place_id":"ChIJ4fdGI8HPaRARrz5rEZowyvY","google_rating":4.8,"google_review_count":28,"notes":"supplier; same address and phone as HakunaSolar","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ4fdGI8HPaRARrz5rEZowyvY' OR 
      (lower(trim(db.business_name)) = lower(trim('Felicity Solar Port Harcourt')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Felicity Solar Port Harcourt'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Felicity Solar Port Harcourt provides Solar installer services at 14 Bekwere Wosu St, D-line, Rivers. Rated 4.8/5 across 28 customer reviews. Note: supplier; same address and phone as HakunaSolar.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['D-line', 'Port Harcourt', 'Rivers', '14 Bekwere Wosu St']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'd-line', 'port harcourt', 'rivers', '14 bekwere wosu st', 'felicity solar port harcourt', 'chij4fdgi8hpararrz5rezowyvy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'JEZ Solar',
    'artisan',
    'Solar & Renewable Power',
    'Solar installer',
    'JEZ Solar provides Solar installer services at 5 Epirikom Rd, Rumuepirikom, Rivers. Rated 4.8/5 across 26 customer reviews. Note: mixed reviews incl. one complaint.',
    'Solar installer in Rumuepirikom, Rivers',
    '+2348033343911',
    '+2348033343911',
    NULL,
    '5 Epirikom Rd, Rumuepirikom, Rivers',
    'Rumuepirikom',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuepirikom', 'Port Harcourt', 'Rivers', '5 Epirikom Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumuepirikom', 'port harcourt', 'rivers', '5 epirikom rd', 'jez solar', 'chij2xu1acrparar8eryvietwfo']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuepirikom","owner_full_name":"JEZ Solar","google_place_id":"ChIJ2Xu1ACrPaRAR8eRyVIetWfo","google_rating":4.8,"google_review_count":26,"notes":"mixed reviews incl. one complaint","has_caution_note":true}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJ2Xu1ACrPaRAR8eRyVIetWfo' OR 
      (lower(trim(db.business_name)) = lower(trim('JEZ Solar')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('JEZ Solar'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'JEZ Solar provides Solar installer services at 5 Epirikom Rd, Rumuepirikom, Rivers. Rated 4.8/5 across 26 customer reviews. Note: mixed reviews incl. one complaint.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuepirikom', 'Port Harcourt', 'Rivers', '5 Epirikom Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumuepirikom', 'port harcourt', 'rivers', '5 epirikom rd', 'jez solar', 'chij2xu1acrparar8eryvietwfo']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Alexoll Energy Solutions',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Alexoll Energy Solutions provides Solar installer services at 2 Pipeline Rd, Rumodome, Rivers. Rated 5.0/5 across 8 customer reviews.',
    'Solar installer in Rumodome, Rivers',
    '+2349157683237',
    '+2349157683237',
    NULL,
    '2 Pipeline Rd, Rumodome, Rivers',
    'Rumodome',
    'Rivers',
    'Nigeria',
    ARRAY['Rumodome', 'Port Harcourt', 'Rivers', '2 Pipeline Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumodome', 'port harcourt', 'rivers', '2 pipeline rd', 'alexoll energy solutions', 'chijpweii5btararj_nqw-l74va']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumodome","owner_full_name":"Alexoll Energy Solutions","google_place_id":"ChIJPwEii5bTaRARj_NqW-L74vA","google_rating":5,"google_review_count":8,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJPwEii5bTaRARj_NqW-L74vA' OR 
      (lower(trim(db.business_name)) = lower(trim('Alexoll Energy Solutions')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Alexoll Energy Solutions'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Alexoll Energy Solutions provides Solar installer services at 2 Pipeline Rd, Rumodome, Rivers. Rated 5.0/5 across 8 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Rumodome', 'Port Harcourt', 'Rivers', '2 Pipeline Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'rumodome', 'port harcourt', 'rivers', '2 pipeline rd', 'alexoll energy solutions', 'chijpweii5btararj_nqw-l74va']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Flowcrown Technologies Limited',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Flowcrown Technologies Limited provides Solar installer services at 12 Tam David West Blvd, Obirikwerre Rd, Rivers. Rated 4.9/5 across 11 customer reviews.',
    'Solar installer in Obirikwerre Rd, Rivers',
    '+2348167450535',
    '+2348167450535',
    NULL,
    '12 Tam David West Blvd, Obirikwerre Rd, Rivers',
    'Obirikwerre Rd',
    'Rivers',
    'Nigeria',
    ARRAY['Obirikwerre Rd', 'Port Harcourt', 'Rivers', '12 Tam David West Blvd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'obirikwerre rd', 'port harcourt', 'rivers', '12 tam david west blvd', 'flowcrown technologies limited', 'chijuct8bvtrararxp0wfy5lcq4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Obirikwerre Rd","owner_full_name":"Flowcrown Technologies Limited","google_place_id":"ChIJUcT8BvTRaRARxP0Wfy5LCq4","google_rating":4.9,"google_review_count":11,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJUcT8BvTRaRARxP0Wfy5LCq4' OR 
      (lower(trim(db.business_name)) = lower(trim('Flowcrown Technologies Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Flowcrown Technologies Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Flowcrown Technologies Limited provides Solar installer services at 12 Tam David West Blvd, Obirikwerre Rd, Rivers. Rated 4.9/5 across 11 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Obirikwerre Rd', 'Port Harcourt', 'Rivers', '12 Tam David West Blvd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'obirikwerre rd', 'port harcourt', 'rivers', '12 tam david west blvd', 'flowcrown technologies limited', 'chijuct8bvtrararxp0wfy5lcq4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Solar World Electric Technology Limited',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'Solar World Electric Technology Limited provides Solar installer services at 29 Sani Abacha Rd, GRA, Rivers. Rated 4.7/5 across 20 customer reviews.',
    'Solar installer in GRA, Rivers',
    '+2349037933268',
    '+2349037933268',
    NULL,
    '29 Sani Abacha Rd, GRA, Rivers',
    'GRA',
    'Rivers',
    'Nigeria',
    ARRAY['GRA', 'Port Harcourt', 'Rivers', '29 Sani Abacha Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'gra', 'port harcourt', 'rivers', '29 sani abacha rd', 'solar world electric technology limited', 'chijrv7x9oroararpngpwfvyuwu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"GRA","owner_full_name":"Solar World Electric Technology Limited","google_place_id":"ChIJrV7X9orOaRARPNGpwFvYUwU","google_rating":4.7,"google_review_count":20,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJrV7X9orOaRARPNGpwFvYUwU' OR 
      (lower(trim(db.business_name)) = lower(trim('Solar World Electric Technology Limited')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Solar World Electric Technology Limited'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'Solar World Electric Technology Limited provides Solar installer services at 29 Sani Abacha Rd, GRA, Rivers. Rated 4.7/5 across 20 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['GRA', 'Port Harcourt', 'Rivers', '29 Sani Abacha Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'gra', 'port harcourt', 'rivers', '29 sani abacha rd', 'solar world electric technology limited', 'chijrv7x9oroararpngpwfvyuwu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'ALLOS Solar Energy Iron Steel and Property Management Ltd',
    'business',
    'Solar & Renewable Power',
    'Solar installer',
    'ALLOS Solar Energy Iron Steel and Property Management Ltd provides Solar installer services at 1 SARS Rd, Mandela Estate, Rivers. Rated 5.0/5 across 10 customer reviews.',
    'Solar installer in Mandela Estate, Rivers',
    '+2349019171922',
    '+2349019171922',
    NULL,
    '1 SARS Rd, Mandela Estate, Rivers',
    'Mandela Estate',
    'Rivers',
    'Nigeria',
    ARRAY['Mandela Estate', 'Port Harcourt', 'Rivers', '1 SARS Rd']::TEXT[],
    ARRAY['Solar installer', 'Solar & Renewable Power']::TEXT[],
    ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'mandela estate', 'port harcourt', 'rivers', '1 sars rd', 'allos solar energy iron steel and property management ltd', 'chijowugam7rarar9_vdx7n_9sk']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mandela Estate","owner_full_name":"ALLOS Solar Energy Iron Steel and Property Management Ltd","google_place_id":"ChIJoWugAm7RaRAR9_vdx7n_9sk","google_rating":5,"google_review_count":10,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJoWugAm7RaRAR9_vdx7n_9sk' OR 
      (lower(trim(db.business_name)) = lower(trim('ALLOS Solar Energy Iron Steel and Property Management Ltd')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('ALLOS Solar Energy Iron Steel and Property Management Ltd'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Solar installer',
  'Solar & Renewable Power',
  'ALLOS Solar Energy Iron Steel and Property Management Ltd provides Solar installer services at 1 SARS Rd, Mandela Estate, Rivers. Rated 5.0/5 across 10 customer reviews.',
  ARRAY['Solar installer', 'Solar Installer', 'Solar Inverter Installation', 'Battery & Panel Setup']::TEXT[],
  'Request a Quote',
  ARRAY['Mandela Estate', 'Port Harcourt', 'Rivers', '1 SARS Rd']::TEXT[],
  ARRAY['solar installer', 'solar inverter installation', 'battery & panel setup', 'mandela estate', 'port harcourt', 'rivers', '1 sars rd', 'allos solar energy iron steel and property management ltd', 'chijowugam7rarar9_vdx7n_9sk']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Solar installer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Eloti Designs',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Eloti Designs provides Graphic designer services at 7 Nathaniel St, Rumuibekwe, Rivers. Rated 4.8/5 across 104 customer reviews. Note: web design and development.',
    'Graphic designer in Rumuibekwe, Rivers',
    '+2348036140158',
    '+2348036140158',
    NULL,
    '7 Nathaniel St, Rumuibekwe, Rivers',
    'Rumuibekwe',
    'Rivers',
    'Nigeria',
    ARRAY['Rumuibekwe', 'Port Harcourt', 'Rivers', '7 Nathaniel St']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'rumuibekwe', 'port harcourt', 'rivers', '7 nathaniel st', 'eloti designs', 'chijv1bl2ovaararcvfnlbcyci4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Rumuibekwe","owner_full_name":"Eloti Designs","google_place_id":"ChIJV1bL2ovaaRARCVFnLBCyCi4","google_rating":4.8,"google_review_count":104,"notes":"web design and development","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJV1bL2ovaaRARCVFnLBCyCi4' OR 
      (lower(trim(db.business_name)) = lower(trim('Eloti Designs')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Eloti Designs'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Eloti Designs provides Graphic designer services at 7 Nathaniel St, Rumuibekwe, Rivers. Rated 4.8/5 across 104 customer reviews. Note: web design and development.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Web Design']::TEXT[],
  'Request a Quote',
  ARRAY['Rumuibekwe', 'Port Harcourt', 'Rivers', '7 Nathaniel St']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'web design', 'rumuibekwe', 'port harcourt', 'rivers', '7 nathaniel st', 'eloti designs', 'chijv1bl2ovaararcvfnlbcyci4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Firstcam Creative Studios',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Firstcam Creative Studios provides Graphic designer services at 115 Woji Rd, GRA Phase 3, Rivers. Rated 4.8/5 across 15 customer reviews. Note: photography studio.',
    'Graphic designer in GRA Phase 3, Rivers',
    '+2349076612408',
    '+2349076612408',
    NULL,
    '115 Woji Rd, GRA Phase 3, Rivers',
    'GRA Phase 3',
    'Rivers',
    'Nigeria',
    ARRAY['GRA Phase 3', 'Port Harcourt', 'Rivers', '115 Woji Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'photography & video editing', 'gra phase 3', 'port harcourt', 'rivers', '115 woji rd', 'firstcam creative studios', 'chije-3mjmfpararrl1xlkmaumw']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"GRA Phase 3","owner_full_name":"Firstcam Creative Studios","google_place_id":"ChIJE-3MJMfPaRARRl1XlKMaumw","google_rating":4.8,"google_review_count":15,"notes":"photography studio","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJE-3MJMfPaRARRl1XlKMaumw' OR 
      (lower(trim(db.business_name)) = lower(trim('Firstcam Creative Studios')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Firstcam Creative Studios'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Firstcam Creative Studios provides Graphic designer services at 115 Woji Rd, GRA Phase 3, Rivers. Rated 4.8/5 across 15 customer reviews. Note: photography studio.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Photography & Video Editing']::TEXT[],
  'Request a Quote',
  ARRAY['GRA Phase 3', 'Port Harcourt', 'Rivers', '115 Woji Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'photography & video editing', 'gra phase 3', 'port harcourt', 'rivers', '115 woji rd', 'firstcam creative studios', 'chije-3mjmfpararrl1xlkmaumw']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'D''prime Creative Studios',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'D''prime Creative Studios provides Graphic designer services at Location Jn, Ada-George Rd, Rivers. Rated 4.9/5 across 14 customer reviews. Note: video editing and graphics.',
    'Graphic designer in Ada-George Rd, Rivers',
    '+2348164015782',
    '+2348164015782',
    NULL,
    'Location Jn, Ada-George Rd, Rivers',
    'Ada-George Rd',
    'Rivers',
    'Nigeria',
    ARRAY['Ada-George Rd', 'Port Harcourt', 'Rivers', 'Location Jn']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'photography & video editing', 'ada-george rd', 'port harcourt', 'rivers', 'location jn', 'd''prime creative studios', 'chijkt0vybdrararuz9xgjl4kmu']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Ada-George Rd","owner_full_name":"D''prime Creative Studios","google_place_id":"ChIJKT0vyBDRaRARUz9XGJl4kMU","google_rating":4.9,"google_review_count":14,"notes":"video editing and graphics","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJKT0vyBDRaRARUz9XGJl4kMU' OR 
      (lower(trim(db.business_name)) = lower(trim('D''prime Creative Studios')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('D''prime Creative Studios'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'D''prime Creative Studios provides Graphic designer services at Location Jn, Ada-George Rd, Rivers. Rated 4.9/5 across 14 customer reviews. Note: video editing and graphics.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Photography & Video Editing']::TEXT[],
  'Request a Quote',
  ARRAY['Ada-George Rd', 'Port Harcourt', 'Rivers', 'Location Jn']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'photography & video editing', 'ada-george rd', 'port harcourt', 'rivers', 'location jn', 'd''prime creative studios', 'chijkt0vybdrararuz9xgjl4kmu']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DRAFTMAN CONCEPT',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'DRAFTMAN CONCEPT provides Graphic designer services at 3 Rumuaghaolu Rd, Rivers. Rated 5.0/5 across 28 customer reviews.',
    'Graphic designer in 3 Rumuaghaolu Rd, Rivers',
    '+2348072593136',
    '+2348072593136',
    NULL,
    '3 Rumuaghaolu Rd, Rivers',
    '3 Rumuaghaolu Rd',
    'Rivers',
    'Nigeria',
    ARRAY['3 Rumuaghaolu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3 rumuaghaolu rd', 'port harcourt', 'rivers', 'draftman concept', 'chijsvwxh03rararub2r17hsqag']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"3 Rumuaghaolu Rd","owner_full_name":"DRAFTMAN CONCEPT","google_place_id":"ChIJsVwXH03RaRARuB2R17hsqag","google_rating":5,"google_review_count":28,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJsVwXH03RaRARuB2R17hsqag' OR 
      (lower(trim(db.business_name)) = lower(trim('DRAFTMAN CONCEPT')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DRAFTMAN CONCEPT'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'DRAFTMAN CONCEPT provides Graphic designer services at 3 Rumuaghaolu Rd, Rivers. Rated 5.0/5 across 28 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['3 Rumuaghaolu Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', '3 rumuaghaolu rd', 'port harcourt', 'rivers', 'draftman concept', 'chijsvwxh03rararub2r17hsqag']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Orangee Design Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Orangee Design Studio provides Graphic designer services at 54 NTA Rd, Mgbuoba, Rivers. Rated 5.0/5 across 11 customer reviews. Note: UK phone number.',
    'Graphic designer in Mgbuoba, Rivers',
    '+447828704059',
    '+447828704059',
    NULL,
    '54 NTA Rd, Mgbuoba, Rivers',
    'Mgbuoba',
    'Rivers',
    'Nigeria',
    ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '54 NTA Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'mgbuoba', 'port harcourt', 'rivers', '54 nta rd', 'orangee design studio', 'chijjuvid1npararmto71ud4lue']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Mgbuoba","owner_full_name":"Orangee Design Studio","google_place_id":"ChIJJUViD1nPaRARmtO71ud4lUE","google_rating":5,"google_review_count":11,"notes":"UK phone number","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJJUViD1nPaRARmtO71ud4lUE' OR 
      (lower(trim(db.business_name)) = lower(trim('Orangee Design Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Orangee Design Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Orangee Design Studio provides Graphic designer services at 54 NTA Rd, Mgbuoba, Rivers. Rated 5.0/5 across 11 customer reviews. Note: UK phone number.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Mgbuoba', 'Port Harcourt', 'Rivers', '54 NTA Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'mgbuoba', 'port harcourt', 'rivers', '54 nta rd', 'orangee design studio', 'chijjuvid1npararmto71ud4lue']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'J-Esiti Global Enterprise',
    'business',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'J-Esiti Global Enterprise provides Graphic designer services at 56 Rumuaghaolu Rd, Nkpelu, Rivers. Rated 4.8/5 across 32 customer reviews.',
    'Graphic designer in Nkpelu, Rivers',
    '+2348123822353',
    '+2348123822353',
    NULL,
    '56 Rumuaghaolu Rd, Nkpelu, Rivers',
    'Nkpelu',
    'Rivers',
    'Nigeria',
    ARRAY['Nkpelu', 'Port Harcourt', 'Rivers', '56 Rumuaghaolu Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'nkpelu', 'port harcourt', 'rivers', '56 rumuaghaolu rd', 'j-esiti global enterprise', 'chija3oobnzrararzmrzp7drqne']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Nkpelu","owner_full_name":"J-Esiti Global Enterprise","google_place_id":"ChIJA3OoBnzRaRARZmRzp7dRQnE","google_rating":4.8,"google_review_count":32,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJA3OoBnzRaRARZmRzp7dRQnE' OR 
      (lower(trim(db.business_name)) = lower(trim('J-Esiti Global Enterprise')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('J-Esiti Global Enterprise'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'J-Esiti Global Enterprise provides Graphic designer services at 56 Rumuaghaolu Rd, Nkpelu, Rivers. Rated 4.8/5 across 32 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Nkpelu', 'Port Harcourt', 'Rivers', '56 Rumuaghaolu Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'nkpelu', 'port harcourt', 'rivers', '56 rumuaghaolu rd', 'j-esiti global enterprise', 'chija3oobnzrararzmrzp7drqne']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DCS TECH LTD',
    'business',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'DCS TECH LTD provides Graphic designer services at Suite 9, 24 Old Aba Rd, Obia, Rivers. Rated 4.7/5 across 81 customer reviews. Note: print and merchandise.',
    'Graphic designer in Obia, Rivers',
    '+2348060033322',
    '+2348060033322',
    NULL,
    'Suite 9, 24 Old Aba Rd, Obia, Rivers',
    'Obia',
    'Rivers',
    'Nigeria',
    ARRAY['Obia', 'Port Harcourt', 'Rivers', 'Suite 9', '24 Old Aba Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'obia', 'port harcourt', 'rivers', 'suite 9', '24 old aba rd', 'dcs tech ltd', 'chijtxy_ejrnarart5gqowhzjoy']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Obia","owner_full_name":"DCS TECH LTD","google_place_id":"ChIJTxY_EJrNaRARt5GQowHZjOY","google_rating":4.7,"google_review_count":81,"notes":"print and merchandise","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJTxY_EJrNaRARt5GQowHZjOY' OR 
      (lower(trim(db.business_name)) = lower(trim('DCS TECH LTD')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DCS TECH LTD'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'DCS TECH LTD provides Graphic designer services at Suite 9, 24 Old Aba Rd, Obia, Rivers. Rated 4.7/5 across 81 customer reviews. Note: print and merchandise.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Obia', 'Port Harcourt', 'Rivers', 'Suite 9', '24 Old Aba Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'obia', 'port harcourt', 'rivers', 'suite 9', '24 old aba rd', 'dcs tech ltd', 'chijtxy_ejrnarart5gqowhzjoy']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'KelzDesign Studio',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'KelzDesign Studio provides Graphic designer services at Umuibo, Rivers. Rated 5.0/5 across 3 customer reviews.',
    'Graphic designer in Umuibo, Rivers',
    '+2348124689083',
    '+2348124689083',
    NULL,
    'Umuibo, Rivers',
    'Umuibo',
    'Rivers',
    'Nigeria',
    ARRAY['Umuibo', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'umuibo', 'port harcourt', 'rivers', 'kelzdesign studio', 'chijsfqghh3o3ours9x0qllu2l4']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Umuibo","owner_full_name":"KelzDesign Studio","google_place_id":"ChIJSfqGhh3O3oURS9X0qllu2L4","google_rating":5,"google_review_count":3,"notes":null,"has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJSfqGhh3O3oURS9X0qllu2L4' OR 
      (lower(trim(db.business_name)) = lower(trim('KelzDesign Studio')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('KelzDesign Studio'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'KelzDesign Studio provides Graphic designer services at Umuibo, Rivers. Rated 5.0/5 across 3 customer reviews.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design']::TEXT[],
  'Request a Quote',
  ARRAY['Umuibo', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'umuibo', 'port harcourt', 'rivers', 'kelzdesign studio', 'chijsfqghh3o3ours9x0qllu2l4']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'Urbane Media House',
    'business',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'Urbane Media House provides Graphic designer services at 20 Nembe Rd, Obia, Rivers. Rated 4.9/5 across 149 customer reviews. Note: print.',
    'Graphic designer in Obia, Rivers',
    '+2348151392685',
    '+2348151392685',
    NULL,
    '20 Nembe Rd, Obia, Rivers',
    'Obia',
    'Rivers',
    'Nigeria',
    ARRAY['Obia', 'Port Harcourt', 'Rivers', '20 Nembe Rd']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'obia', 'port harcourt', 'rivers', '20 nembe rd', 'urbane media house', 'chijhra8un7nararhujt9asc_js']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Obia","owner_full_name":"Urbane Media House","google_place_id":"ChIJhRa8Un7NaRARHujt9asc_Js","google_rating":4.9,"google_review_count":149,"notes":"print","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJhRa8Un7NaRARHujt9asc_Js' OR 
      (lower(trim(db.business_name)) = lower(trim('Urbane Media House')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('Urbane Media House'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'Urbane Media House provides Graphic designer services at 20 Nembe Rd, Obia, Rivers. Rated 4.9/5 across 149 customer reviews. Note: print.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production']::TEXT[],
  'Request a Quote',
  ARRAY['Obia', 'Port Harcourt', 'Rivers', '20 Nembe Rd']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'obia', 'port harcourt', 'rivers', '20 nembe rd', 'urbane media house', 'chijhra8un7nararhujt9asc_js']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

WITH ins_dir AS (
  INSERT INTO public.directory_businesses (
    business_name, provider_type, industry, specialization, description, tagline,
    phone, whatsapp, email, address, city, state, country,
    locations_served, categories_offered, keywords,
    is_registered, is_verified, approval_status, source_type, metadata
  )
  SELECT
    'DominicMary Koncept & Services',
    'professional',
    'Branding, Design & Digital Media',
    'Graphic designer',
    'DominicMary Koncept & Services provides Graphic designer services at Okemini Rd, Rivers. Rated 4.6/5 across 19 customer reviews. Note: design, print, ICT training.',
    'Graphic designer in Okemini Rd, Rivers',
    '+2348142808777',
    '+2348142808777',
    NULL,
    'Okemini Rd, Rivers',
    'Okemini Rd',
    'Rivers',
    'Nigeria',
    ARRAY['Okemini Rd', 'Port Harcourt', 'Rivers']::TEXT[],
    ARRAY['Graphic designer', 'Branding, Design & Digital Media']::TEXT[],
    ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'vocational training & academy', 'okemini rd', 'port harcourt', 'rivers', 'dominicmary koncept & services', 'chijrtpk84drararmjkfr3cqzry']::TEXT[],
    false,
    false,
    'Approved',
    'google_directory_import',
    '{"lga":"Okemini Rd","owner_full_name":"DominicMary Koncept & Services","google_place_id":"ChIJRTPK84DRaRARMjKfr3cqZRY","google_rating":4.6,"google_review_count":19,"notes":"design, print, ICT training","has_caution_note":false}'::jsonb
  WHERE NOT EXISTS (
    SELECT 1 FROM public.directory_businesses db
    WHERE (
      db.metadata->>'google_place_id' = 'ChIJRTPK84DRaRARMjKfr3cqZRY' OR 
      (lower(trim(db.business_name)) = lower(trim('DominicMary Koncept & Services')) AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers')))
    )
  )
  RETURNING id
),
target_dir AS (
  SELECT id FROM ins_dir
  UNION ALL
  SELECT id FROM public.directory_businesses db
  WHERE lower(trim(db.business_name)) = lower(trim('DominicMary Koncept & Services'))
    AND lower(trim(COALESCE(db.state, ''))) = lower(trim('Rivers'))
  LIMIT 1
)
INSERT INTO public.services (
  directory_business_id, service_name, service_category, description,
  sub_services, pricing_type, locations_covered, keywords, approval_status
)
SELECT
  td.id,
  'Graphic designer',
  'Branding, Design & Digital Media',
  'DominicMary Koncept & Services provides Graphic designer services at Okemini Rd, Rivers. Rated 4.6/5 across 19 customer reviews. Note: design, print, ICT training.',
  ARRAY['Graphic designer', 'Graphic Designer', 'Branding & Visual Identity', 'Print & Digital Design', 'Print & Signage Production', 'Vocational Training & Academy']::TEXT[],
  'Request a Quote',
  ARRAY['Okemini Rd', 'Port Harcourt', 'Rivers']::TEXT[],
  ARRAY['graphic designer', 'branding & visual identity', 'print & digital design', 'print & signage production', 'vocational training & academy', 'okemini rd', 'port harcourt', 'rivers', 'dominicmary koncept & services', 'chijrtpk84drararmjkfr3cqzry']::TEXT[],
  'Approved'
FROM target_dir td
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.directory_business_id = td.id
    AND lower(trim(s.service_name)) = lower(trim('Graphic designer'))
);

COMMIT;
