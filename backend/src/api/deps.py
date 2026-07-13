from fastapi import Cookie, Depends, HTTPException
from beanie import PydanticObjectId
from jose import jwt, JWTError
from .tokens import JWT_SECRET, JWT_ALG
from ..models import Visit as DBVisit


def get_current_principal(access_token: str | None = Cookie(default=None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token")
        subject_id = payload["sub"]
        role = payload["role"]
        if role not in {"admin", "patient"} or not PydanticObjectId.is_valid(
            subject_id
        ):
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": str(subject_id), "role": role}
    except (JWTError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid/expired token")


def require_admin(principal: dict = Depends(get_current_principal)) -> dict:
    if principal.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return principal


def require_patient_self(
    patient_id: str,
    principal: dict = Depends(get_current_principal),
) -> dict:
    if principal.get("role") != "patient" or principal.get("id") != patient_id:
        raise HTTPException(status_code=404, detail="Patient not found")
    return principal


async def require_visit_access(
    visit_id: str,
    principal: dict = Depends(get_current_principal),
) -> DBVisit:
    if not PydanticObjectId.is_valid(visit_id):
        raise HTTPException(status_code=404, detail="Visit not found")

    visit = await DBVisit.get(PydanticObjectId(visit_id))
    if visit is None:
        raise HTTPException(status_code=404, detail="Visit not found")

    if principal.get("role") == "admin":
        return visit

    is_owner = (
        principal.get("role") == "patient"
        and str(visit.patient_id) == principal.get("id")
    )
    if not is_owner or not visit.posted:
        raise HTTPException(status_code=404, detail="Visit not found")
    return visit
