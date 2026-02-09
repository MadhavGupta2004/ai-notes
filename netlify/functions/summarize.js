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
          model: "llama-3.1-8b-instant",
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
          max_tokens: 250,
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

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid AI response from Groq");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: data.choices[0].message.content,
      }),
    };
  } catch (err) {
    console.error("Summarize function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
}