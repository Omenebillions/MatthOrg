/**
 * MATTHORG — MATTHEW VIEW
 * Business Development, Sales & Business Growth Intelligence Interface
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  TrendingUp,
  Target,
  AlertCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  FileText,
  DollarSign,
  Users,
  Search,
  ArrowDown,
  Building,
  Lock,
  Unlock,
  Zap,
  Check,
} from 'lucide-react';
import { AppState, MatthewMessage, Lead, Quote, Invoice } from '../types';
import { sendMatthewMessage } from '../lib/matthew';
import { hasActiveSubscription } from '../lib/db';

interface MatthewViewProps {
  state: AppState;
  initialPrompt?: string;
  onOpenLead?: (lead: Lead) => void;
  onOpenQuote?: (quote: Quote) => void;
  onOpenInvoice?: (invoice: Invoice) => void;
  onNavigateTab?: (tab: 'leads' | 'marketplace' | 'quotes' | 'invoices' | 'customers') => void;
  onSaveMessage?: (message: MatthewMessage) => void;
  onOpenSubscription?: () => void;
}

const DEFAULT_SUGGESTIONS = [
  {
    category: 'Pipeline',
    icon: Target,
    text: 'Who should I follow up with today?',
    sub: 'Prioritize leads & stale opportunities',
  },
  {
    category: 'Sales Analysis',
    icon: TrendingUp,
    text: 'How is my business doing?',
    sub: 'Revenue metrics & win-rate analysis',
  },
  {
    category: 'Ecosystem Insights',
    icon: Building,
    text: 'Analyze all MatthOrg registered businesses data and give growth insights',
    sub: 'Market landscape, competitive niches & B2B synergy',
  },
  {
    category: 'Sales Coaching',
    icon: DollarSign,
    text: 'My customer says I am too expensive. What should I say?',
    sub: 'Objection handling & value negotiation',
  },
  {
    category: 'Marketplace',
    icon: Search,
    text: 'Which customer requests match my services?',
    sub: 'Find high-fit buyer opportunities',
  },
  {
    category: 'Marketing',
    icon: Lightbulb,
    text: 'What should I promote this month?',
    sub: 'Ethical campaigns & referral strategy',
  },
  {
    category: 'Retention',
    icon: Users,
    text: 'Which customers have unpaid invoices?',
    sub: 'Cash flow & payment collections',
  },
];

export const MatthewView: React.FC<MatthewViewProps> = ({
  state,
  initialPrompt,
  onOpenLead,
  onOpenQuote,
  onOpenInvoice,
  onNavigateTab,
  onOpenSubscription,
}) => {
  const hasPremiumAccess = hasActiveSubscription(
    state.business.id,
    state.user.plan,
    state.business.subscription_status,
    state.business.subscription_expires_at
  );

  const [messages, setMessages] = useState<MatthewMessage[]>(() => {
    if (state.matthewMessages && state.matthewMessages.length > 0) {
      return state.matthewMessages;
    }
    return [
      {
        id: 'initial-greeting',
        role: 'assistant',
        content: `**Hello! Welcome to Business Intelligence.**\n\nI'm your premium AI operating layer inside MatthOrg, dedicated to helping your business with:\n- **Sales & Lead Management** (Marketplace leads & pipeline qualification)\n- **Deal Management & Quotations** (Pricing, proposals & follow-ups)\n- **Invoices & Payment Follow-Up** (Overdue cash collection & milestone terms)\n- **Customer Acquisition & Retention** (Repeat business & commercial strategy)\n- **Business Growth & Revenue Expansion** (Sales metrics & conversion optimization)\n\nAsk me about your current leads, pending quotes, overdue invoices, or marketplace buyer requests.`,
        created_at: new Date().toISOString(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    // Primary: Scroll internal container
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight + 1500,
        behavior,
      });
    }
    // Secondary fallback: Scroll sentinel into view
    try {
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
    } catch {
      // ignore
    }
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 120);
  };

  useEffect(() => {
    // Immediate scroll and slight delay to catch rendered Markdown/citations
    scrollToBottom('smooth');
    const timer = setTimeout(() => scrollToBottom('smooth'), 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  useEffect(() => {
    if (!hasPremiumAccess) return;
    if (initialPrompt && initialPrompt.trim() && !isLoading) {
      handleSend(initialPrompt.trim());
    }
  }, [initialPrompt, hasPremiumAccess]);

  const handleSend = async (userPrompt?: string) => {
    if (!hasPremiumAccess) {
      onOpenSubscription?.();
      return;
    }
    const text = (userPrompt || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMessage: MatthewMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const assistantMessage = await sendMatthewMessage({
        message: text,
        history: newHistory,
        state,
        feature: 'business_intelligence',
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error in Business Intelligence chat:', err);
      setError(err?.message || 'Failed to receive response from Business Intelligence.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleRetry = async () => {
    if (!hasPremiumAccess) {
      onOpenSubscription?.();
      return;
    }
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const assistantMessage = await sendMatthewMessage({
        message: lastUserMsg.content,
        history: messages,
        state,
        feature: 'business_intelligence',
      });

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Error in Business Intelligence chat retry:', err);
      setError(err?.message || 'Failed to receive response from Business Intelligence.');
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetConversation = () => {
    if (window.confirm('Reset this conversation with Matthew?')) {
      setMessages([
        {
          id: `greet-${Date.now()}`,
          role: 'assistant',
          content: `**Conversation reset.** I'm ready to review your pipeline, sales metrics, or growth strategy. How can I help your business right now?`,
          created_at: new Date().toISOString(),
        },
      ]);
      setError(null);
    }
  };

  const handleCitationClick = (citation: { type: string; title: string }) => {
    const iden = citation.title.toUpperCase();
    if (citation.type === 'lead') {
      const lead = (state.leads || []).find((l) => l.lead_number?.toUpperCase() === iden || l.id === iden);
      if (lead && onOpenLead) {
        onOpenLead(lead);
        return;
      }
      if (onNavigateTab) onNavigateTab('leads');
    } else if (citation.type === 'deal') {
      const quote = (state.quotes || []).find((q) => q.quote_number?.toUpperCase() === iden || q.id === iden);
      if (quote && onOpenQuote) {
        onOpenQuote(quote);
        return;
      }
      if (onNavigateTab) onNavigateTab('quotes');
    } else if (citation.type === 'invoice') {
      const inv = (state.invoices || []).find((i) => i.invoice_number?.toUpperCase() === iden || i.id === iden);
      if (inv && onOpenInvoice) {
        onOpenInvoice(inv);
        return;
      }
      if (onNavigateTab) onNavigateTab('invoices');
    } else if (citation.type === 'marketplace' && onNavigateTab) {
      onNavigateTab('marketplace');
    }
  };

  // Render message content with markdown formatting
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-2.5 text-[15px] sm:text-base leading-relaxed text-[#0B192C]">
        {lines.map((line, idx) => {
          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Structured Header: What I found
          if (line.includes('What I found') || line.includes('WHAT I FOUND')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#3D74D9]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Structured Header: What it means
          if (line.includes('What it means') || line.includes('WHAT IT MEANS')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-[#5B6D85]">
                  <TrendingUp className="w-4 h-4" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Structured Header: What I'd do next
          if (line.includes("What I'd do next") || line.includes('WHAT I DO NEXT') || line.includes('What to do next')) {
            return (
              <div key={idx} className="pt-2 pb-1 border-b border-[#E5E9F0]">
                <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-emerald-600">
                  <Target className="w-4 h-4" />
                  <span>{line.replace(/\*\*/g, '')}</span>
                </div>
              </div>
            );
          }

          // Bullet points
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const bulletText = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#3D74D9] font-bold mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(bulletText) }} />
              </div>
            );
          }

          // Numbered list
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-[#3D74D9] font-bold text-[13px] min-w-5">{numMatch[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(numMatch[2]) }} />
              </div>
            );
          }

          return (
            <p key={idx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(line) }} />
          );
        })}
      </div>
    );
  };

  const formatInlineMarkdown = (text: string): string => {
    let out = text;
    // bold
    out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // italic
    out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // quotes
    out = out.replace(/«(.*?)»/g, '<span class="italic text-[#3D74D9]">“$1”</span>');
    return out;
  };

  if (!hasPremiumAccess) {
    return (
      <div className="max-w-4xl mx-auto mt-4 sm:mt-6 mb-8 bg-white rounded-3xl border border-[#E5E9F0] shadow-sm overflow-hidden">
        <div className="bg-gradient-to-br from-[#0B192C] via-[#152744] to-[#1E3E62] text-white p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-72 h-72 bg-[#3D74D9]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/30 text-amber-200 text-[13px] font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Premium Feature • Pro &amp; Business Plans</span>
            </div>

            <h1 className="type-dashboard-title text-white">
              Business Intelligence
            </h1>

            <p className="text-[15px] sm:text-base text-slate-300 leading-relaxed">
              Unlock your private AI revenue and pipeline advisor. Business Intelligence analyzes your quotes, overdue invoices, customer retention, marketplace leads, and ecosystem benchmarks in real time.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenSubscription?.()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[15px] sm:text-base font-bold shadow-lg transition active:scale-95 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>Upgrade to Premium (From ₦2,500/mo)</span>
              </button>
              <span className="text-[13px] text-slate-300">
                Current tier: <strong className="uppercase text-white">{state.user.plan}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 bg-[#F8FAFC] space-y-6">
          <div className="text-[13px] font-bold uppercase tracking-wider text-[#5B6D85]">
            Included with Pro &amp; Business Subscriptions
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#0B192C]">Pipeline &amp; Deal Prioritization</h3>
                <p className="text-[14px] text-[#5B6D85] mt-1 leading-relaxed">
                  Instantly identify stale leads, high-value quotes awaiting approval, and buyers ready to close.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#0B192C]">Revenue &amp; Cash-Flow Intelligence</h3>
                <p className="text-[14px] text-[#5B6D85] mt-1 leading-relaxed">
                  Track win rates, pinpoint overdue invoices, and get tailored collection and pricing strategies.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#0B192C]">MatthOrg Ecosystem Benchmarks</h3>
                <p className="text-[14px] text-[#5B6D85] mt-1 leading-relaxed">
                  Discover regional demand trends, B2B partnership opportunities, and service positioning insights.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-heading text-base sm:text-lg font-bold text-[#0B192C]">Objection &amp; Closing Playbooks</h3>
                <p className="text-[14px] text-[#5B6D85] mt-1 leading-relaxed">
                  Generate tailored WhatsApp negotiation scripts and counter-offers whenever buyers push back on price.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E9F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[14px] text-[#5B6D85]">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pro &amp; Business plans also unlock verified buyer phone numbers &amp; direct calls in Buyer Marketplace.</span>
            </div>
            <button
              type="button"
              onClick={() => onOpenSubscription?.()}
              className="shrink-0 px-4 py-2.5 rounded-xl bg-[#0B192C] hover:bg-[#1E3E62] text-white text-[14px] font-bold transition cursor-pointer"
            >
              View Plans &amp; Upgrade
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] sm:h-[calc(100vh-9rem)] min-h-[580px] max-w-5xl mx-auto mt-3 sm:mt-5 mb-4 bg-white rounded-3xl border border-[#E5E9F0] shadow-sm overflow-hidden relative">
      {/* Business Intelligence Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-[#E5E9F0] bg-gradient-to-r from-[#F4F7FB] via-white to-[#F4F7FB] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center shadow-sm">
              <Bot className="w-5 h-5 text-[#3D74D9]" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <h2 className="font-heading text-lg font-bold text-[#0B192C]">Business Intelligence</h2>
              <span className="w-fit px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[13px] font-bold tracking-wide uppercase">
                Premium • {state.user.plan}
              </span>
            </div>
            <p className="text-[13px] text-[#5B6D85]">
              AI Operating Layer for Sales, Pipeline Analytics, Cash Collection &amp; Growth
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5E9F0] text-[13px] text-[#5B6D85]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Active: {state.business.business_name}</span>
          </div>
          <button
            onClick={handleResetConversation}
            title="Reset conversation"
            className="p-2 rounded-xl text-[#8F9FB5] hover:text-[#0B192C] hover:bg-[#E5E9F0]/60 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scrollable Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 space-y-4 sm:space-y-5 bg-[#FAFCFF] scroll-smooth"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 ${
                  isUser
                    ? 'bg-[#0B192C] text-white rounded-tr-xs shadow-sm'
                    : 'bg-white border border-[#E5E9F0] rounded-tl-xs shadow-sm'
                }`}
              >
                {/* Out-of-Domain Notice Banner */}
                {!isUser && msg.is_out_of_domain && (
                  <div className="mb-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[13px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Domain Redirect:</strong> Matthew is specialized strictly in business development, sales pipeline, and commercial growth.
                    </span>
                  </div>
                )}

                {/* Tool Executions Badge */}
                {!isUser && msg.tool_calls_executed && msg.tool_calls_executed.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {msg.tool_calls_executed.map((tool, tIdx) => {
                      const cleanTool = tool.replace('get_', '').replace(/_/g, ' ');
                      return (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#3D74D9]/10 text-[#3D74D9] text-[13px] font-mono"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>checked {cleanTool}</span>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Message Body */}
                {isUser ? (
                  <p className="text-[15px] sm:text-base whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  renderFormattedContent(msg.content)
                )}

                {/* Citations / Navigation Pills */}
                {!isUser && msg.citations && msg.citations.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center gap-2">
                    <span className="text-[13px] uppercase font-bold text-[#8F9FB5]">References:</span>
                    {msg.citations.map((cite, cIdx) => (
                      <button
                        key={cIdx}
                        onClick={() => handleCitationClick(cite)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F4F7FB] hover:bg-[#3D74D9]/10 text-[#3D74D9] text-[13px] font-mono font-semibold border border-[#E5E9F0] hover:border-[#3D74D9]/30 transition"
                      >
                        <span>{cite.title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                )}

                <div className={`mt-2 text-[13px] flex items-center justify-between ${isUser ? 'text-gray-400 justify-end' : 'text-[#8F9FB5]'}`}>
                  {!isUser && (
                    <span className="text-[13px] text-slate-400 font-medium">
                      Business Development AI
                    </span>
                  )}
                  <span>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E5E9F0] rounded-2xl rounded-tl-xs p-4 shadow-sm flex items-center gap-3">
              <div className="w-6 h-6 rounded-lg bg-[#3D74D9]/10 text-[#3D74D9] flex items-center justify-center animate-spin">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span className="text-[14px] text-[#5B6D85]">Matthew is analyzing your business pipeline...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[14px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRetry}
              className="text-[13px] font-bold text-red-700 underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Generous spacing at the bottom so messages never clip */}
        <div className="h-6 shrink-0" />
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Latest Button */}
      {showScrollBottom && (
        <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20">
          <button
            onClick={() => scrollToBottom('smooth')}
            className="pointer-events-auto px-4 py-2 rounded-full bg-[#0B192C] text-white text-[14px] font-semibold shadow-lg hover:bg-[#1E3E62] transition-all flex items-center gap-1.5 border border-slate-700 active:scale-95 cursor-pointer"
          >
            <ArrowDown className="w-4 h-4 animate-bounce" />
            <span>Scroll down to latest</span>
          </button>
        </div>
      )}

      {/* Suggestion Chips (if history is short or user wants quick answers) */}
      {messages.length <= 4 && !isLoading && (
        <div className="px-4 sm:px-6 py-2.5 bg-white border-t border-[#E5E9F0] overflow-x-auto scrollbar-none flex gap-2">
          {DEFAULT_SUGGESTIONS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.text)}
                className="shrink-0 px-3.5 py-2 rounded-xl bg-[#F4F7FB] hover:bg-[#E8EEF5] text-left border border-[#E5E9F0] transition group"
              >
                <div className="flex items-center gap-1.5 text-[14px] font-semibold text-[#0B192C]">
                  <Icon className="w-4 h-4 text-[#3D74D9]" />
                  <span>{item.text}</span>
                </div>
                <div className="text-[13px] text-[#8F9FB5] pl-5.5">{item.sub}</div>
              </button>
            );
          })}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-[#E5E9F0]">
        <div className="flex items-end gap-2 bg-[#F4F7FB] border border-[#E5E9F0] rounded-2xl p-2 focus-within:border-[#3D74D9] focus-within:ring-1 focus-within:ring-[#3D74D9] transition">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Matthew about leads, follow-ups, quotes, or sales growth..."
            className="w-full min-w-0 flex-1 bg-transparent border-0 resize-none outline-none text-[15px] text-[#0B192C] placeholder-[#8F9FB5] px-2 py-1.5 max-h-32 min-h-[32px]"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl transition flex items-center justify-center shrink-0 ${
              input.trim() && !isLoading
                ? 'bg-[#3D74D9] text-white shadow-sm hover:bg-[#2F5EB3]'
                : 'bg-[#E5E9F0] text-[#8F9FB5] cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-center text-[13px] text-[#8F9FB5]">
          Matthew — MatthOrg's Business Development AI • Sales, Deal Management & Commercial Growth
        </div>
      </div>
    </div>
  );
};
