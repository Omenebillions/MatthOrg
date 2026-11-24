/**
 * MATTHORG — MATTHEW AI
 * Execution Engine: OpenAI with Automatic Fallback & Tool-Loop Orchestrator
 */

import OpenAI from 'openai';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { MATTHEW_SYSTEM_INSTRUCTIONS, checkDomainScope } from './identity';
import { MATTHEW_TOOL_DEFINITIONS, executeMatthewTool, ToolExecutionContext } from './tools';
import { MatthewChatRequest, MatthewChatResponse, MatthewCitation } from './types';

// Lazy OpenAI client initialization with strict fast timeout to avoid blocking on quota issues
let openaiClient: OpenAI | null = null;
let openaiQuotaDepletedUntil = 0;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('...')) {
    return null;
  }
  if (Date.now() < openaiQuotaDepletedUntil) {
    return null;
  }
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: apiKey.trim(),
      timeout: 25000,
      maxRetries: 1,
    });
  }
  return openaiClient;
}

// Lazy Gemini client fallback initialization
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 40000,
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }
  return geminiClient;
}

/**
 * Parses citations (leads, deals, invoices) mentioned in the assistant's response text.
 */
function extractCitations(text: string): MatthewCitation[] {
  const citations: MatthewCitation[] = [];
  const leadMatches = text.match(/LEAD-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(leadMatches))) {
    citations.push({ type: 'lead', title: m.toUpperCase() });
  }

  const quoteMatches = text.match(/QTE-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(quoteMatches))) {
    citations.push({ type: 'deal', title: m.toUpperCase() });
  }

  const invoiceMatches = text.match(/INV-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(invoiceMatches))) {
    citations.push({ type: 'invoice', title: m.toUpperCase() });
  }

  const reqMatches = text.match(/REQ-\d{3,6}/gi) || [];
  for (const m of Array.from(new Set(reqMatches))) {
    citations.push({ type: 'marketplace', title: m.toUpperCase() });
  }

  return citations.slice(0, 8);
}

/**
 * Checks if an error from Gemini/OpenAI is a transient network or capacity error (e.g. 503 high demand, 429).
 */
function isTransientError(err: any): boolean {
  if (!err) return false;
  const msg = (err.message || String(err)).toLowerCase();
  const status = err.status || err.statusCode || err.code;
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 'UNAVAILABLE' ||
    status === 'RESOURCE_EXHAUSTED' ||
    msg.includes('503') ||
    msg.includes('high demand') ||
    msg.includes('unavailable') ||
    msg.includes('temporarily') ||
    msg.includes('rate limit') ||
    msg.includes('resource exhausted') ||
    msg.includes('econnreset') ||
    msg.includes('fetch failed') ||
    msg.includes('deadline exceeded')
  );
}

/**
 * Synthesizes an executive business intelligence response using direct database tools.
 * Activated whenever all remote AI models are unavailable (e.g. during a global 503 demand spike).
 */
