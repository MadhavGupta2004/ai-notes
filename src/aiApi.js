// Plain `vite` doesn't serve Netlify functions, so the SPA redirect answers
// with index.html and a bare response.json() blows up with a cryptic message.
async function callFunction(name, payload) {
  const response = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  try {
    return JSON.parse(body);
  } catch {
    throw new Error(
      `The ${name} function isn't running. Start the app with "netlify dev" instead of "npm run dev".`
    );
  }
}

export async function summarizeWithAI(content) {
  const data = await callFunction("summarize", { text: content });

  if (!data.summary) {
    throw new Error(data.error || "AI summarization failed");
  }

  return data.summary;
}

export async function generateQuizWithAI(content) {
  const quiz = await callFunction("generateQuiz", { text: content });

  if (!Array.isArray(quiz)) {
    throw new Error(quiz.error || "Quiz generation failed");
  }

  return quiz;
}
