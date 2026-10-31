import os
import re
import json
import logging
from typing import List, Dict, Any, Optional
from backend.models import (
    ParsedResume, JobProfileMatch, SkillGapItem, AnalysisResult,
    ChatMessage, ChatResponse, ScoreBreakdown
)
from backend.resume_parser import ResumeParser
from backend.onet_service import ONetService

logger = logging.getLogger("cv_ai_agent")


class CVAgent:
    def __init__(self, onet_service: Optional[ONetService] = None, gemini_api_key: Optional[str] = None):
        self.onet_service = onet_service or ONetService()
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "").strip()

    @staticmethod
    def _calculate_quantified_impact(parsed: ParsedResume, raw_text: str = "") -> float:
        """
        Evaluate quantified business impact and metrics within resume text (0 - 100 scale).
        Detects percentages, financial indicators, volume/scale metrics, and latency/time reductions.
        """
        full_text = raw_text if raw_text else (parsed.raw_text_preview + " " + " ".join([e.description or "" for e in parsed.experience]))
        
        percentages = re.findall(r'\b\d+(?:\.\d+)?\s*%', full_text)
        financials = re.findall(r'[\$€£]\s*\d+(?:\.\d+)?[kKmMbB]?', full_text)
        scale_metrics = re.findall(
            r'\b\d[\d,]*(?:\.\d+)?\+?\s*(?:users|clients|customers|requests|reqs|rps|rpm|queries|rows|records|transactions|events|gb|tb|pb|services|microservices|endpoints|features|apis)\b',
            full_text, re.I
        )
        latency_time = re.findall(r'\b\d+(?:\.\d+)?\s*(?:ms|seconds|minutes|hours|days|weeks|months|x)\b', full_text, re.I)

        metric_count = len(percentages) + len(financials) + len(scale_metrics) + len(latency_time)

        if metric_count >= 6:
            return 100.0
        elif metric_count >= 4:
            return 85.0
        elif metric_count >= 2:
            return 70.0
        elif metric_count >= 1:
            return 50.0
        else:
            return 25.0

    @staticmethod
    def _calculate_ats_hygiene(parsed: ParsedResume, raw_text: str = "") -> float:
        """
        Evaluate ATS parsing hygiene, structure, contact data, and standard formatting (0 - 100 scale).
        """
        score = 0.0
        full_text = raw_text if raw_text else parsed.raw_text_preview

        # 1. Contact Completeness (up to 30 pts)
        if parsed.email and "@" in parsed.email:
            score += 10.0
        if parsed.phone and len(parsed.phone) >= 7:
            score += 10.0
        if parsed.links and len(parsed.links) > 0:
            score += 10.0

        # 2. Structural Headings & Sections (up to 30 pts)
        if parsed.experience and len(parsed.experience) > 0:
            score += 10.0
        if parsed.education and len(parsed.education) > 0:
            score += 10.0
        if parsed.summary or len(full_text) > 100:
            score += 10.0

        # 3. Categorized Skills Taxonomy (up to 20 pts)
        active_cats = 0
        if parsed.skills.programming_languages: active_cats += 1
        if parsed.skills.frameworks_libraries: active_cats += 1
        if parsed.skills.cloud_devops: active_cats += 1
        if parsed.skills.databases_data: active_cats += 1
        if parsed.skills.tools_platforms: active_cats += 1
        score += min(20.0, active_cats * 4.0)

        # 4. Readability & Layout Health (up to 20 pts)
        words = len(full_text.split())
        if 150 <= words <= 2500:
            score += 20.0
        elif words > 50:
            score += 10.0

        return min(100.0, max(20.0, score))

    def _calculate_occupation_match(self, parsed: ParsedResume, occ: Dict[str, Any], raw_text: str = "") -> JobProfileMatch:
        """
        Industry-standard weighted scoring model:
        Total score = 0.45 * (Verified Skill Match)
                    + 0.25 * (Project/Experience Depth)
                    + 0.15 * (Quantified Impact)
                    + 0.15 * (ATS Hygiene)
        """
        candidate_skills_lower = set([s.lower() for s in parsed.skills.all_skills])
        
        # O*NET tools and technologies
        onet_tools = occ.get("tools_and_technology", [])
        
        matched_tools = []
        missing_tools = []
        
        for tool in onet_tools:
            tool_lower = tool.lower()
            if tool_lower in candidate_skills_lower or any(s in tool_lower for s in candidate_skills_lower):
                matched_tools.append(tool)
            else:
                missing_tools.append(tool)

        # 1. Verified Skill Match (Weight: 0.45, 0 - 100 scale)
        matched_skills_count = len(matched_tools)
        total_expected = min(len(onet_tools), 8) if onet_tools else 1
        skill_score = min(100.0, (matched_skills_count / total_expected) * 100.0)

        # 2. Project / Experience Depth (Weight: 0.25, 0 - 100 scale)
        required_zone = occ.get("job_zone", 4)
        years = parsed.total_years_experience
        
        if required_zone >= 5:  # e.g., Data Scientist, Eng Manager (5+ yrs)
            duration_score = 70.0 if years >= 5 else (50.0 if years >= 3 else (35.0 if years >= 1 else 20.0))
        elif required_zone == 4:  # Bachelor's / 2-5 yrs
            duration_score = 70.0 if years >= 3 else (55.0 if years >= 1.5 else (40.0 if years >= 0.5 else 25.0))
        else:  # Zone 3 (0-2 yrs)
            duration_score = 70.0 if years >= 1 else 45.0
            
        role_count = len(parsed.experience)
        breadth_score = 30.0 if role_count >= 3 else (20.0 if role_count == 2 else (10.0 if role_count == 1 else 5.0))
        experience_score = min(100.0, duration_score + breadth_score)

        # 3. Quantified Impact (Weight: 0.15, 0 - 100 scale)
        impact_score = self._calculate_quantified_impact(parsed, raw_text=raw_text)

        # 4. ATS Hygiene (Weight: 0.15, 0 - 100 scale)
        hygiene_score = self._calculate_ats_hygiene(parsed, raw_text=raw_text)

        # Formula: Total score = 0.45(Skill) + 0.25(Depth) + 0.15(Impact) + 0.15(Hygiene)
        weighted_skill = 0.45 * skill_score
        weighted_experience = 0.25 * experience_score
        weighted_impact = 0.15 * impact_score
        weighted_hygiene = 0.15 * hygiene_score

        # Optional subtle title anchor bonus (+1-3 pts)
        title_bonus = 0.0
        preview_lower = parsed.raw_text_preview.lower()
        for sample_t in occ.get("sample_titles", []):
            if sample_t.lower() in preview_lower:
                title_bonus = 2.0
                break

        total_raw = weighted_skill + weighted_experience + weighted_impact + weighted_hygiene + title_bonus
        total_score = int(round(min(100.0, max(20.0, total_raw))))
        
        # Confidence classification
        if total_score >= 80:
            confidence = "High Match"
        elif total_score >= 65:
            confidence = "Moderate Fit"
        else:
            confidence = "Growth Potential"

        score_breakdown = ScoreBreakdown(
            skill_score=round(skill_score, 1),
            experience_score=round(experience_score, 1),
            impact_score=round(impact_score, 1),
            hygiene_score=round(hygiene_score, 1),
            weighted_skill=round(weighted_skill, 1),
            weighted_experience=round(weighted_experience, 1),
            weighted_impact=round(weighted_impact, 1),
            weighted_hygiene=round(weighted_hygiene, 1)
        )

        # Construct Missing Skills with Gap Priority
        skill_gaps = []
        for missing in missing_tools[:5]:
            importance = "Critical" if len(skill_gaps) < 2 else "Recommended"
            hint = f"Focus on mastering {missing} via hands-on projects and industry certifications."
            skill_gaps.append(SkillGapItem(
                skill=missing,
                category="Technical Competency",
                importance=importance,
                learning_resource_hint=hint
            ))

        # Rationale synthesis
        matched_str = ", ".join(matched_tools[:4]) if matched_tools else "general technical foundation"
        why_suited = (
            f"Your background exhibits strong alignment with {occ['title']}. "
            f"You possess core proficiencies in {matched_str}, and your {parsed.seniority_level} "
            f"status aligns with O*NET Job Zone {required_zone} expectations."
        )

        # Upskilling Recommendations
        upskilling = [
            f"Integrate {missing_tools[0]} into your portfolio projects" if missing_tools else "Deepen advanced architectural patterns",
            f"Familiarize yourself with O*NET core task: '{occ['core_tasks'][0][:80]}...'",
            f"Target industry certifications recognized in O*NET Job Zone {required_zone}."
        ]

        # ATS Keywords
        ats_keywords = onet_tools[:6] + [occ["title"]]

        return JobProfileMatch(
            soc_code=occ["soc_code"],
            title=occ["title"],
            description=occ["description"],
            match_score=total_score,
            confidence=confidence,
            bright_outlook=occ.get("bright_outlook", False),
            bright_outlook_category=occ.get("bright_outlook_category"),
            median_annual_salary=occ.get("median_annual_salary", "$110,000"),
            job_zone=occ.get("job_zone", 4),
            job_zone_title=occ.get("job_zone_title", "Considerable Preparation"),
            sample_titles=occ.get("sample_titles", []),
            matched_skills=matched_tools,
            missing_skills=skill_gaps,
            core_tasks=occ.get("core_tasks", []),
            tools_and_technology=occ.get("tools_and_technology", []),
            why_suited=why_suited,
            upskilling_path=upskilling,
            ats_keywords_to_add=ats_keywords,
            score_breakdown=score_breakdown
        )

    async def _enhance_with_gemini(
        self,
        parsed: ParsedResume,
        top_matches: List[JobProfileMatch],
        primary_domain: str,
        api_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Use Google Gemini API via official google-genai SDK to enrich the career analysis
        with personalized executive narrative and strategic career coaching.
        """
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=api_key)
            
            top_match_summary = "\n".join([
                f"- {m.title} (SOC {m.soc_code}): Match {m.match_score}%, Matched: {', '.join(m.matched_skills[:4])}, Missing: {', '.join([g.skill for g in m.missing_skills[:3]])}"
                for m in top_matches[:3]
            ])

            prompt = f"""
You are an expert AI Career Strategist and Principal Technical Recruiter analyzing a candidate's CV against standard O*NET (Occupational Information Network) job profiles.

Candidate Profile:
- Name: {parsed.full_name}
- Total Years Experience: {parsed.total_years_experience} yrs ({parsed.seniority_level})
- Primary Skills: {", ".join(parsed.skills.all_skills[:15])}
- Target O*NET Matches:
{top_match_summary}

Please provide an expert career assessment in strictly valid JSON format with the following keys:
{{
  "candidate_summary": "2-3 sentences synthesizing candidate's technical identity, strengths, and market positioning.",
  "executive_strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "career_pathways": [
    {{
      "role": "Role Name",
      "horizon": "Immediate (0-6 mo) or Strategic (1-3 yrs)",
      "rationale": "Why this is an ideal trajectory step"
    }}
  ],
  "resume_optimization_tips": [
    "Actionable bullet point tip 1",
    "Actionable ATS tip 2",
    "Actionable metric/impact tip 3"
  ]
}}

