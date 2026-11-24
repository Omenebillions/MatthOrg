import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  User,
  Share2,
  ArrowRight,
  BookOpen,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { BlogPost, INITIAL_BLOG_POSTS, getBlogPostBySlug } from '../../data/blogPosts';
import { getManagedArticles } from '../../lib/articlesDb';
import { Breadcrumbs } from './Breadcrumbs';
import { SeoMarketplaceCta } from './SeoMarketplaceCta';
import { updatePageMetadata, generateArticleSchema, generateBreadcrumbSchema } from '../../utils/seo';
import { BrandLogo } from '../common/BrandLogo';

interface BlogArticlePageProps {
  slug: string;
  onNavigateHome: () => void;
  onNavigateBlog: () => void;
  onSelectArticle: (slug: string) => void;
  onNavigateServiceLocation: (serviceSlug?: string, locationSlug?: string) => void;
  onFindPros: (serviceCategory?: string) => void;
  onPostRequest: (prefillService?: string) => void;
  onJoinAsBusiness: () => void;
}

export const BlogArticlePage: React.FC<BlogArticlePageProps> = ({
  slug,
  onNavigateHome,
  onNavigateBlog,
  onSelectArticle,
  onNavigateServiceLocation,
  onFindPros,
  onPostRequest,
  onJoinAsBusiness,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Find article from static guide repository or dynamically managed articles
  const article: BlogPost | undefined = useMemo(() => {
    const staticMatch = getBlogPostBySlug(slug);
    if (staticMatch) return staticMatch;

    const managedMatch = getManagedArticles().find(
      (a) => a.slug === slug.toLowerCase().trim() && a.status === 'published'
    );
    if (managedMatch) {
      return {
        id: managedMatch.id,
        slug: managedMatch.slug,
        title: managedMatch.title,
        seoTitle: managedMatch.seoTitle || managedMatch.title,
        seoDescription: managedMatch.seoDescription || managedMatch.excerpt,
        excerpt: managedMatch.excerpt,
        category: managedMatch.category,
        categorySlug: managedMatch.category.toLowerCase().replace(/[^\w]/g, '-'),
        featuredImage: managedMatch.featured_image,
        featuredImageAlt: managedMatch.title,
        author: { name: managedMatch.author, role: 'MatthOrg Expert Contributor' },
        readTimeMinutes: Math.max(3, Math.round((managedMatch.body || '').split(' ').length / 200)),
        publishedAt: managedMatch.published_at || managedMatch.created_at,
        updatedAt: managedMatch.updated_at,
        status: 'published',
        contentSections: [
          {
            heading: 'Detailed Guide',
            id: 'detailed-guide',
            body: managedMatch.body ? managedMatch.body.split('\n\n').filter(Boolean) : [managedMatch.excerpt],
          },
        ],
        suggestedAction: {
          serviceCategory: managedMatch.category,
          ctaHeadline: `Need a ${managedMatch.category} Professional?`,
          ctaSubtext: 'Find verified contractors on MatthOrg or submit your project details.',
          findProsText: `Find ${managedMatch.category} Pros`,
          postRequestText: 'Post a Request',
        },
      };
    }

    return undefined;
  }, [slug]);

  // Update SEO Metadata and Structured Schema
  useEffect(() => {
    if (article) {
      const canonical = `/blog/${article.slug}`;
      const articleSchema = generateArticleSchema({
        title: article.seoTitle || article.title,
        description: article.seoDescription || article.excerpt,
        url: canonical,
        imageUrl: article.featuredImage,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
        authorName: article.author.name,
      });

      const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Guides', url: '/blog' },
        { name: article.category, url: '/blog' },
        { name: article.title, url: canonical },
      ]);

      updatePageMetadata({
        title: `${article.seoTitle || article.title} | MatthOrg`,
        description: article.seoDescription || article.excerpt,
        canonicalPath: canonical,
        ogType: 'article',
        ogImage: article.featuredImage,
        articlePublishedTime: article.publishedAt,
        articleModifiedTime: article.updatedAt,
        articleAuthor: article.author.name,
        schema: [articleSchema, breadcrumbSchema],
      });
    }
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="type-section-title font-heading text-gray-900">Guide Not Found</h1>
        <p className="text-base text-gray-600 mt-2 max-w-md leading-relaxed">
          The article you are looking for may have moved or is currently in draft review.
        </p>
        <button
          onClick={onNavigateBlog}
          className="mt-6 px-6 py-2.5 bg-[#3D74D9] hover:bg-[#2B5BB8] text-white font-semibold text-[15px] rounded-xl transition-all whitespace-nowrap"
        >
          Return to MatthOrg Guides
        </button>
      </div>
    );
  }

  // Related Guides
  const relatedArticles = INITIAL_BLOG_POSTS.filter(
    (p) => p.slug !== article.slug && (p.category === article.category || article.relatedGuideSlugs?.includes(p.slug))
  ).slice(0, 3);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: article.title,
        text: article.excerpt,
        url: window.location.href,
      }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert('Article link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Header */}
      <header className="bg-white border-b border-[#E5E9F0] sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" onClick={onNavigateHome} />
            <span className="text-gray-300 font-light">/</span>
            <button
              onClick={onNavigateBlog}
              className="text-[15px] font-semibold text-gray-600 hover:text-[#0B192C] transition-colors cursor-pointer whitespace-nowrap"
            >
              Guides
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className="px-3 py-2 text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors flex items-center gap-1.5 text-[14px] font-medium cursor-pointer whitespace-nowrap"
              title="Share article"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => onPostRequest(article.serviceName || article.category)}
              className="px-3.5 sm:px-4 py-2 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] sm:text-[15px] font-semibold rounded-xl shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              Post a Request
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
                onNavigateBlog();
              }}
              className="block w-full text-left py-2 text-[15px] font-semibold text-gray-700 hover:text-[#0B192C]"
            >
              All Guides
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
                  onPostRequest(article.serviceName || article.category);
                }}
                className="w-full py-2.5 bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Post a Request for {article.category}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Article Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Marketplace', onClick: onNavigateHome },
            { label: 'Guides', onClick: onNavigateBlog },
            { label: article.category, onClick: onNavigateBlog },
            { label: article.title },
          ]}
          className="mb-6"
        />

        {/* Article Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[13px] font-bold bg-blue-50 text-[#3D74D9] border border-blue-100 mb-4 whitespace-nowrap">
            <span>{article.category}</span>
          </div>

          <h1 className="type-page-title font-heading text-gray-900">
            {article.title}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-gray-600 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          {/* Author & Timestamp Bar */}
          <div className="mt-6 pt-6 border-t border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {article.author.avatar ? (
                <img
                  src={article.author.avatar}
                  alt={article.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#3D74D9] flex items-center justify-center font-heading font-bold text-[15px]">
                  {article.author.name.substring(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-[15px] font-bold text-gray-900">{article.author.name}</p>
                <p className="text-[13px] text-gray-600">{article.author.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[13px] font-medium text-gray-600 tabular-nums">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gray-500" />
                {new Date(article.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-500" />
                {article.readTimeMinutes} min read
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <div className="mb-10 rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 h-64 sm:h-96 w-full">
          <img
            src={article.featuredImage}
            alt={article.featuredImageAlt}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Table of Contents */}
        {article.tableOfContents && article.tableOfContents.length > 0 && (
          <div className="mb-10 p-6 bg-white border border-gray-200 rounded-xl">
            <h2 className="text-[13px] font-heading font-bold uppercase tracking-wider text-gray-600 mb-3">
              In this guide
            </h2>
            <ul className="space-y-2.5 text-[15px]">
              {article.tableOfContents.map((item, idx) => (
                <li key={item.id} className="flex items-start gap-2.5">
                  <span className="text-[14px] font-bold text-[#3D74D9] mt-0.5 tabular-nums">{idx + 1}.</span>
                  <a
                    href={`#${item.id}`}
                    className="text-gray-700 hover:text-[#3D74D9] font-medium transition-colors"
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Main Content Body */}
        <article className="prose prose-blue max-w-none space-y-8 text-gray-800 leading-[1.7] text-base sm:text-[17px]">
          {article.contentSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-20">
              <h2 className="type-section-title font-heading text-gray-900 mb-4 pb-2 border-b border-gray-100">
                {section.heading}
              </h2>

              <div className="space-y-4">
                {section.body.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-gray-700 leading-[1.7]">
                    {paragraph}
                  </p>
                ))}
              </div>

              {section.callout && (
                <div
                  className={`mt-6 p-4 sm:p-5 rounded-xl border flex items-start gap-3 ${
                    section.callout.type === 'tip'
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : section.callout.type === 'warning'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-gray-50 border-gray-200 text-gray-800'
                  }`}
                >
                  {section.callout.type === 'tip' ? (
                    <HelpCircle className="w-5 h-5 text-[#3D74D9] flex-shrink-0 mt-0.5" />
                  ) : section.callout.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-[13px] font-heading font-bold uppercase tracking-wider mb-1">
                      {section.callout.title}
                    </h3>
                    <p className="text-[15px] leading-relaxed">{section.callout.text}</p>
                  </div>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Action Callout Box */}
        <div className="mt-12">
          <SeoMarketplaceCta
            serviceName={article.serviceName || article.category}
            locationName="Nigeria"
            onFindPros={() => onFindPros(article.serviceSlug || article.category)}
            onPostRequest={() => onPostRequest(article.serviceName || article.category)}
            onJoinAsBusiness={onJoinAsBusiness}
          />
        </div>

        {/* Related Guides Section */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="type-section-title font-heading text-gray-900">Related Guides & Articles</h2>
              <button
                onClick={onNavigateBlog}
                className="text-[14px] font-bold text-[#3D74D9] hover:underline flex items-center gap-1 whitespace-nowrap"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectArticle(rel.slug)}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="h-36 overflow-hidden">
                    <img
                      src={rel.featuredImage}
                      alt={rel.featuredImageAlt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[13px] font-bold text-[#3D74D9] uppercase tracking-wider">
                        {rel.category}
                      </span>
                      <h3 className="font-heading font-bold text-gray-900 text-[17px] mt-1 line-clamp-2 group-hover:text-[#3D74D9] transition-colors leading-snug">
                        {rel.title}
                      </h3>
                    </div>
                    <span className="mt-3 text-[14px] font-semibold text-gray-700 flex items-center gap-1 whitespace-nowrap">
                      Read guide <ArrowRight className="w-3.5 h-3.5 text-[#3D74D9]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
