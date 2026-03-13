# Gene Feature Alignment - Implementation Guide

## Overview

The FastAPI backend now supports **automatic feature alignment** for CSV files with varying numbers of genes. Users can upload CSV files with any number of genes (e.g., 10, 100, 1000), and the backend will automatically:

✅ **Add missing genes** → Fill with zeros  
✅ **Remove extra genes** → Ignore genes not in training data  
✅ **Reorder columns** → Match exact training data order  
✅ **Validate output** → Ensure exactly 20531 features  

---

## How It Works

### 1. Gene List Loading (Startup)

The backend attempts to load `gene_list.pkl` at startup:

```python
# From backend/main.py
gene_list = None

if GENE_LIST_PATH.exists():
    gene_list = joblib.load(GENE_LIST_PATH)
    print(f"✓ Gene list loaded: {len(gene_list)} genes")
else:
    print(f"⚠ Warning: gene_list.pkl not found. CSV processing will use feature count alignment only.")
```

**With gene_list.pkl:** Precise alignment using gene names  
**Without gene_list.pkl:** Positional alignment (first N columns used)

---

### 2. Feature Alignment Function

The `align_gene_features()` function handles all alignment logic:

```python
def align_gene_features(df: pd.DataFrame, expected_features: int = 20531) -> np.ndarray:
    """
    Align gene expression DataFrame to match expected feature count and order.
    
    This function handles CSV files with varying numbers of genes by:
    1. Adding missing genes (filled with 0)
    2. Removing extra genes not used in training
    3. Reordering columns to match training data order
    """
```

**Example:**

Input CSV (3 genes):
```csv
TP53,EGFR,KRAS
0.8,0.6,0.4
```

Output array (20531 genes):
```python
[0.8, 0.6, 0.4, 0.0, 0.0, 0.0, ..., 0.0]  # 20531 values total
```

---

### 3. Updated `/predict` Endpoint

The endpoint now handles CSV files intelligently:

```python
# Mode 2: File upload - parse CSV/TSV
elif file:
    print(f"📁 File upload mode: {file.filename}")
    contents = await file.read()
    
    # Read CSV
    df = pd.read_csv(io.BytesIO(contents), delimiter=delimiter)
    
    # Align features to expected 20531
    aligned_features = align_gene_features(df, expected_features=20531)
    
    # Take first sample if multiple rows
    gene_expression = aligned_features[0].astype(np.float32)
```

---

## Setup Instructions

### Option 1: Create gene_list.pkl from Training Data (Recommended)

If you have the original training data CSV:

```bash
cd backend
python create_gene_list.py --from-csv path/to/training_data.csv
```

This extracts the exact gene names and order used during training.

### Option 2: Create Placeholder gene_list.pkl

If you don't have the training data:

```bash
cd backend
python create_gene_list.py --placeholder
```

This creates a placeholder with:
- ~200 common cancer genes (TP53, BRCA1, KRAS, etc.)
- 20,331 numbered placeholders (GENE_00000, GENE_00001, etc.)

**Note:** Placeholder alignment is positional. For best results, use actual training gene names.

### Option 3: Run Without gene_list.pkl

The backend will work without `gene_list.pkl`, using positional alignment:

- First N genes from CSV → Used directly
- Remaining features → Filled with zeros

---

## CSV File Format

### Supported Formats

**Format 1: Genes as Columns (Recommended)**
```csv
TP53,EGFR,KRAS,BRCA1,BRCA2
0.8,0.6,0.4,0.5,0.7
```

**Format 2: Genes as Columns with Sample ID**
```csv
sample_id,TP53,EGFR,KRAS,BRCA1,BRCA2
patient_001,0.8,0.6,0.4,0.5,0.7
```

**Format 3: Genes as Rows (Auto-transposed)**
```csv
Gene,Value
TP53,0.8
EGFR,0.6
KRAS,0.4
```

### CSV Requirements

- **Delimiter:** Comma (`,`) or tab (`\t`) - auto-detected
- **Encoding:** UTF-8
- **Gene Names:** Case-sensitive (use exact names from training)
- **Values:** Numeric (float or int)

---

## Testing

### Create Test CSV Files

**Small CSV (10 genes):**
```csv
TP53,EGFR,KRAS,BRCA1,BRCA2,MYC,PTEN,APC,RB1,NF1
0.8,0.6,0.4,0.5,0.7,0.3,0.9,0.2,0.6,0.5
```

**Large CSV (100 genes):**
```csv
TP53,EGFR,KRAS,BRCA1,BRCA2,MYC,PTEN,APC,RB1,NF1,...(90 more genes)
0.8,0.6,0.4,0.5,0.7,0.3,0.9,0.2,0.6,0.5,...(90 more values)
```

### Test with cURL

