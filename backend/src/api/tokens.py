import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from jose import jwt
from ..settings import settings

JWT_SECRET = settings.JWT_SECRET.get_secret_value()
JWT_ALG = "HS256"
ACCESS_MINUTES = settings.ACCESS_MINUTES
REFRESH_DAYS = settings.REFRESH_DAYS
REFRESH_PEPPER = settings.REFRESH_PEPPER.get_secret_value()


def create_access_token(subject_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject_id,
        "role": role,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ACCESS_MINUTES)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def create_refresh_token() -> str:
    return secrets.token_urlsafe(64)


def hash_refresh(token: str) -> str:
    return hashlib.sha256((token + REFRESH_PEPPER).encode("utf-8")).hexdigest()


def refresh_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS)


def set_auth_cookies(response, access: str, refresh: str, prod: bool):
    response.set_cookie(
        "access_token",
        access,
        httponly=True,
        secure=prod,
        samesite="none" if prod else "lax",
        max_age=ACCESS_MINUTES * 60,
        path="/",
    )
    response.set_cookie(
        "refresh_token",
        refresh,
        httponly=True,
        secure=prod,
        samesite="none" if prod else "lax",
        max_age=REFRESH_DAYS * 24 * 3600,
        path="/auth",
    )
