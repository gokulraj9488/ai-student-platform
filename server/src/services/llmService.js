const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

let usageWindow = {
  tokensUsed: 0,
  windowStart: Date.now(),
};

const TPM_LIMIT = 6000;
const WINDOW_MS = 60 * 1000;

function trackUsage(tokens) {
  const now = Date.now();
  if (now - usageWindow.windowStart > WINDOW_MS) {
    usageWindow = { tokensUsed: 0, windowStart: now };
  }
  usageWindow.tokensUsed += tokens;
}

function getUsageStatus() {
  const now = Date.now();
  if (now - usageWindow.windowStart > WINDOW_MS) {
    return { used: 0, limit: TPM_LIMIT, remaining: TPM_LIMIT, percentUsed: 0 };
  }
  const remaining = Math.max(0, TPM_LIMIT - usageWindow.tokensUsed);
  return {
    used: usageWindow.tokensUsed,
    limit: TPM_LIMIT,
    remaining,
    percentUsed: Math.round((usageWindow.tokensUsed / TPM_LIMIT) * 100),
  };
}

async function generateStudentResponse(messages, retries = 1) {
  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');

    const totalTokens = response.usage?.total_tokens || 0;
    trackUsage(totalTokens);

    return content;
  } catch (err) {
    const isRateLimit = err.status === 413 || err.status === 429 || /rate_limit/i.test(err.message);
    if (isRateLimit && retries > 0) {
      console.warn('Rate limited, retrying in 2s...');
      await new Promise(r => setTimeout(r, 2000));
      return generateStudentResponse(messages, retries - 1);
    }
    if (isRateLimit) {
      return "Ooh, hold on — I'm thinking really hard right now and need a quick breather! Can you give me a few seconds and try sending that again?";
    }
    console.error('Groq error:', err.message);
    throw err;
  }
}

async function evaluateAnswer(messages, retries = 1) {
  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      max_tokens: 500,
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty evaluation response');

    const totalTokens = response.usage?.total_tokens || 0;
    trackUsage(totalTokens);

    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    const isRateLimit = err.status === 413 || err.status === 429 || /rate_limit/i.test(err.message);
    if (isRateLimit && retries > 0) {
      console.warn('Evaluation rate limited, retrying in 2s...');
      await new Promise(r => setTimeout(r, 2000));
      return evaluateAnswer(messages, retries - 1);
    }
    console.error('Evaluation error:', err.message);
    return {
      score: 5,
      accuracy: '50%',
      feedback: 'Could not evaluate properly right now — the AI is a bit busy. Please try again in a moment.',
      missing_concepts: [],
      strong_points: [],
      suggested_revision: [],
      verdict: 'Needs Work',
      is_correct: false,
    };
  }
}

module.exports = { generateStudentResponse, evaluateAnswer, getUsageStatus };