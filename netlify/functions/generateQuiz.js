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
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: `
You are an exam generator.

Generate EXACTLY 5 multiple choice questions.
Return ONLY valid JSON. No markdown. No text.

Format:
[
  {
    "question": "",
    "options": ["A", "B", "C", "D"],
    "answer": "A"
  }
]
`
            },
            {
              role: "user",
              content: text
            }
          ],
          temperature: 0.4,
          max_tokens: 700,
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

    if (!data.choices) {
      throw new Error("Invalid AI response from Groq");
    }

    const quizJson = JSON.parse(data.choices[0].message.content);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quizJson),
    };

  } catch (err) {
    console.error("Generate quiz function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Internal server error" }),
    };
  }
}
