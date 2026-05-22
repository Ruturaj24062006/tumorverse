import io
import numpy as np
from fastapi.testclient import TestClient

from backend.main import app


def make_sphere_volume(shape=(32, 32, 32), radius=8):
    z, y, x = np.indices(shape)
    cz, cy, cx = np.array(shape) / 2.0
    dist = np.sqrt((z - cz) ** 2 + (y - cy) ** 2 + (x - cx) ** 2)
    vol = np.zeros(shape, dtype=np.float32)
    vol[dist <= radius] = 1.0
    # smooth a bit
    vol = vol.astype(np.float32)
    return vol


def test_mesh_endpoint_npz():
    client = TestClient(app)

    vol = make_sphere_volume((32, 32, 32), radius=7)
    bio = io.BytesIO()
    np.savez_compressed(bio, volume=vol.astype(np.float32))
    bio.seek(0)

    files = {"file": ("sphere.npz", bio.read(), "application/octet-stream")}
    resp = client.post("/volume/mesh", files=files)
    assert resp.status_code == 200, resp.text
    text = resp.text
    assert text.startswith("ply"), "Response is not a PLY ASCII file"
    # Check that there are a few vertices and faces indicated
    assert "element vertex" in text
    assert "element face" in text
