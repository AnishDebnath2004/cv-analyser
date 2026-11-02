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
  User
} from 'lucide-react';

export default function Navbar({
  theme,
  setTheme,
  onReset,
  hasResult,
  onetStatus,
  authProvider = 'sqlite',
  currentUser,
  onOpenAuth,
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
        {/* Auth Database Status Pill */}
        <div 
          className="badge"
          style={{
            background: authProvider === 'supabase' ? 'rgba(62, 207, 142, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            color: authProvider === 'supabase' ? '#3ecf8e' : 'var(--text-muted)',
            border: `1px solid ${authProvider === 'supabase' ? 'rgba(62, 207, 142, 0.25)' : 'var(--border-subtle)'}`,
            gap: 5
          }}
          title={authProvider === 'supabase' ? 'Connected to Supabase PostgreSQL Cloud Database' : 'Using Local SQLite Database'}
        >
          <Database size={13} color={authProvider === 'supabase' ? '#3ecf8e' : 'currentColor'} />
          <span>{authProvider === 'supabase' ? 'Supabase DB' : 'SQLite DB'}</span>
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
