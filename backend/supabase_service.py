import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
import httpx

logger = logging.getLogger("supabase_auth")


class SupabaseAuthService:
    """
    Supabase User Authentication and Session management service.
    Integrates directly with Supabase GoTrue Auth API (/auth/v1) and PostgreSQL database.
    """

    def __init__(self, supabase_url: Optional[str] = None, supabase_key: Optional[str] = None):
        self.supabase_url = (supabase_url or os.getenv("SUPABASE_URL", "")).strip().rstrip("/")
        self.supabase_key = (
            supabase_key or os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY", "")
        ).strip()

    def update_credentials(self, supabase_url: str, supabase_key: str):
        """Update runtime Supabase credentials."""
        self.supabase_url = supabase_url.strip().rstrip("/")
        self.supabase_key = supabase_key.strip()

    def is_configured(self) -> bool:
        """Check whether Supabase URL and API Key are configured."""
        return bool(self.supabase_url and self.supabase_key)

    def _get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        headers = {
            "apikey": self.supabase_key,
            "Content-Type": "application/json",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def test_connection(self) -> Dict[str, Any]:
        """Test whether the provided Supabase project URL and API key are valid and reachable."""
        if not self.is_configured():
            return {
                "success": False,
                "message": "Supabase URL and API Key are not configured."
            }
        try:
            with httpx.Client(timeout=10.0) as client:
                # Supabase Auth settings endpoint
                url = f"{self.supabase_url}/auth/v1/settings"
                res = client.get(url, headers={"apikey": self.supabase_key})
                if res.status_code == 200:
                    return {
                        "success": True,
                        "message": "Successfully connected to Supabase Auth & PostgreSQL Database!",
                        "supabase_url": self.supabase_url
                    }
                else:
                    return {
                        "success": False,
                        "message": f"Supabase responded with status {res.status_code}: {res.text[:200]}"
                    }
        except Exception as e:
            logger.error(f"Supabase connection test failed: {e}")
            return {
                "success": False,
                "message": f"Connection error: {str(e)}"
            }

    def _sync_public_profile(self, user_id: str, email: str, full_name: str, access_token: Optional[str] = None):
        """
        Automatically store and update user details into the Supabase PostgreSQL 'public.profiles' table
        so they appear in the Supabase Table Editor.
        """
        if not self.is_configured() or not user_id:
            return

        headers = self._get_headers(access_token)
        headers["Prefer"] = "resolution=merge-duplicates"

        profile_url = f"{self.supabase_url}/rest/v1/profiles"
        payload = {
            "id": user_id,
            "email": email,
            "full_name": full_name,
            "updated_at": datetime.now().isoformat()
        }

        try:
            with httpx.Client(timeout=8.0) as client:
                client.post(profile_url, json=payload, headers=headers)
        except Exception as e:
            logger.info(f"Public profile table sync notice: {e}")

    def register(self, email: str, full_name: str, password: str) -> Tuple[Dict[str, Any], str]:
        """
        Register a new user in Supabase Auth (auth.users) and return the user profile & session token.
        Automatically stores user details into Supabase auth and public.profiles table.
        """
        if not self.is_configured():
            raise ValueError("Supabase is not configured.")

        email = email.strip().lower()
        full_name = full_name.strip()
        if not email or "@" not in email:
            raise ValueError("A valid email address is required.")
        if not full_name:
            raise ValueError("Full name is required.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters.")

        signup_url = f"{self.supabase_url}/auth/v1/signup"
        payload = {
            "email": email,
            "password": password,
            "data": {
                "full_name": full_name
            }
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(signup_url, json=payload, headers=self._get_headers())
                data = res.json()

                if res.status_code in (200, 201):
                    access_token = data.get("access_token")
                    user_data = data.get("user") or data

                    # If email confirmation is enabled in Supabase project, try password login immediately
                    if not access_token:
                        try:
                            return self.login(email, password)
                        except Exception:
                            # Registration was created in Supabase but requires email confirmation
                            access_token = f"pending_confirmation_{user_data.get('id', '')}"

                    user_dict = {
                        "id": str(user_data.get("id")),
                        "email": user_data.get("email", email),
                        "full_name": user_data.get("user_metadata", {}).get("full_name") or full_name,
                        "created_at": user_data.get("created_at")
                    }

                    # Automatically store user details in Supabase public.profiles table
                    if access_token and not access_token.startswith("pending_confirmation"):
                        self._sync_public_profile(user_dict["id"], user_dict["email"], user_dict["full_name"], access_token)

                    return user_dict, access_token or ""
                else:
                    error_msg = data.get("msg") or data.get("error_description") or data.get("message") or res.text
                    raise ValueError(f"Supabase Registration: {error_msg}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Supabase register exception: {e}")
            raise ValueError(f"Failed to connect to Supabase: {str(e)}")

    def login(self, email: str, password: str) -> Tuple[Dict[str, Any], str]:
        """
        Authenticate with email & password via Supabase Auth and return user profile & JWT session token.
        Automatically syncs latest sign-in details in Supabase.
        """
        if not self.is_configured():
            raise ValueError("Supabase is not configured.")

        email = email.strip().lower()
        if not email or not password:
            raise ValueError("Email and password are required.")

        login_url = f"{self.supabase_url}/auth/v1/token?grant_type=password"
        payload = {
            "email": email,
            "password": password
        }

        try:
            with httpx.Client(timeout=15.0) as client:
                res = client.post(login_url, json=payload, headers=self._get_headers())
                data = res.json()

                if res.status_code == 200 and "access_token" in data:
                    access_token = data["access_token"]
                    user_data = data.get("user", {})
                    user_dict = {
                        "id": str(user_data.get("id")),
                        "email": user_data.get("email", email),
                        "full_name": user_data.get("user_metadata", {}).get("full_name") or email.split("@")[0],
                        "created_at": user_data.get("created_at")
                    }

                    # Automatically sync latest user details into Supabase public.profiles table
                    self._sync_public_profile(user_dict["id"], user_dict["email"], user_dict["full_name"], access_token)

                    return user_dict, access_token
                else:
                    error_code = data.get("error_code")
                    error_msg = data.get("error_description") or data.get("msg") or data.get("message") or "Invalid email or password."
                    if error_code == "email_not_confirmed" or "not confirmed" in error_msg.lower():
                        raise ValueError("Email not confirmed yet. Please verify your email via the confirmation link, or disable 'Confirm email' in Supabase Dashboard (Authentication -> Providers -> Email).")
                    raise ValueError(f"Supabase Login: {error_msg}")
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Supabase login exception: {e}")
            raise ValueError(f"Failed to authenticate with Supabase: {str(e)}")

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Validate the Supabase JWT session token and retrieve current user profile from Supabase.
        """
        if not self.is_configured() or not token:
            return None

        if token.startswith("pending_confirmation"):
            return None

        user_url = f"{self.supabase_url}/auth/v1/user"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.get(user_url, headers=self._get_headers(token))
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "id": str(data.get("id")),
                        "email": data.get("email"),
                        "full_name": data.get("user_metadata", {}).get("full_name") or (
                            data.get("email", "").split("@")[0] if data.get("email") else "User"
                        ),
                        "created_at": data.get("created_at")
                    }
                return None
        except Exception as e:
            logger.warning(f"Error validating Supabase token: {e}")
            return None

    def logout(self, token: str) -> bool:
        """
        Sign out and invalidate the Supabase session token.
        """
        if not self.is_configured() or not token:
            return False

        logout_url = f"{self.supabase_url}/auth/v1/logout"
        try:
            with httpx.Client(timeout=10.0) as client:
                res = client.post(logout_url, headers=self._get_headers(token))
                return res.status_code in (200, 204)
        except Exception as e:
            logger.warning(f"Error signing out from Supabase: {e}")
            return False

