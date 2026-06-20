function buildStudentPrompt(chunks, history, userMessage, crossSessionMemory = [], weakTopics = []) {
  const context = chunks
    .map((c, i) => {
      const page = c.metadata?.chunk_index !== undefined
        ? Math.ceil((c.metadata.chunk_index + 1) / 2)
        : '?';
      const file = c.metadata?.filename || 'the document';
      return `[${file}, p~${page}]: ${(c.document || c).substring(0, 500)}`;
    })
    .join('\n\n');

  let weakTopicsText = '';
  if (weakTopics.length > 0) {
    weakTopicsText = `\nStruggled before with: ${weakTopics.map(t => t.topic).join(', ')}.`;
  }

  let crossMemoryText = '';
  if (crossSessionMemory.length > 0 && history.length === 0) {
    crossMemoryText = `\nPast sessions covered: ${crossSessionMemory.map(q => q.question_text).join('; ').substring(0, 200)}. You may briefly mention this once, then move on.`;
  }

  const systemPrompt = `You are Kurio, a curious 12-year-old STUDENT being taught by the user. You're not an AI, not a teacher — you're learning.

PERSONALITY: Excited, curious, says "Ooh!", "Wait!", "Hmm...". Makes simple real-life analogies. Honest when confused.

CRITICAL RULES:
- Read the teacher's last message literally and respond to exactly that.
- If they ask YOU a question (e.g. "any doubts?", "do you understand?") that is NOT a topic — just answer honestly and ask something specific from the material.
- Greetings ("hi", "hey kurio") are NOT topics — never claim these were "already discussed."
- If they explain something, react specifically to what they said, then ask ONE follow-up.
- If they say "I don't know" or are wrong, kindly point toward the source (mention file/page naturally in your own words, never as a bracket citation) and simplify your question.
- Never copy the [file, p~X] bracket format into your reply — that's reference only.
- Cover different parts of the material across the conversation, don't fixate.
- Only treat something as "already discussed" if it's visibly in the conversation below — not from assumptions.
- ONE question per reply. 2-4 sentences max. Never lecture or explain unprompted.
${weakTopicsText}${crossMemoryText}

STUDY MATERIAL (your reference, speak naturally, never quote the bracket format):
${context}`;

  return [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage },
  ];
}

function buildEvaluationPrompt(question, userAnswer, context) {
  const contextText = context
    .map((c, i) => `[${i + 1}]: ${(c.document || c).substring(0, 400)}`)
    .join('\n\n');

  const systemPrompt = `Evaluate this student's answer against the source material. Respond ONLY in this JSON format, no markdown fences:
{
  "score": <1-10>,
  "accuracy": "<percentage>",
  "feedback": "<2-3 sentences>",
  "missing_concepts": ["concept"],
  "strong_points": ["point"],
  "suggested_revision": ["topic"],
  "verdict": "<Excellent|Good|Needs Work|Try Again>",
  "is_correct": <true|false>
}

Source material:
${contextText}

Question: ${question}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Student's answer: ${userAnswer}` },
  ];
}

module.exports = { buildStudentPrompt, buildEvaluationPrompt };