import React, { useState, useRef } from 'react';
import { UploadCloud, ArrowRight, Zap, FileCheck, FileText, Sparkles, AlertCircle } from 'lucide-react';

export default function UploadSection({
  onAnalyzeFile,
  onAnalyzeText,
  isLoading,
  loadingStep,
  currentUser,
  onAuthSuccess,
  onLogout
}) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [dragOver, setDragOver] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB Vercel Serverless payload cap

  const validateAndUpload = (file) => {
    setFileError('');
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`Selected file is ${sizeMB}MB. Maximum upload size is 4.5MB. Please compress the file or use 'Paste Text'.`);
      return;
    }

    onAnalyzeFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const handlePasteSubmit = (e) => {
    e.preventDefault();
    setFileError('');
    if (!pastedText.trim()) {
      setFileError('Please paste your resume content before analyzing.');
      return;
    }
    if (onAnalyzeText) {
      onAnalyzeText(pastedText.trim());
    }
  };

  const sampleProfiles = [
    {
      title: 'Full Stack Engineer',
      text: `Alex Morgan\nSenior Full Stack Developer\nEmail: alex@example.com | San Francisco, CA\n\nSUMMARY\nFull Stack Developer with 5+ years of experience designing scalable web applications, REST/GraphQL APIs, and cloud services using Python, React, TypeScript, Node.js, and Docker.\n\nTECHNICAL SKILLS\n- Languages: Python, JavaScript, TypeScript, SQL, HTML5, CSS3\n- Frameworks: React, Next.js, FastAPI, Node.js, Express, Django\n- Cloud & DevOps: AWS, Docker, Kubernetes, CI/CD, Git, Terraform, Linux\n- Databases: PostgreSQL, Redis, MongoDB, SQLAlchemy\n\nEXPERIENCE\nSenior Software Engineer — TechCore Labs (2022 - Present)\n- Spearheaded migration of legacy monolith to microservices using FastAPI and Docker, reducing API response times by 42%.\n- Built high-traffic React dashboard serving 150k daily active users.\n- Designed automated CI/CD pipeline using GitHub Actions, cutting release cycles from 2 weeks to daily deployments.`
    },
    {
      title: 'Data Scientist & ML',
      text: `Sarah Chen\nData Scientist & Machine Learning Engineer\nEmail: sarah@example.com | Boston, MA\n\nSUMMARY\nData Scientist with 4 years experience building predictive machine learning models, statistical analysis, and big data pipelines using Python, PyTorch, Scikit-Learn, and SQL.\n\nSKILLS\n- Languages: Python, R, SQL, Bash\n- ML / AI: PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, NLP, LLM, Computer Vision\n- Data & Cloud: Apache Spark, Snowflake, BigQuery, AWS S3, Tableau, Power BI\n\nEXPERIENCE\nData Scientist — DataPulse Analytics (2022 - Present)\n- Developed customer churn prediction model using XGBoost, improving retention by 18%.\n- Built real-time analytics pipeline using Spark and BigQuery processing 5M+ daily events.`
    },
    {
      title: 'DevOps & Cloud Architect',
      text: `David Miller\nDevOps Engineer & Cloud Infrastructure Architect\nEmail: david@example.com | Austin, TX\n\nSUMMARY\nCloud & DevOps Engineer specialized in AWS infrastructure automation, Kubernetes orchestration, Terraform IaC, and security hardening.\n\nTECHNICAL SKILLS\n- Cloud: AWS, GCP, Azure\n- Infrastructure as Code: Terraform, CloudFormation, Ansible\n- Containers: Docker, Kubernetes, Helm, Amazon ECS\n- CI/CD & Monitoring: Jenkins, GitHub Actions, Prometheus, Grafana, ELK Stack\n- Scripting: Python, Bash, Shell, Go\n\nEXPERIENCE\nLead DevOps Engineer — CloudScale Solutions (2021 - Present)\n- Architected multi-region Kubernetes clusters on AWS EKS with 99.99% uptime SLA.\n- Implemented zero-downtime blue/green deployment strategy across 40+ microservices.`
    }
  ];

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
          Upload your resume or paste text to activate our AI Career Agent. We scan your competencies, cross-reference 
          against official O*NET occupational standards, and reveal your highest-fit roles, skill gaps, and salary trajectory.
        </p>
      </section>

      {/* Main Upload / Input Card */}
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
                <span>Resume Analysis & Skill Ingestion</span>
              </span>
              <span className="badge badge-primary">Max 4.5MB • PDF • DOCX • TXT</span>
            </div>

            {/* Ingestion Tabs */}
            <div className="auth-tab-bar" style={{ maxWidth: 360, margin: '0 auto 20px' }}>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => { setActiveTab('upload'); setFileError(''); }}
              >
                <UploadCloud size={15} />
                <span>Upload Document</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'paste' ? 'active' : ''}`}
                onClick={() => { setActiveTab('paste'); setFileError(''); }}
              >
                <FileText size={15} />
                <span>Paste Resume Text</span>
              </button>
            </div>

            {fileError && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{fileError}</span>
              </div>
            )}

            {/* Tab 1: File Dropzone */}
            {activeTab === 'upload' && (
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
                  Supports PDF, DOCX, and TXT (Max 4.5MB). Instant parsing & zero data selling.
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
            )}

            {/* Tab 2: Paste Resume Text */}
            {activeTab === 'paste' && (
              <form onSubmit={handlePasteSubmit} style={{ marginTop: 8 }}>
                <textarea
                  className="auth-input"
                  style={{
                    width: '100%',
                    minHeight: 180,
                    padding: 14,
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 16
                  }}
                  placeholder="Paste your resume text, work experience, technical skills, or LinkedIn profile summary here..."
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  autoFocus
                />
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '12px 20px' }}
                  disabled={!pastedText.trim()}
                >
                  <span>Analyze Resume Text</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Quick Test Samples */}
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} style={{ color: 'var(--accent-amber)' }} />
                <span>Quick Test with Pre-configured Resumes:</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sampleProfiles.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="demo-pill-btn"
                    onClick={() => {
                      if (onAnalyzeText) {
                        onAnalyzeText(sample.text);
                      }
                    }}
                    title={`Analyze sample ${sample.title} profile`}
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    <span>{sample.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
