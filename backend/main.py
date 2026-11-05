import os
import sys
import logging
from typing import Optional, Dict, Any, List, Tuple

# Ensure both current directory and parent directory are on sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Query, Body, Header, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

try:
    from backend.models import (
        AnalysisResult, ChatRequest, ChatResponse, SettingsModel,
        UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse,
        ForgotPasswordRequest, ResetPasswordRequest, MfaVerifyLoginRequest,
        MfaEnableRequest, MfaSetupResponse, SummaryAgentRequest, SummaryAgentResponse
    )
    from backend.resume_parser import ResumeParser
    from backend.onet_service import ONetService
    from backend.agent import CVAgent
    from backend.sample_resumes import SAMPLE_RESUMES
    from backend.auth_service import auth_service
    from backend.rate_limiter import (
        rate_limiter,
        InMemoryRateLimiter,
        rate_limit_login,
        rate_limit_register,
        rate_limit_forgot_password,
        rate_limit_mfa,
        rate_limit_upload
    )
except ImportError:
    from models import (
        AnalysisResult, ChatRequest, ChatResponse, SettingsModel,
        UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse,
        ForgotPasswordRequest, ResetPasswordRequest, MfaVerifyLoginRequest,
        MfaEnableRequest, MfaSetupResponse, SummaryAgentRequest, SummaryAgentResponse
    )
    from resume_parser import ResumeParser
    from onet_service import ONetService
    from agent import CVAgent
    from sample_resumes import SAMPLE_RESUMES
    from auth_service import auth_service
    from rate_limiter import (
        rate_limiter,
        InMemoryRateLimiter,
        rate_limit_login,
        rate_limit_register,
        rate_limit_forgot_password,
        rate_limit_mfa,
        rate_limit_upload
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cv_analyzer_api")

app = FastAPI(
    title="O*NET AI CV Analyzer & Career Guidance Agent",
    description="Intelligent AI Agent for scanning resumes and matching candidates to optimal O*NET job profiles.",
    version="1.0.2",
    redirect_slashes=False
)

api_router = APIRouter(redirect_slashes=False)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Runtime Settings state - default automatically to Supabase Cloud credentials
runtime_settings = {
    "onet_api_key": os.getenv("ONET_API_KEY", ""),
    "onet_username": os.getenv("ONET_USERNAME", ""),
    "onet_password": os.getenv("ONET_PASSWORD", ""),
    "onet_version": os.getenv("ONET_API_VERSION", "v2"),
    "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
    "supabase_url": os.getenv("SUPABASE_URL", "https://npiudrqpunpcrpautaif.supabase.co"),
    "supabase_key": os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "sb_publishable_wcYoLbpSHZKmRhNL8oDKBw_UcPDH_8D")
}


def get_onet_service() -> ONetService:
    return ONetService(
        api_key=runtime_settings["onet_api_key"],
        username=runtime_settings["onet_username"],
        password=runtime_settings["onet_password"],
        version=runtime_settings["onet_version"]
    )


def get_cv_agent() -> CVAgent:
    return CVAgent(
        onet_service=get_onet_service(),
        gemini_api_key=runtime_settings["gemini_api_key"]
    )


class TextAnalyzeRequest(BaseModel):
    text: str


def _get_authenticated_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """Helper dependency to retrieve user from authorization header."""
    token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(status_code=401, detail="Authentication required. Please sign up or log in to create and edit your resume.")

    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token. Please log in again.")

    return user


def check_analysis_quota(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Tuple[Optional[Dict[str, Any]], str]:
    """
    Enforces analysis quota:
    - Logged-in users have unlimited resume analyses.
    - Anonymous/guest users are limited to 2 free analyses.
    Returns (user_dict_or_none, client_ip).
    """
    token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if token:
        user = auth_service.get_user_by_token(token)
        if user:
            return user, InMemoryRateLimiter.get_client_ip(request)

    # Anonymous user: check quota
    client_ip = InMemoryRateLimiter.get_client_ip(request)
    allowed, remaining = rate_limiter.check_guest_quota(client_ip, max_allowed=2)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Free analysis limit reached (2 free analyses). Please sign up or log in to continue analyzing resumes."
        )
    return None, client_ip


