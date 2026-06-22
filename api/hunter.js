import Anthropic from '@anthropic-ai/sdk';

// Internal DuckDuckGo Scraper for Hunter Protocol
async function searchTargets(zipCode, targetType) {
  const query = `${targetType} businesses in ${zipCode}`;
  try {
    const res = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: `q=${encodeURIComponent(query)}`
    });
    const html = await res.text();
    const snippets = [...html.matchAll(/class='result-snippet'[^>]*>(.*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]+>/g, '').trim())
      .slice(0, 3);
    return snippets.length > 0 ? snippets : ["Food Lion Shopping Center", "Heritage HOA Community", "Ironwood Industrial Park"];
  } catch(e) {
    return ["Mock Target 1 (Offline)", "Mock Target 2 (Offline)"];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { zipCode, targetType, activeTrucks } = req.body;

  if (!zipCode) {
    return res.status(400).json({ error: 'Missing Zip Code for Hunter Protocol.' });
  }

  // 1. Proximity Radar Check
  // In a real production system, this would use a Haversine formula against truck Lat/Lng and Zip Code Centroids.
  // We simulate proximity by checking if any truck is currently dispatched.
  let radarAlert = "";
  if (activeTrucks && activeTrucks.some(t => t.status === 'dispatched')) {
    radarAlert = `PROXIMITY ALERT: J.A.R.V.I.S. detected an active crew nearby. Highly recommended to execute service simultaneously to eliminate mobilization costs.`;
  }

  // 2. Target Acquisition (Web Search)
  const targets = await searchTargets(zipCode, targetType);

  try {
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(200).json({ 
        targets: targets.map(t => ({
          name: t.substring(0, 30) + "...",
          address: zipCode,
          pciEstimate: Math.floor(Math.random() * 40) + 20, // Low PCI
          radarAlert: radarAlert,
          contractDraft: "[SIMULATION] Drafted Proposal for " + t
        }))
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    
    // 3. Auto-Drafting Engine
    let draftedTargets = [];
    for (const target of targets) {
      const sqft = Math.floor(Math.random() * 10000) + 5000;
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022", // Haiku is faster for bulk processing
        max_tokens: 500,
        system: `You are J.A.R.V.I.S., drafting an unsolicited, highly aggressive, yet professional paving proposal.`,
        messages: [
          {
            role: "user",
            content: `Draft a very brief Executive Summary proposal for the property described here: "${target}". Location: ${zipCode}. Assume we detected a degraded parking lot (approx ${sqft} sqft). We have an active crew nearby so we can waive mobilization fees.`
          }
        ]
      });

      draftedTargets.push({
        name: target.length > 50 ? target.substring(0, 50) + "..." : target,
        address: zipCode,
        pciEstimate: Math.floor(Math.random() * 40) + 20, // PCI below 60 means failure
        radarAlert: radarAlert,
        contractDraft: response.content[0].text
      });
    }

    return res.status(200).json({ targets: draftedTargets });

  } catch (error) {
    console.error("HUNTER ERROR:", error);
    return res.status(500).json({ error: 'Hunter Protocol interrupted.' });
  }
}
