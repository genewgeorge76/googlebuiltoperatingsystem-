import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { addresses } = req.body;

  if (!addresses || !Array.isArray(addresses)) {
    return res.status(400).json({ error: 'Missing or invalid addresses array.' });
  }

  try {
    // 1. Simulation Check (If missing keys)
    if (!process.env.GOOGLE_MAPS_API_KEY || !process.env.CLAUDE_API_KEY) {
      console.warn("Global Eye Simulation: Missing API Keys.");
      const mockReports = addresses.map((addr) => ({
        address: addr,
        diagnosis: `[SIMULATION] Satellite Scan of ${addr} complete. Severe alligator cracking detected in primary driveway. Sub-base failure suspected. Recommended Action: Full Depth Mill & Overlay.`,
        status: "critical"
      }));
      return res.status(200).json({ reports: mockReports, warning: "Running in Simulation Mode. Please provide GOOGLE_MAPS_API_KEY and CLAUDE_API_KEY." });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    let reports = [];

    // 2. Loop through targets and execute the Global Eye Scan
    // In production with hundreds of addresses, this would be chunked/queued to avoid rate limits.
    for (const address of addresses) {
      try {
        // Fetch Satellite Image from Google Maps Static API
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=20&size=600x600&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
        const mapResponse = await fetch(mapUrl);
        
        if (!mapResponse.ok) {
          reports.push({ address, diagnosis: "Satellite Uplink Failed. Target Obscured.", status: "unknown" });
          continue;
        }

        const arrayBuffer = await mapResponse.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');
        const mediaType = mapResponse.headers.get('content-type') || 'image/png';

        // Pass to Claude Vision
        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 500,
          system: `You are the lead geotechnical paving engineer for J. Worden & Sons. 
Analyze the provided high-res satellite image of this property's driveway/parking lot.
Output a highly concise structural diagnosis (cracks, potholes, fading, gravel vs asphalt) and recommend a Worden Standard protocol to fix it. Keep it under 3 sentences.`,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Data,
                  }
                },
                {
                  type: "text",
                  text: `Run a satellite structural analysis on the pavement at ${address}, J.A.R.V.I.S.`
                }
              ]
            }
          ]
        });

        // Determine critical status simply by checking for keywords
        const analysis = claudeResponse.content[0].text;
        const isCritical = analysis.toLowerCase().includes('crack') || analysis.toLowerCase().includes('pothole') || analysis.toLowerCase().includes('failure') || analysis.toLowerCase().includes('gravel');

        reports.push({
          address,
          diagnosis: analysis,
          status: isCritical ? "critical" : "stable"
        });

      } catch (err) {
        reports.push({ address, diagnosis: "Analysis Error: Neural Net Disconnect.", status: "error" });
      }
    }

    return res.status(200).json({ reports });

  } catch (error) {
    console.error("GLOBAL EYE ERROR:", error);
    return res.status(500).json({ error: 'Global Eye Satellite Array offline.' });
  }
}
