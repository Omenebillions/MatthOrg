import React, { useState, useEffect, useMemo } from 'react';
import {
  ThumbsUp,
  Search,
  Plus,
  Filter,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  Star,
  ArrowRight,
  Sun,
  Zap,
  Droplets,
  UtensilsCrossed,
  Cake,
  Hammer,
  Wind,
  Paintbrush,
  Wrench,
  Shield,
  Scissors,
  Grid,
  Sparkles,
  Share2,
  Menu,
  X,
} from 'lucide-react';
import { ArtisanRecommendation } from '../../types';
import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  fetchArtisanRecommendations,
} from '../../data/recommendationsData';
import { ArtisanRecommendationCard } from './ArtisanRecommendationCard';
import { RecommendModal } from './RecommendModal';
import { BrandLogo } from '../common/BrandLogo';

interface ArtisanRecommendationPageProps {
  onNavigateHome: () => void;
  onNavigateServices?: (service?: string, location?: string) => void;
  onNavigateBlog?: () => void;
  onJoinAsBusiness?: () => void;
  onRequestQuoteForArtisan?: (artisanName: string, trade: string, location: string) => void;
}

export const ArtisanRecommendationPage: React.FC<ArtisanRecommendationPageProps> = ({
  onNavigateHome,
  onNavigateServices,
  onNavigateBlog,
  onJoinAsBusiness,
  onRequestQuoteForArtisan,
}) => {
  const [recommendations, setRecommendations] = useState<ArtisanRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecommendModalOpen, setIsRecommendModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Filters
  const [selectedTrade, setSelectedTrade] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'vouches' | 'rating' | 'newest'>('vouches');

  // Load recommendations
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchArtisanRecommendations();
        if (isMounted) setRecommendations(data);
      } catch (err) {
        console.error('Failed to load artisan recommendations:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered & sorted recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations
      .filter((rec) => {
        // Trade filter
        if (selectedTrade !== 'all') {
          const cat = ARTISAN_TRADE_CATEGORIES.find((c) => c.id === selectedTrade);
          if (cat) {
            const matchesCategory =
              rec.trade_category.toLowerCase().includes(cat.shortLabel.toLowerCase()) ||
              rec.trade_category.toLowerCase().includes(cat.id.toLowerCase());
            if (!matchesCategory) return false;
          }
        }

        // State filter
        if (selectedState !== 'all' && rec.state.toLowerCase() !== selectedState.toLowerCase()) {
          return false;
        }

        // Search query (search across artisan_name, services_offered, town, state, work_done, recommendation_note)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const nameMatch = rec.artisan_name.toLowerCase().includes(q);
          const tradeMatch = rec.trade_category.toLowerCase().includes(q);
          const townMatch = rec.town.toLowerCase().includes(q);
          const stateMatch = rec.state.toLowerCase().includes(q);
          const serviceMatch = (rec.services_offered || []).some((s) => s.toLowerCase().includes(q));
          const workMatch = (rec.work_done || '').toLowerCase().includes(q);
          const noteMatch = (rec.recommendation_note || '').toLowerCase().includes(q);

          if (!nameMatch && !tradeMatch && !townMatch && !stateMatch && !serviceMatch && !workMatch && !noteMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'vouches') {
          return (b.vouches_count || 0) - (a.vouches_count || 0);
        }
        if (sortBy === 'rating') {
          return (b.rating || 0) - (a.rating || 0);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [recommendations, selectedTrade, selectedState, searchQuery, sortBy]);

  // Aggregate stats
  const totalRecommendations = recommendations.length;
  const totalVouches = recommendations.reduce((sum, r) => sum + (r.vouches_count || 1), 0);
  const uniqueTowns = new Set(recommendations.map((r) => `${r.town}, ${r.state}`)).size;

  const handleRecommendationAdded = (newRec: ArtisanRecommendation) => {
    setRecommendations((prev) => [newRec, ...prev]);
  };

  const handleVouchUpdated = (id: string, newCount: number) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, vouches_count: newCount } : r))
    );
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] text-[#0B192C] flex flex-col font-sans selection:bg-[#0B192C] selection:text-white">
      {/* 1. Global Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E9F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <BrandLogo
              size="md"
              subtitle="Artisan Wall"
              onClick={onNavigateHome}
            />

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 text-[15px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={onNavigateHome}
                className="hover:text-[#0B192C] transition-colors whitespace-nowrap cursor-pointer"
              >
                Home
              </button>
              {onNavigateServices && (
                <button
                  type="button"
                  onClick={() => onNavigateServices()}
                  className="hover:text-[#0B192C] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Find Professionals
                </button>
              )}
              {onNavigateBlog && (
                <button
                  type="button"
                  onClick={onNavigateBlog}
                  className="hover:text-[#0B192C] transition-colors whitespace-nowrap cursor-pointer"
                >
                  Articles & Guides
                </button>
              )}
              <span className="text-[#0B192C] font-bold border-b-2 border-[#0B192C] pb-0.5 whitespace-nowrap">
                Artisan Wall
              </span>
            </nav>
          </div>

          {/* Action CTAs & Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {onJoinAsBusiness && (
              <button
                type="button"
                onClick={onJoinAsBusiness}
                className="hidden sm:inline-flex text-[14px] font-semibold text-slate-700 hover:text-[#0B192C] px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
              >
                Are you an Artisan? Join
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsRecommendModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm cursor-pointer"
            >
              <ThumbsUp className="w-4 h-4" />
              <span className="hidden xs:inline">Recommend an Artisan</span>
              <span className="xs:hidden">Recommend</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#0B192C] hover:bg-[#F1F5F9] md:hidden transition-colors focus:outline-none cursor-pointer"
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
              className="block w-full text-left py-2.5 text-[15px] font-semibold text-slate-700 hover:text-[#0B192C]"
            >
              Home & Marketplace
            </button>

            {onNavigateServices && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateServices();
                }}
                className="block w-full text-left py-2.5 text-[15px] font-semibold text-slate-700 hover:text-[#0B192C]"
              >
                Find Professionals
              </button>
            )}

            {onNavigateBlog && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigateBlog();
                }}
                className="block w-full text-left py-2.5 text-[15px] font-semibold text-slate-700 hover:text-[#0B192C]"
              >
                Articles & Guides
              </button>
            )}

            <div className="py-2.5 text-[15px] font-bold text-[#0B192C] flex items-center justify-between border-b border-slate-100">
              <span>Artisan Wall (Current)</span>
              <span className="text-[13px] bg-[#0B192C]/10 text-[#0B192C] px-2.5 py-0.5 rounded-full font-bold">Active</span>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsRecommendModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Recommend an Artisan</span>
              </button>

              {onJoinAsBusiness && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onJoinAsBusiness();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-[15px] font-bold rounded-xl transition-colors text-center cursor-pointer"
                >
                  Are you an Artisan? Join Free
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. Hero Section with Community Artisan Feature Image */}
      <section className="bg-white border-b border-[#E5E9F0] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Copy & Actions */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 text-[13px] font-bold text-[#0B192C] uppercase tracking-wider bg-[#0B192C]/5 px-3.5 py-1.5 rounded-full border border-[#0B192C]/15">
                <Sparkles className="w-4 h-4 text-[#0B192C]" />
                <span>Community-Powered Artisan Discovery</span>
              </div>

              <h1 className="type-hero text-[#0B192C]">
                Liked the service of an artisan?{' '}
                <span className="text-[#1E3E62]">Recommend them.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                Electricians who wire conduit safely, solar engineers who test every panel, plumbers who fix stubborn leaks, chefs who cook unforgettable meals, bakers, carpenters, and mechanics.
                Recommend the artisans whose craftsmanship you trust so other clients can find them and hire them directly.
              </p>

              {/* Quick Metrics Bar */}
              <div className="pt-1 flex flex-wrap items-center gap-y-2 gap-x-6 text-[14px] text-slate-600 font-medium tabular-nums">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    <strong className="text-[#0B192C] font-bold">{totalRecommendations}</strong> Verified Recommendations
                  </span>
                </div>
                <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-[#0B192C]" />
                  <span>
                    <strong className="text-[#0B192C] font-bold">{totalVouches}</strong> Community Vouches
                  </span>
                </div>
                <span aria-hidden="true" className="text-slate-300 hidden sm:inline">·</span>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>
                    <strong className="text-[#0B192C] font-bold">{uniqueTowns}</strong> Active Towns & Cities
                  </span>
                </div>
              </div>

              {/* CTA action row */}
              <div className="pt-2 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setIsRecommendModalOpen(true)}
                  className="px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] sm:text-base font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm inline-flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit a Recommendation</span>
                </button>
                <p className="text-[13px] text-slate-500">
                  Takes less than 60 seconds · Free direct visibility for hardworking artisans
                </p>
              </div>
            </div>

            {/* Right Column: Featured Image with Trust Card Overlay */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-xl bg-slate-900 group">
                <img
                  src="/WhatsApp Image 2026-10-23 at 11.06.06 AM.jpeg"
                  onError={(e) => {
                    // Fallback to alias if needed
                    e.currentTarget.src = '/artisan-handshake.jpg';
                  }}
                  alt="Homeowner greeting and shaking hands with a Nigerian artisan at the front door"
                  className="w-full h-80 sm:h-96 lg:h-[420px] object-cover object-center group-hover:scale-[1.02] transition-transform duration-500"
                />

                {/* Subtle gradient overlay for contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Top Badge */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/95 backdrop-blur-md text-[13px] font-bold text-[#0B192C] shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B192C]" />
                    Trusted Local Craftsmanship
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[13px] font-bold shadow-sm">
                    ✓ Verified Work
                  </span>
                </div>

                {/* Bottom Caption Card */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5 p-3.5 rounded-xl bg-[#0B192C]/90 backdrop-blur-md text-white border border-white/10 space-y-1">
                  <p className="text-[14px] font-bold leading-snug flex items-center gap-1.5">
                    <ThumbsUp className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Every Outstanding Job Deserves Recognition</span>
                  </p>
                  <p className="text-[13px] text-slate-300 leading-relaxed">
                    When you recommend a good electrician, solar engineer, or plumber, you help fellow homeowners hire with confidence.
                  </p>
                </div>
              </div>

              {/* Decorative accent blur */}
              <div className="absolute -bottom-4 -right-4 w-48 h-48 bg-[#0B192C]/10 rounded-full blur-2xl -z-10 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trade Category Filter Bar (Functional segmented buttons) */}
      <section className="bg-slate-50 border-b border-slate-200 py-3 sticky top-16 z-30 shadow-2xs backdrop-blur-xs bg-slate-50/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedTrade('all')}
              className={`shrink-0 px-4 py-2 text-[14px] font-semibold whitespace-nowrap rounded-lg transition-colors cursor-pointer ${
                selectedTrade === 'all'
                  ? 'bg-[#0B192C] text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-[#0B192C]'
              }`}
            >
              All Trades ({recommendations.length})
            </button>

            {ARTISAN_TRADE_CATEGORIES.map((cat) => {
              const count = recommendations.filter((r) =>
                r.trade_category.toLowerCase().includes(cat.shortLabel.toLowerCase())
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedTrade(cat.id)}
                  className={`shrink-0 px-3.5 py-2 text-[14px] font-medium whitespace-nowrap rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedTrade === cat.id
                      ? 'bg-[#0B192C] text-white shadow-2xs font-semibold'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-[#0B192C]'
                  }`}
                >
                  <span>{cat.shortLabel}</span>
                  {count > 0 && <span className="opacity-75 text-[13px] tabular-nums">({count})</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Main Search & Results Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 flex-1 w-full space-y-6">
        {/* Controls Bar: Search + State Filter + Sort */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by artisan name, trade, town (e.g. Lekki, Maitama), or service offered..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder:text-slate-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[14px] font-semibold text-slate-500 hover:text-slate-800 absolute right-3 top-2.5 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Location & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* State filter */}
            <div className="flex items-center gap-1.5 text-[14px] text-slate-600">
              <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
              >
                <option value="all">All States</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort selector */}
            <div className="flex items-center gap-1.5 text-[14px] text-slate-600">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#0B192C]/20 focus:border-[#0B192C]"
              >
                <option value="vouches">Most Vouches</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between text-[14px] text-slate-600 font-medium px-1">
          <p className="tabular-nums">
            Showing <strong className="text-[#0B192C]">{filteredRecommendations.length}</strong>{' '}
            {filteredRecommendations.length === 1 ? 'artisan recommendation' : 'artisan recommendations'}
            {selectedTrade !== 'all' && (
              <span> in {ARTISAN_TRADE_CATEGORIES.find((c) => c.id === selectedTrade)?.shortLabel}</span>
            )}
            {selectedState !== 'all' && <span> in {selectedState}</span>}
          </p>

          {(selectedTrade !== 'all' || selectedState !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedTrade('all');
                setSelectedState('all');
                setSearchQuery('');
              }}
              className="text-[14px] text-[#0B192C] hover:text-[#1E3E62] font-semibold underline underline-offset-2 whitespace-nowrap cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Recommendation Cards Grid */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#0B192C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[15px] text-slate-600">Loading community recommendations...</p>
          </div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
            <div className="w-12 h-12 bg-[#0B192C]/10 text-[#0B192C] rounded-full flex items-center justify-center mx-auto">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <h3 className="font-heading text-xl font-bold text-[#0B192C]">
              No recommendations found matching your criteria
            </h3>
            <p className="text-[15px] text-slate-600 max-w-md mx-auto leading-relaxed">
              Know a reliable artisan or contractor in this trade or town? Be the first to vouch for them and help fellow clients hire them.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsRecommendModalOpen(true)}
                className="px-6 py-3 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Recommend This Artisan</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecommendations.map((rec) => (
              <ArtisanRecommendationCard
                key={rec.id}
                recommendation={rec}
                onVouchUpdated={handleVouchUpdated}
                onRequestQuote={(artisanName, trade, loc) => {
                  if (onRequestQuoteForArtisan) {
                    onRequestQuoteForArtisan(artisanName, trade, loc);
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* 5. Why Community Recommendations Matter Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 mt-12 space-y-8">
          <div className="max-w-2xl">
            <h2 className="type-section-title text-[#0B192C]">
              Why Recommending Artisans Matters
            </h2>
            <p className="text-[15px] sm:text-base text-slate-600 mt-2.5 leading-relaxed">
              Finding reliable artisans in Nigeria is often a game of trial and error. By spotlighting the craftsmen and women who show up on time, quote honestly, and deliver immaculate work, we transform the service economy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0B192C]/10 text-[#0B192C] flex items-center justify-center font-bold text-[15px]">
                1
              </div>
              <h3 className="font-heading text-[18px] font-bold text-[#0B192C]">
                Rewarding Integrity & Skill
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Great artisans don't always have giant marketing budgets. Your recommendation gives honest technicians the visibility and reputation they deserve.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[15px]">
                2
              </div>
              <h3 className="font-heading text-[18px] font-bold text-[#0B192C]">
                Direct Contact, Zero Middlemen
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Clients connect directly with artisans via verified phone and WhatsApp numbers without arbitrary commission markups or agency delays.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[15px]">
                3
              </div>
              <h3 className="font-heading text-[18px] font-bold text-[#0B192C]">
                Real Work, Verified Proof
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                Every recommendation includes details of the actual job completed, the location, and why the client vouches for them.
              </p>
            </div>
          </div>
        </section>

        {/* 6. Join as Business / Promote your trade CTA */}
        <section className="bg-gradient-to-r from-[#0B192C] via-[#152744] to-[#1E3E62] rounded-2xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 max-w-xl">
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Are you an artisan, engineer, or service business?
            </h2>
            <p className="text-[15px] sm:text-base text-slate-200 leading-relaxed">
              Create professional quotations in seconds, send invoices with automated WhatsApp follow-ups, and receive customer leads directly in your dashboard on MatthOrg.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {onJoinAsBusiness && (
              <button
                type="button"
                onClick={onJoinAsBusiness}
                className="px-6 py-3 bg-white hover:bg-slate-100 text-[#0B192C] text-[15px] font-bold rounded-xl transition-colors whitespace-nowrap shadow-sm text-center cursor-pointer"
              >
                Join MatthOrg Free
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsRecommendModalOpen(true)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-[15px] font-semibold rounded-xl transition-colors whitespace-nowrap text-center cursor-pointer border border-white/20"
            >
              Recommend a Colleague
            </button>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16 py-12 text-slate-600 text-[14px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo size="xs" onClick={onNavigateHome} />
              <span className="text-slate-300">·</span>
              <span className="text-[14px] text-slate-600 font-medium">Artisan Recommendations & Service Commerce Platform</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[14px]">
              <button type="button" onClick={onNavigateHome} className="hover:text-[#0B192C] cursor-pointer">
                Home
              </button>
              {onNavigateServices && (
                <button type="button" onClick={() => onNavigateServices()} className="hover:text-[#0B192C] cursor-pointer">
                  Find Pros
                </button>
              )}
              {onNavigateBlog && (
                <button type="button" onClick={onNavigateBlog} className="hover:text-[#0B192C] cursor-pointer">
                  Guides
                </button>
              )}
              <button type="button" onClick={() => setIsRecommendModalOpen(true)} className="text-[#0B192C] font-semibold hover:underline cursor-pointer">
                Recommend an Artisan
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[13px]">
            <p>© {new Date().getFullYear()} MatthOrg Technologies. Dedicated to Nigerian artisans, contractors, and clients.</p>
            <p>Empowering electricians, plumbers, solar engineers, chefs, bakers, and builders nationwide.</p>
          </div>
        </div>
      </footer>

      {/* 8. Recommendation Submission Modal */}
      <RecommendModal
        isOpen={isRecommendModalOpen}
        onClose={() => setIsRecommendModalOpen(false)}
        onRecommendationCreated={handleRecommendationAdded}
      />
    </div>
  );
};
