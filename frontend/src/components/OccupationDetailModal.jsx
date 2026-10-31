import React from 'react';
import { X, CheckCircle, AlertTriangle, Briefcase, DollarSign, Award, BookOpen, ExternalLink } from 'lucide-react';

export default function OccupationDetailModal({ occupation, onClose }) {
  if (!occupation) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={20} />
        </button>

        <div style={{ marginBottom: 16 }}>
          <div className="badge badge-primary" style={{ marginBottom: 8 }}>
            SOC {occupation.soc_code}
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: 6 }}>{occupation.title}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: 1.6 }}>
            {occupation.description}
          </p>
        </div>

        {/* Stats Row */}
        <div className="job-stats-bar" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
          <div className="stat-item">
            <Award size={16} color="var(--primary)" />
            <span>Match: <strong>{occupation.match_score}%</strong> ({occupation.confidence})</span>
          </div>
          <div className="stat-item">
            <DollarSign size={16} color="var(--accent-emerald)" />
            <span>Median Wage: <strong>{occupation.median_annual_salary}</strong></span>
          </div>
          <div className="stat-item">
            <Briefcase size={16} color="var(--accent-cyan)" />
            <span>Job Zone: <strong>{occupation.job_zone} ({occupation.job_zone_title})</strong></span>
          </div>
        </div>

        {/* Score Breakdown Formula */}
        {occupation.score_breakdown && (
          <div style={{ marginBottom: 20, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Multi-Dimensional Score Breakdown</span>
              <span style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)' }}>0.45(S) + 0.25(E) + 0.15(I) + 0.15(H)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, fontSize: '0.82rem' }}>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>🎯 Skill Match (45%)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginTop: 2 }}>
                  {occupation.score_breakdown.skill_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({occupation.score_breakdown.weighted_skill} pts)</span>
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>💼 Project Depth (25%)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginTop: 2 }}>
                  {occupation.score_breakdown.experience_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({occupation.score_breakdown.weighted_experience} pts)</span>
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>📈 Quantified Impact (15%)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginTop: 2 }}>
                  {occupation.score_breakdown.impact_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({occupation.score_breakdown.weighted_impact} pts)</span>
                </div>
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>📋 ATS Hygiene (15%)</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-emerald)', marginTop: 2 }}>
                  {occupation.score_breakdown.hygiene_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>({occupation.score_breakdown.weighted_hygiene} pts)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Why Suited */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={16} color="var(--accent-emerald)" />
            <span>Suitability Assessment</span>
          </h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {occupation.why_suited}
          </p>
        </div>

        {/* Core O*NET Tasks */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BookOpen size={16} color="var(--accent-cyan)" />
            <span>Key Occupational Tasks (O*NET)</span>
          </h4>
          <ul style={{ paddingLeft: 20, color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
            {occupation.core_tasks.slice(0, 5).map((task, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>{task}</li>
            ))}
          </ul>
        </div>

        {/* Matched vs Missing Skills */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>Competency Alignment</h4>
          
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 600, marginBottom: 6 }}>
              ✓ Verified Skills from Your Resume:
            </div>
            <div className="skill-pills">
              {occupation.matched_skills.length > 0 ? (
                occupation.matched_skills.map((s, i) => (
                  <span key={i} className="skill-pill matched">{s}</span>
                ))
              ) : (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Foundation alignment based on domain keywords</span>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', fontWeight: 600, marginBottom: 6 }}>
              ⚠ Recommended Skills to Acquire:
            </div>
            <div className="skill-pills">
              {occupation.missing_skills.map((item, i) => (
                <span key={i} className="skill-pill missing" title={item.learning_resource_hint}>
                  {item.skill} ({item.importance})
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Upskilling Pathway */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: '1rem', marginBottom: 8 }}>Upskilling Blueprint</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {occupation.upskilling_path.map((path, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{idx + 1}.</span>
                <span>{path}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ATS Keywords */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>
            RECOMMENDED ATS KEYWORDS FOR THIS O*NET PROFILE:
          </div>
          <div className="skill-pills">
            {occupation.ats_keywords_to_add.map((kw, i) => (
              <span key={i} className="skill-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#a5b4fc' }}>
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* O*NET OnLine link */}
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <a
            href={`https://www.onetonline.org/link/summary/${occupation.soc_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.84rem' }}
          >
            <span>View Full Official Report on O*NET OnLine</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
