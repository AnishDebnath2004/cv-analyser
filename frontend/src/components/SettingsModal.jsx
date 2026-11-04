import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Sparkles
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  initialTab = 'theme', // 'theme' | 'mfa'
  onClose,
  themePreference = 'dark',
  resolvedTheme = 'dark',
  onThemeChange,
  currentUser,
  authToken,
  onUserUpdated,
  onOpenAuth
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // MFA setup state
  const [mfaStep, setMfaStep] = useState('idle'); // 'idle' | 'setup' | 'success'
  const [setupData, setSetupData] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Sync tab when initialTab prop changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setMfaError('');
      setMfaSuccess('');
      setMfaStep('idle');
      setVerifyCode('');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleStartMfaSetup = async () => {
    setMfaError('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to initialize MFA setup');
      }
      setSetupData(data);
      setMfaStep('setup');
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyAndEnableMfa = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setMfaError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setMfaError('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: setupData.secret,
          code: verifyCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid verification code');
      }
      setMfaSuccess('Two-Factor Authentication is now actively protecting your account!');
      setMfaStep('success');
      if (onUserUpdated) {
        onUserUpdated({ ...currentUser, mfa_enabled: true });
      }
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      return;
    }
    setMfaError('');
    setMfaLoading(true);
    try {
      const res = await fetch('/api/auth/mfa/disable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to disable 2FA');
      }
      setMfaSuccess('Two-Factor Authentication has been disabled.');
      if (onUserUpdated) {
        onUserUpdated({ ...currentUser, mfa_enabled: false });
      }
      setTimeout(() => {
        setMfaStep('idle');
      }, 1000);
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  const handleCopySecretKey = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content settings-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="settings-header">
          <div className="auth-icon-badge" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)' }}>
            <Settings size={26} color="var(--accent-cyan)" />
          </div>
          <h2 className="auth-title">Application Settings</h2>
          <p className="auth-subtitle">
            Configure your interface theme preferences and manage Two-Factor Authentication (MFA).
          </p>
        </div>

        {/* Tab Selection */}
        <div className="auth-tab-bar" style={{ marginBottom: 24 }}>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            <Sun size={15} />
            <span>Theme & Appearance</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === 'mfa' ? 'active' : ''}`}
            onClick={() => setActiveTab('mfa')}
          >
            <ShieldCheck size={15} />
            <span>Two-Factor Auth (MFA)</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: THEME SELECTION                                   */}
        {/* ========================================================= */}
        {activeTab === 'theme' && (
          <div className="settings-section animate-fade-in">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>
                Interface Theme
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Choose how PathFinder AI is displayed on your device.
              </p>
            </div>

            <div className="theme-options-grid">
              {/* Option 1: Light */}
              <button
                type="button"
                className={`theme-card ${themePreference === 'light' ? 'active' : ''}`}
                onClick={() => onThemeChange('light')}
              >
                <div className="theme-card-icon-wrapper" style={{ background: '#fef08a', color: '#854d0e' }}>
                  <Sun size={20} />
                </div>
                <div className="theme-card-text">
                  <div className="theme-card-title">Light Mode</div>
                  <div className="theme-card-desc">Crisp white background with high contrast readability</div>
                </div>
                <div className="theme-radio-indicator">
                  {themePreference === 'light' && <div className="theme-radio-dot" />}
                </div>
              </button>

              {/* Option 2: Dark */}
              <button
                type="button"
                className={`theme-card ${themePreference === 'dark' ? 'active' : ''}`}
                onClick={() => onThemeChange('dark')}
              >
                <div className="theme-card-icon-wrapper" style={{ background: '#1e293b', color: '#38bdf8' }}>
                  <Moon size={20} />
                </div>
                <div className="theme-card-text">
                  <div className="theme-card-title">Dark Mode</div>
                  <div className="theme-card-desc">Deep dark palette with luminous cyan accents (Default)</div>
                </div>
                <div className="theme-radio-indicator">
                  {themePreference === 'dark' && <div className="theme-radio-dot" />}
                </div>
              </button>

              {/* Option 3: System Default */}
              <button
                type="button"
                className={`theme-card ${themePreference === 'system' ? 'active' : ''}`}
                onClick={() => onThemeChange('system')}
              >
                <div className="theme-card-icon-wrapper" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                  <Monitor size={20} />
                </div>
                <div className="theme-card-text">
                  <div className="theme-card-title">System Default</div>
                  <div className="theme-card-desc">Automatically adjusts to your device's light or dark mode</div>
                </div>
                <div className="theme-radio-indicator">
                  {themePreference === 'system' && <div className="theme-radio-dot" />}
                </div>
              </button>
            </div>

            {/* Resolved Status Bar */}
            <div style={{
              marginTop: 20,
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Active rendering mode:
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 600,
                color: resolvedTheme === 'dark' ? '#38bdf8' : '#eab308'
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: resolvedTheme === 'dark' ? '#38bdf8' : '#eab308'
                }} />
                {resolvedTheme === 'dark' ? 'Dark Theme' : 'Light Theme'}
                {themePreference === 'system' && ' (Synced with OS)'}
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MULTI-FACTOR AUTHENTICATION (MFA)                 */}
        {/* ========================================================= */}
        {activeTab === 'mfa' && (
          <div className="settings-section animate-fade-in">
            {mfaError && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{mfaError}</span>
              </div>
            )}

            {mfaSuccess && (
              <div className="auth-alert auth-alert-success" style={{ marginBottom: 16 }}>
                <CheckCircle2 size={16} />
                <span>{mfaSuccess}</span>
              </div>
            )}

            {currentUser ? (
              <div>
                {/* Status Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: currentUser.mfa_enabled ? 'rgba(62, 207, 142, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                  border: `1px solid ${currentUser.mfa_enabled ? 'rgba(62, 207, 142, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {currentUser.mfa_enabled ? (
                      <ShieldCheck size={28} color="#3ecf8e" />
                    ) : (
                      <ShieldAlert size={28} color="#f59e0b" />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.96rem', color: currentUser.mfa_enabled ? '#3ecf8e' : '#f59e0b' }}>
                        {currentUser.mfa_enabled ? '2FA is Active & Protected' : '2FA is Not Configured'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {currentUser.mfa_enabled
                          ? `Account ${currentUser.email} requires TOTP verification`
                          : 'Standard RFC 6238 TOTP (Google Authenticator, Authy, Microsoft)'}
                      </div>
                    </div>
                  </div>
                </div>

                {currentUser.mfa_enabled && mfaStep !== 'setup' ? (
                  <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                      Two-Factor Authentication is currently enforced for your account. You will need your authenticator app each time you sign in.
                    </p>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={handleDisableMfa}
                      disabled={mfaLoading}
                      style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                    >
                      {mfaLoading ? 'Disabling 2FA...' : 'Disable Two-Factor Authentication'}
                    </button>
                  </div>
                ) : mfaStep === 'idle' ? (
                  <div style={{ textAlign: 'center', padding: '6px 0 16px' }}>
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                      Add an additional security layer to your profile. Every time you log in, you will be prompted for a 6-digit code.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={handleStartMfaSetup}
                      disabled={mfaLoading}
                      style={{ width: '100%', justifyContent: 'center', padding: '12px 18px' }}
                    >
                      <ShieldCheck size={16} />
                      <span>{mfaLoading ? 'Generating Secret...' : 'Set Up Two-Factor Authentication'}</span>
                    </button>
                  </div>
                ) : mfaStep === 'setup' ? (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{
                        display: 'inline-block',
                        padding: 10,
                        background: '#ffffff',
                        borderRadius: 12,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                      }}>
                        <img
                          src={setupData.qr_preview_url}
                          alt="2FA QR Code"
                          style={{ width: 160, height: 160, display: 'block' }}
                        />
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        Scan with Google Authenticator, Microsoft Authenticator, or Authy.
                      </p>
                    </div>

                    <div style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 16
                    }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 4 }}>Or enter key manually:</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <code style={{ fontSize: '0.88rem', color: 'var(--accent-cyan)', letterSpacing: 1.5, wordBreak: 'break-all' }}>
                          {setupData.manual_entry_key}
                        </code>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={handleCopySecretKey}
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                          title="Copy secret key"
                        >
                          {copiedKey ? <Check size={14} color="#3ecf8e" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyAndEnableMfa}>
                      <div className="auth-field" style={{ marginBottom: 16 }}>
                        <label className="auth-label">6-Digit Verification Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          className="auth-input"
                          placeholder="e.g. 123456"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                          style={{ textAlign: 'center', fontSize: '1.25rem', letterSpacing: 4, fontWeight: 700 }}
                          required
                          autoFocus
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 10 }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setMfaStep('idle')}
                          style={{ flex: 1, justifyContent: 'center' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={mfaLoading || verifyCode.length !== 6}
                          style={{ flex: 2, justifyContent: 'center' }}
                        >
                          {mfaLoading ? 'Activating...' : 'Activate 2FA'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={onClose}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* If User is Not Logged In */
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <div className="auth-icon-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                  <ShieldAlert size={26} color="#f59e0b" />
                </div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>
                  Sign In Required for 2FA
                </h4>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
                  Two-Factor Authentication is attached to your user account and synced with Supabase. Please log in or create a free account to activate MFA.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth('login');
                  }}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 18px' }}
                >
                  <LogIn size={16} />
                  <span>Log In or Sign Up</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
