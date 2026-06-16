const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function generateStudentResponse(messages) {
  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      max_tokens: 300,
      temperature: 0.8,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty response from Groq');
    return content;
  } catch (err) {
    console.error('Groq error:', err.message);
    throw err;
  }
}

async function evaluateAnswer(messages) {
  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages,
      max_tokens: 500,
      temperature: 0.3,
    });
    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty evaluation response');

    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error('Evaluation error:', err.message);
    return {
      score: 5,
      accuracy: '50%',
      feedback: 'Could not evaluate properly. Please try again.',
      missing_concepts: [],
      strong_points: [],
      suggested_revision: [],
      verdict: 'Needs Work',
    };
  }
}

module.exports = { generateStudentResponse, evaluateAnswer };