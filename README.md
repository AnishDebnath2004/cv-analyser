# PathFinder AI | O*NET Intelligent CV Analysis & Career Matching Agent

An AI-powered web platform that scans resumes and determines the optimal job profile matches for candidates using official **O*NET (Occupational Information Network)** occupational standards and data collection.

---

## 🌟 Key Features

1. **Multi-Format CV Ingestion & Parsing**
   - Supports **PDF** (`pypdf`), Word **DOCX** (`python-docx`), plain **TXT**, and direct text paste.
   - Intelligent extraction of full candidate contact information (Name, Email, Phone, LinkedIn, GitHub).
   - Domain-categorized technical skill extraction across:
     - Programming Languages
     - Frameworks & Libraries
     - Cloud & DevOps Infrastructure
     - Databases & Big Data
     - AI / Machine Learning
     - Tools & Platforms
     - Soft & Methodological Skills
   - Automatic calculation of total years of experience and seniority calibration.

2. **O*NET Web Services API Integration**
   - **Dual-Mode Data Collection**:
     - **Live Mode**: Directly queries O*NET Web Services API (supporting both **API v2.0** with `X-API-Key` and **API v1.9** with HTTP Basic Auth) for keyword search, occupation summaries, skills, tasks, and outlook tags.
     - **Curated Knowledge Base Mode**: Built-in comprehensive O*NET 28.x taxonomy covering core standard SOC codes (Software Developers, Data Scientists, Web Developers, Cloud/DevOps Architects, Cybersecurity Analysts, Database Architects, Technical Product Managers, UI/UX Designers, and more) with official Job Zones, median BLS salaries, and core occupational tasks.
   - Works immediately out-of-the-box without requiring an API key, while allowing live API connection anytime via the UI Settings modal.

3. **Multi-Dimensional Fit & Suitability Engine**
   - Weighted scoring algorithm evaluating:
     - **Technical Skill Overlap** (candidate skills vs O*NET required tools & tech)
     - **Seniority & Job Zone Alignment** (candidate experience vs O*NET preparation levels)
     - **Domain Affinity & Semantic Relevance**
   - Match percentage output (0 - 100%) with confidence classification (*High Match*, *Moderate Fit*, *Growth Potential*).

4. **Strategic Gap Analysis & Upskilling Roadmap**
   - Identifies specific missing tools and competencies required by target O*NET occupations.
   - Categorizes gaps by priority (*Critical* vs *Recommended*).
   - Provides concrete upskilling blueprints and portfolio project suggestions.

5. **ATS Optimization & Keyword Tailoring**
   - Highlights high-frequency O*NET ATS keywords to integrate into the CV.
   - Recommends actionable bullet point enhancements aligned with O*NET occupational duties.

6. **Interactive AI Career Agent Chat**
   - Conversational counselor grounded in the candidate's CV and O*NET match results.
   - Powered by **Google Gemini 2.5 Flash** when an API key is provided, or an intelligent deterministic career reasoning agent.
   - Answers follow-up queries on interview preparation, resume formatting, skill transitions, and salary projections.

7. **Curated 1-Click Sample Resumes**
   - Instant testing without needing to find a file:
     - *Senior Full-Stack Engineer* (React, TypeScript, Node.js, Python, PostgreSQL, AWS)
     - *Machine Learning & Data Scientist* (Python, PyTorch, TensorFlow, Scikit-Learn, BigQuery)
     - *Cloud & DevOps Infrastructure Architect* (Kubernetes, Docker, Terraform, AWS, CI/CD)
     - *Technical Product Manager* (Agile, Scrum, Jira, SQL, Product Strategy)

---

## 🏗️ Project Architecture

```
cv-analyser/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI server with upload, search, and chat endpoints
│   ├── models.py            # Pydantic data schemas
│   ├── onet_taxonomy.py     # Official O*NET standard taxonomy & reference database
│   ├── onet_service.py      # O*NET Web Services API client (v2/v1.9 dual mode)
│   ├── resume_parser.py     # Multi-format PDF/DOCX/TXT parser & skill extractor
│   ├── agent.py             # Multi-dimensional fit scoring & Gemini AI Agent
│   ├── sample_resumes.py    # Curated sample resumes for 1-click evaluation
│   └── static/              # Production compiled React Single Page Application
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── UploadSection.jsx
│   │   │   ├── AnalysisDashboard.jsx
│   │   │   ├── OccupationDetailModal.jsx
│   │   │   ├── ChatAgent.jsx
│   │   │   └── SettingsModal.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css        # Vanilla CSS design tokens, glassmorphism, animations
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js       # Vite configuration with /api proxy & build outDir
├── run.bat                  # 1-Click Windows launch script
└── requirements.txt         # Python dependencies
```

---

## 🚀 Quick Start Guide

### 1. Requirements
- Python 3.10+ (Installed on system)
- Node.js 18+ (For frontend development)

### 2. Run Application (Single Command)
Run the convenience launch script:
```bash
run.bat
```
Or run directly with the virtual environment:
```bash
.venv\Scripts\python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Then open your browser at:
👉 **[http://localhost:8000](http://localhost:8000)**

---

## ⚙️ O*NET & Gemini Configuration

1. In the web interface, click **Settings** (top right navigation).
2. To use your live O*NET Web Services account:
   - Select **API v2.0** and paste your `X-API-Key`, or
   - Select **API v1.9** and enter your O*NET developer username and password.
   - Click **Test O*NET Ping** to verify connectivity with the official O*NET servers.
3. *(Optional)* Add your **Google Gemini API Key** for enhanced personalized narrative synthesis.
4. Click **Save Configuration**.
