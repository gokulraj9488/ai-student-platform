import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';

export default function SubjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [subject, setSubject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectDesc, setNewSubjectDesc] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const fileRef = useRef();
  const bottomRef = useRef();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    fetchAllSubjects();
    fetchSubject();
    fetchSessions();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  async function fetchAllSubjects() {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data.subjects);
    } catch {}
  }

  async function fetchSubject() {
    try {
      const res = await api.get(`/api/subjects/${id}`);
      setSubject(res.data.subject);
      setMaterials(res.data.materials);
      if (res.data.materials.length > 0) {
        setSelectedMaterial(res.data.materials[0]);
      }
    } catch {}
  }

  async function fetchSessions() {
    try {
      const res = await api.get('/api/sessions');
      const subjectSessions = res.data.sessions.filter(s => s.subject_id === id);
      setSessions(subjectSessions);
      if (subjectSessions.length > 0) {
        loadSession(subjectSessions[0]);
      } else {
        createAutoSession();
      }
    } catch {}
  }

  async function createAutoSession() {
    try {
      const res = await api.post('/api/sessions', {
        title: 'Session 1',
        subjectId: id,
      });
      setActiveSession(res.data.session);
      setSessions([res.data.session]);
    } catch {}
  }

  async function loadSession(session) {
    setActiveSession(session);
    setSending(false);
    setMessages([]);
    setInput('');
    try {
      const res = await api.get(`/api/chat/session/${session.id}`);
      setMessages(res.data.messages);
    } catch {}
  }

  async function sendMessage() {
    if (!input.trim() || sending || !activeSession) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    const tempUserMsg = { id: Date.now(), role: 'user', content: text };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await api.post(`/api/chat/session/${activeSession.id}`, {
        message: text,
        subjectId: id,
      });
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempUserMsg.id),
        tempUserMsg,
        res.data.aiMessage,
      ]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        role: 'assistant',
        content: err.response?.data?.error || 'Something went wrong.',
      }]);
    } finally {
      setSending(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post(`/api/upload/${id}/upload`, formData);
      const newMaterial = res.data.material;
      setMaterials(prev => [newMaterial, ...prev]);
      setSelectedMaterial(newMaterial);

      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await api.get(`/api/upload/${id}/materials`);
          const updated = statusRes.data.materials.find(m => m.id === newMaterial.id);
          if (updated) {
            setMaterials(statusRes.data.materials);
            setSelectedMaterial(updated);
            if (updated.parse_status === 'done' || updated.parse_status === 'failed') {
              clearInterval(pollInterval);
            }
          }
        } catch {
          clearInterval(pollInterval);
        }
      }, 3000);

      setTimeout(() => clearInterval(pollInterval), 180000);

    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function deleteMaterial(matId) {
    if (!confirm('Delete this material?')) return;
    await api.delete(`/api/upload/materials/${matId}`);
    const updated = materials.filter(m => m.id !== matId);
    setMaterials(updated);
    setSelectedMaterial(updated[0] || null);
  }

  async function createNewSubject() {
    if (!newSubjectName.trim()) return;
    try {
      const res = await api.post('/api/subjects', {
        name: newSubjectName,
        description: newSubjectDesc,
      });
      navigate(`/subject/${res.data.subject.id}`);
      setShowNewSubject(false);
      setNewSubjectName('');
      setNewSubjectDesc('');
    } catch {}
  }

  async function deleteSubject(e, subjectId) {
    e.stopPropagation();
    if (!confirm('Delete this subject?')) return;
    await api.delete(`/api/subjects/${subjectId}`);
    if (subjectId === id) {
      navigate('/dashboard');
    } else {
      setSubjects(subjects.filter(s => s.id !== subjectId));
    }
  }

  function statusColor(s) {
    if (s === 'done') return '#34d399';
    if (s === 'processing') return '#fbbf24';
    if (s === 'failed') return '#f87171';
    return '#6b7280';
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">

      {/* LEFT SIDEBAR */}
      <div className="flex flex-col w-64 shrink-0 border-r border-white/5" style={{
        background: 'rgba(5,10,25,0.95)',
      }}>
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <span className="text-lg">🎓</span>
            <span className="font-bold tracking-tight">StudyBud</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</span>
            <button
              onClick={() => setShowNewSubject(true)}
              className="text-gray-400 hover:text-white text-lg leading-none transition"
            >+</button>
          </div>

          <div className="space-y-0.5">
            {subjects.map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/subject/${s.id}`)}
                className="group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition"
                style={{
                  background: s.id === id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: s.id === id ? '2px solid #6366f1' : '2px solid transparent',
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm">📁</span>
                  <span className="text-sm truncate" style={{ color: s.id === id ? '#a5b4fc' : '#9ca3af' }}>
                    {s.name}
                  </span>
                </div>
                <button
                  onClick={(e) => deleteSubject(e, s.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs ml-1 transition shrink-0"
                >✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-300">Profile</span>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-xs text-gray-600 hover:text-white transition"
            >Logout</button>
          </div>
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0" style={{
          background: 'rgba(10,15,35,0.8)',
        }}>
          <div>
            <h1 className="font-semibold text-base">{subject?.name}</h1>
            <p className="text-xs text-gray-500">{subject?.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-gray-400">AI Student ready</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{
          background: 'rgba(3,7,18,0.6)',
        }}>
          {messages.length === 0 && !sending && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-5xl mb-4">🧑‍🎓</div>
              <p className="text-gray-400 font-medium">Your AI student is ready to learn</p>
              <p className="text-gray-600 text-sm mt-1">Upload a study material and start teaching</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2 mt-1">🧑‍🎓</div>
              )}
              <div
                className="max-w-lg px-4 py-2.5 text-sm leading-relaxed"
                style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                    : 'rgba(255,255,255,0.06)',
                  border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                  borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs shrink-0 mr-2">🧑‍🎓</div>
              <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="px-4 py-3 border-t border-white/5 shrink-0" style={{ background: 'rgba(5,10,25,0.9)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}>
            <button
              onClick={() => fileRef.current.click()}
              disabled={uploading}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition shrink-0 text-lg"
              title="Upload study material"
            >
              {uploading ? '⏳' : '+'}
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx,.txt" onChange={handleUpload} className="hidden" />

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Teach your AI student something..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm focus:outline-none resize-none placeholder-gray-600"
              style={{ maxHeight: 120 }}
            />

            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-30"
              style={{ background: input.trim() ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.05)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-700 mt-1.5 ml-1">Enter to send · Shift+Enter for new line · + to upload PDF/PPT</p>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-64 shrink-0 border-l border-white/5 flex flex-col" style={{
        background: 'rgba(5,10,25,0.95)',
      }}>
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Study Materials</span>
            <button onClick={() => fileRef.current.click()} className="text-xs text-blue-400 hover:text-blue-300 transition">+ Upload</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {materials.length === 0 ? (
            <div
              onClick={() => fileRef.current.click()}
              className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-white/10 cursor-pointer hover:border-blue-500/40 transition"
            >
              <span className="text-2xl mb-2">📎</span>
              <p className="text-xs text-gray-500 text-center">Upload docs<br/>PDF, PPT, TXT</p>
            </div>
          ) : (
            materials.map((m) => (
              <div
                key={m.id}
                onClick={() => setSelectedMaterial(m)}
                className="p-3 rounded-xl cursor-pointer transition"
                style={{
                  background: selectedMaterial?.id === m.id ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                  border: selectedMaterial?.id === m.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-200 truncate">{m.original_name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(m.parse_status) }}></div>
                      <span className="text-xs" style={{ color: statusColor(m.parse_status) }}>{m.parse_status}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteMaterial(m.id); }}
                    className="text-gray-600 hover:text-red-400 text-xs shrink-0 transition"
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>

        {selectedMaterial && (
          <div className="border-t border-white/5 px-4 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              {selectedMaterial.original_name}<br />
              <span className="text-gray-600">
                {(selectedMaterial.file_size / 1024).toFixed(0)} KB ·{' '}
                {new Date(selectedMaterial.uploaded_at).toLocaleDateString()}
              </span>
            </p>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor(selectedMaterial.parse_status) }}></div>
              <span className="text-xs" style={{ color: statusColor(selectedMaterial.parse_status) }}>
                {selectedMaterial.parse_status === 'done' ? 'Ready for chat' : selectedMaterial.parse_status}
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-white/5 px-3 py-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Sessions</p>
          <div className="space-y-1">
           {sessions.map((s) => (
              <div
                key={s.id}
                className="group flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer text-xs transition"
                style={{
                  background: activeSession?.id === s.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: activeSession?.id === s.id ? '#a5b4fc' : '#6b7280',
                }}
              >
                <span onClick={() => loadSession(s)} className="flex-1 truncate">{s.title}</span>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Delete this session?')) return;
                    await api.delete(`/api/sessions/${s.id}`);
                    const updated = sessions.filter(x => x.id !== s.id);
                    setSessions(updated);
                    if (activeSession?.id === s.id) {
                      if (updated.length > 0) {
                        loadSession(updated[0]);
                      } else {
                        setActiveSession(null);
                        setMessages([]);
                      }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition ml-1 shrink-0"
                >✕</button>
              </div>
            ))}
            <button
              onClick={async () => {
                const title = `Session ${sessions.length + 1}`;
                const res = await api.post('/api/sessions', { title, subjectId: id });
                const newSession = res.data.session;
                setSessions(prev => [newSession, ...prev]);
                setActiveSession(newSession);
                setMessages([]);
                setSending(false);
              }}
              className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-gray-600 hover:text-gray-400 hover:bg-white/5 transition"
            >
              + New Session
            </button>
          </div>
        </div>
      </div>

      {/* New subject modal */}
      {showNewSubject && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 50 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNewSubject(false)} />
          <div className="relative w-full max-w-sm mx-4 p-6 rounded-2xl" style={{
            background: 'rgba(15,23,42,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h2 className="font-bold mb-4">New Subject</h2>
            <div className="space-y-3">
              <input
                autoFocus
                type="text"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createNewSubject()}
                placeholder="Subject name"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <input
                type="text"
                value={newSubjectDesc}
                onChange={(e) => setNewSubjectDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={createNewSubject}
                  disabled={!newSubjectName.trim()}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition"
                  style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}
                >Create</button>
                <button
                  onClick={() => setShowNewSubject(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                >Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}