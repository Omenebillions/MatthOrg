import React, { useEffect, useState } from 'react';
import { Product, BusinessProfile, ProductEnquiry } from '../types';
import {
  Package,
  Plus,
  Search,
  Trash2,
  Edit2,
  X,
  Check,
  Sparkles,
  Upload,
  Globe,
  MessageCircle,
  Phone,
  FileText,
  Inbox,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { uploadProjectImage } from '../lib/storage';
import { fetchProductEnquiries, updateEnquiryStatus } from '../data/commerceData';

interface ProductsViewProps {
  products: Product[];
  business: BusinessProfile;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  onConvertEnquiryToQuote?: (enquiry: ProductEnquiry) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  business,
  onSaveProduct,
  onDeleteProduct,
  onConvertEnquiryToQuote,
}) => {
  const [subTab, setSubTab] = useState<'catalogue' | 'enquiries'>('catalogue');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [enquiries, setEnquiries] = useState<ProductEnquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(false);

  // Modal Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('unit');
  const [defaultPrice, setDefaultPrice] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');
  const [image, setImage] = useState('');
  const [condition, setCondition] = useState<'New' | 'Foreign Used' | 'Refurbished' | 'Used'>('New');
  const [availability, setAvailability] = useState<'In Stock' | 'Low Stock' | 'Made to Order' | 'Out of Stock'>('In Stock');
  const [stockQuantity, setStockQuantity] = useState<string>('');
  const [warranty, setWarranty] = useState('');
  const [location, setLocation] = useState('');
  const [specsText, setSpecsText] = useState('');
  const [variationsText, setVariationsText] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalConfirmDelete, setModalConfirmDelete] = useState(false);

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    try {
      const list = await fetchProductEnquiries(business.id);
      setEnquiries(list);
    } catch {
      // ignore
    } finally {
      setLoadingEnquiries(false);
    }
  };

  useEffect(() => {
    loadEnquiries();
  }, [business.id]);

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isModalOpen]);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category || 'General')))];

  const filtered = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (p.name || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.model || '').toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'All' || (p.category || 'General') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setBrand('');
    setModel('');
    setDescription('');
    setUnit('unit');
    setDefaultPrice(0);
    setCategory('General');
    setSku('');
    setImage('');
    setCondition('New');
    setAvailability('In Stock');
    setStockQuantity('');
    setWarranty('');
    setLocation(business.city ? `${business.city}, ${business.state || ''}`.replace(/,\s*$/, '') : business.state || '');
    setSpecsText('');
    setVariationsText('');
    setIsPublished(true);
    setUploadNotice(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBrand(p.brand || '');
    setModel(p.model || '');
    setDescription(p.description || '');
    setUnit(p.unit || 'unit');
    setDefaultPrice(p.default_price);
    setCategory(p.category || 'General');
    setSku(p.sku || '');
    setImage(p.image || '');
    setCondition(p.condition || 'New');
    setAvailability(p.availability || 'In Stock');
    setStockQuantity(p.stock_quantity !== undefined ? String(p.stock_quantity) : '');
    setWarranty(p.warranty || '');
    setLocation(p.location || '');
    setSpecsText(
      p.specs
        ? Object.entries(p.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : ''
    );
    setVariationsText(Array.isArray(p.variations) ? p.variations.join(', ') : '');
    setIsPublished(p.is_published !== undefined ? p.is_published : true);
    setUploadNotice(null);
    setModalConfirmDelete(false);
    setIsModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteProduct(id);
      if (confirmDeleteId === id) setConfirmDeleteId(null);
      if (editingProduct?.id === id) {
        setModalConfirmDelete(false);
        setIsModalOpen(false);
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    setUploadNotice(null);
    try {
      const result = await uploadProjectImage(file, 'products');
      setImage(result.publicUrl);
      setUploadNotice(
        result.warning ||
          (result.provider === 'supabase'
            ? `Uploaded raw unoptimized image to Supabase bucket "${result.bucket}".`
            : 'Uploaded raw unoptimized image successfully.')
      );
    } catch (err: any) {
      setUploadNotice(err?.message || 'Upload failed — paste an image URL instead.');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const specsObj: Record<string, string> = {};
    specsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          specsObj[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
        }
      });

    const variationsArr = variationsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const prodObj: Product = {
      id: editingProduct?.id || 'prod_' + Date.now(),
      name: name.trim(),
      brand: brand.trim() || undefined,
      model: model.trim() || undefined,
      description: description.trim(),
      unit: unit.trim() || 'unit',
      default_price: defaultPrice,
      category: category.trim() || 'General',
      sku: sku.trim() || undefined,
      image: image.trim() || undefined,
      condition,
      availability,
      stock_quantity: stockQuantity ? parseInt(stockQuantity, 10) : undefined,
      warranty: warranty.trim() || undefined,
      location: location.trim() || undefined,
      specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      variations: variationsArr.length > 0 ? variationsArr : undefined,
      is_published: isPublished,
      approval_status: editingProduct?.approval_status || 'approved',
    };

    onSaveProduct(prodObj);
    setIsModalOpen(false);
  };

  const handleStatusChange = async (enqId: string, nextStatus: ProductEnquiry['status']) => {
    try {
      const updated = await updateEnquiryStatus(enqId, nextStatus);
      setEnquiries((prev) => prev.map((e) => (e.id === enqId ? updated : e)));
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full min-w-0 space-y-5 animate-in fade-in overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] shadow-xs min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="type-dashboard-title text-[#0B192C]">
              Product Catalogue & Discovery ({products.length})
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold bg-[#0B192C]/5 text-[#0B192C] px-3 py-1 rounded-lg border border-[#E5E9F0]">
              <Sparkles className="w-3.5 h-3.5 text-[#3D74D9]" /> Indexed in Matthew AI
            </span>
          </div>
          <p className="text-[15px] text-[#5B6D85] mt-1">
            Publish structured products with pricing, images, and specs for Matthew AI discovery and instant CRM quoting.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
          <div className="inline-flex flex-wrap sm:flex-nowrap rounded-xl bg-[#F1F5F9] p-1 text-[14px] font-bold max-w-full">
            <button
              type="button"
              onClick={() => setSubTab('catalogue')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer whitespace-nowrap ${
                subTab === 'catalogue' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-[#5B6D85]'
              }`}
            >
              Catalogue ({products.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab('enquiries');
                loadEnquiries();
              }}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                subTab === 'enquiries' ? 'bg-white text-[#0B192C] shadow-xs' : 'text-[#5B6D85]'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>Enquiries ({enquiries.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-4 py-2.5 text-[15px] font-bold shadow-sm transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {subTab === 'enquiries' ? (
        <div className="bg-white rounded-2xl border border-[#E5E9F0] p-5 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-heading text-xl font-bold text-[#0B192C]">Customer Product Enquiries</h2>
              <p className="text-[14px] text-[#5B6D85]">
                Inquiries submitted by buyers chatting with Matthew AI. Convert directly into quotations.
              </p>
            </div>
            <button
              type="button"
              onClick={loadEnquiries}
              className="px-3.5 py-2 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[14px] font-bold text-[#0B192C] cursor-pointer whitespace-nowrap"
            >
              Refresh
            </button>
          </div>

          {loadingEnquiries ? (
            <div className="py-10 text-center text-[15px] text-[#5B6D85]">Loading enquiries...</div>
          ) : enquiries.length === 0 ? (
            <div className="py-12 text-center text-[15px] text-[#5B6D85] bg-[#FAFBFD] rounded-2xl border border-dashed border-[#E5E9F0]">
              No product enquiries logged yet. Published catalogue products appear when customers query Matthew AI.
            </div>
          ) : (
            <div className="space-y-3">
              {enquiries.map((enq) => (
                <div
                  key={enq.id}
                  className="p-4 rounded-2xl bg-[#FAFBFD] border border-[#E5E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[14px]">
                      <span className="font-bold text-[#0B192C]">{enq.customer_name}</span>
                      <span className="text-[#8F9FB5]">·</span>
                      <span className="font-mono text-[#475569]">{enq.customer_phone}</span>
                      <span className="text-[#8F9FB5]">·</span>
                      <span className="text-[#5B6D85]">{enq.customer_location || 'Nigeria'}</span>
                    </div>
                    <div className="font-heading text-base font-bold text-[#0B192C]">
                      {enq.product_name} {enq.quantity ? `(Qty: ${enq.quantity})` : ''}
                    </div>
                    <p className="text-[14px] text-[#475569]">{enq.message}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <select
                      value={enq.status}
                      onChange={(e) => handleStatusChange(enq.id, e.target.value as ProductEnquiry['status'])}
                      className="rounded-xl bg-white border border-[#E2E8F0] px-3 py-2 text-[14px] font-bold text-[#0B192C]"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="converted">Converted</option>
                    </select>
                    <a
                      href={`tel:${enq.customer_phone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[14px] font-bold text-[#0B192C]"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${enq.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-[14px] font-bold"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </a>
                    {onConvertEnquiryToQuote && (
                      <button
                        type="button"
                        onClick={() => onConvertEnquiryToQuote(enq)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B192C] text-white text-[14px] font-bold cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Quote</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-[#5B6D85] absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalogue by product name, brand, model, or SKU..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E5E9F0] text-[15px] text-[#0B192C] placeholder-[#8F9FB5] focus:outline-none focus:border-[#0B192C] transition"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-[14px] font-medium max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl whitespace-nowrap transition font-semibold cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0B192C] text-white'
                      : 'bg-white text-[#5B6D85] hover:text-[#0B192C] border border-[#E5E9F0]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[15px] text-[#5B6D85] bg-white rounded-2xl border border-dashed border-[#E5E9F0] space-y-3">
              <Package className="w-8 h-8 mx-auto text-[#94A3B8]" />
              <div>No products found matching your search.</div>
              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B192C] text-white text-[14px] font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Item
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-2xl bg-white border border-[#E5E9F0] hover:border-[#CBD5E1] p-3.5 flex flex-col justify-between transition-all duration-200 shadow-xs"
                >
                  <div className="relative w-full h-36 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] flex items-center justify-center overflow-hidden mb-3">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="eager"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <Package className="w-8 h-8 mx-auto text-[#94A3B8]" />
                        <span className="text-[13px] font-mono text-[#5B6D85] mt-1 block">
                          {p.sku ? `SKU: ${p.sku}` : p.category || 'Product'}
                        </span>
                      </div>
                    )}
                    {p.is_published !== false && (
                      <span
                        title="Live in Matthew AI Discovery"
                        className="absolute top-2 right-2 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[13px] font-bold flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" /> Live
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 flex-1">
                    <div className="text-[13px] font-semibold text-[#5B6D85]">
                      {[p.brand, p.model].filter(Boolean).join(' ') || p.category} · {p.availability || 'In Stock'}
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#0B192C] truncate">{p.name}</h3>
                    <p className="text-[14px] text-[#5B6D85] line-clamp-2 leading-relaxed">
                      {p.description || 'Catalogue item with standard pricing.'}
                    </p>
                  </div>

                  <div className="pt-3 mt-3 border-t border-[#E5E9F0] flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold text-[#8F9FB5]">
                        per {p.unit || 'unit'}
                      </div>
                      <div className="font-mono tabular-nums text-lg font-extrabold text-[#0B192C]">
                        {formatCurrency(p.default_price, business.currency)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {confirmDeleteId === p.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2 py-1">
                          <button
                            type="button"
                            disabled={deletingId === p.id}
                            onClick={() => handleConfirmDelete(p.id)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
                          >
                            {deletingId === p.id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 text-[13px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-[#5B6D85] hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="w-9 h-9 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white flex items-center justify-center shadow-xs transition cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Commerce Product Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl text-[#0B192C] overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E9F0] bg-white shrink-0">
              <h3 className="font-heading text-xl font-extrabold text-[#0B192C]">
                {editingProduct ? 'Edit Catalogue Product' : 'Add Product / Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0B192C] text-[14px] font-bold transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-3.5 overflow-y-auto">
              {/* Image Upload / Preview */}
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] flex flex-col sm:flex-row items-center gap-3">
                <div className="w-20 h-20 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center overflow-hidden shrink-0">
                  {image ? (
                    <img src={image} alt="Preview" loading="eager" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" />
                  ) : (
                    <Package className="w-7 h-7 text-[#94A3B8]" />
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B192C] text-white text-[14px] font-bold cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>{isUploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <input
                      type="url"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="Or paste product image URL..."
                      className="flex-1 min-w-[180px] rounded-lg bg-white border border-[#E2E8F0] px-3 py-2 text-[15px] text-[#0B192C]"
                    />
                  </div>
                  {uploadNotice && <p className="text-[13px] text-[#3D74D9] font-medium">{uploadNotice}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Product / Service Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Felicity 5KVA Hybrid Solar Inverter"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Felicity, Samsung, HP"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. IVEM5048"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Solar & Power, Laptops & Computing"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="INV-5KVA"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Price ({business.currency}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C] font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Unit</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="unit, pcs, set, job"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Condition</label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  >
                    <option value="New">New</option>
                    <option value="Foreign Used">Foreign Used</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Availability</label>
                  <select
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value as any)}
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Made to Order">Made to Order</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Warranty</label>
                  <input
                    type="text"
                    value={warranty}
                    onChange={(e) => setWarranty(e.target.value)}
                    placeholder="e.g. 2 Years Manufacturer Warranty"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Stock Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Ikeja, Lagos"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#475569] mb-1">
                  Specifications (one per line as Key: Value)
                </label>
                <textarea
                  rows={2}
                  value={specsText}
                  onChange={(e) => setSpecsText(e.target.value)}
                  placeholder={'Capacity: 5KVA / 48V\nWave Type: Pure Sine Wave\nMPPT Controller: Built-in 80A'}
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] p-3 text-[14px] text-[#0B192C] font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">
                    Variations (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={variationsText}
                    onChange={(e) => setVariationsText(e.target.value)}
                    placeholder="e.g. 24V, 48V, Black, Silver"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C]"
                  />
                </div>
                <div>
                  <label className="block text-[14px] font-semibold text-[#475569] mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] px-3 py-2.5 text-[15px] text-[#0B192C] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#475569] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed product features or installation scope..."
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] p-3 text-[15px] text-[#0B192C]"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0B192C]"
                />
                <span className="text-[14px] font-semibold text-[#0B192C]">
                  Publish to Matthew AI Discovery Homepage (makes this product searchable by buyers)
                </span>
              </label>

              <div className="pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {editingProduct && (
                    modalConfirmDelete ? (
                      <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
                        <span className="text-[13px] font-bold text-rose-700">Delete product?</span>
                        <button
                          type="button"
                          disabled={deletingId === editingProduct.id}
                          onClick={() => handleConfirmDelete(editingProduct.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold cursor-pointer disabled:opacity-60"
                        >
                          {deletingId === editingProduct.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalConfirmDelete(false)}
                          className="px-2 py-1 text-[13px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setModalConfirmDelete(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[14px] font-bold transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Product</span>
                      </button>
                    )
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-[14px] font-semibold text-[#5B6D85] hover:text-[#0B192C] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B192C] hover:bg-[#152744] text-white px-5 py-2.5 text-[15px] font-bold shadow-xs transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save to Catalogue</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
