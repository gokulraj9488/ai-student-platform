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
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT 10',
      [sessionId]
    );

    const chunks = await retrieveRelevantChunks(message, subjectId);
    console.log(`🔍 Retrieved ${chunks.length} chunks for query`);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No study materials found. Please upload a file first.' });
    }

    const crossSessionMemory = await getCrossSessionMemory(req.user.id, subjectId, 5);
    const weakTopics = await getWeakTopics(req.user.id, subjectId);

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

module.exports = { sendMessage, getChatHistory, clearHistory };