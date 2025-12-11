from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

BRANDING_DIR = Path("/app/assets/branding")


@router.get("/branding/logo")
def get_logo():
    return FileResponse(BRANDING_DIR / "lab-logo.png", media_type="image/png")


@router.get("/branding/header")
def get_header():
    return FileResponse(BRANDING_DIR / "lab-header.png", media_type="image/png")


@router.get("/branding/signature")
def get_signature():
    return FileResponse(BRANDING_DIR / "lab-signature.png", media_type="image/png")
