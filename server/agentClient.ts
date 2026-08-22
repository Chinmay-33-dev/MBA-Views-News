import { extractAssistantMessage } from './parser.js';

let customAgentUrl = process.env.ANACONDA_AGENT_URL || 'http://127.0.0.1:54321/api/agents/mba-news/chat';

export function getAgentUrl(): string {
  return customAgentUrl;
}

export function setAgentUrl(url: string): void {
  if (url && url.trim()) {
    customAgentUrl = url.trim();
  }
}

export interface AgentCallResult {
  success: boolean;
  rawText?: string;
  rawJson?: any;
  error?: string;
  errorCode?: 'NOT_RUNNING' | 'API_UNAVAILABLE' | 'AGENT_ERROR' | 'PARSE_ERROR' | 'TIMEOUT';
  details?: string;
  statusCode?: number;
  durationMs?: number;
}

/**
 * Generates an executive Indian MBA Business Brief in demo or fallback mode
 * Rotates through high-quality case studies from Indian business press
 */
let briefRotationIndex = 0;

export function generateDemonstrationBrief(currentDateFormatted?: string): string {
  const today = currentDateFormatted || '24 May 2024';
  briefRotationIndex = (briefRotationIndex + 1) % 3;

  if (briefRotationIndex === 0) {
    return `
### ARTICLE 1
**Headline**: Tata Electronics Signs Strategic Semiconductor Off-Take Agreements for Dholera Mega Fab
**Source**: Economic Times
**Publication Date**: ${today}
**What Happened**: Tata Electronics announced binding multi-year supply agreements with global automotive Tier-1 suppliers and industrial semiconductor clients for its $11 billion Dholera fab in Gujarat.
**Why Does It Matter**: This represents India's transition from electronics assembly to high-value capital-intensive chip fabrication, shortening supply chain vulnerability for domestic EV and aerospace sectors.
**MBA Concept**: Vertical Backward Integration & Sovereign Supply Chain Resilience
**MBA Case-Study Insight**: Capital-intensive manufacturing requires guaranteed off-take contracts before volume production to manage high fixed-depreciation drag and lower the hurdle rate for subsequent fab modules.
**Management Question**: In capital-intensive asset creation, how should leadership balance sovereign industrial subsidies against the operational flexibility of fabless asset-light sourcing?
**URL**: https://economictimes.indiatimes.com

---

### ARTICLE 2
**Headline**: Zomato & Blinkit Expand Dark Store Footprint by 40% to Capture Non-Grocery Quick Commerce
**Source**: Mint
**Publication Date**: ${today}
**What Happened**: Blinkit is accelerating dark store density from 500 to 800 locations across Tier 1 & 2 cities, aggressively expanding beyond groceries into consumer electronics, beauty, and apparel.
**Why Does It Matter**: Higher average order value (AOV) categories transform the unit economics of 10-minute delivery, turning delivery density into an omnichannel retail channel.
**MBA Concept**: SKU Density & Unit Contribution Margin Dynamics
**MBA Case-Study Insight**: Increasing drop-size value without increasing courier delivery time amortizes fixed delivery costs, pushing contribution margins above the threshold required for sustained EBITDA profitability.
**Management Question**: How does rapid horizontal SKU expansion in quick commerce threaten traditional e-commerce warehouse distribution networks?
**URL**: https://livemint.com

---

### ARTICLE 3
**Headline**: Infosys Rolls Out Enterprise Agentic AI Platforms for Global Fortune 500 Banks
**Source**: The Hindu
**Publication Date**: ${today}
**What Happened**: Infosys Topaz announced widespread commercial deployment of autonomous multi-agent cognitive systems for fraud auditing and loan underwriting across international financial institutions.
**Why Does It Matter**: Indian IT service leaders are successfully shifting client contracts from traditional time-and-materials billing to high-margin outcome-based and IP-licensed technology models.
**MBA Concept**: Business Model Transformation from Labor Arbitrage to IP-Led Value Pricing
**MBA Case-Study Insight**: Transitioning an established IT services giant from headcount-linked revenue to software-agent productivity requires reforming sales incentive structures and talent capabilities.
**Management Question**: What organizational restructuring is essential when a legacy service enterprise pivots towards agentic software and intellectual property monetization?
**URL**: https://thehindu.com

### 3 MBA TAKEAWAYS
1. High fixed-capital industrial investments demand upfront anchor customer commitments to de-risk balance-sheet depreciation.
2. Quick commerce unit profitability depends on expanding into higher margin, non-perishable categories to maximize order basket value.
3. Service companies moving to AI-driven outcome models must overcome internal resistance to cannibalizing billable hour margins.
`;
  } else if (briefRotationIndex === 1) {
    return `
### ARTICLE 1
**Headline**: Reliance Jio & Disney+ Hotstar Finalize $8.5 Billion Media Merger Integration
**Source**: Economic Times
**Publication Date**: ${today}
**What Happened**: Reliance Industries and The Walt Disney Company completed the operational merger of Viacom18 and Star India, creating a dominant digital streaming and linear broadcast conglomerate reaching over 750 million viewers.
**Why Does It Matter**: The combined entity controls prime sports rights (IPL, ICC tournaments) and regional entertainment libraries, creating unprecedented leverage over advertisers and telecom distribution bundles.
**MBA Concept**: Horizontal Conglomerate Mergers & Pricing Power Asymmetry
**MBA Case-Study Insight**: Dominance over live sports rights acts as an irreplaceable customer acquisition funnel, allowing the platform to cross-subsidize subscription-based entertainment content and lower churn.
**Management Question**: How can a dominant media monopoly prevent customer churn in price-sensitive emerging markets when linear ad revenues decline?
**URL**: https://economictimes.indiatimes.com

---

### ARTICLE 2
**Headline**: State Bank of India Surpasses ₹60,000 Crore Annual Net Profit on Credit Expansion
**Source**: Mint
**Publication Date**: ${today}
**What Happened**: SBI reported record quarterly earnings driven by robust 16% year-on-year retail loan growth and a historic decline in gross non-performing assets (NPAs) below 2.2%.
**Why Does It Matter**: India's corporate balance sheet deleveraging cycle and surging domestic capital expenditure are propelling PSU bank profitability to multi-decade highs.
**MBA Concept**: Asset Quality Optimization & Net Interest Margin Cyclicality
**MBA Case-Study Insight**: Maintaining underwriting discipline during economic upswings is critical for public sector banks to prevent systemic asset degradation when macroeconomic interest rates pivot.
**Management Question**: How should banking leadership balance aggressive retail credit expansion against the risk of uncollateralized unsecured personal loan defaults?
**URL**: https://livemint.com

---

### ARTICLE 3
**Headline**: Mahindra & Mahindra Allocates ₹12,000 Crore to Born-Electric SUV Architecture
**Source**: The Hindu
**Publication Date**: ${today}
**What Happened**: M&M unveiled its INGLO electric vehicle modular platform and inaugurated dedicated EV production facilities to challenge Tata Motors' domestic EV dominance.
**Why Does It Matter**: Automakers with legacy internal combustion engine (ICE) cash cows must carefully execute the transition to modular electric platforms without stranding traditional powertrain manufacturing assets.
**MBA Concept**: The Innovator's Dilemma & Dual-Paced Capital Allocation
**MBA Case-Study Insight**: Cross-leveraging cash flow from high-margin ICE flagship models to fund pure-play EV platform architectures allows established automakers to defend market share against nimble EV startups.
**Management Question**: In automotive transition cycles, what governance mechanism ensures legacy product lines do not starve capital from disruptive next-generation platforms?
**URL**: https://thehindu.com

### 3 MBA TAKEAWAYS
1. Sports and live event rights are the single most effective moat against customer attrition in digital media platforms.
2. PSU banking profitability surges during corporate capex upcycles, but disciplined underwriting remains the only long-term defense against NPA spikes.
3. Incumbent manufacturers must utilize legacy cash generation to self-fund modular electric platforms before pure-play competitors capture brand mindshare.
`;
  } else {
    return `
### ARTICLE 1
**Headline**: L&T Secures $4 Billion Infrastructure and Clean Energy Orders Across Middle East
**Source**: Economic Times
**Publication Date**: ${today}
**What Happened**: Larsen & Toubro's hydrocarbon and transmission divisions bagged mega EPC orders in Saudi Arabia and the UAE for solar power plants and green hydrogen pipelines.
**Why Does It Matter**: Demonstrates Indian engineering and procurement conglomerates successfully exporting complex technological capabilities to global energy transition markets.
**MBA Concept**: International EPC Project Management & Geographic Revenue Diversification
**MBA Case-Study Insight**: Heavy engineering firms hedge domestic infrastructure budget cycles by establishing operational footholds in dollar-denominated high-liquidity sovereign wealth fund markets.
**Management Question**: How can EPC conglomerates safeguard operating margins against global raw material commodity inflation in multi-year fixed-price turnkey contracts?
**URL**: https://economictimes.indiatimes.com

---

### ARTICLE 2
**Headline**: Swiggy Expands 10-Minute Food Delivery 'Bolt' Across 6 Metros
**Source**: Mint
**Publication Date**: ${today}
**What Happened**: Swiggy launched its ultra-fast food delivery initiative partnering with select high-velocity restaurant kitchens within a 2km radius to counter quick commerce meal penetration.
**Why Does It Matter**: The boundary between restaurant food delivery and grocery quick commerce is blurring into a single consolidated on-demand logistics battleground.
**MBA Concept**: Network Density & Last-Mile Fleet Utilization Optimization
**MBA Case-Study Insight**: Pre-packaging top-selling items and curating tight delivery radii enables sub-10 minute fulfillment while maintaining driver utilization during non-peak dining hours.
**Management Question**: Does ultra-fast delivery risk compromising food preparation quality and damaging brand equity for premium restaurant partners?
**URL**: https://livemint.com

---

### ARTICLE 3
**Headline**: Sun Pharma Completes Taro Acquisition to Bolster Global Dermatology Portfolio
**Source**: The Hindu
**Publication Date**: ${today}
**What Happened**: Sun Pharmaceutical Industries completed its buyout of Israel-based Taro Pharmaceutical, consolidating full control over specialty dermatology and complex generic drugs in North America.
**Why Does It Matter**: Indian generic pharma majors are moving up the value chain from low-margin generic commodities into high-entry-barrier complex formulations and patented specialty therapies.
**MBA Concept**: Moving Up the Pharmaceutical Value Curve & Cross-Border M&A Synergies
**MBA Case-Study Insight**: Acquiring specialized overseas formulation capabilities allows domestic pharma giants to bypass prolonged FDA clinical trial lead times and capture direct distribution networks.
**Management Question**: How should multinational pharma executives structure post-merger integration to retain specialized R&D talent while streamlining operational costs?
**URL**: https://thehindu.com

### 3 MBA TAKEAWAYS
1. International geographic diversification protects capital goods manufacturers from cyclical domestic fiscal spending slowdowns.
2. Shared logistics fleets between food delivery and quick commerce significantly improve unit driver economics and asset productivity.
3. Generic manufacturers must systematically redeploy commodity profits into acquiring specialized complex therapy platforms.
`;
  }
}

