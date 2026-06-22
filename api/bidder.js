const Anthropic = require('@anthropic-ai/sdk');

// The Worden Paving Constants
const ASPHALT_DENSITY = 115; // lbs per square yard per inch
const STONE_BASE_COST_PER_TON = 28.50; 
const ASPHALT_COST_PER_TON = 85.00;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let address, sqft, soilType, region, client, service, isDesignBuild, materials, totalCost, margin35, low, high;
  try {
    ({ address, sqft, soilType, region, client, service, isDesignBuild, materials, totalCost, margin35, low, high } = req.body);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid request data. Please provide necessary fields.' });
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
    let systemPrompt = "";
    let userContent = "";

    if (isDesignBuild) {
      systemPrompt = `You are the Chief Architect and Lead Designer for J. Worden & Sons. 
You write ultra-premium, high-end Architectural Design-Build proposals.
Speak with extreme professionalism. Focus on the luxury of the upgrades and the structural integrity of the local baseline materials chosen for their specific State/Region. Output ONLY the raw contract text, beautifully formatted.`;
      
      const matList = materials.map(m => `- ${m.qty} ${m.pricePerSqft ? 'sqft' : 'units'} of ${m.name} (${m.category})`).join('\n');
      
      userContent = `Please draft a formal Architectural Design-Build Proposal for the property at: ${address}.
Client: ${client}
Total Value: $${margin35.toLocaleString(undefined, {maximumFractionDigits:0})}

Selected Materials:
${matList}

Include sections for:
1. Architectural Vision
2. Material Selection (explain why these materials are perfect for ${address})
3. Investment Summary`;
    } else {
      systemPrompt = `You are the Lead Contract Administrator for J. Worden & Sons Asphalt Paving. 
You ONLY output legally-binding, highly formal construction contracts.
You use exact legal terminology. No pleasantries. No markdown formatting outside of standard headers. Output the raw contract text only.`;

      userContent = `Write a formal, legally binding paving contract for ${client || 'Client'} at ${address || 'TBD'}.
Service: ${service || 'Asphalt Paving'}
Square Footage: ${sqft} sqft
Price Range: $${low} to $${high}
Include sections for Scope of Work, Payment Terms, and Worden Standard Quality Guarantees.`;
    }

    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }]
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
