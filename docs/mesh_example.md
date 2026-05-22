# Mesh extraction example

Use the `/volume/mesh` endpoint to extract a triangular mesh (ASCII PLY) from a NIfTI or `.npz` upload.

Example curl (upload a NIfTI):

```bash
curl -F "file=@/path/to/scan.nii.gz" http://localhost:8000/volume/mesh --output mesh.ply
```

Example curl (upload an `.npz` containing `volume` key):

```bash
curl -F "file=@/path/to/volume.npz" http://localhost:8000/volume/mesh --output mesh.ply
```

Notes:
- The server normalizes non-integer volumes to 0..1; use `threshold` form field (0..1) to choose isosurface, e.g. `-F "threshold=0.6"`.
- For labelmaps (integer arrays), the mask `(label>0)` is used automatically.
- Large volumes may produce very large meshes; consider downsampling or using coarser iso thresholds.