/**
 * Checks if the Anaconda Agent Studio endpoint is responsive
 */
export async function checkAgentConnectivity(): Promise<{ connected: boolean; status: number; message: string; durationMs: number }> {
  const url = getAgentUrl();
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'ping' }],
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    if (response.status === 200 || response.status === 400 || response.status === 422) {
      return {
        connected: true,
        status: response.status,
        message: 'Anaconda Agent Studio is online and reachable.',
        durationMs,
      };
    }

    return {
      connected: false,
      status: response.status,
      message: `Endpoint responded with status ${response.status}: ${response.statusText}`,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    return {
      connected: false,
      status: 0,
      message: err?.name === 'AbortError' ? 'Connection timed out' : (err?.message || 'Connection refused'),
      durationMs,
    };
  }
}

/**
 * Sends the generation prompt to the Anaconda Agent Studio MBA News Agent
 */
export async function callAnacondaMbaNewsAgent(prompt = "Generate today's MBA Business Brief for India."): Promise<AgentCallResult> {
  const url = getAgentUrl();
  const startTime = Date.now();

  const payload = {
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    stream: false,
  };

  try {
    const controller = new AbortController();
    // Allow up to 120 seconds for deep web search & MBA multi-article reasoning
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    console.log(`[AnacondaClient] Sending POST request to: ${url}`);
    console.log(`[AnacondaClient] Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    console.log(`[AnacondaClient] Received response ${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        errorBody = response.statusText;
      }

      console.error(`[AnacondaClient] Error response ${response.status}:`, errorBody);

      if (response.status >= 500) {
        return {
          success: false,
          errorCode: 'AGENT_ERROR',
          error: "The MBA News Agent encountered an error while generating today's brief.",
          details: `HTTP ${response.status} from agent runtime: ${errorBody.slice(0, 300)}`,
          statusCode: response.status,
          durationMs,
        };
      } else {
        return {
          success: false,
          errorCode: 'API_UNAVAILABLE',
          error: "Could not connect to the Anaconda Agent Studio API.",
          details: `HTTP ${response.status}: ${errorBody.slice(0, 300)}`,
          statusCode: response.status,
          durationMs,
        };
      }
    }

    const responseData = await response.json();
    const assistantText = extractAssistantMessage(responseData);

    if (!assistantText || assistantText.trim().length === 0) {
      return {
        success: false,
        errorCode: 'PARSE_ERROR',
        error: "The agent returned an empty response.",
        rawJson: responseData,
        durationMs,
      };
    }

    return {
      success: true,
      rawText: assistantText,
      rawJson: responseData,
      durationMs,
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[AnacondaClient] Network/fetch error:', err);

    if (err?.name === 'AbortError') {
      return {
        success: false,
        errorCode: 'TIMEOUT',
        error: "Request to Anaconda Agent Studio timed out after 120 seconds.",
        details: "The agent might still be processing search queries or the server is unresponsive.",
        durationMs,
      };
    }

    const isConnRefused =
      err?.code === 'ECONNREFUSED' ||
      err?.cause?.code === 'ECONNREFUSED' ||
      err?.message?.includes('fetch failed') ||
      err?.message?.includes('ECONNREFUSED');

    if (isConnRefused) {
      return {
        success: false,
        errorCode: 'NOT_RUNNING',
        error: "Unable to connect to the MBA News Agent. Please start the MBA News agent in Anaconda Agent Studio and try again.",
        details: `Failed to connect to ${url}. Ensure Anaconda Agent Studio is running on localhost:54321.`,
        durationMs,
      };
    }

    return {
      success: false,
      errorCode: 'API_UNAVAILABLE',
      error: "Could not connect to the Anaconda Agent Studio API.",
      details: err?.message || String(err),
      durationMs,
    };
  }
}
