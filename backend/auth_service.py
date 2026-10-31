import os
import sqlite3
import secrets
import hashlib
import shutil
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

DEFAULT_DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def resolve_db_path() -> str:
    """Resolve database path, copying to /tmp if running in a serverless environment like Vercel."""
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = "/tmp/users.db"
        if not os.path.exists(tmp_db) and os.path.exists(DEFAULT_DB_PATH):
            try:
                shutil.copy2(DEFAULT_DB_PATH, tmp_db)
            except Exception:
                pass
        return tmp_db
    return DEFAULT_DB_PATH


DB_PATH = resolve_db_path()


def hash_password(password: str, salt: Optional[bytes] = None) -> Tuple[str, str]:
    """Hash a password using PBKDF2 with SHA-256 and a random salt."""
    if salt is None:
        salt = secrets.token_bytes(16)
    hashed = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return hashed.hex(), salt.hex()


def verify_password(password: str, password_hash: str, salt_hex: str) -> bool:
    """Verify a plain password against the stored hash and salt."""
    salt = bytes.fromhex(salt_hex)
    recalculated_hash, _ = hash_password(password, salt)
    return secrets.compare_digest(recalculated_hash, password_hash)


class AuthService:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """Ensure users and sessions tables exist."""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                    full_name TEXT NOT NULL,
                    password_hash TEXT NOT NULL,
                    salt TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            """
            )
            conn.commit()

            # Ensure a default demo user exists for easy testing
            cursor.execute("SELECT id FROM users WHERE email = ?", ("demo@pathfinder.ai",))
            if not cursor.fetchone():
                pw_hash, salt_hex = hash_password("demo1234")
                cursor.execute(
                    "INSERT INTO users (email, full_name, password_hash, salt) VALUES (?, ?, ?, ?)",
                    ("demo@pathfinder.ai", "Alex Morgan", pw_hash, salt_hex)
                )
                conn.commit()

    def register(self, email: str, full_name: str, password: str) -> Tuple[Dict[str, Any], str]:
        """Register a new user and generate a session token."""
        email = email.strip().lower()
        full_name = full_name.strip()

        if not email or "@" not in email:
            raise ValueError("A valid email address is required.")
        if not full_name:
            raise ValueError("Full name is required.")
        if len(password) < 6:
            raise ValueError("Password must be at least 6 characters long.")

        pw_hash, salt_hex = hash_password(password)

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
            if cursor.fetchone():
                raise ValueError("An account with this email address already exists.")

            cursor.execute(
                "INSERT INTO users (email, full_name, password_hash, salt) VALUES (?, ?, ?, ?)",
                (email, full_name, pw_hash, salt_hex)
            )
            user_id = cursor.lastrowid
            conn.commit()

            token = secrets.token_hex(24)
            cursor.execute(
                "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
                (token, user_id)
            )
            conn.commit()

            user_dict = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "created_at": datetime.now().isoformat()
            }
            return user_dict, token

    def login(self, email: str, password: str) -> Tuple[Dict[str, Any], str]:
        """Verify user credentials and create a session token."""
        email = email.strip().lower()
        if not email or not password:
            raise ValueError("Email and password are required.")

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
            user_row = cursor.fetchone()

            if not user_row:
                raise ValueError("Invalid email or password.")

            if not verify_password(password, user_row["password_hash"], user_row["salt"]):
                raise ValueError("Invalid email or password.")

            token = secrets.token_hex(24)
            cursor.execute(
                "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
                (token, user_row["id"])
            )
            conn.commit()

            user_dict = {
                "id": user_row["id"],
                "email": user_row["email"],
                "full_name": user_row["full_name"],
                "created_at": str(user_row["created_at"])
            }
            return user_dict, token

    def get_user_by_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Retrieve user associated with the given session token."""
        if not token:
            return None

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT u.id, u.email, u.full_name, u.created_at
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.token = ?
                """,
                (token,)
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None

    def logout(self, token: str) -> bool:
        """Invalidate the session token."""
        if not token:
            return False

        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
            return cursor.rowcount > 0


auth_service = AuthService()

