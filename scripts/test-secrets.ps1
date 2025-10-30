Write-Host "Testing JWT Secret Configuration..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if root .env file exists
$envPath = ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ No .env file found in root directory" -ForegroundColor Red
    exit 1
}

# Read the .env file content
$envContent = Get-Content $envPath

# Extract secrets from .env file
$jwtSecretLine = $envContent | Where-Object { $_ -match "^JWT_SECRET=" }
$jwtRefreshSecretLine = $envContent | Where-Object { $_ -match "^JWT_REFRESH_SECRET=" }

$jwtSecret = if ($jwtSecretLine) { ($jwtSecretLine -split "=", 2)[1] } else { "" }
$jwtRefreshSecret = if ($jwtRefreshSecretLine) { ($jwtRefreshSecretLine -split "=", 2)[1] } else { "" }

Write-Host "JWT Secret: $jwtSecret"
Write-Host "JWT Refresh Secret: $jwtRefreshSecret"

# Check if secrets are properly configured (not using default values)
if ($jwtSecret -like "your-*" -or [string]::IsNullOrEmpty($jwtSecret)) {
    Write-Host "❌ WARNING: Using default JWT secret! This is insecure." -ForegroundColor Red
} else {
    Write-Host "✅ JWT secret is properly configured." -ForegroundColor Green
}

if ($jwtRefreshSecret -like "your-*" -or [string]::IsNullOrEmpty($jwtRefreshSecret)) {
    Write-Host "❌ WARNING: Using default refresh token secret! This is insecure." -ForegroundColor Red
} else {
    Write-Host "✅ Refresh token secret is properly configured." -ForegroundColor Green
}

Write-Host ""
Write-Host "Security Notes:" -ForegroundColor Yellow
Write-Host "- Secrets should be at least 32 characters long for cryptographic security"
Write-Host "- Current JWT secret length: $($jwtSecret.Length) characters"
Write-Host "- Current refresh token secret length: $($jwtRefreshSecret.Length) characters"

if ($jwtSecret.Length -ge 64 -and $jwtRefreshSecret.Length -ge 64) {
    Write-Host "✅ Both secrets meet the minimum security requirements (64+ characters)" -ForegroundColor Green
} else {
    Write-Host "❌ WARNING: Secrets should be at least 64 characters long for optimal security" -ForegroundColor Red
}