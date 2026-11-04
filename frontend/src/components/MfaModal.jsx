import React, { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, Key, QrCode, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';

export default function MfaModal({
  isOpen,
  onClose,
  currentUser,
  authToken,
  onUserUpdated
}) {
  const [step, setStep] = useState('initial'); // 'initial' | 'setup' | 'success'
  const [setupData, setSetupData] = useState(null); // { secret, otpauth_url, qr_preview_url, manual_entry_key }
  const [verifyCode, setVerifyCode] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleStartSetup = async () => {
    setError('');
    setLoading(true);
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
      setStep('setup');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndEnable = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setError('Please enter the 6-digit code from your authenticator app.');
      return;
    }
    setError('');
    setLoading(true);
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
      setSuccessMsg('Two-Factor Authentication is now actively protecting your account!');
      setStep('success');
      if (onUserUpdated) {
        onUserUpdated({ ...currentUser, mfa_enabled: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!window.confirm('Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.')) {
      return;
    }
    setError('');
    setLoading(true);
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
      setSuccessMsg('Two-Factor Authentication has been disabled.');
      if (onUserUpdated) {
        onUserUpdated({ ...currentUser, mfa_enabled: false });
      }
      setTimeout(() => {
        onClose();
        setStep('initial');
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content auth-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-header">
          <div className="auth-icon-badge" style={{ background: currentUser.mfa_enabled ? 'rgba(62, 207, 142, 0.15)' : 'rgba(56, 189, 248, 0.15)' }}>
            <ShieldCheck size={26} color={currentUser.mfa_enabled ? '#3ecf8e' : '#38bdf8'} />
          </div>
          <h2 className="auth-title">Two-Factor Authentication (2FA)</h2>
          <p className="auth-subtitle">
            Secure your account with standard TOTP (compatible with Google Authenticator, Authy, Microsoft Authenticator, and 1Password).
          </p>
        </div>

        {error && (
          <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert auth-alert-success" style={{ marginBottom: 16 }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {currentUser.mfa_enabled && step !== 'setup' ? (
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 20,
              background: 'rgba(62, 207, 142, 0.12)',
              border: '1px solid rgba(62, 207, 142, 0.3)',
              color: '#3ecf8e',
              fontWeight: 600,
              fontSize: '0.9rem',
              marginBottom: 16
            }}>
              <CheckCircle2 size={16} />
              <span>2FA is Currently Active</span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Your account requires a 6-digit TOTP verification code from your authenticator app each time you sign in.
            </p>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleDisableMfa}
              disabled={loading}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              {loading ? 'Disabling...' : 'Disable Two-Factor Authentication'}
            </button>
          </div>
        ) : step === 'initial' ? (
          <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20, lineHeight: 1.5 }}>
              Add an extra layer of security. Every time you log in, you will be prompted for a 6-digit verification code.
            </p>
            <button
              type="button"
              className="btn-primary"
              onClick={handleStartSetup}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px 18px' }}
            >
              {loading ? 'Configuring...' : 'Set Up Two-Factor Authentication'}
            </button>
          </div>
        ) : step === 'setup' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
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
                  style={{ width: 170, height: 170, display: 'block' }}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 10 }}>
                Scan this QR code with Google Authenticator or your preferred app.
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 18
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Or enter key manually:</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <code style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)', letterSpacing: 1.5, wordBreak: 'break-all' }}>
                  {setupData.manual_entry_key}
                </code>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={handleCopyKey}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto' }}
                  title="Copy secret key"
                >
                  {copied ? <Check size={14} color="#3ecf8e" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyAndEnable}>
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
                  onClick={() => setStep('initial')}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading || verifyCode.length !== 6}
                  style={{ flex: 2, justifyContent: 'center' }}
                >
                  {loading ? 'Activating...' : 'Activate 2FA'}
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
    </div>
  );
}
