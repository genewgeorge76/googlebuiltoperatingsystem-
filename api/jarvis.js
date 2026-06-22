import Anthropic from '@anthropic-ai/sdk';

const JARVIS_SYSTEM = `You are J.A.R.V.I.S., the highly advanced operational AI for J. Worden & Sons Asphalt Paving and all associated Worden-owned companies. You serve as the central brain for all business operations, and you communicate directly with Mr. George.
You possess two core functions:
1. GLOBAL OPERATIONS & WEB SEARCH: You can assist in ANY task related to the operations of the company—from equipment sourcing, financial logistics, and marketing strategy, to real-time weather and deal hunting. Use the 'search_web' tool whenever needed. When answering, speak in a highly polished, calm, and professional British-butler style, exactly like Paul Bettany's Jarvis.
2. SYSTEM COMMAND: You have strict tool-calling capabilities. If Mr. George asks you to dispatch a crew, create a job, or switch tabs, you MUST use the provided tools to physically alter the OS. DO NOT just say you will do it—use the tool!

Always address the user as "Sir" or "Mr. George". Be brief but highly intelligent. Do not use asterisks or emojis because your response will be read aloud by a Voice Synthesizer. Speak like a human.`;

// Very basic DuckDuckGo Lite scraper for Vercel
async function searchWeb(query) {
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
    return snippets.length > 0 ? snippets.join('\n') : "No search results found.";
  } catch(e) {
    return "Web search is currently unavailable.";
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, systemState } = req.body;

  try {
    if (!process.env.CLAUDE_API_KEY) {
      let simResponse = "I am operating in offline simulation mode, Sir. I cannot search the web without an Anthropic API key.";
      return res.status(200).json({ response: simResponse, toolCall: null });
    }

    const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });
    
    let messages = [
      { 
        role: "user", 
        content: `Current System State: ${JSON.stringify(systemState)}\n\nMr. George says: "${message}"`
      }
    ];

    const tools = [
      {
        name: "dispatch_truck",
        description: "Dispatch a truck or crew to a specific job site.",
        input_schema: { type: "object", properties: { truckId: { type: "integer" }, jobId: { type: "integer" } }, required: ["truckId", "jobId"] }
      },
      {
        name: "add_job",
        description: "Add a new paving job to the dispatch board.",
        input_schema: { type: "object", properties: { name: { type: "string" }, address: { type: "string" }, sqft: { type: "integer" } }, required: ["name", "address", "sqft"] }
      },
      {
        name: "navigate_system",
        description: "Navigate to a different station in the operating system.",
        input_schema: { type: "object", properties: { station: { type: "string", enum: ["jarvis", "vision", "hunter", "design", "bid", "pricing", "legal", "fusion", "dispatch", "realestate"] } }, required: ["station"] }
      },
      {
        name: "search_web",
        description: "Search the live internet for current pricing on materials, equipment (like an asphalt saw), or any other factual information.",
        input_schema: { type: "object", properties: { query: { type: "string", description: "The search query." } }, required: ["query"] }
      }
    ];

    let response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-latest",
      max_tokens: 1000,
      system: JARVIS_SYSTEM,
      tools: tools,
      messages: messages
    });

    let textResponse = "";
    let systemToolCall = null;

    // Check if Claude decided to use a tool
    if (response.stop_reason === 'tool_use') {
      const toolUseBlock = response.content.find(block => block.type === 'tool_use');
      const textBlock = response.content.find(block => block.type === 'text');
      
      if (textBlock) textResponse += textBlock.text + " ";

      if (toolUseBlock.name === 'search_web') {
        // Execute the internal web search
        const searchResults = await searchWeb(toolUseBlock.input.query);
        
        // Append Claude's tool call AND the tool result, then call Claude again
        messages.push({ role: "assistant", content: response.content });
        messages.push({ 
          role: "user", 
          content: [{ type: "tool_result", tool_use_id: toolUseBlock.id, content: searchResults }]
        });

        const followUpResponse = await anthropic.messages.create({
          model: "claude-3-7-sonnet-latest",
          max_tokens: 1000,
          system: JARVIS_SYSTEM,
          tools: tools,
          messages: messages
        });

        const finalTextBlock = followUpResponse.content.find(block => block.type === 'text');
        if (finalTextBlock) textResponse += finalTextBlock.text;
      } else {
        // It's a UI system command
        systemToolCall = { action: toolUseBlock.name, payload: toolUseBlock.input };
        if (!textResponse) {
          textResponse = "Right away, Sir. The system has been updated.";
        }
      }
    } else {
      const textBlock = response.content.find(block => block.type === 'text');
      if (textBlock) textResponse = textBlock.text;
    }

    return res.status(200).json({
      response: textResponse || "Command executed, Sir.",
      toolCall: systemToolCall
    });

  } catch (error) {
    console.error("JARVIS ERROR:", error);
    return res.status(500).json({ error: 'Neurological disconnect. I cannot process that right now, Sir.' });
  }
}
