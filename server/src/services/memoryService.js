const { runQuery, getAll, getOne } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

function extractTopic(text) {
  const topics = [
    'OSI model', 'TCP/IP', 'network', 'protocol', 'layer',
    'database', 'SQL', 'query', 'algorithm', 'sorting',
    'operating system', 'process', 'thread', 'memory',
    'data structure', 'array', 'linked list', 'tree', 'graph',
    'machine learning', 'neural network', 'programming',
    'function', 'class', 'object', 'inheritance', 'Google Cloud',
    'BigQuery', 'Looker', 'React', 'JavaScript', 'Python', 'Java',
  ];
  const lower = text.toLowerCase();
  for (const topic of topics) {
    if (lower.includes(topic.toLowerCase())) return topic;
  }
  return text.split(' ').slice(0, 3).join(' ');
}

async function updateTopicMemory(userId, subjectId, questionText) {
  const topic = extractTopic(questionText);
  const existing = await getOne(
    'SELECT * FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND topic = $3',
    [userId, subjectId, topic]
  );
  if (existing) {
    const newCount = existing.ask_count + 1;
    const strength = newCount >= 3 ? 'weak' : newCount === 2 ? 'developing' : 'unknown';
    await runQuery(
      'UPDATE topic_memory SET ask_count = $1, strength = $2, last_seen = NOW() WHERE id = $3',
      [newCount, strength, existing.id]
    );
  } else {
    await runQuery(
      'INSERT INTO topic_memory (id, user_id, subject_id, topic, ask_count, strength) VALUES ($1,$2,$3,$4,1,$5)',
      [uuidv4(), userId, subjectId, topic, 'unknown']
    );
  }
  return topic;
}

async function getWeakTopics(userId, subjectId) {
  return await getAll(
    "SELECT * FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND strength = 'weak' ORDER BY ask_count DESC",
    [userId, subjectId]
  );
}

async function getStrongTopics(userId, subjectId) {
  return await getAll(
    "SELECT * FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND strength = 'strong' ORDER BY last_seen DESC",
    [userId, subjectId]
  );
}

async function getAllTopics(userId, subjectId) {
  return await getAll(
    'SELECT * FROM topic_memory WHERE user_id = $1 AND subject_id = $2 ORDER BY ask_count DESC',
    [userId, subjectId]
  );
}

async function markTopicStrong(userId, subjectId, topic) {
  const existing = await getOne(
    'SELECT * FROM topic_memory WHERE user_id = $1 AND subject_id = $2 AND topic = $3',
    [userId, subjectId, topic]
  );
  if (existing) {
    await runQuery(
      "UPDATE topic_memory SET strength = 'strong', last_seen = NOW() WHERE id = $1",
      [existing.id]
    );
  }
}

async function getCrossSessionMemory(userId, subjectId, currentSessionId, limit = 5) {
  return await getAll(
    `SELECT q.question_text, q.topic_tag
     FROM questions q
     JOIN study_sessions s ON q.session_id = s.id
     WHERE s.user_id = $1 AND s.subject_id = $2 AND q.session_id != $3
     ORDER BY q.asked_at DESC LIMIT $4`,
    [userId, subjectId, currentSessionId, limit]
  );
}

module.exports = { extractTopic, updateTopicMemory, getWeakTopics, getStrongTopics, getAllTopics, markTopicStrong, getCrossSessionMemory };