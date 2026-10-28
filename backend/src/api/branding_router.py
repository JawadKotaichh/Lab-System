from functools import lru_cache
from hashlib import sha256
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse, RedirectResponse, Response

router = APIRouter()
BRANDING_DIR = Path("/app/assets/branding")
ASSETS = {
    "logo": "logo.png", "lab_header": "lab_header.png", "signature": "signature.png",
    "lab_signature": "Lab Signature.png", "lab_address": "lab_address.png",
    "result_background": "background result.png",
}


@lru_cache(maxsize=16)
def _digest(path: str, modified: int, size: int) -> str:
    return sha256(Path(path).read_bytes()).hexdigest()


def _asset(name: str):
    filename = ASSETS.get(name)
    if filename is None:
        raise HTTPException(404, "Branding asset not found")
    path = BRANDING_DIR / filename
    if not path.is_file():
        raise HTTPException(404, "Branding asset not found")
    stat = path.stat()
    return path, _digest(str(path), stat.st_mtime_ns, stat.st_size)


@router.get("/branding/assets/{asset}/{version}")
def versioned_asset(asset: str, version: str, request: Request):
    path, digest = _asset(asset)
    if version != digest:
        raise HTTPException(404, "Branding version not found")
    etag = f'"{digest}"'
    headers = {"Cache-Control": "public, max-age=31536000, immutable", "ETag": etag}
    tags = [item.strip().removeprefix("W/") for item in request.headers.get("if-none-match", "").split(",")]
    if etag in tags or "*" in tags:
        return Response(status_code=304, headers=headers)
    return FileResponse(path, media_type="image/png", headers=headers)


@router.get("/branding/{asset}")
def branding_asset(asset: str):
    _, digest = _asset(asset)
    return RedirectResponse(f"/branding/assets/{asset}/{digest}", status_code=307,
                            headers={"Cache-Control": "no-store"})
