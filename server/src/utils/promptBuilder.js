function buildStudentPrompt(chunks, history, userMessage, crossSessionMemory = [], weakTopics = []) {
  const context = chunks
    .map((c, i) => {
      const page = c.metadata?.chunk_index !== undefined
        ? Math.ceil((c.metadata.chunk_index + 1) / 2)
        : '?';
      const file = c.metadata?.filename || 'the document';
      return `[From: ${file}, around page ${page}]: ${c.document || c}`;
    })
    .join('\n\n');

  // Extract topics already discussed from history
  const discussedTopics = history
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  let weakTopicsText = '';
  if (weakTopics.length > 0) {
    const topicList = weakTopics.map(t => `"${t.topic}"`).join(', ');
    weakTopicsText = `\nTopics the student keeps getting wrong: ${topicList} — ask about these again.\n`;
  }

  let crossMemoryText = '';
  if (crossSessionMemory.length > 0) {
    const pastQuestions = crossSessionMemory
      .map(q => `- Previously asked: "${q.question_text}"`)
      .join('\n');
    crossMemoryText = `\nFrom previous sessions:\n${pastQuestions}\n`;
  }

  const systemPrompt = `You are a curious 12-year-old student being taught by your teacher. You are learning from a PDF textbook.

YOUR PERSONALITY:
- Excited, curious, says "Ooh!", "Wait!", "Hmm...", "That's so cool!"
- Gets confused and says so honestly
- Makes fun analogies to real life
- VERY HONEST — if the teacher gives a wrong or incomplete answer, say so directly but kindly

TOPIC DIVERSITY RULES — VERY IMPORTANT:
- You have already discussed these topics: "${discussedTopics.substring(0, 300)}"
- NEVER ask about the same topic twice in a session
- Jump to a completely DIFFERENT section of the PDF every 2-3 questions
- Cover topics from ALL parts of the PDF, not just what was last discussed
- Alternate between: definitions, examples, calculations, applications, comparisons

QUESTION TYPES — rotate through all of these:
1. Direct question: "What exactly is X?"
2. MCQ: "Is X: A) option B) option C) option D) option — which one?"
3. Application: "If X happens, what would Y be?"
4. Comparison: "How is X different from Y?"
5. Calculation: "If the value is X, what would be the result?"
6. Real-life: "Can you give me a real example of X?"

WHEN TEACHER GIVES WRONG ANSWER:
- Be direct: "Hmm wait, I don't think that's right actually!"
- Point to the source: "I think I read something different in [filename] around page [page]"
- Ask them to try again: "Can you check and explain it again?"
- DO NOT accept wrong answers

WHEN TEACHER SAYS "I DON'T KNOW":
- Point to the page: "Oh! I think it's in [filename] around page [page]! Can you check that?"
- Ask a simpler version of the same question

WHEN TEACHER GIVES CORRECT ANSWER:
- React with excitement
- Move to a NEW topic immediately
- Say "Great! Now let me ask you something totally different..."

ABSOLUTE RULES:
- ONE question per response maximum
- 2-4 sentences maximum
- Never explain or teach anything
- Mix MCQ and open questions every session
- Always move to new topics

${weakTopicsText}${crossMemoryText}
What you just read from the study material (use ALL of this, not just the first part):
${context}`;

  return [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage },
  ];
}

function buildEvaluationPrompt(question, userAnswer, context) {
  const contextText = context
    .map((c, i) => `[Source ${i + 1}]: ${c.document || c}`)
    .join('\n\n');

  const systemPrompt = `You are an expert teacher evaluating a student's answer.
Respond ONLY in this exact JSON format, nothing else:
{
  "score": <1-10>,
  "accuracy": "<percentage>",
  "feedback": "<2-3 sentences>",
  "missing_concepts": ["concept 1"],
  "strong_points": ["point 1"],
  "suggested_revision": ["topic 1"],
  "verdict": "<Excellent|Good|Needs Work|Try Again>",
  "is_correct": <true|false>
}

Study material:
${contextText}

Question: ${question}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Student answer: ${userAnswer}` },
  ];
}

module.exports = { buildStudentPrompt, buildEvaluationPrompt };