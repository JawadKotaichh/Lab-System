from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

BRANDING_DIR = Path("/app/assets/branding")


@router.get("/branding/logo")
def get_logo():
    return FileResponse(BRANDING_DIR / "logo.png", media_type="image/png")


@router.get("/branding/lab_header")
def get_header():
    return FileResponse(BRANDING_DIR / "lab_header.png", media_type="image/png")


@router.get("/branding/lab_signature")
def get_signature():
    return FileResponse(BRANDING_DIR / "Lab Signature.png", media_type="image/png")


@router.get("/branding/lab_address")
def get_address():
    return FileResponse(BRANDING_DIR / "lab_address.png", media_type="image/png")
