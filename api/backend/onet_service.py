import os
import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.onet_taxonomy import ONET_OCCUPATIONS, get_occupation_by_code, search_local_occupations

logger = logging.getLogger("onet_service")


class ONetService:
    def __init__(self, api_key: Optional[str] = None, username: Optional[str] = None, password: Optional[str] = None, version: str = "v2"):
        self.api_key = api_key or os.getenv("ONET_API_KEY", "").strip()
        self.username = username or os.getenv("ONET_USERNAME", "").strip()
        self.password = password or os.getenv("ONET_PASSWORD", "").strip()
        self.version = version or os.getenv("ONET_API_VERSION", "v2").strip()
        
        # Base URLs for O*NET Web Services
        self.v2_base_url = "https://api-v2.onetcenter.org"
        self.v1_base_url = "https://services.onetcenter.org/ws"

    def has_credentials(self) -> bool:
        """Check if any valid credential configuration exists."""
        if self.version == "v2" and self.api_key:
            return True
        if self.version == "v1.9" and self.username and self.password:
            return True
        # If API key is provided, assume v2
        if self.api_key:
            return True
        return False

    def _get_headers_and_auth(self):
        """Prepare headers and HTTP Basic auth depending on version."""
        headers = {
            "Accept": "application/json",
            "User-Agent": "AI-CV-Analyzer/1.0"
        }
        auth = None
        
        if self.api_key:
            headers["X-API-Key"] = self.api_key
        elif self.username and self.password:
            auth = (self.username, self.password)
            
        return headers, auth

    async def test_connection(self) -> Dict[str, Any]:
        """Test the live O*NET Web Services API connection."""
        if not self.has_credentials():
            return {
                "success": False,
                "mode": "offline",
                "message": "No O*NET credentials provided. Operating in Offline High-Fidelity Knowledge Base mode."
            }

        headers, auth = self._get_headers_and_auth()
        url = f"{self.v2_base_url}/v1.0/mnm/search?keyword=software" if self.version == "v2" else f"{self.v1_base_url}/mnm/search?keyword=software"
        
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, headers=headers, auth=auth)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "success": True,
                        "mode": "live",
                        "status_code": resp.status_code,
                        "message": "Connected to O*NET Web Services API successfully!",
                        "sample_count": len(data.get("career", data.get("occupation", [])))
                    }
                else:
                    return {
                        "success": False,
                        "mode": "fallback",
                        "status_code": resp.status_code,
                        "message": f"O*NET API responded with HTTP {resp.status_code}: {resp.text[:150]}"
                    }
        except Exception as e:
            logger.warning(f"O*NET connection test failed: {e}")
            return {
                "success": False,
                "mode": "fallback",
                "message": f"Network or connection error to O*NET API: {str(e)}"
            }

    async def search_occupations(self, keyword: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for occupations using live O*NET API if credentials exist,
        otherwise use the local comprehensive taxonomy.
        """
        if not self.has_credentials():
            return search_local_occupations(keyword, limit=limit)

        headers, auth = self._get_headers_and_auth()
        url = f"{self.v2_base_url}/v1.0/mnm/search" if self.version == "v2" else f"{self.v1_base_url}/mnm/search"
        params = {"keyword": keyword, "end": limit}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, headers=headers, auth=auth, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    careers = data.get("career", data.get("occupation", []))
                    if not careers and isinstance(data, dict):
                        careers = data.get("careers", {}).get("career", [])
                        
                    formatted_results = []
                    for c in careers[:limit]:
                        code = c.get("code", "")
                        # Try to augment with rich local database
                        local_match = get_occupation_by_code(code)
                        if local_match:
                            formatted_results.append(local_match)
                        else:
                            formatted_results.append({
                                "soc_code": code,
                                "title": c.get("title", "Occupation"),
                                "description": c.get("description", c.get("tags", {}).get("bright_outlook", "Standard occupational profile")),
                                "bright_outlook": bool(c.get("tags", {}).get("bright_outlook")),
                                "bright_outlook_category": "Bright Outlook" if c.get("tags", {}).get("bright_outlook") else None,
                                "job_zone": 4,
                                "job_zone_title": "Considerable Preparation",
                                "median_annual_salary": "$105,000",
                                "sample_titles": [c.get("title", "")],
                                "core_tasks": ["Execute specialized occupational responsibilities."],
                                "knowledge": ["Information Technology", "Computers and Electronics"],
                                "skills": ["Critical Thinking", "Complex Problem Solving", "Systems Analysis"],
                                "tools_and_technology": [keyword.capitalize()]
                            })
                    if formatted_results:
                        return formatted_results
        except Exception as e:
            logger.warning(f"Error fetching live O*NET search: {e}. Falling back to curated taxonomy.")

        # Fallback to local taxonomy
        return search_local_occupations(keyword, limit=limit)

    async def get_occupation_details(self, soc_code: str) -> Optional[Dict[str, Any]]:
        """
        Get full details for an occupation by SOC code.
        """
        local_occ = get_occupation_by_code(soc_code)
        
        # If we don't have credentials, return local data
        if not self.has_credentials():
            return local_occ

        # If live credentials exist, try to query live O*NET details
        headers, auth = self._get_headers_and_auth()
        url = f"{self.v2_base_url}/v1.0/online/occupations/{soc_code}/summary" if self.version == "v2" else f"{self.v1_base_url}/online/occupations/{soc_code}/summary"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, headers=headers, auth=auth)
                if resp.status_code == 200:
                    data = resp.json()
                    # Merge live data into local or base model
                    title = data.get("title", local_occ["title"] if local_occ else "Occupation")
                    desc = data.get("description", local_occ["description"] if local_occ else "")
                    
                    merged = dict(local_occ) if local_occ else {
                        "soc_code": soc_code,
                        "title": title,
                        "description": desc,
                        "bright_outlook": True,
                        "bright_outlook_category": "Bright Outlook",
                        "job_zone": 4,
                        "job_zone_title": "Considerable Preparation",
                        "median_annual_salary": "$110,000",
                        "sample_titles": [],
                        "core_tasks": [],
                        "knowledge": [],
                        "skills": [],
                        "tools_and_technology": []
                    }
                    merged["title"] = title
                    merged["description"] = desc
                    return merged
        except Exception as e:
            logger.warning(f"Live O*NET details lookup failed: {e}. Returning local profile.")

        return local_occ

    def get_all_catalog(self) -> List[Dict[str, Any]]:
        """Return the complete O*NET occupation catalog."""
        return ONET_OCCUPATIONS
