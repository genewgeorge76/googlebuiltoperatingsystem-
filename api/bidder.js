const Anthropic = require('@anthropic-ai/sdk');

// The Worden Paving Constants
const ASPHALT_DENSITY = 115; // lbs per square yard per inch
const STONE_BASE_COST_PER_TON = 28.50; 
const ASPHALT_COST_PER_TON = 85.00;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let address, sqft, soilType, region, client, service;
  try {
    ({ address, sqft, soilType, region, client, service } = req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request data. Please provide address, sqft, soilType, and region.' });
  }

  // 1. Regional Logic Gate
  let depthSpec = 2; // Default residential
  let stoneBaseDepth = 4; // Default
  
  if (region === 'Chicago' || region === 'Illinois' || region === 'IL') {
    depthSpec = 3; // Frost-Heave Heavy Duty
    stoneBaseDepth = 8;
  } else if (soilType === 'Clay' || region === '23221' || region === 'VA' || region === 'Virginia') {
    stoneBaseDepth = 6; // Worden Clay Stabilization
  }

  // 2. The Yield Math
  const asphaltTons = (parseFloat(sqft) * depthSpec * ASPHALT_DENSITY) / 2000;
  const stoneTons = (parseFloat(sqft) * (stoneBaseDepth / 12) * 150) / 2000; // 150lb/cuft for stone
  const totalProjectedCost = (asphaltTons * ASPHALT_COST_PER_TON) + (stoneTons * STONE_BASE_COST_PER_TON);

  // 3. The Claude Intelligent Contract Writer
  try {
    if (!process.env.CLAUDE_API_KEY) {
      console.warn("CLAUDE_API_KEY is not set. Running in simulation mode.");
      return res.status(200).json({
        estimate: `[SIMULATION MODE - NO API KEY]\n\nFORMAL CONTRACT for ${client || 'Client'} at ${address || 'TBD'}\nService: ${service || 'Paving'}\n\nTerms: Net 30.\nSpecs:\nAsphalt: ${asphaltTons.toFixed(2)} Tons (${depthSpec}" depth)\nStone: ${stoneTons.toFixed(2)} Tons (${stoneBaseDepth}" depth)\nCost: $${totalProjectedCost.toFixed(2)}`,
        metrics: { asphaltTons, stoneTons, totalProjectedCost }
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1500,
      system: `You are the Lead Contract Administrator for J. Worden & Sons Asphalt Paving. You must output a formal, legally-binding construction contract.
      
Format your output cleanly in Markdown. Do not include casual conversational text. Use this exact structure:
1. CONTRACT HEADER (Parties, Date, Property Address)
2. SCOPE OF WORK (Detailed engineering specs)
3. MATERIAL YIELDS & ENGINEERING (Exact tonnages)
4. COMPLIANCE CLAUSES (State-specific laws, OSHA)
5. J. WORDEN STANDARD TERMS & CONDITIONS (Warranty, Payment Net 30, Force Majeure)
6. SIGNATURE BLOCK`,
      messages: [{
        role: "user",
        content: `Draft a binding contract for ${client || 'Client'} at ${address || 'TBD'}. Service: ${service || 'Asphalt Paving'}. Specs: ${sqft} sqft, ${depthSpec}" Asphalt, ${stoneBaseDepth}" Stone Base. Calculated material yields: ${asphaltTons.toFixed(1)} tons of asphalt, ${stoneTons.toFixed(1)} tons of stone. Make sure to embed strict ${region || 'Virginia'} state compliance rules.`
      }]
    });

    return res.status(200).json({
      estimate: response.content[0].text,
      metrics: { asphaltTons, stoneTons, totalProjectedCost }
    });
  } catch (error) {
    console.error("Error calling Anthropic:", error);
    return res.status(500).json({ error: 'Unable to generate estimate. Please try again or contact us directly at 804-446-1296.' });
  }
}
