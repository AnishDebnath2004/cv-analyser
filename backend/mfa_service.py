import hmac
import hashlib
import struct
import time
import base64
import secrets
import urllib.parse
from typing import Optional


class MfaService:
    """
    Standard RFC 6238 Time-Based One-Time Password (TOTP) Multi-Factor Authentication.
    Compatible with Google Authenticator, Microsoft Authenticator, Authy, Apple Passwords, etc.
    """

    @staticmethod
    def generate_secret() -> str:
        """Generate a cryptographically random 20-byte base32 encoded secret key."""
        random_bytes = secrets.token_bytes(20)
        # Base32 encode and remove padding '=' for cleaner authenticator input
        return base64.b32encode(random_bytes).decode("utf-8").rstrip("=")

    @staticmethod
    def get_otpauth_url(secret: str, email: str, issuer: str = "PathFinderAI") -> str:
        """
        Generate standard otpauth:// URL for Authenticator apps or QR code generators.
        """
        encoded_issuer = urllib.parse.quote(issuer)
        encoded_email = urllib.parse.quote(email.strip())
        return f"otpauth://totp/{encoded_issuer}:{encoded_email}?secret={secret.strip()}&issuer={encoded_issuer}&algorithm=SHA1&digits=6&period=30"

    @staticmethod
    def generate_code(secret: str, for_time: Optional[float] = None) -> str:
        """Generate the current 6-digit TOTP code for a secret."""
        t = for_time if for_time is not None else time.time()
        # Ensure secret has valid padding for base32 decode
        padded_secret = secret.strip().upper()
        missing_padding = len(padded_secret) % 8
        if missing_padding:
            padded_secret += "=" * (8 - missing_padding)

        key = base64.b32decode(padded_secret)
        counter = int(t // 30)
        msg = struct.pack(">Q", counter)
        digest = hmac.new(key, msg, hashlib.sha1).digest()
        offset = digest[19] & 0x0F
        code = struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7FFFFFFF
        return str(code % 1000000).zfill(6)

    @classmethod
    def verify_code(cls, secret: str, code: str, window: int = 1) -> bool:
        """
        Verify a 6-digit TOTP code against the secret key.
        Window allows +/- 30 seconds clock drift.
        """
        if not secret or not code:
            return False

        clean_code = code.strip().replace(" ", "")
        if len(clean_code) != 6 or not clean_code.isdigit():
            return False

        now = time.time()
        for i in range(-window, window + 1):
            target_time = now + (i * 30)
            try:
                expected = cls.generate_code(secret, for_time=target_time)
                if hmac.compare_digest(expected, clean_code):
                    return True
            except Exception:
                continue

        return False


mfa_service = MfaService()
