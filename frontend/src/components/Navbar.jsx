import React from 'react';
import {
  Sparkles,
  Compass,
  LogIn,
  UserPlus,
  LogOut,
  User,
  Settings,
  FileText
} from 'lucide-react';

export default function Navbar({
  onReset,
  hasResult,
  currentUser,
  onOpenAuth,
  onOpenSettings,
  onOpenBuilder,
  onLogout
}) {
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

        {/* ATS Resume Builder Button */}
        <button
          type="button"
          className="btn-ghost nav-builder-btn"
          onClick={onOpenBuilder}
          title="Create an ATS-Friendly Resume"
        >
          <FileText size={16} />
          <span>Build Resume</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          className="btn-ghost nav-settings-btn"
          onClick={() => onOpenSettings('theme')}
          title="Open Settings (Theme & 2FA Security)"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
