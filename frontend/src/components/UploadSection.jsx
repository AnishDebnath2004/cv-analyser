import React, { useState, useRef } from 'react';
import { UploadCloud, ArrowRight, Compass, FileCheck, Layers, AlertCircle, FileText } from 'lucide-react';

export default function UploadSection({
  onAnalyzeFile,
  onAnalyzeText,
  onOpenBuilder,
  isLoading,
  loadingStep,
  currentUser,
  onAuthSuccess,
  onLogout
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef(null);

  const MAX_SIZE_BYTES = 4.5 * 1024 * 1024; // 4.5MB Vercel Serverless payload cap

  const validateAndUpload = (file) => {
    setFileError('');
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileError(`Selected file is ${sizeMB}MB. Maximum upload size is 4.5MB. Please compress the file.`);
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
            <Compass size={13} />
            <span>O*NET Career Taxonomy & Occupational Standards</span>
          </span>
        </div>
        <h1 className="hero-title">
          Find the Roles That Truly <br />
          <span className="gradient-text">Match Your Experience</span>
        </h1>
        <p className="hero-description">
          Benchmark your resume against official occupational standards. Identify your strongest role alignments, 
          understand key competency proficiencies, and explore strategic career growth paths.
        </p>
      </section>

      {/* Main Upload / Input Card */}
      <div className="glass-panel upload-card">
        {isLoading ? (
          <div className="scanner-overlay animate-fade-in">
            <div className="radar-spinner"></div>
            <div className="scanner-step">{loadingStep}</div>
            <div className="scanner-subtext">
              Cross-referencing competencies against occupational benchmarks...
            </div>
          </div>
        ) : (
          <div>
            <div className="upload-header-banner">
              <span className="upload-header-title">
                <FileCheck size={18} style={{ color: 'var(--primary)' }} />
                <span>Resume Benchmark & Skills Alignment</span>
              </span>
              <span className="badge badge-primary">Max 4.5MB • PDF • DOCX • TXT</span>
            </div>

            {fileError && (
              <div className="auth-alert auth-alert-error" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{fileError}</span>
              </div>
            )}

            {/* Resume File Dropzone */}
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
                Drop your resume here, or <span style={{ color: 'var(--primary)' }}>browse files</span>
              </div>
              <div className="dropzone-subtitle">
                Supports PDF, DOCX, and TXT files up to 4.5MB. Analyzed securely in memory.
              </div>
              <button
                type="button"
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span>Upload Resume</span>
                <ArrowRight size={16} />
              </button>
            </div>

            {/* Quick Test Samples */}
            <div style={{ marginTop: 22, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={13} style={{ color: 'var(--text-secondary)' }} />
                <span>Explore with sample candidate profiles:</span>
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

            {/* Don't have a resume? Free ATS Builder Banner */}
            <div className="builder-promo-banner" onClick={onOpenBuilder}>
              <div className="builder-promo-left">
                <div className="builder-promo-icon">
                  <FileText size={22} />
                </div>
                <div className="builder-promo-text">
                  <div className="builder-promo-title">
                    <span>Need a clean resume?</span>
                    <span className="badge badge-accent">Single-Column ATS Format</span>
                  </div>
                  <div className="builder-promo-desc">
                    Draft a structured, recruiter-ready resume designed to highlight your core strengths and pass ATS filters.
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-secondary builder-promo-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenBuilder();
                }}
              >
                <FileText size={15} />
                <span>Open Resume Builder</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
