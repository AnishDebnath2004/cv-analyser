import os
import sys
import logging
from typing import Optional, Dict, Any, Tuple

# Ensure current and parent directories are on sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_parent_dir = os.path.dirname(_current_dir)
if _current_dir not in sys.path:
    sys.path.insert(0, _current_dir)
if _parent_dir not in sys.path:
    sys.path.insert(0, _parent_dir)

try:
    from backend.supabase_service import supabase_service, SupabaseAuthService
except ImportError:
    from supabase_service import supabase_service, SupabaseAuthService

logger = logging.getLogger("auth_service")

# Supabase is the primary and direct authentication & session engine
auth_service = supabase_service
