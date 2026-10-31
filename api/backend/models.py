from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class WorkExperience(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    duration: Optional[str] = None
    years: Optional[float] = 0.0
    description: Optional[str] = None


class Education(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    year: Optional[str] = None


class CategorizedSkills(BaseModel):
    programming_languages: List[str] = []
    frameworks_libraries: List[str] = []
    cloud_devops: List[str] = []
    databases_data: List[str] = []
    ai_ml_analytics: List[str] = []
    tools_platforms: List[str] = []
    soft_skills: List[str] = []
    all_skills: List[str] = []


class ParsedResume(BaseModel):
    full_name: Optional[str] = "Applicant"
    email: Optional[str] = None
    phone: Optional[str] = None
    links: List[str] = []
    summary: Optional[str] = None
    total_years_experience: float = 0.0
    seniority_level: str = "Entry-Level"
    skills: CategorizedSkills = Field(default_factory=CategorizedSkills)
    experience: List[WorkExperience] = []
    education: List[Education] = []
    certifications: List[str] = []
    raw_text_preview: str = ""


class ONetSkillItem(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = "Skill"
    matched: bool = False


class SkillGapItem(BaseModel):
    skill: str
    category: str
    importance: str  # "Critical", "Recommended", "Bonus"
    learning_resource_hint: Optional[str] = None


class ScoreBreakdown(BaseModel):
    skill_score: float = 0.0          # 0 - 100 scale (Weight: 45%)
    experience_score: float = 0.0     # 0 - 100 scale (Weight: 25%)
    impact_score: float = 0.0         # 0 - 100 scale (Weight: 15%)
    hygiene_score: float = 0.0        # 0 - 100 scale (Weight: 15%)
    weighted_skill: float = 0.0       # 0.45 * skill_score
    weighted_experience: float = 0.0  # 0.25 * experience_score
    weighted_impact: float = 0.0      # 0.15 * impact_score
    weighted_hygiene: float = 0.0     # 0.15 * hygiene_score


class JobProfileMatch(BaseModel):
    soc_code: str
    title: str
    description: str
    match_score: int  # 0 - 100
    confidence: str  # "High", "Moderate", "Emerging"
    bright_outlook: bool = False
    bright_outlook_category: Optional[str] = None
    median_annual_salary: Optional[str] = None
    job_zone: Optional[int] = None
    job_zone_title: Optional[str] = None
    sample_titles: List[str] = []
    matched_skills: List[str] = []
    missing_skills: List[SkillGapItem] = []
    core_tasks: List[str] = []
    tools_and_technology: List[str] = []
    why_suited: str
    upskilling_path: List[str] = []
    ats_keywords_to_add: List[str] = []
    score_breakdown: Optional[ScoreBreakdown] = None


class AnalysisResult(BaseModel):
    candidate_summary: str
    profile: ParsedResume
    primary_domain: str
    estimated_seniority: str
    suitable_job_profiles: List[JobProfileMatch]
    general_strengths: List[str]
    critical_skill_gaps: List[str]
    career_pathways: List[Dict[str, Any]]
    resume_optimization_tips: List[str]
    data_source: str  # "O*NET Live API" or "O*NET Comprehensive Taxonomy"
    ai_model_used: str


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    chat_history: List[ChatMessage] = []
    analysis_context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    suggested_questions: List[str] = []


class SettingsModel(BaseModel):
    onet_api_key: Optional[str] = ""
    onet_username: Optional[str] = ""
    onet_password: Optional[str] = ""
    onet_version: str = "v2"  # "v2" or "v1.9"
    gemini_api_key: Optional[str] = ""


class UserRegisterRequest(BaseModel):
    email: str
    full_name: str
    password: str


class UserLoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    created_at: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    message: str = "Success"

