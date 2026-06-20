const { v4: uuidv4 } = require('uuid');
const { runQuery, getAll, getOne } = require('../config/db');
const { retrieveRelevantChunks } = require('../services/retrievalService');
const { generateStudentResponse } = require('../services/llmService');
const { buildStudentPrompt } = require('../utils/promptBuilder');
const { updateTopicMemory, getWeakTopics, getCrossSessionMemory } = require('../services/memoryService');

async function sendMessage(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { message, subjectId } = req.body;
    if (!message || !subjectId) {
      return res.status(400).json({ error: 'message and subjectId are required' });
    }
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const userMessageId = uuidv4();
    await runQuery(
      'INSERT INTO messages (id, session_id, user_id, role, content) VALUES ($1,$2,$3,$4,$5)',
      [userMessageId, sessionId, req.user.id, 'user', message]
    );

    const history = await getAll(
  'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 6',
  [sessionId]
);
history.reverse(); // put back in chronological order after DESC fetch

    const chunks = await retrieveRelevantChunks(message, subjectId, 3);
    console.log(`🔍 Retrieved ${chunks.length} chunks for query`);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No study materials found. Please upload a file first.' });
    }

    const crossSessionMemory = await getCrossSessionMemory(req.user.id, subjectId, sessionId, 5);    const weakTopics = await getWeakTopics(req.user.id, subjectId);

    const promptMessages = buildStudentPrompt(chunks, history, message, crossSessionMemory, weakTopics);
    const aiResponse = await generateStudentResponse(promptMessages);
    console.log(`🤖 AI student responded`);

    const aiMessageId = uuidv4();
    const sourceChunks = JSON.stringify(chunks.map(c => c.metadata));
    await runQuery(
      'INSERT INTO messages (id, session_id, user_id, role, content, source_chunks) VALUES ($1,$2,$3,$4,$5,$6)',
      [aiMessageId, sessionId, req.user.id, 'assistant', aiResponse, sourceChunks]
    );

    let topicTag = null;
    if (aiResponse.includes('?')) {
      topicTag = await updateTopicMemory(req.user.id, subjectId, aiResponse);
      await runQuery(
        'INSERT INTO questions (id, session_id, message_id, question_text, topic_tag) VALUES ($1,$2,$3,$4,$5)',
        [uuidv4(), sessionId, aiMessageId, aiResponse, topicTag]
      );
    }

    res.json({
      userMessage: { id: userMessageId, role: 'user', content: message },
      aiMessage: { id: aiMessageId, role: 'assistant', content: aiResponse },
      chunksUsed: chunks.length,
      topicTag,
      weakTopics: weakTopics.map(t => t.topic),
    });
  } catch (err) { next(err); }
}

async function getChatHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const messages = await getAll(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC',
      [sessionId]
    );
    res.json({ session, messages });
  } catch (err) { next(err); }
}

async function clearHistory(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });
    await runQuery('DELETE FROM messages WHERE session_id = $1', [sessionId]);
    await runQuery('DELETE FROM questions WHERE session_id = $1', [sessionId]);
    res.json({ message: 'Chat history cleared' });
  } catch (err) { next(err); }
}
async function evaluateUserAnswer(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { question, answer, subjectId } = req.body;

    if (!question || !answer || !subjectId) {
      return res.status(400).json({ error: 'question, answer and subjectId are required' });
    }

    const { retrieveRelevantChunks } = require('../services/retrievalService');
    const { evaluateAnswer } = require('../services/llmService');
    const { buildEvaluationPrompt } = require('../utils/promptBuilder');

    const chunks = await retrieveRelevantChunks(question, subjectId);
    const prompt = buildEvaluationPrompt(question, answer, chunks);
    const evaluation = await evaluateAnswer(prompt);

    await runQuery(
      'INSERT INTO messages (id, session_id, user_id, role, content) VALUES ($1,$2,$3,$4,$5)',
      [require('uuid').v4(), sessionId, req.user.id, 'user', `[Answer to: "${question}"]\n${answer}`]
    );

    const evalText = `📊 **Evaluation Result**\n\n` +
      `**Score: ${evaluation.score}/10** (${evaluation.accuracy} accuracy) — ${evaluation.verdict}\n\n` +
      `${evaluation.feedback}\n\n` +
      (evaluation.strong_points?.length ? `✅ **Strong points:** ${evaluation.strong_points.join(', ')}\n\n` : '') +
      (evaluation.missing_concepts?.length ? `⚠️ **Missing concepts:** ${evaluation.missing_concepts.join(', ')}\n\n` : '') +
      (evaluation.suggested_revision?.length ? `📖 **Revise:** ${evaluation.suggested_revision.join(', ')}` : '');

    const aiMsgId = require('uuid').v4();
    await runQuery(
      'INSERT INTO messages (id, session_id, user_id, role, content) VALUES ($1,$2,$3,$4,$5)',
      [aiMsgId, sessionId, req.user.id, 'assistant', evalText]
    );

    res.json({ evaluation, evalMessage: { id: aiMsgId, role: 'assistant', content: evalText } });
  } catch (err) {
    next(err);
  }
}
async function startConversation(req, res, next) {
  try {
    const { sessionId } = req.params;
    const { subjectId } = req.body;

    const session = await getOne(
      'SELECT * FROM study_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Don't restart if messages already exist
    const existing = await getAll(
      'SELECT id FROM messages WHERE session_id = $1 LIMIT 1',
      [sessionId]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Session already has messages' });
    }

    const chunks = await retrieveRelevantChunks('introduction overview summary', subjectId);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No study materials found. Please upload a file first.' });
    }

    const crossSessionMemory = await getCrossSessionMemory(req.user.id, subjectId, sessionId, 5);
    const weakTopics = await getWeakTopics(req.user.id, subjectId);

    // Empty history + a kickoff instruction as the "user" trigger
    const promptMessages = buildStudentPrompt(
      chunks,
      [],
      '[The teacher just opened this session. Greet them briefly as your curious self, then ask your FIRST question about the material.]',
      crossSessionMemory,
      weakTopics
    );

    const aiResponse = await generateStudentResponse(promptMessages);

    const aiMessageId = uuidv4();
    const sourceChunks = JSON.stringify(chunks.map(c => c.metadata));
    await runQuery(
      'INSERT INTO messages (id, session_id, user_id, role, content, source_chunks) VALUES ($1,$2,$3,$4,$5,$6)',
      [aiMessageId, sessionId, req.user.id, 'assistant', aiResponse, sourceChunks]
    );

    let topicTag = null;
    if (aiResponse.includes('?')) {
      topicTag = await updateTopicMemory(req.user.id, subjectId, aiResponse);
      await runQuery(
        'INSERT INTO questions (id, session_id, message_id, question_text, topic_tag) VALUES ($1,$2,$3,$4,$5)',
        [uuidv4(), sessionId, aiMessageId, aiResponse, topicTag]
      );
    }

    res.json({
      aiMessage: { id: aiMessageId, role: 'assistant', content: aiResponse },
    });
  } catch (err) { next(err); }
}
module.exports = { sendMessage, getChatHistory, clearHistory, evaluateUserAnswer, startConversation };