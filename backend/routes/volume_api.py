from typing import Optional
import io
import numpy as np
from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
import base64
import struct

try:
    import nibabel as nib
except Exception as e:
    nib = None

router = APIRouter(prefix="/volume", tags=["volume"])


@router.post("/upload_npz")
async def upload_npz(file: UploadFile = File(...)):
    """Accept an uploaded .npz (volume + optional seg) and return it back for testing."""
    data = await file.read()
    return StreamingResponse(io.BytesIO(data), media_type="application/octet-stream")


@router.post("/upload_nifti")
async def upload_nifti(file: UploadFile = File(...)):
    """Accept an uploaded NIfTI (.nii/.nii.gz) and return a compressed npz containing
    - volume: float32 array (z,y,x)
    - affine: 4x4 affine as float32
    - spacing: tuple (z,y,x) voxel spacing
    - seg: optional uint8 mask if NIfTI has integer labels (same shape)

    The frontend can fetch this endpoint and load the npz with JS.
    """
    if nib is None:
        raise HTTPException(status_code=500, detail="nibabel is not installed on the server")

    data = await file.read()
    try:
        img = nib.load(io.BytesIO(data))
    except Exception:
        # nibabel cannot load from bytes in some backends; write to temp file fallback
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
            tmp.write(data)
            tmp.flush()
            img = nib.load(tmp.name)

    arr = np.asanyarray(img.get_fdata()).astype(np.float32)
    affine = np.array(img.affine, dtype=np.float32)

    # Try to detect a segmentation in the loaded object (labels)
    seg = None
    if arr.dtype == np.uint8 or arr.dtype == np.int16 or arr.dtype == np.int32:
        # integer types may indicate labelmap
        seg = (arr > 0).astype(np.uint8)

    # Normalize volume to 0..1 float32 (preserve contrast)
    v = arr
    v_min = float(np.nanmin(v))
    v_max = float(np.nanmax(v))
    if v_max > v_min:
        norm = (v - v_min) / (v_max - v_min)
    else:
        norm = np.clip(v, 0.0, 1.0)

    # Prepare response npz in memory
    bio = io.BytesIO()
    if seg is not None:
        np.savez_compressed(bio, volume=norm.astype(np.float32), affine=affine, seg=seg.astype(np.uint8))
    else:
        np.savez_compressed(bio, volume=norm.astype(np.float32), affine=affine)
    bio.seek(0)

    headers = {"Content-Disposition": "attachment; filename=volume.npz"}
    return StreamingResponse(bio, media_type="application/octet-stream", headers=headers)


@router.post("/upload_nifti_json")
async def upload_nifti_json(file: UploadFile = File(...)):
    """Return a small JSON-friendly representation: base64-encoded uint8 volume and optional seg.

    This endpoint is convenient for frontend demos (smaller volumes recommended).
    """
    if nib is None:
        raise HTTPException(status_code=500, detail="nibabel is not installed on the server")

    data = await file.read()
    try:
        img = nib.load(io.BytesIO(data))
    except Exception:
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
            tmp.write(data)
            tmp.flush()
            img = nib.load(tmp.name)

    arr = np.asanyarray(img.get_fdata()).astype(np.float32)
    v = arr
    v_min = float(np.nanmin(v))
    v_max = float(np.nanmax(v))
    if v_max > v_min:
        norm = (v - v_min) / (v_max - v_min)
    else:
        norm = np.clip(v, 0.0, 1.0)

    # downcast to uint8 for JSON transfer
    vol_uint8 = (np.clip(norm, 0.0, 1.0) * 255.0).astype(np.uint8)
    vol_bytes = vol_uint8.tobytes()
    vol_b64 = base64.b64encode(vol_bytes).decode("ascii")

    resp = {
        "shape": vol_uint8.shape,
        "dtype": "uint8",
        "volume_b64": vol_b64,
    }

    # optional segmentation
    seg = None
    if np.issubdtype(arr.dtype, np.integer):
        seg = (arr > 0).astype(np.uint8)
        resp["seg_b64"] = base64.b64encode(seg.tobytes()).decode("ascii")

    return resp


