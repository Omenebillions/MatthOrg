import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  ArrowRight,
  ShieldCheck,
  Building2,
  ChevronRight,
  Search,
  CheckCircle,
  Menu,
  X,
} from 'lucide-react';
import { LocationState, NIGERIA_LOCATIONS, getLocationBySlug } from '../../data/nigeriaLocations';
import { getAllServices, ServiceTaxonomyItem } from '../../data/serviceTaxonomy';
import { INITIAL_BLOG_POSTS } from '../../data/blogPosts';
import { PublicProfessionalProfile } from '../../types';
import { fetchPublicProfessionals } from '../../lib/db';
import { Breadcrumbs } from './Breadcrumbs';
import { RealProsList } from './RealProsList';
import { SeoMarketplaceCta } from './SeoMarketplaceCta';
import { updatePageMetadata, generateBreadcrumbSchema } from '../../utils/seo';
import { BrandLogo } from '../common/BrandLogo';

interface LocationHubPageProps {
  locationSlug?: string;
  onNavigateHome: () => void;
  onNavigateLocation: (locationSlug: string) => void;
  onNavigateServiceLocation: (serviceSlug: string, locationSlug?: string) => void;
  onNavigateArticle: (slug: string) => void;
  onSelectProfessional: (pro: PublicProfessionalProfile) => void;
  onPostRequest: (prefillService?: string, prefillLocation?: string) => void;
  onJoinAsBusiness: () => void;
}

