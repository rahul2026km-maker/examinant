npm run build
if ($LASTEXITCODE -eq 0) {
    git add .
    git commit -m "Fix build errors and Firebase auth"
    git push origin main
} else {
    Write-Host "Build failed, not pushing."
}
