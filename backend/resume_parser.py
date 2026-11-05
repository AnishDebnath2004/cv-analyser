import re
import io
import os
import sys
from typing import Dict, Any, List, Optional, Tuple
from pypdf import PdfReader
import docx

# Ensure both current directory and parent directory are on sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

try:
    from backend.models import ParsedResume, CategorizedSkills, WorkExperience, Education
except ImportError:
    from models import ParsedResume, CategorizedSkills, WorkExperience, Education

# Comprehensive skill dictionaries
TECH_SKILLS_TAXONOMY = {
    "programming_languages": [
        "python", "javascript", "typescript", "java", "c++", "c#", "c", "golang", "go",
        "rust", "ruby", "php", "swift", "kotlin", "scala", "r", "dart", "bash", "shell",
        "powershell", "perl", "sql", "html", "html5", "css", "css3", "sass", "less"
    ],
    "frameworks_libraries": [
        "react", "react.js", "next.js", "nextjs", "vue", "vue.js", "angular", "svelte",
        "node.js", "nodejs", "express", "express.js", "django", "fastapi", "flask",
        "spring", "spring boot", "asp.net", "dotnet", ".net", "rails", "ruby on rails",
        "nestjs", "graphql", "rest api", "restful api", "grpc", "redux", "zustand", "tailwind"
    ],
    "cloud_devops": [
        "aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud",
        "google cloud platform", "docker", "kubernetes", "k8s", "terraform", "ansible",
        "jenkins", "ci/cd", "continuous integration", "github actions", "gitlab ci", "helm",
        "prometheus", "grafana", "linux", "ubuntu", "nginx", "apache", "cloudformation",
        "serverless", "microservices"
    ],
    "databases_data": [
        "postgresql", "postgres", "mysql", "mongodb", "redis", "cassandra", "elasticsearch",
        "snowflake", "bigquery", "redshift", "dynamodb", "sqlite", "oracle", "mariadb",
        "spark", "apache spark", "kafka", "apache kafka", "airflow", "dbt", "hadoop", "etl"
    ],
    "ai_ml_analytics": [
        "machine learning", "deep learning", "artificial intelligence", "pytorch",
        "tensorflow", "keras", "scikit-learn", "sklearn", "pandas", "numpy", "scipy",
        "hugging face", "llm", "large language models", "nlp", "natural language processing",
        "computer vision", "opencv", "tableau", "power bi", "looker", "data analysis",
        "data visualization", "predictive modeling", "generative ai", "gemini", "openai"
    ],
    "tools_platforms": [
        "git", "github", "gitlab", "bitbucket", "jira", "confluence", "figma", "postman",
        "docker desktop", "visual studio code", "vscode", "pycharm", "intellij", "webpack",
        "vite", "npm", "yarn", "pnpm", "swagger", "openapi", "databricks"
    ],
    "soft_skills": [
        "leadership", "agile", "scrum", "kanban", "problem solving", "critical thinking",
        "team collaboration", "communication", "project management", "mentorship",
        "strategic planning", "stakeholder management", "time management", "cross-functional"
    ]
}


