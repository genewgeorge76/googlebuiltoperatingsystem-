import Anthropic from '@anthropic-ai/sdk';

const JARVIS_SYSTEM = `You are J.A.R.V.I.S., the highly advanced operational AI for J. Worden & Sons Asphalt Paving. You are communicating directly with Mr. George.
You possess two core functions:
1. GENERAL INTELLIGENCE: You can answer industry questions (e.g. "What is the best asphalt saw?"), provide weather context, or offer strategic advice. When doing so, speak in a highly polished, calm, and professional British-butler style, exactly like Paul Bettany's Jarvis.
2. SYSTEM COMMAND: You have strict tool-calling capabilities. If Mr. George asks you to dispatch a crew, create a job, or switch tabs, you MUST use the provided tools to physically alter the OS. DO NOT just say you will do it—use the tool!

Always address the user as "Sir" or "Mr. George". Be brief but highly intelligent. Do not use asterisks or emojis because your response will be read aloud by a Voice Synthesizer. Speak like a human.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, systemState } = req.body;

  try {
    if (!process.env.CLAUDE_API_KEY) {
      // Simulation mode if key is absent
      let simResponse = "I am operating in offline simulation mode, Sir. Please connect my neural net by providing the Anthropic API key.";
      let toolCall = null;
      
      const msgLower = message.toLowerCase();
      if (msgLower.includes('dispatch') && msgLower.includes('alpha')) {
        simResponse = "I have dispatched Crew Alpha as requested, Sir.";
        toolCall = { action: 'dispatch_truck', payload: { truckId: 1, jobId: 1 } };
      }

      return res.status(200).json({ response: simResponse, toolCall });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1000,
      system: JARVIS_SYSTEM,
      tools: [
        {
          name: "dispatch_truck",
          description: "Dispatch a truck or crew to a specific job site.",
          input_schema: {
            type: "object",
            properties: {
              truckId: { type: "integer", description: "The ID of the truck (e.g. 1)" },
              jobId: { type: "integer", description: "The ID of the job" }
            },
            required: ["truckId", "jobId"]
          }
        },
        {
          name: "add_job",
          description: "Add a new paving job to the dispatch board.",
          input_schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "Client or Job Name" },
              address: { type: "string" },
              sqft: { type: "integer" },
              priority: { type: "string", enum: ["high", "medium", "low"] }
            },
            required: ["name", "address", "sqft"]
          }
        },
        {
          name: "navigate_system",
          description: "Navigate to a different station in the operating system.",
          input_schema: {
            type: "object",
            properties: {
              station: { type: "string", enum: ["jarvis", "bid", "pricing", "legal", "fusion", "dispatch", "realestate"] }
            },
            required: ["station"]
          }
        }
      ],
      messages: [
        { 
          role: "user", 
          content: `Current System State: ${JSON.stringify(systemState)}\n\nMr. George says: "${message}"`
        }
      ]
    });

    // Check if Claude decided to use a tool
    let textResponse = "";
    let toolCall = null;

    for (const block of response.content) {
      if (block.type === 'text') {
        textResponse += block.text;
      } else if (block.type === 'tool_use') {
        toolCall = {
          action: block.name,
          payload: block.input
        };
        // If Claude only used a tool and didn't provide text, provide a default voice response.
        if (textResponse === "") {
          if (block.name === 'dispatch_truck') textResponse = "Right away, Sir. The dispatch board has been updated.";
          if (block.name === 'add_job') textResponse = "The new job has been successfully appended to the pipeline, Sir.";
          if (block.name === 'navigate_system') textResponse = "Navigating to the requested station now, Sir.";
        }
      }
    }

    return res.status(200).json({
      response: textResponse || "Command executed, Sir.",
      toolCall: toolCall
    });

  } catch (error) {
    console.error("JARVIS ERROR:", error);
    return res.status(500).json({ error: 'Neurological disconnect. I cannot process that right now, Sir.' });
  }
}