Return ONLY valid JSON.
"""
            # Use gemini-1.5-flash
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.3
                )
            )
            
            if response and response.text:
                return json.loads(response.text)
        except Exception as e:
            logger.warning(f"Gemini enrichment call failed: {e}. Falling back to deterministic narrative.")
        return None

    async def analyze(self, raw_text: str, custom_gemini_key: Optional[str] = None) -> AnalysisResult:
        """
        Execute full AI Agent analysis pipeline:
        1. Parse resume
        2. Query O*NET taxonomy and live API
        3. Score job profile fit
        4. Perform gap analysis
        5. Generate career pathways & ATS optimization
        6. Apply Gemini enrichment if available
        """
        # Step 1: Parse
        parsed = ResumeParser.parse(raw_text)

        # Step 2: Fetch O*NET occupations catalog
        all_occupations = self.onet_service.get_all_catalog()

        # Step 3: Match & Score
        matches = [self._calculate_occupation_match(parsed, occ, raw_text=raw_text) for occ in all_occupations]
        
        # Sort matches by match_score descending
        matches.sort(key=lambda m: m.match_score, reverse=True)
        top_matches = matches[:6]

        # Determine Primary Domain
        top_title = top_matches[0].title if top_matches else "Software Engineering"
        if "Data" in top_title or "Intelligence" in top_title:
            primary_domain = "Data Science & Artificial Intelligence"
        elif "Cloud" in top_title or "DevOps" in top_title:
            primary_domain = "Cloud Architecture & Infrastructure"
        elif "Security" in top_title:
            primary_domain = "Cybersecurity & Information Protection"
        elif "Design" in top_title or "Web" in top_title:
            primary_domain = "Frontend & Product Experience"
        elif "Project" in top_title or "Manager" in top_title:
            primary_domain = "Technical Leadership & Product Management"
        else:
            primary_domain = "Full-Stack Software Engineering"

        # General strengths synthesis
        general_strengths = [
            f"Proficiency in core tech stack: {', '.join(parsed.skills.all_skills[:5])}" if parsed.skills.all_skills else "Solid general foundational background",
            f"{parsed.seniority_level} profile demonstrating continuous technical evolution.",
            f"Direct alignment with high-demand O*NET occupations ({top_matches[0].title})."
        ]

        # Aggregated critical skill gaps
        critical_gaps = []
        for m in top_matches[:3]:
            for g in m.missing_skills:
                if g.importance == "Critical" and g.skill not in critical_gaps:
                    critical_gaps.append(g.skill)

        # Default career pathways
        career_pathways = [
            {
                "role": top_matches[0].title,
                "horizon": "Immediate Match (0-6 months)",
                "rationale": f"High baseline skill alignment ({top_matches[0].match_score}%). Focus on polishing O*NET core competencies."
            },
            {
                "role": top_matches[1].title if len(top_matches) > 1 else "Senior Engineer",
                "horizon": "Strategic Expansion (6-18 months)",
                "rationale": "Build out adjacent skills to expand your addressable role pool."
            },
            {
                "role": "Computer and Information Systems Managers (Lead/Architect)",
                "horizon": "Long-Term Trajectory (2-4 years)",
                "rationale": "Step into technical ownership, architecture, and team mentorship."
            }
        ]

        resume_optimization_tips = [
            f"Incorporate high-frequency O*NET ATS keywords: {', '.join(top_matches[0].ats_keywords_to_add[:4])}.",
            "Quantify your accomplishments using the XYZ framework: 'Accomplished [X] as measured by [Y] by doing [Z]'.",
            f"Align project bullet points with O*NET core task: '{top_matches[0].core_tasks[0][:75]}...'",
            "Include a designated 'Technical Skills' section partitioned into Languages, Frameworks, Cloud, and Tools for ATS scanners."
        ]

        candidate_summary = (
            f"{parsed.full_name or 'Candidate'} is a {parsed.seniority_level} with "
            f"demonstrated expertise in {', '.join(parsed.skills.all_skills[:6]) if parsed.skills.all_skills else 'software technologies'}. "
            f"Analysis against O*NET Occupational Standards reveals highest compatibility with {top_matches[0].title} "
            f"({top_matches[0].match_score}% fit score) and {top_matches[1].title if len(top_matches) > 1 else 'related domains'}."
        )

        ai_model_name = "O*NET Semantic Match Engine"

        # Check for Gemini API Key
        effective_gemini_key = custom_gemini_key or self.gemini_api_key
        if effective_gemini_key:
            gemini_enrichment = await self._enhance_with_gemini(
                parsed, top_matches, primary_domain, effective_gemini_key
            )
            if gemini_enrichment:
                ai_model_name = "Google Gemini 1.5 Flash + O*NET Engine"
                if gemini_enrichment.get("candidate_summary"):
                    candidate_summary = gemini_enrichment["candidate_summary"]
                if gemini_enrichment.get("executive_strengths"):
                    general_strengths = gemini_enrichment["executive_strengths"]
                if gemini_enrichment.get("career_pathways"):
                    career_pathways = gemini_enrichment["career_pathways"]
                if gemini_enrichment.get("resume_optimization_tips"):
                    resume_optimization_tips = gemini_enrichment["resume_optimization_tips"]

        data_source = "O*NET Live Web Services API" if self.onet_service.has_credentials() else "O*NET Comprehensive Taxonomy"

        return AnalysisResult(
            candidate_summary=candidate_summary,
            profile=parsed,
            primary_domain=primary_domain,
            estimated_seniority=parsed.seniority_level,
            suitable_job_profiles=top_matches,
            general_strengths=general_strengths,
            critical_skill_gaps=critical_gaps[:6],
            career_pathways=career_pathways,
            resume_optimization_tips=resume_optimization_tips,
            data_source=data_source,
            ai_model_used=ai_model_name
        )

    async def chat(
        self,
        message: str,
        chat_history: List[ChatMessage],
        analysis_context: Optional[Dict[str, Any]] = None,
        custom_gemini_key: Optional[str] = None
    ) -> ChatResponse:
        """
        Interactive career counselor agent chat.
        """
        effective_key = custom_gemini_key or self.gemini_api_key
        
        # If Gemini is available, use LLM conversational generation
        if effective_key:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=effective_key)
                
                context_str = ""
                if analysis_context:
                    top_roles = [f"{p.get('title')} ({p.get('match_score')}%)" for p in analysis_context.get("suitable_job_profiles", [])[:3]]
                    context_str = (
                        f"Context: Candidate '{analysis_context.get('profile', {}).get('full_name')}' "
                        f"has skills {', '.join(analysis_context.get('profile', {}).get('skills', {}).get('all_skills', []))}. "
                        f"Top O*NET matches: {', '.join(top_roles)}."
                    )

                system_instruction = (
                    "You are Antigravity Career AI, a senior technical recruiter and career coach. "
                    "You provide sharp, encouraging, highly specific career advice, resume improvement tips, "
                    "and O*NET occupational guidance. Always be constructive and actionable."
                )

                messages = []
                for h in chat_history[-6:]:
                    messages.append(f"{h.role.capitalize()}: {h.content}")
                messages.append(f"User: {message}")
                
                full_prompt = f"{system_instruction}\n\n{context_str}\n\n" + "\n".join(messages)

                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=full_prompt
                )
                if response and response.text:
                    return ChatResponse(
                        reply=response.text,
                        suggested_questions=[
                            "How can I tailor my resume for the highest matching role?",
                            "What project should I build next to close skill gaps?",
                            "What are the typical interview questions for this O*NET occupation?"
                        ]
                    )
            except Exception as e:
                logger.warning(f"Gemini chat failed: {e}. Using deterministic response agent.")

        # Deterministic Conversational Agent Fallback
        msg_lower = message.lower()
        if "gap" in msg_lower or "missing" in msg_lower or "learn" in msg_lower:
            reply = (
                "Based on the O*NET occupational standards, closing skill gaps is most efficiently done through "
                "targeted, portfolio-grade projects. I recommend picking 1-2 critical missing tools (such as Docker, "
                "Kubernetes, or Cloud deployment) and building an end-to-end application highlighting those technologies. "
                "Be sure to showcase the code publicly on GitHub and document key architecture decisions in your README."
            )
        elif "ats" in msg_lower or "resume" in msg_lower or "format" in msg_lower:
            reply = (
                "For optimal ATS (Applicant Tracking System) performance:\n"
                "1. Include exact O*NET terminology and keywords in your dedicated Skills section.\n"
                "2. Standardize section headers: 'Work Experience', 'Technical Skills', 'Education'.\n"
                "3. Use strong action verbs (Architected, Engineered, Optimized, Delivered) paired with quantifiable business impact (e.g., 'reduced API latency by 42%').\n"
                "4. Keep the format clean without complex multi-column text boxes."
            )
        elif "salary" in msg_lower or "pay" in msg_lower or "compensation" in msg_lower:
            reply = (
                "According to official O*NET and BLS wage data, technical roles in this tier typically carry median "
                "annual salaries ranging from $95,000 to $135,000+, scaling upwards with seniority, location, and specialization. "
                "Highlighting high-impact competencies like cloud systems and architecture significantly strengthens your compensation leverage."
            )
        else:
            reply = (
                f"Analyzing your question regarding career trajectory: Your profile has high market value. "
                f"Your best strategy is to double down on your top O*NET matched occupation while strategically "
                f"integrating 1-2 missing high-demand tools into your resume. Would you like specific advice on tailoring "
                f"your work experience bullet points or exploring salary projections?"
            )

        return ChatResponse(
            reply=reply,
            suggested_questions=[
                "How do I optimize my resume for ATS scanners?",
                "What certifications give the best ROI for this role?",
                "Which project will best prove my missing skills?"
            ]
        )
