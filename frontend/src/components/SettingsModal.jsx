import React, { useState, useEffect } from 'react';
import { X, Key, ShieldCheck, Check, AlertCircle, RefreshCw, ExternalLink, Database, Server } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSettingsUpdated }) {
  const [onetApiKey, setOnetApiKey] = useState('');
  const [onetUsername, setOnetUsername] = useState('');
  const [onetPassword, setOnetPassword] = useState('');
  const [onetVersion, setOnetVersion] = useState('v2');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [authProvider, setAuthProvider] = useState('sqlite');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch current config status
      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          setOnetVersion(data.onet_version || 'v2');
          setAuthProvider(data.auth_provider || 'sqlite');
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // First save to runtime
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onet_api_key: onetApiKey,
          onet_username: onetUsername,
          onet_password: onetPassword,
          onet_version: onetVersion,
          gemini_api_key: geminiApiKey,
          supabase_url: supabaseUrl,
          supabase_key: supabaseKey,
        }),
      });

      const res = await fetch('/api/onet/test', { method: 'POST' });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to test connection: ' + err.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onet_api_key: onetApiKey,
          onet_username: onetUsername,
          onet_password: onetPassword,
          onet_version: onetVersion,
          gemini_api_key: geminiApiKey,
          supabase_url: supabaseUrl,
          supabase_key: supabaseKey,
        }),
      });

      const res = await fetch('/api/supabase/test', { method: 'POST' });
      const data = await res.json();
      setSupabaseTestResult(data);
      if (data.success) {
        setAuthProvider('supabase');
      }
    } catch (err) {
      setSupabaseTestResult({
        success: false,
        message: 'Failed to connect: ' + err.message,
      });
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onet_api_key: onetApiKey,
          onet_username: onetUsername,
          onet_password: onetPassword,
          onet_version: onetVersion,
          gemini_api_key: geminiApiKey,
          supabase_url: supabaseUrl,
          supabase_key: supabaseKey,
        }),
      });
      const data = await res.json();
      onSettingsUpdated(data);
      onClose();
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Key size={20} color="var(--primary)" />
            <span>API & Intelligence Configuration</span>
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Configure live O*NET Web Services credentials and optional Gemini AI Agent keys.
          </p>
        </div>

        <form onSubmit={handleSave}>
          {/* O*NET API Settings */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>O*NET Web Services API</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className={`badge ${onetVersion === 'v2' ? 'badge-primary' : 'btn-ghost'}`}
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                  onClick={() => setOnetVersion('v2')}
                >
                  API v2.0 (Token)
                </button>
                <button
                  type="button"
                  className={`badge ${onetVersion === 'v1.9' ? 'badge-primary' : 'btn-ghost'}`}
                  style={{ cursor: 'pointer', padding: '4px 10px' }}
                  onClick={() => setOnetVersion('v1.9')}
                >
                  API v1.9 (Basic Auth)
                </button>
              </div>
            </div>

            {onetVersion === 'v2' ? (
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                  O*NET v2.0 API Key (X-API-Key)
                </label>
                <input
                  type="password"
                  className="chat-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  placeholder="Paste your O*NET v2 API Key..."
                  value={onetApiKey}
                  onChange={(e) => setOnetApiKey(e.target.value)}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Username
                  </label>
                  <input
                    type="text"
                    className="chat-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="O*NET username"
                    value={onetUsername}
                    onChange={(e) => setOnetUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                    Password
                  </label>
                  <input
                    type="password"
                    className="chat-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="O*NET password"
                    value={onetPassword}
                    onChange={(e) => setOnetPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="https://services.onetcenter.org/"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <span>Get O*NET Developer Credentials</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                onClick={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? <RefreshCw size={13} className="radar-spinner" style={{ width: 13, height: 13, margin: 0 }} /> : <RefreshCw size={13} />}
                <span>Test O*NET Ping</span>
              </button>
            </div>

            {testResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: testResult.success ? '#34d399' : '#fbbf24',
                }}
              >
                {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Gemini AI Agent Key */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
              Google Gemini AI Agent Key (Optional)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Enhances CV analysis with deep personalized executive synthesis and powers the interactive AI career chat.
            </p>
            <input
              type="password"
              className="chat-input"
              style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }}
              placeholder="Paste Google Gemini API Key (e.g. AIzaSy...)"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
            />
            <div style={{ textAlign: 'right' }}>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <span>Get a free Gemini API Key</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Supabase User Authentication & Session Database */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Database size={16} color="#3ecf8e" />
                <span>Supabase Auth & Session Database</span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: 12,
                  background: authProvider === 'supabase' ? 'rgba(62, 207, 142, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: authProvider === 'supabase' ? '#3ecf8e' : 'var(--text-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Server size={10} />
                Active: {authProvider === 'supabase' ? 'Supabase PostgreSQL' : 'SQLite Local'}
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
              Connect your Supabase project to store registered users, passwords, and sessions in a production PostgreSQL cloud database.
            </p>

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Supabase Project URL
              </label>
              <input
                type="text"
                className="chat-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="https://xyzproject.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 6 }}>
                Supabase Anon / Public API Key
              </label>
              <input
                type="password"
                className="chat-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: '0.78rem', color: '#3ecf8e', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
              >
                <span>Get Supabase URL & Anon Key</span>
                <ExternalLink size={12} />
              </a>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                onClick={handleTestSupabase}
                disabled={isTestingSupabase}
              >
                {isTestingSupabase ? <RefreshCw size={13} className="radar-spinner" style={{ width: 13, height: 13, margin: 0 }} /> : <RefreshCw size={13} />}
                <span>Test Supabase Ping</span>
              </button>
            </div>

            {supabaseTestResult && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: supabaseTestResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: supabaseTestResult.success ? '#34d399' : '#f87171',
                }}
              >
                {supabaseTestResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{supabaseTestResult.message}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
              <ShieldCheck size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
