import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Megaphone,
  MessageSquare,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
  Target,
  Sliders,
  Database,
  ClipboardList,
  LayoutDashboard,
  TrendingUp,
  AlertCircle,
  Circle,
  Settings,
} from 'lucide-react';
import type {
  AdControlConfig,
  ArtisanRecommendation,
  CatalogProduct,
  DataImportJob,
  FulfilmentRequest,
  ProductEnquiry,
  SponsoredCampaign,
} from '../../types';
import {
  deleteAdminLead,
  deleteSponsoredCampaign,
  fetchAdminLeads,
  fetchCatalogProducts,
  fetchCategories,
  fetchCommerceAnalytics,
  fetchDataHubJobs,
  fetchFulfilmentRequests,
  fetchProductEnquiries,
  fetchSponsoredCampaigns,
  importProductsBatch,
  parseSpreadsheetFile,
  removeCatalogProduct,
  removeCatalogProductsBulk,
  saveCatalogProduct,
  saveCategoriesList,
  saveSponsoredCampaign,
  updateAdControls,
  updateCatalogProduct,
  updateSponsoredCampaign,
  uploadAdminLeads,
  uploadBulkArtisans,
} from '../../data/commerceData';
import {
  ARTISAN_TRADE_CATEGORIES,
  NIGERIAN_STATES,
  fetchArtisanRecommendations,
  updateArtisanRecommendation,
  deleteArtisanRecommendation,
} from '../../data/recommendationsData';
import { DemandAdvertsView } from './DemandAdvertsView';
import { DataHubView } from './DataHubView';
import { FulfilmentView } from './FulfilmentView';
import { uploadProjectImage } from '../../lib/storage';

interface AdminConsoleViewProps {
  onNavigateToMarketplace?: () => void;
  onNavigateToArtisans?: () => void;
  onOpenRecommendWall?: () => void;
  onProductDeleted?: (deletedIds: string[]) => Promise<void> | void;
}

type AdminTab = 'overview' | 'datahub' | 'fulfilment' | 'products' | 'campaigns' | 'artisans' | 'leads' | 'analytics';