@router.get("/sample_json")
async def sample_json():
    """Return a small synthetic SPGR-like volume + tumor segmentation for frontend demos."""
    import base64
    # small demo volume
    z, y, x = 48, 128, 128
    # create an anatomical-looking gradient + noise
    xx, yy, zz = np.meshgrid(np.linspace(-1, 1, x), np.linspace(-1, 1, y), np.linspace(-1, 1, z), indexing="xy")
    # create background tissue gradient
    vol = (np.exp(-(xx ** 2 + yy ** 2 + (zz * 0.8) ** 2) * 6.0))
    vol = vol.transpose(2, 1, 0)  # z,y,x
    vol = (vol - vol.min()) / (vol.max() - vol.min())
    vol = vol + (np.random.RandomState(1).rand(*vol.shape) * 0.03)

    # add a tumor blob
    cz, cy, cx = z // 2 + 2, y // 2 - 8, x // 2 + 6
    rz = 6
    ry = 18
    rx = 18
    zzg, yyg, xxg = np.ogrid[:z, :y, :x]
    mask = (((zzg - cz) ** 2) / (rz ** 2) + ((yyg - cy) ** 2) / (ry ** 2) + ((xxg - cx) ** 2) / (rx ** 2)) < 1.0
    vol[mask] = vol[mask] * 0.2 + 0.85  # brighter tumor core

    # normalize and cast
    vol_uint8 = (np.clip(vol, 0.0, 1.0) * 255).astype(np.uint8)
    seg = mask.astype(np.uint8)

    vol_b64 = base64.b64encode(vol_uint8.tobytes()).decode("ascii")
    seg_b64 = base64.b64encode(seg.tobytes()).decode("ascii")

    return {"shape": vol_uint8.shape, "dtype": "uint8", "volume_b64": vol_b64, "seg_b64": seg_b64}


@router.post("/simulate_shrink")
async def simulate_shrink(file: UploadFile = File(...), steps: int = 8, effectiveness: float = 0.8):
    """Accept an uploaded segmentation NIfTI (or npz) and return a sequence of compressed npz frames showing
    progressive shrink/grow depending on effectiveness. This is a lightweight simulation using morphological
    operations (scikit-image) on the mask.
    """
    try:
        from skimage.morphology import binary_erosion, binary_dilation
    except Exception:
        raise HTTPException(status_code=500, detail="scikit-image is required for simulation")

    data = await file.read()
    # try to load as npz first
    try:
        bio = io.BytesIO(data)
        npz = np.load(bio)
        mask = npz.get("seg")
        if mask is None:
            # try to threshold volume
            vol = npz["volume"]
            mask = (vol > vol.mean()).astype(np.uint8)
    except Exception:
        # fallback: try nibabel
        if nib is None:
            raise HTTPException(status_code=400, detail="Unsupported file format and nibabel not installed")
        try:
            img = nib.load(io.BytesIO(data))
        except Exception:
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
                tmp.write(data)
                tmp.flush()
                img = nib.load(tmp.name)
        arr = np.asanyarray(img.get_fdata()).astype(np.float32)
        mask = (arr > arr.mean()).astype(np.uint8)

    if mask is None:
        raise HTTPException(status_code=400, detail="No segmentation mask found in uploaded file")

    # ensure binary
    mask = (mask > 0).astype(np.uint8)

    frames = []
    current = mask.copy().astype(bool)
    for t in range(steps):
        # shrink proportional to effectiveness
        if effectiveness >= 0.5:
            iter_count = max(1, int((1.0 - effectiveness) * 4) + 1)
            current = binary_erosion(current, iterations=1)
        else:
            # ineffective -> slight growth
            current = binary_dilation(current, iterations=1)
        frames.append(current.astype(np.uint8))

    # pack frames into a single npz with keys frame_0..frame_n
    out = io.BytesIO()
    save_dict = {f"frame_{i}": frames[i] for i in range(len(frames))}
    np.savez_compressed(out, **save_dict)
    out.seek(0)
    return StreamingResponse(out, media_type="application/octet-stream", headers={"Content-Disposition": "attachment; filename=sim_frames.npz"})


