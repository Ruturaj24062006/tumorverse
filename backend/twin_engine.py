"""Tumor twin engine: pseudo-3D volume generation, irregularity, mesh export and simulation.

Functions:
- create_3d_volume(mask, depth=20)
- apply_irregularity(volume, strength=0.5)
- smooth_volume(volume, sigma=1.0)
- volume_to_mesh(volume, level=0.5)
- simulate_tumor_change(volume, effectiveness, time_steps)
- generate_timeline(volume, effectiveness, time_steps)

This module focuses on turning 2D binary masks into biologically-irregular
3D volumes and meshes suitable for Three.js rendering and time-based simulation.
"""
from typing import Dict, List, Tuple

import numpy as np
from scipy import ndimage
from skimage import measure, morphology


def create_3d_volume(mask: np.ndarray, depth: int = 24) -> np.ndarray:
    """Create a pseudo-3D volumetric tumor from a 2D binary mask.

    - Stacks scaled/resampled slices along Z
    - Applies gentle per-slice random offsets and tapering
    - Returns a float32 volume in [0,1]
    """
    if mask.dtype != np.bool_ and mask.dtype != np.uint8:
        mask = mask > 0

    h, w = mask.shape
    center = (depth - 1) / 2.0

    # Precompute a smooth taper profile (ellipsoidal-like) to avoid cylindrical shape
    z = np.arange(depth)
    taper_strength = 1.0
    profile = 1.0 - taper_strength * ((z - center) / (center + 1.0)) ** 2
    profile = np.clip(profile, 0.05, 1.0)

    # Output volume
    vol = np.zeros((depth, h, w), dtype=np.float32)

    # Use a small random seed for reproducible variability
    rng = np.random.default_rng(seed=None)

    for i in range(depth):
        scale = 0.5 + 0.5 * profile[i]
        # Resize by zoom (use order=1 linear to keep edges)
        slice_img = ndimage.zoom(mask.astype(np.float32), zoom=scale, order=1)

        # Center-align into h x w canvas
        sh, sw = slice_img.shape
        pad_top = max(0, (h - sh) // 2)
        pad_left = max(0, (w - sw) // 2)
        canvas = np.zeros((h, w), dtype=np.float32)
        canvas[pad_top:pad_top + sh, pad_left:pad_left + sw] = slice_img

        # Apply small random local erosion/dilation to vary cross-sections
        # Random structuring element size per slice
        selem_radius = rng.integers(0, 3)
        if selem_radius > 0:
            selem = morphology.disk(selem_radius)
            if rng.random() > 0.5:
                canvas = morphology.binary_erosion(canvas > 0.5, footprint=selem).astype(np.float32)
            else:
                canvas = morphology.binary_dilation(canvas > 0.5, footprint=selem).astype(np.float32)

        # Add small Gaussian-smoothed noise to create surface roughness
        noise = ndimage.gaussian_filter(rng.standard_normal((h, w)).astype(np.float32), sigma=3)
        noise = (noise - noise.min()) / (np.ptp(noise) + 1e-9)
        canvas = np.clip(canvas + 0.08 * (noise * (1.0 - profile[i])), 0.0, 1.0)

        # Slight per-slice translation to break symmetry
        tx = int(rng.integers(-2, 3))
        ty = int(rng.integers(-2, 3))
        canvas = ndimage.shift(canvas, shift=(ty, tx), order=1, mode="constant", cval=0.0)

        vol[i] = canvas * profile[i]

    # Normalize and apply morphological closing to fill holes
    vol = np.clip(vol, 0.0, 1.0)
    # Smooth along z to blend slices
    vol = ndimage.gaussian_filter(vol, sigma=(1.0, 1.0, 1.0))
    vol = (vol - vol.min()) / (np.ptp(vol) + 1e-9)
    return vol.astype(np.float32)


def apply_irregularity(volume: np.ndarray, strength: float = 0.5) -> np.ndarray:
    """Introduce biological irregularities into a 3D volume.

    - Adds multi-scale smoothed random noise (Perlin-like)
    - Applies asymmetric growth bias
    """
    rng = np.random.default_rng()
    depth, h, w = volume.shape

    # Generate multi-scale noise and combine
    noise = np.zeros_like(volume, dtype=np.float32)
    for sigma, amp in [(8, 0.5), (4, 0.25), (1, 0.12)]:
        n = rng.standard_normal(volume.shape).astype(np.float32)
        n = ndimage.gaussian_filter(n, sigma=(sigma, sigma, sigma))
        n = (n - n.min()) / (np.ptp(n) + 1e-9)
        noise += amp * n

    noise = noise / (noise.max() + 1e-9)

    # Asymmetric bias: prefer one side to grow faster
    bias = np.linspace(0.9, 1.1, w)[None, None, :]
    combined = volume * (1.0 - 0.6 * strength) + strength * (noise * bias)

    # Apply slight local morphological roughening on boundaries
    binary = combined > 0.35
    selem = morphology.ball(1)
    boundary = binary ^ morphology.binary_erosion(binary, footprint=selem)
    # Perturb boundary by random dilation/erosion
    perturb = morphology.binary_dilation(boundary, footprint=morphology.ball(1))
    combined[perturb] += 0.15 * strength

    combined = np.clip(combined, 0.0, 1.0)
    return combined.astype(np.float32)


def smooth_volume(volume: np.ndarray, sigma: float = 1.0) -> np.ndarray:
    """Smooth volume with Gaussian blur and light morphological closing to produce believable surfaces."""
    v = ndimage.gaussian_filter(volume, sigma=(sigma, sigma, sigma))
    # Soft closing to fill small holes
    binary = v > 0.4
    closed = morphology.binary_closing(binary, footprint=morphology.ball(1))
    v = np.where(closed, v, v * 0.6)
    v = np.clip(v, 0.0, 1.0)
    return v.astype(np.float32)


def volume_to_mesh(volume: np.ndarray, level: float = 0.5, max_voxels: int = 200000) -> Dict:
    """Run marching cubes and return JSON-serializable mesh dict.

    This function downsamples very large volumes before running marching-cubes to
    avoid excessive CPU/time and to reduce resulting mesh size. The returned
    vertices are normalized (centered & scaled) so small downsampling preserves
    visual fidelity in the viewer while speeding up extraction.

    Returns: {"vertices": [...], "faces": [...], "normals": [...]} where each is a list.
    """
    # Ensure proper float type
    vol = volume.astype(np.float32)

    # If the volume is very large, downsample it to keep marching-cubes tractable.
    voxels = int(vol.size)
    downsample_factor = 1.0
    spacing = (1.0, 1.0, 1.0)
    if voxels > max_voxels:
        downsample_factor = (max_voxels / float(voxels)) ** (1.0 / 3.0)
        # Clamp factor to avoid extreme reductions
        downsample_factor = max(0.15, min(0.9, downsample_factor))
        # resample volume (ndimage.zoom uses zoom factor per axis)
        small_vol = ndimage.zoom(vol, zoom=(downsample_factor, downsample_factor, downsample_factor), order=1)
        spacing = (1.0 / downsample_factor, 1.0 / downsample_factor, 1.0 / downsample_factor)
    else:
        small_vol = vol

    # Marching cubes expects (z,y,x) volume. Use computed spacing to map back.
    verts, faces, normals, _ = measure.marching_cubes(small_vol, level=level, spacing=spacing)

    # Center the mesh around origin and normalize scale to roughly unit size.
    centroid = verts.mean(axis=0)
    verts_centered = verts - centroid
    max_extent = float(np.max(np.linalg.norm(verts_centered, axis=1)))
    if max_extent <= 0:
        scale = 1.0
    else:
        scale = max_extent
    verts_norm = verts_centered / (scale + 1e-9)

    mesh = {
        "vertices": verts_norm.astype(float).tolist(),
        "faces": faces.astype(int).tolist(),
        "normals": normals.astype(float).tolist(),
    }
    return mesh


def simulate_tumor_change(volume: np.ndarray, effectiveness: float, time_steps: int = 8) -> List[np.ndarray]:
    """Simulate tumor evolution over time.

    - effectiveness: 0.0 (ineffective) .. 1.0 (highly effective)
    - Returns a list of volume snapshots (float32)
    """
    rng = np.random.default_rng()
    frames = []
    current = volume.copy().astype(np.float32)

    for t in range(time_steps):
        # Compute per-voxel susceptibility map (edge regions change faster)
        grad = np.abs(ndimage.gaussian_gradient_magnitude(current, sigma=1.0))
        edge_weight = np.clip(grad / (grad.max() + 1e-9), 0.0, 1.0)

        # Medicine effect: higher effectiveness reduces interior density more
        interior_decay = 0.02 + 0.25 * effectiveness
        edge_retraction = 0.01 + 0.35 * effectiveness

        # Randomness to avoid uniform scaling
        randomness = ndimage.gaussian_filter(rng.standard_normal(current.shape).astype(np.float32), sigma=2)
        randomness = (randomness - randomness.min()) / (np.ptp(randomness) + 1e-9)

        # Apply decay biased by edge weight (edges retract faster) and randomness
        decay = interior_decay * (1.0 - edge_weight) + edge_retraction * edge_weight
        decay = decay * (0.5 + randomness * 0.5)

        # Reduce values where medicine is effective; otherwise permit slow growth
        if effectiveness >= 0.5:
            current = current - decay * effectiveness
        else:
            # low-effect: small growth patches in random regions controlled by tumor aggressiveness
            growth = 0.005 * (1.0 - effectiveness) * (1.0 + randomness)
            current = current + growth

        # Clip and occasionally apply dilation for aggressive tumors when ineffective
        current = np.clip(current, 0.0, 1.0)

        # Morphological smoothing to keep surface believable
        current = smooth_volume(current, sigma=0.8)

        frames.append(current.copy())

    return frames


def generate_timeline(volume: np.ndarray, effectiveness: float, time_steps: int = 8) -> Tuple[List[np.ndarray], Dict]:
    """Generate timeline frames and simple statistics.

    Returns: (frames, stats) where stats contains volumes, risk levels, and percentages.
    """
    frames = simulate_tumor_change(volume, effectiveness, time_steps=time_steps)
    vols = [float((f > 0.25).sum()) for f in frames]
    initial = vols[0]
    final = vols[-1]
    recovery_pct = max(0.0, min(100.0, 100.0 * (initial - final) / (initial + 1e-9)))

    risk_levels = []
    for v in vols:
        pct = 100.0 * (v / (initial + 1e-9))
        if pct > 120:
            risk = "high"
        elif pct > 80:
            risk = "moderate"
        else:
            risk = "low"
        risk_levels.append(risk)

    stats = {
        "initial_volume_voxels": initial,
        "final_volume_voxels": final,
        "recovery_percentage": recovery_pct,
        "risk_levels": risk_levels,
    }

    return frames, stats
