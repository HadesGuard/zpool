# Download Zama SDK script for Windows
Write-Host "🔄 Downloading Zama SDK..." -ForegroundColor Yellow

# Create sdk directory if it doesn't exist
if (!(Test-Path "public\sdk")) {
    New-Item -ItemType Directory -Path "public\sdk" -Force
}

# Try to download from CDN
Write-Host "📥 Trying to download from CDN..." -ForegroundColor Cyan

try {
    Invoke-WebRequest -Uri "https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs" -OutFile "public\sdk\relayer-sdk-js.umd.cjs"
    
    $fileSize = (Get-Item "public\sdk\relayer-sdk-js.umd.cjs").Length
    Write-Host "✅ Successfully downloaded SDK from CDN" -ForegroundColor Green
    Write-Host "📁 File saved to: public\sdk\relayer-sdk-js.umd.cjs" -ForegroundColor Green
    Write-Host "📊 File size: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to download from CDN" -ForegroundColor Red
    Write-Host "🔄 Trying alternative URL..." -ForegroundColor Yellow
    
    try {
        Invoke-WebRequest -Uri "https://cdn.zama.ai/relayer-sdk-js/latest/relayer-sdk-js.umd.cjs" -OutFile "public\sdk\relayer-sdk-js.umd.cjs"
        
        $fileSize = (Get-Item "public\sdk\relayer-sdk-js.umd.cjs").Length
        Write-Host "✅ Successfully downloaded SDK from alternative CDN" -ForegroundColor Green
        Write-Host "📁 File saved to: public\sdk\relayer-sdk-js.umd.cjs" -ForegroundColor Green
        Write-Host "📊 File size: $([math]::Round($fileSize/1MB, 2)) MB" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to download from all CDN sources" -ForegroundColor Red
        Write-Host "📋 Manual download instructions:" -ForegroundColor Yellow
        Write-Host "1. Visit: https://cdn.zama.ai/relayer-sdk-js/0.1.0-9/relayer-sdk-js.umd.cjs" -ForegroundColor White
        Write-Host "2. Save the file as: public\sdk\relayer-sdk-js.umd.cjs" -ForegroundColor White
        Write-Host "3. Or try: https://cdn.zama.ai/relayer-sdk-js/latest/relayer-sdk-js.umd.cjs" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Green
Write-Host "1. Run: npm start" -ForegroundColor White
Write-Host "2. Check console for SDK loading status" -ForegroundColor White
Write-Host "3. Use debug buttons in the app to test SDK" -ForegroundColor White 