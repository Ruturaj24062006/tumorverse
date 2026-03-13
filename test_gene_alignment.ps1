# Test script for gene feature alignment
# Tests the new CSV upload feature with varying numbers of genes

Write-Host "`n=== TumorVerse Gene Alignment Test ===" -ForegroundColor Cyan
Write-Host "Testing CSV upload with different gene counts`n" -ForegroundColor Gray

$backend_url = "http://127.0.0.1:8000"

# Check if backend is running
Write-Host "Checking backend status..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backend_url/health" -Method Get
    Write-Host "✓ Backend Status: $($health.status)" -ForegroundColor Green
    Write-Host "✓ Models Loaded: $($health.models_loaded)" -ForegroundColor Green
    
    if (-not $health.models_loaded) {
        Write-Host "`n⚠ WARNING: Models not loaded. Tests will fail." -ForegroundColor Red
        Write-Host "Please place model files in backend/model/ directory.`n" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Backend not responding at $backend_url" -ForegroundColor Red
    Write-Host "Please start the backend first:`n  cd backend`n  uvicorn main:app --reload`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n--- Test 1: Small CSV (10 genes) ---" -ForegroundColor Cyan
$test_file_1 = "backend/test_data/test_small_10genes.csv"
if (Test-Path $test_file_1) {
    try {
        Write-Host "Uploading: $test_file_1" -ForegroundColor Gray
        $form = @{
            file = Get-Item -Path $test_file_1
        }
        $response = Invoke-RestMethod -Uri "$backend_url/predict" -Method Post -Form $form
        Write-Host "✓ Prediction: $($response.predicted_cancer)" -ForegroundColor Green
        Write-Host "✓ Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Green
    } catch {
        Write-Host "✗ Test 1 Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Test file not found: $test_file_1" -ForegroundColor Yellow
}

Write-Host "`n--- Test 2: CSV with Sample ID (3 genes) ---" -ForegroundColor Cyan
$test_file_2 = "backend/test_data/test_with_sample_id.csv"
if (Test-Path $test_file_2) {
    try {
        Write-Host "Uploading: $test_file_2" -ForegroundColor Gray
        $form = @{
            file = Get-Item -Path $test_file_2
        }
        $response = Invoke-RestMethod -Uri "$backend_url/predict" -Method Post -Form $form
        Write-Host "✓ Prediction: $($response.predicted_cancer)" -ForegroundColor Green
        Write-Host "✓ Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Green
    } catch {
        Write-Host "✗ Test 2 Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Test file not found: $test_file_2" -ForegroundColor Yellow
}

Write-Host "`n--- Test 3: Medium CSV (100 genes) ---" -ForegroundColor Cyan
$test_file_3 = "backend/test_data/test_medium_100genes.csv"
if (Test-Path $test_file_3) {
    try {
        Write-Host "Uploading: $test_file_3" -ForegroundColor Gray
        $form = @{
            file = Get-Item -Path $test_file_3
        }
        $response = Invoke-RestMethod -Uri "$backend_url/predict" -Method Post -Form $form
        Write-Host "✓ Prediction: $($response.predicted_cancer)" -ForegroundColor Green
        Write-Host "✓ Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Green
    } catch {
        Write-Host "✗ Test 3 Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠ Test file not found: $test_file_3" -ForegroundColor Yellow
}

Write-Host "`n--- Test 4: Demo Mode (generates 20531 features) ---" -ForegroundColor Cyan
try {
    Write-Host "Requesting demo prediction..." -ForegroundColor Gray
    $form = @{
        demo = "true"
    }
    $response = Invoke-RestMethod -Uri "$backend_url/predict" -Method Post -Form $form
    Write-Host "✓ Prediction: $($response.predicted_cancer)" -ForegroundColor Green
    Write-Host "✓ Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Green
} catch {
    Write-Host "✗ Test 4 Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "All tests completed. Check backend logs for detailed processing info." -ForegroundColor Gray
Write-Host "`nExpected backend logs should show:" -ForegroundColor Yellow
Write-Host "  File upload mode: filename" -ForegroundColor Gray
Write-Host "  Aligning features..." -ForegroundColor Gray
Write-Host "  Aligned shape: (1, 20531)" -ForegroundColor Gray
Write-Host "  Prediction: cancer_type (confidence: XX%)" -ForegroundColor Gray
Write-Host "" 

# Check if gene_list.pkl exists
$gene_list_path = "backend/model/gene_list.pkl"
if (Test-Path $gene_list_path) {
    Write-Host "Gene list found - using precise gene name alignment" -ForegroundColor Green
} else {
    Write-Host "Gene list not found - using positional alignment" -ForegroundColor Yellow
    Write-Host "To create gene_list.pkl:" -ForegroundColor Gray
    Write-Host "  cd backend" -ForegroundColor Gray
    Write-Host "  python create_gene_list.py --placeholder" -ForegroundColor Gray
}
Write-Host ""
