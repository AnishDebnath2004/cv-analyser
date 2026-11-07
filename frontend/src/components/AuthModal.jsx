import React, { useState } from 'react';
import {
  X, Mail, Lock, User, Eye, EyeOff, LogIn, UserPlus,
  AlertCircle, CheckCircle2, Sparkles, KeyRound, ShieldCheck, ArrowLeft
} from 'lucide-react';
import { safeFetchJson } from '../utils/apiClient';

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  noticeMessage = '',
  onClose,
  onAuthSuccess
}) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot' | 'reset' | 'mfa_challenge'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [tempMfaToken, setTempMfaToken] = useState('');
  const [previewCode, setPreviewCode] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync mode if initialMode changes
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    setError('');
    setSuccessMsg('');
    setPreviewCode('');
  }

  if (!isOpen) return null;

  const handleQuickDemo = () => {
    setEmail('demo@pathfinder.ai');
    setPassword('demo1234');
    setError('');
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const data = await safeFetchJson('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      }, 'Invalid email or password');

      if (data.mfa_required && data.temp_token) {
        setTempMfaToken(data.temp_token);
        setMode('mfa_challenge');
        setSuccessMsg('Two-Factor Authentication required. Please enter your 6-digit code.');
        return;
      }

      setSuccessMsg(`Welcome back, ${data.user.full_name}!`);
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const data = await safeFetchJson('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
        }),
      }, 'Sign up failed');

      setSuccessMsg('Account registered in Supabase! You can now log in anytime with these credentials.');
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMfaVerifySubmit = async (e) => {
    e.preventDefault();
    if (mfaCode.length !== 6) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const data = await safeFetchJson('/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_token: tempMfaToken,
          code: mfaCode.trim()
        })
      }, 'Invalid verification code');

      setSuccessMsg(`Two-factor verified! Welcome back, ${data.user.full_name}!`);
      setTimeout(() => {
        onAuthSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const data = await safeFetchJson('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      }, 'Failed to request password reset code');

      if (data.preview_code) {
        setPreviewCode(data.preview_code);
        setResetCode(data.preview_code);
      }
      setSuccessMsg(data.message || 'Reset code generated! Please enter your new password.');
      setMode('reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setError('Please enter the 6-digit reset code.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const data = await safeFetchJson('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: resetCode.trim(),
          new_password: newPassword
        })
      }, 'Password reset failed');

      setPassword(newPassword);
      setSuccessMsg('Password reset successfully! Please log in with your new password.');
      setTimeout(() => {
        setMode('login');
        setError('');
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content auth-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge">
            {mode === 'signup' ? (
              <UserPlus size={24} />
            ) : mode === 'mfa_challenge' ? (
              <ShieldCheck size={24} color="#3ecf8e" />
            ) : mode === 'forgot' || mode === 'reset' ? (
              <KeyRound size={24} color="#38bdf8" />
            ) : (
              <LogIn size={24} />
            )}
          </div>
          <h2 className="auth-title">
            {mode === 'signup'
              ? 'Create PathFinder Account'
              : mode === 'mfa_challenge'
              ? 'Two-Factor Authentication'
              : mode === 'forgot'
              ? 'Recover Your Password'
              : mode === 'reset'
              ? 'Set New Password'
              : 'Welcome to PathFinder'}
          </h2>
          <p className="auth-subtitle">
            {mode === 'signup'
              ? 'Sign up once to store analyzed resumes, track skills, and connect to Supabase.'
              : mode === 'mfa_challenge'
              ? 'Enter the 6-digit code from your authenticator app to complete sign in.'
              : mode === 'forgot'
              ? 'Enter your account email to receive a 6-digit recovery code.'
              : mode === 'reset'
              ? 'Enter the 6-digit code and choose a new password.'
              : 'Log in to access your saved resume evaluations and customized O*NET career pathways.'}
          </p>
        </div>

        {noticeMessage && (
          <div className="auth-alert auth-alert-info animate-fade-in" style={{ marginBottom: 16 }}>
            <Sparkles size={16} style={{ flexShrink: 0, color: 'var(--primary)' }} />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Tab switch for Login / Signup */}
        {(mode === 'login' || mode === 'signup') && (
          <div className="auth-tab-bar">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
            >
              <LogIn size={15} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError('');
                setSuccessMsg('');
              }}
            >
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </div>
        )}

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

        {previewCode && (mode === 'reset' || mode === 'forgot') && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Password Reset Code: </span>
            <strong style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)', letterSpacing: 2 }}>{previewCode}</strong>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon" />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="auth-label">Password</label>
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{ fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter your password"
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="demo-credentials-box">
              <span className="demo-title">
                <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
                <span>Instant Demo:</span>
              </span>
              <button
                type="button"
                className="demo-pill-btn"
                onClick={handleQuickDemo}
                title="Fill with Alex Morgan demo credentials"
              >
                Use Alex Morgan (demo@pathfinder.ai)
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span>Logging In...</span> : (
                <>
                  <LogIn size={16} />
                  <span>Log In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={17} className="auth-input-icon" />
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

            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon" />
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
                <Lock size={17} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="At least 6 characters"
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span>Creating Account...</span> : (
                <>
                  <UserPlus size={16} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* MFA Challenge Form */}
        {mode === 'mfa_challenge' && (
          <form onSubmit={handleMfaVerifySubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label" style={{ textAlign: 'center', display: 'block' }}>
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                maxLength={6}
                className="auth-input"
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '1.4rem', letterSpacing: 6, fontWeight: 700 }}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting || mfaCode.length !== 6}
            >
              {isSubmitting ? <span>Verifying...</span> : (
                <>
                  <ShieldCheck size={16} />
                  <span>Verify & Sign In</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Account Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? <span>Sending Code...</span> : (
                <>
                  <KeyRound size={16} />
                  <span>Send Recovery Code</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        {/* Reset Password Form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPasswordSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">6-Digit Recovery Code</label>
              <input
                type="text"
                maxLength={6}
                className="auth-input"
                placeholder="e.g. 123456"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: 4, fontWeight: 700 }}
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pwd"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary auth-submit-btn"
              disabled={isSubmitting || resetCode.length !== 6 || newPassword.length < 6}
            >
              {isSubmitting ? <span>Updating Password...</span> : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Reset & Save Password</span>
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccessMsg('');
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
            >
              <ArrowLeft size={14} />
              <span>Back to Login</span>
            </button>
          </form>
        )}

        <div className="auth-footer">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                Sign Up here
              </button>
            </p>
          ) : mode === 'signup' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMsg('');
                }}
              >
                Log In here
              </button>
            </p>
          ) : null}

          <div style={{ textAlign: 'center', marginTop: 14, fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3ecf8e', display: 'inline-block' }}></span>
            <span>Authentication & Sessions directly backed by Supabase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
