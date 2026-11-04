import time
from collections import defaultdict
from typing import Dict, List, Tuple, Optional
from fastapi import Request, HTTPException, status
import logging

logger = logging.getLogger("rate_limiter")


class InMemoryRateLimiter:
    """
    Thread-safe sliding window rate limiter tracking client IP addresses.
    Returns HTTP 429 Too Many Requests when rate limits are exceeded.
    """

    def __init__(self):
        # key -> list of float timestamps
        self._history: Dict[str, List[float]] = defaultdict(list)

    @staticmethod
    def get_client_ip(request: Request) -> str:
        """Extract the real client IP address from proxy headers or socket."""
        # Cloudflare
        cf_ip = request.headers.get("cf-connecting-ip")
        if cf_ip:
            return cf_ip.strip()

        # Standard forward header
        x_forwarded = request.headers.get("x-forwarded-for")
        if x_forwarded:
            return x_forwarded.split(",")[0].strip()

        # Nginx / proxy
        x_real = request.headers.get("x-real-ip")
        if x_real:
            return x_real.strip()

        # Fallback to direct client
        if request.client and request.client.host:
            return request.client.host

        return "127.0.0.1"

    def check(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int, int]:
        """
        Check if a request is allowed.
        Returns: (is_allowed, remaining_attempts, retry_after_seconds)
        """
        now = time.time()
        timestamps = self._history[key]

        # Prune expired timestamps
        valid_timestamps = [t for t in timestamps if now - t < window_seconds]
        self._history[key] = valid_timestamps

        if len(valid_timestamps) >= max_requests:
            oldest = valid_timestamps[0]
            retry_after = int(window_seconds - (now - oldest)) + 1
            return False, 0, max(1, retry_after)

        valid_timestamps.append(now)
        remaining = max_requests - len(valid_timestamps)
        return True, remaining, 0

    def enforce(self, request: Request, bucket: str, max_requests: int, window_seconds: int, action_name: str = "requests"):
        """Enforce rate limit for an incoming request or raise HTTP 429."""
        client_ip = self.get_client_ip(request)
        rate_key = f"{bucket}:{client_ip}"

        allowed, remaining, retry_after = self.check(rate_key, max_requests, window_seconds)
        if not allowed:
            logger.warning(f"Rate limit exceeded for IP {client_ip} on action '{bucket}'")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many {action_name}. Please wait {retry_after} seconds before trying again.",
                headers={"Retry-After": str(retry_after)}
            )


# Global instance
rate_limiter = InMemoryRateLimiter()


# FastAPI Dependency callables
def rate_limit_login(request: Request):
    """Allow up to 5 login attempts per minute per IP."""
    rate_limiter.enforce(request, bucket="auth_login", max_requests=5, window_seconds=60, action_name="login attempts")


def rate_limit_register(request: Request):
    """Allow up to 5 registration attempts per 10 minutes per IP."""
    rate_limiter.enforce(request, bucket="auth_register", max_requests=5, window_seconds=600, action_name="registration attempts")


def rate_limit_forgot_password(request: Request):
    """Allow up to 3 password recovery attempts per 10 minutes per IP."""
    rate_limiter.enforce(request, bucket="auth_forgot_password", max_requests=3, window_seconds=600, action_name="password reset attempts")


def rate_limit_mfa(request: Request):
    """Allow up to 5 MFA verification attempts per minute per IP."""
    rate_limiter.enforce(request, bucket="auth_mfa", max_requests=5, window_seconds=60, action_name="MFA verification attempts")


def rate_limit_upload(request: Request):
    """Allow up to 20 resume upload analyses per minute per IP."""
    rate_limiter.enforce(request, bucket="analyze_upload", max_requests=20, window_seconds=60, action_name="resume uploads")