@router.post("/mesh")
async def extract_mesh(file: UploadFile = File(...), threshold: Optional[float] = None):
    """Accept an uploaded NIfTI (or npz) and return an ASCII PLY mesh computed with marching-cubes.

    - If the uploaded file contains integer labels, the mask (label>0) is used and `threshold` is ignored.
    - Otherwise `threshold` (0..1) selects the isosurface on the normalized volume (default 0.5).
    Returns: `attachment; filename=mesh.ply` containing vertices (x,y,z,nx,ny,nz) and triangular faces.
    """
    # lazy imports
    try:
        from skimage.measure import marching_cubes
    except Exception:
        raise HTTPException(status_code=500, detail="scikit-image is required for mesh extraction")

    if nib is None:
        raise HTTPException(status_code=500, detail="nibabel is required to load NIfTI on the server")

    data = await file.read()
    # try to load npz first
    arr = None
    spacing = (1.0, 1.0, 1.0)
    try:
        bio = io.BytesIO(data)
        npz = np.load(bio)
        if "seg" in npz:
            arr = np.asanyarray(npz["seg"]).astype(np.uint8)
        else:
            arr = np.asanyarray(npz["volume"]).astype(np.float32)
    except Exception:
        # fallback: try nibabel
        try:
            img = nib.load(io.BytesIO(data))
        except Exception:
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".nii.gz", delete=False) as tmp:
                tmp.write(data)
                tmp.flush()
                img = nib.load(tmp.name)

        arr = np.asanyarray(img.get_fdata()).astype(np.float32)
        try:
            # nibabel header zooms typically (x,y,z) or (z,y,x) depending on loader; use header.get_zooms()
            zo = img.header.get_zooms()
            # ensure tuple length >=3 and reorder to (z,y,x) if necessary
            if len(zo) >= 3:
                # nibabel zooms are often (x,y,z) -> convert to (z,y,x)
                spacing = (float(zo[2]), float(zo[1]), float(zo[0]))
        except Exception:
            spacing = (1.0, 1.0, 1.0)

    if arr is None:
        raise HTTPException(status_code=400, detail="Unsupported file format or empty upload")

    # If arr is integer labelmap, use it as mask
    if np.issubdtype(arr.dtype, np.integer):
        mask = (arr > 0).astype(np.uint8)
        vol = mask.astype(np.uint8)
        iso_level = 0.5
    else:
        # normalize to 0..1
        v = arr
        v_min = float(np.nanmin(v))
        v_max = float(np.nanmax(v))
        if v_max > v_min:
            norm = (v - v_min) / (v_max - v_min)
        else:
            norm = np.clip(v, 0.0, 1.0)
        vol = norm.astype(np.float32)
        iso_level = 0.5 if threshold is None else float(threshold)

    # compute marching cubes
    try:
        verts, faces, normals, values = marching_cubes(vol, level=iso_level)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"marching_cubes failed: {e}")

    # scale verts by spacing (verts in z,y,x order -> ensure consistent mapping)
    try:
        # verts are (N,3) in (z,y,x) coords per skimage; scale accordingly
        verts_scaled = verts.copy()
        verts_scaled[:, 0] *= spacing[0]
        verts_scaled[:, 1] *= spacing[1]
        verts_scaled[:, 2] *= spacing[2]
    except Exception:
        verts_scaled = verts

    # write ASCII PLY
    out = io.StringIO()
    nvert = verts_scaled.shape[0]
    nface = faces.shape[0]
    out.write("ply\n")
    out.write("format ascii 1.0\n")
    out.write(f"element vertex {nvert}\n")
    out.write("property float x\nproperty float y\nproperty float z\n")
    out.write("property float nx\nproperty float ny\nproperty float nz\n")
    out.write(f"element face {nface}\n")
    out.write("property list uchar int vertex_indices\n")
    out.write("end_header\n")

    for v, n in zip(verts_scaled, normals):
        out.write(f"{v[2]:.6f} {v[1]:.6f} {v[0]:.6f} {n[2]:.6f} {n[1]:.6f} {n[0]:.6f}\n")

    for f_idx in faces:
        out.write(f"3 {f_idx[0]} {f_idx[1]} {f_idx[2]}\n")

    ply_bytes = out.getvalue().encode("utf-8")
    bio = io.BytesIO(ply_bytes)
    bio.seek(0)
    return StreamingResponse(bio, media_type="application/octet-stream", headers={"Content-Disposition": "attachment; filename=mesh.ply"})
