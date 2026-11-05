import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Briefcase, Award, TrendingUp, Layers, CheckCircle, AlertCircle,
  FileText, MessageSquare, ExternalLink, Zap, ChevronRight, DollarSign
} from 'lucide-react';
import ChatAgent from './ChatAgent';

export default function AnalysisDashboard({
  analysisResult,
  onSelectOccupation
}) {
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles' | 'skills' | 'trajectory' | 'ats' | 'chat'

  useEffect(() => {
    // Fire celebratory confetti if high match
    if (analysisResult?.suitable_job_profiles?.[0]?.match_score >= 80) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [analysisResult]);

  if (!analysisResult) return null;

  const {
    profile,
    candidate_summary,
    primary_domain,
    estimated_seniority,
    suitable_job_profiles,
    general_strengths,
    critical_skill_gaps,
    career_pathways,
    resume_optimization_tips,
    data_source,
    ai_model_used
  } = analysisResult;

  const topMatch = suitable_job_profiles?.[0];

  return (
    <div className="animate-fade-in">
      {/* Candidate Profile Header Card */}
      <div className="glass-panel dashboard-header">
        <div className="candidate-profile-bar">
          <div className="candidate-name-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2>{profile.full_name || 'Candidate Profile'}</h2>
              <span className="badge badge-primary">{estimated_seniority}</span>
              {topMatch && topMatch.match_score >= 80 && (
                <span className="badge badge-emerald">High Fit Candidate</span>
              )}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Total Experience: <strong>{profile.total_years_experience === 0 ? 'Fresher (0 yrs)' : `${profile.total_years_experience} yrs`}</strong>
            </div>
          </div>

          <div className="candidate-meta-badges">
            <span className="badge badge-primary">
              <span>{primary_domain || 'Technology & Engineering'}</span>
            </span>
            <span className="badge badge-cyan" title="Occupational taxonomy benchmark">
              <span>{data_source}</span>
            </span>
          </div>
        </div>

        {/* Contact info links if available */}
        {(profile.email || profile.phone || profile.links?.length > 0) && (
          <div className="candidate-contacts">
            {profile.email && <div className="contact-item">✉ {profile.email}</div>}
            {profile.phone && <div className="contact-item">📞 {profile.phone}</div>}
            {profile.links?.map((link, i) => (
              <div key={i} className="contact-item">
                <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer">
                  🔗 {link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 28)}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Executive Summary & Profile Overview */}
        <div className="candidate-summary-box">
          {candidate_summary}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dash-nav">
        <button
          className={`dash-nav-btn ${activeTab === 'profiles' ? 'active' : ''}`}
          onClick={() => setActiveTab('profiles')}
        >
          <Briefcase size={16} />
          <span>Suitable Job Profiles ({suitable_job_profiles.length})</span>
        </button>

        <button
          className={`dash-nav-btn ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Layers size={16} />
          <span>Skills Matrix & Gaps</span>
        </button>

        <button
          className={`dash-nav-btn ${activeTab === 'trajectory' ? 'active' : ''}`}
          onClick={() => setActiveTab('trajectory')}
        >
          <TrendingUp size={16} />
          <span>Career Pathways</span>
        </button>

        <button
          className={`dash-nav-btn ${activeTab === 'ats' ? 'active' : ''}`}
          onClick={() => setActiveTab('ats')}
        >
          <FileText size={16} />
          <span>ATS Optimization</span>
        </button>

        <button
          className={`dash-nav-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Career Advisor</span>
        </button>
      </div>

      {/* TAB 1: Suitable Job Profiles */}
      {activeTab === 'profiles' && (
        <div>
          <div className="job-profiles-grid">
            {suitable_job_profiles.map((occ, idx) => (
              <div
                key={occ.soc_code}
                className="glass-panel glass-panel-hover job-card animate-fade-in"
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                <div className="job-card-top">
                  <div className="job-card-header">
                    <div>
                      <div className="job-soc">O*NET SOC {occ.soc_code}</div>
                      <h3 className="job-title">{occ.title}</h3>
                      {occ.bright_outlook && (
                        <span className="badge badge-amber" style={{ marginTop: 4, fontSize: '0.72rem' }}>
                          ⚡ Bright Outlook: {occ.bright_outlook_category || 'High Demand'}
                        </span>
                      )}
                    </div>
                    
                    <div className="match-score-badge">
                      <div className="match-score-num">{occ.match_score}%</div>
                      <div className="match-score-label">MATCH</div>
                    </div>
                  </div>

                  <p className="job-desc">{occ.description}</p>

                  <div className="job-stats-bar">
                    <div className="stat-item">
                      <DollarSign size={14} color="var(--accent-emerald)" />
                      <span>{occ.median_annual_salary}</span>
                    </div>
                    <div className="stat-item">
                      <Briefcase size={14} color="var(--accent-cyan)" />
                      <span>Zone {occ.job_zone}</span>
                    </div>
                  </div>

                  {occ.score_breakdown && (
                    <div style={{ margin: '12px 0', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                        <span>Score Breakdown</span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>0.45(S) + 0.25(E) + 0.15(I) + 0.15(H)</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 10px', fontSize: '0.74rem' }}>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>🎯 Skills (45%)</div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {occ.score_breakdown.skill_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({occ.score_breakdown.weighted_skill} pts)</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>💼 Depth (25%)</div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                            {occ.score_breakdown.experience_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({occ.score_breakdown.weighted_experience} pts)</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>📈 Impact (15%)</div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                            {occ.score_breakdown.impact_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({occ.score_breakdown.weighted_impact} pts)</span>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>📋 Hygiene (15%)</div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-emerald)' }}>
                            {occ.score_breakdown.hygiene_score}% <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>({occ.score_breakdown.weighted_hygiene} pts)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="job-skills-matched">
                    <div className="job-skills-matched-title">Matched Core Tools:</div>
                    <div className="skill-pills">
                      {occ.matched_skills.slice(0, 6).map((skill, i) => (
                        <span key={i} className="skill-pill matched">{skill}</span>
                      ))}
                      {occ.matched_skills.length === 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          General domain foundations
                        </span>
                      )}
                    </div>
                  </div>

                  {occ.missing_skills.length > 0 && (
                    <div className="job-skills-matched">
                      <div className="job-skills-matched-title" style={{ color: 'var(--accent-rose)' }}>
                        Priority Skill Gaps:
                      </div>
                      <div className="skill-pills">
                        {occ.missing_skills.slice(0, 3).map((item, i) => (
                          <span key={i} className="skill-pill missing">
                            {item.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                  <button
                    className="btn-secondary"
                    style={{ width: '100%', justifyContent: 'space-between' }}
                    onClick={() => onSelectOccupation(occ)}
                  >
                    <span>View O*NET Occupational Breakdown</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Skills Matrix & Gap Analysis */}
      {activeTab === 'skills' && (
        <div className="skills-matrix-grid animate-fade-in">
          {/* Left Column: Candidate's Extracted Skills */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={18} color="var(--accent-emerald)" />
              <span>Extracted Skills by Domain ({profile.skills.all_skills.length})</span>
            </h3>

            {profile.skills.programming_languages.length > 0 && (
              <div className="category-block">
                <div className="category-title">Programming Languages</div>
                <div className="skill-pills">
                  {profile.skills.programming_languages.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills.frameworks_libraries.length > 0 && (
              <div className="category-block">
                <div className="category-title">Frameworks & Libraries</div>
                <div className="skill-pills">
                  {profile.skills.frameworks_libraries.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills.cloud_devops.length > 0 && (
              <div className="category-block">
                <div className="category-title">Cloud & Infrastructure</div>
                <div className="skill-pills">
                  {profile.skills.cloud_devops.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills.databases_data.length > 0 && (
              <div className="category-block">
                <div className="category-title">Databases & Data Systems</div>
                <div className="skill-pills">
                  {profile.skills.databases_data.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills.ai_ml_analytics.length > 0 && (
              <div className="category-block">
                <div className="category-title">AI / Machine Learning</div>
                <div className="skill-pills">
                  {profile.skills.ai_ml_analytics.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {profile.skills.tools_platforms.length > 0 && (
              <div className="category-block">
                <div className="category-title">Tools & Platforms</div>
                <div className="skill-pills">
                  {profile.skills.tools_platforms.map((s, i) => (
                    <span key={i} className="skill-pill matched">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Strategic Gap Analysis */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} color="var(--accent-amber)" />
              <span>Priority Skill Gaps for #{1} Role: {topMatch?.title}</span>
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 18 }}>
              These high-impact competencies are frequently required by O*NET standards for your target role. Bridging them will maximize your interview conversion.
            </p>

            {topMatch?.missing_skills.map((item, idx) => (
              <div key={idx} className="gap-item">
                <div>
                  <div className="gap-skill-name">{item.skill}</div>
                  <div className="gap-hint">{item.learning_resource_hint}</div>
                </div>
                <span className={`badge ${item.importance === 'Critical' ? 'badge-rose' : 'badge-amber'}`}>
                  {item.importance}
                </span>
              </div>
            ))}

            <div style={{ marginTop: 24, padding: 16, background: 'rgba(99, 102, 241, 0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6, color: '#a5b4fc' }}>
                💡 Upskilling Recommendation:
              </div>
              <ul style={{ paddingLeft: 18, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {topMatch?.upskilling_path.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Career Trajectory & Pathways */}
      {activeTab === 'trajectory' && (
        <div className="glass-panel animate-fade-in" style={{ padding: 28 }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={20} color="var(--accent-cyan)" />
            <span>Multi-Stage Career Progression Pathway</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Strategic trajectory model derived from candidate seniority ({estimated_seniority}) and O*NET career ladders.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {career_pathways.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 16,
                  padding: 18,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: idx === 0 ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                      {step.role}
                    </div>
                    <span className="badge badge-cyan">{step.horizon}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Resume & ATS Optimization */}
      {activeTab === 'ats' && (
        <div className="glass-panel animate-fade-in" style={{ padding: 28 }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={20} color="var(--accent-emerald)" />
            <span>Resume & ATS Alignment Strategy</span>
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
            Tailored suggestions to tune your resume against Applicant Tracking Systems scanning for O*NET standard keywords.
          </p>

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-primary)' }}>
              High-Frequency ATS Keywords to Integrate:
            </div>
            <div className="skill-pills">
              {topMatch?.ats_keywords_to_add.map((kw, i) => (
                <span key={i} className="skill-pill" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}>
                  + {kw}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 12, color: 'var(--text-primary)' }}>
              Actionable Resume Enhancement Directives:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {resume_optimization_tips.map((tip, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 14,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--accent-emerald)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Interactive Chat Agent */}
      {activeTab === 'chat' && (
        <ChatAgent analysisResult={analysisResult} />
      )}
    </div>
  );
}
