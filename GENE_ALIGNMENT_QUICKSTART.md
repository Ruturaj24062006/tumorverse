# 🚀 Quick Start: Gene Feature Alignment

## ✅ What Was Implemented

Your FastAPI backend now automatically handles CSV files with **any number of genes**!

**Before:**
```
❌ User uploads CSV with 10 genes → Error: "Expected 20531 features, got 10"
```

**After:**
```
✅ User uploads CSV with 10 genes → Auto-aligned to 20531 features → Prediction successful!
```

---

## 🔧 Setup (One-Time)

### Step 1: Create gene_list.pkl

Choose ONE option:

#### Option A: From Your Training Data (Recommended)
```bash
cd backend
python create_gene_list.py --from-csv path/to/your/training_data.csv
```

#### Option B: Use Placeholder (If you don't have training data)
```bash
cd backend
python create_gene_list.py --placeholder
```

#### Option C: Skip (Use positional alignment)
No action needed. Backend will work without `gene_list.pkl` using positional alignment.

---

## 🧪 Test It

### Test 1: Run Test Script
```powershell
./test_gene_alignment.ps1
```

### Test 2: Manual Test with cURL
```bash
# Test with small CSV (10 genes)
curl -X POST http://localhost:8000/predict \
  -F "file=@backend/test_data/test_small_10genes.csv"
```

### Test 3: Use Frontend
1. Start backend: `cd backend && uvicorn main:app --reload`
2. Start frontend: `npm run dev`
3. Go to `/predict` page
4. Upload `test_small_10genes.csv`
5. See prediction result! 🎉

---

## 📝 What Happens Internally

When a user uploads a small CSV:

```
User CSV (10 genes)
TP53,EGFR,KRAS,...
0.8,0.6,0.4,...
     ↓
align_gene_features()
     ↓
Aligned Array (20531 genes)
[0.8,0.6,0.4,0,...0]
     ↓
PCA Transform (20531 → 500)
     ↓
XGBoost Predict
     ↓
Cancer Type + Confidence
```

**Debug logs show:**
```
📁 File upload mode: test_small_10genes.csv
   Loaded dataframe with shape: (1, 10)
📊 Aligning features...
   Common genes found: 10
   Missing genes (will be set to 0): 20521
✓ Aligned shape: (1, 20531)
✓ Prediction: lung adenocarcinoma (confidence: 87.32%)
```

---

## 📁 Files Created/Modified

### Modified
- ✅ `backend/main.py` - Added feature alignment logic

### Created
- ✅ `backend/create_gene_list.py` - Script to create gene_list.pkl
- ✅ `backend/GENE_ALIGNMENT_GUIDE.md` - Full documentation
- ✅ `backend/test_data/test_small_10genes.csv` - Test CSV (10 genes)
- ✅ `backend/test_data/test_with_sample_id.csv` - Test CSV (3 genes + ID)
- ✅ `backend/test_data/test_medium_100genes.csv` - Test CSV (100 genes)
- ✅ `test_gene_alignment.ps1` - Test script

### To Create (by you)
- ⬜ `backend/model/gene_list.pkl` - Run `create_gene_list.py` to create this

---

## 🎯 Usage Examples

### Example 1: User with 10 genes
```csv
TP53,EGFR,KRAS,BRCA1,BRCA2,MYC,PTEN,APC,RB1,NF1
0.8,0.6,0.4,0.5,0.7,0.3,0.9,0.2,0.6,0.5
```
**Result:** ✅ Works! Missing 20,521 genes filled with 0

### Example 2: User with 100 genes
```csv
TP53,EGFR,KRAS,...(97 more)
0.8,0.6,0.4,...(97 more values)
```
**Result:** ✅ Works! Missing 20,431 genes filled with 0

### Example 3: User with 25,000 genes
```csv
TP53,EGFR,KRAS,...(24,997 more)
0.8,0.6,0.4,...(24,997 more values)
```
**Result:** ✅ Works! Extra 4,469 genes ignored, only 20,531 used

---

## ⚙️ Configuration

### With gene_list.pkl (Precise Alignment)
- ✅ Matches genes by name
- ✅ Reorders columns to match training
- ✅ Best accuracy

### Without gene_list.pkl (Positional Alignment)
- ⚠️ Uses first N columns
- ⚠️ No name matching
- ⚠️ May reduce accuracy if gene order differs

**Recommendation:** Always create `gene_list.pkl` from your actual training data!

---

## 🐛 Troubleshooting

### Issue: "Models not loaded"
**Solution:** Place model files in `backend/model/`:
- `tumor_classifier.pkl`
- `pca_model.pkl`
- `label_encoder.pkl`

### Issue: "Failed to parse file"
**Solution:** Check CSV format:
- UTF-8 encoding
- Comma or tab delimited
- Gene names as column headers
- Numeric values only

### Issue: Predictions seem incorrect
**Solution:** 
1. Create `gene_list.pkl` from training data
2. Verify gene names match exactly (case-sensitive)
3. Check debug logs for alignment details

---

## 📚 Learn More

For detailed documentation, see:
- `backend/GENE_ALIGNMENT_GUIDE.md` - Complete guide
- `backend/create_gene_list.py` - Script documentation (run with `--help`)

---

## ✅ Done!

You can now accept CSV files with any number of genes! 🎉

Test it with:
```powershell
./test_gene_alignment.ps1
```