export const AdminConsoleView: React.FC<AdminConsoleViewProps> = ({
  onNavigateToMarketplace,
  onNavigateToArtisans,
  onOpenRecommendWall,
  onProductDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [notice, setNotice] = useState<string | null>(null);
  const [adminGlobalSearch, setAdminGlobalSearch] = useState('');

  // Unified data state
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [campaigns, setCampaigns] = useState<SponsoredCampaign[]>([]);
  const [adControls, setAdControls] = useState<AdControlConfig>({
    global_ads_enabled: true,
    max_sponsored_per_response: 1,
    min_relevance_threshold: 45,
    ad_frequency: 'every_matching_response',
    allow_over_budget_ads: false,
  });
  const [enquiries, setEnquiries] = useState<ProductEnquiry[]>([]);
  const [artisans, setArtisans] = useState<ArtisanRecommendation[]>([]);
  const [adminLeads, setAdminLeads] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fulfilmentRequests, setFulfilmentRequests] = useState<FulfilmentRequest[]>([]);
  const [dataHubJobs, setDataHubJobs] = useState<DataImportJob[]>([]);

  // Search, selection & filters
  const [productSearch, setProductSearch] = useState('');
  const [productFilterType, setProductFilterType] = useState<'all' | 'external_marketplace' | 'business_owned' | 'pending'>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [confirmDeleteProductId, setConfirmDeleteProductId] = useState<string | null>(null);
  const [confirmBulkDeleteProducts, setConfirmBulkDeleteProducts] = useState(false);
  const [isDeletingProducts, setIsDeletingProducts] = useState(false);

  // Import state
  const [importPreviewRows, setImportPreviewRows] = useState<Record<string, any>[]>([]);
  const [importSourceLabel, setImportSourceLabel] = useState('Jiji.ng');
  const [isImporting, setIsImporting] = useState(false);

  // Single Product Add Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProd, setNewProd] = useState({
    name: '',
    brand: '',
    model: '',
    category: 'Solar & Power',
    price: 0,
    condition: 'New' as CatalogProduct['condition'],
    availability: 'In Stock' as CatalogProduct['availability'],
    location: 'Lagos',
    seller_name: '',
    seller_phone: '',
    source_marketplace: 'Jiji.ng',
    product_url: '',
    image: '',
    description: '',
    specsText: '',
  });

  // Category quick add
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Sponsored Campaign Form
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [newCamp, setNewCamp] = useState({
    advertiser_name: '',
    campaign_title: '',
    target_id: '',
    target_categories: '',
    target_locations: 'Lagos, Abuja',
    keywords: '',
    cpc_bid: 75,
    budget_total: 25000,
    min_relevance_score: 45,
  });

  // Manual Professional / Artisan Add Form
  const [artisanSearch, setArtisanSearch] = useState('');
  const [artisanFilterType, setArtisanFilterType] = useState<'all' | 'professional' | 'artisan'>('all');
  const [isArtisanModalOpen, setIsArtisanModalOpen] = useState(false);
  const [newArtisan, setNewArtisan] = useState({
    profile_type: 'artisan' as 'artisan' | 'professional',
    artisan_name: '',
    trade_category: ARTISAN_TRADE_CATEGORIES[0].name,
    custom_trade: '',
    phone: '',
    whatsapp: '',
    email: '',
    state: 'Lagos',
    town: 'Ikeja',
    address: '',
    cac_number: '',
    services_offered: 'Solar installation, Inverter repair',
    work_done: 'Verified specialist delivering residential and commercial projects.',
    level: 'experienced' as 'master_artisan' | 'experienced' | 'certified' | 'rising_talent',
    validation_status: 'validated' as 'validated' | 'pending' | 'claimed',
    verified: true,
    photo_url: '',
  });

  // Manual Lead Add Form
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    customer_name: '',
    phone: '',
    location: 'Abuja',
    service_required: '',
    service_category: 'Solar & Power',
    budget_formatted: '',
    notes: '',
  });

  useEffect(() => {
    const anyModalOpen = isProductModalOpen || isCampaignModalOpen || isArtisanModalOpen || isLeadModalOpen;
    if (!anyModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsProductModalOpen(false);
        setIsCampaignModalOpen(false);
        setIsArtisanModalOpen(false);
        setIsLeadModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isProductModalOpen, isCampaignModalOpen, isArtisanModalOpen, isLeadModalOpen]);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const loadAll = async () => {
    try {
      const [prods, cats, campRes, enqs, arts, leads, an, fuls, jobs] = await Promise.all([
        fetchCatalogProducts({ includeUnpublished: true }),
        fetchCategories(),
        fetchSponsoredCampaigns(),
        fetchProductEnquiries(),
        fetchArtisanRecommendations(),
        fetchAdminLeads(),
        fetchCommerceAnalytics(),
        fetchFulfilmentRequests().catch(() => []),
        fetchDataHubJobs().catch(() => []),
      ]);
      setProducts(prods);
      setCategories(cats);
      setCampaigns(campRes.campaigns);
      setAdControls(campRes.controls);
      setEnquiries(enqs);
      setArtisans(arts);
      setAdminLeads(leads);
      setAnalytics(an);
      setFulfilmentRequests(fuls);
      setDataHubJobs(jobs);
    } catch (err) {
      console.error('[AdminConsole] Load error:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // =========================================================================
  // 1. PRODUCT CSV / EXCEL IMPORT HANDLERS
  // =========================================================================
  const handleProductFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseSpreadsheetFile(file);
      if (rows.length === 0) {
        flashNotice('Spreadsheet is empty or could not be parsed.');
        return;
      }
      setImportPreviewRows(rows);
      flashNotice(`Parsed ${rows.length} rows from ${file.name}. Review and click "Confirm Import".`);
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to read CSV/Excel file.');
    }
  };

  const handleConfirmImport = async () => {
    if (importPreviewRows.length === 0) return;
    setIsImporting(true);
    try {
      const res = await importProductsBatch(importPreviewRows, importSourceLabel);
      flashNotice(`Imported ${res.importedCount} product(s) successfully (${res.skippedCount} skipped).`);
      setImportPreviewRows([]);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Import failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadCsvTemplate = () => {
    const headers = [
      'name',
      'category',
      'brand',
      'model',
      'price',
      'currency',
      'condition',
      'availability',
      'location',
      'seller_name',
      'seller_phone',
      'source_marketplace',
      'product_url',
      'image',
      'warranty',
      'specs',
      'description',
      'date_collected',
    ];
    const sample = [
      'Felicity 5KVA Hybrid Inverter 48V',
      'Solar & Power',
      'Felicity Solar',
      'IVEM5048',
      '685000',
      '₦',
      'New',
      'In Stock',
      'Alaba, Lagos',
      'Example Solar Store',
      '08000000000',
      'Jiji.ng',
      'https://jiji.ng/alaba/solar-energy/example-listing-123.html',
      'https://example.com/product.jpg',
      '2 Years',
      'Capacity: 5KVA; Voltage: 48V; Controller: 80A MPPT',
      'Pure sine wave 5KVA hybrid solar inverter with built-in MPPT charge controller.',
      new Date().toISOString().split('T')[0],
    ];
    const csv = `${headers.join(',')}\n"${sample.join('","')}"\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matthorg-jiji-products-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSingleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name.trim()) return;
    try {
      const specs: Record<string, string> = {};
      newProd.specsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .forEach((l) => {
          const idx = l.indexOf(':');
          if (idx > 0) specs[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
        });

      await saveCatalogProduct({
        listing_type: newProd.product_url ? 'external_marketplace' : 'admin_managed',
        name: newProd.name,
        brand: newProd.brand || undefined,
        model: newProd.model || undefined,
        category: newProd.category || 'General',
        price: Number(newProd.price) || 0,
        currency: '₦',
        condition: newProd.condition,
        availability: newProd.availability,
        location: newProd.location || 'Nigeria',
        seller_name: newProd.seller_name || 'Verified Seller',
        seller_phone: newProd.seller_phone || undefined,
        source_marketplace: newProd.source_marketplace || 'MatthOrg',
        product_url: newProd.product_url || undefined,
        image: newProd.image || undefined,
        description: newProd.description || newProd.name,
        specs,
        verification_status: 'approved',
        is_published: true,
      });

      setIsProductModalOpen(false);
      flashNotice(`Saved "${newProd.name}" to unified product database.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to save product.');
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadProjectImage(file, 'products');
      setNewProd((prev) => ({ ...prev, image: result.publicUrl }));
      flashNotice(
        result.warning ||
          (result.provider === 'supabase'
            ? `Uploaded raw unoptimized product image to Supabase bucket "${result.bucket}".`
            : 'Uploaded raw unoptimized product image.')
      );
    } catch (err: any) {
      flashNotice(err?.message || 'Image upload failed — paste URL directly.');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteCatalogProduct = async (prod: CatalogProduct) => {
    setIsDeletingProducts(true);
    try {
      await removeCatalogProduct(prod.id);
      setSelectedProductIds((prev) => prev.filter((id) => id !== prod.id));
      setConfirmDeleteProductId(null);
      await onProductDeleted?.([prod.id]);
      flashNotice(`Deleted "${prod.name}" from product catalog.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to delete product.');
    } finally {
      setIsDeletingProducts(false);
    }
  };

  const handleBulkDeleteProducts = async () => {
    if (selectedProductIds.length === 0) return;
    setIsDeletingProducts(true);
    try {
      const count = await removeCatalogProductsBulk(selectedProductIds);
      await onProductDeleted?.(selectedProductIds);
      setSelectedProductIds([]);
      setConfirmBulkDeleteProducts(false);
      flashNotice(`Deleted ${count || selectedProductIds.length} product(s) from database.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to bulk-delete selected products.');
    } finally {
      setIsDeletingProducts(false);
    }
  };

  // =========================================================================
  // 2. ARTISANS & LEADS BULK / MANUAL UPLOAD HANDLERS
  // =========================================================================
  const handleArtisansSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseSpreadsheetFile(file);
      const mapped = rows
        .map((r) => ({
          profile_type:
            String(r.profile_type || r.type || '').toLowerCase().includes('prof') ||
            String(r.profile_type || r.type || '').toLowerCase().includes('bus')
              ? 'professional'
              : 'artisan',
          artisan_name: r.artisan_name || r.business_name || r.name || r.Artisan || r.Professional || '',
          trade_category: r.trade_category || r.industry || r.trade || r.category || 'General Artisan',
          phone: String(r.phone || r.whatsapp || r.Phone || ''),
          whatsapp: String(r.whatsapp || r.phone || ''),
          email: String(r.email || r.Email || ''),
          state: r.state || r.State || 'Lagos',
          town: r.town || r.city || r.area || r.location || 'Lagos',
          address: r.address || r.Address || '',
          cac_number: r.cac_number || r.rc_number || '',
          services_offered: r.services_offered || r.specialization || r.services || r.trade_category || '',
          work_done: r.work_done || r.bio || r.description || '',
          photo_url: r.photo_url || r.logo || '',
          verified: true,
        }))
        .filter((a) => a.artisan_name && a.phone);

      if (mapped.length === 0) {
        flashNotice('No valid rows found (need artisan_name/business_name & phone columns).');
        return;
      }
      const res = await uploadBulkArtisans(mapped);
      flashNotice(`Uploaded ${res.count} professionals/artisans into unified database.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Spreadsheet import failed.');
    }
  };

  const handleDownloadArtisansCsvTemplate = () => {
    const headers = [
      'profile_type',
      'artisan_name',
      'trade_category',
      'phone',
      'whatsapp',
      'email',
      'town',
      'state',
      'address',
      'services_offered',
      'work_done',
    ];
    const sample = [
      'professional',
      'Adebayo Solar & Electrical Ltd',
      'Solar Engineers & Inverter Specialists',
      '08030001122',
      '08030001122',
      'hello@adebayosolar.ng',
      'Ikeja',
      'Lagos',
      '24 Allen Avenue, Ikeja, Lagos',
      '5KVA Hybrid Inverter Setup, Lithium Battery Installation, Conduit Wiring',
      'Installed 5kVA-15kVA hybrid solar systems across Ikeja and Victoria Island.',
    ];
    const csv = `${headers.join(',')}\n"${sample.join('","')}"\n`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'matthorg-professionals-artisans-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleArtisanPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadProjectImage(file, 'profiles');
      setNewArtisan((prev) => ({ ...prev, photo_url: result.publicUrl }));
      flashNotice(
        result.warning ||
          (result.provider === 'supabase'
            ? `Uploaded raw photo to Supabase bucket "${result.bucket}".`
            : 'Uploaded raw profile photo/logo.')
      );
    } catch (err: any) {
      flashNotice(err?.message || 'Photo upload failed — paste URL directly.');
    } finally {
      e.target.value = '';
    }
  };

  const handleLeadsSpreadsheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseSpreadsheetFile(file);
      const mapped = rows
        .map((r) => ({
          customer_name: r.customer_name || r.name || r.Name || 'Prospective Client',
          phone: String(r.phone || r.whatsapp || r.Phone || ''),
          whatsapp: String(r.whatsapp || r.phone || ''),
          email: r.email || r.Email || '',
          location: r.location || r.city || r.state || 'Nigeria',
          service_required: r.service_required || r.service || r.need || r.product || 'General Enquiry',
          service_category: r.service_category || r.category || 'General',
          budget_formatted: r.budget_formatted || r.budget || 'Flexible',
          notes: r.notes || r.details || '',
        }))
        .filter((l) => l.service_required || l.phone);

      if (mapped.length === 0) {
        flashNotice('No valid lead rows found.');
        return;
      }
      const res = await uploadAdminLeads(mapped);
      flashNotice(`Uploaded ${res.count} leads into unified database.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Lead spreadsheet upload failed.');
    }
  };

  const handleSingleArtisanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtisan.artisan_name.trim() || !newArtisan.phone.trim()) return;
    try {
      const finalTrade =
        newArtisan.trade_category === '__custom__'
          ? newArtisan.custom_trade.trim() || 'General Specialist'
          : newArtisan.trade_category;

      const addedType = newArtisan.profile_type;
      await uploadBulkArtisans([
        {
          profile_type: addedType,
          artisan_name: newArtisan.artisan_name.trim(),
          trade_category: finalTrade,
          phone: newArtisan.phone.trim(),
          whatsapp: newArtisan.whatsapp.trim() || newArtisan.phone.trim(),
          email: newArtisan.email.trim(),
          state: newArtisan.state.trim(),
          town: newArtisan.town.trim(),
          address: newArtisan.address.trim(),
          cac_number: newArtisan.cac_number.trim(),
          services_offered: newArtisan.services_offered.trim(),
          work_done: newArtisan.work_done.trim(),
          level: newArtisan.level,
          validation_status: newArtisan.validation_status,
          verified: newArtisan.verified,
          photo_url: newArtisan.photo_url.trim() || undefined,
        },
      ]);
      setIsArtisanModalOpen(false);
      setNewArtisan({
        profile_type: 'artisan',
        artisan_name: '',
        trade_category: ARTISAN_TRADE_CATEGORIES[0].name,
        custom_trade: '',
        phone: '',
        whatsapp: '',
        email: '',
        state: 'Lagos',
        town: 'Ikeja',
        address: '',
        cac_number: '',
        services_offered: 'Solar installation, Inverter repair',
        work_done: 'Verified specialist delivering residential and commercial projects.',
        level: 'experienced',
        validation_status: 'validated',
        verified: true,
        photo_url: '',
      });
      flashNotice(`${addedType === 'professional' ? 'Professional' : 'Artisan'} added to unified database.`);
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to save specialist profile.');
    }
  };

  const handleSingleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.customer_name.trim() || !newLead.service_required.trim()) return;
    try {
      await uploadAdminLeads([newLead]);
      setIsLeadModalOpen(false);
      setNewLead({
        customer_name: '',
        phone: '',
        location: 'Abuja',
        service_required: '',
        service_category: 'Solar & Power',
        budget_formatted: '',
        notes: '',
      });
      flashNotice('Lead added to unified database.');
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to save lead.');
    }
  };

  // =========================================================================
  // 3. CAMPAIGN HANDLERS
  // =========================================================================
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.advertiser_name.trim() || !newCamp.target_id) return;
    try {
      await saveSponsoredCampaign({
        advertiser_name: newCamp.advertiser_name.trim(),
        campaign_title: newCamp.campaign_title.trim() || newCamp.advertiser_name.trim(),
        target_type: 'product',
        target_id: newCamp.target_id,
        target_categories: newCamp.target_categories.split(',').map((s) => s.trim()).filter(Boolean),
        target_locations: newCamp.target_locations.split(',').map((s) => s.trim()).filter(Boolean),
        keywords: newCamp.keywords.split(',').map((s) => s.trim()).filter(Boolean),
        cpc_bid: Number(newCamp.cpc_bid) || 50,
        budget_total: Number(newCamp.budget_total) || 10000,
        min_relevance_score: Number(newCamp.min_relevance_score) || 40,
        status: 'active',
      });
      setIsCampaignModalOpen(false);
      flashNotice('Sponsored ad campaign created.');
      await loadAll();
    } catch (err: any) {
      flashNotice(err?.message || 'Failed to create campaign.');
    }
  };

  const filteredProducts = products.filter((p) => {
    if (productFilterType === 'pending' && p.verification_status !== 'pending') return false;
    if (
      (productFilterType === 'external_marketplace' || productFilterType === 'business_owned') &&
      p.listing_type !== productFilterType
    ) {
      return false;
    }
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q) ||
        (p.seller_name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const summary = analytics?.summary || {};
  const pendingProductsCount = products.filter((p) => p.verification_status === 'pending').length;
  const pendingArtisansCount = artisans.filter((a) => !a.verified && a.validation_status !== 'validated').length;
  const openFulfilmentCount = fulfilmentRequests.filter(
    (f) => f.status !== 'Fulfilled' && f.status !== 'Unfulfilled'
  ).length;
  const pendingDataHubRecords = dataHubJobs.reduce(
    (sum, j) => sum + (j.records || []).filter((r) => r.status === 'Needs Review' || r.status === 'Pending Analysis').length,
    0
  );
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active').length;
  const verifiedArtisansCount = artisans.filter((a) => a.verified || a.validation_status === 'validated').length;

  const handleExportAdminCsv = () => {
    const rows = [
      ['Type', 'Name', 'Category/Trade', 'Location', 'Price/Status', 'Source'],
      ...products.map((p) => ['Product', p.name, p.category, p.location, `${p.currency}${p.price}`, p.source_marketplace]),
      ...artisans.map((a) => ['Specialist', a.artisan_name, a.trade_category, `${a.town}, ${a.state}`, a.validation_status || 'pending', a.phone]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c || '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matthorg-admin-directory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Monthly activity chart points from enquiries + leads + conversations + campaigns
  const adminChartMonths = React.useMemo(() => {
    const labels: { key: string; label: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      labels.push({ key, label: d.toLocaleString('default', { month: 'short' }).toUpperCase() });
    }
    return labels.map((m, idx) => {
      const enqHits = enquiries.filter((e) => (e.created_at || '').startsWith(m.key)).length;
      const leadHits = adminLeads.filter((l) => (l.created_at || '').startsWith(m.key)).length;
      const prodHits = products.filter((p) => (p.created_at || '').startsWith(m.key)).length;
      const total = enqHits + leadHits + prodHits + (idx === 5 ? (summary.totalSearches || 0) : 0);
      return { ...m, total };
    });
  }, [enquiries, adminLeads, products, summary.totalSearches]);

  const maxAdminActivity = Math.max(...adminChartMonths.map((m) => m.total), 1);
  const adminChartPts = adminChartMonths.map((m, idx) => {
    const x = 24 + idx * 102;
    const y = 148 - (m.total / maxAdminActivity) * 114;
    return { x, y, month: m.label, total: m.total };
  });
  const adminLineD = adminChartPts.reduce((acc, pt, i) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`), '');
  const adminAreaD =
    adminChartPts.length > 0
      ? `${adminLineD} L ${adminChartPts[adminChartPts.length - 1].x} 160 L ${adminChartPts[0].x} 160 Z`
      : '';

  const adminActionItems = [
    ...(pendingDataHubRecords > 0
      ? [
          {
            id: 'act_datahub',
            label: `Review ${pendingDataHubRecords} staged Data Hub record${pendingDataHubRecords === 1 ? '' : 's'}`,
            sublabel: 'Needs Review queue',
            onClick: () => setActiveTab('datahub'),
          },
        ]
      : []),
    ...(openFulfilmentCount > 0
      ? [
          {
            id: 'act_fulfil',
            label: `Match ${openFulfilmentCount} open customer sourcing request${openFulfilmentCount === 1 ? '' : 's'}`,
            sublabel: 'Fulfilment pipeline',
            onClick: () => setActiveTab('fulfilment'),
          },
        ]
      : []),
    ...(pendingProductsCount > 0
      ? [
          {
            id: 'act_prod',
            label: `Approve ${pendingProductsCount} pending catalog listing${pendingProductsCount === 1 ? '' : 's'}`,
            sublabel: 'Catalog moderation',
            onClick: () => {
              setProductFilterType('pending');
              setActiveTab('products');
            },
          },
        ]
      : []),
    ...(pendingArtisansCount > 0
      ? [
          {
            id: 'act_art',
            label: `Validate ${pendingArtisansCount} pro & artisan profile${pendingArtisansCount === 1 ? '' : 's'}`,
            sublabel: 'Directory quality control',
            onClick: () => setActiveTab('artisans'),
          },
        ]
      : []),
    ...((summary.zeroResultCount || 0) > 0
      ? [
          {
            id: 'act_zero',
            label: `Inspect ${summary.zeroResultCount} unmet customer search quer${summary.zeroResultCount === 1 ? 'y' : 'ies'}`,
            sublabel: 'Catalog expansion signals',
            onClick: () => setActiveTab('analytics'),
          },
        ]
      : []),
  ].slice(0, 4);

  const adminRecentActivity = [
    ...enquiries.slice(0, 2).map((e) => ({
      id: `enq_${e.id}`,
      initials: (e.customer_name || 'EN').slice(0, 2).toUpperCase(),
      title: `${e.customer_name} enquired on ${e.product_name}`,
      meta: e.seller_name || e.customer_phone,
      onClick: () => setActiveTab('analytics'),
    })),
    ...fulfilmentRequests.slice(0, 2).map((f) => ({
      id: `ful_${f.id}`,
      initials: (f.customer_name || 'FR').slice(0, 2).toUpperCase(),
      title: `${f.request_number}: ${f.request_summary}`,
      meta: f.status,
      onClick: () => setActiveTab('fulfilment'),
    })),
    ...adminLeads.slice(0, 2).map((l) => ({
      id: `lead_${l.id}`,
      initials: (l.customer_name || 'LD').slice(0, 2).toUpperCase(),
      title: `${l.customer_name} — ${l.service_required}`,
      meta: l.location || 'Nigeria',
      onClick: () => setActiveTab('leads'),
    })),
  ].slice(0, 4);

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in max-w-[1220px] mx-auto pb-10 overflow-x-hidden">
      {/* Top Search Bar */}
      <div className="relative w-full min-w-0">
        <Search className="w-4 h-4 text-[#8F9FB5] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={adminGlobalSearch}
          onChange={(e) => {
            const val = e.target.value;
            setAdminGlobalSearch(val);
            setProductSearch(val);
            setArtisanSearch(val);
          }}
          placeholder="Search catalog products, artisans, leads, enquiries..."
          className="w-full pl-11 pr-10 py-3 rounded-xl bg-white border border-[#E5E9F0] text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#3D74D9] transition"
        />
        {adminGlobalSearch && (
          <button
            type="button"
            onClick={() => {
              setAdminGlobalSearch('');
              setProductSearch('');
              setArtisanSearch('');
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Action Strip & Segmented Sub-Navigation */}
      <div className="flex flex-col gap-3 w-full min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2.5 min-w-0 w-full">
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            <button
              type="button"
              onClick={handleExportAdminCsv}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#5B6D85]" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('datahub')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Database className="w-4 h-4 text-[#3D74D9]" />
              <span>AI Data Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fulfilment')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-amber-600" />
              <span>Fulfilment ({openFulfilmentCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            <button
              type="button"
              onClick={() => setIsArtisanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E9F0] text-[14px] font-semibold text-[#0B192C] transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#3D74D9]" />
              <span>Add Pro / Artisan</span>
            </button>
            <button
              type="button"
              onClick={() => setIsProductModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white text-[14px] font-semibold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add product</span>
            </button>
          </div>
        </div>

        {/* Clean Segmented Sub-navigation */}
        <div className="w-full min-w-0 max-w-full flex items-center gap-1.5 bg-white border border-[#E5E9F0] p-1.5 rounded-xl overflow-x-auto text-[14px] font-semibold">
          {[
            { id: 'overview' as const, label: 'Overview', icon: LayoutDashboard },
            { id: 'datahub' as const, label: 'Data Hub', icon: Database },
            { id: 'fulfilment' as const, label: `Fulfilment (${fulfilmentRequests.length})`, icon: ClipboardList },
            { id: 'products' as const, label: `Products (${products.length})`, icon: Package },
            { id: 'campaigns' as const, label: `Sponsored Ads (${campaigns.length})`, icon: Sparkles },
            { id: 'artisans' as const, label: `Pros & Artisans (${artisans.length})`, icon: Users },
            { id: 'leads' as const, label: 'Leads & Demand', icon: Target },
            { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#0B192C] text-white'
                  : 'text-[#5B6D85] hover:text-[#0B192C] hover:bg-[#F4F7FB]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[15px] font-semibold flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 0: ADMIN OVERVIEW (2x3 KPI Grid, Trend Chart, Action Items, Feed) */}
      {/* ===================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 2x3 KPI Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('products')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Published Catalog
                </span>
                <Package className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {summary.publishedProducts ?? products.filter((p) => p.is_published).length}
              </div>
              <div className="text-[14px] font-medium text-emerald-700 mt-1.5 tabular-nums">
                {products.length} total listings
              </div>
            </div>

            <div
              onClick={() => setActiveTab('analytics')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Total Searches
                </span>
                <TrendingUp className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {summary.totalSearches ?? 0}
              </div>
              <div className="text-[14px] font-medium text-[#3D74D9] mt-1.5 tabular-nums">
                {summary.zeroResultCount ?? 0} unmet opportunities
              </div>
            </div>

            <div
              onClick={() => setActiveTab('fulfilment')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Pending Queue
                </span>
                <AlertCircle className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {pendingProductsCount + openFulfilmentCount + pendingDataHubRecords}
              </div>
              <div className="text-[14px] font-medium text-rose-600 mt-1.5 tabular-nums">
                {openFulfilmentCount} sourcing · {pendingDataHubRecords} Data Hub
              </div>
            </div>

            <div
              onClick={() => setActiveTab('artisans')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Pros &amp; Artisans
                </span>
                <Users className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {artisans.length}
              </div>
              <div className="text-[14px] font-medium text-emerald-700 mt-1.5 tabular-nums">
                {verifiedArtisansCount} verified profiles
              </div>
            </div>

            <div
              onClick={() => setActiveTab('campaigns')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Sponsored Ads
                </span>
                <Megaphone className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {activeCampaignsCount}
              </div>
              <div className="text-[14px] text-[#5B6D85] mt-1.5 tabular-nums">
                {summary.totalClicks ?? 0} clicks · {summary.totalImpressions ?? 0} impressions
              </div>
            </div>

            <div
              onClick={() => setActiveTab('leads')}
              className="bg-white rounded-2xl border border-[#E5E9F0] p-5 flex flex-col justify-between hover:border-[#3D74D9]/40 transition cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">
                  Enquiries &amp; Leads
                </span>
                <MessageSquare className="w-4 h-4 text-[#8F9FB5]" />
              </div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight tabular-nums mt-2.5">
                {enquiries.length + adminLeads.length}
              </div>
              <div className="text-[14px] text-[#5B6D85] mt-1.5 tabular-nums">
                {enquiries.length} enquiries · {adminLeads.length} leads
              </div>
            </div>
          </div>

          {/* Middle Split: Marketplace Activity Chart + Action Items */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E5E9F0] p-5 sm:p-6 flex flex-col justify-between">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-baseline gap-2.5">
                  <h2 className="font-heading text-xl font-bold text-[#0B192C]">Marketplace Activity</h2>
                  <span className="text-[13px] font-semibold uppercase tracking-wider text-[#64748B]">
                    Last 6 months
                  </span>
                </div>
                <span className="text-[14px] font-semibold text-[#5B6D85] tabular-nums">
                  {(analytics?.conversations || []).length} AI sessions
                </span>
              </div>

              <div className="relative w-full h-44">
                <svg className="w-full h-36 overflow-visible" viewBox="0 0 560 168" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="adminActivityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="20" y1="30" x2="540" y2="30" stroke="#EEF2F6" strokeDasharray="3 3" />
                  <line x1="20" y1="74" x2="540" y2="74" stroke="#EEF2F6" strokeDasharray="3 3" />
                  <line x1="20" y1="118" x2="540" y2="118" stroke="#EEF2F6" strokeDasharray="3 3" />
                  <line x1="20" y1="160" x2="540" y2="160" stroke="#E5E9F0" />
                  {adminAreaD && <path d={adminAreaD} fill="url(#adminActivityFill)" />}
                  {adminLineD && (
                    <path
                      d={adminLineD}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {adminChartPts.map((pt, idx) => (
                    <circle
                      key={pt.month}
                      cx={pt.x}
                      cy={pt.y}
                      r={idx === adminChartPts.length - 1 ? 4.5 : 3}
                      fill={idx === adminChartPts.length - 1 ? '#10B981' : '#FFFFFF'}
                      stroke="#10B981"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
                <div className="flex justify-between px-3 pt-1 text-[13px] font-semibold text-[#64748B] tabular-nums">
                  {adminChartMonths.map((m) => (
                    <span key={m.key}>{m.label}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9F0] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-xl font-bold text-[#0B192C]">Action items</h2>
                    <span className="text-[14px] font-semibold text-[#5B6D85] tabular-nums">
                      {adminActionItems.length}
                    </span>
                  </div>
                </div>

                {adminActionItems.length === 0 ? (
                  <div className="py-8 text-center text-[15px] text-[#5B6D85]">
                    All queues are clear. No pending moderation or sourcing items.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {adminActionItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onClick}
                        className="w-full py-2.5 flex items-start gap-2.5 text-left hover:bg-[#F8FAFC] rounded-lg px-2 -mx-2 transition cursor-pointer group"
                      >
                        <Circle className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#3D74D9] shrink-0 mt-1" />
                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] font-medium text-[#0B192C] truncate">{item.label}</div>
                          <div className="text-[13px] text-[#5B6D85]">{item.sublabel}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Split: Recent Activity + Directory Network Strip (8 cols) & Quick Links (4 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-8 flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 sm:p-6 flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading text-xl font-bold text-[#0B192C]">Recent activity</h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className="text-[14px] font-semibold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                  >
                    View logs
                  </button>
                </div>

                {adminRecentActivity.length === 0 ? (
                  <div className="py-6 text-center text-[15px] text-[#5B6D85]">
                    No enquiries, fulfilment requests, or leads recorded yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F1F5F9]">
                    {adminRecentActivity.map((act, idx) => (
                      <button
                        key={act.id}
                        type="button"
                        onClick={act.onClick}
                        className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-[#F8FAFC] rounded-lg px-2 -mx-2 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 ${
                              idx % 2 === 0 ? 'bg-blue-100 text-[#0B192C]' : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {act.initials}
                          </span>
                          <span className="text-[15px] font-medium text-[#0B192C] truncate">{act.title}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#5B6D85] shrink-0">{act.meta}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Specialist Directory Strip */}
              <div className="bg-white rounded-2xl border border-[#E5E9F0] px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-heading text-lg font-bold text-[#0B192C] whitespace-nowrap">Directory</span>
                  <div className="flex items-center -space-x-2">
                    {(artisans.length > 0 ? artisans.slice(0, 6) : [{ id: 'empty', artisan_name: 'MO' }]).map((a, idx) => (
                      <div
                        key={a.id}
                        title={a.artisan_name}
                        className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[13px] font-bold ${
                          idx % 2 === 0 ? 'bg-blue-100 text-[#0B192C]' : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {(a.artisan_name || 'MO').slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <div className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85] tabular-nums">
                    {artisans.length} Specialists · {categories.length} Categories
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('artisans')}
                  className="text-[14px] font-semibold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                >
                  Manage directory
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E5E9F0] p-5 sm:p-6">
              <h2 className="font-heading text-xl font-bold text-[#0B192C] mb-3.5">Quick links</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('datahub')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Database className="w-4 h-4 text-[#3D74D9]" />
                  <span>Ingest data (Data Hub)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Package className="w-4 h-4 text-[#5B6D85]" />
                  <span>Add catalog product</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsArtisanModalOpen(true)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Users className="w-4 h-4 text-[#5B6D85]" />
                  <span>Add pro / artisan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(true)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Sparkles className="w-4 h-4 text-[#5B6D85]" />
                  <span>New sponsored ad</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fulfilment')}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <ClipboardList className="w-4 h-4 text-[#5B6D85]" />
                  <span>Fulfilment queue</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportAdminCsv}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EEF3FA] text-[14px] font-semibold text-[#0B192C] flex items-center gap-2.5 transition cursor-pointer text-left"
                >
                  <Settings className="w-4 h-4 text-[#5B6D85]" />
                  <span>Export directory CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'datahub' && (
        <DataHubView onDataCommitted={loadAll} />
      )}

      {activeTab === 'fulfilment' && (
        <FulfilmentView />
      )}

      {/* ===================================================================== */}
      {/* TAB 1: PRODUCTS CATALOG + CSV/EXCEL JIJI IMPORT + CATEGORIES           */}
      {/* ===================================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          {/* Bulk Import Panel */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-bold text-[#0B192C] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#3D74D9] shrink-0" />
                  <span>Bulk Upload Jiji / Marketplace Products (CSV or Excel)</span>
                </h2>
                <p className="text-[15px] text-[#5B6D85] mt-1 leading-relaxed">
                  Upload your 50+ Jiji product spreadsheet (.csv, .xlsx, .xls). Original Jiji purchase URLs, prices, specs, and images are preserved verbatim.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Single Product</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 rounded-xl bg-[#FAFBFD] border border-dashed border-[#CBD5E1]">
              <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#3D74D9] hover:bg-[#2F62C2] text-white text-[14px] font-bold cursor-pointer shrink-0 whitespace-nowrap">
                <Upload className="w-4 h-4" />
                <span>Choose CSV / Excel File</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleProductFileSelect}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2 text-[14px]">
                <span className="text-[#5B6D85] font-semibold">Default Source:</span>
                <input
                  type="text"
                  value={importSourceLabel}
                  onChange={(e) => setImportSourceLabel(e.target.value)}
                  className="w-36 rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[14px] font-semibold text-[#0B192C]"
                />
              </div>

              {importPreviewRows.length > 0 && (
                <div className="flex items-center gap-2 sm:ml-auto">
                  <span className="text-[14px] font-bold text-emerald-700 tabular-nums">
                    {importPreviewRows.length} rows ready
                  </span>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isImporting ? 'Importing...' : `Confirm Import (${importPreviewRows.length})`}</span>
                  </button>
                </div>
              )}
            </div>

            {importPreviewRows.length > 0 && (
              <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
                <table className="w-full text-left text-[14px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <tr>
                      {Object.keys(importPreviewRows[0]).slice(0, 6).map((col) => (
                        <th key={col} className="p-3 font-bold text-[#475569]">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreviewRows.slice(0, 5).map((r, i) => (
                      <tr key={i} className="border-b border-[#F1F5F9]">
                        {Object.keys(importPreviewRows[0]).slice(0, 6).map((col) => (
                          <td key={col} className="p-3 text-[#0B192C] max-w-[200px] truncate">
                            {String(r[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category Manager */}
          <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex flex-wrap items-center gap-2 text-[14px]">
            <span className="font-bold text-[#0B192C] flex items-center gap-1.5 mr-2">
              <Tag className="w-4 h-4 text-[#3D74D9]" /> Categories:
            </span>
            {categories.map((cat) => (
              <span key={cat} className="px-3 py-1 rounded-lg bg-[#F1F5F9] text-[#0B192C] font-semibold text-[13px]">
                {cat}
              </span>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="New category..."
                className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 text-[14px] text-[#0B192C]"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newCategoryInput.trim()) return;
                  const next = await saveCategoriesList([...categories, newCategoryInput.trim()]);
                  setCategories(next);
                  setNewCategoryInput('');
                }}
                className="px-3.5 py-1.5 rounded-lg bg-[#0B192C] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
              >
                Add
              </button>
            </div>
          </div>

          {/* Product Inventory Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter unified product database..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[14px] font-semibold">
                {[
                  { id: 'all' as const, label: 'All Listings' },
                  { id: 'external_marketplace' as const, label: 'Jiji / External' },
                  { id: 'business_owned' as const, label: 'Business Sellers' },
                  { id: 'pending' as const, label: 'Pending Approval' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setProductFilterType(f.id)}
                    className={`px-3.5 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
                      productFilterType === f.id
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}

                {selectedProductIds.length > 0 && (
                  confirmBulkDeleteProducts ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-[13px] font-bold text-rose-700 tabular-nums">
                        Delete {selectedProductIds.length}?
                      </span>
                      <button
                        type="button"
                        disabled={isDeletingProducts}
                        onClick={handleBulkDeleteProducts}
                        className="px-2.5 py-1 rounded bg-rose-600 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      >
                        {isDeletingProducts ? 'Deleting...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmBulkDeleteProducts(false)}
                        className="px-2 py-1 text-[13px] font-semibold text-[#64748B] cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmBulkDeleteProducts(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[14px] font-bold cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Selected ({selectedProductIds.length})</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-[15px] text-[#5B6D85] bg-[#FAFBFD] rounded-xl border border-dashed border-[#E2E8F0]">
                No products uploaded yet. Upload your CSV/Excel spreadsheet or add a product above to populate Matthew AI's discovery engine.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[13px] uppercase tracking-wider text-[#5B6D85]">
                      <th className="py-3 pr-2 w-8">
                        <input
                          type="checkbox"
                          aria-label="Select all filtered products"
                          checked={
                            filteredProducts.length > 0 &&
                            filteredProducts.every((p) => selectedProductIds.includes(p.id))
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(filteredProducts.map((p) => p.id));
                            } else {
                              setSelectedProductIds([]);
                              setConfirmBulkDeleteProducts(false);
                            }
                          }}
                          className="h-4 w-4 rounded border-slate-300 text-[#0B192C] cursor-pointer"
                        />
                      </th>
                      <th className="py-3 pr-3">Product</th>
                      <th className="py-3 px-3">Price</th>
                      <th className="py-3 px-3">Seller / Source</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((prod) => (
                      <tr key={prod.id} className="border-b border-[#F1F5F9] hover:bg-[#FAFBFD]">
                        <td className="py-3.5 pr-2 align-middle">
                          <input
                            type="checkbox"
                            aria-label={`Select ${prod.name}`}
                            checked={selectedProductIds.includes(prod.id)}
                            onChange={(e) => {
                              setConfirmBulkDeleteProducts(false);
                              setSelectedProductIds((prev) =>
                                e.target.checked
                                  ? [...prev, prod.id]
                                  : prev.filter((id) => id !== prod.id)
                              );
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-[#0B192C] cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            {prod.image && (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                loading="eager"
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-contain bg-[#F8FAFC] border border-[#E2E8F0] shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-semibold text-[#0B192C] max-w-[240px] truncate">{prod.name}</div>
                              <div className="text-[13px] text-[#64748B]">
                                {[prod.brand, prod.model, prod.category].filter(Boolean).join(' · ')}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 font-mono tabular-nums font-bold text-[#0B192C]">
                          {prod.currency || '₦'}{(prod.price || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#0B192C]">{prod.seller_name}</div>
                          <div className="text-[13px] text-[#64748B] flex items-center gap-1">
                            <span>{prod.source_marketplace}</span>
                            {prod.product_url && (
                              <a
                                href={prod.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#3D74D9] hover:underline inline-flex items-center gap-0.5"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-[#475569]">{prod.location}</td>
                        <td className="py-3.5 px-3">
                          <select
                            value={prod.verification_status}
                            onChange={async (e) => {
                              await updateCatalogProduct(prod.id, {
                                verification_status: e.target.value as CatalogProduct['verification_status'],
                              });
                              loadAll();
                            }}
                            className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 text-[13px] font-bold text-[#0B192C]"
                          >
                            <option value="approved">Approved</option>
                            <option value="verified">Verified</option>
                            <option value="pending">Pending</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={async () => {
                                await updateCatalogProduct(prod.id, { is_published: !prod.is_published });
                                loadAll();
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-[13px] font-bold cursor-pointer whitespace-nowrap ${
                                prod.is_published
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {prod.is_published ? 'Live' : 'Hidden'}
                            </button>
                            {confirmDeleteProductId === prod.id ? (
                              <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg px-2 py-1">
                                <button
                                  type="button"
                                  disabled={isDeletingProducts}
                                  onClick={() => handleDeleteCatalogProduct(prod)}
                                  className="px-2.5 py-0.5 rounded bg-rose-600 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60 whitespace-nowrap"
                                >
                                  {isDeletingProducts ? '...' : 'Delete'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProductId(null)}
                                  className="px-1.5 text-[13px] font-semibold text-[#64748B] cursor-pointer whitespace-nowrap"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProductId(prod.id)}
                                title={`Delete ${prod.name}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold text-[#64748B] hover:text-rose-600 hover:bg-rose-50 cursor-pointer whitespace-nowrap"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden xl:inline">Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: SPONSORED ADVERTISING ENGINE & PLACEMENT CONTROLS              */}
      {/* ===================================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-5">
          {/* Global Ad Placement Controls */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <h2 className="font-heading text-xl font-bold text-[#0B192C] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#3D74D9] shrink-0" />
                <span>Sponsored Ad Placement Controls</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Create Sponsored Campaign</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[14px]">
              <label className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] flex items-center justify-between cursor-pointer">
                <span className="font-semibold text-[#0B192C]">Sponsored Ads Enabled</span>
                <input
                  type="checkbox"
                  checked={adControls.global_ads_enabled}
                  onChange={async (e) => {
                    const next = await updateAdControls({ global_ads_enabled: e.target.checked });
                    setAdControls(next);
                  }}
                  className="h-4 w-4 text-[#0B192C]"
                />
              </label>

              <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-semibold text-[#0B192C]">Max Ads / Reply</span>
                <select
                  value={adControls.max_sponsored_per_response}
                  onChange={async (e) => {
                    const next = await updateAdControls({
                      max_sponsored_per_response: parseInt(e.target.value, 10),
                    });
                    setAdControls(next);
                  }}
                  className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-mono tabular-nums font-bold text-[#0B192C] text-[14px]"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] flex items-center justify-between">
                <span className="font-semibold text-[#0B192C]">Min Relevance %</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={adControls.min_relevance_threshold}
                  onChange={async (e) => {
                    const next = await updateAdControls({
                      min_relevance_threshold: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)),
                    });
                    setAdControls(next);
                  }}
                  className="w-20 rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-mono tabular-nums font-bold text-[#0B192C] text-[14px]"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] flex items-center justify-between gap-2">
                <span className="font-semibold text-[#0B192C]">Frequency</span>
                <select
                  value={adControls.ad_frequency}
                  onChange={async (e) => {
                    const next = await updateAdControls({
                      ad_frequency: e.target.value as AdControlConfig['ad_frequency'],
                    });
                    setAdControls(next);
                  }}
                  className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 text-[13px] font-bold text-[#0B192C]"
                >
                  <option value="every_matching_response">Every Matching Query</option>
                  <option value="high_intent_only">High Intent Only</option>
                  <option value="capped_per_session">Capped / Session</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sponsored Campaigns Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0]">
            {campaigns.length === 0 ? (
              <div className="py-10 text-center text-[15px] text-[#5B6D85]">
                No sponsored campaigns created yet. Create one targeting any product in your catalog.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[13px] uppercase tracking-wider text-[#5B6D85]">
                      <th className="py-3 pr-3">Campaign & Advertiser</th>
                      <th className="py-3 px-3">Targeting</th>
                      <th className="py-3 px-3">Impressions</th>
                      <th className="py-3 px-3">Clicks / CTR</th>
                      <th className="py-3 px-3">Enquiries</th>
                      <th className="py-3 px-3">Spend / Budget</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((camp) => {
                      const ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={camp.id} className="border-b border-[#F1F5F9]">
                          <td className="py-3.5 pr-3">
                            <div className="font-semibold text-[#0B192C]">{camp.campaign_title}</div>
                            <div className="text-[13px] text-[#64748B]">{camp.advertiser_name}</div>
                          </td>
                          <td className="py-3.5 px-3 text-[13px] text-[#475569]">
                            <div>{(camp.target_categories || []).join(', ') || 'All categories'}</div>
                            <div className="text-[#64748B]">{(camp.target_locations || []).join(', ') || 'All locations'}</div>
                          </td>
                          <td className="py-3.5 px-3 font-mono tabular-nums font-bold">{camp.impressions || 0}</td>
                          <td className="py-3.5 px-3 font-mono tabular-nums font-bold">
                            {camp.clicks || 0} ({ctr}%)
                          </td>
                          <td className="py-3.5 px-3 font-mono tabular-nums font-bold">{camp.enquiries || 0}</td>
                          <td className="py-3.5 px-3 font-mono tabular-nums">
                            ₦{(camp.budget_spent || 0).toLocaleString()} / ₦{(camp.budget_total || 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3">
                            <select
                              value={camp.status}
                              onChange={async (e) => {
                                await updateSponsoredCampaign(camp.id, {
                                  status: e.target.value as SponsoredCampaign['status'],
                                });
                                loadAll();
                              }}
                              className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 text-[13px] font-bold text-[#0B192C]"
                            >
                              <option value="active">Active</option>
                              <option value="paused">Paused</option>
                              <option value="ended">Ended</option>
                            </select>
                          </td>
                          <td className="py-3.5 pl-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteSponsoredCampaign(camp.id);
                                loadAll();
                              }}
                              className="p-2 text-[#64748B] hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: PROFESSIONALS & ARTISANS MANUAL + BULK UNIFIED DIRECTORY       */}
      {/* ===================================================================== */}
      {activeTab === 'artisans' && (
        <div className="space-y-5 min-w-0">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h2 className="font-heading text-xl font-bold text-[#0B192C]">
                Unified Professionals & Artisans Database ({artisans.length})
              </h2>
              <p className="text-[15px] text-[#5B6D85] mt-1 leading-relaxed">
                Manually add verified professionals/businesses or individual artisans, or bulk import via CSV/Excel. Every entry is immediately searchable by Matthew AI.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
              <button
                type="button"
                onClick={handleDownloadArtisansCsvTemplate}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span>CSV Template</span>
              </button>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#3D74D9] hover:bg-[#2F62C2] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap">
                <Upload className="w-4 h-4" />
                <span>Upload CSV/Excel</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleArtisansSpreadsheetUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewArtisan((prev) => ({ ...prev, profile_type: 'professional' }));
                  setIsArtisanModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Professional</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewArtisan((prev) => ({ ...prev, profile_type: 'artisan' }));
                  setIsArtisanModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Add Artisan</span>
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md min-w-0">
                <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={artisanSearch}
                  onChange={(e) => setArtisanSearch(e.target.value)}
                  placeholder="Search professionals, artisans, trade, or location..."
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-[15px] text-[#0B192C]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 text-[14px] font-semibold">
                {[
                  { id: 'all' as const, label: 'All Entries' },
                  { id: 'professional' as const, label: 'Professionals / Businesses' },
                  { id: 'artisan' as const, label: 'Individual Artisans' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setArtisanFilterType(f.id)}
                    className={`px-3.5 py-2 rounded-lg cursor-pointer whitespace-nowrap ${
                      artisanFilterType === f.id
                        ? 'bg-[#0B192C] text-white'
                        : 'bg-[#F1F5F9] text-[#475569]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {(() => {
              const filteredArtisans = artisans.filter((art) => {
                const pType = art.profile_type === 'professional' ? 'professional' : 'artisan';
                if (artisanFilterType !== 'all' && pType !== artisanFilterType) return false;
                if (artisanSearch.trim()) {
                  const q = artisanSearch.toLowerCase();
                  return (
                    (art.artisan_name || '').toLowerCase().includes(q) ||
                    (art.trade_category || '').toLowerCase().includes(q) ||
                    (art.town || '').toLowerCase().includes(q) ||
                    (art.state || '').toLowerCase().includes(q) ||
                    (art.phone || '').toLowerCase().includes(q)
                  );
                }
                return true;
              });

              if (filteredArtisans.length === 0) {
                return (
                  <div className="py-10 text-center text-[15px] text-[#5B6D85]">
                    No matching professionals or artisans yet. Click "Add Professional" or "Add Artisan" above to load entries.
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                <table className="w-full text-left text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[13px] uppercase tracking-wider text-[#5B6D85]">
                      <th className="py-3 pr-3">Name & Trade</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Contact</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Validation</th>
                      <th className="py-3 pl-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredArtisans.map((art) => (
                      <tr key={art.id} className="border-b border-[#F1F5F9]">
                        <td className="py-3.5 pr-3">
                          <div className="font-semibold text-[#0B192C]">{art.artisan_name}</div>
                          <div className="text-[13px] text-[#64748B]">{art.trade_category}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`text-[13px] font-bold px-2.5 py-0.5 rounded-md whitespace-nowrap ${
                              art.profile_type === 'professional'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {art.profile_type === 'professional' ? 'Professional' : 'Artisan'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-mono tabular-nums text-[14px]">{art.phone}</div>
                          {art.email && <div className="text-[13px] text-[#64748B]">{art.email}</div>}
                        </td>
                        <td className="py-3.5 px-3">
                          <div>{art.town}, {art.state}</div>
                          {art.address && <div className="text-[13px] text-[#64748B] truncate max-w-[180px]">{art.address}</div>}
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={art.validation_status || (art.verified ? 'validated' : 'pending')}
                            onChange={async (e) => {
                              await updateArtisanRecommendation(art.id, {
                                validation_status: e.target.value as any,
                                verified: e.target.value === 'validated' || e.target.value === 'claimed',
                              });
                              loadAll();
                            }}
                            className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1.5 text-[13px] font-bold text-[#0B192C]"
                          >
                            <option value="validated">Validated</option>
                            <option value="pending">Pending</option>
                            <option value="claimed">Claimed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="py-3.5 pl-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteArtisanRecommendation(art.id);
                              loadAll();
                            }}
                            className="p-2 text-[#64748B] hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: LEADS UPLOAD + PRODUCT ENQUIRIES + DEMAND ADVERTS              */}
      {/* ===================================================================== */}
      {activeTab === 'leads' && (
        <div className="space-y-6 min-w-0">
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl font-bold text-[#0B192C]">
                  Uploaded Leads & Product Enquiries ({adminLeads.length})
                </h2>
                <p className="text-[15px] text-[#5B6D85] mt-1 leading-relaxed">
                  Includes leads uploaded via CSV/Excel, manual entry, and buyer enquiries from Matthew AI.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#3D74D9] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap">
                  <Upload className="w-4 h-4" />
                  <span>Upload Leads CSV/Excel</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleLeadsSpreadsheetUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setIsLeadModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#0B192C] text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Lead</span>
                </button>
              </div>
            </div>

            {adminLeads.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[15px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#E2E8F0] text-[13px] uppercase tracking-wider text-[#5B6D85]">
                      <th className="py-3 pr-3">Customer</th>
                      <th className="py-3 px-3">Need / Product</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Source</th>
                      <th className="py-3 pl-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminLeads.slice(0, 25).map((lead) => (
                      <tr key={lead.id} className="border-b border-[#F1F5F9]">
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-[#0B192C]">{lead.customer_name}</div>
                          <div className="font-mono tabular-nums text-[13px] text-[#64748B]">{lead.phone}</div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#0B192C]">{lead.service_required}</td>
                        <td className="py-3 px-3 text-[#475569]">{lead.location}</td>
                        <td className="py-3 px-3 text-[13px] text-[#5B6D85]">{lead.source_name || lead.source}</td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteAdminLead(lead.id);
                              loadAll();
                            }}
                            className="p-1.5 text-[#64748B] hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Existing Demand Adverts & Customer Requests Engine */}
          <DemandAdvertsView
            onNavigateToMarketplace={onNavigateToMarketplace}
            onNavigateToArtisans={onNavigateToArtisans}
            onOpenRecommendWall={onOpenRecommendWall}
          />
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: ANALYTICS, SEARCH TRENDS & CUSTOMER CONVERSATIONS              */}
      {/* ===================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {[
              { label: 'Published Products', value: summary.publishedProducts ?? products.length },
              { label: 'Total Searches', value: summary.totalSearches ?? 0 },
              { label: 'Zero-Result Searches', value: summary.zeroResultCount ?? 0 },
              { label: 'Ad Impressions / Clicks', value: `${summary.totalImpressions ?? 0} / ${summary.totalClicks ?? 0}` },
            ].map((kpi) => (
              <div key={kpi.label} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E5E9F0]">
                <div className="text-[13px] font-semibold uppercase tracking-wider text-[#5B6D85]">{kpi.label}</div>
                <div className="font-heading font-mono tabular-nums text-2xl sm:text-3xl font-extrabold text-[#0B192C] mt-1.5">{kpi.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Zero-result searches */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-3.5">
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">
                Zero-Result Queries (Inventory Opportunities)
              </h3>
              {(analytics?.zeroResultQueries || []).length === 0 ? (
                <p className="text-[15px] text-[#5B6D85]">No zero-result searches logged yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {analytics.zeroResultQueries.map((z: any) => (
                    <div key={z.id} className="p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] flex items-center justify-between text-[15px]">
                      <span className="font-semibold text-[#0B192C]">{z.query}</span>
                      <span className="text-[13px] text-[#64748B]">{z.location || 'Any location'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Enquiries */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-3.5">
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">
                Recent Product Enquiries ({enquiries.length})
              </h3>
              {enquiries.length === 0 ? (
                <p className="text-[15px] text-[#5B6D85]">No customer product enquiries logged yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {enquiries.slice(0, 15).map((e) => (
                    <div key={e.id} className="p-3 rounded-xl bg-[#FAFBFD] border border-[#F1F5F9] text-[15px]">
                      <div className="flex justify-between font-bold text-[#0B192C]">
                        <span>{e.product_name}</span>
                        <span className="font-mono tabular-nums">{e.customer_phone}</span>
                      </div>
                      <div className="text-[13px] text-[#64748B] mt-1">
                        {e.customer_name} · Seller: {e.seller_name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conversation History */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-3.5">
            <h3 className="font-heading text-xl font-bold text-[#0B192C] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#3D74D9]" />
              <span>Customer Conversations with Matthew AI ({(analytics?.conversations || []).length})</span>
            </h3>
            {(analytics?.conversations || []).length === 0 ? (
              <p className="text-[15px] text-[#5B6D85]">No customer conversations recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {analytics.conversations.map((c: any) => (
                  <div key={c.sessionId} className="p-3.5 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] text-[15px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#0B192C]">{c.title}</span>
                      <span className="text-[13px] text-[#64748B] tabular-nums">{c.turns?.length || 0} turns</span>
                    </div>
                    {c.turns?.slice(-1).map((t: any, idx: number) => (
                      <div key={idx} className="text-[13px] text-[#475569] tabular-nums">
                        Last query: "{t.userMessage}" → {t.productsCount} products, {t.professionalsCount} pros
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODALS: SINGLE PRODUCT / CAMPAIGN / ARTISAN / LEAD                    */}
      {/* ===================================================================== */}
      {isProductModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsProductModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">Add Product to Unified Database</h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold whitespace-nowrap transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <form onSubmit={handleSingleProductSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-[15px]">
              <div className="grid grid-cols-2 gap-3.5">
                <div className="col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">Product Name *</label>
                  <input
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Brand</label>
                  <input
                    value={newProd.brand}
                    onChange={(e) => setNewProd({ ...newProd, brand: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Model</label>
                  <input
                    value={newProd.model}
                    onChange={(e) => setNewProd({ ...newProd, model: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Category</label>
                  <input
                    value={newProd.category}
                    onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    value={newProd.price}
                    onChange={(e) => setNewProd({ ...newProd, price: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Seller Name</label>
                  <input
                    value={newProd.seller_name}
                    onChange={(e) => setNewProd({ ...newProd, seller_name: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Location</label>
                  <input
                    value={newProd.location}
                    onChange={(e) => setNewProd({ ...newProd, location: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">External Purchase URL (e.g. Jiji.ng)</label>
                  <input
                    type="url"
                    value={newProd.product_url}
                    onChange={(e) => setNewProd({ ...newProd, product_url: e.target.value })}
                    placeholder="https://jiji.ng/..."
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={newProd.image}
                    onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                    placeholder="Image URL..."
                    className="flex-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] text-[14px] font-bold text-[#0B192C] whitespace-nowrap cursor-pointer">
                    Upload
                    <input type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                  </label>
                </div>
                <div className="col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">Specs (Key: Value per line)</label>
                  <textarea
                    rows={2}
                    value={newProd.specsText}
                    onChange={(e) => setNewProd({ ...newProd, specsText: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[14px] text-[#0B192C] font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-4 py-2.5 text-[14px] font-semibold text-[#64748B] whitespace-nowrap cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-[15px] font-bold whitespace-nowrap cursor-pointer">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCampaignModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCampaignModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">Create Sponsored Campaign</h3>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold whitespace-nowrap transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 overflow-y-auto flex-1 space-y-4 text-[15px]">
              <div>
                <label className="text-[14px] font-semibold text-[#334155]">Advertiser Name *</label>
                <input
                  required
                  value={newCamp.advertiser_name}
                  onChange={(e) => setNewCamp({ ...newCamp, advertiser_name: e.target.value })}
                  className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                />
              </div>
              <div>
                <label className="text-[14px] font-semibold text-[#334155]">Campaign Title</label>
                <input
                  value={newCamp.campaign_title}
                  onChange={(e) => setNewCamp({ ...newCamp, campaign_title: e.target.value })}
                  className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                />
              </div>
              <div>
                <label className="text-[14px] font-semibold text-[#334155]">Target Product *</label>
                <select
                  required
                  value={newCamp.target_id}
                  onChange={(e) => setNewCamp({ ...newCamp, target_id: e.target.value })}
                  className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                >
                  <option value="">Select published product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.currency}{p.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Target Categories</label>
                  <input
                    value={newCamp.target_categories}
                    onChange={(e) => setNewCamp({ ...newCamp, target_categories: e.target.value })}
                    placeholder="Solar & Power"
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Target Locations</label>
                  <input
                    value={newCamp.target_locations}
                    onChange={(e) => setNewCamp({ ...newCamp, target_locations: e.target.value })}
                    placeholder="Lagos, Abuja"
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">CPC Bid (₦)</label>
                  <input
                    type="number"
                    value={newCamp.cpc_bid}
                    onChange={(e) => setNewCamp({ ...newCamp, cpc_bid: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Total Budget (₦)</label>
                  <input
                    type="number"
                    value={newCamp.budget_total}
                    onChange={(e) => setNewCamp({ ...newCamp, budget_total: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C] font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="text-[14px] font-semibold text-[#334155]">Trigger Keywords (comma-separated)</label>
                <input
                  value={newCamp.keywords}
                  onChange={(e) => setNewCamp({ ...newCamp, keywords: e.target.value })}
                  placeholder="inverter, 5kva, lithium, solar"
                  className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="px-4 py-2.5 text-[14px] font-semibold text-[#64748B] whitespace-nowrap cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-[15px] font-bold whitespace-nowrap cursor-pointer">Launch Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isArtisanModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsArtisanModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
              <div>
                <h3 className="font-heading text-xl font-bold text-[#0B192C]">
                  Add {newArtisan.profile_type === 'professional' ? 'Professional / Business' : 'Artisan'} to Directory
                </h3>
                <p className="text-[13px] text-[#5B6D85]">
                  Saved directly to the live directory & searchable by Matthew AI
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsArtisanModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold whitespace-nowrap transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <form onSubmit={handleSingleArtisanSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-[15px]">
              {/* Listing Type Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F1F5F9]">
                {[
                  { id: 'professional' as const, label: 'Registered Professional / Business' },
                  { id: 'artisan' as const, label: 'Individual Artisan' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewArtisan({ ...newArtisan, profile_type: opt.id })}
                    className={`py-2.5 px-3 rounded-lg text-[14px] font-bold transition cursor-pointer ${
                      newArtisan.profile_type === opt.id
                        ? 'bg-[#0B192C] text-white shadow-xs'
                        : 'text-[#475569] hover:text-[#0B192C]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">
                    {newArtisan.profile_type === 'professional' ? 'Business / Professional Name *' : 'Artisan Full Name / Workshop *'}
                  </label>
                  <input
                    required
                    placeholder={newArtisan.profile_type === 'professional' ? 'e.g. Apex Solar Engineering Ltd' : 'e.g. Engr. Tunde Adeyemi'}
                    value={newArtisan.artisan_name}
                    onChange={(e) => setNewArtisan({ ...newArtisan, artisan_name: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Trade / Industry Category *</label>
                  <select
                    value={newArtisan.trade_category}
                    onChange={(e) => setNewArtisan({ ...newArtisan, trade_category: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  >
                    {ARTISAN_TRADE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Other / Custom Trade</option>
                  </select>
                </div>

                {newArtisan.trade_category === '__custom__' ? (
                  <div>
                    <label className="text-[14px] font-semibold text-[#334155]">Custom Trade / Industry *</label>
                    <input
                      required
                      placeholder="e.g. Borehole Driller, IT Networking"
                      value={newArtisan.custom_trade}
                      onChange={(e) => setNewArtisan({ ...newArtisan, custom_trade: e.target.value })}
                      className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[14px] font-semibold text-[#334155]">Experience / Tier</label>
                    <select
                      value={newArtisan.level}
                      onChange={(e) => setNewArtisan({ ...newArtisan, level: e.target.value as any })}
                      className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                    >
                      <option value="master_artisan">Master Specialist / Senior</option>
                      <option value="certified">Certified Professional</option>
                      <option value="experienced">Experienced Practitioner</option>
                      <option value="rising_talent">Verified Technician</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Phone Number *</label>
                  <input
                    required
                    placeholder="e.g. 0803 123 4567"
                    value={newArtisan.phone}
                    onChange={(e) => setNewArtisan({ ...newArtisan, phone: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">WhatsApp Number</label>
                  <input
                    placeholder="Defaults to phone number"
                    value={newArtisan.whatsapp}
                    onChange={(e) => setNewArtisan({ ...newArtisan, whatsapp: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Email Address</label>
                  <input
                    type="email"
                    placeholder="contact@business.ng"
                    value={newArtisan.email}
                    onChange={(e) => setNewArtisan({ ...newArtisan, email: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">CAC / License No. (optional)</label>
                  <input
                    placeholder="e.g. RC 1829402"
                    value={newArtisan.cac_number}
                    onChange={(e) => setNewArtisan({ ...newArtisan, cac_number: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">State *</label>
                  <select
                    value={newArtisan.state}
                    onChange={(e) => setNewArtisan({ ...newArtisan, state: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[14px] font-semibold text-[#334155]">Area / City / Town *</label>
                  <input
                    required
                    placeholder="e.g. Ikeja, Lekki Phase 1, Wuse 2"
                    value={newArtisan.town}
                    onChange={(e) => setNewArtisan({ ...newArtisan, town: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">Exact Workshop / Office Street Address</label>
                  <input
                    placeholder="e.g. 24 Allen Avenue, Ikeja, Lagos"
                    value={newArtisan.address}
                    onChange={(e) => setNewArtisan({ ...newArtisan, address: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">Services Offered / Specializations (comma-separated)</label>
                  <input
                    placeholder="e.g. 5KVA Inverter Setup, Lithium Batteries, Conduit Rewiring"
                    value={newArtisan.services_offered}
                    onChange={(e) => setNewArtisan({ ...newArtisan, services_offered: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[14px] font-semibold text-[#334155]">Bio / Notable Work Completed</label>
                  <textarea
                    rows={2}
                    value={newArtisan.work_done}
                    onChange={(e) => setNewArtisan({ ...newArtisan, work_done: e.target.value })}
                    className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={newArtisan.photo_url}
                    onChange={(e) => setNewArtisan({ ...newArtisan, photo_url: e.target.value })}
                    placeholder="Profile photo / Logo URL (optional)..."
                    className="flex-1 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
                  />
                  <label className="px-4 py-2.5 rounded-xl bg-[#F1F5F9] text-[14px] font-bold text-[#0B192C] whitespace-nowrap cursor-pointer shrink-0">
                    Upload Photo
                    <input type="file" accept="image/*" onChange={handleArtisanPhotoUpload} className="hidden" />
                  </label>
                </div>

                <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-[14px] font-semibold text-[#0B192C]">
                    <input
                      type="checkbox"
                      checked={newArtisan.verified}
                      onChange={(e) =>
                        setNewArtisan({
                          ...newArtisan,
                          verified: e.target.checked,
                          validation_status: e.target.checked ? 'validated' : 'pending',
                        })
                      }
                      className="h-4 w-4"
                    />
                    <span>Mark as Verified Listing immediately</span>
                  </label>

                  <select
                    value={newArtisan.validation_status}
                    onChange={(e) => setNewArtisan({ ...newArtisan, validation_status: e.target.value as any })}
                    className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 text-[14px] font-bold text-[#0B192C]"
                  >
                    <option value="validated">Status: Validated</option>
                    <option value="claimed">Status: Claimed Business</option>
                    <option value="pending">Status: Pending Review</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsArtisanModalOpen(false)} className="px-4 py-2.5 text-[14px] font-semibold text-[#64748B] whitespace-nowrap cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[15px] font-bold whitespace-nowrap cursor-pointer">
                  Save {newArtisan.profile_type === 'professional' ? 'Professional' : 'Artisan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLeadModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsLeadModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white overflow-hidden shadow-2xl">
            <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E2E8F0] shrink-0">
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">Add Lead to Unified Database</h3>
              <button
                type="button"
                onClick={() => setIsLeadModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] text-[14px] font-bold whitespace-nowrap transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
            <form onSubmit={handleSingleLeadSubmit} className="p-6 overflow-y-auto flex-1 space-y-3.5 text-[15px]">
              <input
                required
                placeholder="Customer Name *"
                value={newLead.customer_name}
                onChange={(e) => setNewLead({ ...newLead, customer_name: e.target.value })}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
              />
              <input
                placeholder="Phone / WhatsApp"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
              />
              <input
                required
                placeholder="Product / Service Required *"
                value={newLead.service_required}
                onChange={(e) => setNewLead({ ...newLead, service_required: e.target.value })}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
              />
              <input
                placeholder="Location"
                value={newLead.location}
                onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
              />
              <input
                placeholder="Budget (e.g. ₦800,000)"
                value={newLead.budget_formatted}
                onChange={(e) => setNewLead({ ...newLead, budget_formatted: e.target.value })}
                className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[15px] text-[#0B192C]"
              />
              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <button type="button" onClick={() => setIsLeadModalOpen(false)} className="px-4 py-2.5 text-[14px] font-semibold text-[#64748B] whitespace-nowrap cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#0B192C] text-white text-[15px] font-bold whitespace-nowrap cursor-pointer">Save Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
