from typing import Any, Dict, List, Optional
import base64
import io

import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from PIL import Image

from backend import twin_engine

router = APIRouter(tags=["twin"])


def _read_mask_from_base64(data_url: str) -> np.ndarray:
    # Expect data URL like "data:image/png;base64,..."
    if "," in data_url:
        payload = data_url.split(",", 1)[1]
    else:
        payload = data_url
    raw = base64.b64decode(payload)
    img = Image.open(io.BytesIO(raw)).convert("L")
    arr = np.array(img)
    # Threshold to binary mask
    mask = (arr > arr.mean()).astype(np.uint8)
    return mask


def _read_mask_from_file(upload: UploadFile) -> np.ndarray:
    data = upload.file.read()
    img = Image.open(io.BytesIO(data)).convert("L")
    arr = np.array(img)
    mask = (arr > arr.mean()).astype(np.uint8)
    return mask


class GenerateTwinRequest(BaseModel):
    mask_base64: Optional[str] = Field(None, description="Binary mask image as data URL")
    depth: int = Field(24, ge=8, le=64)


@router.post("/generate_twin")
async def generate_twin(mask_file: Optional[UploadFile] = File(None), mask_base64: Optional[str] = Form(None), depth: int = Form(24)) -> Dict[str, Any]:
    """Generate a 3D tumor twin mesh from a 2D mask image (upload or base64 form)."""
    try:
        if mask_file is not None:
            mask = _read_mask_from_file(mask_file)
        elif mask_base64:
            mask = _read_mask_from_base64(mask_base64)
        else:
            raise HTTPException(status_code=400, detail="mask_file or mask_base64 required")

        vol = twin_engine.create_3d_volume(mask, depth=depth)
        vol = twin_engine.apply_irregularity(vol, strength=0.6)
        vol = twin_engine.smooth_volume(vol, sigma=0.8)

        mesh = twin_engine.volume_to_mesh(vol, level=0.35)

        # Simple statistics
        voxel_count = int((vol > 0.25).sum())
        stats = {"voxel_count": voxel_count, "depth": int(depth)}

        return {"mesh": mesh, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class SimulateRequest(BaseModel):
    mask_base64: Optional[str] = Field(None)
    effectiveness: float = Field(..., ge=0.0, le=1.0)
    steps: int = Field(8, ge=4, le=20)


@router.post("/simulate_treatment")
async def simulate_treatment(effectiveness: float = Form(...), steps: int = Form(8), mask_file: Optional[UploadFile] = File(None), mask_base64: Optional[str] = Form(None)) -> Dict[str, Any]:
    """Simulate treatment timeline and return mesh sequence and stats."""
    try:
        if mask_file is not None:
            mask = _read_mask_from_file(mask_file)
        elif mask_base64:
            mask = _read_mask_from_base64(mask_base64)
        else:
            raise HTTPException(status_code=400, detail="mask_file or mask_base64 required")

        base_vol = twin_engine.create_3d_volume(mask, depth=24)
        base_vol = twin_engine.apply_irregularity(base_vol, strength=0.55)

        frames, stats = twin_engine.generate_timeline(base_vol, effectiveness, time_steps=steps)

        # Convert each frame to a simplified mesh (decimate by marching level)
        mesh_sequence = []
        for f in frames:
            mesh = twin_engine.volume_to_mesh(f, level=0.35)
            mesh_sequence.append(mesh)

        response = {
            "status": "ok",
            "effectiveness": float(effectiveness),
            "steps": int(steps),
            "mesh_sequence": mesh_sequence,
            "stats": stats,
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
