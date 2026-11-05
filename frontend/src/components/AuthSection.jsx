import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export default function AuthSection({
  currentUser,
  onAuthSuccess,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickDemo = () => {
    setEmail('demo@pathfinder.ai');
    setPassword('demo1234');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (activeTab === 'signup') {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters long.');

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim(),
            password: password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Sign up failed');

        setSuccessMsg(`Welcome, ${data.user.full_name}! Your account is now active.`);
        onAuthSuccess(data.user, data.token);
      } else {
        if (!email.trim()) throw new Error('Please enter your email address.');
        if (!password) throw new Error('Please enter your password.');

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Invalid email or password');

        setSuccessMsg(`Welcome back, ${data.user.full_name}!`);
        onAuthSuccess(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentUser) {
    return null;
  }

  return (
    <div className="glass-panel auth-section-container animate-fade-in">
      <div className="auth-section-header">
        <div className="auth-section-badge">
          <span className="badge badge-primary">
            <ShieldCheck size={13} />
            <span>Account & Profile Portal</span>
          </span>
        </div>
        <h2 className="auth-section-title">
          {activeTab === 'login' ? 'Sign In to Your Career Dashboard' : 'Create Your Free Account'}
        </h2>
        <p className="auth-section-subtitle">
          Save your skill match evaluations, compare multiple job profiles, and preserve career development tracks.
        </p>
      </div>

      <div className="auth-section-tabs">
        <button
          type="button"
          className={`auth-section-tab ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('login');
            setError('');
            setSuccessMsg('');
          }}
        >
          <LogIn size={16} />
          <span>Log In</span>
        </button>
        <button
          type="button"
          className={`auth-section-tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('signup');
            setError('');
            setSuccessMsg('');
          }}
        >
          <UserPlus size={16} />
          <span>Sign Up</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="auth-alert auth-alert-success">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-inline-form">
        <div className="auth-inline-grid">
          {activeTab === 'signup' && (
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Alex Morgan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={16} className="auth-input-icon" />
              <input
                type="email"
                className="auth-input"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={16} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="auth-input"
                placeholder={activeTab === 'signup' ? 'Min 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'login' && (
          <div className="demo-credentials-box">
            <span className="demo-title">
              <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
              <span>Quick Test:</span>
            </span>
            <button
              type="button"
              className="demo-pill-btn"
              onClick={handleQuickDemo}
            >
              Fill Demo User (Alex Morgan)
            </button>
          </div>
        )}

        <div className="auth-actions-row">
          <button
            type="submit"
            className="btn-primary auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Processing...</span>
            ) : activeTab === 'signup' ? (
              <>
                <UserPlus size={16} />
                <span>Create Free Account</span>
              </>
            ) : (
              <>
                <LogIn size={16} />
                <span>Log In</span>
              </>
            )}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', display: 'inline-block' }}></span>
          <span>Authentication & Sessions backed by Supabase PostgreSQL</span>
        </div>
      </form>
    </div>
  );
}

