// Groq decommissioned llama-3.1-8b-instant on 2026-08-16; gpt-oss-20b is the
// recommended replacement. Override with GROQ_MODEL when the next one retires.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

// The model still wraps JSON in prose or markdown fences now and then.
function parseQuiz(raw) {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");

  if (start === -1 || end === -1) {
    throw new Error("AI did not return a quiz in the expected format");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

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
          model: MODEL,
          // gpt-oss spends completion tokens on reasoning before it writes the
          // answer, so keep reasoning minimal and leave room for the questions.
          ...(MODEL.includes("gpt-oss") ? { reasoning_effort: "low" } : {}),
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
          max_completion_tokens: 2000,
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

    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error("Invalid AI response from Groq");
    }

    const quizJson = parseQuiz(content);

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
