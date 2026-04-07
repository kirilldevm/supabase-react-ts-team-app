$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$functions = @("hello", "hello-authed", "onboarding", "products")
if ($args.Count -gt 0) {
  $functions = $args
}

Write-Host "Repo root: $(Get-Location)"
foreach ($name in $functions) {
  Write-Host "`n=== Deploying $name (--use-api) ===" -ForegroundColor Cyan
  npx supabase functions deploy $name --use-api --no-verify-jwt
}