export const LocationHubPage: React.FC<LocationHubPageProps> = ({
  locationSlug,
  onNavigateHome,
  onNavigateLocation,
  onNavigateServiceLocation,
  onNavigateArticle,
  onSelectProfessional,
  onPostRequest,
  onJoinAsBusiness,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [professionals, setProfessionals] = useState<PublicProfessionalProfile[]>([]);
  const [isLoadingPros, setIsLoadingPros] = useState(true);
  const [servicesList, setServicesList] = useState<ServiceTaxonomyItem[]>(() => getAllServices());

  useEffect(() => {
    const handleUpdate = () => {
      setServicesList(getAllServices());
    };
    window.addEventListener('matthorg_services_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('matthorg_services_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Active Location State if specified
  const currentLocation: LocationState | undefined = useMemo(() => {
    return locationSlug ? getLocationBySlug(locationSlug) : undefined;
  }, [locationSlug]);

  const locationTitle = currentLocation
    ? currentLocation.isFct
      ? 'Abuja (FCT)'
      : `${currentLocation.name} State`
    : 'All 36 Nigerian States & FCT Abuja';

  // Load real verified pros for this location
  useEffect(() => {
    let isMounted = true;
    setIsLoadingPros(true);

    fetchPublicProfessionals({
      location: currentLocation?.name || undefined,
      randomize: true,
    })
      .then((data) => {
        if (isMounted) {
          setProfessionals(data || []);
          setIsLoadingPros(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingPros(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentLocation]);

  // Update SEO metadata
  useEffect(() => {
    const isSingle = Boolean(currentLocation);
    const title = isSingle
      ? `Verified Professionals & Local Services in ${locationTitle} | MatthOrg`
      : 'Find Verified Contractors Across All 36 Nigerian States & Abuja | MatthOrg';

    const desc = isSingle
      ? `Discover verified service professionals in ${locationTitle}. Connect with certified solar installers, electricians, plumbers, CCTV technicians, and building contractors.`
      : 'Browse certified service businesses, contractors, and verified professionals across all 36 Nigerian states and FCT Abuja on MatthOrg.';

    const canonicalPath = isSingle ? `/locations/${currentLocation?.slug}` : '/locations';

    const breadcrumbs = [{ name: 'Home', url: '/' }];
    if (isSingle && currentLocation) {
      breadcrumbs.push({ name: 'Locations', url: '/locations' });
      breadcrumbs.push({ name: currentLocation.name, url: canonicalPath });
    } else {
      breadcrumbs.push({ name: 'Locations', url: canonicalPath });
    }

    updatePageMetadata({
      title,
      description: desc,
      canonicalPath,
      ogType: 'website',
      schema: generateBreadcrumbSchema(breadcrumbs),
    });
  }, [currentLocation, locationTitle]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    return NIGERIA_LOCATIONS.filter((loc) => {
      const matchesRegion = selectedRegion === 'all' || loc.region === selectedRegion;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loc.name.toLowerCase().includes(q) ||
        loc.capital.toLowerCase().includes(q) ||
        loc.majorCities.some((c) => c.name.toLowerCase().includes(q));

      return matchesRegion && matchesSearch;
    });
  }, [selectedRegion, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E9F0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" onClick={onNavigateHome} />
            <span className="text-gray-300 font-light">/</span>
            <span className="text-[15px] font-semibold text-gray-700">Locations</span>
            {currentLocation && (
              <>
                <span className="text-gray-300 font-light">/</span>
                <span className="text-[15px] font-semibold text-[#0B192C]">{currentLocation.name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => onPostRequest(undefined, currentLocation?.name)}
              className="px-3.5 sm:px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] sm:text-[15px] font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Post a Request
            </button>
            <button
              onClick={onNavigateHome}
              className="hidden sm:inline-flex text-[14px] font-semibold text-gray-700 hover:text-gray-900 border border-gray-300 rounded-xl px-3.5 py-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              Marketplace
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0B192C] hover:bg-slate-100 md:hidden transition-colors focus:outline-none cursor-pointer"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E9F0] bg-white px-5 pt-3 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateHome();
              }}
              className="block w-full text-left py-2 text-[15px] font-semibold text-gray-700 hover:text-[#0B192C]"
            >
              Marketplace Home
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigateServiceLocation('all');
              }}
              className="block w-full text-left py-2 text-[15px] font-semibold text-gray-700 hover:text-[#0B192C]"
            >
              All Services
            </button>
            <a
              href="/recommend"
              onClick={(e) => {
                e.preventDefault();
                setMobileMenuOpen(false);
                window.history.pushState({}, '', '/recommend');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="block w-full text-left py-2 text-[15px] font-semibold text-gray-700 hover:text-[#0B192C]"
            >
              Recommend an Artisan
            </a>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onPostRequest(undefined, currentLocation?.name);
                }}
                className="w-full py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Post a Service Request</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Marketplace', onClick: onNavigateHome },
            {
              label: 'Locations',
              onClick: currentLocation ? () => onNavigateLocation('') : undefined,
            },
            ...(currentLocation ? [{ label: currentLocation.name }] : []),
          ]}
          className="mb-6"
        />

        {/* Hero Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-sm mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[13px] font-bold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-3 whitespace-nowrap">
              <MapPin className="w-4 h-4" />
              <span>Nationwide Coverage</span>
            </div>

            <h1 className="type-page-title font-heading text-gray-900">
              {currentLocation
                ? `Local Services & Contractors in ${locationTitle}`
                : 'Service Locations Across Nigeria'}
            </h1>

            <p className="mt-3 text-base sm:text-[17px] text-gray-600 leading-relaxed font-normal">
              {currentLocation
                ? `${currentLocation.localOverview} Browse verified service categories and certified local businesses serving ${currentLocation.name}.`
                : 'Connect with verified businesses and certified contractors in all 36 Nigerian states and FCT Abuja. Select a state or search for your city below.'}
            </p>

            {currentLocation && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 text-[15px] text-gray-700 leading-relaxed">
                <span className="font-heading font-bold text-gray-900 block mb-1">Common Local Projects:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentLocation.commonProjects?.map((proj, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-[13px] font-medium rounded-md"
                    >
                      {proj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* If Specific Location: Show Services in this Location Grid */}
        {currentLocation && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
              <div>
                <h2 className="type-section-title font-heading text-gray-900">
                  Services in {currentLocation.name}
                </h2>
                <p className="type-secondary text-gray-600 mt-0.5">
                  Browse top requested services tailored for {currentLocation.name}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {servicesList.map((service) => (
                <div
                  key={service.slug}
                  onClick={() => onNavigateServiceLocation(service.slug, currentLocation.slug)}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-[#3D74D9]/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 text-[17px] group-hover:text-[#3D74D9] transition-colors leading-snug">
                      {service.name} in {currentLocation.name}
                    </h3>
                    <p className="text-[14px] text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                      {service.shortDescription}
                    </p>
                  </div>
                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[14px] font-semibold text-[#3D74D9] whitespace-nowrap">
                    <span>View Specialists</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Real Professionals in this Location */}
        {currentLocation && (
          <RealProsList
            professionals={professionals}
            serviceTitle="Local"
            locationName={locationTitle}
            isLoading={isLoadingPros}
            onSelectProfessional={onSelectProfessional}
            onRequestQuotes={() => onPostRequest(undefined, currentLocation.name)}
            onJoinAsBusiness={onJoinAsBusiness}
          />
        )}

        {/* Major Cities / Localities Breakdown */}
        {currentLocation && currentLocation.majorCities.length > 0 && (
          <section className="my-10 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
            <h2 className="type-card-title font-heading text-gray-900 mb-4 pb-2 border-b border-gray-200">
              Major Cities & Localities in {currentLocation.name}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentLocation.majorCities.map((city) => (
                <button
                  key={city.slug}
                  onClick={() => onNavigateServiceLocation('solar', `${currentLocation.slug}/${city.slug}`)}
                  className="p-3.5 rounded-xl bg-gray-50 hover:bg-blue-50/70 border border-gray-200 text-left transition-all group"
                >
                  <span className="font-heading font-bold text-[15px] text-gray-900 group-hover:text-[#3D74D9]">
                    {city.name}
                  </span>
                  <p className="text-[13px] text-gray-600 mt-0.5">Explore services</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All States Directory Explorer */}
        <section className="my-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-2 border-b border-gray-200">
            <div>
              <h2 className="type-section-title font-heading text-gray-900">
                All 36 Nigerian States + FCT Abuja
              </h2>
              <p className="type-secondary text-gray-600 mt-0.5">
                Select any state to explore localized services and verified professionals
              </p>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['all', 'South West', 'South East', 'South South', 'North Central', 'North West', 'North East'].map(
                (reg) => (
                  <button
                    key={reg}
                    onClick={() => setSelectedRegion(reg)}
                    className={`px-3 py-1.5 rounded-lg text-[14px] font-semibold whitespace-nowrap transition-all ${
                      selectedRegion === reg
                        ? 'bg-[#3D74D9] text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {reg === 'all' ? 'All Regions' : reg}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLocations.map((loc) => (
              <button
                key={loc.slug}
                onClick={() => onNavigateLocation(loc.slug)}
                className={`p-4 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                  currentLocation?.slug === loc.slug
                    ? 'bg-blue-50/80 border-[#3D74D9]'
                    : 'bg-white border-gray-200 hover:border-[#3D74D9]/40 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-heading font-bold text-[16px] text-gray-900 group-hover:text-[#3D74D9] transition-colors">
                      {loc.name} {loc.isFct ? '(FCT)' : 'State'}
                    </span>
                    <span className="text-[13px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                      {loc.region}
                    </span>
                  </div>

                  <p className="text-[14px] text-gray-600 mt-1.5">Capital: {loc.capital}</p>

                  <p className="text-[13px] text-gray-600 mt-1.5 line-clamp-1">
                    Cities: {loc.majorCities.map((c) => c.name).join(', ')}
                  </p>
                </div>

                <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[14px] font-semibold text-[#3D74D9] whitespace-nowrap">
                  <span>Explore {loc.name}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Global Marketplace CTA */}
        <SeoMarketplaceCta
          serviceName="Professional"
          locationName={currentLocation ? currentLocation.name : 'Nigeria'}
          onFindPros={() => {}}
          onPostRequest={() => onPostRequest(undefined, currentLocation?.name)}
          onJoinAsBusiness={onJoinAsBusiness}
        />
      </main>
    </div>
  );
};
