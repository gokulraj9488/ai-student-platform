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

module.exports = { generateStudentResponse };