```bash
# Test with small CSV
curl -X POST http://localhost:8000/predict \
  -F "file=@test_small.csv"

# Expected response:
# {
#   "predicted_cancer": "lung adenocarcinoma",
#   "confidence": 0.87
# }
```

### Test with Frontend

Upload CSV via the TumorVerse frontend:
1. Navigate to `/predict` page
2. Click "Upload Gene Expression File"
3. Select CSV file (any size)
4. Submit for prediction

---

## Debugging Logs

The backend now prints detailed logs during processing:

```
📁 File upload mode: test_small.csv
   Loaded dataframe with shape: (1, 10)
   Columns (first 5): ['TP53', 'EGFR', 'KRAS', 'BRCA1', 'BRCA2']
   Format: Genes as columns (10 genes)
📊 Aligning features...
   Input shape: (1, 10)
   Expected features: 20531
   Using gene list: 20531 genes
   Common genes found: 10
   Missing genes (will be set to 0): 20521
✓ Aligned shape: (1, 20531)
🔍 Validating input...
   Shape: (20531,)
   Data type: float32
   Sample values (first 5): [0.8 0.6 0.4 0.5 0.7]
✓ Input validated: 20531 features
✓ Reshaped to: (1, 20531)
✓ PCA applied: (1, 500)
✓ Prediction: lung adenocarcinoma (confidence: 87.32%)
```

---

## Error Handling

### Common Errors and Solutions

**Error:** `Expected 20531 features, got 10`  
**Solution:** Update backend code (already implemented in this version)

**Error:** `gene_list.pkl not found`  
**Solution:** This is a warning, not an error. Either:
- Create gene_list.pkl using `create_gene_list.py`
- Or continue using positional alignment

**Error:** `Failed to parse file: <details>`  
**Solution:** Check CSV format:
- Ensure proper encoding (UTF-8)
- Check for invalid characters
- Verify column structure

**Error:** `Feature alignment may have failed`  
**Solution:** Check the debugging logs to see where alignment failed

---

## API Response Format

### Success Response

```json
{
  "predicted_cancer": "lung adenocarcinoma",
  "confidence": 0.8732
}
```

### Error Response

```json
{
  "detail": "Failed to parse file: Invalid CSV format"
}
```

---

## Best Practices

### For Development

1. **Always create gene_list.pkl from training data** for accurate alignment
2. **Test with small CSVs first** (10-20 genes) before full datasets
3. **Check backend logs** to verify alignment is working
4. **Use consistent gene names** (case-sensitive)

### For Production

1. **Include gene_list.pkl** in deployment
2. **Add request size limits** for large CSV files
3. **Implement batch processing** for multiple samples
4. **Cache aligned features** if processing same genes repeatedly
5. **Add input validation** for gene name formats

### For Users

1. **Use exact gene names** from training data
2. **Include gene names as column headers**
3. **One sample per CSV** (or first row is used)
4. **Numeric values only** (no missing values)

---

## Architecture Diagram

```
User Uploads CSV
       ↓
┌──────────────────────┐
│   /predict endpoint  │
└──────────────────────┘
       ↓
┌──────────────────────┐    Load gene_list.pkl (optional)
│   Parse CSV File     │ ←─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
│   (pandas DataFrame) │                            │
└──────────────────────┘                            │
       ↓                                             │
┌──────────────────────┐                            │
│ align_gene_features()│ ←─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
│                      │    If gene_list exists:
│ • Add missing genes  │    - Match by gene name
│ • Remove extra genes │    - Reorder columns
│ • Reorder to match   │    
│ • Fill zeros         │    If no gene_list:
│                      │    - Positional alignment
└──────────────────────┘    - Pad with zeros
       ↓
┌──────────────────────┐
│  Exactly 20531       │
│  features array      │
└──────────────────────┘
       ↓
┌──────────────────────┐
│   PCA Transform      │
│   (20531 → 500)      │
└──────────────────────┘
       ↓
┌──────────────────────┐
│  XGBoost Predict     │
│  (cancer type)       │
└──────────────────────┘
       ↓
┌──────────────────────┐
│  Return JSON         │
│  {cancer, confidence}│
└──────────────────────┘
```

---

## Files Modified

- **backend/main.py** - Added feature alignment logic
- **backend/create_gene_list.py** - Script to create gene_list.pkl

## Files to Create

- **backend/model/gene_list.pkl** - Gene names from training (20531 genes)

---

## Next Steps

1. ✅ Create `gene_list.pkl` from your training data
2. ✅ Test with small CSV files (10 genes)
3. ✅ Test with medium CSV files (100-1000 genes)
4. ✅ Deploy updated backend
5. ✅ Update frontend documentation

---

## Support

For issues or questions:
- Check backend logs for detailed error messages
- Verify CSV format matches examples above
- Ensure gene_list.pkl exists and matches training data
- Test with demo mode first: `curl -X POST http://localhost:8000/predict -F "demo=true"`
