import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Wand2,
  Printer,
  ChevronDown,
  User,
  Briefcase,
  GraduationCap,
  Code2,
  FolderGit2,
  AlignLeft,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { RESUME_TEMPLATES, formatResumeAsText } from '../utils/resumeTemplates';

export default function ResumeBuilderModal({
  isOpen,
  onClose,
  onAnalyzeResumeText,
  currentUser
}) {
  const [templateKey, setTemplateKey] = useState('fullstack');
  const [resume, setResume] = useState(() => {
    const initial = JSON.parse(JSON.stringify(RESUME_TEMPLATES.fullstack));
    if (currentUser?.full_name) {
      initial.personal.fullName = currentUser.full_name;
    }
    if (currentUser?.email) {
      initial.personal.email = currentUser.email;
    }
    return initial;
  });

  const [activeMobileView, setActiveMobileView] = useState('editor'); // 'editor' | 'preview'
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('personal'); // 'personal' | 'summary' | 'skills' | 'experience' | 'education' | 'projects'
  const previewRef = useRef(null);

  // Sync current user name and email if available
  useEffect(() => {
    if (currentUser) {
      setResume((prev) => ({
        ...prev,
        personal: {
          ...prev.personal,
          fullName: prev.personal.fullName || currentUser.full_name || '',
          email: prev.personal.email || currentUser.email || ''
        }
      }));
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleSelectTemplate = (key) => {
    setTemplateKey(key);
    const tmpl = JSON.parse(JSON.stringify(RESUME_TEMPLATES[key]));
    if (currentUser?.full_name && !tmpl.personal.fullName) {
      tmpl.personal.fullName = currentUser.full_name;
    }
    if (currentUser?.email && !tmpl.personal.email) {
      tmpl.personal.email = currentUser.email;
    }
    setResume(tmpl);
  };

  // Personal Field Handlers
  const handlePersonalChange = (field, value) => {
    setResume((prev) => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  // Summary Handler
  const handleSummaryChange = (value) => {
    setResume((prev) => ({
      ...prev,
      summary: value
    }));
  };

  // Skills Handlers
  const handleSkillChange = (category, value) => {
    setResume((prev) => ({
      ...prev,
      skills: {
        ...prev.skills,
        [category]: value
      }
    }));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    const newExp = {
      id: 'exp-' + Date.now(),
      role: '',
      company: '',
      location: '',
      startDate: '',
      endDate: 'Present',
      bullets: ['']
    };
    setResume((prev) => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const handleUpdateExperience = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    }));
  };

  const handleDeleteExperience = (id) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.filter((e) => e.id !== id)
    }));
  };

  const handleAddExpBullet = (expId) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) =>
        e.id === expId ? { ...e, bullets: [...e.bullets, ''] } : e
      )
    }));
  };

  const handleUpdateExpBullet = (expId, bulletIndex, value) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== expId) return e;
        const newBullets = [...e.bullets];
        newBullets[bulletIndex] = value;
        return { ...e, bullets: newBullets };
      })
    }));
  };

  const handleDeleteExpBullet = (expId, bulletIndex) => {
    setResume((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => {
        if (e.id !== expId) return e;
        const newBullets = e.bullets.filter((_, idx) => idx !== bulletIndex);
        return { ...e, bullets: newBullets.length ? newBullets : [''] };
      })
    }));
  };

  // Education Handlers
  const handleAddEducation = () => {
    const newEdu = {
      id: 'edu-' + Date.now(),
      degree: '',
      institution: '',
      location: '',
      year: '',
      gpa: ''
    };
    setResume((prev) => ({
      ...prev,
      education: [...prev.education, newEdu]
    }));
  };

  const handleUpdateEducation = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.map((e) =>
        e.id === id ? { ...e, [field]: value } : e
      )
    }));
  };

  const handleDeleteEducation = (id) => {
    setResume((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id)
    }));
  };

  // Project Handlers
  const handleAddProject = () => {
    const newProj = {
      id: 'proj-' + Date.now(),
      name: '',
      technologies: '',
      bullets: ['']
    };
    setResume((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj]
    }));
  };

  const handleUpdateProject = (id, field, value) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const handleDeleteProject = (id) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.filter((p) => p.id !== id)
    }));
  };

  const handleAddProjBullet = (projId) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === projId ? { ...p, bullets: [...p.bullets, ''] } : p
      )
    }));
  };

  const handleUpdateProjBullet = (projId, bulletIndex, value) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projId) return p;
        const newBullets = [...p.bullets];
        newBullets[bulletIndex] = value;
        return { ...p, bullets: newBullets };
      })
    }));
  };

  const handleDeleteProjBullet = (projId, bulletIndex) => {
    setResume((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projId) return p;
        const newBullets = p.bullets.filter((_, idx) => idx !== bulletIndex);
        return { ...p, bullets: newBullets.length ? newBullets : [''] };
      })
    }));
  };

  // Action: Analyze with PathFinder AI
  const handleAnalyze = () => {
    const formattedText = formatResumeAsText(resume);
    if (!formattedText || formattedText.length < 40) {
      alert('Please fill in your name and core details before analyzing.');
      return;
    }
    onClose();
    if (onAnalyzeResumeText) {
      onAnalyzeResumeText(formattedText);
    }
  };

  // Action: Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Action: Download TXT
  const handleDownloadTxt = () => {
    const text = formatResumeAsText(resume);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = (resume.personal.fullName || 'Candidate')
      .replace(/[^a-zA-Z0-9_-]/g, '_') + '_ATS_Resume.txt';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Action: Copy Plain Text
  const handleCopyText = async () => {
    const text = formatResumeAsText(resume);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  // Contact line items
  const contactItems = [
    resume.personal.email,
    resume.personal.phone,
    resume.personal.location,
    resume.personal.linkedin,
    resume.personal.github,
    resume.personal.portfolio
  ].filter(Boolean);

  return (
    <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="glass-panel modal-card resume-builder-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="builder-header">
          <div className="builder-header-left">
            <div className="builder-icon-box">
              <FileText size={20} />
            </div>
            <div>
              <div className="builder-title-row">
                <h3 className="builder-title">ATS-Friendly Resume Builder</h3>
                <span className="badge badge-accent">O*NET Standard Single-Column</span>
              </div>
              <p className="builder-subtitle">
                Create a high-scoring resume optimized for Applicant Tracking Systems & PathFinder AI.
              </p>
            </div>
          </div>

          <div className="builder-header-right">
            {/* Template Selector */}
            <div className="builder-template-select-wrap">
              <span className="builder-template-label">Starter Template:</span>
              <select
                className="auth-input builder-select"
                value={templateKey}
                onChange={(e) => handleSelectTemplate(e.target.value)}
              >
                <option value="fullstack">Full Stack Engineer</option>
                <option value="datascientist">Data Scientist & ML</option>
                <option value="fresher">Entry-Level / Fresher</option>
                <option value="blank">Blank Slate (Clear)</option>
              </select>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              title="Close Builder"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="builder-mobile-tabs">
          <button
            type="button"
            className={`builder-tab-btn ${activeMobileView === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveMobileView('editor')}
          >
            <AlignLeft size={15} />
            <span>Edit Information</span>
          </button>
          <button
            type="button"
            className={`builder-tab-btn ${activeMobileView === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveMobileView('preview')}
          >
            <FileText size={15} />
            <span>Live ATS Preview</span>
          </button>
        </div>

        {/* Builder Content: Two-Column Workspace */}
        <div className="builder-workspace">
          {/* Left Column: Form Editor */}
          <div className={`builder-editor-pane ${activeMobileView === 'editor' ? 'mobile-visible' : 'mobile-hidden'}`}>
            {/* Section Navigation Tabs */}
            <div className="builder-section-nav">
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveSection('personal')}
              >
                <User size={14} />
                <span>Contact</span>
              </button>
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveSection('summary')}
              >
                <AlignLeft size={14} />
                <span>Summary</span>
              </button>
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveSection('skills')}
              >
                <Code2 size={14} />
                <span>Skills</span>
              </button>
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'experience' ? 'active' : ''}`}
                onClick={() => setActiveSection('experience')}
              >
                <Briefcase size={14} />
                <span>Experience ({resume.experience.length})</span>
              </button>
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'education' ? 'active' : ''}`}
                onClick={() => setActiveSection('education')}
              >
                <GraduationCap size={14} />
                <span>Education ({resume.education.length})</span>
              </button>
              <button
                type="button"
                className={`section-nav-btn ${activeSection === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveSection('projects')}
              >
                <FolderGit2 size={14} />
                <span>Projects ({resume.projects.length})</span>
              </button>
            </div>

            <div className="builder-form-scroll">
              {/* 1. Personal Details */}
              {activeSection === 'personal' && (
                <div className="builder-form-section animate-fade-in">
                  <h4 className="builder-section-heading">Personal & Contact Information</h4>
                  <p className="builder-section-tip">
                    ATS scanners parse the top header line for your full name and contact information.
                  </p>
                  
                  <div className="form-grid-2">
                    <div className="auth-field">
                      <label className="auth-label">Full Name *</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="e.g. Alex Morgan"
                        value={resume.personal.fullName}
                        onChange={(e) => handlePersonalChange('fullName', e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Target Title / Headline *</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="e.g. Senior Full Stack Engineer"
                        value={resume.personal.title}
                        onChange={(e) => handlePersonalChange('title', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="auth-field">
                      <label className="auth-label">Email Address *</label>
                      <input
                        type="email"
                        className="auth-input"
                        placeholder="alex@example.com"
                        value={resume.personal.email}
                        onChange={(e) => handlePersonalChange('email', e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Phone Number</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="+1 (555) 234-5678"
                        value={resume.personal.phone}
                        onChange={(e) => handlePersonalChange('phone', e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Location (City, Country/State)</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="San Francisco, CA"
                        value={resume.personal.location}
                        onChange={(e) => handlePersonalChange('location', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="auth-field">
                      <label className="auth-label">LinkedIn Profile URL</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="linkedin.com/in/alexmorgan"
                        value={resume.personal.linkedin}
                        onChange={(e) => handlePersonalChange('linkedin', e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">GitHub URL</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="github.com/alexmorgan"
                        value={resume.personal.github}
                        onChange={(e) => handlePersonalChange('github', e.target.value)}
                      />
                    </div>
                    <div className="auth-field">
                      <label className="auth-label">Portfolio / Website</label>
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="alexmorgan.dev"
                        value={resume.personal.portfolio}
                        onChange={(e) => handlePersonalChange('portfolio', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Professional Summary */}
              {activeSection === 'summary' && (
                <div className="builder-form-section animate-fade-in">
                  <h4 className="builder-section-heading">Professional Summary</h4>
                  <p className="builder-section-tip">
                    Write 2 to 4 concise sentences highlighting your core tech competencies, years of experience, and highest impact accomplishments.
                  </p>
                  <div className="auth-field">
                    <textarea
                      className="auth-input"
                      rows={5}
                      placeholder="Results-driven Software Engineer with 4+ years of experience engineering high-performance web applications, scalable REST APIs, and microservices..."
                      value={resume.summary}
                      onChange={(e) => handleSummaryChange(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* 3. Technical Skills */}
              {activeSection === 'skills' && (
                <div className="builder-form-section animate-fade-in">
                  <h4 className="builder-section-heading">Technical Skills & Competencies</h4>
                  <p className="builder-section-tip">
                    Partitioning skills into standard categories helps O*NET and ATS parsers extract exact keyword proficiencies.
                  </p>

                  <div className="auth-field" style={{ marginBottom: 16 }}>
                    <label className="auth-label">Programming Languages (Comma-separated)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Python, TypeScript, JavaScript, SQL, Go"
                      value={resume.skills.languages}
                      onChange={(e) => handleSkillChange('languages', e.target.value)}
                    />
                  </div>

                  <div className="auth-field" style={{ marginBottom: 16 }}>
                    <label className="auth-label">Frameworks, Libraries & Runtime (Comma-separated)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. React, Next.js, FastAPI, Node.js, Express, Tailwind CSS"
                      value={resume.skills.frameworks}
                      onChange={(e) => handleSkillChange('frameworks', e.target.value)}
                    />
                  </div>

                  <div className="auth-field">
                    <label className="auth-label">Cloud, Databases & Developer Tools (Comma-separated)</label>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="e.g. AWS (S3, Lambda, EC2), Docker, Kubernetes, PostgreSQL, Redis, Git, Linux"
                      value={resume.skills.cloudTools}
                      onChange={(e) => handleSkillChange('cloudTools', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* 4. Work Experience */}
              {activeSection === 'experience' && (
                <div className="builder-form-section animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 className="builder-section-heading" style={{ marginBottom: 2 }}>Work Experience</h4>
                      <p className="builder-section-tip" style={{ margin: 0 }}>
                        Use bullet points with action verbs and quantifiable metrics (% or numbers).
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddExperience}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>Add Job</span>
                    </button>
                  </div>

                  {resume.experience.map((exp, index) => (
                    <div key={exp.id} className="builder-card-item">
                      <div className="card-item-header">
                        <span className="card-item-index">Job #{index + 1}</span>
                        <button
                          type="button"
                          className="btn-ghost icon-only-btn"
                          onClick={() => handleDeleteExperience(exp.id)}
                          title="Delete Job"
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>

                      <div className="form-grid-2">
                        <div className="auth-field">
                          <label className="auth-label">Job Title / Role *</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="Senior Software Engineer"
                            value={exp.role}
                            onChange={(e) => handleUpdateExperience(exp.id, 'role', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">Company Name *</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="CloudScale Technologies"
                            value={exp.company}
                            onChange={(e) => handleUpdateExperience(exp.id, 'company', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid-3">
                        <div className="auth-field">
                          <label className="auth-label">Location</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="San Francisco, CA"
                            value={exp.location}
                            onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">Start Date</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="2022"
                            value={exp.startDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">End Date</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="Present (or 2024)"
                            value={exp.endDate}
                            onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="bullet-points-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="auth-label">Key Achievements & Responsibilities (Bullets)</span>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleAddExpBullet(exp.id)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', gap: 4 }}
                          >
                            <Plus size={12} />
                            <span>Add Bullet</span>
                          </button>
                        </div>

                        {exp.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="bullet-input-row">
                            <span className="bullet-dot">•</span>
                            <input
                              type="text"
                              className="auth-input bullet-input"
                              placeholder="e.g. Spearheaded microservices migration with FastAPI, reducing API latency by 42%."
                              value={bullet}
                              onChange={(e) => handleUpdateExpBullet(exp.id, bIdx, e.target.value)}
                            />
                            {exp.bullets.length > 1 && (
                              <button
                                type="button"
                                className="btn-ghost icon-only-btn"
                                onClick={() => handleDeleteExpBullet(exp.id, bIdx)}
                                title="Remove bullet"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. Education */}
              {activeSection === 'education' && (
                <div className="builder-form-section animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 className="builder-section-heading" style={{ marginBottom: 2 }}>Education</h4>
                      <p className="builder-section-tip" style={{ margin: 0 }}>
                        List your university degrees, colleges, or formal diplomas.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddEducation}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>Add Degree</span>
                    </button>
                  </div>

                  {resume.education.map((edu, index) => (
                    <div key={edu.id} className="builder-card-item">
                      <div className="card-item-header">
                        <span className="card-item-index">Education #{index + 1}</span>
                        <button
                          type="button"
                          className="btn-ghost icon-only-btn"
                          onClick={() => handleDeleteEducation(edu.id)}
                          title="Delete Degree"
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>

                      <div className="form-grid-2">
                        <div className="auth-field">
                          <label className="auth-label">Degree & Major *</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="B.S. in Computer Science"
                            value={edu.degree}
                            onChange={(e) => handleUpdateEducation(edu.id, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">University / Institution *</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="University of California, Davis"
                            value={edu.institution}
                            onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="auth-field">
                          <label className="auth-label">Graduation Year</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="2020"
                            value={edu.year}
                            onChange={(e) => handleUpdateEducation(edu.id, 'year', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">GPA or Honors (Optional)</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="3.8 / 4.0 or Magna Cum Laude"
                            value={edu.gpa}
                            onChange={(e) => handleUpdateEducation(edu.id, 'gpa', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 6. Projects */}
              {activeSection === 'projects' && (
                <div className="builder-form-section animate-fade-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 className="builder-section-heading" style={{ marginBottom: 2 }}>Key Projects</h4>
                      <p className="builder-section-tip" style={{ margin: 0 }}>
                        Highlight open-source, academic, or portfolio projects demonstrating practical capability.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleAddProject}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 6 }}
                    >
                      <Plus size={14} />
                      <span>Add Project</span>
                    </button>
                  </div>

                  {resume.projects.map((proj, index) => (
                    <div key={proj.id} className="builder-card-item">
                      <div className="card-item-header">
                        <span className="card-item-index">Project #{index + 1}</span>
                        <button
                          type="button"
                          className="btn-ghost icon-only-btn"
                          onClick={() => handleDeleteProject(proj.id)}
                          title="Delete Project"
                        >
                          <Trash2 size={15} color="var(--accent-rose)" />
                        </button>
                      </div>

                      <div className="form-grid-2">
                        <div className="auth-field">
                          <label className="auth-label">Project Name *</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="AI Career Intelligence Agent"
                            value={proj.name}
                            onChange={(e) => handleUpdateProject(proj.id, 'name', e.target.value)}
                          />
                        </div>
                        <div className="auth-field">
                          <label className="auth-label">Technologies Used</label>
                          <input
                            type="text"
                            className="auth-input"
                            placeholder="Python, React, FastAPI, Docker"
                            value={proj.technologies}
                            onChange={(e) => handleUpdateProject(proj.id, 'technologies', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="bullet-points-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span className="auth-label">Key Highlights / Architecture (Bullets)</span>
                          <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => handleAddProjBullet(proj.id)}
                            style={{ padding: '2px 8px', fontSize: '0.75rem', gap: 4 }}
                          >
                            <Plus size={12} />
                            <span>Add Bullet</span>
                          </button>
                        </div>

                        {proj.bullets.map((bullet, bIdx) => (
                          <div key={bIdx} className="bullet-input-row">
                            <span className="bullet-dot">•</span>
                            <input
                              type="text"
                              className="auth-input bullet-input"
                              placeholder="e.g. Implemented vector similarity search indexing 50,000+ records with <50ms latency."
                              value={bullet}
                              onChange={(e) => handleUpdateProjBullet(proj.id, bIdx, e.target.value)}
                            />
                            {proj.bullets.length > 1 && (
                              <button
                                type="button"
                                className="btn-ghost icon-only-btn"
                                onClick={() => handleDeleteProjBullet(proj.id, bIdx)}
                                title="Remove bullet"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live ATS Preview */}
          <div className={`builder-preview-pane ${activeMobileView === 'preview' ? 'mobile-visible' : 'mobile-hidden'}`}>
            <div className="preview-toolbar">
              <div className="preview-toolbar-title">
                <FileText size={15} />
                <span>Live ATS Document Preview</span>
              </div>
              <div className="preview-toolbar-badge">
                <span>Standard Linear Formatting</span>
              </div>
            </div>

            {/* Printable ATS Document Sheet */}
            <div className="preview-sheet-wrapper">
              <div className="printable-ats-resume" ref={previewRef}>
                {/* Header: Name and Title */}
                <div className="ats-header">
                  <h1 className="ats-name">
                    {resume.personal.fullName || 'YOUR FULL NAME'}
                  </h1>
                  {resume.personal.title && (
                    <div className="ats-title">{resume.personal.title}</div>
                  )}
                  {contactItems.length > 0 && (
                    <div className="ats-contact">
                      {contactItems.join(' | ')}
                    </div>
                  )}
                </div>

                {/* Professional Summary */}
                {resume.summary?.trim() && (
                  <div className="ats-section">
                    <h2 className="ats-section-title">PROFESSIONAL SUMMARY</h2>
                    <p className="ats-paragraph">{resume.summary.trim()}</p>
                  </div>
                )}

                {/* Technical Skills */}
                {(resume.skills.languages?.trim() ||
                  resume.skills.frameworks?.trim() ||
                  resume.skills.cloudTools?.trim()) && (
                  <div className="ats-section">
                    <h2 className="ats-section-title">TECHNICAL SKILLS</h2>
                    <div className="ats-skills-list">
                      {resume.skills.languages?.trim() && (
                        <div className="ats-skill-line">
                          <strong>Programming Languages:</strong> {resume.skills.languages.trim()}
                        </div>
                      )}
                      {resume.skills.frameworks?.trim() && (
                        <div className="ats-skill-line">
                          <strong>Frameworks & Libraries:</strong> {resume.skills.frameworks.trim()}
                        </div>
                      )}
                      {resume.skills.cloudTools?.trim() && (
                        <div className="ats-skill-line">
                          <strong>Cloud, Tools & Platforms:</strong> {resume.skills.cloudTools.trim()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {resume.experience.filter((e) => e.role || e.company).length > 0 && (
                  <div className="ats-section">
                    <h2 className="ats-section-title">WORK EXPERIENCE</h2>
                    {resume.experience
                      .filter((e) => e.role || e.company)
                      .map((exp) => (
                        <div key={exp.id} className="ats-entry">
                          <div className="ats-entry-header">
                            <div>
                              <strong className="ats-role">{exp.role || 'Job Role'}</strong>
                              {exp.company && <span className="ats-company"> — {exp.company}</span>}
                            </div>
                            <div className="ats-date">
                              {exp.location ? `${exp.location} | ` : ''}
                              {exp.startDate || ''} – {exp.endDate || 'Present'}
                            </div>
                          </div>
                          {exp.bullets.filter(Boolean).length > 0 && (
                            <ul className="ats-bullets">
                              {exp.bullets.filter(Boolean).map((bullet, bIdx) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Education */}
                {resume.education.filter((e) => e.degree || e.institution).length > 0 && (
                  <div className="ats-section">
                    <h2 className="ats-section-title">EDUCATION</h2>
                    {resume.education
                      .filter((e) => e.degree || e.institution)
                      .map((edu) => (
                        <div key={edu.id} className="ats-entry">
                          <div className="ats-entry-header">
                            <div>
                              <strong className="ats-degree">{edu.degree || 'Degree'}</strong>
                              {edu.institution && (
                                <span className="ats-institution">, {edu.institution}</span>
                              )}
                            </div>
                            <div className="ats-date">{edu.year || ''}</div>
                          </div>
                          {edu.gpa && (
                            <div className="ats-subline">
                              <span>GPA/Honors: {edu.gpa}</span>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Key Projects */}
                {resume.projects.filter((p) => p.name).length > 0 && (
                  <div className="ats-section">
                    <h2 className="ats-section-title">KEY PROJECTS</h2>
                    {resume.projects
                      .filter((p) => p.name)
                      .map((proj) => (
                        <div key={proj.id} className="ats-entry">
                          <div className="ats-entry-header">
                            <div>
                              <strong className="ats-project-name">{proj.name}</strong>
                              {proj.technologies && (
                                <span className="ats-project-tech"> [{proj.technologies}]</span>
                              )}
                            </div>
                          </div>
                          {proj.bullets.filter(Boolean).length > 0 && (
                            <ul className="ats-bullets">
                              {proj.bullets.filter(Boolean).map((bullet, bIdx) => (
                                <li key={bIdx}>{bullet}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Action Bar */}
        <div className="builder-footer">
          <div className="builder-footer-left">
            <button
              type="button"
              className="btn-ghost"
              onClick={handleCopyText}
              title="Copy clean plain text"
            >
              {copied ? <Check size={15} color="var(--accent-emerald)" /> : <Copy size={15} />}
              <span>{copied ? 'Copied Text!' : 'Copy Text'}</span>
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={handleDownloadTxt}
              title="Download ATS plain-text resume"
            >
              <Download size={15} />
              <span>Download .TXT</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handlePrint}
              title="Save or Print as PDF"
            >
              <Printer size={15} />
              <span>Save / Print PDF</span>
            </button>
          </div>

          <div className="builder-footer-right">
            <button
              type="button"
              className="btn-primary"
              onClick={handleAnalyze}
              style={{ padding: '10px 22px', gap: 8, fontSize: '0.92rem' }}
            >
              <Sparkles size={16} />
              <span>Analyze with PathFinder AI</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

