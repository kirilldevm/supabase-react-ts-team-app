$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$statusRaw = npx supabase status -o json 2>&1 | Out-String
$brace = $statusRaw.IndexOf('{')
if ($brace -lt 0) {
  Write-Error "No JSON from `supabase status -o json`. Run `supabase start` first."
}
try {
  $status = $statusRaw.Substring($brace) | ConvertFrom-Json
} catch {
  Write-Error "Failed to parse status JSON: $_"
}
$anon = $status.ANON_KEY
if (-not $anon) {
  Write-Error "No ANON_KEY in `supabase status -o json`. Is the stack running?"
}

$uri = "http://127.0.0.1:54321/functions/v1/hello"
Write-Host "GET $uri"
try {
  $r = Invoke-RestMethod -Uri $uri -Headers @{
    Authorization = "Bearer $anon"
    apikey        = $anon
  } -Method Get -TimeoutSec 30
  $r | ConvertTo-Json
} catch {
  Write-Error $_
}
