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

  const COLORS = [
    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.3)', icon: '📐' },
    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', icon: '⚛️' },
    { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.3)', icon: '🧬' },
    { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)', icon: '🔬' },
    { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)', icon: '🧮' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
      <MathBackground />

      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(15,23,42,0.6) 0%, rgba(3,7,18,0.85) 100%)',
        zIndex: 1,
      }} />

      {/* Navbar */}
      <nav className="relative border-b border-white/5 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between" style={{
        zIndex: 10,
        background: 'rgba(3,7,18,0.7)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="flex items-center gap-2">
          <img src="/Kurio.png" alt="Kurio" className="w-7 h-7 rounded-full object-cover" />
          <span className="font-bold text-lg tracking-tight">Kuriosity</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
  <a
    href="https://gokul.quest"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition"
    style={{
      background: 'rgba(99,102,241,0.15)',
      border: '1px solid rgba(99,102,241,0.3)',
      color: '#a5b4fc'
    }}
  >
    Contact
  </a>
          <div className="flex items-center gap-2">
            <img src="/Teacher.png" alt="Teacher" className="w-7 h-7 rounded-full object-cover" />
            <span className="text-sm text-gray-300 hidden md:block">{user?.name}</span>
          </div>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="text-xs text-gray-500 hover:text-white transition"
          >Logout</button>
        </div>
      </nav>

      {/* Main */}
      <div className="relative max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12" style={{ zIndex: 2 }}>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl md:text-4xl font-bold mb-2 tracking-tight">
            My{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Subjects</span>
          </h1>
          <p className="text-gray-400 text-sm">Upload materials and teach Kurio</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Subjects', value: subjects.length, icon: '📚' },
            { label: 'Kurio', value: 'Active', icon: '🧑‍🎓' },
            { label: 'Memory', value: 'ON', icon: '🧠' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 16,
              padding: '12px 16px',
              backdropFilter: 'blur(10px)',
            }}>
              <div className="text-xl md:text-2xl mb-1">{stat.icon}</div>
              <div className="text-lg md:text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm md:text-base font-semibold text-gray-300">All Subjects</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 text-sm font-medium px-4 py-2 rounded-xl transition"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
          >
            + New Subject
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-4 p-4 md:p-6 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="space-y-3">
              <input
                type="text"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSubject()}
                placeholder="e.g. Quantum Physics, Data Structures..."
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition text-sm placeholder-gray-600"
              />
              <div className="flex gap-3">
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
                >Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Subjects list */}
        {loading ? (
          <div className="text-center text-gray-500 py-20 text-sm">Loading...</div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">📚</div>
            <p className="text-gray-400">No subjects yet.</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-400 text-sm hover:underline"
            >Create your first subject</button>
          </div>
        ) : (
          <div className="grid gap-3">
            {subjects.map((subject, i) => {
              const color = COLORS[i % COLORS.length];
              return (
                <div
                  key={subject.id}
                  className="group flex items-center justify-between p-4 md:p-5 rounded-2xl transition-all cursor-pointer"
                  style={{ background: color.bg, border: `1px solid ${color.border}`, backdropFilter: 'blur(10px)' }}
                  onClick={() => navigate(`/subject/${subject.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-2xl shrink-0">{color.icon}</div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white truncate">{subject.name}</h3>
                      {subject.description && (
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{subject.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/subject/${subject.id}`)}
                      className="text-xs px-3 py-1.5 rounded-xl text-white transition hidden md:block"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >Open →</button>
                    <button
                      onClick={(e) => deleteSubject(e, subject.id)}
                      className="text-gray-600 hover:text-red-400 text-sm transition"
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}