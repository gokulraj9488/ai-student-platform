import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ChatPage() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const subjectId = searchParams.get('subjectId');
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null);
  const [weakTopics, setWeakTopics] = useState([]);
  const [error, setError] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    fetchHistory();
    fetchWeakTopics();
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function fetchHistory() {
    try {
      const res = await api.get(`/api/chat/session/${sessionId}`);
      setSession(res.data.session);
      setMessages(res.data.messages);
    } catch (err) {
      setError('Failed to load chat history');
    }
  }

  async function fetchWeakTopics() {
    if (!subjectId) return;
    try {
      const res = await api.get(`/api/sessions/memory/${subjectId}/weak`);
      setWeakTopics(res.data.weakTopics);
    } catch (err) {
      console.error('Failed to load weak topics');
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const userText = input.trim();
    setInput('');
    setSending(true);
    setError('');

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: 'user', content: userText },
    ]);

    try {
      const res = await api.post(`/api/chat/session/${sessionId}`, {
        message: userText,
        subjectId,
      });

      setMessages((prev) => [
        ...prev,
        res.data.aiMessage,
      ]);

      if (res.data.weakTopics?.length > 0) {
        setWeakTopics(res.data.weakTopics.map((t) => ({ topic: t })));
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== Date.now()));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <span className="text-white font-medium">{session?.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm text-gray-400">AI Student is ready</span>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">

        {/* Chat area */}
        <div className="flex-1 flex flex-col">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">

            {messages.length === 0 && (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🧑‍🎓</div>
                <p className="text-gray-400">Your AI student is ready to learn.</p>
                <p className="text-gray-600 text-sm mt-1">Start teaching by typing below.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mr-3 mt-1">
                    🧑‍🎓
                  </div>
                )}
                <div
                  className={`max-w-lg px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-800 text-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm shrink-0 mr-3">
                  🧑‍🎓
                </div>
                <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="px-6 pb-2">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-gray-800 px-6 py-4 shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Teach your AI student something..."
                rows={2}
                className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition resize-none text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={sending || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl transition font-medium text-sm shrink-0"
              >
                Send
              </button>
            </div>
            <p className="text-gray-600 text-xs mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>

        {/* Sidebar — weak topics */}
        {weakTopics.length > 0 && (
          <div className="w-64 border-l border-gray-800 p-4 shrink-0">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">⚠️ Weak Topics</h3>
            <div className="space-y-2">
              {weakTopics.map((t, i) => (
                <div
                  key={i}
                  className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-3 py-2 rounded-lg"
                >
                  {t.topic}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-xs mt-3">
              AI keeps asking about these topics. Explain them more clearly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}