async function generateDeterministicMatthewResponse(
  request: MatthewChatRequest,
  toolContext: ToolExecutionContext
): Promise<{ text: string; toolsExecuted: string[] }> {
  const toolsExecuted: string[] = [];
  const textQuery = (request.message || '').toLowerCase();

  // Retrieve operational business data using existing tenant-isolated tools
  const summary = await executeMatthewTool('get_business_summary', {}, toolContext);
  toolsExecuted.push('get_business_summary');

  const metrics = await executeMatthewTool('get_sales_metrics', {}, toolContext);
  toolsExecuted.push('get_sales_metrics');

  const bizName = summary?.business_name || toolContext.clientContext?.businessName || 'Your Business';
  const currency = summary?.currency || toolContext.clientContext?.currency || '₦';

  let responseBody = '';

  // 1. SPECIFIC PROSPECT OR LEAD SEARCH BY NAME OR NUMBER
  const leads = await executeMatthewTool('get_leads', { limit: 50 }, toolContext);
  const quotes = await executeMatthewTool('list_pending_quotes', {}, toolContext);
  const cooling = await executeMatthewTool('list_cooling_leads', {}, toolContext);
  const overdue = await executeMatthewTool('list_overdue_invoices', {}, toolContext);

  const leadList = leads?.leads || [];
  const quoteList = quotes?.pending_quotes || [];
  const coolingList = cooling?.cooling_leads || [];
  const overdueList = overdue?.overdue_invoices || [];

  // Match specific lead if mentioned in query
  const matchedLead = leadList.find((l: any) => {
    const name = (l.customer_name || '').toLowerCase();
    const num = (l.lead_number || '').toLowerCase();
    const company = (l.company || '').toLowerCase();
    return (name && textQuery.includes(name)) || (num && textQuery.includes(num)) || (company && textQuery.includes(company));
  });

  // Match specific quote if mentioned in query
  const matchedQuote = quoteList.find((q: any) => {
    const qNum = (q.quote_number || '').toLowerCase();
    const cName = (q.customer_name || '').toLowerCase();
    return (qNum && textQuery.includes(qNum)) || (cName && textQuery.includes(cName));
  });

  if (matchedLead) {
    toolsExecuted.push('get_leads');
    responseBody = `### 🎯 Lead Strategy: ${matchedLead.customer_name}${matchedLead.company ? ` (${matchedLead.company})` : ''}

**What I found**
- **Project**: ${matchedLead.service_required || matchedLead.service_needed || 'Inquiry'}
- **Status**: \`${matchedLead.status || 'Active'}\`
- **Stored Estimate**: **${currency}${Number(matchedLead.estimated_value || 0).toLocaleString()}** *(Budget: ${matchedLead.budget_formatted || 'Not specified'})*
- **Intent Score**: **${matchedLead.intent_score || 85}/100**

**What to do next**
1. Initiate prompt WhatsApp or phone outreach to qualify project requirements and timeline.
2. Prepare an itemized proposal or schedule a preliminary site visit.
3. Would you like me to draft an introductory message or quotation for ${matchedLead.customer_name}?`;
  }
  else if (matchedQuote) {
    toolsExecuted.push('list_pending_quotes');
    responseBody = `### 📋 Quotation Review: ${matchedQuote.customer_name} (${matchedQuote.quote_number})

**What I found**
- **Proposal**: ${matchedQuote.title || 'Quotation'}
- **Quote Number**: \`${matchedQuote.quote_number}\`
- **Quote Total**: **${currency}${Number(matchedQuote.total || 0).toLocaleString()}**
- **Status**: \`${matchedQuote.status || 'Pending'}\`
- **Customer**: ${matchedQuote.customer_name}

**What to do next**
1. Reach out via WhatsApp or phone with a consultative follow-up.
2. Inquire if the client has questions about scope, deliverables, or milestone payment options.
3. Would you like me to prepare a concise, high-conversion follow-up message?`;
  }
  // OBJECTION HANDLING: "Customer says too expensive / discount"
  else if (textQuery.includes('expensive') || textQuery.includes('discount') || textQuery.includes('cost too much') || textQuery.includes('price')) {
    responseBody = `### 💡 Sales Coaching: Handling the "Too Expensive" Objection

**What I found**
Price resistance is the single most common sales objection in service contracts. Business owners often make the mistake of immediately offering a 10%–15% discount, which damages margins and implies the original quote was inflated.

**What it means**
When a client says "it's too expensive," they are typically communicating one of three things:
1. **Unclear Value**: They do not yet see why your materials, warranty, or certified installation justify the difference over cheap alternatives.
2. **Cash Flow Constraint**: They want the solution, but timing the full lump-sum payment is difficult.
3. **Negotiation Reflex**: They are testing whether you will drop your price without resistance.

**What to do next**
1. **Never discount price without adjusting scope**: If you lower the price, adjust deliverables so unit value remains intact.
2. **Isolate the objection**: Ask: *"Aside from price, is there anything else about our technical solution or warranty that would prevent us from moving forward?"*
3. **Highlight Total Cost of Ownership**: Emphasize durability, genuine warranties, and maintenance support to demonstrate long-term savings.
4. Would you like me to draft a value-affirming message to send to a customer who asked for a discount?`;
  }
  // MARKETING & CAMPAIGNS
  else if (textQuery.includes('promote') || textQuery.includes('marketing') || textQuery.includes('campaign') || textQuery.includes('what should i sell')) {
    responseBody = `### 📈 Commercial Strategy & High-ROI Campaign Plan for ${bizName}

**What I found**
Targeting recurring service contracts, system upgrades, and preventive maintenance provides the highest customer lifetime value for service professionals.

**What it means**
The most cost-effective revenue driver for an established service business is customer reactivation and preventive maintenance upgrades, followed by targeted inbound requests from the MatthOrg marketplace.

**What to do next**
1. **Client Reactivation Campaign**: Send a WhatsApp broadcast to previous customers offering an annual system tune-up or inspection. This generates immediate cash flow.
2. **Direct Intake Link**: Share your MatthOrg quotation link on social media and WhatsApp status to capture high-intent inquiries directly.
3. **Marketplace Buyer Requests**: Check new incoming requests in the MatthOrg Marketplace to claim verified jobs.`;
  }
  // LEADS SPECIFIC QUERY
  else if (textQuery.includes('lead') || textQuery.includes('prospect') || textQuery.includes('cool')) {
    toolsExecuted.push('list_cooling_leads');
    if (coolingList.length > 0) {
      responseBody = `### 🎯 Prioritized Lead Pipeline for ${bizName}

**What I found**
You currently have **${coolingList.length} cooling leads** requiring prompt outreach before deal momentum is lost:

${coolingList.slice(0, 5).map((l: any) =>
  `- **${l.customer_name}** (${l.lead_number || 'Lead'}) — *${l.service_needed || 'Inquiry'}*\n` +
  `  - Stored Estimate: **${currency}${Number(l.estimated_value || 0).toLocaleString()}** *(Budget: ${l.budget_formatted || 'Open'})*\n` +
  `  - Stage: \`${l.status}\` | Inactivity: ${l.days_inactive} days | Intent Score: ${l.intent_score}/100\n` +
  `  - Action: ${l.recommended_action}`
).join('\n\n')}

**What to do next**
Prioritize the highest-intent leads first. Would you like me to draft customized outreach messages for any of them?`;
    } else {
      responseBody = `### 🎯 Lead Pipeline for ${bizName}

**What I found:** You currently have no inactive or cooling leads requiring attention.

**What it means:** Your team is keeping pace with prospect touches, or your pipeline is ready for new inquiries.

**What to do next:** You can add new leads manually, share your client intake link, or review marketplace customer requests to inject fresh qualified opportunities into your funnel.`;
    }
  }
  // QUOTES QUERY
  else if (textQuery.includes('quote') || textQuery.includes('proposal')) {
    toolsExecuted.push('list_pending_quotes');
    if (quoteList.length > 0) {
      responseBody = `### 📋 Quotations Awaiting Client Decision

**What I found**
There are **${quoteList.length} submitted quotation(s)** awaiting customer sign-off:

${quoteList.map((q: any) =>
  `- **${q.customer_name}** (${q.quote_number}) — *${q.title || 'Quotation'}*\n` +
  `  - Total Value: **${currency}${Number(q.total || 0).toLocaleString()}**\n` +
  `  - Status: \`${q.status}\` | Age: ${q.days_pending} days\n` +
  `  - Strategy: ${q.suggested_action}`
).join('\n\n')}

**What to do next**
Following up promptly on submitted quotes significantly increases conversion odds. Would you like me to prepare a follow-up message?`;
    } else {
      responseBody = `### 📋 Quotations for ${bizName}

**What I found:** No quotes are currently pending decision past 48 hours.

**What to do next:** Move qualified leads into formal quotations to build deal velocity, or ask me to draft a quote for a new prospect.`;
    }
  }
  // DEFAULT COMMERCIAL BRIEFING
  else {
    toolsExecuted.push('list_cooling_leads', 'list_pending_quotes', 'list_overdue_invoices');
    const quoteVal = quoteList.reduce((acc: number, q: any) => acc + (q.total || 0), 0);
    const leadVal = coolingList.reduce((acc: number, l: any) => acc + (l.estimated_value || 0), 0);
    const totalAttentionVal = quoteVal + leadVal;

    const quoteSummary = quoteList.length > 0
      ? `- **${quoteList.length} Quotation(s) Awaiting Decision**: Valued at **${currency}${quoteVal.toLocaleString()}**`
      : `- **0 Quotations Awaiting Decision**: All submitted proposals are resolved or current.`;

    const leadSummary = coolingList.length > 0
      ? `- **${coolingList.length} Cooling Leads**: Valued at **${currency}${leadVal.toLocaleString()}** in stored pipeline estimates:\n` +
        coolingList.slice(0, 4).map((l: any) => `  - ${l.customer_name}: ${currency}${Number(l.estimated_value || 0).toLocaleString()} *(Stage: ${l.status})*`).join('\n')
      : `- **0 Cooling Leads**: All active leads have recent follow-up activity.`;

    const overdueSummary = overdueList.length > 0
      ? `- **${overdueList.length} Overdue Invoices**: Total outstanding ${currency}${overdueList.reduce((a: number, o: any) => a + (o.balance_due || 0), 0).toLocaleString()}`
      : `- **0 Overdue Invoices**: All active invoices are currently within their payment terms.`;

    responseBody = `### 📊 Commercial Activity & Opportunity Briefing for ${bizName}

**What I found**
${quoteSummary}
${leadSummary}
${overdueSummary}
- **Total Pipeline Requiring Attention**: **${currency}${totalAttentionVal.toLocaleString()}**

**What it means**
${totalAttentionVal > 0 
  ? `You have active business value in your pipeline that can be unlocked with prompt customer communication.`
  : `Your workspace is clean, organized, and ready for new business inquiries and deals.`}

**What to do next**
${coolingList.length > 0 
  ? `1. Re-engage your top pending leads with structured follow-ups.\n2. Review pending quotes to address any customer questions.\n3. Let me know if you would like me to draft an outreach message.`
  : `1. Share your direct intake link with prospective clients to capture new leads.\n2. Check customer requests in the marketplace to bid on verified jobs.\n3. Create or draft a quotation whenever a prospect asks for pricing.`}

How can I assist you with your business today?`;
  }

  return {
    text: responseBody,
    toolsExecuted,
  };
}

/**
 * Main Matthew Chat Execution Entrypoint
 */
export async function executeMatthewChat(request: MatthewChatRequest): Promise<MatthewChatResponse> {
  const {
    message,
    history = [],
    businessId,
    clientContext,
    clientFallbackData,
    accessToken,
    isAdmin,
    isPaidSubscription,
  } = request;

  // 1. FAST-PATH DOMAIN RESTRICTION CHECK
  const domainCheck = checkDomainScope(message);
  if (!domainCheck.inScope && domainCheck.redirectMessage) {
    return {
      success: true,
      message: domainCheck.redirectMessage,
      model: 'matthew-guard-v1',
      engine: 'openai',
      tool_calls_executed: [],
      citations: [],
      is_out_of_domain: true,
    };
  }

  const toolContext: ToolExecutionContext = {
    businessId,
    clientContext,
    clientFallbackData,
    accessToken,
    isAdmin,
    isPaidSubscription,
  };

  // Context summary header to prepend
  const businessContextPreamble = `\n\nCURRENT OPERATIONAL BUSINESS CONTEXT:
- Active Business ID: ${businessId || 'Local Business Session'}
- Business Name: ${clientContext?.businessName || 'Matthorg Enterprise'}
- Trade / Specialization: ${clientContext?.specialization || clientContext?.industry || 'Commercial Services'}
- Operating Currency: ${clientContext?.currency || '₦'}
- Subscription Tier: ${clientContext?.userPlan || 'free'}
`;

  const systemPrompt = MATTHEW_SYSTEM_INSTRUCTIONS + businessContextPreamble;
  const executedToolNames: string[] = [];

  // ==========================================================================
  // PATH A: OPENAI ENGINE (when OPENAI_API_KEY is available)
  // ==========================================================================
  const openai = getOpenAIClient();
  if (openai) {
    try {
      const openAiTools: OpenAI.Chat.Completions.ChatCompletionTool[] = MATTHEW_TOOL_DEFINITIONS.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));

      // Assemble message history
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
      ];

      // Append up to last 10 conversational turns
      const recentHistory = history.slice(-10);
      for (const h of recentHistory) {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      }
      messages.push({ role: 'user', content: message });

      // Run tool execution loop (up to 5 iterations)
      let currentIteration = 0;
      let finalContent = '';
      const modelName = process.env.OPENAI_MODEL || 'gpt-4o-mini';

      while (currentIteration < 5) {
        currentIteration++;
        const completion = await openai.chat.completions.create({
          model: modelName,
          messages,
          tools: openAiTools,
          tool_choice: 'auto',
          temperature: 0.3,
        });

        const choice = completion.choices[0];
        const responseMessage = choice.message;

        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          messages.push(responseMessage);

          for (const tc of responseMessage.tool_calls) {
            if ((tc as any).type !== 'function' || !(tc as any).function) continue;
            const fnName = (tc as any).function.name;
            executedToolNames.push(fnName);
            let fnArgs: Record<string, any> = {};
            try {
              fnArgs = JSON.parse((tc as any).function.arguments || '{}');
            } catch {
              fnArgs = {};
            }

            const toolOutput = await executeMatthewTool(fnName, fnArgs, toolContext);
            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(toolOutput),
            });
          }
        } else {
          finalContent = responseMessage.content || '';
          break;
        }
      }

      if (!finalContent) {
        finalContent = "I've reviewed your current business data. What specific sales or growth priority would you like to tackle next?";
      }

      return {
        success: true,
        message: finalContent,
        model: modelName,
        engine: 'openai',
        tool_calls_executed: Array.from(new Set(executedToolNames)),
        citations: extractCitations(finalContent),
        is_out_of_domain: false,
      };
    } catch (openaiErr: any) {
      const errMsg = (openaiErr?.message || '').toLowerCase();
      if (openaiErr?.status === 429 || errMsg.includes('credits') || errMsg.includes('quota') || errMsg.includes('rate limit')) {
        openaiQuotaDepletedUntil = Date.now() + 15 * 60 * 1000; // Cache 429 quota exhaustion for 15 minutes
      }
      console.warn('[Matthew AI] OpenAI request notice, evaluating fallback:', openaiErr?.message || openaiErr);
      // Fall through to Gemini fallback if OpenAI fails or is unconfigured
    }
  }

  // ==========================================================================
  // PATH B: GEMINI BACKEND ENGINE (AI Studio Built-in Infrastructure)
  // ==========================================================================
  const gemini = getGeminiClient();
  if (gemini) {
    // Map tools to Gemini functionDeclarations format
    const geminiDeclarations = MATTHEW_TOOL_DEFINITIONS.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: {
        type: Type.OBJECT,
        properties: Object.entries(t.parameters.properties).reduce((acc: any, [key, val]: [string, any]) => {
          acc[key] = {
            type: val.type === 'number' ? Type.NUMBER : Type.STRING,
            description: val.description,
          };
          return acc;
        }, {}),
        required: t.parameters.required || [],
      },
    }));

    const candidateModels = [
      'gemini-4-hydrogen',
      'gemini-3.1-flash-lite',
    ];
    let lastGeminiError: any = null;

    for (const modelCandidate of candidateModels) {
      // Allow up to 2 attempts per model for transient errors with backoff
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const chatConfig: Record<string, any> = {
            systemInstruction: systemPrompt,
            tools: [{ functionDeclarations: geminiDeclarations }],
          };
          if (modelCandidate === 'gemini-4-hydrogen') {
            chatConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
          } else {
            chatConfig.temperature = 0.25;
          }

          const chatSession = gemini.chats.create({
            model: modelCandidate,
            config: chatConfig,
          });

          // Send recent history context
          let response = await chatSession.sendMessage({ message });

          // Handle function calling loop
          let step = 0;
          while (response.functionCalls && response.functionCalls.length > 0 && step < 5) {
            step++;
            const functionCall = response.functionCalls[0];
            const fnName = functionCall.name;
            executedToolNames.push(fnName);
            const fnArgs = (functionCall.args as Record<string, any>) || {};

            const toolResult = await executeMatthewTool(fnName, fnArgs, toolContext);

            response = await chatSession.sendMessage({
              message: [
                {
                  functionResponse: {
                    name: fnName,
                    response: { result: toolResult },
                  },
                } as any,
              ],
            });
          }

          const replyText = response.text || "I've reviewed your business pipeline. How would you like to proceed?";

          return {
            success: true,
            message: replyText,
            model: `${modelCandidate} (Matthew AI Engine)`,
            engine: 'gemini',
            tool_calls_executed: Array.from(new Set(executedToolNames)),
            citations: extractCitations(replyText),
            is_out_of_domain: false,
          };
        } catch (candidateErr: any) {
          lastGeminiError = candidateErr;
          const isTransient = isTransientError(candidateErr);
          console.warn(
            `[Matthew AI] Model ${modelCandidate} (attempt ${attempt}/2) encountered: ${
              candidateErr?.message || candidateErr
            }. Transient: ${isTransient}`
          );

          if (isTransient && attempt < 2) {
            // Short backoff before retry
            await new Promise((res) => setTimeout(res, 800));
            continue;
          }
          // Break to try next candidate model
          break;
        }
      }
    }

    console.warn('[Matthew AI] All Gemini candidate models busy or unavailable. Engaging deterministic fallback:', lastGeminiError?.message);
    
    // Robust local deterministic synthesis if all cloud models are undergoing high demand (503)
    const localFallback = await generateDeterministicMatthewResponse(request, toolContext);
    return {
      success: true,
      message: localFallback.text,
      model: 'matthew-local-intelligence',
      engine: 'gemini',
      tool_calls_executed: Array.from(new Set([...executedToolNames, ...localFallback.toolsExecuted])),
      citations: extractCitations(localFallback.text),
      is_out_of_domain: false,
    };
  }

  // Fallback if no client available
  const localFallback = await generateDeterministicMatthewResponse(request, toolContext);
  return {
    success: true,
    message: localFallback.text,
    model: 'matthew-local-intelligence',
    engine: 'gemini',
    tool_calls_executed: localFallback.toolsExecuted,
    citations: extractCitations(localFallback.text),
    is_out_of_domain: false,
  };
}