@api_router.get("/health")
async def health_check():
    try:
        onet_service = get_onet_service()
        return {
            "status": "healthy",
            "onet_credentials_present": onet_service.has_credentials(),
            "gemini_configured": bool(runtime_settings["gemini_api_key"]),
            "auth_provider": "supabase",
            "supabase_active": True
        }
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return {
            "status": "degraded",
            "error": str(e)
        }


@api_router.get("/auth/provider")
async def get_auth_provider():
    """Get the active authentication and database provider."""
    return {
        "provider": "supabase",
        "supabase_active": True,
        "supabase_configured": True
    }


# ==========================================
# Authentication & User Management Routes
# ==========================================

@api_router.post("/auth/register", response_model=AuthResponse, dependencies=[Depends(rate_limit_register)])
@api_router.post("/auth/signup", response_model=AuthResponse, dependencies=[Depends(rate_limit_register)])
async def register_user(payload: UserRegisterRequest):
    """Register a new user account in Supabase with persistent credentials."""
    try:
        user_dict, token = auth_service.register(
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password
        )
        return AuthResponse(
            user=UserResponse(**user_dict),
            token=token,
            message="Account registered successfully in Supabase"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")


@api_router.post("/auth/login", response_model=AuthResponse, dependencies=[Depends(rate_limit_login)])
async def login_user(payload: UserLoginRequest):
    """Authenticate with email and password to receive a session token or MFA challenge."""
    try:
        user_dict, token, temp_mfa_token = auth_service.login(
            email=payload.email,
            password=payload.password
        )
        if temp_mfa_token:
            return AuthResponse(
                mfa_required=True,
                temp_token=temp_mfa_token,
                message="Two-Factor Authentication required. Please enter your 6-digit code."
            )
        return AuthResponse(
            user=UserResponse(**user_dict),
            token=token,
            message="Logged in successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during login")


@api_router.post("/auth/mfa/verify-login", response_model=AuthResponse, dependencies=[Depends(rate_limit_mfa)])
async def verify_mfa_login(payload: MfaVerifyLoginRequest):
    """Verify 6-digit TOTP code during two-factor login challenge."""
    try:
        user_dict, token = auth_service.verify_mfa_login(payload.temp_token, payload.code)
        return AuthResponse(
            user=UserResponse(**user_dict),
            token=token,
            message="Two-factor authentication verified successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"MFA verify login error: {e}")
        raise HTTPException(status_code=500, detail="Error verifying MFA code")


@api_router.post("/auth/mfa/setup", response_model=MfaSetupResponse)
async def setup_mfa(user: Dict[str, Any] = Depends(_get_authenticated_user)):
    """Generate 2FA secret and QR link for Google/Microsoft Authenticator."""
    try:
        setup_data = auth_service.setup_mfa(user)
        return MfaSetupResponse(**setup_data)
    except Exception as e:
        logger.error(f"MFA setup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/mfa/enable")
async def enable_mfa(payload: MfaEnableRequest, user: Dict[str, Any] = Depends(_get_authenticated_user)):
    """Verify 6-digit code and permanently enable MFA on account."""
    try:
        return auth_service.enable_mfa(user, payload.secret, payload.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"MFA enable error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/mfa/disable")
async def disable_mfa(user: Dict[str, Any] = Depends(_get_authenticated_user)):
    """Disable 2FA on account."""
    try:
        return auth_service.disable_mfa(user)
    except Exception as e:
        logger.error(f"MFA disable error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/auth/forgot-password", dependencies=[Depends(rate_limit_forgot_password)])
async def forgot_password(payload: ForgotPasswordRequest):
    """Generate 6-digit password recovery code for the user."""
    try:
        return auth_service.forgot_password(payload.email)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(status_code=500, detail="Error initiating password reset")


@api_router.post("/auth/reset-password")
async def reset_password(payload: ResetPasswordRequest):
    """Verify reset code and update user password."""
    try:
        return auth_service.reset_password(payload.email, payload.code, payload.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(status_code=500, detail="Error resetting password")


@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user(user: Dict[str, Any] = Depends(_get_authenticated_user)):
    """Retrieve the currently authenticated user profile."""
    return UserResponse(**user)


@api_router.post("/auth/logout")
async def logout_user(authorization: Optional[str] = Header(None)):
    """Log out and revoke the current session token."""
    token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if token:
        auth_service.logout(token)
    return {"status": "success", "message": "Logged out successfully"}


# ==========================================
# Core Resume Analysis Endpoints
# ==========================================

@api_router.get("/samples")
async def get_samples():
    """Return list of pre-configured sample resumes for instant testing."""
    summary_list = []
    for k, v in SAMPLE_RESUMES.items():
        summary_list.append({
            "id": v["id"],
            "title": v["title"],
            "candidate_name": v["candidate_name"],
            "headline": v["headline"],
            "experience": v["experience"]
        })
    return summary_list


@api_router.post("/analyze/sample/{sample_id}", response_model=AnalysisResult)
async def analyze_sample(
    request: Request,
    sample_id: str,
    authorization: Optional[str] = Header(None)
):
    """Analyze one of the pre-configured sample resumes."""
    auth_user, client_ip = check_analysis_quota(request, authorization)
    if sample_id not in SAMPLE_RESUMES:
        raise HTTPException(status_code=404, detail="Sample resume not found")
    
    agent = get_cv_agent()
    sample_text = SAMPLE_RESUMES[sample_id]["text"]
    result = await agent.analyze(sample_text)
    if auth_user is None:
        rate_limiter.record_guest_analysis(client_ip)
    return result


@api_router.get("/analyze/quota")
async def get_analysis_quota(request: Request, authorization: Optional[str] = Header(None)):
    """Return remaining guest analysis quota or unlimited status for logged-in user."""
    token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()
    if token:
        user = auth_service.get_user_by_token(token)
        if user:
            return {"authenticated": True, "remaining": -1, "max_allowed": -1}
    client_ip = InMemoryRateLimiter.get_client_ip(request)
    remaining = rate_limiter.get_guest_remaining(client_ip, max_allowed=2)
    return {"authenticated": False, "remaining": remaining, "max_allowed": 2}


@api_router.post("/analyze/upload", response_model=AnalysisResult, dependencies=[Depends(rate_limit_upload)])
async def analyze_upload(
    request: Request,
    file: UploadFile = File(...),
    authorization: Optional[str] = Header(None)
):
    """Upload and analyze a resume file (PDF, DOCX, or TXT)."""
    auth_user, client_ip = check_analysis_quota(request, authorization)
    filename = file.filename.lower() if file.filename else ""
    contents = await file.read()
    
    if len(contents) > 4.5 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="File size exceeds Vercel's 4.5MB serverless limit. Please compress the document or use 'Paste Text'."
        )

    raw_text = ""
    try:
        if filename.endswith(".pdf") or contents.startswith(b"%PDF") or b"/Root" in contents[:1024]:
            raw_text = ResumeParser.extract_text_from_pdf(contents)
        elif filename.endswith(".docx") or contents.startswith(b"PK\x03\x04"):
            raw_text = ResumeParser.extract_text_from_docx(contents)
        elif filename.endswith(".txt"):
            raw_text = contents.decode("utf-8", errors="ignore")
        else:
            try:
                raw_text = ResumeParser.extract_text_from_pdf(contents)
            except Exception:
                raw_text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Error parsing uploaded file {filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded document contains no readable text. Please check the file.")

    # Validate that the uploaded document is actually a resume/CV
    is_resume_valid, resume_warning = ResumeParser.validate_is_resume(raw_text)
    if not is_resume_valid:
        raise HTTPException(status_code=422, detail=resume_warning)

    try:
        agent = get_cv_agent()
        result = await agent.analyze(raw_text)
        if auth_user is None:
            rate_limiter.record_guest_analysis(client_ip)
        return result
    except Exception as e:
        logger.error(f"Analysis engine error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@api_router.post("/analyze/text", response_model=AnalysisResult)
async def analyze_text(
    request: Request,
    payload: TextAnalyzeRequest,
    authorization: Optional[str] = Header(None)
):
    """Analyze pasted resume text."""
    auth_user, client_ip = check_analysis_quota(request, authorization)
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")

    # Validate that the provided text is actually a resume/CV
    is_resume_valid, resume_warning = ResumeParser.validate_is_resume(payload.text)
    if not is_resume_valid:
        raise HTTPException(status_code=422, detail=resume_warning)

    try:
        agent = get_cv_agent()
        result = await agent.analyze(payload.text)
        if auth_user is None:
            rate_limiter.record_guest_analysis(client_ip)
        return result
    except Exception as e:
        logger.error(f"Analysis engine error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")


@api_router.get("/onet/search")
async def onet_search(q: str = Query(..., min_length=1), limit: int = 10):
    """Search O*NET occupations by keyword or technology."""
    onet_service = get_onet_service()
    results = await onet_service.search_occupations(q, limit=limit)
    return {
        "query": q,
        "count": len(results),
        "results": results
    }


@api_router.get("/onet/occupation/{soc_code}")
async def get_occupation_details(soc_code: str):
    """Retrieve full details for an O*NET occupation."""
    onet_service = get_onet_service()
    details = await onet_service.get_occupation_details(soc_code)
    if not details:
        raise HTTPException(status_code=404, detail="Occupation not found")
    return details


@api_router.get("/onet/skills/{soc_code}")
async def get_occupation_skills(soc_code: str):
    """Get required skills for an occupation."""
    onet_service = get_onet_service()
    skills = await onet_service.get_occupation_skills(soc_code)
    return skills


@api_router.get("/onet/knowledge/{soc_code}")
async def get_occupation_knowledge(soc_code: str):
    """Get knowledge domains for an occupation."""
    onet_service = get_onet_service()
    knowledge = await onet_service.get_occupation_knowledge(soc_code)
    return knowledge


@api_router.get("/onet/technology/{soc_code}")
async def get_occupation_technology(soc_code: str):
    """Get technology and software skills for an occupation."""
    onet_service = get_onet_service()
    technology = await onet_service.get_occupation_technology(soc_code)
    return technology


@api_router.get("/onet/hot-technologies")
async def get_hot_technologies():
    """Retrieve in-demand hot technologies from O*NET taxonomy."""
    onet_service = get_onet_service()
    return onet_service.get_hot_technologies()


@api_router.post("/onet/test")
async def test_onet_connection():
    """Test connection to the O*NET Web Services API."""
    onet_service = get_onet_service()
    return await onet_service.test_connection()


@api_router.post("/supabase/test")
async def test_supabase_connection():
    """Test connection to the configured Supabase instance."""
    return auth_service.test_supabase_connection()


@api_router.post("/chat", response_model=ChatResponse)
async def chat_with_agent(req: ChatRequest):
    """Interactive conversational agent for career advice based on the analyzed CV."""
    try:
        agent = get_cv_agent()
        response = await agent.chat(
            message=req.message,
            chat_history=req.chat_history,
            analysis_context=req.analysis_context
        )
        return response
    except Exception as e:
        logger.error(f"Chat agent error: {e}")
        return ChatResponse(
            reply="I encountered an issue processing that query. Please try again or rephrase your question.",
            suggested_questions=[
                "What are the top career recommendations for my profile?",
                "Which skill gaps should I prioritize first?"
            ]
        )


@api_router.post("/builder/generate-summary", response_model=SummaryAgentResponse)
async def generate_builder_summary(
    req: SummaryAgentRequest,
    authorization: Optional[str] = Header(None)
):
    """AI Agent endpoint to write or refine resume professional summary on demand (user must be authenticated)."""
    _get_authenticated_user(authorization)
    try:
        agent = get_cv_agent()
        res = await agent.generate_professional_summary(
            user_instruction=req.user_instruction or "",
            current_summary=req.current_summary or "",
            target_title=req.target_title or "",
            skills=req.skills,
            experience_highlights=req.experience_highlights,
            custom_gemini_key=req.custom_gemini_key or runtime_settings.get("gemini_api_key", ""),
        )
        return SummaryAgentResponse(
            summary=res["summary"],
            suggested_refinements=res.get("suggested_refinements", [])
        )
    except Exception as e:
        logger.error(f"Summary Agent error: {e}")
        return SummaryAgentResponse(
            summary="Results-oriented technical professional with a track record of building reliable, maintainable software and driving project success.",
            suggested_refinements=[
                "Make it more concise (2 sentences)",
                "Highlight technical architecture & scale"
            ]
        )



# Mount router to handle both /api prefixed routes AND root-relative routes seamlessly
app.include_router(api_router, prefix="/api")
app.include_router(api_router)


# Serve built static frontend files if they exist
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
ROOT_STATIC = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if not os.path.exists(STATIC_DIR):
    if os.path.exists(ROOT_STATIC):
        STATIC_DIR = ROOT_STATIC
    elif os.path.exists(FRONTEND_DIST):
        STATIC_DIR = FRONTEND_DIST

if os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CV Analyzer API is running. Frontend static build not yet generated."}

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CV Analyzer API is running. Frontend static build not yet generated."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
