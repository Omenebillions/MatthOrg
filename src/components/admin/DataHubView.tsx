import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  Database,
  FileJson,
  FileSpreadsheet,
  GitMerge,
  History,
  Link2,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  XCircle,
} from 'lucide-react';
import type {
  ApprovalStatus,
  DataImportJob,
  DataImportRecord,
  DirectoryBusiness,
  ServicePricingType,
  UniversalDomainCategory,
} from '../../types';
import {
  analyzeRawDataHubInput,
  commitDataHubRecord,
  deleteDataHubJob,
  fetchDataHubJobs,
  fetchDirectoryBusinesses,
  parseSpreadsheetFile,
} from '../../data/commerceData';

interface DataHubViewProps {
  onDataCommitted?: () => void;
}

const SAMPLE_MULTI_BUSINESS = `1. Apex Cool AC & Fridge Services — Lekki Phase 1, Lagos. Phone: 08031112201. We repair split unit ACs, LG inverter fridges, deep freezers, and recharge gas. Open Mon-Sat 8am-6pm.
2. Ikeja Flow Plumbing Works — Ikeja, Lagos. Contact Chinedu on 08023334455. Emergency pipe leakage repair, borehole pump servicing, bathroom fitting.
3. Nova Digital Web Studio — Wuse 2, Abuja. Email: hello@novadigital.ng, Tel: 08095556677. Website development, e-commerce online store design, SEO and branding.
4. PowerGrid Gen & Solar Care — Surulere, Lagos. Call 08127778899. Generator servicing (Mikano, Perkins, Sumec), inverter setup, battery bank wiring.
5. Zenith Legal & CAC Advisory — Victoria Island, Lagos. Tel: 07012223344. CAC business registration, tax filing, contract drafting for SMEs.`;

const SAMPLE_MIXED_ENTITY = `SunPeak Energy & Solar Solutions Ltd — Ikeja, Lagos (also covers Lekki, Victoria Island, and Abuja). Phone: 08054449900. WhatsApp: 08054449900.
Services: Complete 5KVA hybrid solar system installation (Starting from ₦85,000 labour), Solar panel roof mounting & inverter troubleshooting.
Products in Stock:
- Felicity 5KVA 48V Hybrid Inverter — ₦690,000 (Brand: Felicity Solar, Model: IVEM5048, 2 Years warranty)
- 4.8kWh Lithium Iron Phosphate Battery — ₦1,150,000 (Brand: Felicity, 5 Years warranty)`;

const DOMAIN_OPTIONS: UniversalDomainCategory[] = [
  'products',
  'artisans',
  'repairs',
  'digital_creative',
  'professional_services',
  'business_commercial',
  'general',
];

const PRICING_TYPES: ServicePricingType[] = [
  'Fixed',
  'Starting From',
  'Negotiable',
  'Inspection Required',
  'Request a Quote',
];

