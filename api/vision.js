import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, mediaType } = req.body;

  if (!imageBase64 || !mediaType) {
    return res.status(400).json({ error: 'Missing image data.' });
  }

  try {
    if (!process.env.CLAUDE_API_KEY) {
      return res.status(200).json({ 
        diagnosis: "SIMULATION MODE: Severe alligator cracking detected in the Northwest quadrant. Extensive sub-base failure suspected.",
        recommendation: "2-inch mill and overlay with full-depth patching in affected zones.",
        estimatedSqft: 4500
      });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    
    // Remove the data URL prefix if present (e.g., "data:image/jpeg;base64,")
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // Sonnet 3.5 is currently highly optimized for Vision
      max_tokens: 1000,
      system: `You are the lead geotechnical and structural paving engineer for J. Worden & Sons. 
Analyze the provided satellite or drone image of the pavement/property.
You must output a precise structural diagnosis of the pavement condition (cracks, potholes, fading) and recommend the exact Worden Standard protocol to fix it. Do NOT use markdown. Just plain text. End your response by giving a rough estimate of the square footage visible in the frame.`,
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
              text: "Run a structural analysis on this pavement, J.A.R.V.I.S."
            }
          ]
        }
      ]
    });

    return res.status(200).json({
      diagnosis: response.content[0].text,
      recommendation: "Review the diagnosis above to determine required tonnage.",
      estimatedSqft: "Extracted from context"
    });

  } catch (error) {
    console.error("VISION ERROR:", error);
    return res.status(500).json({ error: 'J.A.R.V.I.S. Optics offline. Cannot process image.' });
  }
}
