/**
 * High-scoring ATS-friendly starter templates for candidates who don't have a resume yet.
 * Formatted with action verbs, quantifiable metrics, and standardized O*NET section headers.
 */

export const RESUME_TEMPLATES = {
  fullstack: {
    name: 'Full Stack Software Engineer',
    personal: {
      fullName: 'Alex Morgan',
      title: 'Full Stack Software Engineer',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      linkedin: 'linkedin.com/in/alexmorgan',
      github: 'github.com/alexmorgan',
      portfolio: 'alexmorgan.dev'
    },
    summary: 'Results-driven Full Stack Software Engineer with 4+ years of experience engineering high-performance web applications, scalable REST APIs, and microservices. Proven track record in optimizing backend performance by 40% and deploying modern React interfaces for 100k+ active users.',
    skills: {
      languages: 'Python, TypeScript, JavaScript, SQL, Go, HTML5, CSS3',
      frameworks: 'React, Next.js, FastAPI, Node.js, Express, Tailwind CSS',
      cloudTools: 'AWS (S3, Lambda, EC2), Docker, Kubernetes, PostgreSQL, Redis, Git, CI/CD, Linux'
    },
    experience: [
      {
        id: 'exp-1',
        role: 'Senior Software Engineer',
        company: 'CloudScale Technologies',
        location: 'San Francisco, CA',
        startDate: '2022',
        endDate: 'Present',
        bullets: [
          'Spearheaded migration of legacy monolithic backend to modular FastAPI microservices with Docker, reducing API latency by 42%.',
          'Engineered modern React/TypeScript dashboard managing real-time analytics for 120,000+ daily active users.',
          'Built robust PostgreSQL data layer with Redis caching, increasing database query throughput by 65%.',
          'Automated CI/CD workflows using GitHub Actions and AWS EKS, enabling zero-downtime daily production deployments.'
        ]
      },
      {
        id: 'exp-2',
        role: 'Full Stack Developer',
        company: 'Apex Digital Solutions',
        location: 'San Jose, CA',
        startDate: '2020',
        endDate: '2022',
        bullets: [
          'Designed and developed 15+ customer-facing features utilizing React, Node.js, and Express.',
          'Integrated secure OAuth2 and Stripe payment gateway handling $2.5M in annual customer transactions.',
          'Collaborated closely with UX designers and product managers to improve web accessibility and mobile performance scores to 95+.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of California, Davis',
        location: 'Davis, CA',
        year: '2020',
        gpa: '3.8 / 4.0'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'AI Task Automation Engine',
        technologies: 'Python, FastAPI, OpenAI API, React',
        bullets: [
          'Architected autonomous agent pipeline parsing unstructured natural language requests into structured SQL queries.',
          'Deployed on AWS containerized with Docker, maintaining 99.9% service uptime.'
        ]
      }
    ]
  },

  datascientist: {
    name: 'Data Scientist & ML Engineer',
    personal: {
      fullName: 'Sarah Chen',
      title: 'Data Scientist & Machine Learning Specialist',
      email: 'sarah.chen@example.com',
      phone: '+1 (555) 876-5432',
      location: 'Boston, MA',
      linkedin: 'linkedin.com/in/sarahchen-data',
      github: 'github.com/sarahchen',
      portfolio: 'sarahchen-ai.io'
    },
    summary: 'Data Scientist with 3+ years of experience developing predictive statistical models, machine learning pipelines, and deep data analytics. Expert in turning raw tabular and unstructured data into high-value predictive insights that drive business growth and user retention.',
    skills: {
      languages: 'Python, R, SQL, Bash',
      frameworks: 'PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, XGBoost, Hugging Face',
      cloudTools: 'AWS SageMaker, BigQuery, Snowflake, Apache Spark, Docker, Tableau, Power BI, Git'
    },
    experience: [
      {
        id: 'exp-1',
        role: 'Machine Learning Scientist',
        company: 'DataPulse Analytics',
        location: 'Boston, MA',
        startDate: '2022',
        endDate: 'Present',
        bullets: [
          'Trained and deployed XGBoost customer churn prediction model, improving quarterly customer retention by 18%.',
          'Constructed automated ETL data pipelines in Apache Spark and BigQuery processing 15M+ daily event records.',
          'Conducted A/B statistical testing on marketing recommendation algorithms, driving a 24% uplift in conversion rates.'
        ]
      },
      {
        id: 'exp-2',
        role: 'Junior Data Analyst',
        company: 'Horizon Financial Group',
        location: 'New York, NY',
        startDate: '2021',
        endDate: '2022',
        bullets: [
          'Authored high-performance SQL queries across multi-terabyte financial databases to detect fraud anomalies.',
          'Built executive Tableau dashboards providing automated weekly reporting for C-suite leadership.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Master of Science in Data Science',
        institution: 'Boston University',
        location: 'Boston, MA',
        year: '2021',
        gpa: '3.9 / 4.0'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'LLM Document Semantic Search',
        technologies: 'Python, LangChain, FAISS, PyTorch',
        bullets: [
          'Engineered vector similarity search system indexing 50,000+ research papers with sub-50ms retrieval latency.'
        ]
      }
    ]
  },

  fresher: {
    name: 'Entry-Level / Recent Graduate',
    personal: {
      fullName: 'David Kumar',
      title: 'Junior Software Engineer / Recent CS Graduate',
      email: 'david.kumar@example.com',
      phone: '+1 (555) 432-1098',
      location: 'Austin, TX',
      linkedin: 'linkedin.com/in/davidkumar',
      github: 'github.com/davidkumar',
      portfolio: 'davidkumar.me'
    },
    summary: 'Enthusiastic and motivated Computer Science graduate with strong foundations in object-oriented programming, data structures, and web development. Experienced in building responsive full-stack applications with Python, JavaScript, React, and SQL through academic projects and internship experience.',
    skills: {
      languages: 'Python, Java, C++, JavaScript, SQL, HTML5, CSS3',
      frameworks: 'React, Node.js, Express, Flask, Bootstrap',
      cloudTools: 'Git, GitHub, VS Code, PostgreSQL, MongoDB, Linux, RESTful APIs'
    },
    experience: [
      {
        id: 'exp-1',
        role: 'Software Engineering Intern',
        company: 'InnovateTech Labs',
        location: 'Austin, TX',
        startDate: 'Jun 2023',
        endDate: 'Aug 2023',
        bullets: [
          'Collaborated with a team of 6 engineers to build customer onboarding features in React and Node.js.',
          'Implemented unit tests with Jest achieving 85% test coverage across core API services.',
          'Refactored frontend CSS styling to conform to mobile-responsive web standards.'
        ]
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'Bachelor of Science in Computer Science',
        institution: 'University of Texas at Austin',
        location: 'Austin, TX',
        year: '2024',
        gpa: '3.7 / 4.0'
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'E-Commerce Web Application',
        technologies: 'React, Node.js, Express, MongoDB',
        bullets: [
          'Built full-stack online store with user authentication, product catalog, shopping cart, and Stripe test checkout.',
          'Deployed on Vercel with automated continuous deployment from GitHub.'
        ]
      },
      {
        id: 'proj-2',
        name: 'Algorithm Visualizer Tool',
        technologies: 'JavaScript, HTML5 Canvas, CSS3',
        bullets: [
          'Developed interactive web tool visualizing sorting algorithms (QuickSort, MergeSort) and graph traversals (BFS, DFS).'
        ]
      }
    ]
  },

  blank: {
    name: 'Blank Slate',
    personal: {
      fullName: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: ''
    },
    summary: '',
    skills: {
      languages: '',
      frameworks: '',
      cloudTools: ''
    },
    experience: [
      {
        id: 'exp-1',
        role: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        bullets: ['']
      }
    ],
    education: [
      {
        id: 'edu-1',
        degree: '',
        institution: '',
        location: '',
        year: '',
        gpa: ''
      }
    ],
    projects: [
      {
        id: 'proj-1',
        name: '',
        technologies: '',
        bullets: ['']
      }
    ]
  }
};

/**
 * Format a structured resume model into clean, ATS-compliant plain text.
 * Strictly adheres to standard section headers that ATS scanners (and PathFinder AI) parse seamlessly.
 */
export function formatResumeAsText(resume) {
  let text = '';

  // 1. Candidate Name & Title
  if (resume.personal?.fullName?.trim()) {
    text += `${resume.personal.fullName.trim().toUpperCase()}\n`;
  }
  if (resume.personal?.title?.trim()) {
    text += `${resume.personal.title.trim()}\n`;
  }

  // 2. Contact Line
  const contactParts = [
    resume.personal?.email?.trim(),
    resume.personal?.phone?.trim(),
    resume.personal?.location?.trim(),
    resume.personal?.linkedin?.trim(),
    resume.personal?.github?.trim(),
    resume.personal?.portfolio?.trim()
  ].filter(Boolean);

  if (contactParts.length) {
    text += `${contactParts.join(' | ')}\n\n`;
  }

  // 3. Professional Summary
  if (resume.summary?.trim()) {
    text += `PROFESSIONAL SUMMARY\n${resume.summary.trim()}\n\n`;
  }

  // 4. Technical Skills
  const hasSkills =
    resume.skills?.languages?.trim() ||
    resume.skills?.frameworks?.trim() ||
    resume.skills?.cloudTools?.trim();

  if (hasSkills) {
    text += `TECHNICAL SKILLS\n`;
    if (resume.skills?.languages?.trim()) {
      text += `• Programming Languages: ${resume.skills.languages.trim()}\n`;
    }
    if (resume.skills?.frameworks?.trim()) {
      text += `• Frameworks & Libraries: ${resume.skills.frameworks.trim()}\n`;
    }
    if (resume.skills?.cloudTools?.trim()) {
      text += `• Cloud, Tools & Platforms: ${resume.skills.cloudTools.trim()}\n`;
    }
    text += `\n`;
  }

  // 5. Work Experience
  const validExp = (resume.experience || []).filter(
    (e) => e.role?.trim() || e.company?.trim()
  );
  if (validExp.length) {
    text += `WORK EXPERIENCE\n`;
    validExp.forEach((exp) => {
      const headerParts = [
        exp.role?.trim(),
        exp.company?.trim(),
        exp.location?.trim(),
        `${exp.startDate || ''} - ${exp.endDate || 'Present'}`.trim()
      ].filter(Boolean);
      text += `${headerParts.join(' | ')}\n`;

      (exp.bullets || []).forEach((b) => {
        if (b && b.trim()) {
          text += `• ${b.trim()}\n`;
        }
      });
      text += `\n`;
    });
  }

  // 6. Education
  const validEdu = (resume.education || []).filter(
    (e) => e.degree?.trim() || e.institution?.trim()
  );
  if (validEdu.length) {
    text += `EDUCATION\n`;
    validEdu.forEach((edu) => {
      const eduHeader = [
        edu.degree?.trim(),
        edu.institution?.trim(),
        edu.year?.trim() ? `(${edu.year.trim()})` : null
      ].filter(Boolean);
      text += `${eduHeader.join(' - ')}\n`;
      if (edu.gpa?.trim()) {
        text += `• GPA / Honors: ${edu.gpa.trim()}\n`;
      }
      text += `\n`;
    });
  }

  // 7. Key Projects
  const validProj = (resume.projects || []).filter((p) => p.name?.trim());
  if (validProj.length) {
    text += `KEY PROJECTS\n`;
    validProj.forEach((proj) => {
      text += `${proj.name.trim()}${
        proj.technologies?.trim() ? ` [${proj.technologies.trim()}]` : ''
      }\n`;
      (proj.bullets || []).forEach((b) => {
        if (b && b.trim()) {
          text += `• ${b.trim()}\n`;
        }
      });
      text += `\n`;
    });
  }

  return text.trim();
}
