# TumorVerse Image Upload Test Script
# Tests that tumor images can be uploaded to the FastAPI backend

Write-Host "Testing TumorVerse Image Upload..." -ForegroundColor Cyan

# Create a minimal test PNG image (1x1 pixel)
$bytes = [byte[]](0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A,0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52,0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01,0x08,0x06,0x00,0x00,0x00,0x1F,0x15,0xC4,0x89,0x00,0x00,0x00,0x0A,0x49,0x44,0x41,0x54,0x78,0x9C,0x63,0x00,0x01,0x00,0x00,0x05,0x00,0x01,0x0D,0x0A,0x2D,0xB4,0x00,0x00,0x00,0x00,0x49,0x45,0x4E,0x44,0xAE,0x42,0x60,0x82)
$testImagePath = "$env:TEMP\test_tumor_image.png"
[System.IO.File]::WriteAllBytes($testImagePath, $bytes)
Write-Host "✓ Created test image: $testImagePath" -ForegroundColor Green

# Test 1: Health check
Write-Host "`n[Test 1] Checking backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get
    Write-Host "✓ Backend is $($health.status)" -ForegroundColor Green
    Write-Host "  Models loaded: $($health.models_loaded)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Backend health check failed: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Upload image
Write-Host "`n[Test 2] Uploading tumor image..." -ForegroundColor Yellow
try {
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = @(
        "--$boundary",
        'Content-Disposition: form-data; name="image"; filename="test_tumor_image.png"',
        'Content-Type: image/png',
        '',
        [System.Text.Encoding]::GetEncoding('iso-8859-1').GetString($bytes),
        "--$boundary--"
    ) -join $LF
    
    $bodyBytes = [System.Text.Encoding]::GetEncoding('iso-8859-1').GetBytes($bodyLines)
    
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" `
        -Method Post `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyBytes
    
    Write-Host "✓ Image upload successful!" -ForegroundColor Green
    Write-Host "  Predicted Cancer: $($response.predicted_cancer)" -ForegroundColor Cyan
    Write-Host "  Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Image upload failed: $_" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "  Error: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# Test 3: Demo mode
Write-Host "`n[Test 3] Testing demo mode..." -ForegroundColor Yellow
try {
    $formData = @{
        demo = "true"
    }
    
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" `
        -Method Post `
        -Form $formData
    
    Write-Host "✓ Demo mode successful!" -ForegroundColor Green
    Write-Host "  Predicted Cancer: $($response.predicted_cancer)" -ForegroundColor Cyan
    Write-Host "  Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Demo mode failed: $_" -ForegroundColor Red
}

# Test 4: JSON mode
Write-Host "`n[Test 4] Testing JSON mode (connectivity check)..." -ForegroundColor Yellow
try {
    $jsonBody = @{
        gene_expression = @(0.5, 0.5, 0.5, 0.5, 0.5)
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/predict" `
        -Method Post `
        -ContentType "application/json" `
        -Body $jsonBody
    
    Write-Host "✓ JSON mode successful!" -ForegroundColor Green
    Write-Host "  Predicted Cancer: $($response.predicted_cancer)" -ForegroundColor Cyan
    Write-Host "  Confidence: $([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ JSON mode failed: $_" -ForegroundColor Red
}

Write-Host "`n✓ All tests completed!" -ForegroundColor Green
Write-Host "Your backend is ready to receive tumor images from the frontend." -ForegroundColor Cyan
