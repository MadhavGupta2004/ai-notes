export async function handler(event) {
  try {
    if (!event.body) {
      throw new Error("No input text provided");
    }

    const { text } = JSON.parse(event.body);

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
              content:
                "You are an expert technical writer who produces high-quality abstractive summaries.",
            },
            {
              role: "user",
              content: `
Summarize the following text in your own words.

Rules:
- Do NOT copy sentences.
- Do NOT keep headings.
- Rewrite in simple, clear language.
- Max 120 words.
- Output as ONE paragraph only.

TEXT:
${text}
              `,
            },
          ],
          temperature: 0.25,
          max_tokens: 200,
        }),
      }
    );

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error(data.error?.message || "Invalid AI response");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: data.choices[0].message.content.trim(),
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || "AI summarization failed",
      }),
    };
  }
}
