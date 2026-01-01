from fastapi import APIRouter, HTTPException, Response, Cookie
from datetime import datetime, timezone
from .tokens import (
    create_access_token,
    create_refresh_token,
    hash_refresh,
    refresh_expires_at,
    set_auth_cookies,
)
from ..models import Session as DBSession
from ..models import Admin as DBAdmin
from ..models import User as DBUser
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["auth"])

PROD = True

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


async def verify_admin_or_user(username, password):
    user = await DBUser.find_one(DBUser.username == username)

    if user:
        if not verify_password(password, user.password_hashed):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "ok": True,
            "user_id": str(user.user_id),
            "username": user.username,
            "role": "patient",
        }

    admin = await DBAdmin.find_one(DBAdmin.username == username)

    if admin:
        if not verify_password(password, admin.password_hashed):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "ok": True,
            "user_id": str(admin.id),
            "username": admin.username,
            "role": "admin",
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/login")
async def login(payload: dict, response: Response):
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    principal = await verify_admin_or_user(username, password)
    if not principal:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    subject_id = str(principal["user_id"])
    role = principal["role"]

    access = create_access_token(subject_id, role)
    refresh = create_refresh_token()

    await DBSession(
        subject_id=subject_id,
        role=role,
        refresh_hash=hash_refresh(refresh),
        expires_at=refresh_expires_at(),
        revoked=False,
    ).insert()

    set_auth_cookies(response, access, refresh, prod=PROD)
    return {"ok": True, "role": role}


@router.post("/refresh")
async def refresh(response: Response, refresh_token: str | None = Cookie(default=None)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")

    rh = hash_refresh(refresh_token)
    session = await DBSession.find_one(DBSession.refresh_hash == rh)

    if not session or session.revoked:
        raise HTTPException(status_code=401, detail="Invalid session")

    if session.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    # ✅ Issue new access token
    new_access = create_access_token(session.subject_id, session.role)
    new_refresh = create_refresh_token()

    session.refresh_hash = hash_refresh(new_refresh)
    session.expires_at = refresh_expires_at()
    await session.save()

    set_auth_cookies(response, new_access, new_refresh, prod=PROD)
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response, refresh_token: str | None = Cookie(default=None)):
    if refresh_token:
        rh = hash_refresh(refresh_token)
        session = await DBSession.find_one(DBSession.refresh_hash == rh)
        if session:
            session.revoked = True
            await session.save()

    # clear cookies
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/auth")
    return {"ok": True}
