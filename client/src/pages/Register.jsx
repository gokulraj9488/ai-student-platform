import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import MathBackground from '../components/common/MathBackground';

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  async function sendOTP() {
    setError('');
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/send-otp', { email });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndRegister() {
    setError('');
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register', { name, email, password, otp });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  async function resendOTP() {
    setResending(true);
    setError('');
    try {
      await api.post('/api/auth/send-otp', { email });
      setError('');
    } catch (err) {
      setError('Failed to resend OTP');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 relative overflow-hidden">
      <MathBackground />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 1 }}>
        <div style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
      </div>

      <div className="w-full max-w-sm relative" style={{ zIndex: 2 }}>

        <div className="text-center mb-6">
          <img src="/Kurio.png" alt="Kurio" className="w-16 h-16 rounded-full mx-auto mb-3 object-cover" style={{ border: '3px solid rgba(139,92,246,0.5)' }} />
          <h1 className="text-3xl font-bold text-white tracking-tight">Kuriosity</h1>
          <p className="text-purple-400 mt-1 text-xs font-medium tracking-widest uppercase">
            {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
          </p>
        </div>

        <div style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: 24,
        }}>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-5">
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                background: step >= 1 ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                color: 'white',
              }}>1</div>
              <span className="text-xs text-gray-500">Details</span>
            </div>
            <div className="flex-1 h-px" style={{ background: step >= 2 ? '#7c3aed' : 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{
                background: step >= 2 ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                color: 'white',
              }}>2</div>
              <span className="text-xs text-gray-500">Verify OTP</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendOTP()}
                  placeholder="Min 6 characters"
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>
              <button
                onClick={sendOTP}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm"
                style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code →'}
              </button>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-gray-600 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              <button
                onClick={() => alert('Google login coming soon!')}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-medium transition"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl mb-2">📧</div>
                <p className="text-gray-300 text-sm">We sent a 6-digit code to</p>
                <p className="text-white font-semibold text-sm">{email}</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1 uppercase tracking-wider text-center">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && verifyAndRegister()}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-purple-500 transition text-center text-2xl tracking-widest font-bold"
                />
              </div>

              <button
                onClick={verifyAndRegister}
                disabled={loading || otp.length !== 6}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm"
                style={{ boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}
              >
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-gray-500 hover:text-white transition"
                >
                  ← Back
                </button>
                <button
                  onClick={resendOTP}
                  disabled={resending}
                  className="text-xs text-purple-400 hover:text-purple-300 transition"
                >
                  {resending ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 transition">Sign in</Link>
          </p>
        </div>

        <p className="text-center mt-4 text-xs text-gray-600">
          Built by{' '}
          <a href="https://gokulraj9488.github.io/Gokulraj-portfolio/" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            Gokulraj
          </a>
        </p>
      </div>
    </div>
  );
}