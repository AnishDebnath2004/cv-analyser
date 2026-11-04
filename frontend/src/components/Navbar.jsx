import React from 'react';
import {
  Sparkles,
  Compass,
  Moon,
  Sun,
  CheckCircle,
  Database,
  LogIn,
  UserPlus,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({
  theme,
  setTheme,
  onReset,
  hasResult,
  onetStatus,
  currentUser,
  onOpenAuth,
  onOpenMfa,
  onLogout
}) {
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="navbar">
      <div className="nav-brand" onClick={onReset} style={{ cursor: 'pointer' }}>
        <div className="brand-icon-wrapper">
          <Compass size={22} />
        </div>
        <div>
          <div className="brand-title">
            Path<span className="gradient-text-accent">Finder</span> <span style={{ fontSize: '0.9rem', color: 'var(--accent-cyan)' }}>AI</span>
          </div>
          <div className="brand-subtitle">O*NET Career Intelligence Agent</div>
        </div>
      </div>

      <div className="nav-actions">
        {/* Supabase PostgreSQL Cloud Badge */}
        <div 
          className="badge"
          style={{
            background: 'rgba(62, 207, 142, 0.12)',
            color: '#3ecf8e',
            border: '1px solid rgba(62, 207, 142, 0.3)',
            gap: 6
          }}
          title="Directly connected to Supabase PostgreSQL Database & Auth Cloud"
        >
          <Database size={13} color="#3ecf8e" />
          <span>Supabase Cloud</span>
        </div>

        {/* O*NET Knowledge Base Status Pill */}
        <div 
          className={`badge ${onetStatus?.connected ? 'badge-emerald' : 'badge-primary'}`}
          title={onetStatus?.message || "O*NET Knowledge Base Active"}
        >
          {onetStatus?.connected ? (
            <>
              <CheckCircle size={13} />
              <span>O*NET Live API</span>
            </>
          ) : (
            <>
              <Database size={13} />
              <span>O*NET Knowledge Base</span>
            </>
          )}
        </div>

        {hasResult && (
          <button className="btn-secondary" onClick={onReset}>
            <Sparkles size={16} />
            <span>Analyze Another CV</span>
          </button>
        )}

        {/* Authentication Actions */}
        {currentUser ? (
          <div className="nav-user-container">
            {/* 2FA Security Button */}
            <button
              type="button"
              className="btn-ghost nav-mfa-btn"
              onClick={onOpenMfa}
              title="Configure Two-Factor Authentication (2FA / MFA)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                fontSize: '0.84rem',
                border: currentUser.mfa_enabled ? '1px solid rgba(62, 207, 142, 0.4)' : '1px solid var(--border-subtle)',
                background: currentUser.mfa_enabled ? 'rgba(62, 207, 142, 0.08)' : 'transparent',
                color: currentUser.mfa_enabled ? '#3ecf8e' : 'var(--text-muted)'
              }}
            >
              <ShieldCheck size={16} color={currentUser.mfa_enabled ? '#3ecf8e' : 'currentColor'} />
              <span>{currentUser.mfa_enabled ? '2FA Enabled' : '2FA Security'}</span>
            </button>

            <div className="nav-user-pill" title={`Signed in as ${currentUser.email}`}>
              <div className="nav-user-avatar">
                {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : <User size={14} />}
              </div>
              <span className="nav-user-name">{currentUser.full_name}</span>
            </div>

            <button
              type="button"
              className="btn-ghost nav-logout-btn"
              onClick={onLogout}
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        ) : (
          <div className="nav-auth-buttons">
            <button
              type="button"
              className="btn-ghost nav-login-btn"
              onClick={() => onOpenAuth('login')}
            >
              <LogIn size={15} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              className="btn-primary nav-signup-btn"
              onClick={() => onOpenAuth('signup')}
            >
              <UserPlus size={15} />
              <span>Sign Up</span>
            </button>
          </div>
        )}

        {/* Light / Dark Theme Toggle */}
        <button 
          className="btn-ghost" 
          onClick={toggleTheme} 
          title="Toggle Light / Dark theme"
          style={{ padding: '8px 10px' }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
