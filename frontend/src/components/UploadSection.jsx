import React, { useState, useRef } from 'react';
import { UploadCloud, ArrowRight, Zap, FileCheck } from 'lucide-react';
import AuthSection from './AuthSection';

export default function UploadSection({
  onAnalyzeFile,
  isLoading,
  loadingStep,
  currentUser,
  onAuthSuccess,
  onLogout
}) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onAnalyzeFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onAnalyzeFile(file);
    }
  };

  return (
    <div>
      {/* Hero Intro */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="badge badge-primary">
            <Zap size={13} />
            <span>Standard Occupational Classification (SOC) AI Engine</span>
          </span>
        </div>
        <h1 className="hero-title">
          Discover Which Job Profile <br />
          <span className="gradient-text">Matches Your Real Capabilities</span>
        </h1>
        <p className="hero-description">
          Upload your resume to activate our AI Career Agent. We scan your competencies, cross-reference 
          against official O*NET occupational standards, and reveal your highest-fit roles, skill gaps, and salary trajectory.
        </p>
      </section>

      {/* Main Upload Card */}
      <div className="glass-panel upload-card">
        {isLoading ? (
          <div className="scanner-overlay animate-fade-in">
            <div className="radar-spinner"></div>
            <div className="scanner-step">{loadingStep}</div>
            <div className="scanner-subtext">
              Cross-referencing competencies against the O*NET Occupational Network...
            </div>
          </div>
        ) : (
          <div>
            <div className="upload-header-banner">
              <span className="upload-header-title">
                <FileCheck size={18} style={{ color: 'var(--primary)' }} />
                <span>Resume Document Ingestion</span>
              </span>
              <span className="badge badge-primary">PDF • DOCX • TXT</span>
            </div>

            <div
              className={`dropzone ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
              />
              <div className="dropzone-icon">
                <UploadCloud size={32} />
              </div>
              <div className="dropzone-title">
                Drag & Drop your resume here, or <span style={{ color: 'var(--primary)' }}>browse files</span>
              </div>
              <div className="dropzone-subtitle">
                Supports PDF, DOCX, and TXT (Max 15MB). Instant parsing & zero data selling.
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span>Select Resume File</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dedicated SignUp / Login Section */}
      <AuthSection
        currentUser={currentUser}
        onAuthSuccess={onAuthSuccess}
        onLogout={onLogout}
      />
    </div>
  );
}
