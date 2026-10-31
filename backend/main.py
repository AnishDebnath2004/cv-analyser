import os
import logging
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query, Body, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.models import (
    AnalysisResult, ChatRequest, ChatResponse, SettingsModel,
    UserRegisterRequest, UserLoginRequest, UserResponse, AuthResponse
)
from backend.resume_parser import ResumeParser
from backend.onet_service import ONetService
from backend.agent import CVAgent
from backend.sample_resumes import SAMPLE_RESUMES
from backend.auth_service import auth_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cv_analyzer_api")

app = FastAPI(
    title="O*NET AI CV Analyzer & Career Guidance Agent",
    description="Intelligent AI Agent for scanning resumes and matching candidates to optimal O*NET job profiles.",
    version="1.0.1"
)

# Enable CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Runtime Settings state
runtime_settings = {
    "onet_api_key": os.getenv("ONET_API_KEY", ""),
    "onet_username": os.getenv("ONET_USERNAME", ""),
    "onet_password": os.getenv("ONET_PASSWORD", ""),
    "onet_version": os.getenv("ONET_API_VERSION", "v2"),
    "gemini_api_key": os.getenv("GEMINI_API_KEY", "")
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


@app.get("/api/health")
async def health_check():
    onet_service = get_onet_service()
    return {
        "status": "healthy",
        "onet_credentials_present": onet_service.has_credentials(),
        "gemini_configured": bool(runtime_settings["gemini_api_key"])
    }


# ==========================================
# Authentication & User Management Routes
# ==========================================

@app.post("/api/auth/register", response_model=AuthResponse)
@app.post("/api/auth/signup", response_model=AuthResponse)
async def register_user(payload: UserRegisterRequest):
    """Register a new user account and obtain session credentials."""
    try:
        user_dict, token = auth_service.register(
            email=payload.email,
            full_name=payload.full_name,
            password=payload.password
        )
        return AuthResponse(
            user=UserResponse(**user_dict),
            token=token,
            message="Account registered successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")


@app.post("/api/auth/login", response_model=AuthResponse)
async def login_user(payload: UserLoginRequest):
    """Authenticate with email and password to receive a session token."""
    try:
        user_dict, token = auth_service.login(
            email=payload.email,
            password=payload.password
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


@app.get("/api/auth/me", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Retrieve the currently authenticated user profile."""
    token = None
    if authorization:
        if authorization.lower().startswith("bearer "):
            token = authorization[7:].strip()
        else:
            token = authorization.strip()

    if not token:
        raise HTTPException(status_code=401, detail="Authentication token missing")

    user = auth_service.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")

    return UserResponse(**user)


@app.post("/api/auth/logout")
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


@app.get("/api/samples")
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


@app.post("/api/analyze/sample/{sample_id}", response_model=AnalysisResult)
async def analyze_sample(sample_id: str):
    """Analyze one of the pre-configured sample resumes."""
    if sample_id not in SAMPLE_RESUMES:
        raise HTTPException(status_code=404, detail="Sample resume not found")
    
    agent = get_cv_agent()
    sample_text = SAMPLE_RESUMES[sample_id]["text"]
    result = await agent.analyze(sample_text)
    return result


@app.post("/api/analyze/upload", response_model=AnalysisResult)
async def analyze_upload(file: UploadFile = File(...)):
    """Upload and analyze a resume file (PDF, DOCX, or TXT)."""
    filename = file.filename.lower() if file.filename else ""
    contents = await file.read()
    
    raw_text = ""
    try:
        if filename.endswith(".pdf"):
            raw_text = ResumeParser.extract_text_from_pdf(contents)
        elif filename.endswith(".docx"):
            raw_text = ResumeParser.extract_text_from_docx(contents)
        elif filename.endswith(".txt"):
            raw_text = contents.decode("utf-8", errors="ignore")
        else:
            # Fallback to UTF-8 decoding
            raw_text = contents.decode("utf-8", errors="ignore")
    except Exception as e:
        logger.error(f"Error parsing uploaded file {filename}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    if not raw_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded document contains no readable text. Please check the file.")

    agent = get_cv_agent()
    result = await agent.analyze(raw_text)
    return result


@app.post("/api/analyze/text", response_model=AnalysisResult)
async def analyze_text(payload: TextAnalyzeRequest):
    """Analyze pasted resume text."""
    if not payload.text.strip():
        raise HTTPException(status_code=400, detail="Resume text cannot be empty.")
    
    agent = get_cv_agent()
    result = await agent.analyze(payload.text)
    return result


@app.get("/api/onet/search")
async def onet_search(q: str = Query(..., min_length=1), limit: int = 10):
    """Search O*NET occupations by keyword or technology."""
    onet_service = get_onet_service()
    results = await onet_service.search_occupations(q, limit=limit)
    return {
        "query": q,
        "count": len(results),
        "results": results
    }


@app.get("/api/onet/occupations")
async def get_all_occupations():
    """Get all O*NET catalog occupations."""
    onet_service = get_onet_service()
    return onet_service.get_all_catalog()


@app.get("/api/onet/occupation/{soc_code}")
async def get_occupation_profile(soc_code: str):
    """Get full O*NET occupation profile by SOC code."""
    onet_service = get_onet_service()
    occ = await onet_service.get_occupation_details(soc_code)
    if not occ:
        raise HTTPException(status_code=404, detail="Occupation not found in O*NET catalog")
    return occ


@app.post("/api/onet/test")
async def test_onet_connection():
    """Test connection to O*NET Web Services API with currently stored credentials."""
    onet_service = get_onet_service()
    status = await onet_service.test_connection()
    return status


@app.get("/api/settings")
async def get_settings():
    """Get current configuration status (without leaking secrets)."""
    return {
        "onet_api_key_set": bool(runtime_settings["onet_api_key"]),
        "onet_username_set": bool(runtime_settings["onet_username"]),
        "onet_version": runtime_settings["onet_version"],
        "gemini_api_key_set": bool(runtime_settings["gemini_api_key"])
    }


@app.post("/api/settings")
async def update_settings(settings: SettingsModel):
    """Update runtime O*NET and Gemini API keys."""
    if settings.onet_api_key is not None:
        runtime_settings["onet_api_key"] = settings.onet_api_key.strip()
    if settings.onet_username is not None:
        runtime_settings["onet_username"] = settings.onet_username.strip()
    if settings.onet_password is not None:
        runtime_settings["onet_password"] = settings.onet_password.strip()
    if settings.onet_version:
        runtime_settings["onet_version"] = settings.onet_version.strip()
    if settings.gemini_api_key is not None:
        runtime_settings["gemini_api_key"] = settings.gemini_api_key.strip()

    onet_service = get_onet_service()
    connection_test = await onet_service.test_connection()

    return {
        "status": "Settings updated",
        "onet_connection": connection_test,
        "gemini_configured": bool(runtime_settings["gemini_api_key"])
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_with_agent(req: ChatRequest):
    """Interactive conversational agent for career advice based on the analyzed CV."""
    agent = get_cv_agent()
    response = await agent.chat(
        message=req.message,
        chat_history=req.chat_history,
        analysis_context=req.analysis_context
    )
    return response


# Serve built static frontend files if they exist
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CV Analyzer API is running. Frontend static build not yet generated."}

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Do not catch /api routes
        if full_path.startswith("api"):
            raise HTTPException(status_code=404, detail="API route not found")
        index_file = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"message": "CV Analyzer API is running. Frontend static build not yet generated."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
