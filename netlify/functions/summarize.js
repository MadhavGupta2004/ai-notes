// Groq decommissioned llama-3.1-8b-instant on 2026-08-16; gpt-oss-20b is the
// recommended replacement. Override with GROQ_MODEL when the next one retires.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export async function handler(event) {
  try {
    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: "GROQ_API_KEY not set in environment variables" 
        }),
      };
    }

    const { text } = JSON.parse(event.body);

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Text is required" }),
      };
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          // gpt-oss spends completion tokens on reasoning before it writes the
          // answer, so keep reasoning minimal and leave room for the summary.
          ...(MODEL.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
          messages: [
            {
              role: "system",
              content: `
Summarize the given text into 4–6 concise bullet points.
• Use simple language
• Focus on key ideas only
• Avoid repeating sentences
• Do NOT add headings
              `,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_completion_tokens: 1000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: data.error?.message || "Groq API error" 
        }),
      };
    }

    const summary = data.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("Invalid AI response from Groq");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ summary }),
    };
  } catch (err) {
    console.error("Summarize function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
}