class ResumeParser:
    @staticmethod
    def extract_text_from_pdf(file_bytes: bytes) -> str:
        """Extract plain text from PDF bytes using pypdf."""
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            text_parts = []
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
            return "\n".join(text_parts).strip()
        except Exception as e:
            raise ValueError(f"Failed to parse PDF document: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_bytes: bytes) -> str:
        """Extract plain text from Word (.docx) bytes."""
        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            text_parts = [p.text for p in doc.paragraphs if p.text.strip()]
            for table in doc.tables:
                for row in table.rows:
                    text_parts.extend([cell.text.strip() for cell in row.cells if cell.text.strip()])
            return "\n".join(text_parts).strip()
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX document: {str(e)}")

    @classmethod
    def validate_is_resume(cls, text: str) -> Tuple[bool, str]:
        """
        Determines whether the provided document text is a valid resume/CV.
        Returns (True, "") if valid, or (False, "User-friendly explanation") if not a resume.
        """
        if not text or not text.strip():
            return False, "The uploaded file contains no readable text. Please upload a valid PDF, DOCX, or text file."

        clean = text.strip()
        words = clean.split()
        if len(words) < 25 or len(clean) < 120:
            return False, "The uploaded document contains too little text to be a resume. Please upload a complete resume or CV."

        lower = clean.lower()
        lines = [line.strip() for line in clean.splitlines() if line.strip()]

        # =========================================================================
        # 1. SPECIFIC NON-RESUME DOCUMENT DISQUALIFIERS (Checked first)
        # =========================================================================

        # A. Job Descriptions / Vacancy Announcements
        jd_patterns = [
            r"\b(?:job|position|role)\s+description\b",
            r"\b(?:about\s+the|position|role)\s+overview\b",
            r"\bwe\s+are\s+(?:looking\s+for|seeking|hiring)\b",
            r"\bwhat\s+you(?:\'ll|\s+will)\s+do\b",
            r"\bwhat\s+we(?:\'re|\s+are)?\s+offer(?:ing)?\b",
            r"\bkey\s+responsibilities\s*:",
            r"\b(?:minimum|preferred|basic)\s+qualifications\s*:",
            r"\bresponsibilities\s*:\s*",
            r"\brequirements\s*:\s*",
            r"\bequal\s+opportunity\s+employer\b",
            r"\bhow\s+to\s+apply\b",
            r"\bapply\s+(?:for\s+this\s+job|now\b|at\s+https?:)",
            r"\bsubmit\s+your\s+application\b",
            r"\bsalary\s+range\s*:\s*[\$\£\€\₹]?",
            r"\bthe\s+ideal\s+candidate\s+will\b",
            r"\breporting\s+to\s+the\b",
            r"\bcompensation\s+(?:&|and)\s+benefits\b",
        ]
        jd_score = sum(1 for p in jd_patterns if re.search(p, lower))
        if (re.search(r"\b(?:job\s+description|about\s+the\s+role|equal\s+opportunity\s+employer|how\s+to\s+apply|we\s+are\s+hiring|what\s+you\'ll\s+do)\b", lower) and jd_score >= 2) or jd_score >= 3:
            return False, "This document appears to be a job description or vacancy posting, not a candidate resume."

        # B. Offer Letters & Employment Agreements
        offer_patterns = [
            r"\boffer\s+of\s+employment\b",
            r"\bwe\s+are\s+pleased\s+to\s+offer\s+you\b",
            r"\bwe\s+are\s+excited\s+to\s+offer\s+you\b",
            r"\bformal\s+offer\b",
            r"\bemployment\s+agreement\b",
            r"\bacceptance\s+of\s+offer\b",
            r"\bterms\s+of\s+employment\b",
            r"\bappointment\s+letter\b",
            r"\bbase\s+salary\s+of\b",
            r"\bannual\s+base\s+salary\b",
            r"\bstarting\s+salary\s+of\b",
            r"\bstart\s+date\s+will\s+be\b",
            r"\bofficial\s+start\s+date\b",
            r"\bplease\s+sign\s+and\s+return\b",
            r"\bcontingent\s+upon\s+(?:a\s+)?background\s+check\b",
            r"\bat-will\s+employment\b",
        ]
        offer_score = sum(1 for p in offer_patterns if re.search(p, lower))
        if (re.search(r"\b(?:offer\s+of\s+employment|we\s+are\s+pleased\s+to\s+offer|employment\s+agreement|formal\s+offer|appointment\s+letter)\b", lower) and offer_score >= 1) or offer_score >= 2:
            return False, "This document appears to be an employment offer letter or contract, not a candidate resume."

        # C. Letters of Recommendation (LOR) & References
        lor_patterns = [
            r"\bletter\s+of\s+recommendation\b",
            r"\brecommendation\s+letter\b",
            r"\bto\s+whom\s+it\s+may\s+concern\b",
            r"\bi\s+am\s+(?:writing|pleased)\s+to\s+recommend\b",
            r"\bi\s+(?:wholeheartedly|strongly|highly)\s+recommend\b",
            r"\bit\s+is\s+(?:with\s+great\s+pleasure|my\s+pleasure)\s+to\s+recommend\b",
            r"\bletter\s+of\s+reference\b",
            r"\brecommend\s+[a-z\s]+\s+for\s+(?:admission|the\s+position)\b",
        ]
        lor_score = sum(1 for p in lor_patterns if re.search(p, lower))
        if lor_score >= 1 and (re.search(r"\b(?:to\s+whom\s+it\s+may\s+concern|letter\s+of\s+recommendation|recommendation\s+letter)\b", lower) or lor_score >= 2):
            return False, "This document appears to be a letter of recommendation or reference letter, not a candidate resume."

        # D. Certificates, Diplomas & Course Credentials
        cert_patterns = [
            r"\bcertificate\s+of\s+(?:completion|achievement|participation|appreciation|attendance|excellence)\b",
            r"\bthis\s+is\s+to\s+certify\s+that\b",
            r"\bthis\s+certificate\s+is\s+(?:proudly\s+)?awarded\s+to\b",
            r"\bhereby\s+certifies\s+that\b",
            r"\bhas\s+successfully\s+completed\s+(?:the\s+)?(?:course|program|training|specialization)\b",
            r"\bhas\s+demonstrated\s+proficiency\s+in\b",
            r"\bcertificate\s+id\s*:\s*[a-z0-9_-]+",
            r"\bcredential\s+id\s*:\s*[a-z0-9_-]+",
            r"\bverify\s+at\s*:\s*https?://",
        ]
        cert_score = sum(1 for p in cert_patterns if re.search(p, lower))
        if cert_score >= 1 and (re.search(r"\b(?:certificate\s+of\s+(?:completion|achievement|participation)|this\s+is\s+to\s+certify\s+that|hereby\s+certifies\s+that|has\s+successfully\s+completed)\b", lower) or cert_score >= 2):
            return False, "This document appears to be a course certificate or credential award, not a complete resume."

        # E. Invoices, Receipts & Financial Documents
        invoice_patterns = [
            r"\b(?:tax\s+)?invoice\s*#?\s*[a-z0-9_-]+",
            r"\b(?:amount|total|balance)\s+due\s*:\s*[\$\£\€\₹]?",
            r"\b(?:subtotal|total\s+amount)\s*:\s*[\$\£\€\₹]?",
            r"\bbill\s+to\s*:\s*",
            r"\bship\s+to\s*:\s*",
            r"\bpayment\s+(?:terms|due\s+date|method)\s*:",
            r"\bremit\s+(?:payment\s+)?to\b",
            r"\bpurchase\s+order\s*#?\s*[a-z0-9_-]+",
            r"\bstatement\s+of\s+account\b",
            r"\bopening\s+balance\b",
        ]
        invoice_score = sum(1 for p in invoice_patterns if re.search(p, lower))
        if invoice_score >= 2:
            return False, "This document appears to be an invoice, billing receipt, or financial statement, not a resume."

        # F. Legal Contracts, Policies & Terms of Service
        legal_patterns = [
            r"\bterms\s+of\s+(?:service|use)\b",
            r"\bprivacy\s+policy\b",
            r"\bend\s+user\s+license\s+agreement\b",
            r"\bnon-disclosure\s+agreement\b",
            r"\barbitration\s+clause\b",
            r"\bgoverning\s+law\b",
            r"\bindemnif(?:y|ification|ities)\b",
            r"\bintellectual\s+property\s+rights\b",
            r"\bin\s+witness\s+whereof\b",
        ]
        legal_score = sum(1 for p in legal_patterns if re.search(p, lower))
        if legal_score >= 2:
            return False, "This document appears to be a legal terms, policy, or agreement document, not a resume."

        # G. Court Judgments, Rulings & Judicial Petitions
        court_patterns = [
            r"\b(?:in\s+the\s+supreme\s+court|in\s+the\s+high\s+court|in\s+the\s+district\s+court)\b",
            r"\b(?:civil|criminal)\s+appellate\s+jurisdiction\b",
            r"\bspecial\s+leave\s+petition\b",
            r"\b(?:civil|criminal)\s+appeal\s+no\b",
            r"\bwrit\s+petition\s*(?:\([a-z]+\))?\s*no\b",
            r"\b(?:appellant|respondent|petitioner)\s*\(s\)",
            r"\bj\s*u\s*d\s*g\s*m\s*e\s*n\s*t\b",
            r"\bleave\s+granted\b",
            r"\bimpugned\s+(?:judgment|order)\b",
            r"\blearned\s+(?:senior\s+)?(?:advocate|counsel)\b",
            r"\binterlocutory\s+application\b",
            r"\bquashed\s+and\s+set\s+aside\b",
        ]
        court_score = sum(1 for p in court_patterns if re.search(p, lower))
        if court_score >= 2:
            return False, "This document appears to be a court judgment, legal ruling, or judicial petition, not a candidate resume."

        # H. Academic Syllabi, Assignments & Lab Reports
        academic_course_patterns = [
            r"\bcourse\s+syllabus\b",
            r"\bsyllabus\s+for\b",
            r"\bgrading\s+policy\b",
            r"\boffice\s+hours\s*:\s*",
            r"\bprerequisites\s*:\s*",
            r"\blab\s+report\s*:\s*",
            r"\bassignment\s*#\s*\d+",
            r"\bhomework\s*#\s*\d+",
            r"\bproblem\s+set\s*#?\s*\d+",
            r"\blecture\s+notes\b",
            r"\bteaching\s+assistant\s*:\s*",
        ]
        academic_course_score = sum(1 for p in academic_course_patterns if re.search(p, lower))
        if academic_course_score >= 2:
            return False, "This document appears to be an academic course syllabus or assignment, not a candidate resume."

        # H. Research Papers & Journal Articles
        research_paper_patterns = [
            r"\babstract\s*:\s*\n",
            r"\bdoi\s*:\s*10\.\d{4,9}/",
            r"\bliterature\s+review\b",
            r"\bproceedings\s+of\s+the\b",
            r"\bconcluding\s+remarks\b",
            r"\bmaterials\s+and\s+methods\b",
            r"\bresults\s+and\s+discussion\b",
        ]
        research_paper_score = sum(1 for p in research_paper_patterns if re.search(p, lower))
        if research_paper_score >= 2:
            return False, "This document appears to be an academic research paper or journal publication, not a candidate resume."

        # =========================================================================
        # 2. POSITIVE RESUME STRUCTURE EVALUATION
        # =========================================================================

        # Check for standalone section headers (line-anchored or uppercase heading)
        exp_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:professional\s+|work\s+|career\s+|relevant\s+|industry\s+)?(?:experience|employment|work\s+history|internships?)|internship\s+experience)\s*[:]?$",
            re.IGNORECASE
        )
        edu_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:academic\s+|educational\s+)?(?:education|qualifications|academic\s+background|academics))\s*[:]?$",
            re.IGNORECASE
        )
        skills_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:technical\s+|core\s+|professional\s+|key\s+)?(?:skills|competencies|technologies|tech\s+stack|tools\s*(?:&|and)\s*technologies|areas\s+of\s+expertise))\s*[:]?$",
            re.IGNORECASE
        )
        proj_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:key\s+|personal\s+|academic\s+|technical\s+)?(?:projects|portfolio))\s*[:]?$",
            re.IGNORECASE
        )
        sum_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:professional\s+|career\s+|executive\s+)?(?:summary|profile|objective|about\s+me))\s*[:]?$",
            re.IGNORECASE
        )
        cert_pattern = re.compile(
            r"^(?:(?:\d+[\.\)]\s*)?(?:licenses\s*(?:&|and)\s*)?(?:certifications?|credentials|achievements?|awards))\s*[:]?$",
            re.IGNORECASE
        )

        has_exp = False
        has_edu = False
        has_skills = False
        has_proj = False
        has_sum = False
        has_cert = False

        for line in lines:
            cleaned_line = line.strip("#*-_ \t")
            if not cleaned_line or len(cleaned_line) > 55:
                continue
            if exp_pattern.match(cleaned_line):
                has_exp = True
            elif edu_pattern.match(cleaned_line):
                has_edu = True
            elif skills_pattern.match(cleaned_line):
                has_skills = True
            elif proj_pattern.match(cleaned_line):
                has_proj = True
            elif sum_pattern.match(cleaned_line):
                has_sum = True
            elif cert_pattern.match(cleaned_line):
                has_cert = True

        # Also support single-line section starts like 'Skills: Python, Java...' or 'Education: B.Tech...'
        for line in lines:
            if re.match(r"^(?:technical\s+)?skills\s*:\s*[a-zA-Z]", line, re.I):
                has_skills = True
            if re.match(r"^(?:education|degree)\s*:\s*[a-zA-Z]", line, re.I):
                has_education = True
            if re.match(r"^(?:experience|work\s+history)\s*:\s*[a-zA-Z]", line, re.I):
                has_exp = True

        section_count = sum([has_exp, has_edu, has_skills, has_proj, has_sum, has_cert])

        # Candidate contact signals
        has_email = bool(re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", clean))
        has_phone = bool(re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b", clean))
        has_profile = bool(re.search(r"linkedin\.com/in/|github\.com/|gitlab\.com/", lower))
        contact_count = sum([has_email, has_phone, has_profile])

        # Career timeline and credentials
        has_date_range = bool(re.search(
            r"\b(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)\b|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(?:19|20)\d{2}|present|current)\b",
            lower
        ))
        has_degree = bool(re.search(r"\b(bachelor|master|b\.?tech|m\.?tech|b\.?e\b|m\.?e\b|b\.?s\b|m\.?s\b|bca|mca|ph\.?d|diploma|degree\s+in|university|college|institute|cgpa|gpa)\b", lower))
        has_roles = bool(re.search(r"\b(software\s+engineer|web\s+developer|developer|engineer|full\s*stack|backend|frontend|data\s+scientist|product\s+manager|devops|cloud\s+architect|intern)\b", lower))

        career_score = sum([has_date_range, has_degree, has_roles])

        # Standard resumes: 2+ standard section headers
        if section_count >= 2:
            return True, ""

        # Resumes with 1 explicit section header + contact details or career timeline
        if section_count >= 1 and (contact_count >= 1 or career_score >= 2):
            return True, ""

        # Compact / single-column resumes without header styling but clear contact and timeline signals
        if contact_count >= 2 and career_score >= 2:
            return True, ""

        return False, "This document does not appear to be a resume. It is missing standard resume sections such as work experience, education, or professional skills."

    @staticmethod
    def extract_contact_info(text: str) -> Dict[str, Any]:
        """Extract candidate name, email, phone, and online profiles."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        
        # Name heuristic: First bold/prominent header line that isn't a section, job title, or contact info
        full_name = "Candidate"
        ignored_name_words = {
            "professional", "experience", "education", "projects", "skills", "certifications",
            "summary", "profile", "objective", "curriculum", "vitae", "resume", "contact",
            "details", "information", "work", "history", "academic", "background", "personal",
            "activities", "languages", "interests", "hobbies", "declaration", "references",
            "career", "developer", "engineer", "candidate", "internship", "internships", "software",
            "engineering", "intern", "trainee", "architect", "manager", "specialist", "consultant", "analyst"
        }
        for line in lines[:8]:
            clean = line.strip(" :#=-_")
            # Skip if contains email, phone, links, or digits
            if "@" in clean or re.search(r"\d", clean) or "http" in clean.lower() or "github" in clean.lower() or "linkedin" in clean.lower():
                continue
            words = [w.lower() for w in re.findall(r"[A-Za-z]+", clean)]
            if not words or any(w in ignored_name_words for w in words):
                continue
            if len(words) in [2, 3, 4] and len(clean) < 40 and re.match(r"^[A-Za-z\s\.\,\-]+$", clean):
                full_name = clean
                break

        # Fallback if full_name is still "Candidate": derive from LinkedIn profile handle if present
        if full_name == "Candidate":
            linkedin_match = re.search(r"linkedin\.com/in/([a-zA-Z0-9_\-]+)", text)
            if linkedin_match:
                slug = linkedin_match.group(1).replace("-", " ").replace("_", " ")
                slug_words = [w.title() for w in re.findall(r"[A-Za-z]+", slug) if len(w) > 1 and not any(ch.isdigit() for ch in w)]
                if slug_words:
                    full_name = " ".join(slug_words)

        # Email
        email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        email = email_match.group(0) if email_match else None

        # Phone
        phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
        phone = phone_match.group(0) if phone_match else None

        # Links (LinkedIn, GitHub, Portfolio)
        links = []
        for match in re.finditer(r"(https?://[^\s]+|github\.com/[^\s]+|linkedin\.com/in/[^\s]+)", text):
            url = match.group(0).rstrip(".,;")
            if url not in links:
                links.append(url)

        return {
            "full_name": full_name,
            "email": email,
            "phone": phone,
            "links": links
        }

    @classmethod
    def extract_skills(cls, text: str, sections: Optional[Dict[str, List[str]]] = None) -> CategorizedSkills:
        """
        Extract and categorize technical & domain skills found in resume text.
        Prioritizes skills, projects, experience, internships, and summary sections.
        Strictly excludes academic education/coursework lines and address/contact lines to prevent false matches.
        """
        if sections:
            relevant_lines = []
            if sections.get("skills"):
                relevant_lines.extend(sections["skills"])
            if sections.get("projects"):
                relevant_lines.extend(sections["projects"])
            if sections.get("experience"):
                relevant_lines.extend(sections["experience"])
            if sections.get("internships"):
                relevant_lines.extend(sections["internships"])
            if sections.get("summary"):
                relevant_lines.extend(sections["summary"])
            
            if not relevant_lines:
                relevant_lines = [l for l in text.split("\n") if not cls.is_education_line(l) and "@" not in l]
            search_text = " \n ".join(relevant_lines)
        else:
            search_text = "\n".join([l for l in text.split("\n") if not cls.is_education_line(l) and "@" not in l])

        search_text_lower = " " + search_text.lower() + " "
        
        categorized = {
            "programming_languages": [],
            "frameworks_libraries": [],
            "cloud_devops": [],
            "databases_data": [],
            "ai_ml_analytics": [],
            "tools_platforms": [],
            "soft_skills": [],
            "all_skills": []
        }
        
        for category, skills_list in TECH_SKILLS_TAXONOMY.items():
            for skill in skills_list:
                # 1. Strict validation for single-letter language 'c'
                if skill == "c":
                    is_c_match = False
                    if re.search(r"\bc\s*[/&,]\s*c\+\+|\bc\+\+\s*[/&,]\s*c\b", search_text, re.IGNORECASE):
                        is_c_match = True
                    elif re.search(r"\b(?:ansi\s+|embedded\s+)?c\s+(?:language|programming|code)\b|\bprogramming\s+in\s+c\b", search_text, re.IGNORECASE):
                        is_c_match = True
                    else:
                        for line in search_text.split("\n"):
                            line_clean = line.strip()
                            if re.search(r"\b(?:programming\s+languages?|languages?|tech\s+stack|technologies)\b", line_clean, re.IGNORECASE):
                                items = [re.sub(r"[^a-zA-Z0-9#+]", "", item.strip()).lower() for item in re.split(r"[,|/:]", line_clean)]
                                if "c" in items and "c++" not in items:
                                    is_c_match = True
                                    break
                    if not is_c_match:
                        continue

                # 2. Strict validation for 'java' (prevent matching JavaScript or Java Script)
                elif skill == "java":
                    java_pattern = r"(?<![a-zA-Z0-9_#+])java(?!\s*script|\s*-script|[a-zA-Z0-9_#+])"
                    if not re.search(java_pattern, search_text_lower):
                        continue

                # 3. Strict validation for single-letter language 'r'
                elif skill == "r":
                    is_r_match = False
                    if re.search(r"\br\s+(?:language|programming|code)\b|\bprogramming\s+in\s+r\b", search_text, re.IGNORECASE):
                        is_r_match = True
                    else:
                        for line in search_text.split("\n"):
                            line_clean = line.strip()
                            if re.search(r"\b(?:programming\s+languages?|languages?)\b", line_clean, re.IGNORECASE):
                                items = [re.sub(r"[^a-zA-Z0-9#+]", "", item.strip()).lower() for item in re.split(r"[,|/:]", line_clean)]
                                if "r" in items:
                                    is_r_match = True
                                    break
                    if not is_r_match:
                        continue

                # 4. Strict validation for 'go'
                elif skill == "go":
                    is_go_match = False
                    if re.search(r"\bgolang\b", search_text_lower):
                        is_go_match = True
                    elif re.search(r"\bgo\s+(?:language|programming|code)\b|\bprogramming\s+in\s+go\b", search_text_lower):
                        is_go_match = True
                    else:
                        for line in search_text.split("\n"):
                            line_clean = line.strip()
                            if re.search(r"\b(?:programming\s+languages?|languages?|tech\s+stack)\b", line_clean, re.IGNORECASE):
                                items = [re.sub(r"[^a-zA-Z0-9#+]", "", item.strip()).lower() for item in re.split(r"[,|/:]", line_clean)]
                                if "go" in items and "google" not in items:
                                    is_go_match = True
                                    break
                    if not is_go_match:
                        continue

                # Standard skill matching
                else:
                    pattern = r"(?<![a-zA-Z0-9_#+])" + re.escape(skill) + r"(?![a-zA-Z0-9_#+])"
                    if not re.search(pattern, search_text_lower):
                        continue

                display_name = skill.upper() if len(skill) <= 3 and skill not in ["css", "sql"] else skill.title()
                # Custom formatting for popular acronyms
                if skill in ["aws", "gcp", "k8s", "sql", "html", "css", "ci/cd", "api", "rest api", "grpc", "nlp", "llm", "llms", "etl", "da"]:
                    display_name = skill.upper()
                elif skill == "javascript":
                    display_name = "JavaScript"
                elif skill == "typescript":
                    display_name = "TypeScript"
                elif skill == "postgresql" or skill == "postgres":
                    display_name = "PostgreSQL"
                elif skill == "mongodb":
                    display_name = "MongoDB"
                elif skill == "nodejs" or skill == "node.js":
                    display_name = "Node.js"
                elif skill == "react.js" or skill == "react":
                    display_name = "React"
                elif skill == "vue.js" or skill == "vue":
                    display_name = "Vue.js"
                elif skill == "next.js" or skill == "nextjs":
                    display_name = "Next.js"
                elif skill == "fastapi":
                    display_name = "FastAPI"
                elif skill == "pytorch":
                    display_name = "PyTorch"
                elif skill == "tensorflow":
                    display_name = "TensorFlow"

                if display_name not in categorized[category]:
                    categorized[category].append(display_name)
                if display_name not in categorized["all_skills"]:
                    categorized["all_skills"].append(display_name)

        return CategorizedSkills(**categorized)

    @staticmethod
    def is_education_line(line: str) -> bool:
        """Check if a line contains educational degree, university, school or score markers."""
        edu_markers = [
            r"\bbachelor", r"\bmaster", r"\bb\.?tech\b", r"\bm\.?tech\b", r"\bb\.?e\b", r"\bm\.?e\b",
            r"\bb\.?s\b", r"\bm\.?s\b", r"\bbca\b", r"\bmca\b", r"\bphd\b", r"\bdiploma\b",
            r"\buniversity\b", r"\bcollege\b", r"\bschool\b", r"\binstitute\b", r"\bacademics?\b",
            r"\bcgpa\b", r"\bgpa\b", r"\bpercentage\b", r"\bmatriculation\b", r"\bhigher\s+secondary\b",
            r"\bsenior\s+secondary\b", r"\bsecondary\s+school\b", r"\bclass\s+(?:xii|x|12|10)\b",
            r"\bcbse\b", r"\bicse\b", r"\bdegree\b", r"\bintermediate\b", r"\bhsc\b", r"\bssc\b",
            r"\bcoursework\b", r"\bcurriculum\b", r"\bundergrad(?:uate)?\b", r"\bpostgrad(?:uate)?\b",
            r"\bdepartment\s+of\b", r"\bdept\.?\b", r"\bgraduation\b", r"\bgraduated\b",
            r"\bmajor\s+in\b", r"\bminor\s+in\b", r"\bpolytechnic\b"
        ]
        line_lower = line.lower()
        return any(re.search(pat, line_lower) for pat in edu_markers)

    @classmethod
    def is_education_context(cls, lines: List[str], idx: int) -> bool:
        """Check if a line or its surrounding lines (within 2 lines) indicate education."""
        start = max(0, idx - 2)
        end = min(len(lines), idx + 3)
        for j in range(start, end):
            if cls.is_education_line(lines[j]):
                return True
        return False

    @classmethod
    def split_sections(cls, text: str) -> Dict[str, List[str]]:
        """Segment resume into logical sections based on common headings."""
        section_patterns = {
            "education": r"^(?:education|educational|academics?|academic\s+(?:background|details|qualifications?|record|history)|qualifications?|degrees?|study|studies|scholastic)\b",
            "experience": r"^(?:(?:work|professional|employment|job|industry|career|practical|corporate)\s+(?:experience|history|background|record)|experience|employment|work\s+history)\b",
            "internships": r"^(?:internships?|internship\s+experience|industrial\s+training|trainee\s+experience)\b",
            "projects": r"^(?:(?:academic|personal|key|selected|technical|capstone)?\s*projects?)\b",
            "skills": r"^(?:(?:technical|core|key|professional)?\s*(?:skills|competencies|technologies|tools|proficiencies))\b",
            "certifications": r"^(?:certifications?|certificates?|licenses?|achievements?|awards?|honors?)\b",
            "summary": r"^(?:professional\s+summary|career\s+objective|summary|objective|about\s+me|profile)\b"
        }

        lines = [l.strip() for l in text.split("\n")]
        current_section = "general"
        sections: Dict[str, List[str]] = {
            "general": [], "education": [], "experience": [], "internships": [],
            "projects": [], "skills": [], "certifications": [], "summary": []
        }

        for line in lines:
            if not line:
                continue
            clean_line = line.strip(" :#=-_").lower()
            matched_section = None
            if len(clean_line.split()) <= 5:
                for sec_name, pattern in section_patterns.items():
                    if re.match(pattern, clean_line, re.IGNORECASE):
                        matched_section = sec_name
                        break
            
            if matched_section:
                current_section = matched_section
            else:
                sections[current_section].append(line)

        return sections

    @classmethod
    def calculate_experience_and_seniority(cls, text: str, sections: Optional[Dict[str, List[str]]] = None) -> Tuple[float, str, List[WorkExperience]]:
        """
        Extract years of experience strictly from professional experience/employment sections,
        excluding education degree spans (e.g. 4-year B.Tech / B.S. degrees),
        properly calibrating freshers and internships.
        """
        current_year = 2026
        current_month = 6
        text_lower = text.lower()

        fresher_indicators = [
            r"\bfresher\b",
            r"\brecent\s+grad(?:uate)?\b",
            r"\bcollege\s+student\b",
            r"\bundergraduate\b",
            r"\bentry\s*[- ]?level\b",
            r"\bseeking\s+(?:an\s+)?(?:entry|internship|trainee|job|career|full[-\s]?time)\b",
            r"\b0\s*(?:-\s*1)?\s*(?:years?|yrs?)(?:\s*of)?\s*experience\b",
            r"\bno\s+(?:prior\s+)?(?:work\s+)?experience\b",
            r"\bstudent\b",
            r"\bpre-final\s+year\b",
            r"\bfinal\s+year\b",
            r"\bclass\s+of\s+20\d{2}\b",
            r"\bexpected\s+(?:graduation|completion)\b",
            r"\bgraduating\s+(?:in|by)\s+20\d{2}\b",
            r"\blooking\s+for\s+(?:an\s+)?(?:entry|internship|first\s+job)\b"
        ]
        is_explicit_fresher = any(re.search(pat, text_lower) for pat in fresher_indicators)

        if sections is None:
            sections = cls.split_sections(text)

        # Collect lines designated strictly for professional experience or internships
        work_entries: List[Tuple[str, bool]] = []
        if sections.get("experience"):
            for l in sections["experience"]:
                work_entries.append((l, False))
        if sections.get("internships"):
            for l in sections["internships"]:
                work_entries.append((l, True))

        # If neither experience nor internships section exists, candidate has no corporate work history
        # (Avoid falling back to general lines, which often contain college degree spans like 2020-2024!)
        if not work_entries:
            exp_phrase = re.search(r"(?<!degree\s)(?<!bachelor\s)(?<!college\s)(\d{1,2})\+?\s*(?:years?|yrs?)(?:\s*of)?\s*experience", text, re.IGNORECASE)
            if exp_phrase and not is_explicit_fresher:
                years = float(exp_phrase.group(1))
                seniority = "Mid-Level Professional (3-6 yrs)" if years >= 3 else "Entry-Level (1-3 yrs)"
                return years, seniority, []
            else:
                return 0.0, "Fresher / Entry-Level (0 yrs)", []

        work_lines = [e[0] for e in work_entries]
        spans: List[float] = []
        sample_experiences: List[WorkExperience] = []
        has_fulltime_role = False

        month_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }

        span_pattern = re.compile(
            r"(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2})\s*(?:-|–|to)\s*(?:(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?((?:19|20)\d{2}|present|current)",
            re.IGNORECASE
        )

        for i, (line, from_intern_sec) in enumerate(work_entries):
            # Exclude lines that are part of education context
            if cls.is_education_context(work_lines, i):
                continue

            match = span_pattern.search(line)
            if match:
                start_month_str, start_year_str, end_month_str, end_year_str = match.groups()
                start_y = int(start_year_str)
                end_y = current_year if end_year_str.lower() in ["present", "current"] else int(end_year_str)

                surround_text = " ".join(work_lines[max(0, i-2):min(len(work_lines), i+3)])
                is_intern = from_intern_sec or bool(re.search(r"\b(?:intern|internship|trainee|apprentice|fellowship|volunteer|student|academic)\b", surround_text, re.IGNORECASE))

                diff_y = max(0, end_y - start_y)
                if start_month_str and end_month_str:
                    sm = month_map.get(start_month_str.lower()[:3], 1)
                    em = month_map.get(end_month_str.lower()[:3], 12) if end_year_str.lower() not in ["present", "current"] else current_month
                    total_months = max(1, (end_y - start_y) * 12 + (em - sm))
                    duration_years = max(0.1, round(total_months / 12.0, 1))
                else:
                    duration_years = float(diff_y)

                # Filter out standard college degree spans (3-5 years) that leaked into experience
                if not from_intern_sec and diff_y in [3, 4, 5]:
                    if any(re.search(pat, surround_text.lower()) for pat in [r"\bdegree\b", r"\bcollege\b", r"\buniversity\b", r"\btech\b", r"\bengineering\b", r"\bbachelor\b"]):
                        continue

                if is_intern:
                    role_years = round(min(duration_years, 0.5), 1)
                else:
                    has_fulltime_role = True
                    role_years = max(0.5, round(duration_years, 1))

                spans.append(role_years)
                role_title = work_lines[i-1][:60] if i > 0 and len(work_lines[i-1]) < 60 and not cls.is_education_line(work_lines[i-1]) else line[:60]
                sample_experiences.append(WorkExperience(
                    title=role_title,
                    duration=match.group(0),
                    years=role_years,
                    description=line[:120]
                ))

        total_calculated_years = 0.0
        if not spans or not has_fulltime_role or is_explicit_fresher:
            # Candidate has only internships, academic projects, or explicitly stated fresher
            total_calculated_years = 0.0
            if sample_experiences and any(e.years > 0 for e in sample_experiences):
                seniority = "Fresher (Internship Experience)"
            else:
                seniority = "Fresher / Entry-Level (0 yrs)"
        else:
            total_calculated_years = max(sum(spans) * 0.7, max(spans))
            total_calculated_years = round(min(total_calculated_years, 35.0), 1)
            
            if total_calculated_years < 1.0:
                seniority = "Junior / Entry-Level (<1 yr)"
            elif total_calculated_years < 3.0:
                seniority = "Entry-Level (1-3 yrs)"
            elif total_calculated_years < 6.0:
                seniority = "Mid-Level Professional (3-6 yrs)"
            elif total_calculated_years < 10.0:
                seniority = "Senior Specialist (6-10 yrs)"
            elif total_calculated_years < 15.0:
                seniority = "Lead / Staff Architect (10-15 yrs)"
            else:
                seniority = "Principal / Executive Leadership (15+ yrs)"

        return total_calculated_years, seniority, sample_experiences

    @classmethod
    def extract_education(cls, text: str, sections: Dict[str, List[str]]) -> List[Education]:
        """Extract structured academic degrees, institutions, and graduation years."""
        education_list = []
        edu_lines = sections.get("education", [])
        if not edu_lines:
            edu_lines = [l for l in text.split("\n") if cls.is_education_line(l)]

        edu_markers_primary = [
            r"\bbachelor", r"\bmaster", r"\bb\.?tech\b", r"\bm\.?tech\b", r"\bb\.?e\b", r"\bm\.?e\b",
            r"\bb\.?s\b", r"\bm\.?s\b", r"\bbca\b", r"\bmca\b", r"\bphd\b", r"\bdiploma\b",
            r"\bclass\s+(?:xii|x|12|10)\b", r"\bsecondary\b"
        ]

        for line in edu_lines:
            clean = line.strip(" -*•")
            if not clean or ("cgpa" in clean.lower() and not any(re.search(pat, clean.lower()) for pat in edu_markers_primary)):
                continue

            yr_match = re.search(r"((?:19|20)\d{2}\s*(?:-|–|to)\s*(?:(?:19|20)\d{2}|present|current)|(?:19|20)\d{2})", clean, re.IGNORECASE)
            yr = yr_match.group(0) if yr_match else ""

            parts = [p.strip() for p in re.split(r"[|•]", clean) if p.strip()]
            degree = ""
            institution = ""
            for part in parts:
                if any(re.search(pat, part, re.IGNORECASE) for pat in edu_markers_primary):
                    degree = part
                elif re.search(r"(?:university|college|institute|school|academy|campus|technol)", part, re.IGNORECASE):
                    institution = part

            if not degree and parts:
                degree = parts[0]
            if not institution and len(parts) > 1:
                institution = parts[1]

            if degree and len(degree) > 3:
                education_list.append(Education(
                    degree=degree[:70],
                    institution=institution[:70] if institution else "Accredited University / Institution",
                    year=yr if yr else "Graduated"
                ))
                if len(education_list) >= 3:
                    break

        return education_list

    @classmethod
    def extract_certifications(cls, text: str, sections: Dict[str, List[str]]) -> List[str]:
        """Extract professional licenses and certifications."""
        certs = []
        cert_lines = sections.get("certifications", [])
        for line in cert_lines:
            clean = line.strip(" -*•")
            if clean and len(clean) > 4 and len(clean) < 80:
                certs.append(clean)
                if len(certs) >= 4:
                    break

        # Check standard industry certifications if not in section
        common_certs = [
            "AWS Certified Solutions Architect", "AWS Certified Developer", "AWS Certified Cloud Practitioner",
            "Certified Kubernetes Administrator (CKA)", "Certified Kubernetes Application Developer (CKAD)",
            "HashiCorp Certified: Terraform Associate", "Google Cloud Certified Professional Cloud Architect",
            "Microsoft Certified: Azure Solutions Architect", "Certified Information Systems Security Professional (CISSP)",
            "CompTIA Security+", "CompTIA Network+", "Certified Scrum Master (CSM)", "Certified Scrum Product Owner (CSPO)",
            "PMP (Project Management Professional)"
        ]
        text_lower = text.lower()
        for c in common_certs:
            acronym = re.search(r"\(([^)]+)\)", c)
            acronym_str = acronym.group(1).lower() if acronym else ""
            c_clean = re.sub(r"\([^)]+\)", "", c).strip().lower()
            if (c_clean in text_lower or (acronym_str and f" {acronym_str} " in f" {text_lower} ")) and c not in certs:
                certs.append(c)
                if len(certs) >= 4:
                    break

        return certs

    @classmethod
    def parse(cls, raw_text: str) -> ParsedResume:
        """Parse raw resume text into a fully structured ParsedResume object."""
        sections = cls.split_sections(raw_text)
        contact = cls.extract_contact_info(raw_text)
        skills = cls.extract_skills(raw_text, sections=sections)
        total_years, seniority, experiences = cls.calculate_experience_and_seniority(raw_text, sections)

        # Extract Summary/Objective
        summary = ""
        if sections.get("summary"):
            summary = " ".join(sections["summary"][:4])
        else:
            summary_match = re.search(r"(?:summary|profile|about me|objective)[:\s\n]+([^\n]+(?:\n[^\n]+){1,4})", raw_text, re.IGNORECASE)
            if summary_match:
                summary = summary_match.group(1).strip()
            else:
                lines = [l.strip() for l in raw_text.split("\n") if len(l.strip()) > 30 and not cls.is_education_line(l)]
                summary = lines[0] if lines else "Candidate seeking career opportunities."

        education_list = cls.extract_education(raw_text, sections)
        certifications = cls.extract_certifications(raw_text, sections)

        return ParsedResume(
            full_name=contact["full_name"],
            email=contact["email"],
            phone=contact["phone"],
            links=contact["links"],
            summary=summary[:350],
            total_years_experience=total_years,
            seniority_level=seniority,
            skills=skills,
            experience=experiences,
            education=education_list,
            certifications=certifications,
            raw_text_preview=raw_text[:600] + ("..." if len(raw_text) > 600 else "")
        )
