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

  // 3. The Claude Intelligent Proposal Engine
  try {
    if (!process.env.CLAUDE_API_KEY) {
      console.warn("CLAUDE_API_KEY is not set. Running in simulation mode.");
      return res.status(200).json({
        estimate: `[SIMULATION MODE - NO API KEY]\n\nProposal for ${client || 'Client'} at ${address || 'TBD'}\nService: ${service || 'Paving'}\nMetrics:\nAsphalt: ${asphaltTons.toFixed(2)} Tons (${depthSpec}" depth)\nStone: ${stoneTons.toFixed(2)} Tons (${stoneBaseDepth}" depth)\nEstimated Material Cost: $${totalProjectedCost.toFixed(2)}`,
        metrics: { asphaltTons, stoneTons, totalProjectedCost }
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1000,
      system: "You are the J. Worden Paving Estimator. Write in a professional, 4th-generation contractor tone.",
      messages: [{
        role: "user",
        content: `Create a bid proposal for ${client || 'Client'} at ${address || 'TBD'}. Service requested: ${service || 'Asphalt Paving'}. Specs: ${sqft} sqft, ${depthSpec}" Asphalt, ${stoneBaseDepth}" Stone Base. Calculated material yields: ${asphaltTons.toFixed(1)} tons of asphalt, ${stoneTons.toFixed(1)} tons of stone. Include an Executive Summary, Scope of Work, Timeline, and Terms. Mention why our engineering in ${region || 'this region'} prevents failure.`
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