export const DataHubView: React.FC<DataHubViewProps> = ({ onDataCommitted }) => {
  const [rawText, setRawText] = useState('');
  const [sourceName, setSourceName] = useState('Admin Raw Paste');
  const [sourceUrl, setSourceUrl] = useState('');
  const [inputType, setInputType] = useState<DataImportJob['input_type']>('raw_text');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [jobs, setJobs] = useState<DataImportJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [directoryCount, setDirectoryCount] = useState(0);
  const [hubSubTab, setHubSubTab] = useState<'ingest' | 'queue' | 'history'>('ingest');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');

  // Local editable drafts keyed by record.id
  const [draftEdits, setDraftEdits] = useState<Record<string, DataImportRecord['extracted_payload']>>({});
  const [mergeTargets, setMergeTargets] = useState<Record<string, string>>({});

  const flash = (type: 'ok' | 'err', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadJobs = async (preserveSelected = true) => {
    try {
      const [jobList, businesses] = await Promise.all([
        fetchDataHubJobs(),
        fetchDirectoryBusinesses(true),
      ]);
      setJobs(jobList);
      setDirectoryCount(businesses.length);

      if (!preserveSelected || !jobList.some((j) => j.id === selectedJobId)) {
        if (jobList[0]) setSelectedJobId(jobList[0].id);
      }
    } catch (err: any) {
      flash('err', err?.message || 'Failed to load Data Hub jobs.');
    }
  };

  useEffect(() => {
    loadJobs(false);
  }, []);

  const activeJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) || jobs[0] || null,
    [jobs, selectedJobId]
  );

  const getPayload = (rec: DataImportRecord): DataImportRecord['extracted_payload'] =>
    draftEdits[rec.id] || rec.extracted_payload;

  const updatePayload = (recId: string, base: DataImportRecord['extracted_payload'], patch: Partial<DataImportRecord['extracted_payload']>) => {
    setDraftEdits((prev) => ({
      ...prev,
      [recId]: { ...(prev[recId] || base), ...patch },
    }));
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setIsAnalyzing(true);
    try {
      const job = await analyzeRawDataHubInput({
        rawText: rawText.trim(),
        inputType,
        sourceName: sourceName.trim() || 'Admin Raw Paste',
        sourceUrl: sourceUrl.trim() || undefined,
      });
      setJobs((prev) => [job, ...prev.filter((j) => j.id !== job.id)]);
      setSelectedJobId(job.id);
      setHubSubTab('queue');
      flash(
        'ok',
        `Extracted ${job.records.length} structured record(s) via ${job.ai_model_used || 'parser'}. Review before publishing.`
      );
    } catch (err: any) {
      flash('err', err?.message || 'Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileIngest = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const txt = await file.text();
        setRawText(txt);
        setInputType('json');
        setSourceName(file.name);
        flash('ok', `Loaded JSON from ${file.name}. Click "Analyse and Structure Data".`);
      } else {
        const rows = await parseSpreadsheetFile(file);
        if (rows.length === 0) {
          flash('err', 'Spreadsheet appears empty.');
          return;
        }
        setRawText(JSON.stringify(rows, null, 2));
        setInputType('csv');
        setSourceName(file.name);
        flash('ok', `Parsed ${rows.length} rows from ${file.name}. Click "Analyse and Structure Data".`);
      }
    } catch (err: any) {
      flash('err', err?.message || 'Failed to read file.');
    }
  };

  const handleCommitSingle = async (
    jobId: string,
    rec: DataImportRecord,
    action: 'approve_new' | 'merge' | 'reject' | 'archive' | 'save_draft'
  ) => {
    setIsCommitting(true);
    try {
      const editedPayload = draftEdits[rec.id] || rec.extracted_payload;
      const targetId = mergeTargets[rec.id] || rec.duplicate_candidate_id;
      await commitDataHubRecord({
        jobId,
        recordId: rec.id,
        action,
        editedPayload,
        mergeTargetBusinessId: action === 'merge' ? targetId : undefined,
      });
      await loadJobs(true);
      onDataCommitted?.();
      const label =
        action === 'approve_new'
          ? 'Approved & published'
          : action === 'merge'
          ? 'Merged with existing provider'
          : action === 'reject'
          ? 'Rejected'
          : action === 'archive'
          ? 'Archived'
          : 'Saved draft updates';
      flash('ok', `${label}: ${editedPayload.business_name || 'Record'}.`);
    } catch (err: any) {
      flash('err', err?.message || 'Action failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleApproveAll = async () => {
    if (!activeJob) return;
    setIsCommitting(true);
    try {
      const res = await commitDataHubRecord({
        jobId: activeJob.id,
        approveAll: true,
      });
      await loadJobs(true);
      onDataCommitted?.();
      flash('ok', `Approved/merged ${res.approvedCount || 0} record(s) into live directory.`);
    } catch (err: any) {
      flash('err', err?.message || 'Approve all failed.');
    } finally {
      setIsCommitting(false);
    }
  };

  const visibleRecords = useMemo(() => {
    if (!activeJob) return [];
    return activeJob.records.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);
  }, [activeJob, statusFilter]);

  const queueCounts = useMemo(() => {
    const counts = { total: 0, needsReview: 0, approved: 0, rejected: 0 };
    for (const j of jobs) {
      for (const r of j.records) {
        counts.total += 1;
        if (r.status === 'Needs Review' || r.status === 'Pending Analysis') counts.needsReview += 1;
        else if (r.status === 'Approved' || r.status === 'Duplicate') counts.approved += 1;
        else counts.rejected += 1;
      }
    }
    return counts;
  }, [jobs]);

  return (
    <div className="w-full min-w-0 space-y-5 overflow-x-hidden">
      {/* Header & Navigation Strip */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div>
          <div className="flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-[#3D74D9]">
            <Database className="w-4 h-4" />
            <span>MatthOrg Central Data Hub & Review Pipeline</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-[28px] font-bold text-[#0B192C] tracking-tight mt-1">
            Ingest Raw Text, Spreadsheets & Mixed Offerings
          </h2>
          <p className="text-[15px] text-[#5B6D85] mt-1 leading-relaxed">
            Only <strong className="text-[#0B192C]">Approved</strong> records appear in Matthew AI public discovery.{' '}
            <span className="font-mono tabular-nums font-bold text-[#0B192C]">{directoryCount}</span> businesses live ·{' '}
            <span className="font-mono tabular-nums font-bold text-amber-700">{queueCounts.needsReview}</span> awaiting review
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-[#F1F5F9] p-1.5 rounded-xl text-[14px] font-semibold">
          {[
            { id: 'ingest' as const, label: 'Paste & Analyse Raw Data', icon: Sparkles },
            { id: 'queue' as const, label: `Review Queue (${queueCounts.needsReview})`, icon: ShieldAlert },
            { id: 'history' as const, label: `Import Audit History (${jobs.length})`, icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHubSubTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition cursor-pointer whitespace-nowrap ${
                hubSubTab === tab.id ? 'bg-[#0B192C] text-white' : 'text-[#475569] hover:text-[#0B192C]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-[15px] font-semibold flex items-center justify-between ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer font-bold whitespace-nowrap ml-3">
            Dismiss
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 1: INGEST & PARSE                                           */}
      {/* =================================================================== */}
      {hubSubTab === 'ingest' && (
        <form onSubmit={handleAnalyze} className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-heading text-xl font-bold text-[#0B192C]">
                Paste Raw Business, Product or Service Information
              </h3>
              <p className="text-[15px] text-[#5B6D85] mt-0.5 leading-relaxed">
                Paste WhatsApp forwards, multi-business paragraphs, mixed product + service price lists, or load CSV/Excel/JSON files.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[14px]">
              <button
                type="button"
                onClick={() => {
                  setRawText(SAMPLE_MULTI_BUSINESS);
                  setInputType('raw_text');
                  setSourceName('Directory Note Sample');
                }}
                className="px-3.5 py-2 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-semibold cursor-pointer whitespace-nowrap"
              >
                Load 5-Business Sample
              </button>
              <button
                type="button"
                onClick={() => {
                  setRawText(SAMPLE_MIXED_ENTITY);
                  setInputType('raw_text');
                  setSourceName('Mixed Supplier Sheet');
                }}
                className="px-3.5 py-2 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-semibold cursor-pointer whitespace-nowrap"
              >
                Load Mixed Product+Service Sample
              </button>
            </div>
          </div>

          <textarea
            rows={9}
            required
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste unstructured notes, business lists, artisan contacts, product prices, or JSON here..."
            className="w-full rounded-xl bg-[#FAFBFD] border border-[#CBD5E1] focus:border-[#0B192C] focus:bg-white p-4 text-[15px] text-[#0B192C] leading-relaxed focus:outline-none"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[15px]">
            <div>
              <label className="text-[14px] font-semibold text-[#475569]">Source Label</label>
              <input
                type="text"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="e.g. WhatsApp Trade Group, Jiji, Field Agent"
                className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C] text-[15px]"
              />
            </div>
            <div>
              <label className="text-[14px] font-semibold text-[#475569]">Source URL (optional)</label>
              <div className="relative mt-1.5">
                <Link2 className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] pl-10 pr-3.5 py-2.5 text-[#0B192C] text-[15px]"
                />
              </div>
            </div>
            <div>
              <label className="text-[14px] font-semibold text-[#475569]">Input Type</label>
              <select
                value={inputType}
                onChange={(e) => setInputType(e.target.value as DataImportJob['input_type'])}
                className="w-full mt-1.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2.5 text-[#0B192C] font-semibold text-[15px]"
              >
                <option value="raw_text">Unstructured Text</option>
                <option value="csv">CSV / Excel Table</option>
                <option value="json">Structured JSON</option>
                <option value="url">Web / Listing Snippet</option>
                <option value="single_entry">Single Entry</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
            <div className="flex flex-wrap items-center gap-2.5 text-[14px]">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-bold cursor-pointer whitespace-nowrap">
                <Upload className="w-4 h-4" />
                <span>Import CSV / Excel</span>
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileIngest} className="hidden" />
              </label>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-bold cursor-pointer whitespace-nowrap">
                <FileJson className="w-4 h-4" />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleFileIngest} className="hidden" />
              </label>
            </div>

            <button
              type="submit"
              disabled={!rawText.trim() || isAnalyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] disabled:opacity-50 text-white text-[15px] font-bold cursor-pointer whitespace-nowrap"
            >
              {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isAnalyzing ? 'Analysing Data...' : 'Analyse and Structure Data'}</span>
            </button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: STAGING REVIEW QUEUE & DUPLICATE RESOLUTION               */}
      {/* =================================================================== */}
      {hubSubTab === 'queue' && (
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white border border-[#E5E9F0] text-center text-[15px] text-[#5B6D85]">
              No import jobs queued yet. Paste raw business or product text in the ingest tab to generate structured review cards.
            </div>
          ) : (
            <>
              {/* Active Job Selector + Bulk Approve */}
              <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col md:flex-row md:items-center justify-between gap-3 text-[14px]">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-bold text-[#0B192C]">Active Import Batch:</span>
                  <select
                    value={activeJob?.id || ''}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-2 font-semibold text-[#0B192C] text-[14px]"
                  >
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.source_name} · {j.records.length} records ({new Date(j.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 font-semibold text-[#475569] text-[14px]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Duplicate">Merged / Duplicate</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                {activeJob && activeJob.records.some((r) => r.status === 'Needs Review' || r.status === 'Pending Analysis') && (
                  <button
                    type="button"
                    disabled={isCommitting}
                    onClick={handleApproveAll}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[14px] font-bold cursor-pointer whitespace-nowrap"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve All Remaining ({activeJob.records.filter((r) => r.status === 'Needs Review').length})</span>
                  </button>
                )}
              </div>

              {/* Editable Structured Record Cards */}
              {visibleRecords.map((rec, idx) => {
                const payload = getPayload(rec);
                const services = payload.services || [];
                const products = payload.products || [];
                const isResolved = rec.status === 'Approved' || rec.status === 'Duplicate';

                return (
                  <div
                    key={rec.id}
                    className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4 text-[15px]"
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-[#F1F5F9]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#5B6D85]">
                          <span className="font-mono tabular-nums font-bold text-[#0B192C]">#{idx + 1}</span>
                          <span>·</span>
                          <span className="uppercase font-bold tracking-wider">{rec.record_type.replace('_', ' ')}</span>
                          <span>·</span>
                          <span
                            className={`font-bold ${
                              rec.status === 'Approved'
                                ? 'text-emerald-700'
                                : rec.status === 'Duplicate'
                                ? 'text-[#3D74D9]'
                                : rec.status === 'Rejected'
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <h4 className="font-heading text-lg font-bold text-[#0B192C] mt-1">
                          {payload.business_name || 'Unnamed Entity'}
                        </h4>
                      </div>

                      {/* Missing Fields Notice */}
                      {(rec.missing_fields || []).length > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[13px] font-semibold">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Missing: {(rec.missing_fields || []).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Duplicate Detection Banner (TEST 7) */}
                    {rec.duplicate_candidate_id && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 text-[#0B192C]">
                          <GitMerge className="w-4 h-4 text-[#3D74D9] shrink-0 mt-1" />
                          <div>
                            <div className="font-heading font-bold text-base tabular-nums">
                              Possible Duplicate Detected ({Math.round((rec.duplicate_similarity || 0.8) * 100)}% match)
                            </div>
                            <div className="text-[14px] text-[#475569] leading-relaxed">
                              Matches existing record: <strong>{rec.duplicate_candidate_name}</strong> ({rec.duplicate_candidate_type}). Merging appends new services/products to this existing profile without creating a duplicate business.
                            </div>
                          </div>
                        </div>
                        {!isResolved && (
                          <button
                            type="button"
                            disabled={isCommitting}
                            onClick={() => handleCommitSingle(activeJob!.id, rec, 'merge')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#3D74D9] hover:bg-[#2F62C2] text-white text-[14px] font-bold shrink-0 cursor-pointer whitespace-nowrap"
                          >
                            <GitMerge className="w-4 h-4" />
                            <span>Merge into Existing</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Core Business Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Business / Provider Name</label>
                        <input
                          value={payload.business_name || ''}
                          onChange={(e) => updatePayload(rec.id, payload, { business_name: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] font-semibold text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Provider Type</label>
                        <select
                          value={payload.provider_type || 'business'}
                          onChange={(e) =>
                            updatePayload(rec.id, payload, { provider_type: e.target.value as any })
                          }
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        >
                          <option value="business">Registered Business</option>
                          <option value="artisan">Artisan / Tradesperson</option>
                          <option value="repair_technician">Repair Technician</option>
                          <option value="professional">Professional Consultant</option>
                          <option value="agency">Digital / Creative Agency</option>
                          <option value="supplier">Product Supplier / Dealer</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Industry / Category</label>
                        <input
                          value={payload.industry || ''}
                          onChange={(e) => updatePayload(rec.id, payload, { industry: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Phone / WhatsApp</label>
                        <input
                          value={payload.phone || ''}
                          onChange={(e) =>
                            updatePayload(rec.id, payload, { phone: e.target.value, whatsapp: e.target.value })
                          }
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] font-mono tabular-nums text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">City / Area</label>
                        <input
                          value={payload.city || ''}
                          onChange={(e) => updatePayload(rec.id, payload, { city: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">State</label>
                        <input
                          value={payload.state || ''}
                          onChange={(e) => updatePayload(rec.id, payload, { state: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Email</label>
                        <input
                          value={payload.email || ''}
                          onChange={(e) => updatePayload(rec.id, payload, { email: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        />
                      </div>
                      <div>
                        <label className="text-[14px] font-semibold text-[#5B6D85]">Address / Locations</label>
                        <input
                          value={payload.address || (payload.locations_served || []).join(', ')}
                          onChange={(e) => updatePayload(rec.id, payload, { address: e.target.value })}
                          className="w-full mt-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 text-[#0B192C] text-[15px]"
                        />
                      </div>
                    </div>

                    {/* Linked Services */}
                    <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-base text-[#0B192C] flex items-center gap-1.5">
                          <Wrench className="w-4 h-4 text-[#3D74D9]" />
                          <span>Linked Services ({services.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePayload(rec.id, payload, {
                              services: [
                                ...services,
                                {
                                  service_name: 'New Service Offering',
                                  service_category: payload.industry || 'General',
                                  domain: 'general',
                                  pricing_type: 'Request a Quote',
                                },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 text-[13px] font-bold text-[#3D74D9] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Service
                        </button>
                      </div>
                      {services.map((svc, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center text-[14px]"
                        >
                          <input
                            value={svc.service_name}
                            placeholder="Service Name"
                            onChange={(e) => {
                              const next = [...services];
                              next[sIdx] = { ...svc, service_name: e.target.value };
                              updatePayload(rec.id, payload, { services: next });
                            }}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-semibold text-[#0B192C]"
                          />
                          <select
                            value={svc.domain || 'general'}
                            onChange={(e) => {
                              const next = [...services];
                              next[sIdx] = { ...svc, domain: e.target.value as UniversalDomainCategory };
                              updatePayload(rec.id, payload, { services: next });
                            }}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 text-[#0B192C]"
                          >
                            {DOMAIN_OPTIONS.map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <select
                            value={svc.pricing_type || 'Request a Quote'}
                            onChange={(e) => {
                              const next = [...services];
                              next[sIdx] = { ...svc, pricing_type: e.target.value as ServicePricingType };
                              updatePayload(rec.id, payload, { services: next });
                            }}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 text-[#0B192C]"
                          >
                            {PRICING_TYPES.map((pt) => (
                              <option key={pt} value={pt}>{pt}</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              placeholder="Min Price ₦"
                              value={svc.price_min ?? ''}
                              onChange={(e) => {
                                const next = [...services];
                                next[sIdx] = {
                                  ...svc,
                                  price_min: e.target.value ? Number(e.target.value) : undefined,
                                };
                                updatePayload(rec.id, payload, { services: next });
                              }}
                              className="w-full rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-mono tabular-nums text-[#0B192C]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = services.filter((_, i) => i !== sIdx);
                                updatePayload(rec.id, payload, { services: next });
                              }}
                              className="text-[#64748B] hover:text-rose-600 p-1.5 cursor-pointer"
                              title="Remove service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Linked Products */}
                    <div className="space-y-2.5 pt-3 border-t border-[#F1F5F9]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-heading font-bold text-base text-[#0B192C] flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-emerald-600" />
                          <span>Linked Products ({products.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updatePayload(rec.id, payload, {
                              products: [
                                ...products,
                                {
                                  name: 'New Product',
                                  category: payload.industry || 'General',
                                  price: 0,
                                  currency: '₦',
                                  condition: 'New',
                                  availability: 'In Stock',
                                },
                              ],
                            })
                          }
                          className="inline-flex items-center gap-1 text-[13px] font-bold text-emerald-700 hover:underline cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Product
                        </button>
                      </div>
                      {products.map((prod, pIdx) => (
                        <div
                          key={pIdx}
                          className="p-3 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center text-[14px]"
                        >
                          <input
                            value={prod.name}
                            placeholder="Product Name"
                            onChange={(e) => {
                              const next = [...products];
                              next[pIdx] = { ...prod, name: e.target.value };
                              updatePayload(rec.id, payload, { products: next });
                            }}
                            className="sm:col-span-2 rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-semibold text-[#0B192C]"
                          />
                          <input
                            type="number"
                            placeholder="Price ₦"
                            value={prod.price ?? 0}
                            onChange={(e) => {
                              const next = [...products];
                              next[pIdx] = { ...prod, price: Number(e.target.value) || 0 };
                              updatePayload(rec.id, payload, { products: next });
                            }}
                            className="rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 font-mono tabular-nums font-bold text-[#0B192C]"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              value={prod.brand || ''}
                              placeholder="Brand"
                              onChange={(e) => {
                                const next = [...products];
                                next[pIdx] = { ...prod, brand: e.target.value };
                                updatePayload(rec.id, payload, { products: next });
                              }}
                              className="w-full rounded-lg bg-white border border-[#E2E8F0] px-2.5 py-1.5 text-[#0B192C]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const next = products.filter((_, i) => i !== pIdx);
                                updatePayload(rec.id, payload, { products: next });
                              }}
                              className="text-[#64748B] hover:text-rose-600 p-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#F1F5F9] text-[14px]">
                      <button
                        type="button"
                        disabled={isCommitting}
                        onClick={() => handleCommitSingle(activeJob!.id, rec, 'save_draft')}
                        className="px-3.5 py-2 rounded-lg bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0B192C] font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Save Edits
                      </button>
                      {!isResolved && (
                        <>
                          <button
                            type="button"
                            disabled={isCommitting}
                            onClick={() => handleCommitSingle(activeJob!.id, rec, 'archive')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#0B192C] text-[#475569] font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <Archive className="w-4 h-4" />
                            <span>Archive</span>
                          </button>
                          <button
                            type="button"
                            disabled={isCommitting}
                            onClick={() => handleCommitSingle(activeJob!.id, rec, 'reject')}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold cursor-pointer whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                          <button
                            type="button"
                            disabled={isCommitting}
                            onClick={() => handleCommitSingle(activeJob!.id, rec, 'approve_new')}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer whitespace-nowrap"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Publish</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: IMPORT AUDIT HISTORY                                     */}
      {/* =================================================================== */}
      {hubSubTab === 'history' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E5E9F0] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-[#0B192C]">Raw Input & AI Extraction Audit Log</h3>
            <button
              type="button"
              onClick={() => loadJobs(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F1F5F9] text-[14px] font-bold text-[#0B192C] cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
          {jobs.length === 0 ? (
            <p className="text-[15px] text-[#5B6D85] py-6 text-center">No Data Hub import history yet.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl bg-[#FAFBFD] border border-[#E2E8F0] space-y-2.5 text-[14px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-heading font-bold text-base text-[#0B192C]">{job.source_name}</span>
                      <span className="text-[13px] text-[#5B6D85] tabular-nums">
                        {' '}
                        · {job.input_type} · {job.ai_model_used || 'parser'} ·{' '}
                        {new Date(job.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono tabular-nums font-bold text-[#0B192C] text-[13px]">
                        {job.approved_count}/{job.total_extracted} approved
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setHubSubTab('queue');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#0B192C] text-white text-[13px] font-bold cursor-pointer whitespace-nowrap"
                      >
                        Open Batch
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDataHubJob(job.id);
                          await loadJobs(false);
                        }}
                        className="p-1.5 text-[#64748B] hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <pre className="p-3 rounded-lg bg-white border border-[#E2E8F0] text-[13px] text-[#475569] max-h-24 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                    {job.raw_input.slice(0, 600)}
                    {job.raw_input.length > 600 ? '...' : ''}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
