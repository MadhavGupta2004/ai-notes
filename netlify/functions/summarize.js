export async function handler(event) {
  try {
    const { text } = JSON.parse(event.body);

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

    if (!data.choices || !data.choices[0]) {
      throw new Error("Invalid AI response");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: data.choices[0].message.content,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}
