import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import MathBackground from '../components/common/MathBackground';

export default function Dashboard() {
  const [subjects, setSubjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  useEffect(() => { fetchSubjects(); }, []);

  async function fetchSubjects() {
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data.subjects);
    } finally {
      setLoading(false);
    }
  }

  async function createSubject() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post('/api/subjects', { name, description });
      navigate(`/subject/${res.data.subject.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function deleteSubject(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this subject?')) return;
    await api.delete(`/api/subjects/${id}`);
    setSubjects(subjects.filter(s => s.id !== id));
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden relative">
      <MathBackground />

      {/* Sidebar */}
      <div className="relative flex flex-col w-72 border-r border-white/5 shrink-0" style={{
        zIndex: 10,
        background: 'rgba(5, 10, 25, 0.85)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎓</span>
            <span className="font-bold text-lg tracking-tight">StudyBud</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-7">AI Learning Platform</p>
        </div>

        {/* Subjects list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</span>
            <button
              onClick={() => setShowForm(true)}
              className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition text-lg leading-none"
              title="New Subject"
            >
              +
            </button>
          </div>

          {loading ? (
            <div className="text-center text-gray-600 text-xs py-8">Loading...</div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-xs">No subjects yet</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-400 text-xs hover:underline"
              >
                Create your first subject
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {subjects.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/subject/${s.id}`)}
                  className="group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">📁</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-xs text-gray-500 truncate">{s.description}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteSubject(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 text-xs transition ml-2 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile at bottom */}
        <div className="border-t border-white/5 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Profile</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="text-xs text-gray-500 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main area — welcome screen */}
      <div className="flex-1 flex items-center justify-center relative" style={{ zIndex: 2 }}>
        <div className="text-center max-w-md px-6">
          <div className="text-6xl mb-6">🧑‍🎓</div>
          <h1 className="text-3xl font-bold mb-3">
            Your AI Student
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}> is ready</span>
          </h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Select a subject from the sidebar or create a new one to start teaching your AI student.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-2xl font-semibold text-sm transition"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              boxShadow: '0 0 30px rgba(99,102,241,0.4)',
            }}
          >
            + Create New Subject
          </button>
        </div>
      </div>

      {/* Create subject modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 50 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md mx-4 p-6 rounded-2xl" style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
          }}>
            <h2 className="text-lg font-bold mb-1">New Subject</h2>
            <p className="text-gray-400 text-sm mb-5">Create a subject to start uploading study materials</p>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSubject()}
                placeholder="e.g. Quantum Physics, Data Structures..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <div className="flex gap-3 pt-1">
                <button
                  onClick={createSubject}
                  disabled={creating || !name.trim()}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm transition disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                >
                  {creating ? 'Creating...' : 'Create & Open'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-5 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}