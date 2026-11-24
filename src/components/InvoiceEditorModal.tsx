import React, { useState } from 'react';
import {
  Invoice,
  InvoiceItem,
  Customer,
  BusinessProfile,
  InvoiceStatus,
  AppState,
  DocumentDesignTemplate,
  Product,
} from '../types';
import {
  X,
  Plus,
  Trash2,
  FileDown,
  MessageCircle,
  Copy,
  Check,
  CreditCard,
  Building,
  CheckCircle2,
  Palette,
  Printer,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  buildWhatsAppLink,
  createInvoiceWhatsAppText,
  generateDocNumber,
} from '../utils/formatters';
import { generateInvoicePDF, printInvoicePDF } from '../utils/pdfGenerator';
import { WhiteDocumentSheet } from './WhiteDocumentSheet';

interface InvoiceEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice?: Invoice | null;
  state: AppState;
  onSaveInvoice: (invoice: Invoice) => void;
  onDeleteInvoice?: (id: string) => void;
  onSaveProduct?: (product: Product) => void;
}

export const InvoiceEditorModal: React.FC<InvoiceEditorModalProps> = ({
  isOpen,
  onClose,
  invoice,
  state,
  onSaveInvoice,
  onDeleteInvoice,
}) => {
  if (!isOpen) return null;

  const business = state.business;

  const [invoiceNumber, setInvoiceNumber] = useState(
    invoice?.invoice_number || generateDocNumber('MAT-INV', state.invoices.length)
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState(invoice?.customer_id || '');
  const [customerName, setCustomerName] = useState(invoice?.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(invoice?.customer_phone || '');
  const [customerWhatsapp, setCustomerWhatsapp] = useState(invoice?.customer_whatsapp || '');
  const [customerEmail, setCustomerEmail] = useState(invoice?.customer_email || '');
  const [customerAddress, setCustomerAddress] = useState(invoice?.customer_address || '');

  const [status, setStatus] = useState<InvoiceStatus>(invoice?.status || 'Unpaid');
  const [issueDate, setIssueDate] = useState(
    invoice?.issue_date || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(() => {
    if (invoice?.due_date) return invoice.due_date;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [designTemplate, setDesignTemplate] = useState<DocumentDesignTemplate>(
    invoice?.design_template || business.invoice_design || 'corporate'
  );

  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (invoice?.items && invoice.items.length > 0) return [...invoice.items];
    return [
      {
        id: 'inv_it_' + Date.now(),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit: 'unit',
        total: 0,
      },
    ];
  });

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(
    invoice?.discount_type || 'percent'
  );
  const [discountVal, setDiscountVal] = useState<number>(invoice?.discount_val || 0);
  const [taxRate, setTaxRate] = useState<number>(invoice?.tax_rate ?? business.tax_rate);
  const [amountPaid, setAmountPaid] = useState<number>(invoice?.amount_paid || 0);
  const [notes, setNotes] = useState(invoice?.notes || '');
  const [paymentDetails, setPaymentDetails] = useState(
    invoice?.payment_details ||
      `Bank: ${business.payment_details.bank_name} | Account Name: ${business.payment_details.account_name} | Account No: ${business.payment_details.account_number}`
  );

  const [isCopied, setIsCopied] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [modalViewMode, setModalViewMode] = useState<'editor' | 'whiteSheet'>('editor');

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + (it.total || 0), 0);
  const discountAmount =
    discountType === 'percent'
      ? (subtotal * (discountVal || 0)) / 100
      : Math.min(discountVal || 0, subtotal);
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * (taxRate || 0)) / 100;
  const grandTotal = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, grandTotal - amountPaid);

  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    const cust = state.customers.find((c) => c.id === cId);
    if (cust) {
      setCustomerName(cust.name);
      setCustomerPhone(cust.phone);
      setCustomerWhatsapp(cust.whatsapp);
      setCustomerEmail(cust.email);
      setCustomerAddress(cust.address);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: 'inv_it_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        unit: 'unit',
        total: 0,
      },
    ]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          const q = field === 'quantity' ? Number(value) : it.quantity;
          const p = field === 'unit_price' ? Number(value) : it.unit_price;
          updated.total = (isNaN(q) ? 0 : q) * (isNaN(p) ? 0 : p);
        }
        return updated;
      })
    );
  };

  const handleDeleteItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const buildCurrentInvoice = (): Invoice => {
    let computedStatus = status;
    if (amountPaid >= grandTotal && grandTotal > 0) {
      computedStatus = 'Paid';
    } else if (amountPaid > 0 && amountPaid < grandTotal) {
      computedStatus = 'Partially Paid';
    }

    return {
      id: invoice?.id || 'inv_' + Date.now(),
      invoice_number: invoiceNumber,
      quote_id: invoice?.quote_id,
      customer_id: selectedCustomerId || 'cust_temp_' + Date.now(),
      customer_name: customerName || 'Valued Client',
      customer_phone: customerPhone,
      customer_whatsapp: customerWhatsapp || customerPhone,
      customer_email: customerEmail,
      customer_address: customerAddress,
      status: computedStatus,
      issue_date: issueDate,
      due_date: dueDate,
      items,
      subtotal,
      discount_type: discountType,
      discount_val: discountVal,
      discount_amount: discountAmount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total: grandTotal,
      amount_paid: amountPaid,
      notes,
      payment_details: paymentDetails,
      design_template: designTemplate,
      created_at: invoice?.created_at || new Date().toISOString(),
    };
  };

  const handleSave = () => {
    const compiled = buildCurrentInvoice();
    onSaveInvoice(compiled);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleMarkPaid = () => {
    setAmountPaid(grandTotal);
    setStatus('Paid');
  };

  const handleDownloadPDF = () => {
    const compiled = buildCurrentInvoice();
    generateInvoicePDF(compiled, business);
  };

  const handlePrintPDF = () => {
    const compiled = buildCurrentInvoice();
    printInvoicePDF(compiled, business);
  };

  const handleWhatsAppShare = () => {
    const compiled = buildCurrentInvoice();
    onSaveInvoice(compiled);
    const msg = createInvoiceWhatsAppText(
      compiled.customer_name,
      business.business_name,
      compiled.invoice_number,
      formatCurrency(balanceDue > 0 ? balanceDue : compiled.total, business.currency),
      formatDate(compiled.due_date),
      compiled.payment_details
    );
    const link = buildWhatsAppLink(compiled.customer_whatsapp || compiled.customer_phone, msg);
    window.open(link, '_blank');
  };

  const handleCopyPaymentText = () => {
    const msg = createInvoiceWhatsAppText(
      customerName,
      business.business_name,
      invoiceNumber,
      formatCurrency(balanceDue > 0 ? balanceDue : grandTotal, business.currency),
      formatDate(dueDate),
      paymentDetails
    );
    navigator.clipboard.writeText(msg);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-5xl rounded-2xl bg-white border border-[#E5E9F0] shadow-2xl text-[#0B192C] my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#E5E9F0] bg-white rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono tabular-nums text-[14px] font-bold px-2.5 py-1 rounded-md bg-[#0B192C]/10 text-[#0B192C] border border-[#0B192C]/20">
              {invoiceNumber}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[14px] text-[#5B6D85]">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="bg-[#F4F7FB] border border-[#E5E9F0] rounded-lg text-[14px] font-semibold px-3 py-1.5 text-[#0B192C] focus:outline-none focus:border-[#0B192C] cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Design Template Selector */}
            <div className="hidden md:flex items-center gap-2 bg-[#F4F7FB] px-3 py-1.5 rounded-xl border border-[#E5E9F0]">
              <Palette className="w-4 h-4 text-[#3D74D9]" />
              <span className="text-[13px] font-bold text-[#5B6D85]">Design:</span>
              <select
                value={designTemplate}
                onChange={(e) => setDesignTemplate(e.target.value as DocumentDesignTemplate)}
                className="bg-white border border-[#CBD5E1] rounded-lg text-[14px] font-semibold px-2.5 py-1 text-[#0B192C] focus:outline-none cursor-pointer"
              >
                <option value="corporate">Corporate Executive</option>
                <option value="modern">Modern Minimal</option>
                <option value="technical">Engineering Blueprint</option>
                <option value="emerald">Emerald Prestige</option>
              </select>
            </div>

            {/* White Sheet / Form Editor Toggle */}
            <div className="flex items-center bg-[#F4F7FB] border border-[#E5E9F0] rounded-xl p-1 text-[14px]">
              <button
                type="button"
                onClick={() => setModalViewMode('editor')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap cursor-pointer ${
                  modalViewMode === 'editor'
                    ? 'bg-[#0B192C] text-white shadow-xs'
                    : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                Form Editor
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode('whiteSheet')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  modalViewMode === 'whiteSheet'
                    ? 'bg-white text-[#0B192C] shadow-xs'
                    : 'text-[#5B6D85] hover:text-[#0B192C]'
                }`}
              >
                <span>📄 White Order Sheet</span>
              </button>
            </div>

            <div className="hidden sm:block text-right">
              <div className="text-[13px] uppercase font-bold text-[#5B6D85]">Balance Due</div>
              <div className="font-heading text-lg font-extrabold tabular-nums text-[#0B192C]">
                {formatCurrency(balanceDue, business.currency)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#5B6D85] hover:text-[#0B192C] hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        {modalViewMode === 'whiteSheet' ? (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center items-start">
            <WhiteDocumentSheet
              documentType="invoice"
              invoice={{
                id: invoice?.id || 'inv_temp',
                invoice_number: invoiceNumber,
                customer_id: selectedCustomerId,
                customer_name: customerName,
                customer_phone: customerPhone,
                customer_whatsapp: customerPhone,
                customer_email: customerEmail,
                customer_address: customerAddress,
                status,
                issue_date: issueDate,
                due_date: dueDate,
                items,
                subtotal,
                discount_type: discountType,
                discount_val: discountVal,
                discount_amount: discountAmount,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total: grandTotal,
                amount_paid: amountPaid,
                notes,
                payment_details: paymentDetails,
                created_at: invoice?.created_at || new Date().toISOString(),
              }}
              business={business}
              onSendWhatsApp={handleWhatsAppShare}
              onDownloadPDF={handleDownloadPDF}
              onPrintPDF={handlePrintPDF}
              onUpdateQuantity={(itemId, qty) => handleUpdateItem(itemId, 'quantity', qty)}
            />
          </div>
        ) : (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
          {/* Customer & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0]">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[14px] font-bold text-[#0B192C]">Customer Details *</label>
                {state.customers.length > 0 && (
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg text-[13px] font-medium text-[#0B192C] px-2.5 py-1.5 focus:outline-none focus:border-[#0B192C] cursor-pointer"
                  >
                    <option value="">-- Choose Customer --</option>
                    {state.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Client Name *"
                className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-[15px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  placeholder="WhatsApp / Phone *"
                  className="rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-[15px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email"
                  className="rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-[15px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Billing / Project Address"
                className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2.5 text-[15px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[14px] font-bold text-[#0B192C]">Invoice Timeline &amp; Payment</label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[13px] text-[#5B6D85] mb-1 font-medium">Issue Date</span>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[13px] text-[#5B6D85] mb-1 font-medium">Due Date</span>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-[15px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-[14px]">
                  <span className="text-[#5B6D85] font-medium">Payment Status:</span>
                  <span
                    className={`font-bold px-2.5 py-0.5 rounded-full text-[13px] ${
                      status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-[#0B192C] border border-slate-200'
                    }`}
                  >
                    {status}
                  </span>
                </div>
                {status !== 'Paid' && (
                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    className="w-full py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[14px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Mark as Fully Paid</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-heading text-[14px] font-bold uppercase tracking-wider text-[#5B6D85]">
                Invoice Line Items ({items.length})
              </h4>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0B192C] hover:text-[#3D74D9] transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E5E9F0] space-y-2.5"
                >
                  <div className="grid grid-cols-12 gap-2.5 items-center">
                    <div className="col-span-12 sm:col-span-5 flex items-center gap-2">
                      <span className="text-[13px] font-mono tabular-nums text-[#5B6D85] w-5">{index + 1}.</span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        placeholder="Item or service billed *"
                        className="flex-1 rounded-lg bg-white border border-slate-300 px-3 py-2 text-[14px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-2 flex gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        className="w-16 rounded-lg bg-white border border-slate-300 px-2 py-2 text-[14px] tabular-nums text-center text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={item.unit || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'unit', e.target.value)}
                        placeholder="unit"
                        className="w-16 rounded-lg bg-white border border-slate-300 px-2 py-2 text-[14px] text-center text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                      />
                    </div>

                    <div className="col-span-5 sm:col-span-3">
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[14px] text-[#5B6D85]">
                          {business.currency}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unit_price}
                          onChange={(e) => handleUpdateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-full rounded-lg bg-white border border-slate-300 pl-7 pr-2.5 py-2 text-[14px] text-right text-[#0B192C] focus:border-[#0B192C] focus:outline-none font-mono tabular-nums"
                        />
                      </div>
                    </div>

                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                      <span className="text-[14px] font-bold text-[#0B192C] font-mono tabular-nums">
                        {formatCurrency(item.total, business.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pl-7">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                      placeholder="Optional details or delivered specification"
                      className="w-full rounded-lg bg-white border border-slate-300 px-3 py-1.5 text-[13px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 sm:p-5 rounded-2xl bg-[#F8FAFC] border border-[#E5E9F0]">
            <div className="space-y-3">
              <div>
                <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">
                  Bank &amp; Payment Instructions
                </label>
                <textarea
                  rows={3}
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-300 p-3 text-[14px] text-[#0B192C] focus:border-[#0B192C] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[14px] font-semibold text-[#0B192C] mb-1.5">Invoice Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Thank you for your business. Please remit within 14 days."
                  className="w-full rounded-xl bg-white border border-slate-300 p-3 text-[14px] text-[#0B192C] placeholder-slate-400 focus:border-[#0B192C] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex justify-between text-[14px] text-[#5B6D85]">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums text-[#0B192C] font-semibold">
                  {formatCurrency(subtotal, business.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[14px] gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#5B6D85]">Discount:</span>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    className="bg-[#F4F7FB] border border-slate-300 rounded text-[13px] px-2 py-1 text-[#0B192C] cursor-pointer"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-[#F4F7FB] border border-slate-300 rounded px-2 py-1 text-[14px] text-right text-[#0B192C] font-mono tabular-nums"
                  />
                  <span className="font-mono tabular-nums text-rose-600 font-semibold w-24 text-right">
                    -{formatCurrency(discountAmount, business.currency)}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[14px] gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[#5B6D85]">{business.tax_name || 'Tax'} (%):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-[#F4F7FB] border border-slate-300 rounded px-2 py-1 text-[14px] text-right text-[#0B192C] font-mono tabular-nums"
                  />
                </div>
                <span className="font-mono tabular-nums text-[#0B192C] font-semibold">
                  +{formatCurrency(taxAmount, business.currency)}
                </span>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#5B6D85]">Total Billed</span>
                <span className="font-heading text-lg font-bold text-[#0B192C] font-mono tabular-nums">
                  {formatCurrency(grandTotal, business.currency)}
                </span>
              </div>

              {/* Amount paid input */}
              <div className="flex items-center justify-between text-[14px] pt-1">
                <span className="text-[#5B6D85] font-semibold">Amount Paid:</span>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-[#5B6D85]">{business.currency}</span>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    step="any"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-28 bg-[#F4F7FB] border border-slate-300 rounded px-2.5 py-1.5 text-[14px] text-right text-[#0B192C] font-mono tabular-nums font-bold focus:border-[#0B192C] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-[13px] font-bold uppercase tracking-wider text-[#5B6D85]">Balance Due</span>
                <span className="font-heading text-xl font-extrabold text-[#0B192C] font-mono tabular-nums">
                  {formatCurrency(balanceDue, business.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E5E9F0] bg-white rounded-b-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9F0] bg-white px-3.5 py-2 text-[14px] font-semibold text-[#5B6D85] hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
              title="Print Invoice"
            >
              <Printer className="w-4 h-4 text-[#0B192C]" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9F0] bg-white px-3.5 py-2 text-[14px] font-semibold text-[#5B6D85] hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-[#0B192C]" />
              <span>Generate PDF</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 px-3.5 py-2 text-[14px] font-semibold text-[#25D366] hover:bg-[#25D366]/20 transition whitespace-nowrap cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Invoice</span>
            </button>

            <button
              type="button"
              onClick={handleCopyPaymentText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E9F0] bg-white px-3.5 py-2 text-[14px] font-semibold text-[#5B6D85] hover:bg-slate-100 transition whitespace-nowrap cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? 'Copied Details!' : 'Copy Payment Message'}</span>
            </button>

            {invoice && onDeleteInvoice && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to delete invoice ${invoice.invoice_number}?`)) {
                    onDeleteInvoice(invoice.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[14px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition whitespace-nowrap cursor-pointer"
                title="Delete this invoice"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-[14px] font-semibold text-[#5B6D85] hover:text-[#0B192C] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B192C] hover:bg-[#152744] px-5 py-2.5 text-[14px] font-bold text-white shadow-md shadow-[#0B192C]/20 transition active:scale-95 whitespace-nowrap cursor-pointer"
            >
              {isSavedNotice ? <Check className="w-4 h-4" /> : null}
              <span>{isSavedNotice ? 'Saved!' : 'Save Invoice'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
